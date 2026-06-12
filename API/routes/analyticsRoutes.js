// routes/analytics.js
const express = require('express');
const router = express.Router();
// Note the path: We go up one level (..) to get to the db folder
const pool = require('../db/pool'); 

// ==========================================
// 1. KPI CARDS (Top 4 Numbers)
// ==========================================
router.get('/kpi', async (req, res) => {
  try {
    const query = `
      SELECT 
        (SELECT COALESCE(TO_CHAR(SUM(total_amount), 'FM999,999,999'), '0') || ' PKR' FROM sales) as total_sales,
        (SELECT COALESCE(TO_CHAR(SUM(iv.quantity_on_hand * pv.cost_price), 'FM999,999,999'), '0') || ' PKR' 
         FROM inventory iv 
         JOIN product_variants pv ON iv.variant_id = pv.variant_id) as inventory_val,
        (SELECT COALESCE(TO_CHAR(SUM(tax_amount), 'FM999,999,999'), '0') || ' PKR' FROM sales) as total_tax,
        (SELECT COUNT(*)::text FROM users WHERE is_active = true) as staff_count
    `;
    const result = await pool.query(query);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("KPI Error:", err.message);
    res.status(500).send('Server Error fetching KPIs');
  }
});

// ==========================================
// 2. CHARTS DATA (Revenue, Categories, etc.)
// ==========================================
router.get('/charts', async (req, res) => {
  try {
    // A. Revenue Trend (Last 6 months)
    const revenueQuery = `
      SELECT TO_CHAR(sale_date, 'Mon') as date, SUM(total_amount)::float as Sales
      FROM sales
      WHERE sale_date >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(sale_date, 'Mon'), EXTRACT(MONTH FROM sale_date)
      ORDER BY EXTRACT(MONTH FROM sale_date)
      LIMIT 6
    `;

    // B. Category Share
    const categoryQuery = `
      SELECT c.category_name as name, COUNT(si.sale_item_id)::int as value
      FROM sale_items si
      JOIN product_variants pv ON si.variant_id = pv.variant_id
      JOIN products p ON pv.product_id = p.product_id
      JOIN categories c ON p.category_id = c.category_id
      GROUP BY c.category_name
      ORDER BY value DESC
      LIMIT 4
    `;

    // C. Hourly Traffic
    const trafficQuery = `
      SELECT TO_CHAR(sale_date, 'HH12 AM') as hour, COUNT(*)::int as Orders
      FROM sales
      WHERE sale_date >= CURRENT_DATE
      GROUP BY hour
      ORDER BY MIN(sale_date)
    `;

    // D. Weekly Targets (Mocking percentage based on weekly sales volume)
    const targetsQuery = `
      SELECT 'Week ' || TO_CHAR(EXTRACT(WEEK FROM sale_date), 'FM00') as month, 
             SUM(total_amount)::float as TargetReached
      FROM sales
      WHERE sale_date >= DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY EXTRACT(WEEK FROM sale_date)
      ORDER BY month
    `;

    // Run all queries in parallel
    const [revenueRes, categoryRes, trafficRes, targetsRes] = await Promise.all([
      pool.query(revenueQuery),
      pool.query(categoryQuery),
      pool.query(trafficQuery),
      pool.query(targetsQuery)
    ]);

    res.json({
      revenue: revenueRes.rows,
      categories: categoryRes.rows,
      traffic: trafficRes.rows,
      // Scaling the raw numbers to look like a percentage for the chart (0-100)
      targets: targetsRes.rows.map(row => ({ ...row, TargetReached: Math.floor(row.targetreached / 10000) })) 
    });

  } catch (err) {
    console.error("Charts Error:", err.message);
    res.status(500).send('Server Error fetching Charts');
  }
});

// ==========================================
// 3. RECENT SALES LOG (For the Table)
// ==========================================
router.get('/sales-log', async (req, res) => {
  try {
    const query = `
      SELECT 
        s.sale_id as id, 
        TO_CHAR(s.sale_date, 'HH12:MI AM') as time, 
        'PKR ' || TO_CHAR(s.total_amount, 'FM999,999') as total, 
        'PKR ' || TO_CHAR(s.tax_amount, 'FM999') as tax, 
        COALESCE(pm.method_name, 'Pending') as method
      FROM sales s
      LEFT JOIN payments p ON s.sale_id = p.sale_id
      LEFT JOIN payment_methods pm ON p.payment_method_id = pm.payment_method_id
      ORDER BY s.sale_date DESC
      LIMIT 10
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Sales Log Error:", err.message);
    res.status(500).send('Server Error fetching Sales Log');
  }
});

// ==========================================
// 4. STAFF LIST (For the Table)
// ==========================================
router.get('/staff', async (req, res) => {
  try {
    const query = `
      SELECT 
        CONCAT(e.first_name, ' ', e.last_name) as name, 
        r.role_name as role, 
        e.email, 
        CASE WHEN u.is_active = true THEN 'Active' ELSE 'Suspended' END as status
      FROM users u
      JOIN employees e ON u.employee_id = e.employee_id
      JOIN roles r ON u.role_id = r.role_id
      ORDER BY u.user_id
      LIMIT 10
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Staff Error:", err.message);
    res.status(500).send('Server Error fetching Staff');
  }
});

// ==========================================
// 5. OPERATIONAL LOGS (Stock Movements)
// ==========================================
router.get('/operations', async (req, res) => {
  try {
    const query = `
      SELECT 
        TO_CHAR(movement_date, 'HH12:MI:SS AM') as timestamp, 
        'INVENTORY' as module, 
        movement_type || ': ' || COALESCE(reference_note, 'Manual') as event, 
        movement_type as type
      FROM stock_movements
      ORDER BY movement_date DESC
      LIMIT 10
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Operations Error:", err.message);
    res.status(500).send('Server Error fetching Operations');
  }
});

module.exports = router;