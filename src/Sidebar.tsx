import React from 'react';
import { 
  Search,
  Home, 
  Tv, 
  Shield,
  ShoppingBag,
  Clock,
  Film, 
  Monitor,
  Users, 
  User
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const mainNav = [
    { id: 'search', label: 'Search', icon: Search },
    { id: 'home', label: 'Home', icon: Home },
    { id: 'appletv', label: 'Apple TV', icon: Tv },
    { id: 'sports', label: 'MLS', icon: Shield },
    { id: 'store', label: 'Store', icon: ShoppingBag },
  ];

  const libraryNav = [
    { id: 'recent', label: 'Recently Added', icon: Clock },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'series', label: 'TV Shows', icon: Monitor },
    { id: 'family', label: 'Family Sharing', icon: Users },
  ];

  return (
    <aside className="sidebar">
      <div className="apple-sidebar-top">
        {/* macOS Window Traffic Lights */}
        <div className="macos-traffic-lights">
          <span className="traffic-dot dot-close" title="Close"></span>
          <span className="traffic-dot dot-minimize" title="Minimize"></span>
          <span className="traffic-dot dot-maximize" title="Zoom"></span>
        </div>

        {/* Primary Navigation */}
        <nav className="sidebar-nav" style={{ gap: '0.25rem' }}>
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'apple-active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Library Section */}
        <div className="sidebar-section-header">Library</div>
        <nav className="sidebar-nav" style={{ gap: '0.25rem' }}>
          {libraryNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'apple-active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Apple TV User Profile at Bottom */}
      <div 
        className="apple-user-profile"
        onClick={() => setActiveTab('home')}
        title="Akaun Halim Roslan"
      >
        <div className="apple-avatar">
          <User size={18} />
        </div>
        <span className="apple-username">Halim Roslan</span>
      </div>
    </aside>
  );
};
