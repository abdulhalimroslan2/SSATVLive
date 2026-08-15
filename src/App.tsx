import { useEffect, useState } from 'react';
import type { Channel } from './mockData';
import { fetchChannels } from './mockData';
import { type VodItem } from './vodData';
import { PerfectTvLive } from './PerfectTvLive';
import { VodHub } from './VodHub';
import { SearchView } from './SearchView';
import { Tv, Film, Video, Search, ShieldCheck } from 'lucide-react';

function App() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [activeTab, setActiveTab] = useState<'livetv' | 'movies' | 'series' | 'search'>('livetv');
  const [searchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    loadChannels();

    // Digital Clock
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' });
      setCurrentTime(`${timeStr} • ${dateStr}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut '/' to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && (document.activeElement?.tagName !== 'INPUT')) {
        e.preventDefault();
        setActiveTab('search');
      } else if (e.key === '1') {
        setActiveTab('livetv');
      } else if (e.key === '2') {
        setActiveTab('movies');
      } else if (e.key === '3') {
        setActiveTab('series');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadChannels = async () => {
    setIsLoading(true);
    const data = await fetchChannels();
    setChannels(data);
    if (data.length > 0) {
      setActiveChannel(data[0]);
    }
    setIsLoading(false);
  };

  const handleChannelSelect = (channel: Channel) => {
    setActiveChannel(channel);
  };

  const handlePlayVodItem = (item: VodItem, episodeNumber?: number) => {
    let playStreamUrl = item.streamUrl;
    let playClearKey = item.clearKey;
    let title = item.title;
    let desc = item.synopsis;

    if (episodeNumber && item.episodes && item.episodes.length > 0) {
      const ep = item.episodes.find(e => e.episodeNumber === episodeNumber) || item.episodes[0];
      if (ep) {
        playStreamUrl = ep.streamUrl;
        playClearKey = ep.clearKey || item.clearKey;
        title = `${item.title} - ${ep.title}`;
        desc = ep.synopsis || item.synopsis;
      }
    }

    const vodChannel: Channel = {
      id: `vod_${item.id}_${episodeNumber || 1}_${Date.now()}`,
      contentId: item.id,
      name: `${title} (${item.type === 'movie' ? 'Filem VOD' : 'Siri Drama'})`,
      description: desc,
      category: item.type === 'movie' ? 'MOVIES' : 'SERIES',
      thumbnail: item.poster,
      streamUrl: playStreamUrl,
      clearKey: playClearKey,
      isFreeContent: true,
      isFreePreviewEnabledContent: true,
    };
    setActiveChannel(vodChannel);
    setActiveTab('livetv');
  };

  // Movie channels
  const movieChannels = channels.filter(ch => ch.category === 'MOVIES');

  return (
    <div className="ptv-master-layout">
      {/* =========================================================================
          PERFECT TV TOP NAVIGATION BAR
          ========================================================================= */}
      <header className="ptv-topbar">
        <div className="ptv-brand">
          <div className="ptv-brand-icon">S+</div>
          <div className="ptv-brand-text">
            <span className="ptv-brand-name">SSA TV</span>
            <span className="ptv-brand-sub">LIVE PRO</span>
          </div>
        </div>

        <nav className="ptv-nav-tabs">
          <button
            className={`ptv-nav-tab ${activeTab === 'livetv' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('livetv')}
          >
            <Tv size={18} />
            <span>LIVE TV</span>
            <span className="ptv-tab-key">1</span>
          </button>

          <button
            className={`ptv-nav-tab ${activeTab === 'movies' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('movies')}
          >
            <Film size={18} />
            <span>FILEM VOD</span>
            <span className="ptv-tab-key">2</span>
          </button>

          <button
            className={`ptv-nav-tab ${activeTab === 'series' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('series')}
          >
            <Video size={18} />
            <span>SIRI DRAMA</span>
            <span className="ptv-tab-key">3</span>
          </button>

          <button
            className={`ptv-nav-tab ${activeTab === 'search' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <Search size={18} />
            <span>CARIAN</span>
            <span className="ptv-tab-key">/</span>
          </button>
        </nav>

        <div className="ptv-top-status">
          <div className="ptv-clock">{currentTime}</div>
          <div className="ptv-vip-badge">
            <ShieldCheck size={14} />
            <span>VIP UNCAPPED</span>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN CONTENT VIEWPORT
          ========================================================================= */}
      <main className="ptv-main-body">
        {isLoading ? (
          <div className="ptv-loading-state">
            <div className="ptv-spinner"></div>
            <p>Memuatkan Siaran Langsung & Saluran TV...</p>
          </div>
        ) : activeTab === 'livetv' ? (
          <PerfectTvLive
            channels={channels}
            activeChannel={activeChannel}
            onSelectChannel={handleChannelSelect}
          />
        ) : activeTab === 'movies' || activeTab === 'series' ? (
          <div className="ptv-vod-wrapper">
            <VodHub
              movieChannels={movieChannels}
              onSelectChannel={handleChannelSelect}
              activeChannelId={activeChannel?.id}
              onPlayVodItem={handlePlayVodItem}
            />
          </div>
        ) : (
          <div className="ptv-search-wrapper">
            <SearchView
              channels={channels}
              onSelectChannel={(ch) => {
                handleChannelSelect(ch);
                setActiveTab('livetv');
              }}
              activeChannelId={activeChannel?.id}
              onPlayVodItem={handlePlayVodItem}
              initialQuery={searchQuery}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

