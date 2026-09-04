import React from 'react';
import {
  Search,
  Home,
  Tv,
  Film,
  Clapperboard,
  Trophy,
  Sparkles,
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
      {/* 1. Primary Navigation Links (Tallies 100% with Main Header Tabs) */}
      <nav className="ssatv-sidebar-nav">
        {/* Search */}
        <button
          className={`ssatv-sidebar-link ${activeTab === 'search' ? 'active' : ''}`}
          onClick={onSearchClick}
          title="Cari Saluran, Filem & Siri"
        >
          <Search size={18} className="ssatv-sidebar-icon" strokeWidth={2.2} />
          <span>Search</span>
        </button>

        {/* Home */}
        <button
          className={`ssatv-sidebar-link ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => onTabChange('home')}
          title="Laman Utama"
        >
          <Home size={18} className="ssatv-sidebar-icon" strokeWidth={2.2} />
          <span>Home</span>
        </button>

        {/* Live TV */}
        <button
          className={`ssatv-sidebar-link ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => onTabChange('live')}
          title="Siaran Langsung"
        >
          <Tv size={18} className="ssatv-sidebar-icon" strokeWidth={2.2} />
          <span>Live TV</span>
        </button>

        {/* Sports */}
        <button
          className={`ssatv-sidebar-link ${activeTab === 'sports' ? 'active' : ''}`}
          onClick={() => onTabChange('sports')}
          title="Sukan"
        >
          <Trophy size={18} className="ssatv-sidebar-icon" strokeWidth={2.2} />
          <span>Sports</span>
        </button>
      </nav>

      {/* 2. Library Section (Tallies with Movies, Series, Kids) */}
      <div className="ssatv-sidebar-section">
        <div className="apple-tv-sidebar-heading">Library</div>
        <div className="ssatv-sidebar-library-links">
          {/* Movies */}
          <button
            className={`ssatv-sidebar-link ${activeTab === 'movies' ? 'active' : ''}`}
            onClick={() => onTabChange('movies')}
            title="Filem"
          >
            <Film size={18} className="ssatv-sidebar-icon" strokeWidth={2} />
            <span>Movies</span>
          </button>

          {/* Series */}
          <button
            className={`ssatv-sidebar-link ${activeTab === 'series' ? 'active' : ''}`}
            onClick={() => onTabChange('series')}
            title="Siri TV"
          >
            <Clapperboard size={18} className="ssatv-sidebar-icon" strokeWidth={2} />
            <span>Series</span>
          </button>

          {/* Kids */}
          <button
            className={`ssatv-sidebar-link ${activeTab === 'kids' ? 'active' : ''}`}
            onClick={() => onTabChange('kids')}
            title="Kanak-kanak"
          >
            <Sparkles size={18} className="ssatv-sidebar-icon" strokeWidth={2} />
            <span>Kids</span>
          </button>
        </div>
      </div>

      {/* 3. Bottom User Profile (Halim Roslan with Real Avatar) */}
      <div className="apple-tv-sidebar-user-card" title="Profil Pengguna: Halim Roslan">
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
