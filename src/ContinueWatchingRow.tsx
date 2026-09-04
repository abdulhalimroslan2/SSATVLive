import React, { useRef } from 'react';
import { ChevronRight, ChevronLeft, Play, MoreHorizontal } from 'lucide-react';
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
    <section className="ssatv-row-section apple-tv-continue-section">
      {/* Section Header */}
      <div className="ssatv-row-header">
        <h2 className="ssatv-row-title">
          <span>Continue Watching</span>
          <ChevronRight size={18} className="ssatv-row-chevron" />
        </h2>

        {/* Scroll Controls (Desktop Only) */}
        <div className="ssatv-row-controls ssatv-desktop-only">
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
            className="ssatv-continue-card apple-tv-continue-card"
            onClick={() => onSelect(item)}
          >
            <div className="ssatv-continue-thumb-wrap">
              <img 
                src={item.thumbnail} 
                alt={item.title} 
                className="ssatv-continue-img"
                loading="lazy"
              />

              {/* Apple TV Watermark Top-Right (Matching IMG_5147) */}
              <div className="apple-tv-card-badge-logo">tv</div>

              {/* Hover Play Icon Overlay */}
              <div className="ssatv-card-hover-play">
                <div className="ssatv-play-circle">
                  <Play size={20} fill="#fff" color="#fff" />
                </div>
              </div>

              {/* Dark Gradient Overlay for Text */}
              <div className="ssatv-continue-gradient" />

              {/* Minimalist Bottom Bar (Matching Apple TV IMG_5147) */}
              <div className="apple-tv-continue-bottom-bar">
                <div className="apple-tv-continue-play-icon">
                  <Play size={10} fill="#ffffff" color="#ffffff" />
                </div>

                {/* Clean White Apple TV Progress Bar */}
                <div className="apple-tv-continue-progress-track">
                  <div 
                    className="apple-tv-continue-progress-fill" 
                    style={{ width: `${Math.min(100, Math.max(10, item.progressPercent))}%` }} 
                  />
                </div>

                <div className="apple-tv-continue-tag">
                  {item.sub || 'S1, E1 · 33m'}
                </div>

                <button 
                  className="apple-tv-continue-more-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  title="Pilihan"
                  type="button"
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
