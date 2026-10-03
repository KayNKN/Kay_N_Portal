const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;
const pages = ['index.html', 'about.html', 'contact.html', 'games.html', 'log.html'];
const files = new Set();

function add(reference) {
  if (!reference || /^(?:[a-z]+:|#|\/\/)/i.test(reference)) return;
  const name = decodeURIComponent(reference.split(/[?#]/)[0]);
  if (!name) return;
  const absolute = path.resolve(root, name);
  const relative = path.relative(root, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).some(p => p.startsWith('.'))) {
    throw new Error('Unsafe asset path: ' + name);
  }
  if (!fs.statSync(absolute).isFile()) throw new Error('Missing file: ' + name);
  if (files.has(relative)) return;
  files.add(relative);
  if (/\.(html|css|js)$/.test(name)) {
    const source = fs.readFileSync(absolute, 'utf8');
    if (name.endsWith('.js')) new vm.Script(source, {filename: name});
    if (name.endsWith('.html')) {
      for (const match of source.matchAll(/(?:src|href)="([^"]+)"/g)) add(match[1]);
    }
    if (name.endsWith('.css')) {
      for (const match of source.matchAll(/url\(["']?([^"')]+)["']?\)/g)) add(match[1]);
    }
  }
}

pages.forEach(add);
const context = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'content.js'), 'utf8'), context);
function collect(value) {
  if (typeof value === 'string' && /^(art|downloads|fonts|music|audio)\//.test(value)) add(value);
  else if (Array.isArray(value)) value.forEach(collect);
  else if (value && typeof value === 'object') Object.values(value).forEach(collect);
}
collect(context.window.KN);
add(context.window.KN.artwork.tabIcon);
add('fonts/terminus/COPYING');
add('fonts/terminus/README.md');
add('CNAME');

console.log('Checked: ' + files.size + ' website files in the repository. No files copied.');
