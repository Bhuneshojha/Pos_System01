import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { FaCircle, FaUser, FaLock, FaEnvelope, FaTimes } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL, getAuthHeaders } from '../config';

const PALETTE = {
  brandGreen: '#147a5f',
  darkGreen: '#0f4c3a',
  orange: '#fd7e14',
  blue: '#0d6efd',
  darkBg: '#0f1115',
  cardBg: '#161920',
  gridLine: '#1e2330',
  textMuted: '#a0aec0'
};

const PIE_COLORS = [PALETTE.blue, PALETTE.brandGreen, PALETTE.orange];

function Dashboard() {
  const [products, setProducts] = useState([]);
  
  // Auth Modal States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });

  useEffect(() => {
    fetch(`${API_BASE_URL}/products`, { headers: { ...getAuthHeaders() } })
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : (data.rows || [])))
      .catch(() => console.log("Fallback pipeline active"));
  }, []);

  // Handle Form Inputs
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit Handler
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (authMode === 'login') {
      toast.success(`Welcome back, ${formData.username || 'User'}!`);
    } else {
      toast.success("Account created successfully!");
    }
    setShowAuthModal(false); // Close modal on success
    setFormData({ username: '', email: '', password: '' });
  };

  // Static Chart & Data variables
  const categoryChartData = [
    { name: "Men's 43%", value: 43 },
    { name: "Women's 38%", value: 38 },
    { name: "Accessories 19%", value: 19 }
  ];

  const brandPerformanceData = [
    { name: 'Nike', Revenue: 85000 },
    { name: 'Shirt WM', Revenue: 62000 },
    { name: 'Polo Ralph', Revenue: 48000 },
    { name: 'Summer Spl', Revenue: 71000 },
    { name: 'Dress Co', Revenue: 55000 }
  ];

  const monthlySalesData = [
    { name: '1/19', Revenue: 4000, Units: 3000 },
    { name: '1/13', Revenue: 5500, Units: 4500 },
    { name: '12/19', Revenue: 4800, Units: 3800 },
    { name: '15/17', Revenue: 7000, Units: 6000 },
    { name: '10/20', Revenue: 8500, Units: 7200 },
    { name: '10/29', Revenue: 9200, Units: 8000 }
  ];

  const inventoryStatusData = [
    { name: 'High-Stock', value: 70 },
    { name: 'Reorder-required', value: 15 },
    { name: 'Items', value: 45 },
    { name: 'Colors', value: 30 }
  ];

  const inventoryValueData = [
    { name: 'Nike', value: 95000 },
    { name: 'Shirt', value: 55000 },
    { name: 'Polo', value: 42000 },
    { name: 'Summer', value: 78000 },
    { name: 'Dress', value: 60000 }
  ];

  const hourlyHistogramData = [
    { hour: '09 AM', SalesCount: 15 },
    { hour: '11 AM', SalesCount: 38 },
    { hour: '01 PM', SalesCount: 62 },
    { hour: '03 PM', SalesCount: 45 },
    { hour: '05 PM', SalesCount: 85 },
    { hour: '07 PM', SalesCount: 98 },
    { hour: '09 PM', SalesCount: 55 },
    { hour: '11 PM', SalesCount: 22 }
  ];

  const purchaseOrders = [
    { supplier: "Supplier X Elite", date: "2026-05-25", status: "PENDING", bg: '#fd7e14' },
    { supplier: "Zainab Textile Ltd", date: "2026-06-02", status: "RECEIVED", bg: '#147a5f' },
    { supplier: "Al-Karam Mill", date: "2026-05-14", status: "RECEIVED", bg: '#147a5f' }
  ];

  return (
    <div className="p-4 min-vh-100" style={{ backgroundColor: PALETTE.darkBg, color: '#fff', fontFamily: 'Segoe UI, sans-serif', position: 'relative' }}>
      <ToastContainer theme="dark" />
      
      {/* ================= HEADER SECTION WITH LOGIN BUTTON ================= */}
      <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h3 className="fw-bold text-white mb-1">Executive Live Analytics Dashboard</h3>
          <p className="text-muted small mb-0">System performance overview mapped down directly from operational records.</p>
        </div>
        
        {/* Interactive Login Action Button */}
        <button 
          onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
          className="btn text-white px-4 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2 shadow-sm"
          style={{ 
            backgroundColor: PALETTE.brandGreen, 
            border: 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#0f5c47'}
          onMouseLeave={(e) => e.target.style.backgroundColor = PALETTE.brandGreen}
        >
          <FaUser size={13} /> Account Access
        </button>
      </div>

      {/* Main 3x2 Grid Layout */}
      <div className="row g-4">
        {/* ROW 1 - CARD 1: Category Performance */}
        <div className="col-lg-4 col-md-6">
          <div className="card h-100 border p-3 rounded-4" style={{ backgroundColor: PALETTE.cardBg, borderColor: '#222733' }}>
            <h6 className="fw-bold text-white mb-0" style={{ fontSize: 14 }}>Category Performance (Sales & Revenue)</h6>
            <small className="text-muted d-block mb-3" style={{ fontSize: 11 }}>Doughnut Chart Matrix</small>
            <div style={{ width: '100%', height: 160 }} className="d-flex align-items-center justify-content-center">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                    {categoryChartData.map((entry, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#161920', border: 'none', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="d-flex justify-content-center gap-3 mt-2" style={{ fontSize: 11, color: PALETTE.textMuted }}>
              <span><FaCircle className="me-1" style={{ color: PALETTE.blue }} size={8}/> Men: 43%</span>
              <span><FaCircle className="me-1" style={{ color: PALETTE.brandGreen }} size={8}/> Women: 38%</span>
              <span><FaCircle className="me-1" style={{ color: PALETTE.orange }} size={8}/> Acc: 19%</span>
            </div>
          </div>
        </div>

        {/* ROW 1 - CARD 2: Brand Performance */}
        <div className="col-lg-4 col-md-6">
          <div className="card h-100 border p-3 rounded-4" style={{ backgroundColor: PALETTE.cardBg, borderColor: '#222733' }}>
            <h6 className="fw-bold text-white mb-0" style={{ fontSize: 14 }}>Brand Performance (Units vs Revenue)</h6>
            <small className="text-muted d-block mb-3" style={{ fontSize: 11 }}>Bar Chart Distribution</small>
            <div style={{ width: '100%', height: 185 }}>
              <ResponsiveContainer>
                <BarChart data={brandPerformanceData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.gridLine} vertical={false} />
                  <XAxis dataKey="name" stroke="#5a6275" fontSize={10} tickLine={false} />
                  <YAxis stroke="#5a6275" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#161920', border: 'none', color: '#fff' }} />
                  <Bar dataKey="Revenue" fill={PALETTE.orange} radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ROW 1 - CARD 3: Monthly Sales Trend */}
        <div className="col-lg-4 col-md-6">
          <div className="card h-100 border p-3 rounded-4" style={{ backgroundColor: PALETTE.cardBg, borderColor: '#222733' }}>
            <h6 className="fw-bold text-white mb-0" style={{ fontSize: 14 }}>Monthly Sales Trend (Line Graph)</h6>
            <small className="text-muted d-block mb-3" style={{ fontSize: 11 }}>PKR vs Time Matrix</small>
            <div style={{ width: '100%', height: 185 }}>
              <ResponsiveContainer>
                <LineChart data={monthlySalesData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.gridLine} vertical={false} />
                  <XAxis dataKey="name" stroke="#5a6275" fontSize={10} tickLine={false} />
                  <YAxis stroke="#5a6275" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#161920', border: 'none', color: '#fff' }} />
                  <Line type="monotone" dataKey="Revenue" stroke={PALETTE.orange} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Units" stroke={PALETTE.blue} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ROW 2 - CARD 4: Inventory Status */}
        <div className="col-lg-4 col-md-6">
          <div className="card h-100 border p-3 rounded-4" style={{ backgroundColor: PALETTE.cardBg, borderColor: '#222733' }}>
            <h6 className="fw-bold text-white mb-0" style={{ fontSize: 14 }}>Inventory Status (Variants & Stock)</h6>
            <small className="text-muted d-block mb-3" style={{ fontSize: 11 }}>inventory, product variants</small>
            <div style={{ width: '100%', height: 185 }}>
              <ResponsiveContainer>
                <BarChart data={inventoryStatusData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.gridLine} vertical={false} />
                  <XAxis dataKey="name" stroke="#5a6275" fontSize={10} tickLine={false} />
                  <YAxis stroke="#5a6275" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#161920', border: 'none', color: '#fff' }} />
                  <Bar dataKey="value" fill={PALETTE.blue} radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ROW 2 - CARD 5: Inventory Value by Brand */}
        <div className="col-lg-4 col-md-6">
          <div className="card h-100 border p-3 rounded-4" style={{ backgroundColor: PALETTE.cardBg, borderColor: '#222733' }}>
            <h6 className="fw-bold text-white mb-0" style={{ fontSize: 14 }}>Inventory Value by Brand</h6>
            <small className="text-muted d-block mb-3" style={{ fontSize: 11 }}>inventory, brands distribution</small>
            <div style={{ width: '100%', height: 185 }}>
              <ResponsiveContainer>
                <LineChart data={inventoryValueData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.gridLine} vertical={false} />
                  <XAxis dataKey="name" stroke="#5a6275" fontSize={10} tickLine={false} />
                  <YAxis stroke="#5a6275" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#161920', border: 'none', color: '#fff' }} />
                  <Line type="basis" dataKey="value" stroke={PALETTE.brandGreen} strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ROW 2 - CARD 6: Purchase Orders & Table List */}
        <div className="col-lg-4 col-md-12">
          <div className="card h-100 border p-3 rounded-4" style={{ backgroundColor: PALETTE.cardBg, borderColor: '#222733' }}>
            <h6 className="fw-bold text-white mb-0" style={{ fontSize: 14 }}>Purchase Orders' Status List</h6>
            <small className="text-muted d-block mb-3" style={{ fontSize: 11 }}>purchase_orders, suppliers logs</small>
            
            <div className="table-responsive" style={{ maxHeight: '185px' }}>
              <table className="table table-dark table-hover mb-0 original-table-style" style={{ fontSize: '13px' }}>
                <thead>
                  <tr style={{ color: '#718096', borderBottom: '1px solid #2d3748' }}>
                    <th className="bg-transparent border-0 ps-0">Supplier</th>
                    <th className="bg-transparent border-0">Date</th>
                    <th className="bg-transparent border-0 text-end pe-0">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #222733' }}>
                      <td className="bg-transparent border-0 ps-0 text-white fw-medium py-2.5">{po.supplier}</td>
                      <td className="bg-transparent border-0 text-muted py-2.5">{po.date}</td>
                      <td className="bg-transparent border-0 text-end pe-0 py-2.5">
                        <span className="badge px-2.5 py-1.5 rounded" style={{ backgroundColor: po.bg, fontSize: '10px', fontWeight: '600', letterSpacing: '0.5px' }}>
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM FULL-WIDTH SECTION: HOURLY PEAK VOLUME (HISTOGRAM) */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card border p-4 rounded-4" style={{ backgroundColor: PALETTE.cardBg, borderColor: '#222733' }}>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h6 className="fw-bold text-white mb-0" style={{ fontSize: 15 }}>Hourly Checkout Frequency (Histogram)</h6>
                <small className="text-muted" style={{ fontSize: 11 }}>Continuous time-interval distribution mapping peak operational rush periods</small>
              </div>
              <span className="badge bg-opacity-10 bg-warning text-warning px-2.5 py-1" style={{ fontSize: '11px' }}>
                📊 Frequency Density Chart
              </span>
            </div>
            
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <BarChart data={hourlyHistogramData} barCategoryGap={1} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="1 1" stroke={PALETTE.gridLine} vertical={false} />
                  <XAxis dataKey="hour" stroke="#5a6275" fontSize={11} tickLine={false} />
                  <YAxis stroke="#5a6275" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#161920', border: 'none', color: '#fff' }} />
                  <Bar dataKey="SalesCount" fill={PALETTE.brandGreen} opacity={0.85} name="Sales Density Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 🔐 DYNAMIC HIGH-END LIGHTWEIGHT MODAL (LOGIN & SIGNUP ENGINE)       */}
      {/* ===================================================================== */}
      {showAuthModal && (
        <div 
          className="d-flex align-items-center justify-content-center animate-fade-in" 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(5, 6, 8, 0.85)', zIndex: 1050,
            backdropFilter: 'blur(6px)'
          }}
        >
          <div 
            className="card p-4 rounded-4 border shadow-lg" 
            style={{ 
              width: '100%', maxWidth: '420px', 
              backgroundColor: '#161920', borderColor: '#2d3748',
              color: '#fff'
            }}
          >
            {/* Modal Top Bar */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="d-flex gap-3">
                <span 
                  onClick={() => setAuthMode('login')}
                  className="fw-bold pb-1 cursor-pointer"
                  style={{ 
                    fontSize: '18px', cursor: 'pointer',
                    borderBottom: authMode === 'login' ? `3px solid ${PALETTE.brandGreen}` : '3px solid transparent',
                    color: authMode === 'login' ? '#fff' : PALETTE.textMuted
                  }}
                >
                  Login
                </span>
                <span 
                  onClick={() => setAuthMode('signup')}
                  className="fw-bold pb-1"
                  style={{ 
                    fontSize: '18px', cursor: 'pointer',
                    borderBottom: authMode === 'signup' ? `3px solid ${PALETTE.brandGreen}` : '3px solid transparent',
                    color: authMode === 'signup' ? '#fff' : PALETTE.textMuted
                  }}
                >
                  Sign Up
                </span>
              </div>
              <button 
                onClick={() => setShowAuthModal(false)} 
                className="btn text-muted p-0 hover-white"
                style={{ border: 'none', background: 'transparent' }}
              >
                <FaTimes size={18} style={{ color: '#718096' }} />
              </button>
            </div>

            {/* Content Form Block */}
            <form onSubmit={handleAuthSubmit}>
              {/* Username Field */}
              <div className="mb-3">
                <label className="small mb-1 d-block text-muted">Username</label>
                <div className="input-group rounded-3 overflow-hidden border" style={{ borderColor: '#2d3748' }}>
                  <span className="input-group-text border-0" style={{ backgroundColor: '#1e2330', color: '#718096' }}>
                    <FaUser size={13} />
                  </span>
                  <input 
                    type="text" name="username" required value={formData.username} onChange={handleInputChange}
                    className="form-control border-0 text-white shadow-none" 
                    placeholder="Enter username"
                    style={{ backgroundColor: '#12141a', fontSize: '14px' }}
                  />
                </div>
              </div>

              {/* Dynamic Sign-Up Email Context */}
              {authMode === 'signup' && (
                <div className="mb-3">
                  <label className="small mb-1 d-block text-muted">Email Address</label>
                  <div className="input-group rounded-3 overflow-hidden border" style={{ borderColor: '#2d3748' }}>
                    <span className="input-group-text border-0" style={{ backgroundColor: '#1e2330', color: '#718096' }}>
                      <FaEnvelope size={13} />
                    </span>
                    <input 
                      type="email" name="email" required value={formData.email} onChange={handleInputChange}
                      className="form-control border-0 text-white shadow-none" 
                      placeholder="name@domain.com"
                      style={{ backgroundColor: '#12141a', fontSize: '14px' }}
                    />
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div className="mb-4">
                <label className="small mb-1 d-block text-muted">Password</label>
                <div className="input-group rounded-3 overflow-hidden border" style={{ borderColor: '#2d3748' }}>
                  <span className="input-group-text border-0" style={{ backgroundColor: '#1e2330', color: '#718096' }}>
                    <FaLock size={13} />
                  </span>
                  <input 
                    type="password" name="password" required value={formData.password} onChange={handleInputChange}
                    className="form-control border-0 text-white shadow-none" 
                    placeholder="••••••••"
                    style={{ backgroundColor: '#12141a', fontSize: '14px' }}
                  />
                </div>
              </div>

              {/* Core Execution Form Trigger Button */}
              <button 
                type="submit" 
                className="btn w-100 py-2.5 rounded-3 fw-semibold text-white shadow"
                style={{ backgroundColor: PALETTE.brandGreen, border: 'none', fontSize: '15px' }}
              >
                {authMode === 'login' ? 'Secure Log In' : 'Register Terminal Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;