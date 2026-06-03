-- AI-Powered Loan Application Summary & Risk Assessment System Database Schema
-- Standard SQL format compatible with MySQL 8.x+

CREATE DATABASE IF NOT EXISTS `loan_assessment_db`;
USE `loan_assessment_db`;

-- Drop tables in reverse order of foreign keys to avoid relational integrity blocking
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `fraud_checks`;
DROP TABLE IF EXISTS `risk_assessments`;
DROP TABLE IF EXISTS `applicant_notes`;
DROP TABLE IF EXISTS `applicants`;
DROP TABLE IF EXISTS `users`;

-- 1. Users Table (Authentication & Identity)
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'loan_officer') NOT NULL DEFAULT 'loan_officer',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Applicants Table (Credit Portfolio Profile)
CREATE TABLE `applicants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `first_name` VARCHAR(50) NOT NULL,
  `last_name` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `ssn` VARCHAR(11) NOT NULL, -- Format: XXX-XX-XXXX or alphanumeric National ID
  `date_of_birth` DATE NOT NULL,
  `monthly_income` DECIMAL(12, 2) NOT NULL,
  `monthly_debt` DECIMAL(12, 2) NOT NULL,
  `credit_score` INT NOT NULL, -- Valid FICO credit tier ranges: 300 to 850
  `employment_status` ENUM('employed', 'self_employed', 'unemployed', 'retired') NOT NULL,
  `loan_amount` DECIMAL(12, 2) NOT NULL,
  `loan_purpose` VARCHAR(100) NOT NULL,
  `loan_term_months` INT NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `created_by` INT DEFAULT NULL, -- Relates to 'users' table (Loan Officer)
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Banking Compliance: Keep historical applicant records active even if the managing Loan Officer is deleted
  CONSTRAINT `fk_applicants_created_by` FOREIGN KEY (`created_by`) 
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Risk Assessments Table (Relational Decision Layer)
CREATE TABLE `risk_assessments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `applicant_id` INT UNIQUE NOT NULL, -- Unique constraint enforces 1-to-1 relationship with applicants
  `debt_to_income_ratio` DECIMAL(5, 2) NOT NULL,
  `loan_to_income_ratio` DECIMAL(5, 2) NOT NULL,
  `risk_score` INT NOT NULL, -- Standardized risk score: 0 to 100
  `risk_level` ENUM('low', 'medium', 'high') NOT NULL,
  `eligibility_status` ENUM('eligible', 'ineligible') NOT NULL,
  `eligibility_explanation` TEXT DEFAULT NULL, -- Programmatic deterministic rule triggers explanation
  `approval_recommendation` ENUM('approve', 'review', 'decline') NOT NULL,
  
  -- Generative AI Underwriting Analytics (Phase 5)
  `ai_summary` TEXT DEFAULT NULL,                  -- Narrative profile overview
  `ai_eligibility_explanation` TEXT DEFAULT NULL,  -- Explanations of risk mitigations and buffers
  `ai_risk_analysis` TEXT DEFAULT NULL,            -- Granular risk vector breakdowns
  `ai_recommendation` TEXT DEFAULT NULL,           -- Direct advice for manual underwriters
  
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Relational Cascade: Delete risk assessments automatically if the borrower profile is hard-deleted
  CONSTRAINT `fk_assessments_applicant` FOREIGN KEY (`applicant_id`) 
    REFERENCES `applicants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Fraud Checks Table (relational Security Layer - Phase 6)
CREATE TABLE `fraud_checks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `applicant_id` INT UNIQUE NOT NULL, -- Unique constraint enforces 1-to-1 relationship
  `is_duplicate` TINYINT(1) DEFAULT 0,
  `is_suspicious_income` TINYINT(1) DEFAULT 0,
  `is_missing_info` TINYINT(1) DEFAULT 0,
  `fraud_score` INT DEFAULT 0, -- Programmatic score scale: 0 to 100
  `status` ENUM('pass', 'review', 'flagged') DEFAULT 'pass',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Relational Cascade: Automatically drop fraud flag entries if the borrower file is removed
  CONSTRAINT `fk_fraud_applicant` FOREIGN KEY (`applicant_id`) 
    REFERENCES `applicants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Audit Logs Table (Compliance Tracking - Phase 9)
CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL, -- The user who performed the action (NULL if system/anonymous or user deleted)
  `action` VARCHAR(50) NOT NULL, -- e.g. LOGIN_SUCCESS, CREATE_APPLICANT, etc.
  `target_id` VARCHAR(50) DEFAULT NULL, -- e.g. applicantId or userId
  `details` TEXT DEFAULT NULL, -- JSON block or description of actions
  `ip_address` VARCHAR(45) DEFAULT NULL, -- IP v4 or v6 address
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign Key Integrity: Keep audit histories even if user is purged
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Applicant Notes Table (Comments and timelines - Feature 3)
CREATE TABLE `applicant_notes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `applicant_id` INT NOT NULL,
  `user_id` INT DEFAULT NULL,
  `note_text` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_notes_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_notes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

