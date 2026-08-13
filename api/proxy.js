export const config = {
  runtime: 'edge',
};

const ASTRO_UA = 'Mozilla/5.0 (Linux; Android 10; MiTV-AXSO0 Build/QTZCS200912.005) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36';

export default async function handler(req) {
  const url = new URL(req.url);
  const path = url.searchParams.get('path');
  
  if (!path) {
    return new Response('Missing path', { status: 400 });
  }
  
  let targetUrl = '';
  let headers = new Headers();
  
  // Astro Linear
  if (path.startsWith('/astro-linear/')) {
    targetUrl = path.replace('/astro-linear/', 'https://linearjitp-playback.astro.com.my/');
    headers.set('User-Agent', ASTRO_UA);
  } 
  // RTM Stream
  else if (path.startsWith('/rtm-stream/')) {
    targetUrl = path.replace('/rtm-stream/', 'https://d25tgymtnqzu8s.cloudfront.net/');
    headers.set('Origin', 'https://rtmklik.rtm.gov.my');
    headers.set('Referer', 'https://rtmklik.rtm.gov.my/');
  }
  // Other Cloudfront targeting (for RTM / others that need simple proxy)
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

  try {
    const response = await fetch(targetUrl, {
      headers: headers,
      redirect: 'follow'
    });
    
    // Copy headers from the target response
    const resHeaders = new Headers(response.headers);
    
    // Allow CORS
    resHeaders.set('Access-Control-Allow-Origin', '*');
    resHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    resHeaders.set('Access-Control-Allow-Headers', '*');
    
    // Make sure content-type is correct for video streams
    if (path.includes('.mpd')) resHeaders.set('Content-Type', 'application/dash+xml');
    else if (path.includes('.m3u8')) resHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
    else if (path.includes('.ts')) resHeaders.set('Content-Type', 'video/mp2t');
    else if (/\.(m4f|m4s|m4v|m4a|mp4)/.test(path)) resHeaders.set('Content-Type', 'video/mp4');

    // Edge functions can stream response body directly
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders
    });
  } catch (err) {
    return new Response('Proxy Error: ' + err.message, { status: 500 });
  }
}
