const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db/pool');

const app = express();

app.use(cors({
  origin: [
    'https://cuddly-telegram-v6rqjx79xgvfwvx-5173.app.github.dev',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// =============================
// ROLE SEED
// =============================
const ensureDefaultRoles = async () => {
  const roles = ['admin', 'manager', 'cashier'];
  for (const r of roles) {
    await pool.query(
      `INSERT INTO roles(role_name)
       VALUES($1)
       ON CONFLICT(role_name) DO NOTHING`,
      [r]
    );
  }
};
ensureDefaultRoles().catch(console.error);

// =============================
// ROUTES INDEXATION
// =============================

// 🎯 FIXED: Auth Layer Routing Router Connection Linked (Yeh missing tha jis se login 404 ho raha tha)
// Make sure aapki auth.js file './routes/auth.js' par save ho.
app.use('/api/auth', require('./routes/auth')); 

app.use('/api/brands', require('./routes/brands'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/products-management', require('./routes/products'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/warehouses', require('./routes/warehouses'));
app.use('/api/stock-movements', require('./routes/stockMovements'));
app.use('/api/purchase-orders', require('./routes/purchaseOrders'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/reports', require('./routes/reports'));


// =====================================================
// ✅ SYNCED: MANAGER DASHBOARD ENDPOINT (Forced Array Payload Keys Match)
// =====================================================
app.get('/api/dashboard/manager-metrics', async (req, res) => {
  try {
    const { storeId } = req.query;

    // 1. Revenue Trend (Last 7 days Matrix logs)
    const revenueTrend = await pool.query(`
      SELECT 
        TO_CHAR(sale_date, 'Dy') as day,
        SUM(total_amount)::float as revenue
      FROM sales
      WHERE sale_date >= NOW() - INTERVAL '7 days'
      GROUP BY day
      ORDER BY MIN(sale_date)
    `);

    // 2. Inventory Diagnostics
    const inventory = await pool.query(`
      SELECT 
        SUM(quantity_on_hand) as total_stock,
        SUM(CASE WHEN quantity_on_hand <= reorder_level THEN 1 ELSE 0 END) as low_stock_items
      FROM inventory
    `);

    // 3. Top Sold Products Rows
    const topProducts = await pool.query(`
      SELECT 
        p.product_name,
        SUM(si.quantity)::int as units_sold
      FROM sale_items si
      JOIN product_variants pv ON pv.variant_id = si.variant_id
      JOIN products p ON p.product_id = pv.product_id
      GROUP BY p.product_name
      ORDER BY units_sold DESC
      LIMIT 5
    `);

    // 4. Physical Warehouse Stocks Structure
    const warehouse = await pool.query(`
      SELECT 
        w.warehouse_name,
        SUM(i.quantity_on_hand)::int as stock
      FROM inventory i
      JOIN warehouses w ON w.warehouse_id = i.warehouse_id
      GROUP BY w.warehouse_name
    `);

    // 5. Raw KPI Terminal Accumulations
    const kpi = await pool.query(`
      SELECT 
        COUNT(DISTINCT sale_id)::int as total_sales,
        COALESCE(SUM(total_amount),0)::float as revenue
      FROM sales
    `);

    // 🚀 Exact Matching Response Map (Synced with frontend expectation matrix)
    res.json({
      metrics: {
        activeSkus: Number(inventory.rows[0]?.total_stock) || 0,
        reorderAlerts: Number(inventory.rows[0]?.low_stock_items) || 0,
        totalRevenue: Number(kpi.rows[0]?.revenue) || 0,
        totalOrders: Number(kpi.rows[0]?.total_sales) || 0
      },

      // frontend updates ko secure rakhne ke liye matching objects arrays structure mapping
      salesTrendDistribution: revenueTrend.rows.map(r => ({
        day: r.day,
        revenue: Number(r.revenue)
      })),

      warehouseDistribution: warehouse.rows.map(w => ({
        name: w.warehouse_name,
        stock: Number(w.stock)
      })),

      topProducts: topProducts.rows.map(p => ({
        product_name: p.product_name,
        units_sold: Number(p.units_sold)
      }))
    });

  } catch (err) {
    console.error("Manager metrics runtime engine exception:", err);
    res.status(500).json({ error: "analytics failed" });
  }
});

// =============================
// DASHBOARD (GENERAL)
// =============================
app.get('/api/dashboard', async (req, res) => {
  try {
    const sales = await pool.query(`
      SELECT COALESCE(SUM(total_amount),0) total FROM sales
    `);

    const tax = await pool.query(`
      SELECT COALESCE(SUM(tax_amount),0) tax FROM sales
    `);

    const stock = await pool.query(`
      SELECT COALESCE(SUM(quantity_on_hand),0) stock FROM inventory
    `);

    const staff = await pool.query(`
      SELECT COUNT(*) staff FROM employees
    `);

    res.json({
      kpiCards: {
        total_sales: sales.rows[0].total,
        total_tax: tax.rows[0].tax,
        inventory: stock.rows[0].stock,
        staff: staff.rows[0].staff
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "dashboard failed" });
  }
});


// =============================
// PRODUCTS (FIXED JOIN SAFETY)
// =============================
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        pv.variant_id,
        p.product_name,
        pv.sku,
        pv.selling_price AS price,
        i.quantity_on_hand AS stock
      FROM product_variants pv
      JOIN products p ON p.product_id = pv.product_id
      JOIN inventory i ON i.variant_id = pv.variant_id
      WHERE p.is_active = true
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "products failed" });
  }
});


// =============================
// CHECKOUT (FIXED SAFETY)
// =============================
app.post('/api/checkout', async (req, res) => {
  const client = await pool.connect();

  try {
    const { items = [], customer_id, cashier_id } = req.body;

    if (!items.length) {
      return res.status(400).json({ error: "Cart empty" });
    }

    await client.query('BEGIN');

    let total = 0;

    for (const item of items) {
      const stock = await client.query(`
        SELECT quantity_on_hand, selling_price
        FROM inventory i
        JOIN product_variants pv ON pv.variant_id = i.variant_id
        WHERE i.variant_id = $1
      `, [item.variant_id]);

      if (!stock.rows.length) throw new Error("Invalid item");

      if (stock.rows[0].quantity_on_hand < item.quantity) {
        throw new Error("Insufficient stock");
      }

      total += stock.rows[0].selling_price * item.quantity;
    }

    const tax = total * 0.05;

    const sale = await client.query(`
      INSERT INTO sales(customer_id, cashier_id, subtotal, tax_amount, total_amount)
      VALUES($1,$2,$3,$4,$5)
      RETURNING sale_id
    `, [customer_id, cashier_id || 1, total, tax, total + tax]);

    for (const item of items) {
      await client.query(`
        INSERT INTO sale_items(sale_id, variant_id, quantity, unit_price, line_total)
        VALUES($1,$2,$3,$4,$5)
      `, [sale.rows[0].sale_id, item.variant_id, item.quantity, item.price, item.price * item.quantity]);

      await client.query(`
        UPDATE inventory
        SET quantity_on_hand = quantity_on_hand - $1
        WHERE variant_id = $2
      `, [item.quantity, item.variant_id]);
    }

    await client.query('COMMIT');

    res.json({ success: true, saleId: sale.rows[0].sale_id });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});


// =============================
app.get('/', (req, res) => {
  res.send('Arbex POS Engine API running');
});

// Codespaces dynamic or standard local environment selection
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});