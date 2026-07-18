import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchListings, fetchMySwaps, fetchMyListings } from '../api';
import ListingCard from '../components/ListingCard';
import SkeletonCard from '../components/SkeletonCard';
import { MapPin, Plus, ArrowRightLeft, Briefcase, Award, FolderHeart, Send, Inbox, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    activeListings: 0,
    incomingPending: 0,
    completedSwaps: 0
  });

  const [activeTab, setActiveTab] = useState('suggestions'); // 'suggestions', 'myListings', 'incoming', 'outgoing', 'completed'

  const [myListings, setMyListings] = useState([]);
  const [incomingSwaps, setIncomingSwaps] = useState([]);
  const [outgoingSwaps, setOutgoingSwaps] = useState([]);
  const [completedSwaps, setCompletedSwaps] = useState([]);
  const [suggestedItems, setSuggestedItems] = useState([]);
  
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch user listings and swaps
      const [listingsRes, swapsRes] = await Promise.all([
        fetchMyListings(),
        fetchMySwaps()
      ]);

      const myItems = listingsRes.data;
      setMyListings(myItems);

      const incoming = swapsRes.data.incoming || [];
      const outgoing = swapsRes.data.outgoing || [];
      
      setIncomingSwaps(incoming.filter(s => s.status !== 'Completed' && s.status !== 'Rejected'));
      setOutgoingSwaps(outgoing.filter(s => s.status !== 'Completed' && s.status !== 'Rejected'));
      
      const completed = [
        ...incoming.filter(s => s.status === 'Completed'),
        ...outgoing.filter(s => s.status === 'Completed')
      ];
      setCompletedSwaps(completed);

      const activeListingsCount = myItems.filter(i => i.status === 'Available').length;
      const incomingPendingCount = incoming.filter(s => s.status === 'Pending').length;
      const completedCount = completed.length;

      setStats({
        activeListings: activeListingsCount,
        incomingPending: incomingPendingCount,
        completedSwaps: completedCount
      });

      // 2. Fetch proximity matches
      const userLat = user.location?.coordinates?.lat || 0;
      const userLng = user.location?.coordinates?.lng || 0;

      const proximityRes = await fetchListings({
        lat: userLat,
        lng: userLng,
        excludeUser: user.id || user._id
      });
      
      // Show top 4 nearest suggested items
      setSuggestedItems(proximityRes.data.slice(0, 4));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  if (!user) {
    return (
      <div className="container-custom" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '16px 0' }}>Please log in to view your dashboard.</p>
        <Link to="/login" className="btn-premium">Login</Link>
      </div>
    );
  }

  const backendUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  return (
    <div className="fadeIn container-custom" style={{ marginTop: '20px', paddingBottom: '60px' }}>
      
      {/* Welcome Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
            Hello, {user.name}!
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <MapPin size={16} color="var(--primary)" />
            <span>Based in {user.location?.city}</span>
          </div>
        </div>
        
        <Link to="/listings/create" className="btn-premium" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={18} /> Add New Listing
        </Link>
      </div>

      {/* Analytics Row */}
      <div className="admin-grid" style={{ marginBottom: '40px' }}>
        
        <div onClick={() => setActiveTab('myListings')} className="glass-card" style={{ ...statCardStyle, borderBottom: activeTab === 'myListings' ? '2px solid var(--primary)' : 'none' }}>
          <Briefcase size={28} color="var(--primary)" style={{ marginBottom: '12px' }} />
          <h4 style={{ fontSize: '2.5rem', margin: '4px 0', color: 'white', fontWeight: 'bold' }}>{stats.activeListings}</h4>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>My Active Listings</span>
        </div>

        <div onClick={() => setActiveTab('incoming')} className="glass-card" style={{ ...statCardStyle, borderBottom: activeTab === 'incoming' ? '2px solid var(--warning)' : 'none' }}>
          <ArrowRightLeft size={28} color="var(--warning)" style={{ marginBottom: '12px' }} />
          <h4 style={{ fontSize: '2.5rem', margin: '4px 0', color: 'white', fontWeight: 'bold' }}>{stats.incomingPending}</h4>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Pending Swap Proposals</span>
        </div>

        <div onClick={() => setActiveTab('completed')} className="glass-card" style={{ ...statCardStyle, borderBottom: activeTab === 'completed' ? '2px solid var(--success)' : 'none' }}>
          <Award size={28} color="var(--success)" style={{ marginBottom: '12px' }} />
          <h4 style={{ fontSize: '2.5rem', margin: '4px 0', color: 'white', fontWeight: 'bold' }}>{stats.completedSwaps}</h4>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Successful Swaps Completed</span>
        </div>

      </div>

      {/* Dashboard Sub Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '30px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('suggestions')} style={{ ...tabStyle, borderBottom: activeTab === 'suggestions' ? '2px solid var(--primary)' : 'none', color: activeTab === 'suggestions' ? 'white' : 'var(--text-secondary)' }}>
          Suggested Swaps Near You
        </button>
        <button onClick={() => setActiveTab('myListings')} style={{ ...tabStyle, borderBottom: activeTab === 'myListings' ? '2px solid var(--primary)' : 'none', color: activeTab === 'myListings' ? 'white' : 'var(--text-secondary)' }}>
          My Closet Listings ({myListings.length})
        </button>
        <button onClick={() => setActiveTab('incoming')} style={{ ...tabStyle, borderBottom: activeTab === 'incoming' ? '2px solid var(--primary)' : 'none', color: activeTab === 'incoming' ? 'white' : 'var(--text-secondary)' }}>
          Incoming Proposals ({incomingSwaps.length})
        </button>
        <button onClick={() => setActiveTab('outgoing')} style={{ ...tabStyle, borderBottom: activeTab === 'outgoing' ? '2px solid var(--primary)' : 'none', color: activeTab === 'outgoing' ? 'white' : 'var(--text-secondary)' }}>
          Outgoing Proposals ({outgoingSwaps.length})
        </button>
        <button onClick={() => setActiveTab('completed')} style={{ ...tabStyle, borderBottom: activeTab === 'completed' ? '2px solid var(--primary)' : 'none', color: activeTab === 'completed' ? 'white' : 'var(--text-secondary)' }}>
          Completed History ({completedSwaps.length})
        </button>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid-listings">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <>
          {/* Tab 1: Suggested Items Near You */}
          {activeTab === 'suggestions' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Proximity Recommendations</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Wardrobe listings sorted geographically starting with closest closets.</p>
              </div>
              {suggestedItems.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-secondary)' }}>
                  No nearby listings found. Broaden your location settings or try searching the marketplace!
                </div>
              ) : (
                <div className="grid-listings">
                  {suggestedItems.map(item => (
                    <ListingCard key={item._id} item={item} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: My Closet Listings */}
          {activeTab === 'myListings' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>My Closet Catalog</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Manage details, update photos, or remove listings you own.</p>
              </div>
              {myListings.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '40px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <FolderHeart size={40} color="var(--text-muted)" />
                  <div>
                    <h4 style={{ color: 'white', marginBottom: '6px' }}>Your Closet is Empty</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Upload clothes you no longer wear to start exchanging with others!</p>
                  </div>
                  <Link to="/listings/create" className="btn-premium" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>List an Item</Link>
                </div>
              ) : (
                <div className="grid-listings">
                  {myListings.map(item => (
                    <ListingCard key={item._id} item={item} onDeleteSuccess={loadDashboardData} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Incoming Proposals */}
          {activeTab === 'incoming' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Incoming Proposals</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Decide whether to accept or decline exchange offers received from other members.</p>
              </div>
              {incomingSwaps.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <Inbox size={36} color="var(--text-muted)" />
                  <span>No active incoming proposals at the moment.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {incomingSwaps.map(swap => (
                    <div key={swap._id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '20px' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Offered by: <strong>{swap.fromUser?.name || 'User'}</strong></div>
                        <h4 style={{ color: 'white', fontSize: '1.05rem', margin: '4px 0' }}>
                          "{swap.offeredItem?.title || 'Deleted Item'}" ⇆ "{swap.requestedItem?.title || 'Deleted Item'}"
                        </h4>
                        <span className="badge-status badge-pending" style={{ fontSize: '0.7rem' }}>{swap.status}</span>
                      </div>
                      <Link to="/swaps" className="btn-secondary-custom" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                        View in Swaps
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Outgoing Proposals */}
          {activeTab === 'outgoing' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Outgoing Proposals</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Track listings you offered to other users and monitor responses.</p>
              </div>
              {outgoingSwaps.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <Send size={36} color="var(--text-muted)" />
                  <span>You haven't proposed any swap offers recently.</span>
                  <Link to="/listings" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Find items to swap</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {outgoingSwaps.map(swap => (
                    <div key={swap._id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '20px' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Offered to: <strong>{swap.toUser?.name || 'User'}</strong></div>
                        <h4 style={{ color: 'white', fontSize: '1.05rem', margin: '4px 0' }}>
                          "{swap.offeredItem?.title || 'Deleted Item'}" ⇆ "{swap.requestedItem?.title || 'Deleted Item'}"
                        </h4>
                        <span className="badge-status badge-pending" style={{ fontSize: '0.7rem' }}>{swap.status}</span>
                      </div>
                      <Link to="/swaps" className="btn-secondary-custom" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                        View Details
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Completed History */}
          {activeTab === 'completed' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Completed Swaps History</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Verify all successfully finalized exchange transactions.</p>
              </div>
              {completedSwaps.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={36} color="var(--text-muted)" />
                  <span>No completed swap trades found.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {completedSwaps.map(swap => (
                    <div key={swap._id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '20px', borderLeft: '4px solid var(--success)' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Completed with: <strong>{swap.fromUser?._id === user._id || swap.fromUser?.id === user._id ? swap.toUser?.name : swap.fromUser?.name}</strong></div>
                        <h4 style={{ color: 'white', fontSize: '1.05rem', margin: '4px 0' }}>
                          "{swap.offeredItem?.title || 'Deleted Item'}" ⇆ "{swap.requestedItem?.title || 'Deleted Item'}"
                        </h4>
                        <span className="badge-status badge-available" style={{ fontSize: '0.7rem', color: 'var(--success)', borderColor: 'var(--success)' }}>Completed</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Resolved: {new Date(swap.updatedAt || swap.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

    </div>
  );
}

const tabStyle = {
  background: 'none',
  border: 'none',
  padding: '12px 20px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '600',
  transition: 'var(--transition-smooth)'
};

const statCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '24px 16px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'var(--transition-smooth)'
};
