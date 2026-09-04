import React from 'react';
import { ChevronRight, Radio } from 'lucide-react';
import type { Channel } from './mockData';

export interface LiveRailItem {
  id: string;
  badge: string;
  name: string;
  program: string;
  timeSlot: string;
  thumbnail: string;
  channel?: Channel;
}

interface LiveNowSidebarProps {
  items: LiveRailItem[];
  onSelect: (item: LiveRailItem) => void;
  onViewAll?: () => void;
}

export const LiveNowSidebar: React.FC<LiveNowSidebarProps> = ({
  items,
  onSelect,
  onViewAll,
}) => {
  return (
    <aside className="ssatv-live-rail">
      {/* Header */}
      <div className="ssatv-rail-header" onClick={onViewAll}>
        <h3 className="ssatv-rail-title">
          <span>Live Now</span>
          <ChevronRight size={17} className="ssatv-rail-chevron" />
        </h3>
      </div>

      {/* Vertical Stack of Live Cards */}
      <div className="ssatv-rail-stack">
        {items.map((item) => (
          <div
            key={item.id}
            className="ssatv-live-card"
            onClick={() => onSelect(item)}
          >
            {/* Left Content */}
            <div className="ssatv-live-info">

              {/* Channel Name */}
              <div className="ssatv-live-name" title={item.name}>
                {item.name}
              </div>

              {/* Program & Schedule */}
              <div className="ssatv-live-program" title={item.program}>
                {item.program}
              </div>
              <div className="ssatv-live-time">
                {item.timeSlot}
              </div>
            </div>

            {/* Right Thumbnail */}
            <div className="ssatv-live-thumb-wrap">
              <img 
                src={item.name.toLowerCase().includes('hbo') ? 'https://upload.wikimedia.org/wikipedia/commons/d/de/HBO_logo.svg' : item.thumbnail} 
                alt={item.name} 
                className="ssatv-live-thumb"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://ptv2026.com/logo/tv1.png';
                }}
              />
              <div className="ssatv-live-thumb-overlay">
                <Radio size={14} className="ssatv-live-icon-subtle" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
