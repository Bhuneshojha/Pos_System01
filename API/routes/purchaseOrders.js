const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const storeMiddleware = require('../middleware/store');
const { requireManager } = require('../middleware/roles');

const router = express.Router();

router.use(authMiddleware.verifyToken);
router.use(storeMiddleware.setStore);
router.use(requireManager());

// GET all purchase orders
router.get('/', async (req, res) => {
  try {
    const storeId = req.store_id;
    const { status, limit = 100 } = req.query;

    let query = `
      SELECT po.*, s.supplier_name, u.username as ordered_by_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.supplier_id
      LEFT JOIN users u ON po.ordered_by = u.user_id
      WHERE po.store_id = $1
    `;
    const params = [storeId];

    if (status) {
      query += ` AND po.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY po.order_date DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create purchase order
router.post('/', async (req, res) => {
  try {
    const storeId = req.store_id;
    const userId = req.user.user_id;
    const { supplier_id, items } = req.body;

    if (!supplier_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Supplier and items are required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create PO
      const poResult = await client.query(
        `INSERT INTO purchase_orders (store_id, supplier_id, ordered_by, order_date, status)
         VALUES ($1, $2, $3, CURRENT_DATE, 'PENDING') RETURNING *`,
        [storeId, supplier_id, userId]
      );

      const po = poResult.rows[0];

      // Add items
      for (const item of items) {
        await client.query(
          `INSERT INTO purchase_order_items (po_id, variant_id, quantity, unit_cost)
           VALUES ($1, $2, $3, $4)`,
          [po.po_id, item.variant_id, item.quantity, item.unit_cost]
        );
      }

      await client.query('COMMIT');
      res.status(201).json(po);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET PO details with items
router.get('/:poId', async (req, res) => {
  try {
    const { poId } = req.params;

    const poResult = await pool.query(
      `SELECT po.*, s.supplier_name, u.username as ordered_by_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.supplier_id
       LEFT JOIN users u ON po.ordered_by = u.user_id
       WHERE po.po_id = $1`,
      [poId]
    );

    if (poResult.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const itemsResult = await pool.query(
      `SELECT poi.*, p.product_name, pv.sku, s.size_name, c.color_name
       FROM purchase_order_items poi
       JOIN product_variants pv ON poi.variant_id = pv.variant_id
       JOIN products p ON pv.product_id = p.product_id
       LEFT JOIN sizes s ON pv.size_id = s.size_id
       LEFT JOIN colors c ON pv.color_id = c.color_id
       WHERE poi.po_id = $1`,
      [poId]
    );

    res.json({
      ...poResult.rows[0],
      items: itemsResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update PO status
router.put('/:poId/status', async (req, res) => {
  try {
    const storeId = req.store_id;
    const { poId } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'RECEIVED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE purchase_orders SET status = $1 WHERE po_id = $2 AND store_id = $3 RETURNING *`,
      [status, poId, storeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE PO
router.delete('/:poId', async (req, res) => {
  try {
    const storeId = req.store_id;
    const { poId } = req.params;

    const result = await pool.query(
      `DELETE FROM purchase_orders WHERE po_id = $1 AND store_id = $2 RETURNING *`,
      [poId, storeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    res.json({ message: 'Purchase order deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
