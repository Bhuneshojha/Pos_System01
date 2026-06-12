import React, { useEffect, useState, useMemo } from "react";
import { FaWarehouse, FaSearch, FaPlus, FaEdit, FaTrash, FaInbox, FaMapMarkerAlt } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL, getAuthHeaders } from "../config";

const API_URL = `${API_BASE_URL}/warehouses`;

export default function Warehouse() {
  const [warehouses, setWarehouses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ warehouse_name: "", location_id: "" });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const headers = { ...getAuthHeaders() };
      const res = await fetch(API_URL, { headers });
      
      if (!res.ok) {
        const txtErr = await res.text();
        throw new Error(`Status ${res.status}: ${txtErr}`);
      }
      
      const data = await res.json();
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("🔴 WAREHOUSE CRITICAL TRACE:", err.message);
      toast.error("Could not sync with the warehouse backend ecosystem.");
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return warehouses.filter(w => {
      if (!w) return false;
      const q = search.toLowerCase();
      const idStr = String(w.warehouse_id || "").toLowerCase();
      const nameStr = String(w.warehouse_name || "").toLowerCase();
      const addressStr = String(w.street_address || w.city || "").toLowerCase();
      return idStr.includes(q) || nameStr.includes(q) || addressStr.includes(q);
    });
  }, [search, warehouses]);

  const openAdd = () => {
    setEditId(null);
    setForm({ warehouse_name: "", location_id: "" });
    setShowModal(true);
  };

  const openEdit = (w) => {
    setEditId(w.warehouse_id);
    setForm({ 
      warehouse_name: w.warehouse_name || "", 
      location_id: w.location_id || "" 
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm({ warehouse_name: "", location_id: "" });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.warehouse_name.trim()) return toast.warn("Warehouse title string empty.");

    try {
      const url = editId ? `${API_URL}/${editId}` : API_URL;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ 
          warehouse_name: form.warehouse_name.trim(),
          location_id: form.location_id ? parseInt(form.location_id, 10) : null
        })
      });

      if (!res.ok) {
        const serverErr = await res.json();
        throw new Error(serverErr.error || "Failed database action.");
      }

      toast.success(editId ? "Warehouse records aligned." : "New warehouse facility active!");
      fetchWarehouses();
      closeModal();
    } catch (err) {
      toast.error(err.message || "Operation processing error.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Retire this storage warehouse entry permanently?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { 
        method: "DELETE", 
        headers: { ...getAuthHeaders() } 
      });

      if (!res.ok) throw new Error();

      toast.success("Warehouse records dropped cleanly.");
      fetchWarehouses();
    } catch (err) {
      toast.error("Cannot delete warehouse. Active stocks inside standard variants.");
    }
  };

  return (
    <div className="modern-dashboard py-5 px-4 px-md-5">
      <ToastContainer theme="dark" position="top-right" />

      {/* Top Main Header Control */}
      <div className="modern-header mb-4">
        <div>
          <h1 className="modern-title">Warehouse Management</h1>
          <p className="modern-subtitle">Monitor layout records, configure inventory hubs, and link geolocation logs.</p>
        </div>
        <button className="btn modern-add-btn" onClick={openAdd}>
          <FaPlus size={11} /> Add Warehouse
        </button>
      </div>

      {/* Aggregate Status Indicator Hub */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-md-4 col-xl-3">
          <div className="modern-stat-card">
            <div className="modern-icon-bg"><FaWarehouse /></div>
            <div>
              <span className="modern-stat-label">TOTAL UNITS</span>
              <h3 className="modern-stat-value">{warehouses.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Live Search Engine Input */}
      <div className="modern-search-wrapper mb-4">
        <span className="modern-search-icon"><FaSearch /></span>
        <input 
          type="text" 
          className="form-control modern-search-input shadow-none" 
          placeholder="Search warehouses by name, location string parameters, or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Core Table Grid Block */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
      ) : (
        <div className="modern-table-card">
          <div className="table-responsive">
            <table className="table modern-table align-middle m-0">
              <thead>
                <tr>
                  <th style={{ width: "20%" }}>FACILITY ID</th>
                  <th style={{ width: "45%" }}>WAREHOUSE DESIGNATION</th>
                  <th style={{ width: "20%" }}>GEOLOCATION PROFILE</th>
                  <th style={{ width: "15%" }} className="text-end">ACTIONS HUB</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-0">
                      <div className="modern-empty-state text-center">
                        <FaInbox size={32} className="modern-empty-icon mb-2" />
                        <p className="modern-empty-text">No active warehouses match your layout parameter inputs.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(w => (
                    <tr key={w.warehouse_id}>
                      <td className="modern-id-text">#{w.warehouse_id}</td>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div className="modern-avatar-frame"><FaWarehouse size={14} /></div>
                          <span className="modern-core-name">{w.warehouse_name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="modern-location-text">
                          <FaMapMarkerAlt className="me-2" size={12} style={{ color: "#38bdf8" }} />
                          {w.city ? `${w.street_address || ""}, ${w.city}` : "No Location Linked"}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-3 justify-content-end">
                          <button className="action-btn-link edit" onClick={() => openEdit(w)}>
                            <FaEdit size={14} /> <span>Edit</span>
                          </button>
                          <button className="action-btn-link delete" onClick={() => handleDelete(w.warehouse_id)}>
                            <FaTrash size={13} /> <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* High Visibility Overlay Input Modal Sheet */}
      {showModal && (
        <div className="modern-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modern-modal-card">
            <form onSubmit={handleSave} className="m-0">
              <div className="modern-modal-header d-flex justify-content-between align-items-center px-4 py-3">
                <h5 className="modal-title m-0">{editId ? "Update Facility Log" : "Register New Facility Unit"}</h5>
                <button type="button" className="modern-close-btn" onClick={closeModal}>✕</button>
              </div>
              <div className="modern-modal-body p-4">
                <div className="mb-3">
                  <label className="modern-label">Warehouse Name Designation <span className="text-danger">*</span></label>
                  <input 
                    type="text" required maxLength={100}
                    className="form-control modern-input shadow-none" 
                    placeholder="e.g. Main Distribution Center, Hub Alpha"
                    value={form.warehouse_name}
                    onChange={e => setForm({ ...form, warehouse_name: e.target.value })}
                  />
                </div>
                <div className="mb-1">
                  <label className="modern-label">Location ID Reference Index (Optional)</label>
                  <input 
                    type="number" className="form-control modern-input shadow-none" 
                    placeholder="e.g. 1, 2, 3"
                    value={form.location_id}
                    onChange={e => setForm({ ...form, location_id: e.target.value })}
                  />
                </div>
              </div>
              <div className="modern-modal-footer d-flex justify-content-end gap-2 px-4 py-3">
                <button type="button" className="btn modern-btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn modern-btn-save">Save Facility</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .modern-dashboard { background-color: #0b0f19; min-height: 100vh; width: 100%; font-family: 'Inter', sans-serif; }
        .modern-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; padding-bottom: 1rem; }
        .modern-title { font-size: 1.75rem; font-weight: 700; color: #ffffff; margin: 0; }
        .modern-subtitle { font-size: 0.9rem; color: #94a3b8; margin: 4px 0 0 0; opacity: 0.8; }
        
        .modern-add-btn { background-color: #3b82f6; color: #ffffff !important; font-weight: 500; font-size: 0.88rem; padding: 10px 20px; border-radius: 8px; border: none; display: flex; align-items: center; gap: 8px; transition: background 0.15s ease; }
        .modern-add-btn:hover { background-color: #2563eb; }
        
        .modern-stat-card { background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; max-width: 280px; }
        .modern-icon-bg { width: 42px; height: 42px; border-radius: 8px; background-color: rgba(59, 130, 246, 0.1); color: #60a5fa; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
        .modern-stat-label { font-size: 0.75rem; font-weight: 700; color: #38bdf8; letter-spacing: 0.5px; }
        .modern-stat-value { font-size: 1.6rem; font-weight: 700; color: #ffffff; margin: 0; }
        
        .modern-search-wrapper { position: relative; display: flex; align-items: center; }
        .modern-search-icon { position: absolute; left: 16px; color: #64748b; }
        .modern-search-input { width: 100%; background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px 12px 12px 46px; font-size: 0.9rem; color: #ffffff !important; }
        .modern-search-input:focus { border-color: #3b82f6; background-color: #131c2e; }
        .modern-search-input::placeholder { color: #475569; }
        
        .modern-table-card { background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; overflow: hidden; }
        .modern-table th { color: #94a3b8 !important; font-size: 0.8rem; font-weight: 600; padding: 16px 24px; border: none; background-color: #111827; text-transform: uppercase; letter-spacing: 0.5px; }
        .modern-table td { padding: 16px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); background-color: #111827; vertical-align: middle; }
        
        .modern-id-text { font-size: 0.9rem; color: #64748b !important; font-weight: 500; }
        .modern-avatar-frame { width: 32px; height: 32px; background-color: rgba(255, 255, 255, 0.03); color: #94a3b8; border-radius: 6px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 255, 255, 0.05); }
        .modern-core-name { font-size: 0.95rem; font-weight: 500; color: #ffffff !important; }
        .modern-location-text { font-size: 0.9rem; color: #94a3b8; display: flex; align-items: center; }
        
        .action-btn-link { background: transparent; border: none; font-size: 0.88rem; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; padding: 0; transition: color 0.15s; cursor: pointer; }
        .action-btn-link.edit { color: #60a5fa !important; }
        .action-btn-link.edit:hover { color: #3b82f6 !important; }
        .action-btn-link.delete { color: #f87171 !important; }
        .action-btn-link.delete:hover { color: #ef4444 !important; }
        
        .modern-empty-state { padding: 4rem 1rem; background-color: #111827; }
        .modern-empty-icon { color: #334155; }
        .modern-empty-text { color: #64748b; font-size: 0.9rem; margin: 0; }
        
        /* Fixed High Contrast Modal Sheet Layer */
        .modern-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem; backdrop-filter: blur(5px); }
        .modern-modal-card { background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 12px; max-width: 480px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8); }
        .modern-modal-header { border-bottom: 1px solid rgba(255, 255, 255, 0.08); background-color: #131c2e; }
        .modal-title { font-size: 1.15rem; font-weight: 600; color: #ffffff; }
        .modern-close-btn { background: transparent; border: none; color: #94a3b8; font-size: 1.15rem; }
        .modern-close-btn:hover { color: #ffffff; }
        
        .modern-label { font-size: 0.86rem; font-weight: 600; color: #94a3b8; margin-bottom: 8px; display: block; letter-spacing: 0.2px; }
        
        /* Fixed Input Text & Placeholder Contrast */
        .modern-input { background-color: #1f2937 !important; border: 1px solid #374151 !important; color: #ffffff !important; border-radius: 8px !important; padding: 12px 14px !important; font-size: 0.92rem !important; }
        .modern-input:focus { border-color: #3b82f6 !important; background-color: #1f2937 !important; color: #ffffff !important; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25) !important; }
        .modern-input::placeholder { color: #64748b !important; opacity: 1 !important; }
        
        .modern-modal-footer { border-top: 1px solid rgba(255, 255, 255, 0.08); background-color: #131c2e; }
        .modern-btn-cancel { color: #94a3b8; font-weight: 500; background: transparent; border: none; padding: 10px 18px; font-size: 0.88rem; }
        .modern-btn-cancel:hover { color: #ffffff; }
        .modern-btn-save { background-color: #3b82f6; color: #ffffff; font-weight: 500; padding: 10px 20px; border-radius: 8px; border: none; font-size: 0.88rem; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2); }
        .modern-btn-save:hover { background-color: #2563eb; }
      `}</style>
    </div>
  );
}