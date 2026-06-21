const { pool } = require('../lib/db');
const { verifyAuth } = require('../lib/auth');
const { resolveStoreId } = require('../lib/store');

export default async function handler(req, res) {
  try {
    // 1. Auth & Store Resolution
    const user = verifyAuth(req);
    const storeId = resolveStoreId(user, req.headers) || 1;
    
    // URL: /api/suppliers?id=123
    const supplierId = req.query.id;

    switch (req.method) {
      case 'GET':
        const all = await pool.query(
          "SELECT supplier_id, store_id, supplier_name FROM suppliers WHERE store_id = $1 ORDER BY supplier_id ASC",
          [storeId]
        );
        return res.json(all.rows || []);

      case 'POST':
        const { supplier_name } = req.body;
        if (!supplier_name?.trim()) return res.status(400).json({ error: "Supplier name is missing" });
        
        const ins = await pool.query(
          "INSERT INTO suppliers (store_id, supplier_name) VALUES ($1, $2) RETURNING *",
          [storeId, supplier_name.trim()]
        );
        return res.status(201).json(ins.rows[0]);

      case 'PUT':
        const up = await pool.query(
          "UPDATE suppliers SET supplier_name = $1 WHERE supplier_id = $2 AND store_id = $3 RETURNING *",
          [req.body.supplier_name?.trim(), supplierId, storeId]
        );
        return up.rows.length ? res.json(up.rows[0]) : res.status(404).json({ error: "Record not found" });

      case 'DELETE':
        const del = await pool.query(
          "DELETE FROM suppliers WHERE supplier_id = $1 AND store_id = $2 RETURNING *",
          [supplierId, storeId]
        );
        return del.rows.length ? res.json({ message: "Deleted successfully" }) : res.status(404).json({ error: "Record not found" });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    return res.status(500).json({ error: "Database execution failed", details: err.message });
  }
}