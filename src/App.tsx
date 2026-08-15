import { useEffect, useState } from 'react';
import type { Channel } from './mockData';
import { fetchChannels, CATEGORIES } from './mockData';
import { type VodItem } from './vodData';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { Player } from './Player';
import { ChannelCard } from './ChannelCard';
import { ChannelRow } from './ChannelRow';
import { ContinueWatching, type WatchingItem } from './ContinueWatching';
import { VodHub } from './VodHub';
import { SearchView } from './SearchView';

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

  // Group channels by category for the "home" view
  const channelsByCategory = CATEGORIES.map(cat => ({
    ...cat,
    channels: channels.filter(ch => ch.category.toLowerCase().replace(' ', '_') === cat.id)
  })).filter(group => group.channels.length > 0);

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

  const handleContinueWatchingSelect = (_item: WatchingItem) => {
    if (channels.length > 0 && !activeChannel) {
      setActiveChannel(channels[0]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Map sidebar tabs
  const handleSidebarTab = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'search') {
      setActiveCategory('all');
    } else if (tab === 'vod' || tab === 'movies' || tab === 'series') {
      setActiveCategory('vod');
    } else {
      const tabToCat: Record<string, string> = {
        'home': 'all',
        'livetv': 'all',
        'sports': 'sports_fhd',
        'kids': 'kids',
      };
      if (tabToCat[tab] !== undefined) {
        setActiveCategory(tabToCat[tab]);
      }
    }
  };

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    if (catId === 'vod') {
      setActiveTab('vod');
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

  // Build category pills for TopNav
  const categoryPills = [
    { id: 'all', label: 'Semua' },
    { id: 'vod', label: '🎬 VOD Filem & Siri' },
    ...CATEGORIES.map(c => ({ id: c.id, label: c.label }))
  ];

  return (
    <div className="app-layout">
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
            Memuatkan Saluran TV & VOD...
          </div>
        ) : (
          <>
            {/* Active Video Player */}
            {activeChannel && (
              <section style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.2rem' }}>{activeChannel.name}</h2>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {activeChannel.description}
                    </span>
                  </div>
                  <span className="badge-live">
                    <span className="badge-live-dot"></span> SEDANG DIMAINKAN
                  </span>
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
            ) : activeTab === 'vod' || activeTab === 'movies' || activeTab === 'series' || activeCategory === 'vod' ? (
              /* TAB 2: VOD HUB (ALL MOVIES & SERIES) */
              <VodHub
                movieChannels={movieChannels}
                onSelectChannel={handleChannelSelect}
                activeChannelId={activeChannel?.id}
                onPlayVodItem={handlePlayVodItem}
              />
            ) : (
              /* TAB 3: HOME & LIVE TV VIEW */
              <>
                {/* Category-filtered view OR grouped home view */}
                {activeCategory !== 'all' ? (
                  /* Single category view */
                  <section style={{ marginBottom: '3rem' }}>
                    <div className="section-header">
                      <h3 className="section-title">
                        <span style={{ color: 'var(--accent-red)' }}>•</span>{' '}
                        {categoryPills.find(c => c.id === activeCategory)?.label || 'Saluran'}{' '}
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
                  /* Home: show all categories grouped */
                  <>
                    {channelsByCategory.map((group) => (
                      <ChannelRow
                        key={group.id}
                        label={group.label}
                        count={group.channels.length}
                        channels={group.channels}
                        activeChannelId={activeChannel?.id}
                        onSelectChannel={handleChannelSelect}
                        onViewAll={() => handleCategoryChange(group.id)}
                      />
                    ))}
                  </>
                )}

                {/* Continue Watching */}
                {activeCategory === 'all' && (
                  <ContinueWatching onSelectItem={handleContinueWatchingSelect} />
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
