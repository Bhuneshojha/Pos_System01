const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// =======================
// SALES REPORT (FIXED)
// =======================
router.get('/sales', async (req, res) => {
  const { storeId, startDate, endDate } = req.query;

  try {
    let query = `
      SELECT 
        COUNT(sale_id) AS total_orders,
        COALESCE(SUM(subtotal), 0) AS gross_revenue,
        COALESCE(SUM(tax_amount), 0) AS total_tax,
        COALESCE(SUM(discount_amount), 0) AS total_discounts,
        COALESCE(SUM(total_amount), 0) AS net_sales
      FROM sales
      WHERE 1=1
    `;

    const params = [];

    if (storeId) {
      params.push(storeId);
      query += ` AND store_id = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      query += ` AND sale_date >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate + ' 23:59:59');
      query += ` AND sale_date <= $${params.length}`;
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: [result.rows[0]]
    });

  } catch (err) {
    console.error('Sales Report Error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


// =======================
// INVENTORY REPORT (FIXED)
// =======================
router.get('/inventory', async (req, res) => {
  const { storeId } = req.query;

  try {
    let query = `
      SELECT 
        p.product_name,
        pv.sku,
        pv.selling_price,
        COALESCE(i.quantity_on_hand, 0) AS stock,
        w.warehouse_name
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.product_id
      LEFT JOIN inventory i ON pv.variant_id = i.variant_id
      LEFT JOIN warehouses w ON i.warehouse_id = w.warehouse_id
    `;

    const params = [];

    if (storeId) {
      params.push(storeId);
      query += ` WHERE p.store_id = $1`;
    }

    query += ` ORDER BY p.product_name ASC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error('Inventory Report Error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


// =======================
// CUSTOMER REPORT (FIXED)
// =======================
router.get('/customers', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.customer_id,
        c.first_name || ' ' || c.last_name AS customer_name,
        c.phone,
        COUNT(s.sale_id) AS total_purchases,
        COALESCE(SUM(s.total_amount), 0) AS total_spent
      FROM customers c
      LEFT JOIN sales s ON c.customer_id = s.customer_id
      GROUP BY c.customer_id
      ORDER BY total_spent DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error('Customer Report Error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;