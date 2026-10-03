const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.gif':'image/gif','.webp':'image/webp','.mp4':'video/mp4','.webm':'video/webm','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.ttf':'font/ttf','.woff2':'font/woff2'};
Object.assign(types, {'.mp3':'audio/mpeg', '.wav':'audio/wav', '.ogg':'audio/ogg', '.m4a':'audio/mp4', '.flac':'audio/flac'});
http.createServer((req, res) => {
  let name;
  try { name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html'; }
  catch { res.writeHead(400).end(); return; }
  const file = path.resolve(root, name);
  const relative = path.relative(root, file);
  if (relative.startsWith('..') || path.isAbsolute(relative) || relative.split(/[\\/]/).some(p => p.startsWith('.') || p === 'output' || p === 'tests')) {
    res.writeHead(403).end(); return;
  }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store'});
    res.end(data);
  });
}).listen(4173, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:4173/'));
