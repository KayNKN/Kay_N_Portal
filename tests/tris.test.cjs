const { test } = require('node:test');
const assert = require('node:assert/strict');
const tris = require('../tris.js');

function piece(g, shape, x, y) {
  g.shape = shape.map(row => row.slice()); g.px = x; g.py = y;
}
const square = [[1, 1], [1, 1]];

test('a bag contains every piece once, without changing the shape templates', () => {
  const g = tris.create(() => .4), kinds = [g.kind];
  for (let i = 1; i < 7; i++) {
    tris.drop(g); kinds.push(g.kind);
    g.grid.forEach(row => row.fill(0));
  }
  assert.equal(new Set(kinds).size, 7);
  const a = tris.create(() => .4), b = tris.create(() => .4);
  a.shape[0][0] = 99;
  assert.notEqual(b.shape[0][0], 99);
});

test('movement stops at both walls and occupied cells', () => {
  const g = tris.create(); piece(g, square, 0, 0);
  assert.equal(tris.move(g, -1), false);
  for (let i = 0; i < 8; i++) assert.equal(tris.move(g, 1), true);
  assert.equal(tris.move(g, 1), false);
  g.grid[0][7] = 1;
  assert.equal(tris.move(g, -1), false);
});

test('four rotations preserve the pivot and shape in open space', () => {
  const g = tris.create(); piece(g, [[0,1,0],[1,1,1],[0,0,0]], 4, 5);
  const original = JSON.stringify(g.shape);
  for (let i=0; i<4; i++) assert.equal(tris.rotate(g), true);
  assert.equal(JSON.stringify(g.shape), original);
  assert.equal(g.px, 4); assert.equal(g.py, 5);
});

test('rotation can kick away from a wall and the floor without overlap', () => {
  const g = tris.create();
  piece(g, [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]], -2, 3);
  assert.equal(tris.rotate(g), true);
  assert.equal(tris.collides(g, g.shape, g.px, g.py), false);
  piece(g, [[0,1,0],[1,1,1],[0,0,0]], 4, 14);
  assert.equal(tris.rotate(g), true);
  assert.equal(tris.collides(g, g.shape, g.px, g.py), false);
});

test('hard drop lands exactly on the ghost and locks only one piece', () => {
  const g = tris.create(); piece(g, square, 4, 0);
  assert.equal(tris.landingY(g), 14);
  tris.drop(g);
  assert.equal(g.grid.flat().filter(Boolean).length, 4);
  assert.equal(g.grid[14][4], 1); assert.equal(g.grid[15][5], 1);
  assert.equal(g.score, 28);
});

test('four adjacent full rows clear together, preserving board size', () => {
  const g = tris.create();
  for (let y=12; y<16; y++) { g.grid[y].fill(1); g.grid[y][4]=0; }
  piece(g, [[1],[1],[1],[1]], 4, 12);
  tris.step(g, false);
  assert.equal(g.lines, 4); assert.equal(g.score, 800);
  assert.equal(g.grid.length, 16); assert(g.grid.every(row => row.length === 10));
  assert.equal(g.grid.flat().filter(Boolean).length, 0);
});

test('gravity and manual drop produce the same game-over board', () => {
  const setup = () => {
    const g = tris.create(() => .5);
    g.grid[0].fill(1); g.grid[1].fill(1);
    // I leave two gaps so the top rows cannot clear.
    g.grid[0][0]=0; g.grid[1][0]=0;
    piece(g, square, 4, 14); return g;
  };
  const a=setup(), b=setup(); tris.step(a, false); tris.drop(b);
  assert.equal(a.over, true); assert.equal(b.over, true);
  assert.deepEqual(a.grid, b.grid);
  const before=JSON.stringify(a);
  tris.drop(a); tris.step(a, true); tris.move(a, 1); tris.rotate(a);
  assert.equal(JSON.stringify(a), before);
});

test('locking above the top ends the game without discarding hidden blocks', () => {
  const g=tris.create(); piece(g, square, 4, -1); g.grid[1][4]=1;
  tris.step(g, false);
  assert.equal(g.over, true);
});

test('repeated play never writes outside the board or overlaps active blocks', () => {
  let seed=13;
  const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  for(let round=0;round<20;round++) {
    const g=tris.create(random);
    for(let i=0;i<500&&!g.over;i++) {
      const choice=Math.floor(random()*5);
      if(choice===0)tris.move(g,-1);
      if(choice===1)tris.move(g,1);
      if(choice===2)tris.rotate(g);
      if(choice===3)tris.step(g,true);
      if(choice===4)tris.drop(g);
      assert.equal(g.grid.length,16);
      assert(g.grid.every(row=>row.length===10&&row.every(v=>v===0||v===1)));
      if(!g.over)assert.equal(tris.collides(g,g.shape,g.px,g.py),false);
    }
  }
});
