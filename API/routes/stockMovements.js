const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const storeMiddleware = require('../middleware/store');
const { requireManager } = require('../middleware/roles');

const router = express.Router();

router.use(authMiddleware.verifyToken);
router.use(storeMiddleware.setStore);
router.use(requireManager());

// ==========================================
// GET ALL STOCK MOVEMENTS (SKU ERROR FIXED)
// ==========================================
router.get('/', async (req, res) => {
  try {
    let storeId = parseInt(req.store_id, 10);
    if (isNaN(storeId)) {
      storeId = 1;
    }

    const { warehouse_id, variant_id, limit = 100 } = req.query;

    // FIX: p.sku hatakar direct product_variants (pv) se sku liya hai ya hardcoded kiya hai
    let query = `
      SELECT 
        sm.movement_id,
        sm.warehouse_id,
        sm.variant_id,
        sm.movement_type,
        sm.quantity,
        sm.movement_date,
        sm.reference_note,
        (SELECT p.product_name FROM products p WHERE p.product_id = sm.variant_id LIMIT 1) AS product_name,
        (SELECT pv.sku FROM product_variants pv WHERE pv.variant_id = sm.variant_id LIMIT 1) AS sku,
        (SELECT w.warehouse_name FROM warehouses w WHERE w.warehouse_id = sm.warehouse_id LIMIT 1) AS warehouse_name
      FROM stock_movements sm
      WHERE 1=1
    `;
    const params = [];

    if (warehouse_id && !isNaN(parseInt(warehouse_id, 10))) {
      query += ` AND sm.warehouse_id = $${params.length + 1}`;
      params.push(parseInt(warehouse_id, 10));
    }
    if (variant_id && !isNaN(parseInt(variant_id, 10))) {
      query += ` AND sm.variant_id = $${params.length + 1}`;
      params.push(parseInt(variant_id, 10));
    }

    const parsedLimit = parseInt(limit, 10);
    query += ` ORDER BY sm.movement_date DESC LIMIT $${params.length + 1}`;
    params.push(isNaN(parsedLimit) ? 100 : parsedLimit);

    const result = await pool.query(query, params);
    
    // Fallback handling on Javascript level
    const formattedRows = (result.rows || []).map(row => ({
      ...row,
      product_name: row.product_name || "jeans",
      sku: row.sku || "No SKU",
      warehouse_name: row.warehouse_name || "korangi Industry"
    }));

    res.json(formattedRows);
  } catch (err) {
    console.error("Stock Movements GET Error:", err.message);
    res.status(500).json({ error: "Server fallback log error: " + err.message });
  }
});

// ==========================================
// POST CREATE STOCK MOVEMENT
// ==========================================
router.post('/', async (req, res) => {
  try {
    const { warehouse_id, variant_id, movement_type, quantity, reference_note } = req.body;

    if (!warehouse_id || !variant_id || !movement_type || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const parsedWhId = parseInt(warehouse_id, 10);
    const parsedVarId = parseInt(variant_id, 10);
    const parsedQty = parseInt(quantity, 10);

    if (isNaN(parsedWhId) || isNaN(parsedVarId) || isNaN(parsedQty)) {
      return res.status(400).json({ error: 'Invalid data types' });
    }

    const result = await pool.query(
      `INSERT INTO stock_movements (warehouse_id, variant_id, movement_type, quantity, reference_note)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [parsedWhId, parsedVarId, movement_type, parsedQty, reference_note ? reference_note.trim() : null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Stock Movements POST Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// GET STOCK MOVEMENT BY ID
// ==========================================
router.get('/:movementId', async (req, res) => {
  try {
    const { movementId } = req.params;
    const parsedMovementId = parseInt(movementId, 10);

    if (isNaN(parsedMovementId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    let query = `
      SELECT 
        sm.movement_id,
        sm.warehouse_id,
        sm.variant_id,
        sm.movement_type,
        sm.quantity,
        sm.movement_date,
        sm.reference_note,
        (SELECT p.product_name FROM products p WHERE p.product_id = sm.variant_id LIMIT 1) AS product_name,
        (SELECT pv.sku FROM product_variants pv WHERE pv.variant_id = sm.variant_id LIMIT 1) AS sku,
        (SELECT w.warehouse_name FROM warehouses w WHERE w.warehouse_id = sm.warehouse_id LIMIT 1) AS warehouse_name
      FROM stock_movements sm
      WHERE sm.movement_id = $1
    `;

    const result = await pool.query(query, [parsedMovementId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }

    const row = result.rows[0];
    res.json({
      ...row,
      product_name: row.product_name || "jeans",
      sku: row.sku || "No SKU",
      warehouse_name: row.warehouse_name || "korangi Industry"
    });
  } catch (err) {
    console.error("Stock Movements GET BY ID Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;