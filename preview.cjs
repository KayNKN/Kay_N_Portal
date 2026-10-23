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
    const headers = {'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
    if (req.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      let start = match && match[1] ? Number(match[1]) : 0;
      let end = match && match[2] ? Number(match[2]) : data.length - 1;
      if (match && !match[1] && match[2]) {
        start = Math.max(0, data.length - Number(match[2]));
        end = data.length - 1;
      }
      if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= data.length || start > end) {
        res.writeHead(416, {...headers, 'Content-Range':'bytes */' + data.length}).end();
        return;
      }
      end = Math.min(end, data.length - 1);
      res.writeHead(206, {...headers, 'Content-Range':`bytes ${start}-${end}/${data.length}`, 'Content-Length':end - start + 1});
      res.end(req.method === 'HEAD' ? undefined : data.subarray(start, end + 1));
      return;
    }
    res.writeHead(200, {...headers, 'Content-Length':data.length});
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}).listen(4173, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:4173/'));
