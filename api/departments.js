const { pool } = require('../lib/db');
const { verifyAuth } = require('../lib/auth');
const { requireManager } = require('../lib/roles');
const { resolveStoreId } = require('../lib/store');

export default async function handler(req, res) {
  try {
    // 1. Auth & Context Validation
    const user = verifyAuth(req);
    requireManager(user);
    const storeId = resolveStoreId(user, req.headers);

    // ID nikalne ke liye (e.g., /api/departments?id=1)
    const deptId = req.query.id;

    switch (req.method) {
      case 'GET':
        // GET SINGLE
        if (deptId) {
          const result = await pool.query(
            "SELECT department_id, department_name, store_id FROM departments WHERE department_id = $1 AND store_id = $2",
            [deptId, storeId]
          );
          if (result.rows.length === 0) return res.status(404).json({ message: "Department not found." });
          return res.json(result.rows[0]);
        }
        // GET ALL
        const all = await pool.query(
          "SELECT department_id, department_name, store_id FROM departments WHERE store_id = $1 ORDER BY department_id ASC",
          [storeId]
        );
        return res.json(all.rows || []);

      case 'POST':
        const { department_name } = req.body;
        if (!department_name?.trim()) return res.status(400).json({ message: "Department name is required." });
        
        const ins = await pool.query(
          "INSERT INTO departments (store_id, department_name) VALUES ($1, $2) RETURNING *",
          [storeId, department_name.trim()]
        );
        return res.status(201).json(ins.rows[0]);

      case 'PUT':
        const { department_name: newName } = req.body;
        if (!newName?.trim()) return res.status(400).json({ message: "Name required." });
        
        const up = await pool.query(
          "UPDATE departments SET department_name = $1 WHERE department_id = $2 AND store_id = $3 RETURNING *",
          [newName.trim(), deptId, storeId]
        );
        if (up.rows.length === 0) return res.status(404).json({ message: "Update failed." });
        return res.json(up.rows[0]);

      case 'DELETE':
        const del = await pool.query(
          "DELETE FROM departments WHERE department_id = $1 AND store_id = $2 RETURNING *",
          [deptId, storeId]
        );
        if (del.rows.length === 0) return res.status(404).json({ message: "Department not found." });
        return res.json({ message: "Deleted successfully." });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}