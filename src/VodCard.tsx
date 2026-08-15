import React from 'react';
import type { VodItem } from './vodData';
import { Play, Star, Film, Video, Plus, Check } from 'lucide-react';

interface VodCardProps {
  item: VodItem;
  onSelect: (item: VodItem) => void;
  onPlayDirect?: (item: VodItem) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (item: VodItem) => void;
}

export const VodCard: React.FC<VodCardProps> = ({
  item,
  onSelect,
  onPlayDirect,
  isBookmarked,
  onToggleBookmark
}) => {
  return (
    <div className="vod-card" onClick={() => onSelect(item)}>
      <div className="vod-card-poster-wrapper">
        <img 
          src={item.poster} 
          alt={item.title}
          className="vod-card-poster"
          loading="lazy"
        />
        
        {/* Quality / Type Badges */}
        <div className="vod-badges-top">
          <span className="vod-badge-quality">{item.quality}</span>
          <span className="vod-badge-type">
            {item.type === 'movie' ? <Film size={11} /> : <Video size={11} />}
            {item.type === 'movie' ? 'Filem' : 'Siri'}
          </span>
        </div>

        {/* Age Rating */}
        <div className="vod-badge-age">{item.ageRating}</div>

        {/* Hover Overlay with Action Buttons */}
        <div className="vod-card-hover-overlay">
          <button 
            className="vod-play-btn"
            title="Mainkan Sekarang"
            onClick={(e) => {
              e.stopPropagation();
              if (onPlayDirect) onPlayDirect(item);
              else onSelect(item);
            }}
          >
            <Play size={22} fill="#fff" color="#fff" style={{ marginLeft: '3px' }} />
          </button>
          
          {onToggleBookmark && (
            <button 
              className={`vod-action-btn ${isBookmarked ? 'active' : ''}`}
              title={isBookmarked ? 'Buang dari Senarai' : 'Tambah ke Senarai'}
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(item);
              }}
            >
              {isBookmarked ? <Check size={16} /> : <Plus size={16} />}
            </button>
          )}
        </div>
      </div>

      <div className="vod-card-info">
        <div className="vod-card-title" title={item.title}>
          {item.title}
        </div>
        
        <div className="vod-card-meta">
          <span className="vod-rating">
            <Star size={13} fill="#ffb800" color="#ffb800" />
            {item.rating}
          </span>
          <span className="vod-meta-dot">•</span>
          <span className="vod-year">{item.year}</span>
          <span className="vod-meta-dot">•</span>
          <span className="vod-duration">{item.duration}</span>
        </div>

        <div className="vod-card-genres">
          {item.genre.slice(0, 2).map((g) => (
            <span key={g} className="vod-genre-tag">{g}</span>
          ))}
        </div>
      </div>
    </div>
  );
};
