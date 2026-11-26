
/* ===== 필드 모험 · 포켓몬 골드풍 도트 맵 =====
   분기점 선택 화면(rlRenderMap)만 '걸어 다니는 맵'으로 바꿔요.
   전투·상점·유물·사건 등은 기존 rlPick → rlEnter 흐름을 그대로 써요.
   도트 출처: pret/pokegold (gfx/sprites) — 색은 직접 입혀 한 장의 시트로 넣었어요.
   포켓몬은 앱 기본 도트(spriteURL)를 그대로, 분기점 아이콘은 직접 찍은 16×16 도트예요. */
(function(){
'use strict';
const q=s=>document.querySelector(s);
const T=16,CW=160,CH=144,MOVE_MS=170;
let K=4; // 캔버스 해상도 배율 (화면 크기에 맞춰 4~8로 자동 조절)
// ---------- 분기점 아이콘: 16×16 도트를 직접 찍은 그림 (이모지 자동 변환 대신) ----------
const ICO_PAL={"o": "#2b2140", "w": "#ffffff", "g": "#dfe6f2", "G": "#9aa6bd", "d": "#5b6684", "y": "#ffd23f", "Y": "#e0a000", "h": "#fff3b0", "r": "#ff5a5f", "R": "#b8283a", "n": "#b9784a", "N": "#d9a066", "D": "#7a4a2a", "c": "#5ad7ff", "C": "#2a8fd8", "p": "#b46bff", "P": "#7a3fd0", "l": "#ff9a2a", "e": "#3cc47c", "E": "#1f8f55", "k": "#2b2140", "b": "#4d6fe0", "B": "#2f4aa8", "m": "#222f78"};
const ICO_SRC={
 "⚔":[".o............o.", "owoo........oogo", ".owgo......owgo.", "..owgo....owgo..", "...owgo..owgo...", "....owgoowgo....", ".....owgwgo.....", "......owgo......", "..o..owgwgo..o..", ".oyoowgoowgooyo.", "..oywgo..owgyo..", "...oyo....oyo...", ".ooDoyo..oYoDoo.", "oYDo.oyooyo.oDYo", "oYYo..o..o..oYYo", ".oo..........oo."],
 "💀":["...oooooooo.....", "..ogwwwwwwgoo...", ".owwwwwwwwwwgo..", "owwwwwwwwwwwgo..", "owwwwwwwwwwwgo..", "owkkkkwwkkkkGo..", "owkrrkwwkkrrGo..", "owkkkkwwkkkkGo..", ".owkkwwwwkkwGo..", ".owwwwkkwwwGGo..", "..owwwwwwwwGo...", "...owgwgwgGo....", "...owgwgwgGo....", "....oGGGGGo.....", ".....ooooo......", "................"],
 "👑":[".o....oo....o...", "oro..occo..oro..", "oyo..oyyo..oyo..", "oyyo.oyyo.oyyo..", "oyyyoyhyyoyyyo..", "oyhyyyhyyyyyyo..", "oyhyyyyyyyyYYo..", "oyyyyyyyyyyYYo..", "oYYYYYYYYYYYYo..", "oYrrYYccYYppYo..", "oYrrYYccYYppYo..", "oYYYYYYYYYYYYo..", ".oooooooooooo...", "................", "................", "................"],
 "🏟":[".....oooo.......", "...ooyyyyoo.....", "..oyyhhhyyyo....", ".oyhhyyyyyyYo...", ".oyhyyrryyyYo...", "oyhyyrrrryyyYo..", "oyhyrrwrrryyYo..", "oyyyrrrrrryYYo..", "oyyyyrrrryyYYo..", ".oyyyyrryyYYo...", ".oyyyyyyyYYYo...", "..oYYyyyYYYo....", "...ooYYYYoo.....", ".....oooo.......", "................", "................"],
 "🏺":["............o...", "...ooooooooowo..", "..owcccccccwwwo.", ".owwwccccccCwo..", "ocwCCCCCCCCCCo..", "occcccccccCCCo..", "oCcccccccCCCCo..", ".oCccccccCCCo...", "..oCccccCCCo....", "...oCcccCCo.....", "....oCccCo......", ".....oCCo.......", "......oo........", "................", "................", "................"],
 "⛺":[".......o........", "......oro.......", ".....orro..o....", ".....orrrooro...", "....orrrrrorro..", "....orrlrrrrro..", "...orrllrrlrro..", "...orllyllllro..", "...orllyyyllro..", "...orllyhyyllo..", "...orllyhhyllo..", ".oooorllyyylloo.", "oNnnnnrrllnnnnNo", "oDDDDDDDDDDDDDDo", ".oooooooooooooo.", "................"],
 "🛒":[".....oooo.......", "....onnnno......", "...onNNNNno.....", "....oRRRRo......", "...onnnnnno.....", "..onNNnnnnno....", ".onNNnnyynnno...", ".onNnnyhyYnnDo..", "onNnnnyyyYnnDo..", "onNnnnyhyYnnDo..", "onnnnnnyyYnnDo..", ".onnnnnnnnnDo...", "..oDDnnnnDDo....", "...ooDDDDoo.....", ".....oooo.......", "................"],
 "🎲":["................", ".oooooooooo.....", "owwwwwwwwwGo....", "owrrwwwwrrGo....", "owrrwwwwrrGo....", "owwwwwwwwwGo....", "owwwwrrwwwGo....", "owwwwrrwwwGo....", "owwwwwwwwwGo....", "owrrwwwwrrGo....", "owrrwwwwrrGo....", "oGGGGGGGGGGo....", ".oooooooooo.....", "................", "................", "................"],
 "🎓":["................", ".......oo.......", ".....oocboo.....", "...oobccbbboo...", ".oobccbbbbbbboo.", "obcbbbbybbbbbbyo", ".oBBbbbbbbbbBByo", "..ooBBBBBBBBoyo.", "....ommmmmmmoyo.", "....omBmmmmmoYo.", "....ommmmmmmoYo.", ".....ommmmmo.o..", "......ooooo.....", "................", "................", "................"],
 "❓":["......oooo......", ".....oyyyyoo....", "....oyyhhyyYo...", "...oyyhyyyyYo...", "...oyyooooyYo...", "....oo...oyYo...", "........oyyYo...", ".......oyyYo....", "......oyyYo.....", "......oyyYo.....", ".......ooo......", "......oyyYo.....", "......oyyYo.....", ".......ooo......", "................", "................"],
 "🧳":["................", ".....oooo.......", "....oDDDDo......", "...oDooooDo.....", ".oooDooooDooo...", "oNNNNNNNNNNNNo..", "onNNNNNNNNNNno..", "onnnnnnnnnnnno..", "onnYnnnnnnYnno..", "onnYnnyynnYnno..", "onnYnnyynnYnno..", "onnYnnnnnnYnno..", "oDDDDDDDDDDDDo..", ".oooooooooooo...", "................", "................"]
};
const ICO_C=Object.create(null);
function icon(ch){ch=String(ch||'').replace(/\uFE0F/g,'');let c=ICO_C[ch];
 if(c===undefined){const rows=ICO_SRC[ch];if(!rows){c=ICO_C[ch]=null;return null;}
  c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d');
  rows.forEach((r,y)=>{for(let i=0;i<16;i++){const k=r[i];if(k&&k!=='.'){x.fillStyle=ICO_PAL[k];x.fillRect(i,y,1,1);}}});ICO_C[ch]=c;}
 return c;}

// ---------- 포켓몬 도트: 앱에서 평소 쓰는 96×96 그림을 그대로 쓰고, 투명 여백만 잘라 정수 배율로 그려요 ----------
const SPRC=Object.create(null);
function monSpr(src){if(!src)return null;let s=SPRC[src];if(s===undefined){s=SPRC[src]={ok:false,bad:false,trim:false};sprLoad(src,s,true);}return s.ok?s:null;}
function sprLoad(src,s,cors){
 const im=new Image();if(cors)im.crossOrigin='anonymous';
 im.onload=()=>{
  const svg=/^data:image\/svg/.test(src),w=svg?96:im.naturalWidth,h=svg?96:im.naturalHeight;
  if(!w||!h){s.bad=true;return;}
  let cv=im,sw=w,sh=h,pad=Math.round(h*.1);
  try{
   const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(im,0,0,w,h);
   const d=x.getImageData(0,0,w,h).data;let a=w,b=-1,t=h,u=-1;
   for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(d[(yy*w+xx)*4+3]>24){if(xx<a)a=xx;if(xx>b)b=xx;if(yy<t)t=yy;if(yy>u)u=yy;}
   if(b>=0){const bw=b-a+1,bh=u-t+1,c2=document.createElement('canvas');c2.width=bw;c2.height=bh;c2.getContext('2d').drawImage(c,a,t,bw,bh,0,0,bw,bh);cv=c2;sw=bw;sh=bh;pad=0;s.trim=true;}
  }catch(err){/* 그림을 읽을 수 없으면 원본 그대로 써요 */}
  s.cv=cv;s.w=sw;s.h=sh;s.pad=pad;s.ok=true;};
 im.onerror=()=>{if(cors)sprLoad(src,s,false);else s.bad=true;};
 im.src=src;}
// 도트 한 칸을 화면의 정수 칸으로 그려야 깨끗해요 (K = 화면 한 칸당 실제 픽셀 수)
function sprScale(s,t,ke){const mx=Math.max(s.w,s.h),m0=Math.max(1,Math.round(ke/4));let m=m0;
 if(!s.trim)return m;
 if(t==='boss'&&mx*m0*2/ke<=46)m=m0*2;
 else if(mx*m/ke<12)m=Math.min(m0*2,Math.ceil(12*ke/mx));
 return m;}
// 필드 포켓몬 크기: 도감의 실제 키(ht, m)에 비례해요. 키가 큰 포켓몬은 크게, 작은 포켓몬은 작게 보이되 너무 작거나 커지지 않도록 완만하게 줄여요.
function monFieldH(id,t){let ht=0;try{ht=+((MON[id]||{}).ht)||0;}catch(e){}if(!(ht>0))ht=1;
 let h=Math.max(10,Math.min(42,18*Math.pow(ht/1.5,.45)));
 if(t==='boss')h=Math.min(46,h*1.6);else if(t==='elite')h=Math.min(44,h*1.2);return h;}
function monSized(sp,id,t,ke){
 if(!sp||!sp.trim)return null; // 투명 여백을 못 잘랐으면 예전 방식 그대로
 let H=monFieldH(id,t);if(sp.w/sp.h*H>48)H=48*sp.h/sp.w; // 옆으로 아주 긴 포켓몬은 폭도 제한
 const f=H*ke/sp.h,key=(Math.round(H*4)/4)+'@'+ke;
 sp.rs=sp.rs||{};let r=sp.rs[key];
 if(!r){const w=Math.max(1,Math.round(sp.w*f)),h=Math.max(1,Math.round(sp.h*f)),c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
  x.imageSmoothingEnabled=f<1;try{x.imageSmoothingQuality='high';}catch(e){}
  x.drawImage(sp.cv,0,0,w,h);r=sp.rs[key]={cv:c,w:w,h:h};}
 return r;}

window.__MONKIT={monSpr,monSized,monFieldH,SPRC};
const ATLAS_SRC='data:image/png;base64,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';
// 시트 순서(한 칸 = 16×96, 프레임: 아래·위·왼쪽 서기 / 아래·위·왼쪽 걷기)
const SPR={hero:0,youngster:1,lass:2,gramps:3,clerk:4,fisher:5,bug:6,oak:7,officer:8,sage:9,teacher:10,coolm:11,coolf:12,fan:13,ball:14,lead:15,trav:24,heroF:25,castle:26};
const HSPR=()=>{try{return S&&S.meta&&S.meta.pg==='f'?SPR.heroF:SPR.hero;}catch(e){return SPR.hero;}};
// 관장 필드 캐릭터: 체육관 속성 색에 맞춰요 (바위·물결·번개·숲·안개·환상·불꽃·용·챔피언 순서)
const GYM_SPR=[0,1,2,3,4,5,6,7,8].map(i=>SPR.lead+i); // 관장마다 전용 도트(9명)
const atlas=new Image();atlas.src=ATLAS_SRC;
const DX=[0,0,-1,1],DY=[1,-1,0,0]; // 0아래 1위 2왼 3오른
const OPP=[1,0,3,2];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function mulberry(a){a=(a>>>0)||1;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function vnoise(x,y,seed){const h=(ix,iy)=>{let n=Math.imul(ix*374761393+iy*668265263+seed,1274126177);n=Math.imul(n^n>>>13,1103515245);return((n^n>>>16)>>>0)/4294967296;};
 const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
 const a=h(ix,iy),b=h(ix+1,iy),c=h(ix,iy+1),d=h(ix+1,iy+1);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;}

// ---------- 지역별 색 (SC_REGIONS 순서: 숲·해안·화산·도시·천문대·밤) ----------
const TH=[
 {g1:'#8fd06a',g2:'#7cc058',g3:'#4e9b48',g4:'#2f7040',t1:'#2f8a48',t2:'#5cbc6c',t3:'#1f5e38',ol:'#173a2a',p1:'#ecd9a4',p2:'#d4be84',p3:'#b79e66',w1:'#5aa8ec',w2:'#a4d4ff',w3:'#3a78c8',fl:['#ff6a8a','#ffe45a','#ffffff'],rk1:'#b4b4c0',rk2:'#7c7c92',ponds:1,tint:null},
 {g1:'#a6dc84',g2:'#94cc72',g3:'#5ea852',g4:'#386e44',t1:'#38a060',t2:'#6ccc84',t3:'#24704a',ol:'#183e34',p1:'#f6e6b4',p2:'#e2cf94',p3:'#c8b378',w1:'#4cb4ee',w2:'#b0e4ff',w3:'#2a86cc',fl:['#ff9ab4','#fff07a','#ffffff'],rk1:'#c4bcb0',rk2:'#948c80',ponds:2,coast:1,tint:'rgba(255,230,160,.06)'},
 {g1:'#7a6460',g2:'#6a5450',g3:'#a04a30',g4:'#5a2a22',t1:'#4a3836',t2:'#7a5c52',t3:'#2e201f',ol:'#1c1212',p1:'#c8a890',p2:'#b0907a',p3:'#947860',w1:'#ff7a2a',w2:'#ffd24a',w3:'#c8381a',fl:['#ff5a2a','#ffd23a','#fff2a0'],rk1:'#8a7c7a',rk2:'#5a4c4c',ponds:2,volc:1,tint:'rgba(255,90,20,.08)'},
 {g1:'#bcc4d0',g2:'#a8b2c2',g3:'#6c84a4',g4:'#46607e',t1:'#4a8c7c',t2:'#7ac4ae',t3:'#2c5c52',ol:'#1a2c34',p1:'#eceef6',p2:'#d4d8e6',p3:'#b4bad0',w1:'#6ab4f0',w2:'#b8e0ff',w3:'#3c82cc',fl:['#a98bff','#7ee0ff','#ffffff'],rk1:'#c8ccd8',rk2:'#8a90a8',ponds:1,city:1,tint:'rgba(120,140,220,.07)'},
 {g1:'#cbc4f2',g2:'#b8b0e6',g3:'#8478c8',g4:'#58509c',t1:'#6a60c0',t2:'#a49cf0',t3:'#403a88',ol:'#221e4c',p1:'#f4ecff',p2:'#dcd0f2',p3:'#bcb0dc',w1:'#7ab0ff',w2:'#c8e0ff',w3:'#4a7ad8',fl:['#ffd0f0','#fff4a0','#ffffff'],rk1:'#d0ccec',rk2:'#9890c4',ponds:2,obs:1,tint:'rgba(150,120,255,.08)'},
 {g1:'#4c8a6c',g2:'#3e7a5e',g3:'#2c6050',g4:'#1c3e38',t1:'#2a5e58',t2:'#4a8e84',t3:'#183c3c',ol:'#0c1e24',p1:'#8c9ab0',p2:'#78869e',p3:'#5e6c84',w1:'#2e5ec0',w2:'#6c9cf0',w3:'#1a3c8c',fl:['#ff8ab0','#ffe87a','#d8f0ff'],rk1:'#7c849c',rk2:'#545c78',ponds:2,night:1,tint:'rgba(10,10,70,.34)'}
];
const TL={GRASS:0,PATH:1,TALL:2,TREE:3,WATER:4,FLOWER:5,ROCK:6,CARPET:7,PILLAR:8,GYM:9,MARBLE:10,DAIS:11,MBLK:12,CLOUD:13,CLOUDF:14,LAMP:15}; // CLOUD=막힌 구름, CLOUDF=걸을 수 있는 구름 바닥(상자가 놓이는 곳)
const BLOCK=new Set([TL.TREE,TL.WATER,TL.ROCK,TL.PILLAR,TL.GYM,TL.MBLK,TL.CLOUD,TL.LAMP]); // GYM: 체육관 건물 자리 (바닥은 풀로 그려져요)
try{window.__RLKIT={T:T,TH:TH,TL:TL,makeSheet:makeSheet,makeTufts:makeTufts,atlas:atlas,hero:()=>HSPR(),spr:SPR,hall:()=>{try{return hallSheets();}catch(e){return null;}}};}catch(e){} // 야생 등장 연출이 같은 도트를 쓰도록 공개

// ---------- 타일 시트 (손으로 찍는 16×16 도트) ----------
// 0-2 풀 · 3-4 길 · 5-6 긴풀 · 7 나무 · 8-9 물 · 10-11 꽃 · 12 바위 · 13 카펫 · 14 기둥 · 15 표지판 · 16 텐트
// ---------- 풀밭: 포켓몬 금·은처럼 8×8 칸마다 V자 풀잎 한 포기 (도시 맵은 화단이라 그대로 둬요) ----------
// 투명 배경 16×16 4프레임 (가로 0/1px × 세로 0/1px) — 바닥 위에 얹는 용도, 지나갈 때 발을 가리는 용도, 바스락 흔들림에 함께 써요
const tuftCol=th=>th.volc?{O:'#6a3c1a',M:'#c8883a',L:'#f0c060'}:th.city?{O:'#2f6b3a',M:'#4aa85a',L:'#8fe09a'}:{O:th.t3,M:th.t1,L:th.t2};
function makeTufts(th){
 const c=document.createElement('canvas');c.width=T*4;c.height=T;const g=c.getContext('2d'),col=tuftCol(th);
 const SH=['O..O..O','OL.O.MO','OLOOOMO','.OLOMO.','..OMO..','...O...'];
 for(let f=0;f<4;f++){const dx=f&1,dy=f>>1;
  for(let cy=0;cy<2;cy++)for(let cx=0;cx<2;cx++)SH.forEach((row,yy)=>{for(let xx=0;xx<7;xx++){const ch=row[xx];if(ch==='.')continue;g.fillStyle=col[ch];g.fillRect(f*T+cx*8+xx+dx,cy*8+yy+dy,1,1);}});}
 return c;
}
function makeSheet(th){
 const c=document.createElement('canvas');c.width=T*30;c.height=T;const g=c.getContext('2d');
 const R=(i,x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(i*T+x,y,w,h);};
 const grass=(i,v)=>{R(i,0,0,16,16,th.g1);const r=mulberry(v*77+5);for(let k=0;k<7;k++)R(i,Math.floor(r()*15),Math.floor(r()*15),1,1,th.g2);
  for(let k=0;k<2;k++){const x=1+Math.floor(r()*11),y=1+Math.floor(r()*11);R(i,x,y,1,2,th.g3);R(i,x+2,y,1,2,th.g3);R(i,x+1,y+1,1,1,th.g3);}};
 for(let v=0;v<3;v++)grass(v,v);
 for(let v=0;v<2;v++){const i=3+v;R(i,0,0,16,16,th.p1);const r=mulberry(v*31+9);for(let k=0;k<9;k++)R(i,Math.floor(r()*15),Math.floor(r()*15),1,1,th.p2);for(let k=0;k<3;k++)R(i,Math.floor(r()*14),Math.floor(r()*14),2,1,th.p3);}
 for(let f=0;f<2;f++){const i=5+f;R(i,0,0,16,16,th.g2);for(const bx of [0,5,10]){const s=f?1:0;R(i,bx+s,5,4,8,th.g3);R(i,bx+s+1,3,2,3,th.g3);R(i,bx+s+1,3,1,2,th.g1);R(i,bx+s,11,4,2,th.g4);R(i,bx+s+3,6,1,6,th.g4);}R(i,0,13,16,3,th.g3);R(i,0,15,16,1,th.g4);}
 { // 나무
  grass(7,1);const i=7;R(i,6,12,4,4,'#6a4026');R(i,5,12,1,4,th.ol);R(i,10,12,1,4,th.ol);
  const rows=[[5,11],[3,13],[2,14],[1,15],[1,15],[0,16],[0,16],[1,15],[1,15],[2,14],[2,14],[3,13],[5,11]];
  rows.forEach((r,y)=>R(i,r[0],y,r[1]-r[0],1,th.ol));
  rows.forEach((r,y)=>{if(y>0&&y<12)R(i,r[0]+1,y,r[1]-r[0]-2,1,th.t1);});
  R(i,4,2,4,2,th.t2);R(i,3,4,2,2,th.t2);R(i,8,3,3,1,th.t2);R(i,6,6,2,1,th.t2);
  R(i,9,8,4,3,th.t3);R(i,5,10,6,1,th.t3);R(i,12,6,2,2,th.t3);R(i,2,8,2,1,th.t3);
 }
 for(let f=0;f<2;f++){const i=8+f;R(i,0,0,16,16,th.w1);for(const y of [2,7,12]){const o=(f?6:0)+y*2;R(i,o%12,y,4,1,th.w2);R(i,(o+8)%12,y+2,3,1,th.w3);}}
 for(let f=0;f<2;f++){const i=10+f;grass(i,1);[[3,4+f],[10,9],[6,12-f]].forEach((p,k)=>{const col=th.fl[k%th.fl.length];R(i,p[0],p[1],3,1,col);R(i,p[0]+1,p[1]-1,1,3,col);R(i,p[0]+1,p[1],1,1,'#ffd23a');R(i,p[0]+1,p[1]+2,1,2,th.g3);});}
 { // 바위
  grass(12,2);const i=12,rows=[[4,12],[2,14],[1,15],[1,15],[1,15],[2,14],[3,13]];
  rows.forEach((r,y)=>R(i,r[0],4+y,r[1]-r[0],1,th.ol));rows.forEach((r,y)=>{if(y>0&&y<6)R(i,r[0]+1,4+y,r[1]-r[0]-2,1,th.rk1);});
  R(i,4,6,3,1,'#fff');R(i,3,7,2,1,'#fff');R(i,8,9,5,2,th.rk2);R(i,5,10,3,1,th.rk2);
 }
 { const i=13;R(i,0,0,16,16,'#c8404e');R(i,0,0,2,16,'#8f2335');R(i,14,0,2,16,'#8f2335');R(i,2,0,1,16,'#f0c850');R(i,13,0,1,16,'#f0c850');for(let y=2;y<16;y+=4){R(i,7,y,2,1,'#e8707a');}}
 { const i=14;R(i,0,0,16,16,th.p1);R(i,3,0,10,16,th.ol);R(i,4,0,8,16,'#b4b4c8');R(i,4,0,2,16,'#dcdcec');R(i,9,0,3,16,'#8a8aa4');R(i,3,0,10,2,th.ol);R(i,2,1,12,3,th.ol);R(i,3,2,10,1,'#dcdcec');R(i,3,12,10,4,th.ol);R(i,4,13,8,2,'#8a8aa4');}
 { const i=15;R(i,7,9,2,6,'#6a4026');R(i,1,2,14,8,th.ol);R(i,2,3,12,6,'#e8bc70');R(i,2,3,12,1,'#f6d898');R(i,4,5,8,1,'#8a5a30');R(i,4,7,6,1,'#8a5a30');}
 { const i=16;const w=y=>Math.floor(y*0.62)+1;for(let y=1;y<=13;y++){const h=w(y);R(i,8-h-1,y,1,1,th.ol);R(i,8+h,y,1,1,th.ol);R(i,8-h,y,h*2,1,y%5===0?'#f6e8d8':'#e5534b');}
  R(i,2,14,12,1,th.ol);R(i,2,13,12,1,'#b83c3c');R(i,6,8,4,6,th.ol);R(i,7,9,2,5,'#3a2a50');R(i,7,0,2,2,'#ffd23a');R(i,6,2,4,1,th.ol);}
 for(let v=0;v<2;v++){const i=17+v;R(i,0,0,16,16,v?'#d8d0ea':'#f0eafa');R(i,0,0,8,8,v?'#f0eafa':'#d8d0ea');R(i,8,8,8,8,v?'#f0eafa':'#d8d0ea');R(i,0,0,16,1,'rgba(255,255,255,.6)');R(i,0,15,16,1,'#b4a8cc');R(i,15,0,1,16,'#b4a8cc');}
 { const i=19;R(i,0,0,16,16,'#e6def4');R(i,0,0,16,3,'#fffaf0');R(i,0,3,16,1,'#f0c040');R(i,0,4,16,5,'#d4c8ea');R(i,0,9,16,1,'#b8862a');R(i,0,10,16,6,'#b4a8cc');R(i,0,15,16,1,'#8a7aa8');}
 for(let v=0;v<2;v++){const i=20+v,o=v?3:0;R(i,0,0,16,16,'#9fd4ff');R(i,0,10,16,6,'#c9e8ff');R(i,1+o%3,7,12,7,'#ffffff');R(i,3,4+v,9,5,'#ffffff');R(i,8-o,2+v*2,6,5,'#ffffff');R(i,2,12,13,2,'#dcefff');R(i,0,14,16,2,'#bfe0ff');R(i,5,6,3,1,'#eaf6ff');}
 if(th.city){ // ===== 도시 타일: 보도 · 아스팔트 · 화단 · 빌딩 벽 · 화분 · 쓰레기통 =====
  const pave=(i,v)=>{R(i,0,0,16,16,'#c9ced8');const r=mulberry(v*53+11);for(let k=0;k<8;k++)R(i,Math.floor(r()*15),Math.floor(r()*15),1,1,'#d9dde8');
   R(i,0,7,16,1,'#aab1c2');R(i,0,15,16,1,'#aab1c2');R(i,(v*3+7)%16,0,1,7,'#aab1c2');R(i,(v*5+2)%16,8,1,7,'#aab1c2');R(i,0,0,16,1,'rgba(255,255,255,.35)');};
  for(let v=0;v<3;v++)pave(v,v);
  for(let v=0;v<2;v++){const i=3+v;R(i,0,0,16,16,'#4a4f5e');const r=mulberry(v*41+3);for(let k=0;k<10;k++)R(i,Math.floor(r()*15),Math.floor(r()*15),1,1,k%2?'#5c6277':'#3b3f4c');R(i,Math.floor(r()*12),Math.floor(r()*14),3,1,'#3b3f4c');}
  for(let f=0;f<2;f++){const i=5+f;R(i,0,0,16,16,'#86c96e');const r=mulberry(91);for(let k=0;k<10;k++)R(i,Math.floor(r()*15),Math.floor(r()*15),1,1,k%2?'#74b95e':'#9bdc84');} // 도시 풀밭: 화단 대신 평평한 잔디 (풀잎은 위에 따로 얹어요)
  for(let f=0;f<2;f++){const i=27+f;pave(i,f);const s2=f?1:0,rows=[[4,12],[2,14],[1,15],[1,15],[1,15],[2,14],[3,13]]; // 가시덤불 이벤트용 둥근 관목
   rows.forEach((r,y)=>R(i,r[0],5+y,r[1]-r[0],1,'#1f4a2e'));rows.forEach((r,y)=>{if(y>0&&y<6)R(i,r[0]+1,5+y,r[1]-r[0]-2,1,'#4aa85a');});
   R(i,4+s2,7,3,1,'#8fe09a');R(i,3,8,2,1,'#8fe09a');R(i,8,10,5,2,'#2f7a40');R(i,5,11,3,1,'#2f7a40');}
  const FACE=['#8c96b4','#b48a78','#78a496','#9a86b8'];
  [7,22,23,24].forEach((i,k)=>{const w=FACE[k];R(i,0,0,16,16,w);for(let y=0;y<16;y+=4)R(i,0,y,16,1,'rgba(255,255,255,.10)');R(i,15,0,1,16,'rgba(20,20,50,.28)');R(i,0,15,16,1,'rgba(20,20,50,.25)');
   for(const wx of [2,10]){R(i,wx-1,2,6,8,'#2a3250');R(i,wx,3,4,6,'#34406a');R(i,wx+1,3,1,6,'#2a3250');R(i,wx-1,10,6,1,'#e6eaf6');}});
  for(let v=0;v<2;v++){const i=10+v;pave(i,v+1);R(i,4,10,8,5,'#2a2038');R(i,5,10,6,4,'#d8683a');R(i,5,10,6,1,'#f09a62');R(i,5,13,6,1,'#a84a26');
   [[5,7],[8,5+v],[10,8]].forEach((a,k)=>{const col=th.fl[k%th.fl.length];R(i,a[0],a[1],2,2,col);R(i,a[0]+1,a[1]-1,1,1,col);R(i,a[0],a[1]+2,1,2,th.t1);R(i,a[0]+1,a[1]+2,1,1,th.t3);});}
  { const i=12;pave(i,2);R(i,1,5,14,10,'#2a2038');R(i,2,7,12,7,'#3e8a5c');R(i,2,7,12,1,'#5cbc84');R(i,1,4,14,3,'#2a2038');R(i,2,5,12,1,'#2c6a44');R(i,2,5,12,1,'#4a9a6c');R(i,3,10,10,1,'#2c6a44');R(i,3,12,10,1,'#2c6a44');R(i,12,14,2,1,'#c8ccd8');}
  for(let f=0;f<2;f++){const i=8+f;R(i,0,0,16,16,'#56d6ee');R(i,0,7,16,1,'#3cbcd8');R(i,7,0,1,16,'#3cbcd8');for(const y of [2,10]){const o=(f?5:0)+y*2;R(i,o%11,y,4,1,'#c8f8ff');R(i,(o+7)%11,y+3,3,1,'#9aeaf8');}R(i,12,13,2,1,'#e8fcff');} // 수영장 물
  { const i=26;R(i,0,0,16,16,'#8a92a8');const r=mulberry(77);for(let k=0;k<9;k++)R(i,Math.floor(r()*15),Math.floor(r()*15),1,1,k%2?'#9aa2b8':'#767e94');R(i,0,7,16,1,'#7a8298');R(i,7,0,1,16,'#7a8298');} // 옥상 바닥
  { const i=25;pave(i,1);R(i,5,13,6,3,'#2a2038');R(i,6,13,4,2,'#6a7290');} // 가로등 밑둥
 }
 if(th.coast){ // ===== 해안 타일: 모래 · 나무 널길 · 해안 풀 · 야자수 · 불가사리/조개 · 바위 =====
  const OLC='#2a2a1c',sand=(i,v)=>{R(i,0,0,16,16,'#f2dca0');const r=mulberry(v*61+7);for(let k=0;k<9;k++)R(i,Math.floor(r()*15),Math.floor(r()*15),1,1,k%3?'#e2c684':'#fff4cc');
   const x=1+Math.floor(r()*9),y=2+Math.floor(r()*10);R(i,x,y,4,1,'#e8d090');R(i,x+1,y+1,2,1,'#e8d090');};
  for(let v=0;v<3;v++)sand(v,v);
  for(let v=0;v<2;v++){const i=3+v;R(i,0,0,16,16,'#b98a58');for(let y=0;y<16;y+=4){R(i,0,y,16,1,'#8a5e36');R(i,0,y+1,16,1,'#d4a874');}
   R(i,(v?3:9),0,1,4,'#8a5e36');R(i,(v?11:5),4,1,4,'#8a5e36');R(i,(v?6:12),8,1,4,'#8a5e36');R(i,(v?2:8),12,1,4,'#8a5e36');
   R(i,(v?4:10),2,1,1,'#5a3a20');R(i,(v?12:6),6,1,1,'#5a3a20');R(i,(v?7:13),10,1,1,'#5a3a20');}
  for(let f=0;f<2;f++){const i=5+f;sand(i,f+1);const s2=f?1:0;
   for(const bx of [0,5,10]){R(i,bx+s2,5,4,8,'#4e8a3a');R(i,bx+s2+1,3,2,3,'#4e8a3a');R(i,bx+s2+1,3,1,2,'#a8cf6a');R(i,bx+s2,10,4,3,'#3a6a2c');R(i,bx+s2+3,6,1,6,'#3a6a2c');R(i,bx+s2,5,1,6,'#7ab04a');}
   R(i,0,13,16,3,'#e2c684');}
  const palm=(i,fl)=>{sand(i,fl+1);const RR=(x,y,w,h,k)=>R(i,fl?16-x-w:x,y,w,h,k),OLP='#1c4a2a';
   RR(3,13,10,2,'rgba(140,100,40,.35)');
   RR(6,7,4,8,'#3a2a18');RR(7,7,2,8,'#b07a44');RR(7,7,1,8,'#d09a5c');RR(7,9,2,1,'#7a5230');RR(7,12,2,1,'#7a5230');
   const fr=[[1,4,6,3],[9,4,6,3],[4,1,8,3],[2,6,3,2],[11,6,3,2],[5,3,6,4]];
   fr.forEach(a=>RR(a[0]-1,a[1]-1,a[2]+2,a[3]+2,OLP));fr.forEach(a=>RR(a[0],a[1],a[2],a[3],'#2f8a48'));
   RR(5,2,6,1,'#5cbc6c');RR(2,4,4,1,'#5cbc6c');RR(10,4,4,1,'#5cbc6c');RR(3,6,3,1,'#1f5e38');RR(11,6,3,1,'#1f5e38');RR(6,5,4,1,'#1f5e38');
   RR(7,6,2,2,'#6a4026');RR(7,6,1,1,'#a8703c');};
  palm(7,0);palm(22,1);
  for(let f=0;f<2;f++){const i=10+f;sand(i,f+1);
   R(i,5,8-f,1,3,'#ff7a7a');R(i,4,9-f,3,1,'#ff7a7a');R(i,5,9-f,1,1,'#ffd0a0');R(i,4,8-f,1,1,'#ff7a7a');R(i,7,8-f,1,1,'#ff7a7a');R(i,4,11-f,1,1,'#ff7a7a');R(i,6,11-f,1,1,'#ff7a7a');
   R(i,10,5+f,3,3,'#e0a0b0');R(i,11,5+f,1,3,'#fff0f0');R(i,10,6+f,3,1,'#fff0f0');R(i,10,7+f,3,1,'#c8808c');R(i,9,12,2,1,'#fff0f0');}
  { const i=12;sand(i,2);const rows=[[4,12],[2,14],[1,15],[1,15],[1,15],[2,14],[3,13]];
   rows.forEach((r,y)=>R(i,r[0],4+y,r[1]-r[0],1,'#2a3040'));rows.forEach((r,y)=>{if(y>0&&y<6)R(i,r[0]+1,4+y,r[1]-r[0]-2,1,'#9aa6b4');});
   R(i,4,6,3,1,'#d8e0ea');R(i,3,7,2,1,'#d8e0ea');R(i,8,9,5,2,'#6e7a8c');R(i,5,10,3,1,'#6e7a8c');R(i,11,7,2,1,'#4cb4ee');R(i,2,12,3,1,'#4cb4ee');}
  { const i=25;sand(i,1);R(i,5,13,6,3,'#7a5230');R(i,6,13,4,2,'#b98a58');} // 파라솔 밑둥
 }
 if(th.volc){ // ===== 화산 타일: 현무암 땅 · 재길 · 그을린 갈대 · 흑요석/탄 나무 · 용암 · 불씨 수정 · 갈라진 바위 =====
  const ash=(i,v)=>{R(i,0,0,16,16,'#5a4a48');const r=mulberry(v*67+13);for(let k=0;k<10;k++)R(i,Math.floor(r()*15),Math.floor(r()*15),1,1,k%3?'#6e5c58':'#463836');
   if(v===1)R(i,Math.floor(r()*12),Math.floor(r()*14),1,1,'#ff9a3a');
   const x=1+Math.floor(r()*9),y=2+Math.floor(r()*10);R(i,x,y,4,1,'#3a2c2a');R(i,x+3,y+1,1,2,'#3a2c2a');};
  for(let v=0;v<3;v++)ash(v,v);
  for(let v=0;v<2;v++){const i=3+v;R(i,0,0,16,16,'#b8a898');const r=mulberry(v*37+5);for(let k=0;k<10;k++)R(i,Math.floor(r()*15),Math.floor(r()*15),1,1,k%2?'#d0c0b0':'#9a8878');R(i,Math.floor(r()*11),Math.floor(r()*13),3,1,'#8a7868');R(i,(v?3:9),5,1,5,'#a49484');}
  for(let f=0;f<2;f++){const i=5+f;ash(i,f+1);const s2=f?1:0;
   for(const bx of [0,5,10]){R(i,bx+s2,5,4,8,'#c8883a');R(i,bx+s2+1,3,2,3,'#c8883a');R(i,bx+s2+1,2,1,2,'#ff6a2a');R(i,bx+s2,10,4,3,'#7a4a22');R(i,bx+s2+3,6,1,6,'#7a4a22');R(i,bx+s2,5,1,6,'#e8b050');}
   R(i,0,13,16,3,'#463836');}
  const spire=i=>{ash(i,2);const OLV='#1a1016';R(i,3,14,10,2,'rgba(0,0,0,.35)');
   const rows=[[7,9],[6,10],[6,10],[5,11],[5,11],[4,12],[4,12],[3,13],[3,13]];rows.forEach((r,k)=>{R(i,r[0]-1,3+k,r[1]-r[0]+2,1,OLV);});
   rows.forEach((r,k)=>R(i,r[0],3+k,r[1]-r[0],1,'#2e2238'));rows.forEach((r,k)=>R(i,r[0],3+k,2,1,'#6a4a98'));
   R(i,3,12,10,1,'#1a1016');R(i,3,13,10,1,'#ff5a2a');R(i,5,13,2,1,'#ffd23a');R(i,10,13,2,1,'#ffd23a');R(i,7,5,1,3,'#9a7ad8');};
  spire(22);
  { const i=7;ash(i,1);R(i,3,14,10,2,'rgba(0,0,0,.35)');R(i,6,6,4,9,'#1a1016');R(i,7,6,2,9,'#2e2020');R(i,7,6,1,9,'#4a3834');
   R(i,3,3,3,1,'#1a1016');R(i,4,3,1,4,'#1a1016');R(i,5,5,2,2,'#1a1016');R(i,4,4,1,3,'#2e2020');
   R(i,10,2,3,1,'#1a1016');R(i,11,2,1,5,'#1a1016');R(i,9,5,2,2,'#1a1016');R(i,11,3,1,3,'#2e2020');
   R(i,7,9,1,1,'#ff7a2a');R(i,8,12,1,1,'#ff9a3a');R(i,4,3,1,1,'#ff7a2a');R(i,11,2,1,1,'#ffb830');}
  for(let f=0;f<2;f++){const i=8+f;R(i,0,0,16,16,'#e8501c');for(const y of [2,8,12]){const o=(f?5:0)+y*2;R(i,o%11,y,5,2,'#ffb030');R(i,(o+6)%11,y+1,3,1,'#ffe060');}R(i,(f?9:2),5,3,2,'#8a2010');R(i,(f?3:11),13,3,1,'#8a2010');}
  for(let f=0;f<2;f++){const i=10+f;ash(i,f+1);
   [[3,9,0],[10,7,1],[7,12,2]].forEach(a=>{const col=th.fl[a[2]];R(i,a[0],a[1],2,4-f,col);R(i,a[0]+1,a[1]-1,1,2,col);R(i,a[0],a[1]-1,1,1,'#fff2a0');R(i,a[0]-1,a[1]+3,4,1,'rgba(255,120,40,.45)');});}
  { const i=12;ash(i,2);const rows=[[4,12],[2,14],[1,15],[1,15],[1,15],[2,14],[3,13]];
   rows.forEach((r,y)=>R(i,r[0],4+y,r[1]-r[0],1,'#1a1016'));rows.forEach((r,y)=>{if(y>0&&y<6)R(i,r[0]+1,4+y,r[1]-r[0]-2,1,'#4a3a38');});
   R(i,4,6,3,1,'#7a6664');R(i,3,7,2,1,'#7a6664');R(i,8,9,5,2,'#2e2220');R(i,5,10,3,1,'#2e2220');R(i,6,7,1,3,'#ff7a2a');R(i,7,9,2,1,'#ff7a2a');R(i,7,10,1,2,'#ffb830');R(i,10,6,1,2,'#ff7a2a');}
  { const i=26;R(i,0,0,16,16,'#3a2e2c');R(i,0,0,8,8,'#463836');R(i,8,8,8,8,'#463836');R(i,0,0,16,1,'#6a5a58');R(i,0,15,16,1,'#1a1016');R(i,15,0,1,16,'#1a1016');R(i,3,4,4,1,'#ff7a2a');R(i,6,5,1,3,'#ff7a2a');R(i,9,11,5,1,'#ff7a2a');R(i,9,12,1,2,'#ffb830');R(i,12,3,1,1,'#ffb830');} // 달궈진 바위 발판
  { const i=25;ash(i,1);R(i,4,12,8,4,'#1a1016');R(i,5,12,6,3,'#4a3a38');R(i,5,12,6,1,'#6a5a58');} // 횃불 밑둥
 }
 if(th.obs){ // ===== 천문대 타일: 밤하늘 돌바닥 · 대리석 길 · 별빛 갈대 · 돔/수정탑 · 전기장 · 별 조각 · 운석 =====
  const OLO='#1a1640',floor=(i,v)=>{R(i,0,0,16,16,'#4a4684');const r=mulberry(v*71+19);for(let k=0;k<9;k++)R(i,Math.floor(r()*15),Math.floor(r()*15),1,1,k%3?'#5c58a0':'#3a366c');
   R(i,0,7,16,1,'#3e3a78');R(i,0,15,16,1,'#3e3a78');R(i,(v*3+6)%16,0,1,7,'#3e3a78');R(i,(v*5+3)%16,8,1,7,'#3e3a78');
   R(i,Math.floor(r()*14),Math.floor(r()*14),1,1,'#fff4a0');if(v===1){const x=2+Math.floor(r()*11),y=2+Math.floor(r()*11);R(i,x,y,1,3,'#cfc8ff');R(i,x-1,y+1,3,1,'#cfc8ff');}};
  for(let v=0;v<3;v++)floor(v,v);
  for(let v=0;v<2;v++){const i=3+v;R(i,0,0,16,16,'#e8e0f8');const r=mulberry(v*43+7);for(let k=0;k<9;k++)R(i,Math.floor(r()*15),Math.floor(r()*15),1,1,k%2?'#f8f4ff':'#d0c8ea');
   R(i,0,7,16,1,'#c8c0e0');R(i,7,0,1,16,'#c8c0e0');
   if(v){R(i,7,5,2,6,'#e0b43a');R(i,5,7,6,2,'#e0b43a');R(i,7,7,2,2,'#fff0a0');}}
  for(let f=0;f<2;f++){const i=5+f;floor(i,f+1);const s2=f?1:0;
   for(const bx of [0,5,10]){R(i,bx+s2,5,4,8,'#6a60e0');R(i,bx+s2+1,3,2,3,'#8a80ff');R(i,bx+s2+1,2,1,1,'#d8f0ff');R(i,bx+s2,10,4,3,'#4a40b0');R(i,bx+s2+3,6,1,6,'#4a40b0');R(i,bx+s2,5,1,6,'#a8a0ff');}
   R(i,0,13,16,3,'#3a366c');R(i,f?4:11,6,1,1,'#fff4a0');R(i,f?12:2,9,1,1,'#d8f0ff');}
  { const i=7;floor(i,1);R(i,3,14,10,2,'rgba(0,0,0,.35)');R(i,2,8,12,7,OLO);R(i,3,9,10,6,'#d8d0f0');R(i,3,9,10,1,'#f4f0ff');R(i,3,12,10,1,'#b8b0d8');R(i,6,11,4,4,OLO);R(i,7,12,2,3,'#8a80ff');
   R(i,3,2,10,7,OLO);R(i,4,3,8,6,'#f4f0ff');R(i,5,2,6,1,'#f4f0ff');R(i,4,3,2,5,'#ffffff');R(i,10,4,2,5,'#c8c0e8');R(i,7,2,2,7,OLO);R(i,7,3,1,5,'#2a2a5a');R(i,8,3,1,5,'#4a46a0');R(i,3,8,10,1,'#e0b43a');}
  { const i=22;floor(i,2);R(i,3,14,10,2,'rgba(0,0,0,.35)');const rows=[[7,9],[6,10],[6,10],[5,11],[5,11],[5,11],[4,12],[4,12],[3,13]];
   rows.forEach((r,k)=>R(i,r[0]-1,2+k,r[1]-r[0]+2,1,OLO));rows.forEach((r,k)=>R(i,r[0],2+k,r[1]-r[0],1,'#7a6ae8'));rows.forEach((r,k)=>R(i,r[0],2+k,2,1,'#b8a8ff'));rows.forEach((r,k)=>R(i,r[1]-2,2+k,2,1,'#5a4ac0'));
   R(i,7,4,1,4,'#e8e0ff');R(i,3,11,10,1,OLO);R(i,3,12,10,2,'#2e2a5c');R(i,5,12,6,1,'#ffe45a');}
  const bolt=(i,pts,col)=>{for(let k=0;k<pts.length-1;k++){let [x0,y0]=pts[k];const [x1,y1]=pts[k+1],dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx-dy;for(;;){R(i,x0,y0,1,1,col);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>-dy){e-=dy;x0+=sx;}if(e2<dx){e+=dx;y0+=sy;}}}};
  for(let f=0;f<2;f++){const i=8+f;R(i,0,0,16,16,'#1c2050');const r=mulberry(f*29+3);for(let k=0;k<12;k++)R(i,Math.floor(r()*15),Math.floor(r()*15),1,1,k%2?'#2c3478':'#10143a');R(i,0,7,16,1,'#262c68');R(i,7,0,1,16,'#262c68');
   const A=f?[[0,10],[4,8],[7,12],[11,7],[15,9]]:[[0,5],[4,7],[7,3],[11,8],[15,5]],B=f?[[2,0],[5,3],[3,6],[7,9]]:[[9,15],[11,12],[8,10],[12,8]];
   bolt(i,A,'#7ae0ff');bolt(i,A.map(a=>[a[0],a[1]-1]),'#ffe45a');R(i,f?7:7,f?12:3,2,1,'#fffbd0');bolt(i,B,'#7ae0ff');}
  for(let f=0;f<2;f++){const i=10+f;floor(i,f+1);
   [[3,9,0],[10,6,1],[7,12,2]].forEach((a,k)=>{const col=['#ffe45a','#fff4a0','#ffd0f0'][k],sz=(k===f?3:2);R(i,a[0],a[1]-sz+1,1,sz*2-1,col);R(i,a[0]-sz+1,a[1],sz*2-1,1,col);R(i,a[0],a[1],1,1,'#ffffff');});}
  { const i=12;floor(i,2);const rows=[[4,12],[2,14],[1,15],[1,15],[1,15],[2,14],[3,13]];
   rows.forEach((r,y)=>R(i,r[0],4+y,r[1]-r[0],1,OLO));rows.forEach((r,y)=>{if(y>0&&y<6)R(i,r[0]+1,4+y,r[1]-r[0]-2,1,'#3a3258');});
   R(i,4,6,3,1,'#6a5e98');R(i,3,7,2,1,'#6a5e98');R(i,8,9,5,2,'#2a2444');R(i,6,7,1,3,'#ffb84a');R(i,7,9,2,1,'#ffb84a');R(i,10,6,1,2,'#ffe45a');R(i,5,10,3,1,'#2a2444');}
  { const i=26;R(i,0,0,16,16,'#6a5ac8');R(i,0,0,8,8,'#7a6ae0');R(i,8,8,8,8,'#7a6ae0');R(i,0,0,16,1,'#a89cff');R(i,0,15,16,1,'#4a3aa0');R(i,15,0,1,16,'#4a3aa0');R(i,3,3,1,1,'#fff4a0');R(i,11,10,1,1,'#fff4a0');R(i,10,4,1,1,'#d8f0ff');} // 별빛 발판(은하수 위 바닥)
  { const i=25;floor(i,1);R(i,3,11,10,5,OLO);R(i,4,12,8,3,'#2e2a5c');R(i,4,12,8,1,'#5c58a0');} // 망원경 받침
 }
 if(th.night){ // ===== 밤 타일: 멈춘 어둠 땅 · 시계 길 · 그림자 갈대 · 독 덩굴 나무/시계탑 · 멈춘 호수 · 별 조각 · 거미줄 고치 =====
  const OLN='#0a1218',gnd=(i,v)=>{R(i,0,0,16,16,'#1e3238');const r=mulberry(v*59+17);for(let k=0;k<9;k++)R(i,Math.floor(r()*15),Math.floor(r()*15),1,1,k%3?'#2a444a':'#142428');
   R(i,Math.floor(r()*14),Math.floor(r()*14),1,1,'#8ad0e0');const x=1+Math.floor(r()*9),y=2+Math.floor(r()*10);R(i,x,y,4,1,'#142428');R(i,x+3,y+1,1,2,'#142428');
   if(v===1){const mx=2+Math.floor(r()*11),my=2+Math.floor(r()*11);R(i,mx,my-1,1,3,'#5a8a9a');R(i,mx-1,my,3,1,'#5a8a9a');}};
  for(let v=0;v<3;v++)gnd(v,v);
  for(let v=0;v<2;v++){const i=3+v;R(i,0,0,16,16,'#7c8aa4');const r=mulberry(v*47+9);for(let k=0;k<9;k++)R(i,Math.floor(r()*15),Math.floor(r()*15),1,1,k%2?'#8e9cb6':'#6a7890');
   R(i,0,7,16,1,'#5e6c84');R(i,7,0,1,16,'#5e6c84');
   if(v){R(i,7,2,2,3,'#ff4a5a');R(i,7,11,2,3,'#ff4a5a');R(i,2,7,3,2,'#ff4a5a');R(i,11,7,3,2,'#ff4a5a');R(i,7,7,2,2,'#ff9aa4');}}
  for(let f=0;f<2;f++){const i=5+f;gnd(i,f+1);const s2=f?1:0;
   for(const bx of [0,5,10]){R(i,bx+s2,5,4,8,'#2e8a78');R(i,bx+s2+1,3,2,3,'#4acfb0');R(i,bx+s2+1,2,1,1,'#d8fff4');R(i,bx+s2,10,4,3,'#1c5a52');R(i,bx+s2+3,6,1,6,'#1c5a52');R(i,bx+s2,5,1,6,'#6ae8c8');}
   R(i,0,13,16,3,'#142428');R(i,f?3:12,8,1,1,'#8ad0e0');}
  { const i=7;gnd(i,1);R(i,3,14,10,2,'rgba(0,0,0,.4)');R(i,6,11,4,5,OLN);R(i,7,11,2,5,'#3a2050');R(i,7,11,1,5,'#6a3a88');R(i,5,13,1,1,'#ff6ac8');R(i,10,12,1,1,'#ff6ac8');
   const rows=[[5,11],[3,13],[2,14],[1,15],[1,15],[0,16],[0,16],[1,15],[1,15],[2,14],[3,13],[5,11]];
   rows.forEach((r,y)=>R(i,r[0],y,r[1]-r[0],1,OLN));rows.forEach((r,y)=>{if(y>0&&y<11)R(i,r[0]+1,y,r[1]-r[0]-2,1,'#3a2058');});
   R(i,4,2,4,2,'#7a3aa8');R(i,3,4,2,2,'#7a3aa8');R(i,8,3,3,1,'#7a3aa8');R(i,10,7,4,3,'#241238');R(i,3,9,5,1,'#241238');
   [[0,5],[15,8],[2,1],[13,2],[1,9],[14,10]].forEach(a=>R(i,a[0],a[1],1,1,'#ff6ac8'));R(i,5,11,1,2,'#9af06a');R(i,10,11,1,3,'#9af06a');R(i,10,14,1,1,'#9af06a');}
  { const i=22;gnd(i,2);R(i,3,14,10,2,'rgba(0,0,0,.4)');R(i,3,12,10,4,OLN);R(i,4,13,8,2,'#3e4a60');R(i,4,0,8,13,OLN);R(i,5,1,6,12,'#5e6c84');R(i,5,1,2,12,'#8a98b4');R(i,9,1,2,12,'#46526c');
   R(i,5,3,6,6,OLN);R(i,6,4,4,4,'#ff4a5a');R(i,6,4,4,4,'#ff4a5a');R(i,7,5,2,2,'#1a1630');R(i,8,4,1,3,'#ffd0d0');R(i,8,6,2,1,'#ffd0d0');}
  // 얼어붙은 호수: 움직이지 않는 두 가지 얼음 무늬 (물결·반짝임 애니메이션 없음) — 푸른 얼음 · 금 간 틈 · 서리 반짝이
  for(let f=0;f<2;f++){const i=8+f;R(i,0,0,16,16,'#a2d8ee');const r=mulberry(f*23+5);
   for(let k=0;k<10;k++)R(i,Math.floor(r()*15),Math.floor(r()*15),2,1,k%2?'#c4ecf9':'#86c0de'); // 얼음 결
   R(i,1+f*6,2,5,1,'#d8f4fc');R(i,8-f*5,12,6,1,'#d8f4fc');R(i,3+f*4,7,3,1,'#bfe6f6'); // 매끈한 윗면 빛
   const CR=f?[[13,1],[10,5],[9,8],[5,10],[3,14]]:[[3,9],[6,11],[9,12]],BR=f?[[9,8],[12,11],[13,14]]:[]; // 0번: 매끈한 얼음(잔금만) · 1번: 크게 금 간 얼음(드문드문)
   const L=(pts,col,dx)=>{for(let q=0;q<pts.length-1;q++){const a=pts[q],b=pts[q+1],n=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));for(let u=0;u<=n;u++){const x=Math.round(a[0]+(b[0]-a[0])*u/n)+dx,y=Math.round(a[1]+(b[1]-a[1])*u/n);if(x>=0&&x<16)R(i,x,y,1,1,col);}}};
   L(CR,'#eefcff',1);L(BR,'#eefcff',1);L(CR,'#5a98c2',0);L(BR,'#6aa6ce',0); // 금: 흰 서리 + 푸른 틈
   R(i,f?3:12,f?4:11,1,1,'#ffffff');R(i,f?12:3,f?13:5,1,1,'#ffffff');R(i,f?11:4,f?3:12,1,3,'#e8fbff');R(i,f?10:3,f?4:13,3,1,'#e8fbff');} // 서리 반짝이(움직이지 않아요)
  for(let f=0;f<2;f++){const i=10+f;gnd(i,f+1);
   [[3,9,0],[10,6,1],[7,12,2]].forEach((a,k)=>{const sz=(k===f?2:1);R(i,a[0],a[1]-sz,1,sz*2+1,'#d8f0ff');R(i,a[0]-sz,a[1],sz*2+1,1,'#d8f0ff');R(i,a[0],a[1],1,1,'#ff6a7a');});}
  { const i=12;gnd(i,2);const rows=[[4,12],[2,14],[1,15],[1,15],[1,15],[2,14],[3,13]];
   rows.forEach((r,y)=>R(i,r[0],4+y,r[1]-r[0],1,'#5a6a7a'));rows.forEach((r,y)=>{if(y>0&&y<6)R(i,r[0]+1,4+y,r[1]-r[0]-2,1,'#e8eef4');});
   R(i,4,6,3,1,'#ffffff');R(i,3,7,2,1,'#ffffff');R(i,8,9,5,2,'#b8c4d4');R(i,5,10,3,1,'#b8c4d4');
   for(let k=0;k<4;k++){R(i,3+k*3,5+Math.floor(k/2),1,5,'#c8d4e0');}R(i,2,8,12,1,'#c8d4e0');R(i,0,10,3,1,'#c8d4e0');R(i,13,6,3,1,'#c8d4e0');R(i,1,12,2,1,'#c8d4e0');}
  { const i=26;R(i,0,0,16,16,'#2e2a48');R(i,0,0,8,8,'#38325a');R(i,8,8,8,8,'#38325a');R(i,0,0,16,1,'#5a4a88');R(i,0,15,16,1,'#1a1630');R(i,15,0,1,16,'#1a1630');R(i,7,6,2,4,'#a878ff');R(i,6,7,4,2,'#a878ff');R(i,7,7,2,2,'#e8d8ff');} // 혼령의 제단 바닥
  { const i=25;gnd(i,1);R(i,4,12,8,4,OLN);R(i,5,12,6,3,'#3e4a60');R(i,5,12,6,1,'#5e6c84');} // 시계 받침
 }
 return c;
}

