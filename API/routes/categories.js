const express = require('express');
const router = express.Router();
const pool = require('../db/pool');


// =======================
// GET ALL CATEGORIES
// =======================
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM categories ORDER BY category_id ASC'
        );

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =======================
// GET CATEGORY BY ID
// =======================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM categories WHERE category_id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =======================
// CREATE CATEGORY
// =======================
router.post('/', async (req, res) => {
    try {
        const { category_name } = req.body;

        if (!category_name) {
            return res.status(400).json({ message: "category_name is required" });
        }

        const result = await pool.query(
            `INSERT INTO categories (category_name)
             VALUES ($1)
             RETURNING *`,
            [category_name]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =======================
// UPDATE CATEGORY
// =======================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { category_name } = req.body;

        const result = await pool.query(
            `UPDATE categories
             SET category_name = $1
             WHERE category_id = $2
             RETURNING *`,
            [category_name, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =======================
// DELETE CATEGORY
// =======================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM categories WHERE category_id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json({ message: "Category deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;