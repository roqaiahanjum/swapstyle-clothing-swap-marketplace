import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../api';
import { UserPlus, AlertCircle, MapPin } from 'lucide-react';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    lat: 0,
    lng: 0
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationStatus, setLocationStatus] = useState('');

  // Attempt to auto-fetch geolocation coordinates
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationStatus('Requesting GPS permission...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
          setLocationStatus('GPS Coordinates captured successfully!');
        },
        (err) => {
          console.warn('Geolocation capture failed:', err);
          setLocationStatus('Could not read GPS location. Defaulting to city search.');
        }
      );
    } else {
      setLocationStatus('Geolocation not supported by browser.');
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setProfilePicture(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.city) {
      setError('Please fill in all required fields (Name, Email, Password, City).');
      return;
    }

    setLoading(true);
    setError('');

    // Prepare multi-part FormData
    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('password', formData.password);
    data.append('phone', formData.phone);
    data.append('city', formData.city);
    data.append('lat', formData.lat);
    data.append('lng', formData.lng);
    if (profilePicture) {
      data.append('profilePicture', profilePicture);
    }

    try {
      const res = await registerUser(data);
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fadeIn container-custom" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)', padding: '40px 0' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '40px 30px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Join SwapStyle and trade clothes with nearby swappers</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '12px', borderRadius: 'var(--border-radius-sm)', color: 'var(--danger)', marginBottom: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Alice Cooper"
              className="form-control-custom"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="alice@example.com"
              className="form-control-custom"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              className="form-control-custom"
              required
            />
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="555-0101"
                className="form-control-custom"
              />
            </div>

            <div className="form-group">
              <label className="form-label">City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="New York, NY"
                className="form-control-custom"
                required
              />
            </div>
          </div>

          {/* Geolocation Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '4px' }}>
            <MapPin size={12} color="var(--primary)" />
            <span>{locationStatus}</span>
          </div>

          <div className="form-group">
            <label className="form-label">Profile Photo (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="form-control-custom"
              style={{ padding: '8px' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-premium"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '10px' }}
          >
            {loading ? 'Creating Account...' : (
              <>
                <UserPlus size={18} /> Sign Up
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
            Login here
          </Link>
        </div>

      </div>
    </div>
  );
}
