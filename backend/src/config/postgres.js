const { Pool } = require('pg');
const winston = require('winston');
const path = require('path');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/postgres.log') 
    })
  ]
});

// Connection pool configuration
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'postgres',
  database: process.env.POSTGRES_DB || 'leadership',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
});

/**
 * Initialize database tables if they don't exist
 */
async function initializeDatabase() {
  let client;
  try {
    logger.info(`Connecting to PostgreSQL at ${pool.options.host}:${pool.options.port}`);
    client = await pool.connect();
    logger.info('Successfully connected to PostgreSQL');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create assessments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS assessments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        average_score NUMERIC(3,1)
      )
    `);
    
    // Create dimension_scores table
    await client.query(`
      CREATE TABLE IF NOT EXISTS dimension_scores (
        id SERIAL PRIMARY KEY,
        assessment_id INTEGER REFERENCES assessments(id),
        dimension VARCHAR(100),
        score INTEGER
      )
    `);
    
    // Create question_answers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS question_answers (
        id SERIAL PRIMARY KEY,
        assessment_id INTEGER REFERENCES assessments(id),
        question_id INTEGER,
        dimension VARCHAR(100),
        answer INTEGER
      )
    `);
    
    logger.info('Database tables initialized successfully');
    client.release();
    return true;
  } catch (error) {
    logger.error('Error initializing database tables', { error: error.message });
    if (client) client.release();
    throw error;
  }
}

/**
 * Execute a query with optional parameters
 * @param {string} query - SQL query to execute
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Query result
 */
async function executeQuery(query, params = []) {
  const client = await pool.connect();
  try {
    logger.debug('Executing SQL query', { query, params });
    const result = await client.query(query, params);
    return result;
  } catch (error) {
    logger.error('Database query error', { 
      error: error.message, 
      query, 
      params 
    });
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  initializeDatabase,
  executeQuery
}; 