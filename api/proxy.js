export const config = {
  runtime: 'edge',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

const ASTRO_UA = 'Mozilla/5.0 (Linux; Android 10; MiTV-AXSO0 Build/QTZCS200912.005) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36';

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  let path = url.pathname;
  
  if (path.startsWith('/api/proxy')) {
    path = path.replace('/api/proxy', '');
  }

  const remainingQueryString = url.searchParams.toString();
  
  let targetUrl = '';
  let headers = new Headers();
  
  // Astro Linear & VOD
  if (path.startsWith('/astro-linear/')) {
    targetUrl = path.replace('/astro-linear/', 'https://linearjitp-playback.astro.com.my/');
    headers.set('User-Agent', ASTRO_UA);
  } 
  else if (path.startsWith('/astro-vod/')) {
    targetUrl = path.replace('/astro-vod/', 'https://vodejitp-asset-playback-b.astro.com.my/');
    headers.set('User-Agent', ASTRO_UA);
  }
  else if (path.startsWith('/iris-synamedia/')) {
    targetUrl = path.replace('/iris-synamedia/', 'https://vod-dai-ott-ap.ssai.iris.synamedia.com/');
    headers.set('User-Agent', ASTRO_UA);
  }
  else if (path.startsWith('/ngtv-vod/')) {
    targetUrl = path.replace('/ngtv-vod/', 'https://ngtv-vod.gcdn.co/');
  }
  else if (path.startsWith('/viu-vod/')) {
    targetUrl = path.replace('/viu-vod/', 'https://dms-api.viu.com/');
  }
  // RTM Stream
  else if (path.startsWith('/rtm-stream/')) {
    targetUrl = path.replace('/rtm-stream/', 'https://d25tgymtnqzu8s.cloudfront.net/');
    headers.set('Origin', 'https://rtmklik.rtm.gov.my');
    headers.set('Referer', 'https://rtmklik.rtm.gov.my/');
  }
  // Other Cloudfront targeting
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
  else {
    return new Response('Invalid path prefix', { status: 400 });
  }

  if (remainingQueryString) {
    targetUrl += (targetUrl.includes('?') ? '&' : '?') + remainingQueryString;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: headers,
      redirect: 'follow',
    });

    const responseHeaders = new Headers(response.headers);
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

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
