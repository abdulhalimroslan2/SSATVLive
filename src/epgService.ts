export interface EpgProgram {
  currentTitle: string;
  nextTitle: string;
  startTimeStr: string;
  endTimeStr: string;
  progressPercent: number;
  remainingMinutes: number;
}

// Curated program schedules by channel type/name
const CHANNEL_PROGRAMS: Record<string, string[]> = {
  // RTM / Free-to-Air
  'tv1': [
    'Selamat Pagi Malaysia', 'Berita 1', 'Panorama Alam', 'Keluarga Kita',
    'Bicara Naratif', 'Berita Perdana RTM', 'Forum Perdana Ehwal Islam', 'Dunia Hari Ini'
  ],
  'tv2': [
    'Fresh Brew Morning', 'What Say You', 'Diva Pop', 'Kanta Komuniti',
    'Galeri Famili', 'Konsert Bintang', 'Late Night Blockbuster', 'Midnight Express'
  ],
  'tv3': [
    'Malaysia Hari Ini', 'Buletin 1:30', 'Wanita Hari Ini', 'Slot Akasia: Cinta & Takdir',
    'Buletin Utama TV3', 'Slot Samarinda: Dendam', 'Nightline Live', 'Cerekarama Pilihan'
  ],
  '8tv': [
    'Global Watch Mandarin', '8TV Express', 'Mandarin News Live', 'Family Feud Asia',
    'Chinese Drama Hit: Joy of Life', 'Living Delight', 'Night News Express'
  ],
  'tv9': [
    'CJ WOW Shop Pagi', 'Kapsul Agama', 'Berita TV9', 'Minda Muslimah',
    'Slot Diandra: Kasih Suci', 'Kuasa 3 Filem', 'Koleksi Komedi Klasik'
  ],
  'didik': [
    'Kelas SPM Matematik', 'Didik Sains Menengah', 'Bahasa Melayu Interaktif',
    'Celik Sejarah', 'Bengkel Peperiksaan', 'Kembara Ilmu Kanak-Kanak'
  ],
  'tvs': [
    'TVS Morning Talk', 'Utusan Borneo', 'Warta TVS 7', 'Lensa Kenyalang',
    'Borneo Adventure', 'Dramatizer Borneo', 'TVS Malam'
  ],
  'okey': [
    'Okey Pagi', 'Suara Generasi', 'Muzik Extra', 'Lensa Komuniti',
    'Pentas Seni', 'Dokumentari Khas', 'Okey Cinema'
  ],
  'al-hijrah': [
    'Assalamualaikum Pagi', 'Tadabbur Al-Quran', 'Berita Hijrah', 'Cinta Ilmu',
    'Halaqah Perdana', 'Kalam Hikmah', 'Eksklusif Hijrah'
  ],
  'awani': [
    'Awani Pagi', 'Buletin Awani 12', 'Agenda Awani Live', 'Awani 7:45',
    'Dialog Tiga Penjuru', 'Analisis Masa Depan', 'Awani Tonight'
  ],

  // Sukan / Sports
  'sports': [
    'Nadi Arena Pagi', 'Sorotan Liga Super Malaysia', 'Piala FA Malaysia Live',
    'Formasi Ekstra', 'Matchday Preview', 'Bual Sukan Eksklusif', 'Premier League Rewind'
  ],
  'mutv': [
    'Matchday Live Pre-Show', 'Manchester United vs Rivals', 'Red Voice Podcast',
    'Classic United Matches', 'Inside Carrington Training', 'Erik Ten Hag Press Review'
  ],

  // Hiburan / Malay Entertainment
  'ria': [
    'Gegar Vaganza Recap', 'MeleTOP Live Studio', 'Mega Drama: Andai Itu Takdirnya',
    'Gempak Most Wanted', 'Gegar Ria Karaoke', 'Maharaja Lawak Mega Highlights'
  ],
  'prima': [
    'Suamiku Encik Perfect', 'Dapur Tempur Masak', 'Cinta Buat Dara',
    'Rona Roni Makaroni', 'Drama Tiara', 'Prima Nostalgia'
  ],
  'ceria': [
    'Didi & Friends Mania', 'Upin & Ipin Musim Baharu', 'BoBoiBoy Galaxy S2',
    'Ceria Popstar Showcase', 'Mechamato The Animated Series', 'Keluarga Ceria'
  ],
  'sensasi': [
    'Slot Sensasi Malam', 'Drama Eksklusif Tonton', 'Bintang Glamour',
    'Sensasi Retro Filem', 'Gosip Selebriti Live', 'Slot Akasia Throwback'
  ],

  // Movies / Filem
  'movie': [
    'Blockbuster Premier: Oppenheimer', 'Dune: Part Two (4K)', 'The Batman Legends',
    'Fast & Furious Action Hour', 'P. Ramlee Cinema: Bujang Lapok', 'Action Cinema Midnight'
  ],

  // News / Berita
  'news': [
    'Morning World Briefing', 'Live Global Markets', 'Breaking News Desk',
    'The Lead Story', 'Global Focus Debate', 'Late Night World Roundup'
  ]
};

