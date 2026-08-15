import React, { useState, useMemo } from 'react';
import type { Channel } from './mockData';
import { VOD_CATALOG, VOD_GENRES, type VodItem } from './vodData';
import { VodCard } from './VodCard';
import { VodModal } from './VodModal';
import { ChannelCard } from './ChannelCard';
import { Play, Sparkles, Film, Video, Tv, Flame, Star, Filter } from 'lucide-react';

interface VodHubProps {
  movieChannels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  activeChannelId?: string;
  onPlayVodItem: (item: VodItem, episodeNumber?: number) => void;
}

export const VodHub: React.FC<VodHubProps> = ({
  movieChannels,
  onSelectChannel,
  activeChannelId,
  onPlayVodItem,
}) => {
  const [selectedType, setSelectedType] = useState<'all' | 'movie' | 'series' | 'channels'>('all');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedOrigin, setSelectedOrigin] = useState<'all' | 'malay' | 'hollywood' | 'korean' | 'anime'>('all');
  const [activeModalItem, setActiveModalItem] = useState<VodItem | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Hero Item (Featured Trending Item)
  const heroItem = useMemo(() => {
    return VOD_CATALOG.find(item => item.isTrending) || VOD_CATALOG[0];
  }, []);

  // Filtered VOD Catalog
  const filteredCatalog = useMemo(() => {
    return VOD_CATALOG.filter(item => {
      // Filter by Type
      if (selectedType === 'movie' && item.type !== 'movie') return false;
      if (selectedType === 'series' && item.type !== 'series') return false;

      // Filter by Origin
      if (selectedOrigin !== 'all' && item.origin !== selectedOrigin) return false;

      // Filter by Genre
      if (selectedGenre !== 'all') {
        const matchGenre = item.genre.some(
          g => g.toLowerCase().includes(selectedGenre.toLowerCase())
        );
        if (!matchGenre) return false;
      }

      return true;
    });
  }, [selectedType, selectedGenre, selectedOrigin]);

  const toggleBookmark = (item: VodItem) => {
    setBookmarkedIds(prev => 
      prev.includes(item.id) 
        ? prev.filter(id => id !== item.id)
        : [...prev, item.id]
    );
  };

  return (
    <div className="vod-hub-container">
      {/* VOD Hero Featured Banner */}
      {selectedType !== 'channels' && heroItem && (
        <section 
          className="vod-hero-banner"
          style={{ backgroundImage: `url(${heroItem.backdrop || heroItem.poster})` }}
        >
          <div className="vod-hero-overlay" />
          <div className="vod-hero-content">
            <div className="vod-hero-badge">
              <Flame size={16} fill="var(--accent-red)" color="var(--accent-red)" />
              <span>PILIHAN UTAMA VOD MINGGU INI</span>
            </div>

            <h1 className="vod-hero-title">{heroItem.title}</h1>

            <div className="vod-hero-meta">
              <span className="vod-rating-highlight">
                <Star size={14} fill="#ffb800" color="#ffb800" />
                {heroItem.rating}
              </span>
              <span>{heroItem.year}</span>
              <span>{heroItem.duration}</span>
              <span className="vod-badge-quality">{heroItem.quality}</span>
              <span className="vod-badge-age">{heroItem.ageRating}</span>
              <span className="vod-hero-genres">{heroItem.genre.join(' • ')}</span>
            </div>

            <p className="vod-hero-synopsis">{heroItem.synopsis}</p>

            <div className="vod-hero-actions">
              <button 
                className="btn-red"
                onClick={() => onPlayVodItem(heroItem)}
              >
                <Play size={18} fill="#fff" /> Tonton Sekarang
              </button>
              <button 
                className="btn-secondary"
                onClick={() => setActiveModalItem(heroItem)}
              >
                Maklumat Lanjut
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Main Filter Navigation Bar */}
      <div className="vod-filter-bar">
        {/* Type Tabs */}
        <div className="vod-type-tabs">
          <button 
            className={`vod-type-btn ${selectedType === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedType('all')}
          >
            <Sparkles size={16} /> Semua VOD ({VOD_CATALOG.length})
          </button>
          <button 
            className={`vod-type-btn ${selectedType === 'movie' ? 'active' : ''}`}
            onClick={() => setSelectedType('movie')}
          >
            <Film size={16} /> Filem ({VOD_CATALOG.filter(i => i.type === 'movie').length})
          </button>
          <button 
            className={`vod-type-btn ${selectedType === 'series' ? 'active' : ''}`}
            onClick={() => setSelectedType('series')}
          >
            <Video size={16} /> Siri Drama ({VOD_CATALOG.filter(i => i.type === 'series').length})
          </button>
          <button 
            className={`vod-type-btn ${selectedType === 'channels' ? 'active' : ''}`}
            onClick={() => setSelectedType('channels')}
          >
            <Tv size={16} /> Saluran Filem Live ({movieChannels.length})
          </button>
        </div>

        {/* Origin / Language Chips (if not looking at channels only) */}
        {selectedType !== 'channels' && (
          <div className="vod-origin-chips">
            <button 
              className={`chip-btn ${selectedOrigin === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedOrigin('all')}
            >
              Semua Bahasa
            </button>
            <button 
              className={`chip-btn ${selectedOrigin === 'malay' ? 'active' : ''}`}
              onClick={() => setSelectedOrigin('malay')}
            >
              🇲🇾 Melayu / Tempatan
            </button>
            <button 
              className={`chip-btn ${selectedOrigin === 'hollywood' ? 'active' : ''}`}
              onClick={() => setSelectedOrigin('hollywood')}
            >
              🎬 Hollywood
            </button>
            <button 
              className={`chip-btn ${selectedOrigin === 'korean' ? 'active' : ''}`}
              onClick={() => setSelectedOrigin('korean')}
            >
              🇰🇷 K-Drama
            </button>
            <button 
              className={`chip-btn ${selectedOrigin === 'anime' ? 'active' : ''}`}
              onClick={() => setSelectedOrigin('anime')}
            >
              🇯🇵 Anime & Kanak-Kanak
            </button>
          </div>
        )}
      </div>

      {/* Genre Filter Scrollable Bar */}
      {selectedType !== 'channels' && (
        <div className="vod-genre-filter-row">
          <span className="genre-label"><Filter size={14} /> Genre:</span>
          <div className="vod-genre-chips">
            {VOD_GENRES.map((g) => (
              <button
                key={g.id}
                className={`genre-chip ${selectedGenre === g.id ? 'active' : ''}`}
                onClick={() => setSelectedGenre(g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Display */}
      {selectedType === 'channels' ? (
        /* Movie Live Channels Section */
        <section className="vod-content-section">
          <div className="section-header">
            <h3 className="section-title">
              <span style={{ color: 'var(--accent-red)' }}>•</span> Saluran Filem Siaran Langsung
              <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                {' '}({movieChannels.length} Saluran)
              </span>
            </h3>
          </div>
          <div className="channels-grid">
            {movieChannels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                isActive={activeChannelId === channel.id}
                onSelect={onSelectChannel}
              />
            ))}
          </div>
        </section>
      ) : (
        /* VOD Catalog Grid */
        <section className="vod-content-section">
          <div className="section-header">
            <h3 className="section-title">
              <span style={{ color: 'var(--accent-red)' }}>•</span>{' '}
              {selectedType === 'movie' ? 'Katalog Filem' : 
               selectedType === 'series' ? 'Katalog Siri Drama' : 'Katalog Penuh VOD'}
              <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                {' '}({filteredCatalog.length} Tajuk)
              </span>
            </h3>
          </div>

          {filteredCatalog.length > 0 ? (
            <div className="vod-cards-grid">
              {filteredCatalog.map((item) => (
                <VodCard
                  key={item.id}
                  item={item}
                  onSelect={(vod) => setActiveModalItem(vod)}
                  onPlayDirect={(vod) => onPlayVodItem(vod)}
                  isBookmarked={bookmarkedIds.includes(item.id)}
                  onToggleBookmark={toggleBookmark}
                />
              ))}
            </div>
          ) : (
            <div className="vod-empty-state">
              <Film size={48} color="var(--text-secondary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
              <h4>Tiada Kandungan Dijumpai</h4>
              <p>Tiada filem atau siri drama untuk kombinasi penapis yang dipilih.</p>
              <button 
                className="btn-red"
                style={{ marginTop: '1rem' }}
                onClick={() => {
                  setSelectedType('all');
                  setSelectedGenre('all');
                  setSelectedOrigin('all');
                }}
              >
                Reset Semua Penapis
              </button>
            </div>
          )}

          {/* Quick Access to Live Movie Channels Carousel */}
          {selectedType === 'all' && movieChannels.length > 0 && (
            <div style={{ marginTop: '3.5rem' }}>
              <div className="section-header">
                <h3 className="section-title">
                  <span style={{ color: 'var(--accent-red)' }}>•</span> Saluran Filem Live Pilihan (HBO, Siar, Degup, Cinemax)
                </h3>
                <span 
                  className="section-link"
                  onClick={() => setSelectedType('channels')}
                >
                  Lihat Semua Saluran ({movieChannels.length})
                </span>
              </div>
              <div className="channels-scroll">
                {movieChannels.slice(0, 10).map((ch) => (
                  <ChannelCard
                    key={ch.id}
                    channel={ch}
                    isActive={activeChannelId === ch.id}
                    onSelect={onSelectChannel}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* VOD Detail & Episode Modal */}
      <VodModal
        item={activeModalItem}
        onClose={() => setActiveModalItem(null)}
        onPlay={(item, episodeNumber) => {
          setActiveModalItem(null);
          onPlayVodItem(item, episodeNumber);
        }}
        isBookmarked={activeModalItem ? bookmarkedIds.includes(activeModalItem.id) : false}
        onToggleBookmark={toggleBookmark}
      />
    </div>
  );
};
