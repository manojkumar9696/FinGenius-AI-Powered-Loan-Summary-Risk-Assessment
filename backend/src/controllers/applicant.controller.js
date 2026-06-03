/**
 * Applicant Management Controller
 * Implements CRUD actions (Create, Read, Update, Delete) with portfolio boundaries and role-based clearance checks.
 */
const db = require('../config/db');
const pdfService = require('../services/pdf.service');
const AppError = require('../utils/AppError');
const auditService = require('../services/audit.service');

/**
 * POST /api/applicants
 * Creates a new loan applicant profile.
 */
exports.createApplicant = async (req, res, next) => {
  try {
    const {
      first_name, last_name, email, phone, ssn, date_of_birth,
      monthly_income, monthly_debt, credit_score, employment_status,
      loan_amount, loan_purpose, loan_term_months
    } = req.body;

    // Attach active Loan Officer ID (req.user is populated by protect middleware)
    const created_by = req.user.id;

    // Insert applicant into database
    const [result] = await db.query(
      `INSERT INTO applicants (
        first_name, last_name, email, phone, ssn, date_of_birth,
        monthly_income, monthly_debt, credit_score, employment_status,
        loan_amount, loan_purpose, loan_term_months, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        first_name, last_name, email, phone, ssn, date_of_birth,
        monthly_income, monthly_debt, credit_score, employment_status,
        loan_amount, loan_purpose, loan_term_months, created_by
      ]
    );

    // Retrieve the created record
    const [applicants] = await db.query('SELECT * FROM applicants WHERE id = ?', [result.insertId]);
    const applicant = applicants[0];

    // Log applicant creation audit log
    await auditService.logAction({
      userId: req.user.id,
      action: 'CREATE_APPLICANT',
      targetId: applicant.id,
      details: {
        message: `Created applicant profile #${applicant.id} (${applicant.first_name} ${applicant.last_name})`,
        name: `${applicant.first_name} ${applicant.last_name}`,
        income: applicant.monthly_income,
        loanAmount: applicant.loan_amount
      },
      ipAddress: req.ip
    });

    return res.status(201).json({
      status: 'success',
      data: {
        applicant
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/applicants
 * Retrieves applicant profiles.
 * - Administrators can view all applicants in the database (Global audit clearance).
 * - Loan Officers can only view applicants they created (Portfolio security insulation).
 */
exports.getAllApplicants = async (req, res, next) => {
  try {
    let query = 'SELECT * FROM applicants';
    let queryParams = [];

    // Enforce record insulation for non-admin accounts
    if (req.user.role !== 'admin') {
      query += ' WHERE created_by = ?';
      queryParams.push(req.user.id);
    }

    query += ' ORDER BY created_at DESC';

    const [applicants] = await db.query(query, queryParams);

    // Log read all action
    await auditService.logAction({
      userId: req.user.id,
      action: 'READ_ALL_APPLICANTS',
      targetId: null,
      details: {
        message: `Retrieved all applicants in portfolio scope (count: ${applicants.length})`,
        count: applicants.length,
        role: req.user.role
      },
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      results: applicants.length,
      data: {
        applicants
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/applicants/:id
 * Retrieves a single applicant's profile details.
 * Enforces ownership access validations.
 */
exports.getApplicantById = async (req, res, next) => {
  try {
    const applicantId = req.params.id;

    const [applicants] = await db.query('SELECT * FROM applicants WHERE id = ?', [applicantId]);

    if (applicants.length === 0) {
      return next(new AppError('No applicant found with that ID.', 404));
    }

    const applicant = applicants[0];

    // Ownership Check: Block officers from opening profiles created by other officers
    if (req.user.role !== 'admin' && applicant.created_by !== req.user.id) {
      await auditService.logAction({
        userId: req.user.id,
        action: 'READ_APPLICANT_BLOCKED',
        targetId: applicantId,
        details: {
          message: `Attempted unauthorized read of applicant profile #${applicantId}`
        },
        ipAddress: req.ip
      });
      return next(new AppError('You do not have permission to view this applicant profile.', 403));
    }

    // Log successful read action
    await auditService.logAction({
      userId: req.user.id,
      action: 'READ_APPLICANT',
      targetId: applicant.id,
      details: {
        message: `Viewed applicant profile #${applicant.id} (${applicant.first_name} ${applicant.last_name})`
      },
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      data: {
        applicant
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/applicants/:id
 * Modifies an existing applicant's parameters.
 * Validates ownership boundaries before applying modifications.
 */
exports.updateApplicant = async (req, res, next) => {
  try {
    const applicantId = req.params.id;
    const {
      first_name, last_name, email, phone, ssn, date_of_birth,
      monthly_income, monthly_debt, credit_score, employment_status,
      loan_amount, loan_purpose, loan_term_months, status
    } = req.body;

    // 1. Check if applicant exists
    const [applicants] = await db.query('SELECT * FROM applicants WHERE id = ?', [applicantId]);

    if (applicants.length === 0) {
      return next(new AppError('No applicant found with that ID.', 404));
    }

    const applicant = applicants[0];

    // 2. Status Lock: Block updates if applicant status is already finalized (Approved or Rejected)
    if (applicant.status !== 'pending') {
      return next(new AppError('Cannot modify an applicant profile that has already been finalized (Approved/Rejected).', 400));
    }

    // 3. Ownership Check: Verify that the editing officer owns the record
    if (req.user.role !== 'admin' && applicant.created_by !== req.user.id) {
      return next(new AppError('You do not have permission to modify this applicant profile.', 403));
    }

    // 3. Prevent standard loan officers from manually overriding application status (e.g. bypassing AI/risk checks!)
    let updatedStatus = applicant.status;
    if (status && status !== applicant.status) {
      if (req.user.role !== 'admin') {
        return next(new AppError('Standard loan officers cannot manually modify application status approvals.', 403));
      }
      updatedStatus = status;
    }

    // 4. Execute the update query
    await db.query(
      `UPDATE applicants SET 
        first_name = ?, last_name = ?, email = ?, phone = ?, ssn = ?, date_of_birth = ?,
        monthly_income = ?, monthly_debt = ?, credit_score = ?, employment_status = ?,
        loan_amount = ?, loan_purpose = ?, loan_term_months = ?, status = ?
      WHERE id = ?`,
      [
        first_name || applicant.first_name,
        last_name || applicant.last_name,
        email || applicant.email,
        phone !== undefined ? phone : applicant.phone,
        ssn || applicant.ssn,
        date_of_birth || applicant.date_of_birth,
        monthly_income !== undefined ? monthly_income : applicant.monthly_income,
        monthly_debt !== undefined ? monthly_debt : applicant.monthly_debt,
        credit_score !== undefined ? credit_score : applicant.credit_score,
        employment_status || applicant.employment_status,
        loan_amount !== undefined ? loan_amount : applicant.loan_amount,
        loan_purpose || applicant.loan_purpose,
        loan_term_months !== undefined ? loan_term_months : applicant.loan_term_months,
        updatedStatus,
        applicantId
      ]
    );

    // 5. Read back modified record
    const [updatedApplicants] = await db.query('SELECT * FROM applicants WHERE id = ?', [applicantId]);
    const updatedApplicant = updatedApplicants[0];

    // Log update audit log
    await auditService.logAction({
      userId: req.user.id,
      action: 'UPDATE_APPLICANT',
      targetId: updatedApplicant.id,
      details: {
        message: `Updated applicant profile #${updatedApplicant.id} (${updatedApplicant.first_name} ${updatedApplicant.last_name})`,
        modifiedFields: Object.keys(req.body).filter(key => req.body[key] !== applicant[key])
      },
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      data: {
        applicant: updatedApplicant
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/applicants/:id
 * Deletes an applicant record.
 * Restricted strictly to Admins (enforced both at controller level and route mapping level).
 */
exports.deleteApplicant = async (req, res, next) => {
  try {
    const applicantId = req.params.id;

    // 1. Check user presence
    const [applicants] = await db.query('SELECT * FROM applicants WHERE id = ?', [applicantId]);
    if (applicants.length === 0) {
      return next(new AppError('No applicant found with that ID.', 404));
    }

    const applicant = applicants[0];

    // 2. Double-check Admin status (RBAC enforcement safeguard)
    if (req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to delete applicant records.', 403));
    }

    // 3. Delete from database
    await db.query('DELETE FROM applicants WHERE id = ?', [applicantId]);

    // Log delete audit log
    await auditService.logAction({
      userId: req.user.id,
      action: 'DELETE_APPLICANT',
      targetId: applicantId,
      details: {
        message: `Permanently deleted applicant profile #${applicantId} (${applicant.first_name} ${applicant.last_name})`,
        name: `${applicant.first_name} ${applicant.last_name}`,
        email: applicant.email
      },
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: 'Applicant record successfully deleted.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/applicants/:id/report
 * Compiles and streams a professional credit underwriting PDF document directly to the client.
 */
exports.downloadReport = async (req, res, next) => {
  try {
    const applicantId = req.params.id;

    // 1. Fetch parent applicant profile from database
    const [applicants] = await db.query('SELECT * FROM applicants WHERE id = ?', [applicantId]);
    if (applicants.length === 0) {
      return next(new AppError('No applicant profile found with that ID.', 404));
    }

    const applicant = applicants[0];

    // 2. Ownership Access check
    if (req.user.role !== 'admin' && applicant.created_by !== req.user.id) {
      await auditService.logAction({
        userId: req.user.id,
        action: 'DOWNLOAD_REPORT_BLOCKED',
        targetId: applicantId,
        details: {
          message: `Attempted unauthorized report download for applicant profile #${applicantId}`
        },
        ipAddress: req.ip
      });
      return next(new AppError('You do not have permission to download this underwriting report.', 403));
    }

    // 3. Concurrently fetch both risk assessments and fraud checks data
    const [
      [assessments],
      [fraudChecks]
    ] = await Promise.all([
      db.query('SELECT * FROM risk_assessments WHERE applicant_id = ?', [applicantId]),
      db.query('SELECT * FROM fraud_checks WHERE applicant_id = ?', [applicantId])
    ]);

    // Safety check: Block downloading if underwriting decisions were never executed yet!
    if (assessments.length === 0 || fraudChecks.length === 0) {
      return next(
        new AppError('This applicant profile has not been underwriting assessed yet. Run assessment first.', 400)
      );
    }

    // 4. Configure HTTP stream attachment headers
    const filename = `Underwriting_Report_${applicant.first_name}_${applicant.last_name}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Log PDF download audit trail
    await auditService.logAction({
      userId: req.user.id,
      action: 'DOWNLOAD_REPORT',
      targetId: applicant.id,
      details: {
        message: `Downloaded PDF Underwriting Report for applicant #${applicant.id} (${applicant.first_name} ${applicant.last_name})`
      },
      ipAddress: req.ip
    });

    // 5. Draw and stream the PDF document directly into the response channel
    pdfService.generateUnderwritingPDF(res, applicant, assessments[0], fraudChecks[0]);

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/applicants/export
 * Queries applicants in scope and streams a formatted CSV document.
 */
exports.exportApplicants = async (req, res, next) => {
  try {
    let query = 'SELECT * FROM applicants';
    let queryParams = [];

    // Enforce record insulation for non-admin accounts
    if (req.user.role !== 'admin') {
      query += ' WHERE created_by = ?';
      queryParams.push(req.user.id);
    }

    query += ' ORDER BY created_at DESC';

    const [applicants] = await db.query(query, queryParams);

    // Set CSV download headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="applicants_portfolio_export.csv"');

    // Create CSV headers
    let csvContent = 'ID,First Name,Last Name,Email,Phone,PAN/Aadhaar ID,Date of Birth,Monthly Income (INR),Monthly Debt (INR),CIBIL Score,Employment Status,Loan Amount (INR),Loan Purpose,Term (Months),Status,Created At\n';

    // Populate CSV rows
    for (const app of applicants) {
      const dob = new Date(app.date_of_birth).toISOString().split('T')[0];
      const createdAt = new Date(app.created_at).toISOString().split('T')[0];
      
      // Clean string values of commas or double quotes to prevent breaking CSV formatting
      const cleanPurpose = (app.loan_purpose || '').replace(/"/g, '""');
      
      csvContent += `${app.id},"${app.first_name}","${app.last_name}","${app.email}","${app.phone || ''}","${app.ssn}","${dob}",${app.monthly_income},${app.monthly_debt},${app.credit_score},"${app.employment_status}",${app.loan_amount},"${cleanPurpose}",${app.loan_term_months},"${app.status}","${createdAt}"\n`;
    }

    // Log CSV export audit log
    await auditService.logAction({
      userId: req.user.id,
      action: 'EXPORT_CSV',
      targetId: null,
      details: {
        message: `Exported applicants portfolio as CSV (records count: ${applicants.length})`
      },
      ipAddress: req.ip
    });

    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

