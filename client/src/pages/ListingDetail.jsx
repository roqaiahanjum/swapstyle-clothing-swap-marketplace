import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchListingById, deleteListing } from '../api';
import SwapModal from '../components/SwapModal';
import { MapPin, Tag, Calendar, User, Trash2, ArrowRightLeft, ShieldAlert } from 'lucide-react';

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [swapSuccessMessage, setSwapSuccessMessage] = useState('');

  const loadItem = async () => {
    try {
      const res = await fetchListingById(id);
      setItem(res.data);
    } catch (err) {
      console.error('Error fetching listing details:', err);
      setError('Listing not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItem();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      try {
        await deleteListing(item._id || item.id);
        navigate('/listings');
      } catch (err) {
        console.error('Error deleting listing:', err);
        setError('Failed to delete listing.');
      }
    }
  };

  if (loading) {
    return (
      <div className="container-custom" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading listing details...
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container-custom" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Error</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '16px 0' }}>{error || 'Item not found.'}</p>
        <Link to="/listings" className="btn-premium">Browse Marketplace</Link>
      </div>
    );
  }

  const isOwner = user && (user.id === item.owner._id || user._id === item.owner._id);
  const isAdmin = user && user.role === 'admin';
  const backendUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '') || 'https://swapstyle-clothing-swap-marketplace.onrender.com';

  // Extract images
  const images = item.images && item.images.length > 0
    ? item.images.map(img => img.startsWith('http') ? img : `${backendUrl}${img}`)
    : ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=700&auto=format&fit=crop&q=60'];

  return (
    <div className="fadeIn container-custom" style={{ marginTop: '20px', paddingBottom: '40px' }}>
      
      {/* Back button */}
      <Link to="/listings" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '20px' }}>
        ← Back to Marketplace
      </Link>

      {swapSuccessMessage && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--success)', padding: '16px', borderRadius: 'var(--border-radius-sm)', color: 'var(--success)', marginBottom: '24px' }}>
          <strong>Success!</strong> {swapSuccessMessage}
        </div>
      )}

      {/* Grid: Image Gallery & details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
        
          {/* Left Side: Images */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '100%', height: '400px', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', backgroundColor: '#1A2333', border: '1px solid var(--border-color)', position: 'relative' }}>
              <img
                src={images[activeImageIdx]}
                alt={item.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', cursor: 'zoom-in' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=700&auto=format&fit=crop&q=60';
                }}
              />
            </div>
            
            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: activeImageIdx === idx ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      boxShadow: activeImageIdx === idx ? '0 0 10px var(--primary-glow)' : 'none',
                      opacity: activeImageIdx === idx ? 1 : 0.6,
                      transform: activeImageIdx === idx ? 'scale(1.05)' : 'scale(1)',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <img src={img} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
  
          {/* Right Side: Details & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* Brand & Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {item.brand}
              </span>
              <span className={`badge-status ${item.status === 'Available' ? 'badge-available' : item.status === 'Pending' ? 'badge-pending' : 'badge-swapped'}`}>
                {item.status}
              </span>
            </div>
  
            <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', marginBottom: '16px', lineHeight: '1.2' }}>
              {item.title}
            </h1>
  
            {/* Details Row (Size, Condition, Swap Points, Gender, Color) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '16px 0', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Size</div>
                <div style={{ fontWeight: '600', color: 'white', fontSize: '1.05rem' }}>{item.size}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Condition</div>
                <div style={{ fontWeight: '600', color: 'white', fontSize: '1.05rem' }}>{item.condition}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Swap Points</div>
                <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '1.05rem' }}>{item.estimatedSwapValue} pts</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Gender</div>
                <div style={{ fontWeight: '600', color: 'white', fontSize: '1.05rem' }}>{item.gender || 'Unisex'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Color</div>
                <div style={{ fontWeight: '600', color: 'white', fontSize: '1.05rem' }}>{item.color || 'N/A'}</div>
              </div>
            </div>

          {/* Description */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Description</h3>
            <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', fontSize: '0.95rem' }}>{item.description}</p>
          </div>

          {/* Metadata: Location, Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={16} color="var(--secondary)" />
              <span>Location: <strong>{item.location.city}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} color="var(--text-muted)" />
              <span>Listed on: {new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Owner details card */}
          <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '30px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
            {item.owner.profilePicture ? (
              <img
                src={item.owner.profilePicture.startsWith('http') ? item.owner.profilePicture : `${backendUrl}${item.owner.profilePicture}`}
                alt={item.owner.name}
                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <User size={24} />
              </div>
            )}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Listed By</div>
              <div style={{ fontWeight: '600', color: 'white' }}>{item.owner.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>City: {item.owner.location?.city || 'N/A'}</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ marginTop: 'auto' }}>
            {isOwner ? (
              <div style={{ display: 'flex', gap: '16px' }}>
                <button
                  onClick={handleDelete}
                  className="btn-outline-danger"
                  style={{ flex: 1, padding: '12px' }}
                >
                  <Trash2 size={18} /> Delete Listing
                </button>
              </div>
            ) : user ? (
              item.status === 'Available' ? (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn-premium"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                >
                  <ArrowRightLeft size={18} /> Propose Exchange Swap
                </button>
              ) : (
                <button
                  disabled
                  className="btn-secondary-custom"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem', cursor: 'not-allowed', opacity: 0.6 }}
                >
                  Item Lock Pending Swap
                </button>
              )
            ) : (
              <div style={{ textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px' }}>
                  Interested in swapping for this item? Log in to list your items and propose a swap.
                </p>
                <Link to="/login" className="btn-premium" style={{ width: '100%' }}>
                  Login to Propose Swap
                </Link>
              </div>
            )}

            {/* Admin Delete Action */}
            {isAdmin && !isOwner && (
              <button
                onClick={handleDelete}
                className="btn-outline-danger"
                style={{ width: '100%', marginTop: '16px', padding: '12px', borderColor: 'var(--warning)', color: 'var(--warning)' }}
              >
                <ShieldAlert size={18} /> Delete Inappropriate Listing (Admin)
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Swap request modal overlay */}
      <SwapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetItem={item}
        onSuccess={() => {
          setSwapSuccessMessage('Your swap proposal has been successfully submitted! Go to "My Swaps" to track its progress.');
          // Reload item details to show new lock status if needed
          loadItem();
        }}
      />

    </div>
  );
}
