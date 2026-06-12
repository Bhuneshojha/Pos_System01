import React, { useEffect, useState, useMemo } from "react";
import {
  FaUserPlus, FaEdit, FaTrash, FaSearch, FaUser, FaPhone, FaEnvelope, FaStar, FaUsers, FaAward, FaChartPie, FaLightbulb
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL, getAuthHeaders } from "../config";

// ChartJS Framework (Imports Fixed)
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_URL = `${API_BASE_URL}/customers`;

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "", loyalty_points: 0,
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL, { headers: { ...getAuthHeaders() } });
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setCustomers(data);
      } else if (data && Array.isArray(data.rows)) {
        setCustomers(data.rows);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error("Fetch handler dropped:", err);
      toast.error("Database connection failed");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!Array.isArray(customers)) return [];
    if (!search) return customers;

    return customers.filter((c) => {
      if (!c) return false;
      const fName = (c.first_name || "").toLowerCase();
      const lName = (c.last_name || "").toLowerCase();
      const customerId = String(c.customer_id);
      const searchQuery = search.toLowerCase();

      return (
        fName.includes(searchQuery) || 
        lName.includes(searchQuery) || 
        customerId === searchQuery
      );
    });
  }, [search, customers]);

  /* ADVANCED DATA ANALYTICS METRICS COMPILATION */
  const analyticsMetrics = useMemo(() => {
    const total = Array.isArray(customers) ? customers.length : 0;
    if (total === 0) return { platinum: 0, gold: 0, silver: 0, bronze: 0, vipRate: 0 };

    let platinum = 0; // 500+ points
    let gold = 0;     // 200-499 points
    let silver = 0;   // 50-199 points
    let bronze = 0;   // 0-49 points

    customers.forEach(c => {
      const pts = Number(c?.loyalty_points || 0);
      if (pts >= 500) platinum++;
      else if (pts >= 200) gold++;
      else if (pts >= 50) silver++;
      else bronze++;
    });

    const vipRate = Math.round(((platinum + gold) / total) * 100);

    return { platinum, gold, silver, bronze, vipRate };
  }, [customers]);

  const chartDataConfig = useMemo(() => {
    if (!Array.isArray(customers) || customers.length === 0) return null;

    const sorted = [...customers]
      .filter(c => c && c.first_name)
      .sort((a, b) => Number(b.loyalty_points || 0) - Number(a.loyalty_points || 0))
      .slice(0, 5);

    if (sorted.length === 0) return null;

    return {
      labels: sorted.map(c => `${c.first_name || ""} ${(c.last_name || "").substring(0, 1)}.`),
      datasets: [
        {
          label: "Points Balance",
          data: sorted.map(c => Number(c.loyalty_points || 0)),
          backgroundColor: "rgba(56, 189, 248, 0.4)",
          borderColor: "#38bdf8",
          borderWidth: 1.5,
          borderRadius: 6,
        },
      ],
    };
  }, [customers]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openModal = (customer = null) => {
    if (customer) {
      setEditId(customer.customer_id);
      setForm({
        first_name: customer.first_name || "",
        last_name: customer.last_name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        loyalty_points: customer.loyalty_points || 0,
      });
    } else {
      setEditId(null);
      setForm({ first_name: "", last_name: "", email: "", phone: "", loyalty_points: 0 });
    }

    if (window.bootstrap?.Modal) {
      new window.bootstrap.Modal(document.getElementById("customerModal")).show();
    }
  };

  const closeModal = () => {
    const modalEl = document.getElementById("customerModal");
    const instance = window.bootstrap?.Modal?.getInstance(modalEl);
    if (instance) instance.hide();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editId ? `${API_URL}/${editId}` : API_URL;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("API action rejected");
      toast.success("Transaction stored cleanly");
      fetchCustomers();
      closeModal();
    } catch (err) {
      console.error(err);
      toast.error("Process execution failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete entry permanently?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE", headers: { ...getAuthHeaders() } });
      if (!res.ok) throw new Error("Wipe failed");
      toast.success("Profile purged");
      fetchCustomers();
    } catch (err) {
      console.error(err);
      toast.error("Operation rejected");
    }
  };

  const totalConsumers = Array.isArray(customers) ? customers.length : 0;
  const avgPoints = totalConsumers > 0 
    ? Math.round(customers.reduce((acc, c) => acc + Number(c?.loyalty_points || 0), 0) / totalConsumers) 
    : 0;

  return (
    <div style={{ backgroundColor: '#0b0f17', minHeight: '100vh', width: '100%' }}>
      <div className="p-4 p-md-5" style={{ color: '#f1f5f9', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
        <ToastContainer theme="dark" />

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-5">
          <div>
            <h2 className="fw-extrabold text-white mb-1" style={{ letterSpacing: '-1px', background: 'linear-gradient(to right, #fff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Customer Analytics & Records</h2>
            <p className="mb-0 small" style={{ color: '#94a3b8' }}>Monitor customer segments, loyalty token distributions, and walk-in counter registration.</p>
          </div>
          <button className="btn border-0 px-4 py-2 fw-bold text-white rounded-3 shadow" style={{ backgroundColor: '#f97316' }} onClick={() => openModal()}>
            <FaUserPlus className="me-2" /> Walk-in Registration
          </button>
        </div>

        {/* Analytics Insights Banner */}
        <div className="alert border-0 rounded-4 p-3 mb-4 d-flex align-items-center gap-3" style={{ backgroundColor: 'rgba(249, 115, 22, 0.06)', border: '1px solid rgba(249, 115, 22, 0.15)' }}>
          <div className="text-warning"><FaLightbulb size={18} /></div>
          <div style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>
            <span className="fw-bold text-white">Smart Insight:</span> Around <strong className="text-warning">{analyticsMetrics.vipRate}%</strong> of your customer base have attained Premium/VIP cluster heights (Gold & Platinum tiers).
          </div>
        </div>

        {/* Advanced Multi-Metrics Row */}
        <div className="row mb-4 g-3">
          <div className="col-12 col-md-6 col-lg-3">
            <div className="card border-0 rounded-4 p-4 h-100 d-flex align-items-center justify-content-between flex-row" style={{ backgroundColor: '#131926', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <span className="fw-bold small d-block mb-1" style={{ color: '#a1a1aa', letterSpacing: '0.5px' }}>TOTAL CUSTOMERS</span>
                <h2 className="fw-black m-0 text-white">{totalConsumers}</h2>
              </div>
              <div className="text-info p-3 rounded-3" style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)' }}><FaUsers size={22} /></div>
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <div className="card border-0 rounded-4 p-4 h-100 d-flex align-items-center justify-content-between flex-row" style={{ backgroundColor: '#131926', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <span className="fw-bold small d-block mb-1" style={{ color: '#a1a1aa', letterSpacing: '0.5px' }}>AVG LOYALTY BALANCE</span>
                <h2 className="fw-black m-0" style={{ color: '#34d399' }}>{avgPoints} <span style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>pts</span></h2>
              </div>
              <div className="text-success p-3 rounded-3" style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)' }}><FaAward size={22} /></div>
            </div>
          </div>

          {/* Loyalty Tiers Card */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 rounded-4 p-4 h-100 text-white" style={{ backgroundColor: '#131926', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <FaChartPie className="text-info" size={14} />
                <h6 className="fw-bold m-0 small" style={{ letterSpacing: '0.5px', color: '#cbd5e1' }}>LOYALTY TIERS PROFILE DISTRIBUTION</h6>
              </div>
              <div className="row text-center g-2">
                <div className="col-3">
                  <div className="p-2 rounded-3" style={{ backgroundColor: 'rgba(56, 189, 248, 0.05)' }}>
                    <div className="text-info fw-bold small">Platinum</div>
                    <h5 className="m-0 fw-black mt-1 text-white">{analyticsMetrics.platinum}</h5>
                  </div>
                </div>
                <div className="col-3">
                  <div className="p-2 rounded-3" style={{ backgroundColor: 'rgba(250, 204, 21, 0.05)' }}>
                    <div className="text-warning fw-bold small">Gold</div>
                    <h5 className="m-0 fw-black mt-1 text-white">{analyticsMetrics.gold}</h5>
                  </div>
                </div>
                <div className="col-3">
                  <div className="p-2 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                    <div className="fw-bold small" style={{ color: '#cbd5e1' }}>Silver</div>
                    <h5 className="m-0 fw-black mt-1 text-white">{analyticsMetrics.silver}</h5>
                  </div>
                </div>
                <div className="col-3">
                  <div className="p-2 rounded-3" style={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}>
                    <div className="text-danger fw-bold small">Bronze</div>
                    <h5 className="m-0 fw-black mt-1 text-white">{analyticsMetrics.bronze}</h5>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="card border-0 rounded-4 p-4 mb-4" style={{ backgroundColor: '#131926', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h6 className="fw-bold text-white mb-3">🏆 Performance Target: Top 5 Active Profiles Balance</h6>
          <div style={{ height: "140px" }}>
            {chartDataConfig ? (
              <Bar 
                data={chartDataConfig} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#94a3b8' } }
                  }
                }} 
              />
            ) : (
              <div className="text-center py-4 small" style={{ color: '#a1a1aa' }}>No metrics compiled found.</div>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="input-group mb-5 rounded-3 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="input-group-text border-0 text-muted px-3" style={{ backgroundColor: 'rgba(19, 25, 38, 0.7)' }}><FaSearch /></span>
          <input 
            type="text" 
            className="form-control border-0 text-white shadow-none py-2 input-placeholder-fix" 
            style={{ backgroundColor: 'rgba(19, 25, 38, 0.7)' }} 
            placeholder="Search profiles by consumer credentials or ID parameters..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>

        {/* Customers Listing */}
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-info" /></div>
        ) : (
          <div className="row g-3">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((c) => {
                if (!c) return null;
                const pts = Number(c.loyalty_points || 0);
                const badgeColor = pts >= 500 ? '#38bdf8' : pts >= 200 ? '#facc15' : pts >= 50 ? '#cbd5e1' : '#f97316';
                
                return (
                  <div key={c.customer_id} className="col-12 col-md-6 col-xl-4">
                    <div className="card h-100 border-0 rounded-4 p-4" style={{ backgroundColor: '#131926', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="text-info rounded-3 d-flex align-items-center justify-content-center" style={{ width: "42px", height: "42px", backgroundColor: 'rgba(56, 189, 248, 0.08)' }}>
                            <FaUser size={15} />
                          </div>
                          <div>
                            <h5 className="mb-0 fw-bold text-white">{c.first_name || ""} {c.last_name || ""}</h5>
                            <small style={{ color: '#a1a1aa' }}>USER_ID #{c.customer_id}</small>
                          </div>
                        </div>
                        <span className="badge rounded-2 fw-black small text-uppercase" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: badgeColor, border: `1px solid ${badgeColor}33`, fontSize: '0.68rem' }}>
                          {pts >= 500 ? 'Platinum' : pts >= 200 ? 'Gold' : pts >= 50 ? 'Silver' : 'Bronze'}
                        </span>
                      </div>

                      <div className="small mb-4 flex-grow-1 d-flex flex-column gap-1" style={{ color: '#cbd5e1' }}>
                        <div className="text-truncate"><FaEnvelope className="me-2" style={{ color: 'rgba(255,255,255,0.4)' }} /> {c.email || "No email documented"}</div>
                        <div><FaPhone className="me-2" style={{ color: 'rgba(255,255,255,0.4)' }} /> {c.phone || "No phone listed"}</div>
                        <div className="fw-bold mt-1" style={{ color: '#34d399' }}><FaStar className="me-2" /> {pts} Loyalty Tokens</div>
                      </div>

                      <div className="d-flex justify-content-end gap-1 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <button className="btn btn-link text-info p-1 shadow-none me-2" onClick={() => openModal(c)}><FaEdit size={13} /></button>
                        <button className="btn btn-link text-danger p-1 shadow-none" onClick={() => handleDelete(c.customer_id)}><FaTrash size={13} /></button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-5 rounded-4 col-12" style={{ backgroundColor: '#131926', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="m-0" style={{ color: '#a1a1aa' }}>No active consumer profiles match your criteria.</p>
              </div>
            )}
          </div>
        )}

        {/* Modal Entry Form */}
        <div className="modal fade" id="customerModal" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '460px' }}>
            <form className="modal-content border-0 rounded-4 text-white" style={{ backgroundColor: '#171e2e', border: '1px solid rgba(255,255,255,0.06)' }} onSubmit={handleSubmit}>
              <div className="modal-header border-bottom-0 p-4 pb-2 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold">{editId ? "Modify Walk-in Record" : "Walk-in Counter Registration"}</h5>
                <button type="button" className="btn-close btn-close-white shadow-none" data-bs-dismiss="modal" onClick={closeModal} />
              </div>

              <div className="modal-body p-4 d-flex flex-column gap-3">
                <div className="row g-2">
                  <div className="col">
                    <label className="small fw-bold mb-1" style={{ color: '#a1a1aa' }}>First Name</label>
                    <input type="text" className="form-control border-0 text-white rounded-3" style={{ backgroundColor: '#0b0f17', border: '1px solid rgba(255,255,255,0.06)' }} name="first_name" required value={form.first_name} onChange={handleChange} />
                  </div>
                  <div className="col">
                    <label className="small fw-bold mb-1" style={{ color: '#a1a1aa' }}>Last Name</label>
                    <input type="text" className="form-control border-0 text-white rounded-3" style={{ backgroundColor: '#0b0f17', border: '1px solid rgba(255,255,255,0.06)' }} name="last_name" required value={form.last_name} onChange={handleChange} />
                  </div>
                </div>
                <div>
                  <label className="small fw-bold mb-1" style={{ color: '#a1a1aa' }}>Email Address</label>
                  <input type="email" className="form-control border-0 text-white rounded-3 input-placeholder-fix" placeholder="name@example.com" style={{ backgroundColor: '#0b0f17', border: '1px solid rgba(255,255,255,0.06)' }} name="email" value={form.email} onChange={handleChange} />
                </div>
                <div>
                  <label className="small fw-bold mb-1" style={{ color: '#a1a1aa' }}>Phone Connection</label>
                  <input type="text" className="form-control border-0 text-white rounded-3" style={{ backgroundColor: '#0b0f17', border: '1px solid rgba(255,255,255,0.06)' }} name="phone" value={form.phone} onChange={handleChange} />
                </div>
                <div>
                  <label className="small fw-bold mb-1" style={{ color: '#a1a1aa' }}>Loyalty Tokens Meter</label>
                  <input type="number" className="form-control border-0 text-white rounded-3" style={{ backgroundColor: '#0b0f17', border: '1px solid rgba(255,255,255,0.06)' }} name="loyalty_points" value={form.loyalty_points} onChange={handleChange} />
                </div>
              </div>

              <div className="modal-footer border-top-0 p-4 pt-2 gap-2">
                <button type="button" className="btn btn-link text-muted fw-bold text-decoration-none shadow-none" data-bs-dismiss="modal" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn border-0 text-white px-4 py-2 fw-bold rounded-3" style={{ backgroundColor: '#f97316' }}>Save Account</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <style>{`
        .input-placeholder-fix::placeholder { color: #71717a !important; opacity: 1; }
        .modal-backdrop { background-color: #020617 !important; opacity: 0.75 !important; }
      `}</style>
    </div>
  );
}

export default Customers;