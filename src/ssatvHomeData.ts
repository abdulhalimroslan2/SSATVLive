import { type HeroSlide } from './HeroExperience';
import { type ContinueItem } from './ContinueWatchingRow';
import { type TrendingItem } from './TrendingGrid';
import { type LiveRailItem } from './LiveNowSidebar';

export const SSATV_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hero_last_horizon',
    badge: 'FEATURED',
    titleLines: ['THE LAST', 'HORIZON'],
    meta: '2026  •  2h 14m  •  Sci-Fi  •  16+',
    synopsis: 'Humanity faces its final journey beyond the boundaries of Earth.',
    backdrop: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&q=80&w=2000',
  },
  {
    id: 'hero_bulan_henti',
    badge: 'FEATURED SERIES',
    titleLines: ['BULAN HENTI', 'BICARA'],
    meta: '2026  •  Episod 1  •  Drama Melayu  •  13+',
    synopsis: 'Kisah penuh emosi dan liku kehidupan yang menyentuh hati jutaan penonton di Malaysia.',
    backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=2000',
  },
  {
    id: 'hero_penunggu_istana',
    badge: 'FEATURED MOVIE',
    titleLines: ['PENUNGGU', 'ISTANA'],
    meta: '2024  •  1j 15m  •  Seram Thriller  •  18+',
    synopsis: 'Sebuah penerokaan misteri di istana lama yang membongkar rahsia kegelapan zaman berzaman.',
    backdrop: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=2000',
  },
  {
    id: 'hero_astro_arena',
    badge: 'LIVE SPORTS',
    titleLines: ['ASTRO', 'ARENA HD'],
    meta: 'Siaran Langsung  •  1080p 60fps  •  Sukan Perdana',
    synopsis: 'Liputan sukan tempatan dan antarabangsa secara langsung dalam kualiti definisi tinggi.',
    backdrop: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=2000',
  },
  {
    id: 'hero_kolong',
    badge: 'BOO HORROR',
    titleLines: ['600', 'KOLONG'],
    meta: '2023  •  1j 50m  •  Horror  •  18+',
    synopsis: 'Misteri di sebalik lorong terbiar yang memerangkap mangsa dalam igauan tanpa henti.',
    backdrop: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=2000',
  },
];

export const SSATV_CONTINUE_WATCHING: ContinueItem[] = [
  {
    id: 'cw_1',
    title: 'The Last Horizon',
    sub: 'S01 E04 • Beyond the Stars',
    progressPercent: 65,
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'cw_2',
    title: 'Shadow Republic',
    sub: 'S02 E02 • Broken Oath',
    progressPercent: 42,
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'cw_3',
    title: 'Arctic Line',
    sub: 'S01 E06 • Whiteout',
    progressPercent: 80,
    thumbnail: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'cw_4',
    title: 'The Deceiver',
    sub: 'S01 E03 • The Confession',
    progressPercent: 28,
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'cw_5',
    title: 'Code 9',
    sub: 'S02 E01 • New Dawn',
    progressPercent: 50,
    thumbnail: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=600',
  },
];

export const SSATV_TRENDING_NOW: TrendingItem[] = [
  {
    id: 'tr_1',
    title: 'ECLIPSE PROTOCOL',
    genre: 'Sci-Fi Thriller',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'tr_2',
    title: 'RISING TIDES',
    genre: 'Action Drama',
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'tr_3',
    title: 'THE SILENT CITY',
    genre: 'Mystery',
    poster: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'tr_4',
    title: 'OUTER REACH',
    genre: 'Sci-Fi Adventure',
    poster: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'tr_5',
    title: 'THE WATCHERS',
    genre: 'Horror',
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'tr_6',
    title: 'NEON FUTURE',
    genre: 'Cyberpunk',
    poster: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=400',
  },
];

export const SSATV_NEW_RELEASES: TrendingItem[] = [
  {
    id: 'nr_1',
    title: 'SOLARIS FALL',
    genre: 'Sci-Fi',
    year: 2026,
    badge: 'NEW',
    poster: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'nr_2',
    title: 'NIGHT PARADE',
    genre: 'Thriller',
    year: 2026,
    badge: 'NEW',
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'nr_3',
    title: 'BELOW ZERO',
    genre: 'Action',
    year: 2026,
    badge: 'NEW',
    poster: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'nr_4',
    title: 'LOST SIGNAL',
    genre: 'Mystery',
    year: 2026,
    badge: 'NEW',
    poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'nr_5',
    title: 'THE LONG WAY',
    genre: 'Drama',
    year: 2026,
    badge: 'NEW',
    poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'nr_6',
    title: 'VORTEX',
    genre: 'Sci-Fi',
    year: 2026,
    badge: 'NEW',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400',
  },
];

export const SSATV_LIVE_RAIL: LiveRailItem[] = [
  {
    id: 'live_1',
    badge: 'LIVE',
    name: 'SSATV NEWS',
    program: 'Evening Report',
    timeSlot: '9:30 PM – 10:00 PM',
    thumbnail: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=320',
  },
  {
    id: 'live_2',
    badge: 'LIVE',
    name: 'SPORTRUSH',
    program: 'Champions League',
    timeSlot: '9:15 PM – 11:30 PM',
    thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=320',
  },
  {
    id: 'live_3',
    badge: 'LIVE',
    name: 'CINEPLUS',
    program: 'The Dark Knight',
    timeSlot: '9:00 PM – 11:45 PM',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=320',
  },
  {
    id: 'live_4',
    badge: 'LIVE',
    name: 'WILD EARTH',
    program: 'Into The Wild',
    timeSlot: '9:20 PM – 10:10 PM',
    thumbnail: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef6?auto=format&fit=crop&q=80&w=320',
  },
];
