import http from 'http';
import { spawn } from 'child_process';

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/cf-d2xz/')) {
    const targetUrl = req.url.replace('/cf-d2xz/', 'https://d2xz2v5wuvgur6.cloudfront.net/');
    
    const curl = spawn('curl', ['-s', targetUrl]);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', req.url.endsWith('.mpd') ? 'application/dash+xml' : (req.url.endsWith('.m4v') || req.url.endsWith('.m4s') || req.url.endsWith('.m4a') ? 'video/mp4' : 'application/octet-stream'));
    
    curl.stdout.pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(8085, () => {
  console.log('Curl proxy listening on 8085');
});
