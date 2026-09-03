import { type HeroSlide } from './HeroExperience';
import { type ContinueItem } from './ContinueWatchingRow';
import { type TrendingItem } from './TrendingGrid';
import { type LiveRailItem } from './LiveNowSidebar';
import { VOD_CATALOG, type VodItem } from './vodData';
import type { Channel } from './mockData';

// Helper to format Quickplay 16:9 widescreen backdrop
const getWidescreenBackdrop = (url: string, width = 1920): string => {
  if (!url) return '';
  if (url.includes('image-resizer-cloud-cdn.api.tmcms.quickplay.com')) {
    return url.replace('0-2x3.jpg', '0-16x9.jpg').replace(/width=\d+/, `width=${width}`);
  }
  return url;
};

// Helper to format Quickplay 2:3 portrait poster
const getPosterUrl = (url: string, width = 400): string => {
  if (!url) return '';
  if (url.includes('image-resizer-cloud-cdn.api.tmcms.quickplay.com')) {
    return url.replace(/width=\d+/, `width=${width}`);
  }
  return url;
};

// Find real items from catalog safely
const getItemById = (id: string): VodItem | undefined => {
  return VOD_CATALOG.find((v) => v.id === id);
};

const penungguIstana = getItemById('vod_m_348') || VOD_CATALOG[0];
const jpbc = getItemById('vod_m_355') || VOD_CATALOG[1];
const nightOwl = getItemById('vod_m_350') || VOD_CATALOG[2];
const saranjana = getItemById('vod_m_361') || VOD_CATALOG[3];
const bulanHenti = getItemById('vod_s_001') || VOD_CATALOG.find(v => v.type === 'series') || VOD_CATALOG[4];

// 1. REAL HERO SLIDES (Synchronized with real VOD & Live TV streams)
export const getRealHeroSlides = (channels: Channel[] = []): HeroSlide[] => {
  const hboChannel = channels.find(
    (c) => c.id === 'hbo' || c.ch_number === '411' || c.name.toLowerCase().includes('hbo')
  );

  return [
    {
      id: penungguIstana.id,
      badge: 'FILEM BLOKBUSTER UTAMA',
      titleLines: ['PENUNGGU', 'ISTANA'],
      meta: `${penungguIstana.year}  •  ${penungguIstana.duration}  •  ${penungguIstana.genre.join(' / ')}  •  ${penungguIstana.rating}`,
      synopsis: penungguIstana.synopsis,
      backdrop: getWidescreenBackdrop(penungguIstana.backdrop, 1920),
      vodItem: penungguIstana,
    },
    {
      id: jpbc.id,
      badge: 'KOMEDI SERAM POPULAR',
      titleLines: ['JANGAN PANDANG', 'BELAKANG CONGKAK'],
      meta: `${jpbc.year}  •  ${jpbc.duration}  •  ${jpbc.genre.join(' / ')}  •  ${jpbc.rating}`,
      synopsis: jpbc.synopsis,
      backdrop: getWidescreenBackdrop(jpbc.backdrop, 1920),
      vodItem: jpbc,
    },
    {
      id: 'hero_live_hbo',
      badge: 'SIARAN LANGSUNG (LIVE)',
      titleLines: ['HBO', 'HD 411'],
      meta: 'Saluran 411  •  1080p FHD  •  Hollywood Premiere & Series',
      synopsis: hboChannel?.description || 'Siaran langsung HBO HD. Menyiarkan filem-filem pecah panggung Hollywood terbaik dan siri eksklusif sepanjang 24 jam.',
      backdrop: getWidescreenBackdrop(nightOwl.backdrop, 1920),
      channelId: 'hbo',
    },
    {
      id: saranjana.id,
      badge: 'SERAM NUSANTARA',
      titleLines: ['SARANJANA', 'KOTA GHAIB'],
      meta: `${saranjana.year}  •  ${saranjana.duration}  •  ${saranjana.genre.join(' / ')}  •  ${saranjana.rating}`,
      synopsis: saranjana.synopsis,
      backdrop: getWidescreenBackdrop(saranjana.backdrop, 1920),
      vodItem: saranjana,
    },
    {
      id: bulanHenti.id,
      badge: 'SIRI DRAMA ASTRO',
      titleLines: ['BULAN HENTI', 'BICARA'],
      meta: `${bulanHenti.year}  •  ${bulanHenti.episodes?.length || 11} Episod  •  Drama Melayu  •  Episod Penuh`,
      synopsis: bulanHenti.synopsis,
      backdrop: getWidescreenBackdrop(getItemById('vod_m_349')?.backdrop || penungguIstana.backdrop, 1920),
      vodItem: bulanHenti,
    },
  ];
};

export const SSATV_HERO_SLIDES: HeroSlide[] = getRealHeroSlides();

