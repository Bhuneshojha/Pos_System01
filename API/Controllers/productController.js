const pool = require('../db/pool');

exports.getProducts = async (req, res) => {
    try {
        const storeId = req.headers['x-store-id'] || 1;
        const result = await pool.query('SELECT * FROM products WHERE store_id = $1', [storeId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createProduct = async (req, res) => {
    const { name, category, price, stock_quantity, sku } = req.body;
    const storeId = req.headers['x-store-id'] || 1;
    await pool.query(
        'INSERT INTO products (store_id, name, category, price, stock_quantity, sku) VALUES ($1, $2, $3, $4, $5, $6)',
        [storeId, name, category, price, stock_quantity, sku]
    );
    res.status(201).json({ message: "Product created" });
};