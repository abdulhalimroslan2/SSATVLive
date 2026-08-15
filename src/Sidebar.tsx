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
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'search', label: 'Carian', icon: Search, shortcut: '/' },
    { id: 'home', label: 'Utama', icon: Home },
    { id: 'livetv', label: 'Live TV', icon: Tv },
    { id: 'vod', label: 'VOD On Demand', icon: Sparkles, badge: 'HOT', isHighlight: true },
    { id: 'movies', label: 'Filem', icon: Film },
    { id: 'series', label: 'Siri Drama', icon: Video },
    { id: 'sports', label: 'Sukan', icon: Trophy },
    { id: 'kids', label: 'Kanak-Kanak', icon: Smile },
    { id: 'mylist', label: 'Senarai Saya', icon: Plus },
    { id: 'history', label: 'Sejarah', icon: HistoryIcon },
    { id: 'settings', label: 'Tetapan', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div>
        {/* Brand Logo */}
        <div 
          className="sidebar-brand" 
          onClick={() => setActiveTab('home')}
          style={{ cursor: 'pointer' }}
        >
          <Tv color="#e50914" size={32} />
          <div>
            <div className="brand-logo-text">LIVE TV</div>
            <div className="brand-logo-sub">STREAMING & VOD</div>
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
                className={`nav-item ${isActive ? 'active' : ''} ${item.isHighlight ? 'highlight-nav-item' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={20} className={item.isHighlight ? 'nav-icon-sparkle' : ''} />
                <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                {item.badge && (
                  <span className="nav-badge-hot">{item.badge}</span>
                )}
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
          <div className="user-status">VIP Premium</div>
        </div>
        <ChevronDown size={16} color="var(--text-secondary)" />
      </div>
    </aside>
  );
};
