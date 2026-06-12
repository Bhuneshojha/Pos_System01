const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const storeMiddleware = require('../middleware/store');

const router = express.Router();
const { requireManager } = require('../middleware/roles');

// Require JWT auth and resolve store context for customer routes
router.use(authMiddleware.verifyToken);
router.use(storeMiddleware.setStore);
router.use(requireManager());

// GET all customers
router.get("/", async (req, res) => {
  try {
    const storeId = req.store_id;
    const result = await pool.query(
      "SELECT * FROM customers WHERE store_id = $1 ORDER BY customer_id ASC",
      [storeId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single customer
router.get("/:id", async (req, res) => {
  try {
    const storeId = req.store_id;
    const result = await pool.query(
      "SELECT * FROM customers WHERE customer_id = $1 AND store_id = $2",
      [req.params.id, storeId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Customer not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create customer
router.post("/", async (req, res) => {
  const { first_name, last_name, email, phone, loyalty_points = 0 } = req.body;
  const storeId = req.store_id;
  try {
    const result = await pool.query(
      `INSERT INTO customers (store_id, first_name, last_name, email, phone, loyalty_points)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [storeId, first_name, last_name, email, phone, loyalty_points]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update customer
router.put("/:id", async (req, res) => {
  const { first_name, last_name, email, phone, loyalty_points } = req.body;
  try {
    const storeId = req.store_id;
    const result = await pool.query(
      `UPDATE customers
       SET first_name=$1, last_name=$2, email=$3, phone=$4, loyalty_points=$5
       WHERE customer_id=$6 AND store_id=$7 RETURNING *`,
      [first_name, last_name, email, phone, loyalty_points, req.params.id, storeId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Customer not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE customer
router.delete("/:id", async (req, res) => {
  try {
    const storeId = req.store_id;
    const result = await pool.query(
      "DELETE FROM customers WHERE customer_id = $1 AND store_id = $2 RETURNING *",
      [req.params.id, storeId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Customer not found" });
    res.json({ message: "Customer deleted", customer: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;