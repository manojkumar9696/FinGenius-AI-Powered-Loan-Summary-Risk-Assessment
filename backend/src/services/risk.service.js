/**
 * Programmatic Underwriting Rules & Risk Calculations Service
 * Standardizes financial calculations (DTI, LTI ratios) and evaluates credit parameters.
 */

/**
 * Calculates Debt-to-Income (DTI) ratio
 * @param {number} monthlyDebt - Monthly recurring debt obligations
 * @param {number} monthlyIncome - Gross monthly income
 * @returns {number} DTI percentage rounded to 2 decimal places
 */
exports.calculateDTI = (monthlyDebt, monthlyIncome) => {
  if (!monthlyIncome || monthlyIncome <= 0) return 0;
  const ratio = (monthlyDebt / monthlyIncome) * 100;
  return Math.round(ratio * 100) / 100;
};

/**
 * Calculates Loan-to-Income (LTI) ratio (annualized)
 * @param {number} loanAmount - Requested loan quantity
 * @param {number} monthlyIncome - Gross monthly income
 * @returns {number} LTI ratio rounded to 2 decimal places
 */
exports.calculateLTI = (loanAmount, monthlyIncome) => {
  if (!monthlyIncome || monthlyIncome <= 0) return 0;
  const annualIncome = monthlyIncome * 12;
  const ratio = loanAmount / annualIncome;
  return Math.round(ratio * 100) / 100;
};

/**
 * Deterministic Credit Evaluation Risk Assessment Engine
 * @param {Object} applicant - The raw applicant database record
 * @returns {Object} Deterministic risk calculation result
 */
exports.evaluateRisk = (applicant) => {
  const { credit_score, monthly_income, monthly_debt, employment_status, loan_amount } = applicant;

  // 1. Programmatic Ratios
  const dti = this.calculateDTI(monthly_debt, monthly_income);
  const lti = this.calculateLTI(loan_amount, monthly_income);

  // 2. Risk Score Calculations (0 to 100 scale, where 100 is maximum risk)
  let riskScore = 0;
  
  // CIBIL Credit Score Penalties
  if (credit_score < 600) {
    riskScore += 60; // Poor credit
  } else if (credit_score >= 600 && credit_score < 700) {
    riskScore += 35; // Fair credit
  } else if (credit_score >= 700 && credit_score < 750) {
    riskScore += 15; // Good credit
  } else {
    riskScore += 0;  // Excellent credit
  }

  // DTI Brackets Penalties
  if (dti > 50) {
    riskScore += 35;
  } else if (dti >= 38 && dti <= 50) {
    riskScore += 20;
  } else if (dti >= 30 && dti < 38) {
    riskScore += 10;
  } else {
    riskScore += 0;
  }

  // Employment Stability Penalties
  if (employment_status === 'unemployed') {
    riskScore += 35;
  } else if (employment_status === 'retired') {
    riskScore += 15;
  } else if (employment_status === 'self_employed') {
    riskScore += 10; // Entrepreneurial income instability penalty
  } else {
    riskScore += 0;  // Stable employed status
  }

  // LTI Leverage Penalties
  if (lti > 1.0) {
    riskScore += 20; // Highly leveraged borrowing
  } else if (lti >= 0.5 && lti <= 1.0) {
    riskScore += 10;
  } else {
    riskScore += 0;
  }

  // Clamp Risk Score strictly between 0 and 100
  riskScore = Math.min(Math.max(riskScore, 0), 100);

  // 3. Risk Level Classifications
  let riskLevel = 'low';
  if (riskScore > 30 && riskScore <= 60) {
    riskLevel = 'medium';
  } else if (riskScore > 60) {
    riskLevel = 'high';
  }

  // 4. Hard Banking Eligibility Criteria & Explanations Builder
  let eligibilityStatus = 'eligible';
  const explanationTriggers = [];

  // CIBIL Auto-Decline check
  if (credit_score < 600) {
    eligibilityStatus = 'ineligible';
    explanationTriggers.push(`Credit score (${credit_score}) falls below the CIBIL auto-decline limit of 600.`);
  }

  // DTI Auto-Decline check
  if (dti > 50) {
    eligibilityStatus = 'ineligible';
    explanationTriggers.push(`Debt-to-Income ratio (${dti}%) exceeds the absolute maximum threshold of 50%.`);
  }

  // Unemployed Auto-Decline check
  if (employment_status === 'unemployed') {
    eligibilityStatus = 'ineligible';
    explanationTriggers.push('Borrower is currently unemployed, creating critical repayment risk.');
  }

  // Construct explanation statement
  let eligibilityExplanation = '';
  if (eligibilityStatus === 'ineligible') {
    eligibilityExplanation = `Applicant is ineligible due to: ${explanationTriggers.join(' ')}`;
  } else {
    // Detail positive status markers
    const positiveMarkers = [];
    if (credit_score >= 750) {
      positiveMarkers.push(`Strong credit worthiness (CIBIL ${credit_score})`);
    } else {
      positiveMarkers.push(`Acceptable fair credit (CIBIL ${credit_score})`);
    }

    if (dti <= 36) {
      positiveMarkers.push(`a low Debt-to-Income footprint (${dti}%)`);
    } else {
      positiveMarkers.push(`a manageable Debt-to-Income ratio (${dti}%)`);
    }

    if (employment_status === 'employed') {
      positiveMarkers.push('and stable primary employment.');
    } else if (employment_status === 'self_employed') {
      positiveMarkers.push('and entrepreneurial business income.');
    } else {
      positiveMarkers.push('and retired pension income streams.');
    }

    eligibilityExplanation = `Applicant is eligible, demonstrating: ${positiveMarkers.join(', ')}`;
  }

  // 5. Underwriter Recommendations Mapping
  let approvalRecommendation = 'review';
  if (eligibilityStatus === 'ineligible') {
    approvalRecommendation = 'decline';
  } else if (eligibilityStatus === 'eligible' && riskLevel === 'low') {
    approvalRecommendation = 'approve';
  } else {
    // Eligible but possesses Medium or High risk scores (e.g. self-employed borrowers with fair credit score)
    approvalRecommendation = 'review';
  }

  return {
    debt_to_income_ratio: dti,
    loan_to_income_ratio: lti,
    risk_score: riskScore,
    risk_level: riskLevel,
    eligibility_status: eligibilityStatus,
    eligibility_explanation: eligibilityExplanation,
    approval_recommendation: approvalRecommendation
  };
};
