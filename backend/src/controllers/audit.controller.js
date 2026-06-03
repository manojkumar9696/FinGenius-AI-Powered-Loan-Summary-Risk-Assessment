const db = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * Compliance Audit Inspector Controller
 * Enforces strictly Admin-only querying capabilities for monitoring system activities.
 */

/**
 * GET /api/audit-logs
 * Retrieves detailed audit trail records.
 * Supports filtering by user_id, action, and target_id, with standard limit pagination.
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    // 1. Controller Guard: Enforce Admin privilege directly as double isolation
    if (req.user.role !== 'admin') {
      return next(new AppError('Access Denied: Only administrators can inspect compliance audit trails.', 403));
    }

    const { action, userId, targetId, limit = 50, page = 1 } = req.query;

    let query = `
      SELECT a.*, u.username, u.email 
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];

    // Apply filtering options dynamically
    if (action) {
      query += ' AND a.action = ?';
      queryParams.push(action);
    }
    if (userId) {
      query += ' AND a.user_id = ?';
      queryParams.push(parseInt(userId, 10));
    }
    if (targetId) {
      query += ' AND a.target_id = ?';
      queryParams.push(targetId);
    }

    // Add ordering and pagination limits
    query += ' ORDER BY a.created_at DESC';

    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    const offset = (parsedPage - 1) * parsedLimit;

    query += ' LIMIT ? OFFSET ?';
    queryParams.push(parsedLimit, offset);

    // Run query in MySQL pool
    const [logs] = await db.query(query, queryParams);

    // Fetch the total count for metadata results mapping
    let countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
    const countParams = [];
    if (action) {
      countQuery += ' AND action = ?';
      countParams.push(action);
    }
    if (userId) {
      countQuery += ' AND user_id = ?';
      countParams.push(parseInt(userId, 10));
    }
    if (targetId) {
      countQuery += ' AND target_id = ?';
      countParams.push(targetId);
    }

    const [totalRows] = await db.query(countQuery, countParams);
    const totalRecords = totalRows[0].total;

    return res.status(200).json({
      status: 'success',
      results: logs.length,
      pagination: {
        totalRecords,
        currentPage: parsedPage,
        totalPages: Math.ceil(totalRecords / parsedLimit),
        limit: parsedLimit
      },
      data: {
        logs
      }
    });
  } catch (error) {
    next(error);
  }
};
