import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createListing, getSuggestedValue } from '../api';
import { PlusCircle, Tag, Sparkles, Image, AlertCircle } from 'lucide-react';

export default function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Tops',
    brand: '',
    size: '',
    condition: 'Good',
    estimatedSwapValue: 0,
    city: '',
    lat: 0,
    lng: 0
  });

  const [images, setImages] = useState([]);
  const [suggestedVal, setSuggestedVal] = useState(null);
  const [useSuggested, setUseSuggested] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Prepopulate city and coordinates from user profile
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        city: user.location?.city || '',
        lat: user.location?.coordinates?.lat || 0,
        lng: user.location?.coordinates?.lng || 0
      }));
    }
  }, [user]);

  // Request suggested value whenever category, brand, or condition changes
  useEffect(() => {
    const fetchSuggestion = async () => {
      if (formData.category && formData.brand && formData.condition) {
        try {
          const res = await getSuggestedValue(formData.category, formData.brand, formData.condition);
          setSuggestedVal(res.data.suggestedValue);
          if (useSuggested) {
            setFormData(prev => ({ ...prev, estimatedSwapValue: res.data.suggestedValue }));
          }
        } catch (err) {
          console.error('Error fetching value suggestion:', err);
        }
      }
    };
    
    // Simple debounce to avoid spamming the backend
    const delayDebounce = setTimeout(() => {
      fetchSuggestion();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [formData.category, formData.brand, formData.condition, useSuggested]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleValueModeChange = (e) => {
    const checked = e.target.checked;
    setUseSuggested(checked);
    if (checked && suggestedVal !== null) {
      setFormData(prev => ({ ...prev, estimatedSwapValue: suggestedVal }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      setError('You can only upload up to 5 images.');
      e.target.value = ''; // clear input selection
      setImages([]);
      return;
    }
    const hasOversized = files.some(file => file.size > 5 * 1024 * 1024);
    if (hasOversized) {
      setError('Each image file must be smaller than 5MB.');
      e.target.value = '';
      setImages([]);
      return;
    }
    setError('');
    setImages(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.brand || !formData.size || !formData.city) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });

    images.forEach(img => {
      data.append('images', img);
    });

    try {
      await createListing(data);
      navigate('/dashboard');
    } catch (err) {
      console.error('Listing creation error:', err);
      setError(err.response?.data?.message || 'Failed to list item. Ensure fields are correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fadeIn container-custom" style={{ maxWidth: '640px', marginTop: '20px', paddingBottom: '40px' }}>
      <div className="glass-card">
        
        {/* Form Title */}
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle color="var(--primary)" /> List a Clothing Item
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Offer a clean, wearable item to the marketplace</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '12px', borderRadius: 'var(--border-radius-sm)', color: 'var(--danger)', marginBottom: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label className="form-label">Item Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Vintage Denim Jacket"
              className="form-control-custom"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe condition, fit, style details, and what you might be interested in swapping for..."
              className="form-control-custom"
              style={{ minHeight: '100px', resize: 'vertical' }}
              required
            />
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-control-custom"
                style={{ backgroundColor: 'var(--bg-main)' }}
              >
                <option value="Outerwear">Outerwear</option>
                <option value="Tops">Tops</option>
                <option value="Bottoms">Bottoms</option>
                <option value="Shoes">Shoes</option>
                <option value="Accessories">Accessories</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Brand *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g. Nike, Zara, Gucci"
                className="form-control-custom"
                required
              />
            </div>
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Size *</label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleChange}
                placeholder="e.g. M, L, 32, 10"
                className="form-control-custom"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Condition *</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="form-control-custom"
                style={{ backgroundColor: 'var(--bg-main)' }}
              >
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
          </div>

          {/* Swap Value Suggestion Engine */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Tag size={18} color="var(--primary)" />
              <span style={{ fontWeight: '600', color: 'white' }}>Swap Value Calculator</span>
            </div>

            {suggestedVal !== null ? (
              <div className="value-suggest-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="var(--primary)" />
                  <span style={{ fontSize: '0.85rem' }}>Auto-suggested Value: <strong style={{ fontSize: '1.05rem', color: 'white' }}>{suggestedVal} pts</strong></span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="checkbox"
                    id="useSuggested"
                    checked={useSuggested}
                    onChange={handleValueModeChange}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="useSuggested" style={{ fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none' }}>Use suggested</label>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enter Category, Brand, and Condition to calculate swap score.</p>
            )}

            {!useSuggested && (
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Custom Swap Value (pts)</label>
                <input
                  type="number"
                  name="estimatedSwapValue"
                  value={formData.estimatedSwapValue}
                  onChange={handleChange}
                  className="form-control-custom"
                  min="0"
                />
              </div>
            )}
          </div>

          {/* Location info for listing */}
          <div className="form-group">
            <label className="form-label">Listing Location (City) *</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="e.g. New York, NY"
              className="form-control-custom"
              required
            />
          </div>

          {/* Multiple image files */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Image size={16} color="var(--secondary)" /> Upload Photos (Up to 5)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="form-control-custom"
              style={{ padding: '8px' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
              Images will be uploaded and stored on the server.
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '24px' }}>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary-custom">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-premium">
              {loading ? 'Listing Item...' : 'Publish Listing'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
