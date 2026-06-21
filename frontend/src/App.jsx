import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import CashierDashboard from './pages/CashierDashboard'; // 🎯 FIXED: Imported Cashier Core View

import Products from './pages/Products';
import Customers from './pages/Customers';
import Brands from './pages/Brands';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Suppliers from "./pages/Suppliers";
import Employees from "./pages/Employees"; 
import Departments from "./pages/Departments";
import Warehouses from "./pages/Warehouses";
import StockMovements from "./pages/StockMovements";
import PurchaseOrders from "./pages/PurchaseOrders";
import Invoice from "./pages/Invoice";

function SidebarContent({ handleLogout, userRole, storeSlug, theme, toggleTheme }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const isDark = theme === 'dark';
  
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const sidebarBg = isDark ? '#090b0e' : '#ffffff';
  const borderRuleColor = isDark ? '#1a1f26' : '#e2e8f0';

  // Dynamic status color configs based on role matrix
  const themeAccentColor = userRole === 'admin' ? '#10b981' : '#2563eb';
  const badgeBg = isDark 
    ? (userRole === 'admin' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(37, 99, 235, 0.12)') 
    : (userRole === 'admin' ? '#e6f4ea' : '#eff6ff');
  const badgeColor = userRole === 'admin' ? '#10b981' : '#2563eb';

  if (location.pathname === '/login') return null;

  const adminMenu = [
    { path: '/', label: 'Executive Dashboard', icon: '👑' },
    { path: '/products', label: 'Products', icon: '📦' },
    { path: '/categories', label: 'Categories', icon: '🏷️' },
    { path: '/brands', label: 'Brands', icon: '✨' },
    { path: '/customers', label: 'Customers', icon: '👥' },
    { path: '/suppliers', label: 'Suppliers', icon: '🚚' },
    { path: '/employees', label: 'Employees', icon: '👨‍💼' }, 
    { path: '/departments', label: 'Departments', icon: '🏢' },
    { path: '/warehouses', label: 'Warehouses', icon: '🏬' },
    { path: '/stock-movements', label: 'Stock Movement', icon: '🔄' },
    { path: '/purchase-orders', label: 'Purchase Orders', icon: '📋' },
    { path: '/invoice', label: 'Invoices', icon: '🧾' },
    { path: '/reports', label: 'Analytics & Reports', icon: '📊' }
  ];

  const managerMenu = [
    { path: '/', label: 'Manager Dashboard', icon: '💼' },
    { path: '/products', label: 'Products Inventory', icon: '📦' },
    { path: '/customers', label: 'Customer Base', icon: '👥' },
    { path: '/reports', label: 'Reports & Analytics', icon: '📊' }
  ];

  // 🎯 FIXED: Cashier Menu links matched up with native landing structure
  const cashierMenu = [
    { path: '/', label: 'Sales Panel Terminal', icon: '💳' },
    { path: '/products', label: 'Products Catalog', icon: '📦' },
    { path: '/customers', label: 'Customer Directory', icon: '👥' }
  ];

  const currentMenu = userRole === 'admin' ? adminMenu : userRole === 'cashier' ? cashierMenu : managerMenu;

  return (
    <div className="d-flex flex-column flex-shrink-0 style-sidebar-container" 
         style={{ 
           width: '280px', 
           backgroundColor: sidebarBg, 
           borderRight: `1px solid ${borderRuleColor}`, 
           height: '100vh',
           position: 'sticky',
           top: 0,
           zIndex: 100
         }}>
      
      <style>{`
        .custom-nav-scroller::-webkit-scrollbar {
          width: 4px;
        }
        .custom-nav-scroller::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};
          border-radius: 4px;
        }
        .brand-text-gradient {
          background: linear-gradient(135deg, ${themeAccentColor} 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .sidebar-nav-link {
          color: ${isDark ? '#94a3b8' : '#475569'} !important;
          transition: all 0.2s ease;
        }
        .sidebar-nav-link:hover {
          color: ${textColor} !important;
          background-color: ${isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9'} !important;
        }
      `}</style>

      {/* PREMIUM INTERACTIVE LOGO SECTION */}
      <div className="p-4 d-flex flex-column" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}` }}>
        <div className="d-flex align-items-center gap-3 mb-3">
          
          <div className="d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
               style={{
                 width: '46px',
                 height: '46px',
                 backgroundColor: isDark ? '#141822' : '#f8fafc',
                 borderRadius: '12px',
                 overflow: 'hidden',
                 border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}`
               }}>
            <img 
              src="/LOGO.png" 
              alt="Arbex Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} 
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = `<span style="font-size: 19px; font-weight: 800; color: #ffffff;">A</span>`;
                e.target.parentNode.style.background = `linear-gradient(135deg, ${themeAccentColor} 0%, #4f46e5 100%)`;
              }}
            />
          </div>

          <div className="text-start truncate">
            <h5 className="mb-0 fw-bold" style={{ color: textColor, fontSize: '16.5px', letterSpacing: '-0.01em' }}>
              Arbex <span className="brand-text-gradient">Retail</span>
            </h5>
            <div className="d-flex align-items-center gap-1 mt-0.5" style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: '12px', fontWeight: '500' }}>
              <span>🏬</span> <span className="text-truncate" style={{ maxWidth: '140px' }}>{storeSlug || 'Main Branch'}</span>
            </div>
          </div>
        </div>

        <div className="text-start">
          <div className="d-inline-flex align-items-center gap-2 px-2.5 py-1 rounded-pill fw-bold tracking-wider text-uppercase" 
               style={{ fontSize: '10px', backgroundColor: badgeBg, color: badgeColor, letterSpacing: '0.05em' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: badgeColor, display: 'inline-block' }}></span>
            {userRole ? `${userRole} Center` : 'GUEST CONSOLE'}
          </div>
        </div>
      </div>

      {/* Navigation Links Scroller */}
      <div className="flex-grow-1 overflow-y-auto px-3 py-3 custom-nav-scroller">
        <ul className="nav nav-pills flex-column gap-1 list-unstyled mb-0">
          {currentMenu.map((link) => (
            <li className="nav-item" key={link.path}>
              <Link to={link.path} className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 ${isActive(link.path) ? '' : 'sidebar-nav-link'}`}
                style={{
                  color: isActive(link.path) ? textColor : undefined,
                  backgroundColor: isActive(link.path) ? (isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9') : 'transparent',
                  borderLeft: isActive(link.path) ? `4px solid ${themeAccentColor}` : '4px solid transparent',
                  fontWeight: isActive(link.path) ? '600' : '500'
                }}>
                <span style={{ fontSize: '16px', opacity: isActive(link.path) ? 1 : 0.85 }}>{link.icon}</span>
                <span style={{ fontSize: '13.5px' }}>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Fixed Footer */}
      <div className="p-4 mt-auto" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}` }}>
        <button 
          onClick={toggleTheme} 
          className={isDark ? 'btn btn-light w-100 py-2 rounded-3 fw-bold mb-2' : 'btn btn-dark w-100 py-2 rounded-3 fw-bold mb-2'}
          style={{ fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 0 }}
        >
          <span>{isDark ? '☀️' : '🌙'}</span>
          <span>{isDark ? 'Switch to Day Mode' : 'Switch to Night Mode'}</span>
        </button>

        <button 
          onClick={handleLogout} 
          className={isDark ? 'btn btn-outline-danger w-100 py-2 rounded-3 fw-bold' : 'btn btn-danger w-100 py-2 rounded-3 fw-bold'} 
          style={{ fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: isDark ? undefined : 0 }}
        >
          <span> 🚪 </span>
          <span>Sign Out Session</span>
        </button>
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || '');
  const [storeId, setStoreId] = useState(() => localStorage.getItem('storeId') || '');
  const [storeSlug, setStoreSlug] = useState(() => localStorage.getItem('storeSlug') || '');
  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  const handleLoginSuccess = (role, token, storeId, storeSlug) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', role);
    localStorage.setItem('storeId', storeId);
    localStorage.setItem('storeSlug', storeSlug);
    if (token) localStorage.setItem('auth_token', token);
    setIsAuthenticated(true);
    setUserRole(role);
    setStoreId(storeId);
    setStoreSlug(storeSlug);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('storeId');
    localStorage.removeItem('storeSlug');
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUserRole('');
    setStoreId('');
    setStoreSlug('');
  };

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return (
    <Router future={{ v7_relativeSplatPath: true }}>
      <div className="d-flex flex-column flex-lg-row custom-root-viewport-lock" 
           style={{ 
             minHeight: '100vh', 
             width: '100vw',
             backgroundColor: theme === 'dark' ? '#0f1115' : '#f8fafc',
             overflowX: 'hidden'
           }}>
        
        <SidebarContent handleLogout={handleLogout} userRole={userRole} storeSlug={storeSlug} theme={theme} toggleTheme={toggleTheme} />
        
        <div className="flex-grow-1 d-flex flex-column" 
             style={{ 
               backgroundColor: theme === 'dark' ? '#0f1115' : '#f8fafc', 
               minHeight: '100vh',
               width: '100%',
               overflowX: 'hidden'
             }}>
          
          <div className="p-4 flex-grow-1 w-100">
            <Routes>
              <Route path="/login" element={!isAuthenticated ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" />} />
              
              {/* 🎯 FIXED: Handled multi-role routing layers to execute Cashier terminal securely */}
              <Route 
                path="/" 
                element={
                  isAuthenticated ? (
                    userRole === 'admin' ? (
                      <AdminDashboard />
                    ) : userRole === 'cashier' ? (
                      <CashierDashboard />
                    ) : (
                      <ManagerDashboard storeId={storeId} />
                    )
                  ) : (
                    <Navigate to="/login" />
                  )
                } 
              />
              
              <Route path="/products" element={isAuthenticated && ['admin', 'manager', 'cashier'].includes(userRole) ? <Products /> : <Navigate to="/" />} />
              <Route path="/customers" element={isAuthenticated && ['admin', 'manager', 'cashier'].includes(userRole) ? <Customers /> : <Navigate to="/" />} />
              <Route path="/categories" element={isAuthenticated && userRole === 'admin' ? <Categories /> : <Navigate to="/" />} />
              <Route path="/brands" element={isAuthenticated && userRole === 'admin' ? <Brands /> : <Navigate to="/" />} />
              <Route path="/suppliers" element={isAuthenticated && userRole === 'admin' ? <Suppliers /> : <Navigate to="/" />} />
              <Route path="/employees" element={isAuthenticated && ['admin', 'manager'].includes(userRole) ? <Employees /> : <Navigate to="/" />} />
              <Route path="/departments" element={isAuthenticated && ['admin', 'manager'].includes(userRole) ? <Departments /> : <Navigate to="/" />} />
              <Route path="/warehouses" element={isAuthenticated && ['admin', 'manager'].includes(userRole) ? <Warehouses /> : <Navigate to="/" />} />
              
              <Route path="/stock-movements" element={isAuthenticated && ['admin', 'manager'].includes(userRole) ? <StockMovements theme={theme} /> : <Navigate to="/" />} />
              <Route path="/purchase-orders" element={isAuthenticated && ['admin', 'manager'].includes(userRole) ? <PurchaseOrders storeId={storeId} /> : <Navigate to="/" />} />
              
              <Route path="/invoice" element={isAuthenticated ? <Invoice saleId="1" storeId={storeId} userRole={userRole} onClose={() => window.history.back()} /> : <Navigate to="/login" />} />
              
              <Route path="/reports" element={isAuthenticated && ['admin', 'manager'].includes(userRole) ? <Reports userRole={userRole} storeId={storeId} /> : <Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </div>

      <style>{`
        html, body, #root {
          background-color: ${theme === 'dark' ? '#0f1115' : '#f8fafc'} !important;
          margin: 0 !important;
          padding: 0 !important;
          height: 100% !important;
          min-height: 100vh !important;
          width: 100% !important;
        }
      `}</style>
    </Router>
  );
}

export default App;