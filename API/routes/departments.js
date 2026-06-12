const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const storeMiddleware = require('../middleware/store');
const { requireManager } = require('../middleware/roles');

// Application Global Request Stack Rules
router.use(authMiddleware.verifyToken);
router.use(storeMiddleware.setStore);
router.use(requireManager());

// ==========================================
// GET ALL DEPARTMENTS
// ==========================================
// ==========================================
router.get('/', async (req, res) => {
    try {
        // Agar store_id string hai (e.g. "1" ya "default-store"), use safe number banayein
        let storeId = parseInt(req.store_id, 10);
        
        // Agar parsing fail ho jaye ya fallback value chahiye ho (Jaise aapke default-store ke liye id 1 hai)
        if (isNaN(storeId)) {
            console.warn("Warning: store_id was not a number, falling back to 1.");
            storeId = 1; 
        }

        const result = await pool.query(`
            SELECT 
                department_id,
                department_name,
                store_id
            FROM departments
            WHERE store_id = $1
            ORDER BY department_id ASC
        `, [storeId]);
        
        return res.json(result.rows || []);
    } catch (err) {
        console.error("Database connection failure on Departments fetch:", err.message);
        return res.status(500).json({ error: "Database transaction failed: " + err.message });
    }
});
// ==========================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const storeId = req.store_id;

        const result = await pool.query(`
            SELECT department_id, department_name, store_id 
            FROM departments 
            WHERE department_id = $1 AND store_id = $2
        `, [id, storeId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Department records not found." });
        }

        return res.json(result.rows[0]);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ==========================================
// CREATE DEPARTMENT
// ==========================================
router.post('/', async (req, res) => {
    try {
        const { department_name } = req.body;
        const storeId = req.store_id;

        if (!department_name || !department_name.trim()) {
            return res.status(400).json({ message: "Department name is required." });
        }

        const result = await pool.query(`
            INSERT INTO departments (store_id, department_name)
            VALUES ($1, $2)
            RETURNING *
        `, [storeId, department_name.trim()]);

        return res.status(201).json(result.rows[0]);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ==========================================
// UPDATE DEPARTMENT
// ==========================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { department_name } = req.body;
        const storeId = req.store_id;

        if (!department_name || !department_name.trim()) {
            return res.status(400).json({ message: "Department name cannot be empty." });
        }

        const result = await pool.query(`
            UPDATE departments
            SET department_name = $1
            WHERE department_id = $2 AND store_id = $3
            RETURNING *
        `, [department_name.trim(), id, storeId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Department update targeting failed." });
        }

        return res.json(result.rows[0]);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ==========================================
// DELETE DEPARTMENT
// ==========================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const storeId = req.store_id;

        const result = await pool.query(
            'DELETE FROM departments WHERE department_id = $1 AND store_id = $2 RETURNING *',
            [id, storeId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Department not found." });
        }

        return res.json({ message: "Department deleted successfully." });
    } catch (err) {
        return res.status(500).json({ 
            error: "Cannot delete department while staff members are assigned to it." 
        });
    }
});

module.exports = router;