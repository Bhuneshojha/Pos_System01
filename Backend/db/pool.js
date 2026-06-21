// /API/db/pool.js
const { Pool } = require('pg');
require('dotenv').config(); // Automatically locates your root .env file variables

// Establish the Neon PostgreSQL Connection Pooling Profile
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for secure cloud communication with Neon
  }
});

// Export the pool instance so pos.js and your routers can execute queries
module.exports = pool;