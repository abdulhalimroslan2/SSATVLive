import React, { useState, useMemo } from 'react';
import { ChevronRight, Star, Search, Film } from 'lucide-react';
import type { VodItem } from './vodData';
import { VOD_CATALOG } from './vodData';
import { HeroExperience, type HeroSlide } from './HeroExperience';
import { getWidescreenBackdrop } from './ssatvHomeData';

interface MoviesViewProps {
  onPlayMovie: (item: VodItem) => void;
  onNavigateTab?: (tab: string) => void;
}

// Exact Movie Categories from SSATVLive_Plus_v6 (1).apk (with horror purged)
export const APK_MOVIE_CATEGORIES = [
  { id: 'SEMUA', label: 'Semua Koleksi' },
  { id: 'HBO MAX', label: 'HBO MAX', desc: 'Filem Blokbuster Antarabangsa & Hollywood' },
  { id: 'VOD MALAY', label: 'VOD MALAY', desc: 'Koleksi Filem Melayu Tempatan' },
  { id: 'VOD UNIFI', label: 'VOD UNIFI', desc: 'Filem Terpilih Unifi' },
  { id: 'VOD TONTON', label: 'VOD TONTON', desc: 'Koleksi Filem Pawagam Tonton' },
  { id: 'VOD VIU', label: 'VOD VIU', desc: 'Filem Viu & Asia Terhangat' },
  { id: 'VOD BOLLYWOOD', label: 'VOD BOLLYWOOD', desc: 'Filem Bollywood & Hindi Pilihan' },
  { id: 'VOD ZEE5', label: 'VOD ZEE5', desc: 'Pawagam Zee5 & Hiburan India' },
  { id: 'OLD CHINESE', label: 'OLD CHINESE', desc: 'Filem Klasik Pawagam Cina' },
];

