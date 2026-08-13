import React from 'react';
import type { Channel } from './mockData';

interface ChannelCardProps {
  channel: Channel;
  isActive: boolean;
  onSelect: (channel: Channel) => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({ channel, isActive, onSelect }) => {
  return (
    <div 
      className={`channel-card ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(channel)}
    >
      <span className="channel-card-badge">LIVE</span>
      
      <div className="channel-card-logo-box">
        <img 
          src={channel.thumbnail} 
          alt={channel.name} 
          className="channel-card-logo"
          onError={(e) => {
            // Fallback placeholder if image breaks
            (e.target as HTMLImageElement).src = 'https://ptv2026.com/logo/tv1.png';
          }}
        />
      </div>

      <div className="channel-card-title">{channel.name}</div>
      <div className="channel-card-epg">8:00 PM - 9:00 PM</div>
    </div>
  );
};
