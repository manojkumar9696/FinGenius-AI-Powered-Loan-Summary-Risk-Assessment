/**
 * Risk Assessment Controller
 * Coordinates programmatic decision runs, updating and committing assessments data to MySQL.
 */
const db = require('../config/db');
const riskService = require('../services/risk.service');
const aiService = require('../services/ai.service');
const fraudService = require('../services/fraud.service');
const AppError = require('../utils/AppError');
const auditService = require('../services/audit.service');

/**
 * POST /api/assessments/:applicantId
 * Computes deterministic risk values and writes/updates underwriting files.
 */
exports.assessApplicant = async (req, res, next) => {
  try {
    const { applicantId } = req.params;

    // 1. Fetch primary applicant record from database
    const [applicants] = await db.query('SELECT * FROM applicants WHERE id = ?', [applicantId]);
    if (applicants.length === 0) {
      return next(new AppError('No applicant profile found with that ID.', 404));
    }

    const applicant = applicants[0];

    // 2. Ownership Access validation
    if (req.user.role !== 'admin' && applicant.created_by !== req.user.id) {
      return next(new AppError('You do not have permission to assess this applicant profile.', 403));
    }

    // 3. Programmatic Risk Calculation
    const riskResults = riskService.evaluateRisk(applicant);

    // 4. Asynchronous Generative AI Underwriting Analysis (Structured JSON)
    const aiResults = await aiService.generateUnderwritingReport(applicant, riskResults);

    // 5. Automated Fraud Profile Diagnostic Checks (Relational SQL checks)
    const fraudResults = await fraudService.checkFraudProfile(applicant);

    // 6. Database Persistence (Transactional Upsert)
    // Check if an assessment already exists for this applicant
    const [existingAssessments] = await db.query(
      'SELECT id FROM risk_assessments WHERE applicant_id = ?',
      [applicantId]
    );

    if (existingAssessments.length > 0) {
      // Update existing record
      await db.query(
        `UPDATE risk_assessments SET 
          debt_to_income_ratio = ?, loan_to_income_ratio = ?,
          risk_score = ?, risk_level = ?,
          eligibility_status = ?, eligibility_explanation = ?,
          approval_recommendation = ?,
          ai_summary = ?, ai_eligibility_explanation = ?,
          ai_risk_analysis = ?, ai_recommendation = ?
        WHERE applicant_id = ?`,
        [
          riskResults.debt_to_income_ratio,
          riskResults.loan_to_income_ratio,
          riskResults.risk_score,
          riskResults.risk_level,
          riskResults.eligibility_status,
          riskResults.eligibility_explanation,
          riskResults.approval_recommendation,
          aiResults.summary,
          aiResults.eligibilityExplanation,
          aiResults.riskAnalysis,
          aiResults.recommendation,
          applicantId
        ]
      );
    } else {
      // Insert new record
      await db.query(
        `INSERT INTO risk_assessments (
          applicant_id, debt_to_income_ratio, loan_to_income_ratio,
          risk_score, risk_level,
          eligibility_status, eligibility_explanation,
          approval_recommendation,
          ai_summary, ai_eligibility_explanation,
          ai_risk_analysis, ai_recommendation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          applicantId,
          riskResults.debt_to_income_ratio,
          riskResults.loan_to_income_ratio,
          riskResults.risk_score,
          riskResults.risk_level,
          riskResults.eligibility_status,
          riskResults.eligibility_explanation,
          riskResults.approval_recommendation,
          aiResults.summary,
          aiResults.eligibilityExplanation,
          aiResults.riskAnalysis,
          aiResults.recommendation
        ]
      );
    }

    // Check if a fraud check record already exists for this applicant
    const [existingFraudChecks] = await db.query(
      'SELECT id FROM fraud_checks WHERE applicant_id = ?',
      [applicantId]
    );

    if (existingFraudChecks.length > 0) {
      // Update existing record
      await db.query(
        `UPDATE fraud_checks SET 
          is_duplicate = ?, is_suspicious_income = ?,
          is_missing_info = ?, fraud_score = ?,
          status = ?
        WHERE applicant_id = ?`,
        [
          fraudResults.is_duplicate,
          fraudResults.is_suspicious_income,
          fraudResults.is_missing_info,
          fraudResults.fraud_score,
          fraudResults.status,
          applicantId
        ]
      );
    } else {
      // Insert new record
      await db.query(
        `INSERT INTO fraud_checks (
          applicant_id, is_duplicate, is_suspicious_income,
          is_missing_info, fraud_score, status
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          applicantId,
          fraudResults.is_duplicate,
          fraudResults.is_suspicious_income,
          fraudResults.is_missing_info,
          fraudResults.fraud_score,
          fraudResults.status
        ]
      );
    }

    // 7. Update parent application status in 'applicants' table based on recommendations and fraud flags
    let parentStatus = 'pending';
    
    // Critical Safeguard: If borrower triggers a critical fraud flag, auto-reject immediately, overriding programmatic approvals!
    if (fraudResults.status === 'flagged') {
      parentStatus = 'rejected';
    } else if (riskResults.approval_recommendation === 'approve') {
      parentStatus = 'approved';
    } else if (riskResults.approval_recommendation === 'decline') {
      parentStatus = 'rejected';
    } else {
      parentStatus = 'pending'; // Stays pending under manual review
    }

    await db.query('UPDATE applicants SET status = ? WHERE id = ?', [parentStatus, applicantId]);

    // Log the risk assessment audit log
    await auditService.logAction({
      userId: req.user.id,
      action: 'ASSESS_APPLICANT',
      targetId: applicantId,
      details: {
        message: `Successfully executed underwriting assessment for applicant #${applicantId}. Ratios DTI: ${riskResults.debt_to_income_ratio}%, LTI: ${riskResults.loan_to_income_ratio}. Risk Tier: ${riskResults.risk_level.toUpperCase()} (Score: ${riskResults.risk_score}). Fraud Category: ${fraudResults.status.toUpperCase()}. Parent Status set to '${parentStatus}'.`,
        dti: riskResults.debt_to_income_ratio,
        lti: riskResults.loan_to_income_ratio,
        riskScore: riskResults.risk_score,
        riskLevel: riskResults.risk_level,
        fraudScore: fraudResults.fraud_score,
        fraudStatus: fraudResults.status,
        parentStatus: parentStatus
      },
      ipAddress: req.ip
    });

    // Fetch the updated assessment and fraud records to return to client
    const [assessments] = await db.query(
      'SELECT * FROM risk_assessments WHERE applicant_id = ?',
      [applicantId]
    );

    const [fraudChecks] = await db.query(
      'SELECT * FROM fraud_checks WHERE applicant_id = ?',
      [applicantId]
    );

    return res.status(200).json({
      status: 'success',
      data: {
        assessment: assessments[0],
        fraudCheck: fraudChecks[0],
        applicantStatus: parentStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/assessments/:applicantId
 * Retrieves saved underwriting data for a borrower profile.
 */
exports.getAssessment = async (req, res, next) => {
  try {
    const { applicantId } = req.params;

    // 1. Fetch parent applicant profile to verify active ownership credentials
    const [applicants] = await db.query('SELECT created_by FROM applicants WHERE id = ?', [applicantId]);
    if (applicants.length === 0) {
      return next(new AppError('No applicant profile found with that ID.', 404));
    }

    // 2. Ownership Access check
    if (req.user.role !== 'admin' && applicants[0].created_by !== req.user.id) {
      await auditService.logAction({
        userId: req.user.id,
        action: 'READ_ASSESSMENT_BLOCKED',
        targetId: applicantId,
        details: {
          message: `Attempted unauthorized read of risk assessment for applicant profile #${applicantId}`
        },
        ipAddress: req.ip
      });
      return next(new AppError('You do not have permission to view this assessment profile.', 403));
    }

    // 3. Fetch from risk assessments table
    const [assessments] = await db.query(
      'SELECT * FROM risk_assessments WHERE applicant_id = ?',
      [applicantId]
    );

    if (assessments.length === 0) {
      return next(new AppError('No risk assessment found for this applicant. Run assessment first.', 404));
    }

    // Fetch from fraud checks table
    const [fraudChecks] = await db.query(
      'SELECT * FROM fraud_checks WHERE applicant_id = ?',
      [applicantId]
    );

    // Log successful assessment read
    await auditService.logAction({
      userId: req.user.id,
      action: 'READ_ASSESSMENT',
      targetId: applicantId,
      details: {
        message: `Viewed saved underwriting risk assessment details for applicant #${applicantId}`
      },
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      data: {
        assessment: assessments[0],
        fraudCheck: fraudChecks.length > 0 ? fraudChecks[0] : null
      }
    });
  } catch (error) {
    next(error);
  }
};
