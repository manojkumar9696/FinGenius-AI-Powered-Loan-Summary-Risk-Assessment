/**
 * Compliance Audit Routing Configuration
 * Provides secure endpoints to inspect database audit trails, strictly insulated behind Admin-only clearances.
 */
const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const authMiddleware = require('../middleware/auth.middleware');

// --- Global Middleware Layer ---
// Enforce JWT validation and Admin-only role isolation across all routes in this configuration
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

// Route: GET /api/audit-logs
router.get('/', auditController.getAuditLogs);

module.exports = router;
