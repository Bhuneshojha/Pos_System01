const { pool } = require('../lib/db');
const { verifyAuth } = require('../lib/auth');
const { resolveStoreId } = require('../lib/store');

export default async function handler(req, res) {
  try {
    // 1. Auth & Context
    const user = verifyAuth(req);
    const storeId = resolveStoreId(user, req.headers);
    
    // URL: /api/invoice?saleId=123
    const { saleId } = req.query;

    if (!saleId || isNaN(parseInt(saleId))) {
      return res.status(400).json({ error: "Invalid Sale ID" });
    }

    // 2. Fetch Header Data
    const headerResult = await pool.query(
      `SELECT s.*, c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone 
       FROM sales s LEFT JOIN customers c ON s.customer_id = c.customer_id 
       WHERE s.sale_id = $1 AND s.store_id = $2`, 
      [saleId, storeId]
    );

    if (headerResult.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const saleData = headerResult.rows[0];

    // 3. Fetch Line Items
    const itemsResult = await pool.query(
      `SELECT si.*, p.product_name, pv.sku, sz.size_name, cl.color_name 
       FROM sale_items si 
       JOIN product_variants pv ON si.variant_id = pv.variant_id
       JOIN products p ON pv.product_id = p.product_id
       LEFT JOIN sizes sz ON pv.size_id = sz.size_id
       LEFT JOIN colors cl ON pv.color_id = cl.color_id
       WHERE si.sale_id = $1`, 
      [saleId]
    );

    // 4. Build Payload
    const invoicePayload = {
      ...saleData,
      customer: {
        name: saleData.customer_name || 'Walk-in',
        email: saleData.customer_email,
        phone: saleData.customer_phone
      },
      items: itemsResult.rows.map(item => ({
        ...item,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price)
      }))
    };

    return res.status(200).json(invoicePayload);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}