// ---------- 맵 만들기: 길(T자) + 끝에서 기다리는 분기점 ----------
function genMap(run,rv){
 const RVON=rv!=null,STP=RVON?(rv|0):(run.step|0); // rv: 지난 단계로 돌아온 길 (같은 모양의 맵을 만들고 분기점만 지워요)
 let nodes=run.opts||[];if(RVON){const sn=(run.snap||{})[(run.floor||1)+':'+STP];nodes=(sn&&sn.length)?sn:[{t:(run.hist&&run.hist[STP])||'normal'}];}
 const boss=!RVON&&nodes.length>0&&nodes[0].t==='boss',th=TH[run.bg]||TH[0],BCLR=boss&&run.bclr===(run.floor||1); // BCLR: 보스를 쓰러뜨린 뒤 같은 맵에 머무는 중 (보스 자리 뒤에 계단이 생겨요)
 const W=24,H=boss?20:22,rng=mulberry(((run.id|0)^Math.imul(run.floor||1,7919)^Math.imul(STP+3,104729))),
  t=new Uint8Array(W*H),path=new Uint8Array(W*H),ents=[],decor=[];
 const sx=12,sy=H-4,mark=(x,y)=>{if(x>=0&&y>=0&&x<W&&y<H)path[y*W+x]=1;};
 const hl=(a,b,y)=>{for(let x=Math.min(a,b);x<=Math.max(a,b);x++)mark(x,y);};
 const vl=(x,a,b)=>{for(let y=Math.min(a,b);y<=Math.max(a,b);y++)mark(x,y);};
 const n=nodes.length,CLR=!RVON&&!boss&&run.clr===(run.floor||1)+':'+STP; // CLR: 이 단계의 분기점을 끝내고 같은 자리에 머무는 중
 if(boss){vl(sx,5,sy);ents.push({k:'node',i:0,x:sx,y:4,dir:0});}
 else{
  const yR=H-8,xs=[];
  for(let i=0;i<n;i++){const nx=n===1?sx:Math.round(4+i*(W-9)/(n-1));xs.push(nx);}
  vl(sx,yR,sy);hl(Math.min(sx,...xs),Math.max(sx,...xs),yR);
  nodes.forEach((nd,i)=>{const ny=4+((i%2)*3)+Math.floor(rng()*2);vl(xs[i],ny,yR);ents.push({k:'node',i,x:xs[i],y:ny,dir:0});});
 }
 mark(sx,sy);
 const near=new Uint8Array(W*H);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(path[y*W+x])for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const a=x+dx,b=y+dy;if(a>=0&&b>=0&&a<W&&b<H)near[b*W+a]=1;}
 // 연못 (길에서 떨어진 곳)
 const ponds=th.ponds||1;
 for(let pn=0;pn<ponds;pn++){for(let tries=0;tries<30;tries++){
  const cx=3+Math.floor(rng()*(W-6)),cy=H-7+Math.floor(rng()*4),rx=2+rng()*1.2,ry=1.6+rng()*.8;let ok=true;const cells=[];
  for(let y=Math.floor(cy-ry)-1;y<=Math.ceil(cy+ry)+1&&ok;y++)for(let x=Math.floor(cx-rx)-1;x<=Math.ceil(cx+rx)+1;x++){
   if(x<3||y<3||x>=W-3||y>=H-3){ok=false;break;}
   const d=th.city?Math.max(Math.abs(x-cx)/rx,Math.abs(y-cy)/ry)**2:((x-cx)/rx)**2+((y-cy)/ry)**2;
   if(d<=1){if(near[y*W+x]){ok=false;break;}cells.push(y*W+x);}
   else if(d<=1.9&&near[y*W+x]===1&&path[y*W+x]){ok=false;break;}}
  if(ok&&cells.length>=5){cells.forEach(i=>t[i]=TL.WATER);break;}}}
 const s1=Math.floor(rng()*9999),s2=Math.floor(rng()*9999);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;
  if((th.coast||th.volc||th.obs||th.night)&&!boss&&y<3){t[i]=TL.WATER;continue;}
  if(x<2||y<2||x>=W-2||y>=H-2){t[i]=TL.TREE;continue;}
  if(path[i]){t[i]=TL.PATH;continue;}
  if(t[i]===TL.WATER)continue;
  const n1=vnoise(x*.32,y*.32,s1),n2=vnoise(x*.45+40,y*.45,s2),r=rng();
  if(!near[i]&&(n2>.70||(y<4&&n2>.55))){t[i]=TL.TREE;continue;}
  if(n1>.70){t[i]=TL.TALL;continue;}
  if(!near[i]&&r<.012){t[i]=TL.ROCK;continue;}
  if(r<.07)t[i]=TL.FLOWER;}
  if(boss){ // 왕의 전당: 대리석 바닥 · 붉은 카펫 · 두 줄 기둥 · 타오르는 화로 · 맨 안쪽 단상 위에서 보스가 기다려요
  for(let y=5;y<=13;y++)for(let x=sx-3;x<=sx+3;x++)t[y*W+x]=TL.MARBLE;
  for(let x=sx-3;x<=sx+3;x++)t[4*W+x]=TL.DAIS;
  for(let y=4;y<=13;y++)t[y*W+sx]=TL.CARPET;
  [6,8,10,12].forEach(y=>[sx-3,sx+3].forEach(x=>{t[y*W+x]=TL.MBLK;decor.push({k:'pil',x,y});}));
  [sx-2,sx+2].forEach(x=>{t[5*W+x]=TL.MBLK;decor.push({k:'brz',x,y:5});});
 }
 // 표지판 (출발 지점 옆)
 const sgx=sx+2,sgy=sy-1;t[sgy*W+sgx]=TL.GRASS;ents.push({k:'sign',x:sgx,y:sgy});
 [[sx,sy],[sx+1,sy],[sx+1,sy-1],[sx-1,sy],[sx,sy-1],[sx,sy+1]].forEach(a=>{const i=a[1]*W+a[0];if(BLOCK.has(t[i]))t[i]=TL.GRASS;});
 ents.filter(e=>e.k==='node').forEach(e=>{const i=e.y*W+e.x;if(t[i]!==TL.CARPET)t[i]=TL.PATH;});
 // 야생 포켓몬(일반·정예): 긴 풀숲 위에 서 있고, 풀은 포켓몬 앞까지 이어져요 (발은 풀이 가려요)
 nodes.forEach((nd,i)=>{if(nd.t!=='normal'&&nd.t!=='elite')return;const e=ents.find(q=>q.k==='node'&&q.i===i);if(!e)return;
  for(let y=e.y-2;y<=e.y+2;y++)for(let x=e.x-3;x<=e.x+3;x++){if(x<2||y<2||x>=W-2||y>=H-2)continue;const k=y*W+x,d=((x-e.x)/2.8)**2+((y-e.y-.5)/2.4)**2;
   if(d>1||(path[k]&&!(x===e.x&&y===e.y))||ents.some(q=>q!==e&&q.x===x&&q.y===y))continue;if(t[k]===TL.GRASS||t[k]===TL.FLOWER||t[k]===TL.TALL||t[k]===TL.PATH)t[k]=TL.TALL;}
  t[e.y*W+e.x]=TL.TALL;if(!ents.some(q=>q.x===e.x&&q.y===e.y+1))t[(e.y+1)*W+e.x]=TL.TALL;}); 
 // 건물 터: 분기점 바로 뒤(위쪽)에 건물이 서 있어서 그 자리는 지나갈 수 없어요 (체육관 5×3 · 나머지 3×2칸)
 nodes.forEach((nd,i)=>{const bk=bkey(nd);if(!bk)return;const e=ents.find(q=>q.k==='node'&&q.i===i);if(!e)return;const B=BLD[bk];
  for(let y=e.y-B.fy;y<=e.y-1;y++)for(let x=e.x-B.fx;x<=e.x+B.fx;x++){if(x<1||y<1||x>=W-1||y>=H-1||path[y*W+x]||ents.some(q=>q.x===x&&q.y===y))continue;t[y*W+x]=TL.GYM;}});
 // 모험 느낌: 출발점 아래쪽 샛길 끝에 유물 상자 · 포켓몬 도감, 오른쪽에 상자 하나 더 (말을 걸면 유물 목록 / 내 덱을 볼 수 있어요)
 {const clr=(cx,cy)=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=cx+dx,y=cy+dy;if(x<2||y<2||x>=W-2||y>=H-2)continue;const k=y*W+x;if(t[k]===TL.TREE||t[k]===TL.WATER||t[k]===TL.ROCK)t[k]=TL.GRASS;}};
  for(let x=6;x<=17;x++){const k=sy*W+x;if(t[k]!==TL.CARPET)t[k]=TL.PATH;}
  [[5,sy,'chest'],[18,sy,'dex']].forEach(a=>{clr(a[0],a[1]);t[a[1]*W+a[0]]=TL.GRASS;ents.push({k:a[2],x:a[0],y:a[1],dir:0,i:-1});});}
 if((th.city||th.coast||th.volc||th.obs||th.night)&&!boss){ // 길가 가로등(도시) · 파라솔(해안): 길 바로 옆 풀자리(=보도)에 간격을 두고 세워요
  const lamps=[];
  for(let y=3;y<H-3;y++)for(let x=3;x<W-3;x++){const i=y*W+x;if(t[i]!==TL.GRASS&&t[i]!==TL.FLOWER)continue;if(path[i])continue;
   if(!(path[i-1]||path[i+1]||path[i-W]||path[i+W]))continue;if((x*5+y*3+((run.id|0)&7))%7!==0)continue;
   if(ents.some(q=>Math.abs(q.x-x)<=2&&Math.abs(q.y-y)<=2))continue;if(lamps.some(a=>Math.abs(a[0]-x)<4&&Math.abs(a[1]-y)<4))continue;
   lamps.push([x,y]);}
  lamps.forEach(a=>{t[a[1]*W+a[0]]=TL.LAMP;decor.push({k:th.city?'lamp':th.coast?'umb':th.volc?'torch':th.night?'clock':'scope',x:a[0],y:a[1]});});
 }
 // 숨겨진 보물상자 (안내 없음) — 갈림길마다 하나. 60% 그냥 갈 수 있는 곳 / 10%씩 물 건너 · 베어 낼 나무 뒤 · 부술 바위 뒤 · 구름 위
 // (지역마다 정해진 타입의 포켓몬이 덱에 있어야 길을 열 수 있어요: 물·불꽃·전기 / 강철·격투·풀·노말·땅·악·바위·드래곤 / 비행·에스퍼). 갈림길마다 한 번씩 열 수 있어요
 {const hcDone=!!(run.hcOpen&&run.hcOpen[(run.floor||1)+':'+STP]); // 이미 연 상자도 같은 자리에 빈 상자로 다시 놓아요 (맵을 다시 만들어도 남아 있게)
  const rr=rng(),loc=rr<.2?'':rr<.4?'water':rr<.6?'tree':rr<.8?'rock':'cloud';
  // 후보 자리: 길(분기점·길가 물건 포함)에서 멀리 떨어진 구석일수록 높은 점수 (+ 약간의 무작위)
  const near=[];for(let k=0;k<W*H;k++)if(path[k])near.push([k%W,(k/W)|0]);ents.forEach(q=>near.push([q.x,q.y]));
  const base=[];for(let x=3;x<=W-4;x++)for(let y=4;y<=H-5;y++){let dp=99;for(const q of near)dp=Math.min(dp,Math.max(Math.abs(q[0]-x),Math.abs(q[1]-y)));base.push([x,y,dp*3+Math.hypot(x-sx,y-sy)*.5+rng()*4]);}
  base.sort((a,b)=>b[2]-a[2]);
  const cost=(k,bad)=>{if(bad&&bad.has(k))return -1;const v=t[k];if(ents.some(q=>q.y*W+q.x===k))return -1;if(v===TL.TREE||v===TL.WATER||v===TL.ROCK)return 1;if(v===TL.GRASS||v===TL.FLOWER||v===TL.TALL||v===TL.PATH)return 0;return -1;};
  // 가장 가까운 길까지 막힌 곳(나무·물·바위)을 최소한만 풀어서 걸어갈 수 있게 해요 (0-1 BFS). 먼저 찾아만 보고, 가능할 때만 실제로 길을 터요
  const search=(k0,bad,self)=>{const dist=new Int16Array(W*H).fill(9999),par=new Int16Array(W*H).fill(-1),dq=[k0];dist[k0]=0;
   while(dq.length){let bi=0;for(let i=1;i<dq.length;i++)if(dist[dq[i]]<dist[dq[bi]])bi=i;const k=dq.splice(bi,1)[0];
    if(path[k]&&(self||k!==k0))return{goal:k,par};
    const kx=k%W,ky=(k/W)|0;
    for(const[ax,ay]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=kx+ax,ny=ky+ay;if(nx<2||ny<2||nx>=W-2||ny>=H-2)continue;const nk=ny*W+nx,cc=cost(nk,bad);if(cc<0)continue;const nd=dist[k]+cc;if(nd<dist[nk]){dist[nk]=nd;par[nk]=k;if(!dq.includes(nk))dq.push(nk);}}}
   return null;};
  const dig=r=>{for(let k=r.goal;k>=0;k=r.par[k]){const v=t[k];if(v===TL.TREE||v===TL.WATER||v===TL.ROCK)t[k]=TL.GRASS;}};
  let placed=false;
  if(loc){ // 막힌 곳 뒤: 상자를 물·나무·바위·구름 울타리 안에 두고 길 쪽을 '문'으로 막아요. 물·구름은 3칸 넓이라 포켓몬을 타고 건너요
   const ride=loc==='water'||loc==='cloud',RT={water:TL.WATER,tree:TL.TREE,rock:TL.ROCK,cloud:TL.CLOUD}[loc],OKT=new Set([TL.GRASS,TL.FLOWER,TL.TALL,TL.TREE,TL.WATER,TL.ROCK]);
   const cand=loc==='cloud'?base.filter(b=>b[1]<=6).concat(base.filter(b=>b[1]>6).sort((a,b)=>a[1]-b[1])):base,ex=ride?5:3; // 구름은 맵 상단(위쪽 줄)에 먼저 놓고, 자리가 없을 때만 가까운 아래쪽으로
   for(let c=0;c<cand.length*2&&!placed;c++){const hx=cand[c>>1][0],hy=cand[c>>1][1],dir=((c&1)?-1:1)*(hx<W/2?1:-1),apx=hx+dir*ex;
    if(apx<2||apx>=W-2||ents.some(q=>Math.abs(q.y-hy)<=3&&(dir>0?(q.x>=hx-3&&q.x<=apx+1):(q.x<=hx+3&&q.x>=apx-1))))continue;
    const ring=[],inner=[],lake=[];let ok=true;
    for(let dy=-2;dy<=2&&ok;dy++)for(let dx=-2;dx<=2;dx++){const x=hx+dx,y=hy+dy,k=y*W+x;if(x<1||y<1||x>=W-1||y>=H-1||path[k]||!OKT.has(t[k])){ok=false;break;}(Math.max(Math.abs(dx),Math.abs(dy))===2?ring:inner).push(k);}
    if(ride&&ok)for(let dy=-2;dy<=2&&ok;dy++)for(let i=3;i<=4;i++){const x=hx+dir*i,y=hy+dy,k=y*W+x;if(x<1||x>=W-1||path[k]||!OKT.has(t[k])){ok=false;break;}lake.push(k);}
    if(!ok)continue;
    const bad=new Set(ring.concat(inner,lake)),r=search(hy*W+apx,bad,true);
    if(!r)continue;
    if(loc==='cloud'){for(let dy=-2;dy<=2;dy++)for(let u=-2;u<=4;u++){const k=(hy+dy)*W+hx+dir*u,ay=Math.abs(dy);if(ay<=1&&u>=-1&&u<=1){t[k]=TL.CLOUDF;continue;}const must=(ay<=1&&(u===-2||u===2))||(ay===2&&u>=-1&&u<=1)||(dy===0&&u>=2&&u<=4),corner=ay===2&&(u===-2||u===2||u===4);if(must||((th.city||th.obs||th.night||th.volc)&&!corner)||rng()<(corner?.25:.7))t[k]=TL.CLOUD;}}else{inner.forEach(k=>t[k]=TL.GRASS);ring.concat(lake).forEach(k=>t[k]=RT);}if(!ride)t[hy*W+hx+dir*2]=TL.GRASS;dig(r);
    if(ride)ents.push({k:'gate',g:loc,x:hx+dir*4,y:hy,dir,rd:dir,ride:1,out:1},{k:'gate',g:loc,x:hx+dir*2,y:hy,dir,rd:dir,ride:1,out:0});
    else ents.push({k:'gate',g:loc,x:hx+dir*2,y:hy,dir});
    ents.push({k:'chest',h:1,x:hx,y:hy,dir:0,i:-1,done:hcDone?1:0,emp:hcDone?1:0});placed=true;}}
  for(let c=0;c<base.length&&!placed;c++){const hx=base[c][0],hy=base[c][1];
   if(ents.some(q=>Math.abs(q.x-hx)<=2&&Math.abs(q.y-hy)<=2))continue;
   const r=search(hy*W+hx,null,false);if(!r)continue;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=hx+dx,y=hy+dy,k=y*W+x;if(x<2||y<2||x>=W-2||y>=H-2)continue;if(t[k]===TL.TREE||t[k]===TL.WATER||t[k]===TL.ROCK)t[k]=TL.GRASS;}
   t[hy*W+hx]=TL.GRASS;dig(r);ents.push({k:'chest',h:1,x:hx,y:hy,dir:0,i:-1,done:hcDone?1:0,emp:hcDone?1:0});placed=true;}}
 if(BCLR){ // 보스를 이긴 뒤: 보스 맵을 그대로 만들고(상자 자리 등이 같게) 마지막에 보스 자리를 비우고 바로 뒤(위)에 계단을 놓아요
  const ni=ents.findIndex(q=>q.k==='node');if(ni>=0)ents.splice(ni,1);
  for(let x=sx-1;x<=sx+1;x++)if(t[3*W+x]!==TL.CARPET)t[3*W+x]=TL.MARBLE;
  ents.push({k:'stairs',x:sx,y:3,dir:0,i:-1});}
 if(RVON||CLR){ // 지난 길: 분기점은 모두 사라지고 상자만 남아요(가운데 포탈은 현재 단계로) / 분기점을 끝낸 뒤: 분기점이 전부 포탈로 바뀌고 가운데에도 포탈이 생겨요(다음 단계로)
  if(RVON){for(let i=ents.length-1;i>=0;i--)if(ents[i].k==='node')ents.splice(i,1);
   for(let k=0;k<W*H;k++)if(t[k]===TL.GYM)t[k]=TL.GRASS;}
  else ents.forEach(q=>{if(q.k==='node'){q.k='portal';q.nx=1;q.i=-1;}});
  const blocked=k=>BLOCK.has(t[k])||ents.some(q=>q.y*W+q.x===k),seen=new Uint8Array(W*H),qq=[sy*W+sx];seen[qq[0]]=1;
  for(let qi=0;qi<qq.length;qi++){const k=qq[qi],kx=k%W,ky=(k/W)|0;for(const[ax,ay]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=kx+ax,ny=ky+ay;if(nx<1||ny<1||nx>=W-1||ny>=H-1)continue;const nk=ny*W+nx;if(seen[nk]||blocked(nk))continue;seen[nk]=1;qq.push(nk);}}
  const cx=W>>1,cy=H>>1,cands=qq.map(k=>[k%W,(k/W)|0]).filter(a=>!ents.some(q=>Math.abs(q.x-a[0])<=1&&Math.abs(q.y-a[1])<=1)&&t[a[1]*W+a[0]]!==TL.TALL).sort((a,b)=>(Math.abs(a[0]-cx)+Math.abs(a[1]-cy))-(Math.abs(b[0]-cx)+Math.abs(b[1]-cy)));
  if(RVON){const pc=cands[0]||[sx,sy-3];t[pc[1]*W+pc[0]]=TL.PATH;ents.push({k:'portal',x:pc[0],y:pc[1],dir:0,i:-1,nx:0});}} // 가운데 포탈은 '지난 길'에서만 있어요(돌아갈 길이 이것뿐). 분기점을 끝낸 뒤에는 분기점이 바뀐 포탈로만 넘어가요
 return{W,H,t,ents,sx,sy,boss,decor,rv:RVON?STP:null,clr:CLR||BCLR,bclr:BCLR};
}

