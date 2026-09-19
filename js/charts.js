/* =============================================================
   กราฟ SVG แบบไม่พึ่งไลบรารี — lineChart, hbar, legend
   ============================================================= */
var Charts = (function(){
"use strict";

var NS='http://www.w3.org/2000/svg';
function cssv(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
function palette(){return [cssv('--s1'),cssv('--s2'),cssv('--s3'),cssv('--s4'),cssv('--s5')];}
function E(n,a,p){var e=document.createElementNS(NS,n);if(a)for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;}
function T(x,y,t,o){o=o||{};var e=E('text',{x:x,y:y,fill:o.fill||cssv('--ink-3'),'font-size':o.size||12,
  'text-anchor':o.anchor||'middle','font-family':o.mono?'"IBM Plex Mono",monospace':'"Sarabun",sans-serif',
  'font-weight':o.weight||400});e.textContent=t;return e;}
function fmt(v,d){return v===null||v===undefined?'–':Number(v).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});}
function niceStep(r){var p=Math.pow(10,Math.floor(Math.log10(r))),f=r/p;return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p;}
function ticks(max,n){if(!(max>0))return[0,1];max=+max.toPrecision(12);var s=niceStep(+(max/n).toPrecision(12));
  var c=Math.max(1,Math.ceil(max/s-1e-9)),o=[];for(var i=0;i<=c;i++)o.push(+(i*s).toFixed(6));return o;}
function svgRoot(host,W,H,label){
  host.innerHTML='';
  var svg=E('svg',{viewBox:'0 0 '+W+' '+H,role:'img'},host);
  if(label)svg.setAttribute('aria-label',label);
  return svg;
}

/* ---------- tooltip ---------- */
var tip=document.getElementById('tip');
function showTip(x0,y0,html){tip.innerHTML=html;tip.style.opacity='1';
  var r=tip.getBoundingClientRect(),x=x0+15,y=y0-8;
  if(x+r.width>innerWidth-10)x=x0-r.width-15;
  if(x<10)x=10;
  if(y+r.height>innerHeight-10)y=innerHeight-r.height-10;
  if(y<10)y=10; tip.style.transform='translate('+x+'px,'+y+'px)';}
function hideTip(){tip.style.opacity='0';}
addEventListener('scroll',hideTip,{passive:true});
function row(color,name,v){
  return '<div class="t-r"><span>'+(color?'<span class="sw" style="background:'+color+'"></span> ':'')+name+
    '</span><span class="t-v">'+fmt(v,2)+'%</span></div>';
}

/* ---------- line chart ---------- */
function lineChart(host,cfg){
  var W=host.clientWidth||600, H=Math.max(250,Math.min(330,W*0.46));
  var narrow=W<520;
  var P={l:48,r:cfg.endLabels?(narrow?52:74):18,t:16,b:42};
  var svg=svgRoot(host,W,H,cfg.label);
  var iw=W-P.l-P.r, ih=H-P.t-P.b, max=0, n=cfg.xs.length;
  cfg.series.forEach(function(s){s.values.forEach(function(v){if(v!==null&&v>max)max=v;});});
  var tk=ticks(max,4), ymax=tk[tk.length-1];
  var X=function(i){return P.l+(n===1?iw/2:i*iw/(n-1));};
  var Y=function(v){return P.t+ih-(v/ymax)*ih;};
  (cfg.bands||[]).forEach(function(b){
    E('rect',{x:X(b.from),y:P.t,width:X(b.to)-X(b.from),height:ih,fill:cssv('--teal-soft'),rx:4},svg);
    svg.appendChild(T((X(b.from)+X(b.to))/2,P.t+15,b.label,{size:12,weight:600,fill:cssv('--ink-3')}));
  });
  tk.forEach(function(v){E('line',{x1:P.l,x2:W-P.r,y1:Y(v),y2:Y(v),stroke:cssv('--grid')},svg);
    svg.appendChild(T(P.l-9,Y(v)+4,fmt(v,2),{anchor:'end',size:11.5,mono:true}));});
  var every=n>14?(narrow?8:4):1;
  cfg.xs.forEach(function(x,i){ if(i%every===0) svg.appendChild(T(X(i),H-P.b+18,x.short,{size:12})); });
  E('line',{x1:P.l,x2:W-P.r,y1:Y(0),y2:Y(0),stroke:cssv('--rule'),'stroke-width':1.5},svg);
  var ends=[];
  cfg.series.forEach(function(s){
    var d='',pen=false;
    s.values.forEach(function(v,i){ if(v===null){pen=false;return;} d+=(pen?'L':'M')+X(i)+' '+Y(v); pen=true; });
    var path=E('path',{d:d,fill:'none',stroke:s.color,'stroke-width':s.emph?3:2.5,'stroke-linecap':'round','stroke-linejoin':'round',
      'class':'draw'},svg);
    if(cfg.animate)animatePath(path);
    var li=-1; s.values.forEach(function(v,i){if(v!==null)li=i;});
    if(li>=0){E('circle',{cx:X(li),cy:Y(s.values[li]),r:4.5,fill:s.color,stroke:cssv('--paper-2'),'stroke-width':2},svg);
      if(cfg.endLabels)ends.push({x:X(li),y:Y(s.values[li]),name:s.short||s.name});}
  });
  if(ends.length){
    ends.sort(function(a,b){return a.y-b.y;});
    for(var i=1;i<ends.length;i++) if(ends[i].y-ends[i-1].y<15) ends[i].y=ends[i-1].y+15;
    var over=ends[ends.length-1].y-(P.t+ih); if(over>0)ends.forEach(function(e){e.y-=over;});
    ends.forEach(function(e){svg.appendChild(T(e.x+10,e.y+4,e.name,{anchor:'start',size:12.5,weight:600,fill:cssv('--ink-2')}));});
  }
  var cross=E('line',{y1:P.t,y2:P.t+ih,stroke:cssv('--ink-3'),'stroke-width':1,'stroke-dasharray':'3 3',opacity:0},svg);
  var dots=cfg.series.map(function(s){return E('circle',{r:5.5,fill:s.color,stroke:cssv('--paper-2'),'stroke-width':2,opacity:0},svg);});
  var hit=E('rect',{x:0,y:0,width:W,height:H,fill:'transparent',tabindex:0,'class':'hit',
    'aria-label':(cfg.label||'')+' — ใช้ปุ่มลูกศรซ้ายขวาเพื่อดูค่าทีละจุด'},svg);
  hit.style.cursor='crosshair';
  var cur=-1;

  function show(i,cx,cy){
    cur=i;
    cross.setAttribute('x1',X(i));cross.setAttribute('x2',X(i));cross.setAttribute('opacity',1);
    var html='<div class="t-h">'+cfg.xs[i].full+'</div>';
    cfg.series.forEach(function(s,k){var v=s.values[i];
      if(v===null){dots[k].setAttribute('opacity',0);return;}
      dots[k].setAttribute('cx',X(i));dots[k].setAttribute('cy',Y(v));dots[k].setAttribute('opacity',1);
      html+=row(s.color,s.name,v);});
    showTip(cx,cy,html);
  }
  function clear(){cur=-1;hideTip();cross.setAttribute('opacity',0);dots.forEach(function(d){d.setAttribute('opacity',0);});}
  function fromPointer(ev){
    var b=svg.getBoundingClientRect(), px=(ev.clientX-b.left)*(W/b.width);
    var i=Math.round((px-P.l)/(iw/Math.max(1,n-1)));
    show(Math.max(0,Math.min(n-1,i)),ev.clientX,ev.clientY);
  }
  function fromKey(i){
    var b=svg.getBoundingClientRect(), s=b.width/W, v=null;
    cfg.series.forEach(function(se){if(se.values[i]!==null&&(v===null||se.values[i]>v))v=se.values[i];});
    show(i,b.left+X(i)*s,b.top+Y(v||0)*s);
  }
  hit.addEventListener('mousemove',fromPointer);
  hit.addEventListener('mouseleave',clear);
  hit.addEventListener('touchstart',function(e){fromPointer(e.touches[0]);},{passive:true});
  hit.addEventListener('touchmove',function(e){fromPointer(e.touches[0]);},{passive:true});
  hit.addEventListener('blur',clear);
  hit.addEventListener('keydown',function(e){
    var k=e.key, i=cur<0?n-1:cur;
    if(k==='ArrowRight')i=Math.min(n-1,cur<0?0:i+1);
    else if(k==='ArrowLeft')i=Math.max(0,i-1);
    else if(k==='Home')i=0;
    else if(k==='End')i=n-1;
    else if(k==='Escape'){clear();return;}
    else return;
    e.preventDefault(); fromKey(i);
  });
}
function animatePath(p){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!p.getTotalLength)return;
  var L=p.getTotalLength();
  p.style.strokeDasharray=L; p.style.strokeDashoffset=L;
  p.getBoundingClientRect();
  p.style.transition='stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)';
  p.style.strokeDashoffset='0';
}

