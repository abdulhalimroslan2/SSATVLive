export const config = {
  runtime: 'edge',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

// Unified static device fingerprint (Disguised as a single MiTV Android STB)
const UNIFIED_DEVICE_UA = 'Mozilla/5.0 (Linux; Android 10; MiTV-AXSO0 Build/QTZCS200912.005) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36';

// Windows Desktop Chrome User-Agent (OKCDN and Viu require Desktop UA; they return 400/403 to Android STBs)
const DESKTOP_CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Hetzner Nginx RAM tmpfs Edge Proxy (Request coalescing & multi-user cache)
const HETZNER_VPS_URL = 'http://2.29.23.90.sslip.io';

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  let path = url.searchParams.get('path') || url.pathname;
  
  if (path.startsWith('/api/proxy')) {
    path = path.replace('/api/proxy', '');
  }

  const queryParams = new URLSearchParams(url.searchParams);
  queryParams.delete('path');
  const remainingQueryString = queryParams.toString();
  
  let targetUrl = '';
  
  const isOkcdnOrViu = path.includes('okayru') || path.startsWith('/okcdn/') || path.startsWith('/viu-');
  const userAgent = isOkcdnOrViu ? DESKTOP_CHROME_UA : UNIFIED_DEVICE_UA;

  const headers = new Headers();
  headers.set('User-Agent', userAgent);
  headers.set('Accept', '*/*');
  headers.set('Accept-Language', 'en-US,en;q=0.9');

  // Astro Linear & VOD
  if (path.startsWith('/astro-linear/')) {
    targetUrl = path.replace('/astro-linear/', 'https://linearjitp-playback.astro.com.my/');
  } 
  else if (path.startsWith('/astro-vod/')) {
    targetUrl = path.replace('/astro-vod/', 'https://vodejitp-asset-playback-b.astro.com.my/');
  }
  else if (path.startsWith('/iris-synamedia/')) {
    const sub = path.replace('/iris-synamedia/', '');
    if (sub.startsWith('tenant/astroprd/vodejitp-asset-playback-b.astro.com.my/')) {
      targetUrl = 'https://vodejitp-asset-playback-b.astro.com.my/' + sub.replace('tenant/astroprd/vodejitp-asset-playback-b.astro.com.my/', '');
    } else {
      targetUrl = 'https://vod-dai-ott-ap.ssai.iris.synamedia.com/' + sub;
    }
  }
  else if (path.startsWith('/ngtv-vod/')) {
    targetUrl = path.replace('/ngtv-vod/', 'https://ngtv-vod.gcdn.co/');
  }
  else if (path.startsWith('/viu-vod/')) {
    targetUrl = path.replace('/viu-vod/', 'https://dms-api.viu.com/');
    headers.set('Origin', 'https://www.viu.com');
    headers.set('Referer', 'https://www.viu.com/');
  }
  else if (path.startsWith('/viu-key/')) {
    targetUrl = path.replace('/viu-key/', 'https://prod-in.viu.com/');
    headers.set('Origin', 'https://www.viu.com');
    headers.set('Referer', 'https://www.viu.com/');
  }
  else if (path.startsWith('/okcdn/')) {
    const match = path.match(/^\/okcdn\/(vd\d+\.okcdn\.ru)\/(.*)$/);
    if (match) {
      targetUrl = `https://${match[1]}/${match[2]}`;
    } else {
      targetUrl = path.replace('/okcdn/', 'https://vd466.okcdn.ru/');
    }
    headers.set('Origin', 'https://ok.ru');
    headers.set('Referer', 'https://ok.ru/');
  }
  // RTM Stream
  else if (path.startsWith('/rtm-stream/')) {
    targetUrl = path.replace('/rtm-stream/', 'https://d25tgymtnqzu8s.cloudfront.net/');
    headers.set('Origin', 'https://rtmklik.rtm.gov.my');
    headers.set('Referer', 'https://rtmklik.rtm.gov.my/');
  }
  // Cloudfront & CDN targeting
  else if (path.startsWith('/cf-d2xz/')) {
    targetUrl = path.replace('/cf-d2xz/', 'https://d2xz2v5wuvgur6.cloudfront.net/');
  }
  else if (path.startsWith('/cf-d2tj/')) {
    targetUrl = path.replace('/cf-d2tj/', 'https://d2tjypxxy769fn.cloudfront.net/');
  }
  else if (path.startsWith('/cf-d84q/')) {
    targetUrl = path.replace('/cf-d84q/', 'https://d84q7nw4qf3j3.cloudfront.net/');
  }
  else if (path.startsWith('/cf-d3b0/')) {
    targetUrl = path.replace('/cf-d3b0/', 'https://d3b0v7fggu5zwm.cloudfront.net/');
  }
  else if (path.startsWith('/cf-df14/')) {
    targetUrl = path.replace('/cf-df14/', 'https://df14pcdp16s98.cloudfront.net/');
  }
  else if (path.startsWith('/mana2/')) {
    targetUrl = path.replace('/mana2/', 'https://slive.mana2.my/');
  }
  else if (path.startsWith('/ptv2026/')) {
    if (path.includes('okayru')) {
      targetUrl = `https://ptv2026.com${path.replace('/ptv2026', '')}`;
      headers.set('Origin', 'https://ok.ru');
      headers.set('Referer', 'https://ok.ru/');
    } else {
      targetUrl = `${HETZNER_VPS_URL}${path}`;
    }
  }
  else if (path.startsWith('/load-ptv/')) {
    targetUrl = `${HETZNER_VPS_URL}${path}`;
  }
  else if (path.startsWith('/perfecttv/')) {
    targetUrl = `${HETZNER_VPS_URL}${path}`;
  }
  else if (path.startsWith('/gcdn-s/')) {
    targetUrl = `${HETZNER_VPS_URL}${path}`;
  }
  else if (path.startsWith('/gcdn/')) {
    targetUrl = `${HETZNER_VPS_URL}${path}`;
  }
  else if (path.startsWith('/gcdn-live/')) {
    targetUrl = `${HETZNER_VPS_URL}${path}`;
  }
  else {
    return new Response('Invalid path prefix', { status: 400 });
  }

  if (remainingQueryString) {
    targetUrl += (targetUrl.includes('?') ? '&' : '?') + remainingQueryString;
  }

  try {
    let fetchOptions = {
      method: request.method,
      headers: headers,
      redirect: path.includes('okayru') ? 'manual' : 'follow',
    };

    if (request.method === 'POST') {
      const incomingContentType = request.headers.get('content-type');
      if (incomingContentType) {
        headers.set('Content-Type', incomingContentType);
      } else {
        headers.set('Content-Type', 'application/octet-stream');
      }
      fetchOptions.body = await request.arrayBuffer();
    }

    let response;
    let usedEdgeProxy = false;
    try {
      response = await fetch(targetUrl, fetchOptions);
      if (!response.ok && response.status >= 500 && targetUrl.startsWith(HETZNER_VPS_URL)) {
        throw new Error(`Hetzner VPS returned status ${response.status}`);
      }
      if (targetUrl.startsWith(HETZNER_VPS_URL)) {
        usedEdgeProxy = true;
      }
    } catch (vpsErr) {
      if (targetUrl.startsWith(HETZNER_VPS_URL)) {
        let directUrl = targetUrl.replace(HETZNER_VPS_URL, '');
        if (directUrl.startsWith('/ptv2026/')) directUrl = directUrl.replace('/ptv2026/', 'https://ptv2026.com/');
        else if (directUrl.startsWith('/load-ptv/')) directUrl = directUrl.replace('/load-ptv/', 'https://load.ptv2026.com/');
        else if (directUrl.startsWith('/perfecttv/')) directUrl = directUrl.replace('/perfecttv/', 'https://get.perfecttv.net/');
        else if (directUrl.startsWith('/gcdn-s/')) directUrl = directUrl.replace('/gcdn-s/', 'https://ngtv-live-cbj.gcdn.co/');
        else if (directUrl.startsWith('/gcdn/')) directUrl = directUrl.replace('/gcdn/', 'http://ngtv-live-cbj.gcdn.co/');
        else if (directUrl.startsWith('/gcdn-live/')) directUrl = directUrl.replace('/gcdn-live/', 'https://ngtv-live.gcdn.co/');
        response = await fetch(directUrl, fetchOptions);
      } else {
        throw vpsErr;
      }
    }

    const responseHeaders = new Headers(response.headers);
    if (usedEdgeProxy) {
      responseHeaders.set('x-edge-cache-proxy', '2.29.23.90.sslip.io (Hetzner Helsinki)');
    }
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    // Strip any upstream tracking cookies
    responseHeaders.delete('set-cookie');

    // If it's okayru MPD/M3U8, rewrite relative paths and handle redirect
    if (path.includes('okayru')) {
      let redirTarget = response.headers.get('location');
      if (!redirTarget) {
        let text = await response.text();
        const match = text.match(/href="([^"]+)"/i);
        if (match) {
          redirTarget = match[1].replace(/&amp;/g, '&');
        } else if (response.status === 200 && (text.includes('<MPD') || text.includes('#EXTM3U'))) {
          redirTarget = response.url || targetUrl;
        }
      }

      if (redirTarget && redirTarget.startsWith('http')) {
        const okcdnHost = redirTarget.match(/https?:\/\/(vd\d+\.okcdn\.ru)/)?.[1] || 'vd466.okcdn.ru';
        const okcdnOrigin = `https://${okcdnHost}`;
        const basePath = redirTarget.substring(okcdnOrigin.length, redirTarget.lastIndexOf('/') + 1);

        const okcdnRes = await fetch(redirTarget, {
          headers: {
            'User-Agent': DESKTOP_CHROME_UA,
            'Origin': 'https://ok.ru',
            'Referer': 'https://ok.ru/',
          },
        });

        let text = await okcdnRes.text();

        if (path.includes('.mpd')) {
          text = text.replace(/<Period([^>]*)>/i, `<Period$1>\n    <BaseURL>/okcdn/${okcdnHost}${basePath}</BaseURL>`);
          text = text.replace(/<Location>[\s\S]*?<\/Location>/gi, '');
          responseHeaders.set('Content-Type', 'application/dash+xml');
          responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          return new Response(text, { status: 200, headers: responseHeaders });
        } else {
          // .m3u8 playlist
          const rewritten = text.split('\n').map(line => {
            const l = line.trim();
            if (l && !l.startsWith('#')) {
              if (l.startsWith('http')) {
                return l.replace(/https?:\/\/(vd\d+\.okcdn\.ru)\//, '/okcdn/$1/');
              }
              return `/okcdn/${okcdnHost}${basePath}${l}`;
            }
            return line;
          }).join('\n');
          responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
          responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          return new Response(rewritten, { status: 200, headers: responseHeaders });
        }
      }
    }

    // Rewrite Viu playlists, sub-playlists and encryption keys
    if (path.includes('get_viu.m3u8')) {
      let text = await response.text();
      text = text.replaceAll('https://dms-api.viu.com/', '/viu-vod/');
      text = text.replaceAll('https://get.perfecttv.net/', '/perfecttv/');
      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
      return new Response(text, { status: response.status, headers: responseHeaders });
    }

    if (path.startsWith('/viu-vod/') && (path.includes('.m3u8') || responseHeaders.get('content-type')?.includes('mpegurl'))) {
      let text = await response.text();
      text = text.replaceAll('https://prod-in.viu.com/', '/viu-key/');
      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
      return new Response(text, { status: response.status, headers: responseHeaders });
    }

    if (path.includes('get_viu_sub_playlist.m3u8')) {
      let text = await response.text();
      text = text.replaceAll('https://get.perfecttv.net/', '/perfecttv/');
      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
      return new Response(text, { status: response.status, headers: responseHeaders });
    }

    // If it's load-ptv rwt.m3u8, convert static loops into continuous infinite live sliding windows
    if (path.includes('rwt.m3u8')) {
      const text = await response.text();
      const lines = text.split('\n');
      const segments = [];
      let lastDuration = 10.0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#EXTINF:')) {
          const durMatch = line.match(/#EXTINF:([\d.]+)/);
          if (durMatch) lastDuration = parseFloat(durMatch[1]);
        } else if (line.endsWith('.ts') && !line.startsWith('#')) {
          segments.push({ file: line, duration: lastDuration });
        }
      }
      
      if (segments.length > 0) {
        const totalDuration = segments.reduce((sum, s) => sum + s.duration, 0);
        const nowSec = Date.now() / 1000;
        const cycleTime = nowSec % totalDuration;
        
        let cum = 0;
        let curIdx = 0;
        for (let i = 0; i < segments.length; i++) {
          if (cum + segments[i].duration > cycleTime) {
            curIdx = i;
            break;
          }
          cum += segments[i].duration;
        }
        
        const cycleCount = Math.floor(nowSec / totalDuration);
        const mediaSequence = cycleCount * segments.length + curIdx;
        
        let dynamicM3u8 = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:20\n#EXT-X-MEDIA-SEQUENCE:${mediaSequence}\n`;
        
        for (let i = 0; i < Math.max(5, segments.length); i++) {
          const s = segments[(curIdx + i) % segments.length];
          dynamicM3u8 += `#EXTINF:${s.duration.toFixed(6)},\n${s.file}\n`;
        }
        
        responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
        responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        return new Response(dynamicM3u8, {
          status: response.status,
          headers: responseHeaders,
        });
      }
    }

    // DASH MPD processing: strip <Location> to ensure player keeps polling original URL with KIDs, and upgrade BaseURL to HTTPS
    if (path.includes('.mpd')) {
      let text = await response.text();
      text = text.replace(/<Location>[\s\S]*?<\/Location>/gi, '');
      text = text.replace(/<BaseURL>http:\/\/ngtv-live-cbj\.gcdn\.co\//gi, '<BaseURL>https://ngtv-live-cbj.gcdn.co/');
      text = text.replace(/<BaseURL>http:\/\/ngtv-live\.gcdn\.co\//gi, '<BaseURL>https://ngtv-live.gcdn.co/');
      responseHeaders.set('Content-Type', 'application/dash+xml');
      responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      return new Response(text, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    // Static video chunk caching for zero-buffer edge acceleration
    if (/\.(ts|m4s|m4f|m4v|m4a|mp4)(\?|$)/i.test(path)) {
      responseHeaders.set('Cache-Control', 'public, max-age=120, s-maxage=300, stale-while-revalidate=600');
    } else if (/\.(mpd|m3u8)(\?|$)/i.test(path)) {
      responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
}
