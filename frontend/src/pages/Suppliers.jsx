import React, { useEffect, useState, useMemo } from "react";
import { FaTruck, FaEdit, FaTrash, FaSearch, FaBuilding, FaInbox, FaFolderOpen } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL, getAuthHeaders } from "../config";

const API_URL = `${API_BASE_URL}/suppliers`;

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ supplier_name: "" });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL, { headers: { ...getAuthHeaders() } });
      if (!res.ok) throw new Error(`HTTP Code ${res.status}`);
      const data = await res.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("API error or unauthorized route token match failure.");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s && (s.supplier_name || "").toLowerCase().includes(search.toLowerCase()) ||
      String(s?.supplier_id || "").includes(search)
    );
  }, [search, suppliers]);

  const openModal = (supplier = null) => {
    if (supplier) {
      setEditId(supplier.supplier_id);
      setForm({ supplier_name: supplier.supplier_name || "" });
    } else {
      setEditId(null);
      setForm({ supplier_name: "" });
    }
    if (window.bootstrap?.Modal) {
      const modalInstance = new window.bootstrap.Modal(document.getElementById("darkSupplierModal"));
      modalInstance.show();
    }
  };

  const closeModal = () => {
    const element = document.getElementById("darkSupplierModal");
    const instance = window.bootstrap?.Modal?.getInstance(element);
    if (instance) instance.hide();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplier_name.trim()) return;

    try {
      const url = editId ? `${API_URL}/${editId}` : API_URL;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ supplier_name: form.supplier_name.trim() })
      });

      if (!res.ok) throw new Error();
      toast.success(editId ? "Entry modification saved" : "New entry added successfully");
      fetchSuppliers();
      closeModal();
    } catch (err) {
      toast.error("Process validation failed. Check system logs.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this profile?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE", headers: { ...getAuthHeaders() } });
      if (!res.ok) throw new Error();
      toast.success("Profile removed cleanly");
      fetchSuppliers();
    } catch (err) {
      toast.error("Cannot delete vendor. It has active product mapping relations.");
    }
  };

  return (
    <div className="dark-dashboard-wrapper py-5 px-4 px-md-5">
      <ToastContainer theme="dark" position="top-right" />

      {/* Header Grid Layout */}
      <div className="dark-header-container mb-4">
        <div>
          <h1 className="dark-title">Suppliers</h1>
          <p className="dark-subtitle">Manage system vendors, tracking references, and operational procurement hubs.</p>
        </div>
        <button className="btn dark-action-btn" onClick={() => openModal()}>
          <FaTruck size={14} /> Add Supplier
        </button>
      </div>

      {/* Summary Card Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-md-4 col-xl-3">
          <div className="dark-metric-card">
            <div className="dark-icon-wrapper">
              <FaFolderOpen size={16} />
            </div>
            <div>
              <span className="dark-metric-caption">TOTAL SUPPLIERS</span>
              <h3 className="dark-metric-value">{suppliers.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar Input */}
      <div className="dark-search-group mb-4">
        <span className="dark-search-icon"><FaSearch /></span>
        <input 
          type="text" 
          className="form-control dark-input-field shadow-none" 
          placeholder="Filter database rows by name tags, system indexes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid Output */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-info" role="status" /></div>
      ) : (
        <div className="row g-3">
          {filteredSuppliers.length > 0 ? (
            filteredSuppliers.map((s) => (
              <div key={s.supplier_id} className="col-12 col-md-6 col-xl-4">
                <div className="dark-data-card">
                  <div className="dark-card-identity">
                    <div className="dark-avatar-icon">
                      <FaBuilding size={16} />
                    </div>
                    <div className="overflow-hidden">
                      <h5 className="dark-firm-title text-truncate" title={s.supplier_name}>{s.supplier_name}</h5>
                      <div className="dark-badge-container">
                        <span className="dark-pill-cyan">ID: #{s.supplier_id}</span>
                        <span className="dark-pill-muted">STORE: #{s.store_id}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="dark-actions-strip">
                    <button className="dark-minimal-btn edit-color" onClick={() => openModal(s)}>
                      <FaEdit /> Edit
                    </button>
                    <button className="dark-minimal-btn delete-color" onClick={() => handleDelete(s.supplier_id)}>
                      <FaTrash /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12">
              <div className="dark-empty-state text-center">
                <FaInbox size={32} className="dark-empty-icon mb-2" />
                <p className="dark-no-records-msg">No active datasets or matches available in this scope.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* High Contrast Dark Form Modal */}
      <div className="modal fade" id="darkSupplierModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
          <form className="modal-content dark-modal-surface" onSubmit={handleSubmit}>
            <div className="modal-header px-4 py-3 d-flex justify-content-between align-items-center">
              <h5 className="modal-title-text m-0">{editId ? "Update Data Record" : "Create New Supplier Profile"}</h5>
              <button type="button" className="btn-close btn-close-white shadow-none" data-bs-dismiss="modal" onClick={closeModal} />
            </div>

            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="dark-field-label">Supplier / Vendor Name <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  className="form-control dark-modal-input" 
                  name="supplier_name" 
                  required 
                  maxLength={200}
                  placeholder="e.g. Acme Logistics Corp"
                  value={form.supplier_name}
                  onChange={(e) => setForm({ supplier_name: e.target.value })}
                />
                <div className="dark-field-helper">Ensure strings match your database records exactly.</div>
              </div>
            </div>

            <div className="modal-footer px-4 py-3 gap-2">
              <button type="button" className="btn dark-btn-secondary" data-bs-dismiss="modal" onClick={closeModal}>Cancel</button>
              <button type="submit" className="btn dark-btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>

      {/* Styled JSX block injected safely inside React compilation architecture */}
      <style>{`
        .dark-dashboard-wrapper {
          background-color: #0b0f19; 
          min-height: 100vh;
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .dark-header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 1.5rem;
        }
        .dark-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }
        .dark-subtitle {
          font-size: 0.9rem;
          color: #94a3b8;
          margin: 4px 0 0 0;
        }
        .dark-action-btn {
          background-color: #0284c7;
          color: #ffffff !important;
          font-weight: 600;
          font-size: 0.88rem;
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s ease;
        }
        .dark-action-btn:hover { background-color: #0369a1; }

        .dark-metric-card {
          background-color: #111827;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .dark-icon-wrapper {
          width: 40px; height: 40px;
          border-radius: 8px;
          background-color: rgba(2, 132, 199, 0.15);
          color: #38bdf8;
          display: flex; align-items: center; justify-content: center;
        }
        .dark-metric-caption { font-size: 0.72rem; font-weight: 700; color: #38bdf8; letter-spacing: 0.5px; }
        .dark-metric-value { font-size: 1.5rem; font-weight: 700; color: #ffffff; margin: 2px 0 0 0; }

        .dark-search-group { position: relative; display: flex; align-items: center; }
        .dark-search-icon { position: absolute; left: 16px; color: #94a3b8; display: flex; align-items: center; }

        .dark-input-field {
          width: 100%; background-color: #111827;
          border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px;
          padding: 12px 12px 12px 46px; font-size: 0.92rem; color: #ffffff !important;
        }
        .dark-input-field:focus { 
          border-color: #0284c7; 
          background-color: #161e2e;
          box-shadow: 0 0 0 3px rgba(2,132,199,0.2); 
        }

        /* FIXED PLACEHOLDER CONTRAST */
        .dark-input-field::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
        }

        .dark-data-card {
          background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px; padding: 1.25rem;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .dark-data-card:hover {
          transform: translateY(-2px); border-color: rgba(255, 255, 255, 0.15);
        }
        .dark-card-identity { display: flex; align-items: start; gap: 1rem; }
        .dark-avatar-icon {
          width: 38px; height: 38px; background-color: rgba(255, 255, 255, 0.03);
          color: #cbd5e1; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .dark-firm-title { font-size: 1rem; font-weight: 600; color: #ffffff; margin: 0 0 6px 0; }
        .dark-badge-container { display: flex; gap: 6px; flex-wrap: wrap; }
        .dark-pill-cyan { background-color: rgba(14, 116, 144, 0.2); color: #22d3ee; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
        .dark-pill-muted { background-color: rgba(255, 255, 255, 0.04); color: #94a3b8; font-size: 0.7rem; font-weight: 600; padding: 2px 8px; border-radius: 4px; }

        .dark-actions-strip {
          display: flex; justify-content: flex-end; gap: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.04); margin-top: 1.25rem; padding-top: 0.75rem;
        }
        .dark-minimal-btn { background: transparent; border: none; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 4px; }
        .dark-minimal-btn.edit-color { color: #38bdf8; }
        .dark-minimal-btn.edit-color:hover { color: #0ea5e9; text-decoration: underline; }
        .dark-minimal-btn.delete-color { color: #f87171; }
        .dark-minimal-btn.delete-color:hover { color: #ef4444; text-decoration: underline; }

        /* FIXED EMPTY STATE TEXT VISIBILITY */
        .dark-empty-state { 
          padding: 4.5rem 1rem; 
          background-color: #111827; 
          border: 1px dashed rgba(255, 255, 255, 0.08); 
          border-radius: 12px; 
        }
        .dark-empty-icon {
          color: #64748b !important;
        }
        .dark-no-records-msg { 
          color: #cbd5e1 !important; 
          font-size: 0.95rem; 
          font-weight: 500;
          margin: 0; 
        }

        /* MODAL STRUCTURE */
        .dark-modal-surface { 
          background-color: #111827; 
          border: 1px solid rgba(255, 255, 255, 0.12) !important; 
          border-radius: 14px; 
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); 
          overflow: hidden; 
        }
        .modal-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .modal-title-text { font-size: 1.1rem; font-weight: 700; color: #ffffff; }
        .dark-field-label { font-size: 0.82rem; font-weight: 600; color: #cbd5e1; margin-bottom: 8px; display: block; }

        .dark-modal-input {
          width: 100%; 
          background-color: #1f2937 !important; 
          border: 1px solid #4b5563 !important; 
          color: #ffffff !important; 
          border-radius: 8px !important; 
          padding: 10px 14px !important; 
          font-size: 0.92rem !important;
        }
        .dark-modal-input:focus { 
          border-color: #38bdf8 !important; 
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25) !important; 
          outline: none !important; 
        }
        .dark-modal-input::placeholder {
          color: #9ca3af !important;
        }

        .dark-field-helper { font-size: 0.75rem; color: #94a3b8; margin-top: 6px; }
        .modal-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
          background-color: #1f2937;
        }
        .dark-btn-secondary { color: #94a3b8; font-weight: 600; font-size: 0.88rem; border: none; background: transparent; padding: 8px 16px; }
        .dark-btn-secondary:hover { color: #ffffff; }
        .dark-btn-primary { background-color: #0284c7; color: #ffffff; font-weight: 600; font-size: 0.88rem; padding: 8px 18px; border-radius: 8px; border: none; }
        .dark-btn-primary:hover { background-color: #0369a1; }

        .modal-backdrop { background-color: #000000 !important; opacity: 0.6 !important; }
      `}</style>
    </div>
  );
}

export default Suppliers;