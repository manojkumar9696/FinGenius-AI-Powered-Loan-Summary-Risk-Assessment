/**
 * Authentication & Authorization Gatekeeper Middlewares
 * Validates session tokens and enforces Role-Based Access Control (RBAC).
 */
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * Protect: Secures private endpoints. Verifies that the client session contains a valid JWT.
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // 1. Retrieve the token from HTTP headers (Bearer token pattern)
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 2. Terminate if no token is found
    if (!token) {
      return next(
        new AppError('You are not logged in. Please log in to get access.', 401)
      );
    }

    // 3. Asynchronously verify the token's signature and expiration using JWT_SECRET
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Catch token tampering or expiration, forwarding cleanly to error handling middleware
      return next(new AppError('Invalid token or session expired. Please log in again.', 401));
    }

    // 4. Query the database to verify the user associated with this token still exists
    const [users] = await db.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return next(
        new AppError('The user belonging to this session token no longer exists.', 401)
      );
    }

    // 5. Attach the active user record directly to the request context object
    req.user = users[0];
    return next(); // Grant access to downstream controllers/middlewares
  } catch (error) {
    next(error);
  }
};

/**
 * RestrictTo: Restricts access to specific roles (e.g. 'admin').
 * Must be mounted AFTER protect middleware in the route chain.
 * @param {...string} roles - Approved roles (e.g., 'admin', 'loan_officer')
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check if the user is authenticated and if their role matches the approved roles
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403) // 403 Forbidden
      );
    }
    return next(); // Role verified, proceed
  };
};
