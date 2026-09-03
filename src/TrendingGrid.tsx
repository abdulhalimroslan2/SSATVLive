import React, { useRef } from 'react';
import { ChevronRight, ChevronLeft, Play } from 'lucide-react';
import { type VodItem } from './vodData';

export interface TrendingItem {
  id: string;
  title: string;
  genre: string;
  year?: number;
  poster: string;
  badge?: string; // e.g. 'NEW'
  vodItem?: VodItem;
}

interface ShelfRowProps {
  title: string;
  items: TrendingItem[];
  variant?: 'stylized-title' | 'below-title';
  onSelect: (item: TrendingItem) => void;
  onViewAll?: () => void;
}

export const ShelfRow: React.FC<ShelfRowProps> = ({
  title,
  items,
  variant = 'stylized-title',
  onSelect,
  onViewAll,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -420 : 420;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <section className="ssatv-row-section">
      {/* Header */}
      <div className="ssatv-row-header">
        <h2 className="ssatv-row-title" onClick={onViewAll}>
          <span>{title}</span>
          <ChevronRight size={18} className="ssatv-row-chevron" />
        </h2>

        {/* Controls */}
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

      {/* Cards Scroll */}
      <div className="ssatv-cards-scroll" ref={scrollRef}>
        {items.map((item) => (
          <div
            key={item.id}
            className={`ssatv-poster-card ${variant}`}
            onClick={() => onSelect(item)}
          >
            <div className="ssatv-poster-wrap">
              <img 
                src={item.poster} 
                alt={item.title} 
                className="ssatv-poster-img"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400';
                }}
              />

              {/* Red NEW Pill Badge */}
              {item.badge && (
                <span className="ssatv-badge-new">
                  {item.badge}
                </span>
              )}

              {/* Hover Play Button */}
              <div className="ssatv-card-hover-play">
                <div className="ssatv-play-circle">
                  <Play size={20} fill="#fff" color="#fff" />
                </div>
              </div>

              {/* Stylized Title Overlay at Bottom of Poster */}
              {variant === 'stylized-title' && (
                <div className="ssatv-poster-gradient">
                  <div className="ssatv-stylized-title">{item.title}</div>
                </div>
              )}
            </div>

            {/* Title & Metadata Below Poster */}
            {variant === 'below-title' && (
              <div className="ssatv-below-info">
                <div className="ssatv-below-title" title={item.title}>
                  {item.title}
                </div>
                <div className="ssatv-below-meta">
                  {item.year || 2026} • {item.genre}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
