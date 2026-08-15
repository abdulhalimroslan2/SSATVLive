import React from 'react';
import type { VodItem } from './vodData';
import { Play, X, Star, Calendar, Clock, Film, Video, Share2, Plus, Check } from 'lucide-react';

interface VodModalProps {
  item: VodItem | null;
  onClose: () => void;
  onPlay: (item: VodItem, episodeNumber?: number) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (item: VodItem) => void;
}

export const VodModal: React.FC<VodModalProps> = ({
  item,
  onClose,
  onPlay,
  isBookmarked,
  onToggleBookmark
}) => {
  if (!item) return null;

  return (
    <div className="vod-modal-backdrop" onClick={onClose}>
      <div className="vod-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="vod-modal-close" onClick={onClose} aria-label="Tutup">
          <X size={20} />
        </button>

        {/* Modal Backdrop Banner */}
        <div className="vod-modal-hero" style={{ backgroundImage: `url(${item.backdrop || item.poster})` }}>
          <div className="vod-modal-hero-gradient" />
          <div className="vod-modal-hero-details">
            <div className="vod-badges-row">
              <span className="vod-badge-quality">{item.quality}</span>
              <span className="vod-badge-type">
                {item.type === 'movie' ? <Film size={12} /> : <Video size={12} />}
                {item.type === 'movie' ? 'Filem VOD' : 'Siri Drama'}
              </span>
              <span className="vod-badge-age">{item.ageRating}</span>
            </div>

            <h2 className="vod-modal-title">{item.title}</h2>

            <div className="vod-modal-meta">
              <span className="vod-rating-highlight">
                <Star size={15} fill="#ffb800" color="#ffb800" />
                {item.rating}
              </span>
              <span><Calendar size={14} /> {item.year}</span>
              <span><Clock size={14} /> {item.duration}</span>
              <span className="vod-origin-badge">
                {item.origin === 'malay' ? '🇲🇾 Malaysia' :
                 item.origin === 'korean' ? '🇰🇷 Korea' :
                 item.origin === 'anime' ? '🇯🇵 Anime' : '🌐 Antarabangsa'}
              </span>
            </div>

            {/* Actions */}
            <div className="vod-modal-actions">
              <button 
                className="btn-red vod-modal-play-btn"
                onClick={() => onPlay(item)}
              >
                <Play size={18} fill="#fff" /> Mainkan Sekarang
              </button>

              {onToggleBookmark && (
                <button 
                  className={`btn-secondary ${isBookmarked ? 'active' : ''}`}
                  onClick={() => onToggleBookmark(item)}
                >
                  {isBookmarked ? <Check size={18} /> : <Plus size={18} />}
                  {isBookmarked ? 'Dalam Senarai' : 'Tambah Senarai'}
                </button>
              )}

              <button className="icon-btn-secondary" title="Kongsi">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="vod-modal-body">
          <div className="vod-modal-grid">
            <div className="vod-modal-main">
              <div className="vod-section-block">
                <h4 className="vod-block-title">Sinopsis</h4>
                <p className="vod-synopsis-text">{item.synopsis}</p>
              </div>

              {/* Genre Pills */}
              <div className="vod-genres-list">
                {item.genre.map((g) => (
                  <span key={g} className="vod-genre-chip">{g}</span>
                ))}
              </div>

              {/* Episodes List (if Series) */}
              {item.type === 'series' && item.episodes && item.episodes.length > 0 && (
                <div className="vod-episodes-section">
                  <h4 className="vod-block-title">Senarai Episod ({item.episodes.length})</h4>
                  <div className="vod-episodes-list">
                    {item.episodes.map((ep) => (
                      <div 
                        key={ep.episodeNumber} 
                        className="vod-episode-item"
                        onClick={() => onPlay(item, ep.episodeNumber)}
                      >
                        <div className="vod-ep-thumb-wrapper">
                          <img src={ep.thumbnail} alt={ep.title} className="vod-ep-thumb" />
                          <div className="vod-ep-play-overlay">
                            <Play size={16} fill="#fff" />
                          </div>
                        </div>
                        <div className="vod-ep-info">
                          <div className="vod-ep-header">
                            <span className="vod-ep-title">{ep.title}</span>
                            <span className="vod-ep-duration">{ep.duration}</span>
                          </div>
                          {ep.synopsis && <p className="vod-ep-synopsis">{ep.synopsis}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Info */}
            <div className="vod-modal-sidebar">
              {item.cast && item.cast.length > 0 && (
                <div className="vod-info-group">
                  <span className="vod-info-label">Pelakon Utama:</span>
                  <span className="vod-info-value">{item.cast.join(', ')}</span>
                </div>
              )}

              {item.director && (
                <div className="vod-info-group">
                  <span className="vod-info-label">Pengarah:</span>
                  <span className="vod-info-value">{item.director}</span>
                </div>
              )}

              <div className="vod-info-group">
                <span className="vod-info-label">Kualiti Siaran:</span>
                <span className="vod-info-value highlight-accent">{item.quality} (Stereo / 5.1 Surround)</span>
              </div>

              <div className="vod-info-group">
                <span className="vod-info-label">Klasifikasi:</span>
                <span className="vod-info-value">{item.ageRating} (Sesuai untuk tontonan)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
