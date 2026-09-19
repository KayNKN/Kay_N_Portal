const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../main.js'), 'utf8');

test('homepage and archive show newest dates first without reordering content', () => {
  const entries = [
    {date: '2026-08-02', title: 'Devlog'},
    {date: '2025-12-31', title: 'Previous year'},
    {date: '2026-08-08', title: 'Release'},
    {date: '2026-09-16', title: 'Update'},
    {date: '2026-08-08', title: 'Same day'}
  ];
  const node = () => ({children: [], appendChild(child) { this.children.push(child); }});
  const home = node(), archive = node(), last = node();
  const context = {
    KN: {logs: entries},
    document: {getElementById: id => ({'last-tx': last, 'home-log': home, archive})[id]},
    el: (tag, cls, text) => Object.assign(node(), {text}),
    logRow: entry => entry.title, archiveRow: entry => entry.title,
    daysSince: date => date, agoText: date => date
  };
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('  var logs ='), source.indexOf('  var pad =')), context);
  vm.runInContext(source.slice(source.indexOf('  var lastTx ='), source.indexOf('  var musicLibrary =')), context);
  vm.runInContext(source.slice(source.indexOf('  var archive ='), source.indexOf('  var buildList =')), context);
  assert.deepEqual(home.children, ['Update', 'Release', 'Same day', 'Devlog', 'Previous year']);
  assert.deepEqual(archive.children[1].children, ['Update', 'Release', 'Same day', 'Devlog']);
  assert.equal(archive.children[2].text, '- 2025 -');
  assert.equal(last.textContent, '2026-09-16');
  assert.equal(entries[0].title, 'Devlog');
});
