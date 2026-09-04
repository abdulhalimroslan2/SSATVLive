import React from 'react';
import { Home, Tv, Film, Layers, Search } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const dockTabs = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
    },
    {
      id: 'live',
      label: 'Live TV',
      icon: Tv,
    },
    {
      id: 'movies',
      label: 'Movies',
      icon: Film,
    },
    {
      id: 'series',
      label: 'Series',
      icon: Layers,
    },
  ];

  return (
    <nav className="apple-tv-mobile-dock-wrapper" aria-label="Apple TV Navigation">
      {/* 1. Main Floating Glass Dock Pill (Home, Live TV, Movies, Series) */}
      <div className="apple-tv-floating-dock-pill">
        {dockTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.id}
              className={`apple-tv-dock-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                onTabChange(tab.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              title={tab.label}
              type="button"
            >
              <div className="apple-tv-dock-icon-wrap">
                <IconComponent
                  size={19}
                  className="apple-tv-dock-icon"
                  strokeWidth={isActive ? 2.4 : 1.7}
                />
              </div>
              <span className="apple-tv-dock-label">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Separate Floating Circular Search Button (Matching Apple TV IMG_5146 - IMG_5151) */}
      <button
        className={`apple-tv-floating-search-btn ${activeTab === 'search' ? 'active' : ''}`}
        onClick={() => {
          onTabChange('search');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        title="Cari"
        type="button"
        aria-label="Carian SSATV+"
      >
        <Search size={21} strokeWidth={2.2} />
      </button>
    </nav>
  );
};
