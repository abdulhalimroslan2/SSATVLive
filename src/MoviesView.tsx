import React, { useState } from 'react';
import { ChevronRight, Star } from 'lucide-react';
import type { VodItem } from './vodData';
import { VOD_CATALOG } from './vodData';
import { HeroExperience, type HeroSlide } from './HeroExperience';
import { getWidescreenBackdrop } from './ssatvHomeData';

interface MoviesViewProps {
  onPlayMovie: (item: VodItem) => void;
  onNavigateTab?: (tab: string) => void;
}

export const MoviesView: React.FC<MoviesViewProps> = ({ onPlayMovie }) => {
  const [activeGenre, setActiveGenre] = useState('ALL');

  // 1. Filter ALL real movies from VOD_CATALOG
  const realMovies = VOD_CATALOG.filter((v) => v.type === 'movie');

  // 2. Real Hero Featured Movies with verified Quickplay 16:9 backdrops
  const heroMovies = [
    realMovies.find((m) => m.id === 'vod_m_348') || realMovies[0], // Penunggu Istana
    realMovies.find((m) => m.id === 'vod_m_355') || realMovies[1], // Jangan Pandang Belakang Congkak
    realMovies.find((m) => m.id === 'vod_m_350') || realMovies[2], // The Night Owl
    realMovies.find((m) => m.id === 'vod_m_349') || realMovies[3], // Sleep
    realMovies.find((m) => m.id === 'vod_m_356') || realMovies[4], // JPBC 2
    realMovies.find((m) => m.id === 'vod_m_361') || realMovies[5], // Saranjana Kota Ghaib
  ].filter(Boolean) as VodItem[];

  const movieHeroSlides: HeroSlide[] = heroMovies.map((item, idx) => {
    const badges = [
      'FILEM BLOKBUSTER UTAMA',
      'KOMEDI SERAM POPULAR',
      'FILEM THRILLER MISTERI',
      'FILEM SUSPEN PSIKOLOGI',
      'SEKUEL KOMEDI BLOKBUSTER',
      'FILEM SERAM NUSANTARA',
    ];

    // Format title into 1 or 2 monumental lines
    const titleWords = item.title.toUpperCase().split(' ');
    let titleLines: string[] = [item.title.toUpperCase()];
    if (titleWords.length > 2) {
      const mid = Math.ceil(titleWords.length / 2);
      titleLines = [
        titleWords.slice(0, mid).join(' '),
        titleWords.slice(mid).join(' '),
      ];
    }

    return {
      id: item.id,
      badge: badges[idx % badges.length],
      titleLines,
      meta: `${item.year} • ${item.duration} • ${item.genre.join(' / ')} • ${item.rating}`,
      synopsis: item.synopsis,
      backdrop: getWidescreenBackdrop(item.backdrop, 1920),
      vodItem: item,
    };
  });

  // 3. Real Category / Genre Filter Pills
  const genres = [
    'ALL',
    'ACTION',
    'THRILLER',
    'SERAM',
    'KOMEDI',
    'DRAMA',
    'MISTERI',
    'MALAY',
  ];

  // Filtered movies if user selects a specific genre pill
  const filteredMovies =
    activeGenre === 'ALL'
      ? []
      : realMovies.filter((m) => {
          const gLow = activeGenre.toLowerCase();
          if (gLow === 'malay') return m.origin === 'malay';
          if (gLow === 'seram')
            return (
              m.genre.some((g) => g.toLowerCase().includes('seram') || g.toLowerCase().includes('horror')) ||
              m.title.toLowerCase().includes('dabbe') ||
              m.title.toLowerCase().includes('istana') ||
              m.title.toLowerCase().includes('lampir')
            );
          if (gLow === 'komedi')
            return (
              m.genre.some((g) => g.toLowerCase().includes('comed') || g.toLowerCase().includes('komedi')) ||
              m.title.toLowerCase().includes('congkak')
            );
          return m.genre.some((g) => g.toLowerCase().includes(gLow));
        });

  // 4. Real Rows (100% real items from VOD_CATALOG)
  const trendingMovies = realMovies.slice(0, 12);
  const newReleases = realMovies.slice(12, 24);
  const topRated = realMovies.slice(24, 36);
  const actionMovies = realMovies
    .filter((m) => m.genre.some((g) => g.toLowerCase().includes('action') || g.toLowerCase().includes('thriller')))
    .slice(0, 12);
  const horrorMovies = realMovies
    .filter(
      (m) =>
        m.genre.some((g) => g.toLowerCase().includes('seram') || g.toLowerCase().includes('horror')) ||
        m.title.toLowerCase().includes('dabbe') ||
        m.title.toLowerCase().includes('istana') ||
        m.title.toLowerCase().includes('lampir') ||
        m.title.toLowerCase().includes('sunti')
    )
    .slice(0, 12);
  const comedyMovies = realMovies
    .filter(
      (m) =>
        m.genre.some((g) => g.toLowerCase().includes('comed') || g.toLowerCase().includes('komedi')) ||
        m.title.toLowerCase().includes('congkak')
    )
    .slice(0, 12);

  // Helper for safe 16:9 backdrop url with poster fallback
  const getCardImage = (item: VodItem) => {
    return getWidescreenBackdrop(item.backdrop, 800) || item.poster;
  };

  return (
    <div className="ssatv-movies-view">
      {/* 1. CINEMATIC HERO EXPERIENCE (Apple TV/Netflix widescreen experience with real Quickplay backdrops) */}
      <HeroExperience
        slides={movieHeroSlides}
        onPlay={(slide) => {
          if (slide.vodItem) {
            onPlayMovie(slide.vodItem);
          }
        }}
      />

      {/* 2. BROWSE BY GENRE BAR */}
      <section className="ssatv-genre-browse-bar">
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
      </section>

      {/* 3. DYNAMIC CONTENT: EITHER GENRE FILTER GRID OR MULTI-ROW CATALOG */}
      <div className="ssatv-shelves-container" style={{ padding: '0 48px', paddingBottom: '64px' }}>
        {activeGenre !== 'ALL' ? (
          /* Filtered Genre Results Grid */
          <section className="ssatv-shelf-row-wrap" style={{ marginTop: '20px' }}>
            <div className="ssatv-row-header">
              <h2 className="ssatv-row-title">
                <span>Koleksi Filem {activeGenre} ({filteredMovies.length})</span>
              </h2>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '20px',
                marginTop: '16px',
              }}
            >
              {filteredMovies.map((item) => (
                <div
                  key={item.id}
                  className="ssatv-movie-card"
                  onClick={() => onPlayMovie(item)}
                >
                  <div className="ssatv-card-poster-wrap">
                    <img
                      src={getCardImage(item)}
                      alt={item.title}
                      className="ssatv-card-img"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = item.poster;
                      }}
                    />
                    <div className="ssatv-card-gradient" />
                    <div className="ssatv-card-overlaid-meta">
                      <div className="ssatv-card-overlaid-title">{item.title}</div>
                      <div className="ssatv-card-overlaid-sub">
                        {item.year} • {item.genre[0] || 'Movie'} • {item.rating}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          /* Default Full Rows (100% Real VOD Catalog) */
          <>
            {/* ROW 1: TRENDING MOVIES (FILEM PILIHAN SEBENAR) */}
            <section className="ssatv-shelf-row-wrap">
              <div className="ssatv-row-header">
                <h2 className="ssatv-row-title">
                  <span>Trending Movies</span>
                  <ChevronRight size={18} className="ssatv-row-chevron" />
                </h2>
              </div>

              <div className="ssatv-cards-track">
                {trendingMovies.map((item) => (
                  <div
                    key={item.id}
                    className="ssatv-movie-card"
                    onClick={() => onPlayMovie(item)}
                  >
                    <div className="ssatv-card-poster-wrap">
                      <img
                        src={getCardImage(item)}
                        alt={item.title}
                        className="ssatv-card-img"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = item.poster;
                        }}
                      />
                      <div className="ssatv-card-gradient" />
                      <div className="ssatv-card-overlaid-meta">
                        <div className="ssatv-card-overlaid-title">{item.title}</div>
                        <div className="ssatv-card-overlaid-sub">
                          {item.year} • {item.genre[0] || 'Movie'} • {item.rating}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ROW 2: NEW RELEASES (FILEM BAHARU DITAMBAH DENGAN BADGE RED NEW) */}
            <section className="ssatv-shelf-row-wrap">
              <div className="ssatv-row-header">
                <h2 className="ssatv-row-title">
                  <span>New Releases</span>
                  <ChevronRight size={18} className="ssatv-row-chevron" />
                </h2>
              </div>

              <div className="ssatv-cards-track">
                {newReleases.map((item) => (
                  <div
                    key={item.id}
                    className="ssatv-movie-card"
                    onClick={() => onPlayMovie(item)}
                  >
                    <div className="ssatv-card-poster-wrap">
                      <span className="ssatv-badge-new">NEW</span>
                      <img
                        src={getCardImage(item)}
                        alt={item.title}
                        className="ssatv-card-img"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = item.poster;
                        }}
                      />
                      <div className="ssatv-card-gradient" />
                      <div className="ssatv-card-overlaid-meta">
                        <div className="ssatv-card-overlaid-title">{item.title}</div>
                        <div className="ssatv-card-overlaid-sub">
                          {item.year} • {item.genre[0] || 'Movie'} • {item.rating}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ROW 3: TOP RATED (PENILAIAN TERTINGGI DENGAN BADGE BINTANG) */}
            <section className="ssatv-shelf-row-wrap">
              <div className="ssatv-row-header">
                <h2 className="ssatv-row-title">
                  <span>Top Rated</span>
                  <ChevronRight size={18} className="ssatv-row-chevron" />
                </h2>
              </div>

              <div className="ssatv-cards-track">
                {topRated.map((item) => (
                  <div
                    key={item.id}
                    className="ssatv-movie-card"
                    onClick={() => onPlayMovie(item)}
                  >
                    <div className="ssatv-card-poster-wrap">
                      <div className="ssatv-badge-rating">
                        <Star size={11} fill="#ffb800" color="#ffb800" />
                        <span>{item.rating}</span>
                      </div>
                      <img
                        src={getCardImage(item)}
                        alt={item.title}
                        className="ssatv-card-img"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = item.poster;
                        }}
                      />
                      <div className="ssatv-card-gradient" />
                      <div className="ssatv-card-overlaid-meta">
                        <div className="ssatv-card-overlaid-title">{item.title}</div>
                        <div className="ssatv-card-overlaid-sub">
                          {item.year} • {item.genre[0] || 'Movie'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ROW 4: SERAM & MISTERI (HORROR COLLECTION) */}
            <section className="ssatv-shelf-row-wrap">
              <div className="ssatv-row-header">
                <h2 className="ssatv-row-title">
                  <span>Seram & Misteri</span>
                  <ChevronRight size={18} className="ssatv-row-chevron" />
                </h2>
              </div>

              <div className="ssatv-cards-track">
                {horrorMovies.map((item) => (
                  <div
                    key={item.id}
                    className="ssatv-movie-card"
                    onClick={() => onPlayMovie(item)}
                  >
                    <div className="ssatv-card-poster-wrap">
                      <img
                        src={getCardImage(item)}
                        alt={item.title}
                        className="ssatv-card-img"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = item.poster;
                        }}
                      />
                      <div className="ssatv-card-gradient" />
                      <div className="ssatv-card-overlaid-meta">
                        <div className="ssatv-card-overlaid-title">{item.title}</div>
                        <div className="ssatv-card-overlaid-sub">
                          {item.year} • {item.genre[0] || 'Seram'} • {item.rating}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ROW 5: AKSI & DEBARAN (ACTION & THRILLER) */}
            <section className="ssatv-shelf-row-wrap">
              <div className="ssatv-row-header">
                <h2 className="ssatv-row-title">
                  <span>Aksi & Debaran</span>
                  <ChevronRight size={18} className="ssatv-row-chevron" />
                </h2>
              </div>

              <div className="ssatv-cards-track">
                {actionMovies.map((item) => (
                  <div
                    key={item.id}
                    className="ssatv-movie-card"
                    onClick={() => onPlayMovie(item)}
                  >
                    <div className="ssatv-card-poster-wrap">
                      <img
                        src={getCardImage(item)}
                        alt={item.title}
                        className="ssatv-card-img"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = item.poster;
                        }}
                      />
                      <div className="ssatv-card-gradient" />
                      <div className="ssatv-card-overlaid-meta">
                        <div className="ssatv-card-overlaid-title">{item.title}</div>
                        <div className="ssatv-card-overlaid-sub">
                          {item.year} • {item.genre[0] || 'Action'} • {item.rating}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ROW 6: KOMEDI & SANTAI (COMEDY) */}
            <section className="ssatv-shelf-row-wrap">
              <div className="ssatv-row-header">
                <h2 className="ssatv-row-title">
                  <span>Komedi & Santai</span>
                  <ChevronRight size={18} className="ssatv-row-chevron" />
                </h2>
              </div>

              <div className="ssatv-cards-track">
                {comedyMovies.map((item) => (
                  <div
                    key={item.id}
                    className="ssatv-movie-card"
                    onClick={() => onPlayMovie(item)}
                  >
                    <div className="ssatv-card-poster-wrap">
                      <img
                        src={getCardImage(item)}
                        alt={item.title}
                        className="ssatv-card-img"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = item.poster;
                        }}
                      />
                      <div className="ssatv-card-gradient" />
                      <div className="ssatv-card-overlaid-meta">
                        <div className="ssatv-card-overlaid-title">{item.title}</div>
                        <div className="ssatv-card-overlaid-sub">
                          {item.year} • {item.genre[0] || 'Komedi'} • {item.rating}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
