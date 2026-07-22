import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword } from '../api';
import { User, MapPin, Check, AlertCircle, Key } from 'lucide-react';

export default function Profile() {
  const { user, updateUserProfileState } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    lat: 0,
    lng: 0
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [gpsStatus, setGpsStatus] = useState('');

  // Password Change State
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        city: user.location?.city || '',
        lat: user.location?.coordinates?.lat || 0,
        lng: user.location?.coordinates?.lng || 0
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setProfilePicture(e.target.files[0]);
  };

  const triggerGPS = () => {
    if (navigator.geolocation) {
      setGpsStatus('Requesting GPS...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
          setGpsStatus('GPS updated successfully!');
        },
        (err) => {
          console.warn(err);
          setGpsStatus('Failed to capture GPS. Allowed location permission?');
        }
      );
    } else {
      setGpsStatus('Not supported by browser.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.city) {
      setError('Name and City fields are required.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('phone', formData.phone);
    data.append('city', formData.city);
    data.append('lat', formData.lat);
    data.append('lng', formData.lng);
    if (profilePicture) {
      data.append('profilePicture', profilePicture);
    }

    try {
      const res = await updateProfile(data);
      updateUserProfileState(res.data);
      setSuccess(true);
    } catch (err) {
      console.error('Profile update error:', err);
      setError('Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }
    if (passwords.newPassword.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }

    setPassLoading(true);
    setPassError('');
    setPassSuccess(false);

    try {
      await changePassword({
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      });
      setPassSuccess(true);
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error(err);
      setPassError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPassLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container-custom" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Please log in to edit your profile.
      </div>
    );
  }

  const backendUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '') || 'https://swapstyle-clothing-swap-marketplace.onrender.com';
  const picPreview = user.profilePicture
    ? (user.profilePicture.startsWith('http') ? user.profilePicture : `${backendUrl}${user.profilePicture}`)
    : '';

  return (
    <div className="fadeIn container-custom" style={{ maxWidth: '600px', marginTop: '20px', paddingBottom: '40px' }}>
      <div className="glass-card">
        
        {/* Title */}
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User color="var(--primary)" /> Manage Profile
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Customize your contact details and home location</p>
        </div>

        {success && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--success)', padding: '12px', borderRadius: 'var(--border-radius-sm)', color: 'var(--success)', marginBottom: '20px', fontSize: '0.85rem' }}>
            Profile details updated successfully!
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '12px', borderRadius: 'var(--border-radius-sm)', color: 'var(--danger)', marginBottom: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          {/* Avatar Preview & selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            {picPreview ? (
              <img
                src={picPreview}
                alt="Profile Preview"
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }}
              />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>
                {user.name.charAt(0)}
              </div>
            )}
            <div>
              <label className="form-label" style={{ marginBottom: '6px' }}>Change Profile Photo</label>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-control-custom"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-control-custom"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Home City *</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="form-control-custom"
              required
            />
          </div>

          {/* GPS update controls */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={16} color="var(--primary)" /> GPS Location Coordinates
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Lat: {parseFloat(formData.lat).toFixed(4)} • Lng: {parseFloat(formData.lng).toFixed(4)}
                </div>
              </div>
              <button type="button" onClick={triggerGPS} className="btn-secondary-custom" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                Capture Current GPS
              </button>
            </div>
            {gpsStatus && (
              <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '10px', fontStyle: 'italic' }}>
                {gpsStatus}
              </div>
            )}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-premium" style={{ width: '100%', padding: '12px' }}>
            {loading ? 'Saving Changes...' : 'Save Profile Settings'}
          </button>

        </form>

        {/* Change Password Form */}
        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '40px', paddingTop: '32px' }}>
          <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key color="var(--primary)" size={20} /> Update Password
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>Secure your account by updating your credentials</p>

          {passSuccess && (
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--success)', padding: '12px', borderRadius: 'var(--border-radius-sm)', color: 'var(--success)', marginBottom: '20px', fontSize: '0.85rem' }}>
              Password updated successfully!
            </div>
          )}

          {passError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '12px', borderRadius: 'var(--border-radius-sm)', color: 'var(--danger)', marginBottom: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Current Password *</label>
              <input
                type="password"
                name="oldPassword"
                value={passwords.oldPassword}
                onChange={handlePasswordChange}
                className="form-control-custom"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">New Password * (Min 6 chars)</label>
              <input
                type="password"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                className="form-control-custom"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Confirm New Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
                className="form-control-custom"
                required
              />
            </div>

            <button type="submit" disabled={passLoading} className="btn-secondary-custom" style={{ width: '100%', padding: '12px' }}>
              {passLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
