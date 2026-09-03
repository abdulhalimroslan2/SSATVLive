import type { Channel } from './mockData';
import rawEpgData from './liveEpgData.json';

export interface EpgProgramme {
  title: string;
  desc: string;
  start: string;
  stop: string;
  date: string;
  startHour: number;
  timeSlot: string;
  genre?: string;
}

export interface EpgProgram {
  channelId: string;
  currentTitle: string;
  nextTitle: string;
  startTimeStr: string;
  endTimeStr: string;
  progressPercent: number;
  remainingMinutes: number;
  description: string;
}

export function getChannelEpg(
  channelOrId: Channel | string,
  channelName?: string,
  category?: string
): EpgProgram {
  let ch: Channel;
  if (typeof channelOrId === 'object' && channelOrId !== null) {
    ch = channelOrId;
  } else {
    ch = {
      id: channelOrId || '',
      contentId: channelOrId || '',
      name: channelName || '',
      category: category || 'MALAYSIA',
      thumbnail: '',
      streamUrl: '',
      description: '',
      isFreeContent: true,
      isFreePreviewEnabledContent: true,
    };
  }

  const curr = getCurrentProgramme(ch);
  const slots = getTimelineSlotsForChannel(ch);

  return {
    channelId: ch.id,
    currentTitle: curr.title,
    nextTitle: slots.h11pm.title || 'Rancangan Seterusnya',
    startTimeStr: curr.timeSlot.split('–')[0]?.trim() || '10:00 PM',
    endTimeStr: curr.timeSlot.split('–')[1]?.trim() || '11:00 PM',
    progressPercent: 60,
    remainingMinutes: 24,
    description: curr.desc,
  };
}

const epgMap: Record<string, EpgProgramme[]> = rawEpgData as Record<string, EpgProgramme[]>;

// Channel alias dictionary to maximize match rate between APK channels and EPG
const CHANNEL_ALIASES: Record<string, string> = {
  'tv1': 'tv1',
  'tv2': 'tv2',
  'tv3': 'tv3',
  'tv3 fhd': 'tv3',
  'tv3 sd': 'tv3',
  'didik tv': '147',
  'ntv7': '147',
  '147': '147',
  '8tv': '8tv',
  'tv9': 'tv9',
  'tvs': '122',
  '122': '122',
  'okey': '146',
  '146': '146',
  'sensasi': 'sensasi',
  'inspirasi': 'inspirasi',
  'degup': 'degup',
  'salam hd': 'salamhd',
  'salamhd': 'salamhd',
  'siar': 'siar',
  'dunia sinema': 'duniasinemahd',
  'duniasinemahd': 'duniasinemahd',
  'pesona hd': 'pesonahd',
  'pesonahd': 'pesonahd',
  'seti': 'seti',
  'hbo': 'hbohd',
  'hbo hd': 'hbohd',
  'hbohd': 'hbohd',
  'hbo hits': 'hbohits',
  'hbohits': 'hbohits',
  'hbo family': 'hbofamily',
  'hbofamily': 'hbofamily',
  'hbo signature': 'hbosignature',
  'hbosignature': 'hbosignature',
  'cinemax': 'cinemax',
  'celestial movies': 'celestialmovies',
  'celestialmovies': 'celestialmovies',
  'ccm': 'ccm',
  'warna': 'astrowarna',
  'citra': 'astrocitra',
  'ria': 'astroria',
  'prima': 'astroprima',
  'oasis': 'astrooasis',
  'ceria': 'astroceria',
  'arena': 'astroarena',
  'arena fhd': 'astroarena',
  'arena 2 fhd': 'astroarena2',
  'supersport': 'astrosupersport',
  'supersport 2': 'astrosupersport2',
  'supersport 3': 'astrosupersport3',
  'rcti': 'rcti',
  'mnctv': 'mnctv',
  'gtv': 'gtv',
  'transtv': 'transtv',
  'trans7': 'trans7',
  'sctv': 'sctv',
  'indosiar': 'indosiar',
  'tvone': 'tvone',
  'antv': 'antv',
  'kompastv': 'kompastv',
  'metro tv': 'metrotv',
  'animax': 'animax',
  'animax hd': 'animax',
  'aniplus': 'aniplus',
  'cartoon network': 'cartoonnetwork',
  'cbeebies': 'cbeebies',
  'dreamworks': 'dreamworks',
  'nickelodeon': 'nickelodeon',
  'nick junior': 'nickjr',
  'bbc news': 'bbcnews',
  'al-jazeera english': 'aljazeera',
  'aljazeera': 'aljazeera',
  'cnn': 'cnn',
  'cna': 'cna',
  'cnbc asia': 'cnbc',
  'bloomberg tv': 'bloomberg',
  'history hd': 'history',
  'discovery hd': 'discovery',
  'discovery asia': 'discoveryasia',
  'love nature': 'lovenature',
  'tlc': 'tlc',
  'dmax hd': 'dmax',
  'axn': 'axn',
  'kix': 'kix',
  'warner tv': 'warnertv',
  'rock entertainment': 'rockentertainment',
  'hgtv': 'hgtv',
  'lifetime': 'lifetime',
  'hits': 'hits',
  'hits now': 'hitsnow',
  'tvn hd': 'tvn',
  'tvn movies': 'tvnmovies',
  'kbs world': 'kbsworld',
  'k+': 'kplus',
  'zee cinema': 'zeecinema',
  'zee tamil': 'zeetamil',
  'colors hindi': 'colorshindi',
  'colors tamil': 'colorstamil',
  'sun tv': 'suntv',
  'ktv': 'ktv',
  'aditya': 'aditya',
  'sun music': 'sunmusic',
  'chintu tv': 'chintutv',
  'gemini tv': 'geminitv',
  'tvb jade': 'tvbjade',
  'tvb classic': 'tvbclassic',
  'tvb xing he': 'tvbxinghe',
  'tvbs asia': 'tvbsasia',
  'cctv4': 'cctv4',
  'iqiyi': 'iqiyi',
};

