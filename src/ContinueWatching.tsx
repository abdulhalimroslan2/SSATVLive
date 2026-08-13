import React from 'react';
import { Play, ChevronRight } from 'lucide-react';

export interface WatchingItem {
  id: string;
  title: string;
  episode: string;
  timeLeft: string;
  progressPercent: number;
  thumbnail: string;
}

interface ContinueWatchingProps {
  onSelectItem: (item: WatchingItem) => void;
}

export const ContinueWatching: React.FC<ContinueWatchingProps> = ({ onSelectItem }) => {
  const items: WatchingItem[] = [
    {
      id: 'cw_1',
      title: 'THE LAST JOURNEY',
      episode: 'S1 : E4',
      timeLeft: '40m left',
      progressPercent: 45,
      thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 'cw_2',
      title: 'CINTA KITA',
      episode: 'S2 : E7',
      timeLeft: '20m left',
      progressPercent: 70,
      thumbnail: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 'cw_3',
      title: 'LEGEND OF THE NORTH',
      episode: 'S1 : E2',
      timeLeft: '30m left',
      progressPercent: 30,
      thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 'cw_4',
      title: 'BOBOIBOY GALAXY',
      episode: 'S3 : E15',
      timeLeft: '10m left',
      progressPercent: 85,
      thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600'
    }
  ];

  return (
    <section>
      <div className="section-header">
        <h3 className="section-title">Continue Watching</h3>
        <span className="section-link">
          View All <ChevronRight size={16} />
        </span>
      </div>

      <div className="watching-grid">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="watching-card"
            onClick={() => onSelectItem(item)}
          >
            <div className="watching-thumb-wrapper">
              <img src={item.thumbnail} alt={item.title} className="watching-thumb" />
              <div className="play-overlay-btn">
                <div className="play-icon-circle">
                  <Play size={20} fill="#000" style={{ marginLeft: '2px' }} />
                </div>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${item.progressPercent}%` }}
                ></div>
              </div>
              <span className="time-remaining-tag">{item.timeLeft}</span>
            </div>

            <div className="watching-info">
              <div className="watching-title">{item.title}</div>
              <div className="watching-meta">{item.episode}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