// ---------- 체육관 건물 (80×64 도트 · 관장 뒤에 서 있어요) ----------
const GYM_CACHE={};
function shadeHex(h,f){const n=parseInt((h||'#aaaaaa').slice(1),16),r=n>>16&255,g=n>>8&255,b=n&255,m=f<1?0:255,k=f<1?1-f:f-1;return'rgb('+Math.round(r+(m-r)*k)+','+Math.round(g+(m-g)*k)+','+Math.round(b+(m-b)*k)+')';}
function gymSheet(col){if(GYM_CACHE[col])return GYM_CACHE[col];
 const c=document.createElement('canvas');c.width=80;c.height=64;const g=c.getContext('2d');
 const R=(x,y,w,h,k)=>{g.fillStyle=k;g.fillRect(x,y,w,h);};
 const OL='#2a2038',roofD=shadeHex(col,.72),roofM=shadeHex(col,.88),roofL=shadeHex(col,1.25),wall='#f1e8d2',wallS='#d8ccae',wallD='#b8ab8a';
 R(6,60,68,4,'rgba(20,20,40,.25)'); // 바닥 그림자
 // 벽
 R(6,22,68,38,OL);R(7,23,66,36,wall);R(7,23,66,2,'#fffaf0');
 for(let y=29;y<52;y+=6)R(7,y,66,1,wallS);for(let y=29,r=0;y<52;y+=6,r++)for(let x=7+(r%2)*6;x<73;x+=12)R(x,y,1,6,wallS);
 R(7,50,66,10,wallD);R(7,50,66,1,OL);for(let x=7;x<73;x+=8)R(x,51,1,9,'#a09374');
 // 기둥
 for(const px of [9,64]){R(px,22,7,38,OL);R(px+1,22,5,37,'#e4dcc4');R(px+1,22,2,37,'#fffaf0');R(px+4,22,2,37,wallD);R(px-1,22,9,3,OL);R(px,23,7,2,wallS);R(px-1,56,9,4,OL);R(px,57,7,2,wallD);}
 // 창문
 for(const wx of [20,54]){R(wx,30,10,12,OL);R(wx+1,31,8,10,'#5a86c8');R(wx+1,31,8,3,'#a8d0ff');R(wx+4,31,1,10,OL);R(wx+1,36,8,1,OL);R(wx+2,32,2,2,'#e8f4ff');R(wx-1,42,12,2,OL);R(wx,42,10,1,wallS);}
 // 지붕: 아래로 갈수록 넓어지는 사다리꼴 + 가로 결
 for(let y=3;y<=21;y++){const ins=Math.max(0,Math.round(14-(y-3)*.8)),x0=2+ins,w=76-ins*2;R(x0-1,y,w+2,1,OL);R(x0,y,w,1,(y%4<2)?roofM:roofD);if(y%4===0)R(x0,y,w,1,roofL);}
 R(0,20,80,3,OL);R(1,20,78,2,col);R(1,20,78,1,roofL);
 for(let x=3;x<77;x+=6)R(x,22,3,1,roofD);
 // 지붕 가운데 문장(엠블럼)
 g.fillStyle=OL;g.beginPath();g.arc(40,11,7.5,0,6.283);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(40,11,6,0,6.283);g.fill();
 g.fillStyle=col;g.beginPath();g.arc(40,11,6,3.1416,6.283);g.fill();R(34,10,12,2,OL);g.fillStyle=OL;g.beginPath();g.arc(40,11,2.6,0,6.283);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(40,11,1.4,0,6.283);g.fill();
 // 지붕 끝 장식
 R(1,2,3,3,OL);R(76,2,3,3,OL);R(2,3,1,1,'#ffe066');R(77,3,1,1,'#ffe066');
 // 깃발
 for(const bx of [27,49]){R(bx,25,4,16,OL);R(bx+1,25,2,14,col);R(bx+1,25,1,14,roofL);R(bx,41,1,1,OL);R(bx+3,41,1,1,OL);R(bx+1,40,2,1,OL);R(bx+1,29,2,2,'#fff');R(bx+1,33,2,1,'#fff');}
 // 문 (아치형 · 겹문) + 계단
 R(32,36,16,24,OL);R(33,37,14,23,shadeHex(col,.55));R(34,35,12,2,OL);R(33,36,14,1,OL);
 R(34,38,6,22,shadeHex(col,.8));R(41,38,6,22,shadeHex(col,.7));R(40,37,1,23,OL);R(34,38,1,22,roofL);
 R(36,42,2,5,'#ffe066');R(43,42,2,5,'#ffe066');R(37,51,3,1,OL);R(42,51,3,1,OL);
 R(28,58,24,2,OL);R(29,58,22,1,'#e4dcc4');R(26,60,28,3,OL);R(27,60,26,2,'#cfc4a4');R(27,60,26,1,'#e4dcc4');
 return GYM_CACHE[col]=c;}
// ---------- 보스 전당: 정면 궁전 · 기둥 · 화로 ----------
let HALL=null;
function hallSheets(){if(HALL)return HALL;
 const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');return[c,g];};
 const OL='#1a1230',gold='#f0c040',goldL='#fff0a0',goldD='#b8862a',wallC='#3b2c68',wallL='#4e3d86',wallD='#2a1e4c',red='#b8283c',redL='#e04058';
 const [fc,g]=mk(144,64),R=(x,y,w,h,k)=>{g.fillStyle=k;g.fillRect(x,y,w,h);},disc=(x,y,r,k)=>{g.fillStyle=k;g.beginPath();g.arc(x,y,r,0,6.283);g.fill();};
 // 벽
 R(0,12,144,52,OL);R(1,13,142,50,wallC);for(let y=17,r=0;y<62;y+=6,r++){R(1,y,142,1,wallD);for(let x=1+(r%2)*8;x<143;x+=16)R(x,y+1,1,5,wallD);}
 R(1,13,142,1,wallL);
 // 지붕 장식띠 + 가운데 삼각 박공
 R(0,9,144,5,OL);R(1,10,142,3,gold);R(1,10,142,1,goldL);R(1,12,142,1,goldD);
 for(let x=3;x<142;x+=8){R(x,6,5,3,OL);R(x+1,7,3,2,wallL);}
 for(let y=0;y<=9;y++){const hw=10+Math.round(y*4.3);R(72-hw-1,y,hw*2+2,1,OL);R(72-hw,y,hw*2,1,y<2?gold:(y%3===0?wallL:wallC));}
 disc(72,6,6,OL);disc(72,6,5,gold);disc(72,6,3.4,'#b8283c');R(70,3,4,1,goldL);R(69,4,1,2,goldL);R(74,4,1,2,goldL);
 // 큰 기둥(벽기둥)
 for(const px of [4,38,96,130]){R(px,13,10,48,OL);R(px+1,13,8,47,'#e8e0f4');R(px+1,13,2,47,'#fff');R(px+6,13,3,47,'#b4a8cc');R(px+4,15,1,43,'#d4cae4');R(px-1,13,12,3,OL);R(px,14,10,2,gold);R(px-1,58,12,5,OL);R(px,59,10,3,gold);R(px,59,10,1,goldL);}
 // 걸린 깃발
 for(const bx of [18,114]){R(bx-1,16,14,2,gold);R(bx,18,12,26,OL);R(bx+1,18,10,24,red);R(bx+1,18,10,2,redL);R(bx+1,18,2,24,redL);
  for(let k=0;k<5;k++){R(bx+1+k*2,42+(k<3?k:4-k)*0+Math.abs(2-k),2,2,OL);}R(bx+1,40,10,3,red);disc(bx+6,28,3.6,OL);disc(bx+6,28,2.8,gold);disc(bx+6,28,1.4,red);R(bx+5,34,2,4,gold);}
 // 큰 아치 문
 g.fillStyle=OL;g.beginPath();g.arc(72,36,19,Math.PI,0);g.fill();R(53,36,38,28,OL);
 g.fillStyle=gold;g.beginPath();g.arc(72,36,17.5,Math.PI,0);g.fill();R(54.5,36,35,28,gold);
 g.fillStyle=OL;g.beginPath();g.arc(72,36,15.5,Math.PI,0);g.fill();R(56.5,36,31,28,OL);
 const gr=g.createLinearGradient(0,20,0,64);gr.addColorStop(0,'#3a0e26');gr.addColorStop(1,'#a8402e');g.fillStyle=gr;g.beginPath();g.arc(72,36,14,Math.PI,0);g.fill();g.fillRect(58,36,28,28);
 R(54,44,1,18,goldD);R(89,44,1,18,goldD);
 // 계단
 R(44,58,56,2,OL);R(45,58,54,1,'#fff');R(40,60,64,4,OL);R(41,60,62,1,'#fff');R(41,61,62,2,'#d8d0ea');R(38,62,68,2,OL);R(39,62,66,1,'#f0eafa');
 // 기둥(독립) 16×32
 const [pc,p]=mk(16,32),PR=(x,y,w,h,k)=>{p.fillStyle=k;p.fillRect(x,y,w,h);};
 PR(1,28,14,4,OL);PR(2,28,12,3,gold);PR(2,28,12,1,goldL);PR(3,6,10,23,OL);PR(4,6,8,22,'#ece4f6');PR(4,6,2,22,'#fff');PR(9,6,3,22,'#b4a8cc');PR(7,8,1,18,'#d4cae4');PR(1,2,14,5,OL);PR(2,3,12,3,gold);PR(2,3,12,1,goldL);PR(3,0,10,3,OL);PR(4,1,8,1,gold);
 // 화로 16×16
 const [bc,b]=mk(16,16),BR=(x,y,w,h,k)=>{b.fillStyle=k;b.fillRect(x,y,w,h);};
 BR(3,13,10,3,OL);BR(4,13,8,2,'#6a5a78');BR(5,7,6,7,OL);BR(6,7,4,6,'#8a7a98');BR(6,7,1,6,'#b4a8c8');BR(2,4,12,4,OL);BR(3,4,10,3,'#c8a038');BR(3,4,10,1,goldL);
 return HALL={fac:fc,pil:pc,brz:bc};}
