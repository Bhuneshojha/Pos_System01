const express = require('express');
const router = express.Router();
const pool = require('../db/pool');


// =======================
// GET ALL SUPPLIERS
// =======================
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                s.supplier_id,
                s.supplier_name,
                s.contact_person,
                s.phone,
                s.email,
                l.city,
                l.state_province
            FROM suppliers s
            LEFT JOIN locations l ON s.location_id = l.location_id
            ORDER BY s.supplier_id ASC
        `);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =======================
// GET SINGLE SUPPLIER
// =======================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                s.*,
                l.city,
                l.state_province,
                l.street_address
            FROM suppliers s
            LEFT JOIN locations l ON s.location_id = l.location_id
            WHERE s.supplier_id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =======================
// CREATE SUPPLIER
// =======================
router.post('/', async (req, res) => {
    try {
        const {
            supplier_name,
            contact_person,
            phone,
            email,
            location_id
        } = req.body;

        if (!supplier_name) {
            return res.status(400).json({ message: "supplier_name is required" });
        }

        const result = await pool.query(`
            INSERT INTO suppliers 
            (supplier_name, contact_person, phone, email, location_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [
            supplier_name,
            contact_person,
            phone,
            email,
            location_id
        ]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =======================
// UPDATE SUPPLIER
// =======================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const {
            supplier_name,
            contact_person,
            phone,
            email,
            location_id
        } = req.body;

        const result = await pool.query(`
            UPDATE suppliers
            SET 
                supplier_name = $1,
                contact_person = $2,
                phone = $3,
                email = $4,
                location_id = $5
            WHERE supplier_id = $6
            RETURNING *
        `, [
            supplier_name,
            contact_person,
            phone,
            email,
            location_id,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =======================
// DELETE SUPPLIER
// =======================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM suppliers WHERE supplier_id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        res.json({ message: "Supplier deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;