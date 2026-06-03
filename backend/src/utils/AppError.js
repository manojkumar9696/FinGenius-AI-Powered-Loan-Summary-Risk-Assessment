/**
 * AppError Class
 * Extends the native JavaScript Error class to handle operational API errors.
 * Operational errors represent known, expected error scenarios (e.g., validation failures, invalid credentials, resource not found).
 */
class AppError extends Error {
  /**
   * @param {string} message - The error message details
   * @param {number} statusCode - The HTTP status code associated with this error (e.g., 400, 401, 403, 404)
   */
  constructor(message, statusCode) {
    // Call parent class (Error) constructor with the message
    super(message);

    // Set the HTTP status code
    this.statusCode = statusCode;

    // Classify the status category based on status code (fail for 4xx errors, error for 5xx errors)
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // Mark as operational so the global error handler knows it's safe to expose details to the client
    this.isOperational = true;

    // Capture the stack trace, excluding this constructor call from the trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
