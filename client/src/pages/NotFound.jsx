import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container-custom" style={{ padding: '100px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.07)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '24px', borderRadius: '50%', width: 'fit-content' }}>
        <ShieldAlert size={48} color="var(--danger)" />
      </div>
      <div>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', marginBottom: '8px', color: 'white' }}>404 - Page Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', fontSize: '0.95rem', lineHeight: '1.6' }}>
          The page you are looking for does not exist, has been removed, or is temporarily unavailable. 
        </p>
      </div>
      <div style={{ marginTop: '12px' }}>
        <Link to="/dashboard" className="btn-premium" style={{ textDecoration: 'none' }}>
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
