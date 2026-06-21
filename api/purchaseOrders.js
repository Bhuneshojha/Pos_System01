const { pool } = require('../lib/db');
const { verifyAuth } = require('../lib/auth');
const { requireManager } = require('../lib/roles');
const { resolveStoreId } = require('../lib/store');

export default async function handler(req, res) {
  try {
    const user = verifyAuth(req);
    requireManager(user);
    const storeId = resolveStoreId(user, req.headers);

    // Helper to get ID from query string (e.g., /api/purchaseOrders?id=123)
    const poId = req.query.id;

    switch (req.method) {
      case 'GET':
        // GET PO Details
        if (poId) {
          const poResult = await pool.query(
            `SELECT po.*, s.supplier_name, u.username as ordered_by_name FROM purchase_orders po
             LEFT JOIN suppliers s ON po.supplier_id = s.supplier_id
             LEFT JOIN users u ON po.ordered_by = u.user_id WHERE po.po_id = $1`, [poId]
          );
          if (poResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });
          
          const itemsResult = await pool.query(
            `SELECT poi.*, p.product_name, pv.sku FROM purchase_order_items poi
             JOIN product_variants pv ON poi.variant_id = pv.variant_id
             JOIN products p ON pv.product_id = p.product_id WHERE poi.po_id = $1`, [poId]
          );
          return res.json({ ...poResult.rows[0], items: itemsResult.rows });
        }

        // GET ALL
        const { status, limit = 100 } = req.query;
        let q = `SELECT po.*, s.supplier_name FROM purchase_orders po 
                 LEFT JOIN suppliers s ON po.supplier_id = s.supplier_id WHERE po.store_id = $1`;
        const params = [storeId];
        if (status) { q += ` AND po.status = $2`; params.push(status); }
        q += ` ORDER BY po.order_date DESC LIMIT $${params.length + 1}`;
        params.push(limit);
        const all = await pool.query(q, params);
        return res.json(all.rows);

      case 'POST':
        const { supplier_id, items } = req.body;
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const po = await client.query('INSERT INTO purchase_orders (store_id, supplier_id, ordered_by, status) VALUES ($1, $2, $3, \'PENDING\') RETURNING *', [storeId, supplier_id, user.user_id]);
          for (const item of items) {
            await client.query('INSERT INTO purchase_order_items (po_id, variant_id, quantity, unit_cost) VALUES ($1, $2, $3, $4)', [po.rows[0].po_id, item.variant_id, item.quantity, item.unit_cost]);
          }
          await client.query('COMMIT');
          return res.status(201).json(po.rows[0]);
        } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }

      case 'PUT':
        const { status: newStatus } = req.body;
        const result = await pool.query('UPDATE purchase_orders SET status = $1 WHERE po_id = $2 AND store_id = $3 RETURNING *', [newStatus, poId, storeId]);
        return result.rows.length ? res.json(result.rows[0]) : res.status(404).json({ error: 'Not found' });

      case 'DELETE':
        await pool.query('DELETE FROM purchase_orders WHERE po_id = $1 AND store_id = $2', [poId, storeId]);
        return res.json({ message: 'Deleted' });

      default:
        return res.status(405).end();
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}