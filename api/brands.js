const { pool } = require('../lib/db');
const { verifyAuth } = require('../lib/auth');
const { requireAdmin } = require('../lib/roles');
const { resolveStoreId } = require('../lib/store');

export default async function handler(req, res) {
  try {
    // 1. Auth, Admin Check, and Store Context
    const user = verifyAuth(req);
    requireAdmin(user);
    const storeId = resolveStoreId(user, req.headers);
    const brandId = req.query.id; // URL: /api/brands?id=123

    switch (req.method) {
      case 'GET':
        const all = await pool.query(
          "SELECT * FROM brands WHERE store_id = $1 ORDER BY brand_name ASC", 
          [storeId]
        );
        return res.json(all.rows);

      case 'POST':
        const { brand_name } = req.body;
        const ins = await pool.query(
          "INSERT INTO brands (store_id, brand_name) VALUES ($1, $2) RETURNING *", 
          [storeId, brand_name]
        );
        return res.status(201).json(ins.rows[0]);

      case 'PUT':
        const up = await pool.query(
          "UPDATE brands SET brand_name=$1 WHERE brand_id=$2 AND store_id=$3 RETURNING *", 
          [req.body.brand_name, brandId, storeId]
        );
        return up.rows.length ? res.json(up.rows[0]) : res.status(404).json({ error: "Not found" });

      case 'DELETE':
        const del = await pool.query(
          "DELETE FROM brands WHERE brand_id=$1 AND store_id=$2 RETURNING *", 
          [brandId, storeId]
        );
        return del.rows.length ? res.json({ message: "Deleted" }) : res.status(404).json({ error: "Not found" });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}