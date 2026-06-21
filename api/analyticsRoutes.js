const { pool } = require('../lib/db');
const { verifyAuth } = require('../lib/auth');
const { requireManager } = require('../lib/roles');

export default async function handler(req, res) {
  try {
    const user = verifyAuth(req);
    requireManager(user);
    
    // Type identify karne ke liye (e.g., /api/analytics?type=kpi)
    const { type } = req.query;

    switch (type) {
      case 'kpi':
        const kpiResult = await pool.query(`
          SELECT 
            (SELECT COALESCE(SUM(total_amount), 0)::text FROM sales) as total_sales,
            (SELECT COUNT(*) FROM users WHERE is_active = true)::text as staff_count
        `);
        return res.json(kpiResult.rows[0]);

      case 'charts':
        // Run all queries in parallel for speed
        const [revenue, categories, traffic] = await Promise.all([
          pool.query("SELECT TO_CHAR(sale_date, 'Mon') as date, SUM(total_amount)::float as Sales FROM sales GROUP BY TO_CHAR(sale_date, 'Mon') LIMIT 6"),
          pool.query("SELECT c.category_name as name, COUNT(si.sale_item_id)::int as value FROM sale_items si JOIN products p ON ... GROUP BY c.category_name LIMIT 4"),
          pool.query("SELECT TO_CHAR(sale_date, 'HH12 AM') as hour, COUNT(*)::int as Orders FROM sales WHERE sale_date >= CURRENT_DATE GROUP BY hour")
        ]);
        return res.json({ revenue: revenue.rows, categories: categories.rows, traffic: traffic.rows });

      case 'tables':
        // Mixed tables log data
        const logs = await pool.query("SELECT sale_id, total_amount, TO_CHAR(sale_date, 'HH:MI AM') as time FROM sales ORDER BY sale_date DESC LIMIT 10");
        return res.json(logs.rows);

      default:
        return res.status(400).json({ error: "Invalid analytics type" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}