import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { 
  FaFileInvoiceDollar, FaFilter, FaEye, FaTrashAlt, 
  FaChevronDown, FaCalendarAlt, FaUserShield, FaBoxes, FaTimes,
  FaCheckCircle, FaSpinner, FaBan, FaChartLine, FaBarcode, FaCubes
} from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = '/api';

export default function PurchaseOrders({ storeId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    received: 0,
    cancelled: 0
  });

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const url = statusFilter
        ? `${API_BASE_URL}/purchase-orders?status=${statusFilter}`
        : `${API_BASE_URL}/purchase-orders`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const orderData = Array.isArray(response.data) ? response.data : [];
      setOrders(orderData);
      
      if (orderData.length > 0) {
        setMetrics({
          total: orderData.length,
          pending: orderData.filter(o => o.status === 'PENDING').length,
          received: orderData.filter(o => o.status === 'RECEIVED').length,
          cancelled: orderData.filter(o => o.status === 'CANCELLED').length
        });
      } else {
        setMetrics({ total: 0, pending: 0, received: 0, cancelled: 0 });
      }
    } catch (error) {
      toast.error('Failed to pull baseline metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleOrderDetails = async (poId) => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/purchase-orders/${poId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedOrder(response.data);
    } catch (error) {
      toast.error('Failed to fetch item breakdown lists');
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatusChange = async (poId, newStatus) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(
        `${API_BASE_URL}/purchase-orders/${poId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`PO #${poId} updated to ${newStatus}`);
      setActiveDropdown(null);
      fetchOrders();
    } catch (error) {
      toast.error('Workflow shift rejected');
    }
  };

  const handleDelete = async (poId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        const token = localStorage.getItem('auth_token');
        await axios.delete(`${API_BASE_URL}/purchase-orders/${poId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Dropped line item record');
        fetchOrders();
      } catch (error) {
        toast.error('Failed to eliminate line target');
      }
    }
  };

  const statuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'RECEIVED', 'CANCELLED'];

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return '#f59e0b';
      case 'CONFIRMED': return '#3b82f6';
      case 'SHIPPED': return '#8b5cf6';
      case 'RECEIVED': return '#10b981';
      case 'CANCELLED': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="arbex-global-viewport-wrapper">
      <div className="arbex-workspace-root system-fade-in">
        <ToastContainer theme="dark" position="top-right" />

        {/* Dynamic Structural Align Header bar */}
        <div className="arbex-panel-header">
          <div className="title-block">
            <h1 className="main-title-text">
              <FaFileInvoiceDollar className="accent-glow-cyan" /> Purchase Orders
            </h1>
            <p className="subtitle-text">Audit dynamic supply network distribution channels, track pipeline orders, and log index metrics.</p>
          </div>

          <div className="filter-component-box">
            <FaFilter className="filter-inner-glyph" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="arbex-clean-select"
            >
              <option value="">All Status Ensembles</option>
              {statuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Analytic Scoreboards */}
        <div className="analytics-metrics-grid">
          <div className="metric-card metric-cyan-glow">
            <div className="metric-meta">
              <span className="metric-label">Total Volume Logs</span>
              <FaChartLine className="metric-icon color-cyan" />
            </div>
            <h2 className="metric-value">{metrics.total}</h2>
            <div className="metric-footer-text">Aggregated procurement tracks</div>
          </div>

          <div className="metric-card metric-amber-glow">
            <div className="metric-meta">
              <span className="metric-label">Pending Approvals</span>
              <FaSpinner className="metric-icon color-amber spinning-icon-slow" />
            </div>
            <h2 className="metric-value">{metrics.pending}</h2>
            <div className="metric-footer-text">Awaiting terminal validation</div>
          </div>

          <div className="metric-card metric-emerald-glow">
            <div className="metric-meta">
              <span className="metric-label">Receipts Committed</span>
              <FaCheckCircle className="metric-icon color-emerald" />
            </div>
            <h2 className="metric-value">{metrics.received}</h2>
            <div className="metric-footer-text">Inventory stocks received</div>
          </div>

          <div className="metric-card metric-rose-glow">
            <div className="metric-meta">
              <span className="metric-label">Cancelled Lifecycles</span>
              <FaBan className="metric-icon color-rose" />
            </div>
            <h2 className="metric-value">{metrics.cancelled}</h2>
            <div className="metric-footer-text">Terminated line operations</div>
          </div>
        </div>

        {/* Database Response Tables Container */}
        {loading ? (
          <div className="workspace-loader-state">
            <div className="custom-engine-spinner" />
            <p>Processing index arrays...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="arbex-empty-card-state">
            <div className="icon-wrapper-box">
              <FaBoxes size={32} className="empty-glyph-icon" />
            </div>
            <h3>No active purchase orders found</h3>
            <p>The targeted search or database scope contains zero transaction lines inside this storeId.</p>
          </div>
        ) : (
          <div className="arbex-table-container-layer">
            <table className="arbex-native-data-table">
              <thead>
                <tr>
                  <th>PO ID</th>
                  <th>SUPPLIER CHANNEL PARTNER</th>
                  <th>GENERATION TIMESTAMP</th>
                  <th>WORKFLOW STATE</th>
                  <th style={{ textAlign: 'right' }}>OPERATIONAL ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => (
                  <tr key={order.po_id || idx} className="arbex-row">
                    <td className="cyan-highlight-cell">#{order.po_id}</td>
                    <td className="bright-white-cell">{order.supplier_name || 'N/A'}</td>
                    <td className="dim-slate-cell">
                      <span className="timestamp-wrapper">
                        <FaCalendarAlt size={12} style={{ opacity: 0.6 }} /> {new Date(order.order_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ position: 'relative' }}>
                      <button 
                        className="status-trigger-badge" 
                        style={{ color: getStatusColor(order.status), borderColor: `${getStatusColor(order.status)}30`, backgroundColor: `${getStatusColor(order.status)}0b` }}
                        onClick={() => setActiveDropdown(activeDropdown === order.po_id ? null : order.po_id)}
                      >
                        <span className="status-dot" style={{ backgroundColor: getStatusColor(order.status) }} />
                        {order.status} 
                        <FaChevronDown size={8} className="arrow-down-shift" />
                      </button>
                      
                      {activeDropdown === order.po_id && (
                        <>
                          <div className="popover-close-barrier" onClick={() => setActiveDropdown(null)} />
                          <div className="arbex-popover-dropdown-list animate-pop-up">
                            {statuses.map((st) => (
                              <button 
                                key={st} 
                                className={`popover-action-item ${order.status === st ? 'item-selected' : ''}`}
                                onClick={() => handleStatusChange(order.po_id, st)}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-button-alignment-row">
                        <button 
                          className="action-btn-base info-action-view" 
                          onClick={() => fetchSingleOrderDetails(order.po_id)}
                        >
                          <FaEye size={12} /> View Details
                        </button>
                        <button 
                          className="action-btn-base dangerous-action-delete" 
                          onClick={() => handleDelete(order.po_id)}
                        >
                          <FaTrashAlt size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detailed Grid Analytics Modal PopUp */}
        {selectedOrder && (
          <div className="arbex-modal-mask" onClick={() => setSelectedOrder(null)}>
            <div className="arbex-modal-window animate-pop-up" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-ribbon">
                <h3>PO Audit Log Breakdown #{selectedOrder.po_id}</h3>
                <button className="modal-close-cross" onClick={() => setSelectedOrder(null)}><FaTimes /></button>
              </div>
              
              <div className="modal-inner-data-grid mb-3">
                <div className="modal-data-row">
                  <span className="row-label"><FaUserShield className="row-icon-accent" /> Supplier Vendor:</span>
                  <span className="row-value-white">{selectedOrder.supplier_name || 'N/A'}</span>
                </div>
                <div className="modal-data-row">
                  <span className="row-label"><FaCalendarAlt className="row-icon-accent" /> Base Timestamp:</span>
                  <span className="row-value-white">{new Date(selectedOrder.order_date).toLocaleString()}</span>
                </div>
                <div className="modal-data-row">
                  <span className="row-label"><FaBoxes className="row-icon-accent" /> State Context:</span>
                  <span className="modal-status-pill" style={{ color: getStatusColor(selectedOrder.status), backgroundColor: `${getStatusColor(selectedOrder.status)}15`, border: `1px solid ${getStatusColor(selectedOrder.status)}30` }}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              <h4 className="nested-items-title"><FaCubes className="me-2 text-info" /> Manifested Order Line Items</h4>
              <div className="modal-items-list-box">
                {modalLoading ? (
                  <div className="text-center py-3 text-muted"><div className="custom-engine-spinner mx-auto mb-2"/>Loading dataset...</div>
                ) : !selectedOrder.items || selectedOrder.items.length === 0 ? (
                  <div className="text-center py-3 text-muted">No child row items registered under this PO scope.</div>
                ) : (
                  selectedOrder.items.map((item, index) => (
                    <div key={item.po_item_id || index} className="nested-item-row-card">
                      <div className="item-identity">
                        <span className="item-name-head">{item.product_name}</span>
                        <span className="item-sku-sub"><FaBarcode className="me-1 opacity-50" /> {item.sku || 'NO_SKU'}</span>
                      </div>
                      <div className="item-variants-pills">
                        {item.size_name && <span className="variant-pill">Size: {item.size_name}</span>}
                        {item.color_name && <span className="variant-pill">Color: {item.color_name}</span>}
                      </div>
                      <div className="item-pricing-summary">
                        <div className="price-stack">
                          <span className="mini-lbl">QTY</span>
                          <span className="mini-val">{item.quantity}</span>
                        </div>
                        <div className="price-stack text-end">
                          <span className="mini-lbl">UNIT COST</span>
                          <span className="mini-val text-success">${parseFloat(item.unit_cost).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="modal-footer-alignment">
                <button onClick={() => setSelectedOrder(null)} className="action-btn-base close-dismiss-trigger">
                  Close Audit Record
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* High Performance Embedded Custom Style Engine */}
      <style>{`
        /* FIX: Absolute Core Outer Layer to completely force black slate stretch and block the white bottom bleeding */
        .arbex-global-viewport-wrapper {
          background-color: #0b0f19 !important;
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .arbex-workspace-root { 
          background-color: #0b0f19 !important; 
          color: #ffffff !important; 
          flex: 1;
          width: 100%; 
          box-sizing: border-box; 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
          padding: 24px 30px 40px 24px; 
        }
        
        .arbex-panel-header { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.04); padding-bottom: 16px; flex-wrap: wrap; gap: 16px; }
        .main-title-text { font-size: 1.5rem; font-weight: 700; color: #ffffff; display: flex; align-items: center; gap: 12px; margin: 0; letter-spacing: -0.5px; }
        .accent-glow-cyan { color: #00d2ff; filter: drop-shadow(0 0 8px rgba(0, 210, 255, 0.3)); }
        .subtitle-text { font-size: 0.82rem; color: #64748b; margin: 4px 0 0 0; font-weight: 400; }

        .filter-component-box { position: relative; display: flex; align-items: center; }
        .filter-inner-glyph { position: absolute; left: 12px; color: #475569; font-size: 0.78rem; pointer-events: none; }
        .arbex-clean-select { background-color: #111827 !important; border: 1px solid rgba(255, 255, 255, 0.08) !important; border-radius: 6px !important; padding: 9px 14px 9px 34px !important; color: #e2e8f0 !important; font-size: 0.82rem !important; width: 210px !important; cursor: pointer; outline: none; transition: border-color 0.15s ease; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23475569' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e") !important; background-repeat: no-repeat !important; background-position: right 12px center !important; background-size: 10px !important; -webkit-appearance: none; appearance: none; }

        .analytics-metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; width: 100%; margin-bottom: 24px; }
        .metric-card { background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; position: relative; overflow: hidden; }
        .metric-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .metric-label { font-size: 0.72rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .metric-icon { font-size: 0.9rem; }
        .metric-value { font-size: 1.6rem; font-weight: 700; color: #ffffff; margin: 0 0 4px 0; }
        .metric-footer-text { font-size: 0.7rem; color: #475569; }
        
        .metric-cyan-glow { border-left: 3px solid #00d2ff; } .color-cyan { color: #00d2ff; }
        .metric-amber-glow { border-left: 3px solid #f59e0b; } .color-amber { color: #f59e0b; }
        .metric-emerald-glow { border-left: 3px solid #10b981; } .color-emerald { color: #10b981; }
        .metric-rose-glow { border-left: 3px solid #ef4444; } .color-rose { color: #ef4444; }
        .spinning-icon-slow { animation: spin 3s linear infinite; }

        .arbex-table-container-layer { width: 100%; background: #111827; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.04); overflow-x: auto; box-shadow: 0 4px 25px rgba(0,0,0,0.4); }
        .arbex-native-data-table { width: 100%; border-collapse: collapse; text-align: left; margin: 0; }
        .arbex-native-data-table th { color: #475569 !important; font-size: 0.72rem !important; font-weight: 700 !important; letter-spacing: 0.8px; text-transform: uppercase; padding: 14px 20px !important; border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important; background-color: #161e2e !important; }
        .arbex-native-data-table td { padding: 14px 20px !important; border-bottom: 1px solid rgba(255, 255, 255, 0.02) !important; font-size: 0.85rem; }
        .arbex-row:hover { background-color: rgba(255, 255, 255, 0.01); }
        
        .cyan-highlight-cell { color: #00d2ff !important; font-weight: 600; }
        .bright-white-cell { color: #f8fafc !important; font-weight: 500; }
        .dim-slate-cell { color: #64748b !important; }
        .timestamp-wrapper { display: flex; align-items: center; gap: 8px; }

        .status-trigger-badge { background: transparent; border: 1px solid transparent; border-radius: 4px; padding: 4px 10px; font-size: 0.72rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; text-transform: uppercase; }
        .status-dot { width: 5px; height: 5px; border-radius: 50%; display: inline-block; }
        .arrow-down-shift { opacity: 0.5; margin-left: 2px; }

        .popover-close-barrier { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 99; background: transparent; }
        .arbex-popover-dropdown-list { position: absolute; top: 100%; left: 0; background-color: #1f2937; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; width: 135px; margin-top: 5px; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6); z-index: 100; padding: 4px 0; }
        .popover-action-item { width: 100%; border: none; background: transparent; text-align: left; color: #94a3b8; padding: 7px 14px; font-size: 0.76rem; font-weight: 500; cursor: pointer; text-transform: uppercase; }
        .popover-action-item:hover { background-color: rgba(255,255,255,0.04); color: #ffffff; }
        .popover-action-item.item-selected { color: #00d2ff; background-color: rgba(0, 210, 255, 0.05); font-weight: 700; }

        .action-button-alignment-row { display: inline-flex; gap: 8px; align-items: center; }
        .action-btn-base { border: none; font-size: 0.78rem; font-weight: 500; border-radius: 5px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.15s ease; }
        .info-action-view { background-color: #1f2937 !important; color: #cbd5e1 !important; padding: 6px 12px !important; border: 1px solid rgba(255,255,255,0.03) !important; }
        .info-action-view:hover { background-color: #2d3748 !important; color: #ffffff !important; }
        .dangerous-action-delete { background-color: rgba(239, 68, 68, 0.1) !important; color: #ef4444 !important; width: 30px; height: 30px; padding: 0 !important; }
        .dangerous-action-delete:hover { background-color: #ef4444 !important; color: #ffffff !important; }

        .arbex-empty-card-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 24px; background-color: #111827; border-radius: 8px; border: 1px dashed rgba(255, 255, 255, 0.05); text-align: center; }
        .icon-wrapper-box { width: 50px; height: 50px; border-radius: 50%; background-color: rgba(255,255,255,0.02); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .empty-glyph-icon { color: #334155; }
        .arbex-empty-card-state h3 { font-size: 1rem; font-weight: 600; color: #94a3b8; margin: 0 0 4px 0; }
        .arbex-empty-card-state p { font-size: 0.8rem; color: #475569; margin: 0; }

        .workspace-loader-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: #64748b; font-size: 0.85rem; gap: 12px; }
        .custom-engine-spinner { width: 22px; height: 22px; border: 2px solid rgba(0, 210, 255, 0.1); border-top-color: #00d2ff; border-radius: 50%; animation: spin 0.8s linear infinite; }

        .arbex-modal-mask { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(4, 7, 13, 0.6); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .arbex-modal-window { width: 100%; max-width: 520px; background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 22px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7); max-height: 90vh; display: flex; flex-direction: column; }
        .modal-header-ribbon { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 12px; margin-bottom: 14px; }
        .modal-header-ribbon h3 { margin: 0; font-size: 1.1rem; color: #ffffff; font-weight: 600; }
        .modal-close-cross { background: transparent; border: none; color: #475569; font-size: 1.1rem; cursor: pointer; }
        
        .modal-inner-data-grid { background: #0b0f19; padding: 14px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.01); display: flex; flex-direction: column; gap: 10px; }
        .modal-data-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; }
        .row-label { color: #64748b; display: flex; align-items: center; }
        .row-icon-accent { margin-right: 8px; color: #3b82f6; opacity: 0.8; }
        .row-value-white { color: #ffffff; font-weight: 500; }
        .modal-status-pill { padding: 3px 10px; font-size: 0.7rem; font-weight: 700; border-radius: 4px; }
        
        .nested-items-title { font-size: 0.85rem; font-weight: 600; color: #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px; margin: 16px 0 10px 0; display: flex; align-items: center; }
        .modal-items-list-box { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; max-height: 240px; padding-right: 4px; }
        .nested-item-row-card { background: #1f293750; border: 1px solid rgba(255,255,255,0.03); border-radius: 6px; padding: 10px 14px; display: grid; grid-template-columns: 2fr 1.2fr 1.5fr; align-items: center; gap: 12px; }
        .item-identity { display: flex; flex-direction: column; }
        .item-name-head { font-size: 0.82rem; font-weight: 600; color: #ffffff; }
        .item-sku-sub { font-size: 0.7rem; color: #64748b; margin-top: 2px; }
        .item-variants-pills { display: flex; flex-direction: column; gap: 3px; }
        .variant-pill { font-size: 0.68rem; color: #94a3b8; background: #0b0f19; padding: 2px 6px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.02) !important; width: fit-content; }
        .item-pricing-summary { display: flex; justify-content: space-between; gap: 10px; }
        .price-stack { display: flex; flex-direction: column; }
        .mini-lbl { font-size: 0.6rem; color: #475569; font-weight: 600; }
        .mini-val { font-size: 0.78rem; font-weight: 700; color: #ffffff; }
        
        .modal-footer-alignment { display: flex; justify-content: flex-end; margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 12px; }
        .close-dismiss-trigger { background-color: #3b82f6 !important; color: #ffffff !important; padding: 9px 18px !important; font-size: 0.82rem !important; font-weight: 600 !important; }

        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .system-fade-in { animation: arbexFade 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-pop-up { animation: arbexPop 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes arbexFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes arbexPop { from { opacity: 0; transform: scale(0.97) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}