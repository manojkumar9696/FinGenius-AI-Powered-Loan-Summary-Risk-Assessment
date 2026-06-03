/**
 * Risk Assessment Routing Configuration
 * Defines REST URL endpoints for evaluating applicant risk scores and fetching historical underwriting logs.
 */
const express = require('express');
const router = express.Router();
const riskController = require('../controllers/risk.controller');
const authMiddleware = require('../middleware/auth.middleware');

// --- Global Middleware Layer ---
// Enforce JWT validation across all endpoints in this router
router.use(authMiddleware.protect);

// --- Routes Mapping ---
// Maps GET /api/assessments/:applicantId and POST /api/assessments/:applicantId
router
  .route('/:applicantId')
  .get(riskController.getAssessment)
  .post(riskController.assessApplicant);

module.exports = router;
