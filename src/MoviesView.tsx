import React, { useState } from 'react';
import { ChevronRight, Star } from 'lucide-react';
import type { VodItem } from './vodData';
import { VOD_CATALOG } from './vodData';
import { HeroExperience, type HeroSlide } from './HeroExperience';

interface MoviesViewProps {
  onPlayMovie: (item: VodItem) => void;
  onNavigateTab?: (tab: string) => void;
}

export const MoviesView: React.FC<MoviesViewProps> = ({
  onPlayMovie,
}) => {
  const [activeGenre, setActiveGenre] = useState('ALL');

  // Curated hero slides for Movies with real Quickplay & blockbuster backdrops
  const movieHeroSlides: HeroSlide[] = [
    {
      id: 'movie_bulan_henti',
      badge: 'FILEM TERBAHARU 2025',
      titleLines: ['BULAN HENTI', 'BICARA'],
      meta: '2025 • 2 Jam 05 Minit • Drama • Romantik • 13+',
      synopsis:
        'Kisah cinta, pengorbanan dan rahsia silam yang terungkai di bawah sinaran bulan purnama yang mendamaikan.',
      backdrop:
        'https://image-resizer-cloud-cdn.api.tmcms.quickplay.com/image/83726BF7-B225-45C6-8BFB-A62E8CDA166A/0-16x9.jpg?width=1920',
      vodItem:
        VOD_CATALOG.find((v) => v.id === 'vod_m_345') ||
        VOD_CATALOG.find((v) => v.type === 'movie') ||
        VOD_CATALOG[0],
    },
    {
      id: 'movie_penunggu_istana',
      badge: 'FILEM SERAM BLOKBUSTER',
      titleLines: ['PENUNGGU', 'ISTANA'],
      meta: '2023 • 1 Jam 48 Minit • Seram • Misteri • 18+',
      synopsis:
        'Siasatan sekumpulan pembuat filem dokumentari di istana terbiar bertukar menjadi igauan ngeri penuh misteri.',
      backdrop:
        'https://image-resizer-cloud-cdn.api.tmcms.quickplay.com/image/567FFDC8-DDB8-4A4F-8569-4E12A8E8E572/0-16x9.jpg?width=1920',
      vodItem:
        VOD_CATALOG.find((v) => v.id === 'vod_m_348') ||
        VOD_CATALOG.find((v) => v.type === 'movie') ||
        VOD_CATALOG[0],
    },
    {
      id: 'movie_last_horizon',
      badge: 'FEATURED SCI-FI MOVIE',
      titleLines: ['THE LAST', 'HORIZON'],
      meta: '2026 • 2h 14m • Sci-Fi • Action • 16+',
      synopsis:
        'Humanity faces its final journey beyond the boundaries of Earth in an epic quest for survival across the cosmos.',
      backdrop:
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1920',
      vodItem: VOD_CATALOG.find((v) => v.type === 'movie') || VOD_CATALOG[0],
    },
    {
      id: 'movie_keluang_man',
      badge: 'FILEM AKSI ADIWIRA',
      titleLines: ['KELUANG', 'MAN'],
      meta: '2025 • 2 Jam 10 Minit • Aksi • Komedi • P13',
      synopsis:
        'Kisah adiwira tempatan ikonik yang bangkit menegakkan keadilan di waktu malam dengan keberanian luar biasa.',
      backdrop:
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=1920',
      vodItem: VOD_CATALOG[1] || VOD_CATALOG[0],
    },
  ];

  // Genres list from reference image
  const genres = [
    'ALL',
    'ACTION',
    'ADVENTURE',
    'COMEDY',
    'DRAMA',
    'SCI-FI',
    'THRILLER',
    'HORROR',
    'DOCUMENTARY',
    'ANIMATION',
    'FAMILY',
    'ROMANCE',
  ];

  // Real Movies from catalog
  const realMovies = VOD_CATALOG.filter((v) => v.type === 'movie');

  // 1. Trending Movies (matching reference image)
  const trendingMovies = [
    {
      id: 'tr_1',
      title: 'ECLIPSE',
      meta: '2026 • Sci-Fi',
      backdrop:
        'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&q=80&w=800',
      vod: realMovies[0] || VOD_CATALOG[0],
    },
    {
      id: 'tr_2',
      title: 'SHADOW CODE',
      meta: '2026 • Thriller',
      backdrop:
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800',
      vod: realMovies[1] || VOD_CATALOG[0],
    },
    {
      id: 'tr_3',
      title: 'BEYOND THE STARS',
      meta: '2026 • Adventure',
      backdrop:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
      vod: realMovies[2] || VOD_CATALOG[0],
    },
    {
      id: 'tr_4',
      title: 'THE SILENT PATH',
      meta: '2026 • Drama',
      backdrop:
        'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=800',
      vod: realMovies[3] || VOD_CATALOG[0],
    },
    {
      id: 'tr_5',
      title: 'NEON SKY',
      meta: '2026 • Sci-Fi',
      backdrop:
        'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&q=80&w=800',
      vod: realMovies[4] || VOD_CATALOG[0],
    },
    {
      id: 'tr_6',
      title: 'RED DIVIDE',
      meta: '2026 • Action',
      backdrop:
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=800',
      vod: realMovies[5] || VOD_CATALOG[0],
    },
  ];

  // 2. New Releases (matching reference image with red NEW badge)
  const newReleases = [
    {
      id: 'nr_1',
      title: 'SOLARIS FALL',
      meta: '2026 • Sci-Fi',
      backdrop:
        'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&q=80&w=800',
      vod: realMovies[6] || VOD_CATALOG[0],
    },
    {
      id: 'nr_2',
      title: 'NIGHT PARADE',
      meta: '2026 • Horror',
      backdrop:
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800',
      vod: realMovies[7] || VOD_CATALOG[0],
    },
    {
      id: 'nr_3',
      title: 'LOST SIGNAL',
      meta: '2026 • Mystery',
      backdrop:
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800',
      vod: realMovies[8] || VOD_CATALOG[0],
    },
    {
      id: 'nr_4',
      title: 'THE LONG WAY',
      meta: '2026 • Drama',
      backdrop:
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=800',
      vod: realMovies[9] || VOD_CATALOG[0],
    },
    {
      id: 'nr_5',
      title: 'FROZEN LAND',
      meta: '2026 • Adventure',
      backdrop:
        'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&q=80&w=800',
      vod: realMovies[10] || VOD_CATALOG[0],
    },
    {
      id: 'nr_6',
      title: 'THE ARCHITECT',
      meta: '2026 • Thriller',
      backdrop:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800',
      vod: realMovies[11] || VOD_CATALOG[0],
    },
  ];

  // 3. Top Rated (matching reference image with Star rating badge)
  const topRated = [
    {
      id: 'top_1',
      title: 'INTERSTELLAR DAWN',
      meta: '2026 • Sci-Fi',
      rating: '8.9',
      backdrop:
        'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&q=80&w=800',
      vod: realMovies[12] || VOD_CATALOG[0],
    },
    {
      id: 'top_2',
      title: 'THE ECHOES',
      meta: '2026 • Mystery',
      rating: '8.7',
      backdrop:
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800',
      vod: realMovies[13] || VOD_CATALOG[0],
    },
    {
      id: 'top_3',
      title: 'PARALLEL MINDS',
      meta: '2026 • Sci-Fi',
      rating: '8.6',
      backdrop:
        'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&q=80&w=800',
      vod: realMovies[14] || VOD_CATALOG[0],
    },
    {
      id: 'top_4',
      title: 'WHISPERS IN THE RAIN',
      meta: '2026 • Drama',
      rating: '8.5',
      backdrop:
        'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=800',
      vod: realMovies[15] || VOD_CATALOG[0],
    },
    {
      id: 'top_5',
      title: 'SHATTERED',
      meta: '2026 • Thriller',
      rating: '8.4',
      backdrop:
        'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&q=80&w=800',
      vod: realMovies[16] || VOD_CATALOG[0],
    },
    {
      id: 'top_6',
      title: 'THE LAST SIGNAL',
      meta: '2026 • Adventure',
      rating: '8.3',
      backdrop:
        'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=800',
      vod: realMovies[17] || VOD_CATALOG[0],
    },
  ];

  // 4. Action Movies Shelf
  const actionMovies = realMovies.slice(0, 12);

  return (
    <div className="ssatv-movies-view">
      {/* 1. CINEMATIC HERO MOVIE BANNER (Dynamic Apple TV/Netflix experience with real Quickplay & blockbuster backdrops) */}
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
          <button className="ssatv-genre-scroll-arrow" aria-label="Next genres">
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* 3. SHELVES SECTION */}
      <div className="ssatv-movies-shelves">
        {/* ROW 1: TRENDING MOVIES */}
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
                onClick={() => onPlayMovie(item.vod)}
              >
                <div className="ssatv-card-poster-wrap">
                  <img
                    src={item.backdrop}
                    alt={item.title}
                    className="ssatv-card-img"
                    loading="lazy"
                  />
                  <div className="ssatv-card-gradient" />

                  {/* Text directly overlaid */}
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
        </section>

        {/* ROW 2: NEW RELEASES (With Red NEW Badge) */}
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
                onClick={() => onPlayMovie(item.vod)}
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
        </section>

        {/* ROW 3: TOP RATED (With Star Rating Badge) */}
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
                onClick={() => onPlayMovie(item.vod)}
              >
                <div className="ssatv-card-poster-wrap">
                  <div className="ssatv-badge-rating">
                    <Star size={11} fill="#ffb800" color="#ffb800" />
                    <span>{item.rating}</span>
                  </div>
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
        </section>

        {/* ROW 4: ACTION (From Real VOD Catalog) */}
        <section className="ssatv-shelf-row-wrap">
          <div className="ssatv-row-header">
            <h2 className="ssatv-row-title">
              <span>Action</span>
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
                    src={item.poster || item.backdrop}
                    alt={item.title}
                    className="ssatv-card-img"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=800';
                    }}
                  />
                  <div className="ssatv-card-gradient" />

                  <div className="ssatv-card-overlaid-meta">
                    <div className="ssatv-card-overlaid-title">
                      {item.title}
                    </div>
                    <div className="ssatv-card-overlaid-sub">
                      {item.year} • {item.genre?.[0] || 'Action'}
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
