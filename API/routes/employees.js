const express = require('express');
const router = express.Router();
const pool = require('../db/pool');


// =======================
// GET ALL EMPLOYEES
// (with department + job + manager info)
// =======================
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                e.employee_id,
                e.first_name,
                e.last_name,
                e.email,
                e.phone,
                e.hire_date,
                e.salary,

                d.department_name,
                j.job_title,

                m.first_name AS manager_first_name,
                m.last_name AS manager_last_name

            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.department_id
            LEFT JOIN jobs j ON e.job_id = j.job_id
            LEFT JOIN employees m ON e.manager_id = m.employee_id

            ORDER BY e.employee_id ASC
        `);

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
            WHERE e.employee_id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
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
            job_id
        } = req.body;

        if (!first_name || !last_name || !hire_date) {
            return res.status(400).json({
                message: "first_name, last_name, hire_date are required"
            });
        }

        const result = await pool.query(`
            INSERT INTO employees (
                first_name,
                last_name,
                email,
                phone,
                hire_date,
                salary,
                manager_id,
                department_id,
                job_id
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING *
        `, [
            first_name,
            last_name,
            email,
            phone,
            hire_date,
            salary,
            manager_id,
            department_id,
            job_id
        ]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =======================
// UPDATE EMPLOYEE
// =======================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const {
            first_name,
            last_name,
            email,
            phone,
            hire_date,
            salary,
            manager_id,
            department_id,
            job_id
        } = req.body;

        const result = await pool.query(`
            UPDATE employees
            SET 
                first_name = $1,
                last_name = $2,
                email = $3,
                phone = $4,
                hire_date = $5,
                salary = $6,
                manager_id = $7,
                department_id = $8,
                job_id = $9
            WHERE employee_id = $10
            RETURNING *
        `, [
            first_name,
            last_name,
            email,
            phone,
            hire_date,
            salary,
            manager_id,
            department_id,
            job_id,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
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

        const result = await pool.query(
            'DELETE FROM employees WHERE employee_id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.json({ message: "Employee deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;