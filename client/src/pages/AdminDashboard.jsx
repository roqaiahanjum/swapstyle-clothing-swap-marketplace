import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchAdminAnalytics,
  fetchAdminUsers,
  fetchAdminListings,
  fetchAdminSwaps,
  deleteUserByAdmin,
  toggleUserActiveByAdmin,
  resolveDisputeByAdmin,
  deleteListing
} from '../api';
import {
  Users,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Check,
  Trash2,
  X,
  RefreshCw,
  ArrowRightLeft,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'users', 'listings', 'swaps', 'disputes'
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [listingsList, setListingsList] = useState([]);
  const [swapsList, setSwapsList] = useState([]);
  const [disputesList, setDisputesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Resolution Modal state
  const [resolutionSwapId, setResolutionSwapId] = useState(null);
  const [resolutionAction, setResolutionAction] = useState(''); // 'Complete' or 'Cancel'
  const [resolutionNote, setResolutionNote] = useState('');

  // Mark Disputed Modal state
  const [markDisputeSwapId, setMarkDisputeSwapId] = useState(null);
  const [disputeNote, setDisputeNote] = useState('');

  const loadAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [analyticsRes, usersRes, listingsRes, swapsRes] = await Promise.all([
        fetchAdminAnalytics(),
        fetchAdminUsers(),
        fetchAdminListings(),
        fetchAdminSwaps()
      ]);

      setStats(analyticsRes.data);
      setUsersList(usersRes.data);
      setListingsList(listingsRes.data);
      setSwapsList(swapsRes.data);
      
      // Disputes are swaps where status is 'Disputed'
      const disputes = swapsRes.data.filter(s => s.status === 'Disputed');
      setDisputesList(disputes);
    } catch (err) {
      console.error('Error loading admin console data:', err);
      setError('Could not load administrative details. Make sure you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (user.role !== 'admin') {
        navigate('/dashboard');
      } else {
        loadAllData();
      }
    }
  }, [user]);

  const handleDeleteUser = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete user "${name}"? This will permanently delete their account and ALL their listings.`)) {
      setActionLoading(true);
      try {
        await deleteUserByAdmin(id);
        alert('User and their listings deleted successfully.');
        loadAllData();
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Failed to delete user.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleToggleActive = async (id, name, active) => {
    const action = active ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} user "${name}"?`)) {
      setActionLoading(true);
      try {
        await toggleUserActiveByAdmin(id);
        alert(`User successfully ${active ? 'deactivated' : 'activated'}.`);
        loadAllData();
      } catch (err) {
        console.error('Error toggling active status:', err);
        alert('Failed to change user active status.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleDeleteItem = async (id, title) => {
    if (window.confirm(`Are you sure you want to remove listing "${title}"?`)) {
      setActionLoading(true);
      try {
        await deleteListing(id);
        alert('Listing removed successfully.');
        loadAllData();
      } catch (err) {
        console.error('Error deleting listing:', err);
        alert('Failed to delete listing.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Triggers resolved state change (Force Complete or Force Cancel)
  const handleResolveDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionSwapId || !resolutionAction) return;

    setActionLoading(true);
    try {
      await resolveDisputeByAdmin(resolutionSwapId, {
        action: resolutionAction,
        adminResolutionNote: resolutionNote
      });
      alert(`Dispute resolved. Action: ${resolutionAction === 'Complete' ? 'Force Completed' : 'Force Cancelled'}`);
      setResolutionSwapId(null);
      setResolutionNote('');
      setResolutionAction('');
      loadAllData();
    } catch (err) {
      console.error('Error resolving dispute:', err);
      alert(err.response?.data?.message || 'Failed to resolve dispute.');
    } finally {
      setActionLoading(false);
    }
  };

  // Triggers marking a swap as disputed
  const handleMarkDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!markDisputeSwapId) return;

    setActionLoading(true);
    try {
      await resolveDisputeByAdmin(markDisputeSwapId, {
        action: 'MarkDisputed',
        adminResolutionNote: disputeNote
      });
      alert('Swap request marked as Disputed.');
      setMarkDisputeSwapId(null);
      setDisputeNote('');
      loadAllData();
    } catch (err) {
      console.error('Error marking disputed:', err);
      alert('Failed to mark disputed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container-custom" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Unauthorized Access</h2>
        <p style={{ color: 'var(--text-secondary)' }}>You do not have administrative privileges.</p>
      </div>
    );
  }

  const backendUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '') || 'https://swapstyle-clothing-swap-marketplace.onrender.com';

  return (
    <div className="fadeIn container-custom" style={{ marginTop: '20px', paddingBottom: '60px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck color="var(--warning)" size={32} /> Admin Console
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>System analytics, user accounts management, listing audits, and trade dispute resolutions.</p>
        </div>
        <button onClick={loadAllData} className="btn-secondary-custom" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} disabled={loading}>
          <RefreshCw size={16} /> Refresh logs
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '16px', borderRadius: 'var(--border-radius-sm)', color: 'var(--danger)', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Admin Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '30px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('analytics')} style={{ ...tabStyle, borderBottom: activeTab === 'analytics' ? '2px solid var(--primary)' : 'none', color: activeTab === 'analytics' ? 'white' : 'var(--text-secondary)' }}>
          System Analytics
        </button>
        <button onClick={() => setActiveTab('users')} style={{ ...tabStyle, borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : 'none', color: activeTab === 'users' ? 'white' : 'var(--text-secondary)' }}>
          Users Directory ({usersList.length})
        </button>
        <button onClick={() => setActiveTab('listings')} style={{ ...tabStyle, borderBottom: activeTab === 'listings' ? '2px solid var(--primary)' : 'none', color: activeTab === 'listings' ? 'white' : 'var(--text-secondary)' }}>
          Listings Audit ({listingsList.length})
        </button>
        <button onClick={() => setActiveTab('swaps')} style={{ ...tabStyle, borderBottom: activeTab === 'swaps' ? '2px solid var(--primary)' : 'none', color: activeTab === 'swaps' ? 'white' : 'var(--text-secondary)' }}>
          All Swaps ({swapsList.length})
        </button>
        <button onClick={() => setActiveTab('disputes')} style={{ ...tabStyle, borderBottom: activeTab === 'disputes' ? '2px solid var(--primary)' : 'none', color: activeTab === 'disputes' ? 'white' : 'var(--text-secondary)' }}>
          Disputes Log ({disputesList.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          Loading administrative reports...
        </div>
      ) : (
        <>
          {/* Tab 1: Analytics */}
          {activeTab === 'analytics' && stats && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', margin: 0 }}>
                <div className="glass-card" style={statCardStyle}>
                  <Users size={28} color="var(--primary)" />
                  <h4>{stats.totalUsers}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Registered Users</p>
                </div>
                <div className="glass-card" style={statCardStyle}>
                  <FileText size={28} color="var(--secondary)" />
                  <h4>{stats.totalListings}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Closet Listings</p>
                </div>
                <div className="glass-card" style={statCardStyle}>
                  <Check size={28} color="var(--success)" />
                  <h4>{stats.completedSwaps}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Completed Swap Trades</p>
                </div>
                <div className="glass-card" style={statCardStyle}>
                  <AlertTriangle size={28} color="var(--danger)" />
                  <h4>{stats.disputedSwaps}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Active Unresolved Disputes</p>
                </div>
                <div className="glass-card" style={statCardStyle}>
                  <Users size={28} color="#FF007F" />
                  <h4>{stats.activeUsers7Days || 0}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Active Users (Last 7 Days)</p>
                </div>
              </div>

              {/* Status breakdown bar chart */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', fontFamily: 'var(--font-display)' }}>Closet Listings Distribution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    { label: 'Available on Marketplace', count: stats.availableListings || 0, color: 'var(--success)' },
                    { label: 'Locked in Active Negotiations', count: stats.pendingListings || 0, color: 'var(--warning)' },
                    { label: 'Swapped / Settled', count: Math.max(0, stats.totalListings - (stats.availableListings || 0) - (stats.pendingListings || 0)) || 0, color: 'var(--primary)' }
                  ].map((bar, idx) => {
                    const percentage = stats.totalListings > 0 ? Math.round((bar.count / stats.totalListings) * 100) : 0;
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{bar.label}</span>
                          <span style={{ color: 'white', fontWeight: '600' }}>{bar.count} units ({percentage}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '10px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: bar.color, borderRadius: '6px', transition: 'width 1s ease' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Users Directory */}
          {activeTab === 'users' && (
            <div className="glass-card" style={{ padding: '0' }}>
              <div className="table-wrapper">
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>City</th>
                      <th>Status</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u._id}>
                        <td style={{ color: 'white', fontWeight: '600' }}>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.phone || 'N/A'}</td>
                        <td>{u.location?.city || 'N/A'}</td>
                        <td>
                          <span style={{
                            color: u.active ? 'var(--success)' : 'var(--danger)',
                            fontWeight: '600',
                            fontSize: '0.8rem'
                          }}>
                            {u.active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: u.role === 'admin' ? 'var(--warning)' : 'var(--text-secondary)', fontWeight: u.role === 'admin' ? '700' : '400' }}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {u.role !== 'admin' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => handleToggleActive(u._id, u.name, u.active)}
                                disabled={actionLoading}
                                className="btn-secondary-custom"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: u.active ? 'var(--warning)' : 'var(--success)', color: u.active ? 'var(--warning)' : 'var(--success)' }}
                              >
                                {u.active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u._id, u.name)}
                                disabled={actionLoading}
                                className="btn-outline-danger"
                                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Listings Audit */}
          {activeTab === 'listings' && (
            <div className="glass-card" style={{ padding: '0' }}>
              <div className="table-wrapper">
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th>Listing Item</th>
                      <th>Brand & Size</th>
                      <th>Condition</th>
                      <th>Value</th>
                      <th>Status</th>
                      <th>Owner</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listingsList.map(item => (
                      <tr key={item._id}>
                        <td style={{ color: 'white', fontWeight: '600' }}>{item.title}</td>
                        <td>{item.brand} ({item.size})</td>
                        <td>{item.condition}</td>
                        <td>{item.estimatedSwapValue} pts</td>
                        <td>
                          <span className={`badge-status ${item.status === 'Available' ? 'badge-available' : item.status === 'Pending' ? 'badge-pending' : 'badge-swapped'}`} style={{ fontSize: '0.65rem', padding: '3px 8px' }}>
                            {item.status}
                          </span>
                        </td>
                        <td>{item.owner?.name || 'Deleted User'}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteItem(item._id, item.title)}
                            disabled={actionLoading}
                            className="btn-outline-danger"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: All Swaps */}
          {activeTab === 'swaps' && (
            <div className="glass-card" style={{ padding: '0' }}>
              <div className="table-wrapper">
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th>Offer (Proposer)</th>
                      <th>Request (Recipient)</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {swapsList.map(swap => (
                      <tr key={swap._id}>
                        <td>
                          <div style={{ color: 'white', fontWeight: '600' }}>{swap.offeredItem?.title || 'Deleted item'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>By: {swap.fromUser?.name}</div>
                        </td>
                        <td>
                          <div style={{ color: 'white', fontWeight: '600' }}>{swap.requestedItem?.title || 'Deleted item'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>By: {swap.toUser?.name}</div>
                        </td>
                        <td>{new Date(swap.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge-status ${swap.status === 'Available' ? 'badge-available' : swap.status === 'Pending' ? 'badge-pending' : swap.status === 'Accepted' ? 'badge-available' : swap.status === 'Completed' ? 'badge-swapped' : 'badge-pending'}`} style={{ fontSize: '0.65rem', padding: '3px 8px' }}>
                            {swap.status}
                          </span>
                        </td>
                        <td>
                          {swap.status !== 'Disputed' && swap.status !== 'Completed' && swap.status !== 'Rejected' && (
                            <button
                              onClick={() => setMarkDisputeSwapId(swap._id)}
                              disabled={actionLoading}
                              className="btn-outline-danger"
                              style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--warning)', color: 'var(--warning)' }}
                            >
                              <ShieldAlert size={12} /> Intervene Dispute
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 5: Disputes Log */}
          {activeTab === 'disputes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {disputesList.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No active trade disputes found in records.
                </div>
              ) : (
                disputesList.map(dispute => (
                  <div key={dispute._id} className="glass-card" style={{ borderLeft: dispute.resolved ? '4px solid var(--success)' : '4px solid var(--danger)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Swap Request ID: {dispute._id}</span>
                        <h4 style={{ color: 'white', fontSize: '1.05rem', marginTop: '4px' }}>Dispute Log</h4>
                      </div>
                      <span className={`badge-status ${dispute.resolved ? 'badge-available' : 'badge-pending'}`} style={{ color: dispute.resolved ? 'var(--success)' : 'var(--danger)', borderColor: dispute.resolved ? 'var(--success)' : 'var(--danger)', backgroundColor: 'transparent' }}>
                        {dispute.resolved ? 'RESOLVED' : 'ACTIVE DISPUTE'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Proposer (User A)</div>
                        <strong style={{ color: '#FFF' }}>{dispute.fromUser?.name}</strong> ({dispute.fromUser?.email})
                        <div style={{ fontSize: '0.85rem', marginTop: '6px', color: 'var(--primary)' }}>
                          Offers: "{dispute.offeredItem?.title || 'Deleted Item'}" ({dispute.offeredItem?.estimatedSwapValue} pts)
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Recipient (User B)</div>
                        <strong style={{ color: '#FFF' }}>{dispute.toUser?.name}</strong> ({dispute.toUser?.email})
                        <div style={{ fontSize: '0.85rem', marginTop: '6px', color: 'var(--secondary)' }}>
                          Requests: "{dispute.requestedItem?.title || 'Deleted Item'}" ({dispute.requestedItem?.estimatedSwapValue} pts)
                        </div>
                      </div>
                    </div>

                    {/* Dispute User Reason */}
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.15)', marginBottom: '12px', fontSize: '0.9rem' }}>
                      <strong style={{ color: 'var(--danger)' }}>User Dispute Reason:</strong> {dispute.disputeReason || 'No details provided.'}
                    </div>

                    {/* Resolution Note Display */}
                    {dispute.adminResolutionNote && (
                      <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.15)', marginBottom: '20px', fontSize: '0.9rem' }}>
                        <strong style={{ color: 'var(--success)' }}>Admin Resolution:</strong> {dispute.adminResolutionNote}
                      </div>
                    )}

                    {!dispute.resolved && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button
                          onClick={() => {
                            setResolutionSwapId(dispute._id);
                            setResolutionAction('Cancel');
                          }}
                          disabled={actionLoading}
                          className="btn-secondary-custom"
                          style={{ padding: '8px 16px', fontSize: '0.8rem', color: '#FFF', borderColor: 'var(--danger)' }}
                        >
                          <X size={14} color="var(--danger)" /> Force Cancel Swap
                        </button>
                        <button
                          onClick={() => {
                            setResolutionSwapId(dispute._id);
                            setResolutionAction('Complete');
                          }}
                          disabled={actionLoading}
                          className="btn-premium"
                          style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'linear-gradient(135deg, var(--success), #059669)' }}
                        >
                          <Check size={14} /> Force Complete Swap
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Resolve Dispute Modal Dialog */}
      {resolutionSwapId && (
        <div style={overlayStyle}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '450px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Resolve Dispute</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Action: <strong style={{ color: resolutionAction === 'Complete' ? 'var(--success)' : 'var(--danger)' }}>
                {resolutionAction === 'Complete' ? 'Force Complete' : 'Force Cancel'}
              </strong>
            </p>
            <form onSubmit={handleResolveDisputeSubmit}>
              <div className="form-group">
                <label className="form-label">Resolution Note *</label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="form-control-custom"
                  placeholder="Enter administrative resolution rationale..."
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => { setResolutionSwapId(null); setResolutionNote(''); }} className="btn-secondary-custom">
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading} className="btn-premium">
                  Submit Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Intervene Mark Disputed Modal Dialog */}
      {markDisputeSwapId && (
        <div style={overlayStyle}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '450px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Mark Swap as Disputed</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Flag this active swap request as disputed to halt standard progression and perform administrative investigation.
            </p>
            <form onSubmit={handleMarkDisputeSubmit}>
              <div className="form-group">
                <label className="form-label">Dispute Reason/Note *</label>
                <textarea
                  value={disputeNote}
                  onChange={(e) => setDisputeNote(e.target.value)}
                  className="form-control-custom"
                  placeholder="Why are you marking this swap as disputed?..."
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => { setMarkDisputeSwapId(null); setDisputeNote(''); }} className="btn-secondary-custom">
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading} className="btn-premium">
                  Flag Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

const tabStyle = {
  background: 'none',
  border: 'none',
  padding: '12px 20px',
  cursor: 'pointer',
  fontSize: '0.95rem',
  fontWeight: '600',
  transition: 'var(--transition-smooth)'
};

const statCardStyle = {
  padding: '24px 16px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px'
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
