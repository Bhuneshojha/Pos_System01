import React, { useEffect, useState, useMemo } from "react";
import { FaBuilding, FaSearch, FaPlus, FaEdit, FaTrash, FaInbox, FaFolderOpen } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL, getAuthHeaders } from "../config";

const API_URL = `${API_BASE_URL}/departments`;

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ department_name: "" });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const headers = { ...getAuthHeaders() };
      const res = await fetch(API_URL, { headers });
      
      if (!res.ok) throw new Error(`Server returned status: ${res.status}`);
      
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : (data.rows || []));
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Database connection failed. Unable to fetch department logs.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return departments.filter(d => {
      if (!d) return false;
      const q = search.toLowerCase();
      const idStr = String(d.department_id || "").toLowerCase();
      const nameStr = String(d.department_name || "").toLowerCase();
      return idStr.includes(q) || nameStr.includes(q);
    });
  }, [search, departments]);

  const openAdd = () => {
    setEditId(null);
    setForm({ department_name: "" });
    setShowModal(true);
  };

  const openEdit = (d) => {
    setEditId(d.department_id);
    setForm({ department_name: d.department_name || "" });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm({ department_name: "" });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.department_name.trim()) return toast.warn("Department name is required.");

    try {
      const url = editId ? `${API_URL}/${editId}` : API_URL;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ department_name: form.department_name.trim() })
      });

      if (!res.ok) throw new Error("Failed to save transaction.");

      toast.success(editId ? "Department updated successfully!" : "New department added successfully!");
      fetchDepartments();
      closeModal();
    } catch (err) {
      toast.error(err.message || "Operation failed.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this department permanently?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { 
        method: "DELETE", 
        headers: { ...getAuthHeaders() } 
      });

      if (!res.ok) throw new Error();

      toast.success("Department record scrubbed.");
      fetchDepartments();
    } catch (err) {
      toast.error("Cannot delete department with active employee dependencies.");
    }
  };

  return (
    <div className="modern-dashboard py-5 px-4 px-md-5">
      <ToastContainer theme="dark" position="top-right" />

      {/* Dynamic Upper Header Layout */}
      <div className="modern-header mb-4">
        <div>
          <h1 className="modern-title">Departments Ledger</h1>
          <p className="modern-subtitle">Manage corporate sectors, view allocation contexts, and audit store units.</p>
        </div>
        <button className="btn modern-add-btn" onClick={openAdd}>
          <FaPlus size={11} /> Add Department
        </button>
      </div>

      {/* Total Aggregation Widget Card */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-md-4 col-xl-3">
          <div className="modern-stat-card">
            <div className="modern-icon-bg"><FaFolderOpen /></div>
            <div>
              <span className="modern-stat-label">TOTAL SECTORS</span>
              <h3 className="modern-stat-value">{departments.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Search Context Engine */}
      <div className="modern-search-wrapper mb-4">
        <span className="modern-search-icon"><FaSearch /></span>
        <input 
          type="text" 
          className="form-control modern-search-input shadow-none" 
          placeholder="Filter modules by department titles, workspace strings, or IDs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Clean Grid Core Table Surface */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
      ) : (
        <div className="modern-table-card">
          <div className="table-responsive">
            <table className="table modern-table align-middle m-0">
              <thead>
                <tr>
                  <th style={{ width: "20%" }}>SECTOR INDEX</th>
                  <th style={{ width: "55%" }}>DEPARTMENT NAME DESIGNATION</th>
                  <th style={{ width: "25%" }} className="text-end">ACTIONS HUB</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-0">
                      <div className="modern-empty-state text-center">
                        <FaInbox size={32} className="modern-empty-icon mb-2" />
                        <p className="modern-empty-text">No active business sectors match your text inputs layout parameter.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(d => (
                    <tr key={d.department_id}>
                      <td className="modern-id-text">#{d.department_id}</td>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div className="modern-avatar-frame"><FaBuilding size={14} /></div>
                          <span className="modern-core-name">{d.department_name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-3 justify-content-end">
                          <button className="action-btn-link edit" onClick={() => openEdit(d)}>
                            <FaEdit size={14} /> <span>Edit</span>
                          </button>
                          <button className="action-btn-link delete" onClick={() => handleDelete(d.department_id)}>
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

      {/* Popup Input Sheet Modal Dialog */}
      {showModal && (
        <div className="modern-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modern-modal-card">
            <form onSubmit={handleSave} className="m-0">
              <div className="modern-modal-header d-flex justify-content-between align-items-center px-4 py-3">
                <h5 className="modal-title m-0">{editId ? "Modify Department Record" : "Register Department Profile"}</h5>
                <button type="button" className="modern-close-btn" onClick={closeModal}>✕</button>
              </div>
              <div className="modern-modal-body p-4">
                <div className="mb-2">
                  <label className="modern-label">Department Name Designation <span className="text-danger">*</span></label>
                  <input 
                    type="text" required maxLength={100}
                    className="form-control modern-input" 
                    placeholder="e.g. Sales, Human Resources, Logistics"
                    value={form.department_name}
                    onChange={e => setForm({ department_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="modern-modal-footer d-flex justify-content-end gap-2 px-4 py-3">
                <button type="button" className="btn modern-btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn modern-btn-save">Commit Changes</button>
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
        
        .action-btn-link { background: transparent; border: none; font-size: 0.88rem; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; padding: 0; transition: color 0.15s; cursor: pointer; }
        .action-btn-link.edit { color: #60a5fa !important; }
        .action-btn-link.edit:hover { color: #3b82f6 !important; }
        .action-btn-link.delete { color: #f87171 !important; }
        .action-btn-link.delete:hover { color: #ef4444 !important; }
        
        .modern-empty-state { padding: 4rem 1rem; background-color: #111827; }
        .modern-empty-icon { color: #334155; }
        .modern-empty-text { color: #64748b; font-size: 0.9rem; margin: 0; }
        
        .modern-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem; backdrop-filter: blur(4px); }
        .modern-modal-card { background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; max-width: 460px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); }
        .modern-modal-header { border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .modal-title { font-size: 1.1rem; font-weight: 600; color: #ffffff; }
        .modern-close-btn { background: transparent; border: none; color: #64748b; font-size: 1.1rem; }
        .modern-close-btn:hover { color: #ffffff; }
        
        .modern-label { font-size: 0.85rem; font-weight: 500; color: #94a3b8; margin-bottom: 6px; display: block; }
        .modern-input { background-color: #1f2937 !important; border: 1px solid #374151 !important; color: #ffffff !important; border-radius: 8px !important; padding: 10px 14px !important; font-size: 0.9rem !important; }
        .modern-input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important; }
        
        .modern-modal-footer { border-top: 1px solid rgba(255, 255, 255, 0.05); background-color: #111827; }
        .modern-btn-cancel { color: #94a3b8; font-weight: 500; background: transparent; border: none; padding: 10px 18px; font-size: 0.88rem; }
        .modern-btn-cancel:hover { color: #ffffff; }
        .modern-btn-save { background-color: #3b82f6; color: #ffffff; font-weight: 500; padding: 10px 18px; border-radius: 8px; border: none; font-size: 0.88rem; }
        .modern-btn-save:hover { background-color: #2563eb; }
      `}</style>
    </div>
  );
}