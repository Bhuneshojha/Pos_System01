const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'please-change-me';
const ENABLE_DEV_AUTH = process.env.ENABLE_DEV_AUTH === '1' || false;
const DEFAULT_STORE_SLUG = 'default-store';

const createRoleIfMissing = async (roleName) => {
  const insertText = `INSERT INTO roles (role_name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING role_id`;
  const selectText = `SELECT role_id FROM roles WHERE role_name = $1 LIMIT 1`;
  await pool.query(insertText, [roleName]);
  const result = await pool.query(selectText, [roleName]);
  return result.rows[0]?.role_id;
};

const findOrCreateDefaultStore = async () => {
  const selectText = `SELECT store_id, store_name, subdomain_or_slug FROM stores WHERE subdomain_or_slug = $1 LIMIT 1`;
  const insertText = `INSERT INTO stores (store_name, subdomain_or_slug, phone, email) VALUES ($1, $2, $3, $4) RETURNING store_id, store_name, subdomain_or_slug`;

  const existing = await pool.query(selectText, [DEFAULT_STORE_SLUG]);
  if (existing.rows.length > 0) return existing.rows[0];

  const result = await pool.query(insertText, [
    'Default Store',
    DEFAULT_STORE_SLUG,
    '+0000000000',
    'support@arbex.local'
  ]);
  return result.rows[0];
};

const findStoreById = async (storeId) => {
  const result = await pool.query(
    `SELECT store_id, store_name, subdomain_or_slug FROM stores WHERE store_id = $1 LIMIT 1`,
    [storeId]
  );
  return result.rows[0];
};

const findStoreBySlug = async (slug) => {
  if (!slug) return null;
  const result = await pool.query(
    `SELECT store_id, store_name, subdomain_or_slug FROM stores WHERE subdomain_or_slug = $1 LIMIT 1`,
    [slug.trim().toLowerCase()]
  );
  return result.rows[0];
};

const createStoreIfMissing = async (slug, storeName = null) => {
  if (!slug) return null;
  const normalizedSlug = slug.trim().toLowerCase();
  const existing = await findStoreBySlug(normalizedSlug);
  if (existing) return existing;

  const insertText = `
    INSERT INTO stores (store_name, subdomain_or_slug, phone, email)
    VALUES ($1, $2, $3, $4)
    RETURNING store_id, store_name, subdomain_or_slug
  `;

  const result = await pool.query(insertText, [
    storeName || normalizedSlug,
    normalizedSlug,
    '+0000000000',
    `admin@${normalizedSlug}.local`
  ]);
  return result.rows[0];
};

const resolveStore = async ({ store_id, store_slug, createIfMissing = false, store_name }) => {
  if (store_id) {
    const numericStoreId = Number(store_id);
    if (!Number.isNaN(numericStoreId)) {
      const store = await findStoreById(numericStoreId);
      if (store) return store;
    }
  }

  if (store_slug) {
    const normalizedSlug = store_slug.trim().toLowerCase();
    const store = await findStoreBySlug(normalizedSlug);
    if (store) return store;
    if (createIfMissing) return await createStoreIfMissing(normalizedSlug, store_name);
  }

  return null;
};

const findUser = async (username, storeId) => {
  const query = `
    SELECT u.user_id, u.username, u.password_hash, u.store_id, r.role_name
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    WHERE u.username = $1 AND u.store_id = $2
    LIMIT 1
  `;
  const result = await pool.query(query, [username, storeId]);
  return result.rows[0];
};

const createUser = async (username, password, storeId, roleName) => {
  const roleId = await createRoleIfMissing(roleName);
  const passwordHash = await bcrypt.hash(password, 10);
  const insertText = `
    INSERT INTO users (store_id, role_id, username, password_hash)
    VALUES ($1, $2, $3, $4)
    RETURNING user_id, store_id, username
  `;
  const result = await pool.query(insertText, [storeId, roleId, username, passwordHash]);
  return result.rows[0];
};

const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  const { fullName, email, password, role = 'manager', store_id, store_slug, store_name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const username = email.trim().toLowerCase();
    let store = await resolveStore({ store_id, store_slug });

    if (!store) {
      if (role === 'admin') {
        if (!store_slug) {
          return res.status(400).json({ error: 'Store slug is required to create a new store.' });
        }
        store = await createStoreIfMissing(store_slug, store_name || store_slug);
      } else {
        store = await findOrCreateDefaultStore();
      }
    }

    const existing = await findUser(username, store.store_id);
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists for this store.' });
    }

    const createdUser = await createUser(username, password, store.store_id, role);
    const token = signToken({ user_id: createdUser.user_id, username: createdUser.username, store_id: createdUser.store_id, store_slug: store.subdomain_or_slug, role });

    res.status(201).json({
      token,
      user: {
        user_id: createdUser.user_id,
        username: createdUser.username,
        role,
        store_id: createdUser.store_id,
        store_slug: store.subdomain_or_slug,
      }
    });
  } catch (err) {
    console.error('Register error', err);
    res.status(500).json({ error: 'Unable to create account at this time' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password, store_id, store_slug } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const username = email.trim().toLowerCase();
    let store = await resolveStore({ store_id, store_slug });
    if (!store) {
      store = await findOrCreateDefaultStore();
    }

    const user = await findUser(username, store.store_id);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password for this store' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({ user_id: user.user_id, username: user.username, store_id: user.store_id, store_slug: store.subdomain_or_slug, role: user.role_name });
    res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role_name,
        store_id: user.store_id,
        store_slug: store.subdomain_or_slug,
      }
    });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ error: 'Unable to sign in at this time' });
  }
});

// Dev-only token generator. ENABLE_DEV_AUTH must be '1' to allow.
router.post('/token', (req, res) => {
  if (!ENABLE_DEV_AUTH) return res.status(403).json({ error: 'Dev token generation disabled' });

  const { user_id, store_id, username } = req.body;
  if (!user_id || !store_id) return res.status(400).json({ error: 'user_id and store_id are required' });

  const payload = {
    user_id: Number(user_id),
    store_id: Number(store_id),
    username: username || 'dev'
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

module.exports = router;
