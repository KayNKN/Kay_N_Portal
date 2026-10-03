const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../main.js'), 'utf8');
const counterSource = source.slice(source.indexOf('  var counterEl ='), source.indexOf('  /* I clear old registration'));
const day = 24 * 60 * 60 * 1000;
const start = Date.UTC(2026, 9, 3);

function load(storage, now) {
  const counter = {textContent: ''};
  vm.runInNewContext(counterSource, {
    document: {getElementById: () => counter},
    Date: {now: () => now},
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value)
    }
  });
  return counter.textContent;
}

test('first visit counts once; refreshes and page loads within 24 hours do not', () => {
  const storage = new Map();
  assert.equal(load(storage, start), 'Visits:: 1');
  assert.equal(load(storage, start), 'Visits:: 1');
  assert.equal(load(storage, start + day - 1), 'Visits:: 1');
  assert.equal(storage.get('kn-last-visit'), String(start));
});

test('exactly 24 hours adds one visit and starts the next interval', () => {
  const storage = new Map();
  load(storage, start);
  assert.equal(load(storage, start + day), 'Visits:: 2');
  assert.equal(load(storage, start + day + 1), 'Visits:: 2');
  assert.equal(storage.get('kn-last-visit'), String(start + day));
  assert.equal(load(storage, start + 5 * day), 'Visits:: 3');
});

test('an existing count is preserved when daily counting starts', () => {
  const storage = new Map([['kn-visits', '42']]);
  assert.equal(load(storage, start), 'Visits:: 43');
  assert.equal(load(storage, start + 1), 'Visits:: 43');
});

test('invalid timestamps recover and a backward clock does not add visits', () => {
  const storage = new Map([['kn-visits', '7'], ['kn-last-visit', 'invalid']]);
  assert.equal(load(storage, start), 'Visits:: 8');
  assert.equal(load(storage, start - day), 'Visits:: 8');
});

test('unavailable browser storage shows the fallback', () => {
  const counter = {textContent: ''};
  vm.runInNewContext(counterSource, {
    document: {getElementById: () => counter},
    localStorage: {getItem() {throw new Error('Storage blocked');}}
  });
  assert.equal(counter.textContent, 'Visits:: ?');
});
