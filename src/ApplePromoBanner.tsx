import React from 'react';
import { Tv } from 'lucide-react';

interface ApplePromoBannerProps {
  onAction?: () => void;
}

export const ApplePromoBanner: React.FC<ApplePromoBannerProps> = ({ onAction }) => {
  return (
    <div className="apple-promo-card">
      <div className="apple-promo-left">
        <div className="apple-promo-logo">
          <Tv size={28} />
          <span>tv</span>
        </div>

        <h2 className="apple-promo-heading">
          Enjoy new releases every week.
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div>
            <button className="apple-btn-white" onClick={onAction}>
              Accept Free Trial
            </button>
          </div>
          <span style={{ fontSize: '0.82rem', color: '#8e95a5' }}>
            7 days free, then RM 29.90/month
          </span>
        </div>
      </div>

      <div 
        className="apple-promo-mosaic-bg"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200')`
        }}
      ></div>
    </div>
  );
};
