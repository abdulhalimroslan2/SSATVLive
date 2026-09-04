import gzip
import json
import re
import os
from datetime import datetime, timezone, timedelta

MYT = timezone(timedelta(hours=8))

def parse_xmltv_date(s):
    m = re.match(r'(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})?', s)
    if not m:
        return None
    y, mon, d, h, mn, sc, tz_str = m.groups()
    dt = datetime(int(y), int(mon), int(d), int(h), int(mn), int(sc))
    if tz_str:
        sign = 1 if tz_str[0] == '+' else -1
        tz_h = int(tz_str[1:3])
        tz_m = int(tz_str[3:5])
        tz = timezone(sign * timedelta(hours=tz_h, minutes=tz_m))
        dt = dt.replace(tzinfo=tz)
    else:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(MYT)

def format_epg_time(dt):
    h = dt.hour
    m = dt.minute
    ampm = 'PM' if h >= 12 else 'AM'
    h12 = h % 12
    h12 = 12 if h12 == 0 else h12
    return f"{h12}:{m:02d} {ampm}"

def format_time_slot(st, sp):
    return f"{format_epg_time(st)} – {format_epg_time(sp)}"

def load_xml_programmes(path):
    print(f"Loading {path}...")
    with gzip.open(path, 'rt', encoding='utf-8', errors='ignore') as f:
        data = f.read()
    prog_map = {}
    prog_re = re.compile(r'<programme start=\"([^\"]+)\" stop=\"([^\"]+)\" channel=\"([^\"]+)\">(.*?)</programme>', re.DOTALL)
    for m in prog_re.finditer(data):
        st_raw, sp_raw, ch, body = m.group(1), m.group(2), m.group(3), m.group(4)
        if ch not in prog_map:
            prog_map[ch] = []
        st = parse_xmltv_date(st_raw)
        sp = parse_xmltv_date(sp_raw)
        if not st or not sp:
            continue
        title_m = re.search(r'<title[^>]*>(.*?)</title>', body)
        desc_m = re.search(r'<desc[^>]*>(.*?)</desc>', body)
        title = title_m.group(1).strip() if title_m else 'Program'
        desc = desc_m.group(1).strip() if desc_m else ''
        title = title.replace('&amp;', '&').replace('&quot;', '"').replace('&apos;', "'").replace('&#39;', "'")
        desc = desc.replace('&amp;', '&').replace('&quot;', '"').replace('&apos;', "'").replace('&#39;', "'")
        if len(desc) > 180:
            desc = desc[:177] + '...'
        prog_map[ch].append({
            'title': title,
            'desc': desc,
            'st': st,
            'sp': sp
        })
    return prog_map

