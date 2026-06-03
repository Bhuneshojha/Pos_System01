const express = require('express');
const router = express.Router();
const pool = require('../db/pool'); 
// =======================
// GET ALL BRANDS
// =======================
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM brands ORDER BY brand_id ASC'
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =======================
// GET SINGLE BRAND
// =======================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM brands WHERE brand_id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =======================
// CREATE BRAND
// =======================
router.post('/', async (req, res) => {
    try {
        const { brand_name } = req.body;

        const result = await pool.query(
            'INSERT INTO brands (brand_name) VALUES ($1) RETURNING *',
            [brand_name]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =======================
// UPDATE BRAND
// =======================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { brand_name } = req.body;

        const result = await pool.query(
            'UPDATE brands SET brand_name = $1 WHERE brand_id = $2 RETURNING *',
            [brand_name, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =======================
// DELETE BRAND
// =======================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM brands WHERE brand_id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        res.json({ message: 'Brand deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;