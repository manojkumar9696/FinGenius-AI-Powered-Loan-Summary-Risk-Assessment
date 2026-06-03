/**
 * Authentication Controller
 * Manages user registration, login verification, and JSON Web Token (JWT) issuance.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const auditService = require('../services/audit.service');

/**
 * Helper: Signs JWT token using user ID and secret configuration
 * @param {number} id - User ID from database
 * @returns {string} Signed JWT
 */
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

/**
 * Helper: Sends standardized JSON payload containing user details and signed session token
 */
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);

  // Strip password hash from the user object for safety before transmitting
  const sanitizedUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    created_at: user.created_at
  };

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: sanitizedUser
    }
  });
};

/**
 * POST /api/auth/register
 * Registers a new user (Loan Officer or Administrator) inside the database.
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // 1. Basic validation
    if (!username || !email || !password) {
      return next(new AppError('Please provide username, email, and password.', 400));
    }

    // 2. Check if user already exists in database
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return next(new AppError('Email address is already registered.', 409)); // 409 Conflict
    }

    // 3. Hash the password securely using bcryptjs with 10 salt rounds
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Determine user role (defaults to loan_officer unless explicitly set to admin)
    const userRole = role === 'admin' ? 'admin' : 'loan_officer';

    // 5. Insert new user into database
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, userRole]
    );

    // Fetch the newly created user record to retrieve timestamp and auto-increment ID
    const [newUsers] = await db.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    const newUser = newUsers[0];

    // Log user registration audit trail
    await auditService.logAction({
      userId: newUser.id,
      action: 'USER_REGISTERED',
      targetId: newUser.id,
      details: {
        message: `New user '${newUser.username}' registered successfully with role '${newUser.role}'`,
        email: newUser.email,
        role: newUser.role
      },
      ipAddress: req.ip
    });

    // 6. Sign token and send response
    return createSendToken(newUser, 201, res);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Validates user credentials and issues a JWT session token.
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Check if email and password are provided
    if (!email || !password) {
      return next(new AppError('Please provide email and password.', 400));
    }

    // 2. Retrieve user record from database (must fetch password field for hash comparison)
    const [users] = await db.query(
      'SELECT id, username, email, password, role, created_at FROM users WHERE email = ?',
      [email]
    );

    // 3. Validate user presence and password match
    if (users.length === 0 || !(await bcrypt.compare(password, users[0].password))) {
      // Log failed login audit trail
      await auditService.logAction({
        userId: null,
        action: 'LOGIN_FAILURE',
        targetId: null,
        details: {
          message: 'Failed login attempt: incorrect email or password',
          attemptedEmail: email
        },
        ipAddress: req.ip
      });

      // Return a generic error to prevent email harvesting/brute-force intelligence
      return next(new AppError('Incorrect email or password.', 401));
    }

    const user = users[0];

    // Log successful login audit trail
    await auditService.logAction({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      targetId: user.id,
      details: {
        message: `User '${user.username}' logged in successfully`,
        email: user.email,
        role: user.role
      },
      ipAddress: req.ip
    });

    // 4. If credentials match, sign JWT and respond
    return createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};
