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
  
  // Anti-Tracking Header Sanitization:
  // Strips all client device signatures, real IPs, and tracking telemetry.
  // Upstream servers will only ever see 1 single MiTV device via the proxy IP.
  const headers = new Headers();
  headers.set('User-Agent', UNIFIED_DEVICE_UA);
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
  }
  else if (path.startsWith('/okcdn/')) {
    targetUrl = path.replace('/okcdn/', 'https://vd466.okcdn.ru/');
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
    targetUrl = path.replace('/ptv2026/', 'https://ptv2026.com/');
  }
  else if (path.startsWith('/load-ptv/')) {
    targetUrl = path.replace('/load-ptv/', 'https://load.ptv2026.com/');
  }
  else if (path.startsWith('/perfecttv/')) {
    targetUrl = path.replace('/perfecttv/', 'https://get.perfecttv.net/');
  }
  else if (path.startsWith('/gcdn-s/')) {
    targetUrl = path.replace('/gcdn-s/', 'https://ngtv-live-cbj.gcdn.co/');
  }
  else if (path.startsWith('/gcdn/')) {
    targetUrl = path.replace('/gcdn/', 'http://ngtv-live-cbj.gcdn.co/');
  }
  else if (path.startsWith('/gcdn-live/')) {
    targetUrl = path.replace('/gcdn-live/', 'https://ngtv-live.gcdn.co/');
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
      redirect: 'follow',
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

    const response = await fetch(targetUrl, fetchOptions);

    const responseHeaders = new Headers(response.headers);
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    // Strip any upstream tracking cookies
    responseHeaders.delete('set-cookie');

    // If it's okayru MPD/M3U8, rewrite relative paths and handle HTML redirect
    if (path.includes('okayru')) {
      let text = await response.text();

      // Check for HTML redirect page
      if (text.includes('Redirecting') || text.includes('href="')) {
        const match = text.match(/href="([^"]+)"/i);
        if (match) {
          const redirTarget = match[1].replace(/&amp;/g, '&');
          const redirRes = await fetch(redirTarget, { headers });
          text = await redirRes.text();
          const okcdnOrigin = redirTarget.match(/https?:\/\/[^/]+/)?.[0] || 'https://vd466.okcdn.ru';
          const basePath = redirTarget.substring(okcdnOrigin.length, redirTarget.lastIndexOf('/') + 1);
          const rewritten = text.split('\n').map(line => {
            const l = line.trim();
            if (l && !l.startsWith('#')) {
              if (l.startsWith('http')) {
                return l.replace(/https?:\/\/vd\d*\.okcdn\.ru\//, '/okcdn/');
              }
              return '/okcdn' + basePath + l;
            }
            return line;
          }).join('\n');
          responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
          return new Response(rewritten, { status: 200, headers: responseHeaders });
        }
      }

      const finalUrl = response.url || targetUrl;
      let host = 'https://ptv2026.com';
      try {
        if (finalUrl) host = new URL(finalUrl).origin;
      } catch (_) {}

      if (path.includes('.mpd')) {
        text = text.replace(/<BaseURL>\?/g, `<BaseURL>${host}/?`);
        responseHeaders.set('Content-Type', 'application/dash+xml');
      } else if (path.includes('.m3u8')) {
        const baseUrl = finalUrl.substring(0, finalUrl.lastIndexOf('/') + 1);
        text = text.split('\n').map(line => {
          if (line.trim() && !line.startsWith('#') && !line.startsWith('http')) {
            return baseUrl + line.trim();
          }
          return line;
        }).join('\n');
        responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
      }

      return new Response(text, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    // Rewrite Viu sub-playlists to use proxy
    if (path.includes('get_viu.m3u8')) {
      let text = await response.text();
      text = text.replaceAll('https://dms-api.viu.com/', '/viu-vod/');
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
