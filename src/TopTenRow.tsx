import React, { useRef } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export interface TopTenItem {
  id: string;
  rank: number;
  name: string;
  genre: string;
  poster: string;
  vodItem?: any;
  channel?: any;
}

interface TopTenRowProps {
  title: string;
  items: TopTenItem[];
  onSelect: (item: TopTenItem) => void;
  onViewAll?: () => void;
}

export const TopTenRow: React.FC<TopTenRowProps> = ({
  title,
  items,
  onSelect,
  onViewAll,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = direction === 'left' ? -550 : 550;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="top10-section">
      <div className="top10-header">
        <div 
          className="top10-title" 
          onClick={onViewAll}
        >
          <span>{title}</span>
          <ChevronRight size={18} />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button 
            className="apple-pill-btn" 
            style={{ padding: '6px 10px', borderRadius: '50%', minWidth: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => scroll('left')}
            title="Skrol Kiri"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            className="apple-pill-btn" 
            style={{ padding: '6px 10px', borderRadius: '50%', minWidth: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => scroll('right')}
            title="Skrol Kanan"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="top10-scroll-row" ref={rowRef}>
        {items.map((item) => (
          <div 
            key={item.id} 
            className="top10-card-item"
            onClick={() => onSelect(item)}
          >
            <div className="top10-poster-wrap">
              <span className="top10-rank-num">{item.rank}</span>
              <img 
                src={item.poster} 
                alt={item.name} 
                className="top10-poster-img"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=400';
                }}
              />
            </div>

            <div className="top10-info">
              <div className="top10-name" title={item.name}>{item.name}</div>
              <div className="top10-genre">{item.genre}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
