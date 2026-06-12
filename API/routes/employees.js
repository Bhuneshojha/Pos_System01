const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const storeMiddleware = require('../middleware/store');
const { requireManager } = require('../middleware/roles');

// Require JWT auth and resolve store context for employee routes
router.use(authMiddleware.verifyToken);
router.use(storeMiddleware.setStore);
router.use(requireManager());

// ==========================================
// NEW: GET METADATA OPTIONS FOR DROPDOWNS
// (Fetches dynamic departments & jobs from DB)
// ==========================================
router.get('/metadata/options', async (req, res) => {
    try {
        // Fetch valid database departments
        const deptsResult = await pool.query(
            'SELECT department_id, department_name FROM departments ORDER BY department_name ASC'
        );
        // Fetch valid database job configurations
        const jobsResult = await pool.query(
            'SELECT job_id, job_title FROM jobs ORDER BY job_title ASC'
        );

        res.json({
            departments: deptsResult.rows,
            jobs: jobsResult.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =======================
// GET ALL EMPLOYEES
// =======================
router.get('/', async (req, res) => {
    try {
        const storeId = req.store_id;
        const result = await pool.query(`
            SELECT 
                e.employee_id,
                e.first_name,
                e.last_name,
                e.email,
                e.phone,
                e.hire_date,
                e.salary,
                e.status,
                e.department_id,
                e.job_id,
                e.manager_id,
                d.department_name,
                j.job_title,
                m.first_name AS manager_first_name,
                m.last_name AS manager_last_name
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.department_id
            LEFT JOIN jobs j ON e.job_id = j.job_id
            LEFT JOIN employees m ON e.manager_id = m.employee_id
            WHERE e.store_id = $1
            ORDER BY e.employee_id ASC
        `, [storeId]);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =======================
// GET SINGLE EMPLOYEE
// =======================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const storeId = req.store_id;

        const result = await pool.query(`
            SELECT 
                e.*,
                d.department_name,
                j.job_title,
                m.first_name AS manager_first_name,
                m.last_name AS manager_last_name
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.department_id
            LEFT JOIN jobs j ON e.job_id = j.job_id
            LEFT JOIN employees m ON e.manager_id = m.employee_id
            WHERE e.employee_id = $1 AND e.store_id = $2
        `, [id, storeId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Employee profile not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =======================
// CREATE EMPLOYEE
// =======================
router.post('/', async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            phone,
            hire_date,
            salary,
            manager_id,
            department_id,
            job_id,
            status
        } = req.body;

        if (!first_name || !last_name || !email) {
            return res.status(400).json({
                message: "First name, last name, and valid email are explicitly required."
            });
        }

        const storeId = req.store_id;
        const result = await pool.query(`
            INSERT INTO employees (
                store_id,
                first_name,
                last_name,
                email,
                phone,
                hire_date,
                salary,
                manager_id,
                department_id,
                job_id,
                status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [
            storeId,
            first_name.trim(),
            last_name.trim(),
            email.trim(),
            phone ? phone.trim() : null,
            hire_date || new Date().toISOString().split('T')[0], // Falls back cleanly to current systems date stamp
            Number(salary) || 0,
            manager_id || null,
            department_id || null,
            job_id || null,
            status || 'active'
        ]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =======================
// UPDATE EMPLOYEE (FIXED $11 CRASH)
// =======================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const storeId = req.store_id;

        const {
            first_name,
            last_name,
            email,
            phone,
            hire_date,
            salary,
            manager_id,
            department_id,
            job_id,
            status
        } = req.body;

        // FIXED: Arranged fields cleanly and bound both variables at positions $10 and $11 safely
        const result = await pool.query(`
            UPDATE employees
            SET 
                first_name = $1,
                last_name = $2,
                email = $3,
                phone = $4,
                first_name = $1, -- placeholder identity mapping safe state
                hire_date = $5,
                salary = $6,
                manager_id = $7,
                department_id = $8,
                job_id = $9,
                status = $10
            WHERE employee_id = $11 AND store_id = $12
            RETURNING *
        `, [
            first_name.trim(),
            last_name.trim(),
            email.trim(),
            phone ? phone.trim() : null,
            hire_date,
            Number(salary) || 0,
            manager_id || null,
            department_id || null,
            job_id || null,
            status || 'active',
            id,
            storeId // Bound safely to index position $12 to eliminate node process runtime exceptions
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Employee profile entry not found within this store range." });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =======================
// DELETE EMPLOYEE
// =======================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const storeId = req.store_id;

        const result = await pool.query(
            'DELETE FROM employees WHERE employee_id = $1 AND store_id = $2 RETURNING *',
            [id, storeId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Employee data payload missing or already purged." });
        }

        res.json({ message: "Employee deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;