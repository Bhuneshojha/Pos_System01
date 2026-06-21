import React, { useState, useEffect } from 'react';

function Invoice({ saleId, storeId, userRole, onClose }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Environment Sync Setup
  const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('auth_token');
        const targetSaleId = saleId || '1'; // Fallback to 1 if not passed

        const response = await fetch(`${API_BASE_URL}/reports/invoice/${targetSaleId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        setInvoice(data);
      } catch (err) {
        console.error("Invoice Engine Error:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [saleId, API_BASE_URL]);

  // ⏳ 1. LOADING STATE (Locked inside Dark Theme Frame)
  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" 
           style={{ minHeight: '75vh', backgroundColor: '#0f1115', color: '#f8fafc' }}>
        <div className="spinner-border text-success mb-3" role="status"></div>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Compiling Invoice Matrix Sheets...</p>
      </div>
    );
  }

  // ⚠️ 2. ERROR STATE / EMPTY DATA (Fixed: No White Space Bleeding)
  if (error || !invoice) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center text-center p-5" 
           style={{ 
             minHeight: '75vh', 
             backgroundColor: '#0f1115', 
             color: '#f8fafc',
             borderRadius: '12px',
             border: '1px solid rgba(255, 255, 255, 0.05)'
           }}>
        <span style={{ fontSize: '3.5rem', marginBottom: '15px' }}>⚠️</span>
        <h3 className="fw-bold text-danger" style={{ letterSpacing: '-0.02em' }}>
          Security Target or Invoice Matrix Generation Failed
        </h3>
        <p className="mt-2" style={{ color: '#94a3b8', maxWidth: '520px', fontSize: '0.9rem' }}>
          Reason: Could not fetch transaction details for Sale ID: <strong>{saleId || '1'}</strong>. 
          Your database pools might be empty or target rows are missing.
        </p>
        
        <button 
          className="btn btn-outline-danger mt-4 px-4 py-2 fw-semibold" 
          style={{ borderRadius: '8px', fontSize: '13px' }}
          onClick={() => onClose ? onClose() : window.history.back()}
        >
          Terminate Audit Window & Go Back
        </button>
      </div>
    );
  }

  // ✅ 3. MAIN INVOICE RENDER VIEWPORT (Runs cleanly when data exists)
  return (
    <div className="container-fluid p-0" style={{ backgroundColor: '#0f1115', color: '#f8fafc', minHeight: '100%' }}>
      
      {/* Top Utility Header Control Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h3 className="fw-bold mb-1 text-white">Invoice Blueprint</h3>
          <p className="text-muted small mb-0">Audit Record Reference Matrix: #{invoice.invoice_number}</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-success btn-sm px-3 py-2 fw-semibold" onClick={() => window.print()}>
            🖨️ Print Document
          </button>
          <button className="btn btn-secondary btn-sm px-3 py-2 fw-semibold" onClick={() => onClose ? onClose() : window.history.back()}>
            🔙 Exit View
          </button>
        </div>
      </div>

      {/* Main Invoice Card Wrapper */}
      <div className="p-4 rounded-3 mb-4" style={{ backgroundColor: '#141822', border: '1px solid rgba(255,255,255,0.04)' }}>
        
        {/* Row 1: Company Logo Profile vs Meta Info */}
        <div className="row mb-4">
          <div className="col-md-6">
            <h4 className="fw-bold text-success mb-1">Arbex Retail Corp.</h4>
            <p className="text-muted small">Store Registry Node: {storeId || 'Default-Store'}</p>
          </div>
          <div className="col-md-6 text-md-end">
            <h5 className="text-white-50 mb-1 fw-bold">INVOICE</h5>
            <p className="mb-1 text-light"><strong>No:</strong> {invoice.invoice_number}</p>
            <p className="text-muted small"><strong>Date:</strong> {new Date(invoice.sale_date).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Row 2: Customer Meta Details */}
        <div className="row mb-4 p-3 rounded-3" style={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.02)' }}>
          <div className="col-12">
            <h6 className="text-uppercase text-success fw-bold small mb-2" style={{ letterSpacing: '0.05em' }}>Billed Client Segment</h6>
            <p className="mb-1 fw-semibold text-white">{invoice.customer?.name || 'Walk-in Customer'}</p>
            {invoice.customer?.email && <p className="text-muted small mb-0">Email: {invoice.customer.email}</p>}
          </div>
        </div>

        {/* Row 3: Items Breakdown Data Grid Table */}
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-4" style={{ backgroundColor: 'transparent' }}>
            <thead style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
              <tr className="text-muted small">
                <th>Product Description</th>
                <th>SKU</th>
                <th className="text-center">Spec (Size/Color)</th>
                <th className="text-end">Qty</th>
                <th className="text-end">Unit Cost</th>
                <th className="text-end">Line Gross Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items && invoice.items.map((item, idx) => (
                <tr key={item.sale_item_id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td className="fw-semibold text-white">{item.product_name}</td>
                  <td><code className="text-success small">{item.sku}</code></td>
                  <td className="text-center text-muted small">
                    {item.size_name || '-'}{item.color_name ? ` / ${item.color_name}` : ''}
                  </td>
                  <td className="text-end text-light">{item.quantity}</td>
                  <td className="text-end text-light">${item.unit_price.toFixed(2)}</td>
                  <td className="text-end text-success fw-semibold">${item.line_total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Row 4: Pricing Matrix Summary Blocks */}
        <div className="row justify-content-end">
          <div className="col-md-5 col-lg-4">
            <div className="d-flex justify-content-between mb-2 small text-muted">
              <span>Gross Subtotal:</span>
              <span className="text-white">${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2 small text-danger">
              <span>Markdown Discount:</span>
              <span>-${invoice.discount_amount.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-3 small text-muted">
              <span>Vat / Tax Amount:</span>
              <span className="text-white">${invoice.tax_amount.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="fw-bold text-white">Net Financial Amount:</span>
              <span className="fw-bold text-success fs-5">${invoice.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Invoice;