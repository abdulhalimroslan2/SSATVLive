import React from 'react';
import {
  Search,
  Home,
  Tv,
  Film,
  Clapperboard,
  Plus,
  Clock,
  History,
  ChevronDown,
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
  const navItems = [
    { id: 'search', label: 'Search', icon: Search, isAction: true },
    { id: 'home', label: 'Home', icon: Home },
    { id: 'live', label: 'Live TV', icon: Tv },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'series', label: 'Series', icon: Clapperboard },
  ];

  return (
    <aside className="ssatv-apple-sidebar">
      {/* 1. SSATV+ Top Brand */}
      <div className="ssatv-sidebar-brand" onClick={() => onTabChange('home')}>
        <span className="brand-ssatv">SSATV</span>
        <span className="brand-plus">+</span>
      </div>

      {/* 2. Main Navigation Links */}
      <nav className="ssatv-sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`ssatv-sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (item.isAction) {
                  onSearchClick();
                } else {
                  onTabChange(item.id);
                }
              }}
            >
              <Icon size={19} className="ssatv-sidebar-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. My Library Section */}
      <div className="ssatv-sidebar-section">
        <div className="ssatv-sidebar-heading">MY LIBRARY</div>
        <div className="ssatv-sidebar-library-links">
          <button className="ssatv-sidebar-link">
            <Plus size={18} className="ssatv-sidebar-icon" />
            <span>My List</span>
          </button>
          <button className="ssatv-sidebar-link">
            <Clock size={18} className="ssatv-sidebar-icon" />
            <span>Recently Added</span>
          </button>
          <button className="ssatv-sidebar-link">
            <History size={18} className="ssatv-sidebar-icon" />
            <span>Watch History</span>
          </button>
        </div>
      </div>

      {/* 4. Bottom User Profile Pill (Halim Roslan) */}
      <div className="ssatv-sidebar-bottom-profile">
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
          alt="Halim Roslan"
          className="ssatv-sidebar-avatar"
        />
        <span className="ssatv-sidebar-username">Halim Roslan</span>
        <ChevronDown size={14} className="ssatv-sidebar-chevron" />
      </div>
    </aside>
  );
};
