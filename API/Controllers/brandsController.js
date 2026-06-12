const pool = require("../db/pool");

// GET ALL (tenant-scoped)
const getBrands = async (req, res) => {
  try {
    const storeId = req.store_id;
    const result = await pool.query("SELECT * FROM brands WHERE store_id = $1 ORDER BY brand_id ASC", [storeId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE (tenant-scoped)
const createBrand = async (req, res) => {
  try {
    const storeId = req.store_id;
    const { brand_name } = req.body;

    const result = await pool.query(
      "INSERT INTO brands (store_id, brand_name) VALUES ($1, $2) RETURNING *",
      [storeId, brand_name]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE (tenant-scoped)
const updateBrand = async (req, res) => {
  try {
    const storeId = req.store_id;
    const { id } = req.params;
    const { brand_name } = req.body;

    const result = await pool.query(
      "UPDATE brands SET brand_name=$1 WHERE brand_id=$2 AND store_id=$3 RETURNING *",
      [brand_name, id, storeId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Brand not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE (tenant-scoped)
const deleteBrand = async (req, res) => {
  try {
    const storeId = req.store_id;
    const { id } = req.params;

    const result = await pool.query("DELETE FROM brands WHERE brand_id=$1 AND store_id=$2 RETURNING *", [id, storeId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Brand not found' });

    res.json({ message: "Brand deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
};