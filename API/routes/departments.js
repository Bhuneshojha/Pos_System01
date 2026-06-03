const express = require('express');
const router = express.Router();
const pool = require('../db/pool');


// =======================
// GET ALL DEPARTMENTS
// (with store info)
// =======================
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                d.department_id,
                d.department_name,
                s.store_name,
                s.phone AS store_phone,
                s.email AS store_email
            FROM departments d
            LEFT JOIN stores s ON d.store_id = s.store_id
            ORDER BY d.department_id ASC
        `);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =======================
// GET SINGLE DEPARTMENT
// =======================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                d.*,
                s.store_name,
                s.phone,
                s.email
            FROM departments d
            LEFT JOIN stores s ON d.store_id = s.store_id
            WHERE d.department_id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Department not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =======================
// CREATE DEPARTMENT
// =======================
router.post('/', async (req, res) => {
    try {
        const { department_name, store_id } = req.body;

        if (!department_name) {
            return res.status(400).json({
                message: "department_name is required"
            });
        }

        const result = await pool.query(`
            INSERT INTO departments (department_name, store_id)
            VALUES ($1, $2)
            RETURNING *
        `, [department_name, store_id]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =======================
// UPDATE DEPARTMENT
// =======================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { department_name, store_id } = req.body;

        const result = await pool.query(`
            UPDATE departments
            SET 
                department_name = $1,
                store_id = $2
            WHERE department_id = $3
            RETURNING *
        `, [department_name, store_id, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Department not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =======================
// DELETE DEPARTMENT
// =======================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM departments WHERE department_id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Department not found" });
        }

        res.json({ message: "Department deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;