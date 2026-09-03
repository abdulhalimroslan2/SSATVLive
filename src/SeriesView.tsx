import React, { useState } from 'react';
import { Play, Plus, Check, ChevronRight } from 'lucide-react';
import type { VodItem } from './vodData';
import { VOD_CATALOG } from './vodData';

interface SeriesViewProps {
  onPlayEpisode: (item: VodItem, episodeNumber?: number) => void;
  onNavigateTab?: (tab: string) => void;
}

export const SeriesView: React.FC<SeriesViewProps> = ({
  onPlayEpisode,
}) => {
  const [inList, setInList] = useState(false);
  const [activeGenre, setActiveGenre] = useState('ALL');
  const [heroIndex, setHeroIndex] = useState(0);

  // Real Series from VOD Catalog
  const realSeries = VOD_CATALOG.filter((v) => v.type === 'series');

  // Hero Featured Series matching ref_series.png
  const heroSlides = [
    {
      id: 'series_last_horizon',
      badge: 'FEATURED SERIES',
      title: 'THE LAST\nHORIZON',
      meta: 'Season 3 • 8 Episodes • Sci-Fi • Drama • 16+',
      synopsis:
        "Humanity's search for a new world begins beyond the edge of the known universe as the expedition faces unexpected frontiers.",
      backdrop:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1920',
      vodItem: realSeries[0] || VOD_CATALOG[0],
    },
    {
      id: 'series_600_kolong',
      badge: 'POPULAR SERIES',
      title: '600\nKOLONG',
      meta: 'Season 1 • 20 Episodes • Drama • Aksi • 16+',
      synopsis:
        'Kisah perjuangan, dendam, dan persaudaraan di sebalik lorong hitam bandar raya metropolis.',
      backdrop:
        'https://image-resizer-cloud-cdn.api.tmcms.quickplay.com/image/93AE763A-FE75-4089-9A0F-C99BD9517590/0-2x3.jpg?width=1200',
      vodItem:
        realSeries.find((s) => s.id === 'vod_s_351') ||
        realSeries[1] ||
        VOD_CATALOG[0],
    },
  ];

  const currentHero = heroSlides[heroIndex];

  // Continue Watching items from reference image 1:1
  const continueWatchingItems = [
    {
      id: 'cw_1',
      code: 'S03 E05',
      title: 'The Final Signal',
      duration: '48 min',
      progress: 68,
      backdrop:
        'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[0] || VOD_CATALOG[0],
    },
    {
      id: 'cw_2',
      code: 'S02 E08',
      title: 'Echoes of Tomorrow',
      duration: '45 min',
      progress: 32,
      backdrop:
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[1] || VOD_CATALOG[0],
    },
    {
      id: 'cw_3',
      code: 'S03 E03',
      title: 'Into the Void',
      duration: '47 min',
      progress: 85,
      backdrop:
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[2] || VOD_CATALOG[0],
    },
    {
      id: 'cw_4',
      code: 'S03 E02',
      title: 'New Earth Protocol',
      duration: '46 min',
      progress: 50,
      backdrop:
        'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[3] || VOD_CATALOG[0],
    },
    {
      id: 'cw_5',
      code: 'S01 E10',
      title: 'Beyond the Stars',
      duration: '44 min',
      progress: 90,
      backdrop:
        'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[4] || VOD_CATALOG[0],
    },
  ];

  // New Series row
  const newSeries = [
    {
      id: 'ns_1',
      title: 'FALLEN EMPIRE',
      meta: 'Season 1 • Sci-Fi • Drama',
      backdrop:
        'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[0] || VOD_CATALOG[0],
    },
    {
      id: 'ns_2',
      title: 'THE EXILES',
      meta: 'Season 1 • Action • Adventure',
      backdrop:
        'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[1] || VOD_CATALOG[0],
    },
    {
      id: 'ns_3',
      title: 'BEYOND ORBIT',
      meta: 'Season 1 • Sci-Fi • Thriller',
      backdrop:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[2] || VOD_CATALOG[0],
    },
    {
      id: 'ns_4',
      title: 'SHADOW STATE',
      meta: 'Season 1 • Thriller • Crime',
      backdrop:
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[3] || VOD_CATALOG[0],
    },
    {
      id: 'ns_5',
      title: 'THE LONG NIGHT',
      meta: 'Season 1 • Drama • Mystery',
      backdrop:
        'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[4] || VOD_CATALOG[0],
    },
    {
      id: 'ns_6',
      title: 'COLD HARBOR',
      meta: 'Season 1 • Crime • Drama',
      backdrop:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[5] || VOD_CATALOG[0],
    },
  ];

  // Popular Series
  const popularSeries = [
    {
      id: 'ps_1',
      title: 'BREAK POINT',
      meta: 'Season 2 • Drama • Sports',
      backdrop:
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[6] || VOD_CATALOG[0],
    },
    {
      id: 'ps_2',
      title: 'THE WATCHERS',
      meta: 'Season 1 • Thriller • Mystery',
      backdrop:
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[7] || VOD_CATALOG[0],
    },
    {
      id: 'ps_3',
      title: 'MINDHUNTERS',
      meta: 'Season 2 • Crime • Drama',
      backdrop:
        'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[8] || VOD_CATALOG[0],
    },
    {
      id: 'ps_4',
      title: 'ROGUE CITY',
      meta: 'Season 1 • Action • Crime',
      backdrop:
        'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[9] || VOD_CATALOG[0],
    },
  ];

  // Trending Now Series
  const trendingSeries = [
    {
      id: 'ts_1',
      title: 'THE LAST HORIZON',
      meta: 'Season 3 • Sci-Fi • Drama',
      backdrop:
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[0] || VOD_CATALOG[0],
    },
    {
      id: 'ts_2',
      title: 'NEON DREAMS',
      meta: 'Season 1 • Sci-Fi • Thriller',
      backdrop:
        'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[1] || VOD_CATALOG[0],
    },
    {
      id: 'ts_3',
      title: 'THE SILENT TRUTH',
      meta: 'Season 1 • Crime • Mystery',
      backdrop:
        'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[2] || VOD_CATALOG[0],
    },
    {
      id: 'ts_4',
      title: 'OUTER REACH',
      meta: 'Season 2 • Sci-Fi • Adventure',
      backdrop:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[3] || VOD_CATALOG[0],
    },
    {
      id: 'ts_5',
      title: 'CRITICAL ZONE',
      meta: 'Season 1 • Action • Thriller',
      backdrop:
        'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[4] || VOD_CATALOG[0],
    },
    {
      id: 'ts_6',
      title: 'THE INVASION',
      meta: 'Season 1 • Sci-Fi • Drama',
      backdrop:
        'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&q=80&w=800',
      vod: realSeries[5] || VOD_CATALOG[0],
    },
  ];

  // Genres from reference image
  const genres = [
    'ALL',
    'DRAMA',
    'COMEDY',
    'THRILLER',
    'SCI-FI',
    'CRIME',
    'ACTION',
    'DOCUMENTARY',
    'FAMILY',
    'KIDS',
  ];

  return (
    <div className="ssatv-series-view">
      {/* 1. HERO FEATURED SERIES BANNER */}
      <section className="ssatv-hero-banner" style={{ minHeight: '560px' }}>
        <div
          className="ssatv-hero-backdrop"
          style={{ backgroundImage: `url(${currentHero.backdrop})` }}
        />
        <div className="ssatv-hero-gradient-overlay" />

        <div className="ssatv-hero-content-wrap">
          <div className="ssatv-hero-badge">{currentHero.badge}</div>

          <h1 className="ssatv-hero-title">
            {currentHero.title.split('\n').map((line, i) => (
              <span key={i} className="ssatv-hero-title-line">
                {line}
              </span>
            ))}
          </h1>

          <div className="ssatv-hero-meta">
            <span className="ssatv-meta-text">{currentHero.meta}</span>
          </div>

          <p className="ssatv-hero-synopsis">{currentHero.synopsis}</p>

          <div className="ssatv-hero-actions">
            <button
              className="ssatv-btn-watch"
              onClick={() => onPlayEpisode(currentHero.vodItem)}
            >
              <Play size={19} fill="#000" color="#000" />
              <span>CONTINUE WATCHING</span>
            </button>

            <button
              className={`ssatv-btn-list ${inList ? 'in-list' : ''}`}
              onClick={() => setInList(!inList)}
            >
              {inList ? (
                <>
                  <Check size={18} color="#ff2a4b" />
                  <span>IN MY LIST</span>
                </>
              ) : (
                <>
                  <Plus size={18} />
                  <span>MY LIST</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="ssatv-hero-pagination">
          {heroSlides.map((slide, idx) => (
            <button
              key={slide.id}
              className={`ssatv-page-dot ${idx === heroIndex ? 'active' : ''}`}
              onClick={() => setHeroIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 2. CONTINUE WATCHING (With Red Progress Bar) */}
      <section className="ssatv-shelf-row-wrap" style={{ padding: '0 48px', marginTop: '24px' }}>
        <div className="ssatv-row-header">
          <h2 className="ssatv-row-title">
            <span>Continue Watching</span>
            <ChevronRight size={18} className="ssatv-row-chevron" />
          </h2>
        </div>

        <div className="ssatv-cards-track">
          {continueWatchingItems.map((item) => (
            <div
              key={item.id}
              className="ssatv-continue-card"
              onClick={() => onPlayEpisode(item.vod)}
            >
              <div className="ssatv-card-poster-wrap">
                <img
                  src={item.backdrop}
                  alt={item.title}
                  className="ssatv-card-img"
                  loading="lazy"
                />
                <div className="ssatv-card-gradient" />

                <div className="ssatv-card-overlaid-meta">
                  <div className="ssatv-cw-code">{item.code}</div>
                  <div className="ssatv-card-overlaid-title">{item.title}</div>
                  <div className="ssatv-cw-duration">{item.duration}</div>
                </div>

                {/* Red Progress Bar along bottom edge */}
                <div className="ssatv-cw-progress-bar">
                  <div
                    className="ssatv-cw-progress-fill"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. NEW SERIES & POPULAR SERIES */}
      <div className="ssatv-series-dual-row" style={{ padding: '0 48px', marginTop: '40px' }}>
        {/* Left: New Series */}
        <div className="ssatv-series-section-left">
          <div className="ssatv-row-header">
            <h2 className="ssatv-row-title">
              <span>New Series</span>
              <ChevronRight size={18} className="ssatv-row-chevron" />
            </h2>
          </div>

          <div className="ssatv-cards-track">
            {newSeries.map((item) => (
              <div
                key={item.id}
                className="ssatv-movie-card"
                onClick={() => onPlayEpisode(item.vod)}
              >
                <div className="ssatv-card-poster-wrap">
                  <span className="ssatv-badge-new">NEW</span>
                  <img
                    src={item.backdrop}
                    alt={item.title}
                    className="ssatv-card-img"
                    loading="lazy"
                  />
                  <div className="ssatv-card-gradient" />

                  <div className="ssatv-card-overlaid-meta">
                    <div className="ssatv-card-overlaid-title">
                      {item.title}
                    </div>
                    <div className="ssatv-card-overlaid-sub">{item.meta}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Popular Series */}
        <div className="ssatv-series-section-right" style={{ marginTop: '36px' }}>
          <div className="ssatv-row-header">
            <h2 className="ssatv-row-title">
              <span>Popular Series</span>
              <ChevronRight size={18} className="ssatv-row-chevron" />
            </h2>
          </div>

          <div className="ssatv-cards-track">
            {popularSeries.map((item) => (
              <div
                key={item.id}
                className="ssatv-movie-card"
                onClick={() => onPlayEpisode(item.vod)}
              >
                <div className="ssatv-card-poster-wrap">
                  <img
                    src={item.backdrop}
                    alt={item.title}
                    className="ssatv-card-img"
                    loading="lazy"
                  />
                  <div className="ssatv-card-gradient" />

                  <div className="ssatv-card-overlaid-meta">
                    <div className="ssatv-card-overlaid-title">
                      {item.title}
                    </div>
                    <div className="ssatv-card-overlaid-sub">{item.meta}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. TRENDING NOW & BROWSE BY GENRE */}
      <div style={{ padding: '0 48px', marginTop: '40px' }}>
        <div className="ssatv-row-header">
          <h2 className="ssatv-row-title">
            <span>Trending Now</span>
            <ChevronRight size={18} className="ssatv-row-chevron" />
          </h2>
        </div>

        <div className="ssatv-cards-track">
          {trendingSeries.map((item) => (
            <div
              key={item.id}
              className="ssatv-movie-card"
              onClick={() => onPlayEpisode(item.vod)}
            >
              <div className="ssatv-card-poster-wrap">
                <img
                  src={item.backdrop}
                  alt={item.title}
                  className="ssatv-card-img"
                  loading="lazy"
                />
                <div className="ssatv-card-gradient" />

                <div className="ssatv-card-overlaid-meta">
                  <div className="ssatv-card-overlaid-title">
                    {item.title}
                  </div>
                  <div className="ssatv-card-overlaid-sub">{item.meta}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Browse by Genre Bar */}
        <div className="ssatv-genre-browse-bar" style={{ marginTop: '36px', padding: 0 }}>
          <div className="ssatv-genre-browse-title">Browse by Genre</div>
          <div className="ssatv-genre-pills-scroll">
            {genres.map((g) => (
              <button
                key={g}
                className={`ssatv-genre-text-pill ${
                  activeGenre === g ? 'active' : ''
                }`}
                onClick={() => setActiveGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. GENRE SHELVES (DRAMA & SCI-FI FROM REAL CATALOG) */}
      <div style={{ padding: '0 48px', marginTop: '36px', paddingBottom: '64px' }}>
        <section className="ssatv-shelf-row-wrap">
          <div className="ssatv-row-header">
            <h2 className="ssatv-row-title">
              <span>Drama Series</span>
              <ChevronRight size={18} className="ssatv-row-chevron" />
            </h2>
          </div>

          <div className="ssatv-cards-track">
            {realSeries.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="ssatv-movie-card"
                onClick={() => onPlayEpisode(item)}
              >
                <div className="ssatv-card-poster-wrap">
                  <img
                    src={item.poster || item.backdrop}
                    alt={item.title}
                    className="ssatv-card-img"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800';
                    }}
                  />
                  <div className="ssatv-card-gradient" />

                  <div className="ssatv-card-overlaid-meta">
                    <div className="ssatv-card-overlaid-title">
                      {item.title}
                    </div>
                    <div className="ssatv-card-overlaid-sub">
                      {item.year} • {item.episodes?.length || 1} Episod
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
