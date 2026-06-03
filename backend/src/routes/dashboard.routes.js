/**
 * Dashboard Analytics Routing Configuration
 * Maps REST URL endpoints for analytical reports, securing endpoints behind JWT guards.
 */
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/auth.middleware');

// --- Global Middleware Layer ---
// Enforce JWT validation across all endpoints in this router
router.use(authMiddleware.protect);

// --- Routes Mapping ---
// Map GET /stats to retrieve aggregate statistics
router.get('/stats', dashboardController.getDashboardStats);

// Map GET /analytics to retrieve portfolio-level analytics (purposes, CIBIL bands, trend charts)
router.get('/analytics', dashboardController.getDashboardAnalytics);

module.exports = router;
