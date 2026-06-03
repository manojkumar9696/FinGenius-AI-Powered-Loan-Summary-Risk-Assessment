/**
 * Applicant Notes Routing Configuration
 * Defines REST endpoints for adding comments and fetching timelines for loan assessments.
 */
const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notes.controller');
const authMiddleware = require('../middleware/auth.middleware');

// --- Global Middleware Layer ---
// Enforce JWT validation across all endpoints in this router
router.use(authMiddleware.protect);

// --- Routes Mapping ---
// Maps GET /api/notes/:applicantId and POST /api/notes/:applicantId
router
  .route('/:applicantId')
  .get(notesController.getNotes)
  .post(notesController.addNote);

module.exports = router;
