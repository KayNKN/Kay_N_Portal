/* I keep these standalone game rules separate from the live terminal. */
(function (root) {
  "use strict";
  var W = 10, H = 16;
  // I use fixed rotation boxes to keep each pivot stable.
  var shapes = [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[1,1],[1,1]],
    [[0,1,0],[1,1,1],[0,0,0]],
    [[0,1,1],[1,1,0],[0,0,0]],
    [[1,1,0],[0,1,1],[0,0,0]],
    [[1,0,0],[1,1,1],[0,0,0]],
    [[0,0,1],[1,1,1],[0,0,0]]
  ];
  function collides(g, shape, px, py) {
    return shape.some(function (row,y) { return row.some(function(v,x) {
      return v && (px+x < 0 || px+x >= W || py+y >= H || (py+y >= 0 && g.grid[py+y][px+x]));
    }); });
  }
  function spawn(g) {
    if (!g.bag.length) {
      g.bag = [0,1,2,3,4,5,6];
      for (var i=6;i>0;i--) {
        var j=Math.floor(g.random()*(i+1)), temp=g.bag[i]; g.bag[i]=g.bag[j]; g.bag[j]=temp;
      }
    }
    g.kind=g.bag.pop(); g.shape=shapes[g.kind].map(function(row){return row.slice();});
    g.px=Math.floor((W-g.shape.length)/2); g.py=g.kind===0 ? -1 : 0;
    g.over=collides(g,g.shape,g.px,g.py);
  }
  function create(random) {
    var g={grid:Array.from({length:H},function(){return Array(W).fill(0);}),score:0,lines:0,over:false,bag:[],random:random||Math.random};
    spawn(g); return g;
  }
  function move(g,dx) {
    if (g.over || collides(g,g.shape,g.px+dx,g.py)) return false;
    g.px+=dx; return true;
  }
  function rotate(g) {
    if (g.over) return false;
    var rotated=g.shape[0].map(function(_,i){return g.shape.map(function(row){return row[i];}).reverse();});
    var kicks=[[0,0],[-1,0],[1,0],[-2,0],[2,0],[0,-1],[0,-2]];
    for(var i=0;i<kicks.length;i++) {
      var dx=kicks[i][0],dy=kicks[i][1];
      if(!collides(g,rotated,g.px+dx,g.py+dy)){g.shape=rotated;g.px+=dx;g.py+=dy;return true;}
    }
    return false;
  }
  function lock(g) {
    var above=false;
    g.shape.forEach(function(row,y){row.forEach(function(v,x){if(v){if(g.py+y<0)above=true;else g.grid[g.py+y][g.px+x]=1;}});});
    if(above){g.over=true;return;}
    var kept=g.grid.filter(function(row){return !row.every(Boolean);});
    var cleared=H-kept.length;
    while(kept.length<H)kept.unshift(Array(W).fill(0));
    g.grid=kept;g.lines+=cleared;g.score+=[0,100,300,500,800][cleared];spawn(g);
  }
  function step(g,manual) {
    if(g.over)return;
    if(!collides(g,g.shape,g.px,g.py+1)){g.py++;if(manual)g.score++;}else lock(g);
  }
  function landingY(g) {
    var y=g.py;
    if(!g.over)while(!collides(g,g.shape,g.px,y+1))y++;
    return y;
  }
  function drop(g) {
    if(g.over)return;
    var y=landingY(g);g.score+=(y-g.py)*2;g.py=y;lock(g);
  }
  var api={W:W,H:H,create:create,collides:collides,move:move,rotate:rotate,step:step,drop:drop,landingY:landingY,speed:function(g){return Math.max(120,480-g.lines*22);}};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.KNTris=api;
})(typeof window!=="undefined"?window:globalThis);
