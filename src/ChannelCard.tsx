import React, { useState } from 'react';
import type { Channel } from './mockData';
import { Play, Radio, Tv } from 'lucide-react';

interface ChannelCardProps {
  channel: Channel;
  isActive: boolean;
  onSelect: (channel: Channel) => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({ channel, isActive, onSelect }) => {
  const [imgError, setImgError] = useState(false);

  // Extract channel number or code if present in description or id
  const categoryLabel = channel.category ? channel.category.replace('_', ' ') : 'LIVE';

  return (
    <div 
      className={`channel-card ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(channel)}
      tabIndex={0}
      role="button"
      aria-label={`Tonton ${channel.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(channel);
        }
      }}
    >
      {/* 16:9 Visual Thumbnail & Logo Container */}
      <div className="channel-card-banner">
        {/* Top Badges */}
        <div className="channel-badges-row">
          <span className="channel-badge-live">
            <span className="channel-live-dot" /> LIVE
          </span>
          <span className="channel-badge-cat">{categoryLabel}</span>
        </div>

        {/* Channel Logo or Styled Fallback */}
        <div className="channel-logo-container">
          {!imgError && channel.thumbnail ? (
            <img 
              src={channel.thumbnail} 
              alt={channel.name} 
              className="channel-logo-img"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="channel-logo-fallback">
              <Tv size={28} className="fallback-icon" />
              <span className="fallback-name">{channel.name}</span>
            </div>
          )}
        </div>

        {/* Hover Action Overlay */}
        <div className="channel-hover-overlay">
          <div className="channel-play-btn" title="Tonton Sekarang">
            <Play size={20} fill="#ffffff" color="#ffffff" style={{ marginLeft: '2px' }} />
          </div>
          <span className="channel-hover-hint">Tonton Sekarang</span>
        </div>

        {/* Simulated Live Broadcast Progress Bar */}
        <div className="channel-live-progress">
          <div className="channel-live-bar" style={{ width: '65%' }} />
        </div>
      </div>

      {/* Card Info Box */}
      <div className="channel-card-content">
        <div className="channel-card-header">
          <h4 className="channel-card-name" title={channel.name}>
            {channel.name}
          </h4>
          {isActive && (
            <span className="channel-playing-indicator" title="Sedang Dimainkan">
              <Radio size={14} className="playing-pulse-icon" />
            </span>
          )}
        </div>

        <p className="channel-card-desc" title={channel.description}>
          {channel.description || 'Siaran Langsung HD'}
        </p>

        <div className="channel-card-footer">
          <span className="channel-card-status">🔴 Sedang Bersiaran</span>
          <span className="channel-quality-badge">HD</span>
        </div>
      </div>
    </div>
  );
};
