/* =============================================================
   ใช้ร่วมกันทุกหน้า: สลับธีม, parallax, เปลี่ยนหน้าแบบมี transition
   ============================================================= */
(function(){
"use strict";
var root=document.documentElement;
var reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- theme toggle ---------- */
function isDark(){var t=root.getAttribute('data-theme');return t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;}
var btn=document.getElementById('themeBtn');
if(btn)btn.addEventListener('click',function(){
  var next=isDark()?'light':'dark';
  root.setAttribute('data-theme',next);
  try{localStorage.setItem('ltu-theme',next);}catch(e){}
  dispatchEvent(new Event('ltu:theme'));
});

/* ---------- parallax ----------
   ใส่ --p ให้ทุก [data-px]: 1 = เพิ่งโผล่ล่างจอ, 0 = กลางจอ, -1 = กำลังพ้นขอบบน */
var pxEls=[].slice.call(document.querySelectorAll('[data-px]')), pxTick=false;
function parallax(){
  pxTick=false;
  var vh=innerHeight;
  pxEls.forEach(function(el){
    var r=el.getBoundingClientRect();
    if(r.bottom<-100||r.top>vh+100)return;          // นอกจอ ไม่ต้องคำนวณ
    var p=(r.top+r.height/2-vh/2)/(vh/2+r.height/2);
    el.style.setProperty('--p',Math.max(-1,Math.min(1,p)).toFixed(4));
  });
}
function queuePx(){ if(!pxTick){pxTick=true;requestAnimationFrame(parallax);} }
if(!reduced&&pxEls.length){ addEventListener('scroll',queuePx,{passive:true}); addEventListener('resize',queuePx); parallax(); }

/* ---------- page transition ----------
   เบราว์เซอร์ที่รองรับ cross-document View Transitions ใช้ของ CSS (@view-transition) เอง
   ที่เหลือ (เช่น Firefox) ใช้ม่านเลื่อนแทน: ปิดม่าน → เปลี่ยนหน้า → หน้าใหม่เปิดม่านเอง */
if(root.classList.contains('no-vt')&&!reduced){
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[data-page]');
    if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank')return;
    e.preventDefault();
    root.classList.add('leaving');
    try{sessionStorage.setItem('ltu-vt','1');}catch(err){}   // บอกหน้าถัดไปให้เปิดม่าน
    setTimeout(function(){location.href=a.href;},420);
  });
  // กดย้อนกลับแล้วหน้าเดิมโผล่จาก bfcache — เก็บม่านออก
  addEventListener('pageshow',function(e){ if(e.persisted)root.classList.remove('leaving'); });
}
})();
