/**
 * MySQL Connection Pool Configuration
 * Establishes a reusable connection pool utilizing mysql2/promise for asynchronous database queries.
 */
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Ensure environment variables are loaded (safeguard if loaded in index.js)
dotenv.config();

// Create the connection pool options
const poolConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loan_assessment_db',
  waitForConnections: true,
  connectionLimit: 10, // Adjust connection ceiling depending on server resources
  queueLimit: 0,       // No limit to wait queue size (will wait until timeout)
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000 // Send keep-alive probe after 10 seconds of inactivity
};

// Initialize connection pool
console.log(`[Database] Initializing MySQL pool connection for ${poolConfig.host}:${poolConfig.port}...`);
const pool = mysql.createPool(poolConfig);

// Test database connection immediately
pool.getConnection()
  .then((connection) => {
    console.log('[Database] MySQL pool established successfully! Connection tested OK.');
    connection.release(); // Release connection back to pool immediately
  })
  .catch((err) => {
    console.error('[Database] Failed to connect to MySQL database! Please check credentials or if MySQL is running.');
    console.error(`[Database] Error Details: ${err.message}`);
  });

module.exports = pool;
