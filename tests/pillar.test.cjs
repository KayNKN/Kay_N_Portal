const {test}=require('node:test');
const assert=require('node:assert/strict');
const pillar=require('../pillar.js');

test('pillar mesh is a stepped closed wireframe',()=>{
  const mesh=pillar.mesh();
  assert.equal(mesh.vertices.length,168);
  assert(mesh.edges.length>300);
  assert(mesh.edges.some(edge=>edge.accent));
  for(const edge of mesh.edges){
    assert(edge.a>=0&&edge.a<mesh.vertices.length);
    assert(edge.b>=0&&edge.b<mesh.vertices.length);
  }
});

test('pillar projection stays inside its tile and changes with rotation',()=>{
  const a=pillar.project([.46,1.5,.46],0,132,165);
  const b=pillar.project([.46,1.5,.46],Math.PI/2,132,165);
  for(const p of [a,b]){
    assert(p.x>0&&p.x<132);
    assert(p.y>0&&p.y<165);
    assert(Number.isFinite(p.z));
  }
  assert.notEqual(a.x,b.x);
});
