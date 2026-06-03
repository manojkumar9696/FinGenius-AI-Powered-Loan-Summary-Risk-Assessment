-- AI-Powered Loan Application Summary & Risk Assessment System Database Seed Data
-- Standard SQL format compatible with MySQL 8.x+

USE `loan_assessment_db`;

-- Safe cleanup (maintaining cascade order)
-- Dropping in correct foreign key order: child tables first, then parent tables
DELETE FROM `audit_logs`;
DELETE FROM `fraud_checks`;
DELETE FROM `risk_assessments`;
DELETE FROM `applicant_notes`;
DELETE FROM `applicants`;
DELETE FROM `users`;

-- 1. Seed Users (Password for all: Password123)
-- Insert Initial Admin Account (ID: 1)
INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`) 
VALUES (1, 'Admin User', 'admin@bank.com', '$2b$10$Y5ad5Xg8fkHqKIyn.bqtXOvgqzNOkS.iHxQSqtC8FSzNjXcY3E7ea', 'admin');

-- Insert Initial Loan Officer Account (ID: 2)
INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`) 
VALUES (2, 'Officer Doe', 'officer@bank.com', '$2b$10$Y5ad5Xg8fkHqKIyn.bqtXOvgqzNOkS.iHxQSqtC8FSzNjXcY3E7ea', 'loan_officer');


-- 2. Seed Applicants (Linked to Officer Doe, ID: 2)
-- Applicant A: Prime Credit Profile (Excellent CIBIL credit, low DTI ratio)
INSERT INTO `applicants` (
  `id`, `first_name`, `last_name`, `email`, `phone`, `ssn`, `date_of_birth`,
  `monthly_income`, `monthly_debt`, `credit_score`, `employment_status`,
  `loan_amount`, `loan_purpose`, `loan_term_months`, `status`, `created_by`
) VALUES (
  1, 'John', 'Smith', 'john.smith@gmail.com', '9876543210', 'ABCDE1234F', '1985-05-15',
  85000.00, 12000.00, 750, 'employed',
  350000.00, 'Home Improvement', 36, 'pending', 2
);

-- Applicant B: Subprime Credit Profile (Poor credit, high DTI ratio)
INSERT INTO `applicants` (
  `id`, `first_name`, `last_name`, `email`, `phone`, `ssn`, `date_of_birth`,
  `monthly_income`, `monthly_debt`, `credit_score`, `employment_status`,
  `loan_amount`, `loan_purpose`, `loan_term_months`, `status`, `created_by`
) VALUES (
  2, 'Alice', 'Johnson', 'alice.j@yahoo.com', '9123456789', 'XYZWP9876Q', '1990-11-22',
  32000.00, 18000.00, 580, 'self_employed',
  150000.00, 'Debt Consolidation', 60, 'pending', 2
);


-- 3. Seed Risk Assessments (Linked to Applicants 1 and 2, including Mock AI narratives)
-- Assessment A: Seed Risk Assessment for John Smith (ID: 1)
INSERT INTO `risk_assessments` (
  `id`, `applicant_id`, `debt_to_income_ratio`, `loan_to_income_ratio`,
  `risk_score`, `risk_level`, `eligibility_status`, `eligibility_explanation`, `approval_recommendation`,
  `ai_summary`, `ai_eligibility_explanation`, `ai_risk_analysis`, `ai_recommendation`
) VALUES (
  1, 1, 14.12, 0.34,
  0, 'low', 'eligible',
  'Applicant is eligible, demonstrating: Strong credit worthiness (CIBIL 750), a low Debt-to-Income footprint (14.12%), and stable primary employment.',
  'approve',
  'John Smith is an exceptionally strong prime credit borrower. Possessing stable employment, a gross income of ₹85,000/month, and excellent credit (CIBIL 750), he represents highly stable borrowing power.',
  'Highly eligible. His very low Debt-to-Income (DTI) ratio of 14.12% is well within standard safety lines. CIBIL credit history of 750 proves highly diligent and reliable repayment history.',
  'Risk vectors are minimal. LTI ratio of 0.34 indicates highly moderate leverage, and monthly cash flow buffers are significant. Regular salary employment adds high income predictability.',
  'Strongly recommend immediate automatic approval. This profile represents institutional-grade risk profile.'
);

