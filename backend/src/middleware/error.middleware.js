const logger = require('../utils/logger');

/**
 * Global Error Handling Middleware for Express
 * Captures all operational and system errors in the application, standardizes the API response.
 * Integrates Winston logger to persist error reports.
 */

// Helper to send detailed error information in development mode
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err
  });
};

// Helper to send sanitized error information in production mode
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send complete message details to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // Programming or unknown system error: log details internally and send generic response
    logger.error('CRITICAL SYSTEM EXCEPTION 💥:', err);

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong on the server. Please try again later.'
    });
  }
};

module.exports = (err, req, res, next) => {
  // Set default status code (500 Internal Server Error) if none specified
  err.statusCode = err.statusCode || 500;
  // Set default status message category ('error') if none specified
  err.status = err.status || 'error';

  // Structured Logging based on severity
  if (err.statusCode >= 500 || !err.isOperational) {
    logger.error(`System Exception: ${err.message}`, {
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      stack: err.stack
    });
  } else {
    logger.warn(`Operational Warning [${err.statusCode}]: ${err.message}`, {
      path: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
  }

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    // Create a copy of the error to preserve original if we perform modifications
    let error = { ...err };
    error.message = err.message;
    error.stack = err.stack;

    // Handle specific third-party error types (e.g. MySQL errors, JWT errors) here in later phases
    if (err.name === 'JsonWebTokenError') {
      error.message = 'Invalid token. Please log in again.';
      error.statusCode = 401;
      error.status = 'fail';
      error.isOperational = true;
    }
    if (err.name === 'TokenExpiredError') {
      error.message = 'Your token has expired. Please log in again.';
      error.statusCode = 401;
      error.status = 'fail';
      error.isOperational = true;
    }

    sendErrorProd(error, res);
  }
};

