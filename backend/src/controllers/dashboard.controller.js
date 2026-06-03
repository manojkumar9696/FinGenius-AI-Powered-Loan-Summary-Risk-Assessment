/**
 * Dashboard Analytics Controller
 * Compiles portfolio-isolated aggregates concurrently to drive analytical reporting dashboards.
 */
const db = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * GET /api/dashboard/stats
 * Aggregates portfolio metrics.
 * - Administrators have global views (Consolidated statistics of all users).
 * - Loan Officers have isolated views (Statistics reflecting only their own submissions).
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    let filterQuery = '';
    let queryParams = [];

    // Enforce data insulation for standard underwriters (non-admins)
    if (req.user.role !== 'admin') {
      filterQuery = ' WHERE created_by = ?';
      queryParams.push(req.user.id);
    }

    // Run all aggregation queries concurrently utilizing Promise.all to achieve maximum database throughput
    const [
      [totalResult],
      statusResults,
      riskResults,
      fraudResults
    ] = await Promise.all([
      // Query 1: Total Applications count
      db.query(`SELECT COUNT(id) AS count FROM applicants${filterQuery}`, queryParams),

      // Query 2: Decision status distribution (Approved, Rejected, Pending)
      db.query(`SELECT status, COUNT(id) AS count FROM applicants${filterQuery} GROUP BY status`, queryParams),

      // Query 3: Credit Risk Tier distribution (Low, Medium, High)
      db.query(
        `SELECT r.risk_level, COUNT(r.id) AS count 
         FROM risk_assessments r 
         JOIN applicants a ON r.applicant_id = a.id
         ${req.user.role !== 'admin' ? 'WHERE a.created_by = ?' : ''} 
         GROUP BY r.risk_level`,
        queryParams
      ),

      // Query 4: Security Fraud Flag alerts distribution (Pass, Review, Flagged)
      db.query(
        `SELECT f.status, COUNT(f.id) AS count 
         FROM fraud_checks f 
         JOIN applicants a ON f.applicant_id = a.id
         ${req.user.role !== 'admin' ? 'WHERE a.created_by = ?' : ''} 
         GROUP BY f.status`,
        queryParams
      )
    ]);

    const totalApplications = totalResult[0].count || 0;

    // Format distributions into clean key-value dictionary formats
    const statusDistribution = {
      pending: 0,
      approved: 0,
      rejected: 0
    };
    statusResults[0].forEach(row => {
      statusDistribution[row.status] = row.count;
    });

    const riskDistribution = {
      low: 0,
      medium: 0,
      high: 0
    };
    riskResults[0].forEach(row => {
      riskDistribution[row.risk_level] = row.count;
    });

    const fraudDistribution = {
      pass: 0,
      review: 0,
      flagged: 0
    };
    fraudResults[0].forEach(row => {
      fraudDistribution[row.status] = row.count;
    });

    // Programmatically calculate Approval Rate: (Approved / (Approved + Rejected)) * 100
    // We isolate 'pending' applications from the completed approval rate calculations
    const completedApplications = statusDistribution.approved + statusDistribution.rejected;
    let approvalRate = 0;
    
    if (completedApplications > 0) {
      approvalRate = (statusDistribution.approved / completedApplications) * 100;
      approvalRate = Math.round(approvalRate * 100) / 100; // Round to 2 decimal places
    }

    return res.status(200).json({
      status: 'success',
      data: {
        portfolioScope: req.user.role === 'admin' ? 'global' : 'isolated',
        metrics: {
          totalApplications,
          completedApplications,
          approvalRatePercent: approvalRate,
          statusDistribution,
          riskDistribution,
          fraudDistribution
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/analytics
 * Compiles advanced statistical aggregates (trends, purposes, CIBIL bands) for the analytics page.
 */
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    let filterQuery = '';
    let queryParams = [];

    // Enforce data insulation for standard underwriters (non-admins)
    if (req.user.role !== 'admin') {
      filterQuery = ' WHERE created_by = ?';
      queryParams.push(req.user.id);
    }

    // Run analytics queries concurrently
    const [
      purposeResults,
      creditBandResults,
      monthlyTrendResults
    ] = await Promise.all([
      // 1. Group by Loan Purpose
      db.query(
        `SELECT loan_purpose, COUNT(id) AS count, SUM(loan_amount) AS total_amount 
         FROM applicants 
         ${filterQuery} 
         GROUP BY loan_purpose 
         ORDER BY count DESC`,
        queryParams
      ),

      // 2. Group by CIBIL Bands
      db.query(
        `SELECT 
           CASE 
             WHEN credit_score >= 750 THEN '750-900 (Excellent)'
             WHEN credit_score >= 700 AND credit_score < 750 THEN '700-749 (Good)'
             WHEN credit_score >= 600 AND credit_score < 700 THEN '600-699 (Fair)'
             ELSE 'Below 600 (Poor)'
           END AS credit_band,
           COUNT(id) AS count
         FROM applicants
         ${filterQuery}
         GROUP BY credit_band`,
        queryParams
      ),

      // 3. Group by Month (Last 6 Months Trend)
      db.query(
        `SELECT 
           DATE_FORMAT(created_at, '%b %Y') AS month_name,
           COUNT(id) AS count,
           SUM(loan_amount) AS total_amount
         FROM applicants
         ${filterQuery}
         GROUP BY YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at, '%b %Y')
         ORDER BY YEAR(created_at) ASC, MONTH(created_at) ASC
         LIMIT 6`,
        queryParams
      )
    ]);

    // Parse and structure outputs
    const purposeAnalytics = purposeResults[0].map(row => ({
      purpose: row.loan_purpose,
      count: row.count,
      totalAmount: parseFloat(row.total_amount || 0)
    }));

    const creditBandAnalytics = {
      '750-900 (Excellent)': 0,
      '700-749 (Good)': 0,
      '600-699 (Fair)': 0,
      'Below 600 (Poor)': 0
    };
    creditBandResults[0].forEach(row => {
      creditBandAnalytics[row.credit_band] = row.count;
    });

    const monthlyTrendAnalytics = monthlyTrendResults[0].map(row => ({
      month: row.month_name,
      count: row.count,
      totalAmount: parseFloat(row.total_amount || 0)
    }));

    return res.status(200).json({
      status: 'success',
      data: {
        portfolioScope: req.user.role === 'admin' ? 'global' : 'isolated',
        purposes: purposeAnalytics,
        creditBands: creditBandAnalytics,
        monthlyTrend: monthlyTrendAnalytics
      }
    });
  } catch (error) {
    next(error);
  }
};