// ---------- 분기점별 건물·소품 ----------
const BLD={gym:{w:80,h:64,fx:2,fy:3},school:{w:64,h:48,fx:1,fy:2},mart:{w:64,h:48,fx:1,fy:2},shrine:{w:64,h:48,fx:1,fy:2},lab:{w:64,h:48,fx:1,fy:2},fest:{w:64,h:48,fx:1,fy:2}};
function bkey(n){if(!n)return null;switch(n.t){case 'gym':return'gym';case 'trial':return'school';case 'shop':return'mart';case 'relic':return'shrine';case 'event':return n.ev==='lab'?'lab':n.ev==='festival'?'fest':null;}return null;}
const PROPS={altar:[32,32],spring:[32,24],ruins:[24,30],chest:[22,18],chestOpen:[22,26],chestEmpty:[22,26],egg:[24,24],stray:[30,22],evolve:[32,16],thorns:[30,24]};
function pkey(n){return n&&n.t==='event'&&PROPS[n.ev]?n.ev:null;}
const BLD_CACHE={};
function bldSheet(key,n){if(key==='gym'){const G=GYMS[n.gi|0];return gymSheet((G&&G.c)||'#c8b48e');}if(key==='school')return schoolSheet();
 if(BLD_CACHE[key])return BLD_CACHE[key];
 const B=BLD[key],c=document.createElement('canvas');c.width=B.w;c.height=B.h;const g=c.getContext('2d');
 const R=(x,y,w,h,k)=>{g.fillStyle=k;g.fillRect(x,y,w,h);},OL='#2a2038',disc=(x,y,r,k)=>{g.fillStyle=k;g.beginPath();g.arc(x,y,r,0,6.283);g.fill();};
 const roofRows=(y0,y1,ins0,slope,cols)=>{for(let y=y0;y<=y1;y++){const ins=Math.max(0,Math.round(ins0-(y-y0)*slope)),x0=2+ins,w=60-ins*2;R(x0-1,y,w+2,1,OL);R(x0,y,w,1,cols[y%cols.length]);}};
 R(4,44,56,4,'rgba(20,20,40,.25)');
 if(key==='mart'){ // 포켓몬 마트: 파란 지붕 · 간판 · 유리 자동문
  R(6,19,52,26,OL);R(7,20,50,24,'#f4f2ff');R(7,20,50,2,'#fff');R(7,37,50,7,'#3a78d8');R(7,37,50,1,OL);R(7,38,50,1,'#6aa0f0');
  roofRows(10,18,6,.7,['#3a78d8','#6aa0f0','#2a56a8']);R(0,18,64,3,OL);R(1,18,62,2,'#6aa0f0');R(1,19,62,1,'#2a56a8');
  R(15,1,34,12,OL);R(16,2,32,10,'#fff');R(16,2,32,2,'#e8eeff');R(16,10,32,2,'#c8d4f0');
  const gl={M:'10001 11011 10101 10001 10001',A:'01110 10001 11111 10001 10001',R:'11110 10001 11110 10010 10001',T:'11111 00100 00100 00100 00100'};
  let lx=22;for(const ch of 'MART'){gl[ch].split(' ').forEach((row,ry)=>{for(let rx=0;rx<5;rx++)if(row[rx]==='1')R(lx+rx,4+ry,1,1,'#2a56a8');});lx+=6;}
  R(17,5,3,3,OL);disc(18.5,6.5,2,'#e65b66');R(17,6,3,1,OL);
  for(const wx of [10,46]){R(wx,26,8,11,OL);R(wx+1,27,6,9,'#bfe4ff');R(wx+1,27,6,2,'#e4f6ff');R(wx+1,31,6,1,OL);R(wx+1,35,6,1,OL);R(wx+1,29,2,2,'#e65b66');R(wx+4,29,2,2,'#ffd23a');R(wx+1,33,2,2,'#5cc26a');R(wx+4,33,2,2,'#7a9cff');}
  R(25,24,14,5,OL);for(let x=0;x<7;x++)R(26+x*2,25,2,3,x%2?'#fff':'#3a78d8');
  R(25,29,14,16,OL);R(26,30,12,15,'#a8d8f8');R(26,30,12,3,'#e0f4ff');R(32,30,1,15,OL);R(26,40,12,1,'#7ab0d8');R(30,36,1,3,OL);R(34,36,1,3,OL);
  R(22,44,20,2,OL);R(23,44,18,1,'#e4dcc4');R(20,46,24,2,OL);R(21,46,22,1,'#cfc4a4');}
 else if(key==='shrine'){ // 유물 사당: 이끼 낀 돌문 + 빛나는 유물
  const st='#a8a8bc',stL='#d4d4e4',stD='#6e6e88';
  R(16,16,32,28,OL);R(17,17,30,27,'#3c3858');for(let i=0;i<6;i++)R(20+i*5,20+(i%2)*9,2,2,'#e8c850');
  for(const px of [11,46]){R(px,12,8,33,OL);R(px+1,12,6,32,st);R(px+1,12,2,32,stL);R(px+5,12,2,32,stD);R(px-1,40,10,5,OL);R(px,41,8,3,stD);R(px+1,24,3,2,'#6aa84a');R(px+3,34,3,2,'#6aa84a');}
  R(6,6,52,8,OL);R(7,7,50,6,st);R(7,7,50,2,stL);R(7,12,50,1,stD);R(3,3,58,5,OL);R(4,4,56,3,stL);R(4,6,56,1,stD);R(12,13,6,1,'#6aa84a');R(40,13,8,1,'#6aa84a');
  g.save();const gr=g.createRadialGradient(32,29,1,32,29,16);gr.addColorStop(0,'rgba(255,240,150,.95)');gr.addColorStop(.4,'rgba(255,200,60,.5)');gr.addColorStop(1,'rgba(255,200,60,0)');g.fillStyle=gr;g.fillRect(14,12,36,34);g.restore();
  disc(32,29,5.5,OL);disc(32,29,4.5,'#f0c040');disc(31,28,2,'#fff4b0');R(28,35,8,2,OL);R(29,35,6,1,'#c8a030');
  R(18,44,28,2,OL);R(19,44,26,1,stL);R(15,46,34,2,OL);R(16,46,32,1,st);}
 else if(key==='lab'){ // 낡은 연구소: 금속 상자 + 안테나 + 초록 플라스크
  const m='#cfd8e8',mL='#eef3fb',mD='#8c98b4';
  R(6,17,52,28,OL);R(7,18,50,26,m);R(7,18,50,2,mL);R(7,40,50,4,mD);for(let x=8;x<56;x+=10)R(x,22,1,18,mD);
  R(4,12,56,6,OL);R(5,13,54,4,'#8a96b0');R(5,13,54,1,'#b4c0d8');
  R(46,0,2,12,OL);R(46,0,1,12,'#cdd6e8');disc(47,1.5,2.2,OL);disc(47,1.5,1.4,'#ff5a5a');
  g.fillStyle=OL;g.beginPath();g.arc(17,13,9,Math.PI,0);g.fill();g.fillStyle='#8fe6b0';g.beginPath();g.arc(17,13,7.5,Math.PI,0);g.fill();R(10,10,3,2,'#d8ffe8');R(8,13,18,1,OL);
  R(36,6,6,8,OL);R(37,7,4,6,mD);R(38,3,2,4,OL);
  for(const wx of [10,46]){R(wx,24,10,11,OL);R(wx+1,25,8,9,'#2a3a58');R(wx+3,27,4,5,'#7cf0a8');R(wx+2,26,6,1,'#cfffe0');R(wx+4,24,2,2,OL);R(wx-1,35,12,1,OL);}
  R(26,26,12,19,OL);R(27,27,10,18,'#b4bed4');R(31,27,2,18,OL);R(28,29,3,5,'#7ca8e8');R(33,29,3,5,'#7ca8e8');R(29,38,1,2,OL);R(34,38,1,2,OL);
  R(24,20,16,5,OL);R(25,21,14,3,'#fff');disc(32,22.5,1.5,'#46c878');R(30,22,4,1,'#2a8a54');
  R(23,44,18,2,OL);R(24,44,16,1,'#e4dcc4');R(21,46,22,2,OL);R(22,46,20,1,'#cfc4a4');
  disc(54,10,1.4,'#46ff9a');R(56,22,3,16,OL);R(57,22,1,16,'#46c878');}
 else if(key==='fest'){ // 포켓몬 축제: 줄무늬 천막 · 깃발 · 꼬마전구
  R(31,0,1,10,OL);R(32,0,8,5,OL);R(32,1,7,3,'#ffd23a');R(32,1,7,1,'#fff08a');
  for(let y=8;y<=40;y++){const hw=Math.round(4+(y-8)*1.7);for(let x=32-hw;x<32+hw;x++){const stripe=((x+64)>>2)%2===0;R(x,y,1,1,stripe?'#e65b66':'#fff4e8');}R(32-hw-1,y,1,1,OL);R(32+hw,y,1,1,OL);}
  R(2,38,60,2,OL);
  for(let x=2;x<62;x+=6){R(x,40,6,4,OL);R(x+1,40,4,3,((x/6)|0)%2?'#fff4e8':'#e65b66');R(x+1,43,4,1,OL);}
  g.fillStyle=OL;g.beginPath();g.moveTo(24,44);g.lineTo(27,28);g.lineTo(37,28);g.lineTo(40,44);g.fill();g.fillStyle='#4a2a58';g.beginPath();g.moveTo(26,44);g.lineTo(28,30);g.lineTo(36,30);g.lineTo(38,44);g.fill();
  R(27,29,3,15,'#c8404e');R(34,29,3,15,'#c8404e');R(26,28,12,2,OL);
  for(let i=0;i<9;i++){const bx=8+i*6;R(bx,28+Math.round(2*Math.sin(i*1.6)),1,1,OL);disc(bx+.5,31+Math.round(2*Math.sin(i*1.6)),1.6,['#ffd23a','#7ee0ff','#ff9ac8','#9af09a'][i%4]);}
  R(10,44,44,2,'rgba(20,20,40,.25)');R(20,46,24,2,'#d8c9a0');R(21,46,22,1,'#ece0bc');}
 return BLD_CACHE[key]=c;}
// 소품(건물이 아닌 사건): 제단 · 치유의 샘 · 고대 비석 · 보물상자
const PROP_CACHE={};
function propSheet(key){if(PROP_CACHE[key])return PROP_CACHE[key];
 const [w,h]=PROPS[key],c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
 const R=(x,y,w2,h2,k)=>{g.fillStyle=k;g.fillRect(x,y,w2,h2);},OL='#2a2038',disc=(x,y,r,k)=>{g.fillStyle=k;g.beginPath();g.arc(x,y,r,0,6.283);g.fill();};
 if(key==='altar'){R(3,27,26,5,OL);R(4,27,24,4,'#b4b4c8');R(4,27,24,1,'#e0e0ee');R(6,23,20,5,OL);R(7,23,18,4,'#a0a0b8');R(7,23,18,1,'#d4d4e4');R(12,12,8,12,OL);R(13,12,6,11,'#8e8ea8');R(13,12,2,11,'#c4c4d8');R(10,9,12,4,OL);R(11,9,10,3,'#b4b4c8');R(11,9,10,1,'#e0e0ee');R(14,24,4,1,'#e8c850');}
 else if(key==='spring'){R(2,13,28,10,OL);R(3,12,26,9,'#b4b4c8');R(3,12,26,2,'#e0e0ee');g.fillStyle='#4aa0f0';g.beginPath();g.ellipse(16,16,11,4,0,0,6.283);g.fill();g.fillStyle='#9ad4ff';g.beginPath();g.ellipse(16,15,8,2.4,0,0,6.283);g.fill();R(14,3,4,12,OL);R(15,3,2,11,'#bfe4ff');R(12,5,1,1,'#fff');R(19,6,1,1,'#fff');R(11,8,1,1,'#bfe4ff');R(20,9,1,1,'#bfe4ff');R(13,2,6,2,'#e4f6ff');R(2,21,28,3,'rgba(20,20,40,.25)');}
 else if(key==='ruins'){R(4,3,16,26,OL);R(5,4,14,25,'#9a9aae');R(5,4,3,25,'#c4c4d8');R(15,4,4,25,'#6e6e88');R(7,2,10,2,OL);R(8,3,8,1,'#b4b4c8');R(2,26,20,4,OL);R(3,26,18,3,'#8a8a9e');R(7,9,10,1,'#6ae0e0');R(9,9,1,5,'#6ae0e0');R(13,12,4,1,'#6ae0e0');R(8,17,6,1,'#6ae0e0');R(11,17,1,5,'#6ae0e0');R(6,23,3,2,'#6aa84a');R(14,5,4,1,'#6aa84a');}

 else if(key==='chest'||key==='chestOpen'||key==='chestEmpty'){ // 보물상자: 둥근 나무 뚜껑(결) · 금 띠+리벳 · 자물쇠 판 / 열린 상자: 벨벳 안감 뚜껑 + 금화·보석
  const PX={o:'#2a1a24',a:'#6e3f24',b:'#a8693a',c:'#c98b4c',d:'#e8b06a',g:'#ffd23a',h:'#fff3a8',s:'#c89a20',k:'#8a6410',l:'#2a1810',v:'#8a2f45',V:'#b8405c',W:'#5a1c2e'};
  const GD='#ffd23a',GH='#fff0a0',GS='#c89a20';
  const P=(x,y,c)=>{g.fillStyle=PX[c]||c;g.fillRect(x,y,1,1);};
  const mk=rows=>{const m=new Set();rows.forEach(([y,x0,x1])=>{for(let x=x0;x<=x1;x++)m.add(y*64+x);});return m;};
  const edge=(m,x,y)=>!m.has(y*64+x-1)||!m.has(y*64+x+1)||!m.has((y-1)*64+x)||!m.has((y+1)*64+x);
  const paint=(m,fill,maxY)=>{m.forEach(k=>{const x=k%64,y=(k/64)|0;if(maxY!=null&&y>maxY)return;P(x,y,edge(m,x,y)?'o':fill(x,y));});};
  const strap=(y0,y1)=>{for(const bx of [5,15])for(let y=y0;y<=y1;y++){P(bx,y,'g');P(bx+1,y,'s');}};
  const light=(x,c)=>{if(x<=3)return c==='b'?'c':c==='c'?'d':c;if(x>=18)return c==='d'?'c':c==='c'?'b':c==='b'?'a':c;return c;};
  // 앞쪽 몸통 (oy부터 10줄): 금 테두리 · 나뭇결 · 금 띠 · 자물쇠 판
  const body=(oy,locked)=>{
   paint(mk([[oy,1,20],[oy+1,1,20],[oy+2,1,20],[oy+3,1,20],[oy+4,1,20],[oy+5,1,20],[oy+6,1,20],[oy+7,1,20],[oy+8,1,20],[oy+9,2,19]]),(x,y)=>{const r=y-oy;
    if(r===1)return x===2?'h':'g';if(r===2)return 's';if(r===8)return 'l';if(r===7)return 'a';
    let c=r===3?'c':'b';if(x===8||x===13)c='a';return light(x,c);});
   strap(oy+1,oy+8);P(5,oy+4,'k');P(16,oy+4,'k');P(5,oy+1,'h');P(15,oy+1,'h');
   for(let y=oy+1;y<=oy+6;y++)for(let x=9;x<=12;x++)P(x,y,(x===9||x===12||y===oy+1||y===oy+6)?'o':'g');
   P(10,oy+2,'h');P(11,oy+2,'h');P(10,oy+5,'s');P(11,oy+5,'s');
   if(locked){P(10,oy+3,'l');P(11,oy+3,'l');P(10,oy+4,'l');P(11,oy+4,'l');}else{P(10,oy+4,'k');P(11,oy+4,'k');}
  };
  if(key==='chest'){
   paint(mk([[0,5,16],[1,3,18],[2,2,19],[3,1,20],[4,1,20],[5,1,20],[6,1,20],[7,1,20],[8,1,20]]),(x,y)=>light(x,['o','d','c','c','a','b','b','a'][y]||'a'),7);
   strap(2,7);P(5,3,'k');P(16,3,'k');P(5,6,'k');P(16,6,'k');
   P(8,2,'#f6cf94');P(9,2,'#f6cf94');
   body(8,true);
  }else{
   // 뒤로 젖혀진 뚜껑: 나무 틀 + 붉은 벨벳 안감
   paint(mk([[0,5,16],[1,3,18],[2,2,19],[3,2,19],[4,2,19],[5,2,19],[6,2,19],[7,2,19],[8,2,19],[9,2,19],[10,2,19],[11,2,19],[12,2,19],[13,2,19]]),(x,y)=>{
    if(x>=7&&x<=14&&y>=3&&y<=12)return y===3?'V':y>=11?'W':x===7?'W':'v';
    return y===1?'d':y===2?'c':light(x,'b');},12);
   strap(2,12);P(5,4,'k');P(16,4,'k');P(5,10,'k');P(16,10,'k');
   // 상자 속 어둠 + 새어 나오는 금빛
   for(let y=13;y<=15;y++){P(1,y,'o');P(20,y,'o');for(let x=2;x<=19;x++)P(x,y,y===13?'o':y===14?'#4a2e1c':'#34201a');}
   if(key==='chestOpen'){g.save();const gr=g.createRadialGradient(11,13,1,11,13,13);gr.addColorStop(0,'rgba(255,244,160,.95)');gr.addColorStop(.5,'rgba(255,214,80,.45)');gr.addColorStop(1,'rgba(255,214,80,0)');g.fillStyle=gr;g.fillRect(0,0,22,26);g.restore();
   // 금화 더미 (윤곽선은 자동으로) — 보물은 '가득 찬' 상자에만 그려요. 주인공이 떠나면 빈 상자(chestEmpty)로 바뀌어요
   const pile=[[10,2],[9,4],[8,6],[7,8],[6,10],[5,12],[4,14],[3,16]],fill=new Set();
   pile.forEach(([x0,w],r)=>{for(let x=x0;x<x0+w;x++)fill.add((8+r)*100+x);});
   for(let y=7;y<=16;y++)for(let x=2;x<=19;x++){if(fill.has(y*100+x))continue;if(fill.has(y*100+x-1)||fill.has(y*100+x+1)||fill.has((y-1)*100+x)||fill.has((y+1)*100+x))R(x,y,1,1,OL);}
   pile.forEach(([x0,w],r)=>R(x0,8+r,w,1,GD));
   [[10,8],[9,9],[8,10],[7,11],[6,12],[5,13],[14,13],[15,14],[4,14],[11,14]].forEach(([x,y])=>R(x,y,1,1,GH));
   [[12,9],[13,10],[11,11],[13,12],[8,13],[16,13],[6,14],[17,14],[9,15],[12,15],[15,15]].forEach(([x,y])=>R(x,y,1,1,GS));
   [[5,15],[10,14],[14,15]].forEach(([x,y])=>R(x,y,2,1,'#e0b020'));
   const gem=(x,y,c,h)=>{R(x,y-1,2,4,OL);R(x-1,y,4,2,OL);R(x,y,2,2,c);R(x,y,1,1,h);};
   gem(9,11,'#e8434f','#ffb0b6');gem(13,12,'#4aa0f0','#d4efff');gem(6,13,'#4cc46a','#c8f6d0');}
   body(16,false);
  }} else if(key==='stray'){ // 덤불 속 다친 포켓몬: 이파리 덤불 · 어두운 틈에서 떠는 눈 · 삐죽 나온 귀 · 붕대
  const D='#1f4a2c',M='#3f8a4a',L='#6cc070',H='#a8e890',HOL='#16301e';
  // 덤불 뒤로 삐죽 나온 귀 (덤불이 아래쪽을 덮어요)
  R(5,2,5,8,OL);R(6,3,3,7,'#e8a860');R(6,3,1,3,'#fff0d0');
  R(21,1,5,9,OL);R(22,2,3,8,'#c8b8e8');R(22,2,1,3,'#f0e8ff');
  // 덤불 덩어리 (윤곽 → 안쪽 색)
  disc(9,15,7.5,OL);disc(15,12,8.5,OL);disc(21,15,7.5,OL);R(1,15,28,5,OL);
  disc(9,15,6.5,M);disc(15,12,7.5,M);disc(21,15,6.5,M);R(2,15,26,4,M);
  disc(8,12,3.5,L);disc(14,8,3.5,L);disc(20,12,3.5,L);
  [[6,10],[12,6],[17,7],[22,10],[14,10],[9,13]].forEach(([x,y])=>R(x,y,2,1,H));
  [[4,17],[10,18],[18,18],[26,17],[13,14],[22,15],[7,15]].forEach(([x,y])=>R(x,y,2,1,D));
  R(2,19,26,1,D);R(2,20,26,1,OL);
  // 덤불 속 어두운 틈 + 겁먹은 눈(세 마리)
  g.fillStyle=HOL;g.beginPath();g.ellipse(7,17,3,2,0,0,6.283);g.fill();g.beginPath();g.ellipse(15,16,6,3.6,0,0,6.283);g.fill();g.beginPath();g.ellipse(24,17,3,2,0,0,6.283);g.fill();
  R(12,15,2,2,'#fff');R(16,15,2,2,'#fff');R(13,16,1,1,OL);R(17,16,1,1,OL);
  R(6,16,1,2,'#fff');R(8,16,1,2,'#fff');R(23,16,1,2,'#fff');R(25,16,1,2,'#fff');
  // 다친 귀에 감긴 붕대
  R(4,5,7,3,OL);R(5,6,5,1,'#fff');R(5,5,5,1,'#e8e8f0');R(8,6,1,1,'#e65b66');
} else if(key==='evolve'){ // 진화의 빛: 길바닥에 새겨진 푸른 마법진 (빛기둥은 필드에서 따로 그려요)
  const ell=(cx,cy,rx,ry,k)=>{g.fillStyle=k;g.beginPath();g.ellipse(cx,cy,rx,ry,0,0,6.283);g.fill();};
  ell(16,10.5,15.5,5.5,OL);ell(16,10,14.5,4.8,'#3a3f8a');ell(16,10,12.2,3.8,'#9ad4ff');ell(16,10,11.2,3.2,'#4a55b8');ell(16,10,7,2.2,'#6a78e0');ell(16,10,3.8,1.4,'#e8f6ff');
  [[3,10],[29,10],[16,5],[16,15],[8,7],[24,7],[8,13],[24,13]].forEach(([x,y])=>R(x,y,1,1,'#fff6b0'));
  [[10,10],[22,10],[13,8],[19,8],[13,12],[19,12]].forEach(([x,y])=>R(x,y,1,1,'#bfe4ff'));
} else if(key==='thorns'){ // 가시덤불 길: 선인장 두 그루 + 가시덤불, 그 사이로 반짝이는 무언가
  const CG='#4aa04a',CL='#7acc6a',CD='#2f7438',SP='#f4f0c0';
  R(3,21,24,2,'rgba(20,20,40,.25)');
  // 왼쪽 큰 선인장
  R(5,5,7,17,OL);R(6,6,5,16,CG);R(6,6,2,16,CL);R(9,6,2,16,CD);R(1,10,5,3,OL);R(2,11,3,1,CG);R(1,6,3,6,OL);R(2,7,1,5,CG);
  // 오른쪽 선인장
  R(20,9,6,13,OL);R(21,10,4,12,CG);R(21,10,1,12,CL);R(24,10,1,12,CD);R(25,13,4,3,OL);R(25,14,3,1,CG);R(27,10,3,5,OL);R(28,11,1,4,CG);
  [[7,8],[9,12],[7,16],[9,19],[3,8],[22,13],[24,17],[22,20],[28,12]].forEach(([x,y])=>R(x,y,1,1,SP));
  // 바닥 가시덤불
  disc(15,20,4.5,OL);disc(15,19,3.6,'#6e8c3a');R(12,22,7,1,OL);
  [[12,17],[18,17],[11,19],[19,19],[14,16],[16,16]].forEach(([x,y])=>{R(x,y,1,2,OL);R(x,y,1,1,SP);});
} else if(key==='egg'){}
 return PROP_CACHE[key]=c;}
// 의문의 알: 포켓몬 정원의 알 그림(gdEggSVG)을 그대로 가져와 둥지 위에 올려요
// 포켓몬 도감 단말: 받침대 위에 펼쳐진 붉은 도감
let DEX_CV=null;
function dexSheet(){if(DEX_CV)return DEX_CV;const c=document.createElement('canvas');c.width=20;c.height=24;const g=c.getContext('2d');
 const R=(x,y,w,h,k)=>{g.fillStyle=k;g.fillRect(x,y,w,h);},OL='#2a2038';
 R(3,20,14,4,OL);R(4,20,12,3,'#8a8aa4');R(4,20,12,1,'#c4c4d8');R(7,12,6,9,OL);R(8,12,4,8,'#b4b4c8');R(8,12,1,8,'#dcdcec');
 R(0,3,20,10,OL);R(1,4,8,8,'#c8404e');R(11,4,8,8,'#c8404e');R(1,4,8,1,'#e8707a');R(11,4,8,1,'#e8707a');
 R(2,5,7,6,'#fff4e8');R(11,5,7,6,'#fff4e8');R(9,4,2,9,OL);
 R(3,6,5,1,'#c8a090');R(3,8,4,1,'#c8a090');R(3,10,5,1,'#c8a090');R(12,6,5,1,'#c8a090');R(12,8,3,1,'#c8a090');
 g.fillStyle=OL;g.beginPath();g.arc(15,9,2.2,0,6.283);g.fill();g.fillStyle='#e65b66';g.fillRect(13,7,4,2);g.fillStyle='#fff';g.fillRect(13,9,4,2);R(14,8,2,2,OL);
 return DEX_CV=c;}
