/**
 * System Health Routes & Access Control Probes
 * Configures API paths for health probing, error pipelines, and security authorization checks.
 */
const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');
const authMiddleware = require('../middleware/auth.middleware');

// 1. Diagnostics
// Map GET / to the checkHealth controller method
router.get('/', healthController.checkHealth);

// Map GET /error-test to verify custom error handling
router.get('/error-test', healthController.testError);

// 2. Security Middleware Verifications
// Map GET /protect-test to verify JWT verification middleware
router.get('/protect-test', authMiddleware.protect, (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'JWT Protection test passed! You are authenticated.',
    user: req.user
  });
});

// Map GET /admin-test to verify Role-Based Access Control
router.get(
  '/admin-test',
  authMiddleware.protect,
  authMiddleware.restrictTo('admin'),
  (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Admin Role Protection test passed! You have admin clearance.',
      user: req.user
    });
  }
);

module.exports = router;
