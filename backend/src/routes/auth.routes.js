/**
 * Authentication Routing Configuration
 * Defines user routing endpoints for system logins and registrations.
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Map POST /register to controller's register method
router.post('/register', authController.register);

// Map POST /login to controller's login method
router.post('/login', authController.login);

module.exports = router;