const EGG_IMG={};
function eggImg(t){if(EGG_IMG[t])return EGG_IMG[t];const im=new Image();EGG_IMG[t]=im;try{const svg=gdEggSVG(t,0,false).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100" ');im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);}catch(e){}return im;}
// ---------- 작은 학교 건물 (64×48 도트 · 시련 선생님 뒤에 서 있어요) ----------
let SCHOOL_CV=null;
function schoolSheet(){if(SCHOOL_CV)return SCHOOL_CV;
 const c=document.createElement('canvas');c.width=64;c.height=48;const g=c.getContext('2d');
 const R=(x,y,w,h,k)=>{g.fillStyle=k;g.fillRect(x,y,w,h);};
 const OL='#2a2038',br='#d9755a',brL='#ea9078',brD='#b45a48',roof='#6f86b8',roofL='#9db0dc',roofD='#52669a',cream='#f6ecd2',creamS='#d8ccae';
 R(4,44,56,4,'rgba(20,20,40,.25)');
 // 벽돌 벽
 R(6,19,52,26,OL);R(7,20,50,24,br);R(7,20,50,2,brL);
 for(let y=24;y<42;y+=4){R(7,y,50,1,brD);for(let x=7+((y/4|0)%2)*4;x<57;x+=8)R(x,y+1,1,3,brD);}
 R(7,40,50,4,'#b8ab8a');R(7,40,50,1,OL);
 // 지붕
 for(let y=9;y<=18;y++){const ins=Math.max(0,Math.round(8-(y-9)*.9)),x0=2+ins,w=60-ins*2;R(x0-1,y,w+2,1,OL);R(x0,y,w,1,y%3===0?roofL:y%3===1?roof:roofD);}
 R(0,18,64,3,OL);R(1,18,62,2,roofL);R(1,19,62,1,roofD);
 // 가운데 시계탑
 R(25,2,14,17,OL);R(26,3,12,16,cream);R(26,3,3,16,'#fffaf0');R(35,3,3,16,creamS);
 for(let y=0;y<4;y++){R(27+y,y-1<0?0:y-1,10-y*2,1,OL);} 
 R(28,0,8,2,OL);R(29,1,6,1,'#c8404e');R(30,0,4,1,'#e65b66');R(31,-0,2,1,OL);
 g.fillStyle=OL;g.beginPath();g.arc(32,10,5.2,0,6.283);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(32,10,4,0,6.283);g.fill();
 R(32,7,1,4,OL);R(32,10,3,1,OL);R(32,5,1,1,'#c8404e');
 R(24,17,16,3,OL);R(25,17,14,1,creamS);
 // 깃발 (오른쪽 지붕 끝)
 R(54,0,1,12,OL);R(55,1,7,5,OL);R(55,2,6,3,'#e65b66');R(55,2,6,1,'#ff9aa4');
 // 창문
 for(const wx of [10,19,43,52]){R(wx,26,6,9,OL);R(wx+1,27,4,7,'#5a86c8');R(wx+1,27,4,2,'#a8d0ff');R(wx+2,27,1,7,OL);R(wx+1,31,4,1,OL);R(wx-1,35,8,1,OL);R(wx,35,6,1,creamS);}
 // 팻말 + 문 + 계단
 R(24,22,16,6,OL);R(25,23,14,4,cream);R(27,24,10,1,'#8a5a30');R(27,26,7,1,'#8a5a30');
 R(26,31,12,17,OL);R(27,32,10,16,'#8a5a30');R(28,29,8,3,OL);R(27,31,10,1,OL);R(28,33,4,15,'#a8743c');R(33,33,4,15,'#946530');R(32,32,1,16,OL);R(28,33,1,15,'#c9944f');
 R(29,40,1,3,'#ffe066');R(34,40,1,3,'#ffe066');
 R(23,44,18,2,OL);R(24,44,16,1,'#e4dcc4');R(21,46,22,2,OL);R(22,46,20,1,'#cfc4a4');
 return SCHOOL_CV=c;}
// ---------- 분기점 → 맵 위 모습 ----------
const MARK={normal:'⚔️',elite:'💀',boss:'👑',gym:'🏟️',relic:'🏺',rest:'⛺',shop:'🛒',rand:'🎲',trial:'🎓',event:'❓'};
function look(n){
 switch(n.t){
  case 'normal':return{v:'mon',sz:24};
  case 'elite':return{v:'mon',sz:30};
  case 'boss':return{v:'mon',sz:40};
  case 'gym':return{v:'npc',sp:GYM_SPR[(n.gi|0)]!=null?GYM_SPR[(n.gi|0)]:SPR.officer};
  case 'relic':return{v:'item'};
  case 'rest':return{v:'tent'};
  case 'shop':return{v:'npc',sp:SPR.clerk};
  case 'rand':return{v:'bush'};
  case 'trial':return{v:'npc',sp:SPR.teacher};
  default:if(n.t==='event'&&PROPS[n.ev])return{v:'prop',k:n.ev};return{v:'npc',sp:(n.t==='event'&&n.ev==='wanderer')?SPR.trav:(n.t==='event'&&n.ev==='trader')?SPR.gramps:(n.t==='event'&&n.ev==='gambler')?SPR.coolm:SPR.sage};
 }}

// ---------- 글 (골드 말투) ----------
function clean(s){return String(s||'').replace(/<br\s*\/?>/gi,' · ').replace(/❤️?/gu,'체력 ').replace(/⚔️?/gu,'공격 ').replace(/🔁/gu,'연타 ').replace(/🪙/gu,'골드 ').replace(/🎁/gu,'보상: ').replace(/[\u{1F000}-\u{1FAFF}\uFE0F\u2693-\u27BF\u2B50]/gu,'').replace(/\s+/g,' ').trim();}
function info(n,i,run){const t=document.createElement('div');t.innerHTML=String(rlOptCard(n,i,run)).replace(/<img[^>]*>/gi,'').replace(/<br\s*\/?>/gi,' · ');
 const g=s=>{const e=t.querySelector(s);return e?clean(e.textContent):'';};return{name:g('.oh b'),desc:g('.od'),tag:g('.ot')};}
const ga=s=>hasJong(s)?'이':'가';
function script(n,inf,run){
 const fl=run.floor||1;let nm=inf.name,pages,menu=['들어간다','지나간다'];
 const tg=inf.tag;
 const foe=()=>{const b=MON[n.id],f=rlFoeStats(n.t,n.id,Math.min(run.step,RL.steps-1)),tr=clean(String(inf.desc).split('회').slice(1).join('회')).replace(/[●○]+\s*/g,'').trim();
  nm=b.name;const tyKo=(b.types||[]).map(t=>TYPE_KO[t]).join('·')||'-';let tt=tr;try{const kw=kwOf(b);if(kw)tt='특징: '+kw.n+'\n'+kwEasy(b,kw);const dl=rlDangerLine(rlDanger(n.t,n.id,run));if(dl)tt=(tt?tt+'\n':'')+dl;}catch(er){}
  return{head:b.name+'  '+'★'.repeat(b.rar)+'  ['+tyKo+']\n체력 '+f.hp+' · 공격 '+f.atk+' · 연타 '+f.att+'회',trait:tt,raw:1};};
 switch(n.t){
  case 'normal':{const f=foe();pages=['앗! 야생의 '+nm+ga(nm)+' 튀어나왔다!',f.head+'\n'+tg,f.trait||'','싸워 볼까?'];menu=['싸운다','피한다'];break;}
  case 'elite':{const f=foe();pages=['강렬한 기운이 느껴진다… '+nm+ga(nm)+' 길을 가로막고 있다!',f.head+'\n'+tg,f.trait||'','맞서 싸울까?'];menu=['맞선다','피한다'];break;}
  case 'boss':{const f=foe();pages=[fl+'층의 주인 '+nm+ga(nm)+' 우리를 기다리고 있었다…!',f.head+'\n'+tg,f.trait||'','정말 도전할까?'];menu=['도전한다','잠깐만'];break;}
  case 'gym':{const G=GYMS[n.gi];pages=[G.ldr+ga(G.ldr)+' 길 한가운데서 팔짱을 끼고 서 있다.','「'+clean(G.n)+'」의 관장이다!\n'+tg,'승부를 받아 볼까?'];menu=['승부한다','피한다'];break;}
  case 'relic':pages=['길가에 몬스터볼이 떨어져 있다!','안에서 신비한 기운이 느껴진다.\n'+tg,'주워 볼까?'];menu=['줍는다','그냥 간다'];break;
  case 'rest':pages=['아늑한 캠핑 자리다. 모닥불이 따뜻하게 타고 있다.',tg,'잠깐 쉬어 갈까?'];menu=['쉰다','그냥 간다'];break;
  case 'shop':pages=['어서 오세요! 떠돌이 상인의 가게입니다!',tg,'물건을 둘러볼래요?'];menu=['구경한다','다음에요'];break;
  case 'rand':pages=['수상한 풀숲이 바스락바스락 흔들린다…','무엇이 튀어나올지 아무도 모른다.','들어가 볼까?'];menu=['들어간다','그만둔다'];break;
  case 'trial':pages=['시험관이 문제지를 흔들며 말한다.\n「문제 3개! 도전해 보겠나?」',tg,'도전할까?'];menu=['도전한다','다음에'];break;
  default:{const wd=n.ev==='wanderer',EI={ // 사람이 아닌 사건은 '누가 서 있다' 대신 그 장소·물건에 맞는 말로 시작해요
    spring:'숲 한가운데 맑은 샘이 반짝이고 있다. 물에서 따뜻한 빛이 올라온다.',
    chest:'덤불 속에 낡은 보물상자가 놓여 있다.',
    stray:'덤불 속에서 가늘게 떠는 기척이 느껴진다. 다친 포켓몬들이 있는 것 같다…',
    evolve:'하늘에서 반짝이는 빛줄기가 길 위로 내려오고 있다!',
    lab:'길가에 낡은 연구소가 덩그러니 남아 있다. 안에서 기계 소리가 윙윙 들린다.',
    thorns:'가시덤불이 길을 가로막고 있다. 덤불 너머에서 무언가 반짝인다!',
    ruins:'이끼 낀 고대 비석이 길 한가운데 솟아 있다. 글자가 새겨져 있다.',
    festival:'멀리서 음악 소리와 맛있는 냄새가 풍겨 온다. 축제가 한창인 것 같다!',
    egg:'낡은 둥지 속에서 은은하게 빛나는 알이 보인다.',
    altar:'오래된 제단 위에서 세 갈래의 빛이 빙글빙글 돌고 있다.',
    trader:'망토를 두른 수상한 상인이 길가에서 손짓한다.',
    gambler:'동전을 튕기던 사람이 눈이 마주치자 씩 웃는다.'},person=wd||n.ev==='trader'||n.ev==='gambler';
   pages=[wd?(n.ws?'낯익은 뒷모습이 손을 흔든다. 그 여행자다!':'길가에서 낯선 여행자가 손을 흔든다.'):(EI[n.ev]||'길 위에서 뭔가 일이 벌어질 것 같다…'),tg,person?'다가가 볼까?':'살펴볼까?'];menu=person?['다가간다','지나간다']:['살펴본다','지나간다'];}
 }
 return{pages:pages.filter(Boolean),menu};
}

// ---------- 본체 ----------
let ST=null;
function destroy(){window.__rlHudPing=null;document.documentElement.classList.remove('idleSleep');if(ST){try{ST.destroy();}catch(e){}ST=null;}}
function mount(run){
 destroy();
 const holder=q('#view .rl-opts');if(!holder||!run||!run.opts)return;
 const th=TH[run.bg]||TH[0],M=genMap(run,run.rv),W=M.W,H=M.H,sheet=makeSheet(th),tufts=makeTufts(th);
 const wrap=document.createElement('div');wrap.className='gf-wrap';
 wrap.innerHTML='<div class="gf-frame"><canvas id="gfCv" width="640" height="576"></canvas><div class="gf-tools"><button type="button" tabindex="-1" class="gf-home" id="gfHome">🏠 홈</button><button type="button" tabindex="-1" class="gfPadTog gf-padtog">⌨ 키패드</button><button type="button" tabindex="-1" class="gf-big" id="gfBig">🖥 크게</button><button type="button" tabindex="-1" class="gf-zoom" id="gfZoom">확대 ×1</button><button type="button" tabindex="-1" class="gf-home gfFsBtn" aria-label="전체 화면">🖥 전체</button></div><div class="gf-box" id="gfBox"><span id="gfTxt"></span><i class="gf-more" id="gfMore">▼</i></div><div class="gf-menu" id="gfMenu"></div></div>'+
  '<div class="gf-pad"><div class="gf-joy" id="gfJoy" aria-label="이동 조이스틱"><span class="ja u">▲</span><span class="ja d">▼</span><span class="ja l">◀</span><span class="ja r">▶</span><div class="gf-knob"></div></div>'+gfDpadHTML()+'<div class="gf-ab"><button data-k="b">B</button><button data-k="a">A</button></div></div>'+
  '<details class="gf-help"><summary>❓ 조작법 보기</summary><div class="gfh-b">방향키·WASD 이동 · Z/Enter/Space 말 걸기·확인 · X/Esc 취소 · +/- 확대<br>🖥 크게: 필드 창을 화면에 꽉 차게 키워요 · 터치는 필드 아래 빈 공간 아무 데나 눌러서 조이스틱(위쪽 ⌨ 키패드 버튼을 누르면 십자키로 바뀌어요), 또는 화면을 톡 누르면 그 자리까지 자동 이동 · 꾹 누른 채 끌면 그 방향으로 걸어요! 길을 따라 걷다 보면 분기점이 기다리고 있어요.<br>🏺 아래쪽 샛길의 보물상자는 내 유물 · 📖 도감은 내 덱 포켓몬! 말을 걸어 보세요.</div></details>';
 holder.replaceWith(wrap);try{gfPadApply();}catch(e){}
 // 크게 보기 위쪽 한 줄 HUD: 체력 · 골드 · 덱 · 유물 · 진행도(누르면 지도)
 try{const hud=document.createElement('div');hud.className='gf-hud';
  const fl=run.floor||1,st=Math.min(run.step+1,RL.steps+1);
  hud.innerHTML='<span class="hc hp">❤️ '+run.hp+'/'+run.max+'</span><span class="hc gold">🪙 '+run.gold+'</span><button type="button" class="hc" data-h="deck">🃏 '+run.deck.length+'</button><button type="button" class="hc" data-h="relic">🏺 '+run.relics.length+'</button><button type="button" class="hc" data-h="map">🗺️ '+fl+'층 '+st+'/'+(RL.steps+1)+'</button>';
  wrap.insertBefore(hud,wrap.firstChild);
  // 체력·골드·덱·유물·진행도가 바뀌면 바로 따라 바뀌어요 (전투·분기점·상자·창 닫기 같은 일이 끝난 때만 확인해서, 달라졌을 때만 다시 그려요)
  let hudKey='';const hudUpd=()=>{if(!document.body.classList.contains('gfBig')&&hudKey)return;try{const r=RUN()||run,fl=r.floor||1,st=Math.min(r.step+1,RL.steps+1),k=[r.hp,r.max,r.gold,r.deck.length,r.relics.length,fl,st].join('|');if(k===hudKey)return;hudKey=k;
   hud.innerHTML='<span class="hc hp">❤️ '+r.hp+'/'+r.max+'</span><span class="hc gold">🪙 '+r.gold+'</span><button type="button" class="hc" data-h="deck">🃏 '+r.deck.length+'</button><button type="button" class="hc" data-h="relic">🏺 '+r.relics.length+'</button><button type="button" class="hc" data-h="map">🗺️ '+fl+'층 '+st+'/'+(RL.steps+1)+'</button>';}catch(e){}};
  hudUpd();window.__rlHudPing=()=>{if(!wrap.isConnected){window.__rlHudPing=null;return;}hudUpd();}; /* 전투·분기점·상자·저장·창 닫기 때만 갱신 (계속 확인하지 않아요) */
  hud.addEventListener('pointerdown',e=>e.stopPropagation());
  hud.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button[data-h]');if(!b)return;e.stopPropagation();sfx('tap');const h=b.dataset.h,r=RUN();if(!r)return;
   if(h==='deck')rlShowDeck();else if(h==='relic')rlShowRelics();
   else window.M('<h2>🗺️ 지도 · '+(r.floor||1)+'층</h2><p class="mut" style="text-align:center;margin:4px 0 8px">지금 '+Math.min(r.step+1,RL.steps+1)+' / '+(RL.steps+1)+'단계</p>'+rlPathHTML(r)+'<div class="mbtns"><button class="btn gold" data-a="x">닫기</button></div>',{x:()=>closeM(),_close:()=>closeM()});});
 }catch(e){console.warn('gf hud',e);}
 const note=q('#view .rl-mapcard .sc-note');if(note)note.style.display='none';
 const cv=q('#gfCv'),g=cv.getContext('2d'),box=q('#gfBox'),txt=q('#gfTxt'),more=q('#gfMore'),menuEl=q('#gfMenu');
 g.imageSmoothingEnabled=false;
 // 확대: 보이는 칸 수를 줄여서 (×1 · ×1.5 · ×2) 크게 보여줘요. 터치 버튼은 그대로예요.
 let ZM=(()=>{try{const z=+rlMeta().fieldZoom;return z===1.5||z===2?z:1;}catch(e){return 1;}})(),KE=K,VW=CW,VH=CH;
 const ZL=[1,1.5,2],zb=q('#gfZoom');
 if(!document.getElementById('gf-zoom-css')){const st=document.createElement('style');st.id='gf-zoom-css';
  st.textContent='.gf-tools{position:absolute;top:6px;right:6px;z-index:5;display:flex;gap:6px}.gf-zoom,.gf-big,.gf-home{font:700 13px/1.2 "Jua","Noto Sans KR",sans-serif;color:#fff;background:rgba(43,33,64,.78);border:2px solid #fff;border-radius:999px;padding:4px 11px;cursor:pointer;box-shadow:0 2px 0 rgba(0,0,0,.3);-webkit-tap-highlight-color:transparent}.gf-zoom.on,.gf-big.on{background:#ff8a3c}.gf-zoom:active,.gf-big:active,.gf-home:active{transform:translateY(1px)}';
  document.head.appendChild(st);}
 const zlab=()=>{zb.textContent='확대 ×'+ZM;zb.classList.toggle('on',ZM>1);};
 const setZoom=d=>{const i=ZL.indexOf(ZM);ZM=ZL[(i+(d||1)+ZL.length)%ZL.length];zlab();try{rlMeta().fieldZoom=ZM;rlSave();}catch(e){}sfx('tap');};
 zlab();
 zb.addEventListener('pointerdown',ev=>ev.stopPropagation());
 zb.addEventListener('click',ev=>{ev.stopPropagation();setZoom(1);zb.blur();});
 let BIG=false,gfSp=null;
 const bigS=()=>{const z=(typeof FIT!=='undefined'&&FIT&&FIT.z)||1,vw=innerWidth/z,vh=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vh'))||innerHeight/z,hd=wrap.querySelector('.gf-hud'),hh=(hd&&hd.offsetHeight)||40,land=matchMedia('(orientation:landscape) and (max-height:520px)').matches;
   const s=land?Math.min(vw/160,(vh-hh-14)/144):Math.min((vw-44)/160,(vh-290)/144);return Math.min(8,Math.max(1,Math.floor(s*20)/20));}; // 0.5칸 단위로 내림하던 걸 0.05 단위로 — 화면을 거의 꽉 채워요
 const fit=()=>{const w=Math.min((q('#view').clientWidth||360)-28,660),hh=(window.innerHeight||800)-330;
  let s=w>=640?4:w>=480?3:w>=320?2:Math.max(1.5,w/160);if(BIG)s=bigS();else if(hh>0&&s>2)s=Math.min(s,Math.max(2,Math.floor(hh/144)));
  // 도트 한 칸이 기기 화면의 '정수 픽셀'이 되도록 배율을 맞춰요 (소수 배율이면 스크롤할 때 도트 굵기가 들쭉날쭉해서 울렁거려 보여요)
  const dpr=window.devicePixelRatio||1,dI=Math.max(1,Math.floor(s*dpr+1e-6));s=dI/dpr;
  let nk=dI<4?dI*Math.ceil(4/dI):Math.min(8,dI);if(dI>8){nk=8;for(let m=2;m<=dI;m++){if(dI%m===0&&dI/m<=8&&dI/m>=4){nk=dI/m;break;}}}
  wrap.style.setProperty('--gs',s);
  if(nk!==K||cv.width!==CW*nk){K=nk;cv.width=CW*K;cv.height=CH*K;}};
 fit();
 // 크게 보기: 정원의 '확대'처럼 필드 창을 화면 가운데에 크게 키워요. 오른쪽 위 ✕ 닫기 버튼이나 Esc로 닫아요.
 const bb=q('#gfBig');
 // ✕ 닫기 버튼은 화면 오른쪽 끝이 아니라 필드 창의 오른쪽 위 모서리 바로 위에 붙여요 (가로로 긴 화면에서도 필드 옆에 머물러요)
 const placeBigX=()=>{try{const x=document.getElementById('gfBigX');if(!x||!BIG||!wrap.isConnected)return;const r=wrap.getBoundingClientRect(),w=x.offsetWidth||90,h=x.offsetHeight||36,vt=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vt'))||0;
  let l=Math.min(r.right-w,innerWidth-w-12);l=Math.max(8,l);let t=r.top-h-8;if(t<vt+6)t=Math.max(vt+6,r.top+6);x.style.left=l+'px';x.style.top=t+'px';x.style.right='auto';}catch(e){}};
 addEventListener('resize',()=>{if(BIG)requestAnimationFrame(()=>requestAnimationFrame(placeBigX));});
 try{new ResizeObserver(()=>{if(BIG)placeBigX();}).observe(wrap);}catch(e){}
 const setBig=(on,quiet)=>{on=!!on;if(on===BIG)return;BIG=on;
  if(on){gfSp=document.createElement('div');gfSp.className='gf-spacer';gfSp.style.height=wrap.offsetHeight+'px';wrap.parentNode.insertBefore(gfSp,wrap);document.body.appendChild(wrap);}
  else if(gfSp){if(gfSp.parentNode)gfSp.parentNode.replaceChild(wrap,gfSp);else wrap.remove();gfSp=null;}
  document.body.classList.toggle('gfBig',on);bb.textContent=on?'✕ 닫기':'🖥 크게';
  {const x=document.getElementById('gfBigX');if(x)x.remove();} // 위쪽 빨간 닫기 버튼은 없애고, 필드 안의 주황 닫기 버튼만 써요
  bb.classList.toggle('on',on);fit();placeBigX();setTimeout(placeBigX,260);try{window.__rlHudPing&&window.__rlHudPing();}catch(e){}if(!quiet)sfx('tap');};
 const orphT=setInterval(()=>{if(BIG&&gfSp&&!gfSp.isConnected){try{setBig(false,1);}catch(e){}wrap.remove();}if(!BIG&&!wrap.isConnected)clearInterval(orphT);},700);
 const bigOut=e=>{if(!BIG)return;if(!wrap.isConnected){setBig(false,1);return;} /* 빈 곳을 눌러도 닫히지 않아요 — 오른쪽 위 ✕ 닫기 버튼이나 Esc로만 닫아요 */};
 // 작은 창 화면은 없앴어요: 크게 화면의 ✕ 닫기(또는 Esc)를 누르면 바로 텍스트 모드로 가요
 const toText=()=>{if(typeof rl2Co==='function'&&rl2Co()){try{rl2FieldExit();}catch(er){}return;}try{sfx('tap');}catch(e){}try{setBig(false,1);}catch(e){}try{const r=RUN();if(r){r.mode='text';rlSave();}}catch(e){}try{rlRenderMap();}catch(e){console.warn('to text',e);}};
 const bigKey=e=>{if(BIG&&e.key==='Escape'){e.stopImmediatePropagation();e.preventDefault();toText();}};
 bb.addEventListener('pointerdown',ev=>ev.stopPropagation());
 const hb=q('#gfHome');
 if(hb){hb.addEventListener('pointerdown',ev=>ev.stopPropagation());
  hb.addEventListener('click',ev=>{ev.stopPropagation();hb.blur();
   if(typeof rl2Co==='function'&&rl2Co()){try{sfx('tap');}catch(e){}try{rl2FieldExit();}catch(er){}return;} // 2인 모험은 나가기(저장) 확인
   try{sfx('tap');}catch(e){}try{setBig(false,1);}catch(e){}try{teardownForText();}catch(e){}
   try{const r=RUN();if(r)rlSave();}catch(e){} // 모험은 그대로 저장 — 모험 메뉴에서 이어하기로 돌아와요
   try{scBackToHub();}catch(e){console.warn('field home',e);try{renderHub();}catch(e2){}}});}
 wrap.addEventListener('touchmove',e=>{if(BIG&&!(e.target.closest&&e.target.closest('.gf-box')))e.preventDefault();},{passive:false}); // 크게 보기 중에는 바깥을 밀어도 화면이 스크롤되지 않아요
 bb.addEventListener('click',ev=>{ev.stopPropagation();bb.blur();toText();});
 document.addEventListener('click',bigOut,true);document.addEventListener('keydown',bigKey,true);
 // 전투 등을 마치고 돌아왔을 때: 크게 보기를 그대로 유지하고, 화면 스크롤도 나가기 전 위치로 되돌려요
 {const kp=window.__gfKeep;window.__gfKeep=null;
  if(kp&&Date.now()-kp.t<20*60*1000){if(kp.big)setBig(true,1);
   if(kp.y>0){const vv=q('#view'),rs=()=>{try{if(vv&&vv.isConnected)vv.scrollTop=kp.y;}catch(er){}};rs();requestAnimationFrame(()=>{rs();requestAnimationFrame(rs);});setTimeout(rs,120);setTimeout(rs,450);}}}
 if(!BIG)setBig(true,1); // 필드 모드는 항상 크게(전체 화면)로 열려요
 // 정적 배경
 const bgc=document.createElement('canvas');bgc.width=W*T;bgc.height=H*T;const bg=bgc.getContext('2d');bg.imageSmoothingEnabled=false;
 const anim=[],AX={x:-99,y:-99};let af=0;
 // ===== 풀밭 통과 연출: 풀이 발을 덮고 · 들어갈 때 바스락 흔들리고 · 풀잎이 튀어요 =====
 // ===== 상자 보상 아이콘: 열리면 주인공 머리 위로 톡 튀어 올라 대화가 끝날 때까지 떠 있어요 =====
 let rwPop=null;
 const rwSrc=n=>{try{return ART.ic[n]||null;}catch(e){return null;}};
 ['coin','candy','bolt','vase'].forEach(n=>{try{getImg(rwSrc(n));}catch(e){}});
 const showReward=(k,ic)=>{rwPop={k,ic,t0:tms,t1:0};};
 const rustle={},leaves=[];
 const tallAt=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&M.t[y*W+x]===TL.TALL;
 const ambF=(x,y)=>0; // 풀은 가만히 있어요 (계속 일렁이면 배경을 자꾸 다시 그려서 끊겨 보였어요) — 밟을 때만 바스락
 const tuftF=(x,y)=>{const k=y*W+x,d=ambF(x,y),r=rustle[k];if(r!=null){const a=tms-r;if(a<110)return(d^1)|2;if(a<220)return d|2;if(a<330)return d^1;}return d;};
 const startRustle=(x,y)=>{rustle[y*W+x]=tms;const col=tuftCol(th),cs=[col.L,col.M,col.L,col.M,col.L];
  for(let i=0;i<5;i++)leaves.push({x:x*T+3+Math.random()*10,y:y*T+8+Math.random()*3,vx:(Math.random()-.5)*.045,vy:-.014-Math.random()*.02,t:0,max:360+Math.random()*240,c:cs[i],w:i%2?2:1});};
 const stepLeaves=dt=>{for(let i=leaves.length-1;i>=0;i--){const l=leaves[i];l.t+=dt;if(l.t>=l.max){leaves.splice(i,1);continue;}l.x+=l.vx*dt;l.y+=l.vy*dt;l.vy+=.00009*dt;}};
 const isP=v=>v===TL.PATH||v===TL.CARPET;
 function paint(x,y){const id=M.t[y*W+x];let si=0;
  switch(id){case TL.GRASS:si=(x*7+y*13)%3;break;case TL.PATH:si=3+((x+y)&1);break;case TL.TALL:si=th.city?5:(x*7+y*13)%3;break;case TL.TREE:si=th.city?[7,22,23,24][(x*3+y*7+((x*y)>>1))&3]:(th.coast||th.volc||th.obs||th.night)?[7,22][(x*3+y*5+(x>>1))&1]:7;break;case TL.LAMP:si=25;break;case TL.WATER:si=th.night?8+(((x*5+y*11)%4===0)?1:0):8+af;break;case TL.FLOWER:si=10+af;break;case TL.ROCK:si=12;break;case TL.CARPET:si=13;break;case TL.PILLAR:si=14;break;case TL.MARBLE:case TL.MBLK:si=17+((x+y)&1);break;case TL.DAIS:si=19;break;case TL.CLOUD:si=th.city?[7,22,23,24][(x*3+y*7+((x*y)>>1))&3]:(x*7+y*13)%3;break;case TL.CLOUDF:si=th.city||th.obs||th.night||th.volc?26:(x*7+y*13)%3;break;}
  bg.drawImage(sheet,si*T,0,T,T,x*T,y*T,T,T);
  if(id===TL.TALL)bg.drawImage(tufts,0,0,T,T,x*T,y*T,T,T);
  const nb=(dx,dy)=>{const a=x+dx,b=y+dy;return a<0||b<0||a>=W||b>=H?-1:M.t[b*W+a];};
  if(id===TL.PATH){bg.fillStyle=th.coast?'#7a5230':th.p3;if(!isP(nb(0,-1)))bg.fillRect(x*T,y*T,T,1);if(!isP(nb(0,1)))bg.fillRect(x*T,y*T+15,T,1);if(!isP(nb(-1,0)))bg.fillRect(x*T,y*T,1,T);if(!isP(nb(1,0)))bg.fillRect(x*T+15,y*T,1,T);}
  if(id===TL.WATER){bg.fillStyle=th.city?'#f4f6fa':th.coast?'#e8fbff':th.volc?'#2e1a16':th.obs?'#7ae0ff':th.night?'#aee6ff':th.w3;if(nb(0,-1)!==TL.WATER)bg.fillRect(x*T,y*T,T,2);if(nb(0,1)!==TL.WATER)bg.fillRect(x*T,y*T+14,T,2);if(nb(-1,0)!==TL.WATER)bg.fillRect(x*T,y*T,2,T);if(nb(1,0)!==TL.WATER)bg.fillRect(x*T+14,y*T,2,T);}
  if(th.city){const nbq=(dx,dy)=>{const a=x+dx,b=y+dy;if(a<0||b<0||a>=W||b>=H)return TL.TREE;const v=M.t[b*W+a];return v===TL.CLOUD?TL.TREE:v;};
   if(id===TL.PATH){const hh=isP(nbq(-1,0))&&isP(nbq(1,0)),vv=isP(nbq(0,-1))&&isP(nbq(0,1));bg.fillStyle='#e8c84a';
    if(hh&&!vv&&x%2===0)bg.fillRect(x*T+3,y*T+7,10,2);else if(vv&&!hh&&y%2===0)bg.fillRect(x*T+7,y*T+3,2,10);
    else if(hh&&vv){bg.fillStyle='#e8e4d8';for(let k=1;k<16;k+=4){bg.fillRect(x*T+k,y*T+3,2,10);}}}
   if(id===TL.CLOUDF){bg.fillStyle='#4a5266';if(nbq(0,-1)!==TL.CLOUDF)bg.fillRect(x*T,y*T,16,2);if(nbq(0,1)!==TL.CLOUDF)bg.fillRect(x*T,y*T+14,16,2);if(nbq(-1,0)!==TL.CLOUDF)bg.fillRect(x*T,y*T,2,16);if(nbq(1,0)!==TL.CLOUDF)bg.fillRect(x*T+14,y*T,2,16);bg.fillStyle='#c8ced8';if(nbq(0,-1)!==TL.CLOUDF)bg.fillRect(x*T,y*T+2,16,1);
    if(M.t[y*W+x-1]===TL.CLOUDF&&M.t[y*W+x+1]===TL.CLOUDF&&M.t[(y-1)*W+x]===TL.CLOUDF&&M.t[(y+1)*W+x]===TL.CLOUDF){bg.fillStyle='#e8c84a';bg.fillRect(x*T+3,y*T+3,10,1);bg.fillRect(x*T+3,y*T+12,10,1);bg.fillRect(x*T+3,y*T+3,1,10);bg.fillRect(x*T+12,y*T+3,1,10);}}
   if(id===TL.TREE||id===TL.CLOUD){const hs=(Math.imul(x+3,73856093)^Math.imul(y+5,19349663))>>>0,top=nbq(0,-1)!==TL.TREE&&nbq(0,-1)!==TL.CLOUDF,bot=nbq(0,1)!==TL.TREE&&nbq(0,1)!==TL.CLOUDF;
    // 불 켜진 창
    for(const wx of [2,10]){if(bot&&(wx===2||hs%3))continue;const lit=((hs>>(wx>4?3:5))&3)<2;bg.fillStyle=lit?'#ffe58a':'#34406a';bg.fillRect(x*T+wx,y*T+3,4,6);bg.fillStyle=lit?'#fff6c4':'#5a6aa0';bg.fillRect(x*T+wx,y*T+3,2,2);bg.fillStyle='#2a3250';bg.fillRect(x*T+wx+1,y*T+3,1,6);}
    if(top){bg.fillStyle='#2a3250';bg.fillRect(x*T,y*T,16,3);bg.fillStyle='#d0d6e6';bg.fillRect(x*T,y*T+3,16,1);bg.fillStyle='#6a7290';bg.fillRect(x*T,y*T+4,16,1);
     if(hs%4===0){bg.fillStyle='#2a3250';bg.fillRect(x*T+9,y*T-0,5,3);}}
    if(bot){bg.fillStyle='#2a3250';bg.fillRect(x*T,y*T+10,16,6);const k=hs%3;
     if(k===0){bg.fillStyle='#5a3a2a';bg.fillRect(x*T+6,y*T+7,4,9);bg.fillStyle='#8a5a3a';bg.fillRect(x*T+7,y*T+8,2,8);bg.fillStyle='#ffd23a';bg.fillRect(x*T+9,y*T+12,1,1);}
     else{bg.fillStyle='#bfe4ff';bg.fillRect(x*T+2,y*T+8,12,6);bg.fillStyle='#e4f6ff';bg.fillRect(x*T+2,y*T+8,12,1);bg.fillStyle='#2a3250';bg.fillRect(x*T+8,y*T+8,1,6);}
     const ac=['#e5534b','#3a78d8','#5cc26a'][hs%3];bg.fillStyle=ac;bg.fillRect(x*T,y*T+6,16,2);bg.fillStyle='#fff';for(let k2=0;k2<16;k2+=4)bg.fillRect(x*T+k2,y*T+6,2,2);}
    bg.fillStyle='rgba(20,20,50,.25)';if(nbq(1,0)!==TL.TREE)bg.fillRect(x*T+15,y*T,1,16);}}
  if((th.obs||th.night||th.volc)&&(id===TL.CLOUD||id===TL.CLOUDF)){const gv=(dx,dy)=>{const a=x+dx,b=y+dy;if(a<0||b<0||a>=W||b>=H)return false;const v=M.t[b*W+a];return v===TL.CLOUD||v===TL.CLOUDF;};
   if(id===TL.CLOUD)for(let py=0;py<T;py++)for(let px=0;px<T;px++){const wx=x*T+px,wy=y*T+py,u=Math.sin((wx*.8+wy*.5)/7)+Math.sin((wx-wy*1.3)/11)+Math.sin(wx/4.5+wy/9)*.5,n=((Math.imul(wx*73856093^wy*19349663,2654435761)>>>0)%1000)/1000;
    let c;if(th.volc){c='#2e2624';if(u>.35)c='#463a38';if(u>.8)c='#645652';if(u>1.25)c='#8a7a74';if(u>1.6)c='#b0a098';if(n>.99)c='#ff8a2a';}else if(th.night){c='#2a2048';if(u>.35)c='#3e3068';if(u>.8)c='#5a4a88';if(u>1.25)c='#8a78b8';if(u>1.6)c='#c8b8f0';if(n>.992)c='#ff8a9a';}else{c='#14123a';if(u>.35)c='#241e62';if(u>.8)c='#3a2a88';if(u>1.25)c='#5a3aa8';if(u>1.55)c='#c86ae0';if(n>.985)c='#ffffff';else if(n>.965)c='#bfe8ff';else if(n>.955&&u>.3)c='#ffd0f0';}
    bg.fillStyle=c;bg.fillRect(wx,wy,1,1);}
   bg.fillStyle=th.night?'#a890d8':th.volc?'#8a7a74':'#8a7af0';if(!gv(0,-1))bg.fillRect(x*T,y*T,16,1);if(!gv(0,1))bg.fillRect(x*T,y*T+15,16,1);if(!gv(-1,0))bg.fillRect(x*T,y*T,1,16);if(!gv(1,0))bg.fillRect(x*T+15,y*T,1,16);}
  }
 // ===== 구름: 둥근 덩어리를 겹쳐 만든 뭉게구름 (칸마다 덩어리 하나, 월드 좌표로 계산해서 이웃 칸과 매끄럽게 이어져요) =====
 function cloudAt(tx,ty){if(tx<0||ty<0||tx>=W||ty>=H)return false;const v=M.t[ty*W+tx];return v===TL.CLOUD||v===TL.CLOUDF;}
 const LB=new Array(W*H),DC=new Float32Array(W*T*H*T).fill(-1e9); // 구름 계산 결과 캐시 (같은 값을 수십 번 다시 계산하던 것을 한 번만)
 // 구름은 '칸마다 둥근 덩어리 하나'를 겹쳐 만들어요. 예전엔 픽셀마다 덩어리 9개와 거리를 다시 재서 느렸어요 →
 // 이제 덩어리를 한 번만 도장 찍듯 찍어서(모양 마스크 + 깊이) 만들고, 칠할 땐 마스크만 읽어요. 결과 그림은 똑같아요.
 const PAD=24,PW=W*T+PAD*2,PH=H*T+PAD*2;let CIN=null,CDP=null,CFD=null;
 function cLobe(tx,ty){const h=(Math.imul(tx+11,73856093)^Math.imul(ty+7,19349663))>>>0;
  const rr=n=>((h>>>n)&15)/15;let r=11+rr(0)*3;
  // 바깥으로 툭 튀어나온 모서리 칸은 덩어리를 작게 해서 둥글게 깎아요
  if(!cloudAt(tx-1,ty)&&!cloudAt(tx,ty-1)||!cloudAt(tx+1,ty)&&!cloudAt(tx,ty-1)||!cloudAt(tx-1,ty)&&!cloudAt(tx,ty+1)||!cloudAt(tx+1,ty)&&!cloudAt(tx,ty+1))r-=2.2;
  return[tx*T+8+(rr(4)-.5)*5,ty*T+8+(rr(8)-.5)*5,r];}
 function cSolid(tx,ty){return cloudAt(tx,ty)&&cloudAt(tx-1,ty)&&cloudAt(tx+1,ty)&&cloudAt(tx,ty-1)&&cloudAt(tx,ty+1);}
 function buildClouds(){
  CIN=new Uint8Array(PW*PH);CDP=new Float32Array(PW*PH).fill(-99);CFD=new Uint8Array(PW*PH);
  const lobes=[];
  for(let ty=0;ty<H;ty++)for(let tx=0;tx<W;tx++){if(!cloudAt(tx,ty))continue;
   const o=cLobe(tx,ty),sol=cSolid(tx,ty);lobes.push([tx,ty,o,sol]);
   if(sol)for(let y=ty*T;y<ty*T+T;y++){const b=(y+PAD)*PW+PAD+tx*T;for(let x=0;x<T;x++)CIN[b+x]=1;}}
  // 덩어리를 찍어요: 깊이는 '그 픽셀 칸의 이웃 3×3 칸' 덩어리 중 가장 깊은 값 (예전 계산과 같은 규칙)
  const stamp=(L,fn)=>{const tx=L[0],ty=L[1],o=L[2],r=o[2],x0=Math.max(-PAD,Math.max((tx-1)*T,Math.floor(o[0]-r)-1)),x1=Math.min(W*T+PAD-1,Math.min((tx+2)*T-1,Math.ceil(o[0]+r)+1)),
    y0=Math.max(-PAD,Math.max((ty-1)*T,Math.floor(o[1]-r)-1)),y1=Math.min(H*T+PAD-1,Math.min((ty+2)*T-1,Math.ceil(o[1]+r)+1));
   for(let wy=y0;wy<=y1;wy++)for(let wx=x0;wx<=x1;wx++)fn(wx,wy,(wy+PAD)*PW+wx+PAD,r-Math.hypot(wx+.5-o[0],wy+.5-o[1]),o);};
  lobes.forEach(L=>stamp(L,(wx,wy,k,d)=>{if(d>CDP[k])CDP[k]=d;if(d>=0)CIN[k]=1;}));
  lobes.forEach(L=>{if(L[3])return;stamp(L,(wx,wy,k,d,o)=>{
   if(d>=0&&d<1.1&&(wx+.5-o[0])+(wy+.5-o[1])>3&&CDP[((wy-1)+PAD)*PW+(wx-1)+PAD]>2.5)CFD[k]=1;});});}
 function cloudPaint(x,y){
  if(th.city||th.obs||th.night||th.volc)return;
  let near=false;for(let dy=-1;dy<=1&&!near;dy++)for(let dx=-1;dx<=1;dx++)if(cloudAt(x+dx,y+dy)){near=true;break;}
  if(!near)return;
  if(!CIN)buildClouds();
  const inn=(wx,wy)=>CIN[(wy+PAD)*PW+wx+PAD]===1;
  for(let py=0;py<T;py++)for(let px=0;px<T;px++){
   const wx=x*T+px,wy=y*T+py;
   if(inn(wx,wy)){let c;
    if(!inn(wx,wy+1))c='#86a8d2';                                   // 아래 테두리
    else if(!inn(wx-1,wy)||!inn(wx+1,wy))c='#a9c5e6';                // 옆 테두리
    else if(!inn(wx,wy-1))c='#e4effb';                               // 윗 테두리(밝게)
    else if(!inn(wx,wy+2)||!inn(wx,wy+3))c='#c9ddf3';                // 아래쪽 그늘
    else c=CFD[(wy+PAD)*PW+wx+PAD]?'#dbe9f8':((wx*31+wy*17)%29===0?'#eaf3fc':'#ffffff'); // 덩어리 사이의 얕은 주름 + 가끔 반짝이는 점
    cg.fillStyle=c;cg.fillRect(wx,wy,1,1);
   }else if(inn(wx-2,wy-3)){cg.fillStyle='rgba(30,55,100,.22)';cg.fillRect(wx,wy,1,1);} // 땅에 드리운 그림자
  }}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){paint(x,y);const v=M.t[y*W+x];if((v===TL.WATER&&!th.night)||v===TL.FLOWER)anim.push([x,y,0]);}
 // 구름: 필드를 열 때 한꺼번에 계산하지 않고, 프레임마다 3ms씩만 나눠 칠해요. 다 칠해지면 0.9초 동안 서서히 밝아져요
 let cloudCv=null,cg=null,cloudQ=null,cloudQi=0,cloudDone=0;const CLOUD_FADE=900;
 if(!(th.city||th.obs||th.night||th.volc)){const q=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){let near=false;for(let dy=-1;dy<=1&&!near;dy++)for(let dx=-1;dx<=1;dx++)if(cloudAt(x+dx,y+dy)){near=true;break;}if(near)q.push([x,y]);}
  if(q.length){cloudCv=document.createElement('canvas');cloudCv.width=W*T;cloudCv.height=H*T;cg=cloudCv.getContext('2d');cg.imageSmoothingEnabled=false;cloudQ=q;}}
 function cloudStep(){if(!cloudQ||cloudDone)return;const t0=performance.now();
  while(cloudQi<cloudQ.length&&performance.now()-t0<3){const t=cloudQ[cloudQi++];cloudPaint(t[0],t[1]);}
  if(cloudQi>=cloudQ.length)cloudDone=performance.now();}
 const cloudBusy=()=>!!cloudQ&&(!cloudDone||performance.now()-cloudDone<CLOUD_FADE+80);
 // 그림 불러오기
 const imgs={};const getImg=src=>{if(!src)return null;let m=imgs[src];if(!m){m=imgs[src]=new Image();m.src=src;}return m.complete&&m.naturalWidth?m:null;};
 const marker=icon;
 // 개체
 const ents=M.ents.map(e=>{if(e.k==='sign'||e.k==='gate'||e.k==='portal'||e.k==='stairs')return e;if(e.k==='chest'||e.k==='dex'){e.mark=e.h?null:(e.k==='chest'?'🏺':'📖');return e;}const n=run.opts[e.i];return Object.assign(e,{n,lk:look(n),mark:(n.t==='event'&&n.ev==='wanderer')?'🧳':MARK[n.t]||'❓'});});
 const entAt=(x,y)=>ents.find(e=>e.x===x&&e.y===y);
 const walk=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&!BLOCK.has(M.t[y*W+x])&&!entAt(x,y);
 const lp0=(M.clr&&run.lastPos&&run.lastPos.k===(run.floor||1)+':'+(run.step|0))?run.lastPos:null,lp=(lp0&&!ents.some(q=>q.x===lp0.x&&q.y===lp0.y)&&!BLOCK.has(M.t[lp0.y*W+lp0.x]))?lp0:null; // 분기점을 끝냈다면 그 자리에서 다시 시작해요
 const p={x:lp?lp.x:M.sx,y:lp?lp.y:M.sy,px:(lp?lp.x:M.sx)*T,py:(lp?lp.y:M.sy)*T,dir:lp?(lp.dir|0):1,moving:false,t:0,nx:0,ny:0,par:0};
 // 입력
 const CAM={x:0,y:0},path=[];let ptalk=null;const held=[];let pend=-1,just=false,tms=0,fx={type:'in',t:0,dur:380},locked=false;
 const D={on:false,pages:[],pi:0,full:'',shown:0,lastN:-1,state:'',opt:{},sel:0};
 const setHeld=(d,on)=>{const i=held.indexOf(d);if(on){if(i<0){held.push(d);just=true;pend=d;}}else if(i>=0)held.splice(i,1);};
 const curDir=()=>held.length?held[held.length-1]:-1;
 function say(pages,opt){D.on=true;D.pages=pages.slice();D.pi=0;D.opt=opt||{};D.sel=0;showPage();sfx('tap');}
 function showPage(){D.full=D.pages[D.pi]||'';D.shown=0;D.lastN=-1;D.state='type';box.style.display='block';menuEl.style.display='none';more.style.visibility='hidden';txt.textContent='';gfSizeBox(box,txt,D.full);}
 function closeDlg(cb){D.on=false;D.state='';box.style.display='none';menuEl.style.display='none';if(cb)cb();}
 function openMenu(){D.state='menu';D.sel=0;menuEl.innerHTML=D.opt.menu.map((l,i)=>'<div data-i="'+i+'"'+(i===0?' class="on"':'')+'>'+esc(l)+'</div>').join('');menuEl.style.display='block';
  menuEl.querySelectorAll('div').forEach(d=>{d.onclick=ev=>{ev.stopPropagation();D.sel=+d.dataset.i;pickMenu();};});}
 function moveMenu(dv){if(D.state!=='menu')return;D.sel=(D.sel+dv+D.opt.menu.length)%D.opt.menu.length;menuEl.querySelectorAll('div').forEach((d,i)=>d.classList.toggle('on',i===D.sel));sfx('tap');}
 function pickMenu(){if(D.state!=='menu')return;const i=D.sel,pk=D.opt.pick;D.state='busy';closeDlg(()=>{if(pk)pk(i);});}
 function typeTick(dt){if(!D.on||D.state!=='type')return;D.shown+=dt/26;const n=Math.min(D.full.length,Math.floor(D.shown));
  if(n!==D.lastN){D.lastN=n;txt.textContent=D.full.slice(0,n);}
  if(n>=D.full.length){if(D.pi>=D.pages.length-1&&D.opt.menu)openMenu();else{D.state='wait';more.style.visibility='visible';}}}
 function advance(){if(!D.on)return;
  if(D.state==='type'){D.shown=D.full.length+1;typeTick(0);return;}
  if(D.state==='wait'){if(D.pi<D.pages.length-1){D.pi++;showPage();sfx('page');}else closeDlg(D.opt.done);return;}
  if(D.state==='menu')pickMenu();}
 function cancel(){if(!D.on)return;if(D.state==='menu'){D.sel=D.opt.menu.length-1;pickMenu();}else advance();}
 box.onclick=()=>advance();
 // 말 걸기
 function talk(e){
  if(locked||fx||gact)return;if(e.k==='node'){try{run.lastPos={x:p.x,y:p.y,dir:p.dir,k:(run.floor||1)+':'+(run.step|0)};}catch(er){}}if(e.k!=='gate')e.dir=OPP[p.dir]; // 게이트의 dir은 탑승 방향(±1)이라 덮어쓰면 안 돼요
  if(e.k==='sign'){const reg=SC_REGIONS[run.bg]||{place:''};
   say([ '표지판: 「'+reg.place+'」 '+(run.floor||1)+'층 · '+(M.boss?'보스가 기다리는 마지막 길':M.rv!=null?((M.rv+1)+'번째 갈림길 · 지나온 길'):(run.step+1)+'번째 갈림길'), '체력 '+run.hp+'/'+run.max+'  골드 '+run.gold+'\n덱 '+run.deck.length+'장 · 유물 '+run.relics.length+'개', M.boss?'이 길 끝에서 이 층의 주인이 기다린다…':M.rv!=null?'지나온 길이라 분기점은 없다. 못 열었던 상자를 찾아보자! 가운데 포탈을 타면 바로 지금 단계로 돌아간다.':'길 끝에서 기다리는 상대에게 다가가 말을 걸어 보자!' ]);return;}
  if(e.k==='stairs'){const nf=(run.floor||1)+1,solo=!(typeof rl2Co==='function'&&rl2Co()),menu=solo?['계단을 올라간다','여기서 모험을 마친다','더 둘러본다']:['계단을 올라간다','더 둘러본다'];
   say(['보스가 서 있던 자리 뒤로 오래된 돌계단이 모습을 드러냈다.','계단 위에서 따뜻한 빛이 내려온다. '+nf+'층으로 이어지는 길이다.',(solo?'':'친구도 계단 앞에서 준비되면 함께 올라가요.\n')+'올라갈까?'],{menu,pick:i=>{const a=menu[i];if(a==='계단을 올라간다')stairsGo();else if(a==='여기서 모험을 마친다')stairsStop();}});return;}
  if(e.k==='portal'&&e.nx&&typeof rl2Co==='function'&&rl2Co()){rl2FieldTalk(e);return;} // 2인: 분기점처럼 둘 다 같은 대사가 떠요
  if(e.k==='portal'&&e.nx){const left=ents.some(q=>q.k==='chest'&&q.h&&!q.done);
   say(['빛의 소용돌이가 일렁이고 있다.',left?'아직 열지 못한 상자가 남아 있는 것 같다…':'이 길의 분기점은 모두 끝났다.','포탈을 타면 다음 단계('+Math.min((run.step|0)+2,RL.steps+1)+'번째)로 간다. 갈까?'],{menu:['다음 단계로 간다','더 둘러본다'],pick:i=>{if(i===0)portalNext();}});return;}
  if(e.k==='portal'){const left=ents.some(q=>q.k==='chest'&&q.h&&!q.done);
   say(['빛의 소용돌이가 일렁이고 있다.',left?'아직 열지 못한 상자가 남아 있는 것 같다…':'이 길의 상자는 모두 열었다.','포탈을 타면 지금 단계('+Math.min(run.step+1,RL.steps+1)+'번째)로 바로 돌아간다. 돌아갈까?'],{menu:['돌아간다','더 둘러본다'],pick:i=>{if(i===0)portalBack();}});return;}
  if(e.k==='gate'){const G=gateDef(e);let id=(run.deck||[]).find(i=>MON[i]&&MON[i].types.indexOf(G.t)>=0);
   if(id==null&&e.helpId!=null&&MON[e.helpId])id=e.helpId; // 친구 힘으로 건넌 장해물은 돌아올 때도 같은 힘을 써요
   if(id==null){
    const hp=(typeof rl2HelpMon==='function')?rl2HelpMon(G.t):null;
    if(hp==null){say(G.no);return;}
    const pn=MON[hp].name;
    say([G.no[0],G.no[1],'친구의 '+pn+'의 힘을 빌리면 넘어갈 수 있을 것 같다.'],{menu:['친구에게 도움 요청하기','그냥 둔다'],pick:i=>{if(i!==0)return;
     const H=RL2P.help||(RL2P.help={cnt:0});H.req={e,hp};
     H.cb=d=>{if(!H.req||H.req.e!==e||!wrap.isConnected)return;H.req=null;closeDlg();
      if(d.ok){const id2=MON[d.id]?d.id:hp,nm2='「'+MON[id2].name+'」';e.helpId=id2;sfx('rare');
       const pg=d.auto?['친구가 곤란할 때 도와주는 것이 진정한 친구야!',MON[id2].name+'의 힘이 도와주기 버튼을 누르지 않아도 저절로 전해졌다!']:['친구가 '+MON[id2].name+'의 힘을 빌려줬다!'];
       say(pg.concat([G.ok(nm2)]),{done:()=>gStart(e,id2)});}
      else say([d.none?'친구에게는 지금 그 포켓몬이 없다고 한다…':d.busy?'친구가 지금 다른 일로 바쁜 것 같다. 잠시 뒤에 다시 부탁해 보자.':'친구가 지금은 도와줄 수 없다고 한다. 건너갈 수 없다…']);};
     rl2Send({t:'rl2-help',g:G.t,id:hp,nm:S.meta.name});
     say(['친구에게 도움을 요청했다! 대답을 기다리는 중…'],{menu:['요청 취소'],pick:()=>{H.req=null;}});}});
    return;}
   try{monSpr(spriteURL(id,'front'));}catch(er){}
   const nm='「'+MON[id].name+'」';
   say([(e.ride&&!e.out&&G.back)?G.back(nm):G.ask(nm)],{menu:['써 본다','그냥 둔다'],pick:i=>{if(i!==0)return;sfx('rare');say([G.ok(nm)],{done:()=>gStart(e,id)});}});return;}
  if(e.k==='chest'&&e.h){
   if(e.done){say(['상자는 텅 비어 있다.']);return;}
   say(['열어 보겠습니까?'],{menu:['열어 본다','그냥 간다'],pick:i=>{if(i===0)tryChest(e);}});return;} // '열어 본다'를 고르면 바로 자물쇠 문제 팝업이 떠요
  if(e.k==='chest'){const nr=(run.relics||[]).length;
   say(['길가에 낡은 보물상자가 놓여 있다.',nr?('뚜껑 틈으로 지금까지 모은 유물 '+nr+'개가 반짝인다!'):'열어 보니 아직 텅 비어 있다. 모험을 하다 보면 채워질 것 같다.','상자를 열어 볼까?'],{menu:['열어 본다','그냥 간다'],pick:i=>{if(i===0){sfx('rare');rlShowRelics();}}});return;}
  if(e.k==='dex'){const nd=(run.deck||[]).length;
   say(['길가에 포켓몬 도감이 펼쳐져 있다.','함께 모험 중인 포켓몬 '+nd+'장이 기록되어 있다.','도감을 펼쳐 볼까?'],{menu:['펼쳐 본다','그냥 간다'],pick:i=>{if(i===0){sfx('page');rlShowDeck();}}});return;}
  if(typeof rl2Co==='function'&&rl2Co()&&e.k==='node'){rl2FieldTalk(e);return;}const inf=info(e.n,e.i,run),sc=script(e.n,inf,run);
  say(sc.pages,{menu:sc.menu,pick:idx=>{if(idx===0)go(e);else say(['그래, 다른 길도 살펴보자.']);}});}
 const HLAVA={t:1,no:['용암이 길을 가로막고 있다. 건너편에 무언가 있는 것 같다…','불꽃 포켓몬이 있다면 용암 위를 건너갈 수 있을 것 같다.'],ask:n=>n+'의 힘으로 용암을 건널까?',back:n=>n+'의 힘으로 용암을 건너 돌아갈까?',ok:n=>n+'(이)가 불꽃을 두르고 나타났다! 등에 올라타고 용암을 건너자!'};
 const HELEC={t:4,no:['전류가 번쩍이는 장벽이 길을 가로막고 있다. 건너편에 무언가 있는 것 같다…','전기 포켓몬이 있다면 전류를 몸에 받아 건너갈 수 있을 것 같다.'],ask:n=>n+'의 힘으로 전류 장벽을 건널까?',back:n=>n+'의 힘으로 전류 장벽을 건너 돌아갈까?',ok:n=>n+'(이)가 찌릿찌릿 전기를 두르고 나타났다! 등에 올라타고 전류를 건너자!'};
 const HGAL={t:10,no:['은하수가 길을 가로막고 있다. 은하수 너머에 무언가 있는 것 같다…','에스퍼 포켓몬이 있다면 염동력으로 건너갈 수 있을 것 같다.'],ask:n=>n+'의 염동력으로 은하수를 건널까?',back:n=>n+'의 염동력으로 은하수를 건너 돌아갈까?',ok:n=>n+'(이)가 신비한 빛을 두르고 나타났다! 등에 올라타고 은하수를 건너자!'};
 const HICE={t:5,no:['시간이 멈춰 꽁꽁 얼어붙은 호수가 길을 가로막고 있다. 건너편에 무언가 있는 것 같다…','얼음 포켓몬이 있다면 호수를 얼려서 건널 수 있을 것 같다.'],ask:n=>n+'의 냉기로 호수를 얼려 건널까?',back:n=>n+'의 냉기로 호수를 얼려 돌아갈까?',ok:n=>n+'(이)가 호수를 꽁꽁 얼렸다! 등에 올라타고 얼음 위를 달리자!'};
 const HGHOST={t:13,no:['짙은 혼령의 안개가 길을 가로막고 있다. 안개 속에 무언가 있는 것 같다…','고스트 포켓몬이 있다면 안개를 뚫고 지나갈 수 있을 것 같다.'],ask:n=>n+'의 힘으로 혼령의 안개를 건널까?',back:n=>n+'의 힘으로 혼령의 안개를 건너 돌아갈까?',ok:n=>n+'(이)가 스르륵 모습을 드러냈다! 등에 올라타고 안개를 건너자!'};
 const GREG={
  '2:cloud':{t:9,no:['짙은 화산 연기가 길을 가로막고 있다. 연기 너머에 무언가 있는 것 같다…','비행 포켓몬이 있다면 연기 위로 날아갈 수 있을 것 같다.'],ask:n=>n+'의 비행으로 연기 위를 날아갈까?',back:n=>n+'의 비행으로 연기 위를 날아 돌아갈까?',ok:n=>n+'(이)가 날개를 펼쳤다! 등에 올라타고 연기 위를 날아가자!'},
  '0:cloud':{t:17,no:['폭신한 구름이 길 위에 떠 있다. 구름 위에 무언가 있는 것 같다…','페어리 포켓몬이 있다면 반짝이는 가루로 구름 위에 올려 줄 수 있을 것 같다.'],ask:n=>n+'의 힘으로 구름 위로 올라갈까?',back:n=>n+'의 힘으로 구름 위에서 내려갈까?',ok:n=>n+'(이)가 반짝이는 가루를 뿌렸다! 구름 위로 두둥실 올라가자!'},
  '5:tree':{t:7,no:['독 가시덩굴이 얽힌 나무가 길을 막고 있다. 뒤쪽에 무언가 있는 것 같다…','독 포켓몬이 있다면 독으로 덩굴을 녹여 없앨 수 있을 것 같다.'],ask:n=>n+'의 독으로 덩굴을 녹일까?',ok:n=>n+'(이)가 독액을 뿜어 덩굴을 녹였다!'},
  '5:rock':{t:11,no:['거대한 거미줄 고치가 길을 막고 있다. 뒤쪽에 무언가 있는 것 같다…','벌레 포켓몬이 있다면 고치를 갈라 열 수 있을 것 같다.'],ask:n=>n+'의 실 가르기를 쓸까?',ok:n=>n+'(이)가 실을 끊어 고치를 갈랐다!'},
  '0:tree':{t:3,no:['길을 막고 있는 나무가 수상하다. 뒤쪽에 무언가 있는 것 같다…','풀 포켓몬이 있다면 덩굴로 나무를 베어 낼 수 있을 것 같다.'],ask:n=>n+'의 나무 베기를 쓸까?',ok:n=>n+'의 나무 베기!'},
  '3:tree':{t:16,no:['낡은 건물 벽이 길을 막고 있다. 뒤쪽에 무언가 있는 것 같다…','강철 포켓몬이 있다면 벽을 뚫을 수 있을 것 같다.'],ask:n=>n+'의 힘으로 벽을 부술까?',ok:n=>n+'(이)가 강철 몸으로 벽을 부쉈다!'},
  '1:tree':{t:16,no:['커다란 야자수가 길을 막고 있다. 뒤쪽에 무언가 있는 것 같다…','강철 포켓몬이 있다면 야자수를 베어 낼 수 있을 것 같다.'],ask:n=>n+'의 나무 베기를 쓸까?',ok:n=>n+'의 나무 베기!'},
  '3:rock':{t:0,no:['커다란 쓰레기통이 길을 막고 있다. 뒤쪽에 무언가 있는 것 같다…','노말 포켓몬이 있다면 쓰레기통을 치울 수 있을 것 같다.'],ask:n=>n+'(이)가 쓰레기통을 치워 볼까?',ok:n=>n+'(이)가 힘껏 쓰레기통을 치웠다!'},
  '2:rock':{t:8,no:['갈라진 바위가 길을 막고 있다. 뒤쪽에 무언가 있는 것 같다…','땅 포켓몬이 있다면 바위를 무너뜨릴 수 있을 것 같다.'],ask:n=>n+'의 힘으로 바위를 무너뜨릴까?',ok:n=>n+'(이)가 땅을 울려 바위를 무너뜨렸다!'},
  '2:tree':{t:15,no:['그을린 나무가 길을 막고 있다. 뒤쪽에 무언가 있는 것 같다…','악 포켓몬이 있다면 쓰러뜨릴 수 있을 것 같다.'],ask:n=>n+'의 힘으로 나무를 쓰러뜨릴까?',ok:n=>n+'(이)가 어둠의 힘으로 나무를 쓰러뜨렸다!'},
  '4:rock':{t:12,no:['커다란 운석이 길을 막고 있다. 뒤쪽에 무언가 있는 것 같다…','바위 포켓몬이 있다면 운석을 부술 수 있을 것 같다.'],ask:n=>n+'의 바위 깨기를 쓸까?',ok:n=>n+'의 바위 깨기!'},
  '4:tree':{t:14,no:['낡은 천문대 돔이 길을 막고 있다. 뒤쪽에 무언가 있는 것 같다…','드래곤 포켓몬이 있다면 돔을 부술 수 있을 것 같다.'],ask:n=>n+'의 용의 힘으로 돔을 부술까?',ok:n=>n+'(이)가 용의 힘으로 돔을 부쉈다!'}};
 const gateDef=e=>e.g==='water'?(run.bg===2?HLAVA:run.bg===4?HELEC:run.bg===5?HICE:HGATE.water):(e.g==='cloud'&&run.bg===4)?HGAL:(e.g==='cloud'&&run.bg===5)?HGHOST:(GREG[run.bg+':'+e.g]||HGATE[e.g]);
 const HGATE={
  water:{t:2,no:['넓은 물이 길을 가로막고 있다. 건너편에 무언가 있는 것 같다…','물 포켓몬이 있다면 파도타기로 건너갈 수 있을 것 같다.'],ask:n=>n+'의 파도타기를 쓸까?',back:n=>n+'의 파도타기로 되돌아갈까?',ok:n=>n+'의 파도타기! 등에 올라타고 물을 건너자!'},
  tree:{t:16,no:['길을 막고 있는 나무가 수상하다. 뒤쪽에 무언가 있는 것 같다…','강철 포켓몬이 있다면 나무를 베어 낼 수 있을 것 같다.'],ask:n=>n+'의 나무 베기를 쓸까?',ok:n=>n+'의 나무 베기!'},
  rock:{t:6,no:['커다란 바위가 길을 막고 있다. 뒤쪽에 무언가 있는 것 같다…','격투 포켓몬이 있다면 바위를 부술 수 있을 것 같다.'],ask:n=>n+'의 바위 깨기를 쓸까?',ok:n=>n+'의 바위 깨기!'},
  cloud:{t:9,no:['구름이 길을 가로막고 있다. 구름 위에 무언가 있는 것 같다…','비행 포켓몬이 있다면 날아서 갈 수 있을 것 같다.'],ask:n=>n+'의 비행으로 구름 위를 날아갈까?',back:n=>n+'의 비행으로 구름 위를 날아 돌아갈까?',ok:n=>n+'(이)가 날개를 펴고 내려왔다! 등에 올라타자!'}};
 // ===== 길 열기 연출: 포켓몬이 튀어나와 등에 태워 건너 주거나(파도타기·구름), 직접 나무를 베고 바위를 부숴요 =====
 let gact=null;
 const gcolK=k=>run.bg===5?({water:'ice',cloud:'ghost',tree:'psn',rock:'web'}[k]||k):k==='water'?(run.bg===2?'lava':run.bg===4?'elec':'water'):(k==='cloud'&&run.bg===4)?'gal':(k==='cloud'&&run.bg===0)?'fairy':(k==='cloud'&&run.bg===2)?'smoke':k;
 const GCOL={smoke:['#b0a098','#645652','#ff9a3a'],fairy:['#ffd0f0','#ff9ad8','#ffffff'],ice:['#e8fbff','#9fe6ff','#ffffff'],ghost:['#c8a8ff','#7a5ac8','#ffffff'],psn:['#c86ae0','#7a3aa8','#9af06a'],web:['#ffffff','#d8e0ea','#b8c4d4'],gal:['#ff9af0','#7ae0ff','#ffffff'],elec:['#ffe45a','#7ae0ff','#fffbd0'],lava:['#ffd23a','#ff7a2a','#fff2a0'],water:['#bfe6ff','#5aaaf0','#ffffff'],tree:['#6fcf5a','#3f9a24','#b8e86a'],rock:['#b0a090','#8a7a6a','#d8d0c0'],cloud:['#ffffff','#dff3ff','#bfe0ff']};
 const gEz=u=>u<=0?0:u>=1?1:1-(1-u)*(1-u),gLp=(a,b,u)=>a+(b-a)*u;
 function gParts(a,x,y,n,cols,sp){for(let i=0;i<n;i++){const an=Math.random()*6.283,v=(.4+Math.random()*.8)*sp;a.parts.push({x,y,vx:Math.cos(an)*v,vy:Math.sin(an)*v-sp*.35,life:0,max:450+Math.random()*350,c:cols[i%cols.length],s:i%3===0?2:1});}}
 function gMon(id,x,y,sc){const sp=monSpr(spriteURL(id,'front'));if(!sp){shadow(x+8,y+13,5);return;}
  const rs=monSized(sp,id,'normal',KE),m=rs?0:sprScale(sp,'normal',KE),cvs=rs?rs.cv:sp.cv,dw=(rs?rs.w:sp.w*m)*sc,dh=(rs?rs.h:sp.h*m)*sc;if(dw<1||dh<1)return;
  g.drawImage(cvs,Math.round((x+8)*KE-dw/2)/KE,Math.round((y+15)*KE-dh+(rs?0:sp.pad*m*sc))/KE,dw/KE,dh/KE);}
 function gStart(e,id){
  const a={k:e.ride?'ride':'smash',t:0,e,id,g:e.g,parts:[],mx:0,my:0,sc:0,up:0,arc:0};
  if(e.ride){
   // 탑승 방향(±1): 게이트가 만들어질 때 정해 둔 값. out 게이트(바깥쪽)는 안쪽으로, 안쪽 게이트는 바깥쪽으로 건너요
   const bd=e.rd!=null?e.rd:(e.dir>0?1:-1),sd=e.out?-bd:bd;
   // 게이트 칸에서 출발해 물/구름이 이어지는 동안만 타고 가고, 그 밖의 첫 땅에서 내려요 (맵 밖으로는 절대 안 나가요)
   const liq=x=>{const v=M.t[e.y*W+x];return v===TL.WATER||v===TL.CLOUD;};
   const cells=[[e.x,e.y]];let lx=e.x+sd;
   while(lx>=1&&lx<W-1&&liq(lx)&&cells.length<10){cells.push([lx,e.y]);lx+=sd;}
   if(lx<0||lx>=W||liq(lx)||!walk(lx,e.y)){sfx('tap');say(['내려설 만한 곳이 없다…']);return;}
   cells.push([lx,e.y]); // 마지막 칸 = 물/구름 밖 땅 → 여기서 포켓몬에서 내려요
   a.cells=cells;a.S=[p.x,p.y];a.dur=350+300+330*(cells.length-1)+350;p.dir=sd>0?3:2;a.mx=cells[0][0];a.my=e.y;
   sfx('summon');gParts(a,a.mx*T+8,e.y*T+10,12,GCOL[gcolK(e.g)],70);}
  else{sfx('summon');a.P1=[p.x,p.y-1];a.G=[e.x,e.y];a.dur=1900;a.mx=p.x;a.my=p.y-1;p.dir=e.x>p.x?3:e.x<p.x?2:p.dir;gParts(a,a.mx*T+8,a.my*T+10,12,['#ffffff','#ffe27a','#bfe6ff'],70);}
  gact=a;}
 function gStep(dt){const a=gact,e=a.e,t=a.t+=dt;
  for(const q of a.parts){q.life+=dt;q.x+=q.vx*dt/1000;q.y+=q.vy*dt/1000;q.vy+=150*dt/1000;}a.parts=a.parts.filter(q=>q.life<q.max);
  if(a.k==='ride'){const C=a.cells,N=C.length-1,A=350,H=300,SG=330,tR=A+H,tE=tR+SG*N;a.arc=0;
   if(t<A){a.sc=gEz(t/A);a.up=0;}
   else if(t<tR){const u=(t-A)/H;a.sc=1;p.px=gLp(a.S[0],C[0][0],u)*T;p.py=gLp(a.S[1],C[0][1],u)*T;a.up=7*u+Math.sin(u*Math.PI)*5;}
   else if(t<tE){const i=Math.min(N-1,Math.floor((t-tR)/SG)),u=(t-tR-i*SG)/SG;a.sc=1;a.up=7;a.mx=gLp(C[i][0],C[i+1][0],u);p.px=a.mx*T;p.py=C[0][1]*T;if(Math.random()<.35)gParts(a,a.mx*T+8,C[0][1]*T+13,1,GCOL[gcolK(a.g)],25);}
   else{if(!a.dm){a.dm=1;gParts(a,C[N][0]*T+8,C[N][1]*T+12,10,GCOL[gcolK(a.g)],60);}a.sc=1-gEz((t-tE)/350);a.up=7*a.sc;a.mx=C[N][0];p.px=C[N][0]*T;p.py=C[N][1]*T;}
   if(t>=a.dur){p.x=C[N][0];p.y=C[N][1];p.px=p.x*T;p.py=p.y*T;p.moving=false;gact=null;sfx('tap');}return;}
  const P1=a.P1,Gc=a.G;
  if(t<300){a.sc=gEz(t/300);a.mx=P1[0];a.my=P1[1];a.arc=0;}
  else if(t<650){const u=(t-300)/350;a.sc=1;a.mx=gLp(P1[0],Gc[0],u*u);a.my=gLp(P1[1],Gc[1],u*u);a.arc=Math.sin(u*Math.PI)*6;}
  else if(t<1200){a.sc=1;a.mx=Gc[0];a.my=Gc[1];a.arc=0;}
  else if(t<1550){const u=(t-1200)/350;a.sc=1;a.mx=gLp(Gc[0],P1[0],u);a.my=gLp(Gc[1],P1[1],u);a.arc=Math.sin(u*Math.PI)*4;}
  else{a.sc=1-gEz((t-1550)/350);a.mx=P1[0];a.my=P1[1];a.arc=0;}
  if(t>=650&&!a.hit){a.hit=1;a.hitT=t;sfx('rare');gParts(a,Gc[0]*T+8,Gc[1]*T+8,a.g==='tree'?16:10,a.g==='tree'?GCOL.tree:['#ffffff','#ffd9a0','#ff9a3c'],80);}
  if(a.hit){const u=t-650;
   if(a.g==='tree'){e.gfx={k:'fall',u:Math.min(1,u/520)};if(u>=540)e.hide=1;}
   else if(!e.hide){if(u<220)e.gfx={k:'shake'};else{e.hide=1;e.gfx=null;gParts(a,Gc[0]*T+8,Gc[1]*T+8,22,GCOL.rock,95);}}}
  if(t>=1200&&!a.rm){a.rm=1;const k=ents.indexOf(e);if(k>=0)ents.splice(k,1);}
  if(t>=a.dur)gact=null;}
 function gRideBelow(){const a=gact,x=a.mx*T,y=a.my*T,bob=Math.round(Math.sin(tms/150));
  if(a.g==='water'){g.fillStyle=run.bg===2?'rgba(255,200,60,.85)':run.bg===4?'rgba(255,240,120,.9)':'rgba(255,255,255,.8)';const w=((tms/120)|0);for(let i=0;i<3;i++)g.fillRect(x+2-i*2+((w+i)%3),y+13+i,12+i*4-(w%2),1);}
  else{g.fillStyle='rgba(255,255,255,.92)';g.fillRect(x+1,y+12,14,3);g.fillRect(x+3,y+10,5,3);g.fillRect(x+8,y+9,5,4);g.fillStyle='rgba(190,225,255,.9)';g.fillRect(x+2,y+14,12,1);}
  gMon(a.id,x,y+2+bob,a.sc);}
 function gDraw(){const a=gact;if(!a)return;
  if(a.k==='smash'){gMon(a.id,a.mx*T,a.my*T-a.arc,a.sc);
   if(a.hit&&a.t-a.hitT<280){const k=(a.t-a.hitT)/280,gx=a.G[0]*T,gy=a.G[1]*T;g.globalAlpha=1-k;g.fillStyle='#fff';
    if(a.g==='tree'){for(let i=0;i<3;i++){const o=i*4-4;g.fillRect(gx+2+o,gy+1+Math.round(k*3),2,2);g.fillRect(gx+4+o,gy+4+Math.round(k*4),2,2);g.fillRect(gx+6+o,gy+7+Math.round(k*5),2,2);g.fillRect(gx+8+o,gy+10+Math.round(k*6),2,2);}}
    else{const r=3+Math.round(k*8);g.fillRect(gx+8-r,gy+8,r*2,2);g.fillRect(gx+7,gy+8-r,2,r*2);}
    g.globalAlpha=1;}}
  a.parts.forEach(q=>{g.globalAlpha=Math.max(0,1-q.life/q.max);g.fillStyle=q.c;g.fillRect(Math.round(q.x),Math.round(q.y),q.s,q.s);});g.globalAlpha=1;}
 // 숨은 상자: 골드 30 · 코인 50 · 사탕 20 · 에너지 1 · 유물 — 각각 20%
 // 숨은 상자: 문제 1개를 맞혀야 열려요 (틀리면 상자는 그대로, 다시 도전할 수 있어요)
 async function tryChest(e){
  if(locked||e.done)return;locked=true;const wasBig=BIG;let r={ok:true};
  /* 크게 보기는 그대로 두고, 문제 창이 큰 화면 위로 올라와요 (껐다 켜면 어색해서) */
  try{r=await rlAsk('🔒 상자의 자물쇠',partnerId());run.q=(run.q||0)+1;if(r.ok)run.qc=(run.qc||0)+1;}catch(er){console.warn('chest ask',er);r={ok:true};}
  finally{locked=false;}
  try{rlSave();}catch(er){}
  if(r.ok){sfx('ok');say(['딸깍! 자물쇠가 풀렸다!'],{done:()=>openHidden(e)});}
  else{sfx('wrong');say(['자물쇠가 꿈쩍도 하지 않는다…','다시 풀어 보면 열릴 것 같다.']);}}
 function openHidden(e){
  e.done=1;run.hcOpen=run.hcOpen||{};run.hcOpen[(run.floor||1)+':'+(M.rv!=null?M.rv:(run.step|0))]=1;
  const r=Math.random();let msg;
  const gold=()=>'금화가 와르르 쏟아졌다! 🪙 골드 +'+rlGold(30);
  let rk='gold',ric='';
  if(r<.2)msg=gold();
  else if(r<.4){rk='coin';S.meta.coins=(S.meta.coins||0)+50;msg='반짝이는 코인 주머니다! 🪙 코인 +50 (모험이 끝나도 남아요)';}
  else if(r<.6){rk='candy';S.meta.candy=(S.meta.candy||0)+20;msg='달콤한 사탕이 가득 들어 있다! 🍬 사탕 +20 (진화에 쓸 수 있어요)';}
  else if(r<.8){const g=gd(S.meta);rk='energy';g.spent=(g.spent||0)-1;msg='따뜻한 기운이 느껴진다! ⚡ 에너지 +1 (정원의 알에 줄 수 있어요)';}
  else{const d=rlRelicOffer(run,1)[0];if(d){rk='relic';ric=d.ic;rlGetRelic(d.k);msg='바닥에 유물이 숨겨져 있었다! '+d.ic+' '+d.n;}else msg=gold();}
  try{rlSave();}catch(er){}
  sfx('rare');showReward(rk,ric);say(['끼이이익… 상자가 열렸다!',msg]);}
 function go(e){try{const vv=q('#view');window.__gfKeep={big:BIG,y:vv?vv.scrollTop:0,t:Date.now()};}catch(er){}locked=true;const fight=e.n.t==='normal'||e.n.t==='elite'||e.n.t==='boss'||e.n.t==='gym';sfx(fight?'summon':'rare');
  fx={type:fight?'battle':'out',t:0,dur:fight?760:420,cb:()=>{try{teardownForText();rlPick(e.i);}catch(err){console.warn('field pick',err);try{rlRenderMap();}catch(e2){}}}};}
 function portalScript(){const left=ents.some(q=>q.k==='chest'&&q.h&&!q.done);
  return{pages:['빛의 소용돌이가 일렁이고 있다.',left?'아직 열지 못한 상자가 남아 있는 것 같다…':'이 길의 분기점은 모두 끝났다.','포탈을 타면 다음 단계('+Math.min((run.step|0)+2,RL.steps+1)+'번째)로 간다. 갈까?'],menu:['다음 단계로 간다','더 둘러본다']};}
 function portalBack(){try{const vv=q('#view');window.__gfKeep={big:BIG,y:vv?vv.scrollTop:0,t:Date.now()};}catch(er){}locked=true;sfx('rare');
  fx={type:'out',t:0,dur:520,cb:()=>{try{teardownForText();const r=RUN();if(r){r.rv=null;rlSave();}rlRenderMap();}catch(err){console.warn('portal back',err);try{rlRenderMap();}catch(e2){}}}};}
 function stairsGo(){
  if(typeof rl2Co==='function'&&rl2Co()){sfx('rare');try{__adv();}catch(er){console.warn('stairs',er);}try{toast('⏳ 친구도 준비되면 함께 다음 층으로 올라가요');}catch(er){}return;} // 2인: 둘 다 준비되면 같이 올라가요
  try{const vv=q('#view');window.__gfKeep={big:BIG,y:vv?vv.scrollTop:0,t:Date.now()};}catch(er){}locked=true;sfx('rare');
  fx={type:'out',t:0,dur:520,cb:()=>{try{teardownForText();const r=RUN();if(r){r.bclr=null;rlSave();}rlNextFloor();}catch(err){console.warn('stairs',err);try{rlRenderMap();}catch(e2){}}}};}
 function stairsStop(){(async()=>{try{if(await confirmBox('여기서 모험을 마칠까요?<br><span class=mut style="font-size:14px">지금까지의 클리어 보상을 정산해요.</span>','그만두기','계속하기')){teardownForText();rlEnd(true,'stop');}}catch(er){console.warn('stairs stop',er);}})();}
 function portalNext(){
  if(typeof rl2Co==='function'&&rl2Co()){sfx('rare');try{__adv();}catch(er){console.warn('portal next',er);}try{toast('⏳ 친구도 준비되면 함께 다음 단계로 가요');}catch(er){}return;} // 2인: 둘 다 준비되면 같이 넘어가요
  try{const vv=q('#view');window.__gfKeep={big:BIG,y:vv?vv.scrollTop:0,t:Date.now()};}catch(er){}locked=true;sfx('rare');
  fx={type:'out',t:0,dur:520,cb:()=>{try{teardownForText();const r=RUN();if(r){r.clr=null;rlSave();}__adv();}catch(err){console.warn('portal next',err);try{rlRenderMap();}catch(e2){}}}};}
 function teardownForText(){try{dispose();}catch(er){}try{wrap.remove();}catch(er){}try{if(gfSp&&gfSp.parentNode)gfSp.remove();}catch(er){}document.body.classList.remove('gfBig');ST=null;window.__rlHudPing=null;}
 function action(){if(locked||fx||gact)return;if(D.on){advance();return;}const t=[p.x+DX[p.dir],p.y+DY[p.dir]],e=entAt(t[0],t[1]);if(e&&!p.moving)talk(e);}
 function back(){if(D.on)cancel();}
 // 이동
 function startMove(d){p.dir=d;const nx=p.x+DX[d],ny=p.y+DY[d],e=entAt(nx,ny);
  if(e){if(just){just=false;talk(e);}return;}
  if(!walk(nx,ny))return;p.moving=true;p.t=0;p.rs=0;p.nx=nx;p.ny=ny;}
 function update(dt){
  tms+=dt;typeTick(dt);stepLeaves(dt);try{if(typeof rl2FieldTick==='function')rl2FieldTick(p);}catch(er){}
  // 열린 상자는 주인공이 곁에 있는 동안만 보물이 가득해요. 두 칸 이상 떠나면 빈 상자로 남아요
  ents.forEach(e=>{if(e.k==='chest'&&e.h&&e.done&&!e.emp&&Math.max(Math.abs(p.x-e.x),Math.abs(p.y-e.y))>1)e.emp=1;});
  if(tms%900<dt){}
  const f=Math.floor(tms/480)&1;if(!document.documentElement.classList.contains('idleSleep')&&(f!==af||AX.x!==(CAM.x/T|0)||AX.y!==(CAM.y/T|0))){af=f;AX.x=CAM.x/T|0;AX.y=CAM.y/T|0;const vw2=Math.ceil(((typeof VW==='number'&&VW)||CW)/T)+4,vh2=Math.ceil(((typeof VH==='number'&&VH)||CH)/T)+4,x0=AX.x-4,y0=AX.y-4;for(let i=0;i<anim.length;i++){const a=anim[i];if(a[2]!==f&&a[0]>=x0&&a[0]<=x0+vw2+4&&a[1]>=y0&&a[1]<=y0+vh2+4){a[2]=f;paint(a[0],a[1]);}}}
  if(fx){fx.t+=dt;if(fx.t>=fx.dur){const cb=fx.cb;if(fx.type==='in')fx=null;else{fx.t=fx.dur;fx.cb=null;if(cb)cb();}}}
  if(gact){try{gStep(dt);}catch(er){console.warn('gate act',er);gact=null;}return;}
  if(locked||fx&&fx.type!=='in')return;
  let guard=2;
  while(guard--){
   if(p.moving){p.t+=dt/MOVE_MS;dt=0;if(!p.rs&&p.t>=.4){p.rs=1;if(tallAt(p.nx,p.ny))startRustle(p.nx,p.ny);}if(p.t>=1){dt=Math.min(40,(p.t-1)*MOVE_MS);p.x=p.nx;p.y=p.ny;p.moving=false;p.par^=1;p.px=p.x*T;p.py=p.y*T;}else{p.px=(p.x+(p.nx-p.x)*p.t)*T;p.py=(p.y+(p.ny-p.y)*p.t)*T;break;}}
   if(!p.moving&&!D.on){let d=curDir();if(d>=0)path.length=0;else if(pend>=0)d=pend;pend=-1;if(d<0&&path.length)d=path.shift();if(d<0&&ptalk&&!path.length){const e=ptalk.e;ptalk=null;p.dir=ptalk0(e);if(Math.abs(e.x-p.x)+Math.abs(e.y-p.y)===1)talk(e);break;}if(d>=0){startMove(d);if(!p.moving){path.length=0;ptalk=null;}}else break;if(!p.moving)break;}else break;}
  if(!p.moving){p.px=p.x*T;p.py=p.y*T;}
  if(!held.length)just=false;
 }
 // 그리기
 function sprite(id,dir,walkF,x,y,flip){const row=(walkF?3:0)+(dir===0?0:dir===1?1:2);let at=atlas,col=id;if(id>=1000){const alt=rl2AltAtlas();if(alt){at=alt;col=(id-1000)===25?1:0;}else col=id-1000;}
  if(dir===3||flip){g.save();g.translate(x+16,y);g.scale(-1,1);g.drawImage(at,col*16,row*16,16,16,0,0,16,16);g.restore();}
  else g.drawImage(at,col*16,row*16,16,16,x,y,16,16);}
 function shadow(cx,cy,rx){g.fillStyle='rgba(20,20,40,.28)';g.fillRect(cx-rx,cy,rx*2,2);g.fillRect(cx-rx+1,cy-1,rx*2-2,1);g.fillRect(cx-rx+1,cy+2,rx*2-2,1);}
 let CLOCKC=null;
 function clockSheet(){if(CLOCKC)return CLOCKC;const c=document.createElement('canvas');c.width=16;c.height=32;const g2=c.getContext('2d'),R3=(x,y,w,h,k)=>{g2.fillStyle=k;g2.fillRect(x,y,w,h);},disc=(x,y,r,k)=>{g2.fillStyle=k;g2.beginPath();g2.arc(x,y,r,0,6.283);g2.fill();};
  R3(4,28,8,3,'#0a1218');R3(5,28,6,2,'#5e6c84');R3(6,14,4,15,'#0a1218');R3(7,14,2,14,'#3e4a60');R3(7,14,1,14,'#6a7890');
  disc(8,8,7.5,'#0a1218');disc(8,8,6.5,'#ff4a5a');disc(8,8,5,'#1a1630');
  R3(8,4,1,1,'#ff9aa4');return CLOCKC=(()=>{R3(8,11,1,1,'#ff9aa4');R3(4,8,1,1,'#ff9aa4');R3(11,8,1,1,'#ff9aa4');R3(8,5,1,4,'#ffd0d0');R3(8,8,3,1,'#ffd0d0');return c;})();}
 let SCOPEC=null;
 function scopeSheet(){if(SCOPEC)return SCOPEC;const c=document.createElement('canvas');c.width=16;c.height=32;const g2=c.getContext('2d'),R3=(x,y,w,h,k)=>{g2.fillStyle=k;g2.fillRect(x,y,w,h);};
  for(let k=0;k<12;k++){R3(7-Math.floor(k*.5),18+k,1,1,'#2a2444');R3(8+Math.floor(k*.5),18+k,1,1,'#2a2444');}R3(7,18,2,13,'#3a3258');R3(3,30,10,2,'#1a1640');R3(4,30,8,1,'#5c58a0');
  R3(5,15,6,4,'#1a1640');R3(6,16,4,2,'#5c58a0');
  for(let k=0;k<11;k++){R3(4+k,14-k,3,3,'#1a1640');R3(5+k,15-k,1,1,'#e8c860');R3(6+k,15-k,1,1,'#c8a030');}
  R3(13,2,3,3,'#1a1640');R3(14,3,1,1,'#7ae0ff');R3(3,14,3,3,'#1a1640');R3(4,15,1,1,'#5c58a0');return SCOPEC=c;}
 let TORCHC=null;
 function torchSheet(){if(TORCHC)return TORCHC;const c=document.createElement('canvas');c.width=16;c.height=32;const g2=c.getContext('2d'),R3=(x,y,w,h,k)=>{g2.fillStyle=k;g2.fillRect(x,y,w,h);};
  R3(4,28,8,3,'#1a1016');R3(5,28,6,2,'#4a3a38');R3(6,14,4,15,'#1a1016');R3(7,14,2,14,'#4a3a38');R3(7,14,1,14,'#6a5a58');R3(7,18,2,1,'#2e2220');R3(7,23,2,1,'#2e2220');
  R3(3,10,10,5,'#1a1016');R3(4,11,8,3,'#6a5a58');R3(4,11,8,1,'#8a7a78');R3(5,13,6,1,'#ff7a2a');return TORCHC=c;}
 let UMBC=null;
 function umbSheet(){if(UMBC)return UMBC;const c=document.createElement('canvas');c.width=16;c.height=32;const g2=c.getContext('2d'),R3=(x,y,w,h,k)=>{g2.fillStyle=k;g2.fillRect(x,y,w,h);};
  R3(4,29,8,2,'rgba(120,90,40,.35)');R3(7,9,2,21,'#3a2a18');R3(7,9,1,21,'#e8e0d0');
  const rows=[[5,11],[3,13],[2,14],[1,15],[0,16],[0,16]];
  rows.forEach((r,k)=>{R3(r[0]-(k<5?1:0),2+k,r[1]-r[0]+(k<5?2:0),1,'#3a2a18');});
  rows.forEach((r,k)=>{for(let x=r[0];x<r[1];x++)R3(x,2+k,1,1,((x>>2)&1)?'#fff4e8':'#e5534b');});
  R3(0,8,16,1,'#3a2a18');for(let x=0;x<16;x+=4)R3(x,8,2,1,((x>>2)&1)?'#fff4e8':'#e5534b');R3(7,0,2,2,'#3a2a18');return UMBC=c;}
 let LAMPC=null;
 function lampSheet(){if(LAMPC)return LAMPC;const c=document.createElement('canvas');c.width=16;c.height=32;const g2=c.getContext('2d'),R3=(x,y,w,h,k)=>{g2.fillStyle=k;g2.fillRect(x,y,w,h);};
  R3(5,28,6,3,'#2a2038');R3(6,28,4,2,'#6a7290');R3(7,6,2,23,'#2a2038');R3(7,7,1,21,'#8a94b0');R3(8,10,1,18,'#4a5470');
  R3(3,2,10,5,'#2a2038');R3(4,3,8,3,'#ffe58a');R3(4,3,8,1,'#fff6c4');R3(2,1,12,2,'#2a2038');R3(3,1,10,1,'#6a7290');R3(6,0,4,1,'#2a2038');return LAMPC=c;}
 function drawDecor(d){const H2=hallSheets(),x=d.x*T,y=d.y*T;if(d.k==='clock'){g.drawImage(clockSheet(),x,y+16-32);g.globalAlpha=.12+.06*Math.sin(tms/700+d.x);g.fillStyle='#ff4a5a';g.fillRect(x-2,y-18,20,18);g.fillRect(x-4,y-15,24,12);g.globalAlpha=1;return;}if(d.k==='scope'){g.drawImage(scopeSheet(),x,y+16-32);const tw=((tms/400+d.x)|0)%3;g.fillStyle=tw===0?'#ffffff':'#fff4a0';g.fillRect(x+13,y-27,1,1);if(tw===0){g.fillRect(x+12,y-27,3,1);g.fillRect(x+13,y-28,1,3);}return;}if(d.k==='torch'){g.drawImage(torchSheet(),x,y+16-32);const fl=Math.sin(tms/90+d.x)*.9,fh=5+Math.round(fl+Math.sin(tms/53+d.x*3)*.8),b0=y+16-32+11;g.fillStyle='#ff7a2a';g.fillRect(x+4,b0-fh,8,fh);g.fillStyle='#ffb830';g.fillRect(x+5,b0-fh+1,6,fh-1);g.fillStyle='#fff0a0';g.fillRect(x+6,b0-fh+2,4,Math.max(1,fh-3));g.fillStyle='#ff7a2a';g.fillRect(x+7,b0-fh-1,2,2);g.globalAlpha=.16+.05*Math.sin(tms/200+d.x);g.fillStyle='#ff9a3a';g.fillRect(x-2,b0-fh-4,20,fh+8);g.fillRect(x-4,b0-fh-1,24,fh+3);g.globalAlpha=1;return;}
  if(d.k==='umb'){g.drawImage(umbSheet(),x,y+16-32);return;}if(d.k==='lamp'){g.drawImage(lampSheet(),x,y+16-32);g.globalAlpha=.16+.05*Math.sin(tms/500+d.x);g.fillStyle='#ffe58a';g.fillRect(x-1,y-14,18,8);g.fillRect(x-3,y-12,22,5);g.globalAlpha=1;return;}if(d.k==='pil'){g.drawImage(H2.pil,x,y+16-32);return;}
  g.drawImage(H2.brz,x,y);const fl=Math.sin(tms/90+d.x)*.9,fh=4+Math.round(fl+Math.sin(tms/53+d.x*3)*.8);
  g.save();const gr=g.createRadialGradient(x+8,y+1,1,x+8,y+1,20);gr.addColorStop(0,'rgba(255,170,60,.38)');gr.addColorStop(1,'rgba(255,170,60,0)');g.fillStyle=gr;g.fillRect(x-14,y-20,44,44);g.restore();
  R2(x+4,y+3-fh,8,fh,'#ff7a2a');R2(x+5,y+3-fh+1,6,fh-1,'#ffb830');R2(x+6,y+3-fh+2,4,Math.max(1,fh-3),'#fff0a0');R2(x+7,y+3-fh-1,2,2,'#ff7a2a');}
 function drawHallBack(){const H2=hallSheets();g.drawImage(H2.fac,M.sx*T+8-72,4*T-64);const cx0=M.sx*T+8,gr=g.createRadialGradient(cx0,4*T-10,2,cx0,4*T-10,28);const a=.3+.1*Math.sin(tms/380);gr.addColorStop(0,'rgba(255,190,90,'+a+')');gr.addColorStop(1,'rgba(255,120,40,0)');g.save();g.fillStyle=gr;g.fillRect(cx0-32,4*T-44,64,44);g.restore();}
 function drawGym(e){const k=bkey(e.n),B=BLD[k];g.drawImage(bldSheet(k,e.n),e.x*T+8-B.w/2,e.y*T-B.h);}
 const R2=(x,y,w,h,k)=>{g.fillStyle=k;g.fillRect(x,y,w,h);};
 // 건물 쪽으로 화면을 살짝 끌어올리는 값은 한 번에 바뀌지 않고 부드럽게 따라가요 (걸을 때 화면이 휙 튀지 않게)
 let gbV=null,gbT=0;const gbSm=t=>{const n=tms,dt=Math.min(60,Math.max(0,n-gbT));gbT=n;if(gbV===null)gbV=t;else gbV+=(t-gbV)*(1-Math.exp(-dt/220));return gbV;};
 function drawEnt(e){
  if(e.k==='sign'){g.drawImage(sheet,15*T,0,T,T,e.x*T,e.y*T,T,T);return;}
  if(e.k==='stairs'){const x=e.x*T,y=e.y*T,u=Math.min(1,tms/900),cxp=x+8; // 계단이 아래에서부터 차오르듯 나타나요
   const lg=g.createLinearGradient(0,y-12,0,y+4);lg.addColorStop(0,'rgba(255,248,200,0)');lg.addColorStop(1,'rgba(255,248,200,'+((.5+.15*Math.sin(tms/260))*u)+')');g.fillStyle=lg;g.fillRect(x+3,y-12,10,16);
   shadow(x+8,y+15,8);
   [[0,12],[2,9],[4,6],[5,3]].forEach((s2,i)=>{const a=Math.max(0,Math.min(1,u*4.6-i*.9));if(a<=0)return;const ins=s2[0],yy=y+s2[1]+Math.round((1-a)*3),w=16-ins*2;
    g.globalAlpha=a;g.fillStyle='#2a2038';g.fillRect(x+ins-1,yy-1,w+2,4);g.fillStyle='#f4efff';g.fillRect(x+ins,yy,w,1);g.fillStyle=i%2?'#c9c0e8':'#b9b0dc';g.fillRect(x+ins,yy+1,w,2);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(x+ins,yy+1,1,2);});
   g.globalAlpha=1;g.fillStyle='#fff';for(let k=0;k<3;k++){const ph=(tms/900+k/3)%1;g.globalAlpha=(1-ph)*u;g.fillRect(Math.round(cxp-4+k*4+Math.sin(tms/300+k)*1.5),Math.round(y+3-ph*16),1,1);}g.globalAlpha=1;
   return;}
  if(e.k==='portal'){const x=e.x*T,y=e.y*T,f=(tms/120)|0,cxp=x+8,cyp=y+5;
   shadow(x+8,y+14,7);
   const gl=.3+.12*Math.sin(tms/240),gr=g.createRadialGradient(cxp,cyp,1,cxp,cyp,15);gr.addColorStop(0,'rgba(170,140,255,'+gl+')');gr.addColorStop(1,'rgba(170,140,255,0)');g.fillStyle=gr;g.fillRect(x-8,y-12,32,32);
   for(let dy=-9;dy<=9;dy++){const u=dy/9.5,w=Math.round(6.4*Math.sqrt(Math.max(0,1-u*u)));if(w<=0)continue;const yy=cyp+dy;
    g.fillStyle='#2a1a5e';g.fillRect(cxp-w-1,yy,w*2+2,1);
    g.fillStyle='#1a0a40';g.fillRect(cxp-w+1,yy,Math.max(0,w*2-2),1);
    const c=['#7ae0ff','#b08cff','#e8d8ff','#b08cff'][(dy+f+40)&3];g.fillStyle=c;g.fillRect(cxp-w,yy,1,1);g.fillRect(cxp+w-1,yy,1,1);
    if(Math.abs(dy)>=8){g.fillRect(cxp-w,yy,w*2,1);}}
   g.fillStyle='#fff';for(let i=0;i<3;i++){const a=tms/300+i*2.1,sx2=Math.round(cxp+Math.cos(a)*3),sy2=Math.round(cyp+Math.sin(a*1.3)*6);g.fillRect(sx2,sy2,1,1);}
   return;}
  if(e.k==='gate'){if(e.hide||e.g==='cloud')return;const si=e.g==='water'?(th.night?8+(((e.x*5+e.y*11)%4===0)?1:0):8+(((tms/450)|0)&1)):e.g==='tree'?7:e.g==='rock'?12:20+((e.x+e.y)&1),f=e.gfx;
   if(f&&f.k==='fall'){g.save();g.globalAlpha=Math.max(0,1-f.u*.75);g.translate(e.x*T+8,e.y*T+15);g.rotate(f.u*f.u*1.45*(e.dir>0?-1:1));g.drawImage(sheet,si*T,0,T,T,-8,-15,T,T);g.restore();return;}
   g.drawImage(sheet,si*T,0,T,T,e.x*T+(f&&f.k==='shake'?(((tms/40)|0)%2?1:-1):0),e.y*T,T,T);return;}
  if(e.k==='chest'||e.k==='dex'){const x=e.x*T,y=e.y*T,sp=e.k==='chest'?propSheet(e.h&&e.done?(e.emp?'chestEmpty':'chestOpen'):'chest'):dexSheet(),pw=sp.width,ph=sp.height,bob=Math.round(Math.sin(tms/320+e.x*1.3)),ty=y+16-ph;
   shadow(x+8,y+14,Math.min(10,pw/2-1));g.drawImage(sp,x+8-pw/2,ty);
   if(((tms/300)|0)%5===0){const od=e.k==='chest'&&e.h&&e.done&&!e.emp,sx=od?x+14:x+12,sy=od?ty+7:ty+1;g.fillStyle='#fff';g.fillRect(sx,sy,1,3);g.fillRect(sx-1,sy+1,3,1);}
   const im=e.mark?marker(e.mark):null;if(im)g.drawImage(im,x,ty-17+(bob>0?1:0),16,16);return;}
  const x=e.x*T,y=e.y*T,lk=e.lk,bob=Math.round(Math.sin(tms/320+e.i*1.7));let top=y;
  if(lk.v==='mon'){const sp=monSpr(spriteURL(e.n.id,'front'));
   if(sp){const rs=monSized(sp,e.n.id,e.n.t,KE),m=rs?0:sprScale(sp,e.n.t,KE),cvs=rs?rs.cv:sp.cv,dw=rs?rs.w:sp.w*m,dh=rs?rs.h:sp.h*m,gxd=Math.round((x+8)*KE-dw/2),gyd=Math.round((y+15)*KE-dh+(rs?0:sp.pad*m)-(bob>0?KE/2:0)),rx=Math.max(4,Math.min(24,Math.round(dw/KE/3)+1));
    if(e.n.t==='elite'||e.n.t==='boss'){g.fillStyle=e.n.t==='boss'?'rgba(255,210,60,'+(.26+.1*Math.sin(tms/300))+')':'rgba(255,70,90,'+(.2+.1*Math.sin(tms/260))+')';
     g.fillRect(x+8-rx-2,y+12,(rx+2)*2,4);g.fillRect(x+8-rx,y+11,rx*2,6);}
    shadow(x+8,y+13,rx);g.drawImage(cvs,gxd/KE,gyd/KE,dw/KE,dh/KE);top=gyd/KE;}
   else{shadow(x+8,y+13,6);sprite(SPR.ball,0,false,x,y);}}
  else if(lk.v==='npc'){shadow(x+8,y+13,5);sprite(lk.sp,e.dir,((tms/700|0)+e.i)%6===0,x,y-3);top=y-3;}
  else if(lk.v==='item'){shadow(x+8,y+13,5);sprite(SPR.ball,0,false,x,y-1+(bob>0?-1:0));if(((tms/300)|0)%4===0){g.fillStyle='#fff';g.fillRect(x+12,y+3,1,3);g.fillRect(x+11,y+4,3,1);}top=y;}
  else if(lk.v==='prop'){const pk=lk.k;
   if(pk==='egg'){ // 둥지 + 정원의 알 (살짝 둥실, 은은한 빛)
    shadow(x+8,y+14,7);R2(x+1,y+12,14,3,'#8a5a30');R2(x+2,y+11,12,2,'#d8a850');R2(x+3,y+10,2,1,'#f0cc78');R2(x+11,y+10,2,1,'#f0cc78');R2(x+4,y+14,8,1,'#5a3a20');
    const ty=((e.n&&e.n.sc)||0)%18,im=eggImg(ty),b2=Math.sin(tms/420+e.i)*.8,gl=.28+.14*Math.sin(tms/300);
    g.save();const gr=g.createRadialGradient(x+8,y+3,1,x+8,y+3,14);gr.addColorStop(0,'rgba(255,236,150,'+gl+')');gr.addColorStop(1,'rgba(255,236,150,0)');g.fillStyle=gr;g.fillRect(x-8,y-12,32,32);
    if(im&&im.complete&&im.naturalWidth){g.imageSmoothingEnabled=true;g.drawImage(im,x+8-8,y-12+b2+.0,16,20);g.imageSmoothingEnabled=false;}g.restore();top=y-12;}
   else{const sp=propSheet(pk),pw=sp.width,ph=sp.height;shadow(x+8,y+14,Math.min(11,pw/2-1));g.drawImage(sp,x+8-pw/2+((pk==='stray'&&((tms/130)|0)%5===0)?1:0),y+16-ph);top=y+16-ph;
    if(pk==='altar'){const cols=['#ff5a7a','#5aa8ff','#7aef8a'];for(let i=0;i<3;i++){const ox=(i-1)*8,oy=Math.sin(tms/360+i*2.1)*1.6,cx=x+8+ox,cy=y+16-ph+2-(i===1?3:0)+oy;g.globalAlpha=.35;g.fillStyle=cols[i];g.fillRect(cx-2.5,cy-2.5,5,5);g.globalAlpha=1;g.fillRect(cx-1,cy-1,2,2);g.fillStyle='#fff';g.fillRect(cx-1,cy-1,1,1);}}
    else if(pk==='ruins'&&((tms/260)|0)%4===0){g.fillStyle='#bff';g.fillRect(x+10,y-9,1,1);}
    else if(pk==='stray'){const t=(tms/1100+e.i*.37)%1;g.globalAlpha=1-t;g.fillStyle='#8fd0ff';g.fillRect(x+8+10,y-6+Math.round(t*7),2,3);g.fillStyle='#fff';g.fillRect(x+8+10,y-6+Math.round(t*7),1,1);g.globalAlpha=1;}
    else if(pk==='evolve'){const p=.5+.5*Math.sin(tms/380+e.i);g.save();const gr=g.createLinearGradient(0,y-34,0,y+10);gr.addColorStop(0,'rgba(255,244,170,0)');gr.addColorStop(1,'rgba(255,244,170,'+(.5+.3*p)+')');g.fillStyle=gr;g.beginPath();g.moveTo(x+4,y-34);g.lineTo(x+12,y-34);g.lineTo(x+16,y+10);g.lineTo(x,y+10);g.closePath();g.fill();g.restore();for(let i=0;i<3;i++){const t=(tms/1400+i/3+e.i*.21)%1;g.globalAlpha=1-t;g.fillStyle=i===1?'#fff':'#ffe98a';g.fillRect(x+8+(i-1)*4,y+8-Math.round(t*30),1,2);}g.globalAlpha=1;top=y-18;}
    else if(pk==='thorns'){const ox=x+8-15,oy=y+16-24;g.fillStyle='#ffd23a';g.fillRect(ox+14,oy+14,3,3);g.fillStyle='#fff3a8';g.fillRect(ox+14,oy+14,1,1);if(((tms/350)|0)%3===0){g.fillStyle='#fff';g.fillRect(ox+15,oy+11,1,3);g.fillRect(ox+14,oy+15,3,1);g.fillRect(ox+13,oy+15,1,1);}}}}
  else if(lk.v==='tent'){g.drawImage(sheet,16*T,0,T,T,x,y,T,T);top=y;}
  else if(lk.v==='bush'){const sh=((tms/110)|0)%2;g.drawImage(sheet,((th.city?27:5)+af)*T,0,T,T,x+sh,y,T,T);g.drawImage(sheet,((th.city?28:6)-af)*T,0,T,T,x-sh,y-4,T,T);top=y-4;}
  if((lk.v==='mon'||lk.v==='npc'||lk.v==='item')&&tallAt(e.x,e.y))g.drawImage(tufts,tuftF(e.x,e.y)*T,7,T,9,x,y+7,T,9); // 풀밭에 선 포켓몬·사람도 발이 풀에 가려져요
  if(e.n&&bkey(e.n))return; // 건물이 있는 분기점은 건물이 있어서 머리 위 표시는 생략
  const im=marker(e.mark);const my=top-17+(bob>0?1:0);
  if(im){g.drawImage(im,x,my,16,16);}else{g.fillStyle='#fff';g.fillRect(x+6,my+4,4,6);}
 }
 // 풀이 흔들리는 칸: 바닥을 다시 그리고 흔들린 풀을 얹어요
 function drawRustle(){for(const k in rustle){const a=tms-rustle[k];if(a>=360){delete rustle[k];continue;}const x=k%W,y=(k/W)|0;
  g.drawImage(sheet,(th.city?5:((x*7+y*13)%3))*T,0,T,T,x*T,y*T,T,T);g.drawImage(tufts,tuftF(x,y)*T,0,T,T,x*T,y*T,T,T);}}
 // 풀밭 위의 플레이어: 발(스프라이트 아래쪽)을 풀이 덮어요 — 풀잎 사이로만 살짝 보여요
 function grassOver(){const px=Math.round(p.px),py=Math.round(p.py),x0=px,x1=px+16,y0=py+7,y1=py+16;
  [[p.x,p.y],p.moving?[p.nx,p.ny]:null].forEach(a=>{if(!a||!tallAt(a[0],a[1]))return;
   const tx=a[0]*T,ty=a[1]*T,ax=Math.max(x0,tx),bx=Math.min(x1,tx+T),ay=Math.max(y0,ty),by=Math.min(y1,ty+T);
   if(bx>ax&&by>ay)(window.pskGD||function(g,...a){g.drawImage(...a);})(g,tufts,tuftF(a[0],a[1])*T+(ax-tx),ay-ty,bx-ax,by-ay,ax,ay,bx-ax,by-ay);});}
 function drawReward(){if(!rwPop)return;const r=rwPop,a=tms-r.t0;if(!D.on&&!r.t1)r.t1=tms;
  const fade=r.t1?1-(tms-r.t1)/350:1;if(fade<=0){rwPop=null;return;}
  const u=Math.min(1,a/280),sc=u<1?(1-Math.pow(1-u,3))*1.25:1.25-.25*Math.min(1,(a-280)/160);
  const bob=a>440?Math.round(Math.sin((a-440)/260)):0,cx=Math.round(p.px)+8,by=Math.round(p.py)-4-Math.round(Math.min(1,u)*3)-bob;
  let im=null;const n={gold:'coin',coin:'vase',candy:'candy',energy:'bolt'}[r.k];
  if(n)im=getImg(rwSrc(n));else if(r.ic)im=icon(r.ic);
  g.save();g.globalAlpha=Math.max(0,Math.min(1,fade));
  const gr=g.createRadialGradient(cx,by-9,1,cx,by-9,15);gr.addColorStop(0,'rgba(255,248,190,.8)');gr.addColorStop(1,'rgba(255,248,190,0)');g.fillStyle=gr;g.fillRect(cx-16,by-26,32,32);
  const w=Math.round(16*sc);
  if(im)g.drawImage(im,cx-w/2,by-w,w,w);else if(r.ic){g.font='12px sans-serif';g.textAlign='center';g.fillText(r.ic,cx,by-3);}
  const tw=(a/120|0)%4;g.fillStyle='#fff8c8';[[-10,-16],[10,-12],[-8,-6],[9,-20]].forEach((o,i)=>{if((i+tw)%4<2)g.fillRect(cx+o[0],by+o[1]-(a>280?0:4),1,1);});
  g.restore();}
 function drawLeaves(){leaves.forEach(l=>{g.globalAlpha=Math.min(1,(l.max-l.t)/(l.max*.4));g.fillStyle=l.c;g.fillRect(Math.round(l.x),Math.round(l.y),l.w,1);});g.globalAlpha=1;}
 function draw(){
  g.setTransform(K,0,0,K,0,0);g.imageSmoothingEnabled=false;
  KE=Math.max(K,Math.round(K*ZM));VW=CW*K/KE;VH=CH*K/KE;g.setTransform(KE,0,0,KE,0,0);g.imageSmoothingEnabled=false;
  const vw=Math.ceil(VW),vh=Math.ceil(VH),cx=clamp(Math.round(p.px)+8-Math.floor(VW/2),0,W*T-vw),cy=clamp(Math.round(p.py)+8-Math.floor(VH/2),0,H*T-vh);CAM.x=cx;CAM.y=cy;
  g.drawImage(bgc,cx,cy,vw,vh,0,0,vw,vh);
   if(cloudDone){const ca=Math.min(1,(performance.now()-cloudDone)/CLOUD_FADE);if(ca>0){g.globalAlpha=ca;g.drawImage(cloudCv,cx,cy,vw,vh,0,0,vw,vh);g.globalAlpha=1;}}
  g.save();g.translate(-cx,-cy);if(M.boss)drawHallBack();drawRustle();
  const list=ents.map(e=>({y:e.y*T,e})).concat(ents.filter(e=>e.n&&bkey(e.n)).map(e=>({y:e.y*T-1,gym:e})),(M.decor||[]).map(d=>({y:d.y*T+(d.k==='pil'?9:7),dec:d})),[{y:p.py+(p.moving?0:0),p:1},{y:p.py+.5,ov:1}].concat(typeof rl2PeerList==='function'?rl2PeerList():[])).sort((a,b)=>a.y-b.y);
  const vis=q=>q.x==null||q.y==null||(q.x*T+8>cx-128&&q.x*T<cx+vw+128&&q.y*T+8>cy-128&&q.y*T<cy+vh+260);
  list.forEach(o=>{if(o.pe){try{rl2DrawPeer(sprite,g,o.pe);}catch(er){}return;}if(o.ov){grassOver();return;}if(o.dec){if(vis(o.dec))drawDecor(o.dec);return;}if(o.gym){if(vis(o.gym))drawGym(o.gym);return;}if(o.e){if(vis(o.e))drawEnt(o.e);}else{const wf=p.moving&&p.t<.62,rd=gact&&gact.k==='ride';if(rd)gRideBelow();(window.pskDraw&&window.pskDraw(g,p.dir,wf,Math.round(p.px),Math.round(p.py)-3-(rd?Math.round(gact.up):0),(p.dir<2&&wf&&p.par)?1:0,16))||sprite(rl2MyHs(HSPR()),p.dir,wf,Math.round(p.px),Math.round(p.py)-3-(rd?Math.round(gact.up):0),(p.dir<2&&wf&&p.par)?1:0);}});
  gDraw();drawLeaves();drawReward();try{rl2BubblesDraw(g,cx,cy,KE,p);}catch(er){}
  g.restore();
  if(th.tint){g.fillStyle=th.tint;g.fillRect(0,0,CW,CH);}
  // 화면 밖 분기점 표시
  ents.forEach(e=>{if(e.k!=='node')return;const sx=e.x*T-cx+8,sy=e.y*T-cy+8;if(sx>=0&&sx<VW&&sy>=0&&sy<VH-40*K/KE)return;
   const ax=Math.round(clamp(sx,8,VW-8)),ay0=Math.round(clamp(sy,8,VH-46*K/KE)),ay=(ax>VW*.58&&ay0<26*K/KE)?Math.round(26*K/KE):ay0,im=marker(e.mark);g.globalAlpha=.55+.3*Math.sin(tms/280);if(im)g.drawImage(im,ax-4,ay-4,8,8);else{g.fillStyle='#fff';g.fillRect(ax-2,ay-2,4,4);}g.globalAlpha=1;});
  // 화면 효과
  if(fx){const k=fx.t/fx.dur;
   if(fx.type==='in'){g.fillStyle='rgba(0,0,0,'+(1-k)+')';g.fillRect(0,0,CW,CH);}
   else if(fx.type==='out'){g.fillStyle='rgba(0,0,0,'+k+')';g.fillRect(0,0,CW,CH);}
   else if(fx.type==='battle'){if(fx.t<300){g.fillStyle=(((fx.t/75)|0)%2)?'#101018':'#fff';g.globalAlpha=.88;g.fillRect(0,0,CW,CH);g.globalAlpha=1;}
    else{const pr=Math.min(1,(fx.t-300)/(fx.dur-300));g.fillStyle='#101018';for(let r=0;r<18;r++){const w=Math.ceil(CW*pr);if(r%2)g.fillRect(CW-w,r*8,w,8);else g.fillRect(0,r*8,w,8);}}}}
 }
 // 반복
 let last=0,lastDraw=0,raf=0,alive=true,dAvg=0;
 /* 무입력 절전: 30초 동안 터치·키 입력이 없으면 그리기를 더 줄이고 장식 애니메이션을 멈춰요. 건드리면 바로 돌아와요 */
 window.__lastIn=performance.now();
 if(!window.__inHook){window.__inHook=1;['pointerdown','keydown','touchstart','wheel'].forEach(ev=>addEventListener(ev,()=>{window.__lastIn=performance.now();document.documentElement.classList.remove('idleSleep');},{capture:true,passive:true}));}
 const loop=ts=>{if(!alive)return;if(!cv.isConnected){destroy();return;}const dt=Math.min(60,last?ts-last:16);last=ts;
  try{update(dt);cloudStep();const idle=!p.moving&&!(typeof rl2PeerBusy==='function'&&rl2PeerBusy())&&!fx&&!D.on&&!gact&&!path.length&&!held.length&&!leaves.length&&!rwPop&&!locked&&!cloudBusy();const sl=idle&&performance.now()-window.__lastIn>30000;document.documentElement.classList.toggle('idleSleep',sl);if(!document.hidden&&(idle?ts-lastDraw>=(sl?500:200):(dAvg>11?ts-lastDraw>=29:true))){lastDraw=ts;const _d0=performance.now();draw();dAvg=dAvg*.9+(performance.now()-_d0)*.1;} /* 가만히 있을 땐 초당 5번(오래 가만히면 2번), 움직일 땐 일정하게 30번만 그려요 (29ms 기준이라 프레임이 불규칙하게 건너뛰지 않아요) */}catch(e){console.warn('field loop',e);}raf=requestAnimationFrame(loop);};
 // 키보드·터치
 const modal=()=>!!document.querySelector('.modal.on,#coach.on,#unlock.on');
 const KM={ArrowDown:0,s:0,S:0,ArrowUp:1,w:1,W:1,ArrowLeft:2,a:2,A:2,ArrowRight:3,d:3,D:3};
 const kd=e=>{if(!cv.isConnected){destroy();return;}if(modal()||/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||''))return;
  if(e.key in KM){e.preventDefault();if(D.state==='menu'){if(!e.repeat){const d=KM[e.key];if(d===0||d===3)moveMenu(1);else moveMenu(-1);}return;}if(D.on)return;setHeld(KM[e.key],true);return;}
  if(e.key==='+'||e.key==='='||e.key==='-'||e.key==='_'){e.preventDefault();if(!e.repeat)setZoom(e.key==='-'||e.key==='_'?-1:1);return;}
  if(e.key==='Enter'||e.key===' '||e.key==='z'||e.key==='Z'||e.key==='e'||e.key==='E'){e.preventDefault();if(!e.repeat)action();return;}
  if(e.key==='Escape'||e.key==='x'||e.key==='X'||e.key==='Backspace'){e.preventDefault();if(!e.repeat)back();}};
 const ku=e=>{if(!cv.isConnected)return;if(e.key in KM)setHeld(KM[e.key],false);};
 const KB={up:1,down:0,left:2,right:3};
 wrap.querySelectorAll('.gf-pad button').forEach(b=>{const k=b.dataset.k;
  const dn=ev=>{ev.preventDefault();if(k==='a'){action();return;}if(k==='b'){back();return;}
   if(D.state==='menu'){moveMenu(k==='down'||k==='right'?1:-1);return;}if(D.on)return;b.classList.add('dn');setHeld(KB[k],true);try{b.setPointerCapture(ev.pointerId);}catch(e){}};
  const up=ev=>{if(k==='a'||k==='b')return;b.classList.remove('dn');setHeld(KB[k],false);};
  b.addEventListener('pointerdown',dn);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);b.addEventListener('contextmenu',e=>e.preventDefault());});

 // 조이스틱: 가장 크게 기울인 축 하나만 써서 상하좌우로만 움직여요 (대각선 없음)
 {const joy=wrap.querySelector('#gfJoy'),pad=wrap.querySelector('.gf-pad');let pj=-1;
  gfFloatJoy(pad,joy,d=>{if(pj>=0)setHeld(pj,false);pj=d;if(d>=0){if(D.state==='menu')moveMenu(d===0||d===3?1:-1);else if(!D.on)setHeld(d,true);}},()=>{if(D.on&&D.state!=='menu')advance();});}
 // 터치 이동: ① 화면 어디든 손가락을 대고 끌면 그 방향으로 계속 걸어요(떠 있는 조이스틱) ② 한 번 톡 누르면 그 칸까지 자동으로 걸어가요(사물·사람이면 옆까지 가서 말 걸기)
 function ptalk0(e){const dx=e.x-p.x,dy=e.y-p.y;return Math.abs(dx)>=Math.abs(dy)?(dx<0?2:3):(dy<0?1:0);}
 function tileAt(ev){const r=cv.getBoundingClientRect();return [Math.floor((CAM.x+(ev.clientX-r.left)/r.width*VW)/T),Math.floor((CAM.y+(ev.clientY-r.top)/r.height*VH)/T)];}
 function planTo(tx,ty){path.length=0;ptalk=null;if(tx<0||ty<0||tx>=W||ty>=H)return false;
  const sx=p.moving?p.nx:p.x,sy=p.moving?p.ny:p.y,e=entAt(tx,ty);
  const goal=(x,y)=>e?(Math.abs(x-tx)+Math.abs(y-ty)===1):(x===tx&&y===ty);
  if(!e&&!walk(tx,ty))return false;
  if(e&&sx===tx&&sy===ty)return false;
  const prev=new Map(),key=(x,y)=>y*W+x,q2=[[sx,sy]];prev.set(key(sx,sy),null);let end=null;
  while(q2.length){const [x,y]=q2.shift();if(goal(x,y)){end=[x,y];break;}
   for(let d=0;d<4;d++){const nx=x+DX[d],ny=y+DY[d];if(prev.has(key(nx,ny))||!walk(nx,ny))continue;prev.set(key(nx,ny),[x,y,d]);q2.push([nx,ny]);}}
  if(!end)return false;const out=[];let c=end;while(prev.get(key(c[0],c[1]))){const v=prev.get(key(c[0],c[1]));out.unshift(v[2]);c=[v[0],v[1]];}
  path.push(...out);if(e)ptalk={e};return path.length>0||!!e;}
 {let gid=null,sx0=0,sy0=0,ax=0,ay=0,mode='',gdir=-1,gax='';
  const gset=d=>{if(d===gdir)return;if(gdir>=0)setHeld(gdir,false);gdir=d;if(d>=0&&!D.on&&!locked)setHeld(d,true);};
  const gmove=ev=>{const dx=ev.clientX-ax,dy=ev.clientY-ay,adx=Math.abs(dx),ady=Math.abs(dy);
   if(mode===''){if(Math.hypot(ev.clientX-sx0,ev.clientY-sy0)<12)return;mode='drag';path.length=0;ptalk=null;}
   if(Math.hypot(dx,dy)<10){gax='';gset(-1);return;}
   if(gax==='x'&&ady>adx*1.3)gax='y';else if(gax==='y'&&adx>ady*1.3)gax='x';else if(!gax)gax=adx>=ady?'x':'y';
   gset(gax==='x'?(dx<0?2:3):(dy<0?1:0));
   const L=46;if(Math.hypot(dx,dy)>L){const k=L/Math.hypot(dx,dy);ax=ev.clientX-dx*k;ay=ev.clientY-dy*k;}}; // 손가락이 멀리 가면 기준점이 따라와서 방향을 빨리 바꿀 수 있어요
  const gend=ev=>{if(gid===null||ev.pointerId!==gid)return;const was=mode;gid=null;gset(-1);gax='';mode='';
   if(was===''&&ev.type==='pointerup'&&!D.on&&!locked&&!fx&&!gact){const t=tileAt(ev);if(!(t[0]===p.x&&t[1]===p.y))planTo(t[0],t[1]);}};
  cv.style.touchAction='none';
  cv.addEventListener('pointerdown',ev=>{if(D.on){advance();return;}if(D.state==='menu'||gid!==null)return;gid=ev.pointerId;sx0=ax=ev.clientX;sy0=ay=ev.clientY;mode='';gax='';path.length=0;ptalk=null;try{cv.setPointerCapture(ev.pointerId);}catch(e){}});
  cv.addEventListener('pointermove',ev=>{if(ev.pointerId===gid){ev.preventDefault();gmove(ev);}});
  cv.addEventListener('pointerup',gend);cv.addEventListener('pointercancel',gend);cv.addEventListener('lostpointercapture',gend);}
 window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);window.addEventListener('resize',fit);
 const dispose=()=>{alive=false;cancelAnimationFrame(raf);window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);window.removeEventListener('resize',fit);try{setBig(false,1);document.removeEventListener('click',bigOut,true);document.removeEventListener('keydown',bigKey,true);}catch(e){}};
 ST={destroy:dispose,dbg:{p,M,ents,D,say,talk,go,action,advance,openHidden,showReward,get fx(){return fx;},draw,update,CAM,path,get VW(){return VW;},get VH(){return VH;},T},rl2:{p,ents,D,say,closeDlg,go,busy:()=>!!(locked||fx||gact),lock:v=>{locked=!!v;},unlock:()=>{locked=false;},stop:()=>{path.length=0;ptalk=null;pend=-1;},script:e=>e.k==='portal'?portalScript():script(e.n,info(e.n,e.i,run),run)}};
 // ===== 층 도입 연출 (1인용·2인용 공통): 필드에 들어오면 이 층 보스 그림과 함께 도감 이야기 대사창이 떠요 =====
 try{
  const fl0=run.floor||1;
  if(!run.rv&&(run.step||0)===0&&run.introFl!==fl0&&run.boss!=null&&MON[run.boss]){
   setTimeout(()=>{try{
    if(!alive||!wrap.isConnected||D.on||run.introFl===fl0)return;
    const J=id=>rlJ(MON[id].name,'을','를');
    const cur=run.boss,bs=(run.bosses&&run.bosses.length)?run.bosses:[run.boss];
    const prevB=bs[fl0-2],prevC=(run.cards||[]).find(c=>c&&c.floor===fl0-1);
    const pB=(prevB!=null&&MON[prevB])?J(prevB)+' 물리치고 ':'',pC=(prevC&&MON[prevC.id])?J(prevC.id):'';
    let pages;
    if(fl0<=1)pages=[J(cur)+' 물리치고 사라진 도감을 다시 채우자!'];
    else if(fl0===2)pages=[pB+(pC?pC+' 도감에 다시 등록했어.':'도감 한 페이지를 다시 등록했어.'),J(cur)+' 물리치고 계속해서 도감을 채우자!'];
    else pages=[pB+(pC?pC+' 도감에 채웠어.':'도감 한 페이지를 채웠어.'),'이제 '+J(cur)+' 물리치면 도감을 구할 수 있어. 마지막까지 최선을 다하자!'];
    run.introFl=fl0;rlSave();
    const frame=wrap.querySelector('.gf-frame');let art=null;
    if(frame){art=document.createElement('div');art.className='gf-bossfx';
     art.innerHTML='<div class="gf-bossfx-tag">👑 '+fl0+'층 보스</div><div class="gf-bossfx-fl">'+monImg(cur,'front')+'</div><div class="gf-bossfx-nm">'+esc(MON[cur].name)+'</div>';
     frame.appendChild(art);try{sfx('rare');}catch(e){}}
    const rm=()=>{if(!art)return;art.classList.add('out');const a=art;art=null;setTimeout(()=>{try{a.remove();}catch(e){}},320);};
    say(pages,{done:rm});
   }catch(e){console.warn('floor intro',e);}},520);
  }
 }catch(e){console.warn('floor intro',e);}
 raf=requestAnimationFrame(loop);
}

