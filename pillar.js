/* I keep my earlier wireframe model experiment here. */
(function (root) {
  "use strict";
  // I list height and half-width from bottom to top.
  var profile = [
    [-1.5,.46],[-1.39,.46],[-1.34,.39],[-1.23,.39],[-1.17,.33],
    [-.92,.33],[-.67,.33],[-.42,.33],[-.17,.33],[.08,.33],
    [.33,.33],[.58,.33],[.83,.33],[.89,.39],[.98,.39],
    [1.04,.46],[1.14,.46],[1.19,.40],[1.36,.40],[1.41,.47],[1.5,.47]
  ];
  function mesh() {
    var vertices=[], edges=[];
    profile.forEach(function (level, ring) {
      var y=level[0], w=level[1], bevel=w*.82;
      [[-bevel,-w],[bevel,-w],[w,-bevel],[w,bevel],[bevel,w],[-bevel,w],[-w,bevel],[-w,-bevel]].forEach(function (corner) {
        vertices.push([corner[0],y,corner[1]]);
      });
      for(var j=0;j<8;j++) {
        edges.push({a:ring*8+j,b:ring*8+(j+1)%8,accent:ring===0||ring===15||ring===20});
        if(ring)edges.push({a:(ring-1)*8+j,b:ring*8+j,accent:false});
      }
    });
    return {vertices:vertices,edges:edges};
  }
  function project(vertex, angle, width, height) {
    var c=Math.cos(angle),s=Math.sin(angle),tilt=-.13;
    var x=vertex[0]*c+vertex[2]*s, z=-vertex[0]*s+vertex[2]*c;
    var y=vertex[1]*Math.cos(tilt)-z*Math.sin(tilt);
    var depth=vertex[1]*Math.sin(tilt)+z*Math.cos(tilt);
    var scale=Math.min(width*.72,height*.285)*4.8/(4.8-depth);
    return {x:width/2+x*scale,y:height/2-y*scale,z:depth};
  }
  var geometry=mesh();
  function draw(ctx,width,height,angle,selected) {
    ctx.clearRect(0,0,width,height);
    var points=geometry.vertices.map(function (vertex) { return project(vertex,angle,width,height); });
    var edges=geometry.edges.map(function (edge) {return {edge:edge,depth:(points[edge.a].z+points[edge.b].z)/2};});
    edges.sort(function(a,b){return a.depth-b.depth;});
    ctx.lineWidth=1;
    edges.forEach(function (item) {
      var edge=item.edge,a=points[edge.a],b=points[edge.b];
      var opacity=.2+.7*Math.max(0,Math.min(1,(item.depth+.7)/1.4));
      ctx.strokeStyle=(selected&&edge.accent ? "rgba(255,0,0," : "rgba(255,255,255,")+opacity+")";
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    });
  }
  function mount(canvas) {
    var ctx=canvas.getContext("2d");
    if(!ctx)return;
    var button=canvas.closest("button");
    var motion=root.matchMedia("(prefers-reduced-motion: reduce)");
    var width=132,height=165,angle=.55,frame=null,last=0,visible=true;
    function render() {draw(ctx,width,height,angle,button.getAttribute("aria-pressed")==="true");}
    function resize() {
      var bounds=canvas.getBoundingClientRect();
      if(!bounds.width||!bounds.height)return;
      width=bounds.width;height=bounds.height;
      var ratio=Math.min(root.devicePixelRatio||1,2);
      canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
      ctx.setTransform(ratio,0,0,ratio,0,0);render();
    }
    function animate(time) {
      frame=null;
      if(last)angle=(angle+Math.min((time-last)/1000,.05)*.48)%(Math.PI*2);
      last=time;render();
      frame=root.requestAnimationFrame(animate);
    }
    function sync() {
      if(frame!==null)root.cancelAnimationFrame(frame);
      frame=null;last=0;render();
      if(visible&&!root.document.hidden&&!motion.matches)frame=root.requestAnimationFrame(animate);
    }
    if (root.ResizeObserver) {
      var sizeObserver=new root.ResizeObserver(resize);sizeObserver.observe(canvas);
    }
    var selectionObserver=new root.MutationObserver(render);
    selectionObserver.observe(button,{attributes:true,attributeFilter:["aria-pressed"]});
    if(root.IntersectionObserver) {
      var visibilityObserver=new root.IntersectionObserver(function(entries){visible=entries[0].isIntersecting;sync();});
      visibilityObserver.observe(canvas);
    }
    motion.addEventListener("change",sync);
    root.document.addEventListener("visibilitychange",sync);
    root.addEventListener("pagehide",function(){if(frame!==null)root.cancelAnimationFrame(frame);frame=null;last=0;});
    root.addEventListener("pageshow",sync);
    resize();sync();
  }
  if(typeof module!=="undefined"&&module.exports)module.exports={mesh:mesh,project:project,draw:draw};
  else root.document.querySelectorAll(".pillar-canvas").forEach(mount);
})(typeof window!=="undefined"?window:globalThis);
