import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaSearch, FaFolder, FaEdit, FaTrashAlt, FaLayerGroup, FaLock 
} from 'react-icons/fa';
import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://cuddly-telegram-v6rqjx79xgvfwvx-5000.app.github.dev',
  withCredentials: true
});

export default function ProductCategoriesDashboard() {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [formCategoryName, setFormCategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const getAuthHeaders = () => {
    const activeToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
      headers: { 
        'Authorization': `Bearer ${activeToken}`,
        'x-store-id': localStorage.getItem('store_id') || '1'
      }
    };
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await instance.get('/api/categories', getAuthHeaders());
      setCategories(Array.isArray(response.data) ? response.data : []);
      setErrorMessage('');
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setErrorMessage('Your login session has expired. Please log out and sign in again.');
      } else {
        setErrorMessage(err.response?.data?.error || 'Could not load categories right now.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formCategoryName.trim()) return;

    try {
      if (selectedCategory) {
        const response = await instance.put(`/api/categories/${selectedCategory.category_id}`, { category_name: formCategoryName }, getAuthHeaders());
        const updated = Array.isArray(response.data) ? response.data[0] : response.data;
        setCategories(categories.map(cat => cat.category_id === selectedCategory.category_id ? { ...cat, ...updated } : cat));
      } else {
        const response = await instance.post('/api/categories', { category_name: formCategoryName }, getAuthHeaders());
        const added = Array.isArray(response.data) ? response.data[0] : response.data;
        setCategories([...categories, added]);
      }
      closeModal();
    } catch (err) {
      alert(err.response?.data?.error || 'Action restricted.');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category from your terminal?")) return;
    try {
      await instance.delete(`/api/categories/${id}`, getAuthHeaders());
      setCategories(categories.filter(cat => cat.category_id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Cannot delete category.');
    }
  };

  const openModal = (cat = null) => {
    if (cat) {
      setSelectedCategory(cat);
      setFormCategoryName(cat.category_name);
    } else {
      setSelectedCategory(null);
      setFormCategoryName('');
    }
    if (window.bootstrap?.Modal) {
      new window.bootstrap.Modal(document.getElementById('categoryModal')).show();
    }
  };

  const closeModal = () => {
    setFormCategoryName('');
    setSelectedCategory(null);
    const modalEl = document.getElementById('categoryModal');
    const instance = window.bootstrap?.Modal?.getInstance(modalEl);
    if (instance) instance.hide();
  };

  const filteredCategories = categories.filter(cat => (cat.category_name || "").toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-vh-100 p-4 p-md-5" style={{ backgroundColor: '#0b0f17', color: '#f1f5f9', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-5">
        <div>
          <h2 className="fw-extrabold text-white mb-1" style={{ letterSpacing: '-1px', background: 'linear-gradient(to right, #fff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Product Categories</h2>
          <p className="mb-0 small" style={{ color: '#94a3b8' }}>Organize your product items into clean departments and logical groupings.</p>
        </div>
        <button className="btn border-0 px-4 py-2 fw-bold text-white rounded-3 shadow" style={{ backgroundColor: '#f97316', transition: '0.2s' }} onClick={() => openModal()}>
          <FaPlus size={12} className="me-2" /> Create New Category
        </button>
      </div>

      {/* Counter Widget */}
      <div className="card border-0 mb-4 rounded-4 shadow-sm" style={{ backgroundColor: '#131926', width: '260px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-bold small" style={{ color: '#a1a1aa', letterSpacing: '0.5px' }}>TOTAL SECTIONS</span>
            <div className="p-2 rounded-3 text-info" style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)' }}><FaLayerGroup size={14}/></div>
          </div>
          <h2 className="fw-black text-white m-0">{categories.length}</h2>
        </div>
      </div>

      {/* Search Filter */}
      <div className="input-group mb-4 rounded-3 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="input-group-text border-0 text-muted px-3" style={{ backgroundColor: 'rgba(19, 25, 38, 0.7)' }}><FaSearch /></span>
        <input 
          type="text" 
          className="form-control border-0 text-white shadow-none py-2 input-placeholder-fix" 
          style={{ backgroundColor: 'rgba(19, 25, 38, 0.7)' }} 
          placeholder="Search by category name..." 
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

      {/* Display Grid */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-info" /></div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-5 rounded-4" style={{ backgroundColor: '#131926', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="m-0" style={{ color: '#a1a1aa' }}>No active catalog sections match your search terms.</p>
        </div>
      ) : (
        <div className="row g-3">
          {filteredCategories.map((cat) => (
            <div className="col-12 col-md-6 col-lg-4" key={cat.category_id}>
              <div className="card h-100 border-0 rounded-4 p-4" style={{ backgroundColor: '#131926', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div className="p-2 rounded-3" style={{ backgroundColor: 'rgba(56, 189, 248, 0.08)', color: '#38bdf8' }}><FaFolder size={16} /></div>
                  <h5 className="text-white fw-bold m-0">{cat.category_name}</h5>
                </div>
                <div className="d-flex justify-content-between align-items-center pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <code style={{ color: '#a1a1aa' }}>REF_{cat.category_id}</code>
                  <div>
                    <button className="btn btn-link text-info p-1 me-2 shadow-none" onClick={() => openModal(cat)}><FaEdit size={13} /></button>
                    <button className="btn btn-link text-danger p-1 shadow-none" onClick={() => handleDeleteCategory(cat.category_id)}><FaTrashAlt size={13} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bootstrap Modal Form Fix */}
      <div className="modal fade" id="categoryModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
          <form className="modal-content border-0 rounded-4 text-white" style={{ backgroundColor: '#171e2e', border: '1px solid rgba(255,255,255,0.1)' }} onSubmit={handleFormSubmit}>
            <div className="modal-header border-bottom-0 p-4 pb-2 d-flex justify-content-between align-items-center">
              <h5 className="modal-title fw-bold text-white">{selectedCategory ? 'Edit Section Properties' : 'Create New Group'}</h5>
              <button type="button" className="btn-close btn-close-white shadow-none" data-bs-dismiss="modal" onClick={closeModal} />
            </div>
            <div className="modal-body p-4">
              <p className="small mb-4" style={{ color: '#cbd5e1', lineHeight: '1.5' }}>
                Provide a clear name for this group so it can be assigned to items easily inside your stock terminal.
              </p>
              <div className="form-group">
                <label className="small fw-bold mb-2" style={{ color: '#a1a1aa', letterSpacing: '0.5px' }}>Category Name *</label>
                <input 
                  type="text" 
                  className="form-control border-0 text-white rounded-3 p-2.5 input-placeholder-fix" 
                  style={{ backgroundColor: '#0b0f17', border: '1px solid rgba(255,255,255,0.1)' }} 
                  placeholder="e.g. Winter Wear, Electronics"
                  value={formCategoryName} 
                  onChange={(e) => setFormCategoryName(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <div className="modal-footer border-top-0 p-4 pt-2 gap-2">
              <button type="button" className="btn btn-link fw-bold text-decoration-none shadow-none" style={{ color: '#94a3b8' }} data-bs-dismiss="modal" onClick={closeModal}>Cancel</button>
              <button type="submit" className="btn border-0 text-white px-4 py-2 fw-bold rounded-3 shadow" style={{ backgroundColor: '#f97316' }}>
                {selectedCategory ? 'Save Changes' : 'Add Category'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Global CSS Hack for Placeholder Contrast */}
      <style>{`
        .input-placeholder-fix::placeholder { color: #71717a !important; opacity: 1; }
        .modal-backdrop { background-color: #020617 !important; opacity: 0.75 !important; }
      `}</style>
    </div>
  );
}