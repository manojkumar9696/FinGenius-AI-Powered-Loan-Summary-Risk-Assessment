/**
 * System Health Controller
 * Implements the system check controller, verifying API uptime, memory usage, and database ping capacity.
 */
const db = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * GET /api/health
 * Checks server health, system performance indicators, and probes the MySQL connection.
 */
exports.checkHealth = async (req, res, next) => {
  try {
    let dbStatus = 'disconnected';
    let dbError = null;

    try {
      // Execute a lightweight ping query to verify database is alive and responsive
      const [rows] = await db.query('SELECT 1 as ping');
      if (rows && rows[0].ping === 1) {
        dbStatus = 'connected';
      }
    } catch (err) {
      dbStatus = 'error';
      dbError = err.message;
    }

    // Capture memory usage stats
    const memoryUsage = process.memoryUsage();
    
    // Construct the health payload
    const healthData = {
      status: dbStatus === 'connected' ? 'success' : 'fail',
      timestamp: new Date().toISOString(),
      uptime: `${process.uptime().toFixed(2)} seconds`,
      environment: process.env.NODE_ENV,
      system: {
        memoryUsedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
        totalMemoryMB: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2)
      },
      services: {
        database: dbStatus
      }
    };

    // If database check fails, set HTTP code to 503 (Service Unavailable)
    const statusCode = dbStatus === 'connected' ? 200 : 503;

    if (dbStatus !== 'connected') {
      healthData.services.database_error = dbError;
    }

    return res.status(statusCode).json(healthData);
  } catch (error) {
    // Forward any unexpected runtime errors to global error middleware
    next(error);
  }
};

/**
 * GET /api/health/error-test
 * Developer route to verify the custom global error-handling flow.
 */
exports.testError = (req, res, next) => {
  next(new AppError('Standard Operational Error Pipeline Test Passed!', 400));
};
