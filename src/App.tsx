import { useEffect, useState } from 'react';
import type { Channel } from './mockData';
import { fetchChannels, CATEGORIES } from './mockData';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { HeroBanner } from './HeroBanner';
import { Player } from './Player';
import { ChannelCard } from './ChannelCard';
import { ContinueWatching, type WatchingItem } from './ContinueWatching';
import { ChevronRight } from 'lucide-react';

function App() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    setIsLoading(true);
    const data = await fetchChannels();
    setChannels(data);
    setIsLoading(false);
  };

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

  const handleWatchLiveHero = () => {
    const sportsCh = channels.find(c => c.category === 'SPORTS FHD');
    if (sportsCh) {
      setActiveChannel(sportsCh);
    } else if (channels.length > 0) {
      setActiveChannel(channels[0]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinueWatchingSelect = (_item: WatchingItem) => {
    if (channels.length > 0 && !activeChannel) {
      setActiveChannel(channels[0]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Map sidebar tabs to categories
  const handleSidebarTab = (tab: string) => {
    setActiveTab(tab);
    const tabToCat: Record<string, string> = {
      'home': 'all',
      'livetv': 'all',
      'sports': 'sports_fhd',
      'movies': 'movies',
      'kids': 'kids',
    };
    if (tabToCat[tab] !== undefined) {
      setActiveCategory(tabToCat[tab]);
    }
  };

  // Build category pills for TopNav
  const categoryPills = [
    { id: 'all', label: 'Semua' },
    ...CATEGORIES.map(c => ({ id: c.id, label: c.label }))
  ];

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={handleSidebarTab} />

      <main className="main-wrapper">
        <TopNav
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          categories={categoryPills}
        />

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '6rem', color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
            Memuatkan Saluran TV...
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
                    <span className="badge-live-dot"></span> LIVE
                  </span>
                </div>
                <Player key={activeChannel.contentId} channel={activeChannel} />
              </section>
            )}

            {/* Hero Banner (home view only) */}
            {activeTab === 'home' && activeCategory === 'all' && (
              <HeroBanner onWatchLive={handleWatchLiveHero} />
            )}

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
              channelsByCategory.map((group) => (
                <section key={group.id} style={{ marginBottom: '2.5rem' }}>
                  <div className="section-header">
                    <h3 className="section-title">
                      <span style={{ color: 'var(--accent-red)' }}>•</span>{' '}
                      {group.label}{' '}
                      <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                        ({group.channels.length})
                      </span>
                    </h3>
                    <span
                      className="section-link"
                      onClick={() => setActiveCategory(group.id)}
                    >
                      Lihat Semua <ChevronRight size={16} />
                    </span>
                  </div>
                  <div className="channels-scroll">
                    {group.channels.slice(0, 8).map((channel) => (
                      <ChannelCard
                        key={channel.id}
                        channel={channel}
                        isActive={activeChannel?.id === channel.id}
                        onSelect={handleChannelSelect}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}

            {/* Continue Watching */}
            {activeCategory === 'all' && (
              <ContinueWatching onSelectItem={handleContinueWatchingSelect} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
