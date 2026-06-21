const { pool } = require('../lib/db');
const { verifyAuth } = require('../lib/auth');
const { requireManager } = require('../lib/roles');
const { resolveStoreId } = require('../lib/store');

export default async function handler(req, res) {
  try {
    // Auth & Context
    const user = verifyAuth(req);
    requireManager(user);
    const storeId = resolveStoreId(user, req.headers);
    
    // URL Params: /api/warehouses?id=123 or /api/warehouses?id=123&inventory=true
    const warehouseId = req.query.id;
    const isInventory = req.query.inventory === 'true';

    switch (req.method) {
      case 'GET':
        // Inventory Fetch
        if (isInventory && warehouseId) {
          const inv = await pool.query(
            `SELECT i.*, p.product_name, pv.sku FROM inventory i
             JOIN product_variants pv ON i.variant_id = pv.variant_id
             JOIN products p ON pv.product_id = p.product_id
             WHERE i.warehouse_id = $1`, [warehouseId]
          );
          return res.json(inv.rows);
        }
        
        // List Warehouses
        const all = await pool.query(
          `SELECT w.*, l.street_address, l.city FROM warehouses w
           LEFT JOIN locations l ON w.location_id = l.location_id
           WHERE w.store_id = $1 ORDER BY w.warehouse_name ASC`, [storeId]
        );
        return res.json(all.rows);

      case 'POST':
        const { warehouse_name, location_id } = req.body;
        const ins = await pool.query(
          "INSERT INTO warehouses (store_id, warehouse_name, location_id) VALUES ($1, $2, $3) RETURNING *",
          [storeId, warehouse_name, location_id || null]
        );
        return res.status(201).json(ins.rows[0]);

      case 'PUT':
        const up = await pool.query(
          "UPDATE warehouses SET warehouse_name=$1, location_id=$2 WHERE warehouse_id=$3 AND store_id=$4 RETURNING *",
          [req.body.warehouse_name, req.body.location_id || null, warehouseId, storeId]
        );
        return up.rows.length ? res.json(up.rows[0]) : res.status(404).json({ error: "Not found" });

      case 'DELETE':
        const del = await pool.query("DELETE FROM warehouses WHERE warehouse_id=$1 AND store_id=$2 RETURNING *", [warehouseId, storeId]);
        return del.rows.length ? res.json({ message: "Deleted" }) : res.status(404).json({ error: "Not found" });

      default:
        return res.status(405).end();
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}