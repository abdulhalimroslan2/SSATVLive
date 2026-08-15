import React, { useState, useEffect } from 'react';
import type { Channel } from './mockData';
import { Play, Radio, Tv, Clock } from 'lucide-react';
import { getChannelEpg, type EpgProgram } from './epgService';

interface ChannelCardProps {
  channel: Channel;
  isActive: boolean;
  onSelect: (channel: Channel) => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({ channel, isActive, onSelect }) => {
  const [imgError, setImgError] = useState(false);
  const [epg, setEpg] = useState<EpgProgram>(() =>
    getChannelEpg(channel.id, channel.name, channel.category || 'MALAYSIA')
  );

  // Sync EPG and progress bar with real-time clock every 30 seconds
  useEffect(() => {
    const updateEpg = () => {
      setEpg(getChannelEpg(channel.id, channel.name, channel.category || 'MALAYSIA'));
    };

    const interval = setInterval(updateEpg, 30000);
    return () => clearInterval(interval);
  }, [channel.id, channel.name, channel.category]);

  const categoryLabel = channel.category ? channel.category.replace('_', ' ') : 'LIVE';

  return (
    <div 
      className={`channel-card ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(channel)}
      tabIndex={0}
      role="button"
      aria-label={`Tonton ${channel.name} - ${epg.currentTitle}`}
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
          <span className="channel-hover-epg-next">
            Seterusnya: {epg.nextTitle} ({epg.endTimeStr})
          </span>
        </div>

        {/* Real Dynamic Live Broadcast Progress Bar */}
        <div className="channel-live-progress" title={`Siaran ${epg.progressPercent}% selesai`}>
          <div 
            className="channel-live-bar" 
            style={{ width: `${epg.progressPercent}%` }} 
          />
        </div>
      </div>

      {/* Card Info Box */}
      <div className="channel-card-content">
        {/* Channel Name and Active Indicator */}
        <div className="channel-card-header">
          <h4 className="channel-card-name" title={channel.name}>
            {channel.name}
          </h4>
          {isActive ? (
            <span className="channel-playing-indicator" title="Sedang Dimainkan">
              <Radio size={14} className="playing-pulse-icon" />
            </span>
          ) : (
            <span className="channel-time-badge" title="Masa Siaran">
              <Clock size={11} style={{ marginRight: '3px', display: 'inline' }} />
              {epg.startTimeStr}
            </span>
          )}
        </div>

        {/* Current Airing Program Title (EPG) */}
        <div className="channel-epg-current" title={`Sedang Bersiaran: ${epg.currentTitle}`}>
          <span className="epg-icon-tag">📺</span>
          <span className="epg-title-text">{epg.currentTitle}</span>
        </div>

        {/* Live Progress Info & Remaining Time */}
        <div className="channel-card-footer">
          <div className="channel-epg-timing">
            <span className="channel-live-indicator-text">🔴 LIVE</span>
            <span className="channel-epg-remaining">
              Baki {epg.remainingMinutes} min ({epg.progressPercent}%)
            </span>
          </div>
          <span className="channel-quality-badge">HD</span>
        </div>
      </div>
    </div>
  );
};
