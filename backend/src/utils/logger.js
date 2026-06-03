const winston = require('winston');
const path = require('path');

// Configure clean JSON format with timestamp and stack metadata
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define log paths
const errorLogPath = path.join(__dirname, '../../logs/error.log');
const combinedLogPath = path.join(__dirname, '../../logs/combined.log');

// Bootstrap Winston Logger Instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    // 1. Write all errors to error.log
    new winston.transports.File({ 
      filename: errorLogPath, 
      level: 'error',
      maxsize: 5242880, // 5MB limit
      maxFiles: 5
    }),
    // 2. Write all logs (info and below) to combined.log
    new winston.transports.File({ 
      filename: combinedLogPath,
      maxsize: 10485760, // 10MB limit
      maxFiles: 5
    })
  ]
});

// 3. Enable Colorized Console Transports for Sandbox Development Mode
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, stack }) => {
        return `[${timestamp}] ${level}: ${message}${stack ? `\n${stack}` : ''}`;
      })
    )
  }));
}

module.exports = logger;
