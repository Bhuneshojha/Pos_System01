const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const storeMiddleware = require('../middleware/store');

// Middleware validation pipeline
router.use(authMiddleware.verifyToken);
router.use(storeMiddleware.setStore);

// GET ALL SUPPLIERS
router.get('/', async (req, res) => {
    try {
        const storeId = req.store_id || 1; // Fallback safety layer
        const result = await pool.query(`
            SELECT supplier_id, store_id, supplier_name 
            FROM suppliers 
            WHERE store_id = $1 
            ORDER BY supplier_id ASC
        `, [storeId]);
        
        // Return blank array instead of failing if null
        res.json(result.rows || []); 
    } catch (err) {
        console.error("Backend Registry Query Failed:", err.message);
        res.status(500).json({ error: "Database execution failed", details: err.message });
    }
});

// CREATE SUPPLIER
router.post('/', async (req, res) => {
    try {
        const storeId = req.store_id || 1;
        const { supplier_name } = req.body;

        if (!supplier_name || !supplier_name.trim()) {
            return res.status(400).json({ error: "Supplier name parameter is missing" });
        }

        const result = await pool.query(`
            INSERT INTO suppliers (store_id, supplier_name) 
            VALUES ($1, $2) 
            RETURNING supplier_id, store_id, supplier_name
        `, [storeId, supplier_name.trim()]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Insert dropped:", err.message);
        res.status(500).json({ error: "Failed to commit record" });
    }
});

// UPDATE SUPPLIER
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const storeId = req.store_id || 1;
        const { supplier_name } = req.body;

        const result = await pool.query(`
            UPDATE suppliers 
            SET supplier_name = $1 
            WHERE supplier_id = $2 AND store_id = $3
            RETURNING supplier_id, store_id, supplier_name
        `, [supplier_name.trim(), id, storeId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Record link not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Modification rejected" });
    }
});

// DELETE SUPPLIER
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const storeId = req.store_id || 1;

        const result = await pool.query(
            'DELETE FROM suppliers WHERE supplier_id = $1 AND store_id = $2 RETURNING *',
            [id, storeId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Link not found" });
        }
        res.json({ message: "Purged clean" });
    } catch (err) {
        res.status(500).json({ error: "Foreign key lock violation" });
    }
});

module.exports = router;