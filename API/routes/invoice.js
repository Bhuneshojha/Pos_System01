const express = require('express');
const router = express.Router();
// Aapka database connection pool import (apne path ke mutabik check kar lein)
const pool = require('../config/db'); 

/**
 * @route   GET /api/reports/invoice/:saleId
 * @desc    Fetch comprehensive relational billing invoice data payload
 * @access  Protected (Admin/Manager/Cashier)
 */
router.get('/invoice/:saleId', async (req, res) => {
    const { saleId } = req.params;

    // Fast-track validation checking
    if (!saleId || isNaN(parseInt(saleId))) {
        return res.status(400).json({ 
            error: "Invalid or missing operational Parameter Node (Sale ID required)" 
        });
    }

    try {
        // 1. Core Header Data Fetch (Sales master metadata mapping)
        const saleHeaderQuery = `
            SELECT 
                s.sale_id,
                s.invoice_number,
                s.sale_date,
                s.subtotal,
                s.discount_amount,
                s.tax_amount,
                s.total_amount,
                s.store_id,
                c.customer_id,
                c.name AS customer_name,
                c.email AS customer_email,
                c.phone AS customer_phone
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.customer_id
            WHERE s.sale_id = $1;
        `;
        
        const headerResult = await pool.query(saleHeaderQuery, [saleId]);

        // Agar master invoice transaction record hi na mile database me
        if (headerResult.rows.length === 0) {
            return res.status(404).json({ 
                error: `No master transaction registry ledger found for Target ID: ${saleId}` 
            });
        }

        const saleData = headerResult.rows[0];

        // 2. Line Items Data Fetch (Deep structural sub-table relational parsing)
        const saleItemsQuery = `
            SELECT 
                si.sale_item_id,
                si.variant_id,
                si.quantity,
                si.unit_price,
                si.line_total,
                pv.sku,
                p.product_name,
                sz.size_name,
                cl.color_name
            FROM sale_items si
            JOIN product_variants pv ON si.variant_id = pv.variant_id
            JOIN products p ON pv.product_id = p.product_id
            LEFT JOIN sizes sz ON pv.size_id = sz.size_id
            LEFT JOIN colors cl ON pv.color_id = cl.color_id
            WHERE si.sale_id = $1
            ORDER BY si.sale_item_id ASC;
        `;

        const itemsResult = await pool.query(saleItemsQuery, [saleId]);

        // 3. Structural Object Normalization (Frontend standard schemas mapping ready)
        const invoicePayload = {
            sale_id: saleData.sale_id,
            invoice_number: saleData.invoice_number || `INV-${saleData.sale_id}100`,
            sale_date: saleData.sale_date,
            subtotal: parseFloat(saleData.subtotal || 0),
            discount_amount: parseFloat(saleData.discount_amount || 0),
            tax_amount: parseFloat(saleData.tax_amount || 0),
            total_amount: parseFloat(saleData.total_amount || 0),
            store_id: saleData.store_id,
            customer: {
                id: saleData.customer_id || null,
                name: saleData.customer_name || 'Walk-in Customer',
                email: saleData.customer_email || null,
                phone: saleData.customer_phone || null
            },
            // Mapping child array objects clean and structured
            items: itemsResult.rows.map(item => ({
                sale_item_id: item.sale_item_id,
                variant_id: item.variant_id,
                product_name: item.product_name,
                sku: item.sku || 'N/A',
                size_name: item.size_name || null,
                color_name: item.color_name || null,
                quantity: parseInt(item.quantity || 0),
                unit_price: parseFloat(item.unit_price || 0),
                line_total: parseFloat(item.line_total || 0)
            }))
        };

        // Complete matrix object response discharge
        return res.status(200).json(invoicePayload);

    } catch (error) {
        console.error("❌ CRITICAL DATABASE SYSTEM BREAKDOWN:", error.message);
        return res.status(500).json({ 
            error: "Internal Server Error compiling structural matrix records",
            details: error.message 
        });
    }
});

module.exports = router;