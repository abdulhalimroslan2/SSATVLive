import React, { useState, useMemo } from 'react';
import { ChevronRight, Search, Layers } from 'lucide-react';
import type { VodItem } from './vodData';
import { VOD_CATALOG } from './vodData';
import { HeroExperience, type HeroSlide } from './HeroExperience';
import { getWidescreenBackdrop } from './ssatvHomeData';

interface SeriesViewProps {
  onPlayEpisode: (item: VodItem, episodeNumber?: number) => void;
  onNavigateTab?: (tab: string) => void;
}

// Exact Series Categories from SSATVLive_Plus_v6 (1).apk
export const APK_SERIES_CATEGORIES = [
  { id: 'SEMUA', label: 'Semua Siri' },
  { id: 'MALAY SERIES', label: 'MALAY SERIES', desc: 'Drama & Siri Tempatan Pilihan Paling Hangat' },
  { id: 'TONTON SERIES', label: 'TONTON SERIES', desc: 'Koleksi Siri Eksklusif Tonton & TV3' },
  { id: 'VIU MALAY', label: 'VIU MALAY', desc: 'Drama Premium Viu Malaysia' },
  { id: 'VIU KOREA', label: 'VIU KOREA', desc: 'K-Drama Hit & Siri Korea Pilihan Viu' },
  { id: 'MALAY VARIETY', label: 'MALAY VARIETY', desc: 'Rancangan Hiburan, Realiti & Komedi' },
  { id: 'OTHERS SERIES', label: 'OTHERS SERIES', desc: 'Siri Fenomena Antarabangsa' },
];

export const SeriesView: React.FC<SeriesViewProps> = ({ onPlayEpisode }) => {
  const [activeCategory, setActiveCategory] = useState('SEMUA');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  // 1. Filter ALL real TV series from clean VOD_CATALOG
  const allSeries = useMemo(
    () => VOD_CATALOG.filter((v) => v.type === 'series'),
    []
  );

  // 2. Real Hero Featured Series (Top non-horror series)
  const heroSeriesList = useMemo(() => {
    return [
      allSeries.find((s) => s.title.includes('Bulan Henti Bicara')) || allSeries[0],
      allSeries.find((s) => s.title.includes('Dia Imamku')) || allSeries[1],
      allSeries.find((s) => s.title.includes('One Cent Thief')) || allSeries[2],
      allSeries.find((s) => s.title.includes('Taxi Driver')) || allSeries[3],
      allSeries.find((s) => s.title.includes('Aku Bukan Ustazah')) || allSeries[4],
      allSeries.find((s) => s.title.includes('Gegar Vaganza 12')) || allSeries[5],
    ].filter(Boolean) as VodItem[];
  }, [allSeries]);

  const seriesHeroSlides: HeroSlide[] = heroSeriesList.map((item, idx) => {
    const badges = [
      'SIRI DRAMA ASTRO MELETOP',
      'SIRI FENOMENA MELAYU',
      'SIRI HEIST PREMIUM ASTRO',
      'K-DRAMA AKSI POPULAR',
      'DRAMA RATING TERTINGGI TONTON',
      'PENTAS HIBURAN MEGA',
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
      meta: `${item.year} • Musim 1 • ${item.episodes?.length || 20} Episod • ${item.genre.join(' / ')} • ${item.rating}`,
      synopsis:
        item.synopsis ||
        'Kisah suka duka, pengorbanan dan konflik percintaan yang mendalam lakonan bintang-bintang terkemuka tanah air.',
      backdrop: getWidescreenBackdrop(item.backdrop || item.poster, 1920),
      vodItem: item,
    };
  });

  // Group series by exact APK Category
  const seriesByCategory = useMemo(() => {
    const map: Record<string, VodItem[]> = {};
    APK_SERIES_CATEGORIES.filter((c) => c.id !== 'SEMUA').forEach((cat) => {
      map[cat.id] = allSeries.filter((s) => s.apkCategory === cat.id);
    });
    return map;
  }, [allSeries]);

  // Filtered series when a specific category is active
  const activeCategoryList = useMemo(() => {
    if (activeCategory === 'SEMUA') return [];
    let list = seriesByCategory[activeCategory] || [];
    if (categorySearchQuery.trim()) {
      const q = categorySearchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.genre.some((g) => g.toLowerCase().includes(q)) ||
          s.year.toString().includes(q)
      );
    }
    return list;
  }, [activeCategory, seriesByCategory, categorySearchQuery]);

  const getCardImage = (item: VodItem) => {
    return getWidescreenBackdrop(item.backdrop, 800) || item.poster;
  };

  return (
    <div className="ssatv-series-view">
      {/* 1. CINEMATIC HERO SERIES BANNER */}
      <HeroExperience
        slides={seriesHeroSlides}
        onPlay={(slide) => {
          if (slide.vodItem) {
            onPlayEpisode(slide.vodItem);
          }
        }}
      />

      {/* 2. CATEGORY PILLS BAR (Matching SSATVLive_Plus_v6 (1).apk 1:1) */}
      <section className="ssatv-genre-browse-bar">
        <div className="ssatv-genre-browse-title">Kategori Siri Drama (APK)</div>
        <div className="ssatv-genre-pills-scroll">
          {APK_SERIES_CATEGORIES.map((cat) => {
            const count =
              cat.id === 'SEMUA'
                ? allSeries.length
                : (seriesByCategory[cat.id] || []).length;
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
                    {activeCategory} ({activeCategoryList.length} Siri)
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
                    APK_SERIES_CATEGORIES.find((c) => c.id === activeCategory)
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
                <Layers size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <p>Tiada siri dijumpai untuk carian &quot;{categorySearchQuery}&quot;.</p>
              </div>
            ) : (
              <div className="ssatv-vod-grid">
                {activeCategoryList.map((item) => (
                  <div
                    key={item.id}
                    className="ssatv-series-card"
                    onClick={() => onPlayEpisode(item)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="ssatv-card-poster-wrap">
                      <div className="ssatv-badge-episode">
                        {item.episodes?.length || 20} EPISOD
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
                          {item.year} • {item.episodes?.length || 20} Ep • {item.rating}
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
            {APK_SERIES_CATEGORIES.filter((c) => c.id !== 'SEMUA').map((cat) => {
              const catSeries = seriesByCategory[cat.id] || [];
              if (catSeries.length === 0) return null;

              return (
                <section key={cat.id} className="ssatv-shelf-row-wrap">
                  <div className="ssatv-row-header">
                    <h2
                      className="ssatv-row-title"
                      onClick={() => setActiveCategory(cat.id)}
                      style={{ cursor: 'pointer' }}
                      title={`Buka semua siri dalam ${cat.label}`}
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
                          ({catSeries.length} Siri)
                        </span>
                      </span>
                      <ChevronRight size={18} className="ssatv-row-chevron" />
                    </h2>
                    <button
                      className="ssatv-see-all-btn"
                      onClick={() => setActiveCategory(cat.id)}
                    >
                      Lihat Semua ({catSeries.length})
                    </button>
                  </div>

                  <div className="ssatv-cards-track">
                    {catSeries.slice(0, 14).map((item) => (
                      <div
                        key={item.id}
                        className="ssatv-series-card"
                        onClick={() => onPlayEpisode(item)}
                      >
                        <div className="ssatv-card-poster-wrap">
                          <div className="ssatv-badge-episode">
                            {item.episodes?.length || 20} EPISOD
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
                              {item.year} • {item.genre[0] || 'Drama'} •{' '}
                              {item.rating}
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
