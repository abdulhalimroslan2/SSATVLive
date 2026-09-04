import React from 'react';
import {
  Search,
  Home,
  Shield,
  ShoppingBag,
  Clock,
  Film,
  Tv,
  Users,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSearchClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onSearchClick,
}) => {
  return (
    <aside className="ssatv-apple-sidebar">
      {/* 1. macOS Window Traffic Lights */}
      <div className="apple-tv-mac-traffic-lights">
        <span className="traffic-dot traffic-red" />
        <span className="traffic-dot traffic-yellow" />
        <span className="traffic-dot traffic-green" />
      </div>

      {/* 2. Primary Navigation Links (Matching Apple TV macOS 1:1) */}
      <nav className="ssatv-sidebar-nav">
        {/* Search */}
        <button
          className={`ssatv-sidebar-link ${activeTab === 'search' ? 'active' : ''}`}
          onClick={onSearchClick}
        >
          <Search size={18} className="ssatv-sidebar-icon" strokeWidth={2.2} />
          <span>Search</span>
        </button>

        {/* Home */}
        <button
          className={`ssatv-sidebar-link ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => onTabChange('home')}
        >
          <Home size={18} className="ssatv-sidebar-icon" strokeWidth={2.2} />
          <span>Home</span>
        </button>

        {/* Apple TV (Live TV) */}
        <button
          className={`ssatv-sidebar-link ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => onTabChange('live')}
        >
          {/* Apple Logo Icon */}
          <svg
            viewBox="0 0 170 170"
            width="17"
            height="17"
            fill="currentColor"
            className="ssatv-sidebar-icon"
            style={{ minWidth: 17 }}
          >
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.6-7.85-11.75-14.43-6.19-9.8-11.05-20.91-14.59-33.34-3.54-12.43-5.31-24.38-5.31-35.85 0-14.59 3.65-26.68 10.96-36.27 7.31-9.59 16.5-14.45 27.56-14.59 4.35 0 9.4 1.13 15.15 3.39 5.75 2.26 9.53 3.44 11.34 3.54 1.62-.1 5.4-1.28 11.34-3.54 5.94-2.26 10.9-3.34 14.88-3.23 10.21.54 18.73 4.54 25.56 12.02-9.14 5.54-13.62 13.25-13.44 23.13.18 8.47 3.52 15.65 10.02 21.54 6.5 5.89 14.28 9.38 23.34 10.47-2.18 6.74-4.8 13.62-7.86 20.65zM119.22 32.64c0-7.07 2.65-13.88 7.95-20.43 5.3-6.55 11.79-10.98 19.47-13.29.35 1.41.53 2.76.53 4.05 0 7.07-2.73 14.07-8.19 21.01-5.46 6.94-11.96 11.19-19.5 12.75-.13-1.39-.26-2.76-.26-4.09z" />
          </svg>
          <span style={{ fontWeight: activeTab === 'live' ? 600 : 400 }}>Apple TV</span>
        </button>

        {/* MLS (Sports) */}
        <button
          className={`ssatv-sidebar-link ${activeTab === 'sports' ? 'active' : ''}`}
          onClick={() => onTabChange('sports')}
        >
          <Shield size={18} className="ssatv-sidebar-icon" strokeWidth={2.2} />
          <span>MLS</span>
        </button>

        {/* Store */}
        <button
          className={`ssatv-sidebar-link ${activeTab === 'store' ? 'active' : ''}`}
          onClick={() => onTabChange('store')}
        >
          <ShoppingBag size={18} className="ssatv-sidebar-icon" strokeWidth={2.2} />
          <span>Store</span>
        </button>
      </nav>

      {/* 3. Library Section (Matching Apple TV macOS 1:1) */}
      <div className="ssatv-sidebar-section">
        <div className="apple-tv-sidebar-heading">Library</div>
        <div className="ssatv-sidebar-library-links">
          {/* Recently Added */}
          <button
            className={`ssatv-sidebar-link ${activeTab === 'recently-added' ? 'active' : ''}`}
            onClick={() => onTabChange('home')}
          >
            <Clock size={18} className="ssatv-sidebar-icon" strokeWidth={2} />
            <span>Recently Added</span>
          </button>

          {/* Movies */}
          <button
            className={`ssatv-sidebar-link ${activeTab === 'movies' ? 'active' : ''}`}
            onClick={() => onTabChange('movies')}
          >
            <Film size={18} className="ssatv-sidebar-icon" strokeWidth={2} />
            <span>Movies</span>
          </button>

          {/* TV Shows (Series) */}
          <button
            className={`ssatv-sidebar-link ${activeTab === 'series' ? 'active' : ''}`}
            onClick={() => onTabChange('series')}
          >
            <Tv size={18} className="ssatv-sidebar-icon" strokeWidth={2} />
            <span>TV Shows</span>
          </button>

          {/* Family Sharing */}
          <button
            className={`ssatv-sidebar-link ${activeTab === 'family' ? 'active' : ''}`}
            onClick={() => onTabChange('home')}
          >
            <Users size={18} className="ssatv-sidebar-icon" strokeWidth={2} />
            <span>Family Sharing</span>
          </button>
        </div>
      </div>

      {/* 4. Bottom User Profile (Halim Roslan with Real Avatar) */}
      <div className="apple-tv-sidebar-user-card">
        <img
          src="/sir-halim.png"
          alt="Halim Roslan"
          className="apple-tv-sidebar-avatar-img"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120';
          }}
        />
        <span className="apple-tv-sidebar-username-label">Halim Roslan</span>
      </div>
    </aside>
  );
};