// ---------- 기존 화면에 끼워 넣기 ----------
const modePref=()=>{try{return rlMeta().modePref==='text'?'text':'field';}catch(e){return 'field';}}; // 필드 모험이 기본이에요
const __map=rlRenderMap;
// 분기점이 끝나면 바로 다음 단계 맵으로 넘어가지 않고, 같은 맵에 머물러요 (분기점이 포탈로 바뀌고 가운데에도 포탈이 생겨요)
const __adv=rlAdvance;
rlAdvance=function(){
 try{const run=RUN(),key=run?(run.floor||1)+':'+(run.step|0):'';
  if(run&&run.mode==='field'&&run.rv==null&&(run.step|0)<RL.steps&&run.clr!==key){run.clr=key;run.cur=null;rlSave();rlRenderMap();return;}
 }catch(e){console.warn('stay on map',e);}
 return __adv.apply(this,arguments);};
rlRenderMap=function(){
 destroy();
 try{const r0=RUN();if(r0&&r0.bclr===(r0.floor||1)&&r0.mode!=='field')r0.mode='field';}catch(e){} // 계단은 필드에서만 있어서 보스 뒤에는 필드로 맞춰요
 __map.apply(this,arguments);
 try{
  const run=RUN();if(!run)return;
  if(!run.mode){run.mode=modePref();}
  const card=q('#view .rl-mapcard');if(!card)return;
  const bar=card.querySelector('.mbtns');
  if(run.mode==='text'&&!q('#gfToggle')){const b=document.createElement('button');b.id='gfToggle';b.type='button';b.className='btn green';b.innerHTML='<span class="gfT1">🗺️ 필드 모드</span><span class="gfT2">바로 걸어보기 ▶</span>';
   b.onclick=()=>{sfx('tap');run.mode='field';rlSave();try{window.__gfKeep={t:Date.now(),big:true,y:0};}catch(e){}rlRenderMap();};const h3=card.querySelector('h3');if(h3){h3.classList.add('gfH3');h3.appendChild(b);}else card.appendChild(b);}
  if(run.mode==='field'&&run.rv!=null){const h3=card.querySelector('h3');if(h3)h3.innerHTML='🔙 지난 길 <small class="mut" style="font-size:.6em">'+(run.floor||1)+'층 · STEP '+(run.rv+1)+' · 못 연 상자를 찾아요</small>';}
  if(run.mode==='field'&&run.rv==null&&run.clr===(run.floor||1)+':'+(run.step|0)){const h3=card.querySelector('h3');if(h3)h3.innerHTML='🌀 분기점 완료 <small class="mut" style="font-size:.6em">'+(run.floor||1)+'층 · STEP '+(run.step+1)+' / '+RL.steps+' · 포탈을 타면 다음 단계로 가요</small>';}
  if(run.mode==='field'&&run.rv==null&&run.bclr===(run.floor||1)&&(run.step|0)>=RL.steps){const h3=card.querySelector('h3');if(h3)h3.innerHTML='🪜 '+(run.floor||1)+'층 클리어 <small class="mut" style="font-size:.6em">보스가 있던 자리 뒤 계단을 올라가요</small>';}
  if(run.mode==='field'&&q('#view .rl-opts'))mount(run);
 }catch(e){console.warn('field mode',e);}
};
const __entry=rlRenderEntry;
rlRenderEntry=function(){
 destroy();
 __entry.apply(this,arguments);
 try{
  const rl=rlMeta(true);if(rl.run){rl.run.mode='field';return;} // 이어하기는 언제나 필드 모드로
  const mb=q('#rlModeBtn');if(!mb)return;
  mb.onclick=()=>{sfx('tap');const toText=modePref()!=='text';rl.modePref=toText?'text':'field';rlSave();mb.textContent=toText?'📜 텍스트':'🗺️ 필드';
   toast(toText?'📜 텍스트 모드로 모험해요':'🗺️ 필드 모험! 길을 걸어 다니며 분기점을 만나요');};
 }catch(e){console.warn('field entry',e);}
};
window.GF={mount,destroy,genMap,get st(){return ST;}};
})();

