const { pool } = require('../lib/db');
const { verifyAuth } = require('../lib/auth');
const { requireManager } = require('../lib/roles');
const { resolveStoreId } = require('../lib/store');

export default async function handler(req, res) {
  try {
    // 1. Auth & Context Validation (Middleware substitute)
    const user = verifyAuth(req);
    requireManager(user);
    const storeId = resolveStoreId(user, req.headers);

    // 2. Routing logic (Replacing Router)
    switch (req.method) {
      case 'GET':
        // Agar ID URL ke saath hai (e.g., /api/products?id=1)
        if (req.query.id) {
          const result = await pool.query(`
            SELECT p.*, c.category_name, b.brand_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            WHERE p.product_id = $1 AND p.store_id = $2
          `, [req.query.id, storeId]);
          
          if (result.rows.length === 0) return res.status(404).json({ message: "Product not found" });
          return res.json(result.rows[0]);
        }
        
        // GET ALL
        const all = await pool.query(`
            SELECT p.*, c.category_name, b.brand_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            WHERE p.store_id = $1 ORDER BY p.product_id ASC
        `, [storeId]);
        return res.json(all.rows);

      case 'POST':
        const { product_name, description, base_price, category_id, brand_id } = req.body;
        const newProd = await pool.query(
          'INSERT INTO products (store_id, product_name, description, base_price, category_id, brand_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [storeId, product_name, description, base_price, category_id, brand_id]
        );
        return res.status(201).json(newProd.rows[0]);

      case 'PUT':
        const { id, is_active } = req.body; // Assume ID comes in body for PUT
        const updated = await pool.query(
          'UPDATE products SET product_name=$1, description=$2, base_price=$3, category_id=$4, brand_id=$5, is_active=$6 WHERE product_id=$7 AND store_id=$8 RETURNING *',
          [req.body.product_name, req.body.description, req.body.base_price, req.body.category_id, req.body.brand_id, is_active, id, storeId]
        );
        if (updated.rows.length === 0) return res.status(404).json({ message: "Product not found" });
        return res.json(updated.rows[0]);

      case 'DELETE':
        const deleted = await pool.query('DELETE FROM products WHERE product_id=$1 AND store_id=$2 RETURNING *', [req.query.id, storeId]);
        if (deleted.rows.length === 0) return res.status(404).json({ message: "Product not found" });
        return res.json({ message: "Product deleted successfully" });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}