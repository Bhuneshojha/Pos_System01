import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaSearch, FaBoxOpen, FaEdit, FaTrashAlt, FaLock, FaTags 
} from 'react-icons/fa';
import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://cuddly-telegram-v6rqjx79xgvfwvx-5000.app.github.dev',
  withCredentials: true
});

export default function ProductsDashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formBrandId, setFormBrandId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const getAuthHeaders = () => {
    const activeToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
      headers: { 
        'Authorization': `Bearer ${activeToken}`,
        'x-store-id': localStorage.getItem('store_id') || '1'
      }
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, brandRes] = await Promise.all([
        instance.get('/api/products', getAuthHeaders()),
        instance.get('/api/categories', getAuthHeaders()).catch(() => ({ data: [] })),
        instance.get('/api/brands', getAuthHeaders()).catch(() => ({ data: [] }))
      ]);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      setBrands(Array.isArray(brandRes.data) ? brandRes.data : []);
      setErrorMessage('');
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setErrorMessage('Your login session has expired. Please log out and sign in again.');
      } else {
        setErrorMessage(err.response?.data?.error || 'Unable to load warehouse vault products.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      product_name: formName,
      price: parseFloat(formPrice),
      stock_quantity: parseInt(formStock),
      category_id: formCategoryId || null,
      brand_id: formBrandId || null
    };

    try {
      if (selectedProduct) {
        const response = await instance.put(`/api/products/${selectedProduct.product_id}`, payload, getAuthHeaders());
        const updated = Array.isArray(response.data) ? response.data[0] : response.data;
        setProducts(products.map(p => p.product_id === selectedProduct.product_id ? { ...p, ...updated } : p));
      } else {
        const response = await instance.post('/api/products', payload, getAuthHeaders());
        const added = Array.isArray(response.data) ? response.data[0] : response.data;
        setProducts([...products, added]);
      }
      closeModal();
    } catch (err) {
      alert(err.response?.data?.error || 'Operation failed.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Archive and delete this product?")) return;
    try {
      await instance.delete(`/api/products/${id}`, getAuthHeaders());
      setProducts(products.filter(p => p.product_id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Deletion restricted.');
    }
  };

  const openModal = (p = null) => {
    if (p) {
      setSelectedProduct(p);
      setFormName(p.product_name || '');
      setFormPrice(p.price || '');
      setFormStock(p.stock_quantity || '');
      setFormCategoryId(p.category_id || '');
      setFormBrandId(p.brand_id || '');
    } else {
      setSelectedProduct(null);
      setFormName('');
      setFormPrice('');
      setFormStock('');
      setFormCategoryId('');
      setFormBrandId('');
    }
    if (window.bootstrap?.Modal) {
      new window.bootstrap.Modal(document.getElementById('productModal')).show();
    }
  };

  const closeModal = () => {
    setSelectedProduct(null);
    const modalEl = document.getElementById('productModal');
    const instance = window.bootstrap?.Modal?.getInstance(modalEl);
    if (instance) instance.hide();
  };

  const filteredProducts = products.filter(p => (p.product_name || "").toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-vh-100 p-4 p-md-5" style={{ backgroundColor: '#0b0f17', color: '#f1f5f9', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-5">
        <div>
          <h2 className="fw-extrabold text-white mb-1" style={{ letterSpacing: '-1px', background: 'linear-gradient(to right, #fff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Products Catalog</h2>
          <p className="mb-0 small" style={{ color: '#94a3b8' }}>Inspect pricing tiers, stock levels, warehouse items and brand categories distribution.</p>
        </div>
        <button className="btn border-0 px-4 py-2 fw-bold text-white rounded-3 shadow" style={{ backgroundColor: '#f97316' }} onClick={() => openModal()}>
          <FaPlus size={12} className="me-2" /> Add New Product
        </button>
      </div>

      {/* Counter Widget */}
      <div className="card border-0 mb-4 rounded-4 shadow-sm" style={{ backgroundColor: '#131926', width: '260px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-bold small" style={{ color: '#a1a1aa', letterSpacing: '0.5px' }}>TRACKED STOCK ITEMS</span>
            <div className="p-2 rounded-3 text-info" style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)' }}><FaBoxOpen size={14}/></div>
          </div>
          <h2 className="fw-black text-white m-0">{products.length}</h2>
        </div>
      </div>

      {/* Search Bar Input */}
      <div className="input-group mb-4 rounded-3 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="input-group-text border-0 text-muted px-3" style={{ backgroundColor: 'rgba(19, 25, 38, 0.7)' }}><FaSearch /></span>
        <input 
          type="text" 
          className="form-control border-0 text-white shadow-none py-2 input-placeholder-fix" 
          style={{ backgroundColor: 'rgba(19, 25, 38, 0.7)' }} 
          placeholder="Search items by product naming convention..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
      </div>

      {/* Modern Notice / Session Box Fix */}
      {errorMessage && (
        <div className="alert border-0 rounded-3 p-3 mb-5 d-flex align-items-center gap-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444' }}>
          <div className="text-danger"><FaLock /></div>
          <div style={{ color: '#fca5a5', fontSize: '0.9rem', fontWeight: '500' }}>{errorMessage}</div>
        </div>
      )}

      {/* Grid List Elements */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-info" /></div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-5 rounded-4" style={{ backgroundColor: '#131926', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="m-0" style={{ color: '#a1a1aa' }}>No catalog elements visible matching your filters.</p>
        </div>
      ) : (
        <div className="row g-3">
          {filteredProducts.map((prod) => (
            <div className="col-12 col-md-6 col-lg-4" key={prod.product_id}>
              <div className="card h-100 border-0 rounded-4 p-4" style={{ backgroundColor: '#131926', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="text-white fw-bold mb-1">{prod.product_name}</h5>
                    <h5 className="fw-bold m-0" style={{ color: '#38bdf8' }}>${Number(prod.price || 0).toFixed(2)}</h5>
                  </div>
                  <span className="badge rounded-2 px-2.5 py-1.5 fw-bold" style={{ backgroundColor: 'rgba(52, 211, 153, 0.08)', color: '#34d399' }}>{prod.stock_quantity} Units</span>
                </div>
                
                <div className="d-flex flex-wrap gap-1 mb-4">
                  {prod.category_name && (
                    <span className="small px-2 py-0.5 rounded fw-medium" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#cbd5e1', fontSize: '0.75rem' }}>
                      <FaTags size={10} className="me-1" style={{ color: '#f97316' }}/>{prod.category_name}
                    </span>
                  )}
                </div>

                <div className="d-flex justify-content-between align-items-center pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <code style={{ color: '#a1a1aa' }}>SKU_{prod.product_id}</code>
                  <div>
                    <button className="btn btn-link text-info p-1 me-2 shadow-none" onClick={() => openModal(prod)}><FaEdit size={13} /></button>
                    <button className="btn btn-link text-danger p-1 shadow-none" onClick={() => handleDeleteProduct(prod.product_id)}><FaTrashAlt size={13} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bootstrap Modal Form Fix */}
      <div className="modal fade" id="productModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
          <form className="modal-content border-0 rounded-4 text-white" style={{ backgroundColor: '#171e2e', border: '1px solid rgba(255,255,255,0.1)' }} onSubmit={handleFormSubmit}>
            <div className="modal-header border-bottom-0 p-4 pb-2 d-flex justify-content-between align-items-center">
              <h5 className="modal-title fw-bold text-white">{selectedProduct ? 'Modify Vault Product' : 'Onboard New Product'}</h5>
              <button type="button" className="btn-close btn-close-white shadow-none" data-bs-dismiss="modal" onClick={closeModal} />
            </div>
            <div className="modal-body p-4 d-flex flex-column gap-3">
              <div>
                <label className="small fw-bold mb-2" style={{ color: '#a1a1aa' }}>Product Title *</label>
                <input 
                  type="text" 
                  className="form-control border-0 text-white rounded-3 input-placeholder-fix" 
                  style={{ backgroundColor: '#0b0f17', border: '1px solid rgba(255,255,255,0.1)' }} 
                  placeholder="Enter product title details..."
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)} 
                  required 
                />
              </div>
              <div className="row g-2">
                <div className="col">
                  <label className="small fw-bold mb-2" style={{ color: '#a1a1aa' }}>Price ($) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control border-0 text-white rounded-3" 
                    style={{ backgroundColor: '#0b0f17', border: '1px solid rgba(255,255,255,0.1)' }} 
                    value={formPrice} 
                    onChange={(e) => setFormPrice(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col">
                  <label className="small fw-bold mb-2" style={{ color: '#a1a1aa' }}>Stock Units *</label>
                  <input 
                    type="number" 
                    className="form-control border-0 text-white rounded-3" 
                    style={{ backgroundColor: '#0b0f17', border: '1px solid rgba(255,255,255,0.1)' }} 
                    value={formStock} 
                    onChange={(e) => setFormStock(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="small fw-bold mb-2" style={{ color: '#a1a1aa' }}>Assigned Category</label>
                <select 
                  className="form-select border-0 text-white rounded-3 dropdown-fix" 
                  style={{ backgroundColor: '#0b0f17', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} 
                  value={formCategoryId} 
                  onChange={(e) => setFormCategoryId(e.target.value)}
                >
                  <option value="" style={{ backgroundColor: '#171e2e', color: '#94a3b8' }}>None</option>
                  {categories.map(c => (
                    <option key={c.category_id} value={c.category_id} style={{ backgroundColor: '#171e2e', color: '#fff' }}>{c.category_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="small fw-bold mb-2" style={{ color: '#a1a1aa' }}>Assigned Brand Connection</label>
                <select 
                  className="form-select border-0 text-white rounded-3 dropdown-fix" 
                  style={{ backgroundColor: '#0b0f17', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} 
                  value={formBrandId} 
                  onChange={(e) => setFormBrandId(e.target.value)}
                >
                  <option value="" style={{ backgroundColor: '#171e2e', color: '#94a3b8' }}>None</option>
                  {brands.map(b => (
                    <option key={b.brand_id} value={b.brand_id} style={{ backgroundColor: '#171e2e', color: '#fff' }}>{b.brand_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer border-top-0 p-4 pt-2 gap-2">
              <button type="button" className="btn btn-link fw-bold text-decoration-none shadow-none" style={{ color: '#94a3b8' }} data-bs-dismiss="modal" onClick={closeModal}>Cancel</button>
              <button type="submit" className="btn border-0 text-white px-4 py-2 fw-bold rounded-3 shadow" style={{ backgroundColor: '#f97316' }}>
                {selectedProduct ? 'Save Changes' : 'Confirm Product'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Global CSS Hack for Placeholder Contrast and Bootstrap Select Options */}
      <style>{`
        .input-placeholder-fix::placeholder { color: #71717a !important; opacity: 1; }
        .modal-backdrop { background-color: #020617 !important; opacity: 0.75 !important; }
        .dropdown-fix:focus { box-shadow: none; border-color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}