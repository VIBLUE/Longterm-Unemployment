/* =============================================================
   ประกอบหน้า: hero, กราฟในเรื่อง, dashboard, ผลสำรวจสด, UI
   ต้องโหลดหลัง common.js, config.js, data.js, charts.js
   ============================================================= */
(function(){
"use strict";
var D=window.LTU_DATA, C=Charts, fmt=C.fmt;
var $=function(id){return document.getElementById(id);};
var reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
var hasIO='IntersectionObserver' in window;

// ธีมสลับใน common.js — วาดกราฟใหม่ให้สีตรงกับธีม
addEventListener('ltu:theme',function(){redrawAll();});

/* ---------- hero counter ---------- */
(function(){
  var el=$('heroNum'), target=64400;
  el.textContent=target.toLocaleString('en-US');
  if(reduced)return;
  var t0=null, dur=1100;
  requestAnimationFrame(function step(ts){
    if(!t0)t0=ts;
    var p=Math.min(1,(ts-t0)/dur), e=1-Math.pow(1-p,3);
    el.textContent=Math.round(target*e).toLocaleString('en-US');
    if(p<1)requestAnimationFrame(step);
  });
})();

/* ---------- 12 months: เติมทีละเดือนเมื่อเลื่อนมาถึง ---------- */
(function(){
  var m=$('months'), h='';
  for(var i=0;i<12;i++) h+='<i class="'+(i===11?'on':'')+'"></i>';
  m.innerHTML=h;
  if(reduced||!hasIO)return;
  var cells=m.children;
  for(var j=0;j<12;j++)cells[j].className='';
  new IntersectionObserver(function(en,ob){
    if(!en[0].isIntersecting)return; ob.disconnect();
    [].forEach.call(cells,function(c,k){setTimeout(function(){c.className=k===11?'on':'wait';},k*110);});
  },{threshold:.6}).observe(m);
})();

/* ---------- story charts ---------- */
var SHORT={'กรุงเทพมหานคร':'กรุงเทพฯ','ภาคกลาง':'กลาง','ภาคเหนือ':'เหนือ','ภาคตะวันออกเฉียงเหนือ':'อีสาน','ภาคใต้':'ใต้'};
function figLabel(id){var h=$(id).closest('.fig').querySelector('h3');return h?h.textContent:'';}

var CHARTS={
  cNational:function(anim){
    var S=C.palette();
    var xs=D.rateQ.map(function(d){return {short:d.q===1?String(d.y):'',full:'ปี '+d.y+' ไตรมาส '+d.q};});
    var covFrom=D.rateQ.findIndex(function(d){return d.y===2563&&d.q===2;});
    var covTo=D.rateQ.findIndex(function(d){return d.y===2565&&d.q===2;});
    C.lineChart($('cNational'),{label:figLabel('cNational'),animate:anim,
      xs:xs, bands:[{from:covFrom,to:covTo,label:'ช่วงโควิด-19'}],
      series:[{name:'ทั้งประเทศ',color:S[0],values:D.rateQ.map(function(d){return d.v;})}]});
  },
  cAge:function(anim){
    var S=C.palette();
    C.hbar($('cAge'),{label:figLabel('cAge'),animate:anim,cats:D.ages,groups:[
      {name:'ปี 2564 (ปีที่หนักที่สุด)',color:S[0],values:D.ages.map(function(g){return D.rateAgeYear[g][3];})},
      {name:'ปี 2561 (ก่อนโควิด)',color:S[3],values:D.ages.map(function(g){return D.rateAgeYear[g][0];})}]});
    C.legend($('lAge'),[{name:'ปี 2564 ปีที่หนักที่สุด',color:S[0]},{name:'ปี 2561 ก่อนโควิด',color:S[3]}]);
  },
  cRegion:function(anim){
    var S=C.palette();
    var reg=D.reg5.map(function(r,i){return {name:r,short:SHORT[r],color:S[i],values:D.rateRegionYear[r],emph:r==='ภาคใต้'};});
    C.lineChart($('cRegion'),{label:figLabel('cRegion'),animate:anim,
      xs:D.years.map(function(y){return {short:String(y),full:'ปี '+y};}), endLabels:true, series:reg});
    C.legend($('lRegion'),reg.map(function(r){return {name:r.name,color:r.color};}),true);
  },
  cDash:function(anim){drawDash(anim);}
};
var seen={};
function redrawAll(){C.hideTip();for(var id in CHARTS)CHARTS[id](false);}

/* ---------- dashboard ---------- */
var fView=$('fView'), fYear=$('fYear');
D.years.forEach(function(y,i){var o=document.createElement('option');o.value=i;o.textContent=y;if(i===3)o.selected=true;fYear.appendChild(o);});
fView.addEventListener('change',function(){drawDash(true);});
fYear.addEventListener('change',function(){drawDash(true);});
function drawDash(anim){
  var S=C.palette(), view=fView.value, yi=+fYear.value, year=D.years[yi];
  var map={region:[D.reg5,D.rateRegionYear,'เปรียบเทียบรายภาค'],
           age:[D.ages,D.rateAgeYear,'เปรียบเทียบตามกลุ่มอายุ'],
           sex:[['ชาย','หญิง'],D.rateSexYear,'เปรียบเทียบชาย–หญิง'],
           area:[['ในเขตเทศบาล','นอกเขตเทศบาล'],D.rateAreaYear,'ในเมือง–นอกเมือง']};
  var cats=map[view][0], src=map[view][1];
  $('dashTitle').textContent=map[view][2]+' ปี '+year;
  $('dashSub').textContent='หน่วย: ร้อยละของกำลังแรงงาน · ค่าเฉลี่ยทั้งปี '+year;
  var vals=cats.map(function(c){return src[c][yi];});
  C.hbar($('cDash'),{label:$('dashTitle').textContent,animate:anim,cats:cats,groups:[{name:'ปี '+year,color:S[0],values:vals}]});
  var nat=0,n=0; D.rateQ.forEach(function(d){if(d.y===year&&d.v!==null){nat+=d.v;n++;}});
  nat=n?nat/n:0;
  document.querySelector('#dashTable tbody').innerHTML=cats.map(function(c,i){
    var v=vals[i], ratio=(nat&&v!==null)?(v/nat):null;
    var cls=ratio===null?'':ratio>=1.15?'up':ratio<=0.85?'down':'';
    var word=ratio===null?'–':(ratio>=1.15?'สูงกว่า '+fmt(ratio,1)+' เท่า':ratio<=0.85?'ต่ำกว่า '+fmt(1/ratio,1)+' เท่า':'ใกล้เคียง');
    return '<tr><td>'+c+'</td><td class="v">'+fmt(v,2)+'%</td><td class="'+cls+'">'+word+'</td></tr>';}).join('');
}

/* ---------- live survey (JSONP) ---------- */
var LIVE_FIELDS=[
  ['duration','หางานมานานแค่ไหน','ข้อมูลที่สถิติทางการเริ่มนับที่ 12 เดือนเท่านั้น',true],
  ['ltReturn','สุดท้ายได้งานคืนไหม','ไม่มีการติดตามผลในสถิติทางการเลย',true],
  ['barriers','อุปสรรคหลักในการหางาน','เลือกได้หลายข้อ ตัวเลขจึงรวมกันเกิน 100%',false],
  ['edu','ระดับการศึกษาของผู้ตอบ','ตัวแปรที่ไม่มีในชุดข้อมูลทางการ',false],
  ['social','เข้าถึงสิทธิประกันสังคมหรือไม่','ตัวแปรที่ไม่มีในชุดข้อมูลทางการ',true],
  ['wants','ข้อมูลที่คนอยากให้เปิดเพิ่ม','เลือกได้สูงสุด 3 ข้อ',false]
];
// ข้อความจาก Google Sheets เป็นข้อมูลจากผู้ใช้ — escape ก่อนใส่ลง HTML
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return '&#'+c.charCodeAt(0)+';';});}
function renderLive(d){
  var body=$('liveBody');
  $('liveTotal').textContent=d.total.toLocaleString('en-US');
  if(!d.total){ body.innerHTML='<div class="empty"><div class="e-t">ยังไม่มีคำตอบเข้ามา</div>'+
    '<div class="e-d">แบบสอบถามเพิ่งเปิด ถ้าคุณเคยหางานนาน ๆ คำตอบแรกอาจเป็นของคุณก็ได้</div></div>'; return; }
  var h='<div class="live-grid">';
  LIVE_FIELDS.forEach(function(f){
    var c=d.counts[f[0]]; if(!c)return;
    var ent=Object.keys(c).map(function(k){return [k,c[k]];}).sort(function(a,b){return b[1]-a[1];});
    if(!ent.length)return;
    var tot=ent.reduce(function(s,e){return s+e[1];},0), mx=ent[0][1];
    h+='<div class="lcard"><h3>'+f[1]+'</h3><div class="lsub">'+f[2]+'</div>';
    ent.slice(0,7).forEach(function(e){
      var pct=Math.round(e[1]/tot*1000)/10;
      h+='<div class="brow"><div class="brow-t"><b>'+esc(e[0])+'</b><span class="v">'+pct+'%</span></div>'+
         '<div class="track'+(f[3]?'':' amber')+'"><i style="width:'+(e[1]/mx*100)+'%"></i></div></div>';
    });
    h+='</div>';
  });
  h+='</div>';
  body.innerHTML=h;
}
var liveLoaded=false;
function liveError(msg){
  $('liveDot').classList.remove('on');
  $('liveStatus').textContent=msg;
  if(!liveLoaded){
    $('liveBody').innerHTML='<div class="empty"><div class="e-t">ยังไม่มีผลสำรวจแสดงตอนนี้</div>'+
      '<div class="e-d">ระบบกำลังรอคำตอบชุดแรก ลองกลับมาดูใหม่อีกครั้ง หรือร่วมตอบแบบสอบถามด้านล่างได้เลย</div></div>';
  }
}
var jsonpN=0;
function fetchLive(){
  if(!API_URL){ liveError('ยังไม่ได้เชื่อมต่อแหล่งข้อมูล'); return; }
  var cbName='__live'+(++jsonpN), done=false, s=document.createElement('script');
  window[cbName]=function(d){
    done=true;
    try{ delete window[cbName]; }catch(e){ window[cbName]=undefined; }
    if(s.parentNode)s.parentNode.removeChild(s);
    if(!d||!d.ok){ liveError('ดึงข้อมูลไม่สำเร็จ'); return; }
    liveLoaded=true;
    $('liveDot').classList.add('on');
    var t=new Date(d.updatedAt);
    $('liveStatus').textContent='อัปเดตล่าสุด '+
      t.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})+' น.';
    renderLive(d);
  };
  s.src=API_URL+(API_URL.indexOf('?')>-1?'&':'?')+'callback='+cbName+'&t='+Date.now();
  s.onerror=function(){ if(!done)liveError('เชื่อมต่อแหล่งข้อมูลไม่ได้'); };
  document.head.appendChild(s);
  setTimeout(function(){ if(!done) liveError('แหล่งข้อมูลไม่ตอบกลับ'); }, 12000);
}
var liveTimer=null;
function startLive(){ if(liveTimer)return; fetchLive(); liveTimer=setInterval(fetchLive,LIVE_REFRESH_MS); }
function stopLive(){ clearInterval(liveTimer); liveTimer=null; }
// ไม่ดึงข้อมูลตอนผู้ใช้สลับไปแท็บอื่น ประหยัดโควตา Apps Script
document.addEventListener('visibilitychange',function(){ document.hidden?stopLive():startLive(); });

