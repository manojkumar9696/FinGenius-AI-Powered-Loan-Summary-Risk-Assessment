/**
 * AI-Powered Loan Application Summary & Risk Assessment System
 * Main application bootstrap script.
 */
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// 1. Initialize environment variables
dotenv.config();

const AppError = require('./utils/AppError');
const globalErrorHandler = require('./middleware/error.middleware');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const applicantRoutes = require('./routes/applicant.routes');
const riskRoutes = require('./routes/risk.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const auditRoutes = require('./routes/audit.routes');
const notesRoutes = require('./routes/notes.routes');
const chatRoutes = require('./routes/chat.routes');

// Production Hardening Imports
const helmet = require('helmet');
const { globalLimiter, authLimiter } = require('./middleware/rateLimit.middleware');
const logger = require('./utils/logger');

// 2. Instantiate Express application
const app = express();

// 3. Configure Global Middlewares
// Enable Helmet HTTP Security Headers (Essential Production Shield)
app.use(helmet());

// Enable Cross-Origin Resource Sharing (CORS) so Vite client can communicate with our API
app.use(cors());

// Rate Limiting Protection (Prevent DDoS and Brute Force)
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);

// Body parser: parses JSON bodies and places results in req.body
app.use(express.json());

// Request logging in development environment
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 4. Mount API Endpoints
// Health checks and verification endpoints
app.use('/api/health', healthRoutes);
// Authentication endpoints
app.use('/api/auth', authRoutes);
// Applicant profiles endpoints
app.use('/api/applicants', applicantRoutes);
// Programmatic Underwriting and Risk Assessment endpoints
app.use('/api/assessments', riskRoutes);
// Dashboard Analytics and Reporting stats endpoints
app.use('/api/dashboard', dashboardRoutes);
// Compliance Audit Logs endpoints (Phase 9 Admin-only)
app.use('/api/audit-logs', auditRoutes);
// Applicant notes and comments timeline endpoints
app.use('/api/notes', notesRoutes);
// Underwriter chatbot helper endpoint
app.use('/api/chat', chatRoutes);

// 5. Handle Unhandled Routes (404 Resource Not Found)
app.use((req, res, next) => {
  // If we pass an error into next(), Express skips all remaining middleware and hits the global error handler
  next(new AppError(`Endpoint '${req.originalUrl}' not found on this server.`, 404));
});

// 6. Global Error Handling Middleware
// This must be placed last, at the very bottom of the middleware stack
app.use(globalErrorHandler);

// 7. Start the Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`[Server] Loan Assessment API running on port ${PORT} in [${process.env.NODE_ENV || 'development'}] mode.`);
});

// 8. Graceful Shutdown & Unhandled Exception Safeguards
process.on('unhandledRejection', (err) => {
  logger.error('[Server] UNHANDLED REJECTION! 💥 Shutting down server gracefully...', err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  logger.error('[Server] UNCAUGHT EXCEPTION! 💥 Shutting down server immediately...', err);
  process.exit(1);
});
