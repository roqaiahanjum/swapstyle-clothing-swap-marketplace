import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchListings } from '../api';
import ListingCard from '../components/ListingCard';
import { Sparkles, MessageSquare, ArrowRightLeft, ShieldCheck } from 'lucide-react';

export default function Landing() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecentListings = async () => {
      try {
        const res = await fetchListings({ limit: 3 });
        // Take only first 3 items for display
        setListings(res.data.slice(0, 3));
      } catch (err) {
        console.error('Error fetching recent listings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadRecentListings();
  }, []);

  return (
    <div className="fadeIn">
      {/* Hero Section */}
      <section style={heroSectionStyle}>
        <div className="container-custom" style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)', padding: '6px 16px', borderRadius: '50px', marginBottom: '24px' }}>
            <Sparkles size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--primary)' }}>Zero Cost. Eco Friendly. Smart Fashion.</span>
          </div>
          
          <h1 style={{ fontSize: '3.5rem', lineHeight: '1.1', marginBottom: '24px', fontFamily: 'var(--font-display)', fontWeight: '800' }}>
            Swap Clothes, Share Style,<br />
            <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Spend Zero Cash.
            </span>
          </h1>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '640px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
            SwapStyle is the clothing exchange marketplace where you trade pre-loved wardrobe items directly with others. Find style fits, negotiate trades, and make eco-conscious swaps.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Link to="/listings" className="btn-premium" style={{ padding: '14px 32px', fontSize: '1rem' }}>
              Explore Marketplace
            </Link>
            <Link to="/register" className="btn-secondary-custom" style={{ padding: '14px 32px', fontSize: '1rem' }}>
              Join SwapStyle
            </Link>
          </div>
        </div>

        {/* Glow effect backgrounds */}
        <div style={glowLeftStyle} />
        <div style={glowRightStyle} />
      </section>

      {/* Feature Walkthrough */}
      <section style={{ padding: '80px 0', borderTop: '1px solid var(--border-color)' }}>
        <div className="container-custom">
          <h2 style={{ textAlign: 'center', fontSize: '2.2rem', marginBottom: '50px' }}>
            How SwapStyle Works
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px' }}>
            
            {/* Step 1 */}
            <div className="glass-card" style={{ textAlign: 'center' }}>
              <div style={iconWrapperStyle('#7C3AED')}>
                <Sparkles size={24} color="white" />
              </div>
              <h3 style={{ fontSize: '1.3rem', margin: '20px 0 12px 0' }}>1. List Your Closet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Upload photos of clean clothes you no longer wear. Our point calculator auto-suggests a fair trade value based on brand, condition, and item category.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-card" style={{ textAlign: 'center' }}>
              <div style={iconWrapperStyle('#3B82F6')}>
                <ArrowRightLeft size={24} color="white" />
              </div>
              <h3 style={{ fontSize: '1.3rem', margin: '20px 0 12px 0' }}>2. Propose Swaps</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Browse local items near you. Propose a direct swap of one of your items for one of theirs, using points as a side-by-side fairness comparison.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-card" style={{ textAlign: 'center' }}>
              <div style={iconWrapperStyle('#10B981')}>
                <MessageSquare size={24} color="white" />
              </div>
              <h3 style={{ fontSize: '1.3rem', margin: '20px 0 12px 0' }}>3. Chat & Trade</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Accept proposals, join real-time negotiation rooms, align on swap handoffs, and confirm delivery. Trade safely with admin dispute support.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Featured/Recent Listings Section */}
      <section style={{ padding: '80px 0', borderTop: '1px solid var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.01)' }}>
        <div className="container-custom">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div>
              <h2 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Active Local Swaps</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Check out what others are trading right now.</p>
            </div>
            <Link to="/listings" className="btn-secondary-custom" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
              View All Listings
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              Loading recent listings...
            </div>
          ) : listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              No active listings found. Be the first to add one!
            </div>
          ) : (
            <div className="grid-listings">
              {listings.map(item => (
                <ListingCard key={item._id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Custom styles for landing sections
const heroSectionStyle = {
  padding: '120px 0 100px 0',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center'
};

const glowLeftStyle = {
  position: 'absolute',
  top: '20%',
  left: '-10%',
  width: '400px',
  height: '400px',
  background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, rgba(0,0,0,0) 70%)',
  zIndex: 1,
  filter: 'blur(50px)'
};

const glowRightStyle = {
  position: 'absolute',
  bottom: '10%',
  right: '-10%',
  width: '500px',
  height: '500px',
  background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(0,0,0,0) 70%)',
  zIndex: 1,
  filter: 'blur(50px)'
};

const iconWrapperStyle = (bgColor) => ({
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  backgroundColor: bgColor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 20px auto',
  boxShadow: `0 10px 20px ${bgColor}40`
});
