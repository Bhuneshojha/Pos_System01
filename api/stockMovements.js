const { pool } = require('../lib/db');
const { verifyAuth } = require('../lib/auth');
const { requireManager } = require('../lib/roles');
const { resolveStoreId } = require('../lib/store');

export default async function handler(req, res) {
  try {
    const user = verifyAuth(req);
    requireManager(user);
    const storeId = resolveStoreId(user, req.headers);

    switch (req.method) {
      case 'GET':
        // Stock history fetch karna (e.g., /api/stock-movements?limit=20)
        const limit = parseInt(req.query.limit) || 50;
        const result = await pool.query(
          `SELECT sm.*, pv.sku, p.product_name 
           FROM stock_movements sm
           JOIN product_variants pv ON sm.variant_id = pv.variant_id
           JOIN products p ON pv.product_id = p.product_id
           WHERE sm.store_id = $1 
           ORDER BY sm.movement_date DESC LIMIT $2`,
          [storeId, limit]
        );
        return res.json(result.rows);

      case 'POST':
        // Naya movement record karna (In/Out/Adjustment)
        const { variant_id, movement_type, quantity, reference_note } = req.body;
        
        // Transaction start (ensure inventory integrity)
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          const ins = await client.query(
            `INSERT INTO stock_movements (store_id, variant_id, movement_type, quantity, reference_note)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [storeId, variant_id, movement_type, quantity, reference_note]
          );

          // Inventory Table update (Stock update logic)
          const multiplier = (movement_type === 'IN' || movement_type === 'RETURN') ? 1 : -1;
          await client.query(
            `UPDATE inventory SET quantity_on_hand = quantity_on_hand + ($1 * $2) 
             WHERE variant_id = $3 AND store_id = $4`,
            [quantity, multiplier, variant_id, storeId]
          );

          await client.query('COMMIT');
          return res.status(201).json(ins.rows[0]);
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}