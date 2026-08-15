import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Channel } from './mockData';
import { VOD_CATALOG, type VodItem } from './vodData';
import { ChannelCard } from './ChannelCard';
import { VodCard } from './VodCard';
import { VodModal } from './VodModal';
import { 
  Search as SearchIcon, 
  X, 
  Tv, 
  Film, 
  Video, 
  TrendingUp, 
  Filter,
  Sparkles
} from 'lucide-react';

interface SearchViewProps {
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  activeChannelId?: string;
  onPlayVodItem: (item: VodItem, episodeNumber?: number) => void;
  initialQuery?: string;
}

export const SearchView: React.FC<SearchViewProps> = ({
  channels,
  onSelectChannel,
  activeChannelId,
  onPlayVodItem,
  initialQuery = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<'all' | 'channels' | 'movies' | 'series'>('all');
  const [activeModalItem, setActiveModalItem] = useState<VodItem | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'TV1',
    'Astro Arena',
    'Polis Evo 3',
    'High Council',
    'HBO',
    'Queen of Tears',
    'Sukan'
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
    inputRef.current?.focus();
  }, [initialQuery]);

  const trendingTags = [
    'TV1',
    'Bola 1',
    'Astro Arena',
    'HBO',
    'Polis Evo 3',
    'High Council',
    'Queen of Tears',
    'TV3 FHD',
    'Siar',
    'Dune',
    'Ejen Ali'
  ];

  const handleQueryChange = (q: string) => {
    setSearchQuery(q);
    if (q.trim().length > 2 && !recentSearches.includes(q.trim())) {
      setRecentSearches(prev => [q.trim(), ...prev.filter(s => s !== q.trim())].slice(0, 8));
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    inputRef.current?.focus();
  };

  const clearSearch = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  // Filter channels based on query
  const matchingChannels = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return channels.filter(ch => 
      ch.name.toLowerCase().includes(q) ||
      ch.description.toLowerCase().includes(q) ||
      ch.category.toLowerCase().includes(q)
    );
  }, [channels, searchQuery]);

  // Filter VOD items based on query
  const matchingVodItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return VOD_CATALOG.filter(item => 
      item.title.toLowerCase().includes(q) ||
      item.synopsis.toLowerCase().includes(q) ||
      item.genre.some(g => g.toLowerCase().includes(q)) ||
      item.cast.some(c => c.toLowerCase().includes(q)) ||
      (item.director && item.director.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Split VOD items into movies and series
  const matchingMovies = useMemo(() => matchingVodItems.filter(i => i.type === 'movie'), [matchingVodItems]);
  const matchingSeries = useMemo(() => matchingVodItems.filter(i => i.type === 'series'), [matchingVodItems]);

  const totalResults = matchingChannels.length + matchingVodItems.length;

  return (
    <div className="search-view-container">
      {/* Search Input Hero Box */}
      <div className="search-input-wrapper">
        <div className="search-input-box">
          <SearchIcon size={24} className="search-box-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-main-input"
            placeholder="Cari saluran TV (TV1, Arena, HBO), filem, siri drama, pelakon, atau genre..."
            value={searchQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={clearSearch} aria-label="Kosongkan carian">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Quick Filter Tags (if search query is active) */}
        {searchQuery.trim() && (
          <div className="search-filter-pills">
            <button 
              className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <Sparkles size={14} /> Semua ({totalResults})
            </button>
            <button 
              className={`filter-pill ${activeFilter === 'channels' ? 'active' : ''}`}
              onClick={() => setActiveFilter('channels')}
            >
              <Tv size={14} /> Saluran TV ({matchingChannels.length})
            </button>
            <button 
              className={`filter-pill ${activeFilter === 'movies' ? 'active' : ''}`}
              onClick={() => setActiveFilter('movies')}
            >
              <Film size={14} /> Filem VOD ({matchingMovies.length})
            </button>
            <button 
              className={`filter-pill ${activeFilter === 'series' ? 'active' : ''}`}
              onClick={() => setActiveFilter('series')}
            >
              <Video size={14} /> Siri Drama ({matchingSeries.length})
            </button>
          </div>
        )}
      </div>

      {/* When no query is entered: show Trending & Popular Searches */}
      {!searchQuery.trim() ? (
        <div className="search-suggestions-section">
          {/* Trending Searches */}
          <div className="suggestion-group">
            <div className="suggestion-title">
              <TrendingUp size={18} color="var(--accent-red)" />
              <span>Carian Popular & Trending</span>
            </div>
            <div className="suggestion-chips">
              {trendingTags.map((tag) => (
                <button
                  key={tag}
                  className="suggestion-chip"
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Categories Discovery */}
          <div className="suggestion-group" style={{ marginTop: '2.5rem' }}>
            <div className="suggestion-title">
              <Filter size={18} color="var(--accent-red)" />
              <span>Jelajah Mengikut Kategori</span>
            </div>
            <div className="suggestion-chips">
              {['Malaysia', 'Sukan FHD', 'Filem', 'Siri Drama Melayu', 'K-Drama', 'Anime', 'Berita', 'Kanak-Kanak'].map((cat) => (
                <button
                  key={cat}
                  className="suggestion-chip category-chip"
                  onClick={() => handleTagClick(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Highlights preview */}
          <div style={{ marginTop: '3rem' }}>
            <div className="section-header">
              <h3 className="section-title">
                <span style={{ color: 'var(--accent-red)' }}>•</span> Saluran TV Paling Banyak Ditonton
              </h3>
            </div>
            <div className="channels-scroll">
              {channels.slice(0, 8).map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  isActive={activeChannelId === channel.id}
                  onSelect={onSelectChannel}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Results Section */
        <div className="search-results-section">
          {totalResults === 0 ? (
            <div className="search-empty-state">
              <SearchIcon size={54} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: '1rem' }} />
              <h3>Tiada Hasil Dijumpai Untuk "{searchQuery}"</h3>
              <p>Cuba gunakan kata kunci yang berbeza atau pilih daripada carian popular di bawah:</p>
              <div className="suggestion-chips" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
                {trendingTags.slice(0, 6).map((tag) => (
                  <button
                    key={tag}
                    className="suggestion-chip"
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* 1. Live TV Channels Matching */}
              {(activeFilter === 'all' || activeFilter === 'channels') && matchingChannels.length > 0 && (
                <section className="search-results-group">
                  <div className="section-header">
                    <h3 className="section-title">
                      <Tv size={20} color="var(--accent-red)" style={{ marginRight: '8px' }} />
                      Saluran Siaran Langsung ({matchingChannels.length})
                    </h3>
                  </div>
                  <div className="channels-grid">
                    {matchingChannels.map((channel) => (
                      <ChannelCard
                        key={channel.id}
                        channel={channel}
                        isActive={activeChannelId === channel.id}
                        onSelect={onSelectChannel}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* 2. VOD Movies Matching */}
              {(activeFilter === 'all' || activeFilter === 'movies') && matchingMovies.length > 0 && (
                <section className="search-results-group" style={{ marginTop: '2.5rem' }}>
                  <div className="section-header">
                    <h3 className="section-title">
                      <Film size={20} color="var(--accent-red)" style={{ marginRight: '8px' }} />
                      Filem VOD ({matchingMovies.length})
                    </h3>
                  </div>
                  <div className="vod-cards-grid">
                    {matchingMovies.map((item) => (
                      <VodCard
                        key={item.id}
                        item={item}
                        onSelect={(vod) => setActiveModalItem(vod)}
                        onPlayDirect={(vod) => onPlayVodItem(vod)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* 3. VOD Series Matching */}
              {(activeFilter === 'all' || activeFilter === 'series') && matchingSeries.length > 0 && (
                <section className="search-results-group" style={{ marginTop: '2.5rem' }}>
                  <div className="section-header">
                    <h3 className="section-title">
                      <Video size={20} color="var(--accent-red)" style={{ marginRight: '8px' }} />
                      Siri Drama & Animasi ({matchingSeries.length})
                    </h3>
                  </div>
                  <div className="vod-cards-grid">
                    {matchingSeries.map((item) => (
                      <VodCard
                        key={item.id}
                        item={item}
                        onSelect={(vod) => setActiveModalItem(vod)}
                        onPlayDirect={(vod) => onPlayVodItem(vod)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* VOD Detail Modal */}
      <VodModal
        item={activeModalItem}
        onClose={() => setActiveModalItem(null)}
        onPlay={(item, episodeNumber) => {
          setActiveModalItem(null);
          onPlayVodItem(item, episodeNumber);
        }}
      />
    </div>
  );
};
