
const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const storeMiddleware = require('../middleware/store');
const { requireAdmin } = require('../middleware/roles');

const router = express.Router();

// Require JWT auth then enforce store context for all category routes
router.use(authMiddleware.verifyToken);
router.use(storeMiddleware.setStore);
router.use(requireAdmin());


// GET all categories (tenant-scoped)
router.get("/", async (req, res) => {
  try {
    const storeId = req.store_id;
    const result = await pool.query(
      "SELECT * FROM categories WHERE store_id = $1 ORDER BY category_id ASC",
      [storeId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single category (tenant-scoped)
router.get("/:id", async (req, res) => {
  try {
    const storeId = req.store_id;
    const result = await pool.query(
      "SELECT * FROM categories WHERE category_id = $1 AND store_id = $2",
      [req.params.id, storeId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Category not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create category (tenant-scoped)
router.post("/", async (req, res) => {
  const { category_name } = req.body;
  if (!category_name)
    return res.status(400).json({ error: "category_name is required" });
  try {
    const storeId = req.store_id;
    const result = await pool.query(
      "INSERT INTO categories (store_id, category_name) VALUES ($1, $2) RETURNING *",
      [storeId, category_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505")
      return res.status(409).json({ error: "Category name already exists" });
    res.status(500).json({ error: err.message });
  }
});

// PUT update category (tenant-scoped)
router.put("/:id", async (req, res) => {
  const { category_name } = req.body;
  if (!category_name)
    return res.status(400).json({ error: "category_name is required" });
  try {
    const storeId = req.store_id;
    const result = await pool.query(
      "UPDATE categories SET category_name = $1 WHERE category_id = $2 AND store_id = $3 RETURNING *",
      [category_name, req.params.id, storeId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Category not found" });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505")
      return res.status(409).json({ error: "Category name already exists" });
    res.status(500).json({ error: err.message });
  }
});

// DELETE category (tenant-scoped)
router.delete("/:id", async (req, res) => {
  try {
    const storeId = req.store_id;
    const result = await pool.query(
      "DELETE FROM categories WHERE category_id = $1 AND store_id = $2 RETURNING *",
      [req.params.id, storeId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Category not found" });
    res.json({ message: "Category deleted", category: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;