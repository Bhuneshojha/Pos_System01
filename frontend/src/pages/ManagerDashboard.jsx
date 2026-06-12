import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';

function ManagerDashboard({ storeId }) {
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  const [metrics, setMetrics] = useState({
    activeSkus: 0,
    reorderAlerts: 0,
    pendingOrders: 0,
    fulfilledStockMtd: 0
  });

  const [warehouseData, setWarehouseData] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  // Live Dark-Mode Theme Sync Listener
  useEffect(() => {
    const checkTheme = () => {
      const currentTheme = document.documentElement.dataset.theme || localStorage.getItem('appTheme') || 'dark';
      setIsDark(currentTheme === 'dark');
    };
    checkTheme();
    const observer = new MutationObserver(() => checkTheme());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');

        const res = await fetch(
          `/api/dashboard/manager-metrics?storeId=${storeId || ''}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!res.ok) throw new Error("API failed");

        const data = await res.json();
        console.log("=== API CONNECTION SUCCESS ===", data);

        // 1. Synchronize System Metrics (Handling numerical string casting)
        setMetrics({
          activeSkus: Number(data?.metrics?.activeSkus) || 0,
          reorderAlerts: Number(data?.metrics?.reorderAlerts) || 0,
          pendingOrders: Number(data?.metrics?.pendingOrders) || 0,
          fulfilledStockMtd: Number(data?.metrics?.fulfilledStockMtd) || 0
        });

        // 2. Sync Warehouse Capacity (Mapped from backend data payload array keys)
        const mappedWarehouse = (data?.warehouseDistribution || []).map(item => ({
          name: item.name || 'Unknown WH',
          stock: item.stock !== undefined ? item.stock : (item.StockOnHand || 0)
        }));
        setWarehouseData(mappedWarehouse);

        // 3. Sync Revenue Trend Analytics (Mapped from salesTrendDistribution)
        const mappedTrends = (data?.salesTrendDistribution || []).map(item => ({
          day: item.day || item.timeline || 'Day',
          revenue: item.revenue !== undefined ? item.revenue : (item.processedUnits || 0)
        }));
        setSalesTrend(mappedTrends);

        // 4. Sync Top Selling Rows (Failsafe dynamic sorting based on incoming distribution data)
        const mappedTopProducts = (data?.topProducts || data?.salesTrendDistribution || []).map(item => ({
          product_name: item.product_name || item.name || item.timeline || 'Product',
          units_sold: item.units_sold || item.processedUnits || 0
        }));
        setTopProducts(mappedTopProducts);

      } catch (err) {
        console.error("Dashboard engine critical crash error:", err.message);
        setMetrics({ activeSkus: 0, reorderAlerts: 0, pendingOrders: 0, fulfilledStockMtd: 0 });
        setWarehouseData([]);
        setSalesTrend([]);
        setTopProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeId]);

  // High-Contrast Pure Theme Matrix Configuration
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#cbd5e1' : '#475569';
  const cardBg = isDark ? '#141a24' : '#ffffff';
  const cardBorder = isDark ? '#334155' : '#e2e8f0';
  const gridLineColor = isDark ? '#2a3547' : '#f1f5f9';
  const chartAxisColor = isDark ? '#cbd5e1' : '#334155';

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '70vh', color: textColor }}>
        <div className="spinner-border text-primary mb-3" style={{ width: '2.5rem', height: '2.5rem' }} role="status"></div>
        <p className="small fw-bold">Synchronizing Live Terminal Metrics...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3 px-2 text-start" style={{ color: textColor, minHeight: '100vh' }}>
      
      {/* Upper Title Segment */}
      <div className="mb-4">
        <h3 className="fw-bold mb-1" style={{ letterSpacing: '-0.03em', color: textColor }}>💼 Manager Control Terminal</h3>
        <p className="mb-0 small fw-medium" style={{ color: subTextColor }}>
          Real-time fulfillment metrics, stock alert diagnostics, and distribution trends.
        </p>
      </div>

      {/* 📊 KPI CARDS GRID */}
      <div className="row g-3 mb-4">
        {/* Active SKUs */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="p-4 rounded-4 shadow-sm h-100" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-uppercase fw-bold" style={{ fontSize: '11px', color: subTextColor, letterSpacing: '0.05em' }}>Active SKUs</span>
              <span className="p-2 rounded-3" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>📦</span>
            </div>
            <h3 className="fw-bold mb-1" style={{ color: textColor }}>{metrics.activeSkus.toLocaleString()}</h3>
            <small className="text-success fw-bold">● Live Catalog Linked</small>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="p-4 rounded-4 shadow-sm h-100" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-uppercase fw-bold" style={{ fontSize: '11px', color: subTextColor, letterSpacing: '0.05em' }}>Critical Thresholds</span>
              <span className="p-2 rounded-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>⚠️</span>
            </div>
            <h3 className="fw-bold mb-1" style={{ color: metrics.reorderAlerts > 0 ? '#ef4444' : textColor }}>{metrics.reorderAlerts}</h3>
            <small className="fw-bold" style={{ color: metrics.reorderAlerts > 0 ? '#ef4444' : subTextColor }}>Requires Procurement</small>
          </div>
        </div>

        {/* Open Orders */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="p-4 rounded-4 shadow-sm h-100" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-uppercase fw-bold" style={{ fontSize: '11px', color: subTextColor, letterSpacing: '0.05em' }}>Total Batches</span>
              <span className="p-2 rounded-3" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>📋</span>
            </div>
            <h3 className="fw-bold mb-1" style={{ color: textColor }}>{metrics.pendingOrders.toLocaleString()}</h3>
            <small className="fw-bold" style={{ color: subTextColor }}>Awaiting Process Pipeline</small>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="p-4 rounded-4 shadow-sm h-100" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-uppercase fw-bold" style={{ fontSize: '11px', color: subTextColor, letterSpacing: '0.05em' }}>Gross Revenue MTD</span>
              <span className="p-2 rounded-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>📈</span>
            </div>
            <h3 className="fw-bold mb-1" style={{ color: '#10b981' }}>${metrics.fulfilledStockMtd.toLocaleString()}</h3>
            <small className="text-success fw-bold">Live Stream Values</small>
          </div>
        </div>
      </div>

      {/* 📈 MAIN VISUALIZERS MATRIX */}
      <div className="row g-4">
        
        {/* Revenue Trend Line Chart */}
        <div className="col-12">
          <div className="card p-4 rounded-4 shadow-sm" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <div className="mb-4">
              <h5 className="fw-bold mb-1" style={{ color: textColor }}>Revenue Trend Analytics</h5>
              <p className="mb-0 small fw-medium" style={{ color: subTextColor }}>Periodic evaluation chart tracking cumulative operational cash inflows.</p>
            </div>
            <div style={{ width: '100%', height: 320 }}>
              {salesTrend.length === 0 ? (
                <div className="h-100 d-flex align-items-center justify-content-center text-muted small border border-dashed rounded-3">No active trend values logged.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesTrend} margin={{ left: -10, right: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} vertical={false} />
                    <XAxis dataKey="day" stroke={chartAxisColor} fontSize={12} tickLine={false} tick={{ fill: chartAxisColor }} />
                    <YAxis stroke={chartAxisColor} fontSize={12} tickLine={false} axisLine={false} tick={{ fill: chartAxisColor }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#ffffff', borderRadius: '12px' }} />
                    <Legend wrapperStyle={{ color: textColor, fontSize: '12px', paddingTop: '10px' }} />
                    <Line name="Operational Inflows" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Warehouse Stock Bar Chart */}
        <div className="col-12 col-xl-6">
          <div className="card p-4 rounded-4 shadow-sm h-100" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <div className="mb-4">
              <h5 className="fw-bold mb-1" style={{ color: textColor }}>Warehouse Capacity Flow</h5>
              <p className="mb-0 small fw-medium" style={{ color: subTextColor }}>Current physical units recorded inside global active repository nodes.</p>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              {warehouseData.length === 0 ? (
                <div className="h-100 d-flex align-items-center justify-content-center text-muted small border border-dashed rounded-3">No active warehouse allocations found.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={warehouseData} margin={{ left: -10, right: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} vertical={false} />
                    <XAxis dataKey="name" stroke={chartAxisColor} fontSize={12} tickLine={false} tick={{ fill: chartAxisColor }} />
                    <YAxis stroke={chartAxisColor} fontSize={12} tickLine={false} axisLine={false} tick={{ fill: chartAxisColor }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#ffffff', borderRadius: '12px' }} />
                    <Legend wrapperStyle={{ color: textColor, fontSize: '12px', paddingTop: '10px' }} />
                    <Bar name="Units Stocked" dataKey="stock" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Top Products Bar Chart */}
        <div className="col-12 col-xl-6">
          <div className="card p-4 rounded-4 shadow-sm h-100" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <div className="mb-4">
              <h5 className="fw-bold mb-1" style={{ color: textColor }}>Top Selling Inventory Rows</h5>
              <p className="mb-0 small fw-medium" style={{ color: subTextColor }}>Top products organized by absolute volume unit dispatch logs.</p>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              {topProducts.length === 0 ? (
                <div className="h-100 d-flex align-items-center justify-content-center text-muted small border border-dashed rounded-3">No tracking volume logged.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} margin={{ left: -10, right: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} vertical={false} />
                    <XAxis dataKey="product_name" stroke={chartAxisColor} fontSize={12} tickLine={false} tick={{ fill: chartAxisColor }} />
                    <YAxis stroke={chartAxisColor} fontSize={12} tickLine={false} axisLine={false} tick={{ fill: chartAxisColor }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#ffffff', borderRadius: '12px' }} />
                    <Legend wrapperStyle={{ color: textColor, fontSize: '12px', paddingTop: '10px' }} />
                    <Bar name="Volume Dispatched" dataKey="units_sold" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default ManagerDashboard;