-- Assessment B: Seed Risk Assessment for Alice Johnson (ID: 2)
INSERT INTO `risk_assessments` (
  `id`, `applicant_id`, `debt_to_income_ratio`, `loan_to_income_ratio`,
  `risk_score`, `risk_level`, `eligibility_status`, `eligibility_explanation`, `approval_recommendation`,
  `ai_summary`, `ai_eligibility_explanation`, `ai_risk_analysis`, `ai_recommendation`
) VALUES (
  2, 2, 56.25, 0.39,
  80, 'high', 'ineligible',
  'Applicant is ineligible due to: Debt-to-Income ratio (56.25%) exceeds the absolute maximum threshold of 50%.',
  'decline',
  'Alice Johnson represents a subprime borrower. She is self-employed, has fair credit history (CIBIL 580), and exhibits high existing monthly debt leverage (₹18,000/month).',
  'Currently ineligible. Her DTI ratio of 56.25% exceeds the hard limit of 50%, meaning more than half of her gross income is consumed by debt payments before living costs.',
  'High risk profile. Self-employment adds cashflow volatility. CIBIL (580) indicates past delinquent trends, and high DTI leaves zero emergency financial cushion.',
  'Strongly recommend declining this application due to high debt-to-income and fair CIBIL score. Borrower does not meet programmatic safety standards.'
);


-- 4. Seed Fraud Checks (Linked to Applicants 1 and 2 - Phase 6)
-- Fraud Check A: John Smith (Verified - No Flags)
INSERT INTO `fraud_checks` (
  `id`, `applicant_id`, `is_duplicate`, `is_suspicious_income`, `is_missing_info`, `fraud_score`, `status`
) VALUES (
  1, 1, 0, 0, 0, 0, 'pass'
);

-- Fraud Check B: Alice Johnson (Verified - No Flags)
INSERT INTO `fraud_checks` (
  `id`, `applicant_id`, `is_duplicate`, `is_suspicious_income`, `is_missing_info`, `fraud_score`, `status`
) VALUES (
  2, 2, 0, 0, 0, 0, 'pass'
);

-- 5. Seed Audit Logs (Phase 9 Compliance Records History)
INSERT INTO `audit_logs` (
  `id`, `user_id`, `action`, `target_id`, `details`, `ip_address`
) VALUES (
  1, 1, 'LOGIN_SUCCESS', '1', 'Admin user logged in successfully from secure terminal', '127.0.0.1'
);

INSERT INTO `audit_logs` (
  `id`, `user_id`, `action`, `target_id`, `details`, `ip_address`
) VALUES (
  2, 2, 'LOGIN_SUCCESS', '2', 'Officer Doe logged in successfully from local network portal', '127.0.0.1'
);

INSERT INTO `audit_logs` (
  `id`, `user_id`, `action`, `target_id`, `details`, `ip_address`
) VALUES (
  3, 2, 'CREATE_APPLICANT', '1', 'Created applicant John Smith (PAN: ABCDE1234F, Income: ₹85,000.00)', '127.0.0.1'
);

INSERT INTO `audit_logs` (
  `id`, `user_id`, `action`, `target_id`, `details`, `ip_address`
) VALUES (
  4, 2, 'CREATE_APPLICANT', '2', 'Created applicant Alice Johnson (PAN: XYZWP9876Q, Income: ₹32,000.00)', '127.0.0.1'
);

INSERT INTO `audit_logs` (
  `id`, `user_id`, `action`, `target_id`, `details`, `ip_address`
) VALUES (
  5, 2, 'ASSESS_APPLICANT', '1', 'Successfully executed programmatic risk engine: Risk Score 0, Risk Level low, Recommendation approve', '127.0.0.1'
);

