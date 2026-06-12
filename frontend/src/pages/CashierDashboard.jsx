import React, { useState, useEffect, useRef } from 'react';

function CashierDashboard() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]); 
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState([]);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [holdInvoices, setHoldInvoices] = useState([]);
  
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const scannerInputRef = useRef(null);

  useEffect(() => {
    fetchBackendProducts();
    
    const handleGlobalShortcuts = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (scannerInputRef.current) scannerInputRef.current.focus();
        showStatus('info', 'Barcode scanner input ready.');
      }
      if (e.key === 'F8') {
        e.preventDefault();
        setCart([]);
        showStatus('warning', 'Current checkout cart cleared.');
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  const fetchBackendProducts = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const textData = await response.text();
      
      if (textData.trim().startsWith("<!DOCTYPE")) {
        console.error("Backend Error: /api/products returned HTML instead of JSON.");
        showStatus('danger', 'API Configuration Error: Server returned HTML page instead of JSON product rows.');
        return;
      }

      const jsonResult = JSON.parse(textData);
      setProducts(Array.isArray(jsonResult) ? jsonResult : jsonResult.products || []);
    } catch (err) {
      console.error("DB Fetch Fail:", err);
      showStatus('danger', 'Database Sync Failure: Unable to parse remote catalog.');
    }
  };

  const grossSubtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const salesTax = grossSubtotal * 0.05; 
  const netPayable = grossSubtotal + salesTax;

  const showStatus = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 5000);
  };

  const handleAddItem = (product) => {
    const totalAvailableStock = Number(product.stock || product.quantity_available || 0);
    
    if (totalAvailableStock <= 0) {
      showStatus('danger', `Out of Stock: "${product.product_name || product.name}" has 0 units available.`);
      return;
    }

    setCart((prevCart) => {
      const itemKey = product.sku || product.variant_id || product.id;
      const existingItemIndex = prevCart.findIndex(item => (item.sku || item.variant_id || item.id) === itemKey);
      
      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        if (updatedCart[existingItemIndex].quantity >= totalAvailableStock) {
          showStatus('danger', `Inventory Cap Enforced: Only ${totalAvailableStock} items left in stock.`);
          return prevCart;
        }
        updatedCart[existingItemIndex].quantity += 1;
        return updatedCart;
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    showStatus('success', `${product.product_name || product.name} added to cart.`);
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const query = barcodeInput.trim().toLowerCase();
    if (!query) return;

    const matchedProduct = products.find(p => 
      String(p.sku || '').toLowerCase() === query || 
      String(p.barcode || '').toLowerCase() === query ||
      String(p.id || '').toLowerCase() === query
    );
    
    if (matchedProduct) {
      handleAddItem(matchedProduct);
      setBarcodeInput('');
    } else {
      showStatus('danger', `SKU / Barcode Tag "${query.toUpperCase()}" not cataloged in system database.`);
    }
  };

  const handleQuantityChange = (itemKey, delta, stockLimit) => {
    setCart(prev => prev.map(item => {
      const currentKey = item.sku || item.variant_id || item.id;
      if (currentKey === itemKey) {
        const nextQty = item.quantity + delta;
        if (nextQty <= 0) return null;
        if (nextQty > Number(stockLimit)) {
          showStatus('danger', `Cannot exceed maximum stock limit (${stockLimit} units available).`);
          return item;
        }
        return { ...item, quantity: nextQty };
      }
      return item;
    }).filter(Boolean));
  };

  const handleRemoveRow = (itemKey) => {
    setCart(prev => prev.filter(item => (item.sku || item.variant_id || item.id) !== itemKey));
    showStatus('info', 'Item removed from transaction ticket.');
  };

  const handleHoldBill = () => {
    if (cart.length === 0) return;
    const holdItem = {
      id: `HOLD-${Date.now().toString().slice(-4)}`,
      items: [...cart],
      total: netPayable,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setHoldInvoices(prev => [...prev, holdItem]);
    setCart([]);
    showStatus('warning', `Transaction suspended on Queue Slot: ${holdItem.id}`);
  };

  const handleRecallBill = (holdId) => {
    const originalBill = holdInvoices.find(b => b.id === holdId);
    if (originalBill) {
      setCart(originalBill.items);
      setHoldInvoices(prev => prev.filter(b => b.id !== holdId));
      showStatus('success', `Recalled transaction ticket from slot ${holdId}.`);
    }
  };

  const handleProcessCheckout = async () => {
    if (cart.length === 0) {
      showStatus('danger', 'Transaction Aborted: Shopping cart is completely empty.');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('auth_token');
    const storeId = localStorage.getItem('storeId') || 1;

    const salePayload = {
      store_id: storeId,
      subtotal: grossSubtotal,
      tax: salesTax,
      total_payable: netPayable,
      payment_method: 'Cash',
      items: cart.map(item => ({
        product_id: item.id,
        variant_id: item.variant_id || item.id,
        quantity: item.quantity,
        unit_price: Number(item.price)
      }))
    };

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(salePayload)
      });

      const rawResponseText = await response.text();
      
      if (rawResponseText.trim().startsWith("<!DOCTYPE")) {
        throw new Error("Checkout failed. Server returned web view markup.");
      }

      const checkoutData = JSON.parse(rawResponseText);

      const invoicePayload = {
        orderNumber: checkoutData.invoice_number || checkoutData.order_id || `ARX-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        items: [...cart],
        subtotal: grossSubtotal,
        tax: salesTax,
        total: netPayable,
        cashier: localStorage.getItem('userRole') || 'Register Counter 01'
      };

      setActiveInvoice(invoicePayload);
      setShowReceipt(true);
      setCart([]);
      showStatus('success', 'Sale successfully posted and locked to database repository.');
    } catch (err) {
      console.error("Checkout Request Network Error:", err);
      showStatus('danger', `Network synchronization breakdown: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-3 text-start app-pos-container" style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      
      {/* 🟢 FIXED HIGH CONTRAST INJECTIONS FOR CLEAR TEXT OVER DARK SURFACE */}
      <style>{`
        .pos-field { 
          background-color: #1e293b !important; 
          color: #ffffff !important; 
          border: 2px solid #475569 !important; 
        }
        .pos-field::placeholder {
          color: #94a3b8 !important;
          opacity: 1;
        }
        .pos-field:focus { 
          border-color: #3b82f6 !important; 
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4) !important; 
        }
        .pos-card-solid { 
          background-color: #1e293b !important; 
          border: 1px solid #334155 !important; 
        }
        .catalog-pill { 
          background-color: #334155; 
          border: 1px solid #64748b; 
          transition: all 0.2s ease; 
          cursor: pointer; 
        }
        .catalog-pill:hover { 
          background-color: #475569; 
          border-color: #94a3b8; 
          transform: translateY(-1px); 
        }
        .active-row-table th { 
          background-color: #1e293b !important; 
          color: #f1f5f9 !important; /* Made headers bright white-grey */
          font-weight: 700 !important;
          font-size: 12px; 
          letter-spacing: 0.05em; 
          text-transform: uppercase; 
        }
        .text-light-slate {
          color: #cbd5e1 !important; /* High contrast text for descriptions */
        }
        .text-bright-neon {
          color: #38bdf8 !important; /* High contrast vibrant cyan for sizes */
        }
        @media print {
          body * { visibility: hidden; }
          #thermal-invoice-print, #thermal-invoice-print * { visibility: visible; }
          #thermal-invoice-print { position: absolute; left: 0; top: 0; width: 100%; color: #000000 !important; background-color: white !important; }
        }
      `}</style>

      {/* RETAIL HEAD COUNTER BAR */}
      <div className="d-flex flex-wrap justify-content-between align-items-center p-3 mb-3 rounded-3 shadow-sm" style={{ backgroundColor: '#1e293b', borderBottom: '3px solid #10b981' }}>
        <div>
          <h4 className="fw-bold mb-0 text-white d-flex align-items-center gap-2">
            🛍️ Arbex Retail <span className="text-success fs-5 fw-bold">| Point of Sale Dashboard</span>
          </h4>
          <span className="text-light-slate small fw-semibold">Live Connected Mode • Master Database Buffer Sync</span>
        </div>
        <div className="d-flex align-items-center gap-2 mt-2 mt-sm-0">
          <button className="btn btn-sm btn-info fw-bold text-dark font-monospace me-2" onClick={fetchBackendProducts}>🔄 Sync Database ({products.length})</button>
          <span className="badge bg-primary text-white px-2 py-1 font-monospace fw-bold">F2: Focus Input</span>
          <span className="badge bg-danger text-white px-2 py-1 font-monospace fw-bold">F8: Clear</span>
        </div>
      </div>

      {/* SYSTEM FEEDBACK HIGH CONTRAST TOASTS */}
      {statusMessage.text && (
        <div className={`alert alert-${statusMessage.type === 'danger' ? 'danger bg-danger text-white' : statusMessage.type === 'success' ? 'success bg-success text-white' : 'info bg-info text-dark'} border-0 shadow-sm py-2 px-3 fw-bold mb-3`} role="alert">
          {statusMessage.type === 'success' ? '✓ ' : '⚠️ '} {statusMessage.text}
        </div>
      )}

      <div className="row g-3">
        {/* LEFT BARCODE REGISTER PANEL */}
        <div className="col-12 col-lg-8">
          <div className="card pos-card-solid p-4 rounded-3 h-100">
            
            <form onSubmit={handleBarcodeSubmit} className="mb-4">
              <label className="form-label text-white fw-bold text-uppercase tracking-wider small">Scan Barcode Sticker / Input Variant SKU</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-0 text-white">🖨️</span>
                <input
                  ref={scannerInputRef}
                  type="text"
                  className="form-control form-control-lg pos-field fw-bold"
                  placeholder="Scan clothing barcode or search item key... [F2]"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="btn btn-success text-white fw-bold px-4">Find & Add</button>
              </div>
            </form>

            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold text-white text-uppercase tracking-wide mb-0">Active Sales Ticket Desk</h6>
              <span className="text-bright-neon fw-bold small">{cart.length} Row Elements Active</span>
            </div>

            {/* PRODUCT ROWS ITERATOR */}
            <div className="table-responsive rounded-3 mb-4" style={{ backgroundColor: '#0f172a', maxHeight: '350px', border: '1px solid #334155' }}>
              <table className="table table-dark table-hover align-middle mb-0 active-row-table">
                <thead>
                  <tr className="border-bottom border-secondary">
                    <th style={{ width: '45%' }} className="ps-3 text-white">Article Description</th>
                    <th style={{ width: '20%' }} className="text-white">SKU ID Code</th>
                    <th style={{ width: '15%' }} className="text-center text-white">Counter Qty</th>
                    <th style={{ width: '20%' }} className="text-end pe-3 text-white">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-5 text-light-slate fw-bold">
                        <span className="fs-2 d-block mb-2">📥</span>
                        Counter Tray Waiting for Laser Scans.
                      </td>
                    </tr>
                  ) : (
                    cart.map((item) => {
                      const itemKey = item.sku || item.variant_id || item.id;
                      const currentMaxStock = item.stock || item.quantity_available || 999;
                      return (
                        <tr key={itemKey} className="border-bottom border-slate-800">
                          <td className="ps-3">
                            <div className="fw-bold text-white fs-6">{item.product_name || item.name}</div>
                            <small className="text-light-slate text-uppercase fw-semibold" style={{ fontSize: '11px' }}>
                              Size: <span className="text-bright-neon fw-bold">{item.size || 'N/A'}</span> | Color: <span className="text-bright-neon fw-bold">{item.color || 'N/A'}</span> | @Rs. {Number(item.price).toFixed(2)}
                            </small>
                          </td>
                          <td><code className="text-warning fw-bold font-monospace fs-6">{item.sku || 'No-SKU'}</code></td>
                          <td>
                            <div className="d-flex align-items-center justify-content-center gap-2">
                              <button type="button" className="btn btn-sm btn-secondary text-white px-2 py-0 fw-bold" onClick={() => handleQuantityChange(itemKey, -1, currentMaxStock)}>-</button>
                              <span className="fw-bold font-monospace px-2 text-white fs-5">{item.quantity}</span>
                              <button type="button" className="btn btn-sm btn-secondary text-white px-2 py-0 fw-bold" onClick={() => handleQuantityChange(itemKey, 1, currentMaxStock)}>+</button>
                              <button type="button" className="btn btn-link text-danger fw-bold p-0 ms-2" onClick={() => handleRemoveRow(itemKey)}>✕</button>
                            </div>
                          </td>
                          <td className="text-end pe-3 font-monospace fw-bold text-success fs-5">
                            Rs. {(Number(item.price) * item.quantity).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* DYNAMIC FAST SEARCH DB SELECTOR TILES */}
            <div>
              <h6 className="fw-bold text-white text-uppercase tracking-wider small mb-3">⚡ Live Stock Tray Grid Selector (Database Rows Lookup)</h6>
              <div className="row g-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {products.length === 0 ? (
                  <div className="col-12 text-light-slate fw-semibold small py-3 text-center">No connection array cached. Ensure api route output matches format specs.</div>
                ) : (
                  products.slice(0, 12).map((product) => (
                    <div className="col-12 col-sm-6 col-md-4" key={product.id || product.sku}>
                      <div className="p-2 rounded-3 catalog-pill d-flex justify-content-between align-items-center" onClick={() => handleAddItem(product)}>
                        <div className="text-truncate pe-1 text-start">
                          <div className="small fw-bold text-white text-truncate">{product.product_name || product.name}</div>
                          <span className="text-light-slate font-monospace fw-bold" style={{ fontSize: '11px' }}>Stock: {product.stock || product.quantity_available || 0} left</span>
                        </div>
                        <div className="badge bg-dark text-success font-monospace py-1 border border-secondary fs-6 fw-bold">
                          Rs.{Number(product.price).toFixed(0)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT SUMMARY AND PAUSED QUEUE TERMINALS */}
        <div className="col-12 col-lg-4">
          <div className="d-flex flex-column gap-3 h-100">
            
            <div className="card pos-card-solid p-4 rounded-3 text-white">
              <h5 className="fw-bold mb-3 text-uppercase tracking-wider fs-6 text-success border-bottom border-secondary pb-2">
                Settlement Terminal Matrix
              </h5>
              
              <div className="d-flex justify-content-between mb-2 small text-light-slate fw-semibold">
                <span>Gross Inventory Total:</span>
                <span className="font-monospace text-white fw-bold">Rs. {grossSubtotal.toLocaleString()}</span>
              </div>

              <div className="d-flex justify-content-between mb-3 small text-light-slate fw-semibold">
                <span>Sales Tax Allocation (5%):</span>
                <span className="font-monospace text-white fw-bold">Rs. {salesTax.toLocaleString()}</span>
              </div>

              <div className="p-3 bg-dark rounded-3 border border-secondary mb-4 text-center">
                <span className="text-uppercase small tracking-widest text-light-slate d-block mb-1 fw-bold">Net Payable Total Due</span>
                <h2 className="fw-bold font-monospace text-success mb-0 fs-1">Rs. {netPayable.toLocaleString()}</h2>
              </div>

              <div className="row g-2">
                <div className="col-4">
                  <button type="button" className="btn btn-outline-warning text-warning w-100 fw-bold py-2 text-uppercase small" onClick={handleHoldBill} disabled={cart.length === 0}>
                    ⏸ Hold
                  </button>
                </div>
                <div className="col-8">
                  <button
                    type="button"
                    className="btn btn-success text-white w-100 fw-bold py-2 text-uppercase d-flex align-items-center justify-content-center gap-1 shadow-sm fs-6"
                    onClick={handleProcessCheckout}
                    disabled={loading || cart.length === 0}
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: '0' }}
                  >
                    {loading ? <span className="spinner-border spinner-border-sm"></span> : '💳 Post Sale Log'}
                  </button>
                </div>
              </div>
            </div>

            <div className="card pos-card-solid p-4 rounded-3 text-white flex-grow-1">
              <h6 className="fw-bold mb-2 text-uppercase tracking-wider small text-light-slate">
                Suspended Invoice Buffers ({holdInvoices.length})
              </h6>
              
              <div className="d-flex flex-column gap-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {holdInvoices.length === 0 ? (
                  <div className="text-center text-light-slate py-4 rounded border border-secondary border-dashed small fw-semibold" style={{ backgroundColor: '#0f172a' }}>
                    No items pending recall in active session lane.
                  </div>
                ) : (
                  holdInvoices.map((bill) => (
                    <div key={bill.id} className="p-2 bg-dark rounded border border-secondary d-flex justify-content-between align-items-center small font-monospace">
                      <div>
                        <span className="text-warning fw-bold d-block fs-6">{bill.id}</span>
                        <small className="text-light-slate fw-semibold">{bill.items.length} Items • Saved at {bill.time}</small>
                      </div>
                      <button type="button" className="btn btn-sm btn-primary text-white py-1 px-2 fw-bold font-sans" onClick={() => handleRecallBill(bill.id)}>
                        Recall ↩
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 📋 PRODUCTION STANDARD THERMAL RECEIPT DIALOG MODAL BOX */}
      {showReceipt && activeInvoice && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '380px' }}>
            <div className="modal-content bg-white text-dark border-0 rounded-3">
              
              <div className="modal-header bg-light border-bottom p-2 px-3 d-flex justify-content-between align-items-center">
                <span className="fw-bold font-sans text-uppercase small tracking-wider text-dark">🖨️ Terminal Print Dialog Stream</span>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowReceipt(false)}></button>
              </div>

              <div className="modal-body p-4 font-monospace" id="thermal-invoice-print" style={{ fontSize: '12px', color: '#000000', lineHeight: '1.4' }}>
                <div className="text-center mb-3">
                  <h5 className="fw-bold mb-0 text-dark">ARBEX RETAIL CO.</h5>
                  <p className="mb-0 text-uppercase tracking-wide" style={{ fontSize: '10px' }}>Clothing & Apparel Node</p>
                  <p className="mb-0 text-muted" style={{ fontSize: '10px' }}>Karachi Central Sindh Pakistan</p>
                  <div className="my-2">====================================</div>
                </div>

                <div className="d-flex justify-content-between mb-1">
                  <span>Invoice Token:</span>
                  <span className="fw-bold">{activeInvoice.orderNumber}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span>Date / Stamp:</span>
                  <span>{activeInvoice.date} - {activeInvoice.time}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span>Cashier ID:</span>
                  <span className="text-uppercase">{activeInvoice.cashier}</span>
                </div>

                <div className="fw-bold mb-1 text-uppercase">Scanned Items Log:</div>
                <div className="mb-2">------------------------------------</div>
                
                {activeInvoice.items.map((item, idx) => (
                  <div key={idx} className="mb-2 border-bottom border-light pb-1">
                    <div className="d-flex justify-content-between font-sans fw-bold text-dark">
                      <span>{item.product_name || item.name}</span>
                      <span>Rs.{(Number(item.price) * item.quantity).toLocaleString()}</span>
                    </div>
                    <div className="text-muted ps-1" style={{ fontSize: '11px' }}>
                      {item.quantity} Unit(s) x Rs.{Number(item.price).toLocaleString()}
                    </div>
                  </div>
                ))}

                <div className="mt-3">------------------------------------</div>
                <div className="d-flex justify-content-between mb-1">
                  <span>Gross Basket Subtotal:</span>
                  <span>Rs. {activeInvoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between mb-1 text-muted">
                  <span>GST Sales Tax (5%):</span>
                  <span>Rs. {activeInvoice.tax.toLocaleString()}</span>
                </div>
                <div className="my-2">====================================</div>
                <div className="d-flex justify-content-between mb-2 fs-5 fw-bold text-dark">
                  <span>TOTAL PAID CASH:</span>
                  <span>Rs. {activeInvoice.total.toLocaleString()}</span>
                </div>
                <div className="my-2">====================================</div>

                <div className="text-center mt-4">
                  <p className="fw-bold mb-1">★ Thank You For Your Patronage ★</p>
                  <small className="text-muted d-block mt-2" style={{ fontSize: '9px' }}>Transaction logged natively onto backend cluster ledger via API.</small>
                </div>
              </div>

              <div className="modal-footer bg-light p-2 d-flex gap-2">
                <button type="button" className="btn btn-secondary w-50 py-2 small fw-bold text-uppercase" onClick={() => setShowReceipt(false)}>Dismiss</button>
                <button type="button" className="btn btn-primary w-50 py-2 small fw-bold text-uppercase" onClick={() => window.print()}>🖨️ Thermal Print</button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CashierDashboard;