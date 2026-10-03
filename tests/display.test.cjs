const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../main.js'), 'utf8');

function element(tag='div', cls='', text='') {
  return {tagName:tag.toUpperCase(), className:cls, textContent:text, children:[], attributes:{}, hidden:false,
    appendChild(child){this.children.push(child);return child;},
    replaceChildren(...children){this.children=children;},
    setAttribute(key,value){this.attributes[key]=value;},
    querySelectorAll(){return [];}, contains(){return false;},
    classList:{toggle(){}}};
}
function setup(data) {
  const nodes={};
  const get=id=>nodes[id]||(nodes[id]=element());
  const media=[];
  const context={KN:data,document:{getElementById:get},wbName:get('wb-name'),gameButtons:data.games.map(()=>element('button')),
    el:element,phify:(node,text)=>(node.textContent=text,node),maxed:null,
    srcOf:item=>typeof item==='string'?item:(item&&item.src)||'',
    mediaInto:(holder,items,name)=>media.push({items,name}),
    buildList:g=>g.downloads||[]};
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('  var gameName ='),source.indexOf('  var releases =')),context);
  return {context,nodes,media};
}
const released={title:'[First]',desc:'First summary',pitch:'First controls',released:true,version:'v1',Platforms:'Windows',media:['first.png'],downloads:[{os:'windows',file:'first.zip'}]};
const upcoming={title:'[Second]',desc:'Second summary',released:false,media:['second.png'],downloads:[{os:'linux',file:'sealed.zip'}]};

test('default display matches the current project and retains only its extra media',()=>{
  const {context,nodes,media}=setup({games:[upcoming,released],project:{name:'First',media:['first.png','trailer.mp4']}});
  assert.equal(nodes['wb-name'].textContent,'First');
  assert.equal(context.gameButtons[1].attributes['aria-pressed'],'true');
  assert.equal(context.gameButtons[0].attributes['aria-pressed'],'false');
  assert.deepEqual(Array.from(media[0].items),['first.png','trailer.mp4']);
});

test('switching to an unreleased game clears old downloads, specs, details, and media',()=>{
  const {context,nodes,media}=setup({games:[released,upcoming],project:{name:'First',media:['trailer.mp4']}});
  nodes['display-details'].open=true;
  context.selectGame(upcoming,1);
  assert.equal(nodes['wb-name'].textContent,'Second');
  assert.equal(nodes['wb-pitch'],undefined);
  assert.equal(nodes['display-status'].textContent,'in development');
  assert.equal(nodes['display-specs'].hidden,true);
  assert.equal(nodes['display-details'].hidden,true);
  assert.equal(nodes['display-details'].open,false);
  assert.equal(nodes['display-description'].textContent,'');
  assert.deepEqual(Array.from(media.at(-1).items),['second.png']);
  assert(!nodes['display-actions'].children.some(n=>n.href==='first.zip'||n.href==='sealed.zip'));
  assert.equal(context.gameButtons[0].attributes['aria-pressed'],'false');
  assert.equal(context.gameButtons[1].attributes['aria-pressed'],'true');
  context.selectGame(released,0);
  assert(nodes['display-actions'].children.some(n=>n.href==='first.zip'));
  assert.equal(nodes['display-specs'].hidden,false);
  assert.equal(nodes['display-details'].hidden,false);
});

test('a game without media gets an empty state instead of the last game image',()=>{
  const {context,nodes,media}=setup({games:[released],project:{name:'First'}});
  context.selectGame({title:'No media',released:false},-1);
  assert.equal(nodes['wb-media'].children[0].textContent,'no media yet');
  assert(!media.at(-1).items.some(context.srcOf));
});

test('a rotating model selector displays its gallery rather than replacing it with the model',()=>{
  const modeled={...released,model:'art/models/pillar.glb',media:['loop.gif','shot.png','clip.mp4']};
  const {context,nodes,media}=setup({games:[modeled,upcoming],project:{name:'First',media:['trailer.webm']}});
  assert.deepEqual(Array.from(media[0].items),['loop.gif','shot.png','clip.mp4','trailer.webm']);
  assert(!nodes['wb-media'].children.some(n=>n.tagName==='MODEL-VIEWER'));
  context.selectGame(upcoming,1);
  assert.deepEqual(Array.from(media.at(-1).items),['second.png']);
  context.selectGame(modeled,0);
  assert.equal(media.at(-1).name,'First');
  assert.equal(context.gameButtons[0].attributes['aria-pressed'],'true');
});

test('late gallery callbacks cannot overwrite a newer game selection',()=>{
  const queued=[],rendered=[];
  const context={srcOf:item=>typeof item==='string'?item:(item&&item.src)||'',
    whenVisible:(node,fn)=>queued.push(fn),buildGallery:(holder,items,alt)=>rendered.push(alt)};
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('  var mediaInto ='),source.indexOf('  var buildGallery =')),context);
  const holder={};
  context.mediaInto(holder,'first.png','First');
  context.mediaInto(holder,'second.png','Second');
  queued[1]();queued[0]();
  assert.deepEqual(rendered,['Second']);
  context.mediaInto(holder,'third.png','Third');
  context.mediaInto(holder,[], 'No media');
  queued[2]();
  assert.deepEqual(rendered,['Second']);
});
