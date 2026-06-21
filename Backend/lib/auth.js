const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'please-change-me';

module.exports = {
  // We remove 'next' because Vercel handles requests differently
  verifyAuth: (req) => {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    
    if (!authHeader) {
      const error = new Error('Missing Authorization header');
      error.status = 401;
      throw error;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      const error = new Error('Invalid Authorization format. Use: Bearer <token>');
      error.status = 401;
      throw error;
    }

    const token = parts[1];
    try {
      // Returns the decoded payload (e.g., { userId, store_id, role })
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      const error = new Error('Invalid or expired token');
      error.status = 401;
      throw error;
    }
  }
};