// 2. REAL CONTINUE WATCHING ROW (Synced with real VOD items)
export const getRealContinueWatching = (): ContinueItem[] => {
  const items = [
    { item: penungguIstana, sub: 'Filem • 1j 35m • Baki 35 minit', progress: 65 },
    { item: jpbc, sub: 'Filem • 1j 40m • Baki 50 minit', progress: 42 },
    { item: nightOwl, sub: 'Filem • 1j 58m • Baki 20 minit', progress: 80 },
    { item: saranjana, sub: 'Filem • 1j 45m • Baki 60 minit', progress: 28 },
    { item: getItemById('vod_m_362') || VOD_CATALOG[5], sub: 'Filem • 1j 35m • Baki 40 minit', progress: 50 },
  ];

  return items.map((entry, idx) => ({
    id: `cw_real_${entry.item.id}_${idx}`,
    title: entry.item.title,
    sub: entry.sub,
    progressPercent: entry.progress,
    thumbnail: getWidescreenBackdrop(entry.item.backdrop, 640),
    vodItem: entry.item,
  }));
};

export const SSATV_CONTINUE_WATCHING: ContinueItem[] = getRealContinueWatching();

// 3. REAL TRENDING NOW (Real items from VOD_CATALOG slice)
export const getRealTrendingNow = (): TrendingItem[] => {
  const trendingSlice = VOD_CATALOG.slice(1, 9);
  return trendingSlice.map((v) => ({
    id: `tr_${v.id}`,
    title: v.title.toUpperCase(),
    genre: v.genre?.[0] ? `${v.genre[0]} Movie` : 'Drama',
    poster: getWidescreenBackdrop(v.backdrop, 640) || getPosterUrl(v.poster, 400),
    vodItem: v,
  }));
};

export const SSATV_TRENDING_NOW: TrendingItem[] = getRealTrendingNow();

// 4. REAL NEW RELEASES (Real items from VOD_CATALOG slice)
export const getRealNewReleases = (): TrendingItem[] => {
  const newSlice = VOD_CATALOG.slice(9, 17);
  return newSlice.map((v) => ({
    id: `nr_${v.id}`,
    title: v.title.toUpperCase(),
    genre: v.genre?.[0] || 'Aksi',
    year: v.year || 2023,
    badge: 'NEW',
    poster: getWidescreenBackdrop(v.backdrop, 640) || getPosterUrl(v.poster, 400),
    vodItem: v,
  }));
};

export const SSATV_NEW_RELEASES: TrendingItem[] = getRealNewReleases();

// 5. REAL LIVE NOW RAIL (Synchronized directly with real live TV channels)
export const getRealLiveRail = (channels: Channel[] = []): LiveRailItem[] => {
  if (channels.length > 0) {
    const targetKeys = ['tv1', 'tv3', 'hbo', 'arena', 'celestial'];
    const matchedChannels: Channel[] = [];

    for (const key of targetKeys) {
      const found = channels.find(
        (c) =>
          c.id.toLowerCase().includes(key) ||
          c.name.toLowerCase().includes(key) ||
          (key === 'hbo' && c.ch_number === '411')
      );
      if (found && !matchedChannels.some((m) => m.id === found.id)) {
        matchedChannels.push(found);
      }
    }

    for (const c of channels) {
      if (matchedChannels.length >= 5) break;
      if (!matchedChannels.some((m) => m.id === c.id)) {
        matchedChannels.push(c);
      }
    }

    return matchedChannels.slice(0, 5).map((ch, idx) => {
      let program = ch.description || 'Siaran Langsung HD';
      if (ch.name.includes('TV1')) program = 'Berita Perdana';
      else if (ch.name.includes('TV3')) program = 'Buletin Utama';
      else if (ch.name.includes('HBO')) program = 'Hollywood Premiere';
      else if (ch.name.includes('Arena')) program = 'Nadi Arena Live';
      else if (ch.name.includes('Celestial')) program = 'Asian Cinema Blockbuster';

      const timeSlots = [
        '8:00 PM – 9:00 PM',
        '9:00 PM – 11:00 PM',
        '10:00 PM – 11:30 PM',
        '8:30 PM – 10:30 PM',
        '9:30 PM – 11:30 PM',
      ];

      return {
        id: `live_rail_${ch.id}_${idx}`,
        badge: 'LIVE',
        name: ch.name,
        program: program,
        timeSlot: timeSlots[idx % timeSlots.length],
        thumbnail: ch.thumbnail || 'https://ptv2026.com/logo/tv1.png',
        channel: ch,
      };
    });
  }

  return [
    {
      id: 'live_tv1',
      badge: 'LIVE',
      name: 'TV1',
      program: 'Berita Perdana',
      timeSlot: '8:00 PM – 9:00 PM',
      thumbnail: 'https://ptv2026.com/logo/tv1.png',
    },
    {
      id: 'live_tv3',
      badge: 'LIVE',
      name: 'TV3 FHD',
      program: 'Buletin Utama',
      timeSlot: '8:00 PM – 9:00 PM',
      thumbnail: 'https://ptv2026.com/logo/tv3.png',
    },
    {
      id: 'live_hbo',
      badge: 'LIVE',
      name: 'HBO HD 411',
      program: 'Hollywood Blockbuster',
      timeSlot: '9:00 PM – 11:00 PM',
      thumbnail: 'https://ptv2026.com/logo/hbo.png',
    },
    {
      id: 'live_arena',
      badge: 'LIVE',
      name: 'Astro Arena HD',
      program: 'Nadi Arena Live',
      timeSlot: '10:00 PM – 11:30 PM',
      thumbnail: 'https://ptv2026.com/logo/arena.png',
    },
  ];
};

export const SSATV_LIVE_RAIL: LiveRailItem[] = getRealLiveRail();