/* ---------- nav: scrollspy + progress ---------- */
var links=[].slice.call(document.querySelectorAll('.bar-links a'));
var bar=$('progress'), ticking=false;
function onScroll(){
  if(ticking)return; ticking=true;
  requestAnimationFrame(function(){
    var h=document.documentElement, max=h.scrollHeight-h.clientHeight;
    bar.style.transform='scaleX('+(max>0?h.scrollTop/max:0)+')';
    var y=h.scrollTop+innerHeight*0.35, active=null;
    links.forEach(function(a){var s=document.querySelector(a.hash);if(s&&s.offsetTop<=y)active=a;});
    links.forEach(function(a){ if(a===active)a.setAttribute('aria-current','true'); else a.removeAttribute('aria-current'); });
    if(active&&active!==onScroll.last){
      onScroll.last=active;
      var box=active.parentNode;
      box.scrollTo({left:active.offsetLeft-box.clientWidth/2+active.offsetWidth/2,behavior:reduced?'auto':'smooth'});
    }
    ticking=false;
  });
}
addEventListener('scroll',onScroll,{passive:true});

/* ---------- reveal + chart first-view animation ---------- */
if(hasIO&&!reduced){
  var rv=new IntersectionObserver(function(en){
    en.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');rv.unobserve(e.target);}});
  },{rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.reveal').forEach(function(el){rv.observe(el);});
  // กันพลาด: ถ้า observer ไม่ทำงาน (เช่นกระโดดมาจากลิงก์ #anchor) อย่าปล่อยให้เนื้อหาซ่อนค้าง
  addEventListener('load',function(){setTimeout(function(){
    document.querySelectorAll('.reveal:not(.in)').forEach(function(el){
      if(el.getBoundingClientRect().top<innerHeight)el.classList.add('in');});},800);});
  var cv=new IntersectionObserver(function(en){
    en.forEach(function(e){
      var id=e.target.id;
      if(e.isIntersecting&&!seen[id]){seen[id]=true;CHARTS[id](true);cv.unobserve(e.target);}
    });
  },{threshold:.35});
  Object.keys(CHARTS).forEach(function(id){cv.observe($(id));});
}else{
  document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in');});
}

/* ---------- parallax ---------- */
// ช่องเดือนลอยในฉาก hero: [ชั้น, x%, y%, ขนาด px, ช่องสุดท้าย(เดือนที่ 12)?]
// ponytail: x ≥ 79% เพราะคอลัมน์ข้อความจบที่ ~76% บนจอ 1280 (จอเล็กกว่า 1200 ซ่อนไว้ใน CSS)
[['mid',80,16,46],['mid',91,30,38],['mid',84,40,30],['mid',94,62,34],['mid',81,76,42],['mid',92,88,26],
 ['near',86,52,58,1],['near',96,12,24],['near',79,28,20],['near',90,80,30]].forEach(function(t){
  var i=document.createElement('i');
  i.className='tile'+(t[4]?' hot':'');
  i.style.cssText='left:'+t[1]+'%;top:'+t[2]+'%;width:'+t[3]+'px;height:'+t[3]+'px';
  document.querySelector('.hero-scene .'+t[0]).appendChild(i);
});
/* ---------- boot ---------- */
var fl=$('formLink');
if(FORM_URL){fl.href=FORM_URL;}
else{fl.href='#live';fl.textContent='แบบสอบถามกำลังจะเปิด';fl.removeAttribute('target');}
redrawAll();
onScroll();
startLive();
var rt, lastW=innerWidth;
// มือถือยิง resize ตอนแถบ URL หด — วาดใหม่เฉพาะเมื่อความกว้างเปลี่ยนจริง
addEventListener('resize',function(){ if(innerWidth===lastW)return; lastW=innerWidth; clearTimeout(rt); rt=setTimeout(redrawAll,200); });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){setTimeout(redrawAll,60);});
})();
