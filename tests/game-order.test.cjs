const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../main.js'), 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('  function orderedGames('), source.indexOf('  var shelf =')), context);

test('soundtrack rows share playback, switch sources, and disable missing tracks', () => {
  function node() {
    return {
      children: [], events: {}, attributes: {}, paused: true,
      style: {setProperty(key, value) { this[key] = value; }},
      appendChild(child) { this.children.push(child); },
      replaceChildren() { this.children = []; },
      setAttribute(key, value) { this.attributes[key] = value; },
      getAttribute(key) { return key === 'src' ? this.src : this.attributes[key]; },
      addEventListener(key, handler) { this.events[key] = handler; },
      pause() { this.paused = true; if (this.events.pause) this.events.pause(); },
      play() { this.paused = false; this.events.play(); return Promise.resolve(); }
    };
  }
  const library = node(), player = node();
  const music = [{game: 'A_Way_Out', tracks: [
    {title: 'Opening', audio: 'audio/opening.mp3', duration: 80},
    {title: 'Ending', audio: 'audio/ending.mp3'},
    {title: 'Bonus', audio: ''}
  ]}];
  vm.runInNewContext(source.slice(source.indexOf('  var musicLibrary ='), source.indexOf('  var wbName =')), {
    KN: {music}, orderedGames: context.orderedGames,
    document: {getElementById: id => id === 'music-library' ? library : player, createElement: node},
    el: (tag, cls, text) => Object.assign(node(), {textContent: text})
  });
  const buttons = player.children[2].children.map(row => row.children[0]);
  const audio = player.children[5];
  assert.deepEqual(buttons.map(button => button.children[1].children[0].textContent), ['Opening', 'Ending', 'Bonus']);
  assert.equal(audio.src, undefined);
  buttons[0].events.click();
  assert.equal(audio.src, 'audio/opening.mp3');
  assert.equal(audio.paused, false);
  const seek = player.children[3].children[1];
  audio.duration = 80;
  audio.currentTime = 20;
  audio.events.timeupdate();
  assert.equal(seek.style['--played'], '25%');
  audio.duration = NaN;
  audio.events.durationchange();
  assert.equal(seek.disabled, false);
  assert.equal(seek.style['--played'], '25%');
  seek.value = '60';
  seek.events.input();
  assert.equal(audio.currentTime, 60);
  assert.equal(seek.style['--played'], '75%');
  buttons[1].events.click();
  assert.equal(seek.style['--played'], '0%');
  assert.equal(audio.src, 'audio/ending.mp3');
  assert.equal(buttons[1].attributes['aria-pressed'], 'true');
  buttons[1].events.click();
  assert.equal(audio.paused, true);
  assert.equal(buttons[2].disabled, true);
  library.children[0].events.click();
  assert.equal(audio.paused, true);
});

test('newest release takes 01 without changing the game indexes used by clicks', () => {
  const games = [
    {title:'Older', released:true, releaseDate:'2026-01-01'},
    {title:'Upcoming', released:false, releaseDate:'2027-01-01'},
    {title:'Newest', released:true, releaseDate:'2026-09-13'}
  ];
  const ordered = context.orderedGames(games);
  assert.deepEqual(Array.from(ordered, e => e.game.title), ['Newest','Older','Upcoming']);
  assert.deepEqual(Array.from(ordered, e => e.index), [2,0,1]);
  assert.equal(games[0].title, 'Older');
  games[1].released = true;
  assert.deepEqual(Array.from(context.orderedGames(games), e => e.game.title), ['Upcoming','Newest','Older']);
});

test('missing or invalid dates and equal dates keep a stable order', () => {
  const games = [
    {title:'Unknown', released:true},
    {title:'Invalid', released:true, releaseDate:'invalid'},
    {title:'Dated A', released:true, releaseDate:'2026-09-13'},
    {title:'Dated B', released:true, releaseDate:'2026-09-13'},
    {title:'Upcoming', released:false}
  ];
  assert.deepEqual(Array.from(context.orderedGames(games), e => e.game.title), ['Dated A','Dated B','Unknown','Invalid','Upcoming']);
});

test('music follows game release dates and keeps clicks matched to the sorted slots', () => {
  function node() {
    return {
      children: [], attributes: {}, events: {}, pause() {},
      appendChild(child) { this.children.push(child); },
      replaceChildren() { this.children = []; },
      setAttribute(key, value) { this.attributes[key] = value; },
      addEventListener(key, handler) { this.events[key] = handler; }
    };
  }
  const library = node(), player = node();
  const music = [
    {game: 'A_Way_Out', title: 'Older OST', audio: 'older.mp3'},
    {game: '???', title: 'Upcoming OST'},
    {game: 'DEAD_BAND', title: 'Newest OST', audio: 'newest.mp3'}
  ];
  const games = [
    {title: '[A_Way_Out]', released: true, releaseDate: ''},
    {title: '[DEAD_BAND]', released: true, releaseDate: '2026-09-14'}
  ];
  const scope = {
    KN: {music, games}, orderedGames: context.orderedGames,
    document: {getElementById: id => id === 'music-library' ? library : player, createElement: node},
    el: (tag, cls, text) => Object.assign(node(), {textContent: text})
  };
  vm.runInNewContext(source.slice(source.indexOf('  var musicLibrary ='), source.indexOf('  var wbName =')), scope);
  assert.deepEqual(library.children.map(card => card.children[1].textContent), ['DEAD_BAND', 'A_Way_Out', '???']);
  assert.equal(player.children[0].textContent, 'Newest OST');
  assert.equal(player.children[1].src, 'newest.mp3');
  library.children[1].events.click();
  assert.equal(player.children[0].textContent, 'Older OST');
  assert.equal(player.children[1].src, 'older.mp3');
  assert.equal(library.children[1].attributes['aria-pressed'], 'true');
  assert.equal(library.children[0].attributes['aria-pressed'], 'false');
  assert.equal(music[0].title, 'Older OST');
});
