const { pool } = require('../lib/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export default async function handler(req, res) {
  const { action } = req.query; // URL: /api/auth?action=login

  try {
    if (req.method !== 'POST') return res.status(405).end();

    if (action === 'register') {
      const { email, password, role = 'manager', store_slug } = req.body;
      const username = email.trim().toLowerCase();
      
      // 1. Resolve Store (Assuming store exists)
      const storeRes = await pool.query("SELECT store_id FROM stores WHERE subdomain_or_slug = $1", [store_slug || 'default-store']);
      const storeId = storeRes.rows[0]?.store_id || 1;

      // 2. Hash & Insert
      const hash = await bcrypt.hash(password, 10);
      const user = await pool.query(
        "INSERT INTO users (store_id, username, password_hash, role_id) VALUES ($1, $2, $3, 1) RETURNING user_id",
        [storeId, username, hash]
      );
      return res.status(201).json({ user_id: user.rows[0].user_id });
    }

    if (action === 'login') {
      const { email, password } = req.body;
      const user = await pool.query(
        "SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.username = $1",
        [email.trim().toLowerCase()]
      );

      if (user.rows.length === 0) return res.status(401).json({ error: 'Auth failed' });
      
      const match = await bcrypt.compare(password, user.rows[0].password_hash);
      if (!match) return res.status(401).json({ error: 'Auth failed' });

      // Sign Token
      const token = jwt.sign(
        { user_id: user.rows[0].user_id, store_id: user.rows[0].store_id, role: user.rows[0].role_name },
        JWT_SECRET, { expiresIn: '7d' }
      );

      return res.json({ token, user: { username: user.rows[0].username, role: user.rows[0].role_name } });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}