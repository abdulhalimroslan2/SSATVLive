import React from 'react';
import { Play, Info } from 'lucide-react';

interface HeroBannerProps {
  onWatchLive: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onWatchLive }) => {
  return (
    <div className="hero-banner">
      <img 
        src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1600" 
        alt="Live Sports" 
        className="hero-img"
      />
      <div className="hero-overlay">
        <div className="badge-live">
          <span className="badge-live-dot"></span>
          LIVE
        </div>

        <h1 className="hero-title">
          LIVE SPORTS<br />
          <span style={{ fontWeight: 400, fontSize: '2.2rem', color: '#e2e8f0' }}>
            Any Game. Any Time.
          </span>
        </h1>

        <p className="hero-desc">
          Watch your favorite sports events live in high quality, anytime, anywhere.
        </p>

        <div className="hero-actions">
          <button className="btn-red" onClick={onWatchLive}>
            <Play size={18} fill="#ffffff" />
            Watch Live
          </button>
          <button className="btn-dark">
            <Info size={18} />
            More Info
          </button>
        </div>
      </div>
    </div>
  );
};