export const MoviesView: React.FC<MoviesViewProps> = ({ onPlayMovie }) => {
  const [activeCategory, setActiveCategory] = useState('SEMUA');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  // 1. Filter ALL real movies from clean VOD_CATALOG
  const allMovies = useMemo(
    () => VOD_CATALOG.filter((v) => v.type === 'movie'),
    []
  );

  // 2. Real Hero Featured Movies (Top non-horror blockbusters)
  const heroMovies = useMemo(() => {
    return [
      allMovies.find((m) => m.title.includes('KL Special Force')) || allMovies[0],
      allMovies.find((m) => m.title.includes('The Night Owl')) || allMovies[1],
      allMovies.find((m) => m.title.includes('Dune: Part Two')) || allMovies[2],
      allMovies.find((m) => m.title.includes('Oppenheimer')) || allMovies[3],
      allMovies.find((m) => m.title.includes('Khiladi 786')) || allMovies[4],
      allMovies.find((m) => m.title.includes('Desolasi')) || allMovies[5],
    ].filter(Boolean) as VodItem[];
  }, [allMovies]);

  const movieHeroSlides: HeroSlide[] = heroMovies.map((item, idx) => {
    const badges = [
      'AKSI BLOKBUSTER UTAMA',
      'THRILLER SEJARAH TERBAIK',
      'KARYA AGUNG SCI-FI',
      'FILEM ANUGERAH OSCAR',
      'AKSI KOMEDI BOLLYWOOD',
      'SAINS FIKSYEN FALSAFAH',
    ];

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
      backdrop: getWidescreenBackdrop(item.backdrop || item.poster, 1920),
      vodItem: item,
    };
  });

  // Group movies by exact APK Category
  const moviesByCategory = useMemo(() => {
    const map: Record<string, VodItem[]> = {};
    APK_MOVIE_CATEGORIES.filter((c) => c.id !== 'SEMUA').forEach((cat) => {
      map[cat.id] = allMovies.filter((m) => m.apkCategory === cat.id);
    });
    return map;
  }, [allMovies]);

  // Filtered movies when a specific category is active
  const activeCategoryList = useMemo(() => {
    if (activeCategory === 'SEMUA') return [];
    let list = moviesByCategory[activeCategory] || [];
    if (categorySearchQuery.trim()) {
      const q = categorySearchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.genre.some((g) => g.toLowerCase().includes(q)) ||
          m.year.toString().includes(q)
      );
    }
    return list;
  }, [activeCategory, moviesByCategory, categorySearchQuery]);

  const getCardImage = (item: VodItem) => {
    return getWidescreenBackdrop(item.backdrop, 800) || item.poster;
  };

  return (
    <div className="ssatv-movies-view">
      {/* 1. CINEMATIC HERO EXPERIENCE */}
      <HeroExperience
        slides={movieHeroSlides}
        onPlay={(slide) => {
          if (slide.vodItem) {
            onPlayMovie(slide.vodItem);
          }
        }}
      />

      {/* 2. CATEGORY PILLS BAR (Matching SSATVLive_Plus_v6 (1).apk 1:1) */}
      <section className="ssatv-genre-browse-bar">
        <div className="ssatv-genre-browse-title">Kategori Filem (APK)</div>
        <div className="ssatv-genre-pills-scroll">
          {APK_MOVIE_CATEGORIES.map((cat) => {
            const count =
              cat.id === 'SEMUA'
                ? allMovies.length
                : (moviesByCategory[cat.id] || []).length;
            return (
              <button
                key={cat.id}
                className={`ssatv-genre-text-pill ${
                  activeCategory === cat.id ? 'active' : ''
                }`}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setCategorySearchQuery('');
                }}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. DYNAMIC CONTENT: SPECIFIC CATEGORY GRID OR ALL CATEGORY ROWS */}
      <div className="ssatv-shelves-container">
        {activeCategory !== 'SEMUA' ? (
          /* SPECIFIC APK CATEGORY GRID VIEW */
          <section className="ssatv-shelf-row-wrap" style={{ marginTop: '24px' }}>
            <div className="ssatv-row-header ssatv-cat-header-wrap">
              <div>
                <h2 className="ssatv-row-title" style={{ margin: 0 }}>
                  <span>
                    {activeCategory} ({activeCategoryList.length} Filem)
                  </span>
                </h2>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    margin: '4px 0 0 0',
                  }}
                >
                  {
                    APK_MOVIE_CATEGORIES.find((c) => c.id === activeCategory)
                      ?.desc
                  }
                </p>
              </div>

              {/* In-category search */}
              <div className="ssatv-category-search-box">
                <Search size={16} color="var(--text-secondary)" style={{ marginRight: '8px', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder={`Cari dalam ${activeCategory}...`}
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="ssatv-category-search-input"
                />
              </div>
            </div>

            {activeCategoryList.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: 'var(--text-secondary)',
                }}
              >
                <Film size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <p>Tiada filem dijumpai untuk carian &quot;{categorySearchQuery}&quot;.</p>
              </div>
            ) : (
              <div className="ssatv-vod-grid">
                {activeCategoryList.map((item) => (
                  <div
                    key={item.id}
                    className="ssatv-movie-card"
                    onClick={() => onPlayMovie(item)}
                    style={{ cursor: 'pointer' }}
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
                        <div className="ssatv-card-overlaid-title">
                          {item.title}
                        </div>
                        <div className="ssatv-card-overlaid-sub">
                          {item.year} • {item.genre[0] || 'Movie'} • {item.quality}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          /* ALL CATEGORIES IN APK ORDER */
          <>
            {APK_MOVIE_CATEGORIES.filter((c) => c.id !== 'SEMUA').map((cat) => {
              const catMovies = moviesByCategory[cat.id] || [];
              if (catMovies.length === 0) return null;

              return (
                <section key={cat.id} className="ssatv-shelf-row-wrap">
                  <div className="ssatv-row-header">
                    <h2
                      className="ssatv-row-title"
                      onClick={() => setActiveCategory(cat.id)}
                      style={{ cursor: 'pointer' }}
                      title={`Buka semua filem dalam ${cat.label}`}
                    >
                      <span>
                        {cat.label}{' '}
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginLeft: '8px',
                          }}
                        >
                          ({catMovies.length} Filem)
                        </span>
                      </span>
                      <ChevronRight size={18} className="ssatv-row-chevron" />
                    </h2>
                    <button
                      className="ssatv-see-all-btn"
                      onClick={() => setActiveCategory(cat.id)}
                    >
                      Lihat Semua ({catMovies.length})
                    </button>
                  </div>

                  <div className="ssatv-cards-track">
                    {catMovies.slice(0, 16).map((item) => (
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
                            <div className="ssatv-card-overlaid-title">
                              {item.title}
                            </div>
                            <div className="ssatv-card-overlaid-sub">
                              {item.year} • {item.genre[0] || 'Movie'} •{' '}
                              {item.quality}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