/* ---------- horizontal bars ---------- */
function roundRight(x,y,w,h,r){r=Math.min(r,w,h/2);
  return 'M'+x+' '+y+'L'+(x+w-r)+' '+y+'Q'+(x+w)+' '+y+' '+(x+w)+' '+(y+r)+'L'+(x+w)+' '+(y+h-r)+'Q'+(x+w)+' '+(y+h)+' '+(x+w-r)+' '+(y+h)+'L'+x+' '+(y+h)+'Z';}
function hbar(host,cfg){
  var W=host.clientWidth||600;
  var g=cfg.groups.length, rowH=g>1?(g*16+18):34, H=cfg.cats.length*rowH+40;
  var labSize=W<420?12.5:13.5;
  var svg=svgRoot(host,W,H,cfg.label);
  // วัดป้ายที่ยาวที่สุดจริง เพื่อไม่ให้ชื่อยาว ๆ อย่าง "ภาคตะวันออกเฉียงเหนือ" โดนตัด
  var probe=T(0,0,cfg.cats.reduce(function(a,b){return b.length>a.length?b:a;},''),{size:labSize});
  svg.appendChild(probe); var labW=probe.getComputedTextLength()||120; svg.removeChild(probe);
  var P={l:Math.min(W*0.45,labW+16),r:60,t:6,b:26};
  var iw=W-P.l-P.r, max=0;
  cfg.groups.forEach(function(gr){gr.values.forEach(function(v){if(v>max)max=v;});});
  var tk=ticks(max,3), xmax=tk[tk.length-1];
  var X=function(v){return P.l+(v/xmax)*iw;};
  tk.forEach(function(v){E('line',{x1:X(v),x2:X(v),y1:P.t,y2:H-P.b,stroke:cssv('--grid')},svg);
    svg.appendChild(T(X(v),H-P.b+17,fmt(v,2),{size:11.5,mono:true}));});
  cfg.cats.forEach(function(c,i){
    var y0=P.t+i*rowH;
    svg.appendChild(T(P.l-10,y0+rowH/2+5,c,{anchor:'end',size:labSize,fill:cssv('--ink-2')}));
    var bh=Math.max(9,(rowH-12)/g-3);
    var html='<div class="t-h">'+c+'</div>'+cfg.groups.map(function(gr){return row(gr.color,gr.name,gr.values[i]||0);}).join('');
    // แถบรับเมาส์/นิ้วทั้งแถว ทำให้แตะโดนง่ายแม้แท่งจะสั้น
    var band=E('rect',{x:0,y:y0,width:W,height:rowH,fill:'transparent'},svg);
    band.addEventListener('mousemove',function(ev){showTip(ev.clientX,ev.clientY,html);});
    band.addEventListener('mouseleave',hideTip);
    band.addEventListener('touchstart',function(e){var t=e.touches[0];showTip(t.clientX,t.clientY,html);},{passive:true});
    cfg.groups.forEach(function(gr,k){
      var v=gr.values[i]||0, y=y0+6+k*(bh+3);
      if(v>0){
        var p=E('path',{d:roundRight(P.l,y,Math.max(2,X(v)-P.l),bh,4),fill:gr.color,'pointer-events':'none'},svg);
        if(cfg.animate)growBar(p,P.l,i*40);
      }
      svg.appendChild(T(Math.max(X(v),P.l)+7,y+bh/2+5,fmt(v,2),{anchor:'start',size:12,mono:true,fill:cssv('--ink-3')})).setAttribute('pointer-events','none');
    });
  });
  E('line',{x1:P.l,x2:P.l,y1:P.t,y2:H-P.b,stroke:cssv('--rule'),'stroke-width':1.5},svg);
}
function growBar(p,x0,delay){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  p.style.transformOrigin=x0+'px 0'; p.style.transform='scaleX(0)';
  p.getBoundingClientRect();
  p.style.transition='transform .8s cubic-bezier(.2,.7,.2,1) '+delay+'ms';
  p.style.transform='scaleX(1)';
}

function legend(host,items,line){
  host.innerHTML=items.map(function(i){return '<span><span class="sw'+(line?' line':'')+'" style="background:'+i.color+'"></span>'+i.name+'</span>';}).join('');
}

return {lineChart:lineChart,hbar:hbar,legend:legend,palette:palette,fmt:fmt,hideTip:hideTip};
})();
