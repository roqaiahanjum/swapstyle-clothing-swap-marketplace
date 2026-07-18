import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px', minHeight: '360px', animation: 'skeletonPulse 1.5s infinite ease-in-out' }}>
      {/* Shimmering Image Placeholders */}
      <div style={{ width: '100%', height: '200px', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)' }}></div>

      {/* Shimmering Text Placeholders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: '40%', height: '12px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)' }}></div>
          <div style={{ width: '25%', height: '12px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)' }}></div>
        </div>

        <div style={{ width: '80%', height: '18px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', marginTop: '8px' }}></div>
        <div style={{ width: '95%', height: '12px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', marginTop: '4px' }}></div>
        <div style={{ width: '60%', height: '12px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', marginTop: '4px' }}></div>
      </div>

      {/* Shimmering Button Placeholder */}
      <div style={{ width: '100%', height: '36px', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)', marginTop: 'auto' }}></div>
    </div>
  );
}
