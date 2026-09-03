import { useEffect, useState, useMemo } from 'react';
import type { Channel } from './mockData';
import { fetchChannels } from './mockData';
import { VOD_CATALOG, type VodItem } from './vodData';
import { Header } from './Header';
import { HeroExperience, type HeroSlide } from './HeroExperience';
import { ContinueWatchingRow, type ContinueItem } from './ContinueWatchingRow';
import { ShelfRow, type TrendingItem } from './TrendingGrid';
import { LiveNowSidebar, type LiveRailItem } from './LiveNowSidebar';
import {
  getRealHeroSlides,
  getRealContinueWatching,
  getRealTrendingNow,
  getRealNewReleases,
  getRealLiveRail,
} from './ssatvHomeData';
import { Player } from './Player';
import { ChannelCard } from './ChannelCard';
import { SearchView } from './SearchView';
import { LiveTvView } from './LiveTvView';
import { MoviesView } from './MoviesView';
import { SeriesView } from './SeriesView';
import { Sidebar } from './Sidebar';
import { X, Tv } from 'lucide-react';

function App() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [activeTab, setActiveTab] = useState('home');
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

  // Dynamically compute real synchronized Home items from real catalog and channels
  const heroSlides = useMemo(() => getRealHeroSlides(channels), [channels]);
  const continueItems = useMemo(() => getRealContinueWatching(), []);
  const trendingItems = useMemo(() => getRealTrendingNow(), []);
  const newReleasesItems = useMemo(() => getRealNewReleases(), []);
  const liveRailItems = useMemo(() => getRealLiveRail(channels), [channels]);

  // Hero "WATCH NOW" handler
  const handleHeroPlay = (slide: HeroSlide) => {
    if (slide.vodItem) {
      handlePlayVodItem(slide.vodItem);
      return;
    }
    if (slide.channelId) {
      const chId = slide.channelId.toLowerCase();
      const targetCh = channels.find(
        (c) =>
          c.id.toLowerCase() === chId ||
          c.ch_number?.toLowerCase() === chId ||
          c.name.toLowerCase().includes(chId)
      );
      if (targetCh) {
        handleChannelSelect(targetCh);
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
    if (item.vodItem) {
      handlePlayVodItem(item.vodItem, item.episodeNumber || 1);
      return;
    }
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
    if (item.vodItem) {
      handlePlayVodItem(item.vodItem);
      return;
    }
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
    if (item.channel) {
      handleChannelSelect(item.channel);
      return;
    }
    const targetCh = channels.find(
      (c) =>
        c.name.toLowerCase().includes(item.name.toLowerCase()) ||
        c.id === item.id ||
        (item.name.includes('HBO') && (c.id === 'hbo' || c.ch_number === '411'))
    );

    if (targetCh) {
      handleChannelSelect(targetCh);
    } else if (channels.length > 0) {
      handleChannelSelect(channels[0]);
    }
  };

  // Recommended For You items mapped from catalog
  const recommendedItems: TrendingItem[] = VOD_CATALOG.slice(18, 26).map(
    (v, idx) => ({
      id: `rec_${idx}`,
      title: v.title.replace(/^\d+\s*/, '').toUpperCase(),
      genre: v.genre?.[0] ? `${v.genre[0]} Movie` : 'Pilihan Astro',
      poster: v.poster,
      vodItem: v,
    })
  );

  return (
    <div className="ssatv-app-shell">
      {/* 0. APPLE TV LEFT SIDEBAR (Matching ref_movies & ref_series 1:1) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onSearchClick={() => {
          setSearchQuery('');
          setActiveTab('search');
        }}
      />

      <div className="ssatv-app-main-viewport">
        {/* 1. SSATV+ TOP NAVIGATION HEADER */}
        <Header
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
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
            {/* Active Video Player Cinema View (Shown outside Live TV view) */}
            {activeChannel && activeTab !== 'live' && (
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
                {/* A. Hero Experience (Synchronized with Real VOD & Live TV) */}
                <HeroExperience
                  slides={heroSlides}
                  onPlay={handleHeroPlay}
                />

                {/* B. Two-Column Home Layout: Main Shelves + Right Live Now Rail */}
                <div className="ssatv-home-layout">
                  {/* Left Column: Shelves */}
                  <div className="ssatv-main-shelves">
                    {/* 1. Continue Watching (Real Catalog Items) */}
                    <ContinueWatchingRow
                      items={continueItems}
                      onSelect={handleContinueItemSelect}
                    />

                    {/* 2. Trending Now (Real Movies from Catalog) */}
                    <ShelfRow
                      title="Trending Now"
                      items={trendingItems}
                      variant="stylized-title"
                      onSelect={handleTrendingSelect}
                      onViewAll={() => setActiveTab('movies')}
                    />

                    {/* 3. New Releases (Real Catalog Releases) */}
                    <ShelfRow
                      title="New Releases"
                      items={newReleasesItems}
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

                  {/* Right Column: Live Now Rail (Real Live TV Channels) */}
                  <LiveNowSidebar
                    items={liveRailItems}
                    onSelect={handleLiveRailSelect}
                    onViewAll={() => setActiveTab('live')}
                  />
                </div>
              </>
            )}

            {/* TAB 2: LIVE TV EXPERIENCE (Matching reference design 1:1) */}
            {activeTab === 'live' && (
              <LiveTvView
                channels={channels}
                activeChannel={activeChannel}
                onSelectChannel={handleChannelSelect}
              />
            )}

            {/* TAB 3: MOVIES (Matching ref_movies.png 1:1) */}
            {activeTab === 'movies' && (
              <MoviesView
                onPlayMovie={handlePlayVodItem}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {/* TAB 4: TV SERIES (Matching ref_series.png 1:1) */}
            {activeTab === 'series' && (
              <SeriesView
                onPlayEpisode={(item, ep) => handlePlayVodItem(item, ep)}
                onNavigateTab={(tab) => setActiveTab(tab)}
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
    </div>
  );
}

export default App;
