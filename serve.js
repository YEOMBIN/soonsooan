// 순수안피부과 가시안 — 로컬 미리보기 서버
// 이 컴퓨터(127.0.0.1)에서만 접속됩니다. 같은 와이파이의 다른 기기나 외부에서는 접속할 수 없습니다.
// 실행: node serve.js  (포트 바꾸기: node serve.js 5600)
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const HOST = '127.0.0.1';
const PORT = Number(process.argv[2]) || 5500;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.eot': 'application/vnd.ms-fontobject', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8'
};

http.createServer((req, res) => {
  let p;
  try { p = decodeURIComponent(req.url.split('?')[0]); } catch (e) { res.writeHead(400); return res.end(); }
  if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('없는 파일입니다: ' + p); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(PORT, HOST, () => {
  console.log('\n  순수안피부과 가시안 미리보기');
  console.log('  → http://' + HOST + ':' + PORT + '/\n');
  console.log('  이 컴퓨터에서만 열립니다. 종료: Ctrl + C\n');
});
