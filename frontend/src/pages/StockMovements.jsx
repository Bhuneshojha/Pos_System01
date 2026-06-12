import React, { useState, useEffect, useMemo } from 'react';
import { FaExchangeAlt, FaPlus, FaSearch, FaWarehouse, FaInbox, FaRegStickyNote, FaCalendarAlt, FaBoxes } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL, getAuthHeaders } from '../config';

export default function StockMovements() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  
  // State elements mapping
  const [formData, setFormData] = useState({
    warehouse_id: '',
    variant_id: '',
    movement_type: 'IN',
    quantity: '',
    reference_note: ''
  });
  const [warehouses, setWarehouses] = useState([]);
  const [variants, setVariants] = useState([]);

  useEffect(() => {
    fetchMovements();
    fetchWarehouses();
    fetchVariants();
  }, []);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/stock-movements?limit=100`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      // Strict Array formatting with robust fallback keys mapping
      if (Array.isArray(data)) {
        const standardMovements = data.map(m => ({
          movement_id: m.movement_id || m.id,
          product_name: m.product_name || m.product?.product_name || m.product?.name || m.variant_name || "Jeans Item",
          sku: m.sku || m.variant?.sku || m.product?.sku || "No SKU",
          warehouse_name: m.warehouse_name || m.warehouse?.warehouse_name || m.warehouse?.name || "korangi Industry",
          movement_type: m.movement_type || m.type || "IN",
          quantity: m.quantity || m.qty || 0,
          movement_date: m.movement_date || m.created_at || m.date,
          reference_note: m.reference_note || m.note || m.remarks || ""
        }));
        setMovements(standardMovements);
      } else {
        setMovements([]);
      }
    } catch (error) {
      toast.error('Failed to fetch stock movements logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/warehouses`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch warehouses list');
    }
  };

  const fetchVariants = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products-management`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      if (Array.isArray(data)) {
        let extractedVariants = [];
        data.forEach(p => {
          if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
            p.variants.forEach(v => {
              extractedVariants.push({
                variant_id: v.variant_id || v.id || p.product_id || p.id,
                product_name: p.product_name || p.name || 'Unknown Product',
                sku: v.sku || p.sku || 'No SKU',
                variant_name: v.variant_name || v.size || v.color || ''
              });
            });
          } else {
            extractedVariants.push({
              variant_id: p.variant_id || p.product_id || p.id,
              product_name: p.product_name || p.name || 'Unknown Product',
              sku: p.sku || 'No SKU',
              variant_name: p.variant_name || ''
            });
          }
        });
        setVariants(extractedVariants);
      }
    } catch (error) {
      console.error('Failed to fetch product variants');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const wId = parseInt(formData.warehouse_id, 10);
    const vId = parseInt(formData.variant_id, 10);
    const qty = parseInt(formData.quantity, 10);

    if (!formData.warehouse_id || !formData.variant_id || !formData.quantity) {
      toast.error('Please fill all required fields completely.');
      return;
    }

    if (isNaN(wId) || isNaN(vId) || isNaN(qty)) {
      toast.error('Invalid Form Data. Please re-select Warehouse and Product.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/stock-movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          warehouse_id: wId,
          variant_id: vId,
          movement_type: formData.movement_type,
          quantity: qty,
          reference_note: formData.reference_note ? formData.reference_note.trim() : null
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Operation failed');
      }

      toast.success('Stock movement recorded successfully!');
      setFormData({
        warehouse_id: '',
        variant_id: '',
        movement_type: 'IN',
        quantity: '',
        reference_note: ''
      });
      setShowForm(false);
      fetchMovements(); // Refresh grid layout metrics
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    }
  };

  const filtered = useMemo(() => {
    return movements.filter(m => {
      if (!m) return false;
      const q = search.toLowerCase();
      const name = String(m.product_name || "").toLowerCase();
      const sku = String(m.sku || "").toLowerCase();
      const wh = String(m.warehouse_name || "").toLowerCase();
      const type = String(m.movement_type || "").toLowerCase();
      return name.includes(q) || sku.includes(q) || wh.includes(q) || type.includes(q);
    });
  }, [search, movements]);

  const getMovementStyle = (type) => {
    switch (type?.toUpperCase()) {
      case 'IN': return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
      case 'OUT': return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
      case 'ADJUSTMENT': return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
      default: return { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' };
    }
  };

  return (
    <div className="stock-dashboard py-5 px-4 px-md-5">
      <ToastContainer theme="dark" position="top-right" />

      <div className="stock-header mb-4">
        <div>
          <h1 className="stock-title">Stock Movements</h1>
          <p className="stock-subtitle">Track warehouse inventory shifts, inbound stock arrivals, and real-time adjustments.</p>
        </div>
        <button className="btn stock-add-btn" onClick={() => setShowForm(!showForm)}>
          <FaPlus size={11} /> {showForm ? 'Cancel Form' : 'Record New Stock Flow'}
        </button>
      </div>

      {showForm && (
        <div className="stock-form-overlay mb-4">
          <div className="stock-form-card p-4">
            <h5 className="form-card-title mb-3">📝 Record New Stock Flow</h5>
            <form onSubmit={handleSubmit} className="m-0">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="stock-label">Target Facility Warehouse *</label>
                  <select
                    value={formData.warehouse_id}
                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                    required className="form-select stock-input shadow-none"
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.warehouse_id || w.id} value={w.warehouse_id || w.id}>
                        {w.warehouse_name || w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="stock-label">Product SKU / Variant Item *</label>
                  <select
                    value={formData.variant_id}
                    onChange={(e) => setFormData({ ...formData, variant_id: e.target.value })}
                    required className="form-select stock-input shadow-none"
                  >
                    <option value="">Select Variant</option>
                    {variants.map((v, index) => (
                      <option key={`${v.variant_id}-${index}`} value={v.variant_id}>
                        {v.product_name} {v.variant_name ? `(${v.variant_name})` : ''} — {v.sku}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="stock-label">Movement Logic Type *</label>
                  <select
                    value={formData.movement_type}
                    onChange={(e) => setFormData({ ...formData, movement_type: e.target.value })}
                    className="form-select stock-input shadow-none"
                  >
                    <option value="IN">Stock In (📥 Receipt Entry)</option>
                    <option value="OUT">Stock Out (📤 Dispatch Issue)</option>
                    <option value="ADJUSTMENT">Adjustment (🔄 Reconciliation)</option>
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="stock-label">Quantity Volumetric Count *</label>
                  <input
                    type="number" placeholder="Enter quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required min="1" className="form-control stock-input shadow-none"
                  />
                </div>

                <div className="col-12">
                  <label className="stock-label">Reference Operational Note (Optional)</label>
                  <textarea
                    placeholder="Reason, remarks or transaction track info..."
                    value={formData.reference_note} rows={2}
                    onChange={(e) => setFormData({ ...formData, reference_note: e.target.value })}
                    className="form-control stock-input shadow-none text-area"
                  />
                </div>

                <div className="col-12 d-flex justify-content-end gap-2 mt-4">
                  <button type="button" className="btn stock-btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn stock-btn-save">Commit Transaction</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="stock-search-wrapper mb-4">
        <span className="stock-search-icon"><FaSearch /></span>
        <input 
          type="text" 
          className="form-control stock-search-input shadow-none" 
          placeholder="Search logs by product variant, SKU, or warehouse name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
      ) : filtered.length === 0 ? (
        <div className="stock-empty-state text-center">
          <FaInbox size={34} className="stock-empty-icon mb-2" />
          <p className="stock-empty-text">No stock movements found.</p>
        </div>
      ) : (
        <div className="stock-timeline-container">
          {filtered.map((movement, idx) => {
            const styleProps = getMovementStyle(movement.movement_type);
            return (
              <div key={movement.movement_id || idx} className="stock-timeline-card mb-3">
                <div className="stock-card-left">
                  <div className="stock-marker" style={{ color: styleProps.color, backgroundColor: styleProps.bg }}>
                    <FaExchangeAlt size={12} />
                  </div>
                  <div className="stock-main-details">
                    <h4 className="stock-item-heading m-0">
                      {movement.product_name} 
                      <span className="stock-sku-pill ms-2">{movement.sku}</span>
                    </h4>
                    <div className="stock-meta-row mt-2 d-flex flex-wrap gap-3">
                      <span className="meta-text"><FaWarehouse className="me-1" /> {movement.warehouse_name}</span>
                      <span className="meta-text"><FaCalendarAlt className="me-1" /> {movement.movement_date ? new Date(movement.movement_date).toLocaleString() : 'Just Now'}</span>
                      <span className="meta-text"><FaBoxes className="me-1" /> Qty: <strong>{movement.quantity}</strong></span>
                    </div>
                    {movement.reference_note && (
                      <div className="stock-note-subbox mt-2">
                        <FaRegStickyNote className="me-2" size={11} />
                        <span>{movement.reference_note}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="stock-card-right text-end">
                  <span className="stock-type-badge" style={{ color: styleProps.color, backgroundColor: styleProps.bg }}>
                    {movement.movement_type}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .stock-dashboard { background-color: #0b0f19; min-height: 100vh; width: 100%; font-family: 'Inter', sans-serif; }
        .stock-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 1.25rem; }
        .stock-title { font-size: 1.75rem; font-weight: 700; color: #ffffff; margin: 0; }
        .stock-subtitle { font-size: 0.9rem; color: #94a3b8; margin: 4px 0 0 0; opacity: 0.8; }
        
        .stock-add-btn { background-color: #3b82f6; color: #ffffff !important; font-weight: 500; font-size: 0.88rem; padding: 10px 20px; border-radius: 8px; border: none; display: flex; align-items: center; gap: 8px; transition: background 0.15s ease; }
        .stock-add-btn:hover { background-color: #2563eb; }
        
        .stock-search-wrapper { position: relative; display: flex; align-items: center; }
        .stock-search-icon { position: absolute; left: 16px; color: #64748b; }
        .stock-search-input { width: 100%; background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px 12px 12px 46px; font-size: 0.9rem; color: #ffffff !important; }
        .stock-search-input:focus { border-color: #3b82f6; background-color: #131c2e; }
        .stock-search-input::placeholder { color: #475569; }

        .stock-form-overlay { background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
        .form-card-title { font-size: 1.05rem; font-weight: 600; color: #ffffff; letter-spacing: 0.3px; }
        .stock-label { font-size: 0.85rem; font-weight: 500; color: #94a3b8; margin-bottom: 6px; display: block; }
        
        .stock-input { background-color: #1f2937 !important; border: 1px solid #374151 !important; color: #ffffff !important; border-radius: 8px !important; padding: 10px 14px !important; font-size: 0.92rem !important; }
        .stock-input:focus { border-color: #3b82f6 !important; background-color: #1f2937 !important; color: #ffffff !important; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2) !important; }
        .stock-input::placeholder { color: #64748b !important; }
        .stock-input option { background-color: #111827; color: #ffffff; }
        .text-area { resize: none; color: #ffffff !important; }

        .stock-btn-cancel { color: #94a3b8; font-weight: 500; background: transparent; border: none; padding: 10px 18px; font-size: 0.88rem; }
        .stock-btn-cancel:hover { color: #ffffff; }
        .stock-btn-save { background-color: #3b82f6; color: #ffffff; font-weight: 500; padding: 10px 20px; border-radius: 8px; border: none; font-size: 0.88rem; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2); }
        .stock-btn-save:hover { background-color: #2563eb; }

        .stock-timeline-card { background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 12px; padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; transition: transform 0.15s ease; }
        .stock-timeline-card:hover { border-color: rgba(255, 255, 255, 0.08); background-color: #131c30; }
        .stock-card-left { display: flex; align-items: flex-start; gap: 1rem; }
        
        .stock-marker { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
        .stock-item-heading { font-size: 1rem; font-weight: 600; color: #ffffff !important; display: flex; align-items: center; }
        .stock-sku-pill { font-size: 0.75rem; background-color: #1f2937; color: #38bdf8; padding: 2px 8px; border-radius: 4px; font-weight: 500; letter-spacing: 0.5px; border: 1px solid rgba(255,255,255,0.02); }
        
        .stock-meta-row { font-size: 0.85rem; color: #64748b; }
        .meta-text { display: inline-flex; align-items: center; color: #94a3b8; }
        .meta-text strong { color: #ffffff; margin-left: 2px; }
        
        .stock-note-subbox { background-color: #1a2333; border-radius: 6px; padding: 6px 12px; font-size: 0.85rem; color: #94a3b8; display: flex; align-items: center; width: fit-content; border-left: 3px solid #3b82f6; }
        .stock-type-badge { font-size: 0.78rem; font-weight: 700; padding: 6px 14px; border-radius: 6px; letter-spacing: 0.8px; text-transform: uppercase; }
        
        .stock-empty-state { padding: 5rem 1rem; background-color: #111827; border-radius: 12px; border: 1px dashed rgba(255,255,255,0.05); }
        .stock-empty-icon { color: #334155; }
        .stock-empty-text { color: #64748b; font-size: 0.92rem; margin: 0; }
        
        @media(max-width: 576px) {
          .stock-timeline-card { flex-direction: column; align-items: flex-start; }
          .stock-card-right { width: 100%; text-align: left !important; margin-top: 10px; padding-left: 3rem; }
        }
      `}</style>
    </div>
  );
}