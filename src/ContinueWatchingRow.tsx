import React, { useRef } from 'react';
import { ChevronRight, ChevronLeft, Play } from 'lucide-react';
import { type VodItem } from './vodData';

export interface ContinueItem {
  id: string;
  title: string;
  sub: string;
  progressPercent: number; // e.g. 65
  thumbnail: string;
  vodItem?: VodItem;
  episodeNumber?: number;
}

interface ContinueWatchingRowProps {
  items: ContinueItem[];
  onSelect: (item: ContinueItem) => void;
}

export const ContinueWatchingRow: React.FC<ContinueWatchingRowProps> = ({
  items,
  onSelect,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -480 : 480;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <section className="ssatv-row-section">
      {/* Section Header */}
      <div className="ssatv-row-header">
        <h2 className="ssatv-row-title">
          <span>Continue Watching</span>
          <ChevronRight size={18} className="ssatv-row-chevron" />
        </h2>

        {/* Scroll Controls */}
        <div className="ssatv-row-controls">
          <button 
            className="ssatv-scroll-btn" 
            onClick={() => handleScroll('left')}
            aria-label="Skrol Kiri"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            className="ssatv-scroll-btn" 
            onClick={() => handleScroll('right')}
            aria-label="Skrol Kanan"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Cards Scroll Container */}
      <div className="ssatv-cards-scroll" ref={scrollRef}>
        {items.map((item) => (
          <div
            key={item.id}
            className="ssatv-continue-card"
            onClick={() => onSelect(item)}
          >
            <div className="ssatv-continue-thumb-wrap">
              <img 
                src={item.thumbnail} 
                alt={item.title} 
                className="ssatv-continue-img"
                loading="lazy"
              />

              {/* Hover Play Icon Overlay */}
              <div className="ssatv-card-hover-play">
                <div className="ssatv-play-circle">
                  <Play size={20} fill="#fff" color="#fff" />
                </div>
              </div>

              {/* Dark Gradient Overlay for Text */}
              <div className="ssatv-continue-gradient" />

              {/* Text Info */}
              <div className="ssatv-continue-info">
                <div className="ssatv-continue-title">{item.title}</div>
                <div className="ssatv-continue-sub">{item.sub}</div>
              </div>

              {/* Red Progress Bar */}
              <div className="ssatv-progress-track">
                <div 
                  className="ssatv-progress-fill" 
                  style={{ width: `${Math.min(100, Math.max(5, item.progressPercent))}%` }} 
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
