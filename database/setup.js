/**
 * Automated Database Schema & Seed Initializer
 * Programmatically parses and runs schema.sql and seed.sql on the local MySQL server.
 * This script runs entirely in Node.js, eliminating the need for a global mysql CLI.
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment configurations
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const host = process.env.DB_HOST || '127.0.0.1';
const port = parseInt(process.env.DB_PORT || '3306', 10);
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const databaseName = process.env.DB_NAME || 'loan_assessment_db';

async function setupDatabase() {
  console.log('[Setup] Connecting to MySQL server to configure system tables...');
  
  // Connect to MySQL server without specifying database name first (to prevent connection failure if database doesn't exist yet)
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true // Allows executing multiple queries separated by semicolons
  });

  try {
    console.log(`[Setup] Creating database if not exists: '${databaseName}'...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\`;`);
    await connection.query(`USE \`${databaseName}\`;`);
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log(`[Setup] Reading schema from: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('[Setup] Executing database schemas creation queries...');
    await connection.query(schemaSql);
    console.log('[Setup] Schemas successfully created.');

    // Read seed file
    const seedPath = path.join(__dirname, 'seed.sql');
    console.log(`[Setup] Reading seeds from: ${seedPath}`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('[Setup] Seeding initial mock credentials accounts...');
    await connection.query(seedSql);
    console.log('[Setup] Database seeding completed successfully.');

  } catch (error) {
    console.error('[Setup] CRITICAL: Failed to initialize or seed MySQL database!');
    console.error(`[Setup] Error message: ${error.message}`);
  } finally {
    await connection.end();
    console.log('[Setup] Database connection released.');
  }
}

setupDatabase();
