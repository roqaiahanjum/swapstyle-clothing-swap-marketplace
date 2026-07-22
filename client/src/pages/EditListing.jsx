import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchListingById, updateListing, getSuggestedValue } from '../api';
import { useAuth } from '../context/AuthContext';
import { PencilLine, Tag, Sparkles, Image, AlertCircle, Trash2 } from 'lucide-react';

export default function EditListing() {
  const { id } = useParams();
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

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [clearExistingImages, setClearExistingImages] = useState(false);
  
  const [suggestedVal, setSuggestedVal] = useState(null);
  const [useSuggested, setUseSuggested] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch listing details on mount
  useEffect(() => {
    const loadListing = async () => {
      try {
        const res = await fetchListingById(id);
        const item = res.data;

        // Security check: only allow owner or admin to edit
        const currentUserId = user?.id || user?._id;
        if (item.owner._id !== currentUserId && item.owner !== currentUserId && user?.role !== 'admin') {
          navigate('/listings');
          return;
        }

        setFormData({
          title: item.title,
          description: item.description,
          category: item.category,
          brand: item.brand,
          size: item.size,
          condition: item.condition,
          estimatedSwapValue: item.estimatedSwapValue,
          city: item.location.city,
          lat: item.location.coordinates.lat,
          lng: item.location.coordinates.lng
        });
        setExistingImages(item.images || []);
      } catch (err) {
        console.error('Error loading listing to edit:', err);
        setError('Failed to load listing.');
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      loadListing();
    }
  }, [id, user]);

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
    
    if (!loading) {
      const delayDebounce = setTimeout(() => {
        fetchSuggestion();
      }, 500);
      return () => clearTimeout(delayDebounce);
    }
  }, [formData.category, formData.brand, formData.condition, useSuggested, loading]);

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
      setNewImages([]);
      return;
    }
    const hasOversized = files.some(file => file.size > 5 * 1024 * 1024);
    if (hasOversized) {
      setError('Each image file must be smaller than 5MB.');
      e.target.value = '';
      setNewImages([]);
      return;
    }
    setError('');
    setNewImages(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.brand || !formData.size || !formData.city) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });

    data.append('clearExistingImages', clearExistingImages);

    newImages.forEach(img => {
      data.append('images', img);
    });

    try {
      await updateListing(id, data);
      navigate(`/listings/${id}`);
    } catch (err) {
      console.error('Error updating listing:', err);
      setError(err.response?.data?.message || 'Failed to update listing. Ensure all fields are valid.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container-custom" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading listing settings...
      </div>
    );
  }

  const backendUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '') || 'https://swapstyle-clothing-swap-marketplace.onrender.com';

  return (
    <div className="fadeIn container-custom" style={{ maxWidth: '640px', marginTop: '20px', paddingBottom: '40px' }}>
      <div className="glass-card">
        
        {/* Header */}
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PencilLine color="var(--primary)" /> Edit Listing Details
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Modify parameters for your clothing item listing</p>
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

          {/* Swap Value suggest */}
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
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enter details to suggest value points.</p>
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

          {/* Location city */}
          <div className="form-group">
            <label className="form-label">Listing Location (City) *</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="form-control-custom"
              required
            />
          </div>

          {/* Existing Photos list */}
          {existingImages.length > 0 && !clearExistingImages && (
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label">Existing Photos</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {existingImages.map((img, index) => (
                  <div key={index} style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
                    <img src={`${backendUrl}${img}`} alt="existing clothing preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setClearExistingImages(true)}
                className="btn-secondary-custom"
                style={{ fontSize: '0.8rem', padding: '6px 12px', borderColor: 'var(--danger)', color: 'var(--danger)' }}
              >
                <Trash2 size={12} /> Clear and Replace Photos
              </button>
            </div>
          )}

          {clearExistingImages && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px dashed var(--danger)', padding: '10px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.8rem', color: 'var(--danger)' }}>
              Notice: Existing images will be cleared. Please upload new photos below.
            </div>
          )}

          {/* Upload new images */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Image size={16} color="var(--secondary)" /> {clearExistingImages ? 'Upload New Photos' : 'Upload Additional Photos'} (Up to 5)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="form-control-custom"
              style={{ padding: '8px' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '24px' }}>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary-custom">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-premium">
              {submitting ? 'Saving Changes...' : 'Save Updates'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
