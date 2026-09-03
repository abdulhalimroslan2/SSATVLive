import { useEffect, useState } from 'react';
import type { Channel } from './mockData';
import { fetchChannels, CATEGORIES } from './mockData';
import { VOD_CATALOG, type VodItem } from './vodData';
import { Header } from './Header';
import { HeroExperience, type HeroSlide } from './HeroExperience';
import { ContinueWatchingRow, type ContinueItem } from './ContinueWatchingRow';
import { ShelfRow, type TrendingItem } from './TrendingGrid';
import { LiveNowSidebar, type LiveRailItem } from './LiveNowSidebar';
import {
  SSATV_HERO_SLIDES,
  SSATV_CONTINUE_WATCHING,
  SSATV_TRENDING_NOW,
  SSATV_NEW_RELEASES,
  SSATV_LIVE_RAIL,
} from './ssatvHomeData';
import { Player } from './Player';
import { ChannelCard } from './ChannelCard';
import { VodHub } from './VodHub';
import { SearchView } from './SearchView';
import { X, Tv } from 'lucide-react';

function App() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChannels();
  }, []);

  // Keyboard shortcut '/' to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setActiveTab('search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadChannels = async () => {
    setIsLoading(true);
    const data = await fetchChannels();
    setChannels(data);
    setIsLoading(false);
  };

  // Movie channels
  const movieChannels = channels.filter((ch) => ch.category === 'MOVIES');

  // Filter channels by active category
  const filteredChannels =
    activeCategory === 'all'
      ? channels
      : channels.filter(
          (ch) => ch.category.toLowerCase().replace(' ', '_') === activeCategory
        );

  // Sports channels
  const sportsChannels = channels.filter(
    (ch) =>
      ch.category.toLowerCase().includes('sport') ||
      ch.category === 'SPORTS_FHD'
  );

  // Kids channels
  const kidsChannels = channels.filter(
    (ch) =>
      ch.category.toLowerCase().includes('kid') ||
      ch.category.toLowerCase().includes('anim') ||
      ch.name.toLowerCase().includes('ceria') ||
      ch.name.toLowerCase().includes('cartoon') ||
      ch.name.toLowerCase().includes('nickelodeon')
  );

  const handleChannelSelect = (channel: Channel) => {
    setActiveChannel(channel);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlayVodItem = (item: VodItem, episodeNumber?: number) => {
    let playStreamUrl = item.streamUrl;
    let playClearKey = item.clearKey;
    let title = item.title;
    let desc = item.synopsis;

    if (item.type === 'series' && item.episodes && item.episodes.length > 0) {
      const ep =
        (episodeNumber &&
          item.episodes.find((e) => e.episodeNumber === episodeNumber)) ||
        item.episodes[0];
      if (ep) {
        playStreamUrl = ep.streamUrl;
        playClearKey = ep.clearKey || item.clearKey;
        title = `${item.title} - Episod ${ep.episodeNumber}: ${ep.title}`;
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hero "WATCH NOW" handler
  const handleHeroPlay = (slide: HeroSlide) => {
    if (slide.id === 'hero_last_horizon') {
      // Find Sci-Fi blockbuster (Movie 974 or Penunggu Istana)
      const target =
        VOD_CATALOG.find((v) => v.title.includes('974')) || VOD_CATALOG[0];
      if (target) {
        handlePlayVodItem(target);
        return;
      }
    } else if (slide.id === 'hero_bulan_henti') {
      const target = VOD_CATALOG.find((v) =>
        v.title.toLowerCase().includes('bulan henti')
      );
      if (target) {
        handlePlayVodItem(target);
        return;
      }
    } else if (slide.id === 'hero_penunggu_istana') {
      const target = VOD_CATALOG.find((v) =>
        v.title.toLowerCase().includes('penunggu')
      );
      if (target) {
        handlePlayVodItem(target);
        return;
      }
    } else if (slide.id === 'hero_astro_arena') {
      const arena = channels.find((c) =>
        c.name.toLowerCase().includes('arena')
      );
      if (arena) {
        handleChannelSelect(arena);
        return;
      }
    } else if (slide.id === 'hero_kolong') {
      const kolong = VOD_CATALOG.find((v) =>
        v.title.toLowerCase().includes('kolong')
      );
      if (kolong) {
        handlePlayVodItem(kolong);
        return;
      }
    }

    // Default fallback to first catalog item
    if (VOD_CATALOG.length > 0) {
      handlePlayVodItem(VOD_CATALOG[0]);
    } else if (channels.length > 0) {
      handleChannelSelect(channels[0]);
    }
  };

  // Continue Watching selection handler
  const handleContinueItemSelect = (item: ContinueItem) => {
    if (item.title === 'The Last Horizon') {
      const target =
        VOD_CATALOG.find((v) => v.title.includes('974')) || VOD_CATALOG[0];
      if (target) return handlePlayVodItem(target);
    }
    // Match against catalog by title
    const matched = VOD_CATALOG.find((v) =>
      v.title.toLowerCase().includes(item.title.toLowerCase())
    );
    if (matched) {
      handlePlayVodItem(matched, item.episodeNumber || 1);
    } else if (VOD_CATALOG.length > 0) {
      handlePlayVodItem(VOD_CATALOG[0]);
    }
  };

  // Shelf card selection handler
  const handleTrendingSelect = (item: TrendingItem) => {
    const matched = VOD_CATALOG.find(
      (v) =>
        v.title.toLowerCase().includes(item.title.toLowerCase()) ||
        item.title.toLowerCase().includes(v.title.toLowerCase())
    );
    if (matched) {
      handlePlayVodItem(matched);
    } else if (VOD_CATALOG.length > 0) {
      handlePlayVodItem(VOD_CATALOG[0]);
    }
  };

  // Right Rail Live selection handler
  const handleLiveRailSelect = (item: LiveRailItem) => {
    let targetCh: Channel | undefined;
    if (item.name.includes('NEWS')) {
      targetCh = channels.find(
        (c) =>
          c.name.toLowerCase().includes('awani') ||
          c.name.toLowerCase().includes('berita') ||
          c.name.toLowerCase().includes('news')
      );
    } else if (item.name.includes('SPORT')) {
      targetCh = channels.find(
        (c) =>
          c.name.toLowerCase().includes('arena') ||
          c.category.toLowerCase().includes('sport')
      );
    } else if (item.name.includes('CINE')) {
      targetCh = channels.find(
        (c) =>
          c.name.toLowerCase().includes('premier') ||
          c.name.toLowerCase().includes('hbo') ||
          c.category === 'MOVIES'
      );
    } else if (item.name.includes('WILD')) {
      targetCh = channels.find(
        (c) =>
          c.name.toLowerCase().includes('discovery') ||
          c.name.toLowerCase().includes('animal') ||
          c.name.toLowerCase().includes('nat geo')
      );
    }

    if (targetCh) {
      handleChannelSelect(targetCh);
    } else if (channels.length > 0) {
      handleChannelSelect(channels[0]);
    }
  };

  // Recommended For You items mapped from catalog
  const recommendedItems: TrendingItem[] = VOD_CATALOG.slice(10, 16).map(
    (v, idx) => ({
      id: `rec_${idx}`,
      title: v.title.replace(/^\d+\s*/, ''),
      genre: v.genre?.[0] || 'Drama',
      poster: v.poster,
      vodItem: v,
    })
  );

  return (
    <div className="ssatv-app-container">
      {/* 1. SSATV+ TOP NAVIGATION HEADER */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'live') setActiveCategory('all');
        }}
        onSearchClick={() => {
          setSearchQuery('');
          setActiveTab('search');
        }}
      />

      {/* Main Content Area */}
      <main className="ssatv-main-content">
        {isLoading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '8rem 2rem',
              color: 'var(--text-secondary)',
              fontSize: '1.25rem',
            }}
          >
            Memuatkan SSATV+ Widescreen Experience...
          </div>
        ) : (
          <>
            {/* Active Video Player Cinema View */}
            {activeChannel && (
              <section
                style={{
                  padding: '24px 48px 12px 48px',
                  background: 'rgba(7, 9, 14, 0.95)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        background: 'var(--ssatv-red)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 14px var(--ssatv-red-glow)',
                      }}
                    >
                      <Tv size={22} color="#fff" />
                    </div>
                    <div>
                      <h2
                        style={{
                          fontSize: '1.45rem',
                          fontWeight: 800,
                          color: '#ffffff',
                          letterSpacing: '-0.3px',
                          margin: 0,
                        }}
                      >
                        {activeChannel.name}
                      </h2>
                      <span
                        style={{
                          fontSize: '0.86rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {activeChannel.description}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <span
                      className="ssatv-live-pill"
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      <span className="ssatv-live-pulse-dot" /> SEDANG
                      DIMAINKAN
                    </span>
                    <button
                      className="ssatv-scroll-btn"
                      style={{ width: '36px', height: '36px' }}
                      onClick={() => setActiveChannel(null)}
                      title="Tutup Pemain Video"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <Player key={activeChannel.id} channel={activeChannel} />
              </section>
            )}

            {/* TAB 1: HOME (MATCHING UPLOADED PHOTO 1:1) */}
            {activeTab === 'home' && (
              <>
                {/* A. Hero Experience (The Last Horizon + Blockbusters) */}
                <HeroExperience
                  slides={SSATV_HERO_SLIDES}
                  onPlay={handleHeroPlay}
                />

                {/* B. Two-Column Home Layout: Main Shelves + Right Live Now Rail */}
                <div className="ssatv-home-layout">
                  {/* Left Column: Shelves */}
                  <div className="ssatv-main-shelves">
                    {/* 1. Continue Watching */}
                    <ContinueWatchingRow
                      items={SSATV_CONTINUE_WATCHING}
                      onSelect={handleContinueItemSelect}
                    />

                    {/* 2. Trending Now (Stylized Titles on Poster) */}
                    <ShelfRow
                      title="Trending Now"
                      items={SSATV_TRENDING_NOW}
                      variant="stylized-title"
                      onSelect={handleTrendingSelect}
                      onViewAll={() => setActiveTab('movies')}
                    />

                    {/* 3. New Releases (Red NEW Badge + Meta Below) */}
                    <ShelfRow
                      title="New Releases"
                      items={SSATV_NEW_RELEASES}
                      variant="below-title"
                      onSelect={handleTrendingSelect}
                      onViewAll={() => setActiveTab('movies')}
                    />

                    {/* 4. Recommended For You */}
                    <ShelfRow
                      title="Recommended For You"
                      items={recommendedItems}
                      variant="stylized-title"
                      onSelect={handleTrendingSelect}
                      onViewAll={() => setActiveTab('series')}
                    />
                  </div>

                  {/* Right Column: Live Now Rail */}
                  <LiveNowSidebar
                    items={SSATV_LIVE_RAIL}
                    onSelect={handleLiveRailSelect}
                    onViewAll={() => setActiveTab('live')}
                  />
                </div>
              </>
            )}

            {/* TAB 2: LIVE TV CHANNELS */}
            {activeTab === 'live' && (
              <section style={{ padding: '32px 48px' }}>
                <div className="section-header" style={{ marginBottom: '24px' }}>
                  <h2
                    style={{
                      fontSize: '1.8rem',
                      fontWeight: 800,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span style={{ color: 'var(--ssatv-red)' }}>●</span> Semua
                    Saluran TV Langsung ({filteredChannels.length})
                  </h2>
                </div>

                {/* Category Filter Pills */}
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                    marginBottom: '28px',
                  }}
                >
                  <button
                    className={`apple-pill-btn ${activeCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('all')}
                  >
                    Semua
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      className={`apple-pill-btn ${activeCategory === cat.id ? 'active' : ''}`}
                      onClick={() => setActiveCategory(cat.id)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="channels-grid">
                  {filteredChannels.map((channel) => (
                    <ChannelCard
                      key={channel.id}
                      channel={channel}
                      isActive={activeChannel?.id === channel.id}
                      onSelect={handleChannelSelect}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* TAB 3 & 4: MOVIES & SERIES (VOD HUB) */}
            {(activeTab === 'movies' || activeTab === 'series') && (
              <VodHub
                movieChannels={movieChannels}
                onSelectChannel={handleChannelSelect}
                activeChannelId={activeChannel?.id}
                onPlayVodItem={handlePlayVodItem}
              />
            )}

            {/* TAB 5: SPORTS */}
            {activeTab === 'sports' && (
              <section style={{ padding: '32px 48px' }}>
                <div className="section-header" style={{ marginBottom: '24px' }}>
                  <h2
                    style={{
                      fontSize: '1.8rem',
                      fontWeight: 800,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span style={{ color: 'var(--ssatv-red)' }}>●</span> Sukan
                    Langsung ({sportsChannels.length})
                  </h2>
                </div>
                <div className="channels-grid">
                  {sportsChannels.map((channel) => (
                    <ChannelCard
                      key={channel.id}
                      channel={channel}
                      isActive={activeChannel?.id === channel.id}
                      onSelect={handleChannelSelect}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* TAB 6: KIDS */}
            {activeTab === 'kids' && (
              <section style={{ padding: '32px 48px' }}>
                <div className="section-header" style={{ marginBottom: '24px' }}>
                  <h2
                    style={{
                      fontSize: '1.8rem',
                      fontWeight: 800,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span style={{ color: 'var(--ssatv-red)' }}>●</span> Kanak-Kanak
                    & Kartun ({kidsChannels.length})
                  </h2>
                </div>
                <div className="channels-grid">
                  {kidsChannels.map((channel) => (
                    <ChannelCard
                      key={channel.id}
                      channel={channel}
                      isActive={activeChannel?.id === channel.id}
                      onSelect={handleChannelSelect}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* TAB 7: SEARCH */}
            {activeTab === 'search' && (
              <SearchView
                channels={channels}
                onSelectChannel={handleChannelSelect}
                activeChannelId={activeChannel?.id}
                onPlayVodItem={handlePlayVodItem}
                initialQuery={searchQuery}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