export function getEpgKeyForChannel(channel: Channel): string | null {
  if (!channel) return null;
  const contentId = (channel.contentId || '').toLowerCase().trim();
  const name = (channel.name || '').toLowerCase().trim();

  // 1. Direct match by contentId
  if (contentId && epgMap[contentId]) return contentId;

  // 2. Lookup alias by contentId
  if (contentId && CHANNEL_ALIASES[contentId] && epgMap[CHANNEL_ALIASES[contentId]]) {
    return CHANNEL_ALIASES[contentId];
  }

  // 3. Lookup alias by name
  if (name && CHANNEL_ALIASES[name] && epgMap[CHANNEL_ALIASES[name]]) {
    return CHANNEL_ALIASES[name];
  }

  // 4. Direct match by name
  if (name && epgMap[name]) return name;

  // 5. Clean name
  const cleanName = name.replace(/fhd|hd|sd|\s+/g, '');
  if (cleanName && epgMap[cleanName]) return cleanName;

  // 6. Partial lookup
  for (const k of Object.keys(epgMap)) {
    if (name.includes(k) || k.includes(name) || (contentId && k.includes(contentId))) {
      return k;
    }
  }

  return null;
}

export function getCurrentProgramme(
  channel: Channel,
  targetTimestamp: string = '20260903223000'
): EpgProgramme {
  const epgKey = getEpgKeyForChannel(channel);
  if (epgKey && epgMap[epgKey]) {
    const list = epgMap[epgKey];
    for (const prog of list) {
      const s = prog.start.replace(/[^0-9]/g, '').slice(0, 14);
      const e = prog.stop.replace(/[^0-9]/g, '').slice(0, 14);
      if (s <= targetTimestamp && targetTimestamp < e) {
        return {
          ...prog,
          genre: channel.category || 'Live TV',
        };
      }
    }
    // If no exact time match, return first item for today
    const todayProg = list.find((p) => p.date === '2026-09-03');
    if (todayProg) {
      return {
        ...todayProg,
        genre: channel.category || 'Live TV',
      };
    }
  }

  // Authentic fallback if channel has no EPG
  return {
    title: `${channel.name} Siaran Langsung`,
    desc: `Tonton siaran langsung saluran ${channel.name} dalam kualiti definisi penuh HD di SSATV.`,
    start: '20260903220000',
    stop: '20260903230000',
    date: '2026-09-03',
    startHour: 22,
    timeSlot: '10:00 PM – 11:00 PM',
    genre: channel.category || 'Live TV',
  };
}

export function getTimelineSlotsForChannel(channel: Channel): {
  now: EpgProgramme;
  h9pm: EpgProgramme;
  h10pm: EpgProgramme;
  h11pm: EpgProgramme;
  h12am: EpgProgramme;
} {
  const epgKey = getEpgKeyForChannel(channel);
  const progs = epgKey ? epgMap[epgKey] || [] : [];

  const findSlot = (targetTime: string, labelTime: string, defaultTitle: string): EpgProgramme => {
    for (const p of progs) {
      const s = p.start.replace(/[^0-9]/g, '').slice(0, 14);
      const e = p.stop.replace(/[^0-9]/g, '').slice(0, 14);
      if (s <= targetTime && targetTime < e) {
        return p;
      }
    }
    return {
      title: defaultTitle,
      desc: `Siaran siaran saluran ${channel.name}.`,
      start: targetTime,
      stop: targetTime,
      date: targetTime.slice(0, 8),
      startHour: parseInt(targetTime.slice(8, 10), 10),
      timeSlot: labelTime,
      genre: channel.category,
    };
  };

  return {
    now: findSlot('20260903223000', '10:00 PM – 11:00 PM', `${channel.name} Live`),
    h9pm: findSlot('20260903210000', '9:00 PM – 10:00 PM', 'Slot Hiburan Perdana'),
    h10pm: findSlot('20260903220000', '10:00 PM – 11:00 PM', 'Slot Utama Malam'),
    h11pm: findSlot('20260903230000', '11:00 PM – 12:00 AM', 'Layar Terkini'),
    h12am: findSlot('20260904000000', '12:00 AM – 1:00 AM', 'Siaran Tengah Malam'),
  };
}
