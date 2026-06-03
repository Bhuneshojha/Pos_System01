const express = require('express');
const router = express.Router();
const pool = require('../db/pool');


// =======================
// GET ALL PRODUCTS
// (with category + brand names)
// =======================
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.product_id,
                p.product_name,
                p.description,
                p.base_price,
                p.is_active,
                p.created_at,
                c.category_name,
                b.brand_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            ORDER BY p.product_id ASC
        `);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =======================
// GET PRODUCT BY ID
// =======================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                p.product_id,
                p.product_name,
                p.description,
                p.base_price,
                p.is_active,
                p.created_at,
                c.category_name,
                b.brand_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            WHERE p.product_id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =======================
// CREATE PRODUCT
// =======================
router.post('/', async (req, res) => {
    try {
        const {
            product_name,
            description,
            base_price,
            category_id,
            brand_id
        } = req.body;

        const result = await pool.query(`
            INSERT INTO products 
            (product_name, description, base_price, category_id, brand_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [
            product_name,
            description,
            base_price,
            category_id,
            brand_id
        ]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =======================
// UPDATE PRODUCT
// =======================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const {
            product_name,
            description,
            base_price,
            category_id,
            brand_id,
            is_active
        } = req.body;

        const result = await pool.query(`
            UPDATE products
            SET 
                product_name = $1,
                description = $2,
                base_price = $3,
                category_id = $4,
                brand_id = $5,
                is_active = $6
            WHERE product_id = $7
            RETURNING *
        `, [
            product_name,
            description,
            base_price,
            category_id,
            brand_id,
            is_active,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =======================
// DELETE PRODUCT
// =======================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM products WHERE product_id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;