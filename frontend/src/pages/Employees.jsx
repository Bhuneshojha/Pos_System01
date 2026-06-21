import React, { useEffect, useState, useMemo } from "react";
import { FaUsers, FaUserCheck, FaUserClock, FaUserMinus, FaSearch, FaUserPlus, FaEdit, FaTrash, FaInbox } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL, getAuthHeaders } from "../config";

const API_URL = `${API_BASE_URL}/employees`;

const statusBadge = (s) => {
  const map = {
    active: { cls: "dark-pill-success", label: "Active" },
    on_leave: { cls: "dark-pill-warning", label: "On Leave" },
    inactive: { cls: "dark-pill-danger", label: "Inactive" },
  };
  return map[s] || { cls: "dark-pill-muted", label: s };
};

// Generates avatar initials from first and last name safely
const getInitials = (first, last) => {
  return `${(first || "E")[0]}${(last || "")[0] || ""}`.toUpperCase();
};

const avatarColor = (name) => {
  const colors = ["#e94560", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444"];
  return colors[(name || "E").charCodeAt(0) % colors.length];
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [dbOptions, setDbOptions] = useState({ departments: [], jobs: [] });
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    department_id: "", job_id: "", salary: "", status: "active", hire_date: ""
  });

  // Fetch data from database on mount
  useEffect(() => {
    fetchMetadataAndEmployees();
  }, []);

  const fetchMetadataAndEmployees = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      // 1. Fetch dynamic options for dropdowns
      const metaRes = await fetch(`${API_URL}/metadata/options`, { headers });
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        setDbOptions(metaData);
        
        // Auto-select first options as default inside initial form state later
        if (metaData.departments?.length && metaData.jobs?.length) {
          setForm(prev => ({
            ...prev,
            department_id: metaData.departments[0].department_id,
            job_id: metaData.jobs[0].job_id
          }));
        }
      }

      // 2. Fetch employee records
      const empRes = await fetch(API_URL, { headers });
      if (!empRes.ok) throw new Error();
      const empData = await empRes.json();
      setEmployees(Array.isArray(empData) ? empData : []);

    } catch (err) {
      console.error(err);
      toast.error("Database connection failed. Unable to fetch records.");
    } finally {
      setLoading(false);
    }
  };

  // Live client-side search/filtering mechanism
  const filtered = useMemo(() => {
    return employees.filter(e => {
      if (!e) return false;
      const q = search.toLowerCase();
      const fullName = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase();
      
      const matchSearch = 
        fullName.includes(q) || 
        (e.email || "").toLowerCase().includes(q) || 
        (e.job_title || "").toLowerCase().includes(q);

      // Filter by dynamic department name string matching
      const matchDept = deptFilter === "All" || e.department_name === deptFilter;
      
      return matchSearch && matchDept;
    });
  }, [search, deptFilter, employees]);

  const openAdd = () => {
    setEditId(null);
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      department_id: dbOptions.departments[0]?.department_id || "",
      job_id: dbOptions.jobs[0]?.job_id || "",
      salary: "",
      status: "active",
      hire_date: new Date().toISOString().split('T')[0] // today's date placeholder
    });
    setShowModal(true);
  };

  const openEdit = (e) => {
    setEditId(e.employee_id);
    
    // Format date string safely from PG timestamp to YYYY-MM-DD for form HTML field
    const formattedDate = e.hire_date ? new Date(e.hire_date).toISOString().split('T')[0] : "";

    setForm({
      first_name: e.first_name || "",
      last_name: e.last_name || "",
      email: e.email || "",
      phone: e.phone || "",
      department_id: e.department_id || "",
      job_id: e.job_id || "",
      salary: e.salary || "",
      status: e.status || "active",
      hire_date: formattedDate
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee permanently from DB?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { 
        method: "DELETE", 
        headers: getAuthHeaders() 
      });
      if (!res.ok) throw new Error();
      toast.success("Profile records cleared safely.");
      fetchMetadataAndEmployees(); // refresh list state
    } catch (err) {
      toast.error("Error purging record. Relational dependency block found.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      return toast.warn("Please populate all necessary fields.");
    }

    try {
      const url = editId ? `${API_URL}/${editId}` : API_URL;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error();
      toast.success(editId ? "Employee modifications saved" : "New employee registered successfully!");
      fetchMetadataAndEmployees();
      setShowModal(false);
    } catch (err) {
      toast.error("Schema validation failed. Check parameter compliance.");
    }
  };

  return (
    <div className="dark-dashboard-wrapper py-5 px-4 px-md-5">
      <ToastContainer theme="dark" position="top-right" />
      
      {/* Header Container Section */}
      <div className="dark-header-container mb-4">
        <div>
          <h1 className="dark-title">Employees Matrix</h1>
          <p className="dark-subtitle">Monitor payroll logs, update dynamic store roles, and departmental staff records.</p>
        </div>
        <button className="btn dark-action-btn" onClick={openAdd}>
          <FaUserPlus size={14} /> Add Employee
        </button>
      </div>

      {/* Summary Scorecard Layout */}
      <div className="row g-3 mb-4">
        {[
          { label: "TOTAL STAFF", value: employees.length, icon: <FaUsers />, color: "#38bdf8", bg: "rgba(56, 189, 248, 0.12)" },
          { label: "ACTIVE PROFILES", value: employees.filter(e => e.status === "active").length, icon: <FaUserCheck />, color: "#34d399", bg: "rgba(52, 211, 153, 0.12)" },
          { label: "ON LEAVE STATUS", value: employees.filter(e => e.status === "on_leave").length, icon: <FaUserClock />, color: "#fbbf24", bg: "rgba(251, 191, 36, 0.12)" },
          { label: "INACTIVE ACCOUNTS", value: employees.filter(e => e.status === "inactive").length, icon: <FaUserMinus />, color: "#f87171", bg: "rgba(248, 113, 113, 0.12)" },
        ].map(s => (
          <div className="col-12 col-sm-6 col-md-4 col-xl-3" key={s.label}>
            <div className="dark-metric-card">
              <div className="dark-icon-wrapper" style={{ backgroundColor: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <div>
                <span className="dark-metric-caption" style={{ color: s.color }}>{s.label}</span>
                <h3 className="dark-metric-value">{s.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Toolbar controls */}
      <div className="row g-3 mb-4 align-items-center">
        <div className="col-12 col-md-8">
          <div className="dark-search-group">
            <span className="dark-search-icon"><FaSearch /></span>
            <input 
              type="text" 
              className="form-control dark-input-field shadow-none" 
              placeholder="Search employees by full name, database roles, or emails..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>
        <div className="col-12 col-md-4">
          <select 
            className="form-select dark-select-dropdown shadow-none" 
            value={deptFilter} 
            onChange={e => setDeptFilter(e.target.value)}
          >
            <option value="All">All Departments</option>
            {dbOptions.departments.map(d => (
              <option key={d.department_id} value={d.department_name}>{d.department_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-info" role="status" /></div>
      ) : (
        <div className="dark-table-card">
          <div className="table-responsive">
            <table className="table dark-custom-table align-middle m-0">
              <thead>
                <tr>
                  <th>Employee Identity</th>
                  <th>Role Designation</th>
                  <th>Department</th>
                  <th>Contact Phone</th>
                  <th>Salary (PKR)</th>
                  <th>Joined Period</th>
                  <th>Current Status</th>
                  <th className="text-end">Actions Hub</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-0">
                      <div className="dark-empty-state text-center">
                        <FaInbox size={32} className="dark-empty-icon mb-2" />
                        <p className="dark-no-records-msg">No active database records matched this structural layout range.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(e => {
                    const fullName = `${e.first_name} ${e.last_name || ""}`;
                    const { cls, label } = statusBadge(e.status);
                    return (
                      <tr key={e.employee_id}>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div className="dark-avatar-circle" style={{ backgroundColor: avatarColor(e.first_name) }}>
                              {getInitials(e.first_name, e.last_name)}
                            </div>
                            <div className="overflow-hidden">
                              <div className="dark-emp-name text-truncate">{fullName}</div>
                              <div className="dark-emp-email text-truncate">{e.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="dark-text-regular">{e.job_title || "Unassigned"}</td>
                        <td><span className="dark-pill-cyan">{e.department_name || "General"}</span></td>
                        <td className="dark-text-muted">{e.phone || "---"}</td>
                        <td className="dark-text-salary">{e.salary ? Number(e.salary).toLocaleString() : "0"}</td>
                        <td className="dark-text-muted">
                          {e.hire_date ? new Date(e.hire_date).toLocaleDateString('en-US', {month:'short', year:'numeric'}) : "---"}
                        </td>
                        <td><span className={`dark-pill-base ${cls}`}>{label}</span></td>
                        <td>
                          <div className="d-flex gap-2 justify-content-end">
                            <button className="dark-minimal-btn edit-color" onClick={() => openEdit(e)} title="Modify Profile">
                              <FaEdit size={14} /> <span>Edit</span>
                            </button>
                            <button className="dark-minimal-btn delete-color" onClick={() => handleDelete(e.employee_id)} title="Purge Record">
                              <FaTrash size={13} /> <span>Remove</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Structured Modal Pop-over Architecture */}
      {showModal && (
        <div className="dark-custom-modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="dark-modal-surface-container">
            <form onSubmit={handleSave} className="m-0">
              <div className="dark-modal-header d-flex justify-content-between align-items-center px-4 py-3">
                <h5 className="modal-title-text m-0">{editId ? "Modify Staff Credentials" : "Register New Core Employee"}</h5>
                <button type="button" className="dark-modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="dark-modal-body p-4">
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <label className="dark-field-label">First Name <span className="text-danger">*</span></label>
                    <input type="text" required className="form-control dark-modal-input" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="Ahmed" />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="dark-field-label">Last Name <span className="text-danger">*</span></label>
                    <input type="text" required className="form-control dark-modal-input" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} placeholder="Raza" />
                  </div>
                  <div className="col-12">
                    <label className="dark-field-label">Email Handle <span className="text-danger">*</span></label>
                    <input type="email" required className="form-control dark-modal-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="username@pos.pk" />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="dark-field-label">Role Job Designation</label>
                    <select className="form-select dark-modal-input" value={form.job_id} onChange={e => setForm({ ...form, job_id: e.target.value })}>
                      {dbOptions.jobs.map(j => <option key={j.job_id} value={j.job_id}>{j.job_title}</option>)}
                    </select>
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="dark-field-label">Department Hub</label>
                    <select className="form-select dark-modal-input" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
                      {dbOptions.departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
                    </select>
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="dark-field-label">Phone Line Contact</label>
                    <input type="text" className="form-control dark-modal-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 0300-1234567" />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="dark-field-label">Base Salary (PKR)</label>
                    <input type="number" min="0" className="form-control dark-modal-input" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="e.g. 45000" />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="dark-field-label">Hire Date</label>
                    <input type="date" className="form-control dark-modal-input" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="dark-field-label">Operational Status</label>
                    <select className="form-select dark-modal-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Active Status</option>
                      <option value="on_leave">On Leave / Vacation</option>
                      <option value="inactive">Inactive / Terminated</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="dark-modal-footer d-flex justify-content-end gap-2 px-4 py-3">
                <button type="button" className="btn dark-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn dark-btn-primary">{editId ? "Save Changes" : "Confirm Addition"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styled Sheets Engine matching System Architecture */}
      <style>{`
        .dark-dashboard-wrapper {
          background-color: #0b0f19; min-height: 100vh; width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .dark-header-container {
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 1.5rem;
        }
        .dark-title { font-size: 1.75rem; font-weight: 700; color: #ffffff; margin: 0; }
        .dark-subtitle { font-size: 0.9rem; color: #94a3b8; margin: 4px 0 0 0; }
        
        .dark-action-btn {
          background-color: #0284c7; color: #ffffff !important;
          font-weight: 600; font-size: 0.88rem; padding: 10px 20px;
          border-radius: 8px; border: none; display: flex; align-items: center; gap: 8px;
          transition: background 0.2s ease;
        }
        .dark-action-btn:hover { background-color: #0369a1; }

        .dark-metric-card {
          background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem;
        }
        .dark-icon-wrapper {
          width: 40px; height: 40px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
        }
        .dark-metric-caption { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.5px; }
        .dark-metric-value { font-size: 1.5rem; font-weight: 700; color: #ffffff; margin: 2px 0 0 0; }

        .dark-search-group { position: relative; display: flex; align-items: center; }
        .dark-search-icon { position: absolute; left: 16px; color: #94a3b8; display: flex; align-items: center; }
        .dark-input-field {
          width: 100%; background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px; padding: 12px 12px 12px 46px; font-size: 0.92rem; color: #ffffff !important;
        }
        .dark-input-field:focus {
          border-color: #0284c7; background-color: #161e2e; box-shadow: 0 0 0 3px rgba(2,132,199,0.2);
        }
        .dark-input-field::placeholder { color: #94a3b8 !important; opacity: 1 !important; }

        .dark-select-dropdown {
          background-color: #111827 !important; border: 1px solid rgba(255, 255, 255, 0.12) !important;
          color: #ffffff !important; border-radius: 8px !important; padding: 11px 16px !important; font-size: 0.92rem !important;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e") !important;
        }
        .dark-select-dropdown:focus { border-color: #0284c7 !important; }

        .dark-table-card {
          background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; overflow: hidden;
        }
        .dark-custom-table thead { background-color: #1f2937; }
        .dark-custom-table th {
          color: #94a3b8; font-size: 0.78rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.5px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding: 14px 20px;
        }
        .dark-custom-table td { border-bottom: 1px solid rgba(255, 255, 255, 0.04); padding: 14px 20px; color: #f1f5f9; }
        .dark-custom-table tbody tr:hover td { background-color: rgba(255, 255, 255, 0.01); }

        .dark-avatar-circle {
          width: 36px; height: 36px; border-radius: 50%; color: #ffffff;
          font-size: 0.78rem; font-weight: 700; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
        }
        .dark-emp-name { font-size: 0.92rem; font-weight: 600; color: #ffffff; }
        .dark-emp-email { font-size: 0.78rem; color: #94a3b8; }
        
        .dark-text-regular { font-size: 0.9rem; color: #e2e8f0; }
        .dark-text-muted { font-size: 0.85rem; color: #94a3b8; }
        .dark-text-salary { font-size: 0.9rem; font-weight: 600; color: #38bdf8; }

        .dark-pill-cyan { background-color: rgba(6, 182, 212, 0.15); color: #22d3ee; font-size: 0.72rem; font-weight: 700; padding: 3px 10px; border-radius: 6px; }
        .dark-pill-base { font-size: 0.72rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; display: inline-block; }
        .dark-pill-success { background-color: rgba(16, 185, 129, 0.15); color: #34d399; }
        .dark-pill-warning { background-color: rgba(245, 158, 11, 0.15); color: #fbbf24; }
        .dark-pill-danger { background-color: rgba(239, 68, 68, 0.15); color: #f87171; }
        .dark-pill-muted { background-color: rgba(255, 255, 255, 0.06); color: #94a3b8; }

        .dark-minimal-btn {
          background: transparent; border: none; font-size: 0.82rem; font-weight: 600;
          display: flex; align-items: center; gap: 6px; padding: 4px 8px; transition: opacity 0.2s;
        }
        .dark-minimal-btn:hover { opacity: 0.8; text-decoration: underline; }
        .dark-minimal-btn.edit-color { color: #38bdf8; }
        .dark-minimal-btn.delete-color { color: #f87171; }

        .dark-empty-state { padding: 5rem 1rem; }
        .dark-empty-icon { color: #4b5563 !important; }
        .dark-no-records-msg { color: #cbd5e1 !important; font-size: 0.95rem; font-weight: 500; margin: 0; }

        /* MODAL ARCHITECTURE STYLING */
        .dark-custom-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(0, 0, 0, 0.65); display: flex; align-items: center;
          justify-content: center; z-index: 1050; padding: 1rem; backdrop-filter: blur(2px);
        }
        .dark-modal-surface-container {
          background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px; max-width: 540px; width: 100%; overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6); animation: darkModalReveal 0.2s ease-out;
        }
        @keyframes darkModalReveal { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        
        .dark-modal-header { border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
        .modal-title-text { font-size: 1.1rem; font-weight: 700; color: #ffffff; }
        .dark-modal-close-btn { background: transparent; border: none; color: #94a3b8; font-size: 1rem; cursor: pointer; }
        .dark-modal-close-btn:hover { color: #ffffff; }

        .dark-field-label { font-size: 0.82rem; font-weight: 600; color: #cbd5e1; margin-bottom: 6px; display: block; }
        
        .dark-modal-input {
          background-color: #1f2937 !important; border: 1px solid #4b5563 !important;
          color: #ffffff !important; border-radius: 8px !important; padding: 10px 14px !important; font-size: 0.9rem !important;
        }
        .dark-modal-input:focus {
          border-color: #38bdf8 !important; box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25) !important; outline: none;
        }
        .dark-modal-input::placeholder { color: #9ca3af !important; }

        .dark-modal-footer { border-top: 1px solid rgba(255, 255, 255, 0.08); background-color: #1f2937; }
        .dark-btn-secondary { color: #94a3b8; font-weight: 600; font-size: 0.88rem; border: none; background: transparent; padding: 8px 16px; }
        .dark-btn-secondary:hover { color: #ffffff; }
        .dark-btn-primary { background-color: #0284c7; color: #ffffff; font-weight: 600; font-size: 0.88rem; padding: 8px 18px; border-radius: 8px; border: none; }
        .dark-btn-primary:hover { background-color: #0369a1; }
      `}</style>
    </div>
  );
}