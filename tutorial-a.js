
/* ===== 튜토리얼 모드 · 파트 A (첫 전투: 불씨 → 물결) =====
   일반 전투 엔진(출전·불씨·물결·공격 연출)을 그대로 쓰고, 튜토리얼 전용 규칙만 얹어요.
   - 보스: 레지드래고(도감에 주지 않음) · 에너지 고정 지급 · 연출 피해 · 공격 문제는 첫 공격만 진짜 문제
   - 파트를 더 만들 때는 TUT_A.parts 배열에 async 함수를 하나씩 추가해요. */
(function(){
'use strict';
if(window.TUT_A)return;

const BOSS_ID=895,FIRE_ID=58,WATER_ID=54,BOSS_SLOT=2;
const STRIKE1=2,COUNTER=1;           // 보스 연출 피해(체력 1 미만으로는 내려가지 않아요)
const TOTAL=18;                      // 전체 특성 수(n/18 진행 표시)
const ABORT={tutAbort:1};
let cur=null,poll=0;

const name=id=>esc(MON[id].name);
const bossUnit=()=>B&&B.foe&&B.foe.board[BOSS_SLOT];
const bossHp=()=>{const u=bossUnit();return u?u.hp:0;};
const myIdx=()=>B.me.board.findIndex(Boolean);
const handEl=i=>document.querySelector('#battle .hand .card[data-h="'+i+'"]');
const manaEl=()=>document.querySelector('#battle .bBot .mana');
const endEl=()=>document.getElementById('bEnd');
const emptySlotEl=()=>{const i=B.me.board.indexOf(null);return i<0?null:document.querySelector('#myLane .slot[data-i="'+i+'"]');};
const chk=()=>{if(!cur||cur.abort||cur.done)throw ABORT;};

/* ---------- 이벤트 기다리기 ---------- */
function waitAny(evts){return new Promise(res=>{cur.w={evts,res};});}
async function W(...evts){const r=await waitAny(evts);chk();return r;}
function fire(evt,d){const T=cur;if(!T||!T.w)return;if(T.w.evts.includes(evt)){const r=T.w.res;T.w=null;r({evt,d});}}

/* ---------- 화면 요소 ---------- */
function ui(){
  if(document.getElementById('tutBox'))return;
  const mk=(tag,id,cls,html)=>{const e=document.createElement(tag);if(id)e.id=id;if(cls)e.className=cls;if(html!=null)e.innerHTML=html;document.body.appendChild(e);return e;};
  mk('div','tutBox','','<div class=tbIn><div class=tbHead><span class=tbIcW></span><b class=tbTitle>안내</b><span class=tbN></span></div><div class=tbTxt></div><button class="btn gold tbNext" type=button></button></div>');
  mk('div','tutDim','','<svg xmlns="http://www.w3.org/2000/svg"><defs><mask id="tutMask"><rect width="100%" height="100%" fill="#fff"/><g id="tutHoles"></g></mask></defs><rect id="tutDimR" width="100%" height="100%" fill="rgba(30,30,56,.5)" mask="url(#tutMask)"/></svg>');
  mk('div','tutHL','','<div id=tutArrow>▼</div>');
  mk('div','tutHL2','','');
  mk('div','tutBoss','','<div class=tbL><b>BOSS</b> 레지드래고 <span class=tbStar>★★★★★</span> · <span>용의 기세</span><small>도감에는 등록되지 않는 상대예요</small></div><div class=tbR>특성 <b id=tutProg>0</b>/'+TOTAL+'</div>');
  mk('div','tutFade','','');
  {const sk=mk('button','tutSkip','btn ghost sm','튜토리얼 건너뛰기');sk.type='button';sk.onclick=()=>{try{sfx('tap');}catch(e){}tutSkipAsk();};}
}
function removeUi(){document.body.classList.remove('aimOn');['tutBox','tutHL','tutHL2','tutDim','tutBoss','tutFade','tutAim','tutSkip'].forEach(id=>{const e=document.getElementById(id);if(e)e.remove();});}
function setProg(n){const e=document.getElementById('tutProg');if(e)e.textContent=n;}

function say(html,o={}){
  const bx=document.getElementById('tutBox');if(!bx)return Promise.resolve();
  const th=cur.th||['안내','ball'];
  bx.querySelector('.tbIcW').innerHTML=I(o.ic||th[1]||'ball');
  bx.querySelector('.tbTitle').textContent=o.h||th[0]||'안내';
  bx.querySelector('.tbN').textContent=cur.sc?cur.sc+'/'+(cur.scN||5):'';
  bx.querySelector('.tbTxt').innerHTML=html;
  const b=bx.querySelector('.tbNext');
  b.style.display=o.btn?'':'none';b.textContent=o.btn||'';
  if(bx.classList.contains('on')){bx.classList.remove('sw');void bx.offsetWidth;bx.classList.add('sw');}   // 이미 떠 있으면 글만 부드럽게 교체
  else{bx.classList.remove('sw');sm.bxJump=1;}
  clearTimeout(sm.hideT);
  bx.classList.add('on');cur.sayOn=1;placeBox();
  if(!o.btn)return Promise.resolve();
  return new Promise(res=>{cur.sayRes=res;b.onclick=()=>{sfx('tap');b.onclick=null;cur.sayRes=null;const hi0=cur.hi;clearTimeout(sm.hideT);sm.hideT=setTimeout(()=>{if(cur&&cur.hi===hi0){cur.hi=()=>[];}hideSay();},140);res();};}).then(chk);
}
function hideSay(){const bx=document.getElementById('tutBox');if(bx)bx.classList.remove('on');if(cur)cur.sayOn=0;try{updateFrames();}catch(e){}}

/* 강조 대상: 화면에 그려진 것만(상세창이 위에 덮이는 건 레이어 순서로 자연스럽게 가려요) */
function visibleTargets(){
  const T=cur;if(!T||T.done||!T.hi)return[];
  let els=[];try{els=(T.hi()||[]).filter(e=>e&&e.getClientRects().length);}catch(e){els=[];}
  return els.filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0;});
}
/* 강조 대상의 화면 영역 계산 (상세창에 가려진 부분은 잘라냄) */
function calcBoxes(){
  const T=cur;
  const covered=!!document.querySelector('#bq.on')||modalOpen();
  const els=(!T||T.done||covered)?[]:visibleTargets();
  const sh=document.querySelector('#bInfo.on .sheet');
  const sr=sh?zRect(sh):null;
  const els2=[],boxes=[];
  els.forEach(e=>{
    const r=zRect(e);
    const pt=(e.classList&&e.classList.contains('unit')&&e.querySelector('.tbadge'))?20:4;   // 예상 피해 숫자까지 감싸기
    let o={l:r.left-4,t:r.top-pt,w:r.width+8,h:r.height+pt+4,in:!!(sh&&sh.contains(e))};   // 상세창 밖 대상은 상세창 아래 레이어(상세창이 위에서 덮어요)
    if(o.h<30){const d=30-o.h;o.t-=d/2;o.h=30;}                      // 에너지 게이지처럼 얇은 대상도 테두리가 보이게
    els2.push(e);boxes.push(o);
  });
  return{covered,els:els2,boxes,sr,inInfo:els2.length&&sh?sh.contains(els2[0]):false};
}
/* 말풍선 위치(목표값만 계산): 빛나는 곳·상세창과 겹치지 않는 빈 자리에, 첫 번째 강조 대상 가까이 */
const sm={fr:[],hole:[],ar:null,bxY:null,bxT:null,bxJump:1,tg:{boxes:[],dimOn:false,arrow:null},raf:0,last:0};
function placeBox(c){
  const bx=document.getElementById('tutBox');if(!bx)return;
  c=c||calcBoxes();
  const boxes=c.boxes,vh=VH();
  const H=zRect(bx).height||150;
  const mid=Math.max(8,(vh-H)/2);
  if(!boxes.length){sm.bxT=mid;return;}
  const G=10,top0=8,bot0=vh-54;                         // 아래 54px은 보스 띠 자리
  const blocked=boxes.map(o=>[o.t-G,o.t+o.h+G]);
  if(c.sr)blocked.push([c.sr.top-4,c.sr.top+c.sr.height]);
  blocked.sort((x,y)=>x[0]-y[0]);
  const merged=[];blocked.forEach(iv=>{const l=merged[merged.length-1];if(l&&iv[0]<=l[1])l[1]=Math.max(l[1],iv[1]);else merged.push(iv.slice());});
  const gaps=[];let cur0=top0;
  merged.forEach(iv=>{if(iv[0]-cur0>0)gaps.push([cur0,iv[0]]);cur0=Math.max(cur0,iv[1]);});
  if(bot0-cur0>0)gaps.push([cur0,bot0]);
  const p=boxes[0],pc=p.t+p.h/2;
  let best=null,bd=1e9;
  gaps.forEach(g=>{if(g[1]-g[0]<H)return;const gc=(g[0]+g[1])/2,d=Math.abs(gc-pc);if(d<bd){bd=d;best=g;}});
  if(!best){gaps.forEach(g=>{if(!best||g[1]-g[0]>best[1]-best[0])best=g;});}
  if(!best){sm.bxT=mid;return;}
  const above=(best[0]+best[1])/2<pc;                 // 대상 위쪽 빈자리면 아래쪽 끝에, 아래쪽이면 위쪽 끝에 붙임
  let y=above?best[1]-H:best[0];
  sm.bxT=Math.max(top0,Math.min(y,vh-H-8));
}
/* 목표값 갱신(느슨한 주기) — 실제 화면 반영은 아래 애니메이션 루프가 부드럽게 따라가요 */
function placeSkip(){const sk=document.getElementById('tutSkip'),mb=document.getElementById('bMenu');if(!sk)return;
  if(!mb||!cur||cur.done){sk.style.display='none';return;}
  const r=mb.getBoundingClientRect();if(!r.width){sk.style.display='none';return;}
  let bt=r.bottom;try{const fb=document.getElementById('bFull'),fr=fb&&fb.getBoundingClientRect();if(fr&&fr.width&&fr.bottom>bt&&fr.top<r.bottom+40)bt=fr.bottom;}catch(e){} // 전체화면 버튼(메뉴 바로 아래)과 겹치지 않게 그 아래에 둬요
  sk.style.display='block';sk.style.top=Math.round(bt+6)+'px';sk.style.right=Math.max(4,Math.round(innerWidth-r.right))+'px';sk.style.left='auto';}
function updateFrames(){
  try{placeSkip();}catch(e){}
  const hl=document.getElementById('tutHL');if(!hl)return;
  const T=cur;
  const c=calcBoxes(),covered=c.covered,els=c.els,boxes=c.boxes;
  const bx=document.getElementById('tutBox');
  if(bx)bx.classList.toggle('cov',covered);
  const dimOn=!!T&&!T.done&&!covered&&(boxes.length>0||!!T.sayOn);
  let arrow=null;
  if(els.length&&!c.inInfo){                          // 상세창 안 대상은 테두리만(화살표가 글자를 가림)
    const o=boxes[0];
    const below=o.t<64||!!(els[0].closest&&els[0].closest('#foeLane'));   // 상대 칸은 숫자를 가리지 않게 아래에서 가리킴
    arrow={ch:below?'▲':'▼',x:o.l+o.w/2-12,y:below?o.t+o.h+4:o.t-30};
  }
  sm.tg={boxes:boxes.map(o=>({l:o.l,t:o.t,w:o.w,h:o.h,in:o.in})),dimOn,arrow};
  placeBox(c);
  loop();
}
/* 프레임·어둡게 구멍·화살표·말풍선을 매 프레임 부드럽게 이동/크기 변경 */
function loop(){if(sm.raf)return;sm.last=performance.now();sm.raf=requestAnimationFrame(tick);}
function tick(now){
  sm.raf=0;
  const hl=document.getElementById('tutHL');
  if(!hl||!cur||cur.done){sm.fr=[];sm.hole=[];sm.ar=null;return;}
  const dt=Math.min(64,Math.max(1,now-sm.last));sm.last=now;
  const k=1-Math.exp(-dt/70),ka=1-Math.exp(-dt/110);
  const tg=sm.tg,boxes=tg.boxes;
  let busy=false;
  /* 강조 테두리 + 어둡게 구멍 */
  const g=document.getElementById('tutHoles'),hl2=document.getElementById('tutHL2');
  const n=Math.max(boxes.length,sm.fr.length);
  sm.els=sm.els||[];
  while(sm.els.length<n){const f=document.createElement('div');f.className='tutFr';hl.appendChild(f);sm.els.push(f);}
  const kf=1-Math.exp(-dt/22);                          // 사라질 때는 거의 바로
  for(let i=0;i<n;i++){
    const t=boxes[i];let d=sm.fr[i];
    if(t&&!d){const near=sm.fr.find(x=>x&&x.a>.3);d=sm.fr[i]=near?{l:near.l,t:near.t,w:near.w,h:near.h,a:0,in:t.in}:{l:t.l,t:t.t,w:t.w,h:t.h,a:0,in:t.in};}
    if(!d)continue;
    if(t){d.in=t.in;d.l+=(t.l-d.l)*k;d.t+=(t.t-d.t)*k;d.w+=(t.w-d.w)*k;d.h+=(t.h-d.h)*k;d.a+=(1-d.a)*ka;
      if(Math.abs(t.l-d.l)+Math.abs(t.t-d.t)+Math.abs(t.w-d.w)+Math.abs(t.h-d.h)>.4||d.a<.98)busy=true;else{d.l=t.l;d.t=t.t;d.w=t.w;d.h=t.h;d.a=1;}}
    else{d.a+=(0-d.a)*kf;if(d.a<.06){sm.fr[i]=null;}else busy=true;}
    const f=sm.els[i],h=sm.hole[i]||(g&&(sm.hole[i]=document.createElementNS('http://www.w3.org/2000/svg','rect')));
    if(g&&h&&!h.parentNode){h.setAttribute('rx','16');h.setAttribute('fill','#000');g.appendChild(h);}
    if(!sm.fr[i]){if(f)f.style.display='none';if(h)h.setAttribute('width','0');continue;}
    if(f){
      const lay=d.in&&hl2?hl2:hl;if(f.parentNode!==lay)lay.appendChild(f);
      f.style.display='block';f.style.left=d.l+'px';f.style.top=d.t+'px';f.style.width=d.w+'px';f.style.height=d.h+'px';f.style.opacity=d.a;
    }
    if(h){h.setAttribute('x',d.l);h.setAttribute('y',d.t);h.setAttribute('width',Math.max(0,d.w));h.setAttribute('height',Math.max(0,d.h));h.setAttribute('fill-opacity',d.a);}
  }
  while(sm.fr.length&&!sm.fr[sm.fr.length-1])sm.fr.pop();
  const dim=document.getElementById('tutDim');
  if(dim){
    dim.style.display='block';dim.style.opacity=tg.dimOn?'1':'0';
    const rr=document.getElementById('tutDimR');if(rr)rr.style.fill=boxes.length?'rgba(30,30,56,.5)':'rgba(30,30,56,.38)';
  }
  /* 화살표 */
  const ar=document.getElementById('tutArrow');
  if(ar){
    const t=tg.arrow;let d=sm.ar;
    if(t&&!d)d=sm.ar={x:t.x,y:t.y,a:0};
    if(d){
      if(t){d.x+=(t.x-d.x)*k;d.y+=(t.y-d.y)*k;d.a+=(1-d.a)*ka;ar.textContent=t.ch;if(Math.abs(t.x-d.x)+Math.abs(t.y-d.y)>.4||d.a<.98)busy=true;}
      else{d.a+=(0-d.a)*kf;if(d.a<.06){sm.ar=null;}else busy=true;}
      if(sm.ar){ar.style.display='block';ar.style.left=d.x+'px';ar.style.top=d.y+'px';ar.style.opacity=d.a;}else ar.style.display='none';
    }else ar.style.display='none';
  }
  /* 말풍선 위치 */
  const bx=document.getElementById('tutBox');
  if(bx&&sm.bxT!=null&&(bx.classList.contains('on')||sm.bxY==null)){   // 사라지는 중에는 제자리 유지(가운데로 튀지 않게)
    if(sm.bxY==null||sm.bxJump){sm.bxY=sm.bxT;sm.bxJump=0;}
    else{const dy=sm.bxT-sm.bxY;if(Math.abs(dy)<.4)sm.bxY=sm.bxT;else{sm.bxY+=dy*(1-Math.exp(-dt/90));busy=true;}}
    bx.style.bottom='auto';bx.style.top=sm.bxY+'px';
  }
  if(busy)sm.raf=requestAnimationFrame(tick);
}

/* ---------- 점선 화살표(보스가 노리는 대상 표시) ---------- */
function aimArrow(fromEl,toEl){
  let svg=document.getElementById('tutAim');if(svg)svg.remove();
  svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='tutAim';svg.style.opacity='0';
  svg.innerHTML='<path class="aimBg"/><path class="aimPath"/><polygon class="aimHead"/>';
  document.body.appendChild(svg);
  const bg=svg.querySelector('.aimBg'),pa=svg.querySelector('.aimPath'),hd=svg.querySelector('.aimHead');
  const P=el=>{const r=zRect(el);return{x:r.left+r.width/2,y:r.top+r.height/2,r};};
  const A0=P(fromEl);let S0={x:A0.x,y:A0.r.top+A0.r.height*.8};
  let E=(()=>{const q=P(toEl);return{x:q.x,y:q.r.top+2};})();
  const draw=()=>{
    const dx=E.x-S0.x,dy=E.y-S0.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,off=Math.min(60,L*.18)*(dx>=0?1:-1)*(Math.abs(dx)<4?1:1);
    const cx=(S0.x+E.x)/2+nx*off,cy=(S0.y+E.y)/2+ny*off;
    const tx=E.x-cx,ty=E.y-cy,tl=Math.hypot(tx,ty)||1,ux=tx/tl,uy=ty/tl;
    const bx=E.x-ux*16,by=E.y-uy*16;                      // 화살촉 뒤쪽까지만 점선
    const d='M'+S0.x+' '+S0.y+' Q'+cx+' '+cy+' '+bx+' '+by;
    bg.setAttribute('d',d);pa.setAttribute('d',d);
    const px=-uy,py=ux;
    hd.setAttribute('points',[E.x,E.y,bx+px*11,by+py*11,bx-px*11,by-py*11].map(v=>v.toFixed(1)).join(' '));
  };
  draw();requestAnimationFrame(()=>{svg.style.opacity='1';});
  const o={
    async to(el,ms){                                       // 화살표 끝을 다른 포켓몬으로 부드럽게 옮김
      const q=P(el),t={x:q.x,y:q.r.top+2},s={x:E.x,y:E.y},t0=performance.now();ms=ms||520;
      await new Promise(res=>{const st=now=>{const u=Math.min(1,(now-t0)/ms),e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;E={x:s.x+(t.x-s.x)*e,y:s.y+(t.y-s.y)*e};draw();if(u<1)requestAnimationFrame(st);else res();};requestAnimationFrame(st);});
    },
    async off(){svg.style.opacity='0';await wait(260);svg.remove();}
  };
  return o;
}
async function aimSeq(decoyIdx,realIdx,t1,t2,hi1,hi2){          // 다른 포켓몬을 노리다가 → 바위 벽/강철로 바뀜
  const T=cur,me=B.me,boss=unitEl(B.foe,BOSS_SLOT);
  if(!boss||realIdx<0)return;
  const dIdx=decoyIdx>=0?decoyIdx:realIdx;
  T.hi=()=>[unitEl(me,dIdx)];
  say(t1);
  await wait(500);chk();
  document.body.classList.add('aimOn');
  const ar=aimArrow(boss,unitEl(me,dIdx));
  fx(unitEl(me,dIdx),'🎯 노려요!','txt');sfx('tap');
  await wait(1500);chk();
  if(dIdx!==realIdx){
    T.hi=()=>[unitEl(me,realIdx)];
    say(t2);
    await ar.to(unitEl(me,realIdx),650);
    fx(unitEl(me,realIdx),'🔀 대상 변경!','txt');sfx('win');
    await wait(1300);chk();
  }
  await ar.off();
  document.body.classList.remove('aimOn');
  T.hi=()=>[];
}

/* ---------- 허용한 행동만 누를 수 있게 막기 ---------- */
let lastNudge=0;
function kindOf(t){
  let e;
  if((e=t.closest('.hand .card')))return{k:'hand',i:+e.dataset.h};
  if((e=t.closest('#myLane .slot')))return{k:'my',i:+e.dataset.i,empty:!e.querySelector('.unit')};
  if((e=t.closest('#foeLane .slot')))return{k:'foe',i:+e.dataset.i};
  if(t.closest('#heroFoe'))return{k:'foeHero'};
  if(t.closest('#heroMe'))return{k:'hero'};
  if(t.closest('#bEnd'))return{k:'end'};
  if(t.closest('#bPower'))return{k:'power'};
  return{k:'other'};
}
function installGuard(){
  const b=document.getElementById('battle');if(!b||b._tutG)return;b._tutG=1;
  b.addEventListener('click',e=>{
    const T=cur;if(!T||T.done||!B||!B.tut)return;
    if(e.target.closest('#bMenu'))return;
    const k=kindOf(e.target);if(k.k==='other')return;
    let ok=false;try{ok=!T.lock&&!!T.allow&&!!T.allow(k);}catch(x){ok=false;}
    if(ok){if(T.onClick){try{T.onClick(k);}catch(x){}}return;}
    e.stopPropagation();e.preventDefault();
    const now=Date.now();
    const vis=visibleTargets().length,nb=document.querySelector('#tutBox.on .tbNext');const hasNext=!!(nb&&nb.style.display!=='none');
    if(now-lastNudge>1400){lastNudge=now;sfx('wrong');toast((T.hint&&T.hint(k))||(vis?'지금은 <b>반짝이는 곳</b>만 누를 수 있어요!':hasNext?'안내를 읽고 <b>다음</b>을 눌러 주세요!':'잠깐만 기다려 주세요!'));}
    const hl=document.getElementById('tutHL');
    [hl,document.getElementById('tutHL2')].forEach(h=>{if(h&&vis){h.classList.remove('nudge');void h.offsetWidth;h.classList.add('nudge');}});
  },true);
}
const A={
  none:()=>false,
  end:k=>k.k==='end',
  /* 카드 한 장 고르기 + 내 빈 칸 누르기(출전) */
  summon:idx=>k=>(k.k==='hand'&&k.i===idx)||(k.k==='my'&&k.empty),
  /* 내 포켓몬 고르기 → 보스 포켓몬 공격 */
  attack:si=>k=>(k.k==='my'&&!k.empty&&k.i===si)||(k.k==='foe'&&k.i===BOSS_SLOT&&B.sel>=0)
};

/* ---------- 연출 도우미 ---------- */
function setHand(ids){B.me.hand=ids.slice();B.pick=-1;renderBattle();}
function grant(n){const me=B.me;me.maxMana=Math.min(6,n);me.mana=Math.min(6,n);me.bonusMana=0;me.sunMana=0;renderBattle();}
function resetBoss(full){
  const old=bossUnit(),n=mkUnit(BOSS_ID);n.fresh=0;
  n.hp=full||!old?n.max:Math.max(1,Math.min(old.hp,n.max));
  B.foe.board[BOSS_SLOT]=n;renderBattle();
}
async function returnToCard(i){
  const el=unitEl(B.me,i);if(!el)return;
  fx(el,'카드로 돌아갔어요!','txt');
  try{particles(el,'#ffe9a8',14);}catch(e){}
  sfx('heal');
  try{await el.animate([{transform:'none',opacity:1,filter:'none'},{transform:'translateY(-14px) scale(1.06)',opacity:1,filter:'brightness(1.8)',offset:.35},{transform:'translateY(-44px) scale(.25)',opacity:0,filter:'brightness(2.4)'}],{duration:640,easing:'ease-in',fill:'forwards'}).finished;}catch(e){await wait(640);}
}
async function newMyTurn(){
  const me=B.me;
  B.side='me';B.turn++;B.round++;B.busy=false;B.sel=-1;B.pick=-1;
  me.board.forEach(u=>{if(u){u.fresh=0;u.att=1;u.attTot=1;}});
  renderBattle();banner('내 차례!','',1000);await wait(950);chk();
}
async function foeTurnBegin(label,fast){
  cur.allow=A.none;cur.hi=()=>[];hideSay();
  B.side='foe';B.busy=true;B.sel=-1;B.pick=-1;renderBattle();
  await wait(fast?250:350);banner('보스의 차례!',label||'',fast?1000:1300);await wait(fast?850:1100);chk();
}

/* ---------- 수학 문제 안내(첫 공격 직전) ---------- */
async function mathIntro(){
  const T=cur;
  const chips=on=>'<div class=tbChips><div class="tbChip'+(on===0?' on':'')+'">정답<b>공격력 그대로</b></div><div class="tbChip'+(on===1?' on':'')+'">3연속 콤보<b>+1 추가</b></div><div class="tbChip'+(on===2?' on':'')+'">오답<b>절반만</b></div></div>';
  T.hi=()=>[];
  T.th=['수학 문제','book'];
  await say('공격할 때마다 <b>수학 문제</b>가 나와! 문제를 <b>맞히면</b> 포켓몬의 공격력만큼 <b>제대로</b> 데미지가 들어가.'+chips(0),{btn:'다음'});
  T.th=['콤보','flame'];
  await say('문제를 <b>3번 연속</b>으로 맞히면 <b>콤보</b>! 데미지가 <b>+1</b> 더 들어가. 연속으로 맞힐수록 더 강해져!'+chips(1),{btn:'다음'});
  T.th=['틀리면?','sword'];
  await say('반대로 문제를 <b>틀리면</b> 데미지가 <b>절반</b>만 들어가. 천천히 읽고 풀면 괜찮아!<br>이제 첫 문제를 풀어 보자!'+chips(2),{btn:'문제 풀기'});
  hideSay();
}

/* ---------- 내 공격(튜토리얼 규칙) ---------- */
async function tutAttack(si,tg){
  const T=cur;if(!T||T.lock)return;
  const me=B.me,foe=B.foe,a=me.board[si];
  if(!a)return;
  const isHero=!!tg.hero,d=isHero?null:foe.board[tg.u],wasFz=!!(d&&d.frozen);
  if(!isHero&&!d)return;
  T.lock=true;B.busy=true;B.sel=-1;T.hi=()=>[];hideSay();renderBattle();
  let ok=true;
  try{
    if(!T.q1done){                          // 첫 공격만 진짜 문제 · 이후는 연습 정답
      T.q1done=true;await mathIntro();chk();let q=null;try{q=pickQ();}catch(e){}
      if(q){const r=await battleQ(q,{who:a.id,what:(isHero?esc(foe.name):name(d.id))+'에게 공격!'});ok=!!r.ok;if(ok){B.qc++;}}
    }
    chk();
    a.fresh=0;T.lastAtk=a.id;
    for(let once=0;once<1;once++){           // 용의 기세는 재행동: 입력 한 번에 공격 한 번
      const tot=a.attTot||(hk(a,'double')?2:1),h=Math.max(0,Math.min(tot-1,tot-(a.att||1)));
      a.att=Math.max(0,(a.att||0)-1);
      const base=hk(a,'double')?Math.max(1,a.atk+dragonModAt(a,h,tot)):a.atk;
      let dmg=ok?base:Math.ceil(base/2);
      const tags=[];
      if(isHero){const q2=quakeB(a);if(q2){dmg+=q2;tags.push('땅울림 +'+q2);}}
      else{const f2=fightB(a);if(f2){dmg+=f2;tags.push('격투 +'+f2);}}
      if(hk(a,'double'))tags.push(h===0?'첫 공격 -2':'두 번째 공격 그대로');
      const toEl=isHero?heroEl(foe):unitEl(foe,tg.u);
      const cap=isHero?foe.hp-1:(foe.board[tg.u]?foe.board[tg.u].hp-1:1);
      dmg=Math.max(1,Math.min(dmg,cap));         // 보스 보호: 체력 1 미만으로 내려가지 않아요
      try{await preAtkFx(me,si,a,isHero?{hero:1}:{u:tg.u});}catch(e){}chk();
      await skillMove(me,si,toEl,ok,false);chk();
      if(isHero){foe.hp-=dmg;impact(toEl,dmg,{hero:1,col:'#ff5a5f'});fx(toEl,'-'+dmg,ok?'crit big':'');renderBattle();await wait(250);}
      else{await dealUnit(foe,tg.u,dmg);}
      if(!isHero){
        if(hk(a,'freeze')&&foe.board[tg.u])applyFreeze(foe,tg.u,a);
        if(hk(a,'poison')&&foe.board[tg.u])poisonHit(foe,tg.u,false);
      }
      const lead=h===0?(ok?'정답! ':'약한 공격… '):'';
      const lab=(lead+tags.join(' · ')).trim();
      if(lab)fx(unitEl(me,si),lab,'txt');
      if(ok&&h===0)sfx('crit');
      if(!isHero){
        if(hk(a,'wing')){await wait(220);fx(unitEl(me,si),'반격 없음!','txt');}
        else if(!wasFz){const cd=Math.max(0,Math.min(COUNTER,a.hp-1));if(cd>0){await wait(240);await dealUnit(me,si,cd);}}   // 반격도 스크립트 고정값
      }
      if(hk(a,'double')&&a.att>0&&a.hp>0){try{await dragonFangFx(me,si);}catch(e){}}   // 재행동 연출
    }
    cleanup();
  }finally{T.lock=false;B.busy=false;if(B&&B.tut)renderBattle();}
  fire('attackDone',{ok});
}

/* ---------- 파트 A ---------- */
async function bossEntrance(){
  const f=document.getElementById('tutFade');
  renderBattle();
  await wait(550);chk();
  if(f){f.classList.add('out');}
  await wait(900);chk();
  B.foe.board[BOSS_SLOT]=mkUnit(BOSS_ID);B.foe.board[BOSS_SLOT].fresh=0;
  renderBattle();
  banner('보스 등장!','레지드래고',1700);
  try{slamFx(B.foe,BOSS_SLOT);}catch(e){}
  try{await legendFx(B.foe,BOSS_SLOT,MON[BOSS_ID].name);}catch(e){}
  await wait(500);chk();
}

async function partA(){
  const T=cur,me=B.me,foe=B.foe;
  setProg(0);
  /* 장면 1. 보스 등장 */
  await bossEntrance();
  T.allow=A.none;T.hi=()=>[];
  T.th=['환영해요','ball'];T.sc=1;await say('포켓몬 트레이너가 된 것을 환영해! 지금부터 실제 전투를 통해 포켓몬을 출전시키고, 공격하고, 특성을 활용하는 방법을 배워 보자.<br>걱정하지 마. 한 단계씩 직접 해 보면 금방 익숙해질 거야!',{btn:'다음'});

  /* 장면 2. 에너지와 첫 출전 (턴 1) */
  B.side='me';B.turn=1;B.round=1;B.busy=false;
  setHand([FIRE_ID]);grant(MON[FIRE_ID].cost);
  banner('내 차례!','',900);await wait(850);chk();
  T.allow=A.summon(0);
  T.hi=()=>B.pick>=0?[document.querySelector('#bInfo .kwbox'),document.getElementById('biPlay'),emptySlotEl()]:[handEl(0),manaEl()];
  T.th=['에너지','bolt'];T.sc=2;say('<b>에너지</b>는 포켓몬을 출전시키거나 카드를 쓸 때 필요한 자원이야. 처음에는 에너지가 적지만 턴이 지날수록 늘어. 지금 에너지에 맞는 포켓몬을 출전시켜 보자!');
  let r=await W('pick','summon');
  while(r.evt==='pick'){
T.th=['불씨','flame'];    say('<b>불씨</b> 특성이야! 출전할 때와 내 차례가 시작될 때마다 상대 포켓몬 하나에게 1의 피해를 줘.<br><b>내보내기</b>를 눌러서 출전시켜 보자!');
    r=await W('pick','summon');
  }
  /* summon 이벤트: 불씨 피해가 이미 들어간 뒤 */
  setProg(1);
  T.allow=A.none;T.hi=()=>[bossUnit()?unitEl(foe,BOSS_SLOT):null];
  T.th=['불씨 발동','flame'];await say('<b>불씨</b> 발동! 레지드래고에게 1의 피해를 줬어. 체력이 <b>9 → '+bossHp()+'</b>로 줄었지?',{btn:'다음'});
  T.allow=A.end;T.hi=()=>[endEl()];
  T.th=['차례 끝','check'];say('이제 <b>차례 끝</b> 버튼만 누를 수 있어. 눌러서 상대에게 차례를 넘기자!');
  await W('end');

  /* 장면 3. 보스의 차례, 다시 내 차례 (턴 2) */
  await foeTurnBegin('레지드래고가 공격해요!');
  {
    const mi=myIdx(),u=me.board[mi];
    if(u){
      await skillMove(foe,BOSS_SLOT,unitEl(me,mi),true,false);
      await dealUnit(me,mi,Math.max(0,Math.min(STRIKE1,u.hp-1)));
      cleanup();renderBattle();
    }
  }
  await wait(250);chk();
  T.hi=()=>[unitEl(me,myIdx())];
  T.th=['보스의 공격','dragon'];T.sc=3;await say('레지드래고가 공격해 왔어! 포켓몬도 피해를 받으면 <b>체력이 줄어들고</b>, 체력이 0이 되면 쓰러져. 지금은 체력이 남아 있으니 괜찮아!',{btn:'다음'});
  hideSay();T.hi=()=>[];

  await newMyTurn();
  {
    const mi=myIdx();
    await emberHit(foe,false,unitEl(me,mi));      // 불씨: 내 차례가 시작될 때도 발동
    cleanup();renderBattle();await wait(300);chk();
    T.hi=()=>[unitEl(foe,BOSS_SLOT)];
    T.th=['불씨 지속','flame'];await say('내 차례가 시작되자 <b>불씨</b>가 한 번 더 발동했어! 출전할 때뿐 아니라 내 차례가 올 때마다 계속 피해를 줘.<br>레지드래고의 체력은 이제 <b>'+bossHp()+'</b>이야.',{btn:'다음'});
    const si=myIdx();
    T.allow=A.attack(si);
    T.hi=()=>B.sel>=0?[unitEl(foe,BOSS_SLOT)]:[unitEl(me,si)];
T.th=['공격하기','sword'];    say('포켓몬을 출전시켰다고 공격까지 자동으로 하는 것은 아니야. 공격할 수 있는 포켓몬은 <b>초록색 테두리</b>로 표시돼. 초록색 테두리가 생긴 포켓몬을 눌러 공격해 보자!');
    r=await W('select','attackDone');
    while(r.evt==='select'){
      say('좋아! 이제 공격할 <b>상대 포켓몬</b>을 눌러 줘. 상대 머리 위의 <b>숫자</b>는 이 공격으로 들어갈 <b>예상 피해</b>야.');
      r=await W('select','attackDone');
    }
    const ok=!!(r.d&&r.d.ok);
    T.allow=A.none;T.hi=()=>[unitEl(me,si)];
    T.th=['공격 결과','sword'];await say((ok?'정답! 문제를 맞혀서 제대로 공격했어.':'아쉬워! 문제를 틀려서 공격이 <b>절반</b>만 들어갔어. 다음엔 맞힐 수 있을 거야!')+'<br>상대 <b>포켓몬</b>을 공격하면 <b>반격</b>을 받아서 내 포켓몬의 체력도 줄어. 하지만 상대 <b>트레이너</b>를 직접 공격하면 반격 없이 트레이너의 체력만 줄어들어.',{btn:'다음'});
  }

  /* 장면 4. 물결 출전과 회복 (턴 2, 같은 차례) */
  setHand([WATER_ID]);grant(MON[WATER_ID].cost);
  T.allow=A.summon(0);
  T.hi=()=>B.pick>=0?[document.querySelector('#bInfo .kwbox'),document.getElementById('biPlay'),emptySlotEl()]:[handEl(0),manaEl()];
  T.th=['물결','drop'];T.sc=4;say('체력이 줄어든 포켓몬이 있네. <b>물결</b> 특성 포켓몬을 출전시켜 보자! 출전할 때 내 포켓몬 모두의 체력이 <b>+1</b> 회복돼.');
  r=await W('pick','summon');
  while(r.evt==='pick'){
    say('<b>물결</b> 특성이야! 출전할 때 내 포켓몬 모두의 체력이 +1 회복돼.<br><b>내보내기</b>를 눌러 볼까?');
    r=await W('pick','summon');
  }
  setProg(2);
  T.allow=A.none;T.hi=()=>me.board.map((u,i)=>u?unitEl(me,i):null);
  T.th=['물결 발동','drop'];await say('<b>물결</b> 발동! 내 포켓몬 모두의 체력이 <b>+1</b> 회복됐어. 여러 마리를 함께 낼 때 회복이 더 유용해!',{btn:'다음'});
  T.hi=()=>[endEl()];
  T.th=['차례 끝','check'];say('할 일을 다 했으면 <b>차례 끝</b>을 눌러 줘.');
  T.allow=A.end;
  await W('end');

  /* 장면 5. 첫 정리 */
  await foeTurnBegin('마무리 일격!');
  resetBoss(false);                              // 정리 직전 보스 상태 초기화(체력은 그대로)
  {
    const idx=me.board.map((u,i)=>u?i:-1).filter(i=>i>=0);
    if(idx.length){
      await skillMove(foe,BOSS_SLOT,unitEl(me,idx[0]),true,false);
      shakeBoard();
      await Promise.all(idx.map(i=>returnToCard(i)));
      idx.forEach(i=>{me.board[i]=null;});
    }
  }
  me.hand=[];grant(0);
  resetBoss(true);                               // 단계가 끝나면 보스 체력 전부 회복
  B.side='me';B.busy=false;renderBattle();
  await wait(300);chk();
  T.th=['마무리 일격','dragon'];T.sc=5;await say('보스의 <b>마무리 일격</b>! 내 포켓몬들이 모두 <b>카드로 돌아갔어</b>. 연습이니까 괜찮아!',{btn:'다음'});
  T.th=['쓰러짐과 특성','heart'];await say('포켓몬은 전투 중 피해를 받아 체력이 0이 되면 쓰러질 수 있어. 하지만 어떤 포켓몬은 쓰러질 위기에도 버티고, 공격을 피하고, 아군을 보호하는 특별한 능력을 가지고 있지.',{btn:'다음'});
}

/* ===================================================================
   파트 B · 특성 체험 (8묶음)
   - 각 묶음은 같은 순서(준비 → 설명 → 체험 → 확인 → 정리)를 따르고 장면만 다릅니다.
   - 체험 포켓몬은 EXP 표에서 고르고, 특성 설명문은 게임 데이터(kwOf)를 그대로 보여 줘요.
   - 묶음을 더 만들 때는 async 함수를 하나 만들어 parts 배열에 넣으면 돼요.
   =================================================================== */
const EXP={tough:52,taunt:74,dodge:92,armor:599,heal:191,rush:172,freeze:361,fight:236,poison:23,quake:50,wing:16,draw:280,grow:10,double:147,sneak:261,fairy:173};
const ROCK_ID=377,ROCK_SLOT=3;
const kwI=id=>kwOf(MON[id]);
const kdesc=id=>kwI(id).d;
const icOf=id=>kwI(id).ic;
const TALK={"tough": "<b>처음 한 번</b> 쓰러질 만큼 맞아도 체력 1로 버텨 줘.", "taunt": "나올 때 <b>방어막</b>이 생겨. 그리고 상대는 이 포켓몬을 <b>먼저 공격해야</b> 해서 동료를 지켜 줘.", "dodge": "<b>처음 한 번</b> 받는 공격을 쏙 피해.", "armor": "받는 피해를 <b>1 줄여</b> 줘. 그리고 상대는 이 포켓몬을 먼저 공격해야 해.", "heal": "나올 때 내 트레이너 체력을 <b>2</b> 회복해 줘.", "rush": "나오자마자 <b>바로 공격</b>할 수 있어.", "freeze": "공격하면 상대에게 <b>얼음이 쌓여</b>. 두 번 쌓이면 상대가 <b>한 차례 얼어서</b> 움직이지 못해.", "fight": "포켓몬을 공격할 때 공격이 <b>+1</b> 세져.", "poison": "공격한 상대를 <b>약하게</b> 만들어. 상대의 공격이 1 줄고, 한 포켓몬에게 최대 3까지 줄어.", "quake": "상대 <b>트레이너</b>를 공격할 때 피해가 <b>+1</b> 더 들어가.", "wing": "공격해도 <b>반격을 안 받아</b>. 반대로 상대가 공격해 오면 반격 피해가 1.5배로 커져.", "draw": "나올 때 카드를 <b>한 장 더</b> 뽑아.", "grow": "내 차례가 시작될 때마다 공격이 <b>+1</b>씩 올라. 최대 +2까지야.", "double": "한 차례에 <b>두 번</b> 행동해. 첫 번째 공격은 피해가 -2지만, 두 번째 공격은 그대로야.", "sneak": "<b>바위 벽</b>을 무시하고 바로 공격할 수 있어.", "fairy": "나올 때와 쓰러지기 전까지 <b>매 차례</b> 상대 포켓몬 하나의 공격을 <b>랜덤으로 -1</b> 해. (1턴 유지)"};
const quote=id=>TALK[kwI(id).k]||kdesc(id);          // 카드 문구를 그대로 읽지 않고 말하듯이 풀어 써요
const setTh=(h,ic,n,N)=>{cur.th=[h,ic];if(n){cur.sc=n;cur.scN=N||5;}};
const heroFoeEl=()=>document.getElementById('heroFoe');
const slotOf=id=>B.me.board.findIndex(u=>u&&u.id===id);
const myEl=id=>{const i=slotOf(id);return i<0?null:unitEl(B.me,i);};
const foeEl=s=>unitEl(B.foe,s);
const handEls=()=>Array.from(document.querySelectorAll('#battle .hand .card'));

/* 내 공격 허용: 고른 내 포켓몬 → 상대 포켓몬(칸 번호) 또는 상대 트레이너 */
A.atk=(mine,foeSlots,hero)=>k=>(k.k==='my'&&!k.empty&&mine.includes(k.i))||(k.k==='foe'&&foeSlots.includes(k.i)&&B.sel>=0)||(k.k==='foeHero'&&!!hero&&B.sel>=0);

/* ---------- 묶음 공통 도우미 ---------- */
async function myTurn(){                         // 내 차례 시작(남은 포켓몬은 다시 공격할 수 있어요)
  const me=B.me;cur.hint=null;cur.onClick=null;
  B.side='me';B.turn++;B.round++;B.busy=false;B.sel=-1;B.pick=-1;
  me.board.forEach(u=>{if(u){u.fresh=0;u.frozen=0;u.att=hk(u,'double')?2:1;u.attTot=u.att;}});
  B.foe.board.forEach(u=>{if(u&&u.frozen){u.frozen=0;u.icyFrozen=0;u.icy=0;u.moon=0;u.thawEnd=0;}});
  renderBattle();banner('내 차례!','',900);await wait(850);chk();
}
async function growTick(){                       // 성장: 내 차례가 시작될 때 공격 +1
  const me=B.me;
  me.board.forEach((u,i)=>{if(u&&hk(u,'grow')&&u.grow<growCap(u)){u.grow++;u.atk++;try{kwFx('grow',unitEl(me,i));}catch(e){}fx(unitEl(me,i),'성장 '+u.grow+'/'+growCap(u)+(u.grow>=growCap(u)?' (최대)':''),'txt');}});
  renderBattle();await wait(800);chk();
}
async function bossStrike(i,dmg,label,o){        // 보스의 공격: 기본은 체력 1 아래로 내리지 않는 연출 피해
  o=o||{};const me=B.me,u=me.board[i];if(!u)return 0;
  await skillMove(B.foe,o.from!=null?o.from:BOSS_SLOT,unitEl(me,i),true,false);chk();
  const d=o.raw?dmg:Math.max(0,Math.min(dmg,u.hp-1));
  const r=await dealUnit(me,i,d);
  if(label)fx(unitEl(me,i),label,'txt');
  cleanup();renderBattle();await wait(300);chk();
  return r;
}
async function heroHit(P,dmg){                   // 보스가 내 트레이너를 직접 공격(체력 1은 남김)
  await skillMove(B.foe,BOSS_SLOT,heroEl(P),true,false);chk();
  const d=Math.max(0,Math.min(dmg,P.hp-1));
  P.hp-=d;impact(heroEl(P),d,{hero:1,col:'#ff5a5f'});fx(heroEl(P),'-'+d,'crit big');
  renderBattle();await wait(500);chk();
}
async function doSummon(idx,intro,pick){         // 손패 카드 고르기 → 내보내기
  const T=cur;
  T.allow=A.summon(idx);
  T.hi=()=>B.pick>=0?[document.querySelector('#bInfo .kwbox'),document.getElementById('biPlay'),emptySlotEl()]:[handEl(idx),manaEl()];
  say(intro);
  let r=await W('pick','summon');
  while(r.evt==='pick'){say(pick||'<b>내보내기</b>를 눌러서 출전시켜 보자!');r=await W('pick','summon');}
}
async function attackStep(o){                    // 내 포켓몬 고르기 → 대상 누르기
  const T=cur;
  const mine=o.ids.map(slotOf).filter(i=>i>=0);
  T.hint=o.hint||null;T.heroOnly=!!o.hero;
  T.allow=A.atk(mine,o.foe||[],!!o.hero);
  const tgt=()=>o.hero?[heroFoeEl()]:(o.foe||[]).map(s=>foeEl(s));
  T.hi=()=>B.sel>=0?tgt():mine.map(i=>unitEl(B.me,i));
  say(o.pick);
  let r=await W('select','attackDone');
  while(r.evt==='select'){say(o.sel);r=await W('select','attackDone');}
  T.allow=A.none;T.hint=null;T.heroOnly=false;
  return r.d||{};
}
async function endTurnStep(txt){
  const T=cur;T.allow=A.end;T.hi=()=>[endEl()];
  setTh('차례 끝','check');
  say(txt||'할 일을 다 했으면 <b>차례 끝</b>을 눌러 줘.');
  await W('end');
}
async function note(html,hi,btn){                // 확인: 효과가 나온 곳을 강조하고 한 줄 설명
  const T=cur;T.allow=A.none;T.hint=null;T.hi=hi||(()=>[]);
  await say(html,{btn:btn||'다음'});
}
async function sweep(o){                         // 정리: 상태 초기화 → 마무리 일격 → 카드로 돌아가기
  o=o||{};const T=cur,me=B.me,foe=B.foe;
  const keep=o.keep||[];
  await foeTurnBegin('마무리 일격!');
  resetBoss(false);
  const strikers=o.strikers||[BOSS_SLOT];
  const idx=me.board.map((u,i)=>u?i:-1).filter(i=>i>=0&&!keep.includes(i));
  if(idx.length){
    for(let k=0;k<strikers.length;k++){await skillMove(foe,strikers[k],unitEl(me,idx[Math.min(k,idx.length-1)]),true,false);chk();}
    shakeBoard();
    await Promise.all(idx.map(i=>returnToCard(i)));
    idx.forEach(i=>{me.board[i]=null;});
  }
  me.hand=[];grant(0);me.hp=me.max;foe.hp=foe.max;
  resetBoss(true);
  B.side='me';B.busy=false;renderBattle();
  await wait(300);chk();
}

/* ---------- B1. 끈기 → 바위 벽 ---------- */
async function groupB1(){
  const T=cur,me=B.me,TG=EXP.tough,RW=EXP.taunt;
  banner('끈기 → 바위 벽','특성 체험',1400);await wait(1300);chk();
  setHand([TG]);grant(battleCost(TG));
  await myTurn();
  setTh('끈기',icOf(TG),1,5);
  await doSummon(0,'이번엔 쓰러질 위기에서 버티는 포켓몬이야. <b>'+name(TG)+'</b>의 특성 <b>끈기</b>는 '+quote(TG)+'<br>출전시켜 보자!');
  setProg(3);
  await endTurnStep('출전했어! <b>차례 끝</b>을 눌러 보스에게 차례를 넘기자.');
  await foeTurnBegin('보스의 큰 공격!',true);
  setTh('끈기!',icOf(TG),2,5);
  await bossStrike(slotOf(TG),5,'',{raw:true});      // 체력이 0이 되는 순간 끈기 발동
  await wait(400);chk();
  await note('쓰러질 만큼 센 공격이었는데 <b>체력 1</b>로 버텼어! 체력이 많은 것과는 달라. 끈기는 딱 <b>한 번만</b> 발동해.',()=>[myEl(TG)]);
  setHand([RW]);grant(battleCost(RW));
  await myTurn();
  setTh('바위 벽',icOf(RW),3,5);
  await doSummon(0,'이번엔 동료를 지켜 주는 포켓몬이야. <b>'+name(RW)+'</b>의 특성 <b>바위 벽</b>은 '+quote(RW)+'<br>출전시켜 보자!');
  setProg(4);
  await note('<b>방어막</b> 아이콘과 <b>갈색 테두리</b>가 생겼지? 이제 상대는 이 포켓몬부터 공격해야 해.',()=>[myEl(RW)]);
  await endTurnStep();
  await foeTurnBegin('공격 대상이 바뀌어요!',true);
  setTh('대상이 바뀌어요',icOf(RW),4,5);
  const ti=slotOf(TG),ri=slotOf(RW);
  await aimSeq(ti,ri,'보스는 먼저 <b>끈기</b> 포켓몬을 노리고 있어…','그런데 <b>바위 벽</b> 포켓몬이 있으면 <b>그 포켓몬부터</b> 공격해야 해!');
  await bossStrike(ri,3,'',{raw:true});
  await note('끈기 포켓몬을 노렸지만 <b>바위 벽</b> 포켓몬이 먼저 맞아야 해! <b>방어막</b>이 피해를 막아 줬어.',()=>[myEl(RW)]);
  await sweep();
  setTh('정리','check',5,5);
  await note('좋아! 끈기와 바위 벽, 두 가지 버티는 방법을 배웠어. 다음 특성으로 가 보자!');
}

/* ---------- B2. 유령 → 강철 ---------- */
async function groupB2(){
  const T=cur,me=B.me,DG=EXP.dodge,AR=EXP.armor;
  banner('유령 → 강철','특성 체험',1400);await wait(1300);chk();
  setHand([DG]);grant(battleCost(DG));
  await myTurn();
  setTh('유령',icOf(DG),1,6);
  await doSummon(0,'이번엔 공격을 피하는 포켓몬이야. <b>'+name(DG)+'</b>의 특성 <b>유령</b>은 '+quote(DG)+'<br>출전시켜 보자!');
  setProg(5);
  await endTurnStep();
  await foeTurnBegin('보스의 공격!',true);
  setTh('피했다!',icOf(DG),2,6);
  await bossStrike(slotOf(DG),5,'',{raw:true});
  await note('공격이 스르륵 <b>빗나갔어</b>! 하지만 피하는 건 <b>처음 한 번</b>뿐이야.',()=>[myEl(DG)]);
  setHand([AR]);grant(battleCost(AR));
  await myTurn();
  setTh('강철',icOf(AR),3,6);
  await doSummon(0,'이번엔 단단한 포켓몬이야. <b>'+name(AR)+'</b>의 특성 <b>강철</b>은 '+quote(AR)+'<br>출전시켜 보자!');
  setProg(6);
  await note('<b>회색 테두리</b>가 생겼지? 강철도 상대가 먼저 노려야 하는 포켓몬이야.',()=>[myEl(AR)]);
  await endTurnStep();
  await foeTurnBegin('보스의 공격!',true);
  setTh('대상이 바뀌어요',icOf(AR),4,6);
  await aimSeq(slotOf(DG),slotOf(AR),'보스는 먼저 <b>유령</b> 포켓몬을 노리고 있어…','그런데 <b>강철</b> 포켓몬이 있으면 <b>그 포켓몬부터</b> 공격해야 해!');
  setTh('피해가 줄어요',icOf(AR),5,6);
  await bossStrike(slotOf(AR),3,'강철 -1',{raw:true});
  await note('받는 피해가 <b>1 줄었어</b>! 바위 벽은 방어막이 사라지면 끝이지만, 강철은 공격을 받을 때마다 피해를 줄여 줘.',()=>[myEl(AR)]);
  await sweep();
  setTh('정리','check',6,6);
  await note('피하고, 단단하게 버티는 법까지 배웠네! 다음은 트레이너와 속도에 관한 특성이야.');
}

/* ---------- B3. 광합성 → 번개 ---------- */
async function groupB3(){
  const T=cur,me=B.me,HL=EXP.heal,RS=EXP.rush;
  banner('광합성 → 번개','특성 체험',1400);await wait(1300);chk();
  setTh('트레이너 체력',icOf(HL),1,4);
  await foeTurnBegin('트레이너를 직접 공격!',true);
  await heroHit(me,8);
  await note('필드에 포켓몬이 없으면 <b>트레이너</b>가 직접 공격을 받아! 포켓몬의 체력과 트레이너의 체력은 따로야.',()=>[heroEl(me)]);
  setHand([HL,RS]);grant(battleCost(HL)+battleCost(RS));
  await myTurn();
  setTh('광합성',icOf(HL),2,4);
  await doSummon(0,'트레이너가 다쳤네. <b>광합성</b> 포켓몬을 내 보자! <b>'+name(HL)+'</b>의 특성은 '+quote(HL));
  setProg(7);
  await note('트레이너 체력이 <b>회복</b>됐어! 광합성은 나올 때 트레이너 체력을 채워 줘.',()=>[heroEl(me)]);
  setTh('번개',icOf(RS),3,4);
  await doSummon(0,'이번엔 <b>번개</b> 포켓몬이야. <b>'+name(RS)+'</b>의 특성은 '+quote(RS)+'<br>방금 낸 광합성 포켓몬과 비교해 봐!');
  setProg(8);
  const r=await attackStep({ids:[RS],foe:[BOSS_SLOT],
    pick:'<b>초록색 테두리</b>가 있는 번개 포켓몬만 지금 공격할 수 있어! 눌러서 공격해 보자!',
    sel:'좋아! 이제 공격할 <b>상대 포켓몬</b>을 눌러 줘.'});
  await note('번개 포켓몬은 나온 차례에 <b>바로 공격</b>했어! 광합성 포켓몬은 다음 차례부터 공격할 수 있어.',()=>[myEl(RS)]);
  await endTurnStep();
  await sweep();
  setTh('정리','check',4,4);
  await note('트레이너를 고치고, 출전하자마자 공격하는 법을 배웠어!');
}

/* ---------- B4. 얼음 → 격투 ---------- */
async function groupB4(){
  const T=cur,me=B.me,FZ=EXP.freeze,FT=EXP.fight;
  banner('얼음 → 격투','특성 체험',1400);await wait(1300);chk();
  setHand([FZ]);grant(battleCost(FZ));
  await myTurn();
  setTh('얼음',icOf(FZ),1,5);
  await doSummon(0,'이번엔 상대를 얼리는 포켓몬이야. <b>'+name(FZ)+'</b>의 특성 <b>얼음</b>은 '+quote(FZ)+'<br>출전시켜 보자!');
  setProg(9);
  await endTurnStep();
  await foeTurnBegin('보스의 공격!',true);
  await bossStrike(slotOf(FZ),2,'');
  setHand([FT]);grant(battleCost(FT));
  await myTurn();
  setTh('얼음 공격',icOf(FZ),2,5);
  await attackStep({ids:[FZ],foe:[BOSS_SLOT],
    pick:'얼음 포켓몬에 <b>초록색 테두리</b>가 생겼어! 눌러서 보스를 공격해 보자!',
    sel:'좋아! 공격할 <b>상대 포켓몬</b>을 눌러 줘.'});
  await note('얼음 스택이 가득 찼어! 얼어붙은 포켓몬은 <b>한 차례 움직이지 못해</b>. (야생·일반 대전의 보스 포켓몬은 4스택이 필요해서 더 단단해.)',()=>[foeEl(BOSS_SLOT)]);
  await doSummon(0,'이어서 <b>'+name(FT)+'</b>도 출전시켜 두자!');
  setProg(10);
  await endTurnStep();
  await foeTurnBegin('보스의 차례',true);
  setTh('얼어붙은 보스',icOf(FZ),3,5);
  fx(foeEl(BOSS_SLOT),'❄ 얼어서 이번 차례는 쉬어요','txt');
  await wait(1000);chk();
  await myTurn();
  setTh('격투',icOf(FT),4,5);
  await attackStep({ids:[FT],foe:[BOSS_SLOT],
    pick:'보스가 얼어서 <b>공격하지 못했어</b>! 자, 이제 격투 포켓몬을 써 보자. <b>'+name(FT)+'</b>의 특성 <b>격투</b>는 '+quote(FT)+'<br>상대 포켓몬을 공격해 봐!',
    sel:'좋아! 공격할 <b>상대 포켓몬</b>을 눌러 줘.'});
  await note('피해 숫자에 <b>격투 +1</b>이 붙었지? 아까 얼음 포켓몬이 공격했을 때보다 더 세게 들어갔어!',()=>[foeEl(BOSS_SLOT)]);
  await endTurnStep();
  await sweep();
  setTh('정리','check',5,5);
  await note('상대를 얼리고, 공격력을 높이는 법을 배웠어!');
}

/* ---------- B5. 독 → 땅울림 ---------- */
async function groupB5(){
  const T=cur,me=B.me,foe=B.foe,PS=EXP.poison,QK=EXP.quake;
  banner('독 → 땅울림','특성 체험',1400);await wait(1300);chk();
  foe.hp=10;renderBattle();                      // 보스 본체 체력은 튜토리얼 전용으로 10
  setHand([PS]);grant(battleCost(PS));
  await myTurn();
  setTh('독',icOf(PS),1,5);
  await doSummon(0,'이번엔 상대를 약하게 만드는 포켓몬이야. <b>'+name(PS)+'</b>의 특성 <b>독</b>은 '+quote(PS)+'<br>출전시켜 보자!');
  setProg(11);
  await endTurnStep();
  await foeTurnBegin('보스의 공격!',true);
  await bossStrike(slotOf(PS),2,'');
  setHand([QK]);grant(battleCost(QK));
  await myTurn();
  setTh('독 공격',icOf(PS),2,5);
  await attackStep({ids:[PS],foe:[BOSS_SLOT],
    pick:'독 포켓몬에 <b>초록색 테두리</b>가 생겼어! 눌러서 보스를 공격해 보자!',
    sel:'좋아! 공격할 <b>상대 포켓몬</b>을 눌러 줘.'});
  await note('보스의 공격력이 <b>1 줄었어</b>! 독은 직접 피해를 주는 게 아니라 상대를 <b>약하게</b> 만드는 특성이야.',()=>[foeEl(BOSS_SLOT)]);
  await doSummon(0,'이어서 <b>'+name(QK)+'</b>도 출전시켜 두자!');
  setProg(12);
  await endTurnStep();
  await foeTurnBegin('약해진 보스의 공격!',true);
  setTh('약해진 공격',icOf(PS),3,5);
  await bossStrike(slotOf(PS),1,'독 -1');
  await note('독에 걸린 보스의 공격이 <b>약해졌어</b>! 피해가 아까보다 작지?',()=>[myEl(PS)]);
  await myTurn();
  setTh('땅울림',icOf(QK),4,5);
  await attackStep({ids:[QK],foe:[],hero:true,hint:k=>k.k==='foe'?'상대 <b>트레이너</b>를 눌러 봐!':null,
    pick:'<b>'+name(QK)+'</b>의 특성 <b>땅울림</b>은 '+quote(QK)+'<br>이번엔 포켓몬 대신 <b>상대 트레이너</b>를 노려 봐! 트레이너를 공격하면 반격도 없어.',
    sel:'좋아! 이제 <b>상대 트레이너</b>를 눌러 줘.'});
  await note('트레이너에게 <b>땅울림 +1</b>까지 더해져서 체력이 줄었어! 반격도 없었지?',()=>[heroFoeEl()]);
  await endTurnStep();
  await sweep();
  setTh('정리','check',5,5);
  await note('상대를 약하게 만들고, 트레이너를 직접 노리는 법을 배웠어!');
}

/* ---------- B6. 날개 → 예지 ---------- */
async function groupB6(){
  const T=cur,me=B.me,foe=B.foe,WG=EXP.wing,DR=EXP.draw;
  banner('날개 → 예지','특성 체험',1400);await wait(1300);chk();
  setHand([WG]);grant(battleCost(WG));
  await myTurn();
  setTh('날개',icOf(WG),1,5);
  await doSummon(0,'이번엔 반격을 피하는 포켓몬이야. <b>'+name(WG)+'</b>의 특성 <b>날개</b>는 '+quote(WG)+'<br>출전시켜 보자!');
  setProg(13);
  await endTurnStep();
  await foeTurnBegin('보스의 공격!',true);
  setTh('반격 ×1.5',icOf(WG),2,5);
  {
    const wi=slotOf(WG);
    await bossStrike(wi,1,'');
    const w=me.board[wi];
    if(w){
      const cd=Math.max(1,Math.min(Math.ceil(w.atk*wingM(w)),bossHp()-1));
      await skillMove(me,wi,foeEl(BOSS_SLOT),true,false);chk();
      await dealUnit(foe,BOSS_SLOT,cd);
      fx(foeEl(BOSS_SLOT),'반격 ×1.5','txt');
      cleanup();renderBattle();await wait(400);chk();
    }
  }
  await note('공격한 보스가 오히려 <b>더 큰 반격</b>을 맞았어!',()=>[foeEl(BOSS_SLOT)]);
  setHand([DR]);grant(battleCost(DR));
  T.deckTop=[EXP.grow];                          // 예지로 뽑을 카드(다음 묶음에서 쓸 성장 포켓몬)
  await myTurn();
  setTh('반격 없음',icOf(WG),3,5);
  await attackStep({ids:[WG],foe:[BOSS_SLOT],
    pick:'앞에서는 공격하면 반격을 받았지? 날개 포켓몬으로 보스를 공격해 보자!',
    sel:'좋아! 공격할 <b>상대 포켓몬</b>을 눌러 줘.'});
  await note('<b>반격 없음!</b> 날개 포켓몬은 공격해도 반격을 받지 않아!',()=>[myEl(WG)]);
  setTh('예지',icOf(DR),4,5);
  await doSummon(0,'손패가 한 장뿐이야. <b>'+name(DR)+'</b>의 특성 <b>예지</b>는 '+quote(DR)+'<br>출전시켜서 카드가 늘어나는지 봐!');
  setProg(14);
  await note('카드가 <b>한 장 늘었어</b>! 손패가 다 떨어지기 전에 카드를 채워 두는 것도 중요해!',()=>handEls());
  await endTurnStep();
  await sweep();
  setTh('정리','check',5,5);
  await note('반격을 피하고, 카드를 채우는 법까지 배웠어!');
}

/* ---------- B7. 성장 → 용의 기세 ---------- */
async function groupB7(){
  const T=cur,me=B.me,GR=EXP.grow,DB=EXP.double;
  banner('성장 → 용의 기세','특성 체험',1400);await wait(1300);chk();
  setHand([GR]);grant(battleCost(GR));
  await myTurn();
  setTh('성장',icOf(GR),1,4);
  await doSummon(0,'이번엔 시간이 지날수록 강해지는 포켓몬이야. <b>'+name(GR)+'</b>의 특성 <b>성장</b>은 '+quote(GR)+'<br>출전시켜 보자!');
  setProg(15);
  await endTurnStep();
  await foeTurnBegin('보스의 공격!',true);
  await bossStrike(slotOf(GR),2,'');
  setHand([]);grant(0);
  await myTurn();
  await growTick();
  setTh('공격력이 자라요',icOf(GR),2,4);
  await note('내 차례가 시작되자 <b>공격력이 올랐어</b>! 지금 공격할지, 조금 더 기다려 더 강하게 키울지는 내 선택이야. 이번엔 <b>기다려 보자</b>!',()=>[myEl(GR)]);
  setHand([DB]);grant(battleCost(DB));
  await doSummon(0,'이번엔 한 번에 두 번 공격하는 포켓몬이야. <b>'+name(DB)+'</b>의 특성 <b>용의 기세</b>는 '+quote(DB)+'<br>출전시켜 보자!');
  setProg(16);
  await endTurnStep();
  await foeTurnBegin('보스의 공격!',true);
  await bossStrike(slotOf(DB),1,'');
  await myTurn();
  await growTick();
  setTh('두 번 공격',icOf(DB),3,4);
  await note('성장은 <b>+2까지</b>야. 이제 공격해 보자!',()=>[myEl(GR)]);
  await attackStep({ids:[DB],foe:[BOSS_SLOT],
    pick:'<b>용의 기세</b> 포켓몬을 눌러 공격해 봐. 공격한 뒤에도 <b>한 번 더</b> 행동할 수 있어!',
    sel:'좋아! 공격할 <b>상대 포켓몬</b>을 눌러 줘.'});
  await note('첫 공격은 <b>-2</b>! 하지만 용의 기세는 <b>재행동</b>이라 이 포켓몬이 <b>한 번 더</b> 행동할 수 있어. 다시 눌러 보자!',()=>[myEl(DB)]);
  await attackStep({ids:[DB],foe:[BOSS_SLOT],
    pick:'<b>용의 기세</b> 포켓몬을 한 번 더 눌러 <b>두 번째 공격</b>을 해 보자!',
    sel:'<b>상대 포켓몬</b>을 눌러 줘. 두 번째 공격은 피해가 <b>그대로</b>야!'});
  await note('두 번째 공격은 피해가 <b>그대로</b>야! 용의 기세는 이렇게 <b>두 번 행동</b>해.',()=>[foeEl(BOSS_SLOT)]);
  await attackStep({ids:[GR],foe:[BOSS_SLOT],
    pick:'이번엔 <b>성장</b> 포켓몬을 눌러 공격해 보자!',
    sel:'좋아! 공격할 <b>상대 포켓몬</b>을 눌러 줘.'});
  await note('기다려서 키운 공격력이야! 빠르게 공격할지, 기다려서 키울지 생각하는 것도 전략이야.',()=>[foeEl(BOSS_SLOT)]);
  await endTurnStep();
  await sweep({keep:[slotOf(GR)]});               // 성장 포켓몬은 다음 묶음을 위해 남겨 둬요
  setTh('정리','check',4,4);
  await note('성장하는 포켓몬과 두 번 공격하는 포켓몬까지 배웠어! 성장 포켓몬은 조금 더 남겨 둘게.');
}

/* ---------- B8. 기습 → 요정의 빛 ---------- */
async function groupB8(){
  const T=cur,me=B.me,foe=B.foe,SN=EXP.sneak,FR=EXP.fairy,GR=EXP.grow;
  banner('기습 → 요정의 빛','특성 체험',1400);await wait(1300);chk();
  setTh('레지락 합류',icOf(ROCK_ID),1,5);
  {
    const n=mkUnit(ROCK_ID);n.fresh=0;foe.board[ROCK_SLOT]=n;renderBattle();
    try{slamFx(foe,ROCK_SLOT);}catch(e){}
    try{await legendFx(foe,ROCK_SLOT,MON[ROCK_ID].name);}catch(e){}
    try{kwFx('rockwall',foeEl(ROCK_SLOT));}catch(e){}
    await wait(500);chk();
    const bl=document.querySelector('#tutBoss .tbL');
    if(bl)bl.innerHTML='<b>BOSS</b> 레지드래고 · 레지락 <span class=tbStar>★★★★★</span><small>용의 기세 · 바위 벽 · 도감에는 등록되지 않는 상대예요</small>';
  }
  await note('또 한 마리가 나타났어! <b>레지락</b>도 <b>바위 벽</b> 특성이야. 상대는 레지락부터 공격해야 하고, 전설 포켓몬이라 방어막이 <b>더 두꺼워</b>(+3).',()=>[foeEl(ROCK_SLOT)]);
  setHand([SN]);grant(battleCost(SN));
  await myTurn();
  setTh('막힌 공격',icOf(ROCK_ID),2,5);
  {
    const gi=slotOf(GR);
    T.allow=A.atk([gi],[BOSS_SLOT],false);
    T.hi=()=>B.sel>=0?[foeEl(BOSS_SLOT)]:[unitEl(me,gi)];
    T.onClick=k=>{if(k.k==='foe'&&k.i===BOSS_SLOT)fire('tryDragon');};
    say('먼저 남아 있는 <b>성장 포켓몬</b>으로 공격하려 해 보자. 포켓몬을 눌러 봐!');
    let r=await W('select','tryDragon');
    if(r.evt==='select'){
      say('이제 <b>레지드래고</b>를 눌러 볼까?');
      r=await W('tryDragon');
    }
    T.onClick=null;T.allow=A.none;
    await note('레지락의 바위 벽 때문에 <b>레지락만</b> 공격할 수 있어! 그런데 이 방어를 뚫는 특성이 있어. 지금 손패의 포켓몬을 내 보자.',()=>[foeEl(ROCK_SLOT)]);
    B.sel=-1;renderBattle();
  }
  setTh('기습',icOf(SN),3,5);
  await doSummon(0,'<b>'+name(SN)+'</b>의 특성 <b>기습</b>은 '+quote(SN)+'<br>출전시켜 보자!');
  setProg(17);
  await endTurnStep();
  await foeTurnBegin('보스의 공격!',true);
  await bossStrike(slotOf(SN),1,'');
  await myTurn();
  setTh('기습',icOf(SN),3,5);
  await attackStep({ids:[SN],foe:[BOSS_SLOT],
    hint:k=>(k.k==='foe'&&k.i===ROCK_SLOT)?'레지락이 아니라 <b>레지드래고</b>를 눌러 봐!':null,
    pick:'기습은 <b>바위 벽을 무시하고</b> 공격해요. 기습 포켓몬을 눌러서 레지락을 건너뛰고 <b>레지드래고</b>를 직접 공격해 봐!',
    sel:'좋아! 이번엔 <b>레지드래고</b>를 눌러 줘.'});
  await note('방어 특성이 강력해도 이를 공략하는 포켓몬이 있어! 전설 기습은 방어막과 강철에도 대응해.',()=>[foeEl(BOSS_SLOT)]);
  setHand([FR]);grant(battleCost(FR));
  setTh('요정의 빛',icOf(FR),4,5);
  await doSummon(0,'마지막 특성이야! <b>'+name(FR)+'</b>의 특성 <b>요정의 빛</b>은 '+quote(FR)+'<br>출전시켜 보자!');
  setProg(18);
  {
    const d=foe.board[BOSS_SLOT],r=foe.board[ROCK_SLOT];
    const hit=(d&&d.fai>0)?{n:'레지드래고',s:BOSS_SLOT}:(r&&r.fai>0)?{n:'레지락',s:ROCK_SLOT}:null;
    if(hit)await note('<b>'+hit.n+'</b>의 공격력이 <b>1 줄었어</b>! 어느 쪽이 약해질지는 랜덤이야. 독은 공격한 상대를 약하게 만들지만, 요정의 빛은 <b>내는 순간 바로</b> 적용돼.',()=>[foeEl(hit.s)]);
    else await note('요정의 빛은 나올 때 상대 포켓몬 하나의 공격을 <b>랜덤으로 -1</b> 해! 독과 달리 <b>내는 순간 바로</b> 적용돼.',()=>[foeEl(BOSS_SLOT),foeEl(ROCK_SLOT)]);
  }
  await endTurnStep();
  await sweep({strikers:[BOSS_SLOT,ROCK_SLOT]});
  setTh('정리','check',5,5);
  await note('18가지 특성을 모두 체험했어! 이제 포켓몬이 아닌 카드를 써 볼까?');
}

async function partB(){
  await groupB1();chk();
  await groupB2();chk();
  await groupB3();chk();
  await groupB4();chk();
  await groupB5();chk();
  await groupB6();chk();
  await groupB7();chk();
  await groupB8();chk();
}


/* ============ 파트 C. 돌 카드와 몬스터볼 ============ */
const SUN_MON=18;                                  // 코스트 4 · 3성 (태양의 돌 장면용)
function resetRock(shield){const n=mkUnit(ROCK_ID);n.fresh=0;n.shield=shield;B.foe.board[ROCK_SLOT]=n;renderBattle();}
function placeAllies(ids){
  const me=B.me;me.board.forEach((_,i)=>{me.board[i]=null;});
  ids.forEach((id,k)=>{const u=mkUnit(id);u.fresh=0;u.att=1;u.attTot=1;me.board[k+1]=u;});
  renderBattle();
}
/* 카드 한 장을 직접 골라 사용하게 하기: 카드 선택 → (정보창 확인) → 사용하기 → (필요하면 대상 선택) */
async function useCard(o){
  const T=cur;
  T.hint=null;
  T.allow=k=>(k.k==='hand'&&k.i===o.idx)||(!!o.tmy&&k.k==='my'&&!k.empty&&k.i===o.tmy())||(o.tfoe!=null&&k.k==='foe'&&k.i===o.tfoe);
  T.hi=()=>{
    if(B.itemTargetMode&&o.tmy)return[unitEl(B.me,o.tmy())];
    if(B.moonTargetMode&&o.tfoe!=null)return[foeEl(o.tfoe)];
    return B.pick>=0?[document.querySelector('#bInfo .kwbox'),document.getElementById('biUse')]:[handEl(o.idx),manaEl()];
  };
  say(o.intro);
  let r=await W('pick','itemMode','item');
  while(r.evt!=='item'){
    if(r.evt==='pick')say(o.pick||'효과와 코스트를 확인했지? <b>사용하기</b>를 눌러 줘!');
    else say(o.target||'대상을 직접 눌러 줘!');
    r=await W('pick','itemMode','item');
  }
  T.allow=A.none;
  return r.d||{};
}
/* 몬스터볼: 카드 선택 → (한 번 더 누르거나 빈 칸) → 랜덤 포켓몬이 나와요 → 눌러서 정보 확인 */
async function ballScene(o){
  const T=cur,me=B.me;
  setTh(o.h,'ball',o.n,3);
  setHand([randomBandCard(o.ball)]);grant(o.cost);
  T.allow=A.summon(0);
  T.hi=()=>B.pick>=0?[emptySlotEl(),handEl(0)]:[handEl(0),manaEl()];
  say(o.intro);
  let r=await W('summon');
  const slot=r.d&&r.d.slot!=null?r.d.slot:-1,u=slot>=0?me.board[slot]:null;
  if(!u)return;
  u.att=0;u.practice=1;renderBattle();
  fx(unitEl(me,slot),'연습 소환!','txt');
  await wait(600);chk();
  T.allow=k=>k.k==='my'&&!k.empty&&k.i===slot;
  T.hi=()=>[unitEl(me,slot)];
  say('<b>'+esc(MON[u.id].name)+'</b>이(가) 나왔어! 소환된 포켓몬을 눌러서 정보를 확인해 봐.');
  await W('unitInfo');
  T.allow=A.none;
  await note('<b>별 개수, 코스트, 공격력, 체력, 특성</b>을 확인해 봐. 내 덱에 필요한 포켓몬인지 판단하는 게 중요해!',()=>[document.querySelector('#bInfo .sheet')],'다음');
  closeInfo();B.sel=-1;renderBattle();
  if(o.after)await note(o.after,()=>[]);
}
async function partC(){
  const T=cur,me=B.me,foe=B.foe,TG=EXP.tough,HL=EXP.heal;
  const dexSnap=Object.assign({},(S.meta&&S.meta.dexSeen)||{});
  const ST=(k)=>stoneCard(k);
  banner('돌 카드와 몬스터볼','카드 체험',1500);await wait(1400);chk();
  placeAllies([TG,HL]);resetBoss(true);resetRock(0);
  setHand([]);grant(0);
  T.allow=A.none;T.hi=()=>[];
  setTh('카드 소개','ball');cur.sc=0;
  const cp=T.cpart||'';
  await note(cp==='ball'?'이번엔 <b>몬스터볼</b>(랜덤 카드)을 써 볼까? 손패에는 <b>랜덤으로 포켓몬이 나오는 카드</b>가 들어올 수 있어!':cp==='stone'?'<b>돌 카드</b>를 하나씩 써 보자! 손패에는 포켓몬 카드 말고도 특별한 효과의 카드가 들어올 수 있어.':'이제 <b>포켓몬이 아닌 카드</b>를 써 볼까? 손패에는 포켓몬 카드 말고도 <b>돌 카드</b>와 <b>몬스터볼</b>이 들어올 수 있어. 먼저 돌 카드부터 해 보자!');
  await myTurn();
  if(cp!=='ball'){

  /* C-1 화염의 돌 */
  setHand([ST('fire')]);grant(3);
  setTh('화염의 돌','flame',1,5);
  await useCard({idx:0,intro:'<b>화염의 돌</b> · 코스트 3 · 상대 필드의 <b>모든 포켓몬</b>에게 <b>피해 2</b>. 상대가 둘 이상일 때 특히 좋아! 카드를 눌러 사용해 보자.'});
  await wait(500);chk();
  await note('둘 다 한 번에 맞았어! 상대 포켓몬이 많을수록 <b>화염의 돌</b>이 빛난다.',()=>[foeEl(BOSS_SLOT),foeEl(ROCK_SLOT)]);
  {const r=foe.board[ROCK_SLOT];if(r){r.shield=3;}renderBattle();}

  /* C-2 물의 돌 */
  setHand([ST('water')]);grant(3);
  setTh('물의 돌','drop',2,5);
  await useCard({idx:0,intro:'<b>물의 돌</b> · 코스트 3 · 내 필드의 <b>모든 포켓몬</b>에게 <b>방어막 +1</b>. 보스가 공격하기 전에 써 보자! 카드를 눌러 줘.'});
  await wait(500);chk();
  await note('두 포켓몬 모두 <b>방어막</b>이 생겼어! 이제 보스의 공격이 어떻게 달라지는지 볼까?',()=>[unitEl(me,slotOf(TG)),unitEl(me,slotOf(HL))]);
  await endTurnStep('<b>차례 끝</b>을 눌러 보스에게 차례를 넘기자.');
  await foeTurnBegin('보스의 공격!',true);
  setTh('방어막',icOf(EXP.taunt),2,5);
  await bossStrike(slotOf(TG),3,'');
  await note('방어막이 피해를 <b>줄여 줬어</b>! 맞을 때마다 피해가 줄고 방어막도 닳아. <b>공격을 받기 전에</b> 쓰는 게 중요해.',()=>[myEl(TG)]);
  await myTurn();

  /* C-3 전기의 돌 */
  setHand([ST('thunder')]);grant(3);
  setTh('전기의 돌','bolt',3,5);
  await attackStep({ids:[TG],foe:[ROCK_SLOT],
    pick:'먼저 <b>포켓몬</b>을 눌러 레지락을 공격해 봐. (바위 벽 때문에 레지락부터!)',
    sel:'좋아! <b>레지락</b>을 눌러 줘.'});
  await note('공격을 마친 포켓몬은 더 행동할 수 없어. <b>초록색 테두리</b>도 사라졌지? 그럴 때 쓰는 <b>전기의 돌</b>!',()=>[myEl(TG)]);
  setTh('전기의 돌','bolt',3,5);
  await useCard({idx:0,tmy:()=>slotOf(TG),
    intro:'<b>전기의 돌</b> · 코스트 3 · 내 포켓몬 하나가 <b>한 번 더</b> 행동해. 카드를 누른 다음, 행동할 포켓몬을 직접 눌러 봐.',
    target:'이제 <b>한 번 더 행동할 포켓몬</b>을 눌러 줘!'});
  await wait(400);chk();
  await note('다시 <b>초록색 테두리</b>가 생겼어! 이 포켓몬이 한 번 더 공격할 수 있어.',()=>[myEl(TG)]);
  await attackStep({ids:[TG],foe:[ROCK_SLOT],
    pick:'다시 <b>포켓몬</b>을 눌러 한 번 더 공격해 보자!',
    sel:'<b>레지락</b>을 눌러 줘.'});
  await endTurnStep();
  await foeTurnBegin('보스의 공격!',true);
  await bossStrike(slotOf(HL),1,'');
  await myTurn();

  /* C-4 달의 돌 */
  setHand([ST('moon')]);grant(3);
  setTh('달의 돌','moon',4,5);
  await useCard({idx:0,tfoe:BOSS_SLOT,
    intro:'<b>달의 돌</b> · 코스트 3 · 상대 포켓몬 하나를 <b>1턴 동안 기절</b>시켜. 위험할 때 상대의 행동을 막을 수 있어! 카드를 고른 다음 <b>레지드래고</b>를 눌러 봐.',
    target:'기절시킬 <b>레지드래고</b>를 눌러 줘!'});
  await wait(500);chk();
  await note('<b>자는 아이콘</b>이 떴지? 이제 차례를 넘기면 어떻게 될까?',()=>[foeEl(BOSS_SLOT)]);
  await endTurnStep();
  await foeTurnBegin('레지락만 행동해요!',true);
  setTh('기절',icOf(EXP.dodge),4,5);
  await bossStrike(slotOf(HL),2,'',{from:ROCK_SLOT});
  await note('기절한 포켓몬은 이번 차례에 <b>움직이지 못해</b>. 위기를 넘기는 전략이야!',()=>[foeEl(BOSS_SLOT)]);
  {const b=bossUnit();if(b){b.frozen=0;b.moon=0;}renderBattle();}
  await myTurn();

  /* C-5 태양의 돌 */
  setHand([SUN_MON,ST('sun')]);grant(3);
  setTh('태양의 돌','sunrise',5,5);
  await note('에너지가 <b>3</b>인데 이 포켓몬은 코스트 <b>4</b>야. 흐리게 보이지? 출전할 수 없네… 이럴 때 <b>태양의 돌</b>!',()=>[handEl(0),manaEl()]);
  await useCard({idx:1,intro:'<b>태양의 돌</b> · 코스트 <b>0</b> · 이번 턴 <b>에너지 +1</b>을 얻어. 카드를 눌러 사용해 보자!'});
  await wait(500);chk();
  await note('에너지가 <b>4</b>가 됐어! 이제 포켓몬이 선명해졌지?',()=>[manaEl(),handEl(0)]);
  await doSummon(0,'이제 출전할 수 있어! 포켓몬 카드를 눌러 출전시켜 보자.');
  await note('에너지가 모자라면 <b>태양의 돌</b>로 한 칸을 더 만들 수 있어!',()=>[manaEl()]);

  /* C-6 정리 */
  await sweep({strikers:[BOSS_SLOT,ROCK_SLOT]});
  resetRock(3);
  setTh('정리','check');cur.sc=0;
  await note(cp==='stone'?'돌 카드 <b>다섯 종류</b>를 모두 써 봤어!':'돌 카드 <b>다섯 종류</b>를 모두 써 봤어! 다음은 <b>몬스터볼</b>이야.');
  }
  if(cp!=='stone'){

  /* 몬스터볼: 연습용으로 전체 포켓몬에서 뽑아요(도감 등록 없음) */
  me.owned=Object.keys(MON).map(Number);
  await ballScene({ball:'poke',cost:1,n:1,h:'포켓볼',
    intro:'모든 포켓몬을 직접 고르는 것만 정답은 아니야. 때로는 <b>랜덤 포켓몬 카드</b>가 등장해! <b>포켓볼</b>은 코스트 1로 코스트 1~2 포켓몬 중 하나를 불러내. 카드를 눌러 사용해 봐!'});
  await ballScene({ball:'power',cost:2,n:2,h:'파워볼',
    intro:'<b>파워볼</b>은 코스트 2로 코스트 <b>3~4</b> 포켓몬을 불러내. 에너지보다 좋은 포켓몬이 나올 수도 있어! 카드를 눌러 봐.'});
  await ballScene({ball:'master',cost:4,n:3,h:'마스터볼',
    intro:'<b>마스터볼</b>은 코스트 4로 코스트 <b>5~6</b>의 강력한 포켓몬을 불러내. 에너지보다 큰 전설급을 싸게 낼 수 있어! 카드를 눌러 봐.',
    after:'진짜 게임에서는 <b>내가 모은 도감의 포켓몬</b> 중에서 나와. 지금은 연습이라 모든 포켓몬이 나왔어. <b>연습으로 나온 포켓몬은 도감에 등록되지 않아!</b>'});

  /* C-10 정리 */
  await sweep({strikers:[BOSS_SLOT,ROCK_SLOT]});
  }
  try{const ds=S.meta.dexSeen||{};Object.keys(ds).forEach(k=>{if(!dexSnap[k])delete ds[k];});}catch(e){}
  me.owned=[];
  setTh('정리','check');cur.sc=0;
  await note('카드를 써 보는 연습은 여기까지야!');
}

/* ============ 파트 D. 마무리 정리와 최종 보스전 ============ */
const REAL_CSS_ID='tutRealCss';
function realOn(T){                              // 최종전: 연출 피해·정답 처리를 해제하고 실제 규칙으로 진행
  B.tut=null;B.tutReal=1;T.real=1;
  const b=document.getElementById('battle');if(b)b.classList.remove('tutOn','tutSel','tutHeroOnly');
  const bb=document.getElementById('tutBoss');if(bb)bb.style.display='none';
  T.allow=()=>true;T.hi=()=>[];
}
function realOff(T){
  B.tutReal=0;T.real=0;B.tut=T;
  const b=document.getElementById('battle');if(b)b.classList.add('tutOn');
  T.allow=A.none;T.hi=()=>[];
}
function realFix(){                              // 패배 방지 · 응원 문구
  const me=B.me,foe=B.foe;
  if(me.hp<1)me.hp=1;
  if(foe.hp<1&&foe.board.some(Boolean))foe.hp=1;     // 보스 포켓몬이 남아 있으면 본체는 쓰러지지 않아요
  if(me.hp<=3&&!B.cheered){B.cheered=1;try{toast('희망을 가져! 한 번 더 해 보자!');}catch(e){}}
}
function realEndGuard(){                         // 막히는 상황에만 뜨는 짧은 도움말(차례 끝을 한 번 눌러 확인)
  if(!B||B.hintTurn===B.turn)return true;
  const me=B.me;
  const canAtk=me.board.some(u=>u&&u.att>0&&!u.frozen);
  const canPlay=me.hand.some(v=>battleCost(v)<=me.mana&&(isItemCard(v)||me.board.includes(null)));
  if(canAtk){B.hintTurn=B.turn;toast('공격할 수 있는 포켓몬이 있어! <b>초록색 테두리</b>를 눌러 봐.');return false;}
  if(me.mana>0&&canPlay){B.hintTurn=B.turn;toast('에너지가 남아 있어! 낼 수 있는 카드가 있는지 확인해 볼까?');return false;}
  return true;
}
async function finalBattle(T){
  const me=B.me,foe=B.foe;
  /* 보스 두 마리: 튜토리얼용 수치(체력 6 · 공격 3 · 레지락 방어막 +1), 보스 본체 체력 10 */
  const bu=mkUnit(BOSS_ID);bu.hp=bu.max=6;bu.atk=3;bu.fresh=0;foe.board[BOSS_SLOT]=bu;
  const ru=mkUnit(ROCK_ID);ru.hp=ru.max=6;ru.atk=3;ru.shield=1;ru.fresh=0;foe.board[ROCK_SLOT]=ru;
  foe.hp=foe.max=10;foe.mana=0;foe.maxMana=0;foe.hand=[];foe.deck=[];
  me.hp=me.max;me.board.forEach((_,i)=>{me.board[i]=null;});
  /* 내 덱: 체험 포켓몬 18마리 전부. 돌 카드·몬스터볼은 기본 전투와 같은 확률로 등장해요 */
  const mons=[FIRE_ID,WATER_ID].concat(Object.keys(EXP).map(k=>EXP[k]));
  me.deck=shuffle(mons.slice());me.hand=[];
  me.owned=Object.keys(MON).map(Number);me.specials=true;
  me.maxMana=1;me.mana=1;me.bonusMana=0;me.sunMana=0;me.powerUses=2;me.fat=0;
  renderBattle();
  setTh('최종 보스전','sword');cur.sc=0;
  await note('이제 진짜 승부야! 지금까지 배운 <b>특성, 돌 카드, 에너지 운영</b>을 모두 활용해서 <b>레지락</b>과 <b>레지드래고</b>를 쓰러뜨려 봐!<br>보스 포켓몬 두 마리를 쓰러뜨리고 <b>보스 본체</b> 체력을 0으로 만들면 승리야. 에너지는 1부터 시작해서 매 턴 +1이야.',()=>[],'시작!');
  hideSay();
  realOn(T);
  for(let k=0;k<3;k++)_draw(me,true);
  B.side='me';B.turn=1;B.round=1;B.busy=false;B.sel=-1;B.pick=-1;B.over=false;B.cheered=0;B.hintTurn=-1;
  renderBattle();
  banner('최종 보스전!','레지락 · 레지드래고',1500);
  let lastIn=Date.now(),idleShown=0;
  const onIn=()=>{lastIn=Date.now();idleShown=0;};
  document.addEventListener('pointerdown',onIn,true);
  const idle=setInterval(()=>{
    if(!B||!B.tutReal||B.over||B.busy||B.side!=='me')return;
    if(Date.now()-lastIn>15000&&!idleShown){
      idleShown=1;
      const me2=B.me;
      if(me2.hand.some(v=>isBattleSpecial(v)))toast('돌 카드나 몬스터볼도 써 볼 수 있어!');
    }
  },1000);
  let r;
  try{r=await W('realEnd');}finally{clearInterval(idle);document.removeEventListener('pointerdown',onIn,true);}
  /* 승리 연출: 레지락과 레지드래고가 빛이 되어 떠나요 */
  realOff(T);foe.hp=Math.max(0,foe.hp);
  try{closeInfo();}catch(e){}
  B.sel=-1;B.pick=-1;B.busy=true;
  const els=[BOSS_SLOT,ROCK_SLOT].map(sl=>unitEl(foe,sl)).filter(Boolean);
  sfx('win');
  els.forEach(el=>{try{particles(el,'#fff6c8',24);}catch(e){}try{el.animate([{opacity:1,filter:'none',transform:'none'},{opacity:.95,filter:'brightness(3)',transform:'translateY(-10px) scale(1.06)',offset:.4},{opacity:0,filter:'brightness(4)',transform:'translateY(-90px) scale(.55)'}],{duration:1500,easing:'ease-in',fill:'forwards'});}catch(e){}});
  if(els[0])fx(els[0],'다음에 또 만나자!','txt');
  await wait(1700);chk();
  foe.board.forEach((_,i)=>{foe.board[i]=null;});
  B.busy=false;B.over=false;renderBattle();
}
async function partD(){
  const T=cur,me=B.me,foe=B.foe;
  const dexSnap=Object.assign({},(S.meta&&S.meta.dexSeen)||{});
  const M2=EXP.dodge,M4=SUN_MON;
  banner('마무리 정리','에너지와 실전',1500);await wait(1400);chk();
  me.owned=[];resetBoss(true);resetRock(3);
  /* D-1 에너지 운영 */
  setHand([M2,M4]);grant(3);
  await myTurn();
  setTh('에너지 운영','bolt');cur.sc=0;
  T.allow=k=>k.k==='hand'||(k.k==='my'&&k.empty);
  T.hi=()=>B.pick>=0?[document.querySelector('#bInfo .kwbox'),document.getElementById('biPlay'),emptySlotEl()]:[handEl(0),handEl(1),manaEl()];
  say('코스트가 높은 포켓몬은 강력할 수 있지만, <b>에너지가 충분하지 않으면</b> 출전시킬 수 없어. 코스트 <b>2</b> 포켓몬을 지금 낼지, 에너지를 모아 코스트 <b>4</b> 포켓몬을 낼지 생각해 보자!<br>지금은 에너지가 <b>3</b>이라 코스트 2 포켓몬을 낼 수 있어.');
  let r=await W('pick','summon');
  while(r.evt==='pick'){say('<b>내보내기</b>를 눌러 출전시켜 보자!');r=await W('pick','summon');}
  await note('에너지는 <b>턴마다 +1</b>씩 늘어나고 <b>최대 6</b>까지 차올라. 다음 턴이 되면 어떻게 되는지 볼까?',()=>[manaEl()]);
  await endTurnStep();
  await foeTurnBegin('보스의 공격!',true);
  await bossStrike(slotOf(M2),1,'');
  await myTurn();
  setHand([M4]);grant(4);
  setTh('에너지 운영','bolt');cur.sc=0;
  await note('다음 턴이 되자 에너지가 <b>+1</b> 늘어서 <b>4</b>가 됐어! 이제 코스트 4 포켓몬도 낼 수 있어.',()=>[manaEl(),handEl(0)]);
  await doSummon(0,'아껴 두었던 <b>코스트 4</b> 포켓몬을 출전시켜 보자!');
  await note('에너지는 <b>태양의 돌</b>이나 특별한 포켓몬의 효과로 조금 더 얻기도 해. 그리고 트레이너 스킬 <b>공부 기술</b>은 에너지를 쓰지 않아! 버튼을 눌러 문제를 풀면 <b>카드를 한 장 더</b> 뽑을 수 있어. 한 전투에서 쓸 수 있는 횟수는 정해져 있어.',()=>[]);
  await sweep({strikers:[BOSS_SLOT,ROCK_SLOT]});
  /* D-2 정리 팝업 */
  setTh('정리','book');cur.sc=0;
  await note('지금까지 배운 것을 정리해 볼까?<br>① 체력과 공격력만으로 강함을 판단할 수 없어.<br>② 특성에 따라 공격 대상이나 피해량이 달라질 수 있어.<br>③ 출전 순서와 공격 순서가 전략에 영향을 줘.<br>④ 에너지를 모두 쓰기 전에 특성과 카드 효과를 함께 살펴보는 게 좋아.',()=>[]);
  /* D-3 최종 보스전 */
  await finalBattle(T);
  try{const ds=S.meta.dexSeen||{};Object.keys(ds).forEach(k=>{if(!dexSnap[k])delete ds[k];});}catch(e){}
  me.owned=[];
  /* D-4 승리 대사 */
  setTh('승리!','trophy');cur.sc=0;
  await note('훌륭해! 이제 포켓몬을 출전시키고, 특성을 활용하고, 카드와 에너지를 조합하는 방법을 배웠어. 포켓몬마다 강점이 다르다는 사실을 기억해. 강한 포켓몬 한 마리보다 <b>서로의 특성을 잘 활용하는 덱</b>이 더 강할 수도 있어. 이제 네 도감에 등록된 포켓몬을 살펴보고, 첫 번째 덱을 만들어 보자!',()=>[],'보상 받기');
}


/* ============ 파트 E. 트레이너 스킬 체험 (모든 스킬 Lv.5로 체험) ============ */
const TSK_ALL={heal:5,counter:5,attack:5,cheer:5,mana:5,study:5,vit:5,hand:5};
const _tsl=trainerSkillLevels;trainerSkillLevels=function(){if(B&&B.tskDemo)return Object.assign({},TSK_ALL);return _tsl.apply(this,arguments);};
async function waitSkill(k){
  while(!(B.trainerSkillUsed&&B.trainerSkillUsed[k]&&!B.busy&&!B.trainerSkillTarget)){await wait(180);chk();}
  await wait(500);chk();
}
function onlySkill(k){B.trainerSkillUsed={};B.trainerSkillTarget=null;document.body.dataset.tutSk=k;}
function skillDone(){delete document.body.dataset.tutSk;}
async function skillStep(k,intro,allow,hi,hint){
  const T=cur;onlySkill(k);
  T.allow=allow;T.hi=hi;T.hint=()=>hint;
  say(intro);
  await waitSkill(k);
  T.allow=A.none;T.hint=null;T.hi=()=>[];skillDone();hideSay();
}
async function partTS(){
  const T=cur,me=B.me,foe=B.foe,TG=EXP.tough;
  B.tskDemo=1;
  try{
    banner('트레이너 스킬','스킬 체험',1500);await wait(1400);chk();
    placeAllies([]);resetBoss(true);B.foe.board[ROCK_SLOT]=null;renderBattle();
    setHand([]);grant(0);me.hp=me.max;
    T.allow=A.none;T.hi=()=>[];
    setTh('트레이너 스킬','shield');cur.sc=0;
    await note('이제 <b>트레이너 스킬</b>을 배워 볼까? 문제를 풀며 모은 <b>레벨 포인트</b>로 스킬을 배울 수 있어. 스킬은 종류마다 <b>한 전투에 한 번</b>씩 쓸 수 있고, 지금은 체험을 위해 모든 스킬이 <b>최고 레벨(Lv.5)</b>이야!');
    await myTurn();
    /* E-1 체력 회복 */
    me.hp=Math.max(1,me.max-6);renderBattle();
    setTh('체력 회복','heart');cur.sc=0;
    await skillStep('heal','보스에게 맞아서 <b>트레이너 체력</b>이 줄었어! 스킬은 <b>내 트레이너 카드</b>를 눌러서 써. 카드를 눌러 스킬 창을 열고 <b>체력 회복</b>을 써 보자!',k=>k.k==='hero',()=>[heroEl(B.me)],'<b>내 트레이너 카드</b>를 눌러 줘!');
    await note('체력이 <b>스킬 레벨(5)만큼</b> 회복됐어! 높은 레벨일수록 더 많이 회복돼.',()=>[heroEl(B.me)]);
    /* E-2 공격 */
    resetBoss(true);
    setTh('공격','sword');cur.sc=0;
    await skillStep('attack','<b>공격</b> 스킬은 포켓몬 없이도 상대 포켓몬에게 <b>스킬 레벨만큼 직접 피해</b>를 줘. 트레이너 카드를 눌러 <b>공격</b>을 고른 뒤, 보스를 눌러 봐!',k=>k.k==='hero'||(k.k==='foe'&&k.i===BOSS_SLOT),()=>B.trainerSkillTarget?[foeEl(BOSS_SLOT)]:[heroEl(B.me)],'<b>트레이너 카드 → 공격 → 보스</b> 순서로 눌러 줘!');
    await note('보스가 <b>피해 5</b>를 받았어! 마무리 한 방이 필요할 때 아주 좋아.',()=>[foeEl(BOSS_SLOT)]);
    resetBoss(true);
    /* E-3 응원 */
    placeAllies([TG]);
    setTh('응원','star');cur.sc=0;
    const ally=()=>B.me.board.findIndex(u=>u);
    await skillStep('cheer','<b>응원</b>은 아군 포켓몬의 <b>공격력을 영구적으로</b> 올리고 <b>방어막</b>도 줘. 트레이너 카드를 눌러 <b>응원</b>을 고르고, 내 포켓몬을 눌러 봐!',k=>k.k==='hero'||(k.k==='my'&&!k.empty),()=>B.trainerSkillTarget?[unitEl(B.me,ally())]:[heroEl(B.me)],'<b>트레이너 카드 → 응원 → 내 포켓몬</b> 순서로 눌러 줘!');
    await note('공격력이 <b>영구적으로 +3</b> 오르고 <b>방어막 3개</b>를 얻었어! 방어막은 받는 피해를 줄이고 남은 피해를 먼저 흡수해.',()=>[unitEl(B.me,ally())]);
    /* E-4 반격 */
    resetBoss(true);
    setTh('반격','shield');cur.sc=0;
    await skillStep('counter','<b>반격</b>은 이번 상대 차례에 <b>내 트레이너를 공격한 포켓몬</b>에게 되돌려 줘. 트레이너 카드를 눌러 <b>반격</b>을 준비해 보자!',k=>k.k==='hero',()=>[heroEl(B.me)],'<b>내 트레이너 카드</b>를 눌러 줘!');
    await endTurnStep('반격을 준비했어! <b>차례 끝</b>을 눌러 보스가 공격하게 해 보자.');
    await foeTurnBegin('트레이너를 노린다!',true);
    await skillMove(foe,BOSS_SLOT,heroEl(me),true,false);chk();
    heroBlockFx(heroEl(me));fx(heroEl(me),'막았다!','txt');await wait(500);chk();
    await trainerAtkFx(heroEl(me),unitEl(foe,BOSS_SLOT),Math.min(5,B.counterActive||5),'counter');chk();
    await dealUnit(foe,BOSS_SLOT,5,undefined,undefined,true);B.counterActive=0;renderBattle();await wait(600);chk();
    B.side='me';B.busy=false;renderBattle();
    await note('보스가 트레이너를 공격했지만 <b>반격</b>이 들어갔어! 반격은 방어 문제를 맞혀야 피해가 들어가니, 침착하게 풀어 보자.',()=>[foeEl(BOSS_SLOT)]);
    /* E-5 패시브 */
    setTh('패시브 스킬','book');cur.sc=0;
    await note('스킬 중에는 배워 두기만 하면 <b>자동으로 적용</b>되는 <b>패시브</b>도 있어.<br>🔮 <b>마나 연구</b>: 턴마다 마나를 더 얻을 수 있어<br>📚 <b>공부 강화</b>: 공부 기술을 쓰고, 맞히면 카드를 더 뽑아<br>🃏 <b>카드 보유량</b>: 손에 들 수 있는 카드가 늘어나<br>❤️‍🔥 <b>체력 증강</b>: 트레이너 최대 체력이 늘어나');
    await note('스킬은 <b>홈 화면 아래쪽 「트레이너 스킬」</b>에서 레벨 포인트로 배우고 키워. 지금 체험한 건 연습용이라 <b>내 스킬 레벨은 그대로</b>야!',()=>[]);
  }finally{
    skillDone();B.tskDemo=0;B.trainerSkillUsed={};B.trainerSkillTarget=null;B.counterActive=0;
    try{const m2=B.me;m2.board.forEach((_,i)=>{m2.board[i]=null;});m2.hand=[];m2.hp=m2.max;B.foe.hp=B.foe.max;resetBoss(true);}catch(e){}
  }
}

/* ---------- 진행 · 마무리 ---------- */
function prepResume(T,k){                       // 앞 파트를 건너뛰고 이어 할 때: 파트 A가 끝난 모습으로 무대를 맞춰요
  const f=document.getElementById('tutFade');if(f)f.classList.add('out');
  B.side='me';B.turn=1;B.round=1;B.busy=false;
  const b=mkUnit(BOSS_ID);b.fresh=0;B.foe.board[BOSS_SLOT]=b;
  setProg(k>=2?TOTAL:2);renderBattle();
}
const parts=[partA,partB,partC,partTS,partD];

async function run(T){
  try{
    const from=T.from||0;
    if(T.only){
      prepResume(T,2);
      const SEC={trait:[partB],stone:[partC],ball:[partC],skill:[partTS]};
      if(T.only==='stone'||T.only==='ball')T.cpart=T.only;
      for(const f of SEC[T.only]||[]){await f();chk();}
      await finish(T);return;
    }
    if(from>0)prepResume(T,from);
    for(let i=from;i<parts.length;i++){await parts[i]();chk();if(!T.replay){const m=S.meta;m.tutDone=i+1;autoSave();}}
    await finish(T);
  }catch(e){
    if(e!==ABORT)console.warn('tutorial',e);
  }finally{
    exit(T);
  }
}
async function finish(T){
  hideSay();T.hi=()=>[];T.allow=A.none;
  if(T.only){
    await new Promise(res=>{M('<div style="text-align:center"><h2 style="font-size:24px">연습 끝!</h2><p style="margin:6px 0 10px;line-height:1.6">선택한 튜토리얼을 마쳤어요.<br><span style="font-size:14px">다시 하기라 보상은 없어요.</span></p><div class=mbtns><button class="btn gold" data-a=ok>확인</button></div></div>',{ok:()=>{closeM();res();},_close:()=>{closeM();res();}});});
    return;
  }
  S.meta.seen=S.meta.seen||{};
  const ids=[FIRE_ID,WATER_ID].concat(Object.keys(EXP).map(k=>EXP[k]));
  const had={};ids.forEach(id=>{had[id]=!!(S.meta.col&&S.meta.col[id]);});
  if(!T.replay){
    S.meta.seen.tutA=1;delete S.meta.seen.tutSkip;S.meta.tutDone=0;
    try{ids.forEach(id=>{if(!S.meta.col[id])addCard(id,1);else S.meta.dexSeen[id]=1;});}catch(e){console.warn('tutorial dex',e);}
  }
  autoSave();
  const cells=ids.map((id,i)=>'<div class="tutRw'+(T.replay||had[id]?' had':'')+'" style="animation-delay:'+(i*0.11).toFixed(2)+'s">'+monImg(id,'front')+'<small>'+(T.replay?'연습':had[id]?'이미 있어요':'NEW!')+'</small></div>').join('');
  T.goDeck=!T.replay;
  await new Promise(res=>{
    M('<div style="text-align:center"><h2 style="font-size:26px">튜토리얼 끝!</h2><p style="margin:2px 0 6px;font-weight:700;color:#c2410c">'+(T.replay?'다시 하기라 보상은 없어요':'도감에 영구 등록!')+'</p><div class="tutDexGrid tutRwGrid">'+cells+'</div><p style="margin:8px 0;line-height:1.6;font-size:14px">체험 포켓몬 18마리 · 레지락과 레지드래고는 도감에 등록되지 않아요.<br>다음에 또 만나자!</p><div class=mbtns><button class="btn gold big" data-a=ok>'+(T.replay?'확인':'도감과 덱 구성으로 가기')+'</button></div></div>',{ok:()=>{closeM();res();},_close:()=>{}});
    sfx('win');try{confetti(60);}catch(e){}
  });
}
function exit(T){
  if(!T||T.done)return;
  T.done=true;
  clearInterval(poll);poll=0;
  try{closeInfo();}catch(e){}
  const q=document.getElementById('bq');if(q){q.classList.remove('on');q.innerHTML='';}
  removeUi();
  const b=document.getElementById('battle');if(b){b.classList.remove('on','tutOn');b.innerHTML='';}
  if(cur===T)cur=null;
  B=null;
  try{startBgm('adventure');}catch(e){}
  if(T.back==='title'||!S.meta.name)renderTitle();else renderHub();
  if(T.goDeck&&S.meta.name){try{renderDeck();}catch(e){}}
}
function abort(){
  const T=cur;if(!T||T.done)return;
  T.abort=true;
  if(T.w){const r=T.w.res;T.w=null;r({evt:'abort'});}
  if(T.sayRes){const r=T.sayRes;T.sayRes=null;r();}
  setTimeout(()=>{if(cur===T&&!T.done)exit(T);},1800);
}
function tutMenu(){
  M('<h2>튜토리얼</h2><p style="font-size:15px;line-height:1.6">지금은 처음 배우는 전투 연습 중이에요. 건너뛰어도 <b>설정 → 튜토리얼</b>에서 끝낸 파트 다음부터 이어서 할 수 있어요.</p><div class=mbtns><button class="btn gold" data-a=x>계속하기</button><button class="btn ghost" data-a=skip>튜토리얼 건너뛰기</button></div>',{
    x:()=>closeM(),_close:()=>closeM(),
    skip:()=>{tutSkipAsk();}
  });
}
async function tutSkipAsk(){
  if(!cur||cur.done||cur.skipAsk)return;cur.skipAsk=1;
  let ok=false;try{ok=await confirmBox((cur&&cur.replay)?'연습을 그만하고 나갈까요?<br><span style="font-size:14px">다시 하기라 보상은 없어요.</span>':'튜토리얼을 완료하면 <b>특성별 포켓몬 18마리</b>를 획득할 수 있습니다.<br>정말로 건너뛰시겠습니까?<br><span style="font-size:14px">건너뛰어도 <b>설정</b>에서 언제든 튜토리얼을 다시 할 수 있어요.</span>','건너뛰기','계속하기');}finally{if(cur)cur.skipAsk=0;}
  if(!ok)return;
  try{closeM();}catch(e){}
  if(cur&&!cur.replay){const m=S.meta;m.seen=m.seen||{};m.seen.tutA=1;m.seen.tutSkip=1;autoSave();}   // 어디까지 끝냈는지는 tutDone에 남아 있어요
  abort();
}

/* ---------- 시작 ---------- */
function begin(o={}){
  if(cur&&!cur.done)return;
  try{closeM();closeM(1);}catch(e){}
  const pk=document.getElementById('pack');if(pk)pk.classList.remove('on');
  const meta=S.meta;let pid=25;try{pid=partnerId()||25;}catch(e){}
  const me=mkPlayer(meta.name||'나',[],heroHpMax(),pid,true,[],false);
  const foe=mkPlayer('보스',[],20,BOSS_ID,true,[],false);
  const T={w:null,lock:false,allow:A.none,hi:()=>[],q1done:false,done:false,abort:false,replay:!!o.replay,from:o.from||0,only:o.only||'',back:S.screen==='title'?'title':'hub'};
  cur=T;
  B={gi:-1,g:{n:'튜토리얼',ldr:'보스',types:[14],c:'#e9e2ff'},diff:1,turn:0,round:0,side:'me',me,foe,sel:-1,pick:-1,busy:false,combo:0,qn:0,qc:0,defUsed:false,over:false,tut:T};
  S.screen='battle';
  document.getElementById('view').innerHTML='';
  const bt=document.getElementById('battle');bt.classList.add('on','tutOn');
  try{startBgm('battle');}catch(e){}
  ui();installGuard();
  clearInterval(poll);poll=setInterval(()=>{if(cur&&!cur.done)updateFrames();},70);
  run(T);
}
function afterStarter(){
  const m=S.meta;m.seen=m.seen||{};m.seen.tutNew=1;autoSave();
  if(!m.seen.tutA)return begin();
  renderHub();
}

/* ---------- 엔진 연결(튜토리얼일 때만 동작이 달라져요) ---------- */
const _typeMul=typeMul;typeMul=function(){return(B&&B.tut)?1:_typeMul.apply(this,arguments);};   // 튜토리얼 피해에는 타입 상성 제외
const _draw=draw;draw=function(){if(B&&B.tut)return;return _draw.apply(this,arguments);};
const _checkEnd=checkEnd;checkEnd=function(){if(B&&B.tutReal)realFix();if(B&&B.tut)return false;return _checkEnd.apply(this,arguments);};
const _endBattle=endBattle;endBattle=function(w){if(B&&B.tutReal){fire('realEnd',{win:!!w});return;}return _endBattle.apply(this,arguments);};
const _endTurn=endTurn;endTurn=function(){if(B&&B.tutReal&&!realEndGuard())return;if(B&&B.tut){fire('end');return;}return _endTurn.apply(this,arguments);};
const _playerAttack=playerAttack;playerAttack=function(si,tg){if(B&&B.tut)return tutAttack(si,tg).catch(e=>{if(e!==ABORT)console.warn('tutorial attack',e);});return _playerAttack.apply(this,arguments);};
const _battleMenu=battleMenu;battleMenu=function(){if(B&&(B.tut||B.tutReal)){tutMenu();return;}return _battleMenu.apply(this,arguments);};
const _summon=summon;
summon=async function(P,hi,slot){
  if(!(B&&B.tut&&P===B.me))return _summon.apply(this,arguments);
  const T=cur;if(T.lock)return;
  T.lock=true;T.hi=()=>[];hideSay();
  try{
    await _summon.apply(this,arguments);
    const su=B.me.board[slot];
    if(su&&hk(su,'draw')&&T.deckTop&&T.deckTop.length){const nid=T.deckTop.shift();B.me.hand.push(nid);renderBattle();try{await drawFlyFx(unitEl(B.me,slot),1);}catch(e){}try{hlNewCards(1);}catch(e){}}
  }finally{T.lock=false;}
  fire('summon',{slot});
};
const _showInfo=showInfo;
showInfo=function(id,o){const r=_showInfo.apply(this,arguments);if(B&&B.tut){if(o&&o.hand!=null&&o.can)fire('pick');if(o&&o.unit&&!o.foe)fire('unitInfo');afterRender();}return r;};
const _showItemInfo=showItemInfo;
showItemInfo=function(v,o){const r=_showItemInfo.apply(this,arguments);if(B&&B.tut){if(o&&o.hand!=null&&o.can)fire('pick');afterRender();}return r;};
const _useItemCard=useItemCard;
useItemCard=function(i){const r=_useItemCard.apply(this,arguments);if(B&&B.tut&&(B.itemTargetMode||B.moonTargetMode))fire('itemMode');return r;};
const _playItem=playItem;
playItem=async function(P,hi,target,remote){
  if(!(B&&B.tut&&P===B.me))return _playItem.apply(this,arguments);
  const T=cur;if(T.lock)return false;
  const card=P.hand[hi];T.lock=true;T.hi=()=>[];hideSay();
  let r=false;
  try{r=await _playItem.apply(this,arguments);}finally{T.lock=false;}
  if(r)fire('item',{item:card&&card.item});
  return r;
};
const _renderBattle=renderBattle;
function afterRender(){
  const T=cur;if(!T||T.done||!B||!B.tut)return;
  const bt=document.getElementById('battle');if(bt&&!bt.classList.contains('tutOn'))bt.classList.add('tutOn');
  installGuard();updateFrames();
  if(bt){bt.classList.toggle('tutSel',B.sel>=0);bt.classList.toggle('tutHeroOnly',!!T.heroOnly);}
  if(B.sel>=0)fire('select');
}
renderBattle=function(){const r=_renderBattle.apply(this,arguments);try{afterRender();}catch(e){console.warn('tutorial render',e);}return r;};
const _goStart=goStart;
goStart=function(){
  try{
    const m=S.meta;
    if(codeValid()&&m.name&&m.starter&&m.seen&&m.seen.tutNew&&!m.seen.tutA){   // 튜토리얼 도중에 나갔다면 이어서 시작
      const pk=document.getElementById('pack');if(pk)pk.classList.remove('on');
      B=null;return begin({from:m.tutDone||0});
    }
  }catch(e){}
  return _goStart.apply(this,arguments);
};

window.TUT_A={begin,afterStarter,abort,parts,get state(){return cur;},
  /* 파트를 더 만들 때 쓰는 도우미들 */
  api:{say,hideSay,W,fire,grant,setHand,resetBoss,newMyTurn,foeTurnBegin,returnToCard,setProg,A,bossUnit,handEl,endEl,manaEl,emptySlotEl,chk}};
})();


// 스토리·끝없는 모험 화면에도 설정 버튼 표시
(function(){function add(){try{const v=document.getElementById('view');if(!v)return;const pg=v.querySelector('.sc-page');if(!pg||pg.querySelector('.scSetBtn'))return;
 const b=document.createElement('button');b.className='btn ghost sm scSetBtn';b.innerHTML=I('gear')+'<span class=bt> 설정</span>';b.onclick=()=>{sfx('tap');showSettings();};
 const bar=pg.querySelector('.scv-bar');if(bar)bar.appendChild(b);else{b.classList.add('scSetFloat');pg.appendChild(b);}}catch(e){}}
 try{new MutationObserver(add).observe(document.body,{childList:true,subtree:true});}catch(e){}})();

// 모든 화면(전투·타이틀·홈 제외) 왼쪽 위에 홈으로 바로 가는 포켓볼 버튼
(function(){
 const SKIP={hub:1,title:1,gate:1,name:1,starter:1,battle:1,scenarioBattle:1,scenarioRLBattle:1,train:1,result:1};
 function goHome(){try{sfx('tap');}catch(e){}
  try{closeM();}catch(e){}
  try{if(window.GF&&GF.destroy)GF.destroy();}catch(e){}
  try{SC.busy=false;scStopMusic();}catch(e){}
  try{document.querySelectorAll('body>.scv-fxlay,body>.dr-L').forEach(e=>e.remove());}catch(e){}
  renderHub();try{startBgm();}catch(e){}}
 function ensure(){try{
  const v=document.getElementById('view');if(!v)return;
  const bt=document.getElementById('battle');
  if(SKIP[S.screen]||(bt&&bt.classList.contains('on')))return;
  if(v.querySelector('.scHomeBtn')||v.querySelector('#hHome')||v.querySelector(':scope>.title'))return;
  const b=document.createElement('button');b.type='button';b.className='btn ghost sm scHomeBtn';b.title='홈으로';b.setAttribute('aria-label','홈으로');b.innerHTML=I('home');b.onclick=goHome;
  const pg=v.querySelector('.sc-page');
  if(pg){const bar=pg.querySelector('.scv-bar');if(bar)bar.insertBefore(b,bar.firstChild);else{b.classList.add('scHomeFloat');pg.appendChild(b);}return;}
  if(v.querySelector('.hud'))return;
  b.classList.add('scHomeFloat');v.appendChild(b);
 }catch(e){}}
 try{const v=document.getElementById('view');new MutationObserver(()=>setTimeout(ensure,0)).observe(v,{childList:true});}catch(e){}
 try{ensure();}catch(e){}
})();

// 전체 화면 버튼: 허브·전투 말고도 스토리·끝없는 모험·정원 등 모든 일반 화면에 있어요 (이미 있으면 안 만들어요)
(function(){
 const SKIP2={battle:1,scenarioBattle:1,scenarioRLBattle:1,pvp:1,bosscoop:1};
 function mk(cls){const b=document.createElement('button');b.type='button';b.className=cls;b.title='전체 화면';b.setAttribute('aria-label','전체 화면');b.innerHTML=I('full','fsO')+I('fullx','fsX');return b;}
 function ensureFs(){try{
  const v=document.getElementById('view');if(!v)return;
  const bt=document.getElementById('battle');
  if(SKIP2[S.screen]||(bt&&bt.classList.contains('on')))return;
  // 문제 풀이 화면(훈련·야생 포획 등): 오른쪽 위 '정답 n' 바로 아래에 둬요
  const qt=v.querySelector('.qTop');
  if(qt){const fl=v.querySelector(':scope>.scFsFloat');if(fl)fl.remove();if(!qt.querySelector('.fsBtn'))qt.appendChild(mk('btn ghost sm fsBtn gfFsBtn qtFs'));return;}
  if(v.querySelector('.fsBtn')||v.querySelector('.hud'))return;
  const pg=v.querySelector('.sc-page'),bar=pg&&pg.querySelector('.scv-bar');
  if(bar){const b=mk('btn ghost sm fsBtn gfFsBtn');const g=bar.querySelector('.scSetBtn');if(g)bar.insertBefore(b,g);else bar.appendChild(b);return;}
  v.appendChild(mk('btn ghost sm fsBtn gfFsBtn scFsFloat'));
 }catch(e){}}
 try{const st=document.createElement('style');st.textContent='.scFsFloat{position:fixed;top:calc(var(--vt,0px) + 8px);right:8px;z-index:80}.qTop{position:relative;margin-bottom:38px}.qTop .qtFs{position:absolute;right:0;top:100%;margin-top:6px;z-index:5}';document.head.appendChild(st);}catch(e){}
 try{const v=document.getElementById('view');new MutationObserver(()=>setTimeout(ensureFs,0)).observe(v,{childList:true});}catch(e){}
 document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('.gfFsBtn');if(!b)return;e.stopPropagation();e.preventDefault();try{sfx('tap');}catch(er){}try{b.blur();}catch(er){}goFull();},true);
 try{ensureFs();}catch(e){}
})();

// 끝없는 모험 전투 중 '저장하고 나가기': 모험은 그대로 저장하고, 이 전투는 다음에 처음부터 다시 시작해요
function rlSaveQuit(){
 try{closeM();}catch(e){}
 try{if(B)B.over=true;}catch(e){}
 try{const q=$('#bq');if(q){q.classList.remove('on');q.innerHTML='';}}catch(e){}
 try{closeInfo();}catch(e){}
 B=null;
 try{const bt=$('#battle');bt.classList.remove('on','autoOn');bt.innerHTML='';}catch(e){}
 try{rlSave();}catch(e){}try{autoSave();}catch(e){}
 try{if(window.GF&&GF.destroy)GF.destroy();}catch(e){}
 renderHub();try{startBgm();}catch(e){}
 try{toast('모험을 저장했어요! 홈의 끝없는 모험에서 이어할 수 있어요');}catch(e){}}

// ===== 포켓몬 정원 · 알 부화기 =====
// 에너지 (개념을 3번 연속 맞히면 1개). 알에게 100번 먹이면 그 속성의 전설 포켓몬이 태어나요.
const GD_MAX=5,GD_NEED=100,GD_EGG_COST=1000,GD_BOND=100;
function gd(m){if(!m.garden||typeof m.garden!=='object')m.garden={pets:[],egg:null,spent:0,born:0};const g=m.garden;if(!Array.isArray(g.pets))g.pets=[];g.spent=g.spent||0;g.born=g.born||0;return g;}
function gdEnergy(m){return Math.max(0,stoneList(m).length-gd(m).spent);}

// ---- 정원 에너지 알약을 누르면: 지금 수량 + 얻는 방법 + 쓰는 곳 설명 ----
function showEnergyInfo(){
 const m=S.meta;let en=0;try{en=gdEnergy(m);}catch(e){}
 let sum='';try{sum=subjSummaryHTML(m);}catch(e){}
 const found=Math.min(30,(m.stats&&m.stats.foundDone)||0);
 M(`<h2>⚡ 정원 에너지</h2>
  <p style="text-align:center;font-size:18px;margin:4px 0 10px">지금 <b>${en}개</b> 가지고 있어요</p>
  <div class=explain style="font-size:14px;line-height:1.65">
   <b>⚡ 이렇게 얻어요</b><br>
   · <b>수학·영어·국어·IQ</b> 문제에서 같은 개념(유형)을 <b>3번 연속</b> 맞히면 ⭐ 별 1개가 생기고, 별 1개 = 에너지 1개가 돼요. (유형마다 별은 최대 5개)<br>
   · 틀리면 연속 기록이 0으로 돌아가요. 다시 3번 연속 맞혀 보세요!<br>
   · 기초 쌓기(구멍 메우기)를 끝내면 에너지 1개를 더 받아요. (지금까지 ${found}개 · 최대 30개)
  </div>
  <div class=explain style="font-size:14px;line-height:1.65;margin-top:8px">
   <b>🥚 이렇게 써요</b><br>
   · 포켓몬 정원의 알에게 먹이면 돼요. 100번 먹이면 그 속성의 <b>전설 포켓몬</b>이 태어나요!<br>
   · 먹인 에너지는 사라져요. 남은 수량이 지금 쓸 수 있는 에너지예요.
  </div>
  <h3 style="margin:12px 0 4px;font-size:15px">⚡ 과목별 에너지</h3>${sum}
  <div class=mbtns><button class="btn gold" data-a=x>알겠어요</button></div>`,{x:()=>closeM(),_close:()=>closeM()});}
(function(){
 const hit=e=>{const t=e.target&&e.target.closest?e.target.closest('.hud .pill[title^="정원 에너지"]'):null;if(!t)return;e.preventDefault();e.stopPropagation();try{sfx('tap');}catch(_){}showEnergyInfo();};
 document.addEventListener('click',hit,true);
 document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target&&e.target.matches&&e.target.matches('.hud .pill[title^="정원 에너지"]'))hit(e);},true);
})();
function gdPets(m){const g=gd(m);return g.pets.filter((id,i,a)=>m.col&&m.col[id]&&bondOf(id)>=GD_BOND&&a.indexOf(id)===i).slice(0,GD_MAX);}
function gdShade(hex,k){const n=parseInt(hex.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;const f=k<0?0:255,t=Math.abs(k);r=Math.round(r+(f-r)*t);g=Math.round(g+(f-g)*t);b=Math.round(b+(f-b)*t);return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);}
function gdEggSVG(t,fed,empty){const c=empty?'#c9c4b8':TYPE_COL[t],hi=gdShade(c,.55),lo=gdShade(c,-.35),dk=gdShade(c,-.6),cr=fed>=75?3:fed>=50?2:fed>=25?1:0,id='ge'+(empty?'x':t);
 const E='M40 4C20 4 7 42 7 65c0 20 15 31 33 31s33-11 33-31C73 42 60 4 40 4z';
 const star=(x,y,r,o)=>`<path d="M${x} ${y-r}L${x+r*.28} ${y-r*.28} ${x+r} ${y} ${x+r*.28} ${y+r*.28} ${x} ${y+r} ${x-r*.28} ${y+r*.28} ${x-r} ${y} ${x-r*.28} ${y-r*.28}z" fill="#fff" opacity="${o}"/>`;
 return `<svg class="gdEgg${empty?' empty':''}" viewBox="0 0 80 100" style="--gl:${c}"><defs>
  <radialGradient id="${id}b" cx="36%" cy="28%" r="85%"><stop offset="0" stop-color="${hi}"/><stop offset=".45" stop-color="${c}"/><stop offset="1" stop-color="${lo}"/></radialGradient>
  <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8872b"/><stop offset=".3" stop-color="#fff0a8"/><stop offset=".55" stop-color="#e2b441"/><stop offset="1" stop-color="#9a6a1c"/></linearGradient>
  <clipPath id="${id}c"><path d="${E}"/></clipPath></defs>
  <path d="${E}" fill="url(#${id}b)"/>
  <g clip-path="url(#${id}c)">
   <path d="M0 52Q40 64 80 52V60Q40 72 0 60Z" fill="url(#${id}g)"/>
   <path d="M0 55Q40 67 80 55" stroke="${dk}" stroke-width=".6" fill="none" opacity=".5" stroke-dasharray="2 2.5"/>
   ${[14,27,40,53,66].map((x,i)=>{const y=60.5+Math.sin((x/80)*Math.PI)*3.4-1;return `<path d="M${x} ${y-3.2}l2.6 3.2-2.6 3.2-2.6-3.2z" fill="${dk}" opacity=".55"/><path d="M${x} ${y-2}l1.5 2-1.5 2-1.5-2z" fill="#fff6c8"/>`;}).join('')}
   <path d="M0 30Q40 40 80 30" stroke="url(#${id}g)" stroke-width="1.6" fill="none" opacity=".9"/>
   <path d="M0 82Q40 92 80 82" stroke="url(#${id}g)" stroke-width="1.6" fill="none" opacity=".9"/>
   <ellipse cx="28" cy="26" rx="9" ry="17" fill="#fff" opacity=".32" transform="rotate(24 28 26)"/>
   <ellipse cx="22" cy="44" rx="2.6" ry="5.5" fill="#fff" opacity=".28" transform="rotate(20 22 44)"/>
  </g>
  ${empty?'':star(52,22,5,.9)+star(60,78,3.2,.75)+star(19,74,2.6,.7)}
  ${cr>=1?`<path d="M42 8l-5 9 7 5-6 8 5 6" stroke="${dk}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`:''}${cr>=2?`<path d="M14 50l8-5 3 8 7-4 4 7" stroke="${dk}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`:''}${cr>=3?`<path d="M66 48l-9 3 3 9-8 3-2 8M52 26l9 5-4 7" stroke="${dk}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`:''}
  <path d="${E}" fill="none" stroke="${dk}" stroke-width="2.6"/><path d="${E}" fill="none" stroke="url(#${id}g)" stroke-width=".9" transform="translate(40 52) scale(.96) translate(-40 -52)" opacity=".7"/></svg>`;}
function gdFly(id){try{return !!(MON[id]&&MON[id].types&&MON[id].types.includes(9));}catch(e){return false;}}
// 정원 포켓몬 위치는 한 번 정하면 저장해 두고 그대로 써요 (에너지를 줘서 화면이 다시 그려져도 안 바뀌어요)
function gdFixedPos(m,id){const g=gd(m);g.pos=g.pos&&typeof g.pos==='object'?g.pos:{};const q=g.pos[id],fly=gdFly(id);
 if(q&&!!q.fly===fly&&isFinite(q.x)&&isFinite(q.y)&&(fly?(q.y<=47||(q.hy&&q.y<=97)):q.y>=56))return q;
 const others=gdPets(m).filter(o=>o!==id).map(o=>g.pos[o]).filter(o=>o&&isFinite(o.x)&&isFinite(o.y));let P=gdPos(id,0);
 if(others.length){let best=-1;for(let n=0;n<14;n++){const C=gdPos(id,n),d=Math.min(...others.map(o=>Math.hypot((C.x-o.x)*4,(C.y-o.y)*2.67)));if(d>best){best=d;P=C;}}} // 다른 포켓몬과 덜 겹치는 자리를 골라요
 g.pos[id]={x:+P.x.toFixed(1),y:+P.y.toFixed(1),fly:P.fly?1:0};setTimeout(()=>{try{autoSave();}catch(e){}},0);return g.pos[id];}
function gdRng(id,n){let a=(Math.imul((id|0)+1,2654435761)^Math.imul((n|0)+7,40503))>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
// 위치는 무작위가 아니라 포켓몬 번호로 정해져요 → 새로고침하거나 화면이 다시 그려져도 항상 같은 자리예요 (정원 크기에도 영향받지 않아요)
function gdPos(id,n){const H=267,k=1,sp=gdSize(id)*k/H*100,R=gdRng(id,n||0);
 // 비행 포켓몬: 몸 전체가 정원 절반 위쪽 / 걷는 포켓몬: 발은 물론 몸도 대부분 정원 절반 아래쪽 (y = 발 위치 %)
 if(gdFly(id)){const lo=Math.min(46,Math.max(14,Math.ceil(sp)+3));return {x:8+R()*84,y:lo+R()*Math.max(0,47-lo),fly:1};}
 const lo=Math.min(92,Math.max(56,Math.ceil(50+sp*.85)));return {x:8+R()*84,y:lo+R()*Math.max(0,97-lo),fly:0};}
function gdSize(id){const h=(MON[id]&&+MON[id].ht)||1;return Math.round(Math.max(48,Math.min(124,38+30*Math.sqrt(h))));}
const GD_WALK=3.6; // 한 번 걷는 시간(초) — CSS transition 시간과 같아요
// 걷는 도중이면 지금 어디쯤인지 계산해요 (화면이 다시 그려져도 순간이동하지 않고 이어서 걸어가요)
function gdSettle(P){if(P.t0&&Date.now()-P.t0>=GD_WALK*1000){P.x=P.tx;P.y=P.ty;delete P.t0;delete P.tx;delete P.ty;}return P;}
function gdCur(P){gdSettle(P);if(!P.t0)return{x:P.x,y:P.y,walk:0};const r=Math.min(1,(Date.now()-P.t0)/(GD_WALK*1000));return{x:P.x+(P.tx-P.x)*r,y:P.y+(P.ty-P.y)*r,walk:1,rem:Math.max(.2,GD_WALK*(1-r)),tx:P.tx,ty:P.ty};}
function gdZone(id){const sp=gdSize(id)/267*100;if(gdFly(id)){const lo=Math.min(46,Math.max(14,Math.ceil(sp)+3));return{y0:lo,y1:47};}const lo=Math.min(92,Math.max(56,Math.ceil(50+sp*.85)));return{y0:lo,y1:97};}
let _gdSv=0;function gdSaveSoon(force){const n=Date.now();if(force){_gdSv=n;try{saveLocal();}catch(e){}return;}if(n-_gdSv>15000){_gdSv=n;try{autoSave();}catch(e){}}}
// 알 부화기를 도트(픽셀) 그림으로 그려요 (120×140 칸 · 알 그림과 같은 좌표라 크게 확대해도 또렷해요). 알은 그대로 벡터예요.
const _gdPxC={};
function gdPxInc(c,lit,e){const key=c+'|'+lit+'|'+(e?1:0);if(_gdPxC[key])return _gdPxC[key];
 const W=120,H=140,BY=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]],cl=v=>v<0?0:v>.999?.999:v;
 const hi=gdShade(c,.6),lo=gdShade(c,-.35),dk=gdShade(c,-.6),DK='#0e1020',GOLD='#d9a935',GL='#ffe9a0',GD='#8a5f14';
 const ramp=(cols,t,i,j)=>{const f=cl(t)*(cols.length-1),k=Math.floor(f);return (f-k)>(BY[j&3][i&3]+.5)/16?cols[k+1]:cols[k];};
 const run=(draw)=>{const cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
  const px=(a,b,col,al)=>{if(a<0||b<0||a>=W||b>=H)return;x.globalAlpha=al==null?1:al;x.fillStyle=col;x.fillRect(a,b,1,1);x.globalAlpha=1;};
  const rect=(a,b,w,h,col,al)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)px(a+i,b+j,col,al);};
  const shape=(inside,fillFn,line,post)=>{const g=[];for(let j=0;j<H;j++){g[j]=[];for(let i=0;i<W;i++)g[j][i]=inside(i+.5,j+.5)?1:0;}
   const ins=(i,j)=>i>=0&&j>=0&&i<W&&j<H&&g[j][i];
   for(let j=0;j<H;j++)for(let i=0;i<W;i++){if(!g[j][i])continue;const edge=!ins(i-1,j)||!ins(i+1,j)||!ins(i,j-1)||!ins(i,j+1);px(i,j,edge&&line?(typeof line==='function'?line(i,j):line):fillFn(i,j));if(post)post(i,j,edge,ins);}};
  draw(px,rect,shape);return cv.toDataURL();};
 const ell=(cx,cy,rx,ry)=>(a,b)=>((a-cx)/rx)**2+((b-cy)/ry)**2<=1;
 const arch=(a,b)=>b<46?(((a-60)/38)**2+((b-46)/30)**2<=1):(a>=22&&a<=98&&b<=112);
 // 받침 몸통: 위는 살짝 부푼 곡선, 아래는 둥글게
 const bodyTop=a=>{const t=(a-8)/104;return 117-28*t*(1-t);},bodyBot=a=>{const t=(a-14)/92;return 131+26*t*(1-t);};
 const body=(a,b)=>{if(a<8||a>112||b<bodyTop(a))return false;if(a<14)return b<=117+(a-8)*14/6&&b<=131;if(a>106)return b<=117+(112-a)*14/6;return b<=bodyBot(a);};
 const goldLn=(i,j)=>i<52?GL:i<80?GOLD:GD;
 const back=run((px,rect,shape)=>{
  // 유리관 안쪽에 번지는 속성 빛 (도트 디더링)
  for(let j=17;j<113;j++)for(let i=23;i<98;i++){if(!arch(i+.5,j+.5))continue;const d=Math.hypot((i-60)/40,(j-104)/62),bb=Math.pow(Math.max(0,1-d),1.25),q=bb*(e?5.2:1.4),lv=Math.floor(q)+((q-Math.floor(q))>(BY[j&3][i&3]+.5)/16?1:0);if(lv>0)px(i,j,c,Math.min(.6,lv*.11));}
  // 가운데로 솟는 빛기둥
  if(e)for(let j=52;j<112;j++){const hw=lerp2(6,18,(j-52)/60);for(let i=Math.round(60-hw);i<=Math.round(60+hw);i++){const edge=Math.abs(i-60)/hw,q=(1-edge)*(.7+(j-52)/80)*2.2,lv=Math.floor(q)+((q-Math.floor(q))>(BY[j&3][i&3]+.5)/16?1:0);if(lv>0)px(i,j,hi,Math.min(.3,lv*.09));}}
  // 받침 몸통
  shape(body,(i,j)=>{const t=(j-bodyTop(i))/Math.max(1,bodyBot(Math.min(106,Math.max(14,i)))-bodyTop(i)),sp=Math.max(0,1-Math.abs(i-44)/26)*.28;return ramp(['#9097b8','#6a7090','#4a5072','#30344f','#1e2140','#12142a'],t*.95-sp,i,j);},DK,(i,j,edge,ins)=>{if(!edge&&!ins(i,j-1))px(i,j,goldLn(i,j));else if(!edge&&!ins(i,j-2)&&i%2===0)px(i,j,GL,.45);});
  for(let i=14;i<=106;i++){const j=Math.round(bodyBot(i))-4;px(i,j,GD,.9);if(i%3!==0)px(i,j-1,goldLn(i,j),.8);}
  [[20,124],[100,124]].forEach(([a,b])=>{rect(a-1,b-1,3,3,'#8a90b0');px(a-1,b-1,'#e9eeff');px(a,b,'#363a58');rect(a-1,b+2,3,1,DK,.6);});
  rect(8,117,8,2,GOLD);rect(104,117,8,2,GOLD);rect(8,117,3,1,GL);
  // 윗면 고리 + 빛나는 구멍
  shape(ell(60,112,40,8.5),(i,j)=>ramp(['#3a3f5c','#252844','#1c1f38','#14162b'],(j-103.5)/17,i,j),goldLn);
  shape(ell(60,112,36.5,6.8),(i,j)=>'#12142a',e?lo:'#3a3f5c');
  shape(ell(60,111.5,33,6),(i,j)=>{const d=Math.hypot((i-60)/33,(j-111.5)/6);return e?ramp([hi,c,c,lo,dk],d*.95,i,j):ramp(['#5a6088','#444a70','#2c3050','#1c1f38'],d,i,j);},null,(i,j,edge)=>{if(e&&!edge&&(i*5+j*3)%19===0)px(i,j,'#fff',.55);});
  px(44,108,'#fff',.8);px(45,108,'#fff',.7);px(46,107,'#fff',.6);px(47,107,'#fff',.5);
  // LED 10칸
  for(let n=0;n<10;n++){const on=n<lit,x0=Math.round(22+n*8.4-3),y0=Math.round(124+(1-Math.pow((n-4.5)/4.5,2))*4.5-1);
   if(on){for(let a=-2;a<8;a++)for(let b=-2;b<6;b++){const d=Math.min(a<0?-a:a>5?a-5:0,b<0?-b:b>3?b-3:0);if(d>0)px(x0+a,y0+b,c,.14/d);}}
   rect(x0-1,y0-1,8,6,DK);rect(x0,y0,6,4,on?c:'#2c3050');
   if(on){rect(x0,y0,6,1,hi);rect(x0+1,y0+1,4,1,lo,.0);px(x0+2,y0+1,'#fff');px(x0+3,y0+1,'#fff',.8);rect(x0,y0+3,6,1,lo);}else{rect(x0,y0,6,1,'#454b72');rect(x0,y0+3,6,1,'#1c1f38');}}
 });
 const front=run((px,rect,shape)=>{
  // 유리 덮개: 굵은 가장자리 + 은은한 결 + 반사광
  for(let j=14;j<113;j++)for(let i=21;i<100;i++){if(!arch(i+.5,j+.5))continue;const e1=!arch(i-.5,j+.5)||!arch(i+1.5,j+.5)||!arch(i+.5,j-.5),e2=!arch(i-1.5,j+.5)||!arch(i+2.5,j+.5)||!arch(i+.5,j-1.5);
   if(e1)px(i,j,'#f4fbff',.95);else if(e2)px(i,j,'#bfe3ff',.55);else if((i*3+j*7)%23===0)px(i,j,'#fff',.2);}
  for(let a=190;a<=262;a+=1.2){const r=a*Math.PI/180,tt=(a-190)/72,al=Math.sin(tt*Math.PI)*.85+.1;for(let w=0;w<3;w++)px(Math.round(60+Math.cos(r)*(31-w)),Math.round(46+Math.sin(r)*(23-w*.75)),'#fff',al*(w===1?1:.6));}
  for(let j=52;j<98;j++){const al=Math.sin((j-52)/46*Math.PI)*.7+.1;px(29,j,'#fff',al);px(30,j,'#fff',al*.6);px(28,j,'#fff',al*.35);}
  rect(30,102,2,6,'#fff',.7);rect(30,110,2,2,'#fff',.55);
  for(let j=58;j<92;j++)px(90,j,'#fff',.22);
  [[86,32,3],[78,24,2]].forEach(([a,b,r])=>{for(let q=-r;q<=r;q++){px(a+q,b,'#fff',1-Math.abs(q)/(r+1)*.6);px(a,b+q,'#fff',1-Math.abs(q)/(r+1)*.6);}});
  // 양쪽 기둥
  [20,95].forEach((x0,side)=>{shape((a,b)=>a>=x0&&a<=x0+6&&b>=40&&b<=112,(i,j)=>{const t=(i-x0)/6;return ramp(side?['#6a7090','#555b7c','#363a58','#1c1f38']:['#a0a6c4','#6a7090','#4a5072','#252844'],t*.9+(j%2?0:.02),i,j);},goldLn);
   for(const yy of [66,86]){rect(x0+1,yy-1,5,3,DK,.5);rect(x0+1,yy,5,2,c);px(x0+1,yy,hi);px(x0+2,yy,hi);for(let q=-2;q<8;q++)px(x0+q,yy+1,c,.18);}
   for(const yy of [46,106]){rect(x0+2,yy,3,3,GOLD);px(x0+2,yy,GL);px(x0+3,yy+1,GD);}});
  // 윗뚜껑
  const capTop=a=>{const t=(a-34)/52;return 26-48*t*(1-t);},capBot=a=>{const t=(a-38)/44;return 30-32*t*(1-t);};
  shape((a,b)=>a>=34&&a<=86&&b>=capTop(a)&&(a<38?b<=26+(a-34):a>82?b<=30-(a-82):b<=capBot(a)),(i,j)=>{const t=(j-capTop(i))/Math.max(2,(i<38||i>82?4:capBot(i)-capTop(i)));return ramp(['#9097b8','#6a7090','#4a5072','#30344f','#1e2140'],t*.95-Math.max(0,1-Math.abs(i-52)/18)*.25,i,j);},goldLn,(i,j,edge,ins)=>{if(!edge&&!ins(i,j-1))px(i,j,goldLn(i,j));});
  rect(57,16,6,2,GOLD);px(57,16,GL);px(58,16,GL);
  // 윗꼭지 보석 (면마다 밝기가 달라요)
  shape((a,b)=>Math.abs(a-60)/5+Math.abs(b-9)/6<=1,(i,j)=>{const up=j<9,lf=i<60;return up&&lf?hi:up?c:lf?c:lo;},GOLD);
  px(58,6,'#fff');px(59,6,'#fff',.9);px(58,7,'#fff',.7);px(59,10,hi);px(61,12,dk,.6);
  for(let a=-8;a<=8;a++)for(let b=-9;b<=9;b++){const d=Math.hypot(a/8,b/9);if(d>1&&d<1.5)px(60+a,9+b,c,.12*(1.5-d));}
 });
 return _gdPxC[key]={back:`<img class=gdPx src="${back}" alt="">`,front:`<img class=gdPx src="${front}" alt="">`};}
function lerp2(a,b,t){return a+(b-a)*t;}
function gdIncHTML(egg){const e=!!egg,c=e?TYPE_COL[egg.t]:'#7b819c',lit=e?Math.floor(egg.fed/10):0,hi=gdShade(c,.5);
 const leds=[...Array(10)].map((_,i)=>{const x=22+i*8.4,y=124+(1-Math.pow((i-4.5)/4.5,2))*4.5,on=i<lit;return `<rect class="${on?'gdLed':''}" x="${(x-2.6).toFixed(1)}" y="${y.toFixed(1)}" width="5.2" height="3.2" rx="1.4" fill="${on?c:'#2c3050'}" ${on?`style="filter:drop-shadow(0 0 3px ${c})"`:''} stroke="#0e1020" stroke-width=".6"/>`;}).join('');
 const back=`<svg viewBox="0 0 120 140"><defs>
  <linearGradient id="gdM" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a7090"/><stop offset=".45" stop-color="#30344f"/><stop offset="1" stop-color="#12142a"/></linearGradient>
  <linearGradient id="gdG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a8791f"/><stop offset=".35" stop-color="#ffe9a0"/><stop offset=".7" stop-color="#d9a935"/><stop offset="1" stop-color="#8a5f14"/></linearGradient>
  <radialGradient id="gdIn" cx="50%" cy="62%" r="60%"><stop offset="0" stop-color="${c}" stop-opacity=".75"/><stop offset=".6" stop-color="${c}" stop-opacity=".22"/><stop offset="1" stop-color="${c}" stop-opacity=".05"/></radialGradient>
  <linearGradient id="gdSh" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${hi}" stop-opacity=".7"/><stop offset="1" stop-color="${hi}" stop-opacity="0"/></linearGradient></defs>
  <ellipse cx="60" cy="122" rx="57" ry="15" fill="none" stroke="${c}" stroke-width="1.4" stroke-dasharray="3 5" opacity=".85" class="gdRing1" style="filter:drop-shadow(0 0 3px ${c})"/>
  <ellipse cx="60" cy="122" rx="48" ry="11.5" fill="none" stroke="${c}" stroke-width="1" stroke-dasharray="10 4 2 4" opacity=".7" class="gdRing2"/>
  <path d="M22 112V46Q22 16 60 16Q98 16 98 46V112Z" fill="url(#gdIn)"/>
  <path d="M42 112L48 52H72L78 112Z" fill="url(#gdSh)" opacity=".55"/>
  <path d="M8 117Q60 103 112 117L106 131Q60 144 14 131Z" fill="url(#gdM)" stroke="url(#gdG)" stroke-width="1.6"/>
  <path d="M14 131Q60 144 106 131" fill="none" stroke="#ffe9a0" stroke-width=".8" opacity=".5"/>
  <ellipse cx="60" cy="112" rx="40" ry="8.5" fill="#1c1f38" stroke="url(#gdG)" stroke-width="1.6"/><ellipse cx="60" cy="111" rx="33" ry="6" fill="${c}" opacity="${e?.45:.12}"/>
  ${leds}</svg>`;
 const front=`<svg viewBox="0 0 120 140">
  <path d="M22 112V46Q22 16 60 16Q98 16 98 46V112" fill="none" stroke="#e9f6ff" stroke-width="2" opacity=".85"/>
  <path d="M22 112V46Q22 16 60 16Q98 16 98 46V112Z" fill="#fff" opacity=".07"/>
  <path d="M30 100V50Q30 28 48 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".55"/><path d="M33 108v-3" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".55"/>
  <rect x="20" y="40" width="5" height="72" rx="2.5" fill="url(#gdM)" stroke="url(#gdG)" stroke-width=".9"/><rect x="95" y="40" width="5" height="72" rx="2.5" fill="url(#gdM)" stroke="url(#gdG)" stroke-width=".9"/>
  <path d="M20 66h5M95 66h5M20 86h5M95 86h5" stroke="${c}" stroke-width="1.6" style="filter:drop-shadow(0 0 2px ${c})"/>
  <path d="M34 26Q60 2 86 26L82 30Q60 14 38 30Z" fill="url(#gdM)" stroke="url(#gdG)" stroke-width="1.6"/>
  <path d="M60 4V-2" stroke="url(#gdG)" stroke-width="2" stroke-linecap="round"/>
  <path d="M60 3l5 6-5 6-5-6z" fill="${c}" stroke="url(#gdG)" stroke-width="1.4" style="filter:drop-shadow(0 0 5px ${c})"/><path d="M58 6l2-2" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".9"/>
  <path d="M10 117h6M104 117h6" stroke="url(#gdG)" stroke-width="2.4" stroke-linecap="round"/></svg>`;
 const pts=e?[0,1,2,3,4].map(i=>`<i class=gdPt style="left:${34+i*13}px;animation-delay:${(i*.65).toFixed(2)}s"></i>`).join(''):'';
 const px=gdPxInc(c,lit,e);return `<div class=gdInc style="--gl:${c}"><div class=gdIncIn>${px.back}${e?gdEggSVG(egg.t,egg.fed):gdEggSVG(0,0,true)}${pts}${px.front}</div></div>`;}
function gdScale(){try{const f=document.getElementById('gdField');if(f)f.style.setProperty('--k',(f.clientWidth/400).toFixed(3));}catch(e){}}
window.addEventListener('resize',gdScale);
function gardenPanel(m){setTimeout(gdScale,0);setTimeout(gdScale,300);const g=gd(m),all=stoneList(m).length,seen=m.stoneSeen==null?all:Math.min(m.stoneSeen,all),en=gdEnergy(m),pets=gdPets(m),egg=g.egg;
 const pos=pets.map(id=>{const P=gdFixedPos(m,id),C=gdCur(P),x=C.x,y=C.y,sz=gdSize(id);
  // 걷는 도중에 화면이 다시 그려져도 순간이동하지 않게: 지금 있을 자리에서 시작해서 이어서 걸어가요
  if(C.walk)setTimeout(()=>{try{const el=document.querySelector('#gdField .gdPet[data-id="'+id+'"]');if(el){el.style.transitionDuration=C.rem.toFixed(2)+'s';el.style.left=C.tx.toFixed(1)+'%';el.style.top=C.ty.toFixed(1)+'%';}}catch(e){}},40);
  return `<div class="gdPet${P.fly?' fly':''}${P.fl?' gdFlip':''}" data-gd="pet" data-id="${id}" style="--s:${sz};left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;z-index:${3+Math.round(y)}">${monImg(id,'anim')}</div>`;}).join('');
 const html=`<div class="panel gardenPanel" id=gardenPanel><div class=gdHead><b class=jua>나의 정원</b><span class=motto>포켓몬과 함께</span><span class=hudSp></span><span class=pill title="개념을 3번 연속 맞히면 에너지 1개">⚡ 에너지 ${en}</span><button class="btn ghost sm" data-gd=info>ⓘ</button></div>
  <div data-bg="${g.bg||''}" class="gdField gdT-${gdSkyInfo().slot}${S.meta.settings&&(S.meta.settings.lowfx||S.meta.settings.homeLite)?' gdLow':''}" id=gdField><svg width=0 height=0 style="position:absolute" aria-hidden=true><filter id=gdNightF color-interpolation-filters=sRGB><feColorMatrix type=matrix values=".5 0 0 0 0  0 .58 0 0 0  0 0 .86 0 .03  0 0 0 1 0"/></filter><filter id=gdDuskF color-interpolation-filters=sRGB><feColorMatrix type=matrix values=".97 0 0 0 .02  0 .8 0 0 0  0 0 .66 0 0  0 0 0 1 0"/></filter></svg><div class=gdBg style="${gdBgStyle(g)}"></div><button class=gdZoomBtn data-gd=zoom title="정원 크게 보기"></button>${gdSkyHTML()}${gdDecHTML(g)}${pos}${!pets.length?`<div class=gdEmptyNote style="position:absolute;left:0;right:0;bottom:5px;text-align:center;font-size:12px;line-height:1.3;color:#3f5a3a;padding:0 10px;z-index:5;pointer-events:none">파트너로 <b>100문제</b> 이상 함께 푼 포켓몬을 정원에 풀어놓을 수 있어요 (최대 ${GD_MAX}마리)</div>`:''}
   ${gdBubHTML()}<div class=gdHatch>${gdIncHTML(egg)}<span class=gdLbl>${egg?`${TYPE_KO[egg.t]} 알 · ${egg.fed}/${GD_NEED}`:'알 부화기 (비어 있음)'}</span></div></div>
  ${egg?`<div class=gdBar><i style="width:${Math.min(100,egg.fed/GD_NEED*100)}%"></i><span>${egg.fed} / ${GD_NEED}</span></div>`:''}
  <div class=gdBtns>${egg?`<button class="gdB feed" data-gd=feed1 title="에너지 1개 주기"><span class=zp>⚡</span></button><button class="gdB feed2" data-gd=feed10 title="에너지 10개 주기"><span class=zp>⚡</span>×10</button>`:`<button class="gdB pick" data-gd=pick title="알 고르기">🥚<small>🪙${GD_EGG_COST}</small></button>`}<button class="gdB pets" data-gd=pets title="정원 꾸리기">${I('ball')}<small>${pets.length}/${GD_MAX}</small></button></div>${gdRow2HTML(g,pets)}</div>`;
 if(all>seen){m.stoneSeen=all;autoSave();setTimeout(()=>{sfx('summon');toast(`⚡ 에너지가 <b>${all-seen}개</b> 더 모였어요!`);},600);}
 else if(m.stoneSeen==null){m.stoneSeen=all;}
 return html;}
// 정원 안내: 전설 포켓몬을 얻을 수 있는 콘텐츠를 돌아가며 알려 줘요 (눌러도 다음 안내로 넘어가요)
const GD_TIPS=[
 {ic:'🥚',b:'정원의 알에 에너지 <b>100개</b>를 주면 <b>전설 포켓몬</b>이 부화해요!',t:'정원의 알에 에너지 <b>100개</b>를 주면 알 속성에 맞는 <b>전설 포켓몬</b>이 부화해요!'},
 {ic:'📖',b:'<b>스토리</b>를 깨면 카드팩을 최대 15개! <b>전설 포켓몬</b>을 만나는 스토리도 있어요!',t:'<b>스토리</b>를 깨면 카드팩을 <b>최대 15개</b>까지 받아요. 디아루가·기라티나처럼 <b>전설 포켓몬을 만나는</b> 스토리도 있어요!',go:'scenario'},
 {ic:'🗡️',b:'<b>끝없는 모험</b> 층 보스를 잡으면 <b>전설 포켓몬</b>이 나올 수 있어요!',t:'<b>끝없는 모험</b>에서 층 보스를 쓰러뜨리면 보상 카드로 <b>전설 포켓몬</b>이 나올 수 있어요. 높은 층일수록 확률이 올라가요!',go:'rogue'},
 {ic:'🌿',b:'<b>야생 포켓몬 포획</b>에서 <b>전설 포켓몬</b>도 가끔 나타나요!',t:'<b>야생 포켓몬 포획</b>에서도 전설 포켓몬이 가끔 나타나요. 체력을 깎아서 잡아 봐요!',go:'endless'},
 {ic:'🤝',b:'<b>친구와 보스전</b>에는 <b>전설 포켓몬</b> 보스가 40% 확률로 나와요!',t:'<b>친구와 보스전</b>에는 전설 포켓몬 보스가 <b>40%</b> 확률로 나와요. 함께 공략해 봐요!',go:'bosscoop'},
 {ic:'🎴',b:'<b>카드팩</b>에서 <b>전설 조각</b> 8개를 모으면 카드가 완성돼요!',t:'<b>카드팩</b>에서 전설 <b>조각</b>을 모아 보세요. 조각 8개를 모으면 전설 카드가 완성돼요. 40팩 안에는 꼭 한 장 나와요!',go:'pack'},
 {ic:'🏆',b:'<b>배틀 리그</b> 챔피언을 처음 이기면 <b>전설 카드</b>를 받아요!',t:'<b>배틀 리그</b> 챔피언(9번째 관장)을 처음 이기면 <b>전설 카드</b>를 선물로 받아요!',go:'league'},
 {ic:'📅',b:'<b>시즌</b> 레벨을 끝까지 올리면 <b>전설 카드</b>를 받아요!',t:'<b>시즌</b> 레벨을 끝까지 올리면 마지막 보상으로 <b>전설 카드</b>를 받아요!',go:'season'},
 {ic:'💪',b:'<b>전설 포켓몬</b>은 특성이 강화돼서 훨씬 강력해요!',t:'<b>전설 포켓몬</b>은 특성이 강화돼서 훨씬 강력해요! 얻으면 꼭 덱에 넣어 보세요.'},
 {ic:'🔷',mg:1,b:'<b>도감</b>에서 <b>메가스톤 연구</b>를 하면 <b>메가진화</b>를 할 수 있어요!',t:'<b>도감</b>에서 포켓몬 카드를 열어 <b>메가스톤 연구</b>를 하면 전투에서 <b>메가진화</b>를 할 수 있어요! 도감의 <b>특수진화</b> 탭에서 가능한 포켓몬을 한눈에 볼 수 있어요.',go:'dexmega'}];
const GD_BUB={on:false,i:-1};
function gdBubInner(){const t=GD_TIPS[GD_BUB.i];if(!t)return '';return `<span class=gdBubTxt>${t.ic} ${t.b}</span>${t.go?`<button class=gdBubGo data-gdgo="${t.go}" aria-label="바로 가기" title="바로 가기">→</button>`:''}`;}
function gdBubHTML(){return `<div class="gdBub${GD_BUB.on?' on':''}" id=gdBub>${GD_BUB.on?gdBubInner():''}</div>`;}
// 8초 보이고 2초 쉬고, 다시 랜덤 안내 (방금 본 안내는 바로 다시 나오지 않아요)
function gdBubStep(){try{const el=document.getElementById('gdBub');
 if(!GD_BUB.on){if(document.hidden||S.screen!=='hub'){setTimeout(gdBubStep,1500);return;}
  let n;do{n=Math.floor(Math.random()*GD_TIPS.length);}while(n===GD_BUB.i&&GD_TIPS.length>1);GD_BUB.i=n;GD_BUB.on=true;if(el){el.innerHTML=gdBubInner();void el.offsetWidth;el.classList.add('on');}setTimeout(gdBubStep,8000);}
 else{GD_BUB.on=false;if(el)el.classList.remove('on');setTimeout(gdBubStep,2000);}}catch(e){setTimeout(gdBubStep,3000);}}
setTimeout(gdBubStep,2500);
document.addEventListener('click',e=>{const g=e.target.closest&&e.target.closest('[data-gdgo]');if(!g)return;
 const k=g.dataset.gdgo,f=FEAT.find(x=>x.k===k);if(f&&!featOn(k)){toast('아직 열리지 않았어요 ('+f.how+')');return;}sfx('tap');try{closeM();}catch(e){}if(NAV[k])NAV[k]();});
NAV.scenario=()=>{try{ac();}catch(e){}scLaunch();};NAV.rogue=()=>rlLaunch();
NAV.dexmega=()=>{if(!featOn('dex')){toast('아직 열리지 않았어요 (카드팩을 처음 열면)');return;}DEXF='mega';DEXRAR=0;renderDex();};
function gdTipRow(t){return `<div style="font-size:14px;line-height:1.6;margin:3px 0">${t.ic} ${t.t}${t.go?` <button class=gdBubGo data-gdgo="${t.go}" aria-label="바로 가기" title="바로 가기" style="display:inline-flex;vertical-align:middle;margin-left:4px;pointer-events:auto">→</button>`:''}</div>`;}
function gdInfo(){M(`<h2>⚡ 에너지와 알 부화기</h2><div style="line-height:1.8;font-size:15px">
  <b>에너지</b>는 수학·영어·국어·IQ 문제의 개념(유형) 하나를 <b>3번 연속</b> 맞히면 1개씩 모여요. 쉽게 모이지 않아요!<br>
  <b>알</b>은 부화기가 비어 있을 때 🪙${GD_EGG_COST}코인으로 18가지 속성 중에서 골라요.<br>
  알에게 에너지를 <b>${GD_NEED}번</b> 주면 그 속성의 <b>전설 포켓몬</b>이 랜덤으로 태어나요!<br>
  <b>정원</b>에는 파트너로 <b>${GD_BOND}문제</b> 이상 함께 푼 포켓몬을 ${GD_MAX}마리까지 풀어놓을 수 있어요.<h3 style="margin:12px 0 4px">🔷 특수진화</h3>${GD_TIPS.filter(t=>t.mg).map(gdTipRow).join('')}<h3 style="margin:12px 0 4px">🌟 전설 포켓몬을 얻는 방법</h3>${GD_TIPS.filter(t=>!t.mg).map(gdTipRow).join('')}</div><div class=mbtns><button class="btn gold" data-a=x>닫기</button></div>`,{x:()=>closeM(),_close:()=>closeM()});}
function gdPick(){const m=S.meta,g=gd(m);if(g.egg)return;
 const poor=m.coins<GD_EGG_COST;
 M(`<div class=gdPk><h2>🥚 알 고르기</h2><p class=gdPkSub>고른 속성의 <b>전설 포켓몬</b>이 태어나요</p><div class="gdPkCost${poor?' low':''}"><span>🪙 ${GD_EGG_COST}</span><small>내 코인 🪙 ${m.coins}</small></div>
  <div class=gdTypes>${TYPE_KO.map((n,i)=>{const c=TYPE_COL[i],pool=MON_IDS.filter(id=>MON[id].rar===5&&MON[id].types.includes(i)),have=pool.filter(id=>m.col[id]).length;
   return `<button data-a="t${i}" class="gdTy${poor?' poor':''}" style="--c:${c};--c1:${gdShade(c,.55)};--c2:${gdShade(c,-.35)};--c3:${gdShade(c,.82)}"><span class=gdTyEgg>${gdEggSVG(i,0,false)}</span><span class=gdTyNm>${n}</span><small class=gdTyCnt>${pool.length?`전설 ${have}/${pool.length}`:'&nbsp;'}</small></button>`;}).join('')}</div>
  <div class=mbtns><button class="btn ghost" data-a=x>닫기</button></div></div>`,
  Object.assign({x:()=>closeM(),_close:()=>closeM()},Object.fromEntries(TYPE_KO.map((n,i)=>['t'+i,()=>{if(m.coins<GD_EGG_COST){toast(`코인이 부족해요 (🪙${GD_EGG_COST} 필요)`);return;}if(g.egg){closeM();return;}m.coins-=GD_EGG_COST;g.egg={t:i,fed:0};autoSave();closeM();sfx('level');toast(`${TYPE_KO[i]} 속성 알을 부화기에 넣었어요!`);renderHub();}]))));}
function gdFeedFx(k,t){try{const el=document.querySelector('#gardenPanel .gdEgg')||document.querySelector('#gardenPanel .gdInc');if(!el)return;
 const r=zRect(el),cx=r.left+r.width/2,cy=r.top+r.height*.55,col=(typeof TYPE_COL!=='undefined'&&TYPE_COL[t])||'#ffd23f',big=k>=5,n=big?22:9,W=Math.max(60,r.width);
 const root=document.createElement('div');root.style.cssText='position:fixed;left:0;top:0;width:0;height:0;z-index:9999;pointer-events:none';document.body.appendChild(root);
 const mk=(css,txt)=>{const d=document.createElement('div');d.style.cssText='position:absolute;left:0;top:0;'+css;if(txt)d.textContent=txt;root.appendChild(d);return d;};
 for(let j=0;j<(big?3:1);j++){const ring=mk(`width:${W*.9}px;height:${W*.9}px;margin:${-W*.45}px 0 0 ${-W*.45}px;border-radius:50%;border:3px solid ${col};box-shadow:0 0 14px ${col},inset 0 0 12px ${col}`);
  ring.animate([{transform:`translate(${cx}px,${cy}px) scale(1.8)`,opacity:0},{opacity:.9,offset:.3},{transform:`translate(${cx}px,${cy}px) scale(.3)`,opacity:0}],{duration:650,delay:j*170,easing:'ease-in',fill:'both'});}
 for(let i=0;i<n;i++){const a=Math.random()*6.283,R=W*(.8+Math.random()*.9),x0=cx+Math.cos(a)*R,y0=cy+Math.sin(a)*R*.8;
  const p=mk('font-size:'+(14+Math.random()*10)+'px;line-height:1;margin:-10px 0 0 -8px;filter:drop-shadow(0 0 4px '+col+')',i%3?'⚡':'✨');
  p.animate([{transform:`translate(${x0}px,${y0}px) scale(.6)`,opacity:0},{opacity:1,offset:.25},{transform:`translate(${cx}px,${cy}px) scale(1.1) rotate(${(Math.random()-.5)*160}deg)`,opacity:.9,offset:.85},{transform:`translate(${cx}px,${cy}px) scale(.2)`,opacity:0}],{duration:520+Math.random()*260,delay:Math.random()*(big?380:180),easing:'cubic-bezier(.5,0,.8,.4)',fill:'both'});}
 const gl=mk(`width:${W*1.7}px;height:${W*1.7}px;margin:${-W*.85}px 0 0 ${-W*.85}px;border-radius:50%;background:radial-gradient(circle,#fff 0%,${col} 35%,transparent 70%);mix-blend-mode:screen`);
 gl.animate([{transform:`translate(${cx}px,${cy}px) scale(.3)`,opacity:0},{opacity:.95,offset:.4},{transform:`translate(${cx}px,${cy}px) scale(${big?1.5:1.1})`,opacity:0}],{duration:big?650:480,delay:big?520:420,easing:'ease-out',fill:'both'});
 const tx=mk(`font-family:Jua,'Noto Sans KR',sans-serif;font-size:${big?24:19}px;font-weight:700;color:#fff;white-space:nowrap;text-shadow:0 2px 0 #b8860b,0 0 8px ${col}`,'+'+k+' ⚡');
 tx.animate([{transform:`translate(calc(${cx}px - 50%),${cy-r.height*.2}px)`,opacity:0},{opacity:1,offset:.25},{transform:`translate(calc(${cx}px - 50%),${cy-r.height*.75}px)`,opacity:0}],{duration:1000,delay:420,easing:'ease-out',fill:'both'});
 if(el.animate)el.animate([{filter:'none'},{filter:'brightness(1.9) drop-shadow(0 0 12px '+col+')',offset:.5},{filter:'none'}],{duration:620,delay:big?520:420});
 setTimeout(()=>root.remove(),1800);}catch(e){}}
function gdRefresh(){try{const old=document.getElementById('gardenPanel');if(!old||S.screen!=='hub'||typeof modalOpen==='function'&&false){renderHub();return;}
 const oldPets=[...old.querySelectorAll('.gdPet')],tmp=document.createElement('div');tmp.innerHTML=gardenPanel(S.meta);const np=tmp.firstElementChild;if(!np){renderHub();return;}
 const same=oldPets.map(e=>e.dataset.id).join()===[...np.querySelectorAll('.gdPet')].map(e=>e.dataset.id).join();
 if(same){const nf=np.querySelector('#gdField'),hatch=nf.querySelector('.gdHatch');np.querySelectorAll('.gdPet').forEach(e=>e.remove());oldPets.forEach(e=>nf.insertBefore(e,hatch));}
 old.replaceWith(np);gdScale();
 const pl=document.querySelector('.hud .pill[title^="정원 에너지"]');if(pl)pl.textContent='⚡'+gdEnergy(S.meta);}catch(e){renderHub();}}
function gdFeed(n){const m=S.meta,g=gd(m),e=g.egg;if(!e)return;const en=gdEnergy(m);if(en<=0){toast('에너지가 없어요. 개념을 3번 연속 맞히면 모여요!');return;}
 const k=Math.min(n,en,GD_NEED-e.fed);if(k<=0)return;g.spent+=k;e.fed+=k;sfx(k>=5?'gdCharge10':'gdCharge');autoSave();
 if(e.fed>=GD_NEED){gdFeedFx(k,e.t);setTimeout(gdHatch,k>=5?1000:800);return;}
 gdRefresh();setTimeout(()=>{const el=document.querySelector('#gardenPanel .gdEgg');if(el){el.classList.add('wob');}gdFeedFx(k,e.t);},30);}
function gdHatch(){const m=S.meta,g=gd(m),t=g.egg.t;const pool=MON_IDS.filter(id=>MON[id].rar===5&&MON[id].types.includes(t));const fresh=pool.filter(id=>!m.col[id]);const id=rpick(fresh.length?fresh:pool);
 g.egg=null;g.born=(g.born||0)+1;g.hist=(g.hist||[]);g.hist.unshift({id,t,d:today()});g.hist.length=Math.min(g.hist.length,60);const isNew=addCard(id);autoSave();sfx('win');confetti(80);
 M(`<div style="text-align:center"><h2>🥚 알이 부화했어요!</h2><div style="display:flex;justify-content:center;height:150px">${monImg(id,'art')}</div><p style="font-size:19px;margin:6px 0"><b>${esc(MON[id].name)}</b> ${typeChips(MON[id])}</p><p class=mut style="font-size:14px">${TYPE_KO[t]} 속성 전설 포켓몬${isNew?' · 새로 도감에 등록됐어요!':' · 이미 가진 포켓몬이라 카드가 한 장 늘었어요'}</p><div class=mbtns><button class="btn gold" data-a=x>좋아요!</button></div></div>`,{x:()=>{closeM();renderHub();},_close:()=>{closeM();renderHub();}});}
function gdPetsPick(){const m=S.meta,g=gd(m);const ids=Object.keys(m.col).map(Number).filter(id=>MON[id]&&bondOf(id)>=GD_BOND).sort((a,b)=>bondOf(b)-bondOf(a)||a-b);
 const draw=()=>{const cur=gdPets(m);
  M(`<h2>🌿 정원 꾸리기 (${cur.length}/${GD_MAX})</h2><p class=mut style="font-size:13px">파트너로 ${GD_BOND}문제 이상 함께 푼 포켓몬만 풀어놓을 수 있어요.</p>${ids.length?`<div class=dexGrid style="margin-top:8px;max-height:52vh;overflow-y:auto">${ids.map(id=>`<div class="dexCell" data-pid="${id}" style="${cur.includes(id)?'border-color:#3aa64a;border-width:3px;background:#e9ffe3':''}"><span class=n2>${bondOf(id)}</span>${monImg(id,'front','',id!==partnerId())}<span class=nm>${esc(MON[id].name)}${cur.includes(id)?' ✔':''}</span></div>`).join('')}</div>`:'<p style="text-align:center;margin:16px 0">아직 없어요. 포켓몬을 파트너로 정하고 100문제를 함께 풀어 보세요!</p>'}<div class=mbtns><button class="btn gold" data-a=x>완료</button></div>`,{x:()=>{closeM();renderHub();},_close:()=>{closeM();renderHub();}},{wide:1});
  $('#mbox').querySelectorAll('[data-pid]').forEach(c=>c.onclick=()=>{const id=+c.dataset.pid;let a=gdPets(m);if(a.includes(id))a=a.filter(x=>x!==id);else if(a.length>=GD_MAX){toast(`정원에는 ${GD_MAX}마리까지만 풀어놓을 수 있어요`);return;}else a.push(id);g.pets=a;autoSave();sfx('tap');draw();});};
 draw();}
function gdZoom(on){const b=document.body;b.classList.toggle('gdZoom',!!on);const p=document.getElementById('gardenPanel');if(p)p.style.minHeight=on?p.offsetHeight+'px':'';setTimeout(gdScale,0);setTimeout(gdScale,150);}
document.addEventListener('click',e=>{const b=document.body;if(!b.classList.contains('gdZoom'))return;const f=document.getElementById('gdField');if(!f){b.classList.remove('gdZoom');return;}const t=e.target;if(!t||!t.closest||f.contains(t)||t.closest('.modal,#modal2,#toast'))return;e.stopPropagation();e.preventDefault();gdZoom(false);},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('gdZoom'))gdZoom(false);});
window.addEventListener('resize',()=>{if(document.body.classList.contains('gdZoom'))setTimeout(gdScale,60);});
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-gd]');if(!b)return;const a=b.dataset.gd;try{
 if(a==='info'){sfx('tap');gdInfo();}else if(a==='zoom'){sfx('tap');gdZoom(!document.body.classList.contains('gdZoom'));}else if(a==='pick'){sfx('tap');gdPick();}else if(a==='pets'){sfx('tap');gdPetsPick();}
 else if(a==='feed1')gdFeed(1);else if(a==='feed10')gdFeed(10);
 else if(a==='snack'){sfx('tap');gdSnack();}else if(a==='decor'){sfx('tap');gdDecor();}else if(a==='dex'){sfx('tap');gdDex();}else if(a==='mis'){sfx('tap');gdMisModal();}
 else if(a==='pet'){if(Date.now()-(window.__gdDragged||0)<450)return;gdMis('pet');const id=+b.dataset.id;sfx('gdPet');gdPetFx(b);toast(`${esc(MON[id].name)}: ${rpick(['반가워요!','오늘도 공부 파이팅!','정원이 좋아요~','쓰다듬어 줘서 고마워요!'])}`);}
}catch(err){console.warn('garden',err);}});
// 정원 포켓몬은 천천히 조금씩 돌아다녀요. 걷는 자리는 저장돼서 새로고침해도 그 자리에 있고, 화면이 다시 그려져도 순간이동하지 않고 이어서 걸어가요
setInterval(()=>{try{const f=document.getElementById('gdField');if(!f||document.hidden||S.screen!=='hub')return;let moved=0;
 f.querySelectorAll('.gdPet').forEach(p=>{const id=+p.dataset.id,P=gdFixedPos(S.meta,id);gdSettle(P);if(p.classList.contains('gdHeld')||p.__fall||P.t0||Math.random()<.5)return;
  const Z=gdZone(id),dx=(Math.random()-.5)*36,dy=(Math.random()-.5)*(gdFly(id)?18:12),tx=Math.max(8,Math.min(92,P.x+dx)),ty=(gdFly(id)&&P.hy)?Math.max(Z.y0,P.hy-4,Math.min(97,P.hy+4,P.y+dy)):Math.max(Z.y0,Math.min(Z.y1,P.y+dy));
  if(Math.abs(tx-P.x)<4&&Math.abs(ty-P.y)<2.5)return;
  P.tx=+tx.toFixed(1);P.ty=+ty.toFixed(1);P.t0=Date.now();P.fl=tx>P.x?1:0;moved=1;
  p.classList.toggle('gdFlip',!!P.fl);p.style.transitionDuration=GD_WALK+'s';p.style.left=P.tx+'%';p.style.top=P.ty+'%';p.style.zIndex=3+Math.round(ty);});
 if(moved)gdSaveSoon();}catch(e){}},4200);
document.addEventListener('visibilitychange',()=>{if(document.hidden)gdSaveSoon(true);});window.addEventListener('pagehide',()=>gdSaveSoon(true));
// 포켓몬을 누르면 폴짝 뛰며 하트와 반짝임이 올라와요
function gdPetFx(b){try{if(b.__fx)return;b.__fx=1;setTimeout(()=>{b.__fx=0;},650);
 const img=b.querySelector('img'),fl=b.classList.contains('gdFlip')?-1:1,r=zRect(b),cx=r.left+r.width/2,top=r.top+r.height*.25;
 if(img&&img.animate)img.animate([{transform:`translateY(0) scale(${fl},1)`},{transform:`translateY(-${Math.max(10,r.height*.22)}px) scale(${fl*.92},1.1)`,offset:.35},{transform:`translateY(0) scale(${fl*1.1},.88)`,offset:.65},{transform:`translateY(0) scale(${fl},1)`}],{duration:520,easing:'ease-out'});
 const root=document.createElement('div');root.style.cssText='position:fixed;left:0;top:0;width:0;height:0;z-index:9999;pointer-events:none';document.body.appendChild(root);
 const em=['💖','♥','✨','💗','✨','💖'];
 for(let i=0;i<6;i++){const d=document.createElement('div');d.textContent=em[i];d.style.cssText='position:absolute;left:0;top:0;line-height:1;font-size:'+(14+Math.random()*9)+'px;margin:-8px 0 0 -8px;filter:drop-shadow(0 0 3px #fff)';root.appendChild(d);
  const x0=cx+(Math.random()-.5)*r.width*.6,dx=(Math.random()-.5)*r.width*.9,dy=Math.max(34,r.height*.7)+Math.random()*24;
  d.animate([{transform:`translate(${x0}px,${top}px) scale(.4)`,opacity:0},{opacity:1,offset:.2},{transform:`translate(${x0+dx}px,${top-dy}px) scale(1.15)`,opacity:0}],{duration:850+Math.random()*350,delay:i*55,easing:'ease-out',fill:'both'});}
 setTimeout(()=>root.remove(),1700);}catch(e){}}


// ===== 정원 확장: 시간대·날씨 / 부화 도감 / 오늘의 미션 / 간식 / 꾸미기 =====
// 정원 장식 도트 그림: 빛(왼쪽 위)을 따라 5단 색으로 칠하고, 테두리는 칠한 색을 어둡게 해서 부드럽게 둘러요
const GD_SPR=(()=>{const cache={};
 const H2=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
 const RP=a=>a.map(H2);
 const PAL={
  leaf:RP(['#2f6b4f','#3f8c57','#62b363','#8ad378','#bdf09a']),
  leaf2:RP(['#2a6a58','#3a8a68','#59b07a','#86d594','#bff0b8']),
  pink:RP(['#b9537c','#dc7aa0','#f5a4c0','#ffc9dc','#fff0f5']),
  trunk:RP(['#4f3326','#6d4631','#8f6141','#b2845a','#d3a878']),
  stone:RP(['#575f7c','#737c9a','#9199b4','#b8bfd4','#e3e8f3']),
  moss:RP(['#3a6e48','#52904f','#72b560','#98d77c','#c6f09a']),
  yellow:RP(['#c98318','#f0a727','#ffc84a','#ffe27c','#fff4b8']),
  brown:RP(['#4a2f22','#6a4429','#8a5c34','#a87846','#c9985f']),
  red:RP(['#9a3640','#c24f50','#e0705f','#f29a82','#ffc9ae']),
  cream:RP(['#bd9f7a','#d9bf98','#eedab8','#f9ebcf','#fffaec']),
  water:RP(['#2d7cbd','#4a9fdb','#74c2ee','#a4dcf8','#dcf3fd']),
  teal:RP(['#2c6f79','#3a8f93','#56b4ae','#80d4c6','#b9efe0']),
  white:RP(['#a9a4bd','#c9c5da','#e3e0ee','#f5f3fa','#ffffff']),
  balloonR:RP(['#a8323f','#d24a58','#f2667a','#ff93a2','#ffd0d6']),
  balloonB:RP(['#2d6fb5','#4b92db','#74b6f3','#a5d3fb','#e0f1ff']),
  balloonY:RP(['#c98318','#eea227','#ffc84a','#ffe27c','#fff4b8'])
 };
 Object.assign(PAL,{
  pr:RP(['#9c2430','#d03038','#ec4848','#ff7a6e','#ffc8bc']),
  ink:RP(['#14141e','#25253a','#383852','#54546e','#7a7a98']),
  pur:RP(['#46287e','#6a3fb5','#8a5fd6','#ac86ee','#d9c6ff']),
  fire:RP(['#a8340f','#d9541a','#ff7a2a','#ffa84a','#ffe08a']),
  straw:RP(['#8f6a22','#b58b36','#d6aa4e','#ecc874','#fbe6a4']),
  rock:RP(['#34304a','#4c4864','#686482','#8a86a6','#b6b2cf']),
  lava:RP(['#6e1a10','#a82c16','#e0551c','#ff9430','#fff0a0']),
  iron:RP(['#2c2f3e','#434759','#5f647a','#8489a0','#b4b8cc']),
  cop:RP(['#6a3a1a','#98562a','#c8803c','#e8a860','#ffd9a0']),
  ffly:RP(['#7e9a30','#a8c83e','#d4ee62','#f0ff9c','#ffffe0']),
  orn:RP(['#b8480f','#e8701c','#ff9a3a','#ffbf6a','#ffe6b8']),
  pnk:RP(['#a8326a','#d4509a','#f27ab8','#ff9fd0','#ffd9ee']),
  blu:RP(['#2a4aa8','#3f6fd6','#5c92f0','#8ab8ff','#d0e4ff']),
  egg:RP(['#c9b48a','#e2d0a8','#f2e4c4','#fbf2da','#ffffff']),
  glass:RP(['#6a8a50','#8fb070','#b6d494','#d8ecc0','#f4ffe6'])
 });
 // 도트 그림 (글자판): 한 글자가 한 점
 const bmp=(a,x0,y0,rows,cm)=>rows.forEach((r,j)=>{for(let i=0;i<r.length;i++){const c=cm[r[i]];if(c)a.P(x0+i,y0+j,c);}});
 // 몬스터볼 계열 (구 하나를 f로 칠해요)
 const ballF=(top,mid)=>(nx,ny)=>{const d=Math.hypot(nx,ny);
  if(d<.2)return PAL.white;if(d<.36)return '#26202e';if(Math.abs(ny)<.095)return '#26202e';
  if(ny<0){const m=mid&&mid(nx,ny);return m||top;}return PAL.white;};
 const ball=(top,mid,seed,after)=>()=>mk(24,24,a=>{a.sph(12,11.5,11,ballF(top,mid),{bias:-.13});if(after)after(a);},{seed,sw:9,});
 // 불꽃 한 송이 (바닥 중심 cx,by / 높이 h / 폭 w)
 const flame=(a,cx,by,h,w,ph)=>{const L=[['#d8321a',1,1],['#ff7a22',.74,.72],['#ffc43a',.5,.5],['#fff4bc',.26,.28]];
  L.forEach(([col,hh,ww])=>{const H=Math.round(h*hh);for(let y=0;y<H;y++){const t=y/H;const wd=w*ww*Math.pow(1-t,.75)*(1+.28*Math.sin(t*5+ph));const sh=Math.sin(t*3.2+ph)*w*.22*t;
   for(let x=Math.round(-wd);x<=Math.round(wd);x++)a.P(cx+x+Math.round(sh),by-y,col);}});};
 // 생쥐 모양 (인형·동상 같이 써요)
 const critter=(a,ox,oy,R,cheek,ink,tailR)=>{const{blob,line,P,rect}=a;
  if(tailR){line(ox+20,oy+28,ox+24,oy+27,tailR[0],2);line(ox+24,oy+27,ox+23,oy+23,tailR[0],2);line(ox+23,oy+23,ox+26,oy+22,tailR[1],2);line(ox+26,oy+22,ox+25,oy+17,tailR[1],2);}
  blob(ox+9,oy+30,3.2,2.4,R,{bias:-.1});blob(ox+17,oy+30,3.2,2.4,R,{bias:-.2});
  blob(ox+13,oy+22,7.6,8,R,{bias:-.05});
  blob(ox+6.5,oy+22,2.2,3,R,{bias:-.15});blob(ox+19.5,oy+22,2.2,3,R,{bias:-.25});
  line(ox+8,oy+9,ox+4,oy+1,R[2],3);line(ox+18,oy+9,ox+22,oy+1,R[1],3);
  blob(ox+13,oy+13,9,7.4,R,{bias:0});
  P(ox+4,oy,ink);P(ox+3,oy+1,ink);P(ox+5,oy+1,ink);P(ox+4,oy+2,ink);P(ox+22,oy,ink);P(ox+21,oy+1,ink);P(ox+23,oy+1,ink);P(ox+22,oy+2,ink);
  if(cheek){blob(ox+6.5,oy+15,2,1.8,cheek,{bias:.1});blob(ox+19.5,oy+15,2,1.8,cheek,{bias:.1});}
  P(ox+9,oy+11,ink);P(ox+9,oy+12,ink);P(ox+17,oy+11,ink);P(ox+17,oy+12,ink);P(ox+9,oy+11,'#ffffff');P(ox+17,oy+11,'#ffffff');
  P(ox+13,oy+14,ink);P(ox+12,oy+15,ink);P(ox+14,oy+15,ink);};
 // 별 모양 채우기 (왼쪽이 밝아요)
 const starFill=(a,cx,cy,Ro,Ri)=>{const pts=[];for(let i=0;i<10;i++){const r=i%2?Ri:Ro,an=-Math.PI/2+i*Math.PI/5;pts.push([cx+Math.cos(an)*r,cy+Math.sin(an)*r]);}
  const inside=(x,y)=>{let c=false;for(let i=0,j=9;i<10;j=i++){const[xi,yi]=pts[i],[xj,yj]=pts[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c;}return c;};
  for(let y=Math.floor(cy-Ro);y<=Math.ceil(cy+Ro);y++)for(let x=Math.floor(cx-Ro);x<=Math.ceil(cx+Ro);x++)if(inside(x+.5,y+.5))a.P(x,y,x<cx-2?'#fff8c0':x<cx+1?'#ffe860':x<cx+4?'#ffcf3a':'#f0a828');};
 // 진화의 돌: 뾰족한 결정 하나
 const gem=(a,cx,y0,hh,hw,ramp)=>{for(let y=0;y<hh;y++){const t=y/(hh-1);let w=t<.34?hw*(t/.34):t<.6?hw:hw*(1-(t-.6)/.4*.7);w=Math.max(.6,w);
   for(let x=Math.round(-w);x<=Math.round(w);x++){const u=x/Math.max(1,w);let v=u<-.5?.92:u<.05?.7:u<.5?.42:.2;if(t<.34)v+=.06;if(t>.8)v-=.1;
    a.sh(cx+x,y0+y,ramp,v,.15);}}
  a.P(cx-Math.round(hw*.5),y0+Math.round(hh*.3),'#ffffff');a.P(cx-Math.round(hw*.5),y0+Math.round(hh*.3)+1,'#ffffff');a.P(cx-Math.round(hw*.3),y0+Math.round(hh*.22),'#ffffff');};
 // ───── 엔진 v2 팔레트: 6단계, 그림자는 푸른 보랏빛 / 빛은 따뜻하게 ─────
 Object.assign(PAL,{
  cRed:RP(['#5a1530','#8e1f3a','#c8333f','#ee5548','#ff8a6a','#ffd2b8']),
  cBlue:RP(['#1c2c6a','#2c4aa0','#3f78d8','#62a6f4','#9ad2ff','#e0f4ff']),
  cInk:RP(['#0e0c1c','#1c1a30','#2e2c4a','#48466a','#6e6c94','#a09cc0']),
  cPur:RP(['#2c1558','#4a2690','#6c3fcc','#9468ee','#bf98ff','#ecdcff']),
  cGold:RP(['#6a3a10','#a8601a','#dc9424','#f8c448','#ffe488','#fff6c8']),
  cWhite:RP(['#5e5888','#8c86b4','#bebad8','#e4e2f2','#f6f5ff','#ffffff']),
  cFire:RP(['#5a1410','#a02c18','#e0581c','#ff8a2c','#ffc04a','#fff0a8']),
  cLeaf:RP(['#12382c','#1f5c3a','#31864a','#52ae58','#7ed06a','#b4ec92']),
  cWood:RP(['#2a1812','#4a2c1e','#74482e','#9c6a40','#c8945a','#ecc890']),
  cStone:RP(['#262640','#40405e','#5e5c86','#8582aa','#b0acd0','#dcd8f0']),
  cStraw:RP(['#5e4018','#8a6226','#b88c3e','#dcb462','#f4d68e','#fff0c0']),
  cWater:RP(['#0e3262','#1a5a9c','#2c88d0','#56b4ee','#92d8fa','#d8f4ff']),
  cPink:RP(['#621a48','#9c2c74','#d24896','#f278b8','#ffa8d4','#ffe0f0']),
  cTeal:RP(['#0c3644','#18586a','#288888','#4ab2a4','#80dac2','#c8f6e4']),
  cIron:RP(['#10121c','#242838','#3c4259','#5c6482','#8a92b2','#c2c8de']),
  cCop:RP(['#38180e','#683016','#a05828','#d0863c','#f0b666','#ffe2a6']),
  cRock:RP(['#14101c','#282234','#42394f','#625a76','#8a829e','#b6aec6']),
  cYel:RP(['#783e10','#b66c18','#e8a424','#ffcc3c','#ffe67e','#fff6c0']),
  cMoss:RP(['#1a3a24','#2c5a30','#468440','#68ac52','#92d070','#c4ee9a']),
  cCream:RP(['#6a5a4a','#9c8a72','#cbb898','#e8d8b8','#f8ecd2','#fffaf0'])
 });
 const crit2=(a,ox,oy,R,o)=>{o=o||{};const{blob,poly,P}=a,X=x=>ox+x,Y=y=>oy+y,ink=o.ink||'#241418';
  if(o.tail){poly([[X(24),Y(32)],[X(29),Y(31)],[X(28),Y(27)],[X(33),Y(25)],[X(31),Y(18)],[X(25),Y(24)],[X(27),Y(27)],[X(24),Y(29)]],(x,y,u,v)=>({r:o.tail,v:.8-u*.45+(1-v)*.1}));
   poly([[X(24),Y(32)],[X(29),Y(31)],[X(28),Y(28)],[X(24),Y(30)]],(x,y,u,v)=>({r:PAL.cWood,v:.55-u*.2}));}
  blob(X(11),Y(37),4.2,2.6,R,{bias:-.1,dt:.1});blob(X(21),Y(37),4.2,2.6,R,{bias:-.24,dt:.1});
  blob(X(16),Y(29),9.6,9,R,{bias:-.05,dt:.1});if(o.belly)blob(X(15.5),Y(31),5.8,5.8,R,{bias:.22,dt:.1});
  blob(X(7.2),Y(28),2.9,3.7,R,{bias:-.08,dt:.1});blob(X(24.8),Y(28),2.9,3.7,R,{bias:-.3,dt:.1});
  const ear=(pts,tip)=>{poly(pts,(x,y,u,v)=>({r:R,v:.62+(1-v)*.2-u*.14}));poly(tip,()=>ink);};
  ear([[X(9),Y(11)],[X(4),Y(2)],[X(8),Y(0)],[X(14),Y(9)]],[[X(4),Y(2)],[X(8),Y(0)],[X(7),Y(4)],[X(5),Y(4)]]);
  ear([[X(23),Y(9)],[X(27),Y(0)],[X(31),Y(3)],[X(23),Y(12)]],[[X(27),Y(0)],[X(31),Y(3)],[X(28),Y(5)],[X(26),Y(3)]]);
  if(o.earIn){poly([[X(8.6),Y(10)],[X(6),Y(4)],[X(10),Y(8)]],()=>o.earIn);poly([[X(23.6),Y(10)],[X(27),Y(4)],[X(25),Y(9)]],()=>o.earIn);}
  blob(X(16),Y(17),11.6,9.4,R,{bias:0,dt:.1});
  [[X(10),Y(15)],[X(21),Y(15)]].forEach(([x,y])=>{P(x,y,ink);P(x+1,y,ink);P(x,y+1,ink);P(x+1,y+1,ink);P(x,y+2,ink);P(x+1,y+2,ink);P(x,y,'#ffffff');});
  if(o.cheek){blob(X(6.2),Y(20),2.7,2.3,o.cheek,{bias:.1,dt:.1});blob(X(25.8),Y(20),2.7,2.3,o.cheek,{bias:.0,dt:.1});}
  P(X(16),Y(18),ink);P(X(15),Y(20),ink);P(X(16),Y(21),ink);P(X(17),Y(20),ink);
  if(o.stitch)for(let y=26;y<37;y+=2)P(X(16),Y(y),R[1]);};
 const V2=(seed,sw,tufts,extra)=>Object.assign({seed,sw,v2:1,rim:1,tufts:tufts==null?4:tufts},extra||{});
 const symb={fire:['..y..','.yoy.','.yoy.','yooyy','yoWoy','.oWo.','.ooo.'],drop:['..w..','..w..','.www.','.wWw.','wwWww','wwwww','.www.'],bolt:['..bb.','.bb..','bbb..','.bbb.','..bb.','.bb..','.b...']};

 const stone2=(sym,C,C2,seed,ic)=>mk(34,48,a=>{const{poly,blob,P,line,leaves}=a;
  blob(17,42,14,5,PAL.cRock,{bias:-.2,dt:.1});blob(17,40,12.5,4.2,PAL.cRock,{bias:.12,dt:.1});leaves(17,39,11,2.4,PAL.cMoss,16,{bias:.02});
  const ap=[17,3],ul=[7,15],ur=[27,15],ll=[9,35],lr=[25,35],bt=[17,42],mc=[17,18];
  poly([ap,ul,mc],(x,y,u,v)=>({r:C,v:.96-v*.06,dt:.05}));poly([ap,ur,mc],(x,y,u,v)=>({r:C,v:.7-v*.06,dt:.05}));
  poly([ul,mc,[17,42],ll],(x,y,u,v)=>({r:C,v:.84-v*.28-u*.04,dt:.05}));poly([ur,mc,[17,42],lr],(x,y,u,v)=>({r:C,v:.42-v*.2,dt:.05}));
  poly([ll,[17,42],lr,[17,38]],(x,y,u,v)=>({r:C,v:.3+(1-v)*.1,dt:.05}));
  line(17,3,7,15,'#ffffff',1);line(17,4,26,15,C[4],1);line(17,18,17,41,C[4],1);line(7,16,9,34,C[4],1);
  const rows=symb[sym],cm=sym==='fire'?{y:ic,o:'#ffd27a',W:'#ffffff'}:sym==='drop'?{w:'#d8f4ff',W:'#ffffff'}:{b:ic};
  const gl=sym==='bolt'?'#ffe27a':sym==='fire'?'#ffb040':'#9adaff';
  for(let dy=-1;dy<=7;dy++)for(let dx=-1;dx<=5;dx++){const x=14+dx,y=18+dy;if(Math.hypot(dx-2,dy-3)<4.2)P(x,y,gl);}
  rows.forEach((r,j)=>{for(let i=0;i<r.length;i++){const c=cm[r[i]];if(c)P(14+i,18+j,c);}});
  [[3,8],[31,22],[4,32],[29,6]].forEach(p=>{P(p[0],p[1],'#ffffff');P(p[0]-1,p[1],C[4]);P(p[0]+1,p[1],C[4]);P(p[0],p[1]-1,C[4]);P(p[0],p[1]+1,C[4]);});
 },V2(seed,13,5));
 // 불꽃 한 송이: 아래 가운데가 가장 밝고 끝은 붉게
 const flm=(a,cx,by,h,w,ph,hot)=>{const Lp=[],Rp=[];for(let i=0;i<=10;i++){const t=i/10,wd=w*Math.pow(Math.sin(Math.PI*Math.min(1,.1+t*.9)),.85)*(1-t*.5)+.35,sw=Math.sin(t*3.1+ph)*w*.34*t,y=by-h*t;Lp.push([cx+sw-wd,y]);Rp.push([cx+sw+wd,y]);}
  a.poly(Lp.concat(Rp.reverse()),(x,y,u,v)=>({r:PAL.cFire,v:.2+(1-Math.abs(u-.5)*2)*.42+v*.34+(hot||0),dt:.05}));};
 const sparkle=(a,x,y,c1,c2)=>{a.P(x,y,c1);a.P(x-1,y,c2);a.P(x+1,y,c2);a.P(x,y-1,c2);a.P(x,y+1,c2);};
 const jag=(a,pts,c1,c2)=>{for(let i=0;i<pts.length-1;i++){a.line(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],c1,2);}for(let i=0;i<pts.length-1;i++)a.line(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],c2,1);};
 // 철제 소품 도우미: 나선(소용돌이) 장식
 const scroll=(a,cx,cy,r0,turns,ramp,rad)=>{let pp=null;for(let i=0;i<=26;i++){const t=i/26,an=t*turns*6.283,r=r0*(1-t*.82),p=[cx+Math.cos(an)*r,cy+Math.sin(an)*r*.9];if(pp)a.tube(pp[0],pp[1],p[0],p[1],rad,ramp);pp=p;}};
 // 꽃 한 송이 (kind 0 데이지 / 1 튤립 / 2 팬지)
 const fw=(a,x,y,c,k)=>{if(k===0){for(let i=0;i<6;i++){const an=i/6*6.283;a.blob(x+Math.cos(an)*1.7,y+Math.sin(an)*1.7,1.2,1.2,PAL.cWhite,{bias:.2,dt:.1});}a.gsph(x,y,1.3,()=>PAL.cGold,{spec:0});}
  else if(k===1){a.poly([[x-2,y-3],[x-.7,y-1],[x,y-3.6],[x+.7,y-1],[x+2,y-3],[x+1.6,y+1],[x-1.6,y+1]],(px,py,u,v)=>({r:c,v:.7-u*.3,dt:.05}));}
  else{for(let i=0;i<5;i++){const an=i/5*6.283-1.57;a.blob(x+Math.cos(an)*1.6,y+Math.sin(an)*1.6,1.3,1.3,c,{bias:.1,dt:.1});}a.P(x,y,'#fff6c0');}};
 const sfHead=(a,cx,cy,r,ph)=>{const n=18;
  [[1.12,.6,.16],[1.3,1,0]].forEach(([k,dv,off])=>{for(let i=0;i<n;i++){const an=i/n*6.283+ph+off,c=Math.cos(an),s=Math.sin(an),vv=.6+.34*(c*-.6+s*-.8)-(dv<1?.16:0);
   a.poly([[cx+Math.cos(an-.2)*r*.55,cy+Math.sin(an-.2)*r*.55],[cx+c*r*k,cy+s*r*k],[cx+Math.cos(an+.2)*r*.55,cy+Math.sin(an+.2)*r*.55]],()=>({r:PAL.cYel,v:vv,dt:.05}));}});
  a.gsph(cx,cy,r*.64,()=>PAL.cWood,{spec:0,bias:-.1});for(let i=0;i<30;i++){const rr=Math.sqrt(i/30)*r*.58,an=i*2.399;a.P(cx+Math.cos(an)*rr,cy+Math.sin(an)*rr,i%2?PAL.cWood[3]:PAL.cWood[4]);}};
 const mshr=(a,cx,by,R,H,ramp,sp)=>{a.poly([[cx-R*.34,by],[cx+R*.34,by],[cx+R*.24,by-H],[cx-R*.24,by-H]],(x,y,u,v)=>({r:PAL.cCream,v:.8-u*.4,dt:.05}));
  a.blob(cx,by,R*.5,1.5,PAL.cCream,{bias:-.2,dt:.1});a.blob(cx,by-H+.6,R*.98,R*.3,PAL.cCream,{bias:-.2,dt:.1});
  a.blob(cx,by-H-R*.2,R,R*.64,ramp,{bias:-.12,dt:.1});a.blob(cx-R*.16,by-H-R*.36,R*.8,R*.44,ramp,{bias:.16,dt:.1});a.blob(cx-R*.4,by-H-R*.54,R*.3,R*.14,ramp,{bias:.6,dt:.1});
  sp.forEach(([dx,dy,rr])=>a.gsph(cx+dx*R,by-H-R*.2+dy*R,rr,()=>PAL.cWhite,{spec:0}));};
 // 풍차: 탑과 날개를 따로 그려요 (날개만 돌아요)
 const wmTower=a=>{const{poly,tube,blob,gsph,P,leaves}=a;
  poly([[22,72],[48,72],[44,30],[26,30]],(x,y,u,v)=>{const row=Math.floor(y/4),off=(row%2)*3,col=Math.floor((x+off)/6),mort=(y%4===0)||((x+off)%6===0);const c=((row*7+col*3)%5);return{r:PAL.cCream,v:(mort?.42:.7+(c-2)*.03)-u*.34+(1-v)*.06,dt:.05};});
  poly([[20,78],[50,78],[48,70],[22,70]],(x,y,u,v)=>({r:PAL.cStone,v:.62-u*.3+(1-v)*.1+(((Math.floor(x/5)+Math.floor(y/3))%2)?.05:-.04),dt:.05}));
  tube(25,32,45,32,1.4,PAL.cWood);tube(21,55,49,55,1,PAL.cWood,{bias:-.1});
  blob(35,28,14,5,PAL.cRed,{bias:-.1,dt:.1});poly([[20,28],[50,28],[44,14],[26,14]],(x,y,u,v)=>({r:PAL.cRed,v:.72-u*.4+(1-v)*.1+(Math.floor(v*5)%2?.04:-.03),dt:.05}));blob(35,14,9,6,PAL.cRed,{bias:.1,dt:.1});blob(31,11,4,2,PAL.cRed,{bias:.5,dt:.1});
  poly([[30,72],[40,72],[40,60],[35,56],[30,60]],(x,y,u,v)=>({r:PAL.cWood,v:.5-u*.2+(1-v)*.1,dt:.05}));P(38,66,'#ffe488');
  poly([[31,48],[39,48],[39,40],[31,40]],(x,y,u,v)=>({r:PAL.cWater,v:.78-v*.2,dt:.05}));tube(35,40,35,48,.5,PAL.cWood);tube(31,44,39,44,.5,PAL.cWood);
  leaves(18,77,10,3,PAL.cLeaf,26,{bias:.0});leaves(52,77,10,3,PAL.cLeaf,26,{bias:-.05});
  [[10,78],[60,78],[18,74],[52,74],[26,80]].forEach(p=>{P(p[0],p[1],'#ffffff');P(p[0],p[1]-1,'#ffc9dc');P(p[0]+1,p[1],'#ffe27a');});};
 const wmBlades=(a,hx,hy)=>{const{tube,gsph,P}=a;
  [[1,-1],[1,1],[-1,1],[-1,-1]].forEach(d=>{const L=.7071,dx=d[0]*L,dy=d[1]*L,nx=-dy,ny=dx;
   for(let t=6;t<=30;t++)for(let w=1.2;w<=6.8;w+=.7){const x=hx+dx*t+nx*w,y=hy+dy*t+ny*w,lat=(t%4===0)||(Math.abs(w-6.6)<.4)||Math.abs(w-3.7)<.3;P(x,y,lat?'#a98a5a':(w<4?'#fffaf0':'#e6d6b6'));}
   tube(hx,hy,hx+dx*31,hy+dy*31,1.2,PAL.cWood,{spec:1});});
  gsph(hx,hy,3.8,()=>PAL.cWood);gsph(hx,hy,1.8,()=>PAL.cGold);};
 const balloon=(a,cx,cy,rx,ry,ramp)=>{a.gell(cx,cy,rx,ry,()=>ramp,{dt:.08});a.poly([[cx-1.6,cy+ry-.4],[cx+1.6,cy+ry-.4],[cx+.4,cy+ry+2.4],[cx-.4,cy+ry+2.4]],(x,y,u,v)=>({r:ramp,v:.3+(1-v)*.2,dt:.05}));};
 function rng(seed){let a=seed>>>0||1;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 const BAY=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
 const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
 function mk(w,h,draw,o){o=o||{};
  const W=w+2,H=h+2,px=new Array(W*H).fill(null),R=rng(o.seed||7);
  const put=(x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=W||y>=H)return;px[y*W+x]=c;};
  // 단계 고르기: v(0 어두움~1 밝음)에 도트 무늬(디더)를 살짝 섞어요
  const pick=(ramp,v,x,y,dt)=>{const n=ramp.length-1,t=v*n+((BAY[y&3][x&3]/16)-.47)*(dt==null?.55:dt);return ramp[cl(Math.round(t),0,n)];};
  const LX=-.52,LY=-.66,LZ=.54;
  const api={
   P:(x,y,c)=>put(x+1,y+1,typeof c==='string'?H2(c):c),
   // 둥근 덩어리(공)
   blob:(cx,cy,rx,ry,ramp,op)=>{op=op||{};cx+=1;cy+=1;const bias=op.bias||0,dt=op.dt;
    for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){
     const nx=(x+.5-cx)/rx,ny=(y+.5-cy)/ry,d=nx*nx+ny*ny;if(d>1)continue;const nz=Math.sqrt(1-d);
     let v=nx*LX+ny*LY+nz*LZ;v=cl(v*.62+.42+bias,0,1);if(op.keep&&px[y*W+x]&&d>.62)continue;put(x,y,pick(ramp,v,x,y,dt));}},
   // 칠하는 색을 자리마다 바꿀 수 있는 구 (f가 램프/색을 돌려줘요)
   sph:(cx,cy,r,f,op)=>{op=op||{};cx+=1;cy+=1;const bias=op.bias||0,dt=op.dt;
    for(let y=Math.floor(cy-r);y<=Math.ceil(cy+r);y++)for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++){
     const nx=(x+.5-cx)/r,ny=(y+.5-cy)/r,d=nx*nx+ny*ny;if(d>1)continue;const nz=Math.sqrt(1-d);
     const q=f(nx,ny,x,y);if(!q)continue;if(typeof q==='string'){put(x,y,H2(q));continue;}
     let v=nx*LX+ny*LY+nz*LZ;v=cl(v*.62+.42+bias,0,1);put(x,y,pick(q,v,x,y,dt));}},
   sh:(x,y,ramp,v,dt)=>put(x+1,y+1,pick(ramp,cl(v,0,1),x+1,y+1,dt)),
   // 세운 기둥(왼쪽이 밝아요)
   cyl:(x0,y0,ww,hh,ramp,op)=>{op=op||{};x0+=1;y0+=1;for(let y=y0;y<y0+hh;y++)for(let x=x0;x<x0+ww;x++){const u=(x-x0+.5)/ww;let v=1-u*1.05;v=cl(v*.8+.18+(op.bias||0),0,1);put(x,y,pick(ramp,v,x,y,op.dt==null?.4:op.dt));}},
   // 평평한 면 (밝기 고정)
   rect:(x0,y0,ww,hh,ramp,v,op)=>{op=op||{};x0+=1;y0+=1;for(let y=y0;y<y0+hh;y++)for(let x=x0;x<x0+ww;x++)put(x,y,pick(ramp,v+(op.grad?((y-y0)/hh-.5)*op.grad:0),x,y,op.dt==null?.35:op.dt));},
   // 삼각 지붕 (왼쪽 면이 밝아요): apex(ax,ay), 밑 y, 반폭 hw
   roof:(ax,ay,by,hw,ramp)=>{ax+=1;ay+=1;by+=1;for(let y=ay;y<=by;y++){const t=(y-ay)/(by-ay),half=Math.round(hw*t);for(let x=-half;x<=half;x++){const u=half?x/half:0;let v=u<0?.82-t*.1:.42-t*.06;put(ax+x,y,pick(ramp,v,ax+x,y,.2));}}},
   line:(x0,y0,x1,y1,c,t)=>{c=typeof c==='string'?H2(c):c;t=t||1;x0+=1;y0+=1;x1+=1;y1+=1;const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n;for(let a=0;a<t;a++)for(let b=0;b<t;b++)put(x+a,y+b,c);}},
   // ── 엔진 v2: 광택 구 / 다각형 / 튜브 / 잎 덤불 / 풀잎 ──
   gsph:(cx,cy,r,f,op)=>{op=op||{};cx+=1;cy+=1;const bias=op.bias||0;
    for(let y=Math.floor(cy-r);y<=Math.ceil(cy+r);y++)for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++){
     const nx=(x+.5-cx)/r,ny=(y+.5-cy)/r,d=nx*nx+ny*ny;if(d>1)continue;const nz=Math.sqrt(1-d);
     const q=f(nx,ny,x-1,y-1,nz);if(!q)continue;if(typeof q==='string'){put(x,y,H2(q));continue;}
     const raw=nx*LX+ny*LY+nz*LZ;let v=cl(raw*.66+.4+bias,0,1);
     const bn=-nx*LX*.7-ny*LY*.7;if(bn>.5&&nz<.66)v=Math.min(1,v+.16+(bn-.5)*.3);
     if(op.spec!==0){if(raw>.965){put(x,y,[255,255,255]);continue;}if(raw>.915)v=Math.min(1,v+.14);}
     put(x,y,pick(q,v,x,y,op.dt==null?.1:op.dt));}},
   gell:(cx,cy,rx,ry,f,op)=>{op=op||{};cx+=1;cy+=1;const bias=op.bias||0;for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){const nx=(x+.5-cx)/rx,ny=(y+.5-cy)/ry,d=nx*nx+ny*ny;if(d>1)continue;const nz=Math.sqrt(1-d);const q=f(nx,ny,x-1,y-1,nz);if(!q)continue;if(typeof q==='string'){put(x,y,H2(q));continue;}const raw=nx*LX+ny*LY+nz*LZ;let v=cl(raw*.66+.4+bias,0,1);const bn=-nx*LX*.7-ny*LY*.7;if(bn>.5&&nz<.66)v=Math.min(1,v+.16+(bn-.5)*.3);if(op.spec!==0){if(raw>.965){put(x,y,[255,255,255]);continue;}if(raw>.915)v=Math.min(1,v+.14);}put(x,y,pick(q,v,x,y,op.dt==null?.1:op.dt));}},
   poly:(pts,fn)=>{let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;pts.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);});
    const n=pts.length;for(let y=Math.floor(y0);y<=Math.ceil(y1);y++)for(let x=Math.floor(x0);x<=Math.ceil(x1);x++){
     const px_=x+.5,py_=y+.5;let c=false;for(let i=0,j=n-1;i<n;j=i++){const xi=pts[i][0],yi=pts[i][1],xj=pts[j][0],yj=pts[j][1];if((yi>py_)!==(yj>py_)&&px_<(xj-xi)*(py_-yi)/(yj-yi)+xi)c=!c;}
     if(!c)continue;const q=fn(x,y,(x+.5-x0)/Math.max(1,x1-x0),(y+.5-y0)/Math.max(1,y1-y0));if(!q)continue;
     if(typeof q==='string')put(x+1,y+1,H2(q));else if(q.r)put(x+1,y+1,pick(q.r,cl(q.v,0,1),x+1,y+1,q.dt==null?.1:q.dt));else put(x+1,y+1,q);}},
   tube:(x0,y0,x1,y1,r,ramp,op)=>{op=op||{};const dx=x1-x0,dy=y1-y0,L2=dx*dx+dy*dy||1,L=Math.sqrt(L2),nx=-dy/L,ny=dx/L;
    for(let y=Math.floor(Math.min(y0,y1)-r);y<=Math.ceil(Math.max(y0,y1)+r);y++)for(let x=Math.floor(Math.min(x0,x1)-r);x<=Math.ceil(Math.max(x0,x1)+r);x++){
     const qx0=x+.5-x0,qy0=y+.5-y0;const t=cl((qx0*dx+qy0*dy)/L2,0,1),qx=qx0-dx*t,qy=qy0-dy*t,d=Math.hypot(qx,qy);if(d>r)continue;
     const off=cl((qx*nx+qy*ny)/r,-1,1),nz=Math.sqrt(Math.max(0,1-off*off)),raw=off*nx*LX+off*ny*LY+nz*LZ;let v=cl(raw*.66+.4+(op.bias||0),0,1);
     if(op.spec&&raw>.9)v=1;put(x+1,y+1,pick(ramp,v,x+1,y+1,op.dt==null?.1:op.dt));}},
   leaves:(cx,cy,rx,ry,ramp,n,op)=>{op=op||{};const arr=[];for(let i=0;i<n;i++){const an=R()*6.283,rr=Math.sqrt(R());arr.push([cx+Math.cos(an)*rx*rr,cy+Math.sin(an)*ry*rr,R()]);}
    arr.sort((p,q)=>p[1]-q[1]);arr.forEach(([x,y,r0])=>{const nx=(x-cx)/rx,ny=(y-cy)/ry;let v=.52-nx*.2-ny*.34+(r0-.5)*.22+(op.bias||0);
     const X=Math.round(x),Y=Math.round(y);api.sh(X,Y,ramp,v,.05);api.sh(X-1,Y,ramp,v-.06,.05);api.sh(X+1,Y,ramp,v-.16,.05);api.sh(X,Y-1,ramp,v+.2,.05);if(r0>.6)api.sh(X,Y+1,ramp,v-.24,.05);if(r0<.2)api.sh(X-1,Y-1,ramp,v+.3,.05);});},
   blade:(x,y,hh,lean,wd,ramp,v0)=>{v0=v0==null?.5:v0;const pts=[[x-wd/2,y],[x-wd*.38+lean*.35,y-hh*.5],[x+lean,y-hh],[x+wd*.38+lean*.35,y-hh*.5],[x+wd/2,y]];
    api.poly(pts,(px_,py_,u,v)=>({r:ramp,v:v0+(1-v)*.28+(u<.5?.14:-.1)}));},
   rnd:R,W:w,H:h
  };
  draw(api);
  if(o.rim){const cp=px.slice(),mx=(c,t,k)=>[Math.round(c[0]+(t[0]-c[0])*k),Math.round(c[1]+(t[1]-c[1])*k),Math.round(c[2]+(t[2]-c[2])*k)];
   for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,c=cp[i];if(!c)continue;
    const Lf=x>0?cp[i-1]:null,Up=y>0?cp[i-W]:null,Rt=x<W-1?cp[i+1]:null,Dn=y<H-1?cp[i+W]:null;
    if(!Lf||!Up)px[i]=mx(c,[255,246,214],.3);else if(!Rt||!Dn)px[i]=mx(c,[38,24,70],.18);}}
  // 테두리: 이웃한 칠한 색을 어둡게 (보라빛을 살짝 섞어 부드럽게)
  const out=new Array(W*H).fill(null);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=px[y*W+x];if(c){out[y*W+x]=c;continue;}
   let n=0,r=0,g=0,b=0;[[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const xx=x+d[0],yy=y+d[1];if(xx<0||yy<0||xx>=W||yy>=H)return;const q=px[yy*W+xx];if(q){n++;r+=q[0];g+=q[1];b+=q[2];}});
   if(n){const k=y>0&&px[(y-1)*W+x]?.46:.55;out[y*W+x]=[Math.round((r/n)*k*.82+46*.18),Math.round((g/n)*k*.82+30*.18),Math.round((b/n)*k*.82+62*.18)];}}
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');
  if(o.v2&&o.shadow!==0){const cx=W/2+W*.05,cy=H-2.6,rx=(o.sw||w*.44);[[0,2.6,.3],[2,3.6,.18],[4,4.6,.1]].forEach(([ex,ry,al])=>{g.fillStyle=`rgba(22,46,52,${al})`;for(let y=H-8;y<H;y++)for(let x=0;x<W;x++){const dx=(x+.5-cx)/(rx+ex),dy=(y+.5-cy)/ry;if(dx*dx+dy*dy<=1)g.fillRect(x,y,1,1);}});}
  else if(o.shadow!==0){g.fillStyle='rgba(28,70,38,.26)';const cx=W/2,cy=H-2.4,rx=(o.sw||w*.44),ry=2.6;for(let y=H-6;y<H;y++)for(let x=0;x<W;x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry;if(dx*dx+dy*dy<=1)g.fillRect(x,y,1,1);}
   g.fillStyle='rgba(28,70,38,.16)';for(let y=H-6;y<H;y++)for(let x=0;x<W;x++){const dx=(x+.5-cx)/(rx+2),dy=(y+.5-cy)/(ry+1.2);if(dx*dx+dy*dy<=1)g.fillRect(x,y,1,1);}}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=out[y*W+x];if(c){g.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`;g.fillRect(x,y,1,1);}}
  if(o.tufts){const R2=rng((o.seed||7)*31+5),GC=['#2f6b4f','#3f8c57','#62b363','#8ad378'],FC=['#ffc9dc','#ffffff','#ffe27a','#c9b6ff'];
   const n=o.tufts,by=H-3;for(let i=0;i<n;i++){const x=2+Math.floor(R2()*(W-4)),y=by+Math.floor(R2()*2),hh=2+Math.floor(R2()*3),front=R2()<.35;
    if(!front&&out[(y)*W+x])continue;if(front&&out[y*W+x]&&y<H-2)continue;
    for(let k=0;k<hh;k++){const yy=y-k;if(yy<0||(out[yy*W+x]&&!front))continue;g.fillStyle=GC[Math.min(3,1+k-(k===hh-1?0:0))];g.fillRect(x,yy,1,1);if(k===hh-1&&hh>2&&R2()<.5){g.fillStyle=GC[3];g.fillRect(x+(R2()<.5?-1:1),yy+1,1,1);}}
    if(R2()<.18){const fx=x+(R2()<.5?-2:2),fy=y-1;if(fx>0&&fx<W&&!out[fy*W+fx]){g.fillStyle='#3f8c57';g.fillRect(fx,fy+1,1,1);g.fillStyle=FC[Math.floor(R2()*4)];g.fillRect(fx,fy,1,1);}}}}
  return{url:cv.toDataURL('image/png'),w:W,h:H};}
 const art={
  // 참나무
  tree:()=>mk(70,78,a=>{const{blob,poly,tube,P,leaves,line,gsph}=a,R2=a.rnd,Wd=PAL.cWood;
   const rt=pts=>poly(pts,(x,y,u,v)=>({r:Wd,v:.62+(1-v)*.1-u*.2,dt:.05}));
   rt([[30,66],[24,71],[14,76],[8,77],[18,78],[28,75],[34,71]]);rt([[42,66],[48,71],[58,76],[64,77],[54,78],[44,75],[40,71]]);
   poly([[29,72],[43,72],[42,56],[40,40],[32,40],[30,56]],(x,y,u,v)=>({r:Wd,v:.7-u*.44+Math.sin(v*16+u*5)*.04,dt:.05}));
   for(let i=0;i<9;i++){const x=31+R2()*10;line(x,44+R2()*8,x+(R2()-.5)*2,58+R2()*10,'#3a2218',1);}
   tube(33,46,22,34,2,Wd);tube(39,46,50,32,2,Wd);
   leaves(35,32,32,18,PAL.cLeaf,300,{bias:-.28});leaves(18,30,16,12,PAL.cLeaf,150,{bias:-.1});leaves(52,29,16,12,PAL.cLeaf,150,{bias:-.14});
   leaves(35,16,22,12,PAL.cLeaf,170,{bias:.02});leaves(27,12,12,8,PAL.cLeaf,80,{bias:.16});leaves(44,11,10,7,PAL.cLeaf,60,{bias:.1});
   [[16,34],[54,38],[30,26],[44,22]].forEach(p=>{gsph(p[0],p[1],1.6,()=>PAL.cCop,{spec:0});});
   gsph(22,34,2.6,()=>PAL.cBlue,{spec:0});poly([[24,34],[27,35],[24,36]],()=>PAL.cFire[3]);P(21,33,'#ffffff');
   leaves(14,77,9,2.4,PAL.cMoss,18,{bias:.04});leaves(58,77,9,2.4,PAL.cMoss,18,{bias:-.04});
   [[8,74],[62,75],[20,78]].forEach(p=>{P(p[0],p[1],'#ffffff');P(p[0],p[1]-1,'#ffc9dc');P(p[0]+1,p[1],'#ffe27a');});
   for(let i=0;i<8;i++)sparkle(a,8+R2()*54,6+R2()*40,'#fff6c8','#d4ee62');
  },V2(85,34,5)),
  // 벚나무
  cherry:()=>mk(74,82,a=>{const{blob,poly,tube,P,leaves,line}=a,R2=a.rnd,Wd=PAL.cRock;
   poly([[29,74],[44,74],[42,58],[40,40],[32,40],[31,58]],(x,y,u,v)=>({r:PAL.cWood,v:.52-u*.3+Math.sin(v*14+u*4)*.04,dt:.05}));
   [[30,74,24,80],[43,74,50,80],[33,70,19,76],[40,70,54,76]].forEach(r=>tube(r[0],r[1],r[2],r[3],2.4,PAL.cWood,{bias:-.1}));
   for(let i=0;i<9;i++){const x=32+R2()*10;line(x,44+R2()*8,x+(R2()-.5)*2,58+R2()*10,'#2a1812',1);}
   tube(34,46,20,32,2,PAL.cWood);tube(40,46,54,30,2,PAL.cWood);tube(37,44,37,28,1.8,PAL.cWood);
   leaves(37,34,34,20,PAL.cPink,330,{bias:-.2});leaves(18,32,17,13,PAL.cPink,160,{bias:-.1});leaves(56,31,17,13,PAL.cPink,160,{bias:-.14});
   leaves(37,18,24,13,PAL.cPink,190,{bias:.04});leaves(28,14,13,8,PAL.cPink,90,{bias:.18});leaves(46,13,11,7,PAL.cPink,70,{bias:.12});
   for(let i=0;i<26;i++){const x=6+R2()*62,y=22+R2()*52;P(x,y,i%3?'#ffc9dc':'#fff0f5');if(i%4===0)P(x+1,y+1,'#ffa8d4');}
   blob(37,79,26,3,PAL.cPink,{bias:-.2,dt:.1});for(let i=0;i<22;i++)P(12+R2()*50,76+R2()*3,i%2?'#ffc9dc':'#fff0f5');
   for(let i=0;i<8;i++)sparkle(a,8+R2()*58,6+R2()*40,'#ffffff','#ffd2e8');
  },V2(86,34,4)),
  // 꽃밭
  bed:()=>mk(52,32,a=>{const{blob,leaves,gsph,poly,P,tube}=a,R2=a.rnd;
   blob(26,24,24,6.6,PAL.cWood,{bias:-.5,dt:.1});blob(26,22,22,5,PAL.cWood,{bias:-.1,dt:.1});
   leaves(26,20,23,7,PAL.cLeaf,110,{bias:-.12});
   const cs=[PAL.cPink,PAL.cGold,PAL.cWhite,PAL.cRed,PAL.cBlue,PAL.cPur];const fl=[];for(let i=0;i<16;i++)fl.push([5+R2()*42,7+R2()*14,i%6,i%3]);
   fl.sort((p,q)=>p[1]-q[1]).forEach(f=>{tube(f[0],f[1]+3,f[0]+(R2()-.5)*1.5,f[1]+8,.5,PAL.cLeaf);fw(a,f[0],f[1],cs[f[2]],f[3]);});
   [[5,27],[12,29],[21,30],[31,30],[40,29],[47,27]].forEach((s,i)=>blob(s[0],s[1],4,2.6,PAL.cStone,{bias:(i%2?-.18:.04),dt:.1}));
   poly([[40,6],[44,3],[43,8]],(x,y,u,v)=>({r:PAL.cPink,v:.8-u*.3}));poly([[40,6],[36,3],[37,8]],(x,y,u,v)=>({r:PAL.cPink,v:.6}));P(40,6,'#3a2418');
  },V2(81,26,3)),
  // 해바라기
  sun:()=>mk(46,60,a=>{const{tube,poly,blob,P,leaves}=a;
   const leaf=(x,y,dir,s)=>poly([[x,y],[x+dir*s*.9,y-s*.5],[x+dir*s*1.5,y+s*.1],[x+dir*s*.8,y+s*.6]],(px,py,u,v)=>({r:PAL.cLeaf,v:.6+(1-v)*.2-u*.1,dt:.05}));
   tube(12,56,11,24,1.5,PAL.cLeaf);tube(24,56,25,14,1.7,PAL.cLeaf);tube(36,56,34,30,1.4,PAL.cLeaf);
   leaf(12,48,-1,7);leaf(11,38,1,6);leaf(25,46,1,8);leaf(24,34,-1,7);leaf(35,48,-1,6);leaf(34,41,1,5);
   sfHead(a,11,22,7.2,.2);sfHead(a,34,28,6,.5);sfHead(a,25,12,8.4,0);
   leaves(18,57,14,2.6,PAL.cMoss,24,{bias:.05});leaves(34,57,10,2.4,PAL.cMoss,18,{bias:0});
   poly([[28,9],[31,8],[30,11]],()=>({r:PAL.cGold,v:.9}));P(29,9,'#14101c');P(31,6,'#ffffff');P(32,7,'#e0f4ff');
  },V2(82,18,5)),
  // 버섯 가족
  mush:()=>mk(54,40,a=>{const{blob,leaves,P}=a;
   leaves(26,36,24,3.6,PAL.cMoss,50,{bias:-.1});
   mshr(a,38,35,6.4,9,PAL.cPink,[[-.35,-.15,1.3],[.3,-.35,1.1]]);
   mshr(a,14,35,8,11,PAL.cRed,[[-.4,-.1,1.8],[.25,-.45,1.5],[.5,-.05,1.2],[-.05,.1,1.1]]);
   mshr(a,26,36,9.6,12,PAL.cRed,[[-.5,-.1,2],[.1,-.5,2.2],[.5,-.15,1.7],[-.05,.1,1.4],[.3,.15,1.1]]);
   mshr(a,46,36,4.4,6,PAL.cRed,[[-.2,-.2,1]]);
   leaves(8,37,6,2,PAL.cLeaf,10,{bias:.1});
   [[4,10],[50,14],[30,3],[18,2]].forEach(p=>sparkle(a,p[0],p[1],'#fff6c8','#d4ee62'));
  },V2(83,24,5)),
  // 이끼 바위
  rock:()=>mk(38,26,a=>{const{blob,P,rnd}=a;
   blob(20,16,16,10,PAL.stone,{bias:-.05});blob(11,17,9,7,PAL.stone,{bias:-.02});blob(29,19,8,6,PAL.stone,{bias:-.12});blob(17,12,9,5.5,PAL.stone,{bias:.12});
   blob(14,8,8,3.6,PAL.moss,{});blob(22,7,6,3,PAL.moss,{bias:.08});blob(30,13,5,2.6,PAL.moss,{});
   for(let i=0;i<7;i++)P(8+rnd()*22,14+rnd()*8,'#6c7494');
   [[9,6],[27,19],[33,21]].forEach(g=>{a.P(g[0],g[1],'#98d77c');a.P(g[0]+1,g[1]-1,'#bdf09a');});},{seed:6,sw:17}),
  // 나무 의자
  bench:()=>mk(60,42,a=>{const{poly,tube,blob,leaves,P,line,gsph}=a,Wd=PAL.cWood,I=PAL.cIron;
   [[8,3],[50,3]].forEach(([x])=>{tube(x,3,x,36,1.3,I);});
   [[4,7],[10,12],[16,17]].forEach(([y0])=>poly([[5,y0],[55,y0],[55,y0+4],[5,y0+4]],(x,y,u,v)=>({r:Wd,v:.72-u*.1+(1-v)*.2+Math.sin(u*40+y)*.02,dt:.05})));
   poly([[5,23],[55,23],[58,28],[2,28]],(x,y,u,v)=>({r:Wd,v:.8-u*.1+(1-v)*.1+Math.sin(u*50)*.02,dt:.05}));
   poly([[2,28],[58,28],[58,32],[2,32]],(x,y,u,v)=>({r:Wd,v:.5+(1-v)*.15-u*.1,dt:.05}));
   tube(2,28,58,28,.9,Wd,{bias:.3});
   [[6,22],[54,22]].forEach(([x])=>{tube(x,21,x,28,1.3,I);});[[4,38],[56,38]].forEach(([x])=>tube(x,31,x,38,1.3,I));
   tube(3,21,10,21,1.2,I,{spec:1});tube(50,21,57,21,1.2,I,{spec:1});
   scroll(a,10,25,3.6,1.3,I,.7);scroll(a,50,25,3.6,1.3,I,.7);
   for(let x=10;x<52;x+=10){P(x,9,'#1c1a30');P(x,14,'#1c1a30');}
   leaves(8,40,8,2.2,PAL.cMoss,16,{bias:.04});leaves(54,40,8,2.2,PAL.cMoss,16,{bias:-.04});
   [[6,40],[52,40]].forEach(p=>{P(p[0],p[1],'#ffffff');P(p[0],p[1]-1,'#ffc9dc');P(p[0]+1,p[1],'#ffe27a');});
  },V2(87,28,4)),
  // 돌 등롱
  lamp:()=>mk(40,68,a=>{const{poly,tube,blob,gsph,P,leaves,line}=a,S=PAL.cStone;
   poly([[8,63],[32,63],[30,67],[10,67]],(x,y,u,v)=>({r:S,v:.7-u*.32+(1-v)*.1,dt:.05}));
   poly([[15,63],[25,63],[24,46],[16,46]],(x,y,u,v)=>({r:S,v:.7-u*.4+(Math.floor(v*4)%2?-.04:.04),dt:.05}));
   poly([[11,48],[29,48],[28,45],[12,45]],(x,y,u,v)=>({r:S,v:.82-u*.3,dt:.05}));
   poly([[12,45],[28,45],[28,31],[12,31]],(x,y,u,v)=>({r:S,v:.66-u*.36,dt:.05}));
   poly([[15,34],[25,34],[25,43],[15,43]],(x,y,u,v)=>({r:PAL.cGold,v:.55+(1-v)*.4,dt:.05}));tube(20,34,20,43,.6,S);tube(15,38,25,38,.6,S);
   poly([[3,31],[37,31],[30,22],[10,22]],(x,y,u,v)=>({r:S,v:.78-u*.34+(1-v)*.1,dt:.05}));tube(3,31,8,28,1.3,S);tube(37,31,32,28,1.3,S);
   poly([[11,22],[29,22],[24,15],[16,15]],(x,y,u,v)=>({r:S,v:.82-u*.34,dt:.05}));blob(20,14,4.4,2.6,S,{bias:.2,dt:.1});tube(20,12,20,9,.8,S);gsph(20,8,2.6,()=>PAL.cGold);
   leaves(13,64,5,2,PAL.cMoss,10,{bias:.02});leaves(27,47,5,1.8,PAL.cMoss,8,{bias:-.04});leaves(10,31,5,1.6,PAL.cMoss,8,{bias:.04});
   [[7,66],[33,66]].forEach(p=>{P(p[0],p[1],'#ffffff');P(p[0],p[1]-1,'#ffc9dc');});
  },V2(88,15,5)),
  // 텐트
  tent:()=>mk(68,56,a=>{const{poly,tube,blob,gsph,P,line}=a;
   poly([[34,6],[38,4],[66,42],[62,48]],(x,y,u,v)=>({r:PAL.cRed,v:.42-u*.1,dt:.05}));
   poly([[34,6],[62,48],[6,48]],(x,y,u,v)=>{const st=Math.floor((x-6)/7)%2===0;return{r:st?PAL.cCream:PAL.cRed,v:(st?.78:.62)-u*.2+(1-v)*.05,dt:.05};});
   poly([[34,20],[43,48],[25,48]],(x,y,u,v)=>({r:PAL.cInk,v:.12+v*.1,dt:.05}));poly([[34,30],[40,48],[28,48]],(x,y,u,v)=>({r:PAL.cFire,v:.3+v*.5,dt:.05}));gsph(34,38,2.4,()=>PAL.cGold,{spec:0});
   poly([[34,17],[35.6,20],[28,48],[22,48]],(x,y,u,v)=>({r:PAL.cCream,v:.9-u*.2,dt:.05}));poly([[34,17],[32.4,20],[40,48],[46,48]],(x,y,u,v)=>({r:PAL.cCream,v:.6-u*.2,dt:.05}));
   gsph(27,34,1.3,()=>PAL.cGold,{spec:0});gsph(41,34,1.3,()=>PAL.cGold,{spec:0});
   tube(34,6,34,-1,.8,PAL.cWood);poly([[34,-1],[41,1],[34,3]],(x,y,u,v)=>({r:PAL.cRed,v:.8-u*.3}));
   [[8,42,2,52],[60,44,66,52]].forEach(r=>{line(r[0],r[1],r[2],r[3],'#e8d8b8',1);tube(r[2],r[3],r[2],r[3]-3,.7,PAL.cWood);});
   blob(34,49,28,2.2,PAL.cMoss,{bias:-.3,dt:.1});
  },V2(89,28,6)),
  // 오두막
  house:()=>mk(78,72,a=>{const{poly,tube,blob,gsph,P,leaves,line}=a,Wd=PAL.cWood;
   poly([[10,62],[68,62],[68,69],[10,69]],(x,y,u,v)=>({r:PAL.cStone,v:.62-u*.28+(((Math.floor(x/6)+Math.floor(y/3))%2)?.06:-.05),dt:.05}));
   poly([[12,34],[66,34],[66,62],[12,62]],(x,y,u,v)=>({r:PAL.cCream,v:.82-u*.26-v*.04+(Math.sin(x*3+y)*.015),dt:.05}));
   [[12,34,12,62],[66,34,66,62],[39,34,39,62],[12,48,66,48]].forEach(t=>tube(t[0],t[1],t[2],t[3],1,Wd));tube(12,62,22,48,.8,Wd);tube(66,62,56,48,.8,Wd);
   poly([[3,38],[39,8],[75,38],[69,38],[39,15],[9,38]],(x,y,u,v)=>({r:PAL.cTeal,v:.8-u*.2,dt:.05}));
   poly([[3,38],[39,8],[75,38]],(x,y,u,v)=>{const row=Math.floor(y/4),col=Math.floor((x+(row%2)*3)/6),sc=(Math.floor(y)%4===0);return{r:PAL.cTeal,v:(sc?.34:.66+(col%3)*.04)-u*.2+(1-v)*.18,dt:.05};});
   poly([[3,38],[75,38],[73,40],[5,40]],()=>({r:PAL.cInk,v:.4}));poly([[10,40],[68,40],[68,43],[10,43]],()=>({r:PAL.cCream,v:.3}));
   poly([[52,12],[62,12],[62,28],[52,28]],(x,y,u,v)=>({r:PAL.cRed,v:.6-u*.3+(((Math.floor(x/3)+Math.floor(y/3))%2)?.05:-.04),dt:.05}));poly([[50,10],[64,10],[64,13],[50,13]],(x,y,u,v)=>({r:PAL.cStone,v:.8-u*.3}));
   [[56,6,3.6],[59,1,3],[56,-3,2.4]].forEach(p=>blob(p[0],p[1],p[2],p[2]*.8,PAL.cWhite,{bias:.1,dt:.1}));
   gsph(39,24,5,()=>PAL.cWater,{spec:1});tube(34,24,44,24,.6,Wd);tube(39,19,39,29,.6,Wd);
   poly([[32,62],[46,62],[46,48],[39,41],[32,48]],(x,y,u,v)=>({r:Wd,v:.6-u*.26+(Math.floor(x/3)%2?.04:-.03),dt:.05}));gsph(43,55,1.3,()=>PAL.cGold,{spec:0});
   poly([[28,62],[50,62],[52,66],[26,66]],(x,y,u,v)=>({r:PAL.cStone,v:.74-u*.3}));
   const win=(x0)=>{poly([[x0,44],[x0+11,44],[x0+11,56],[x0,56]],(x,y,u,v)=>({r:PAL.cWater,v:.84-v*.3-u*.1,dt:.05}));tube(x0+5.5,44,x0+5.5,56,.6,Wd);tube(x0,50,x0+11,50,.6,Wd);
    poly([[x0,44],[x0+3,44],[x0+1,50]],()=>({r:PAL.cPink,v:.7}));poly([[x0+11,44],[x0+8,44],[x0+10,50]],()=>({r:PAL.cPink,v:.5}));
    poly([[x0-3,43],[x0,43],[x0,57],[x0-3,57]],(x,y,u,v)=>({r:PAL.cTeal,v:.6+(1-v)*.1}));poly([[x0+11,43],[x0+14,43],[x0+14,57],[x0+11,57]],(x,y,u,v)=>({r:PAL.cTeal,v:.4+(1-v)*.1}));
    poly([[x0-2,57],[x0+13,57],[x0+13,60],[x0-2,60]],(x,y,u,v)=>({r:Wd,v:.66-u*.2}));[0,3,6,9].forEach((k,i)=>fw(a,x0+k,56,[PAL.cPink,PAL.cGold,PAL.cWhite,PAL.cRed][i],i%3));};
   win(17);win(50);
   tube(48,48,48,52,.4,Wd);tube(50,52,50,52,.4,Wd);gsph(48,54,1.8,()=>PAL.cGold);tube(48,50,48,54,.5,PAL.cIron);
   leaves(10,62,9,5,PAL.cLeaf,50,{bias:0});leaves(70,62,9,5,PAL.cLeaf,50,{bias:-.06});leaves(13,48,3,10,PAL.cLeaf,26,{bias:.08});
   [[6,64],[72,64],[14,67],[64,67]].forEach(p=>{P(p[0],p[1],'#ffffff');P(p[0],p[1]-1,'#ffc9dc');P(p[0]+1,p[1],'#ffe27a');});
  },V2(90,38,5)),
  // 분수
  fount:()=>mk(68,62,a=>{const{poly,tube,blob,gsph,P,line,leaves}=a,S=PAL.cStone,R2=a.rnd;
   blob(34,53,32,8.4,S,{bias:-.32,dt:.1});blob(34,51,31,8.4,S,{bias:.1,dt:.1});blob(34,51,27,6.4,PAL.cWater,{bias:-.1,dt:.1});blob(28,50,16,2.4,PAL.cWater,{bias:.4,dt:.1});
   poly([[28,50],[40,50],[38,32],[30,32]],(x,y,u,v)=>({r:S,v:.7-u*.4+(Math.floor(u*4)%2?-.05:.05),dt:.05}));
   blob(34,33,18,5.4,S,{bias:-.2,dt:.1});blob(34,31.4,18,5.2,S,{bias:.16,dt:.1});blob(34,31.6,14.6,3.6,PAL.cWater,{bias:-.05,dt:.1});blob(30,31,7,1.2,PAL.cWater,{bias:.55,dt:.1});
   tube(34,31,34,19,2.6,S,{spec:1});
   blob(34,19,10,3.2,S,{bias:-.2,dt:.1});blob(34,17.6,10,3,S,{bias:.15,dt:.1});blob(34,17.8,7.8,2,PAL.cWater,{bias:0,dt:.1});
   tube(34,17,34,10,1.4,S);gsph(34,8,3,()=>S,{spec:1});
   [[-1,.8],[-.6,1],[0,1.1],[.6,1],[1,.8]].forEach(([dx,k])=>{let pp=[34,7];for(let t=1;t<=10;t++){const x=34+dx*t*1.5,y=7-6*t/10*k+t*t*.14;tube(pp[0],pp[1],x,y,.55,PAL.cWater,{bias:.35});if(t%3===0)P(x,y,'#ffffff');pp=[x,y];}});
   [24,44].forEach(x=>{for(let y=19;y<31;y+=1)P(x+(y%2?0:.5),y,y%3?'#92d8fa':'#ffffff');});
   [19,49].forEach(x=>{for(let y=32;y<50;y+=1)P(x+(R2()<.3?.5:0),y,y%3?'#56b4ee':'#d8f4ff');});
   [[18,50],[50,50],[26,31],[43,31]].forEach(p=>{blob(p[0],p[1],3,1.2,PAL.cWhite,{bias:.15,dt:.1});});
   blob(46,53,4,1.6,PAL.cLeaf,{bias:0,dt:.1});blob(45,52.6,1.4,1,PAL.cPink,{bias:.3,dt:.1});
   for(let i=0;i<10;i++)sparkle(a,10+R2()*48,2+R2()*40,'#ffffff','#d8f4ff');
   leaves(6,56,5,2,PAL.cMoss,10,{bias:.05});
  },V2(91,34,4)),
  // 풍선 세 개
  ball:()=>mk(48,76,a=>{const{tube,poly,P,gsph,blob}=a;
   let pp=[24,50];[[13,38,PAL.cBlue],[34,32,PAL.cGold],[23,26,PAL.cRed]];
   const bl=[[13,30,10,12,PAL.cBlue,[24,58]],[35,26,10,12,PAL.cGold,[24,58]],[24,20,11,13.5,PAL.cRed,[24,58]]];
   bl.forEach(b=>{tube(b[0],b[1]+b[3]+2,b[5][0],b[5][1],.45,PAL.cCream);});
   tube(24,58,24,62,.5,PAL.cCream);tube(24,62,27,66,.5,PAL.cCream);tube(27,66,24,70,.5,PAL.cCream);
   poly([[24,58],[18,55],[18,61]],(x,y,u,v)=>({r:PAL.cRed,v:.7-u*.2}));poly([[24,58],[30,55],[30,61]],(x,y,u,v)=>({r:PAL.cRed,v:.5}));blob(24,58,1.5,1.5,PAL.cRed,{bias:.1,dt:.1});
   bl.forEach(b=>balloon(a,b[0],b[1],b[2],b[3],b[4]));
   [[8,8],[42,12],[6,40],[43,40]].forEach(p=>sparkle(a,p[0],p[1],'#ffffff','#e0f4ff'));
  },V2(92,0,0,{shadow:0})),
  // ───── 포켓몬 꾸미기 용품 ─────
  ball_poke:()=>mk(32,33,a=>{const ink=PAL.cInk,W=PAL.cWhite;
   a.gsph(16,15,14,(nx,ny)=>{const d=Math.hypot(nx,ny);if(d<.22)return W;if(d<.4)return ink;if(Math.abs(ny)<.1)return ink;return ny<0?PAL.cRed:W;},{bias:-.1});
   a.P(15,15,'#ffffff');},V2(21,15,6)),
  ball_great:()=>mk(32,33,a=>{const ink=PAL.cInk,W=PAL.cWhite;
   a.gsph(16,15,14,(nx,ny)=>{const d=Math.hypot(nx,ny);if(d<.22)return W;if(d<.4)return ink;if(Math.abs(ny)<.1)return ink;
    if(ny<-.16&&ny>-.74&&Math.abs(nx)>.46&&Math.abs(nx)<.84&&Math.abs(nx)+(-ny)*.3<1)return PAL.cRed;return ny<0?PAL.cBlue:W;},{bias:-.1});},V2(22,15,6)),
  ball_ultra:()=>mk(32,33,a=>{const ink=PAL.cInk,W=PAL.cWhite;
   a.gsph(16,15,14,(nx,ny)=>{const d=Math.hypot(nx,ny);if(d<.22)return W;if(d<.4)return ink;if(Math.abs(ny)<.1)return ink;
    if(ny<-.14&&ny>-.8&&((Math.abs(nx)>.42&&Math.abs(nx)<.6)||(ny<-.5&&Math.abs(nx)<.34)))return PAL.cGold;return ny<0?ink:W;},{bias:-.02});},V2(23,15,6)),
  ball_master:()=>mk(32,33,a=>{const ink=PAL.cInk,W=PAL.cWhite;
   a.gsph(16,15,14,(nx,ny)=>{const d=Math.hypot(nx,ny);if(d<.22)return W;if(d<.4)return ink;if(Math.abs(ny)<.1)return ink;
    if(ny<0&&Math.hypot(Math.abs(nx)-.55,ny+.42)<.22)return PAL.cPink;return ny<0?PAL.cPur:W;},{bias:-.1});
   [[4,5],[27,9],[6,25],[28,24]].forEach(s=>{a.P(s[0],s[1],'#ffffff');a.P(s[0]-1,s[1],'#e8d8ff');a.P(s[0]+1,s[1],'#e8d8ff');a.P(s[0],s[1]-1,'#e8d8ff');a.P(s[0],s[1]+1,'#e8d8ff');});},V2(24,15,6)),
  // 간식 바구니
  basket:()=>mk(46,38,a=>{const{poly,tube,gsph,blob,P,sh}=a,S=PAL.cStraw;
   // 손잡이
   for(let i=0;i<22;i++){const t0=i/22,t1=(i+1)/22,pt=t=>[8+30*t,17-15*Math.sin(Math.PI*t)];const p0=pt(t0),p1=pt(t1);a.tube(p0[0],p0[1],p1[0],p1[1],1.9,S,{bias:(i%4<2?.05:-.1)});}
   // 과일
   gsph(15,14,5.4,()=>PAL.cRed);P(15,8,'#3a2a18');P(16,7,'#3a2a18');poly([[16,7],[20,5],[19,9]],()=>({r:PAL.cLeaf,v:.6}));
   [[26,12,3.3],[31,10,3],[29,14,3.2]].forEach(b=>gsph(b[0],b[1],b[2],()=>PAL.cBlue));
   gsph(36,15,4.8,()=>PAL.cFire);
   // 몸통 (바구니 짜임)
   poly([[5,18],[41,18],[37,35],[9,35]],(x,y,u,v)=>{const row=Math.floor((y-18)/3),ph=(((x>>2)+row)&1),hl=((y-18)%3===0);return{r:S,v:.58+(ph?.12:-.05)+(hl?.14:0)-u*.34+(row%2?0:.03),dt:.05};});
   poly([[9,34],[37,34],[37,36],[9,36]],()=>({r:S,v:.12}));
   tube(4,18,42,18,2.3,S,{bias:.06});tube(8,35,38,35,1.6,S,{bias:-.2});
   // 냅킨
   poly([[7,19],[39,19],[37,25],[30,23],[22,28],[14,23],[9,26]],(x,y,u,v)=>{const ck=(((x>>2)+(y>>2))&1);return{r:ck?PAL.cRed:PAL.cWhite,v:.62+(ck?.0:.1)-u*.28+v*(-.08),dt:.05};});
  },V2(31,22,5)),
  // 열매 덤불
  berry:()=>mk(50,40,a=>{const{leaves,gsph,P,blob}=a;
   leaves(25,27,23,11,PAL.cLeaf,190,{bias:-.22});leaves(14,21,12,9,PAL.cLeaf,90,{bias:-.08});leaves(36,20,12,9,PAL.cLeaf,90,{bias:-.12});
   leaves(25,13,13,9,PAL.cLeaf,95,{bias:0});leaves(18,15,9,7,PAL.cLeaf,50,{bias:.14});
   const cs=[PAL.cRed,PAL.cBlue,PAL.cPink,PAL.cFire];
   [[10,22],[17,12],[26,15],[34,20],[40,25],[14,29],[23,24],[31,29],[7,29],[21,7],[35,12],[29,6],[44,19]].forEach((p,i)=>{gsph(p[0],p[1],2.8,()=>cs[i%4],{dt:.05});P(p[0],p[1]-3,'#2c5a30');P(p[0]+1,p[1]-3,'#468440');});
   [[12,16],[38,17],[24,20],[30,9]].forEach(p=>{P(p[0],p[1],'#ffffff');P(p[0]+1,p[1],'#fff0f5');P(p[0],p[1]-1,'#fff0f5');P(p[0],p[1]+1,'#ffe27a');});
  },V2(32,22,8)),
  // 진화의 돌 3종
  evo_fire:()=>stone2('fire',PAL.cFire,PAL.cFire,35,'#fff6c0'),
  evo_water:()=>stone2('drop',PAL.cWater,PAL.cWater,36,'#ffffff'),
  evo_thunder:()=>stone2('bolt',PAL.cGold,PAL.cGold,37,'#6a3a10'),
  // 발자국 판
  paw:()=>mk(50,30,a=>{const{blob,P,line,leaves,poly}=a,S=PAL.cStone;
   blob(25,20,23,8.5,S,{bias:-.42,dt:.1});blob(25,16.5,23,8.5,S,{bias:.12,dt:.1});blob(25,15.6,20.5,7,S,{bias:.2,dt:.1});
   const pad=(cx,cy,rx,ry)=>{blob(cx,cy,rx,ry,S,{bias:-.62,dt:.1});blob(cx+.9,cy+.9,rx-.4,ry-.4,S,{bias:-.28,dt:.1});};
   pad(25,19,6.4,4.2);[[15,13.5,2.5,3],[21.5,9.4,2.6,3.2],[28.5,9.4,2.6,3.2],[35,13.5,2.5,3]].forEach(p=>pad(p[0],p[1],p[2],p[3]));
   line(8,12,12,15,'#2a2a44',1);line(12,15,10,19,'#2a2a44',1);line(40,13,43,16,'#2a2a44',1);
   leaves(10,19,6,2.4,PAL.cMoss,18,{bias:.02});leaves(41,18,6,2.4,PAL.cMoss,18,{bias:-.05});leaves(25,25,10,2,PAL.cMoss,14,{bias:-.1});
   [[7,17],[44,20],[13,24]].forEach(p=>{P(p[0],p[1],'#ffffff');P(p[0],p[1]-1,'#ffc9dc');P(p[0]+1,p[1],'#ffe27a');});
  },V2(36,23,6)),
  // 노란 쥐 인형
  plush:()=>mk(36,42,a=>{crit2(a,1,2,PAL.cYel,{cheek:PAL.cRed,belly:1,tail:PAL.cYel,stitch:1,earIn:'#c8742a'});
   [[2,12],[32,6]].forEach(p=>{a.P(p[0],p[1],'#fff6c0');a.P(p[0]-1,p[1],'#ffe67e');a.P(p[0]+1,p[1],'#ffe67e');a.P(p[0],p[1]-1,'#ffe67e');});},V2(37,13,3)),
  // 센터 표지판
  sign:()=>mk(42,62,a=>{const{poly,tube,gsph,blob,P,leaves,line}=a,Wd=PAL.cWood;
   tube(21,60,21,26,2.4,Wd);tube(10,26,10,30,1,Wd);tube(32,26,32,30,1,Wd);
   // 지붕
   poly([[3,12],[21,2],[39,12],[37,14],[5,14]],(x,y,u,v)=>({r:PAL.cRed,v:.72-u*.3+(1-v)*.12+((Math.floor((x+y)/3))%2?.05:-.02),dt:.05}));
   tube(4,13,38,13,1.2,PAL.cGold,{spec:1});blob(21,2,1.7,1.7,PAL.cGold,{bias:.2});
   // 판
   poly([[5,15],[37,15],[37,36],[5,36]],(x,y,u,v)=>({r:Wd,v:.5+(1-v)*.25-u*.2}));
   poly([[7,17],[35,17],[35,34],[7,34]],(x,y,u,v)=>({r:PAL.cWhite,v:.82-u*.34-v*.12,dt:.05}));
   poly([[7,17],[35,17],[35,21],[7,21]],(x,y,u,v)=>({r:PAL.cRed,v:.6+(1-v)*.1-u*.2}));
   gsph(21,28,5.2,(nx,ny)=>{const d=Math.hypot(nx,ny);if(d<.24)return PAL.cWhite;if(d<.44)return PAL.cInk;if(Math.abs(ny)<.1)return PAL.cInk;return ny<0?PAL.cRed:PAL.cWhite;});
   [[10,24],[10,28],[31,24],[31,28]].forEach(p=>{P(p[0],p[1],'#b0acd0');P(p[0]+1,p[1],'#b0acd0');});
   leaves(21,58,13,3,PAL.cLeaf,34,{bias:-.05});
   [[12,56],[30,57],[18,58],[25,55]].forEach(p=>{P(p[0],p[1],'#ffc9dc');P(p[0],p[1]-1,'#ffffff');P(p[0]+1,p[1],'#ffe27a');});
  },V2(38,15,5)),
  // 회복 머신
  heal:()=>mk(50,48,a=>{const{poly,tube,gsph,blob,P,line}=a;
   poly([[3,42],[47,42],[45,46],[5,46]],(x,y,u,v)=>({r:PAL.cIron,v:.5+(1-v)*.3-u*.22}));
   poly([[5,16],[45,16],[45,42],[5,42]],(x,y,u,v)=>({r:PAL.cWhite,v:.86-u*.4-v*.1,dt:.05}));
   poly([[3,10],[47,10],[45,17],[5,17]],(x,y,u,v)=>({r:PAL.cPink,v:.74+(1-v)*.15-u*.34,dt:.05}));
   blob(25,8,10,5,PAL.cPink,{bias:.1,dt:.1});blob(23,6,5,2.2,PAL.cPink,{bias:.55,dt:.1});P(21,5,'#ffffff');P(22,5,'#ffffff');
   poly([[9,20],[41,20],[41,38],[9,38]],(x,y,u,v)=>({r:PAL.cInk,v:.2+v*.12}));
   poly([[10,21],[40,21],[40,37],[10,37]],(x,y,u,v)=>({r:PAL.cPink,v:.84-u*.2-v*.1,dt:.05}));
   const bf=(nx,ny)=>{const d=Math.hypot(nx,ny);if(d<.3)return PAL.cWhite;if(Math.abs(ny)<.12||d<.46)return PAL.cInk;return ny<0?PAL.cRed:PAL.cWhite;};
   [[17,26],[25,26],[33,26],[17,33],[25,33],[33,33]].forEach(b=>gsph(b[0],b[1],3.6,bf,{dt:.1}));
   [[7,19],[9,19]].forEach(p=>{P(p[0],p[1],'#bdf09a');});P(43,19,'#ffd9ee');P(43,21,'#bdf09a');
   tube(5,38,5,44,1,PAL.cIron);tube(45,38,45,44,1,PAL.cIron);
   P(25,13,'#ffffff');P(24,12,'#ffd9ee');P(26,12,'#ffd9ee');
  },V2(39,22,4)),
  // 풀숲
  grass:()=>mk(50,40,a=>{const{blade,blob,P,leaves,poly}=a,R2=a.rnd,G=PAL.cLeaf;
   leaves(25,33,22,5,G,60,{bias:-.4});
   for(let i=0;i<34;i++){const x=6+i*1.2+R2()*1;blade(x,34,13+R2()*9,(R2()-.5)*5,3.6,G,.08+R2()*.08);}
   [[19,21],[30,21]].forEach(p=>{for(let dx=-2;dx<=3;dx++)for(let dy=-1;dy<=2;dy++)if(Math.abs(dx-.5)+Math.abs(dy-.5)>3.2)P(p[0]+dx,p[1]+dy,'#7a6a10');
    for(let dx=0;dx<3;dx++)for(let dy=0;dy<2;dy++)P(p[0]+dx,p[1]+dy,'#fff08a');P(p[0]+1,p[1]+1,'#3a2410');P(p[0],p[1],'#ffffff');});
   for(let i=0;i<40;i++){const x=2+i*1.2+R2();const mid=Math.abs(x-25)<10;blade(x,35,mid?9+R2()*5:9+R2()*14,(R2()-.5)*7,3.6,G,.48+R2()*.16);}
   [[8,30],[42,31],[26,28]].forEach(p=>{P(p[0],p[1],'#ffc9dc');P(p[0],p[1]-1,'#ffffff');});
  },V2(40,22,0)),
  // 둥지와 알
  nest:()=>mk(50,36,a=>{const{blob,tube,P,poly,leaves}=a,S=PAL.cStraw,W=PAL.cWood,R2=a.rnd;
   blob(25,24,23,8.6,PAL.cStraw,{bias:-.45,dt:.1});
   for(let i=0;i<46;i++){const an=Math.PI*(1.0+R2()*1.0),rx=20+R2()*3.5,x=25+Math.cos(an)*rx,y=24+Math.sin(an)*-5.6+1;const x2=x+(R2()-.5)*10,y2=y-.5+(R2()-.5)*3;a.tube(x,y,x2,y2,.75+R2()*.5,R2()<.4?W:S,{bias:(R2()-.5)*.3});}
   blob(25,20.5,19,5.6,PAL.cStraw,{bias:-.6,dt:.1});
   const egg=(cx,cy,rx,ry,ramp,sp)=>{blob(cx,cy,rx,ry,ramp,{bias:.05,dt:.1});sp.forEach((s,i)=>{const x=cx+(R2()-.5)*rx*1.5,y=cy+(R2()-.2)*ry*1.2;P(x,y,s);P(x+1,y,s);});P(cx-rx*.45,cy-ry*.5,'#ffffff');P(cx-rx*.45+1,cy-ry*.5,'#ffffff');P(cx-rx*.45,cy-ry*.5+1,'#ffffff');};
   egg(18,18,5.6,7,PAL.cCream,['#6a98d8','#8ab4ec','#a67ad0']);egg(30,19.5,5,6.4,PAL.cWater,['#d8f4ff','#92d8fa','#ffffff']);egg(24.5,21,4.3,5.4,PAL.cPink,['#ffe0f0','#ffa8d4','#fff6c0']);
   for(let i=0;i<30;i++){const an=Math.PI*(.02+.96*R2()),x=25+Math.cos(an)*(18+R2()*5),y=24+Math.sin(an)*5.4+1.5;a.tube(x,y,x+(R2()-.5)*9,y-1-R2()*2,.8,R2()<.35?W:S,{bias:(R2()-.5)*.3});}
   poly([[40,28],[46,26],[44,29]],()=>({r:PAL.cWhite,v:.8}));
  },V2(41,22,6)),
  // 낚시 연못
  pond:()=>mk(70,46,a=>{const{blob,tube,P,line,leaves,poly,gsph}=a,R2=a.rnd,S=PAL.cStone,cx=35,cy=32;
   const rocks=[];for(let i=0;i<26;i++){const an=i/26*Math.PI*2,x=cx+Math.cos(an)*30.5,y=cy+Math.sin(an)*9.6,r=R2();rocks.push([x,y,3.4+r*1.6,2.4+r*1.2,.3+R2()*.4,Math.sin(an)]);}
   blob(cx,cy+2,31,10,PAL.cMoss,{bias:-.55,dt:.1});
   rocks.filter(r=>r[5]<0).forEach(r=>blob(r[0],r[1],r[2],r[3],S,{bias:r[4]-.5,dt:.1}));
   blob(cx,cy,27,7.8,PAL.cWater,{bias:-.2,dt:.1});blob(cx+1,cy+.8,21,5.4,PAL.cWater,{bias:-.4,dt:.1});blob(cx-6,cy-1.2,14,3,PAL.cWater,{bias:.35,dt:.1});blob(cx-10,cy-2,6,1.2,PAL.cWater,{bias:.7,dt:.1});
   for(let i=0;i<9;i++){const x=12+R2()*46,y=26+R2()*9;line(x,y,x+2+R2()*3,y,'#d8f4ff',1);}
   blob(47,33,5.4,2.2,PAL.cLeaf,{bias:.05,dt:.1});line(47,33,52,32,'#1f5c3a',1);blob(42,29,3.6,1.5,PAL.cLeaf,{bias:.0,dt:.1});blob(45,33,1.6,1.1,PAL.cPink,{bias:.25,dt:.1});P(45,33,'#fff6c0');
   rocks.filter(r=>r[5]>=0).forEach(r=>blob(r[0],r[1],r[2],r[3],S,{bias:r[4]-.12,dt:.1}));
   leaves(9,29,5,2.6,PAL.cMoss,18,{bias:.05});leaves(60,31,5,2.4,PAL.cMoss,16,{bias:-.02});
   [[8,26],[12,24],[6,29]].forEach((r,i)=>{tube(r[0],r[1]+9,r[0]+(i-1)*.8,r[1]-4-i*2,.8,PAL.cLeaf);if(i<2){tube(r[0]+(i-1)*.8,r[1]-4-i*2,r[0]+(i-1)*.8,r[1]-8-i*2,1.1,PAL.cWood);}});
   tube(5,41,18,10,1.1,PAL.cWood);tube(18,10,18,11,.6,PAL.cGold);line(18,11,29,31,'#e8f0f8',1);
   gsph(29,32,2.8,(nx,ny)=>ny<0?PAL.cRed:PAL.cWhite,{dt:.05});
   [[30,34],[31,34],[32,34],[28,35],[29,35],[30,35],[31,35],[32,35],[33,35]].forEach(p=>P(p[0],p[1],'#d8f4ff'));
   // 뛰어오르는 잉어
   blob(52,14,6.4,3.2,PAL.cFire,{bias:.05,dt:.1});blob(52.6,16,5,1.2,PAL.cWhite,{bias:.15,dt:.1});blob(50,13,2.2,1.4,PAL.cWhite,{bias:.1,dt:.1});
   poly([[46,14],[41,9],[40,12],[42,15],[40,18],[41,19]],(x,y,u,v)=>({r:PAL.cFire,v:.7-u*.3}));poly([[52,11],[55,8],[56,12]],()=>({r:PAL.cFire,v:.4}));
   P(56,13,'#14101c');P(55,12,'#ffffff');
   [[47,24],[55,24],[51,22],[44,26],[58,27],[49,27]].forEach(p=>P(p[0],p[1],'#ffffff'));[[51,29],[52,29],[53,29],[50,30],[54,30]].forEach(p=>P(p[0],p[1],'#bfe8ff'));
  },V2(42,30,6)),
  // 체육관 간판
  gymsign:()=>mk(54,64,a=>{const{poly,tube,gsph,blob,P,line}=a,Wd=PAL.cWood;
   tube(6,62,6,16,2.4,Wd);tube(48,62,48,16,2.4,Wd);blob(6,14,3.6,3,PAL.cGold,{bias:.1});blob(48,14,3.6,3,PAL.cGold,{bias:.1});
   tube(3,13,51,13,2.2,Wd);
   [[13,13],[41,13]].forEach(p=>{tube(p[0],13,p[0],18,.7,PAL.cGold);});
   const sh=[[11,18],[43,18],[43,42],[27,60],[11,42]],shi=[[13,20],[41,20],[41,41],[27,57],[13,41]];
   poly(sh,(x,y,u,v)=>({r:PAL.cGold,v:.7-u*.42+(1-v)*.15,dt:.05}));
   poly(shi,(x,y,u,v)=>({r:PAL.cBlue,v:.6+.1*Math.sin(u*10)-u*.22+(1-v)*.1,dt:.05}));
   poly([[13,20],[41,20],[41,24],[13,24]],(x,y,u,v)=>({r:PAL.cBlue,v:.82-u*.3,dt:.05}));
   gsph(27,36,7.4,(nx,ny)=>{const d=Math.hypot(nx,ny);if(d<.26)return PAL.cWhite;if(d<.44)return PAL.cInk;if(Math.abs(ny)<.1)return PAL.cInk;return ny<0?PAL.cRed:PAL.cWhite;});
   [[27,28]].forEach(p=>sparkle(a,27,26,'#ffffff','#fff6c8'));
   [[20,48],[34,48],[27,53]].forEach(p=>{P(p[0],p[1],'#ffe488');});
   for(let i=0;i<4;i++){tube(20+i*5,58+i%2,20+i*5,61,.7,PAL.cGold);}
   [[6,62],[48,62]].forEach(p=>blob(p[0],p[1],5,1.6,PAL.cMoss,{bias:.0,dt:.1}));
  },V2(43,24,6)),
  // 포켓몬 동상
  statue:()=>mk(42,70,a=>{const{poly,blob,tube,P,leaves,line}=a,S=PAL.cStone;
   // 받침대
   poly([[3,64],[39,64],[37,69],[5,69]],(x,y,u,v)=>({r:S,v:.46+(1-v)*.2-u*.2}));
   poly([[6,57],[36,57],[38,64],[4,64]],(x,y,u,v)=>({r:S,v:.7+(1-v)*.1-u*.34,dt:.05}));
   poly([[8,46],[34,46],[34,57],[8,57]],(x,y,u,v)=>({r:S,v:.64-u*.32,dt:.05}));
   poly([[11,49],[31,49],[31,55],[11,55]],(x,y,u,v)=>({r:PAL.cGold,v:.7-u*.3+(1-v)*.1,dt:.05}));
   blob(21,52,2.4,2.4,PAL.cRed,{bias:.1,dt:.1});P(21,52,'#14101c');P(19,52,'#fff6c8');P(23,52,'#fff6c8');
   poly([[5,43],[37,43],[38,47],[4,47]],(x,y,u,v)=>({r:S,v:.82-u*.34,dt:.05}));
   crit2(a,5,3,S,{ink:'#2a2a44',belly:0});
   leaves(9,55,3.6,10,PAL.cMoss,40,{bias:.05});leaves(35,60,3,6,PAL.cMoss,18,{bias:-.1});leaves(14,27,4,8,PAL.cMoss,18,{bias:.1});
   [[10,50],[35,62],[12,40]].forEach(p=>{P(p[0],p[1],'#ffffff');P(p[0],p[1]-1,'#ffc9dc');});
  },V2(44,17,6)),
  // 타입 정원: 불꽃
  set_fire:()=>mk(62,54,a=>{const{blob,poly,P,line,leaves}=a,R2=a.rnd,K=PAL.cRock;
   blob(31,46,28,6,PAL.cFire,{bias:-.1,dt:.1});blob(31,46.5,23,3.6,PAL.cFire,{bias:.35,dt:.1});
   [[18,36,16,13],[43,35,15,14],[31,29,13,14],[11,41,8,6],[52,42,8,6]].forEach(b=>blob(b[0],b[1],b[2],b[3],K,{bias:-.2,dt:.1}));
   [[16,32,10,9],[41,30,9,10],[30,21,8,8]].forEach(b=>blob(b[0],b[1],b[2],b[3],K,{bias:.12,dt:.1}));
   [[13,27,3.4,2.6],[39,24,3.2,2.4],[28,15,3,2.2]].forEach(b=>blob(b[0],b[1],b[2],b[3],K,{bias:.5,dt:.1}));
   const cr=[[[8,42],[13,37],[11,32],[17,28],[15,22]],[[34,47],[33,40],[38,36],[36,30],[40,24]],[[26,38],[29,33],[26,28],[30,22],[29,17]],[[47,42],[50,37],[48,33]]];
   cr.forEach(c=>{jag(a,c,'#ff8a2c','#fff0a8');});
   flm(a,30,19,19,6,0,.05);flm(a,21,28,12,4.4,2,0);flm(a,41,26,14,4.8,4,0);flm(a,12,34,9,3.2,1,0);flm(a,52,36,8,3,3,0);
   for(let i=0;i<14;i++){const x=6+R2()*50,y=3+R2()*28;P(x,y,i%3?'#ffc04a':'#ff8a2c');if(i%4===0)P(x,y-1,'#fff0a8');}
  },V2(45,28,3)),
  // 타입 정원: 물 (폭포)
  set_water:()=>mk(62,60,a=>{const{blob,poly,P,line,leaves,tube}=a,S=PAL.cStone,R2=a.rnd;
   blob(31,52,28,6.6,PAL.cWater,{bias:-.1,dt:.1});
   [[17,38,17,18],[46,37,16,17],[31,24,22,16]].forEach(b=>blob(b[0],b[1],b[2],b[3],S,{bias:-.3,dt:.1}));
   [[14,30,12,10],[48,28,12,10],[31,16,14,9]].forEach(b=>blob(b[0],b[1],b[2],b[3],S,{bias:.05,dt:.1}));
   [[12,24,4,3],[48,23,4,3],[30,10,5,3]].forEach(b=>blob(b[0],b[1],b[2],b[3],S,{bias:.4,dt:.1}));
   for(let y=14;y<48;y+=5){line(4+R2()*6,y,20+R2()*6,y+1,'#3a3a58',1);line(40+R2()*6,y,56,y+1,'#3a3a58',1);}
   // 폭포
   const w=[[24,10],[38,10],[40,22],[39,40],[43,52],[19,52],[23,40],[22,22]];
   poly(w,(x,y,u,v)=>({r:PAL.cWater,v:.62+.12*Math.sin(u*14+v*3)+(1-v)*.1-(u>.5?.08:0),dt:.05}));
   for(let i=0;i<9;i++){const x=24+R2()*15,y0=12+R2()*22;line(x,y0,x+(R2()-.5),y0+6+R2()*10,'#d8f4ff',1);}
   blob(31,52,15,4,PAL.cWater,{bias:.45,dt:.1});blob(31,51,10,2.4,PAL.cWhite,{bias:.2,dt:.1});
   for(let i=0;i<22;i++){P(18+R2()*26,44+R2()*8,i%2?'#ffffff':'#d8f4ff');}
   // 무지개
   [['#ff7a8a',0],['#ffd86a',1],['#8ae08a',2],['#7ac8ff',3]].forEach(([c,k])=>{for(let an=-2.7;an<-.45;an+=.07){P(31+Math.cos(an)*(15-k),52+Math.sin(an)*(15-k)*1.0,c);}});
   leaves(8,42,5,7,PAL.cLeaf,40,{bias:.05});leaves(55,43,5,7,PAL.cLeaf,38,{bias:0});leaves(31,6,12,3,PAL.cMoss,24,{bias:.1});
   [[6,48],[56,47],[10,38]].forEach(p=>{P(p[0],p[1],'#ffc9dc');P(p[0],p[1]-1,'#ffffff');});
  },V2(46,28,4)),
  // 타입 정원: 풀 (거목)
  set_grass:()=>mk(80,82,a=>{const{blob,poly,tube,P,leaves,line,gsph}=a,R2=a.rnd,Wd=PAL.cWood;
   // 뿌리와 줄기
   const rt=(pts)=>poly(pts,(x,y,u,v)=>({r:Wd,v:.62+(1-v)*.1-u*.2+Math.sin(u*12)*.03,dt:.05}));
   rt([[30,62],[24,68],[14,75],[7,79],[17,80],[27,75],[34,70]]);rt([[50,62],[56,68],[66,75],[73,79],[63,80],[53,75],[46,70]]);rt([[34,68],[30,76],[24,81],[34,80],[40,72]]);rt([[46,68],[50,76],[56,81],[46,80],[40,72]]);
   poly([[28,70],[52,70],[50,56],[48,40],[32,40],[30,56]],(x,y,u,v)=>({r:Wd,v:.7-u*.44+Math.sin(v*18+u*5)*.04,dt:.05}));
   for(let i=0;i<10;i++){const x=31+R2()*18;line(x,44+R2()*8,x+(R2()-.5)*2,60+R2()*9,'#3a2218',1);}
   poly([[34,70],[46,70],[46,56],[40,50],[34,56]],(x,y,u,v)=>({r:PAL.cInk,v:.12+v*.1}));poly([[35,69],[45,69],[45,57],[40,52],[35,57]],(x,y,u,v)=>({r:PAL.cFire,v:.35+v*.45,dt:.05}));
   P(40,60,'#fff0a8');P(39,61,'#fff0a8');P(41,61,'#fff0a8');
   // 수관
   leaves(40,30,36,18,PAL.cLeaf,330,{bias:-.28});leaves(20,26,18,13,PAL.cLeaf,170,{bias:-.1});leaves(60,25,18,13,PAL.cLeaf,170,{bias:-.14});
   leaves(40,16,24,12,PAL.cLeaf,190,{bias:.02});leaves(30,13,14,8,PAL.cLeaf,90,{bias:.16});leaves(50,12,12,7,PAL.cLeaf,70,{bias:.1});
   // 덩굴
   [[13,36,16],[24,40,20],[56,39,18],[67,35,15],[40,42,12]].forEach(v=>{tube(v[0],v[1],v[0]+(R2()-.5)*3,v[1]+v[2],.55,PAL.cLeaf);leaves(v[0],v[1]+v[2],1.6,1.6,PAL.cLeaf,3,{bias:.15});});
   // 빛나는 버섯과 꽃
   [[16,76,PAL.cPink],[62,77,PAL.cBlue],[70,72,PAL.cPink]].forEach(m=>{tube(m[0],m[1]+2,m[0],m[1]-1,.9,PAL.cCream);blob(m[0],m[1]-2,3.4,2.4,m[2],{bias:.15,dt:.1});P(m[0]-1,m[1]-3,'#ffffff');});
   leaves(14,79,9,2,PAL.cMoss,20,{bias:.0});leaves(64,79,9,2,PAL.cMoss,20,{bias:-.05});
   [[9,70],[72,66],[50,74],[28,76],[20,48]].forEach(p=>{P(p[0],p[1],'#ffffff');P(p[0]-1,p[1],'#ffc9dc');P(p[0]+1,p[1],'#ffc9dc');P(p[0],p[1]-1,'#ffe27a');});
   for(let i=0;i<12;i++){sparkle(a,6+R2()*68,6+R2()*52,'#fff6c8','#d4ee62');}
  },V2(47,34,5)),
  // 타입 정원: 전기 (피뢰침)
  set_elec:()=>mk(46,74,a=>{const{poly,tube,blob,gsph,P,line,rect}=a;
   poly([[4,68],[42,68],[40,72],[6,72]],(x,y,u,v)=>({r:PAL.cIron,v:.45+(1-v)*.2-u*.2}));poly([[7,62],[39,62],[42,68],[4,68]],(x,y,u,v)=>({r:PAL.cIron,v:.66-u*.34+(1-v)*.1,dt:.05}));
   poly([[12,55],[34,55],[37,62],[9,62]],(x,y,u,v)=>({r:PAL.cIron,v:.74-u*.34,dt:.05}));
   tube(23,56,23,16,3.6,PAL.cIron,{spec:1});
   for(let i=0;i<5;i++){const y=26+i*6.4,w=7.4-i*.6+ (i>2?1.4:0);poly([[23-w-1,y-1.6],[23+w+1,y-1.6],[23+w,y+2.2],[23-w,y+2.2]],(x,yy,u,v)=>({r:PAL.cCop,v:.84-u*.46+(1-v)*.12,dt:.05}));tube(23-w,y,23+w,y,1.1,PAL.cCop,{spec:1});}
   [[7,34],[39,34]].forEach(p=>{tube(p[0],p[1]+12,p[0],p[1]-6,1.2,PAL.cIron);gsph(p[0],p[1]-7,2.4,()=>PAL.cGold);});
   tube(23,16,23,9,1.4,PAL.cIron);gsph(23,8,6.4,()=>PAL.cGold,{bias:.05});blob(23,8,3,3,PAL.cGold,{bias:.9,dt:.05});
   jag(a,[[7,27],[11,22],[10,17],[16,13],[19,9]],'#fff59a','#ffffff');jag(a,[[39,27],[35,21],[37,16],[30,12],[27,9]],'#fff59a','#ffffff');jag(a,[[23,2],[19,5],[22,8]],'#fff59a','#ffffff');
   for(let i=0;i<14;i++)sparkle(a,3+a.rnd()*40,2+a.rnd()*40,'#ffffff','#ffe94a');
  },V2(48,19,4)),
  // 캠프파이어
  campfire:()=>mk(46,40,a=>{const{blob,tube,P,line,poly,leaves}=a,R2=a.rnd,Wd=PAL.cWood;
   [[5,33],[11,36],[18,37.5],[27,37.5],[34,36],[40,33]].forEach((s,i)=>blob(s[0]+1,s[1],4.2,3,PAL.cStone,{bias:(i%2?-.18:.02),dt:.1}));
   blob(23,32,15,5,PAL.cRock,{bias:-.7,dt:.1});blob(23,32,12,3.6,PAL.cFire,{bias:.1,dt:.1});blob(23,32,8,2.2,PAL.cFire,{bias:.65,dt:.1});
   tube(7,34,36,26,3.1,Wd);tube(8,26,37,34,3.1,Wd);
   for(let i=0;i<10;i++){const t=i/9,x=9+t*26,y=34-t*8;line(x,y-1,x+1,y+1,'#2a1812',1);const x2=9+t*26,y2=26+t*8;line(x2,y2-1,x2+1,y2+1,'#2a1812',1);}
   blob(7,34,2.8,2.8,PAL.cWood,{bias:.4,dt:.1});blob(36,26,2.6,2.6,PAL.cWood,{bias:.4,dt:.1});blob(8,26,2.8,2.8,PAL.cWood,{bias:.4,dt:.1});blob(37,34,2.6,2.6,PAL.cWood,{bias:.4,dt:.1});
   flm(a,23,32,25,8.4,0,.04);flm(a,15,33,14,5,2.2,0);flm(a,32,33,16,5.4,4.1,0);flm(a,23,31,13,4,1,.18);
   leaves(8,35,5,2,PAL.cMoss,10,{bias:.1});
   for(let i=0;i<14;i++){const x=10+R2()*26,y=2+R2()*18;P(x,y,i%3?'#ffc04a':'#ff8a2c');if(i%3===0)P(x,y-1,'#fff0a8');}
  },V2(49,22,4)),
  // 반딧불 가로등
  firelamp:()=>mk(44,70,a=>{const{poly,tube,gsph,blob,P,line}=a,I=PAL.cIron;
   poly([[10,66],[32,66],[30,69],[12,69]],(x,y,u,v)=>({r:I,v:.4+(1-v)*.2-u*.2}));poly([[13,60],[29,60],[32,66],[10,66]],(x,y,u,v)=>({r:I,v:.7-u*.4,dt:.05}));
   tube(21,60,21,12,2.2,I,{spec:1});[[52,3.4],[36,3.2],[22,3]].forEach(c=>tube(21,c[0],21,c[0]+2,c[1],I,{spec:1}));
   scroll(a,13,52,5,1.6,I,.8);scroll(a,29,46,5,1.6,I,.8);
   tube(21,13,25,8,1.4,I);tube(25,8,33,6,1.4,I);tube(33,6,36,9,1.4,I);gsph(36,9,1.8,()=>PAL.cIron);
   poly([[28,12],[44,12],[41,8],[31,8]],(x,y,u,v)=>({r:I,v:.7-u*.35,dt:.05}));blob(36,7,2.4,1.6,I,{bias:.3,dt:.1});
   poly([[30,13],[42,13],[42,36],[30,36]],(x,y,u,v)=>({r:PAL.ffly,v:.5+(1-Math.abs(u-.5)*2)*.5,dt:.05}));
   gsph(36,25,5.2,()=>PAL.ffly,{bias:.3,spec:0});
   [[33,18],[39,20],[34,30],[38,28],[36,15],[32,24]].forEach(p=>{P(p[0],p[1],'#ffffe0');});
   [30,36,42].forEach(x=>tube(x,13,x,36,.55,I));poly([[29,36],[43,36],[41,39],[31,39]],(x,y,u,v)=>({r:I,v:.55-u*.3,dt:.05}));
   [[24,22],[46,16],[26,34],[8,30],[44,34],[18,20]].forEach(p=>{P(p[0],p[1],'#f0ff9c');P(p[0]+1,p[1],'#d4ee62');});
  },V2(50,17,4)),
  // ───── 놀이터·쉼터 ─────
  swing:()=>mk(58,58,a=>{const{tube,poly,blob,P,leaves,gsph}=a,Wd=PAL.cWood,S=PAL.cStraw;
   [[9,3],[49,3]].forEach(([x])=>{tube(x,6,x-7,54,1.9,Wd,{bias:-.05});tube(x,6,x+7,54,1.9,Wd,{bias:.0});tube(x-3.6,32,x+3.6,32,1,Wd);});
   tube(7,5,51,5,2.6,Wd,{spec:1});gsph(6,5,2.2,()=>PAL.cGold);gsph(52,5,2.2,()=>PAL.cGold);
   [[23,0],[35,1]].forEach(([x,o])=>{for(let y=6;y<40;y+=2)tube(x,y,x,y+2,.8,S,{bias:(y/2)%2?.1:-.12});});
   poly([[19,40],[39,40],[38,46],[20,46]],(x,y,u,v)=>({r:PAL.cRed,v:.74-u*.3+(1-v)*.1,dt:.05}));poly([[20,45],[38,45],[38,47.6],[20,47.6]],()=>({r:PAL.cRed,v:.12}));
   tube(20,40,38,40,.9,PAL.cWood,{bias:.3});
   [[9,54],[49,54]].forEach(p=>{leaves(p[0],p[1]-1,8,2.4,PAL.cMoss,20,{bias:.05});});
   [[4,53],[14,55],[46,55],[54,53]].forEach(p=>{P(p[0],p[1],'#ffffff');P(p[0],p[1]-1,'#ffc9dc');P(p[0]+1,p[1],'#ffe27a');});
  },V2(61,24,5)),
  seesaw:()=>mk(62,42,a=>{const{tube,poly,blob,P,gsph,rect}=a;
   poly([[10,38],[50,38],[48,41],[12,41]],(x,y,u,v)=>({r:PAL.cIron,v:.5+(1-v)*.2-u*.2}));
   poly([[30,17],[42,37],[18,37]],(x,y,u,v)=>({r:PAL.cRed,v:.78-u*.5+(1-v)*.1,dt:.05}));poly([[30,25],[36,36],[24,36]],(x,y,u,v)=>({r:PAL.cWhite,v:.8-u*.4,dt:.05}));
   tube(4,10,56,26,2.9,PAL.cGold,{spec:1});tube(4,13,56,29,1,PAL.cGold,{bias:-.45});
   gsph(30,18,2.4,()=>PAL.cIron);
   [[11,10],[48,24]].forEach(p=>{tube(p[0],p[1],p[0],p[1]-7,.9,PAL.cRed);tube(p[0]-3,p[1]-7,p[0]+3,p[1]-7,.9,PAL.cRed,{spec:1});});
   [[4,10],[56,26]].forEach(p=>blob(p[0],p[1]+1,3.4,3,PAL.cInk,{bias:.1,dt:.1}));
   [[5,3],[57,18],[30,5]].forEach(p=>sparkle(a,p[0],p[1],'#fff6c8','#ffe488'));
  },V2(62,26,5)),
  trampoline:()=>mk(52,44,a=>{const{poly,blob,gsph,P,line,tube}=a,C=PAL.cCream;
   poly([[19,26],[33,26],[36,40],[16,40]],(x,y,u,v)=>({r:C,v:.74-u*.46+(Math.floor(v*6)%2?.04:-.03),dt:.05}));blob(26,41,12,2.6,C,{bias:-.2,dt:.1});
   blob(26,26,24,4.4,C,{bias:-.35,dt:.1});for(let k=-18;k<=18;k+=3)line(26+k,24,26+k*.9,28,C[1],1);
   blob(26,19,24,13,PAL.cRed,{bias:-.12,dt:.1});blob(26,15,21,9.6,PAL.cRed,{bias:.1,dt:.1});blob(19,11,10,4,PAL.cRed,{bias:.5,dt:.1});
   [[12,14,3.8],[26,8,4.6],[40,15,3.8],[19,21,2.8],[33,22,3]].forEach(b=>gsph(b[0],b[1],b[2],()=>PAL.cWhite,{spec:0}));
   [[4,6],[47,10],[44,2],[8,0]].forEach(p=>sparkle(a,p[0],p[1],'#fff6c8','#ffe94a'));
  },V2(63,26,6)),
  bowls:()=>mk(54,30,a=>{const{poly,blob,gsph,P,line,tube}=a;
   const bowl=(cx,ramp,fill)=>{blob(cx,18,10.6,8,ramp,{bias:-.15,dt:.1});blob(cx-2,16.5,7,4.6,ramp,{bias:.2,dt:.1});
    blob(cx,12.4,10.8,3.4,ramp,{bias:.34,dt:.1});blob(cx,13,8.8,2.5,PAL.cInk,{bias:-.2,dt:.1});
    if(fill==='k'){for(let i=0;i<16;i++)gsph(cx-6.4+a.rnd()*12.8,11.4+a.rnd()*2.4,1.3,()=>PAL.cCop,{spec:0});}else{blob(cx,13.2,8.6,2.1,PAL.cWater,{bias:.15,dt:.1});line(cx-6,12.4,cx-2,12.4,'#d8f4ff',1);P(cx+4,13,'#ffffff');}
    [[-2,17],[2,17],[-1,15],[1,15]].forEach(p=>P(cx+p[0],p[1],'#ffffff'));[[-1,19],[0,19],[1,19],[0,18]].forEach(p=>P(cx+p[0],p[1],'#ffffff'));
    tube(cx-6,24.6,cx+6,24.6,1,ramp,{bias:-.3});};
   bowl(15,PAL.cRed,'k');bowl(39,PAL.cBlue,'w');
   [[27,6],[50,9]].forEach(p=>sparkle(a,p[0],p[1],'#ffffff','#ffd2b8'));
  },V2(64,23,5)),
  cushion:()=>mk(52,30,a=>{const{blob,poly,gsph,P,line,tube}=a,Pk=PAL.cPink;
   blob(26,19,24,8.6,Pk,{bias:-.45,dt:.1});blob(26,16,24,8.6,Pk,{bias:.02,dt:.1});blob(24,14,18,5.4,Pk,{bias:.3,dt:.1});
   for(let i=0;i<8;i++){const an=i/8*6.283+.2,x=26+Math.cos(an)*20,y=15+Math.sin(an)*6.6;line(26,15,x,y,Pk[1],1);}
   blob(26,15,3.4,2.2,Pk,{bias:-.3,dt:.1});gsph(26,14,1.8,()=>PAL.cGold);
   let pp=null;for(let i=0;i<=32;i++){const an=i/32*6.283,p=[26+Math.cos(an)*24,16+Math.sin(an)*8.3];if(pp&&Math.sin(an)>-.4)tube2(a,pp[0],pp[1],p[0],p[1]);pp=p;}
   function tube2(a,x0,y0,x1,y1){a.tube(x0,y0,x1,y1,.9,PAL.cCream,{bias:.1});}
   const C=PAL.cCream;blob(37,13,2.4,1.9,C,{bias:.15,dt:.1});[[33.5,10.6],[36,9.2],[38.8,9.4],[40.8,11]].forEach(p=>blob(p[0],p[1],.9,1.1,C,{bias:.15,dt:.1}));
   [[5,24],[47,24],[26,28]].forEach(p=>{gsph(p[0],p[1],1.5,()=>PAL.cGold);line(p[0],p[1]+1,p[0],p[1]+3,'#f8c448',1);});
   sparkle(a,8,6,'#ffffff','#ffe0f0');sparkle(a,46,5,'#ffffff','#ffe0f0');
  },V2(65,24,5)),
  sandbox:()=>mk(60,42,a=>{const{poly,tube,blob,P,line,gsph}=a,Wd=PAL.cWood,R2=a.rnd,Sd=PAL.cCream;
   poly([[4,13],[56,13],[56,17],[4,17]],(x,y,u,v)=>({r:Wd,v:.46+(1-v)*.2,dt:.05}));
   blob(30,23,26,8.4,Sd,{bias:-.1,dt:.1});blob(28,21,22,6.2,Sd,{bias:.22,dt:.1});for(let i=0;i<40;i++)P(6+R2()*48,16+R2()*13,i%2?'#fffaf0':'#9c8a72');
   [[4,13,4,28],[56,13,56,28]].forEach(p=>poly([[p[0]-2,p[1]],[p[0]+2,p[1]],[p[2]+2,p[3]],[p[2]-2,p[3]]],(x,y,u,v)=>({r:Wd,v:p[0]<30?.66:.36,dt:.05})));
   poly([[2,28],[58,28],[58,36],[2,36]],(x,y,u,v)=>({r:Wd,v:.68+(1-v)*.15-u*.1+(Math.floor(v*2)?-.1:0)+Math.sin(u*40+v*3)*.03,dt:.05}));tube(2,28,58,28,1.1,Wd,{bias:.28});line(2,32,58,32,'#2a1812',1);
   [[8,31],[30,31],[52,31]].forEach(p=>P(p[0],p[1],'#ffe488'));
   // 모래성
   poly([[14,14],[28,14],[28,24],[14,24]],(x,y,u,v)=>({r:Sd,v:.82-u*.34,dt:.05}));[[14,3],[18,3],[22,3],[26,3]].forEach(p=>poly([[p[0]-1,14],[p[0]+2,14],[p[0]+2,11],[p[0]-1,11]],(x,y,u,v)=>({r:Sd,v:.85-u*.3})));
   poly([[10,24],[18,24],[18,10],[10,10]],(x,y,u,v)=>({r:Sd,v:.86-u*.3,dt:.05}));poly([[8,10],[20,10],[14,2]],(x,y,u,v)=>({r:PAL.cRed,v:.74-u*.3,dt:.05}));tube(14,2,14,-1,.5,PAL.cWood);poly([[14,0],[19,1.4],[14,2.6]],()=>PAL.cRed[3]);
   poly([[17,18],[21,18],[21,24],[17,24]],()=>PAL.cWood[1]);
   // 양동이와 삽
   poly([[36,16],[48,16],[46,26],[38,26]],(x,y,u,v)=>({r:PAL.cRed,v:.7-u*.4+(1-v)*.1,dt:.05}));blob(42,16,6,1.6,PAL.cRed,{bias:.4,dt:.1});blob(42,16.4,4.6,1.1,PAL.cInk,{bias:-.2,dt:.1});
   tube(37,16,42,8,.7,PAL.cIron);tube(42,8,48,16,.7,PAL.cIron);
   tube(34,30,52,22,.9,PAL.cBlue,{spec:1});poly([[50,20],[56,22],[54,27],[50,25]],(x,y,u,v)=>({r:PAL.cBlue,v:.7-u*.3}));
   [[30,27],[44,29]].forEach(p=>{blob(p[0],p[1],2,1.4,PAL.cPink,{bias:.2,dt:.1});P(p[0],p[1],'#ffffff');});
  },V2(66,28,5)),
  picnic:()=>mk(62,40,a=>{const{poly,tube,blob,gsph,P,line}=a;
   poly([[8,15],[54,15],[60,34],[2,34]],(x,y,u,v)=>{const ck=((Math.floor(u*12)+Math.floor(v*6))&1);return{r:ck?PAL.cRed:PAL.cWhite,v:(ck?.62:.8)-u*.2+(1-v)*.04+Math.sin(u*20)*.02,dt:.05};});
   for(let k=0;k<12;k++){const x=3+k*4.9;tube(x,34,x,36.4,.4,PAL.cWhite);}
   // 바구니
   poly([[10,18],[28,18],[26,28],[12,28]],(x,y,u,v)=>({r:PAL.cStraw,v:.66+(((Math.floor(u*8)+Math.floor(v*4))&1)?.1:-.05)-u*.3,dt:.05}));tube(9,18,29,18,1.4,PAL.cStraw,{bias:.1});
   for(let i=0;i<14;i++){const t=i/14,p0=[11+18*t,18-9*Math.sin(Math.PI*t)],p1=[11+18*(i+1)/14,18-9*Math.sin(Math.PI*(i+1)/14)];tube(p0[0],p0[1],p1[0],p1[1],.9,PAL.cStraw,{bias:(i%2?.1:-.1)});}
   gsph(15,17,2.8,()=>PAL.cRed);gsph(22,16,2.4,()=>PAL.cFire);
   // 접시와 음식
   blob(40,25,7,2.8,PAL.cWhite,{bias:.1,dt:.1});blob(40,24.6,5,1.8,PAL.cWhite,{bias:-.1,dt:.1});poly([[36,20],[44,20],[44,24],[36,24]],(x,y,u,v)=>({r:PAL.cStraw,v:.84-u*.3}));poly([[36,20],[44,20],[44,21.6],[36,21.6]],()=>PAL.cLeaf[4]);
   gsph(48,27,2.4,()=>PAL.cRed);P(48,24,'#3a2a18');
   // 병과 컵
   poly([[32,8],[35,8],[35,16],[37,19],[37,26],[30,26],[30,19],[32,16]],(x,y,u,v)=>({r:PAL.cBlue,v:.72-u*.34,dt:.05}));poly([[32,5],[35,5],[35,8],[32,8]],()=>PAL.cWood[3]);P(31,21,'#e0f4ff');P(31,22,'#e0f4ff');
   [[52,22],[56,26]].forEach(p=>{poly([[p[0]-2,p[1]-3],[p[0]+2,p[1]-3],[p[0]+1.6,p[1]+1],[p[0]-1.6,p[1]+1]],(x,y,u,v)=>({r:PAL.cGold,v:.8-u*.3}));});
   [[6,8],[52,10],[20,6]].forEach(p=>sparkle(a,p[0],p[1],'#ffffff','#ffd2b8'));
  },V2(67,30,6)),
  parasol:()=>mk(64,72,a=>{const{poly,tube,blob,gsph,P,line}=a;
   tube(32,12,32,62,1.5,PAL.cCream,{spec:1});
   const cx=32,top=[32,6],N=8;for(let i=0;i<N;i++){const x0=cx-28+i*7,x1=x0+7,yb=26-Math.sin((i+.5)/N*Math.PI)*0;const red=i%2===0;
    poly([top,[x0,26],[x0+3.5,28.4],[x1,26]],(x,y,u,v)=>({r:red?PAL.cRed:PAL.cWhite,v:(red?.62:.8)+(i<4?.14-i*.03:-.06-(i-4)*.04)+(1-v)*.08,dt:.05}));}
   for(let i=0;i<=N;i++){const x=cx-28+i*7;line(32,6,x,26,'#ffffff',1);}
   tube(4,26,60,26,.5,PAL.cWhite);gsph(32,5,2.4,()=>PAL.cGold);
   blob(32,52,22,5.6,PAL.cWood,{bias:-.1,dt:.1});blob(32,51,22,5.6,PAL.cWood,{bias:.18,dt:.1});blob(28,49.6,12,2.4,PAL.cWood,{bias:.46,dt:.1});tube(11,53,53,53,.8,PAL.cWood,{bias:-.2});
   tube(18,56,14,68,1.3,PAL.cWood);tube(46,56,50,68,1.3,PAL.cWood,{bias:-.1});
   gsph(22,48,2.6,()=>PAL.cWhite,{spec:0});blob(22,46.4,2.4,.9,PAL.cInk,{bias:.2,dt:.1});gsph(42,49,2.6,()=>PAL.cBlue);
   tube(32,48,32,43,.5,PAL.cLeaf);gsph(32,42,2,()=>PAL.cPink);
  },V2(68,32,5)),
  mailbox:()=>mk(36,58,a=>{const{poly,tube,blob,gsph,P,leaves}=a;
   tube(18,56,18,30,2.2,PAL.cWood,{bias:-.05});poly([[10,52],[26,52],[28,57],[8,57]],(x,y,u,v)=>({r:PAL.cWood,v:.5+(1-v)*.2}),);
   poly([[4,15],[32,15],[32,32],[4,32]],(x,y,u,v)=>({r:PAL.cRed,v:.76-u*.4+(1-v)*.08,dt:.05}));blob(18,15,14,6,PAL.cRed,{bias:.12,dt:.1});blob(14,12,8,2.4,PAL.cRed,{bias:.55,dt:.1});
   poly([[4,30],[32,30],[32,33],[4,33]],()=>({r:PAL.cRed,v:.12}));
   poly([[5,16],[8,16],[8,31],[5,31]],()=>({r:PAL.cRed,v:.18,dt:.05}));
   poly([[11,22],[25,22],[25,26],[11,26]],(x,y,u,v)=>({r:PAL.cGold,v:.8-u*.3,dt:.05}));P(13,24,'#6a3a10');P(15,24,'#6a3a10');P(17,24,'#6a3a10');P(20,24,'#6a3a10');
   poly([[0,20],[6,19],[6,26],[0,26]],(x,y,u,v)=>({r:PAL.cCream,v:.9-u*.2}));P(2,22,'#c8333f');P(3,22,'#c8333f');
   tube(30,16,30,6,.8,PAL.cGold);poly([[30,6],[36,8],[30,10]],(x,y,u,v)=>({r:PAL.cGold,v:.8-u*.3}));
   gsph(21,19,1.6,(nx,ny)=>ny<0?PAL.cRed:PAL.cWhite,{spec:0});
   leaves(18,56,8,2.4,PAL.cLeaf,22,{bias:.05});[[10,55],[27,56]].forEach(p=>{P(p[0],p[1],'#ffffff');P(p[0],p[1]-1,'#ffc9dc');});
  },V2(69,15,5)),
  signpost:()=>mk(52,62,a=>{const{poly,tube,blob,gsph,P,line,leaves}=a,Wd=PAL.cWood;
   tube(26,60,26,10,2.4,Wd,{bias:-.05});blob(26,9,3.4,2.2,Wd,{bias:.2,dt:.1});
   const bd=(x0,y0,w,right)=>{const pts=right?[[x0,y0],[x0+w-6,y0],[x0+w,y0+5],[x0+w-6,y0+10],[x0,y0+10]]:[[x0+6,y0],[x0+w,y0],[x0+w,y0+10],[x0+6,y0+10],[x0,y0+5]];
    poly(pts,(x,y,u,v)=>({r:Wd,v:.66-u*.18+(1-v)*.2+Math.sin(v*30+u*4)*.025,dt:.05}));tube(pts[0][0],pts[0][1]+.6,pts[1][0],pts[1][1]+.6,.6,Wd,{bias:.35});line(pts[0][0],pts[3][1]-.4,pts[2][0],pts[3][1]-.4,'#2a1812',1);P(right?x0+2:x0+w-3,y0+4,'#c8c4de');P(right?x0+2:x0+w-3,y0+5,'#c8c4de');};
   bd(8,12,34,true);bd(10,26,34,false);bd(8,40,32,true);
   gsph(15,17,2.6,(nx,ny)=>ny<0?PAL.cRed:PAL.cWhite,{spec:0});
   poly([[35,35],[39,31],[43,35]],()=>PAL.cRed[3]);poly([[36,35],[42,35],[42,38],[36,38]],()=>PAL.cCream[3]);P(39,37,'#74482e');
   gsph(16,45,2.6,()=>PAL.cLeaf,{spec:0});tube(16,47,16,50,.5,PAL.cWood);
   [[26,22],[26,36],[26,50]].forEach(p=>{P(p[0]-3,p[1],'#6a3a10');});
   leaves(26,59,10,2.6,PAL.cMoss,26,{bias:.04});[[17,58],[36,59]].forEach(p=>{P(p[0],p[1],'#ffffff');P(p[0],p[1]-1,'#ffc9dc');P(p[0]+1,p[1],'#ffe27a');});
  },V2(70,26,4)),
  planter:()=>mk(50,38,a=>{const{poly,blob,tube,gsph,P,leaves}=a,R2=a.rnd,C=PAL.cCop;
   const pot=(cx,w,h,fl,fc)=>{const by=35;poly([[cx-w/2,by-h],[cx+w/2,by-h],[cx+w/2-2,by],[cx-w/2+2,by]],(x,y,u,v)=>({r:C,v:.74-u*.44+(1-v)*.1+(Math.floor(v*8)===0?.1:0),dt:.05}));
    poly([[cx-w/2-1.4,by-h-3],[cx+w/2+1.4,by-h-3],[cx+w/2+1.4,by-h+.6],[cx-w/2-1.4,by-h+.6]],(x,y,u,v)=>({r:C,v:.84-u*.4,dt:.05}));
    blob(cx,by-h-2.8,w/2+.8,1.4,PAL.cInk,{bias:.3,dt:.1});leaves(cx,by-h-5,w/2,3.4,PAL.cLeaf,26,{bias:.04});
    fl.forEach((c,i)=>{const fx=cx-w/2+3+i*(w-6)/Math.max(1,fl.length-1),fy=by-h-8-(i%2)*4-R2()*3;tube(fx,fy+3,fx+(R2()-.5)*2,by-h-4,.5,PAL.cLeaf);
     for(let k=0;k<5;k++){const an=k/5*6.283;blob(fx+Math.cos(an)*2,fy+Math.sin(an)*2,1.3,1.3,c,{bias:.1,dt:.05});}gsph(fx,fy,1.3,()=>fc,{spec:0});});};
   pot(10,12,11,[PAL.cPink,PAL.cWhite],PAL.cGold);pot(25,14,13,[PAL.cGold,PAL.cRed,PAL.cGold],PAL.cCop);pot(40,11,10,[PAL.cBlue,PAL.cPink],PAL.cGold);
  },V2(71,24,5)),
  scarecrow:()=>mk(52,70,a=>{const{poly,tube,blob,gsph,P,line,leaves}=a,Wd=PAL.cWood,S=PAL.cStraw,R2=a.rnd;
   tube(26,68,26,24,2.2,Wd,{bias:-.05});tube(4,29,48,29,2,Wd,{spec:1});
   poly([[16,30],[36,30],[37,52],[15,52]],(x,y,u,v)=>{const ck=((Math.floor(u*6)+Math.floor(v*9))&1);return{r:ck?PAL.cRed:PAL.cBlue,v:(ck?.56:.5)-u*.22+(1-v)*.06,dt:.05};});
   poly([[22,38],[28,38],[28,44],[22,44]],(x,y,u,v)=>({r:PAL.cStraw,v:.7}));line(22,38,28,38,'#8a6226',1);line(22,44,28,44,'#8a6226',1);
   poly([[18,50],[34,50],[33,64],[27,64],[26,54],[25,64],[19,64]],(x,y,u,v)=>({r:PAL.cWood,v:.5-u*.2,dt:.05}));
   for(let i=0;i<34;i++){const x=(i<17?2:46)+R2()*5,y=26+R2()*8;line(x,y,x+(i<17?-1:1)*(1+R2()*2),y+1+R2()*3,S[2+Math.floor(R2()*3)],1);}
   for(let i=0;i<22;i++){const x=19+R2()*14,y=50+R2()*5;line(x,y,x+(R2()-.5)*3,y+2+R2()*4,S[2+Math.floor(R2()*3)],1);}
   gsph(26,18,8.4,()=>PAL.cCream,{spec:0,dt:.1});P(22,17,'#2a1812');P(23,17,'#2a1812');P(29,17,'#2a1812');P(30,17,'#2a1812');
   [[21,22],[23,23],[25,23],[27,23],[29,22]].forEach(p=>P(p[0],p[1],'#6a3a10'));line(21,22,20,20,'#6a3a10',1);line(31,22,32,20,'#6a3a10',1);
   line(20,13,24,12,'#9c8a72',1);
   poly([[10,10],[42,10],[38,8],[14,8]],(x,y,u,v)=>({r:S,v:.74-u*.3,dt:.05}));poly([[16,10],[36,10],[33,2],[19,2]],(x,y,u,v)=>({r:S,v:.7-u*.3+(1-v)*.1,dt:.05}));poly([[16,8],[36,8],[36,10],[16,10]],()=>({r:PAL.cRed,v:.5}));
   gsph(38,25,3.2,()=>PAL.cInk,{spec:1});gsph(40,22,2.4,()=>PAL.cInk,{spec:1});poly([[42,22],[45,23],[42,24]],()=>PAL.cFire[3]);P(41,21,'#ffffff');tube(37,28,34,29,.5,PAL.cInk);
   gsph(10,66,3.6,()=>PAL.cFire);tube(10,63,11,60,.6,PAL.cMoss);leaves(40,67,7,2.2,PAL.cLeaf,16,{bias:.04});
  },V2(72,22,6)),
  windmill:()=>mk(70,84,a=>{wmTower(a);wmBlades(a,35,24);},V2(73,34,6)),
  // ───── 밤·계절 ─────
  moonlamp:()=>mk(44,72,a=>{const{poly,tube,gsph,blob,P,sh}=a,I=PAL.cIron;
   poly([[11,68],[33,68],[31,71],[13,71]],(x,y,u,v)=>({r:I,v:.4+(1-v)*.2-u*.2}));poly([[14,62],[30,62],[33,68],[11,68]],(x,y,u,v)=>({r:I,v:.7-u*.4,dt:.05}));
   tube(22,62,22,36,2.2,I,{spec:1});[[56,3.2],[44,3]].forEach(c=>tube(22,c[0],22,c[0]+2,c[1],I,{spec:1}));scroll(a,14,56,5,1.5,I,.8);scroll(a,30,50,5,1.5,I,.8);
   tube(12,34,22,38,1.2,I);tube(22,38,32,34,1.2,I);
   const cx=22,cy=18,R=15;
   for(let y=-R;y<=R;y++)for(let x=-R;x<=R;x++){const d1=Math.hypot(x,y),d2=Math.hypot(x-6.4,y+3);if(d1<=R&&d2>12.2){const edge=(d2-12.2)<2.2;const v=.5+(-x*.5-y*.42)/R*.5+(edge?.12:0)-(R-d1<1.8?.05:0);sh(cx+x,cy+y,PAL.cGold,v,.08);}}
   [[11,12],[13,19],[16,24]].forEach(p=>{blob(p[0],p[1],1.2,1.2,PAL.cGold,{bias:-.35,dt:.1});});
   P(9,12,'#ffffff');P(10,10,'#ffffff');P(9,13,'#fff6c8');
   [[34,7],[39,18],[33,28],[6,30],[40,36]].forEach(p=>sparkle(a,p[0],p[1],'#ffffff','#fff6c8'));
  },V2(51,17,4)),
  starlamp:()=>mk(40,60,a=>{const{poly,tube,blob,P,leaves,sh}=a,I=PAL.cIron;
   poly([[10,56],[30,56],[28,59],[12,59]],(x,y,u,v)=>({r:I,v:.4+(1-v)*.2-u*.2}));poly([[13,50],[27,50],[30,56],[10,56]],(x,y,u,v)=>({r:I,v:.7-u*.4,dt:.05}));
   tube(20,50,20,28,2,I,{spec:1});tube(20,42,20,44,3,I);scroll(a,12,44,4.4,1.4,I,.7);scroll(a,28,40,4.4,1.4,I,.7);leaves(20,48,6,2,PAL.cLeaf,10,{bias:.1});
   const cx=20,cy=15,Ro=14,Ri=6,P_=[];for(let i=0;i<10;i++){const r=i%2?Ri:Ro,an=-Math.PI/2+i*Math.PI/5;P_.push([cx+Math.cos(an)*r,cy+Math.sin(an)*r,an]);}
   for(let i=0;i<10;i+=2){const o=P_[i],q0=P_[(i+9)%10],q1=P_[(i+1)%10];[[q0,o],[o,q1]].forEach(([p,q],k)=>{const ang=Math.atan2((p[1]+q[1])/2-cy,(p[0]+q[0])/2-cx),vv=.5+.46*(Math.cos(ang)*-.6+Math.sin(ang)*-.8);
     a.poly([[cx,cy],[p[0],p[1]],[q[0],q[1]]],(x,y,u,v)=>({r:PAL.cGold,v:vv+.05,dt:.05}));});}
   for(let i=0;i<10;i++){const p=P_[i],q=P_[(i+1)%10];a.line(p[0],p[1],q[0],q[1],'#fff6c8',1);}
   blob(cx,cy,3,3,PAL.cGold,{bias:.9,dt:.05});P(cx-5,cy-6,'#ffffff');P(cx-6,cy-5,'#ffffff');
   [[3,6],[37,10],[36,30],[4,26],[20,1]].forEach(p=>sparkle(a,p[0],p[1],'#ffffff','#fff6c8'));
  },V2(52,15,4)),
  lanterns:()=>mk(70,48,a=>{const{tube,blob,gsph,P,poly,line,sh}=a,Wd=PAL.cWood,R2=a.rnd;
   tube(4,44,4,6,2.2,Wd);tube(66,44,66,6,2.2,Wd);blob(4,5,3.2,2.6,PAL.cGold,{bias:.1,dt:.1});blob(66,5,3.2,2.6,PAL.cGold,{bias:.1,dt:.1});
   const cat=t=>[5+t*60,6+Math.sin(t*Math.PI)*9];let pp=cat(0);for(let i=1;i<=40;i++){const p=cat(i/40);tube(pp[0],pp[1],p[0],p[1],.6,PAL.cStraw);pp=p;}
   const cols=[PAL.cRed,PAL.cFire,PAL.cPink,PAL.cGold,PAL.cRed,PAL.cFire,PAL.cPink];
   cols.forEach((c,i)=>{const t=(i+.7)/(cols.length+.4),p=cat(t),x=p[0],y=p[1];tube(x,y,x,y+3,.5,PAL.cStraw);
    poly([[x-1.8,y+3],[x+1.8,y+3],[x+1.8,y+4.6],[x-1.8,y+4.6]],()=>({r:PAL.cInk,v:.4}));
    blob(x,y+11,5,6.6,c,{bias:.12,dt:.1});blob(x-.4,y+11.6,2.6,4,c,{bias:.78,dt:.1});for(let k=-3;k<=3;k+=3)line(x+k*.9,y+6,x+k*.9,y+16,c[1],1);
    poly([[x-1.8,y+17],[x+1.8,y+17],[x+1.8,y+18.4],[x-1.8,y+18.4]],()=>({r:PAL.cInk,v:.4}));tube(x,y+18,x,y+22,.5,PAL.cGold);blob(x,y+23,1.2,1.4,PAL.cGold,{bias:.2,dt:.1});});
   [[10,38],[58,40],[33,42]].forEach(p=>sparkle(a,p[0],p[1],'#fff6c8','#ffd488'));
  },V2(53,0,0,{shadow:0})),
  telescope:()=>mk(50,60,a=>{const{tube,gsph,blob,P,line}=a,B=PAL.cCop,G=PAL.cGold,Wd=PAL.cWood;
   tube(20,30,7,58,1.5,Wd);tube(20,30,24,58,1.5,Wd,{bias:-.1});tube(20,30,38,56,1.5,Wd,{bias:-.2});
   [[7,58],[24,58],[38,56]].forEach(p=>blob(p[0],p[1],2.2,1,PAL.cIron,{bias:-.1,dt:.1}));
   gsph(20,29,3.2,()=>G);
   tube(11,35,37,9,3.6,B,{spec:1});tube(34,12,44,3,5,B,{spec:1});tube(11,35,6,40,2,B,{spec:1});
   [[0.2],[0.48],[0.74]].forEach(([t])=>tube(11+26*t-.8,35-26*t+.8,11+26*t+.8,35-26*t-.8,4,G,{spec:1}));
   tube(42,5,45,2,5.2,G,{spec:1});gsph(44,3,3.2,()=>PAL.cWater,{bias:.2});
   sparkle(a,46,1,'#ffffff','#d8f4ff');[[4,8],[12,4],[40,24],[47,16],[3,28]].forEach(p=>sparkle(a,p[0],p[1],'#fff6c8','#ffe488'));
  },V2(54,22,4)),
  hotspring:()=>mk(72,50,a=>{const{blob,tube,P,line,poly,leaves,gsph}=a,R2=a.rnd,S=PAL.cStone,cx=36,cy=34;
   blob(cx,cy+2,33,11,PAL.cMoss,{bias:-.55,dt:.1});
   const rocks=[];for(let i=0;i<24;i++){const an=i/24*6.283,x=cx+Math.cos(an)*31,y=cy+Math.sin(an)*10,r=R2();rocks.push([x,y,3.2+r*1.6,2.4+r*1.1,.3+R2()*.4,Math.sin(an)]);}
   rocks.filter(r=>r[5]<0).forEach(r=>blob(r[0],r[1],r[2],r[3],S,{bias:r[4]-.5,dt:.1}));
   blob(cx,cy,29,9.6,PAL.cTeal,{bias:-.2,dt:.1});blob(cx+1,cy+.8,23,6.8,PAL.cTeal,{bias:-.35,dt:.1});blob(cx-6,cy-1.6,16,3.4,PAL.cTeal,{bias:.4,dt:.1});
   for(let i=0;i<8;i++){const x=12+R2()*48,y=28+R2()*10;line(x,y,x+2+R2()*3,y,'#c8f6e4',1);}
   for(let i=0;i<7;i++)P(14+R2()*44,28+R2()*10,i%2?'#ffc9dc':'#ffe0f0');
   gsph(48,35,2.8,()=>PAL.cYel,{spec:1});P(51,35,'#ff8a2c');P(51,36,'#ff8a2c');P(47,34,'#14101c');
   rocks.filter(r=>r[5]>=0).forEach(r=>blob(r[0],r[1],r[2],r[3],S,{bias:r[4]-.12,dt:.1}));
   // 나무통
   a.poly([[7,34],[17,34],[16,43],[8,43]],(x,y,u,v)=>({r:PAL.cWood,v:.7-u*.4+((Math.floor(u*5)%2)?.04:-.04),dt:.05}));blob(12,34,5,1.6,PAL.cWood,{bias:.3,dt:.1});tube(7,36,17,36,.6,PAL.cIron);tube(8,41,16,41,.6,PAL.cIron);
   a.poly([[10,31],[17,31],[16,35],[11,35]],(x,y,u,v)=>({r:PAL.cWhite,v:.8-u*.3}));
   // 대나무 울타리
   [[57,24],[61,22],[65,24]].forEach((b,i)=>{tube(b[0],b[1]+16,b[0],b[1]-6,1.7,PAL.cMoss,{bias:.0});[0,8,15].forEach(k=>tube(b[0]-1.8,b[1]+k,b[0]+1.8,b[1]+k,.6,PAL.cMoss,{bias:-.4}));});
   // 김
   [[20,0],[32,2.1],[44,4.2],[53,1.1]].forEach(([bx,ph])=>{for(let t=0;t<20;t++){const x=bx+Math.sin(t*.5+ph)*2.6,y=26-t;const c=t<8?'#f4fbff':t<14?'#dcedf6':'#c5dcea';if(t<14||t%2===0){P(x,y,c);P(x+1,y,c);}}});
   leaves(6,30,5,2.4,PAL.cMoss,14,{bias:.05});
  },V2(55,32,5)),
  pumpkin:()=>mk(42,38,a=>{const{blob,tube,poly,P,line,leaves}=a,F=PAL.cFire;
   [[12,23,10,13],[30,23,10,13],[21,23,11.5,14.5]].forEach((b,i)=>blob(b[0],b[1],b[2],b[3],F,{bias:i===2?.04:-.16,dt:.1}));
   line(12,11,10,34,'#8e2a14',1);line(30,11,32,34,'#8e2a14',1);line(21,9,21,36,'#a8381a',1);
   tube(21,10,22,4,2,PAL.cMoss,{bias:-.15});tube(22,4,25,2,1.6,PAL.cMoss,{bias:-.1});
   scroll(a,33,8,3.6,1.4,PAL.cLeaf,.7);leaves(30,12,4,3,PAL.cLeaf,10,{bias:.1});
   const dk='#3a1208',gl='#ffe27a',gl2='#fff6c0';
   poly([[11,19],[18,19],[14.5,13]],()=>dk);poly([[24,19],[31,19],[27.5,13]],()=>dk);poly([[12.2,18],[16.8,18],[14.5,14.8]],()=>gl);poly([[25.2,18],[29.8,18],[27.5,14.8]],()=>gl);
   poly([[10,24],[32,24],[30,31],[26,29],[23,32],[19,29],[16,32],[12,29]],()=>dk);poly([[12,25],[30,25],[28.5,29.4],[26,27.6],[23,30],[19,27.6],[16,30],[13.5,28]],(x,y,u,v)=>({r:PAL.cGold,v:.7+v*.2,dt:.05}));
   P(14,17,gl2);P(27,17,gl2);P(21,27,gl2);
  },V2(56,18,4)),
  snowman:()=>mk(36,52,a=>{const{gsph,blob,tube,poly,P,line}=a,Sn=PAL.cWhite;
   tube(7,30,1,20,.9,PAL.cWood);tube(2,22,0,19,.6,PAL.cWood);tube(2,22,5,19,.6,PAL.cWood);tube(29,30,35,20,.9,PAL.cWood);tube(34,22,36,19,.6,PAL.cWood);tube(34,22,31,19,.6,PAL.cWood);
   blob(18,48,16,4,Sn,{bias:-.1,dt:.1});
   gsph(18,38,12,()=>Sn,{spec:0,dt:.12});gsph(18,23,9,()=>Sn,{spec:0,dt:.12});gsph(18,11,7.2,()=>Sn,{spec:0,dt:.12});
   poly([[11,16],[25,16],[26,20],[10,20]],(x,y,u,v)=>({r:PAL.cRed,v:.6+(1-v)*.1-u*.26,dt:.05}));poly([[22,19],[27,19],[28,29],[23,29]],(x,y,u,v)=>({r:PAL.cRed,v:.5-u*.2}));
   [[23,29],[25,29],[27,29]].forEach(p=>tube(p[0],p[1],p[0],p[1]+2,.4,PAL.cRed));
   poly([[11,6],[25,6],[24,0],[12,0]],(x,y,u,v)=>({r:PAL.cInk,v:.46-u*.2+(1-v)*.1}));poly([[8,7],[28,7],[26,5],[10,5]],(x,y,u,v)=>({r:PAL.cInk,v:.5-u*.2}));tube(11,5,25,5,.8,PAL.cRed);
   P(14,11,'#14101c');P(15,11,'#14101c');P(21,11,'#14101c');P(22,11,'#14101c');
   poly([[18,13],[28,14],[18,15.4]],(x,y,u,v)=>({r:PAL.cFire,v:.8-u*.3}));
   [[16,15],[18,16],[20,16],[22,15]].forEach(p=>P(p[0],p[1],'#14101c'));
   [[18,27],[18,32],[18,37]].forEach(p=>gsph(p[0],p[1],1.4,()=>PAL.cInk,{spec:0}));
   [[4,12],[31,8],[6,44],[30,46]].forEach(p=>sparkle(a,p[0],p[1],'#ffffff','#d8f4ff'));
   [[8,47],[27,46]].forEach(p=>{P(p[0],p[1],'#c8333f');P(p[0]+1,p[1],'#ee5548');P(p[0],p[1]-1,'#468440');});
  },V2(57,16,3)),
  windmill_t:()=>mk(70,84,a=>{wmTower(a);},V2(73,34,6)),
  windmill_b:()=>mk(56,56,a=>{wmBlades(a,28,28);},{seed:5,v2:1,rim:1,shadow:0}),
 };
 return k=>{if(!(k in cache))cache[k]=art[k]?art[k]():null;return cache[k];};})();
function gdSkyInfo(){const d=new Date(),h=d.getHours(),slot=h>=5&&h<10?'morning':h>=10&&h<17?'day':h>=17&&h<20?'evening':'night';
 const r=hashStr(typeof today==='function'?today():d.toDateString())%10,mo=d.getMonth()+1,winter=mo===12||mo<=2;
 const wx=r<=5?'clear':r<=7?'cloud':r===8?(winter?'snow':'rain'):(winter?'snow':'cloud');
 return{slot,wx};}
function gdSkyHTML(){try{const{slot,wx}=gdSkyInfo(),low=!!(S.meta.settings&&(S.meta.settings.lowfx||S.meta.settings.homeLite));
 let fx='';
 if(slot==='night')for(let i=0;i<14;i++)fx+=`<b style="left:${(i*37+11)%96}%;top:${(i*23+5)%38}%;animation-delay:${(i%6)*.4}s"></b>`;
 if(wx!=='clear'&&!low)for(let i=0;i<(wx==='cloud'?2:3);i++)fx+=`<span class=gdCl style="top:${8+i*11}%;animation-delay:${-i*13}s"></span>`;
 if((wx==='rain'||wx==='snow')&&!low){const n=wx==='rain'?26:20;for(let i=0;i<n;i++)fx+=`<i style="left:${(i*41+7)%100}%;animation-duration:${wx==='rain'?(.7+(i%5)*.12):(3+(i%5)*.6)}s;animation-delay:${-(i%9)*.4}s"></i>`;}
 const T={morning:'아침',day:'낮',evening:'저녁',night:'밤'}[slot],W={clear:'☀️ 맑은',cloud:'☁️ 구름 낀',rain:'🌧️ 비 오는',snow:'❄️ 눈 오는'}[wx];
 return `<div class="gdSky ${slot} ${wx}">${fx}</div><div class=gdWx>${slot==='night'&&wx==='clear'?'🌙 맑은':W} ${T}</div>`;}catch(e){return '';}}
// 부화 도감
function gdDex(){const m=S.meta,g=gd(m),all=MON_IDS.filter(id=>MON[id].rar===5);
 const tiles=TYPE_KO.map((nm,t)=>{const pool=all.filter(id=>MON[id].types.includes(t));if(!pool.length)return '';const own=pool.filter(id=>m.col[id]).length;
  return `<div class=gdDexT style="--c:${TYPE_COL[t]}"><b>${nm} ${own}/${pool.length}</b><div class=gdDexM>${pool.map(id=>`<span class="${m.col[id]?'':'no'}" title="${m.col[id]?esc(MON[id].name):'???'}">${monImg(id,'front')}</span>`).join('')}</div></div>`;}).join('');
 const ownAll=all.filter(id=>m.col[id]).length,hist=(g.hist||[]).slice(0,5);
 M(`<h2>📖 부화 도감</h2><p class=mut style="font-size:13px;text-align:center">알에서 만난 전설 포켓몬을 속성별로 모아요. 아직 못 만난 친구는 그림자로 보여요.</p>
 <div class=row style="justify-content:center;gap:8px"><span class=pill>🥚 부화 ${g.born||0}번</span><span class=pill>⭐ 전설 ${ownAll}/${all.length}</span></div>
 <div class=gdDexGrid>${tiles}</div>
 ${hist.length?`<h3 style="margin-top:10px">최근 부화</h3><div class=row style="gap:6px;flex-wrap:wrap">${hist.map(h=>MON[h.id]?`<span class=pill style="display:inline-flex;align-items:center;gap:4px"><span style="width:26px;height:26px;display:inline-flex">${monImg(h.id,'front')}</span>${esc(MON[h.id].name)} <small class=mut>${esc(h.d||'')}</small></span>`:'').join('')}</div>`:''}
 <div class=mbtns><button class="btn gold" data-a=x>닫기</button></div>`,{x:()=>closeM(),_close:()=>closeM()},{wide:1});}
// 오늘의 미션
const GD_MIS=[{k:'pet',n:3,t:'포켓몬 쓰다듬기',ic:'💗'},{k:'drag',n:1,t:'포켓몬 옮겨 주기',ic:'🖐️'},{k:'snack',n:1,t:'간식 주기',ic:'🍬'}];
function gdMisGet(g){const t=today();if(!g.mis||g.mis.d!==t)g.mis={d:t,pet:0,drag:0,snack:0,got:0};return g.mis;}
function gdMisState(){const g=gd(S.meta),m=gdMisGet(g),done=GD_MIS.filter(x=>m[x.k]>=x.n).length;return{g,m,done,all:done===GD_MIS.length};}
function gdBadge(){try{const b=document.getElementById('gdMisBtn');if(!b)return;const st=gdMisState();b.innerHTML=`🎯 미션 <small>${st.m.got?'완료':st.done+'/'+GD_MIS.length}</small>`;b.classList.toggle('rdy',st.all&&!st.m.got);}catch(e){}}
function gdMis(k){try{if(!gdPets(S.meta).length)return;const st=gdMisState(),def=GD_MIS.find(x=>x.k===k);if(!def||st.m[k]>=def.n)return;st.m[k]++;const all=GD_MIS.every(x=>st.m[x.k]>=x.n);autoSave();if(all&&!st.m.got)toast('🎯 오늘의 정원 미션을 모두 마쳤어요! 미션 버튼에서 보상을 받아요');gdBadge();}catch(e){}}
function gdMisModal(){const has=gdPets(S.meta).length>0,st=gdMisState();
 const rows=GD_MIS.map(x=>{const c=Math.min(x.n,st.m[x.k]),ok=c>=x.n;return `<div class="gdMisRow${ok?' done':''}"><span style="font-size:22px">${x.ic}</span><b style="flex:1">${x.t}</b><span>${ok?'✅':c+' / '+x.n}</span></div>`;}).join('');
 M(`<h2>🎯 오늘의 정원 미션</h2>${has?`${rows}<p class=mut style="font-size:13px;text-align:center;margin:6px 0">모두 마치면 <b>⚡ 에너지 1개 + 🪙 30</b>을 하루에 한 번 받아요. 내일 새로 시작해요!</p>
  <div class=mbtns>${st.m.got?`<button class="btn ghost" disabled>오늘 보상은 받았어요 ✅</button>`:`<button class="btn gold big" data-a=get ${st.all?'':'disabled'}>🎁 보상 받기</button>`}<button class="btn ghost" data-a=x>닫기</button></div>`
  :`<p style="line-height:1.7;text-align:center">정원에 포켓몬을 풀어놓으면 미션이 열려요!<br><span class=mut style="font-size:13px">정원 꾸리기(파란 공 버튼)에서 파트너 포켓몬을 골라 보세요.</span></p><div class=mbtns><button class="btn gold" data-a=x>닫기</button></div>`}`,
  {x:()=>closeM(),_close:()=>closeM(),get:()=>{const s2=gdMisState();if(!s2.all||s2.m.got)return;s2.m.got=1;s2.g.spent=(s2.g.spent||0)-1;S.meta.coins+=30;autoSave();sfx('coin');confetti(30);closeM();toast('🎁 ⚡ 에너지 +1, 🪙 +30 을 받았어요!');gdRefresh();}});}
// 간식
function gdSnack(){const m=S.meta,pets=gdPets(m);if(!pets.length){toast('정원에 포켓몬이 있어야 간식을 줄 수 있어요');return;}
 M(`<h2>🍬 간식 주기</h2><p class=mut style="font-size:13px;text-align:center">사탕 1개를 주면 포켓몬이 기뻐해요! (지금 사탕 ${m.candy||0}개)</p>
  <div class=gdShopGrid>${pets.map(id=>`<button class=gdShopItem data-pid="${id}"><div style="height:64px;display:flex;justify-content:center;align-items:flex-end">${monImg(id,'front')}</div><b>${esc(MON[id].name)}</b></button>`).join('')}</div>
  <div class=mbtns><button class="btn ghost" data-a=x>닫기</button></div>`,{x:()=>closeM(),_close:()=>closeM()});
 $('#mbox').querySelectorAll('[data-pid]').forEach(c=>c.onclick=()=>{const id=+c.dataset.pid;if((m.candy||0)<1){toast('사탕이 부족해요');return;}
  m.candy--;gdSaveSoon(true);closeM();sfx('heal');
  const el=document.querySelector('#gdField .gdPet[data-id="'+id+'"]');
  if(el){gdPetFx(el);if(!el.querySelector('.gdHeart')){const h=document.createElement('i');h.className='gdHeart';h.textContent='💗';el.appendChild(h);setTimeout(()=>h.remove(),30*60*1000);}}
  toast(`🍬 ${esc(MON[id].name)}: ${rpick(['냠냠! 맛있어요~','달콤해요! 고마워요!','기운이 쑥쑥 나요!'])}`);gdMis('snack');});}
// ===== 정원 배경 (도트 그림 6종) · 꾸미기 > 배경 탭에서 바꿔요 =====
const GD_BGS=[{k:'',n:'기본 정원'},{k:'forest',n:'초록 숲의 시작'},{k:'sea',n:'푸른 바다의 항구'},{k:'fire',n:'불의 산'},{k:'ice',n:'얼음꽃의 설원'},{k:'desert',n:'사막의 유적지'},{k:'future',n:'미래의 도시'}];
/* 정원 배경 해금: 메인 스토리 지역을 클리어하면 하나씩 열려요. 값은 지역 번호(1~6). 기본 정원은 처음부터 쓸 수 있어요.
   이미 쓰고 있던 배경은 그대로 두고(빼앗지 않아요), 다른 배경으로 바꾼 뒤에는 해금해야 다시 쓸 수 있어요. */
const GD_BG_NEED={forest:1,sea:2,fire:3,future:4,desert:5,ice:6};
function gdBgOpen(k,cur){if(!k||!GD_BG_NEED[k]||k===cur)return true;try{return ((S.meta.scenario&&S.meta.scenario.cleared)||[]).indexOf(GD_BG_NEED[k])>=0;}catch(e){return true;}}
function gdBgNeedName(k){try{return SC_REGIONS[GD_BG_NEED[k]-1].name;}catch(e){return '메인 스토리';}}
function gdBgUnlockNote(r){try{const k=Object.keys(GD_BG_NEED).find(x=>GD_BG_NEED[x]===r),b=GD_BGS.find(x=>x.k===k);return b?`<p class="sc-note">🖼️ 정원 배경 「${esc(b.n)}」${hasJong(b.n)?'이':'가'} 열렸어요! (나의 정원 › 꾸미기 › 배경)</p>`:'';}catch(e){return '';}}
const _gdBgC={};
function gdBgPaint(k,B,DW,DH){
 const S=2,W=DW/S,H=DH/S;
 const HC={},hx=h=>HC[h]||(HC[h]=h.length===4?[1,2,3].map(i=>parseInt(h[i]+h[i],16)):[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
 let MSK=null,OFX=0,NG=null,TS=null;
 const PX=(X,Y,c)=>{X+=OFX;if(TS){X=Math.round(TS.ox+(X-TS.ax)*TS.sc);Y=Math.round(TS.oy+(Y-TS.ay)*TS.sc);}if(X<0||Y<0||X>=DW||Y>=DH)return;if(NG&&NG((X+.5)/S,(Y+.5)/S))return;let q=hx(c);if(TS&&TS.hz){const hq=hx(TS.hc);q=[q[0]*(1-TS.hz)+hq[0]*TS.hz,q[1]*(1-TS.hz)+hq[1]*TS.hz,q[2]*(1-TS.hz)+hq[2]*TS.hz];}const i=(Y*DW+X)*4;if(MSK)MSK[Y*DW+X]=1;B[i]=q[0];B[i+1]=q[1];B[i+2]=q[2];B[i+3]=255;};

 const MX=(X,Y,c,a)=>{X+=OFX;if(TS){X=Math.round(TS.ox+(X-TS.ax)*TS.sc);Y=Math.round(TS.oy+(Y-TS.ay)*TS.sc);}if(X<0||Y<0||X>=DW||Y>=DH)return;const q=hx(c),i=(Y*DW+X)*4;B[i]=B[i]*(1-a)+q[0]*a;B[i+1]=B[i+1]*(1-a)+q[1]*a;B[i+2]=B[i+2]*(1-a)+q[2]*a;};
 const P=(x,y,c)=>{const xi=x%1===0,yi=y%1===0,X=Math.floor(x*S),Y=Math.floor(y*S);for(let j=0;j<(yi?S:1);j++)for(let i=0;i<(xi?S:1);i++)PX(X+i,Y+j,c);};
 let sd=({home:71,forest:11,sea:23,fire:37,ice:41,desert:53,future:67})[k]||1;
 const hs=(x,y)=>{const a=Math.floor(x*S),b=Math.floor(y*S);let h=(Math.imul(a,374761393)+Math.imul(b,668265263)+Math.imul(sd,1442695041))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;};
 const vn=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);return(hs(xi,yi)*(1-u)+hs(xi+1,yi)*u)*(1-v)+(hs(xi,yi+1)*(1-u)+hs(xi+1,yi+1)*u)*v;};
 const fb=(x,y)=>vn(x,y)*.55+vn(x*2.1+5,y*2.1+3)*.3+vn(x*4.3+9,y*4.3+7)*.15;
 const BY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5],bt=(x,y)=>BY[(Math.floor(y*S)&3)*4+(Math.floor(x*S)&3)]/16+.03;
 const cl=v=>v<0?0:v>1?1:v;
 const RP=(cs,v,x,y)=>{const f=cl(v)*(cs.length-1),i=Math.floor(f);return(i<cs.length-1&&(f-i-.32)/.36>bt(x,y))?cs[i+1]:cs[i];};
 const D=(x,y,c,a)=>{const q=Math.floor(a*8)/8;if(q<=0)return;const xi=x%1===0,yi=y%1===0,X=Math.floor(x*S),Y=Math.floor(y*S);for(let j=0;j<(yi?S:1);j++)for(let i=0;i<(xi?S:1);i++)MX(X+i,Y+j,c,Math.min(1,q));};
 const EL=(cx,cy,rx,ry,f)=>{for(let Y=Math.floor((cy-ry)*S);Y<=(cy+ry)*S;Y++)for(let X=Math.floor((cx-rx)*S);X<=(cx+rx)*S;X++){const x=(X+.5)/S,y=(Y+.5)/S,nx=(x-cx)/rx,ny=(y-cy)/ry,d=nx*nx+ny*ny;if(d<=1)f(x,y,d,nx,ny);}};
 const FOR=(y0,y1,fn,x0,x1)=>{for(let Y=Math.floor(y0*S);Y<y1*S;Y++)for(let X=Math.floor((x0||0)*S);X<(x1==null?W:x1)*S;X++)fn((X+.5)/S,(Y+.5)/S);};
 const GL=(cx,cy,r,c,a)=>EL(cx,cy,r,r,(x,y,d)=>D(x,y,c,(1-Math.sqrt(d))*a));
 const R=(x,y,w,h,c)=>{const X0=Math.round(x*S),Y0=Math.round(y*S),X1=Math.round((x+w)*S),Y1=Math.round((y+h)*S);for(let Y=Y0;Y<Y1;Y++)for(let X=X0;X<X1;X++)PX(X,Y,c);};
 const L=(x0,y0,x1,y1,c)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1)*S;for(let i=0;i<=n;i++){const X=Math.round((x0+(x1-x0)*i/n)*S),Y=Math.round((y0+(y1-y0)*i/n)*S);PX(X,Y,c);PX(X+1,Y,c);PX(X,Y+1,c);PX(X+1,Y+1,c);}};
 const DOT=(x,y,c,n)=>{const X=Math.floor(x*S),Y=Math.floor(y*S);n=n||2;for(let j=0;j<n;j++)for(let i=0;i<n;i++)PX(X+i,Y+j,c);};
 const BALL=(cx,cy,rx,ry,cs,o)=>{o=o||{};const lx=o.lx==null?-.5:o.lx,ly=o.ly==null?-.6:o.ly,nz=o.nz==null?.35:o.nz;EL(cx,cy,rx,ry,(x,y,d,nx,ny)=>P(x,y,RP(cs,.58-(nx*lx+ny*ly)*.6+(fb(x*1.3,y*1.3)-.5)*nz*1.5+(hs(x,y)-.5)*nz*.2-(d>.8?.18:0),x,y)));};
 const BX=(x,y,w,h,cs,tx)=>{const X0=Math.round(x*S),Y0=Math.round(y*S),X1=Math.round((x+w)*S),Y1=Math.round((y+h)*S);for(let Y=Y0;Y<Y1;Y++)for(let X=X0;X<X1;X++){const xx=(X+.5)/S,yy=(Y+.5)/S,i=xx-x,j=yy-y;P(xx,yy,RP(cs,.85-i/w*.8+((fb(xx*1.3,yy*1.3)-.5)*1.2+(hs(xx,yy)-.5)*.3)*(tx==null?.25:tx)+(j<1?.1:0)-(i>w-1?.2:0),xx,yy));}};
 const SKY=(y0,y1,cs)=>FOR(y0,y1,(x,y)=>P(x,y,RP(cs,(y-y0)/(y1-y0)+(hs(x,y)-.5)*.03,x,y)));
 const SUN=(cx,cy,r,c)=>{GL(cx,cy,r*2.2,c,.55);EL(cx,cy,r*.55,r*.55,(x,y)=>P(x,y,'#fffdf0'));};
 const CLOUD=(y0,y1,th,cs,sx)=>{const g=(x,y)=>fb(x*(sx||.035)+3,y*.09+5)-Math.abs(y-(y0+y1)/2)/(y1-y0)*.4;FOR(y0,y1,(x,y)=>{const m=g(x,y);if(m>th){const m2=g(x+2,y+2);P(x,y,RP(cs,.75-(m-m2)*9+(m-th)*1.4,x,y));}});};
 const MTN=o=>{const top=x=>{let t=fb(x*o.f+o.s,2.7)*1.45-.28;if(o.fl)t=Math.min(t,o.fl);return o.b-o.amp*Math.max(0,t);};
  for(let X=0;X<DW;X++){const x=(X+.5)/S,t=top(x),lit=top(x-2)-top(x+2);for(let Y=Math.ceil(t*S);(Y+.5)/S<=o.b;Y++){const y=(Y+.5)/S,dep=(y-t)/Math.max(1,o.b-t);let c;
   if(o.sn&&dep<o.sn*(.45+fb(x*.2,y*.2)))c=RP(o.sc,.55+lit*.12+(fb(x*.3,y*.3)-.5)*.7,x,y);
   else c=RP(o.cs,.5+lit*.1+(fb(x*.25,y*.35)-.5)*.55+(o.tx?(hs(x,y)-.5)*o.tx*.6:0)+(o.bd?(((y>>2)&1)-.5)*o.bd:0)-dep*.1,x,y);
   P(x,y,c);if(o.hz)D(x,y,o.hc,dep*o.hz);}}};
 const GRD=(y0,cs,tx,y1)=>FOR(y0,y1||H,(x,y)=>{const d=(y-y0)/(H-y0);P(x,y,RP(cs,.3+fb(x*.05,y*.1+7)*.8+(1-d)*.12+(hs(x,y)-.5)*(tx||.25)*.6,x,y));});
 const SPK=(n,y0,y1,cs,a)=>{for(let i=0;i<n*2;i++)P(hs(i,1)*W,y0+hs(i,2)*(y1-y0),cs[i%cs.length]);};
 const FLW=(n,y0,y1,cs)=>{for(let i=0;i<n*2;i++){const X=Math.floor(hs(i,5)*DW),Y=Math.floor((y0+hs(i,6)*(y1-y0))*S),c=cs[i%cs.length];PX(X,Y,c);PX(X+1,Y,c);PX(X-1,Y,c);PX(X,Y-1,c);PX(X,Y+1,c);PX(X,Y,'#ffe680');if(i%3==0){PX(X,Y+2,'#3f8a36');PX(X,Y+3,'#3f8a36');}}};
 const TUFT=(n,y0,y1,a,b)=>{for(let i=0;i<n*2;i++){const X=Math.floor(hs(i,8)*DW),Y=Math.floor((y0+hs(i,9)*(y1-y0))*S);PX(X,Y,a);PX(X,Y-1,a);PX(X-1,Y-1,a);PX(X+1,Y-1,a);PX(X,Y-2,b);PX(X-1,Y-2,b);PX(X+1,Y-3,b);}};
 const SHD=(cx,cy,rx,ry,c,a)=>EL(cx,cy,rx,ry,(x,y,d)=>D(x,y,c,a*(1-d*.6)));
 const PALM=(x,b,h,lean)=>OBJ(()=>PALM_(x,b,h,lean),[.4,.5,.4]);
 const PALM_=(x,b,h,lean)=>{lean=lean||0;const pt=t=>[x+lean*t*t*h*.5+Math.sin(t*3)*1,b-t*h];for(let i=0;i<=h*S;i++){const [px,py]=pt(i/(h*S));DOT(px,py,(i%6<3)?'#8a6030':'#5a3a1a',2);DOT(px+1,py,'#4a2e14',2);}
  const [tx,ty]=pt(1);[-2.6,-1.9,-1.2,-.5,.5,1.2,1.9,2.6,0].forEach(a=>{for(let t=0;t<14;t+=.35){const px=tx+Math.sin(a*.55)*t*1.2,py=ty-Math.cos(a*.55)*t*.45+t*t*.05+(Math.abs(a)>2?t*.2:0);DOT(px,py,'#3fb04a',2);DOT(px,py+1,'#1f7a34',2);if(((t*3)|0)%3==2){DOT(px,py+2,'#2a8a3a',2);DOT(px+(a<0?-1:1),py+1,'#58d060',2);}}});BALL(tx,ty+2,2,2,['#3a2410','#5a3a1a','#8a6030']);};
 const FLAME=(x,y,s)=>{GL(x,y-s,s*5,'#ff7a1a',.55);EL(x,y-s,s*.9,s*1.8,(a,b,d,nx,ny)=>P(a,b,d>.6?'#ff5a14':ny<0?'#ffd84a':'#ff9a22'));EL(x,y-s*.6,s*.4,s,(a,b)=>P(a,b,'#fff6b0'));};
 

 const RPQ=(cs,v)=>cs[Math.min(cs.length-1,Math.max(0,Math.floor(cl(v)*cs.length)))];
 const OBJ=(fn,kk)=>{MSK=new Uint8Array(DW*DH);fn();const m=MSK;MSK=null;const f=kk||[.42,.5,.62],ed=[];for(let Y=0;Y<DH;Y++)for(let X=0;X<DW;X++){const i=Y*DW+X;if(!m[i])continue;if((X>0&&!m[i-1])||(X<DW-1&&!m[i+1])||(Y>0&&!m[i-DW])||(Y<DH-1&&!m[i+DW]))ed.push(i);}ed.forEach(i=>{B[i*4]*=f[0];B[i*4+1]*=f[1];B[i*4+2]*=f[2];});};
 const CEL=(cx,cy,rx,ry,cs,o)=>{o=o||{};const lx=o.lx==null?-.55:o.lx,ly=o.ly==null?-.65:o.ly,ph=o.ph||0,sc=o.sc||7,am=o.am==null?.1:o.am,n=cs.length;EL(cx,cy,rx*1.2,ry*1.2,(x,y)=>{const nx=(x-cx)/rx,ny=(y-cy)/ry,d=nx*nx+ny*ny,a=Math.atan2(ny,nx),e=1+am*Math.sin(a*sc+ph)+am*.6*Math.sin(a*(sc*2+1)+ph*2);if(d>e*e)return;const dd=Math.sqrt(d)/e,dl=nx*lx+ny*ly;const v=.62-dl*.5-Math.max(0,dd-.6)*(dl>0?.7:.25)+(o.nz?(fb(x*1.7,y*1.7)-.5)*o.nz:0);P(x,y,cs[Math.max(0,Math.min(n-1,Math.floor(v*n)))]);});};
 const TREEL=(x,b,h,w,cs,tr)=>{tr=tr||['#2a180c','#46301c','#6e4a2c','#8e6840'];SHD(x+w*.2,b+h*.01,w*.9,h*.09,'#0e2e18',.6);
  OBJ(()=>{const tw=Math.max(3.5,w*.2),ty=b-h*.52;
   for(let Y=Math.floor(ty*S);Y<=b*S;Y++){const y=Y/S,f=Math.max(0,y-(b-h*.1))/(h*.1),hw=tw/2+f*tw*.5;for(let X=Math.floor((x-hw)*S);X<=(x+hw)*S;X++){const xx=X/S,u=(xx-x+hw)/(hw*2),bark=((Math.floor(X/1.4)+Math.floor(Y*.35))%3==0)?-.09:0;PX(X,Y,tr[Math.max(0,Math.min(3,Math.floor((1-u)*3.6+bark*4)))]);}}
   L(x,b-h*.5,x-w*.28,b-h*.7,tr[1]);L(x,b-h*.52,x+w*.3,b-h*.72,tr[1]);
   [[0,-.7,.46,0],[-.36,-.56,.34,1],[.38,-.58,.34,2],[-.1,-.9,.34,3],[.26,-.84,.3,4],[-.5,-.8,.26,5],[.52,-.8,.26,6],[0,-.52,.3,7],[-.22,-.68,.3,8],[.2,-.7,.3,9]].forEach(([a,c,r,i])=>CEL(x+a*w,b+c*h,r*w,r*w*.86,cs,{ph:i*1.9,am:.1,sc:6+i%3,nz:.3}));
   const hi=[cs[Math.max(0,cs.length-3)],cs[cs.length-2],cs[cs.length-1]];
   [[-.3,-.92,.13],[-.05,-1.02,.12],[.2,-.9,.11],[-.5,-.74,.1],[.36,-.76,.1],[-.15,-.72,.1]].forEach(([a,c,r],i)=>CEL(x+a*w,b+c*h,r*w,r*w*.7,hi,{ph:i,am:.12,sc:5,lx:-.3,ly:-.5}));
  },[.36,.5,.4]);};
 const CAPS=(x0,y0,x1,y1,r,cs)=>{const dx=x1-x0,dy=y1-y0,ln=Math.hypot(dx,dy)||1,nxx=-dy/ln,nyy=dx/ln;for(let Y=Math.floor((Math.min(y0,y1)-r)*S);Y<=(Math.max(y0,y1)+r)*S;Y++)for(let X=Math.floor((Math.min(x0,x1)-r)*S);X<=(Math.max(x0,x1)+r)*S;X++){const x=(X+.5)/S,y=(Y+.5)/S;let t=((x-x0)*dx+(y-y0)*dy)/(ln*ln);t=Math.max(0,Math.min(1,t));const px=x0+dx*t,py=y0+dy*t,dd=Math.hypot(x-px,y-py);if(dd>r)continue;const u=((x-px)*.6+(y-py)*.8)/r,pl=((x-x0)*nxx+(y-y0)*nyy)/r,rf=((pl+1)*3.5)%1,rib=Math.abs(rf-.5)<.1?-.09:0;P(x,y,RPQ(cs,.74-u*.5+rib));if(Math.abs(rf-.5)<.04&&hs(x*3,y*3)<.16)P(x,y,'#f4efd0');}};
 const CACT=(x,b,h)=>{const r=Math.max(2.4,h*.115),cs=['#154a2a','#1f6a38','#2f8a44','#4aac58','#7ad07a','#a8e8a0'];SHD(x+r*.8,b,r*2.4,r*.7,'#5a3010',.5);
  OBJ(()=>{CAPS(x,b-1,x,b-h+r,r,cs);const a1=h*.52,a2=h*.38;CAPS(x-r,b-a1,x-r*2.9,b-a1,r*.72,cs);CAPS(x-r*2.9,b-a1,x-r*2.9,b-a1-h*.3,r*.72,cs);CAPS(x+r,b-a2,x+r*2.7,b-a2,r*.72,cs);CAPS(x+r*2.7,b-a2,x+r*2.7,b-a2-h*.26,r*.72,cs);EL(x+.4,b-h-.2,1.2,.9,(a,c)=>P(a,c,'#ff7aa8'));EL(x+.4,b-h-.5,.5,.4,(a,c)=>P(a,c,'#ffe27a'));},[.4,.5,.45]);};
 const BARREL=(x,b,r)=>{SHD(x+r*.5,b,r*1.3,r*.35,'#5a3010',.5);OBJ(()=>{EL(x,b-r*.85,r,r*.9,(a,c,d,nx,ny)=>{const sn=Math.abs(Math.sin(nx*5.5));P(a,c,RPQ(['#154a2a','#1f6a38','#2f8a44','#4aac58','#7ad07a'],.7-(nx*.55+ny*.65)*.42+(sn<.18?-.1:0)));if(sn<.05&&hs(a*3,c*3)<.5)P(a,c,'#f4efd0');});EL(x,b-r*1.75,r*.35,r*.22,(a,c)=>P(a,c,'#ff7aa8'));},[.4,.5,.45]);};
 const ICRY=(x,b,h,w,l)=>{const tipx=x+l*h*.28;OBJ(()=>{for(let Y=Math.floor((b-h)*S);Y<=b*S;Y++){const y=(Y+.5)/S,t=(b-y)/h,f=Math.pow(t,1.15),hw=w*(1-f)+.25,cx=x+(tipx-x)*Math.pow(t,1.3);for(let X=Math.floor((cx-hw)*S);X<=(cx+hw)*S;X++){const xx=(X+.5)/S,u=(xx-cx+hw)/(hw*2),g=1-t;let c;
   if(u<.07)c='#f4ffff';else if(u<.4)c=g>.72?'#e6fcff':'#b6f0ff';else if(u<.66)c=RPQ(['#38b4e8','#5cd0f4','#8ce4fa'],.3+g*.8);else if(u<.9)c=RPQ(['#1a5ea8','#2a84c8','#3ca8e0'],.2+g*.8);else c='#17508e';
   if(Math.abs(u-.4)<.025)c='#ffffff';PX(X,Y,c);}}
   L(x-w*.1,b-h*.12,tipx-w*.05,b-h*.6,'#8ee6fb');L(x+w*.15,b-h*.3,tipx+w*.04,b-h*.7,'#2a7ec0');},[.4,.5,.75]);};
 const IP=['#0e2c70','#1a50a4','#2c80d0','#56b6f0','#98dffa','#e4fbff'];
 const FCET=(cx,b,w,h,o)=>{o=o||{};GL(cx,b-h*.5,w*1.3+6,'#6af0ff',.28);OBJ(()=>{for(let Y=Math.floor((b-h)*S);Y<=b*S;Y++){const y=(Y+.5)/S,t=(b-y)/h,hw=t<.68?w/2:w/2*Math.pow((1-t)/.32,.8)+.2;for(let X=Math.floor((cx-hw)*S);X<=(cx+hw)*S;X++){const x=(X+.5)/S,u=(x-cx+hw)/(hw*2),g=1-t,nz=(fb(x*.5,y*.5)-.5)*.25,bn=(Math.floor((b-y)/(h*.16))%2)*.05;let c;
   if(t>.68){c=u<.5?RPQ(IP.slice(3),.55+g*.1+nz):RPQ(IP.slice(0,4),.55-g*.1+nz);}
   else if(u<.12)c='#f4ffff';else if(u<.5)c=RPQ(IP.slice(2),.45+g*.35+nz+bn);else if(u<.8)c=RPQ(IP.slice(1,5),.3+g*.4+nz+bn);else c=RPQ(IP.slice(0,3),.35+g*.3+nz);
   if(Math.abs(u-.5)<.025)c='#ffffff';PX(X,Y,c);}}
   if(o.win)for(let k3=0;k3<o.win;k3++){const wy=b-h*(.22+k3*.17);R(cx-.8,wy,1.6,4,'#f0ffff');R(cx-.4,wy-1,.8,1,'#f0ffff');GL(cx,wy+2,3.2,'#aef8ff',.55);}
   if(o.sp)for(let i=0;i<5;i++){const yy=b-h*(.7+i*.05);P(cx+(i%2?-1:1)*(.8+i*.1),yy,'#ffffff');}},[.45,.55,.8]);};
 const ICITADEL=(cx,b)=>{GL(cx,b-26,46,'#8af0ff',.3);
  OBJ(()=>{BX(cx-30,b-15,60,15,['#10347a','#2c80d0','#8ad4f6','#e4fbff'],.3);for(let x=cx-30;x<cx+30;x+=6)BX(x,b-20,3,5,['#1a50a4','#58b8f0','#e4fbff'],.2);for(let x=cx-27;x<cx+27;x+=9)R(x,b-11,1.6,6,'#f0ffff');EL(cx,b-1,6,9,(a,c,d)=>P(a,c,d>.78?'#e4fbff':RPQ(['#bff4ff','#6af0ff','#2c80d0'],d)));},[.5,.6,.8]);
  FCET(cx-24,b-12,9,26,{win:2});FCET(cx+24,b-12,9,29,{win:2});FCET(cx-13,b-12,11,37,{win:3,sp:1});FCET(cx+13,b-12,11,34,{win:3});FCET(cx,b-10,15,54,{win:4,sp:1});
  [[cx-36,b,18,5,-.3],[cx+36,b,22,6,.35],[cx-42,b,10,4,-.5]].forEach(a=>ICRY(...a));
  for(let i=0;i<12;i++){const x=cx-28+i*5,l=2+hs(i,9)*4;for(let k3=0;k3<l;k3++)P(x,b-15+k3,k3<l-1?'#bff4ff':'#ffffff');}};
 const ICEFL=(x,y,s)=>{OBJ(()=>{for(let q=0;q<6;q++){const a=q*Math.PI/3-Math.PI/2;for(let t=0;t<=s;t+=.3){const w2=(1-Math.abs(t/s-.45)*1.4)*s*.28+.3;EL(x+Math.cos(a)*t,y+Math.sin(a)*t*.55,w2,w2*.7,(xx,yy,d,nx,ny)=>P(xx,yy,RPQ(['#5ac0f0','#a8e6ff','#e8fbff','#ffffff'],.7-(nx*-.4+ny*-.5)*.5-(t/s)*.2)));}}EL(x,y,s*.2,s*.14,(a,c)=>P(a,c,'#fff6a8'));},[.5,.6,.8]);};
 const GLS=['#0b2250','#14408a','#1f64b4','#3a96d8','#86d0f2','#d8f6ff'];
 const TWR=(x,b,w,h,o)=>{o=o||{};const sd2=o.s||0,top=b-h;
  OBJ(()=>{for(let Y=Math.floor(top*S);Y<=b*S;Y++){const y=(Y+.5)/S,t=(y-top)/h;for(let X=Math.floor(x*S);X<(x+w)*S;X++){const xx=(X+.5)/S,u=(xx-x)/w;if(o.cut&&u>.55&&(y-top)<(u-.55)*w*o.cut)continue;let v=.62-u*.5+(1-t)*.12;const sh=((xx-x)+(y-top)*.6)%11;if(sh<2.2)v+=.14;let c=RPQ(GLS,v);if(X%4==0)c=RPQ(GLS,v-.14);if(Y%7==0)c=RPQ(GLS,v+.1);const wx=Math.floor((xx-x)/1.6),wy=Math.floor((y-top)/1.4);if(X%4>=1&&Y%7>=2&&hs(wx+sd2*13,wy)<.2)c=hs(wx,wy+sd2)<.5?'#e8ffff':'#ffd2f0';PX(X,Y,c);}}
   if(o.crown){BX(x+w*.25,top-h*.08,w*.5,h*.08,['#0e3470','#1f64b4','#5ab4e8'],.1);R(x+w*.5-.4,top-h*.08-5,.8,5,'#cfeaff');}},[.32,.42,.62]);
  R(x,top,.6,h,'#aef4ff');if(o.neon){R(x+w-1,top+h*.2,.6,h*.8,o.neon);D(x+w,top+h*.2,o.neon,.5);}
  if(o.crown){const cy=top-h*.08-5;P(x+w*.5,cy,'#ff5a8a');GL(x+w*.5,cy,3,'#ff5a8a',.7);}};
 const FARS=(b,cs)=>{for(let x=0;x<W;){const w=6+Math.floor(hs(x,3)*8),h=14+Math.floor(hs(x,4)*16);BX(x,b-h,w,h,cs,.1);for(let q=0;q<4;q++)if(hs(x,q+9)<.5)R(x+1+hs(x,q)*(w-3),b-h+2+q*4,1,1,'#e8ffff');x+=w+Math.floor(hs(x,8)*3);}};
 
 const ROCK=(cx,b,rx,ry,sd0)=>{OBJ(()=>{const cy=b-.55*ry;EL(cx,cy,rx*1.3,ry*1.3,(x,y)=>{const nx=(x-cx)/rx,ny=(y-cy)/ry,a=Math.atan2(ny,nx),e=.9+.14*Math.sin(a*3+sd0)+.1*Math.sin(a*5+sd0*2)+.06*Math.sin(a*9+sd0);if(ny>.55)return;const d=Math.hypot(nx,ny);if(d>e)return;let v=.55-(nx*-.5+ny*-.75)*.45+((ny<-.25)?.18:(nx<-.2?.02:-.14))+(fb(x*1.1,y*1.1)-.5)*.35;let c=RPQ(['#2a2630','#443f4e','#625c6c','#827b8c','#a8a1b2','#cdc7d6'],v);if(Math.abs(fb(x*.6+sd0,y*.6)-.5)<.025)c='#25212c';P(x,y,c);});},[.5,.5,.6]);EL(cx,b+.2,rx*1.15,ry*.28,(x,y,d)=>{if(d>.55&&fb(x*.8,y)>.35)P(x,y,'#ffffff');});};
 const BUSH=(x,b,w,cs,fl)=>{SHD(x+w*.1,b,w*.6,w*.12,'#0e2e18',.5);OBJ(()=>{[[-.3,-.2,.3,0],[.32,-.2,.3,1],[0,-.34,.38,2],[-.12,-.5,.24,3]].forEach(([a,c,r,i])=>CEL(x+a*w,b+c*w,r*w,r*w*.8,cs,{ph:i*2,am:.12,sc:6,nz:.25}));},[.36,.5,.4]);for(let i=0;i<7;i++){const X=Math.floor((x+(hs(i,x)-.5)*w*.9)*S),Y=Math.floor((b-w*(.15+hs(i,x+9)*.4))*S);PX(X,Y,fl);PX(X+1,Y,fl);PX(X,Y+1,fl);}};
 const DOME=(cx,by,r,h,cs)=>{OBJ(()=>{for(let Y=Math.floor((by-h)*S);Y<=by*S;Y++){const y=(Y+.5)/S,t=(by-y)/h,hw=r*Math.sin(Math.PI*Math.pow(Math.max(0,t),.6));if(hw<=.05)continue;for(let X=Math.floor((cx-hw)*S);X<=(cx+hw)*S;X++){const x=(X+.5)/S,u=(x-cx+hw)/(hw*2);PX(X,Y,RPQ(cs,.9-u*.8+(Math.sin((x-cx)*1.7)>.8?-.1:0)));}}R(cx-.3,by-h-3.2,.6,3.4,'#ffd84a');EL(cx,by-h-3.4,.8,.8,(a,c)=>P(a,c,'#ffe890'));},[.3,.42,.45]);};
 const SS=['#7a5428','#a8803c','#cfa85c','#ecc880','#fbe6aa'];
 const PN2=(x,b,h)=>{SHD(x+h*.14,b,h*.4,h*.05,'#7a9cc8',.8);BX(x-h*.03,b-h*.1,Math.max(1.6,h*.06),h*.1,['#2a180c','#4a3020','#6e4a2c'],.2);
  for(let t=0;t<4;t++){const bt=b-h*.06-t*(h*.2),hh=h*.34,w=(h*.2)*(1-t*.17)+1.6;
   for(let Y=Math.floor((bt-hh)*S);Y<=bt*S;Y++){const y=(Y+.5)/S,f=(y-(bt-hh))/hh,sc=1+.08*Math.sin(f*14+t*2),hw=f*w*sc;for(let X=Math.floor((x-hw)*S);X<=(x+hw)*S;X++){const xx=(X+.5)/S,u=(xx-x+hw)/(hw*2+.01),se=.52+.14*Math.sin(u*9+t*2)-(u>.5?.14:0);PX(X,Y,f<se?RPQ(['#9fbbdc','#d4e6f6','#f4faff','#ffffff'],.95-u*.6-(f>se-.12?.2:0)):RPQ(['#0f3a2e','#1b5a44','#2c7c5c','#46a07a'],.9-u*.85-(f>.88?.2:0)));}}}};
// ---------------- scenes ----------------
 if(k==='home'){
  const G6=['#143e24','#1f5c34','#2f8040','#52a850','#86d070','#b4ec8c'],PK=['#7a2a50','#b8487c','#e878a8','#f8a8c8','#ffd0e2','#fff0f6'];
  SKY(0,64,['#3d94e6','#62b2f0','#8fcff8','#c4ebfc','#e6f8ff']);SUN(160,17,9,'#fff0a0');
  CLOUD(4,46,.5,['#8fb0dc','#c4d8f2','#ffffff','#ffffff'],.04);
  {const PK2=[[56,38,30],[100,30,42],[144,38,32],[122,52,26],[28,44,28],[178,46,26]];FOR(26,73,(x,y)=>{let top=99,lit=0;for(const [px,ty,w] of PK2){const d=Math.abs(x-px)/w;if(d<1){const yy=72-(72-ty)*Math.max(0,(1-d)+(fb(x*.35+px,2)-.5)*.2);if(yy<top){top=yy;lit=x<px?1:-1;}}}if(y<top)return;const h=72-top,dep=(y-top)/h,nz=(fb(x*.3,y*.4)-.5)*.5;if(y-top<h*.36*(.75+fb(x*.4,y*.4)*.6))P(x,y,RP(['#9db6dc','#d8e6f8','#ffffff'],.5+lit*.22+nz*.6,x,y));else P(x,y,RP(['#3f628e','#5f86b4','#8fb0d4','#b4cde6'],.48+lit*.2-dep*.18+nz,x,y));D(x,y,'#d6e8f6',.3*(1-dep));});}
  FOR(54,76,(x,y)=>D(x,y,'#e4f0f8',Math.max(0,(y-54)/22)*.42));
  {const t1=x=>63+Math.sin(x*.03+1)*4+Math.sin(x*.075)*2+(fb(x*.05,5)-.5)*5,t2=x=>67.5+Math.sin(x*.045+2.4)*2.4+Math.sin(x*.11)*1.1+(fb(x*.07,9)-.5)*3;
   FOR(56,78,(x,y)=>{const t=t1(x);if(y<t)return;const d=(y-t)/14;P(x,y,RP(['#6f9ab4','#86b0c0','#a0c4cc','#bcd8d4'],.38+(fb(x*.2,y*.4)-.5)*.3-Math.min(1,d)*.25+(Math.abs(t1(x-2)-t1(x+2))<.4?0:.05),x,y));D(x,y,'#d6e8ee',.24*(1-Math.min(1,d)));});
   FOR(60,80,(x,y)=>{const t=t2(x);if(y<t)return;const d=(y-t)/10;P(x,y,RP(['#2f6a44','#3f8450','#5aa060','#82bc78'],.36+(fb(x*.25,y*.5)-.5)*.35-Math.min(1,d)*.2+((Math.sin(x*.3+y)>.9)?.1:0),x,y));D(x,y,'#cfe6c0',.14*(1-Math.min(1,d)));});
   for(let i=0;i<46;i++){const x=2+i*4.1+(hs(i,41)-.5)*2.6,r=1.8+hs(i,42)*2.2,y=t2(x)+1.4+hs(i,43)*2.2;OBJ(()=>CEL(x,y-r*.4,r,r*.85,['#143e24','#1f5c34','#2f8040','#52a850','#86d070'],{ph:i,am:.12,sc:6,nz:.2}),[.5,.6,.55]);}
   const eg=x=>71.5+Math.sin(x*.055+.6)*1.6+Math.sin(x*.14)*.7+(fb(x*.08,3)-.5)*2.2;
   FOR(66,H,(x,y)=>{const e=eg(x);if(y<e)return;const d=(y-e)/(H-e),v=.3+fb(x*.05,y*.1+7)*.8+(1-d)*.12+(hs(x,y)-.5)*.2;P(x,y,RP(['#2a7a36','#3f9a44','#5cba50','#82d866','#a8ec80'],v+((y-e)<2.4?.32:0),x,y));});
   FOR(66,96,(x,y)=>{const e=eg(x);if(y<e)return;D(x,y,'#d6f6a8',Math.max(0,1-(y-e)/22)*.32);if(((Math.floor((y-70)/5))&1)&&y>76)D(x,y,'#ffffff',.045);});
   for(let x=2;x<W;x+=2.5){const e=eg(x);if(hs(x,77)<.55){P(x,e+.3,'#b4ec8c');P(x,e-.7,'#52a850');}}}
  [[40,19],[48,24],[128,21],[136,26],[150,30]].forEach(([x,y])=>{P(x,y,'#2a3a58');P(x+1,y-1,'#2a3a58');P(x+2,y,'#2a3a58');P(x-1,y-1,'#2a3a58');});
  const CX=96,CY=87,RX=41,RY=11.5,PY=CY+RY-3;
  const pcx=y=>96+Math.sin((y-96)*.06)*3,phw=y=>8+(y-PY)*.34;
  const STN=(x,y,u,bw,rh,cs)=>{const row=Math.floor(u/rh),off=(row&1)*bw/2,fx=(((x+off)%bw)+bw)%bw/bw,fy=(u/rh)-row;const mortar=fx<.1||fy<.16;return mortar?'#a58f64':RP(cs,.55+(fb(x*.7,u*.5)-.5)*.5+(fy>.7?-.1:fy<.35?.12:0)-(fx<.2?.06:0),x,y);};
  const SC=['#b9a278','#d2bc8c','#e6d4a6','#f6ead0'];
  SHD(CX,CY+3.2,RX+2,RY+2.6,'#0e3a18',.5);
  FOR(PY,H,(x,y)=>{const c=pcx(y),h=phw(y),dx=Math.abs(x-c);if(dx>h+1.2)return;if(dx>h){P(x,y,'#8a7650');return;}P(x,y,dx>h-1.1?'#cdb888':STN(x,y,(y-PY)*1.15,5+(y-PY)*.05,2.5,SC));});
  FOR(PY,H,(x,y)=>{const c=pcx(y),h=phw(y),dx=Math.abs(x-c);if(dx>h+1.2&&dx<h+3.2&&hs(Math.floor(x),Math.floor(y))<.22)P(x,y,'#4a8a36');});
  EL(CX,CY+1.2,RX+1.6,RY+1.4,(x,y)=>P(x,y,'#8a7650'));
  EL(CX,CY,RX,RY,(x,y,d,nx,ny)=>{const c=d>.86?(ny<-.3?'#e8d8ae':'#b39c70'):STN(x,y+nx*0,(ny+1)*RY*1.2+4,6.4,2.5,SC);P(x,y,c);});
  for(let a=0;a<Math.PI*2;a+=.025){const x=CX+Math.cos(a)*RX*.8,y=CY+Math.sin(a)*RY*.8;if(Math.floor(a*16)%3!==0){DOT(x,y,'#e8b02c',2);if(Math.sin(a)<0)DOT(x,y-.5,'#ffe27a',1);}}
  for(let i=0;i<8;i++){const a=i*.8+.3,x=CX+Math.cos(a)*RX*.8,y=CY+Math.sin(a)*RY*.8;P(x,y,'#fff6b0');P(x+1,y,'#ffe27a');P(x-1,y,'#ffe27a');P(x,y-1,'#ffe27a');P(x,y+1,'#ffe27a');}
  const FENCE=(x0,x1,yb,s2)=>OBJ(()=>{BX(x0,yb-7*s2,x1-x0,1.4*s2,['#5a3a1c','#8a5e32','#b8884e'],.2);BX(x0,yb-3.6*s2,x1-x0,1.4*s2,['#5a3a1c','#8a5e32','#b8884e'],.2);for(let x=x0;x<x1;x+=9*s2)BX(x,yb-9*s2,2.2*s2,9*s2,['#4a2e14','#7a5028','#a8763c'],.25);},[.4,.4,.4]);
  FENCE(0,44,66,1);FENCE(148,192,67,1);
  TREEL(130,76,34,17,G6);TREEL(66,75,36,18,G6);
  TREEL(24,88,70,32,G6);
  TREEL(176,92,66,31,PK,['#2a180c','#4a301c','#74502c','#9a7442']);
  const LANT=(x,b)=>{SHD(x+1,b+.5,5,1.4,'#0e3a18',.5);GL(x,b-14,9,'#ffe080',.28);OBJ(()=>{BX(x-3.4,b-2.4,6.8,2.4,['#4a4a58','#7a7a8a','#a8a8b8'],.2);BX(x-1,b-12.6,2,10.4,['#5a5a68','#8a8a9a','#b8b8c8'],.2);BX(x-3.6,b-17.4,7.2,5,['#5a5a68','#8a8a9a','#b8b8c8'],.15);for(let t=0;t<5;t++){const hw=5.4*(1-t/5);BX(x-hw,b-22.4+t,hw*2,1,['#4a4a58','#7a7a8a','#a8a8b8'],.1);}BX(x-.8,b-24.2,1.6,1.8,['#c89a2a','#ffd860','#fff0a0'],.05);},[.4,.4,.5]);EL(x,b-14.9,1.9,1.9,(a,c,d)=>P(a,c,d>.6?'#ffb840':'#fff2a0'));};
  LANT(40,91);LANT(152,91);
  {const PW=[30,116,23,8.2];
   EL(PW[0],PW[1]+1,PW[2]+2.6,PW[3]+2,(x,y,d)=>P(x,y,'#4a4a58'));
   EL(PW[0],PW[1],PW[2]+2.2,PW[3]+1.6,(x,y,d,nx,ny)=>{const st=hs(Math.floor(x/2.2),Math.floor(y/1.4))<.5;P(x,y,RPQ(['#6a6a78','#9a9aa8','#c4c4d0','#e4e4ec'],(st?.55:.35)+(ny<0?.22:-.1)+(hs(x,y)-.5)*.15));});
   EL(PW[0],PW[1],PW[2],PW[3],(x,y,d,nx,ny)=>{const fl=fb(x*.35,y*.9);let c=RPQ(['#1f6aa8','#2e86c8','#43a8e4','#6cc8f4'],.45+(1-d)*.3+(fl-.5)*.7+(ny<-.3?.12:0));if(fl>.72)c='#d8f4ff';P(x,y,c);});
   [[24,114,2.6],[38,118,2.4],[32,121,2]].forEach(([x,y,r])=>{EL(x,y,r,r*.55,(a,c,d)=>P(a,c,d>.6?'#2e8a3e':'#52c060'));EL(x+.6,y-.3,.8,.5,(a,c)=>P(a,c,'#ffb8d0'));});
   for(let i=0;i<7;i++)P(PW[0]-16+hs(i,3)*30,PW[1]-4+hs(i,4)*8,'#ffffff');
   [[10,108],[13,107],[12,110]].forEach(([x,y])=>{R(x,y-5,.7,6,'#6a4a22');EL(x+.3,y-5.4,.9,1.6,(a,c)=>P(a,c,'#4a2a12'));});}
  NG=(x,y)=>{const nx=(x-CX)/(RX+3),ny=(y-CY)/(RY+3);if(nx*nx+ny*ny<1)return true;if(y>PY&&Math.abs(x-pcx(y))<phw(y)+3)return true;const px=(x-30)/27,py=(y-116)/12;return px*px+py*py<1;};
  TUFT(150,72,127,'#2a7a36','#8ae870');FLW(110,76,127,['#ff6a8a','#ffffff','#ffd84a','#b88aff','#ff9a4a','#6ab8ff']);
  [[46,96],[148,97],[16,100],[176,106],[130,112],[66,118]].forEach(([cx,cy],q)=>{for(let i=0;i<16;i++){const x=cx+(hs(i,q+20)-.5)*16,y=cy+(hs(i,q+30)-.5)*7,c=['#ff6a8a','#ffffff','#ffd84a','#b88aff','#ff9a4a'][(i+q)%5];DOT(x,y,c,2);DOT(x+.5,y-.5,'#ffe680',1);P(x+.25,y+1.5,'#3f8a36');}});
  NG=null;
  [[20,97],[154,100],[104,121]].forEach(([x,y])=>{R(x,y,1,3,'#f4ecd8');BALL(x,y-1,3,2,['#9a2a2a','#d83a3a','#f06a5a']);P(x-1,y-1,'#ffffff');});
  ROCK(174,112,5,3,2.2);ROCK(62,124,4,2.4,.7);
  [[56,86],[138,84],[70,106],[124,102]].forEach(([x,y],i)=>{const c=['#ffb04a','#ff8ab0','#8ac8ff','#ffe27a'][i];P(x,y,c);P(x+1,y-1,c);P(x-1,y-1,c);P(x+.5,y,'#3a2410');});
  [[60,82],[126,80],[84,70],[168,76],[28,78],[112,92]].forEach(([x,y])=>{P(x,y,'#ffe27a');P(x+1,y,'#fff6b0');P(x-1,y,'#fff6b0');P(x,y+1,'#fff6b0');P(x,y-1,'#fff6b0');});
  SPK(34,66,127,['#ffffd0','#ffffff']);
 }else
 if(k==='forest'){
  SKY(0,66,['#3d94e6','#62b2f0','#8fcff8','#c4ebfc','#e6f8ff']);SUN(160,18,9,'#fff0a0');CLOUD(4,46,.52,['#8fb0dc','#c4d8f2','#ffffff','#ffffff']);
  MTN({b:70,amp:40,f:.011,s:2,cs:['#4b6e9a','#6f93bd','#9cbbd8','#c3d8ea'],hz:.7,hc:'#d2e6f4',sn:.28,sc:['#a0b8dc','#dbe8f8','#ffffff']});
  MTN({b:72,amp:18,f:.022,s:9,cs:['#3d6e78','#5a9088','#7fb09c'],hz:.5,hc:'#bcd8cc',tx:.3});
  MTN({b:72,amp:9,f:.04,s:4,cs:['#1f5a34','#2e7a44','#4aa056','#78c470'],tx:.6});
  {const L0=y=>129+Math.sin(y*.35)*2+fb(y*.2,3)*3;
   OBJ(()=>{for(let Y=Math.floor(28*S);Y<=73*S;Y++){const y=(Y+.5)/S;for(let X=Math.floor(L0(y)*S);X<W*S;X++){const x=(X+.5)/S,top=32+fb(x*.12,1)*7-(x>176?4:0);if(y<top)continue;const dp=y-top,u=(x-L0(y))/(W-L0(y)),yy=y+fb(x*.08,y*.1)*3,bd=Math.floor(yy/5.5),bf=yy/5.5-bd;let v=.72-u*.45+(fb(x*.35,y*.3)-.5)*.5+(bf<.14?.2:bf>.86?-.15:0)+hs(bd,Math.floor(x/9))*.1-dp/40*.1;let c=RPQ(['#2e2c42','#454360','#625f7c','#85829c','#aeabc2'],v);if(dp<2.2)c=RPQ(['#2f7a3a','#43a44c','#6ccc5c'],.5+fb(x*.5,y)*.7);else if(dp<3.4&&fb(x*.7,3)>.5)c='#2a6a34';PX(X,Y,c);}}},[.4,.4,.55]);}


  GRD(72,['#2a7a36','#3f9a44','#5cba50','#82d866','#a8ec80'],.35);
  const RC=y=>150+(y-72)*.3+Math.sin(y*.13)*5,RW=y=>5+(y-72)*.2;
  FOR(72,H,(x,y)=>{const cx=RC(y),w=RW(y),d=Math.abs(x-cx)/w;if(d>1.18)return;if(d>1.05){P(x,y,'#2a1c10');return;}if(d>.95){P(x,y,'#6a8a4a');return;}const fl=fb(x*.3,y*.07+x*.01);let c;if(d>.82)c=fl>.55?'#e6fbff':'#8ee0f8';else{c=RPQ(['#1f6aa8','#2e86c8','#43a8e4','#6cc8f4'],.55+(1-d)*.3+(fl-.5)*.9+Math.sin(y*.5+x*.2+fb(x*.1,y*.1)*6)*.06);if(fl>.7)c='#c4f0ff';}P(x,y,c);});
  for(let y=76;y<H;y+=5){[-1,1].forEach((sg,q)=>{if(hs(y,q)<.62)OBJ(()=>CEL(RC(y)+sg*(RW(y)+1.4),y,2.4+hs(y,3)*1.4,1.7,['#3a3a46','#5a5a68','#7e7e8e','#a4a4b4','#c8c8d6'],{am:.12}),[.45,.45,.55]);});}
  [[82,0],[96,-.3],[110,.4],[122,-.2]].forEach(([y,o])=>{const x=RC(y)+o*RW(y);EL(x,y,3,1.5,(a,c,d)=>P(a,c,d>.7?'#2e8a3e':'#4cc058'));EL(x+.8,y-.4,.9,.6,(a,c)=>P(a,c,'#ffb8d0'));});
  {const WF=(x0,x1,y0,y1)=>{for(let Y=Math.floor(y0*S);Y<y1*S;Y++){const y=(Y+.5)/S;for(let X=Math.floor(x0*S);X<x1*S;X++){const x=(X+.5)/S,u=(x-x0)/(x1-x0),st=fb(x*1.4,y*.05+x*.3),ed=Math.min(u,1-u);PX(X,Y,ed<.14?(st>.55?'#bfeaff':'#4aa0dc'):RPQ(['#4aa0dc','#7cc8f4','#bfeaff','#ffffff'],.35+st*.8+(y-y0)/(y1-y0)*.15));}}};
   WF(150,155.5,34,51.5);EL(152.7,52,4.6,1.1,(x,y,d)=>P(x,y,d>.5?'#ffffff':'#bfeaff'));WF(148.5,157,52.5,72);
   EL(152.7,73,9,2.4,(x,y,d)=>P(x,y,d>.5?'#ffffff':fb(x*.8,y*.8)>.5?'#e6fbff':'#9ad8f4'));EL(153,77,10,3.3,(x,y,d)=>P(x,y,d>.82?'#e8fbff':RPQ(['#1f6aa8','#2e86c8','#43a8e4','#6cc8f4'],.5+(1-d)*.3+(fb(x*.4,y*.6)-.5)*.5)));
   GL(152.7,71,14,'#ffffff',.5);for(let i=0;i<26;i++)P(144+hs(i,1)*17,66+hs(i,2)*10,'#ffffff');
   for(let i=0;i<7;i++){const r=14+i*1.1,cc=['#ff6a6a','#ffb04a','#ffee6a','#6ae06a','#5ac8ff','#6a7aff','#b06aff'][i];for(let a=Math.PI*1.05;a<Math.PI*1.95;a+=.02)D(152+Math.cos(a)*r*1.1,86+Math.sin(a)*r,cc,.2);}
   ROCK(143,78,5,3.2,1.2);ROCK(163,79,6,3.6,2.4);ROCK(158,70,4,2.6,.7);
   TREEL(138,36,17,10,['#143e24','#1f5c34','#2f8040','#52a850','#86d070','#b4ec8c']);TREEL(171,35,20,11,['#143e24','#1f5c34','#2f8040','#52a850','#86d070','#b4ec8c']);}

  for(let y=(70)+.25;y<H;y+=.5){const cx=62-(y-70)*.55+Math.sin(y*.1)*6,w=4+(y-70)*.38;for(let x=(Math.floor(cx-w-1))+.25;x<=cx+w+1;x+=.5){const d=Math.abs(x-cx)/w;if(d>1.12)continue;P(x,y,d>1?'#8a6a3a':RP(['#9a7444','#bc9660','#dcb87c','#f0d8a0'],.45+(hs(x,y)-.5)*.5+(1-d)*.25,x,y));}}
  TREEL(28,86,66,30,['#143e24','#1f5c34','#2f8040','#52a850','#86d070','#b4ec8c']);TREEL(60,74,36,18,['#143e24','#1f5c34','#2f8040','#52a850','#86d070','#b4ec8c']);TREEL(118,76,34,17,['#143e24','#1f5c34','#2f8040','#52a850','#86d070','#b4ec8c']);TREEL(184,92,70,30,['#143e24','#1f5c34','#2f8040','#52a850','#86d070','#b4ec8c']);

  {const G6=['#143e24','#1f5c34','#2f8040','#52a850','#86d070','#b4ec8c'];BUSH(52,92,14,G6,'#ff7aa0');BUSH(104,100,12,G6,'#ffd84a');BUSH(14,116,16,G6,'#ffffff');BUSH(187,121,13,G6,'#ff9a4a');
   OBJ(()=>{BX(84,104,20,5,['#3a2410','#6e4a2c','#9a6e40'],.25);EL(84,106.5,1.4,2.5,(a,c,d)=>P(a,c,d>.5?'#d8b078':'#9a6e40'));},[.4,.4,.4]);
   [[40,20],[48,25],[58,19],[70,28]].forEach(([x,y])=>{P(x,y,'#2a3a58');P(x+1,y-1,'#2a3a58');P(x+2,y,'#2a3a58');P(x-1,y-1,'#2a3a58');});
   [[60,96],[120,108],[70,120]].forEach(([x,y],i)=>{const c=['#ff9a4a','#ffffff','#9ad8ff'][i];P(x,y,c);P(x+1,y-1,c);P(x-1,y-1,c);P(x,y,'#3a2410');});}

  NG=(x,y)=>y>=70&&Math.abs(x-RC(y))<RW(y)*1.35+1;TUFT(70,74,127,'#2a7a36','#8ae870');FLW(120,74,127,['#ff6a8a','#ffffff','#ffd84a','#b88aff','#ff9a4a']);NG=null;
  [[40,104],[100,112],[132,106]].forEach(([x,y])=>{R(x,y,1,3,'#f4ecd8');BALL(x,y-1,3,2,['#9a2a2a','#d83a3a','#f06a5a']);});
  SPK(30,72,127,['#ffffd0','#ffffff']);
 }else if(k==='sea'){
  SKY(0,56,['#3f9cec','#68baf6','#98d8fb','#cff1fd','#f4fdff']);SUN(122,22,8,'#fff2b0');CLOUD(3,40,.55,['#90b4de','#c8dcf4','#ffffff','#ffffff']);
  MTN({b:58,amp:20,f:.016,s:6,cs:['#4a7aa8','#6a9cc0','#8ebad0'],hz:.6,hc:'#cfe8f2'});
  for(let y=(52)+.25;y<76;y+=.5)for(let x=(0)+.25;x<W;x+=.5){const t=(y-52)/24,v=.15+t*.75+(fb(x*.04,y*1.2)-.5)*.5;P(x,y,RP(['#6ee0f4','#3cc2ee','#2aa0dc','#1f82c4'].reverse(),1-v,x,y));}
  for(let y=(53)+.25;y<76;y+=.5){const sp=3+(y-53)*.9;for(let i=0;i<3;i++){const x=122+(hs(y,i)-.5)*sp*2;R(x,y,2+(y-53)*.1,1,'#fff6c8');}}
  for(let i=0;i<120;i++){const y=53+hs(i,3)*22;R(hs(i,4)*W,y,2+(y-53)*.15,1,hs(i,7)<.5?'#c8f6ff':'#ffffff');}
  {const ix=158,tp=x=>58-13*Math.sqrt(Math.max(0,1-Math.pow((x-ix)/42,2)));
   EL(ix,58,42,13,(x,y,d,nx,ny)=>{if(y>58)return;P(x,y,RP(['#24603a','#3a8a4a','#5cb860','#8ede78'],.55+(nx*.5+ny*.6)*-.5+(hs(x,y)-.5)*.3-(d>.8?.15:0),x,y));});
   for(let y=(59)+.25;y<65;y+=.5)for(let x=(ix-36)+.25;x<=ix+36;x+=.5)D(x,y,'#1c5a6a',.5*(1-(y-59)/6)*(1-Math.abs(x-ix)/42));
   const HSE2=(x,b,w,h,wl,rf)=>{BX(x,b-h,w,h,wl,.1);for(let r=0;r<Math.ceil(w/2)+1;r++)R(x-1+r,b-h-1-r,w+2-2*r,1,r%2?rf[0]:rf[1]);R(x+1,b-h+1,1,2,'#3a5a8a');};
   const ROOF=(cx,ty,w,h,c1,c2)=>{for(let t=0;t<h;t++){const hw=w/2*(t+1)/h;for(let X=(Math.round(cx-hw))+.25;X<=cx+hw;X+=.5)P(X,ty+t,X<cx-hw*.3?c2:c1);}};
   const WL=[['#a8987c','#e8d8b8','#fff0d8'],['#b08a74','#eab898','#ffd8b8'],['#9aa0b0','#d8dce8','#f6f8ff']],RF=[['#a83228','#e8604a'],['#8a3a2a','#d8704a']];
   for(let tier=2;tier>=0;tier--)for(let x=ix-40+tier*3;x<=ix+40-tier*3;x+=7+tier%2){if(tier>0&&Math.abs(x-ix)<13)continue;const b=Math.min(58,Math.round(tp(x))+6-tier*3+(x%3==0?1:0));HSE2(x,b,5+(x%3),4+((x>>1)%2),WL[(x+tier)%3],RF[(x>>2)%2]);}
   const yb=46,CB=(x,w,h)=>BX(x,yb-h,w,h,['#6e6250','#b0a284','#e6dcc2'],.15);
   BALL(ix,yb+1,22,6,['#4a4a52','#6a6a74','#8e8e98','#aeaeb8'],{nz:.4});
   CB(142,34,9);for(let x=142;x<176;x+=4)R(x,yb-11,2,2,'#cfc4a8');
   CB(153,10,26);for(let x=153;x<163;x+=3)R(x,yb-28,2,2,'#cfc4a8');R(157,yb-21,2,3,'#2a2a3a');R(157,yb-14,2,3,'#2a2a3a');
   ROOF(158,yb-38,14,10,'#d8503e','#a83228');R(158,yb-43,1,6,'#4a2e14');R(159,yb-43,5,2,'#ffe44a');
   CB(139,8,18);ROOF(143,yb-25,11,7,'#3a64b0','#2a4a8a');CB(168,8,18);ROOF(172,yb-25,11,7,'#3a64b0','#2a4a8a');
   for(let x=139;x<147;x+=3)R(x,yb-19,2,2,'#cfc4a8');for(let x=168;x<176;x+=3)R(x,yb-19,2,2,'#cfc4a8');R(143,yb-12,1,3,'#2a2a3a');R(172,yb-12,1,3,'#2a2a3a');
   EL(158,yb,3,4,(x,y)=>P(x,y,'#2a1c14'));}
  const sh=x=>74+Math.sin(x*.045)*3+Math.sin(x*.13)*1.2;
  for(let y=(70)+.25;y<H;y+=.5)for(let x=(0)+.25;x<W;x+=.5){const s=sh(x),d=y-s;if(d<0)continue;const wet=d<7;P(x,y,d<1?'#ffffff':d<2.6?RP(['#bff4ff','#ffffff'],hs(x,y),x,y):RP(wet?['#b89868','#cdb27a','#e0c890']:['#c9a56a','#e0c084','#f0d9a0','#fbeab8'],.35+fb(x*.08,y*.2)*.7+(wet?0:d/50)+(hs(x,y)-.5)*.2+(Math.sin(y*1.3+fb(x*.1,y*.1)*9)>.85?.12:0),x,y));}
  OFX=-88;{const x0=96,yN=91,yF=64,pts=[];
   OBJ(()=>{for(let Y=Math.floor(yF*S);Y<=yN*S;Y++){const y=(Y+.5)/S,z=(y-yF)/(yN-yF),hw=3+z*4.5,v=(y-yF)*(.55+z*.7),pi=Math.floor(v),fr=v-pi;for(let X=Math.floor((x0-hw)*S);X<=(x0+hw)*S;X++){const x=(X+.5)/S,u=(x-x0+hw)/(hw*2),side=u<.09||u>.91;let c;if(side)c=u<.09?'#d9a468':'#5e3a1c';else if(fr<.14)c='#4a2c14';else{c=RPQ(['#7a4a24','#9c6634','#b88044','#cf9a5c'],.35+hs(pi,7)*.5+(u<.5?.12:0));if(hs(pi*3+Math.floor(x*.3),9)<.06)c='#5a3418';}PX(X,Y,c);}}
    for(let r=2;r<14;r++){const y=yF+r*r*.19+1,z=(y-yF)/(yN-yF),hw=3+z*4.5;if(y<yN){P(x0-hw+1.3,y,'#2a1a0e');P(x0+hw-1.3,y,'#2a1a0e');}}},[.45,.38,.32]);
   [67,73,80,87].forEach(y=>{const z=(y-yF)/(yN-yF),hw=3+z*4.5,s2=.75+z*.9;[-1,1].forEach(sg=>{const px=x0+sg*(hw+.2);pts.push([px,y,s2,sg]);OBJ(()=>{BX(px-s2*1.1,y-9*s2,s2*2.2,9*s2+2,['#3a2410','#6e4a2c','#9a6e40'],.2);EL(px,y-9*s2,s2*1.5,s2*.9,(a,c)=>P(a,c,'#b88850'));},[.4,.4,.4]);});});
   for(let sg=-1;sg<=1;sg+=2){const ps=pts.filter(p=>p[3]==sg);for(let i2=0;i2<ps.length-1;i2++){const a=ps[i2],b2=ps[i2+1],ya=a[1]-8*a[2],yb=b2[1]-8*b2[2];for(let t=0;t<=1;t+=.03)DOT(a[0]+(b2[0]-a[0])*t,ya+(yb-ya)*t+Math.sin(t*Math.PI)*2.2,'#e0c890',2);}}
   const lp=pts.find(p=>p[3]==1&&p[1]==67);GL(lp[0],lp[1]-12,10,'#ffd878',.6);OBJ(()=>{BX(lp[0]-1.6,lp[1]-14.5,3.2,4,['#ffe9a0','#ffd060','#e89a30'],.05);R(lp[0]-2,lp[1]-15.2,4,.8,'#3a2410');},[.45,.4,.3]);
   pts.filter(p=>p[1]<80).forEach(p=>EL(p[0],p[1]+2,4*p[2],1.3*p[2],(a,c,d)=>{if(d>.55)P(a,c,'#d8faff');}));}OFX=0;

  ROCK(22,81,17,10,1.3);ROCK(10,82,9,6,2.1);ROCK(34,83,8,5,.4);for(let x=(5)+.25;x<42;x+=.5)if(hs(x,3)<.5)P(x,84+(x%2),'#ffffff');

  const LX=23,LT=46,LB=76;
  for(let y=(LT)+.25;y<=LB;y+=.5){const hw=3+(y-LT)*.07;for(let x=(Math.ceil(LX-hw))+.25;x<=LX+hw;x+=.5){const u=(x-LX+hw)/(hw*2+.01),bd=(((y-LT)/6)|0)%2;P(x,y,RP(bd?['#7a1e22','#c8403a','#ee6a58','#ff9a84']:['#8a8898','#c4c2d0','#f2f0f8','#ffffff'],.98-u*.92+(hs(x,y)-.5)*.08,x,y));}}
  R(LX-1,LB-4,3,5,'#3a2a2a');R(LX,LT+8,1,2,'#2a4a78');R(LX,LT+20,1,2,'#2a4a78');
  R(LX-6,LT-1,13,2,'#3a3640');R(LX-6,LT-2,13,1,'#a8a4b0');R(LX-6,LT-5,13,1,'#7e7a88');for(let x=LX-5;x<=LX+5;x+=2)R(x,LT-4,1,2,'#5a5662');
  BX(LX-3,LT-11,7,6,['#ffd84a','#fff2a0','#ffffff'],.05);R(LX-3,LT-11,1,6,'#5a5662');R(LX+3,LT-11,1,6,'#5a5662');R(LX,LT-11,1,6,'#c89a2a');
  for(let t=0;t<5;t++){const hw=4.4-t*.9;for(let X=(Math.ceil(LX-hw))+.25;X<=LX+hw;X+=.5)P(X,LT-12-t,RP(['#7a1e22','#c8403a','#ee6a58'],.95-(X-LX+hw)/(hw*2+.01)*.85,X,t));}P(LX,LT-18,'#ffd84a');
  GL(LX,LT-8,9,'#fff2a0',.55);
  for(let x=(LX+5)+.25;x<78;x+=.5){const t=(x-LX)/55;for(let y=(Math.floor(LT-9-t*3))+.25;y<=LT-7+t*6;y+=.5)if(t<.7)D(x,y,'#fff8c0',.32*(1-t));}
  {const BOAT=(x,y,s,hull,stripe)=>{EL(x,y+3.4*s,9*s,1.5*s,(a,c,d)=>{if(d>.5&&fb(a*1.2,c)>.4)P(a,c,'#d8faff');else D(a,c,'#1a5a8a',.35);});
   OBJ(()=>{for(let Y=Math.floor((y-1.5*s)*S);Y<=(y+3.2*s)*S;Y++){const yy=(Y+.5)/S;for(let X=Math.floor((x-8*s)*S);X<=(x+8.6*s)*S;X++){const xx=(X+.5)/S,u=(xx-x+8*s)/(16.6*s);if(u<0||u>1)continue;const sheer=-Math.pow(u*2-1,2)*1.2*s+(u>.82?-(u-.82)*7*s:0),dk=y-.2*s+(-sheer)*-1+sheer*0,top=y+sheer*-1*0-0;const deck=y-1.2*s-sheer*-1*0;const t0=y+sheer*.9,bot=y+3.2*s*(1-Math.pow(u*2-1,2)*.9)*(u>.9?.4:1);if(yy<t0-1.0*s||yy>bot)continue;const tt=(yy-(t0-1*s))/Math.max(.1,bot-(t0-1*s));PX(X,Y,tt<.16?'#f4ecd8':tt<.4?stripe:RPQ(hull,.8-u*.45-tt*.3));}}
    BX(x-3*s,y-3.2*s,6.5*s,2.2*s,['#e8dcc0','#fff6e0'],.05);R(x-2.2*s,y-2.6*s,1.4*s,1.1*s,'#2a4a78');R(x,y-2.6*s,1.4*s,1.1*s,'#2a4a78');},[.4,.4,.5]);
   R(x+1*s,y-19*s,.7,19*s,'#5a3a1a');
   for(let Y=Math.floor((y-18*s)*S);Y<=(y-3.5*s)*S;Y++){const yy=(Y+.5)/S,f=(yy-(y-18*s))/(14.5*s),w2=f*8.5*s*(1+.1*Math.sin(f*3.1));for(let X=Math.floor((x+1*s-w2-1)*S);X<=(x+.4*s)*S;X++){const xx=(X+.5)/S,u=(xx-(x+1*s-w2))/(w2+.01);PX(X,Y,RPQ(['#9ab0d0','#c8d8ee','#f4f8ff','#ffffff'],.95-u*.6-f*.15+((Math.floor(yy*1.4)%5==0)?-.1:0)));}}
   for(let Y=Math.floor((y-16*s)*S);Y<=(y-3.5*s)*S;Y++){const yy=(Y+.5)/S,f=(yy-(y-16*s))/(12.5*s),w2=f*5.5*s;for(let X=Math.floor((x+1.6*s)*S);X<=(x+1.6*s+w2)*S;X++){const xx=(X+.5)/S,u=(xx-(x+1.6*s))/(w2+.01);PX(X,Y,RPQ(['#c4d4ec','#eef4fc','#ffffff'],.4+u*.5-f*.1));}}
   R(x+1*s,y-19.4*s,3*s,1.2*s,stripe);P(x+1*s,y-19.8*s,'#ffd84a');};
   BOAT(116,70,1.1,['#1a2a58','#2a4a8a','#4a74b8'],'#e84a3a');BOAT(38,58,.75,['#7a1e22','#b83a3a','#e86a58'],'#f4ecd8');BOAT(134,62,.9,['#1a4a58','#2a7a88','#4aa8b0'],'#ffd84a');BOAT(152,56,.62,['#2a2a48','#4a4a78','#7a7aa8'],'#ff7aa8');}

  [[110,34],[136,26],[70,30]].forEach(([x,y])=>{P(x,y,'#fff');P(x+1,y-1,'#fff');P(x+2,y,'#fff');P(x-1,y-1,'#fff');});
  PALM(172,118,48,-.5);PALM(150,126,34,-.4);PALM(14,122,40,.5);
  [[132,98],[142,102]].forEach(([x,y])=>{for(let i=0;i<10;i++)R(x-9+i*2-(i>6?(i-6)*.0:0),y-12+Math.abs(i-4.5)*.6|0,3,2,i%2?'#f8f4ec':'#e85a4a');R(x,y-2,1,14,'#6a4220');});
  FLW(14,100,127,['#ff9ab0','#ffffff']);for(let i=0;i<22;i++){const x=hs(i,3)*W,y=82+hs(i,4)*44;BALL(x,y,2,1.4,['#c89a8a','#f4d0c0','#ffffff']);}
  TUFT(24,100,127,'#6a9a3a','#a8d46a');ROCK(40,119,12,7.5,3.1);ROCK(170,121,14,8.5,.9);ROCK(112,127,10,5.5,1.7);ROCK(86,108,5,3.2,2.6);ROCK(64,100,3,2,.5);ROCK(150,102,4,2.6,1.9);SPK(40,76,127,['#ffffff','#fff2b0']);
  EL(96,90,37,9,(x,y,d,nx,ny)=>P(x,y,d>.82?RP(['#8a6a3c','#b8905a'],.5,x,y):RP(['#a88858','#d8bc84','#f2dca4','#fff0c8'],.2+(1-d)*.8-(ny>.5?.15:0)+(hs(x,y)-.5)*.2,x,y)));EL(96,90,37,9,(x,y,d)=>{if(d>.86)D(x,y,'#ffffff',.5)});for(let i=0;i<9;i++){const a=i*.7,x=96+Math.cos(a)*27,y=90+Math.sin(a)*5.5;P(x,y,i%2?'#ffd0dc':'#ffffff');}
 }else if(k==='fire'){
  SKY(0,66,['#14082c','#2e1048','#5c1c58','#a02c50','#d84a3a','#f87a30','#ffb250','#ffd98a']);SPK(40,0,34,['#ffd8a0','#ffffff','#ffb27a']);
  
  MTN({b:70,amp:22,f:.015,s:5,cs:['#1e0e2a','#321a3c','#4a2a4c'],hz:.55,hc:'#a8405a',tx:.2});
   OFX=108;const cx=96,pk=30,top=x=>pk+Math.pow(Math.abs(x-cx)/78,.78)*42+(fb(x*.09,4)-.5)*5;
   GL(96,66,72,'#ff5a1a',.4);
   OBJ(()=>{for(let X=Math.floor((cx-80)*S);X<=(cx+80)*S;X++){const x=(X+.5)/S,t=top(x);for(let Y=Math.ceil(t*S);(Y+.5)/S<=72;Y++){const y=(Y+.5)/S,lit=(cx-x)/78,gul=fb(x*.55,y*.04+3);const v=.42+lit*.18+(fb(x*.2,y*.25)-.5)*.5-(gul>.62?.2:0)+(Math.floor(y/5.5+fb(x*.1,3)*2)%2?-.05:.04);PX(X,Y,RPQ(['#12090e','#241218','#3a1e20','#563024','#7a4630','#a06a46'],v));}}},[.3,.3,.4]);
   const LAVA=(pts,w0,w1)=>{const seg=[];for(let i=0;i<pts.length-1;i++)for(let t=0;t<1;t+=.04)seg.push([pts[i][0]+(pts[i+1][0]-pts[i][0])*t,pts[i][1]+(pts[i+1][1]-pts[i][1])*t]);const n=seg.length;[['#6a2410',1.5,1],['#ff6a14',.9,1],['#ffb22a',.55,1],['#fff0a0',.25,.5]].forEach(([c,k2,lim])=>seg.forEach((p,i)=>{if(i/n>lim)return;const w=(w0+(w1-w0)*i/n)*k2;EL(p[0]+Math.sin(i*.5)*.6,p[1],w,w*.85,(a,b)=>P(a,b,c));}));seg.forEach((p,i)=>{if(i%4==0)GL(p[0],p[1],3.5,'#ff7a1a',.45);});};
   const LV=(x0,y0,x1,y1,w0,w1,am,ph)=>{const p=[];for(let i=0;i<=14;i++){const t=i/14;p.push([x0+(x1-x0)*t+Math.sin(t*7+ph)*am*Math.sin(t*Math.PI)*(.4+t*.6),y0+(y1-y0)*Math.pow(t,.92)]);}LAVA(p,w0,w1);};
   LV(96,34,94,72,.9,3.3,4,0);LV(99,34,114,71,.8,2.3,3.5,1.7);LV(93,35,78,70,.8,2.1,3,3.1);LV(95,50,104,66,.5,1.5,2.5,4.4);LV(94,56,86,68,.5,1.3,2,5.2);
   EL(94,72.5,10,2.6,(x,y,d)=>P(x,y,d>.75?'#8a2c10':d>.45?'#ff6a14':'#ffb22a'));EL(113,72,6,1.8,(x,y,d)=>P(x,y,d>.7?'#8a2c10':'#ff8a1a'));EL(78,71.5,5,1.5,(x,y,d)=>P(x,y,d>.7?'#8a2c10':'#ff8a1a'));GL(94,72,16,'#ff7a1a',.35);
   EL(cx,pk+1.4,15,4.6,(x,y)=>P(x,y,'#2a1418'));EL(cx,pk+1,12.5,3.4,(x,y,d)=>P(x,y,d>.7?'#ff6a14':d>.35?'#ffb22a':'#fff0a0'));GL(cx,pk-2,24,'#ffb24a',.6);
   const AS=['#2a1c2c','#43303f','#6a4a58','#94707a','#c09a9c','#e8c8c0'],AU=['#1a1018','#3a2230','#6a3840','#b0583c','#e8803a','#ffb050'];
   [[62,5,13],[48,11,11],[76,-1,15],[116,0,16],[134,5,15],[152,9,14],[172,12,12]].forEach(([x,y,r],i)=>CEL(x,y,r*1.05,r*.72,AS,{ph:i*2,am:.12,sc:6,ly:-.5,lx:-.3,nz:.25}));
   [[96,26,7],[95,19,9],[98,12,11],[93,5,13],[100,-2,15],[90,-9,16]].forEach(([x,y,r],i)=>CEL(x,y,r,r*.9,y>10?AU:AS,{ph:i*1.7,am:.1,sc:6,ly:y>10?.65:-.5,lx:0,nz:.25}));
   for(let i=0;i<40;i++){const x=40+hs(i,1)*130,y=-4+hs(i,2)*14;for(let k3=0;k3<6;k3++)D(x+k3*.12,y+k3*1.4+4,'#2a1c2c',.35-k3*.05);}
   for(let i=0;i<16;i++){const a=-Math.PI/2+(hs(i,1)-.5)*1.5,v=6+hs(i,2)*7;for(let t=0;t<7;t+=.4){const px=cx+Math.cos(a)*v*t*.5,py=pk-Math.sin(-a)*v*t*.6*-1+t*t*.35-.0;DOT(px,py-t*0,t<6.2?'#ffb22a':'#ff6a14',2);if(t%1.2<.4)GL(px,py,2.5,'#ff8a2a',.5);}}
   OFX=0;
   FOR(70,H,(x,y)=>{const cs0=14,rs=8,gx=Math.floor(x/cs0),gy=Math.floor((y-70)/rs);let d1=1e9,d2=1e9,i1=0,i2=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const ax=gx+i,ay=gy+j,fx=(ax+hs(ax,ay+300))*cs0,fy=70+(ay+hs(ax+400,ay))*rs,dd=Math.hypot(x-fx,(y-fy)*1.9),idc=ax*131+ay;if(dd<d1){d2=d1;i2=i1;d1=dd;i1=idc;}else if(dd<d2){d2=dd;i2=idc;}}
    const e=d2-d1;let c;if(e<.8){c=hs(Math.min(i1,i2)+Math.max(i1,i2)*3,3)<.42?RPQ(['#c8280e','#ff6a14','#ffb22a'],1-e/.8*.9):'#0e0608';}else c=RPQ(['#100608','#1c0c10','#2e1618','#46241e','#623428'],.35+hs(i1,7)*.35+(fb(x*.3,y*.3)-.5)*.2+(e<2.2?-.18:0));P(x,y,c);});
   for(let y=60;y<72;y+=.5)for(let x=0;x<W;x+=1)D(x,y,'#c0402a',(y-60)/12*.22);






  for(let y=(70)+.25;y<H;y+=.5){const cx2=148+(y-70)*.34+Math.sin(y*.11)*5,w=4+(y-70)*.14;for(let x=(Math.floor(cx2-w-12))+.25;x<=cx2+w+12;x+=.5){const d=Math.abs(x-cx2)/w;if(d>1.9)continue;if(d>1.1){D(x,y,'#ff6a14',.5*(1.9-d));continue;}P(x,y,d>1?'#3a1210':RP(['#c8280e','#ff6a14','#ffb22a','#fff0a0'],1.1-d*.9+(fb(x*.15,y*.3)-.5)*.5,x,y));}}
  {const cy=112,c2=148+(cy-70)*.34+Math.sin(cy*.11)*5;BX(Math.floor(c2-24),cy-4,48,7,['#3a2420','#5a3a30','#7a5444'],.3);for(let x=Math.floor(c2-24);x<c2+24;x+=4)R(x,cy-4,1,7,'#1a0e0c');BX(Math.floor(c2-26),cy-12,3,12,['#2a1a18','#4a3028'],.3);BX(Math.floor(c2+23),cy-12,3,12,['#2a1a18','#4a3028'],.3);L(c2-24,cy-11,c2+24,cy-11,'#a07850');}
  [[20,100,9,24],[176,98,11,28],[46,122,7,16],[188,126,8,18]].forEach(([x,b,w,h])=>{for(let t=0;t<h;t++){const hw=w*(1-t/h*.8)/2;for(let X=(Math.ceil(x-hw))+.25;X<=x+hw;X+=.5)P(X,b-t,RP(['#1a0814','#3a1a48','#6a2c78','#a050b0'],.9-(X-x+hw)/(hw*2+1)*.9+(hs(X,t)-.5)*.2,X,t));}});
  [[14,84],[184,82],[100,80]].forEach(([x,y])=>{BX(x-4,y,8,16,['#3a2a2e','#5a464a','#8a7078'],.3);R(x-5,y,10,3,'#8a7078');FLAME(x,y-1,3);});
  for(let i=0;i<70;i++){const x=hs(i,1)*W,y=hs(i,2)*H*.95;P(x,y,hs(i,3)<.5?'#ffb02a':'#ff6a14');}
  EL(96,90,38,9.5,(x,y,d,nx,ny)=>P(x,y,d>.9?'#ff6a14':d>.8?'#2a1418':d>.72?'#ffb22a':RP(['#100608','#1e0e12','#341a1c','#4a2a28'],.25+(1-d)*.5+(hs(x,y)-.5)*.2,x,y)));GL(96,90,46,'#ff6a1a',.22);for(let i=0;i<10;i++){const a=i*.63,x=96+Math.cos(a)*29,y=90+Math.sin(a)*6.6;P(x,y,'#ffd86a');P(x,y-1,'#ff8a2a');}
 }else if(k==='ice'){
  SKY(0,64,['#162a78','#2a4ea8','#4a7ed4','#7eb0ec','#b8d8f8','#e0f0fd']);SPK(60,0,34,['#ffffff','#cfe4ff']);
  for(let y=(4)+.25;y<50;y+=.5)for(let x=(0)+.25;x<W;x+=.5){const w=Math.sin(x*.035+fb(x*.02,3)*5)*9+22,d=Math.abs(y-w);if(d<14){const a=(1-d/14)*(.25+fb(x*.2,y*.01)*.9)*.75;D(x,y,y<w?'#58f0b8':'#b890f8',a);D(x,y,'#e8fff0',a*.25);}}
  MTN({b:72,amp:52,f:.012,s:3,cs:['#2e4e8e','#4a72b0','#7aa2d0','#a8c8e4'],hz:.5,hc:'#d8ecfa',sn:.5,sc:['#7e9cd0','#b8d0ee','#e8f2ff','#ffffff']});
  MTN({b:74,amp:24,f:.025,s:8,cs:['#3a5e9a','#5a84b8','#8ab0d4'],hz:.35,hc:'#e4f2fc',sn:.55,sc:['#98b4dc','#d4e4f8','#ffffff']});
  GL(138,50,40,'#6af0ff',.45);
  GL(132,52,44,'#8af0ff',.35);BALL(132,71,38,5,['#a6c4e6','#d6e6f6','#f4faff','#ffffff'],{nz:.2});
  ICITADEL(147,70);
  [[44,96,5],[78,112,6],[134,124,5],[24,118,4],[168,100,5],[104,100,4]].forEach(a=>ICEFL(...a));
  R(106,66,70,6,'#cfeefc');GRD(72,['#8eb0dc','#b4cce8','#d6e6f6','#eff6fd','#ffffff'],.18);
  {const lx=160,ly=108,rx=26,ry=9.5;
   EL(lx,ly+1,rx+3.5,ry+2.4,(x,y)=>P(x,y,RPQ(['#9cb8dc','#cfe2f4','#f4faff'],.9-(y-ly)/30+(fb(x*.4,y*.4)-.5)*.5)));
   EL(lx,ly,rx,ry,(x,y,d,nx,ny)=>{const sh=((x+y*1.4)%16)<2.5?.16:0;P(x,y,RPQ(['#bfe6fa','#8ccaee','#5aa8dc','#3a86c4','#2f74b0'],.15+(1-d)*.75+sh+(fb(x*.3,y*.5)-.5)*.2-(ny>.55?.1:0)));if(d>.9)P(x,y,'#e8fbff');});
   for(let i=0;i<5;i++){let x=lx+(i-2)*3,y=ly+(i%2?2:-2),a=i*1.26+.3;for(let st=0;st<14;st++){const x2=x+Math.cos(a)*3,y2=y+Math.sin(a)*1.2;if(Math.pow((x2-lx)/rx,2)+Math.pow((y2-ly)/ry,2)>.9)break;L(x,y,x2,y2,'#f2fcff');L(x,y+.5,x2,y2+.5,'#3a78b0');if(st%4==3){const b=a+(i%2?.8:-.8);L(x2,y2,x2+Math.cos(b)*4,y2+Math.sin(b)*1.6,'#e0f6ff');}x=x2;y=y2;a+=(hs(i,st)-.5)*.9;}}
   for(let i=0;i<9;i++){const x=lx+(hs(i,3)-.5)*60,y=ly+(hs(i,4)-.5)*16;if(Math.pow((x-lx)/rx,2)+Math.pow((y-ly)/ry,2)<.75){P(x,y,'#ffffff');P(x-1,y,'#e8fbff');P(x+1,y,'#e8fbff');P(x,y-1,'#e8fbff');P(x,y+1,'#e8fbff');}}
   [[178,104,7,2.4,.5],[150,119,5,2,.2]].forEach(a=>ICRY(...a));}


  const PN=PN2;
  [[10,78,30],[26,74,24],[42,72,18],[58,70,14],[76,68,12],[96,67,10],[154,68,12],[170,72,18],[184,76,26],[16,104,28],[184,108,30]].forEach(a=>OBJ(()=>PN(...a),[.45,.55,.7]));[[60,94,7,3],[96,112,8,3],[40,120,6,2],[150,120,7,3]].forEach(([x,y,rx,ry])=>BALL(x,y,rx,ry,['#9cb8dc','#cfe2f4','#f4faff'],{nz:.1}));
  for(let i=0;i<40;i++){const x=hs(i,3)*W,y=76+hs(i,4)*50;P(x,y,'#fff');P(x-1,y,'#bfe6ff');P(x+1,y,'#bfe6ff');P(x,y-1,'#bfe6ff');P(x,y+1,'#bfe6ff');}
  for(let i=0;i<110;i++){const x=hs(i,5)*W,y=hs(i,6)*H;P(x,y,'#ffffff');if(i%5==0){P(x+1,y,'#ffffff');P(x,y+1,'#dff0ff');}}
  EL(96,90,38,9.5,(x,y,d,nx,ny)=>P(x,y,d>.88?'#5a94d0':d>.8?'#e8f8ff':RP(['#2f74b0','#3f8ccc','#5aa8dc','#8cc8f0','#c4e8fa'],.2+(1-d)*.85-(ny>.55?.12:0)+(fb(x*.4,y*.5)-.5)*.3,x,y)));for(let i=0;i<8;i++){const a=i*.78+.2,x=96+Math.cos(a)*26,y=90+Math.sin(a)*5.8;P(x,y,'#ffffff');P(x-1,y,'#bfe6ff');P(x+1,y,'#bfe6ff');P(x,y-1,'#bfe6ff');P(x,y+1,'#bfe6ff');}
 }else if(k==='desert'){
  SKY(0,66,['#2f7cd8','#5aa6ea','#90cae8','#d8e4cc','#f8dca0','#ffc884']);SUN(150,34,11,'#ffe8a0');CLOUD(4,30,.6,['#d8b0a0','#f8e8d8','#ffffff'],.03);
  MTN({b:72,amp:34,f:.012,s:7,cs:['#8a4a3a','#b06a48','#d08a58','#e8a870'],hz:.5,hc:'#f4d0a0',bd:.18,fl:.5});MTN({b:74,amp:24,f:.016,s:15,cs:['#7a3a2a','#a05a3a','#c47a4a','#e0985e'],hz:.25,hc:'#f0c090',bd:.22,fl:.42});
  for(let y=(72)+.25;y<H;y+=.5)for(let x=(0)+.25;x<W;x+=.5){const a=x*.05+Math.sin(y*.09)*2+fb(x*.04,y*.08)*5;P(x,y,RP(['#a8703c','#c88e50','#e2ac6a','#f4cc88','#ffe8aa'],.5+Math.cos(a)*.28+(fb(x*.2,y*.4)-.5)*.25+Math.sin(y*.9+fb(x*.1,y*.3)*8)*.05-(y-76)/150*.12,x,y));}
  const BRK=(x,y,w,h,rh)=>{rh=rh||5;const cw=Math.round(rh*1.6);for(let j=0;j<h;j++)for(let i=0;i<w;i++){const X=x+i,Y=y+j,mortar=(j%rh==0)||((i+(Math.floor(j/rh)%2)*Math.round(rh*.8))%cw==0);P(X,Y,mortar?'#8a6430':RP(['#9a7238','#c09a58','#e0bc78','#f4d898'],.85-i/w*.75+(hs(X,Y)-.5)*.3,X,Y));}};
  OFX=28;TS={ax:304,ay:186,ox:300,oy:154,sc:.68,hz:.22,hc:'#f2d4a8'};SHD(138,93,42,4,'#6a4a2a',.55);
  OBJ(()=>{BX(106,91,64,3,SS,.15);BX(110,89,56,2,SS,.15);BX(112,72,52,17,SS,.2);for(let x=112;x<164;x+=4.5)BX(x,69.5,2.8,2.5,SS,.15);R(112,76,52,1.2,'#7a5428');BX(104,52,12,38,SS,.2);for(let x=104;x<116;x+=4)BX(x,50,2.6,2.5,SS,.15);BX(158,46,13,44,SS,.2);for(let x=158;x<171;x+=4)BX(x,44,2.6,2.5,SS,.15);BX(128,58,20,32,SS,.2);for(let x=128;x<148;x+=4.5)BX(x,56,2.8,2.5,SS,.15);BX(134,38,10,22,SS,.2);},[.4,.32,.22]);
  for(let x=114;x<162;x+=6)EL(x+1,81,1,1.8,(a,c)=>P(a,c,'#2a1808'));
  R(107,58,2,5,'#2a1808');R(111,58,2,5,'#2a1808');R(161,54,2,6,'#2a1808');R(165,54,2,6,'#2a1808');R(137,44,2,5,'#2a1808');
  EL(138,83,6.4,8.4,(a,c,d)=>P(a,c,d>.8?'#f4c850':'#1e1206'));R(131.6,83,12.8,7,'#1e1206');R(131.6,83,.8,7,'#f4c850');R(143.6,83,.8,7,'#f4c850');EL(138,84,4.6,6.4,(a,c,d)=>P(a,c,RPQ(['#2a1808','#6a4a24','#c08a3c'],1-d*.6)));GL(138,88,7,'#ffd88a',.5);
  OBJ(()=>{BX(103,48,14,3,SS,.15);for(let x=103;x<117;x+=3.5)BX(x,45,2.2,3,SS,.15);BX(157,42,15,3,SS,.15);for(let x=157;x<172;x+=3.5)BX(x,39,2.2,3,SS,.15);BX(133,35,12,3,SS,.15);for(let x=133;x<145;x+=3.5)BX(x,32,2.2,3,SS,.15);},[.4,.32,.22]);
  OFX=0;TS=null;

  EL(34,104,28,10,(x,y,d)=>P(x,y,d>.8?'#4a8a3a':d>.65?'#7ab04a':RP(['#1f8fa8','#38b8cc','#78dce0','#c8f4f0'],.35+(1-d)*.35+fb(x*.2,y*.5)*.4,x,y)));
  PALM(14,104,52,.1);PALM(52,106,40,-.12);PALM(30,98,30,.04);
  CACT(178,127,26);CACT(140,125,16);BARREL(160,121,5);BARREL(30,118,5);BARREL(98,128,4.5);
  [[106,123,18,11]].forEach(([x,y,w,h])=>{BX(x,y,w,h,['#8a6430','#c09a58','#e8c888'],.35);R(x,y,w,1,'#f4dca0');});
  SPK(60,76,127,['#fff4c8','#ffffff','#d09a5a']);
  EL(96,90,38,9.5,(x,y,d,nx,ny)=>P(x,y,d>.9?'#2ea0a8':d>.82?'#f4c850':RP(['#a87840','#c89a58','#e4be7e','#f6dca4'],.2+(1-d)*.8-(ny>.55?.12:0)+(hs(x,y)-.5)*.2,x,y)));for(let i=0;i<10;i++){const a=i*.63,x=96+Math.cos(a)*28,y=90+Math.sin(a)*6.2;P(x,y,i%2?'#2ea0a8':'#f4c850');}
 }else if(k==='future'){
  SKY(0,70,['#2a6edc','#4e9af0','#82c8fa','#bfecfe','#eefcff']);CLOUD(4,40,.54,['#8cb0e0','#c8def6','#ffffff','#ffffff']);
  BALL(36,24,13,13,['#6a4aa8','#9a7ad8','#c8a8f4','#f0d8ff'],{lx:-.6,ly:-.5});EL(36,26,26,5,(x,y,d,nx,ny)=>{if(ny>0||Math.abs(x-36)>13)P(x,y,d>.82?'#fff0ff':'#c8a8f4');});
  const SKL=(b,hz,cs,s,mn,mx)=>{for(let x=0;x<W;){const w=7+Math.floor(hs(x,s)*9),h=mn+Math.floor(hs(x,s+1)*(mx-mn));for(let i=0;i<w;i++)for(let y=(b-h)+.25;y<=b;y+=.5){const dep=(y-(b-h))/h;P(x+i,y,RP(cs,.9-i/w*.6+(hs(x+i,y)-.5)*.15,x+i,y));if(hz>bt(x+i,y)*1.1)P(x+i,y,'#c8e6fa');if(i>1&&i<w-1&&y%3==0&&hs(x+i,y)<.5&&y<b-2)P(x+i,y,hs(x,y)<.5?'#f4ffff':'#ffd8f0');}x+=w+1;}};
  FARS(66,['#4f84c6','#76aae0','#a4cff4']);
  OBJ(()=>{for(let Y=Math.floor(-4*S);Y<=70*S;Y++){const y=(Y+.5)/S,t=(y+4)/74,hw=1.8+Math.pow(t,1.7)*11;for(let X=Math.floor((96-hw)*S);X<=(96+hw)*S;X++){const xx=(X+.5)/S,u=(xx-96+hw)/(hw*2);let v=.9-u*.85+(1-t)*.1;let c=RPQ(GLS,v);if(Math.abs(u-.38)<.03)c='#e8fbff';if(Y%9==0)c=RPQ(GLS,v+.12);if(X%4==0)c=RPQ(GLS,v-.12);PX(X,Y,c);}}},[.32,.42,.62]);R(95.6,-4,.8,10,'#ffffff');
  R(96,-2,1,16,'#ffffff');
  [[22,-1],[34,8],[46,-1]].forEach(()=>0);
  [[96,48,26,5],[96,34,19,4],[96,22,13,3]].forEach(([cx,cy,rx,ry])=>{for(let a=0;a<6.3;a+=.04){const x=cx+Math.cos(a)*rx,y=cy+Math.sin(a)*ry,fr=Math.sin(a)>0;P(x,y,fr?'#ffffff':'#4ae0ff');if(fr)D(x,y+1,'#4ae0ff',.6);}});
  [[2,70,14,40,{crown:1,s:1}],[17,70,11,30,{s:2,neon:'#4ae0ff'}],[30,70,16,48,{cut:.5,s:3,crown:1}],[47,70,10,26,{s:4}],[58,70,12,36,{neon:'#ff5ab8',s:5}],[116,70,12,38,{s:6,crown:1}],[130,70,16,52,{cut:.45,s:7,neon:'#4ae0ff'}],[148,70,11,30,{s:8}],[160,70,14,44,{crown:1,s:9,neon:'#ff5ab8'}],[176,70,12,34,{s:10}],[188,70,12,46,{cut:.5,s:11,crown:1}]].forEach(a=>TWR(...a));[[18,45,30],[60,50,48],[146,48,34],[174,40,38]].forEach(([x0,y0,x1])=>{if(x1<x0+9){return;}});
  const UFO=(x,y,s)=>{GL(x,y+2,10*s,'#8af0ff',.5);BALL(x,y,9*s,2.6*s,['#5a6890','#9aa8cc','#d8e0f4','#ffffff'],{nz:.1});BALL(x,y-2*s,4*s,3*s,['#2a8ac8','#5ad0f4','#c8fbff'],{nz:.1});for(let i=-2;i<=2;i++)P(x+i*3*s,y+1*s,'#ffe14a');};UFO(36,52,1);UFO(150,24,1.2);UFO(174,50,.8);
  {const yb=58,TX=22,n=5,cl=17,len=n*cl;
   BX(0,yb,W,2.6,['#2a3a62','#5a6e9c','#9ab0d4'],.1);R(0,yb+.2,W,.5,'#4ae0ff');for(let x=8;x<W;x+=30){BX(x,yb+2.6,3.4,11,['#3a4a76','#7a90b8','#c0d0ea'],.1);R(x,yb+2.6,3.4,.6,'#4ae0ff');}
   OBJ(()=>{for(let Y=Math.floor((yb-8)*S);Y<=yb*S;Y++){const y=(Y+.5)/S,t=(y-(yb-7))/7;for(let X=Math.floor(TX*S);X<=(TX+len+8)*S;X++){const x=(X+.5)/S,u=x-TX,nz=Math.max(0,u-len);if(nz>0){const prof=Math.sqrt(Math.max(0,1-Math.pow(nz/8,2)));if(y<(yb-7)+(1-prof)*6.3)continue;}if(y<yb-7)continue;let c=RPQ(['#5a6a96','#9aaed0','#d8e4f4','#ffffff'],.9-t*.6+(t<.12?.1:0));const pu=((u%cl)+cl)%cl;if(t>.22&&t<.55&&pu>1.2&&pu<cl-1.2)c=RPQ(['#102a58','#1a4a90','#3a8ad0','#9adcf8'],.5+(1-(t-.22)/.33)*.4+((u+y*1.3)%9<1.6?.25:0));if(t>.72&&t<.82)c='#4ae0ff';if(t>.9)c='#3a4a76';if((pu<.5||pu>cl-.5)&&u<len)c='#2a3656';PX(X,Y,c);}}},[.38,.42,.6]);
   const hx2=TX+len+7;P(hx2,yb-3.4,'#ffffff');GL(hx2+1,yb-3.5,8,'#bff6ff',.7);for(let x=TX;x<TX+len+6;x+=.5)D(x,yb+.4,'#4ae0ff',.6);for(let i=0;i<6;i++)R(TX-8-i*3,yb-5.6+i*.9,6+i%2*3,.5,'#ffffff');}

  for(let y=(70)+.25;y<80;y+=.5)for(let x=(0)+.25;x<W;x+=.5)P(x,y,RP(['#2ac4f0','#46d8f8','#78e8fc','#2a9ad8'],(y-70)/10*.7+fb(x*.3,y*.8)*.35,x,y));
  for(let y=72;y<80;y+=2)for(let x=(0)+.25;x<W;x+=.5)if(hs(x>>2,y)<.25)P(x,y,'#e8ffff');
  for(let y=(80)+.25;y<H;y+=.5){const z=(y-76)/(H-76),u=1/(z+.1);for(let x=(0)+.25;x<W;x+=.5){const wx=(x-96)*u*.1,wz=u*2.2,fx=wx-Math.floor(wx),fz=wz-Math.floor(wz),edge=fx<.07||fz<.11||fx>.96,chk=(Math.floor(wx)+Math.floor(wz))&1;P(x,y,edge?'#34466a':RP(['#4a5e84','#6a80a6','#8ea6c8','#c4d4ea'],.35+chk*.3+(1-fx)*.25+(1-z)*.1+(hs(x,y)-.5)*.08,x,y));}}
  for(let y=(80)+.25;y<H;y+=.5){const z=(y-76)/(H-76),u=1/(z+.1);for(let s=-1;s<=1;s+=2){const cx=96+s*(40+z*80);for(let i=-1;i<=1;i++)P(cx+i,y,i?'#4ae0ff':'#e8ffff');GL(cx,y,5,'#4ae0ff',.35);}}
  EL(96,116,44,9,(x,y,d)=>{P(x,y,d>.8?'#4ae0ff':d>.55?'#bff6ff':'#e6f4ff');});EL(96,116,24,5,(x,y,d)=>P(x,y,d>.7?'#4ae0ff':'#ffffff'));GL(96,116,50,'#6af0ff',.3);
  [86,94,104,116].forEach(y=>{const z=(y-76)/50+.35;[-1,1].forEach(sd2=>{const px=96+sd2*(58+(y-86)*1.5),qx=96+sd2*(34+(y-86)*.9);BX(px-z,y-16*z,2*z+1,16*z,['#4a5e84','#8aa0c4','#d0e0f4'],.1);BALL(px,y-18*z,3*z,3*z,['#1aa8d8','#5ae0ff','#e8ffff']);GL(px,y-18*z,7*z,'#8af0ff',.6);BX(qx-6*z,y-3*z,12*z,4*z,['#4a5e84','#8aa0c4','#d0e0f4'],.1);BALL(qx,y-9*z,7*z,6*z,['#0a5a4a','#1a9a74','#4ad49a','#a8fcd0','#e8fff4']);P(qx-2*z,y-12*z,'#ffffff');});});
  for(let y=(86)+.25;y<112;y+=.5){R(95,y,2,1,y%3?'#bff6ff':'#ffffff');}BALL(96,84,8,8,['#0e58b8','#2a9ae0','#7ae0ff','#e8ffff'],{nz:.1});for(let a=0;a<6.3;a+=.05){const x=96+Math.cos(a)*13,y=84+Math.sin(a)*3.5;P(x,y,Math.sin(a)>0?'#ffffff':'#4ae0ff');}EL(96,112,34,6,(x,y,d)=>{if(d>.8)P(x,y,'#4ae0ff');});
  SPK(30,82,127,['#ffffff','#bff6ff']);
 }
}
function gdBgURL(k){if(!k)k='home';if(_gdBgC[k])return _gdBgC[k];
 try{const W=384,H=256,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d'),id=x.createImageData(W,H);gdBgPaint(k,id.data,W,H);x.putImageData(id,0,0);const c2=document.createElement('canvas');c2.width=W*4;c2.height=H*4;const y2=c2.getContext('2d');y2.imageSmoothingEnabled=false;y2.drawImage(cv,0,0,W*4,H*4);return _gdBgC[k]=c2.toDataURL('image/png');}catch(e){return '';}}
function gdBgStyle(g){const u=gdBgURL(g&&g.bg);return u?`background-image:url(${u});background-size:100% 100%;background-repeat:no-repeat;background-position:0 0;image-rendering:auto`:'';}
function gdBgPickHTML(g){const cur=g.bg||'';return `<p class=mut style="font-size:13px;text-align:center">정원 배경을 골라요. 누르면 바로 바뀌어요! 메인 스토리 지역을 클리어하면 새 배경이 하나씩 열려요.</p><div class=gdBgGrid>${GD_BGS.map(b=>`<button class="gdBgItem${b.k===cur?' on':''}${gdBgOpen(b.k,cur)?'':' lock'}" data-bg="${b.k}"><div class=gdBgPrev><img src="${gdBgURL(b.k||'home')}" alt=""></div><b>${b.n}</b>${b.k===cur?'<i>✓ 사용 중</i>':gdBgOpen(b.k,cur)?'':'<i>🔒 「'+gdBgNeedName(b.k)+'」 클리어</i>'}</button>`).join('')}</div>`;}
// 꾸미기
const GD_DEC=[
 {k:'bed',n:'꽃밭',p:40},{k:'sun',n:'해바라기',p:50},{k:'mush',n:'버섯 가족',p:30},{k:'rock',n:'이끼 바위',p:50},
 {k:'tree',n:'참나무',p:120},{k:'cherry',n:'벚나무',p:150},{k:'bench',n:'나무 의자',p:80},{k:'lamp',n:'돌 등롱',p:70},
 {k:'tent',n:'텐트',p:150},{k:'house',n:'오두막',p:300},{k:'fount',n:'분수',p:200},{k:'ball',n:'풍선',p:50,sky:1}];
GD_DEC.forEach(d=>d.cat='기본 정원');
{const G=(c,a)=>a.forEach(d=>GD_DEC.push(Object.assign({cat:c},d)));
 G('포켓몬 소품',[
  {k:'ball_poke',n:'몬스터볼',p:40},{k:'ball_great',n:'슈퍼볼',p:50},{k:'ball_ultra',n:'하이퍼볼',p:65},
  {k:'ball_master',n:'마스터볼',p:80,gc:'rgba(205,150,255,.8)',gr:50,gy:50},
  {k:'basket',n:'간식 바구니',p:50},{k:'berry',n:'열매 덤불',p:60},
  {k:'evo_fire',n:'불꽃의 돌',p:70,gc:'rgba(255,140,50,.8)',gr:60,gy:45},
  {k:'evo_water',n:'물의 돌',p:70,gc:'rgba(110,190,255,.8)',gr:60,gy:45},
  {k:'evo_thunder',n:'천둥의 돌',p:70,gc:'rgba(255,236,90,.85)',gr:60,gy:45},
  {k:'paw',n:'발자국 판',p:40},{k:'plush',n:'전기쥐 인형',p:80},
  {k:'sign',n:'센터 표지판',p:100,gc:'rgba(255,120,130,.6)',gr:86,gy:40},
  {k:'heal',n:'회복 머신',p:150,gc:'rgba(255,150,205,.7)',gr:88,gy:58},
  {k:'grass',n:'풀숲',p:90},{k:'nest',n:'둥지와 알',p:120},
  {k:'pond',n:'낚시 연못',p:180},{k:'gymsign',n:'체육관 간판',p:160},{k:'statue',n:'포켓몬 동상',p:250}]);
 G('타입 정원',[
  {k:'set_fire',n:'용암 바위',p:300,gc:'rgba(255,120,40,.75)',gr:110,gy:42},
  {k:'set_water',n:'폭포 바위',p:300},{k:'set_grass',n:'숲의 거목',p:300},
  {k:'set_elec',n:'피뢰침 탑',p:300,gc:'rgba(255,240,100,.8)',gr:96,gy:13}]);
 G('밤·계절',[
  {k:'campfire',n:'캠프파이어',p:200,gc:'rgba(255,150,50,.85)',gr:118,gy:54},
  {k:'firelamp',n:'반딧불 가로등',p:180,gc:'rgba(215,255,110,.75)',gr:96,gx:82,gy:34}]);
 G('놀이터·쉼터',[
  {k:'swing',n:'그네',p:80},{k:'seesaw',n:'시소',p:90},{k:'trampoline',n:'버섯 트램펄린',p:110},
  {k:'bowls',n:'밥그릇·물그릇',p:45},{k:'cushion',n:'포켓몬 방석',p:60},{k:'sandbox',n:'모래 놀이터',p:90},
  {k:'picnic',n:'피크닉 돗자리',p:100},{k:'parasol',n:'파라솔 테이블',p:130},{k:'mailbox',n:'우체통',p:70},
  {k:'signpost',n:'이정표',p:60},{k:'planter',n:'꽃 화분',p:50},{k:'scarecrow',n:'허수아비',p:100},{k:'windmill',n:'풍차',p:200}]);
 G('밤·계절',[
  {k:'moonlamp',n:'초승달 조명',p:150,gc:'rgba(255,240,150,.8)',gr:96,gy:25},
  {k:'starlamp',n:'별 랜턴',p:90,gc:'rgba(255,230,100,.8)',gr:70,gy:25},
  {k:'lanterns',n:'종이 등불 줄',p:120,sky:1,gc:'rgba(255,170,90,.7)',gr:110,gy:48},
  {k:'telescope',n:'망원경',p:140},{k:'hotspring',n:'온천',p:220},
  {k:'pumpkin',n:'호박등',p:60,gc:'rgba(255,170,50,.85)',gr:66,gy:60},{k:'snowman',n:'눈사람',p:80}]);
 const L=GD_DEC.find(d=>d.k==='lamp');if(L)Object.assign(L,{gc:'rgba(255,214,110,.8)',gr:84,gy:54});}
{const O=['기본 정원','포켓몬 소품','타입 정원','놀이터·쉼터','밤·계절'];GD_DEC.sort((a,b)=>O.indexOf(a.cat)-O.indexOf(b.cat));}
const GD_DEC_MAX=30;
const GD_MOVE=new Set(['windmill','swing','seesaw','trampoline','lanterns','grass','scarecrow','parasol','plush','berry','planter','campfire','set_fire']);
function gdDecInner(def){if(def.k==='windmill'){try{const t=GD_SPR('windmill_t'),b=GD_SPR('windmill_b');if(t&&b)return `<img src="${t.url}" alt=""><img class=gdBlades src="${b.url}" alt="" style="left:${(36/t.w*100).toFixed(2)}%;top:${(25/t.h*100).toFixed(2)}%;width:${(b.w/t.w*100).toFixed(2)}%">`;}catch(e){}}return gdDecImg(def);}
function gdDecImg(def){let sp=null;try{sp=GD_SPR(def.k);}catch(e){}return sp?`<img src="${sp.url}" alt="">`:'';}
function gdDecHTML(g){return (g.dec||[]).map((d,i)=>({d,i})).sort((a,b)=>a.d.y-b.d.y).map(({d,i})=>{const def=GD_DEC.find(x=>x.k===d.k);if(!def)return '';if(d.h)return '';const sp=GD_SPR(def.k);if(!sp)return '';return `<div class="gdDec${def.gc?' gdGlow':''}" data-k="${def.k}" data-di="${i}" style="--w:${sp.w};--h:${sp.h};left:${d.x}%;top:${d.y}%;z-index:1${def.gc?`;--gc:${def.gc};--gr:${def.gr};--gx:${def.gx||50}%;--gy:${def.gy||50}%`:''}">${gdDecInner(def)}</div>`;}).join('');}
// 여러 개 가진 장식을 정원에 놓을 개수 고르기 (치울 때는 한꺼번에 치워요)
function gdPlacePop(d,mine,done){const n=mine.length;let q=1;
 const show=()=>{M(`<h2>${d.n} 몇 개 놓을까요?</h2><div style="display:flex;justify-content:center"><div class=gdShopImg style="height:70px">${gdDecImg(d)}</div></div><p class=mut style="text-align:center;font-size:13px;margin:2px 0">보유 중 ${n}개 · 치울 때는 한꺼번에 치워져요</p>
   <div class=gdQty><button data-a=m>−</button><output>${q}</output><button data-a=p>＋</button></div>
   <div class=gdQuick><button class="btn ghost sm" data-a=one>1개</button><button class="btn ghost sm" data-a=half>절반 (${Math.ceil(n/2)})</button><button class="btn ghost sm" data-a=all>모두 (${n})</button></div>
   <div class=mbtns><button class="btn gold" data-a=ok>${q}개 놓기</button><button class="btn ghost" data-a=no>취소</button></div>`,
   {m:()=>{q=Math.max(1,q-1);show();},p:()=>{q=Math.min(n,q+1);show();},one:()=>{q=1;show();},half:()=>{q=Math.ceil(n/2);show();},all:()=>{q=n;show();},
    ok:()=>{mine.slice(0,q).forEach(x=>{delete x.h;});closeM(1);toast(`${d.n} ${q}개를 정원에 놓았어요`);done();},no:()=>closeM(1),_close:()=>closeM(1)},{layer2:1});};show();}
function gdDecor(){const m=S.meta,g=gd(m);g.dec=Array.isArray(g.dec)?g.dec:[];
 let tab='dec';
 const draw=(keep)=>{const full=g.dec.length>=GD_DEC_MAX,st=keep&&$('#mbox')?$('#mbox').scrollTop:0,own={};g.dec.forEach(d=>{const q=own[d.k]||(own[d.k]={n:0,on:0});q.n++;if(!d.h)q.on++;});
  M(`<h2>🎨 정원 꾸미기</h2><div class=gdTabs><button class="btn ${tab==='dec'?'gold':'ghost'} sm" data-t=dec>🪴 장식</button><button class="btn ${tab==='bg'?'gold':'ghost'} sm" data-t=bg>🖼️ 배경</button></div>${tab==='bg'?gdBgPickHTML(g):`<p class=mut style="font-size:13px;text-align:center">장식을 사서 정원에 놓고, 손으로 끌어서 원하는 곳에 옮겨요. (${g.dec.length}/${GD_DEC_MAX}개 · 🪙 ${m.coins||0})</p>
   <div class=gdShopGrid>${GD_DEC.map((d,i)=>(d.cat&&(!i||d.cat!==GD_DEC[i-1].cat)?`<div class=gdCat>${d.cat}</div>`:'')+`<button class="gdShopItem${own[d.k]?(own[d.k].on?' own':' keep'):''}" data-b="${i}" style="${!own[d.k]&&((m.coins||0)<d.p||full)?'opacity:.5':''}">${own[d.k]?(own[d.k].on?'<span class=gdOwn>✔ 정원에 있어요</span>':'<span class=gdOwn>보유 중</span>'):''}${own[d.k]?`<span class="gdAddB${full||(m.coins||0)<d.p?' off':''}" data-add="${i}" title="하나 더 사기 (🪙 ${d.p})">＋</span>`:''}<div class=gdShopImg>${gdDecImg(d)}</div><b>${d.n}${own[d.k]&&own[d.k].n>1?` <small>×${own[d.k].n}</small>`:''}</b><i>🪙 ${d.p}</i>${d.gc?'<em class=gdTag>🌙 밤에 빛나요</em>':GD_MOVE.has(d.k)?'<em class=gdTag>✨ 살랑살랑</em>':''}</button>`).join('')}</div>
   ${g.dec.length?`<h3 style="margin-top:10px">내 장식 <span class=mut style="font-size:12px">(🗑 팔면 절반을 돌려받아요)</span></h3><div class=gdMine>${g.dec.map((d,i)=>{const def=GD_DEC.find(x=>x.k===d.k);return def?`<button class="btn ghost sm" data-r="${i}">${def.n}${d.h?' (보관 중)':''} 🗑</button>`:'';}).join('')}</div>`:''}`}
   <div class=mbtns><button class="btn gold" data-a=x>닫기</button></div>`,{x:()=>closeM(),_close:()=>closeM()},{wide:1});
  const box=$('#mbox');if(keep)box.scrollTop=st;
  box.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tab=b.dataset.t;sfx('tap');draw();});
  box.querySelectorAll('[data-bg]').forEach(b=>b.onclick=()=>{if(!gdBgOpen(b.dataset.bg,g.bg||'')){try{sfx('wrong');}catch(e){}toast('🔒 메인 스토리 「'+gdBgNeedName(b.dataset.bg)+'」'+(hasJong(gdBgNeedName(b.dataset.bg))?'을':'를')+' 클리어하면 열려요');return;}g.bg=b.dataset.bg;sfx('coin');gdSaveSoon(true);gdRefresh();draw(true);});
  box.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{const d=GD_DEC[+b.dataset.b],mine=g.dec.filter(x=>x.k===d.k);
   if(mine.length){const shown=mine.some(x=>!x.h);
    if(shown){mine.forEach(x=>{x.h=1;});toast(`${d.n}: 정원에서 모두 치웠어요 (보유 중 ${mine.length}개)`);sfx('tap');gdSaveSoon(true);gdRefresh();draw(true);return;}
    if(mine.length===1){delete mine[0].h;toast(`${d.n}: 정원에 다시 놓았어요`);sfx('tap');gdSaveSoon(true);gdRefresh();draw(true);return;}
    gdPlacePop(d,mine,()=>{gdSaveSoon(true);gdRefresh();draw(true);});return;}
   if(g.dec.length>=GD_DEC_MAX){toast(`장식은 ${GD_DEC_MAX}개까지 가질 수 있어요`);return;}if((m.coins||0)<d.p){toast('코인이 부족해요');return;}
   m.coins-=d.p;g.dec.push({k:d.k,x:+(12+Math.random()*76).toFixed(1),y:+(d.sky?(24+Math.random()*16):(62+Math.random()*30)).toFixed(1)});sfx('coin');gdSaveSoon(true);gdRefresh();draw(true);});
  box.querySelectorAll('[data-add]').forEach(b=>b.onclick=e=>{e.stopPropagation();const d=GD_DEC[+b.dataset.add];
   if(g.dec.length>=GD_DEC_MAX){toast(`장식은 ${GD_DEC_MAX}개까지 가질 수 있어요`);return;}if((m.coins||0)<d.p){toast('코인이 부족해요');return;}
   m.coins-=d.p;g.dec.push({k:d.k,x:+(12+Math.random()*76).toFixed(1),y:+(d.sky?(24+Math.random()*16):(62+Math.random()*30)).toFixed(1)});const n=g.dec.filter(x=>x.k===d.k).length;toast(`${d.n} 하나 더! 이제 ${n}개예요 (🪙 -${d.p})`);sfx('coin');gdSaveSoon(true);gdRefresh();draw(true);});
  box.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{const i=+b.dataset.r,d=g.dec[i],def=d&&GD_DEC.find(x=>x.k===d.k);if(!def)return;g.dec.splice(i,1);m.coins=(m.coins||0)+Math.floor(def.p/2);sfx('tap');gdSaveSoon(true);gdRefresh();draw(true);});};
 draw();}
function gdRow2HTML(g,pets){const st=gdMisState();return `<div class=gdBtns2><button class="gdB${st.all&&!st.m.got?' rdy':''}" id=gdMisBtn data-gd=mis>🎯 미션 <small>${st.m.got?'완료':st.done+'/'+GD_MIS.length}</small></button><button class=gdB data-gd=snack>🍬 간식</button><button class=gdB data-gd=decor>🎨 꾸미기</button><button class=gdB data-gd=dex>📖 부화 도감</button></div>`;}
// 장식도 손으로 끌어서 옮겨요
(function(){let D=null;const fld=()=>document.getElementById('gdField');
 document.addEventListener('pointerdown',e=>{try{if(e.button>0)return;const el=e.target.closest&&e.target.closest('.gdDec');if(!el||D)return;const f=fld();if(!f||!f.contains(el))return;D={el,i:+el.dataset.di,pid:e.pointerId,on:0,sx:e.clientX,sy:e.clientY};}catch(x){}});
 document.addEventListener('pointermove',e=>{try{if(!D||e.pointerId!==D.pid)return;const f=fld();if(!f||!f.contains(D.el)){D=null;return;}
  if(!D.on){if(Math.hypot(e.clientX-D.sx,e.clientY-D.sy)<5)return;D.on=1;D.el.classList.add('gdHeld');try{D.el.setPointerCapture(e.pointerId);}catch(x){}}
  const r=f.getBoundingClientRect(),hh=D.el.offsetHeight/r.height*100;D.x=Math.max(5,Math.min(95,(e.clientX-r.left)/r.width*100));const it0=gd(S.meta).dec[D.i],df=it0&&GD_DEC.find(x=>x.k===it0.k);D.y=Math.max(df&&df.sky?14:54,Math.min(98,(e.clientY-r.top)/r.height*100+hh*.45));
  D.el.style.left=D.x.toFixed(1)+'%';D.el.style.top=D.y.toFixed(1)+'%';e.preventDefault();}catch(x){}},{passive:false});
 const end=e=>{try{if(!D||(e&&e.pointerId!==D.pid))return;const d=D;D=null;if(!d.on)return;d.el.classList.remove('gdHeld');const it=gd(S.meta).dec[d.i];if(it){it.x=+d.x.toFixed(1);it.y=+d.y.toFixed(1);d.el.style.zIndex=1;gdSaveSoon(true);}}catch(x){D=null;}};
 document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);})();
// 포켓몬을 손으로 들어 옮길 수 있어요: 비행 포켓몬은 놓은 자리 그대로 떠 있고, 걷는 포켓몬은 땅으로 톡 떨어져요
(function(){let D=null;
 const fld=()=>document.getElementById('gdField');
 function pt(e,el,f){const r=f.getBoundingClientRect(),hh=el.offsetHeight/r.height*100;
  return{x:Math.max(5,Math.min(95,(e.clientX-r.left)/r.width*100)),y:Math.max(6,Math.min(98,(e.clientY-r.top)/r.height*100+hh*.45))};}
 document.addEventListener('pointerdown',e=>{try{if(e.button>0)return;const el=e.target.closest&&e.target.closest('.gdPet');if(!el||D)return;const f=fld();if(!f||!f.contains(el))return;
  D={el,id:+el.dataset.id,sx:e.clientX,sy:e.clientY,on:0,pid:e.pointerId};}catch(x){}});
 document.addEventListener('pointermove',e=>{try{if(!D||e.pointerId!==D.pid)return;const el=D.el,f=fld();if(!f||!f.contains(el)){D=null;return;}
  if(!D.on){if(Math.hypot(e.clientX-D.sx,e.clientY-D.sy)<8)return;
   D.on=1;const P=gdFixedPos(S.meta,D.id),C=gdCur(P);P.x=C.x;P.y=C.y;delete P.t0;delete P.tx;delete P.ty; // 걷던 자리에서 멈춰요
   el.__fall=0;el.style.transition='none';el.classList.add('gdHeld');try{el.setPointerCapture(e.pointerId);}catch(x){}try{sfx('tap');}catch(x){}}
  const q=pt(e,el,f);el.style.left=q.x.toFixed(1)+'%';el.style.top=q.y.toFixed(1)+'%';D.q=q;e.preventDefault();}catch(x){}},{passive:false});
 function end(e){try{if(!D||(e&&e.pointerId!==D.pid))return;const d=D;D=null;if(!d.on)return;
  const el=d.el,id=d.id,P=gdFixedPos(S.meta,id),q=d.q||{x:P.x,y:P.y},Z=gdZone(id),fly=gdFly(id);
  window.__gdDragged=Date.now();el.classList.remove('gdHeld');gdMis('drag');
  const x=+q.x.toFixed(1);let y=q.y;
  if(fly){y=Math.max(Z.y0,Math.min(97,y));P.x=x;P.y=+y.toFixed(1);if(y>47)P.hy=P.y;else delete P.hy;
   el.style.transition='';el.style.left=P.x+'%';el.style.top=P.y+'%';el.style.zIndex=3+Math.round(P.y);}
  else{const air=y<Z.y0-1;const ty=air?Z.y0+(Z.y1-Z.y0)*.35:Math.min(97,y);P.x=x;P.y=+ty.toFixed(1);delete P.hy;
   el.style.zIndex=3+Math.round(P.y);
   if(air){el.__fall=1;el.style.transition='top .5s cubic-bezier(.45,0,.9,.55),left .1s';el.style.top=P.y+'%';
    setTimeout(()=>{try{el.style.transition='';el.__fall=0;try{sfx('gdPet');}catch(x){}
     const img=el.querySelector('img'),fl=el.classList.contains('gdFlip')?-1:1;
     if(img&&img.animate)img.animate([{transform:`translateY(0) scale(${fl*1.12},.82)`},{transform:`translateY(-${Math.max(8,el.offsetHeight*.16)}px) scale(${fl*.96},1.06)`,offset:.4},{transform:`translateY(0) scale(${fl*1.05},.93)`,offset:.7},{transform:`translateY(0) scale(${fl},1)`}],{duration:460,easing:'ease-out'});}catch(x){}},520);}
   else{el.style.transition='';el.style.left=P.x+'%';el.style.top=P.y+'%';}}
  P.fly=fly?1:0;try{gdSaveSoon(true);}catch(x){}}catch(x){D=null;}}
 document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);
})();

