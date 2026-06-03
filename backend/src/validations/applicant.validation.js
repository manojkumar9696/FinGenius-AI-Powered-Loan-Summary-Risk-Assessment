/**
 * Applicant Request Validation Schema
 * Declares strict sanitization and validation rules for credit profiles using express-validator.
 */
const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// Middleware to intercept validation failures and format standardized operational error payloads
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next(); // Inputs verified, proceed to controller
  }

  // Format error messages into a single user-facing string
  const extractedErrors = errors.array().map(err => `${err.path}: ${err.msg}`).join(' | ');
  return next(new AppError(`Validation failed: ${extractedErrors}`, 400));
};

// Validation rules array for Creating and Updating Applicants
const applicantValidationRules = [
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required.')
    .isLength({ max: 50 })
    .withMessage('First name must not exceed 50 characters.'),

  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required.')
    .isLength({ max: 50 })
    .withMessage('Last name must not exceed 50 characters.'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage('Phone number must reside between 7 and 20 digits.'),

  body('ssn')
    .trim()
    .notEmpty()
    .withMessage('PAN Card or Aadhaar Number is required.')
    .matches(/^(?:[A-Z]{5}[0-9]{4}[A-Z]{1}|[0-9]{12})$/i)
    .withMessage('Invalid PAN Card (Format: ABCDE1234F) or Aadhaar Card (12 digits) format.'),

  body('date_of_birth')
    .trim()
    .notEmpty()
    .withMessage('Date of birth is required.')
    .isISO8601()
    .withMessage('Date of birth must be a valid date format (YYYY-MM-DD).')
    .custom((value) => {
      // Compliance check: Applicant must be at least 18 years old
      const dob = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      if (age < 18) {
        throw new Error('Applicant must be of legal age (at least 18 years old).');
      }
      return true;
    }),

  body('monthly_income')
    .notEmpty()
    .withMessage('Monthly income is required.')
    .isFloat({ min: 0 })
    .withMessage('Monthly income must be a positive numeric value.'),

  body('monthly_debt')
    .notEmpty()
    .withMessage('Monthly debt is required.')
    .isFloat({ min: 0 })
    .withMessage('Monthly debt must be a positive numeric value.'),

  body('credit_score')
    .notEmpty()
    .withMessage('Credit score (CIBIL) is required.')
    .isInt({ min: 300, max: 900 })
    .withMessage('Credit score must be a valid integer between 300 and 900 (CIBIL standard).'),

  body('employment_status')
    .trim()
    .notEmpty()
    .withMessage('Employment status is required.')
    .isIn(['employed', 'self_employed', 'unemployed', 'retired'])
    .withMessage('Employment status must be: employed, self_employed, unemployed, or retired.'),

  body('loan_amount')
    .notEmpty()
    .withMessage('Loan amount is required.')
    .isFloat({ min: 1000 })
    .withMessage('Loan amount must be a positive number of at least ₹1,000.'),

  body('loan_purpose')
    .trim()
    .notEmpty()
    .withMessage('Loan purpose is required.')
    .isLength({ max: 100 })
    .withMessage('Loan purpose must not exceed 100 characters.'),

  body('loan_term_months')
    .notEmpty()
    .withMessage('Loan term in months is required.')
    .isInt({ min: 1, max: 360 })
    .withMessage('Loan term must be a valid positive integer between 1 and 360 months.'),

  validate // Mount interceptor middleware at bottom of rule chain
];

module.exports = {
  applicantValidationRules
};
