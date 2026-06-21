const { pool } = require('../lib/db');
const { verifyAuth } = require('../lib/auth');
const { requireManager } = require('../lib/roles');
const { resolveStoreId } = require('../lib/store');

export default async function handler(req, res) {
  try {
    // 1. Auth & Context
    const user = verifyAuth(req);
    requireManager(user);
    const storeId = resolveStoreId(user, req.headers);
    const empId = req.query.id; // URL: /api/employees?id=123

    switch (req.method) {
      case 'GET':
        // Metadata (Dropdowns)
        if (req.query.metadata === 'true') {
          const depts = await pool.query('SELECT department_id, department_name FROM departments ORDER BY department_name ASC');
          const jobs = await pool.query('SELECT job_id, job_title FROM jobs ORDER BY job_title ASC');
          return res.json({ departments: depts.rows, jobs: jobs.rows });
        }
        
        // Single Employee
        if (empId) {
          const result = await pool.query(
            `SELECT e.*, d.department_name, j.job_title FROM employees e 
             LEFT JOIN departments d ON e.department_id = d.department_id
             LEFT JOIN jobs j ON e.job_id = j.job_id WHERE e.employee_id = $1 AND e.store_id = $2`, 
            [empId, storeId]
          );
          if (result.rows.length === 0) return res.status(404).json({ message: "Not found" });
          return res.json(result.rows[0]);
        }

        // List All
        const all = await pool.query(
          `SELECT e.*, d.department_name, j.job_title FROM employees e 
           LEFT JOIN departments d ON e.department_id = d.department_id
           LEFT JOIN jobs j ON e.job_id = j.job_id WHERE e.store_id = $1`, [storeId]
        );
        return res.json(all.rows);

      case 'POST':
        const { first_name, last_name, email, phone, hire_date, salary, manager_id, department_id, job_id, status } = req.body;
        const ins = await pool.query(
          `INSERT INTO employees (store_id, first_name, last_name, email, phone, hire_date, salary, manager_id, department_id, job_id, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
          [storeId, first_name, last_name, email, phone, hire_date || new Date(), salary, manager_id, department_id, job_id, status || 'active']
        );
        return res.status(201).json(ins.rows[0]);

      case 'PUT':
        const up = await pool.query(
          `UPDATE employees SET first_name=$1, last_name=$2, email=$3, phone=$4, hire_date=$5, salary=$6, manager_id=$7, department_id=$8, job_id=$9, status=$10 
           WHERE employee_id=$11 AND store_id=$12 RETURNING *`,
          [req.body.first_name, req.body.last_name, req.body.email, req.body.phone, req.body.hire_date, req.body.salary, req.body.manager_id, req.body.department_id, req.body.job_id, req.body.status, empId, storeId]
        );
        return up.rows.length ? res.json(up.rows[0]) : res.status(404).json({ message: "Not found" });

      case 'DELETE':
        const del = await pool.query('DELETE FROM employees WHERE employee_id=$1 AND store_id=$2 RETURNING *', [empId, storeId]);
        return del.rows.length ? res.json({ message: "Deleted" }) : res.status(404).json({ message: "Not found" });

      default:
        return res.status(405).end();
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}