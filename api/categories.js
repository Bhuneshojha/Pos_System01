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
    const catId = req.query.id; // URL: /api/categories?id=123

    switch (req.method) {
      case 'GET':
        // GET Single
        if (catId) {
          const result = await pool.query(
            "SELECT * FROM categories WHERE category_id = $1 AND store_id = $2",
            [catId, storeId]
          );
          if (result.rows.length === 0) return res.status(404).json({ error: "Category not found" });
          return res.json(result.rows[0]);
        }
        // GET All
        const all = await pool.query(
          "SELECT * FROM categories WHERE store_id = $1 ORDER BY category_id ASC",
          [storeId]
        );
        return res.json(all.rows);

      case 'POST':
        const { category_name } = req.body;
        if (!category_name) return res.status(400).json({ error: "category_name is required" });
        const ins = await pool.query(
          "INSERT INTO categories (store_id, category_name) VALUES ($1, $2) RETURNING *",
          [storeId, category_name]
        );
        return res.status(201).json(ins.rows[0]);

      case 'PUT':
        if (!req.body.category_name) return res.status(400).json({ error: "category_name is required" });
        const up = await pool.query(
          "UPDATE categories SET category_name = $1 WHERE category_id = $2 AND store_id = $3 RETURNING *",
          [req.body.category_name, catId, storeId]
        );
        return up.rows.length ? res.json(up.rows[0]) : res.status(404).json({ error: "Category not found" });

      case 'DELETE':
        const del = await pool.query(
          "DELETE FROM categories WHERE category_id = $1 AND store_id = $2 RETURNING *",
          [catId, storeId]
        );
        return del.rows.length ? res.json({ message: "Category deleted", category: del.rows[0] }) : res.status(404).json({ error: "Category not found" });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    // Unique constraint error check
    if (err.code === "23505") return res.status(409).json({ error: "Category name already exists" });
    return res.status(err.status || 500).json({ error: err.message });
  }
}