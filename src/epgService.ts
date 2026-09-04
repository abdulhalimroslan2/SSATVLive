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

export interface DynamicTimelineSlot {
  timeLabel: string;
  hour: number;
  programme: EpgProgramme;
  isNow: boolean;
}

export function formatEpgTime(date: Date): string {
  let h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  const mStr = m < 10 ? '0' + m : m;
  return `${h}:${mStr} ${ampm}`;
}

export function formatTimeSlot(start: Date, stop: Date): string {
  return `${formatEpgTime(start)} – ${formatEpgTime(stop)}`;
}

export function parseEpgTimestamp(raw: string): Date | null {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length < 14) return null;
  const y = parseInt(digits.slice(0, 4), 10);
  const m = parseInt(digits.slice(4, 6), 10) - 1;
  const d = parseInt(digits.slice(6, 8), 10);
  const h = parseInt(digits.slice(8, 10), 10);
  const min = parseInt(digits.slice(10, 12), 10);
  const s = parseInt(digits.slice(12, 14), 10);
  return new Date(y, m, d, h, min, s);
}

export function formatDateToTimestamp(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}${h}${min}${s}`;
}

export function getChannelEpg(
  channelOrId: Channel | string,
  channelName?: string,
  category?: string,
  referenceDate?: Date
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

  const now = referenceDate || new Date();
  const curr = getCurrentProgramme(ch, now);

  let startMs = 0;
  let stopMs = 0;
  const parsedStart = parseEpgTimestamp(curr.start);
  const parsedStop = parseEpgTimestamp(curr.stop);

  if (parsedStart && parsedStop) {
    startMs = parsedStart.getTime();
    stopMs = parsedStop.getTime();
  } else {
    const slotStart = new Date(now);
    slotStart.setMinutes(0, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(slotEnd.getHours() + 1);
    startMs = slotStart.getTime();
    stopMs = slotEnd.getTime();
  }

  const nowMs = now.getTime();
  const total = stopMs - startMs;
  let progressPercent = 50;
  let remainingMinutes = 30;

  if (total > 0) {
    const elapsed = Math.max(0, nowMs - startMs);
    progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    remainingMinutes = Math.max(1, Math.round((stopMs - nowMs) / 60000));
  }

  const nextProg = getNextProgramme(ch, curr, now);

  return {
    channelId: ch.id,
    currentTitle: curr.title,
    nextTitle: nextProg ? nextProg.title : 'Rancangan Seterusnya',
    startTimeStr: parsedStart
      ? formatEpgTime(parsedStart)
      : curr.timeSlot.split('–')[0]?.trim() || '12:00 AM',
    endTimeStr: parsedStop
      ? formatEpgTime(parsedStop)
      : curr.timeSlot.split('–')[1]?.trim() || '1:00 AM',
    progressPercent,
    remainingMinutes,
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

export function getNextProgramme(
  channel: Channel,
  currentProg: EpgProgramme,
  referenceDate: Date = new Date()
): EpgProgramme | null {
  const epgKey = getEpgKeyForChannel(channel);
  if (epgKey && epgMap[epgKey]) {
    const list = epgMap[epgKey];
    const idx = list.findIndex(
      (p) => p.title === currentProg.title && p.start === currentProg.start
    );
    if (idx !== -1 && idx + 1 < list.length) {
      return {
        ...list[idx + 1],
        genre: channel.category || 'Live TV',
      };
    }
  }

  const nextHourDate = new Date(referenceDate);
  nextHourDate.setHours(nextHourDate.getHours() + 1);
  return getProgrammeAtHour(channel, nextHourDate);
}

export function getProgrammeAtHour(
  channel: Channel,
  targetDate: Date
): EpgProgramme {
  const epgKey = getEpgKeyForChannel(channel);
  const targetTimestamp = formatDateToTimestamp(targetDate);
  const targetHour = targetDate.getHours();

  if (epgKey && epgMap[epgKey]) {
    const list = epgMap[epgKey];

    // 1. Direct timestamp match
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

    // 2. Start hour match in list
    const hourMatch = list.find((p) => p.startHour === targetHour);
    if (hourMatch) {
      return {
        ...hourMatch,
        genre: channel.category || 'Live TV',
      };
    }

    // 3. Match by formatted time slot
    const targetSlotStr = `${targetHour % 12 === 0 ? 12 : targetHour % 12}:`;
    const ampmStr = targetHour >= 12 ? 'PM' : 'AM';
    const slotMatch = list.find(
      (p) => p.timeSlot?.includes(targetSlotStr) && p.timeSlot?.includes(ampmStr)
    );
    if (slotMatch) {
      return {
        ...slotMatch,
        genre: channel.category || 'Live TV',
      };
    }
  }

  // Fallback for target hour
  const slotStart = new Date(targetDate);
  slotStart.setMinutes(0, 0, 0);
  const slotEnd = new Date(slotStart);
  slotEnd.setHours(slotEnd.getHours() + 1);

  return {
    title: `${channel.name} Siaran ${formatEpgTime(slotStart)}`,
    desc: '',
    start: formatDateToTimestamp(slotStart),
    stop: formatDateToTimestamp(slotEnd),
    date: `${slotStart.getFullYear()}-${String(slotStart.getMonth() + 1).padStart(2, '0')}-${String(slotStart.getDate()).padStart(2, '0')}`,
    startHour: slotStart.getHours(),
    timeSlot: formatTimeSlot(slotStart, slotEnd),
    genre: channel.category || 'Live TV',
  };
}

export function getCurrentProgramme(
  channel: Channel,
  referenceDateOrTimestamp?: Date | string
): EpgProgramme {
  let targetDate: Date;
  if (referenceDateOrTimestamp instanceof Date) {
    targetDate = referenceDateOrTimestamp;
  } else if (typeof referenceDateOrTimestamp === 'string') {
    const parsed = parseEpgTimestamp(referenceDateOrTimestamp);
    targetDate = parsed || new Date();
  } else {
    targetDate = new Date();
  }

  return getProgrammeAtHour(channel, targetDate);
}

export function getDynamicTimelineLabels(referenceDate: Date = new Date()): string[] {
  const currentHour = referenceDate.getHours();
  const labels = ['NOW'];
  for (let i = 1; i <= 4; i++) {
    const h = (currentHour + i) % 24;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    labels.push(`${h12} ${ampm}`);
  }
  return labels;
}

export function getDynamicTimelineSlotsForChannel(
  channel: Channel,
  referenceDate: Date = new Date()
): DynamicTimelineSlot[] {
  const currentHour = referenceDate.getHours();
  const slots: DynamicTimelineSlot[] = [];

  // Slot 0: NOW
  const curr = getCurrentProgramme(channel, referenceDate);
  slots.push({
    timeLabel: 'NOW',
    hour: currentHour,
    programme: curr,
    isNow: true,
  });

  // Next 4 slots
  for (let i = 1; i <= 4; i++) {
    const targetHour = (currentHour + i) % 24;
    const targetDate = new Date(referenceDate);
    targetDate.setHours(currentHour + i, 0, 0, 0);

    const ampm = targetHour >= 12 ? 'PM' : 'AM';
    const h12 = targetHour % 12 === 0 ? 12 : targetHour % 12;
    const timeLabel = `${h12} ${ampm}`;

    const prog = getProgrammeAtHour(channel, targetDate);
    slots.push({
      timeLabel,
      hour: targetHour,
      programme: prog,
      isNow: false,
    });
  }

  return slots;
}

export function getTimelineSlotsForChannel(
  channel: Channel,
  referenceDate: Date = new Date()
): {
  now: EpgProgramme;
  h9pm: EpgProgramme;
  h10pm: EpgProgramme;
  h11pm: EpgProgramme;
  h12am: EpgProgramme;
  dynamicSlots: DynamicTimelineSlot[];
} {
  const dynamicSlots = getDynamicTimelineSlotsForChannel(channel, referenceDate);
  return {
    now: dynamicSlots[0].programme,
    h9pm: dynamicSlots[1]?.programme || dynamicSlots[0].programme,
    h10pm: dynamicSlots[2]?.programme || dynamicSlots[0].programme,
    h11pm: dynamicSlots[3]?.programme || dynamicSlots[0].programme,
    h12am: dynamicSlots[4]?.programme || dynamicSlots[0].programme,
    dynamicSlots,
  };
}
