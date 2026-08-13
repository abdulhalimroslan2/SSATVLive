const fs = require('fs');
const http = require('http');
const https = require('https');

const playlist = fs.readFileSync('/tmp/playlist.m3u', 'utf8');
const blocks = playlist.split('#EXTINF:');

const sports = [];
for (const b of blocks) {
  if (b.includes('group-title="SPORTS') || b.includes('Arena') || b.includes('Bola') || b.includes('Sukan') || b.includes('Sport')) {
    const lines = b.trim().split('\n');
    const title = lines[0].split(',').pop().trim();
    const url = lines[lines.length - 1].trim();
    const keyLine = lines.find(l => l.includes('license_key='));
    let key = keyLine ? keyLine.replace('#KODIPROP:inputstream.adaptive.license_key=', '').trim() : null;
    if (key && key.startsWith('#')) key = key.slice(1);
    const uaLine = lines.find(l => l.includes('http-user-agent='));
    const ua = uaLine ? uaLine.replace('#EXTVLCOPT:http-user-agent=', '').trim() : null;
    
    if (url.startsWith('http')) {
      sports.push({ title, url, key, ua });
    }
  }
}

console.log(`Found ${sports.length} sports channels.`);

async function testStream(ch) {
  return new Promise((resolve) => {
    let testUrl = ch.url;
    const headers = {};
    if (ch.ua) headers['User-Agent'] = ch.ua;
    else headers['User-Agent'] = 'Mozilla/5.0 (Linux; Android 10; MiTV-AXSO0 Build/QTZCS200912.005) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36';

    const client = testUrl.startsWith('https') ? https : http;
    const req = client.get(testUrl, { headers, timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => { if (data.length < 500) data += chunk; });
      res.on('end', () => {
        resolve({ title: ch.title, url: ch.url, status: res.statusCode, key: ch.key, snippet: data.slice(0, 150) });
      });
    });

    req.on('error', (err) => {
      resolve({ title: ch.title, url: ch.url, status: 'ERR', error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ title: ch.title, url: ch.url, status: 'TIMEOUT' });
    });
  });
}

async function run() {
  const results = await Promise.all(sports.map(testStream));
  console.table(results.map(r => ({ title: r.title, status: r.status, hasKey: !!r.key, key: r.key ? r.key.slice(0, 20) + '...' : 'NONE', url: r.url.slice(0, 50) })));
  
  fs.writeFileSync('sports-results.json', JSON.stringify(results, null, 2));
}

run();
