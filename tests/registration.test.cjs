const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../main.js'), 'utf8');

function setup(fetch, configured = true) {
  const nodes = {}, saved = new Map(), timers = new Map();
  function node(id) {
    return nodes[id] ||= {value: 'TEST', textContent: '', events: {}, style: {},
      classList: {add() {}, remove() {}}, focus() {}, remove() {},
      addEventListener(event, handler) { this.events[event] = handler; },
      querySelector() { return node('submit'); }};
  }
  const matchMedia = () => ({matches: true});
  const context = {
    KN: configured ? {supabaseUrl: 'https://example.invalid/rest/v1/', supabaseKey: 'public-test-key'} : {},
    window: {matchMedia}, matchMedia, fetch, AbortController,
    document: {getElementById: node, body: node('body'), documentElement: node('html'), dispatchEvent() {}},
    localStorage: {getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value)},
    setTimeout: (callback, ms) => { timers.set(ms, callback); return ms; },
    clearTimeout: ms => timers.delete(ms), CustomEvent: function () {}, runBoot() {}
  };
  vm.runInNewContext(source.slice(source.indexOf('  var SUBJ ='), source.indexOf('  document.querySelectorAll(".deck")')), context);
  return {nodes, saved, timers, submit: async () => {
    nodes['gate-form'].events.submit({preventDefault() {}});
    await new Promise(resolve => setImmediate(resolve));
  }};
}

for (const [name, fetch, configured] of [
  ['network failure', () => Promise.reject(new Error('offline')), true],
  ['server failure', () => Promise.resolve({status: 503}), true],
  ['missing configuration', () => { throw Error('should not fetch'); }, false]
]) {
  test('registration stays closed on ' + name + ' and allows retry', async () => {
    const app = setup(fetch, configured);
    await app.submit();
    assert.equal(app.saved.has('kn-subject'), false);
    assert.equal(app.saved.has('kn-subject-burned'), false);
    assert.match(app.nodes['gate-err'].textContent, /unavailable/);
    assert.equal(app.nodes.submit.disabled, false);
    await app.submit();
    assert.equal(app.saved.size, 0);
  });
}

test('registration admits only a confirmed claim and rejects duplicates', async () => {
  for (const status of [201, 200, 409]) {
    const app = setup(() => Promise.resolve({status}));
    await app.submit();
    assert.equal(app.saved.has('kn-subject'), status !== 409);
    if (status === 409) assert.match(app.nodes['gate-err'].textContent, /already assigned/);
    assert.equal(app.timers.has(10000), false);
  }
});

test('a stalled request times out without registering the visitor', async () => {
  const app = setup((url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('timeout')));
  }));
  await app.submit();
  assert.equal(app.nodes.submit.disabled, true);
  app.timers.get(10000)();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.saved.size, 0);
  assert.equal(app.nodes.submit.disabled, false);
  assert.match(app.nodes['gate-err'].textContent, /unavailable/);
});
