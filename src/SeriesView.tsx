import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { VodItem } from './vodData';
import { VOD_CATALOG } from './vodData';
import { HeroExperience, type HeroSlide } from './HeroExperience';

interface SeriesViewProps {
  onPlayEpisode: (item: VodItem, episodeNumber?: number) => void;
  onNavigateTab?: (tab: string) => void;
}

export const SeriesView: React.FC<SeriesViewProps> = ({ onPlayEpisode }) => {
  const [activeGenre, setActiveGenre] = useState('ALL');

  // 1. Filter ALL real TV series from VOD_CATALOG
  const realSeries = VOD_CATALOG.filter((v) => v.type === 'series');

  // 2. Real Hero Featured Series matching real Astro / local series catalog
  const heroSeriesList = [
    realSeries.find((s) => s.id === 'vod_s_001') || realSeries[0], // Bulan Henti Bicara
    realSeries.find((s) => s.id === 'vod_s_003') || realSeries[1], // Kasih Yang Terkorban
    realSeries.find((s) => s.id === 'vod_s_004') || realSeries[2], // Wish List
    realSeries.find((s) => s.id === 'vod_s_005') || realSeries[3], // Ikatan Terlarang
    realSeries.find((s) => s.id === 'vod_s_009') || realSeries[4], // Dendam Seorang Mentua
    realSeries.find((s) => s.id === 'vod_s_006') || realSeries[5], // Jutawan Express 2
  ].filter(Boolean) as VodItem[];

  const seriesHeroSlides: HeroSlide[] = heroSeriesList.map((item, idx) => {
    const badges = [
      'SIRI DRAMA POPULAR',
      'SIRI MELETOP ASTRO',
      'SIRI KOMEDI ROMANTIK',
      'SIRI DRAMA SUSPEN',
      'SIRI THRILLER KELUARGA',
      'SIRI AKSI KOMEDI',
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
      backdrop: item.backdrop || item.poster,
      vodItem: item,
    };
  });

  // 3. Real Category / Genre Filter Pills
  const genres = [
    'ALL',
    'DRAMA',
    'ROMANCE',
    'THRILLER',
    'KOMEDI',
    'MISTERI',
    'FAMILY',
  ];

  // Filtered series if user selects a specific genre pill
  const filteredSeries =
    activeGenre === 'ALL'
      ? []
      : realSeries.filter((s) => {
          const gLow = activeGenre.toLowerCase();
          if (gLow === 'komedi')
            return (
              s.genre.some((g) => g.toLowerCase().includes('comed') || g.toLowerCase().includes('komedi')) ||
              s.title.toLowerCase().includes('express')
            );
          if (gLow === 'thriller')
            return (
              s.genre.some((g) => g.toLowerCase().includes('thrill') || g.toLowerCase().includes('misteri')) ||
              s.title.toLowerCase().includes('dendam') ||
              s.title.toLowerCase().includes('terlarang')
            );
          return s.genre.some((g) => g.toLowerCase().includes(gLow));
        });

  // 4. Real Rows (100% Real VOD Catalog items)
  const continueWatchingItems = realSeries.slice(0, 6).map((item, idx) => ({
    id: item.id,
    vod: item,
    code: `S01 E0${idx + 1}`,
    title: item.title,
    duration: item.duration || '45 min',
    progress: [68, 42, 85, 50, 90, 35][idx],
    poster: item.poster,
  }));

  const newSeries = realSeries.slice(6, 18);
  const popularSeries = realSeries.slice(18, 30);
  const trendingSeries = realSeries.slice(30, 42);
  const featuredDrama = realSeries.slice(42, 54);

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

      {/* 2. DYNAMIC CONTENT: EITHER GENRE FILTER GRID OR MULTI-ROW CATALOG */}
      <div className="ssatv-shelves-container" style={{ padding: '0 48px', paddingBottom: '64px' }}>
        {activeGenre !== 'ALL' ? (
          /* Filtered Genre Grid */
          <section className="ssatv-shelf-row-wrap" style={{ marginTop: '20px' }}>
            <div className="ssatv-row-header">
              <h2 className="ssatv-row-title">
                <span>Koleksi Siri {activeGenre} ({filteredSeries.length})</span>
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
              {filteredSeries.map((item) => (
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
                          'https://vod-poster.astro.com.my/prod/IVP(STB_OTT_STV)_KWOLD_series_p_IVP_PORT_390x585_94EA0_2026724_16538.jpg';
                      }}
                    />
                    <div className="ssatv-card-gradient" />
                    <div className="ssatv-card-overlaid-meta">
                      <div className="ssatv-card-overlaid-title">{item.title}</div>
                      <div className="ssatv-card-overlaid-sub">
                        {item.year} • {item.episodes?.length || 20} Episod • {item.rating}
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
            {/* ROW 1: CONTINUE WATCHING (SAMBUNG MENONTON DENGAN RED PROGRESS BAR) */}
            <section className="ssatv-shelf-row-wrap" style={{ marginTop: '24px' }}>
              <div className="ssatv-row-header">
                <h2 className="ssatv-row-title">
                  <span>Sambung Menonton</span>
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
                    <div className="ssatv-continue-thumb-wrap">
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="ssatv-continue-img"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://vod-poster.astro.com.my/prod/IVP(STB_OTT_STV)_KWOLD_series_p_IVP_PORT_390x585_94EA0_2026724_16538.jpg';
                        }}
                      />
                      <div className="ssatv-continue-gradient" />
                      <div className="ssatv-continue-info">
                        <div className="ssatv-continue-title">{item.title}</div>
                        <div className="ssatv-continue-sub">
                          {item.code} • {item.duration}
                        </div>
                      </div>
                      <div className="ssatv-progress-track">
                        <div
                          className="ssatv-progress-fill"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ROW 2: NEW RELEASES (SIRI BAHARU DENGAN BADGE NEW) */}
            <section className="ssatv-shelf-row-wrap" style={{ marginTop: '36px' }}>
              <div className="ssatv-row-header">
                <h2 className="ssatv-row-title">
                  <span>Siri Baharu & Hangat</span>
                  <ChevronRight size={18} className="ssatv-row-chevron" />
                </h2>
              </div>

              <div className="ssatv-cards-track">
                {newSeries.map((item) => (
                  <div
                    key={item.id}
                    className="ssatv-movie-card"
                    onClick={() => onPlayEpisode(item)}
                  >
                    <div className="ssatv-card-poster-wrap">
                      <span className="ssatv-badge-new">NEW</span>
                      <img
                        src={item.poster || item.backdrop}
                        alt={item.title}
                        className="ssatv-card-img"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://vod-poster.astro.com.my/prod/IVP(STB_OTT_STV)_KWOLD_series_p_IVP_PORT_390x585_94EA0_2026724_16538.jpg';
                        }}
                      />
                      <div className="ssatv-card-gradient" />
                      <div className="ssatv-card-overlaid-meta">
                        <div className="ssatv-card-overlaid-title">{item.title}</div>
                        <div className="ssatv-card-overlaid-sub">
                          {item.year} • {item.episodes?.length || 20} Episod • {item.rating}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ROW 3: POPULAR SERIES (SIRI PALING POPULAR) */}
            <section className="ssatv-shelf-row-wrap" style={{ marginTop: '36px' }}>
              <div className="ssatv-row-header">
                <h2 className="ssatv-row-title">
                  <span>Siri Paling Popular</span>
                  <ChevronRight size={18} className="ssatv-row-chevron" />
                </h2>
              </div>

              <div className="ssatv-cards-track">
                {popularSeries.map((item) => (
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
                            'https://vod-poster.astro.com.my/prod/IVP(STB_OTT_STV)_KWOLD_series_p_IVP_PORT_390x585_94EA0_2026724_16538.jpg';
                        }}
                      />
                      <div className="ssatv-card-gradient" />
                      <div className="ssatv-card-overlaid-meta">
                        <div className="ssatv-card-overlaid-title">{item.title}</div>
                        <div className="ssatv-card-overlaid-sub">
                          {item.year} • {item.episodes?.length || 20} Episod • {item.rating}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ROW 4: TRENDING NOW (SEDANG TRENDING) */}
            <section className="ssatv-shelf-row-wrap" style={{ marginTop: '36px' }}>
              <div className="ssatv-row-header">
                <h2 className="ssatv-row-title">
                  <span>Sedang Trending</span>
                  <ChevronRight size={18} className="ssatv-row-chevron" />
                </h2>
              </div>

              <div className="ssatv-cards-track">
                {trendingSeries.map((item) => (
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
                            'https://vod-poster.astro.com.my/prod/IVP(STB_OTT_STV)_KWOLD_series_p_IVP_PORT_390x585_94EA0_2026724_16538.jpg';
                        }}
                      />
                      <div className="ssatv-card-gradient" />
                      <div className="ssatv-card-overlaid-meta">
                        <div className="ssatv-card-overlaid-title">{item.title}</div>
                        <div className="ssatv-card-overlaid-sub">
                          {item.year} • {item.episodes?.length || 20} Episod • {item.rating}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* BROWSE BY GENRE BAR */}
            <section className="ssatv-genre-browse-bar" style={{ marginTop: '40px', padding: 0 }}>
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

            {/* ROW 5: KOLEKSI DRAMA TERHEBAT */}
            <section className="ssatv-shelf-row-wrap" style={{ marginTop: '28px' }}>
              <div className="ssatv-row-header">
                <h2 className="ssatv-row-title">
                  <span>Koleksi Drama Pilihan</span>
                  <ChevronRight size={18} className="ssatv-row-chevron" />
                </h2>
              </div>

              <div className="ssatv-cards-track">
                {featuredDrama.map((item) => (
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
                            'https://vod-poster.astro.com.my/prod/IVP(STB_OTT_STV)_KWOLD_series_p_IVP_PORT_390x585_94EA0_2026724_16538.jpg';
                        }}
                      />
                      <div className="ssatv-card-gradient" />
                      <div className="ssatv-card-overlaid-meta">
                        <div className="ssatv-card-overlaid-title">{item.title}</div>
                        <div className="ssatv-card-overlaid-sub">
                          {item.year} • {item.episodes?.length || 20} Episod • {item.rating}
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
