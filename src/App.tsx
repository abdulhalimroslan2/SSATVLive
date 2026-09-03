import { useEffect, useState } from 'react';
import type { Channel } from './mockData';
import { fetchChannels, CATEGORIES } from './mockData';
import { VOD_CATALOG, type VodItem } from './vodData';
import { APPLE_TOP_TV_SHOWS, APPLE_TOP_MOVIES } from './appleTvData';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { Player } from './Player';
import { ChannelCard } from './ChannelCard';
import { ChannelRow } from './ChannelRow';
import { TopTenRow, type TopTenItem } from './TopTenRow';
import { HeroBanner } from './HeroBanner';
import { ContinueWatching, type WatchingItem } from './ContinueWatching';
import { ApplePromoBanner } from './ApplePromoBanner';
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
      if (e.key === '/' && (document.activeElement?.tagName !== 'INPUT')) {
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
  const movieChannels = channels.filter(ch => ch.category === 'MOVIES');

  // Filter channels by active category
  const filteredChannels = activeCategory === 'all'
    ? channels
    : channels.filter(ch => ch.category.toLowerCase().replace(' ', '_') === activeCategory);

  // Group channels by category for grouped views
  const channelsByCategory = CATEGORIES.map(cat => ({
    ...cat,
    channels: channels.filter(ch => ch.category.toLowerCase().replace(' ', '_') === cat.id)
  })).filter(group => group.channels.length > 0);

  // Sports channels
  const sportsChannels = channels.filter(ch => 
    ch.category.toLowerCase().includes('sport') || ch.category === 'SPORTS_FHD'
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTopTenSelect = (item: TopTenItem) => {
    // Try to find matching VOD item in catalog
    const matched = VOD_CATALOG.find(v => 
      v.title.toLowerCase().includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(v.title.toLowerCase())
    );

    if (matched) {
      handlePlayVodItem(matched);
      return;
    }

    // Fallback to playing first available channel or movie in catalog
    if (VOD_CATALOG.length > 0) {
      const fallbackVod = VOD_CATALOG[0];
      const customChannel: Channel = {
        id: `top10_${item.id}_${Date.now()}`,
        contentId: item.id,
        name: `${item.name} (${item.genre})`,
        description: `Strim eksklusif Apple TV Originals - ${item.name}`,
        category: 'APPLE_ORIGINAL',
        thumbnail: item.poster,
        streamUrl: fallbackVod.streamUrl,
        clearKey: fallbackVod.clearKey,
        isFreeContent: true,
        isFreePreviewEnabledContent: true,
      };
      setActiveChannel(customChannel);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (channels.length > 0) {
      handleChannelSelect(channels[0]);
    }
  };

  const handleContinueWatchingSelect = (_item: WatchingItem) => {
    if (channels.length > 0 && !activeChannel) {
      setActiveChannel(channels[0]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWatchLiveHero = () => {
    // Prefer Astro Arena FHD or TV1
    const arena = channels.find(c => c.name.toLowerCase().includes('arena') || c.name.toLowerCase().includes('tv1'));
    if (arena) {
      handleChannelSelect(arena);
    } else if (channels.length > 0) {
      handleChannelSelect(channels[0]);
    }
  };

  // Map sidebar tabs
  const handleSidebarTab = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'search') {
      setActiveCategory('all');
    } else if (tab === 'store' || tab === 'movies' || tab === 'series') {
      setActiveCategory('vod');
    } else if (tab === 'sports') {
      setActiveCategory('sports_fhd');
    } else if (tab === 'appletv') {
      setActiveCategory('all');
    } else if (tab === 'home') {
      setActiveCategory('all');
    }
  };

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    if (catId === 'vod') {
      setActiveTab('store');
    } else if (catId === 'sports_fhd') {
      setActiveTab('sports');
    } else if (activeTab === 'search') {
      setActiveTab('home');
    }
  };

  const handleSearchTrigger = () => {
    setActiveTab('search');
  };

  const handleSearchQueryChange = (q: string) => {
    setSearchQuery(q);
    if (activeTab !== 'search') {
      setActiveTab('search');
    }
  };

  // Category pills for Apple TV top switcher
  const categoryPills = [
    { id: 'all', label: 'Semua' },
    { id: 'vod', label: '🎬 VOD Filem & Siri' },
    ...CATEGORIES.map(c => ({ id: c.id, label: c.label }))
  ];

  return (
    <div className="app-layout">
      {/* Apple TV macOS Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={handleSidebarTab} />

      <main className="main-wrapper">
        <TopNav
          activeCategory={activeCategory}
          setActiveCategory={handleCategoryChange}
          categories={categoryPills}
          searchQuery={searchQuery}
          onSearchInputClick={handleSearchTrigger}
          onSearchChange={handleSearchQueryChange}
        />

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '6rem', color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
            Memuatkan Saluran Apple TV & VOD...
          </div>
        ) : (
          <>
            {/* Active Video Player (Apple TV Floating Cinema View) */}
            {activeChannel && (
              <section style={{ marginBottom: '2.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '1rem',
                  padding: '0.5rem 0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '8px', 
                      background: 'var(--apple-blue)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px var(--apple-blue-glow)'
                    }}>
                      <Tv size={20} color="#fff" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px', margin: 0 }}>
                        {activeChannel.name}
                      </h2>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {activeChannel.description}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="channel-badge-live" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                      <span className="channel-live-dot"></span> SEDANG DIMAINKAN
                    </span>
                    <button 
                      className="apple-btn-glass"
                      style={{ padding: '6px 12px', borderRadius: '50%', minWidth: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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

            {/* TAB 1: SEARCH VIEW */}
            {activeTab === 'search' ? (
              <SearchView
                channels={channels}
                onSelectChannel={handleChannelSelect}
                activeChannelId={activeChannel?.id}
                onPlayVodItem={handlePlayVodItem}
                initialQuery={searchQuery}
              />
            ) : activeTab === 'store' || activeTab === 'movies' || activeTab === 'series' || activeCategory === 'vod' ? (
              /* TAB 2: STORE / VOD HUB (ALL MOVIES & SERIES) */
              <VodHub
                movieChannels={movieChannels}
                onSelectChannel={handleChannelSelect}
                activeChannelId={activeChannel?.id}
                onPlayVodItem={handlePlayVodItem}
              />
            ) : activeTab === 'sports' ? (
              /* TAB 3: MLS / SPORTS HUB */
              <section style={{ marginBottom: '3rem' }}>
                <div className="section-header">
                  <h3 className="section-title">
                    <span style={{ color: 'var(--apple-blue)' }}>•</span> MLS & Live Sports{' '}
                    <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                      ({sportsChannels.length} saluran)
                    </span>
                  </h3>
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
            ) : activeTab === 'appletv' ? (
              /* TAB 4: APPLE TV (ALL LIVE CHANNELS GUIDE) */
              <section style={{ marginBottom: '3rem' }}>
                <div className="section-header">
                  <h3 className="section-title">
                    <span style={{ color: 'var(--apple-blue)' }}>•</span> Live TV Channels{' '}
                    <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                      ({filteredChannels.length} saluran)
                    </span>
                  </h3>
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
            ) : (
              /* TAB 5: HOME (SIGNATURE APPLE TV EXPERIENCE) */
              <>
                {/* 1. Apple TV Billboard Hero Carousel */}
                <HeroBanner onWatchLive={handleWatchLiveHero} />

                {/* 2. Top 10 TV Shows (Screenshot 1 signature feature) */}
                <TopTenRow
                  title="Top 10 TV Shows"
                  items={APPLE_TOP_TV_SHOWS}
                  onSelect={handleTopTenSelect}
                  onViewAll={() => setActiveTab('series')}
                />

                {/* 3. Top 10 Movies (Screenshot 2 signature feature) */}
                <TopTenRow
                  title="Top 10 Movies"
                  items={APPLE_TOP_MOVIES}
                  onSelect={handleTopTenSelect}
                  onViewAll={() => setActiveTab('movies')}
                />

                {/* 4. Live TV Streaming Channels Row */}
                {channelsByCategory.length > 0 && (
                  <ChannelRow
                    label="Live TV Channels"
                    count={channelsByCategory[0].channels.length}
                    channels={channelsByCategory[0].channels.slice(0, 10)}
                    activeChannelId={activeChannel?.id}
                    onSelectChannel={handleChannelSelect}
                    onViewAll={() => setActiveTab('appletv')}
                  />
                )}

                {/* 5. Continue Watching */}
                <ContinueWatching onSelectItem={handleContinueWatchingSelect} />

                {/* 6. Apple TV Promo Card (Screenshot 2 bottom feature) */}
                <ApplePromoBanner onAction={handleWatchLiveHero} />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
