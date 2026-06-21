const { pool } = require('../lib/db');
const { verifyAuth } = require('../lib/auth');
const { requireManager } = require('../lib/roles');
const { resolveStoreId } = require('../lib/store');

export default async function handler(req, res) {
  try {
    const user = verifyAuth(req);
    requireManager(user);
    const storeId = resolveStoreId(user, req.headers);

    // Report ka type decide karein (URL: /api/reports?type=sales_summary)
    const { type, start_date, end_date } = req.query;

    switch (type) {
      case 'sales_summary':
        const sales = await pool.query(
          `SELECT sale_date::date, SUM(total_amount) as total_revenue, COUNT(*) as order_count 
           FROM sales 
           WHERE store_id = $1 AND sale_date BETWEEN $2 AND $3
           GROUP BY sale_date::date ORDER BY sale_date DESC`,
          [storeId, start_date || '2026-01-01', end_date || '2026-12-31']
        );
        return res.json(sales.rows);

      case 'stock_valuation':
        // Inventory value report
        const stock = await pool.query(
          `SELECT p.product_name, SUM(i.quantity_on_hand) as total_qty, 
                  SUM(i.quantity_on_hand * pv.cost_price) as total_value
           FROM inventory i
           JOIN product_variants pv ON i.variant_id = pv.variant_id
           JOIN products p ON pv.product_id = p.product_id
           WHERE i.store_id = $1
           GROUP BY p.product_name`, [storeId]
        );
        return res.json(stock.rows);

      case 'tax_report':
        const tax = await pool.query(
          `SELECT invoice_number, total_amount, tax_amount, sale_date 
           FROM sales WHERE store_id = $1 ORDER BY sale_date DESC`,
          [storeId]
        );
        return res.json(tax.rows);

      default:
        return res.status(400).json({ error: "Invalid report type requested" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}