import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteListing } from '../api';
import { MapPin, Tag, Edit, Trash2 } from 'lucide-react';

export default function ListingCard({ item, onDeleteSuccess }) {
  const { user } = useAuth();
  
  // Construct image source
  const backendUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '') || 'https://swapstyle-clothing-swap-marketplace.onrender.com';
  const imageSrc = item.images && item.images.length > 0
    ? (item.images[0].startsWith('http') ? item.images[0] : `${backendUrl}${item.images[0]}`)
    : 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&auto=format&fit=crop&q=60'; // High-quality fall-back clothes placeholder

  // Render status badge
  const renderStatusBadge = () => {
    switch (item.status) {
      case 'Available':
        return <span className="badge-status badge-available">Available</span>;
      case 'Pending':
        return <span className="badge-status badge-pending">Swap Pending</span>;
      case 'Swapped':
        return <span className="badge-status badge-swapped">Swapped</span>;
      default:
        return null;
    }
  };

  const ownerId = item.owner?._id || item.owner;
  const currentUserId = user?.id || user?._id;
  const isOwner = user && ownerId && ownerId.toString() === currentUserId.toString();

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
      try {
        await deleteListing(item._id || item.id);
        alert('Listing deleted successfully!');
        if (onDeleteSuccess) {
          onDeleteSuccess();
        } else {
          window.location.reload();
        }
      } catch (err) {
        console.error('Delete error:', err);
        alert(err.response?.data?.message || 'Failed to delete listing.');
      }
    }
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Listing Image */}
      <div style={{ position: 'relative', width: '100%', height: '200px', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', backgroundColor: '#1A2333' }}>
        <img
          src={imageSrc}
          alt={item.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          {renderStatusBadge()}
        </div>
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          background: 'rgba(15, 15, 25, 0.85)',
          padding: '6px 12px',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Tag size={12} color="var(--primary)" />
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'white' }}>
            Value: {item.estimatedSwapValue} pts
          </span>
        </div>
      </div>

      {/* Card Details */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {item.brand} • {item.size}
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
            Cond: <strong style={{ color: '#FFF' }}>{item.condition}</strong>
          </span>
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '8px', color: 'white', lineHeight: '1.4' }}>
          {item.title}
        </h3>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '16px', flex: 1 }}>
          {item.description}
        </p>

        {/* Card Footer Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color)', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            <MapPin size={14} color="var(--secondary)" />
            <span>{item.location?.city || 'Unknown'}</span>
          </div>

          {/* Proximity / Distance indication */}
          {item.distance !== undefined && item.distance !== null && (
            <span className="proximity-badge">
              {item.distance} km away
            </span>
          )}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link
            to={`/listings/${item._id || item.id}`}
            className="btn-premium"
            style={{ width: '100%', padding: '10px 16px', fontSize: '0.85rem' }}
          >
            View Details
          </Link>

          {isOwner && (
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <Link
                to={`/listings/${item._id || item.id}/edit`}
                className="btn-secondary-custom"
                style={{ flex: 1, padding: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Edit size={12} color="var(--primary)" /> Edit
              </Link>
              <button
                onClick={handleDelete}
                className="btn-outline-danger"
                style={{ flex: 1, padding: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
