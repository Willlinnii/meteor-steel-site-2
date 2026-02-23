import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, addDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, firebaseConfigured } from '../../auth/firebase';
import { useAuth } from '../../auth/AuthContext';
import { useProfile } from '../../profile/ProfileContext';
import './CuratedProductsPage.css';

const CATEGORIES = ['All', 'Books', 'Art', 'Tools', 'Music', 'Other'];
const ADD_CATEGORIES = ['Books', 'Art', 'Tools', 'Music', 'Other'];

const EMPTY_FORM = { title: '', description: '', category: 'Books', storeName: '', imageUrl: '', buyUrl: '' };

function CuratedProductsPage() {
  const { user } = useAuth();
  const { curatorApproved } = useProfile();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = async () => {
    if (!firebaseConfigured || !db) { setLoading(false); return; }
    try {
      const q = query(
        collection(db, 'curatedProducts'),
        where('active', '==', true),
        orderBy('sortOrder', 'asc')
      );
      const snap = await getDocs(q);
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Failed to load curated products:', err);
    }
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return products;
    return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.buyUrl.trim() || !user) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'curatedProducts'), {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        storeName: form.storeName.trim(),
        imageUrl: form.imageUrl.trim(),
        buyUrl: form.buyUrl.trim(),
        sortOrder: 0,
        active: true,
        curatedBy: user.uid,
        createdAt: serverTimestamp(),
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadProducts();
    } catch (err) {
      console.error('Failed to add product:', err);
    }
    setSubmitting(false);
  };

  return (
    <div className="curated-page">
      <div className="curated-header">
        <h1 className="curated-title">Curated Collection</h1>
        <p className="curated-subtitle">Hand-picked treasures from across the web</p>
        {curatorApproved && (
          <button
            className="curated-curate-btn"
            onClick={() => setShowForm(prev => !prev)}
          >
            {showForm ? 'Cancel' : 'Curate'}
          </button>
        )}
      </div>

      <div className="curated-filters">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`curated-filter-pill${activeCategory === cat ? ' active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {showForm && (
        <form className="curated-add-form" onSubmit={handleSubmit}>
          <div className="curated-form-grid">
            <input
              className="curated-form-input"
              type="text"
              placeholder="Title *"
              value={form.title}
              onChange={e => handleFormChange('title', e.target.value)}
              required
            />
            <input
              className="curated-form-input"
              type="text"
              placeholder="Store name"
              value={form.storeName}
              onChange={e => handleFormChange('storeName', e.target.value)}
            />
            <input
              className="curated-form-input"
              type="url"
              placeholder="Buy URL *"
              value={form.buyUrl}
              onChange={e => handleFormChange('buyUrl', e.target.value)}
              required
            />
            <input
              className="curated-form-input"
              type="url"
              placeholder="Image URL"
              value={form.imageUrl}
              onChange={e => handleFormChange('imageUrl', e.target.value)}
            />
            <select
              className="curated-form-input"
              value={form.category}
              onChange={e => handleFormChange('category', e.target.value)}
            >
              {ADD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              className="curated-form-input curated-form-desc"
              type="text"
              placeholder="Description"
              value={form.description}
              onChange={e => handleFormChange('description', e.target.value)}
            />
          </div>
          <button
            className="curated-form-submit"
            type="submit"
            disabled={submitting || !form.title.trim() || !form.buyUrl.trim()}
          >
            {submitting ? 'Adding...' : 'Add to Collection'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="curated-loading">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="curated-empty">
          {products.length === 0 ? 'No products yet.' : 'No products in this category.'}
        </div>
      ) : (
        <div className="curated-grid">
          {filtered.map(product => (
            <a
              key={product.id}
              className="curated-card"
              href={product.buyUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="curated-card-img-wrap">
                <img
                  className="curated-card-img"
                  src={product.imageUrl}
                  alt={product.title}
                  loading="lazy"
                />
                <span className="curated-card-category">{product.category}</span>
              </div>
              <div className="curated-card-body">
                <h3 className="curated-card-title">{product.title}</h3>
                <p className="curated-card-desc">{product.description}</p>
                <span className="curated-card-store">
                  {product.storeName} <span className="curated-card-arrow">{'\u2197'}</span>
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default CuratedProductsPage;
