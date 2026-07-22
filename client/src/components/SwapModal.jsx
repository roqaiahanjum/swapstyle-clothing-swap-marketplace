import React, { useState, useEffect } from 'react';
import { fetchMyListings, createSwapRequest } from '../api';
import { X, Check, AlertCircle } from 'lucide-react';

export default function SwapModal({ isOpen, onClose, targetItem, onSuccess }) {
  const [myItems, setMyItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const loadMyItems = async () => {
        try {
          const res = await fetchMyListings();
          // Filter to only Available items
          const availableItems = res.data.filter(item => item.status === 'Available');
          setMyItems(availableItems);
          if (availableItems.length > 0) {
            setSelectedItemId(availableItems[0]._id);
          }
        } catch (err) {
          console.error('Error loading my items for swap:', err);
          setError('Failed to load your listings.');
        } finally {
          setLoading(false);
        }
      };
      loadMyItems();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedItem = myItems.find(item => item._id === selectedItemId);
  const valueDifference = selectedItem 
    ? Math.abs(selectedItem.estimatedSwapValue - targetItem.estimatedSwapValue)
    : 0;
  
  const isFairMatch = selectedItem && valueDifference <= 15;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemId) {
      setError('Please select an item to swap.');
      return;
    }

    const targetItemId = targetItem?._id || targetItem?.id;
    if (!targetItemId) {
      setError('Target item is invalid.');
      return;
    }
    
    setSubmitting(true);
    setError('');

    try {
      await createSwapRequest({
        offeredItemId: selectedItemId,
        requestedItemId: targetItemId
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error submitting swap request:', err);
      const serverMsg = err.response?.data?.message || err.message || 'Failed to submit swap request. Please try again.';
      setError(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div className="glass-card" style={modalContentStyle}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <h3 style={{ fontSize: '1.3rem' }}>Offer a Swap</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '12px', borderRadius: 'var(--border-radius-sm)', color: 'var(--danger)', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading your available listings...
          </div>
        ) : myItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              You don't have any clothing items available to swap.
            </p>
            <a href="/listings/create" className="btn-premium" style={{ display: 'inline-block' }}>
              Create a Listing First
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Select your item to offer:</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="form-control-custom"
                style={{ backgroundColor: 'var(--bg-main)' }}
              >
                {myItems.map(item => (
                  <option key={item._id} value={item._id}>
                    {item.title} ({item.brand} - {item.size}) - {item.estimatedSwapValue} pts
                  </option>
                ))}
              </select>
            </div>

            {/* Side by side swap comparison */}
            {selectedItem && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--border-radius-sm)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600', textTransform: 'uppercase' }}>Your Offer</div>
                    <div style={{ fontWeight: '600', color: 'white', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px', margin: '4px auto' }}>{selectedItem.title}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white' }}>{selectedItem.estimatedSwapValue} pts</div>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-muted)', padding: '0 12px' }}>⇄</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Their Request</div>
                    <div style={{ fontWeight: '600', color: 'white', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px', margin: '4px auto' }}>{targetItem.title}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white' }}>{targetItem.estimatedSwapValue} pts</div>
                  </div>
                </div>

                {/* Fair Trade Evaluation message */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: isFairMatch ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  border: `1px solid ${isFairMatch ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  color: isFairMatch ? 'var(--success)' : 'var(--warning)'
                }}>
                  {isFairMatch ? (
                    <>
                      <Check size={14} />
                      <span>Fair Swap Suggestion! Estimated values are closely matched (difference of {valueDifference} points).</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} />
                      <span>Value gap exists ({valueDifference} points). You can negotiate the terms during swap chat!</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button type="button" onClick={onClose} className="btn-secondary-custom">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-premium">
                {submitting ? 'Sending Request...' : 'Propose Swap'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(5, 7, 12, 0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
  padding: '20px'
};

const modalContentStyle = {
  width: '100%',
  maxWidth: '500px',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
};
