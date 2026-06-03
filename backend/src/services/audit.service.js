const db = require('../config/db');

/**
 * Audit Logging Service
 * Handles compliance logging of sensitive operations into the audit_logs table.
 * Operations are executed safely to prevent audit failures from throwing primary action errors.
 */

/**
 * Commits a structured log of a business action into the database.
 * 
 * @param {Object} params
 * @param {number|null} params.userId - Actor User ID (null if anonymous / login failure)
 * @param {string} params.action - The identifier of action (e.g. 'LOGIN_SUCCESS', 'CREATE_APPLICANT')
 * @param {string|number|null} params.targetId - ID of targeted record or applicant profile
 * @param {Object|string|null} params.details - Meta information or operational details
 * @param {string|null} params.ipAddress - Client IP address
 */
exports.logAction = async ({ userId, action, targetId = null, details = null, ipAddress = null }) => {
  try {
    const serializedDetails = details && typeof details === 'object' 
      ? JSON.stringify(details) 
      : details;

    await db.query(
      `INSERT INTO audit_logs (user_id, action, target_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId || null,
        action,
        targetId ? String(targetId) : null,
        serializedDetails || null,
        ipAddress || null
      ]
    );
  } catch (error) {
    // Graceful containment: Warn in the logs but do not crash the primary HTTP request
    console.error(`[Audit Service] CRITICAL: Failed to write audit log for '${action}':`, error.message);
  }
};
