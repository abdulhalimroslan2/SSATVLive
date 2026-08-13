import React from 'react';
import { 
  Home, 
  Tv, 
  Film, 
  Video, 
  Trophy, 
  Smile, 
  Plus, 
  History as HistoryIcon, 
  Settings, 
  Search,
  ChevronDown
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'search', label: 'Search', icon: Search },
    { id: 'home', label: 'Home', icon: Home },
    { id: 'livetv', label: 'Live TV', icon: Tv },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'series', label: 'Series', icon: Video },
    { id: 'sports', label: 'Sports', icon: Trophy },
    { id: 'kids', label: 'Kids', icon: Smile },
    { id: 'mylist', label: 'My List', icon: Plus },
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div>
        {/* Brand Logo */}
        <div className="sidebar-brand">
          <Tv color="#e50914" size={32} />
          <div>
            <div className="brand-logo-text">LIVE TV</div>
            <div className="brand-logo-sub">STREAMING</div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile */}
      <div className="user-profile">
        <img 
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" 
          alt="Abdul Halim" 
          className="user-avatar"
        />
        <div className="user-info" style={{ flex: 1 }}>
          <div className="user-name">Abdul Halim</div>
          <div className="user-status">Premium</div>
        </div>
        <ChevronDown size={16} color="var(--text-secondary)" />
      </div>
    </aside>
  );
};
