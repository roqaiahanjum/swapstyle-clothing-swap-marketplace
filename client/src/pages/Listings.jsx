import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchListings } from '../api';
import ListingCard from '../components/ListingCard';
import SkeletonCard from '../components/SkeletonCard';
import { Search, SlidersHorizontal, MapPin, ArrowUpDown, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export default function Listings() {
  const { user } = useAuth();

  // Search & Filter state
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    brand: '',
    size: '',
    condition: '',
    city: '',
    minPoints: '',
    maxPoints: '',
    sortBy: '',
    maxDistance: '',
    limit: 6 // 6 items per page for better pagination demonstration
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Trigger search execution
  const loadListings = async () => {
    setLoading(true);
    try {
      const params = { 
        ...filters,
        page
      };

      // If user is logged in, send coordinates to calculate distance on backend
      if (user && user.location?.coordinates) {
        params.lat = user.location.coordinates.lat;
        params.lng = user.location.coordinates.lng;
        // Don't show user's own items when browsing catalog
        params.excludeUser = user.id || user._id;
      }

      const res = await fetchListings(params);
      setListings(res.data);
      
      // Parse header pagination metrics
      const countHeader = parseInt(res.headers['x-total-count']) || 0;
      const pagesHeader = parseInt(res.headers['x-total-pages']) || 1;
      setTotalCount(countHeader);
      setTotalPages(pagesHeader);
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset page to 1 when filters change, except limit
  useEffect(() => {
    setPage(1);
  }, [
    filters.search,
    filters.category,
    filters.brand,
    filters.size,
    filters.condition,
    filters.city,
    filters.minPoints,
    filters.maxPoints,
    filters.sortBy,
    filters.maxDistance,
    filters.limit
  ]);

  // Load listings whenever filters or page state changes
  useEffect(() => {
    loadListings();
  }, [page, filters.category, filters.condition, filters.maxDistance, filters.sortBy, filters.limit]);

  const handleInputChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadListings();
  };

  const handleReset = () => {
    setFilters({
      search: '',
      category: '',
      brand: '',
      size: '',
      condition: '',
      city: '',
      minPoints: '',
      maxPoints: '',
      sortBy: '',
      maxDistance: '',
      limit: 6
    });
    setPage(1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className="fadeIn container-custom" style={{ marginTop: '20px', paddingBottom: '60px' }}>
      
      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)' }}>Clothing Exchange Marketplace</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Find local clothing items and offer an exchange from your own closet.</p>
      </div>

      {/* Advanced Filter and Search Bar */}
      <div className="glass-card" style={{ marginBottom: '32px', padding: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Row 1: Search text & search button */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '14px' }} />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleInputChange}
                placeholder="Search listings by title or description..."
                className="form-control-custom"
                style={{ paddingLeft: '48px' }}
              />
            </div>
            <button type="submit" className="btn-premium" style={{ padding: '0 28px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Search
            </button>
          </div>

          {/* Row 2: Basic Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            
            {/* Category */}
            <div>
              <label className="form-label">Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleInputChange}
                className="form-control-custom"
                style={{ backgroundColor: 'var(--bg-main)' }}
              >
                <option value="">All Categories</option>
                <option value="Outerwear">Outerwear</option>
                <option value="Tops">Tops</option>
                <option value="Bottoms">Bottoms</option>
                <option value="Shoes">Shoes</option>
                <option value="Accessories">Accessories</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="form-label">Brand</label>
              <input
                type="text"
                name="brand"
                value={filters.brand}
                onChange={handleInputChange}
                placeholder="e.g. Nike, Zara, Gucci"
                className="form-control-custom"
              />
            </div>

            {/* Size */}
            <div>
              <label className="form-label">Size</label>
              <input
                type="text"
                name="size"
                value={filters.size}
                onChange={handleInputChange}
                placeholder="e.g. M, L, 32, 10"
                className="form-control-custom"
              />
            </div>

            {/* Condition */}
            <div>
              <label className="form-label">Condition</label>
              <select
                name="condition"
                value={filters.condition}
                onChange={handleInputChange}
                className="form-control-custom"
                style={{ backgroundColor: 'var(--bg-main)' }}
              >
                <option value="">All Conditions</option>
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>

          </div>

          {/* Row 3: Location, Points Range, and Sorting */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
            
            {/* City */}
            <div>
              <label className="form-label">City</label>
              <input
                type="text"
                name="city"
                value={filters.city}
                onChange={handleInputChange}
                placeholder="e.g. Brooklyn"
                className="form-control-custom"
              />
            </div>

            {/* Points Value Range */}
            <div>
              <label className="form-label">Points Value Range</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  name="minPoints"
                  value={filters.minPoints}
                  onChange={handleInputChange}
                  placeholder="Min"
                  className="form-control-custom"
                  style={{ flex: 1 }}
                  min="0"
                />
                <span style={{ color: 'var(--text-muted)' }}>-</span>
                <input
                  type="number"
                  name="maxPoints"
                  value={filters.maxPoints}
                  onChange={handleInputChange}
                  placeholder="Max"
                  className="form-control-custom"
                  style={{ flex: 1 }}
                  min="0"
                />
              </div>
            </div>

            {/* Sort Order */}
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowUpDown size={14} color="var(--primary)" /> Sort By
              </label>
              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleInputChange}
                className="form-control-custom"
                style={{ backgroundColor: 'var(--bg-main)' }}
              >
                <option value="">Default (Newest First)</option>
                <option value="value_asc">Value: Low to High</option>
                <option value="value_desc">Value: High to Low</option>
                <option value="date_desc">Listed Date: Newest</option>
                {user?.location?.coordinates && (
                  <option value="distance_asc">Distance: Nearest First</option>
                )}
              </select>
            </div>

            {/* Proximity Matching */}
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} color="var(--secondary)" /> Proximity Match
              </label>
              <select
                name="maxDistance"
                value={filters.maxDistance}
                onChange={handleInputChange}
                disabled={!user}
                className="form-control-custom"
                style={{ backgroundColor: 'var(--bg-main)' }}
              >
                <option value="">Any distance</option>
                <option value="10">Within 10 km</option>
                <option value="25">Within 25 km</option>
                <option value="50">Within 50 km</option>
                <option value="100">Within 100 km</option>
              </select>
              {!user && (
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Login to filter by distance</span>
              )}
            </div>

          </div>

          {/* Row 4: Items per page & Reset Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Items per page:</span>
              <select
                name="limit"
                value={filters.limit}
                onChange={handleInputChange}
                className="form-control-custom"
                style={{ width: '80px', padding: '6px', fontSize: '0.85rem', backgroundColor: 'var(--bg-main)' }}
              >
                <option value="6">6</option>
                <option value="12">12</option>
                <option value="24">24</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleReset}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px' }}
            >
              <SlidersHorizontal size={14} /> Reset Filters
            </button>
          </div>

        </form>
      </div>

      {/* Catalog Total Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Found <strong style={{ color: 'white' }}>{totalCount}</strong> listings
        </p>
      </div>

      {/* Listings Catalog */}
      {loading ? (
        <div className="grid-listings" style={{ marginBottom: '40px' }}>
          {[...Array(filters.limit)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Inbox size={48} color="var(--text-muted)" />
          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '6px' }}>No Listings Found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No clothes match your current search criteria. Try modifying your filter limits.</p>
          </div>
          <button onClick={handleReset} className="btn-secondary-custom" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid-listings" style={{ marginBottom: '40px' }}>
            {listings.map(item => (
              <ListingCard key={item._id || item.id} item={item} />
            ))}
          </div>

          {/* Pagination Selector */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '30px' }}>
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className="btn-secondary-custom"
                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '4px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Page <strong style={{ color: 'white' }}>{page}</strong> of {totalPages}
              </span>
              
              <button
                onClick={handleNextPage}
                disabled={page === totalPages}
                className="btn-secondary-custom"
                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '4px', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
}