// Generic fallbacks by category
const CATEGORY_FALLBACKS: Record<string, string[]> = {
  'MALAYSIA': [
    'Selamat Pagi Malaysia', 'Buletin Utama Berita', 'Drama Akasia Terhangat',
    'Bicara Semasa', 'Mega Drama Eksklusif', 'Koleksi Filem Tempatan'
  ],
  'SPORTS_FHD': [
    'Live Sports Arena', 'Sorotan Gol & Aksi Terbaik', 'Piala Liga Super Live',
    'Analisis Sukan Perdana', 'Pusingan Akhir Kejohanan', 'Highlight Sukan Antarabangsa'
  ],
  'ENTERTAINMENT': [
    'Mega Show Variety', 'Konsert Bintang Langsung', 'Drama Bersiri Pilihan',
    'Realiti Hiburan Terkini', 'Cineplex Blockbuster', 'Showcase Hiburan Malam'
  ],
  'MOVIES': [
    'Tayangan Perdana Filem', 'Aksi Blockbuster Hollywood', 'Filem Klasik Pilihan',
    'Sinema Emas Asia', 'Mega Movie Midnight', 'Koleksi Pemenang Anugerah'
  ],
  'KIDS': [
    'Animasi Kanak-Kanak Ceria', 'Kembara Sains Si Cilik', 'Upin Ipin & Kawan-Kawan',
    'Didi & Friends Bernyanyi', 'Mechamato & Superhero', 'Kartun Hebat Malam'
  ],
  'NEWS': [
    'Warta Berita Terkini', 'Analisis Ekonomi & Politik', 'Laporan Khas Dunia',
    'Debat Isu Semasa', 'Berita Tengah Hari', 'Ringkasan Utama Malam'
  ],
  'LIFESTYLE': [
    'Dapur Idaman & Resipi', 'Kembara Gaya Hidup Tropika', 'Seni Hias Rumah Impian',
    'Kembara Rasa Asia', 'Kesihatan & Kecergasan', 'Gaya & Fesyen Glamour'
  ],
  'INTERNATIONAL': [
    'World Today Live', 'Global Documentary Discovery', 'International Panorama',
    'Prime Time Global Series', 'Asian Culture Special', 'World Midnight Review'
  ]
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Calculates real-time dynamic EPG schedule based on the current system clock time.
 */
export function getChannelEpg(channelId: string, channelName: string, category: string): EpgProgram {
  const now = new Date();
  const currentMinutesSinceMidnight = now.getHours() * 60 + now.getMinutes();

  // Determine program duration (slot length: 60 mins by default, 30 or 90 mins for sports/movies)
  const isMovieOrSports = category.includes('SPORTS') || category.includes('MOVIE');
  const slotLength = isMovieOrSports ? 90 : 60;

  // Calculate current slot index
  const slotIndex = Math.floor(currentMinutesSinceMidnight / slotLength);
  const slotStartMinutes = slotIndex * slotLength;
  const slotEndMinutes = slotStartMinutes + slotLength;

  // Find suitable programs array
  const nameKey = channelName.toLowerCase().replace(/[^a-z0-9]/g, '');
  let programList = CATEGORY_FALLBACKS[category.toUpperCase()] || CATEGORY_FALLBACKS['MALAYSIA'];

  for (const [k, list] of Object.entries(CHANNEL_PROGRAMS)) {
    if (nameKey.includes(k) || channelId.toLowerCase().includes(k)) {
      programList = list;
      break;
    }
  }

  // Pick current and next titles deterministically
  const seed = hashString(channelId + channelName);
  const curIdx = (slotIndex + seed) % programList.length;
  const nextIdx = (curIdx + 1) % programList.length;

  const currentTitle = programList[curIdx];
  const nextTitle = programList[nextIdx];

  // Format time strings (e.g. 11:00 AM)
  const formatTime = (totalMins: number) => {
    let hours = Math.floor(totalMins / 60) % 24;
    const mins = totalMins % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours}:${mins < 10 ? '0' : ''}${mins} ${ampm}`;
  };

  const startTimeStr = formatTime(slotStartMinutes);
  const endTimeStr = formatTime(slotEndMinutes);

  // Calculate real live progress
  const elapsedMinutes = currentMinutesSinceMidnight - slotStartMinutes;
  const progressPercent = Math.min(100, Math.max(5, Math.round((elapsedMinutes / slotLength) * 100)));
  const remainingMinutes = Math.max(1, slotEndMinutes - currentMinutesSinceMidnight);

  return {
    currentTitle,
    nextTitle,
    startTimeStr,
    endTimeStr,
    progressPercent,
    remainingMinutes,
  };
}
