import React from 'react';
import { Search, Bell } from 'lucide-react';
import { APK_CATEGORIES } from './LiveTvView';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSearchClick: () => void;
  activeLiveCategory?: string;
  onLiveCategoryChange?: (cat: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onSearchClick,
  activeLiveCategory = 'MALAYSIA',
  onLiveCategoryChange,
}) => {
  const navItems = [
    { id: 'home', label: 'HOME' },
    { id: 'live', label: 'LIVE TV' },
    { id: 'movies', label: 'MOVIES' },
    { id: 'series', label: 'SERIES' },
    { id: 'sports', label: 'SPORTS' },
    { id: 'kids', label: 'KIDS' },
  ];

  const getMobileTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'Home';
      case 'live':
        return 'Live TV';
      case 'movies':
        return 'Movies';
      case 'series':
        return 'Series';
      case 'sports':
        return 'Sports';
      case 'kids':
        return 'Kids';
      case 'search':
        return 'Search';
      default:
        return 'Home';
    }
  };

  return (
    <header className={`ssatv-header apple-tv-header ${activeTab === 'live' ? 'has-live-subnav' : ''}`}>
      <div className="ssatv-header-main-bar">
        {/* Mobile Top Bar Title (Matching Apple TV IMG_5146 / IMG_5148) */}
        <div className="apple-tv-mobile-header-left ssatv-mobile-only" onClick={() => onTabChange('home')}>
          <h1 className="apple-tv-mobile-header-title">{getMobileTitle()}</h1>
        </div>

        {/* Center Nav Items (Desktop only - mobile uses floating bottom dock) */}
        <nav className="ssatv-nav-tabs ssatv-desktop-only">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`ssatv-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => onTabChange(item.id)}
              >
                <span className="ssatv-nav-label">{item.label}</span>
                {isActive && <span className="ssatv-active-pill-glow" />}
              </button>
            );
          })}
        </nav>

        {/* Desktop Right Utilities */}
        <div className="ssatv-header-right ssatv-desktop-only">
          {/* Official Lemon TV Logo */}
          <div 
            className="ssatv-header-appletv-icon" 
            style={{ display: 'flex', alignItems: 'center', marginRight: '8px', cursor: 'pointer' }}
            onClick={() => onTabChange('home')}
            title="Lemon TV"
          >
            <img 
              src="/lemontv-logo.png" 
              alt="Lemon TV" 
              style={{ height: '25px', width: 'auto', objectFit: 'contain', display: 'block' }} 
            />
          </div>

          {/* Search */}
          <button 
            className="ssatv-icon-btn" 
            onClick={onSearchClick}
            title="Cari Saluran, Filem & Siri (Tekan /)"
          >
            <Search size={19} />
          </button>

          {/* Notifications */}
          <div className="ssatv-notif-wrap" title="Pemberitahuan">
            <button className="ssatv-icon-btn">
              <Bell size={19} />
            </button>
            <span className="ssatv-notif-badge">0</span>
          </div>
        </div>

        {/* Mobile Top-Right Profile Avatar (Matching Apple TV IMG_5146 / IMG_5148) */}
        <div className="apple-tv-mobile-header-right ssatv-mobile-only">
          <div className="apple-tv-mobile-avatar" title="Akaun Halim Roslan">
            <img
              src="/sir-halim.png"
              alt="Profil"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120';
              }}
            />
          </div>
        </div>
      </div>

      {/* Subnav for LIVE TV: Category Pills directly under main categories */}
      {activeTab === 'live' && (
        <div className="ssatv-header-subnav ssatv-desktop-only">
          <div className="ssatv-category-pills-row header-pills">
            {APK_CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`ssatv-cat-pill ${activeLiveCategory === cat ? 'active' : ''}`}
                onClick={() => onLiveCategoryChange?.(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
