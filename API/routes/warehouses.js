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
// GET ALL WAREHOUSES (SAFE INTEGER CHECK)
// ==========================================
router.get('/', async (req, res) => {
  try {
    // String checking parsing to make integer valid for database queries
    let storeId = parseInt(req.store_id, 10);
    if (isNaN(storeId)) {
      console.warn("Warning: store_id was not a valid integer. Falling back to 1.");
      storeId = 1; 
    }

    const result = await pool.query(
      `SELECT w.*, l.street_address, l.city, l.state_province
       FROM warehouses w
       LEFT JOIN locations l ON w.location_id = l.location_id
       WHERE w.store_id = $1 ORDER BY w.warehouse_name ASC`,
      [storeId]
    );
    res.json(result.rows || []);
  } catch (err) {
    console.error("Warehouse GET Error:", err.message);
    res.status(500).json({ error: "Database layout breakdown: " + err.message });
  }
});

// ==========================================
// POST CREATE WAREHOUSE
// ==========================================
router.post('/', async (req, res) => {
  try {
    let storeId = parseInt(req.store_id, 10);
    if (isNaN(storeId)) storeId = 1;

    const { warehouse_name, location_id } = req.body;

    if (!warehouse_name || !warehouse_name.trim()) {
      return res.status(400).json({ error: 'Warehouse name is required' });
    }

    // Safely parse integer location id or fallback to null structure
    const parsedLocationId = location_id ? parseInt(location_id, 10) : null;

    const result = await pool.query(
      `INSERT INTO warehouses (store_id, warehouse_name, location_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [storeId, warehouse_name.trim(), isNaN(parsedLocationId) ? null : parsedLocationId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PUT UPDATE WAREHOUSE
// ==========================================
router.put('/:warehouseId', async (req, res) => {
  try {
    let storeId = parseInt(req.store_id, 10);
    if (isNaN(storeId)) storeId = 1;

    const { warehouseId } = req.params;
    const { warehouse_name, location_id } = req.body;

    const parsedLocationId = location_id ? parseInt(location_id, 10) : null;

    const result = await pool.query(
      `UPDATE warehouses SET warehouse_name = $1, location_id = $2
       WHERE warehouse_id = $3 AND store_id = $4 RETURNING *`,
      [warehouse_name.trim(), isNaN(parsedLocationId) ? null : parsedLocationId, warehouseId, storeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Warehouse target matrix not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// DELETE WAREHOUSE
// ==========================================
router.delete('/:warehouseId', async (req, res) => {
  try {
    let storeId = parseInt(req.store_id, 10);
    if (isNaN(storeId)) storeId = 1;

    const { warehouseId } = req.params;

    const result = await pool.query(
      `DELETE FROM warehouses WHERE warehouse_id = $1 AND store_id = $2 RETURNING *`,
      [warehouseId, storeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Warehouse asset entity missing' });
    }

    res.json({ message: 'Warehouse deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: "Cannot delete warehouse due to constraint dependency logs." });
  }
});

// ==========================================
// GET WAREHOUSE INVENTORY
// ==========================================
router.get('/:warehouseId/inventory', async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const result = await pool.query(
      `SELECT i.*, p.product_name, pv.sku, s.size_name, c.color_name
       FROM inventory i
       JOIN product_variants pv ON i.variant_id = pv.variant_id
       JOIN products p ON pv.product_id = p.product_id
       LEFT JOIN sizes s ON pv.size_id = s.size_id
       LEFT JOIN colors c ON pv.color_id = c.color_id
       WHERE i.warehouse_id = $1 ORDER BY p.product_name ASC`,
      [warehouseId]
    );
    res.json(result.rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;