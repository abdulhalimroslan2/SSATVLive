import React from 'react';
import { Bell, Settings, Search, Sparkles } from 'lucide-react';

interface CategoryPill {
  id: string;
  label: string;
}

interface TopNavProps {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  categories?: CategoryPill[];
  searchQuery?: string;
  onSearchInputClick?: () => void;
  onSearchChange?: (q: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ 
  activeCategory, 
  setActiveCategory, 
  categories,
  searchQuery = '',
  onSearchInputClick,
  onSearchChange
}) => {
  const pills = categories || [
    { id: 'all', label: 'Semua' },
    { id: 'vod', label: '🎬 VOD Filem & Siri' },
    { id: 'malaysia', label: 'Malaysia' },
    { id: 'sports_fhd', label: 'Sukan' },
    { id: 'entertainment', label: 'Hiburan' },
    { id: 'news', label: 'Berita' },
  ];

  return (
    <div className="top-header">
      {/* Search Input in TopNav for Instant Access */}
      <div className="top-search-bar" onClick={onSearchInputClick}>
        <Search size={16} className="top-search-icon" />
        <input
          type="text"
          placeholder="Cari saluran, filem, siri drama..."
          className="top-search-input"
          value={searchQuery}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          onFocus={onSearchInputClick}
        />
        <span className="search-keyboard-badge">/</span>
      </div>

      {/* Category Pills Scrollable */}
      <div className="top-pills">
        {pills.map((cat) => (
          <button
            key={cat.id}
            className={`pill-tab ${activeCategory === cat.id ? 'active' : ''} ${cat.id === 'vod' ? 'vod-pill' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.id === 'vod' && <Sparkles size={13} style={{ marginRight: '4px' }} />}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Top Action Icons */}
      <div className="top-icons">
        <button className="icon-btn" aria-label="Notifications" title="Pemberitahuan">
          <Bell size={18} />
          <span className="notif-dot" />
        </button>
        <button className="icon-btn" aria-label="Settings" title="Tetapan">
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
};
