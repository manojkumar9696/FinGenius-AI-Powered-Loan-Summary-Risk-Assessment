/**
 * Applicant Management Routing Configuration
 * Maps REST URL paths to CRUD controller logic, enforcing JWT shields and input validation rules.
 */
const express = require('express');
const router = express.Router();
const applicantController = require('../controllers/applicant.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { applicantValidationRules } = require('../validations/applicant.validation');

// --- Global Middleware Layer ---
// Enforce JWT protection across ALL endpoints registered in this router
router.use(authMiddleware.protect);

// --- Routes Mapping ---

// Route: GET /api/applicants & POST /api/applicants
router
  .route('/')
  .get(applicantController.getAllApplicants)
  .post(applicantValidationRules, applicantController.createApplicant);

// Route: GET /api/applicants/export (Download CSV Portfolio)
router.get('/export', applicantController.exportApplicants);

// Route: GET /:id, PUT /:id, DELETE /:id
router
  .route('/:id')
  .get(applicantController.getApplicantById)
  .put(applicantValidationRules, applicantController.updateApplicant)
  // Compliance RBAC: Only 'admin' role accounts are allowed to delete applicant records
  .delete(authMiddleware.restrictTo('admin'), applicantController.deleteApplicant);

// Route: GET /api/applicants/:id/report (Stream PDF Underwriting Report)
router.get('/:id/report', applicantController.downloadReport);

module.exports = router;
