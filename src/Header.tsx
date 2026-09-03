import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSearchClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onSearchClick,
}) => {
  const navItems = [
    { id: 'home', label: 'HOME' },
    { id: 'live', label: 'LIVE TV' },
    { id: 'movies', label: 'MOVIES' },
    { id: 'series', label: 'SERIES' },
    { id: 'sports', label: 'SPORTS' },
    { id: 'kids', label: 'KIDS' },
  ];

  return (
    <header className="ssatv-header">
      {/* Brand Logo */}
      <div className="ssatv-logo-wrap" onClick={() => onTabChange('home')}>
        <span className="ssatv-logo-text">SSATV</span>
        <span className="ssatv-logo-plus">+</span>
      </div>

      {/* Center Nav Items */}
      <nav className="ssatv-nav-tabs">
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

      {/* Right Utilities */}
      <div className="ssatv-header-right">
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

        {/* User Profile Avatar */}
        <div className="ssatv-profile-btn" title="Akaun Halim Roslan">
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" 
            alt="Profil" 
            className="ssatv-avatar-img"
          />
          <ChevronDown size={14} className="ssatv-chevron-icon" />
        </div>
      </div>
    </header>
  );
};