# Master mapping from mockData channel identifier to (source, channel_id)
MAPPING = {
    # MALAYSIA
    'tv1': ('unifi', '101'),
    'tv2': ('unifi', '102'),
    'tv3': ('unifi', '103'),
    'tv3 fhd': ('unifi', '103'),
    'tv3 sd': ('unifi', '103'),
    'didik tv': ('unifi', '107'),
    '147': ('unifi', '107'),
    '8tv': ('unifi', '108'),
    'tv9': ('unifi', '109'),
    '122': ('unifi', '122'),
    'tvs': ('unifi', '122'),
    '146': ('rtm', 'Okey'),
    'okey': ('rtm', 'Okey'),
    'al-hijrah': ('unifi', '114'),
    '114': ('unifi', '114'),
    'awani': ('astro', 'AstroAwani'),
    '501': ('astro', 'AstroAwani'),
    'sensasi': ('unifi', '116'),
    'inspirasi': ('unifi', '118'),
    'salamhd': ('unifi', '113'),
    'salam hd': ('unifi', '113'),
    'pesonahd': ('unifi', '141'),
    'pesona hd': ('unifi', '141'),
    '106': ('astro', 'AstroOasis'),
    'oasis': ('astro', 'AstroOasis'),
    '104': ('astro', 'AstroRia'),
    'ria': ('astro', 'AstroRia'),
    '105': ('astro', 'AstroPrima'),
    'prima': ('astro', 'AstroPrima'),
    'warnahd': ('astro', 'AstroCitra'),
    'warna': ('astro', 'AstroCitra'),
    'citra': ('astro', 'AstroCitra'),
    'astrocitra': ('astro', 'AstroCitra'),
    'ceria': ('astro', 'AstroCeria'),
    '611': ('astro', 'AstroCeria'),
    'jomngaji': ('sooka', 'JomNgaji'),
    'lawaksentral': ('sooka', 'LawakSentral'),
    'ohmyceria': ('sooka', 'OhMyCeria'),
    'dramahebat': ('sooka', 'DramaHebat'),
    'filemmantap': ('sooka', 'FilemMantap'),
    'dramahotpot': ('sooka', 'DramaHotpot'),
    'awesome': ('sooka', 'FilemMantap'),
    'enjoy tv5': ('unifi', '101'),

    # INDONESIA
    'rcti': ('indo', 'RCTI.id'),
    'mnctv': ('indo', 'MNCTV.id'),
    'gtv': ('indo', 'GTV.id'),
    'transtv': ('indo', 'TransTV.id'),
    'trans7': ('indo', 'Trans7.id'),
    'sctv': ('indo', 'SCTV.id'),
    'indosiar': ('indo', 'Indosiar.id'),
    'tvone': ('indo', 'tvOne.id'),
    'antv': ('indo', 'ANTV.id'),
    'kompastv': ('indo', 'KompasTV.id'),
    'metrotv': ('indo', 'MetroTV.id'),
    'metr0 tv': ('indo', 'MetroTV.id'),
    'daaitv': ('indo', 'BTV.id'),
    'moji': ('indo', 'SCTV.id'),
    'mdtv': ('indo', 'MDTV.id'),

    # CHINESE
    'tvb jade': ('unifi', '231'),
    'tvbjade': ('unifi', '231'),
    'tvb classic': ('astro', 'TVBClassic'),
    'tvbclassic': ('astro', 'TVBClassic'),
    'tvb xing he': ('unifi', '232'),
    'tvbxinghe': ('unifi', '232'),
    'tvbs asia': ('astro', 'TVBSAsia'),
    'tvbsasia': ('astro', 'TVBSAsia'),
    'cctv4': ('unifi', '235'),
    'phoenix hk': ('unifi', '236'),
    'phoenix chinese': ('astro', 'PhoenixChineseChannel'),
    'phoenix chinese channel': ('astro', 'PhoenixChineseChannel'),
    '325': ('astro', 'PhoenixChineseChannel'),
    'phoenix info': ('astro', 'PhoenixInfoNews'),
    'cti asia': ('astro', 'CTIAsia'),
    'iqiyi': ('astro', 'iQIYI'),
    'seti': ('unifi', '239'),
    'tvb entertainment news': ('astro', 'TVBEntertainmentNews'),
    '317': ('astro', 'TVBEntertainmentNews'),

    # KOREAN
    'tvn': ('unifi', '211'),
    'tvn hd': ('unifi', '211'),
    '395': ('unifi', '211'),
    'kbs world': ('astro', 'KBSWorld'),
    'kbsworld': ('astro', 'KBSWorld'),
    '393': ('astro', 'AstroDaebak'),
    'daebak': ('astro', 'AstroDaebak'),
    '396': ('unifi', '462'),
    'k+': ('unifi', '462'),
    'kplus': ('unifi', '462'),
    'aniplus': ('astro', 'Aniplus'),
    'tvn movies': ('unifi', '201'),
    '416': ('unifi', '201'),

    # INDIAN
    'sun tv': ('astro', 'SunTV'),
    'suntv': ('astro', 'SunTV'),
    'ktv': ('astro', 'KTV'),
    '214': ('astro', 'Adithya'),
    'aditya': ('astro', 'Adithya'),
    'sun music': ('astro', 'SunMusic'),
    'sunmusic': ('astro', 'SunMusic'),
    'colors tamil': ('astro', 'ColorsTamil'),
    'colorstamil': ('astro', 'ColorsTamil'),
    'zee tamil': ('unifi', '311'),
    'zeetamil': ('unifi', '311'),
    'zee cinema': ('unifi', '333'),
    'zeecinema': ('unifi', '333'),
    'star vijay': ('astro', 'StarVijay'),
    'starvijay': ('astro', 'StarVijay'),
    'colors hindi': ('astro', 'ColorsHD'),
    'colorshindi': ('astro', 'ColorsHD'),
    'chintu tv': ('astro', 'SunTV'),
    'chintutv': ('astro', 'SunTV'),
    'sun life': ('astro', 'SunLife'),
    '217': ('astro', 'SunLife'),

    # MOVIES (28 CHANNELS)
    '100': ('unifi', '289'),
    'ccm': ('unifi', '289'),
    'celestial classic movies': ('unifi', '289'),
    '506': ('unifi', '288'),
    'celestial movies': ('unifi', '288'),
    'celestialmovies': ('unifi', '288'),
    'boo': ('astro', 'AstroBoo'),
    '401': ('astro', 'AstroBoo'),
    'fam-time': ('astro', 'AstroFAMTime'),
    'fam time': ('astro', 'AstroFAMTime'),
    'famtime': ('astro', 'AstroFAMTime'),
    '402': ('astro', 'AstroFAMTime'),
    'showtime': ('astro', 'AstroShowtime'),
    '403': ('astro', 'AstroShowtime'),
    'showcase-movies': ('astro', 'AstroShowcase'),
    'showcase movies': ('astro', 'AstroShowcase'),
    '404': ('astro', 'AstroShowcase'),
    'rockaction': ('unifi', '474'),
    'rock action': ('unifi', '474'),
    'rock-action': ('unifi', '474'),
    '405': ('unifi', '474'),
    'rock-xstream': ('astro', 'RockXStream'),
    'rockxstream': ('astro', 'RockXStream'),
    'rock xstream': ('astro', 'RockXStream'),
    '406': ('astro', 'RockXStream'),
    'tvnmovies': ('unifi', '201'),
    'tvn-movies': ('unifi', '201'),
    'tvnmovieshd': ('unifi', '201'),
    '407': ('unifi', '201'),
    'dunia-sinema': ('unifi', '128'),
    'dunia sinema': ('unifi', '128'),
    'duniasinema': ('unifi', '128'),
    'duniasinemahd': ('unifi', '128'),
    '408': ('unifi', '128'),
    'siar': ('unifi', '121'),
    '409': ('unifi', '121'),
    'degup': ('unifi', '120'),
    '410': ('unifi', '120'),
    'hbo': ('unifi', '401'),
    'hbo hd': ('unifi', '401'),
    'hbohd': ('unifi', '401'),
    '411': ('unifi', '401'),
    'hbo-hits': ('unifi', '402'),
    'hbo hits': ('unifi', '402'),
    'hbohits': ('unifi', '402'),
    '412': ('unifi', '402'),
    'hbo-family': ('unifi', '403'),
    'hbo family': ('unifi', '403'),
    'hbofamily': ('unifi', '403'),
    '413': ('unifi', '403'),
    'cinemax': ('unifi', '405'),
    '414': ('unifi', '405'),
    'hitsmovies': ('unifi', '407'),
    'hits movies': ('unifi', '407'),
    'hits-movies': ('unifi', '407'),
    '415': ('unifi', '407'),
    'galaxy': ('indo', 'GALAXY.id'),
    '148': ('indo', 'GALAXY.id'),
    'thrill': ('indo', 'Thrill.id'),
    '149': ('indo', 'Thrill.id'),
    'imc': ('indo', 'IMC.id'),
    '150': ('indo', 'IMC.id'),
    'cineedge': ('indo', 'CineEdge.id'),
    '160': ('indo', 'CineEdge.id'),
    'superrix': ('indo', 'Superrix.id'),
    '161': ('indo', 'Superrix.id'),
    'uniques': ('indo', 'Uniques.id'),
    '162': ('indo', 'Uniques.id'),
    'moviesnow': ('indo', 'HitsMovies.id'),
    'movies-now': ('indo', 'HitsMovies.id'),
    'movies now': ('indo', 'HitsMovies.id'),
    '163': ('indo', 'HitsMovies.id'),
    'mnx': ('indo', 'HitsMovies.id'),
    'mnx-hd': ('indo', 'HitsMovies.id'),
    'mnx hd': ('indo', 'HitsMovies.id'),
    '164': ('indo', 'HitsMovies.id'),
    'mnplus': ('indo', 'HitsMovies.id'),
    'mn-plus': ('indo', 'HitsMovies.id'),
    'mn plus': ('indo', 'HitsMovies.id'),
    '165': ('indo', 'HitsMovies.id'),
    'moviesphere': ('indo', 'StudioUniversal.id'),
    'moviesphere-fhd': ('indo', 'StudioUniversal.id'),
    'moviesphere fhd': ('indo', 'StudioUniversal.id'),
    '166': ('indo', 'StudioUniversal.id'),
    'outersphere': ('indo', 'StudioUniversal.id'),
    '167': ('indo', 'StudioUniversal.id'),

    # ENTERTAINMENT
    'axn': ('unifi', '453'),
    'kix': ('indo', 'KIX.id'),
    'warnertv': ('unifi', '451'),
    'warner tv': ('unifi', '451'),
    'rockentertainment': ('unifi', '473'),
    'rock entertainment': ('unifi', '473'),
    'hgtv': ('unifi', '511'),
    'lifetime': ('astro', 'Lifetime'),
    'hits': ('unifi', '454'),
    'hits now': ('unifi', '452'),
    'hitsnow': ('unifi', '452'),
    '714': ('astro', 'CrimeInvestigation'),
    'crime investigation hd': ('astro', 'CrimeInvestigation'),

    # KNOWLEDGE
    'history': ('astro', 'History'),
    'history hd': ('astro', 'History'),
    '555': ('astro', 'History'),
    'discovery': ('astro', 'DiscoveryChannel'),
    'discovery hd': ('astro', 'DiscoveryChannel'),
    '552': ('astro', 'DiscoveryChannel'),
    'discovery asia': ('astro', 'DiscoveryAsia'),
    'discoveryasia': ('astro', 'DiscoveryAsia'),
    'love nature': ('unifi', '502'),
    'lovenature': ('unifi', '502'),
    'tlc': ('astro', 'TLC'),
    'dmax': ('astro', 'DiscoveryChannel'),
    'dmax hd': ('astro', 'DiscoveryChannel'),
    'afn': ('unifi', '521'),
    'asian food network': ('unifi', '521'),
    'bbc earth': ('unifi', '501'),
    'bbcearth': ('unifi', '501'),
    'global trekker': ('indo', 'GlobalTrekker.id'),
    'globaltrekker': ('indo', 'GlobalTrekker.id'),

    # KIDS
    'animax': ('unifi', '472'),
    'animax hd': ('unifi', '472'),
    'cartoon network': ('unifi', '556'),
    'cartoonnetwork': ('unifi', '556'),
    'cbeebies': ('unifi', '553'),
    'dreamworks': ('unifi', '550'),
    'nickelodeon': ('unifi', '554'),
    'nick jr': ('unifi', '552'),
    'nickjr': ('unifi', '552'),
    'nick junior': ('unifi', '552'),
    '617': ('unifi', '552'),
    'moonbug': ('unifi', '551'),
    'blippi': ('astro', 'BlippiandFriends'),
    'blippi and friends': ('astro', 'BlippiandFriends'),
    '619': ('astro', 'BlippiandFriends'),

    # NEWS
    'berita rtm': ('rtm', 'Berita RTM'),
    'astro awani': ('astro', 'AstroAwani'),
    'bernama': ('unifi', '631'),
    'bbc news': ('unifi', '601'),
    'bbcnews': ('unifi', '601'),
    'aljazeera': ('unifi', '602'),
    'al-jazeera english': ('unifi', '602'),
    'cnn': ('astro', 'CNN'),
    'cna': ('unifi', '611'),
    'cnbc': ('astro', 'CNBCAsia'),
    'cnbc asia': ('astro', 'CNBCAsia'),
    '516': ('astro', 'CNBCAsia'),
    'bloomberg': ('astro', 'BloombergTV'),
    'bloomberg tv': ('astro', 'BloombergTV'),
    '517': ('astro', 'BloombergTV'),
    'cgtn': ('astro', 'CGTN'),
    '503': ('astro', 'CGTN'),
    '603': ('astro', 'CGTN'),
    'abc australia': ('unifi', '641'),
    '518': ('unifi', '641'),

    # SPORTS FHD
    'unifi-sport': ('unifi', '701'),
    'unifi sport': ('unifi', '701'),
    '701': ('unifi', '701'),
    'arena-fhd': ('astro', 'AstroArena'),
    'arena fhd': ('astro', 'AstroArena'),
    '801': ('astro', 'AstroArena'),
    'arena-2-fhd': ('astro', 'AstroArenaBola'),
    'arena 2 fhd': ('astro', 'AstroArenaBola'),
    '802': ('astro', 'AstroArenaBola'),
    'football': ('astro', 'AstroFootball'),
    '814': ('astro', 'AstroFootball'),
    'badminton': ('astro', 'AstroBadminton'),
    '815': ('astro', 'AstroBadminton'),
    'badminton-2': ('astro', 'AstroSportsPlus'),
    'badminton 2': ('astro', 'AstroSportsPlus'),
    '816': ('astro', 'AstroSportsPlus'),
    'sports-plus': ('astro', 'AstroSportsPlus2'),
    'sports plus': ('astro', 'AstroSportsPlus2'),
    '817': ('astro', 'AstroSportsPlus2'),
    'tennis': ('astro', 'AstroTennis'),
    '818': ('astro', 'AstroTennis'),
    'bein-fhd': ('unifi', '708'),
    'bein fhd': ('unifi', '708'),
    '819': ('unifi', '708'),
    'bein-2-fhd': ('unifi', '709'),
    'bein 2 fhd': ('unifi', '709'),
    '820': ('unifi', '709'),
    'bein-3-fhd': ('unifi', '710'),
    'bein 3 fhd': ('unifi', '710'),
    '821': ('unifi', '710'),
    'bein-4-fhd': ('unifi', '711'),
    'bein 4 fhd': ('unifi', '711'),
    '822': ('unifi', '711'),
    'spotv-fhd': ('unifi', '706'),
    'spotv fhd': ('unifi', '706'),
    '823': ('unifi', '706'),
    'spotv2-fhd': ('unifi', '707'),
    'spotv2 fhd': ('unifi', '707'),
    '824': ('unifi', '707'),
    'w-sport-fhd': ('astro', 'W-Sport'),
    'w sport fhd': ('astro', 'W-Sport'),
    '825': ('astro', 'W-Sport'),
    'golf': ('astro', 'AstroGolf'),
    '826': ('astro', 'AstroGolf'),
    'cricbuzz': ('astro', 'Cricbuzz'),
    '827': ('astro', 'Cricbuzz'),
    'premier-sport': ('astro', 'PremierSports'),
    'premier sport': ('astro', 'PremierSports'),
    '828': ('astro', 'PremierSports'),
    'rtm-sukan': ('rtm', 'Sukan RTM'),
    'rtm sukan': ('rtm', 'Sukan RTM'),
    '111': ('rtm', 'Sukan RTM')
}

