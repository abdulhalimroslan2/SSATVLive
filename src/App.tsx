import { useEffect, useState, useMemo } from 'react';
import type { Channel } from './mockData';
import { fetchChannels } from './mockData';
import { VOD_CATALOG, type VodItem } from './vodData';
import { Header } from './Header';
import { HeroExperience, type HeroSlide } from './HeroExperience';
import { ContinueWatchingRow, type ContinueItem } from './ContinueWatchingRow';
import { TopTenRow, type TopTenItem } from './TopTenRow';
import { APPLE_TOP_TV_SHOWS, APPLE_TOP_MOVIES } from './appleTvData';
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
import { MobileBottomNav } from './MobileBottomNav';
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
    setActiveTab('live');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      if (video) {
        video.muted = false;
        video.volume = 1;
        video.play().catch(() => {});
      }
    }, 100);
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

    const targetTab = item.type === 'movie' ? 'movies' : 'series';
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
    setActiveTab(targetTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      if (video) {
        video.muted = false;
        video.volume = 1;
        video.play().catch(() => {});
      }
    }, 100);
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

  // Top 10 card selection handler
  const handleTopTenSelect = (item: TopTenItem) => {
    const matched = VOD_CATALOG.find(
      (v) =>
        v.id === item.id ||
        v.title.toLowerCase().includes(item.name.toLowerCase()) ||
        item.name.toLowerCase().includes(v.title.toLowerCase())
    );
    if (matched) {
      handlePlayVodItem(matched);
    } else {
      const isMovie = item.id.startsWith('mov_');
      const vodChannel: Channel = {
        id: `top10_${item.id}_${Date.now()}`,
        contentId: item.id,
        name: `${item.name} (${isMovie ? 'Filem' : 'Siri TV'})`,
        description: `Top 10 ${isMovie ? 'Filem' : 'Siri TV'} di SSATV+`,
        category: isMovie ? 'MOVIES' : 'SERIES',
        thumbnail: item.poster,
        streamUrl: 'https://linearjitp-playback.astro.com.my/dash-live/sladashenc/live_ch_031_0201.mpd',
        clearKey: '37dc9fa47a61d1ea02ba691515efb1fa:6a35a6439eb4c489ab577b319163e77f',
        isFreeContent: true,
        isFreePreviewEnabledContent: true,
      };
      setActiveChannel(vodChannel);
      setActiveTab(isMovie ? 'movies' : 'series');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // When switching tabs (e.g. from Live TV to Movies), immediately stop any active playback
    setActiveChannel(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="ssatv-app-shell">
      {/* 0. APPLE TV LEFT SIDEBAR (Matching ref_movies & ref_series 1:1) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSearchClick={() => {
          setSearchQuery('');
          handleTabChange('search');
        }}
      />

      <div className="ssatv-app-main-viewport">
        {/* 1. SSATV+ TOP NAVIGATION HEADER */}
        <Header
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onSearchClick={() => {
            setSearchQuery('');
            handleTabChange('search');
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
            {/* Active Video Player Cinema View (Shown ONLY in Movies & Series sections when user explicitly plays a VOD item) */}
            {activeChannel && (activeTab === 'movies' || activeTab === 'series') && activeChannel.id.startsWith('vod_') && (
              <section className="ssatv-active-cinema-section">
                <div className="ssatv-active-cinema-header">
                  <div className="ssatv-active-cinema-info">
                    <div className="ssatv-active-cinema-badge">
                      <Tv size={20} color="#fff" />
                    </div>
                    <div>
                      <h2 className="ssatv-active-cinema-title">
                        {activeChannel.name}
                      </h2>
                      <span className="ssatv-active-cinema-desc">
                        {activeChannel.description}
                      </span>
                    </div>
                  </div>

                  <div className="ssatv-active-cinema-actions">
                    <button
                      className="ssatv-scroll-btn ssatv-active-cinema-close-btn"
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

                    {/* 2. Top 10 TV Shows (Apple TV Authentic IMG_5147) */}
                    <TopTenRow
                      title="Top 10 TV Shows"
                      items={APPLE_TOP_TV_SHOWS}
                      onSelect={handleTopTenSelect}
                      onViewAll={() => setActiveTab('series')}
                    />

                    {/* 3. Top 10 Movies (Apple TV Authentic IMG_5147) */}
                    <TopTenRow
                      title="Top 10 Movies"
                      items={APPLE_TOP_MOVIES}
                      onSelect={handleTopTenSelect}
                      onViewAll={() => setActiveTab('movies')}
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
                      onViewAll={() => handleTabChange('series')}
                    />
                  </div>

                  {/* Right Column: Live Now Rail (Real Live TV Channels) */}
                  <LiveNowSidebar
                    items={liveRailItems}
                    onSelect={handleLiveRailSelect}
                    onViewAll={() => handleTabChange('live')}
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
                onBack={() => handleTabChange('home')}
              />
            )}

            {/* TAB 3: MOVIES (Matching ref_movies.png 1:1) */}
            {activeTab === 'movies' && (
              <MoviesView
                onPlayMovie={handlePlayVodItem}
                onNavigateTab={handleTabChange}
              />
            )}

            {/* TAB 4: TV SERIES (Matching ref_series.png 1:1) */}
            {activeTab === 'series' && (
              <SeriesView
                onPlayEpisode={(item, ep) => handlePlayVodItem(item, ep)}
                onNavigateTab={handleTabChange}
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

      {/* MOBILE BOTTOM NAVIGATION DOCK (Effortless Navigation on iPhone / Android) */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}

export default App;
