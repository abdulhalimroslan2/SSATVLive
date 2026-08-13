const http = require('http');
http.createServer((req, res) => {
  console.log(req.method, req.url);
  console.log(req.headers);
  res.writeHead(200);
  res.end('ok');
}).listen(8080);
console.log('Listening on 8080');