def main():
    sources = {
        'unifi': load_xml_programmes('/tmp/unifitv.xml.gz'),
        'astro': load_xml_programmes('/tmp/astro.xml.gz'),
        'sooka': load_xml_programmes('/tmp/sooka.xml.gz'),
        'rtm': load_xml_programmes('/tmp/rtmklik.xml.gz'),
        'indo': load_xml_programmes('/tmp/indonesia.xml.gz'),
    }

    with open('src/mockData.ts') as f:
        channels = json.loads(re.search(r'export const MOCK_CHANNELS: Channel\[\] = (\[.*?\]);', f.read(), re.DOTALL).group(1))

    # Keep programs from 2026-09-04 12:00:00 to 2026-09-06 23:59:59 MYT (~60 hours)
    cutoff_start = datetime(2026, 9, 4, 12, 0, 0, tzinfo=MYT)
    cutoff_end = datetime(2026, 9, 6, 23, 59, 59, tzinfo=MYT)

    raw_epg = {}

    def clean(s):
        return re.sub(r'[^a-z0-9]', '', s.lower())

    for c in channels:
        cat = c.get('category', '')
        if cat == 'RADIO':
            continue

        cid = (c.get('contentId') or '').lower().strip()
        cnum = (c.get('ch_number') or '').strip()
        cname = (c.get('name') or '').lower().strip()

        source_info = None
        for k in [cid, cnum, cname, clean(cname)]:
            if k in MAPPING:
                source_info = MAPPING[k]
                break

        if not source_info:
            print(f"Warning: No source mapping for {cname} ({cid})")
            continue

        s_type, s_chid = source_info
        prog_list = sources.get(s_type, {}).get(s_chid, [])
        if not prog_list and s_type == 'rtm' and s_chid == 'Okey':
            prog_list = sources.get('astro', {}).get('TVOkey', [])

        converted = []
        for p in prog_list:
            st = p['st']
            sp = p['sp']
            if sp < cutoff_start or st > cutoff_end:
                continue
            converted.append({
                "title": p['title'],
                "desc": p['desc'],
                "start": st.strftime("%Y%m%d%H%M%S +0800"),
                "stop": sp.strftime("%Y%m%d%H%M%S +0800"),
                "date": st.strftime("%Y-%m-%d"),
                "startHour": st.hour,
                "timeSlot": format_time_slot(st, sp),
                "genre": cat
            })

        # Register primarily under contentId, and canonical keys
        keys_to_set = set()
        if cid:
            keys_to_set.add(cid)
        if cnum:
            keys_to_set.add(cnum)
        if cname:
            keys_to_set.add(cname)

        if 'cinemax' in cname or cid == 'cinemax':
            keys_to_set.update(['cinemax', '414'])
        if 'okey' in cname or cid == '146' or cnum == '146':
            keys_to_set.update(['okey', '146'])
        if 'tvn' in cname and 'movie' in cname:
            keys_to_set.update(['tvnmovies', 'tvnmovieshd', 'tvn-movies', '407', '416'])
        if 'hbo' in cname and 'hits' in cname:
            keys_to_set.update(['hbohits', 'hbo-hits', '412', '402'])
        if 'hbo' in cname and 'family' in cname:
            keys_to_set.update(['hbofamily', 'hbo-family', '413', '403'])
        if cname == 'hbo' or cid == 'hbo':
            keys_to_set.update(['hbo', 'hbohd', '411', '401'])

        for k in keys_to_set:
            if k:
                raw_epg[k] = converted

    print(f"Total keys in generated EPG: {len(raw_epg)}")
    out_path = 'src/liveEpgData.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(raw_epg, f, ensure_ascii=False, separators=(',', ':'))

    print(f"Successfully saved {out_path} ({os.path.getsize(out_path)} bytes)")

if __name__ == '__main__':
    main()
