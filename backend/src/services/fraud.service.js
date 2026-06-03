/**
 * Automated Fraud Diagnostics Service
 * Runs historical database queries to check for identity duplication and evaluates profile integrity markers.
 */
const db = require('../config/db');

/**
 * Check Duplicate SSN: Query MySQL for matching SSNs submitted in the last 30 days
 * @param {number} applicantId - Active applicant ID (to exclude from matching query)
 * @param {string} ssn - Borrower Social Security Number or National ID
 * @returns {boolean} True if a duplicate matches, otherwise false
 */
exports.checkDuplicateSSN = async (applicantId, ssn) => {
  if (!ssn) return false;

  // Query database to search for other applications with matching SSNs submitted within the last 30 days
  const [matches] = await db.query(
    `SELECT id FROM applicants 
     WHERE ssn = ? AND id != ? AND created_at >= NOW() - INTERVAL 30 DAY`,
    [ssn, applicantId]
  );

  return matches.length > 0;
};

/**
 * Executes full Profile Fraud Analysis
 * @param {Object} applicant - The raw applicant record from database
 * @returns {Object} Compiled fraud indices and status results
 */
exports.checkFraudProfile = async (applicant) => {
  const applicantId = applicant.id;
  const ssn = applicant.ssn;
  const creditScore = applicant.credit_score;
  const income = applicant.monthly_income;
  const phone = applicant.phone;
  const email = applicant.email;

  // 1. Run Duplicate check query
  const isDuplicate = await this.checkDuplicateSSN(applicantId, ssn);

  // 2. Suspicious Income Check
  // Flags profiles claiming high monthly income (>= $15,000) coupled with subprime credit score bands (under FICO 600)
  const isSuspiciousIncome = (income >= 15000 && creditScore < 600);

  // 3. Missing Vital Info Check
  // Flags profiles missing phone contacts or essential email formats
  const isMissingInfo = (!phone || phone.trim() === '' || !email || email.trim() === '');

  // 4. Weighted Fraud Score Computation
  let fraudScore = 0;

  if (isDuplicate) {
    fraudScore += 50; // Duplicate SSN is a high-velocity fraud indicator
  }
  if (isSuspiciousIncome) {
    fraudScore += 40; // Severe indicator of synthetic identity or income inflation
  }
  if (isMissingInfo) {
    fraudScore += 15; // Minor KYC compliance alarm
  }

  // Cap score strictly at 100
  fraudScore = Math.min(fraudScore, 100);

  // 5. Fraud Alert Classification
  let fraudStatus = 'pass';
  if (fraudScore >= 50) {
    fraudStatus = 'flagged'; // CRITICAL: Freeze underwriting decisions
  } else if (fraudScore > 0 && fraudScore < 50) {
    fraudStatus = 'review';  // WARNING: Flags require manual verification
  }

  return {
    is_duplicate: isDuplicate ? 1 : 0,
    is_suspicious_income: isSuspiciousIncome ? 1 : 0,
    is_missing_info: isMissingInfo ? 1 : 0,
    fraud_score: fraudScore,
    status: fraudStatus
  };
};
