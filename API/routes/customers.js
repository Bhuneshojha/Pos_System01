const express = require('express');
const router = express.Router();
const pool = require('../db/pool');


// GET ALL CUSTOMERS
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM customers ORDER BY customer_id'
        );

        res.json(result.rows);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// GET CUSTOMER BY ID
router.get('/:id', async (req, res) => {

    try {

        const result = await pool.query(
            'SELECT * FROM customers WHERE customer_id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Customer not found'
            });
        }

        res.json(result.rows[0]);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});


// CREATE CUSTOMER
router.post('/', async (req, res) => {

    try {

        const {
            first_name,
            last_name,
            email,
            phone,
            loyalty_points
        } = req.body;

        const result = await pool.query(
            `INSERT INTO customers
            (
                first_name,
                last_name,
                email,
                phone,
                loyalty_points
            )
            VALUES ($1,$2,$3,$4,$5)
            RETURNING *`,
            [
                first_name,
                last_name,
                email,
                phone,
                loyalty_points || 0
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});


// UPDATE CUSTOMER
router.put('/:id', async (req, res) => {

    try {

        const {
            first_name,
            last_name,
            email,
            phone,
            loyalty_points
        } = req.body;

        const result = await pool.query(
            `UPDATE customers
             SET
                first_name=$1,
                last_name=$2,
                email=$3,
                phone=$4,
                loyalty_points=$5
             WHERE customer_id=$6
             RETURNING *`,
            [
                first_name,
                last_name,
                email,
                phone,
                loyalty_points,
                req.params.id
            ]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: 'Customer not found'
            });

        }

        res.json(result.rows[0]);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});


// DELETE CUSTOMER
router.delete('/:id', async (req, res) => {

    try {

        const result = await pool.query(
            'DELETE FROM customers WHERE customer_id=$1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: 'Customer not found'
            });

        }

        res.json({
            message: 'Customer deleted'
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});

module.exports = router;