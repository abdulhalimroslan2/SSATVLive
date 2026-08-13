import React from 'react';
import { Bell, Settings } from 'lucide-react';

interface CategoryPill {
  id: string;
  label: string;
}

interface TopNavProps {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  categories?: CategoryPill[];
}

export const TopNav: React.FC<TopNavProps> = ({ activeCategory, setActiveCategory, categories }) => {
  const pills = categories || [
    { id: 'all', label: 'Semua' },
    { id: 'malaysia', label: 'Malaysia' },
    { id: 'sports_fhd', label: 'Sukan' },
    { id: 'entertainment', label: 'Hiburan' },
    { id: 'news', label: 'Berita' },
  ];

  return (
    <div className="top-header">
      <div className="top-pills">
        {pills.map((cat) => (
          <button
            key={cat.id}
            className={`pill-tab ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="top-icons">
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button className="icon-btn" aria-label="Settings">
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
};
