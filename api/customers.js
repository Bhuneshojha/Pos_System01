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

    // 2. Extract ID from query (e.g., /api/customers?id=1)
    const customerId = req.query.id;

    switch (req.method) {
      case 'GET':
        if (customerId) {
          const result = await pool.query(
            "SELECT * FROM customers WHERE customer_id = $1 AND store_id = $2",
            [customerId, storeId]
          );
          if (result.rows.length === 0) return res.status(404).json({ error: "Customer not found" });
          return res.json(result.rows[0]);
        }
        const all = await pool.query("SELECT * FROM customers WHERE store_id = $1 ORDER BY customer_id ASC", [storeId]);
        return res.json(all.rows);

      case 'POST':
        const { first_name, last_name, email, phone, loyalty_points = 0 } = req.body;
        const insert = await pool.query(
          `INSERT INTO customers (store_id, first_name, last_name, email, phone, loyalty_points)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [storeId, first_name, last_name, email, phone, loyalty_points]
        );
        return res.status(201).json(insert.rows[0]);

      case 'PUT':
        const { first_name: fn, last_name: ln, email: em, phone: ph, loyalty_points: lp } = req.body;
        const update = await pool.query(
          `UPDATE customers SET first_name=$1, last_name=$2, email=$3, phone=$4, loyalty_points=$5
           WHERE customer_id=$6 AND store_id=$7 RETURNING *`,
          [fn, ln, em, ph, lp, customerId, storeId]
        );
        if (update.rows.length === 0) return res.status(404).json({ error: "Customer not found" });
        return res.json(update.rows[0]);

      case 'DELETE':
        const del = await pool.query(
          "DELETE FROM customers WHERE customer_id = $1 AND store_id = $2 RETURNING *",
          [customerId, storeId]
        );
        if (del.rows.length === 0) return res.status(404).json({ error: "Customer not found" });
        return res.json({ message: "Customer deleted", customer: del.rows[0] });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}