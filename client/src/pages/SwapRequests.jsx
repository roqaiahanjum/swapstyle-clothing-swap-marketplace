import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMySwaps, updateSwapRequestStatus } from '../api';
import { MessageSquare, Check, X, ShieldAlert, Award, ArrowRightLeft, AlertCircle } from 'lucide-react';

export default function SwapRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' or 'outgoing'
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dispute modal trigger state
  const [disputeSwapId, setDisputeSwapId] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  const loadSwaps = async () => {
    try {
      const res = await fetchMySwaps();
      setIncoming(res.data.incoming);
      setOutgoing(res.data.outgoing);
    } catch (err) {
      console.error('Error loading swap requests:', err);
      setError('Failed to load swap proposals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSwaps();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    if (newStatus === 'Completed' && !window.confirm('Are you sure you have successfully completed this swap? This will permanently mark both items as Swapped.')) {
      return;
    }

    try {
      await updateSwapRequestStatus(id, { status: newStatus });
      loadSwaps();
    } catch (err) {
      console.error('Error updating swap status:', err);
      alert(err.response?.data?.message || 'Failed to update swap status.');
    }
  };

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;

    setDisputeSubmitting(true);
    try {
      await updateSwapRequestStatus(disputeSwapId, {
        status: 'Disputed',
        disputeReason: disputeReason
      });
      setDisputeSwapId(null);
      setDisputeReason('');
      loadSwaps();
    } catch (err) {
      console.error('Error filing dispute:', err);
      alert('Failed to file dispute.');
    } finally {
      setDisputeSubmitting(false);
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="badge-status badge-pending">Pending Response</span>;
      case 'Accepted': return <span className="badge-status badge-available">Swap Accepted</span>;
      case 'Completed': return <span className="badge-status badge-swapped">Completed</span>;
      case 'Rejected': return <span className="badge-status badge-pending" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)', backgroundColor: 'transparent' }}>Declined</span>;
      case 'Disputed': return <span className="badge-status badge-pending" style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>Disputed</span>;
      default: return null;
    }
  };

  const renderTimeline = (status) => {
    const steps = [
      { label: 'Proposed', active: true },
      { label: 'Accepted', active: status !== 'Pending' && status !== 'Rejected' },
      { label: 'Completed', active: status === 'Completed' }
    ];
    if (status === 'Disputed') {
      steps[2] = { label: 'Disputed', active: true, error: true };
    } else if (status === 'Rejected') {
      steps[1] = { label: 'Cancelled/Declined', active: true, error: true };
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px auto 24px auto', position: 'relative', width: '100%', maxWidth: '500px' }}>
        {/* Background Line */}
        <div style={{ position: 'absolute', top: '6px', left: '10%', right: '10%', height: '2px', backgroundColor: 'rgba(255, 255, 255, 0.05)', zIndex: 1 }}></div>
        
        {/* Active Line */}
        <div style={{
          position: 'absolute',
          top: '6px',
          left: '10%',
          width: status === 'Pending' ? '0%' : status === 'Accepted' || status === 'Disputed' ? '40%' : '80%',
          height: '2px',
          backgroundColor: status === 'Disputed' ? 'var(--danger)' : status === 'Rejected' ? 'var(--text-muted)' : 'var(--primary)',
          zIndex: 2,
          transition: 'var(--transition-smooth)'
        }}></div>

        {steps.map((step, idx) => {
          let dotColor = 'var(--bg-card)';
          let borderColor = 'rgba(255, 255, 255, 0.1)';
          let textColor = 'var(--text-muted)';
          
          if (step.active) {
            if (step.error) {
              dotColor = 'var(--danger)';
              borderColor = 'var(--danger)';
              textColor = 'var(--danger)';
            } else {
              dotColor = 'var(--primary)';
              borderColor = 'var(--primary)';
              textColor = 'white';
            }
          }

          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, width: '100px', textAlign: 'center' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: dotColor,
                border: `2px solid ${borderColor}`,
                boxShadow: step.active && !step.error ? '0 0 12px var(--primary-glow)' : 'none',
                transition: 'var(--transition-smooth)',
                marginBottom: '8px'
              }}></div>
              <span style={{ fontSize: '0.7rem', color: textColor, fontWeight: '600' }}>{step.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const activeSwaps = activeTab === 'incoming' ? incoming : outgoing;
  const backendUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  return (
    <div className="fadeIn container-custom" style={{ marginTop: '20px', paddingBottom: '60px' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)' }}>My Swap Proposals</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Review and manage clothing exchange proposals and chat negotiations.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '30px' }}>
        <button
          onClick={() => setActiveTab('incoming')}
          style={{
            ...tabButtonStyle,
            borderBottom: activeTab === 'incoming' ? '2px solid var(--primary)' : 'none',
            color: activeTab === 'incoming' ? 'white' : 'var(--text-secondary)'
          }}
        >
          Incoming Proposals ({incoming.length})
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          style={{
            ...tabButtonStyle,
            borderBottom: activeTab === 'outgoing' ? '2px solid var(--primary)' : 'none',
            color: activeTab === 'outgoing' ? 'white' : 'var(--text-secondary)'
          }}
        >
          Outgoing Requests ({outgoing.length})
        </button>
      </div>

      {/* List content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          Loading swap proposal records...
        </div>
      ) : activeSwaps.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          No {activeTab} swap requests found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {activeSwaps.map((swap) => {
            const partnerName = activeTab === 'incoming' ? swap.fromUser?.name : swap.toUser?.name;
            const partnerLocation = activeTab === 'incoming' ? swap.fromUser?.location?.city : swap.toUser?.location?.city;

            const offeredImg = swap.offeredItem.images && swap.offeredItem.images.length > 0
              ? `${backendUrl}${swap.offeredItem.images[0]}`
              : 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300';
            
            const requestedImg = swap.requestedItem.images && swap.requestedItem.images.length > 0
              ? `${backendUrl}${swap.requestedItem.images[0]}`
              : 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300';

            return (
              <div key={swap._id} className="glass-card" style={{ padding: '24px' }}>
                
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {activeTab === 'incoming' ? 'Swap proposed by' : 'Proposed to'}:
                    </div>
                    <div style={{ fontWeight: '600', color: 'white', fontSize: '1.05rem' }}>
                      {partnerName} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '400' }}>({partnerLocation})</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      {swap.unreadCount > 0 && (
                        <span className="badge-status" style={{ backgroundColor: 'var(--danger)', color: 'white', border: 'none', fontSize: '0.7rem', padding: '3px 8px' }}>
                          {swap.unreadCount} unread
                        </span>
                      )}
                      {renderStatusBadge(swap.status)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Propose date: {new Date(swap.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Timeline Progress */}
                {renderTimeline(swap.status)}

                {/* Body: Side by side items */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center', marginBottom: '24px' }} className="swap-request-grid">
                  
                  {/* Offered Item */}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <img src={offeredImg} alt={swap.offeredItem.title} style={thumbnailStyle} />
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600', textTransform: 'uppercase' }}>Offered item</span>
                      <h4 style={{ fontSize: '0.95rem', margin: '4px 0', color: 'white' }}>{swap.offeredItem.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Brand: {swap.offeredItem.brand} • Size: {swap.offeredItem.size}<br />
                        Val: <strong>{swap.offeredItem.estimatedSwapValue} pts</strong>
                      </p>
                    </div>
                  </div>

                  <ArrowRightLeft size={24} color="var(--text-muted)" />

                  {/* Requested Item */}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <img src={requestedImg} alt={swap.requestedItem.title} style={thumbnailStyle} />
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Requested item</span>
                      <h4 style={{ fontSize: '0.95rem', margin: '4px 0', color: 'white' }}>{swap.requestedItem.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Brand: {swap.requestedItem.brand} • Size: {swap.requestedItem.size}<br />
                        Val: <strong>{swap.requestedItem.estimatedSwapValue} pts</strong>
                      </p>
                    </div>
                  </div>

                </div>

                {/* Dispute Reason Display */}
                {swap.status === 'Disputed' && swap.disputeReason && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '6px', marginBottom: '20px', color: 'var(--danger)', fontSize: '0.85rem' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Dispute filed:</strong> {swap.disputeReason}
                    </div>
                  </div>
                )}

                {/* Actions row */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                  {swap.status === 'Pending' && activeTab === 'incoming' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(swap._id, 'Rejected')}
                        className="btn-secondary-custom"
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        <X size={16} /> Decline
                      </button>
                      <button
                        onClick={() => handleStatusChange(swap._id, 'Accepted')}
                        className="btn-premium"
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        <Check size={16} /> Accept proposal
                      </button>
                    </>
                  )}

                  {swap.status === 'Pending' && activeTab === 'outgoing' && (
                    <button
                      onClick={() => handleStatusChange(swap._id, 'Rejected')}
                      className="btn-outline-danger"
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      Cancel Request
                    </button>
                  )}

                  {(swap.status === 'Accepted' || swap.status === 'Disputed' || swap.status === 'Completed') && (
                    <>
                      {/* Negotiation Chat */}
                      <button
                        onClick={() => navigate(`/chat/${swap._id}`)}
                        className="btn-secondary-custom"
                        style={{ padding: '8px 16px', fontSize: '0.85rem', color: '#FFF' }}
                      >
                        <MessageSquare size={16} color="var(--primary)" /> Open Negotiation Chat
                      </button>
                      
                      {swap.status === 'Accepted' && (
                        <>
                          {/* Complete Trade */}
                          {(((swap.fromUser._id || swap.fromUser) === (user?.id || user?._id)) && swap.confirmedByFrom) ||
                          (((swap.toUser._id || swap.toUser) === (user?.id || user?._id)) && swap.confirmedByTo) ? (
                            <button
                              disabled
                              className="btn-secondary-custom"
                              style={{ padding: '8px 16px', fontSize: '0.85rem', opacity: 0.7, cursor: 'not-allowed' }}
                            >
                              <Award size={16} /> Waiting for other party
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(swap._id, 'Completed')}
                              className="btn-premium"
                              style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'linear-gradient(135deg, var(--success), #059669)' }}
                            >
                              <Award size={16} /> {
                                (swap.confirmedByFrom || swap.confirmedByTo) 
                                  ? 'Confirm Completion' 
                                  : 'Mark Completed'
                              }
                            </button>
                          )}
                          
                          {/* File Dispute */}
                          <button
                            onClick={() => setDisputeSwapId(swap._id)}
                            className="btn-outline-danger"
                            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                          >
                            <ShieldAlert size={16} /> Dispute
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Dispute Dialog Modal */}
      {disputeSwapId && (
        <div style={overlayStyle}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '450px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>File a Swap Dispute</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Please describe the problem you encountered (e.g. item condition not as advertised, other user stopped replying, delivery issue). An administrator will review your dispute.
            </p>
            <form onSubmit={handleDisputeSubmit}>
              <div className="form-group">
                <label className="form-label">Reason for dispute *</label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="form-control-custom"
                  placeholder="Provide detailed comments..."
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setDisputeSwapId(null)} className="btn-secondary-custom">
                  Cancel
                </button>
                <button type="submit" disabled={disputeSubmitting} className="btn-premium">
                  {disputeSubmitting ? 'Filing...' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

const tabButtonStyle = {
  background: 'none',
  border: 'none',
  padding: '12px 24px',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '600',
  transition: 'var(--transition-smooth)'
};

const thumbnailStyle = {
  width: '64px',
  height: '64px',
  borderRadius: '8px',
  objectFit: 'cover',
  backgroundColor: '#1E293B',
  border: '1px solid var(--border-color)'
};

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
