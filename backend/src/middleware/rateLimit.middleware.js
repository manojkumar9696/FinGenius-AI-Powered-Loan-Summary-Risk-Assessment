const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');

/**
 * Production Rate Limiter Middlewares
 * Secures routing contexts by protecting from denial-of-service (DDoS) and brute-force password guessing.
 */

// 1. General API Rate Limiting (500 requests per 15 minutes)
exports.globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) => {
    next(new AppError('Too many requests from this IP. Please try again after 15 minutes.', 429));
  }
});

// 2. Auth Endpoint Brute-Force Shield (100 requests per 15 minutes)
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs on auth pathways
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('Brute force safeguard triggered: too many login or registration attempts. Try again after 15 minutes.', 429));
  }
});
