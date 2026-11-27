
/* ===================================================================
   2:2 팀 대전 (친구 대전 → 2:2)
   - 방장이 방을 열고 3명이 같은 코드로 접속 → 팀(A/B)당 2칸에 앉으면 방장이 시작
   - 팀마다 8칸 공유 필드, 한 팀의 두 사람은 동시에 행동, 둘 다 '차례 끝'이면 다음 팀 차례
   - 방장이 판정(권위 호스트)하고, 모든 화면에는 '내 팀이 아래' 시점으로 상태를 보내요
   =================================================================== */
const T2_VER=1;
const T2_RECO_MAX=300000; // 연결이 끊긴 친구를 기다려 주는 시간(90초)
const T2={mode:'pvp',peer:null,host:false,code:'',members:[],lobby:null,started:false,queue:[],pumping:false,proc:false,
 defWait:null,defSeq:0,bt:null,dirty:false,nextId:2,myId:1,charged:false,resDone:false,conn:null,tries:0};
window.T2=T2;
const t2clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
const t2Active=()=>!!(typeof B!=='undefined'&&B&&B.t2);

/* ------------------------------ 화면: 모드 선택 ------------------------------ */
function renderPvp(){S.screen='pvp';pvpClose();t2Close();const m=S.meta;
 $('#view').innerHTML=hudHTML()+`<div class=wrap><div class=panel><h2>${I('teacher')} 친구 대전</h2>
  <p style="line-height:1.6">대전 방식을 골라요. 두 방식 모두 인터넷으로 연결되고, 한 판에 <b>코인 ${PVP_COST}개</b>가 들어요. (이기면 ${PVP_WIN}개, 져도 ${PVP_LOSE}개를 돌려받아요)</p>
  <div class=t2modes>
   <button class="t2mode m1" id=pvM1><span class=t2mi>⚔️</span><b>1:1 대전</b><small>친구 한 명과 일대일로 겨뤄요</small></button>
   <button class="t2mode m2" id=pvM2><span class=t2mi>🤝</span><b>2:2 팀 대전</b><small>4명이 두 팀으로 나뉘어 팀마다 8칸을 함께 써요</small></button>
  </div>
  <p class=mut style="font-size:12px;margin-top:10px">인터넷 연결이 필요해요. <b>학교 와이파이는 작동하지 않을 수 있어요.</b> 모두 같은 버전의 게임 파일을 써 주세요. (지금 코인 ${m.coins}개)</p></div></div>`;
 bindHud();
 $('#pvM1').onclick=()=>{sfx('tap');renderPvp1();};
 $('#pvM2').onclick=()=>{sfx('tap');renderPvp2();};}

// 1:1 화면 위에 '모드 선택으로' 버튼을 달아 줘요
const _renderPvp1=renderPvp1;
renderPvp1=function(){_renderPvp1.apply(this,arguments);try{const p=document.querySelector('#view .panel');if(p&&!p.querySelector('#pvModes')){const h=p.querySelector('h2');const b=document.createElement('button');b.id='pvModes';b.className='btn ghost sm';b.style.cssText='float:right';b.textContent='← 모드 선택';b.onclick=()=>{sfx('tap');renderPvp();};if(h)h.insertAdjacentElement('afterbegin',b);}}catch(e){}};

function renderPvp2(){S.screen='pvp';pvpClose();t2Close();const m=S.meta;ensureDeck();const can=m.coins>=PVP_COST;
 $('#view').innerHTML=hudHTML()+`<div class=wrap><div class=panel><div class=row style="align-items:center"><h2 style="margin:0">${I('teacher')} 2:2 팀 대전</h2><span class=hudSp></span><button class="btn ghost sm" id=t2Back>← 모드 선택</button></div>
  <p style="line-height:1.65;margin-top:8px">4명이 모여 <b>두 팀(2명씩)</b>으로 싸워요. 팀마다 <b>8칸 필드를 함께</b> 쓰고, 한 팀의 두 사람이 <b>동시에</b> 행동해요. 두 사람이 모두 <b>차례 끝</b>을 누르면 다음 팀의 두 사람이 동시에 시작해요. 상대 트레이너를 공격할 때는 <b>둘 중 한 명</b>을 골라요. 한 명의 체력이 0이 되어도 남은 한 명이 쓰러진 친구의 포켓몬까지 모두 조종하며 전투를 이어가요. <b>팀원 둘 다</b> 체력이 0이 되면 그 팀이 져요.</p>
  <div class=explain style="font-size:14px">${I('coin')} 한 판에 <b>코인 ${PVP_COST}개</b> · 이기면 ${PVP_WIN}개, 져도 ${PVP_LOSE}개를 돌려받아요. (지금 <b>${m.coins}개</b>)</div>
  ${can?'':`<p style="color:#d9393f;margin-top:8px">코인이 ${PVP_COST-m.coins}개 모자라요. 공부해서 코인을 모아 와요!</p>`}
  <div class=row style="margin-top:12px"><button class="btn red big" id=t2Host>방 만들기 (방장)</button><button class="btn blue big" id=t2Join>방 들어가기</button></div><button class="btn ghost big" id=t2Rj style="width:100%;margin-top:8px">🔁 다시 들어가기 (나갔다 돌아올 때)</button>
  <div class=row style="margin-top:8px;align-items:center"><input class="inp codeIn" id=t2Code maxlength=4 inputmode=numeric placeholder="방 번호 4자리" style="flex:1"></div>
  <p class=mut style="font-size:12.5px;margin-top:8px;line-height:1.5">🔁 <b>전투 중에 나갔다면?</b> <b>🔁 다시 들어가기</b>를 누르고 <b>같은 닉네임</b>으로 방 번호를 넣으면 원래 자리에서 이어서 할 수 있어요. (방장이 껐다면 방장이 「방장이었어요」를 고르고, 남은 친구들은 화면을 켠 채 기다려 주세요 · 방장 손패는 새로 뽑아요)</p>
  <p class=mut style="font-size:12px;margin-top:10px">방장이 방을 열면 나머지 3명이 같은 방 번호로 들어와요. <a href="#" id=t2Net style="color:inherit">📶 연결 시험</a> · 내 덱 ${m.deck.length}장 <a href="#" id=t2Deck style="color:inherit">덱 고치기</a></p></div>
  <div class=panel id=t2Box style="display:none;text-align:center"></div></div>`;
 bindHud();
 $('#t2Back').onclick=()=>{sfx('tap');renderPvp();};
 $('#t2Deck').onclick=e=>{e.preventDefault();renderDeck();};
 $('#t2Net').onclick=e=>{e.preventDefault();sfx('tap');showNetTest();};
 $('#t2Host').onclick=()=>{if(!can){toast(`코인이 ${PVP_COST-m.coins}개 모자라요. 나갔다 돌아오는 거라면 「다시 들어가기」를 눌러요`);return;}sfx('tap');t2Host();};
 $('#t2Rj').onclick=()=>rjPrompt('t2',(h,c)=>h?t2Host(undefined,undefined,c):t2Join(c,undefined,undefined,true));
 $('#t2Join').onclick=()=>{const c=($('#t2Code').value||'').replace(/\D/g,'');if(c.length!==4){toast('방 번호 4자리를 입력해 주세요');return;}sfx('tap');t2Join(c,undefined,undefined,!can);};}

function t2Box(h){const b=$('#t2Box');if(!b)return;b.style.display='block';b.innerHTML=h;{const t=b.querySelector('#netTest');if(t)t.onclick=()=>{sfx('tap');showNetTest();};}
 const c=b.querySelector('#t2Cancel');if(c)c.onclick=()=>{sfx('tap');t2Leave();};}
const t2Pre=()=>T2.mode==='boss'?(T2.bn===2?'pkteam2c-v':T2.bn===3?'pkteam2d-v':T2.bn===5?'pkteam2e-v':'pkteam2b-v'):'pkteam2-v';
const t2N=()=>T2.mode==='boss'?(T2.bn===2?2:T2.bn===3?3:T2.bn===5?5:4):4;
const t2Md=()=>T2.mode==='boss'&&T2.bn===2?'boss2':T2.mode==='boss'&&T2.bn===3?'boss3':T2.mode==='boss'&&T2.bn===5?'boss5':T2.mode;
function t2Leave(){const inBattle=t2Active()&&!B.over,md=t2Md();t2Close();if(inBattle){B=null;try{$('#battle').classList.remove('on');$('#battle').innerHTML='';}catch(e){}}t2Home(md);}

/* ------------------------------ 연결 정리 ------------------------------ */
function t2Close(){try{T2.hostRejoin=false;T2.hr=null;T2.stableJ='';}catch(e){}t2Close0.apply(this,arguments);}
function t2Close0(){try{if(T2.started&&!T2.host&&T2.conn&&T2.conn.open&&t2Active()&&!B.over&&!B.t2.fin)T2.conn.send({t:'t2-quit'});}catch(e){}
 try{t2RecoReset();}catch(e){}
 try{clearTimeout(T2.bt);}catch(e){}
 try{T2.members.forEach(m=>{try{m.conn&&m.conn.close();}catch(e){}});}catch(e){}
 try{T2.conn&&T2.conn.close();}catch(e){}try{T2.peer&&T2.peer.destroy();}catch(e){}
 try{if(BC&&BC.t2){BC.conn=null;BC.peer=null;BC.host=false;BC.t2=false;}}catch(e){}
 Object.assign(T2,{mode:'pvp',peer:null,host:false,code:'',members:[],lobby:null,started:false,queue:[],pumping:false,proc:false,defWait:null,bt:null,dirty:false,nextId:2,myId:1,charged:false,resDone:false,conn:null,tries:0,tok:'',reco:null,gTimer:0,recoTimer:0,lastRx:0,lastEnd:null,bn:4});}

/* ------------------------------ 내 정보 ------------------------------ */
function t2MyHi(){const L=trainerSkillLevels();return{t:'t2-hi',v:T2_VER,tt:ttNum(),tok:T2.tok||'',mode:T2.mode,name:String(S.meta.name||'').trim()||'친구',av:partnerId(),pg:(S.meta.pg==='f')?'f':'m',vit:vitBonus(),mana:Number(L.mana)||0,study:Number(L.study)||0,hand:Number(L.hand)||0,evo:Number(L.evo)||0,sk:skinSendMap(),deck:S.meta.deck.slice(),owned:Object.keys(S.meta.col).map(Number)};}

/* ------------------------------ 방장: 방 만들기 ------------------------------ */
async function t2Host(mode,bn,hcode){mode=mode||'pvp';const m=S.meta;if(mode==='boss'&&bossTickets()<1&&!hcode){toast('보스전을 열려면 🎟️ 보스전 티켓이 필요해요. 문제를 맞히면 5% 확률로 나와요!');return;}if(mode==='pvp'&&m.coins<PVP_COST&&!hcode){toast('코인이 모자라요');return;}if(!ensureDeck()){toast('덱이 '+deckN()+'장이어야 해요');return;}
 t2Close();T2.mode=mode;T2.bn=bn===2?2:bn===3?3:bn===5?5:4;T2.host=true;T2.code=hcode||String(rint(1000,9999));T2.hostRejoin=!!hcode;if(!hcode)window.__t2hrTry=0;t2Box(`<p>연결 준비 중…</p><button class="btn ghost" id=t2Cancel>취소</button>`);
 try{await loadPeer();}catch(e){t2Box(`<p style="color:#d9393f">${esc(e.message)}</p><button class="btn ghost" id=t2Cancel>돌아가기</button>`);return;}
 const id=t2Pre()+T2_VER+'-'+T2.code;let peer;try{peer=new Peer(id,PO());}catch(e){t2Box(`<p style="color:#d9393f">연결을 시작하지 못했어요</p><button class="btn ghost" id=t2Cancel>돌아가기</button>`);return;}
 T2.peer=peer;
 peer.on('disconnected',()=>{try{if(!peer.destroyed)peer.reconnect();}catch(e){}});
 peer.on('error',e=>{const t=String(e&&e.type||'');if(t2Active())return;
  if(t==='unavailable-id'&&T2.hostRejoin){   // 방금 나간 방 번호를 연결 서버가 아직 놓아 주지 않았어요: 잠시 뒤 같은 번호로 다시 시도
   const n=(window.__t2hrTry=(window.__t2hrTry||0)+1),code=T2.code,md=T2.mode,bn2=T2.bn;
   if(n<=30){try{peer.destroy();}catch(_){}T2.peer=null;t2Box(`<p>방 번호 ${code}를 다시 여는 중… (${n}/30)</p><p class=mut style="font-size:12.5px">방금 나갔다면 연결 서버가 번호를 정리할 때까지 1분쯤 걸릴 수 있어요. 자동으로 다시 시도해요.</p><button class="btn ghost" id=t2Cancel>취소</button>`);
    setTimeout(()=>{if(T2.hostRejoin&&T2.host&&!T2.peer&&T2.code===code)t2Host(md,bn2,code);},3000);return;}}
  if(t==='unavailable-id'&&T2.tries++<6){try{peer.destroy();}catch(_){}T2.peer=null;t2Host(T2.mode,T2.bn);return;}
  t2Box(netErrHTML(t==='network'||t==='server-error'||t==='socket-error'?'연결 서버에 닿지 못했어요.':'연결하지 못했어요 ('+t+')',t,'t2Cancel'));});
 peer.on('connection',t2OnIncoming);
 peer.on('open',()=>{
  if(T2.members.length)return;   // 연결 서버에 다시 붙은 경우: 이미 모인 사람들 정보를 지우지 않아요
  T2.members=[{id:1,host:true,name:String(m.name||'').trim()||'방장',av:partnerId(),team:null,pos:null,conn:null,hi:t2MyHi()}];T2.nextId=2;T2.myId=1;
  BC.host=true;BC.t2=true;BC.peer=peer;BC.conn={open:true,send:o=>t2Raw(o),close(){}};
  if(T2.hostRejoin){T2.hr={reps:{}};window.t2HrBox();}else t2PushLobby();});}

// 방장 → 모든 친구에게 (연출·알림 같은 공통 메시지)
function t2HostMid(){const m=T2.members.find(x=>x.host);return m?m.id:null;}
function t2Pos(mid){const T=B&&B.t2;if(!T)return null;for(let t=0;t<2;t++)for(let i=0;i<T.teams[t].length;i++)if(T.teams[t][i].mid===mid)return{t,i};return null;}
// 2:2: 방어 문제는 나머지 모두(같은 편·상대 팀)가 구경하고, ❤️는 같은 편(살아있는 팀원)에게만 전달해요. 공격·공부 기술 문제는 예전처럼 쓰러진 팀원에게만 보여요
function t2RelayPvp(srcMid,d){try{const T=B&&B.t2;if(!T||T.boss)return;const ps=t2Pos(srcMid);if(!ps)return;const hm=t2HostMid();
 const give=(p,o)=>{if(p.mid===hm){if(o.t==='boss-heart'){try{bossHeartShow(+o.i);}catch(e){}}else t2Spec(o);}
  else{const mm=T2.members.find(x=>x.id===p.mid);t2SendTo(mm,o.t==='boss-heart'?{t:'boss-heart',i:o.i}:o);}};
 if(d.t==='boss-dq'){T2.dqk=T2.dqk||{};T2.dqk[srcMid]=d.k;}
 const kind=d.t==='boss-dq'?d.k:(d.t==='boss-dqr'?(T2.dqk&&T2.dqk[srcMid]):null);
 if(d.t!=='boss-heart'&&kind==='def'){const out=Object.assign({},d,{tm:ps.t});
  T.teams.forEach((tm,t)=>tm.forEach((p,j)=>{if(t===ps.t&&j===ps.i)return;give(p,out);}));return;}
 T.teams[ps.t].forEach((p,j)=>{if(j===ps.i)return;const dead=p.hp<=0;if(d.t==='boss-heart'?dead:!dead)return;give(p,d);});}catch(e){}}
function t2Raw(o){if(!o||!o.t)return;if(T2.mode==='boss'&&o.t==='boss-heart'&&o.f==null)o=Object.assign({},o,{f:t2HostMid()});if(o.t==='t2-result'||o.t==='t2-abort')T2.lastEnd=o;if(o.t==='boss-dq'||o.t==='boss-dqr'||o.t==='boss-heart'){t2RelayAll(t2HostMid(),o);return;}if(!(o.t==='boss-fx'||o.t==='boss-banner'||o.t==='boss-megafx'||/^t2-/.test(o.t)||(T2.mode==='boss'&&(o.t==='boss-heart'||((o.t==='boss-dq'||o.t==='boss-dqr')&&(o.t==='boss-dqr'||o.k==='def'))))))return;
 T2.members.forEach(m=>{if(!m.host&&m.conn&&m.conn.open){try{m.conn.send(o);}catch(e){}}});}
function t2SendTo(m,o){try{if(m&&m.conn&&m.conn.open)m.conn.send(o);}catch(e){}}
const t2Pub=m=>({id:m.id,name:m.name,tt:ttFor(m.name),av:m.av,team:m.team,pos:m.pos,host:!!m.host});
function t2PushLobby(){if(!T2.host)return;const ms=T2.members.filter(m=>m.hi).map(t2Pub);
 T2.lobby={you:1,members:ms,mode:T2.mode};T2.members.forEach(m=>{if(!m.host&&m.hi)t2SendTo(m,{t:'t2-lobby',you:m.id,members:ms,mode:T2.mode});});t2DrawLobby();}
function t2OnIncoming(c){
 if(T2.started){ // 전투 중에는 '다시 들어오기'만 받아요 (끊겼던 친구가 같은 방 번호 + 자기 표식으로 다시 연결)
  c.on('data',d=>{try{
   if(c.__m){t2HostRx(c.__m,d);return;}
   if(d&&d.t==='t2-hi'){t2NameRejoin(c,d);return;}
   if(d&&d.t==='t2-rejoin'){const m=T2.members.find(x=>!x.host&&x.id===d.id&&x.tok&&x.tok===String(d.tok||''));
    if(m&&T2.lastEnd){try{c.send(T2.lastEnd);}catch(e){}setTimeout(()=>{try{c.close();}catch(e){}},500);return;} // 끊긴 사이 끝난 전투: 진짜 결과 화면을 보내 줘요
    if(m&&t2Active()&&!B.over&&!B.t2.fin){t2Rebind(m,c);return;}
    try{c.send({t:'t2-norejoin'});}catch(e){}setTimeout(()=>{try{c.close();}catch(e){}},500);return;}
   try{c.send({t:'t2-full',started:true});}catch(e){}setTimeout(()=>{try{c.close();}catch(e){}},500);
  }catch(e){console.error('t2 rejoin',e);}});
  c.on('error',()=>{});return;}
 if(T2.hostRejoin){window.t2HostRejoinConn(c);return;}
 if(T2.members.length>=t2N()){c.on('open',()=>{try{c.send({t:'t2-full',started:false});}catch(e){}setTimeout(()=>{try{c.close();}catch(e){}},500);});return;}
 const m={id:T2.nextId++,host:false,name:'',av:25,team:null,pos:null,conn:c,hi:null};T2.members.push(m);
 c.on('data',d=>{try{t2HostRx(m,d);}catch(e){console.error('t2 host rx',e);}});
 c.on('close',()=>t2HostClosed(m,c));c.on('error',()=>{});}
// 앱을 껐다 켜서 표식(tok)을 잃은 친구도, 같은 방 번호 + 같은 닉네임이면 원래 자리(팀·덱·손패)로 돌아와요
function t2NameRejoin(c,d){
 const bye=o=>{try{c.send(o);}catch(e){}setTimeout(()=>{try{c.close();}catch(e){}},500);};
 if(d.v!==T2_VER||(d.mode||'pvp')!==T2.mode){bye({t:'t2-ver'});return;}
 const nm=String(d.name||'친구').slice(0,12).trim(),now=Date.now();
 if(!(t2Active()&&!B.over&&!B.t2.fin)){bye({t:'t2-nomatch',msg:'이 방의 전투는 이미 끝났어요.'});return;}
 const cands=T2.members.filter(x=>!x.host&&String(x.name||'').trim()===nm);
 const m=cands.find(x=>x.down)||cands.find(x=>!x.conn||!x.conn.open||now-(x.lastRx||0)>8000);
 if(!m){bye({t:'t2-nomatch',msg:cands.length?`'${nm}'님은 아직 연결되어 있어요. 잠시 뒤에 다시 들어와 보세요.`:`이 방에서 '${nm}' 닉네임으로 하던 전투를 찾지 못했어요. 닉네임이 같은지 확인해 주세요.`});return;}
 m.tok=String(d.tok||'').slice(0,40);
 try{c.send({t:'t2-rejoined',id:m.id});}catch(e){}
 t2Rebind(m,c);}
function t2HostClosed(m,c){const i=T2.members.indexOf(m);if(i<0)return;if(c&&m.conn&&m.conn!==c)return;
 if(T2.started){if(t2Active()&&!B.over&&!B.t2.fin){try{t2MemberDown(m);}catch(e){console.error('t2 down',e);t2Abort(`${m.name||'친구'}님의 연결이 끊어졌어요`);}}return;}
 T2.members.splice(i,1);t2PushLobby();}
function t2HostRx(m,d){if(!d||typeof d!=='object')return;m.lastRx=Date.now();if(d.t==='t2-ping')return;
 if(d.t==='t2-hi'){m.tok=String(d.tok||'').slice(0,40);if(d.v!==T2_VER||(d.mode||'pvp')!==T2.mode){t2SendTo(m,{t:'t2-ver'});setTimeout(()=>{try{m.conn.close();}catch(e){}},500);const i=T2.members.indexOf(m);if(i>=0)T2.members.splice(i,1);return;}
  m.name=String(d.name||'친구').slice(0,12);ttReg(m.name,d.tt);m.av=MON[d.av]?d.av:25;m.hi={name:m.name,av:m.av,vit:t2clamp(d.vit,0,5),mana:t2clamp(d.mana,0,5),study:t2clamp(d.study,0,5),hand:t2clamp(d.hand,0,5),evo:t2clamp(d.evo,0,5),deck:Array.isArray(d.deck)?d.deck.slice(0,60):[],owned:Array.isArray(d.owned)?d.owned.slice(0,600):[]};
  t2PushLobby();return;}
 if(!m.hi)return;
 if(d.t==='t2-pick'&&!T2.started){t2Seat(m,Number(d.team),Number(d.pos));return;}
 if(d.t==='t2-act'&&T2.started){if(!t2Active()||B.over)return;const T=B.t2;let team=-1,idx=-1;T.teams.forEach((tm,t)=>tm.forEach((p,i)=>{if(p.mid===m.id){team=t;idx=i;}}));if(team<0)return;
  T2.queue.push({team,idx,a:d.a||{},seq:d.seq});t2Pump();return;}
 if((d.t==='boss-heart'||d.t==='boss-dq'||d.t==='boss-dqr')&&T2.started){t2RelayAll(m.id,d);return;}
   if(d.t==='t2-fans'){const v=T2.fv;if(!v||v.id!==d.id||!v.need.has(m.id))return;if(!d.ok){t2FvEnd(false,`${m.name||'친구'}님이 거부했어요`);return;}v.got.add(m.id);if(v.got.size>=v.need.size)t2FvEnd(true);return;}
   if(d.t==='boss-defa'){const w=T2.defWait;if(w&&w.id===d.id&&w.mid===m.id){T2.defWait=null;w.res(d.skip?null:{ok:!!d.ok,sv:!!d.sv&&!!d.ok,hint:!!d.hint});}return;}
 if(d.t==='t2-quit'&&T2.started){if(!t2Active()||B.over)return;if(B.t2.boss){t2FinishBoss('lose','quit',m.name);return;}let team=-1;B.t2.teams.forEach((tm,t)=>tm.forEach(p=>{if(p.mid===m.id)team=t;}));if(team>=0)t2Finish(team,'quit',m.name);return;}}
function t2Seat(m,team,pos){if(!(team===0||team===1)||!(pos===0||pos===1)){if(team===-1){m.team=null;m.pos=null;t2PushLobby();}return;}
 if(m.team===team&&m.pos===pos){m.team=null;m.pos=null;t2PushLobby();return;}
 if(T2.members.some(x=>x!==m&&x.hi&&x.team===team&&x.pos===pos)){return;}
 m.team=team;m.pos=pos;t2PushLobby();}
const t2CanStart=()=>T2.members.filter(m=>m.hi&&m.team!=null).length===4&&[0,1].every(t=>[0,1].every(p=>T2.members.some(m=>m.team===t&&m.pos===p)));

/* ------------------------------ 친구: 방 들어가기 ------------------------------ */
async function t2Join(code,mode,bn,rj){mode=mode||'pvp';const m=S.meta;if(mode==='boss'&&m.coins<BOSS_FEE&&!rj){toast('보스전 참가비는 코인 '+BOSS_FEE+'개예요. '+(BOSS_FEE-m.coins)+'개 모자라요. (방장에게 내는 참가비예요)');return;}if(mode==='pvp'&&m.coins<PVP_COST&&!rj){toast('코인이 모자라요');return;}if(!ensureDeck()){toast('덱이 '+deckN()+'장이어야 해요');return;}
 t2Close();T2.rjOnly=!!rj;T2.tok=Math.random().toString(36).slice(2,12)+Date.now().toString(36);T2.mode=mode;T2.bn=bn===2?2:bn===3?3:bn===5?5:4;T2.host=false;T2.code=code;t2Box(`<p>연결 준비 중…</p><button class="btn ghost" id=t2Cancel>취소</button>`);
 try{await loadPeer();}catch(e){t2Box(`<p style="color:#d9393f">${esc(e.message)}</p><button class="btn ghost" id=t2Cancel>돌아가기</button>`);return;}
 let peer;try{peer=new Peer(PO());}catch(e){t2Box(`<p style="color:#d9393f">연결을 시작하지 못했어요</p><button class="btn ghost" id=t2Cancel>돌아가기</button>`);return;}
 T2.peer=peer;BC.host=false;BC.t2=true;BC.peer=peer;
 peer.on('disconnected',()=>{try{if(!peer.destroyed)peer.reconnect();}catch(e){}});
 peer.on('error',e=>{const t=String(e&&e.type||'');if(t2Active()||T2.lobby)return;t2Box(netErrHTML(t==='peer-unavailable'?'그 번호의 방이 없어요.':t==='network'||t==='server-error'||t==='socket-error'?'연결 서버에 닿지 못했어요.':'연결하지 못했어요 ('+t+')',t,'t2Cancel'));});
 peer.on('open',()=>{if(T2.conn)return;t2Box(`<p>방 ${code}에 들어가는 중…</p><button class="btn ghost" id=t2Cancel>취소</button>`);
  const c=peer.connect(t2Pre()+T2_VER+'-'+code,{reliable:true});T2.conn=c;BC.conn=c;
  c.on('open',()=>{try{c.send(t2MyHi());}catch(e){}});
  c.on('data',d=>{try{t2GuestRx(d);}catch(e){console.error('t2 guest rx',e);}});
  c.on('close',()=>t2GuestClosed(c));c.on('error',()=>{});
  setTimeout(()=>{try{if(T2.conn===c&&!c.open&&!T2.lobby&&t2Scr())t2Box(netErrHTML('방장과 연결되지 않았어요','timeout','t2Cancel'));}catch(e){}},20000);});}
function t2GuestClosed(c){if(T2.conn&&T2.conn!==c)return;
 if(T2.started){if(t2Active()&&!B.over&&!B.t2.fin)t2GuestRecover();return;}
 if(t2Scr()&&!T2.resDone){T2.lobby=null;t2Box(`<p>방장과 연결이 끊어졌어요.</p><button class="btn ghost" id=t2Cancel>돌아가기</button>`);}}
function t2IntroRecv(d){try{const tm=[].concat(d.teams||[]);if(tm.length<2)return;let mine=0;tm.forEach((t,ti)=>{if((t||[]).some(m=>m&&m.id===T2.myId))mine=ti;});
 const run=fieldFaceoffIntro(tm[mine],tm[1-mine],{skip:false,meId:T2.myId});window.__t2IntroRun=run;
 const clr=()=>{if(window.__t2IntroRun===run)window.__t2IntroRun=null;};run.then(clr,clr);}catch(e){window.__t2IntroRun=null;}}
function t2GuestRx(d){if(!d||typeof d!=='object')return;T2.lastRx=Date.now();if(d.t==='t2-ping')return;
 if(d.t==='t2-resume'){t2GuestResumed();return;}
 if(d.t==='t2-wait'){t2WaitShow(d.names||[],null);return;}
 if(d.t==='t2-fvote'){t2FvShow(d);return;}
 if(d.t==='t2-fres'){t2FvHide();if(!d.ok)toast('강제 진행하지 않았어요 · '+(d.why||''));return;}
 if(d.t==='t2-norejoin'){if(T2.reco)t2OnAbort({reason:'방장이 다시 이어 주지 못했어요'});return;}
 if(d.t==='t2-need-state'){window.t2SendMyState&&t2SendMyState();return;}
 if(d.t==='t2-nomatch'){t2Box(`<p style="color:#d9393f">${esc(d.msg||'이어 할 전투를 찾지 못했어요.')}</p><button class="btn ghost" id=t2Cancel>돌아가기</button>`);return;}
 if(d.t==='t2-rejoined'){   // 다시 들어왔어요: 곧 방장이 지금 전투 화면을 보내 줘요
  T2.myId=d.id;T2.started=true;T2.charged=true;T2.resDone=false;T2.lobby={you:d.id,members:[],mode:T2.mode};T2.lastRx=Date.now();
  BC.resultHandled=false;BC.pendingSnap=null;BC.fxUntil=0;try{startBgm('battle');}catch(e){}toast('전투에 다시 들어왔어요! 이어서 해요');return;}
 if(d.t==='t2-lobby'){try{(d.members||[]).forEach(x=>ttReg(x.name,x.tt));}catch(e){}if(T2.rjOnly){const code=T2.code,md=T2.mode;t2Close();t2Box(`<p style="color:#d9393f">${md==='boss'?'이어 하던 보스전이 없는 방이에요. 새 보스전은 방장이 🎟️ 티켓으로 열어야 들어갈 수 있어요.':'이어 하던 전투가 없는 방이에요. 새 전투는 코인 '+PVP_COST+'개가 필요해서 들어갈 수 없어요.'}</p><button class="btn ghost" id=t2Cancel>돌아가기</button>`);return;}T2.lobby={you:d.you,members:d.members};T2.mode=d.mode||'pvp';T2.myId=d.you;t2DrawLobby();}
 else if(d.t==='t2-full'){t2Box(`<p style="color:#d9393f">${d.started?'이미 전투가 시작된 방이에요.':'방이 가득 찼어요. ('+t2N()+'명까지)'}</p><button class="btn ghost" id=t2Cancel>돌아가기</button>`);}
 else if(d.t==='t2-ver'){t2Box(`<p style="color:#d9393f">방장과 게임 버전이 달라요. 모두 최신 파일로 열어 주세요.</p><button class="btn ghost" id=t2Cancel>돌아가기</button>`);}
 else if(d.t==='t2-intro'){t2IntroRecv(d);}
  else if(d.t==='t2-snap'){if(d.init)T2.started=true;bossApplySnapshot(d.state,!!d.init);}
 else if(d.t==='boss-fx'){bossFxPlay(d);}
 else if(d.t==='boss-banner'){banner(d.b1,d.b2,d.ms);}
 else if(d.t==='boss-megafx'){try{megaCine(+d.b,+d.m,String(d.n||''),null,d.ti||undefined);}catch(e){}}   else if(d.t==='t2-capstart'){try{bossCaptureGauge(d);}catch(e){}}   else if(d.t==='t2-capresult'){try{bossCapThrowAnim(d);}catch(e){}}
 else if(d.t==='boss-defq'){bossAnswerDefense(d);}
 else if(d.t==='boss-dq'||d.t==='boss-dqr'){t2Spec(d);}
 else if(d.t==='boss-heart'){try{bossHeartShow(+d.i,0,d.f);}catch(e){}}
 else if(d.t==='t2-turn'){if(t2Active()){t2TurnBanner(d.team);}}
 else if(d.t==='t2-result'){if(d.boss)t2OnBossResult(d);else t2OnResult(d);}
 else if(d.t==='t2-abort'){t2OnAbort(d);}}

/* ------------------------------ 로비 화면(팀 정하기) ------------------------------ */
const t2Scr=()=>S.screen==='pvp'||S.screen==='bosscoop';
function t2DrawLobby(){if(!t2Scr()||T2.started||!$('#t2Box'))return;const L=T2.lobby;if(!L){return;}
 if(T2.mode==='boss')return t2DrawBossLobby();
 const ms=L.members,me=ms.find(m=>m.id===L.you)||{};const at=(t,p)=>ms.find(m=>m.team===t&&m.pos===p);
 const seat=(t,p)=>{const o=at(t,p);if(o){const mine=o.id===L.you;return `<button class="t2seat ${t?'tb':'ta'} full${mine?' mine':''}" data-t="${t}" data-p="${p}" ${mine?'':'disabled'}><span class=t2av>${monImg(o.av,'front')}</span><span class=t2nm>${nameTag(o.name)}</span><small>${o.host?'방장 · ':''}${mine?'나 (눌러서 빠지기)':'준비 완료'}</small></button>`;}
  return `<button class="t2seat ${t?'tb':'ta'} empty" data-t="${t}" data-p="${p}"><span class=t2plus>＋</span><span class=t2nm>빈자리</span><small>눌러서 앉기</small></button>`;};
 const wait=ms.filter(m=>m.team==null);const seated=ms.filter(m=>m.team!=null).length;
 const host=T2.host;const can=host&&t2CanStart();
 t2Box(`<h3 style="margin:0 0 4px">${host?'친구에게 이 방 번호를 알려 주세요':'방 '+esc(T2.code)+'에 들어왔어요'}</h3>
  ${host?`<div class=tcode style="font-size:46px;margin:2px 0">${T2.code}</div>`:''}
  <p class=mut style="margin:2px 0 8px">모인 사람 ${ms.length}/4명 · 자리에 앉은 사람 ${seated}/4명</p>
  <div class=t2teams><div class="t2team ta"><div class=t2th>🔵 A팀 <small>먼저 시작</small></div>${seat(0,0)}${seat(0,1)}</div><div class=t2vs>VS</div><div class="t2team tb"><div class=t2th>🟠 B팀</div>${seat(1,0)}${seat(1,1)}</div></div>
  ${wait.length?`<p class=mut style="margin:8px 0 0;font-size:13px">자리를 기다리는 사람: ${wait.map(w=>esc(w.name)+(w.id===L.you?'(나)':'')).join(' · ')}</p>`:''}
  <div class=row style="justify-content:center;margin-top:12px;gap:8px">${host?`<button class="btn red big" id=t2Start ${can?'':'disabled'}>⚔️ 전투 시작</button>`:''}<button class="btn ghost" id=t2Cancel>나가기</button></div>
  <p class=mut style="font-size:12px;margin-top:8px">${host?(can?'모두 앉았어요! 전투를 시작할 수 있어요.':'각 팀에 2명씩 앉으면 전투 시작 버튼이 켜져요.'):'방장이 전투를 시작하기를 기다려요. 먼저 팀 자리에 앉아 주세요.'}</p>`);
 const b=$('#t2Box');b.querySelectorAll('.t2seat').forEach(el=>{el.onclick=()=>{sfx('tap');const t=+el.dataset.t,p=+el.dataset.p;
  if(T2.host){const hm=T2.members[0];t2Seat(hm,t,p);}else{try{T2.conn.send({t:'t2-pick',team:t,pos:p});}catch(e){}}};});
 const st=$('#t2Start');if(st)st.onclick=()=>{sfx('tap');t2StartMatch();};}
const t2Home=m=>m==='boss2'?renderBoss4(2):m==='boss3'?renderBoss4(3):m==='boss5'?renderBoss4(5):m==='boss'?renderBoss4():renderPvp2();

/* ------------------------------ 전투 시작 (방장) ------------------------------ */
function t2StartMatch(){if(!T2.host||T2.started||!t2CanStart())return;
 if(S.meta.coins<PVP_COST){toast('코인이 모자라요');return;}
 const seats=[[null,null],[null,null]];T2.members.forEach(m=>{if(m.team!=null)seats[m.team][m.pos]=m;});
 const used={};const nameOf=m=>{let n=m.name||'친구';if(used[n]){used[n]++;n+=' '+'②③④⑤'[used[n]-2];}else used[n]=1;return n;};
 const boards=[Array(8).fill(null),Array(8).fill(null)];
 const teams=seats.map((tm,t)=>tm.map((m,i)=>{const hi=m.hi;const hp=m.host?heroHpMax():HERO_HP+t2clamp(hi.vit,0,5);
  const p=mkPlayer(nameOf(m),hi.deck,hp,MON[hi.av]?hi.av:25,false,hi.owned,true);
  p.manaLv=t2clamp(hi.mana,0,5);p.studyLv=t2clamp(hi.study,0,5);p.powerUses=Math.min(3,STUDY_BASE+studyExtraUses(p.studyLv));p.handLv=t2clamp(hi.hand,0,5);p.evoLv=t2clamp(hi.evo,0,5);
  p.skm=skinCleanMap(hi.sk);p.team=t;p.tix=i;p.mid=m.id;p.tsUsed={};p.ctr=0;p.t2done=0;p.qc=0;p.board=boards[t];return p;}));
 teams.forEach((tm,t)=>tm.forEach(p=>{for(let i=0;i<3;i++)draw(p,true);}));
 const hostM=T2.members[0],vt=hostM.team,li=hostM.pos;BC.localIndex=li;BC.host=true;BC.t2=true;
 T2.started=true;T2.queue=[];T2.resDone=false;
 const first=teams[vt][li];
 B={gi:-2,g:{n:'2:2 팀 대전',ldr:'상대 팀',c:'#bfe6ff'},diff:3,turn:0,round:0,side:'me',me:first,foe:teams[1-vt][0],sel:-1,pick:-1,busy:false,combo:0,qn:0,qc:0,defUsed:false,over:false,trainerSkillUsed:first.tsUsed,
  t2:{teams,boards,turn:0,eng:vt,done:[[0,0],[0,0]],vt,ver:T2_VER},
  coop:{players:teams[vt],foeTeam:teams[1-vt],active:li,localIndex:li,seq:0,processing:false,result:null,t2:true}};
 S.meta.coins-=PVP_COST;T2.charged=true;autoSave();
 S.screen='battle';try{$('#bq').classList.remove('on');closeInfo();}catch(e){}$('#battle').innerHTML='';$('#battle').classList.add('on');startBgm('battle');
 const introTeams=seats.map((tm,t)=>tm.map((m,i)=>({id:m.id,name:teams[t][i].name,pg:(m.hi&&m.hi.pg==='f')?'f':'m',av:MON[m.hi&&m.hi.av]?m.hi.av:25})));
 const introMsg={t:'t2-intro',teams:introTeams};T2.members.forEach(m=>{if(!m.host)t2SendTo(m,introMsg);});
 t2Broadcast(true,true);renderBattle();
 let tRun=null;try{tRun=fieldFaceoffIntro(introTeams[vt],introTeams[1-vt],{skip:false,meId:T2.myId});}catch(e){tRun=null;}
 const foes=teams[1-vt].map(p=>esc(p.name)).join(' · ');
 const goT2=()=>{if(!(B&&B.t2&&!B.over))return;banner('2:2 팀 대전!',`${foes} 팀과 대결`,1800);setTimeout(()=>{if(B&&B.t2&&!B.over)t2BeginTeam(0);},1700);};
 if(tRun)tRun.then(goT2,goT2);else goT2();}

/* ------------------------------ 시점(누가 아래쪽에 보이나) ------------------------------ */
// 엔진은 '지금 행동하는 팀'을 B.me 쪽으로 놓고 돌려요. 화면에서 위/아래는 보는 사람 팀(vt) 기준이에요.
function t2Persp(team,idx,fh){const T=B.t2,mine=T.teams[team],en=T.teams[1-team];
 mine.forEach(p=>p.board=T.boards[team]);en.forEach(p=>p.board=T.boards[1-team]);
 B.coop.players=mine;B.coop.foeTeam=en;B.coop.active=idx;B.coop.localIndex=BC.localIndex;
 B.me=mine[idx];B.foe=en[fh===1&&en.length>1?1:0];B.side='me';T.eng=team;B.trainerSkillUsed=B.me.tsUsed=(B.me.tsUsed||{});}
function t2Rest(){const T=B.t2;if(T.boss){t2Persp(0,BC.localIndex);return;}if(T.turn===T.vt)t2Persp(T.turn,BC.localIndex);else t2Persp(T.turn,0);}
function t2Sync(){const T=B.t2;T.boards[T.eng]=B.me.board;T.boards[1-T.eng]=B.foe.board;T.teams.forEach((tm,t)=>tm.forEach(p=>{p.board=T.boards[t];}));}

// 방장 화면: 지금 엔진 시점이 다른 팀일 때는 '내 팀이 아래' 시점으로 잠깐 바꿔서 그려요
const _renderBattle=renderBattle;
renderBattle=function(){if(!B||!B.t2||!BC.host||B.t2.eng===B.t2.vt||!B.coop)return _renderBattle.apply(this,arguments);
 const T=B.t2,vt=T.vt,li=BC.localIndex,mine=T.teams[vt],en=T.teams[1-vt];const keep={me:B.me,foe:B.foe,coop:B.coop,side:B.side,tsu:B.trainerSkillUsed};
 B.coop=Object.assign({},keep.coop,{players:mine,foeTeam:en,active:li,localIndex:li});B.me=mine[li];B.foe=en[0];B.side='foe';B.trainerSkillUsed=B.me.tsUsed=(B.me.tsUsed||{});
 try{return _renderBattle.apply(this,arguments);}finally{B.me=keep.me;B.foe=keep.foe;B.coop=keep.coop;B.side=keep.side;B.trainerSkillUsed=keep.tsu;}};

// 화면 요소 찾기: 선수가 '내 팀'이면 아래 칸, 아니면 위 칸
const t2Lane=P=>(B&&B.t2&&P&&P.team!=null)?(P.team===B.t2.vt?'myLane':'foeLane'):(P===B.me?'myLane':'foeLane');
window.t2Lane=t2Lane;
const _heroEl=heroEl,_unitEl=unitEl;
heroEl=function(P){if(B&&B.t2&&B.t2.boss&&P&&P.team!=null){if(P.team===B.t2.vt)return(B.rl2&&P.tix!==BC.localIndex)?$('#heroAlly'):$('#heroMe');return $('#wildStatus')||$('#heroFoe');}
if(B&&B.t2&&P&&P.team!=null){if(P.team===B.t2.vt)return P.tix===BC.localIndex?$('#heroMe'):$('#heroAlly');return P.tix===0?$('#heroFoe'):$('#heroFoeB');}return _heroEl(P);};
unitEl=function(P,i){if(B&&B.t2&&P&&P.team!=null){const l='#'+t2Lane(P)+` .slot[data-i="${i}"]`;return $(l+' .unit')||$(l);}return _unitEl(P,i);};
function t2L(P){return(B&&B.t2&&P&&P.team!=null)?'t'+P.team:(P===B.me?'m':'f');}
function t2PL(l){if(B&&B.t2&&typeof l==='string'&&l[0]==='t')return B.t2.teams[+l.slice(1)][0];return l==='m'?B.me:B.foe;}
function t2LaneL(l){if(B&&B.t2&&typeof l==='string'&&l[0]==='t')return +l.slice(1)===B.t2.vt?'myLane':'foeLane';return l==='m'?'myLane':'foeLane';}
window.t2L=t2L;window.t2PL=t2PL;window.t2LaneL=t2LaneL;

// 연출 이벤트를 '누구 것인지(팀 번호)'로 설명해서 보내요 → 어느 팀 화면에서든 같은 곳에서 재생돼요
const _fxDesc=bossFxDesc,_fxEl=bossFxEl,_pxEnc=bossPxEnc,_pxDec=bossPxDec;
bossFxDesc=function(el){if(!(B&&B.t2))return _fxDesc(el);if(!el)return null;const T=B.t2,vt=T.vt;
 if(T.boss&&el.id==='wildStatus')return{ht:1-vt,hi:0};
 if(el.id==='heroMe')return{ht:vt,hi:BC.localIndex};if(el.id==='heroAlly')return{ht:vt,hi:1-BC.localIndex};
 if(el.id==='heroFoe')return{ht:1-vt,hi:0};if(el.id==='heroFoeB')return{ht:1-vt,hi:1};
 if(el.id==='battle')return{k:'b'};
 if(el.classList&&el.classList.contains('hand'))return{k:'hand',ht:T.eng,hi:B.coop.active};
 const sl=el.closest&&el.closest('.slot');if(sl&&sl.parentElement){const id=sl.parentElement.id;if(id==='myLane'||id==='foeLane')return{lt:id==='myLane'?vt:1-vt,i:+sl.dataset.i};}
 return null;};
bossFxEl=function(d){if(!(B&&B.t2))return _fxEl(d);if(!d)return null;const vt=B.t2.vt;
 if(d.ht!=null){if(B.t2.boss){if(d.ht===vt)return(B.rl2&&d.hi!==BC.localIndex)?$('#heroAlly'):$('#heroMe');return $('#wildStatus')||$('#heroFoe');}if(d.ht===vt)return d.hi===BC.localIndex?$('#heroMe'):$('#heroAlly');return d.hi===0?$('#heroFoe'):$('#heroFoeB');}
 if(d.k==='b')return $('#battle');
 if(d.k==='hand')return(d.ht===vt&&d.hi===BC.localIndex)?$('.hand'):null;
 if(d.lt!=null){const q=`#${d.lt===vt?'myLane':'foeLane'} .slot[data-i="${d.i}"]`;return $(q+' .unit')||$(q);}
 return null;};
bossPxEnc=function(x){if(!(B&&B.t2))return _pxEnc(x);if(x&&x.nodeType===1){const d=bossFxDesc(x);return d?{__e:d}:{__bad:1};}
 if(x&&typeof x==='object'&&x.team!=null&&x.tix!=null&&B.t2.teams[x.team]&&B.t2.teams[x.team][x.tix]===x)return{__tp:[x.team,x.tix]};return x;};
bossPxDec=function(x){if(!(B&&B.t2))return _pxDec(x);if(x&&typeof x==='object'){if(x.__bad)return undefined;if(x.__e)return bossFxEl(x.__e);if(x.__tp)return B.t2.teams[x.__tp[0]][x.__tp[1]];}return x;};

/* ------------------------------ 상태 보내기 / 받기 ------------------------------ */
function t2ViewFor(team,idx){const T=B.t2,base={};
 for(const k in B){if(k==='me'||k==='foe'||k==='coop'||k==='t2'||k==='trainerSkillUsed'||typeof B[k]==='function')continue;base[k]=B[k];}
 const x=JSON.parse(JSON.stringify(base));
 const pl=(p,own)=>{const o={};for(const k in p){if(k==='board'||k==='hand'||k==='deck'||typeof p[k]==='function')continue;o[k]=p[k];}
  o.hc=p.hand.length;o.dc=p.deck.length;o.hand=own?p.hand.slice():[];o.deck=own?p.deck.slice():[];return JSON.parse(JSON.stringify(o));};
 x.t2={vt:team,idx,boss:T.boss?1:0,turn:T.turn,done:JSON.parse(JSON.stringify(T.done)),fin:T.fin?1:0,ver:T2_VER,
  players:T.teams.map((tm,t)=>tm.map((p,i)=>pl(p,t===team&&i===idx))),boards:JSON.parse(JSON.stringify(T.boards))};
 x.t2.sq=T2.sq||0;x.t2.xr={dr:T.defRot||0,sr:T.soloRage?1:0,ad:T.adopted?JSON.parse(JSON.stringify(T.adopted)):null};
 try{const hp=t2Pos(t2HostMid());if(hp&&hp.t===team&&hp.i!==idx){const H=T.teams[hp.t][hp.i];x.hb={hand:JSON.parse(JSON.stringify(H.hand||[])),deck:JSON.parse(JSON.stringify(H.deck||[]))};}}catch(e){}   // 방장이 나갔다 돌아올 때 쓰도록 같은 편 친구 화면에만 방장 손패·덱을 백업해 둬요
 x.side=T.turn===team?'me':'foe';x.busy=false;x.over=!!B.over;return x;}
function t2Send(force,init){if(!B||!B.t2)return;T2.lastSend=Date.now();T2.sq=(T2.sq||0)+1;
 T2.members.forEach(m=>{if(m.host||!m.conn||!m.conn.open)return;let team=-1,idx=-1;B.t2.teams.forEach((tm,t)=>tm.forEach((p,i)=>{if(p.mid===m.id){team=t;idx=i;}}));if(team<0)return;
  try{m.conn.send({t:'t2-snap',init:init?1:0,state:t2ViewFor(team,idx)});}catch(e){console.error('t2 snap',e);}});}
function t2Broadcast(force,init){if(!BC.host||!B||!B.t2)return;if(BC.processing&&!force&&false)return;
 if(init){clearTimeout(T2.bt);T2.bt=null;T2.dirty=false;t2Send(true,true);return;}
 T2.dirty=true;if(force){clearTimeout(T2.bt);T2.bt=null;T2.dirty=false;t2Send(true,false);return;}
 if(T2.bt)return;T2.bt=setTimeout(()=>{T2.bt=null;if(!T2.dirty||!B||!B.t2)return;T2.dirty=false;t2Send(false,false);},120);}
const _bossBroadcast=bossBroadcast;
bossBroadcast=function(force){if(B&&B.t2){t2Broadcast(!!force);return;}return _bossBroadcast.apply(this,arguments);};

const _applyNow=bossApplySnapshotNow;
bossApplySnapshotNow=function(x,initial){if(!(x&&x.t2))return _applyNow.apply(this,arguments);
 try{const prev=(B&&B.t2&&!initial)?B:null;const T=x.t2,vt=T.vt,idx=T.idx;T.teams=T.players;delete T.players;
  [0,1].forEach(t=>T.teams[t].forEach(p=>{p.board=T.boards[t];p.team=t;}));
  BC.localIndex=idx;T.eng=vt;
  x.coop={players:T.teams[vt],foeTeam:T.teams[1-vt],active:idx,localIndex:idx,seq:0,processing:false,result:null,t2:true};
  x.me=T.teams[vt][idx];x.foe=T.teams[1-vt][0];x.trainerSkillUsed=x.me.tsUsed=(x.me.tsUsed||{});x.busy=!!x.busy;
  if(prev){x.sel=prev.sel;x.pick=prev.pick;x.itemTargetMode=prev.itemTargetMode;x.moonTargetMode=prev.moonTargetMode;x.trainerSkillTarget=prev.trainerSkillTarget;
   const u=x.me.board[x.sel];if(x.sel>=0&&!(u&&u.att>0&&!u.frozen&&Number(u.coopOwner??0)===idx&&x.side==='me'&&!T.done[vt][idx]))x.sel=-1;
   if(x.pick>=x.me.hand.length)x.pick=-1;}
  else{x.sel=-1;x.pick=-1;}
  B=x;BC.resultHandled=false;
  if(initial){T2.started=true;T2.resDone=false;if(x.rl2){T2.rl2=true;T2.mode='boss';T2.bn=2;T2.code=String(BC.code||'');T2.charged=false;}else if(!T2.charged&&!T2.rjOnly){if(T.boss){S.meta.coins-=BOSS_FEE;T2.charged=true;autoSave();setTimeout(()=>toast('보스전 참가비 '+BOSS_FEE+'코인을 방장에게 냈어요'),1200);}else{S.meta.coins-=PVP_COST;T2.charged=true;autoSave();}}}
  S.screen='battle';$('#view').innerHTML='';$('#battle').classList.add('on');if(initial){startBgm('battle');try{$('#bq').classList.remove('on');closeInfo();}catch(e){}}
  renderBattle();
  if(initial){const bn=()=>x.rl2?banner(x.rl2.kind==='boss'?'보스 등장!':x.rl2.kind==='elite'?'엘리트 등장!':'야생 포켓몬 등장!',`${esc(MON[x.wildId]?MON[x.wildId].name:'적')} · 둘이 동시에 싸워요!`,1700):banner('2:2 팀 대전!',`${x.t2.teams[1-vt].map(p=>esc(p.name)).join(' · ')} 팀과 대결`,1800),ir=window.__t2IntroRun;if(ir)ir.then(bn,bn);else bn();}
 }catch(e){console.error('t2 apply',e);}};

/* ------------------------------ 행동 보내기 ------------------------------ */
// 모든 사람(방장 포함)이 같은 길로 행동해요: 문제는 자기 화면에서 풀고 → 결과만 방장에게 → 방장이 한 줄로 세워 처리
const _bossSubmit=bossSubmit;
bossSubmit=function(a){if(!(B&&B.t2))return _bossSubmit.apply(this,arguments);
 if(BC.host){T2.queue.push({team:B.t2.vt,idx:BC.localIndex,a:a||{}});t2Pump();return;}
 if(!BC.conn||!BC.conn.open){toast('방장과 연결이 끊어졌어요. 행동을 전송하지 못했어요.');return;}
 try{BC.conn.send({t:'t2-act',a,seq:++BC.lastSeq});}catch(e){}};
async function t2Pump(){if(T2.pumping)return;T2.pumping=true;
 try{while(T2.queue.length&&B&&B.t2&&!B.over){const d=T2.queue.shift();while(T2.proc)await new Promise(r=>setTimeout(r,40));await t2Exec(d);}}
 catch(e){console.error('t2 pump',e);}finally{T2.pumping=false;}}

/* ------------------------------ 행동 처리 (방장) ------------------------------ */
function t2Unend(d){const T=B.t2,team=d.team,idx=d.idx,p=T.teams[team]&&T.teams[team][idx];
 if(!p||T2.proc||team!==T.turn||!T.done[team][idx]||T.done[team].every(Boolean)||p.t2uc||(!T.boss&&p.hp<=0))return;
 p.t2uc=1;p.t2done=0;T.done[team][idx]=0;try{t2Sync();t2Rest();}catch(e){}try{banner.local=1;banner('↩ 취소',esc(p.name)+'님이 다시 행동해요',1100);banner.local=0;t2Raw({t:'boss-banner',b1:'↩ 취소',b2:esc(p.name)+'님이 다시 행동해요',ms:1100});}catch(e){}renderBattle();t2Broadcast(true);}
// 효과/이미지가 멈춰도 처리 잠금이 영원히 안 풀리지 않게 30초 안전장치
const T2G=p=>Promise.race([Promise.resolve(p),new Promise(r=>setTimeout(()=>{console.warn('t2 action timeout');r();},30000))]);
async function t2Exec(d){if(!B||!B.t2||B.over)return;if((d.a||{}).type==='unend'){t2Unend(d);return;}
  if((d.a||{}).type==='capgauge'){bossCapGaugeResult(d.a,d.idx);return;} // 포획 게이지 결과는 차례와 상관없이 받아요 (모두가 동시에 내요)
  const T=B.t2,team=d.team,idx=d.idx;
 if(team!==T.turn||T.done[team][idx]||!T.teams[team][idx])return;
 const a=d.a||{};let fh=(a.tg&&a.tg.hero&&(a.tg.h===0||a.tg.h===1))?a.tg.h:0;if(!T.boss){const ft=T.teams[1-team];if(ft[fh]&&ft[fh].hp<=0&&ft[1-fh]&&ft[1-fh].hp>0)fh=1-fh;}
 T2.proc=true;B.coop.processing=true;const prevBusy=B.busy;
 try{t2Persp(team,idx,fh);const P=B.me;B.busy=true;
  if(a.type==='end'){P.t2done=1;T.done[team][idx]=1;B.sel=-1;B.pick=-1;t2Sync();
   if(T.done[team].every(Boolean)){B.busy=false;if(T.boss)await t2BossTurn();else await t2BeginTeam(1-team);return;}
   banner.local=1;t2Rest();B.busy=false;renderBattle();return;}
  const ownU=si=>{const u=P.board[Number(si)];return(u&&Number(u.coopOwner??0)===idx)?u:null;};
  if(a.type==='summon'){const s=Number(a.s),h=Number(a.h);
   if(!Number.isInteger(s)||s<0||s>=P.board.length||!Number.isInteger(h)||h<0||h>=P.hand.length||P.board[s]||(!MON[P.hand[h]]&&!isRandomMonCard(P.hand[h])))return;
   B.busy=false;await T2G(summon(P,h,s));}
  else if(a.type==='item'){const h=Number(a.h);if(!Number.isInteger(h)||h<0||h>=P.hand.length)return;const card=P.hand[h];
   if(!isItemCard(card))return;if(card.item==='thunder'&&!ownU(a.target))return;
   B.busy=false;await T2G(playItem(P,h,Number(a.target??-1),true));}
  else if(a.type==='attack'){const si=Number(a.si),u=ownU(si);if(!u||!(u.att>0)||u.frozen)return;
   const tg=a.tg||{};const t=targetsFor(si);
   if(tg.hero){if(!t.hero)return;}else{if(!Number.isInteger(Number(tg.u))||!t.units.includes(Number(tg.u)))return;}
   B.busy=false;await T2G(playerAttack(si,tg.hero?{hero:1}:{u:Number(tg.u)},!!a.ok,!!a.ok&&!!a.crit,a.hint?1:0));}
  else if(a.type==='power'){B.busy=false;await T2G(bossApplyPower(!!a.ok,!!a.ok&&!!a.crit));}
  else if(a.type==='mega'){const si=Number(a.si),u=ownU(si);if(!u||((P.qc||0)-(P.mgBase||0))<evoNeedFor(evoBase(u.id),P))return;B.busy=false;await T2G(megaDo(P,si));}
  else if(a.type==='capstart'){bossCapStart(a,idx);}
  else if(a.type==='fuse'){const si=Number(a.si),pj=Number(a.pj);if(!fuseRemoteOk(P,si,pj,idx))return;B.busy=false;await T2G(fuseDo(P,si,pj));}
  else if(a.type==='trainerSkill'){const sk=String(a.skill||''),lv=Math.max(1,Math.min(5,Number(a.level)||1)),slot=Number(a.slot),U=B.trainerSkillUsed;
   if(!['heal','counter','attack','cheer'].includes(sk)||U[sk])return;
   if(sk==='heal'){P.hp=Math.min(P.max||15,P.hp+lv);U.heal=true;fx(heroEl(P),`+${lv} 회복`,'txt');try{trainerHealFx(heroEl(P));}catch(e){}}
   else if(sk==='counter'){P.ctr=lv;U.counter=true;try{trainerCounterReadyFx(heroEl(P));}catch(e){}}
   else if(sk==='attack'){const u=B.foe.board[slot];if(!u||u.hp<=0)return;U.attack=true;try{await trainerAtkFx(heroEl(P),unitEl(B.foe,slot),lv);}catch(e){}await T2G(dealUnit(B.foe,slot,lv));try{cleanup();}catch(e){}renderBattle();checkEnd();}
   else if(sk==='cheer'){const u=ownU(slot);if(!u||u.hp<=0)return;const ca=CHEER_ATK[lv]||0,cs=CHEER_SHIELD[lv]||0;u.atk+=ca;u.shield=(u.shield||0)+cs;U.cheer=true;fx(unitEl(P,slot),`공격 +${ca} · 방어막 +${cs}`,'txt');try{trainerCheerFx(unitEl(P,slot));}catch(e){}}}
 }catch(e){console.error('t2 exec',e);}
 finally{T2.proc=false;if(B&&B.t2&&B.coop){B.coop.processing=false;if(!B.t2.fin||true){try{t2Sync();t2Rest();}catch(e){}}B.busy=false;banner.local=0;renderBattle();t2Broadcast(true);}}}

/* ------------------------------ 팀 차례 시작 ------------------------------ */
// 2:2: 한 명이 쓰러지면 남은 팀원이 필드의 포켓몬을 모두 대신 조종해요
function t2Adopt(team){try{const T=B.t2;if(T.boss&&!B.rl2)return;const tm=T.teams[team];const d=tm.map(p=>p.hp<=0);if(d[0]===d[1])return;const s=d[0]?1:0;let n=0;(T.boards[team]||[]).forEach(u=>{if(u&&Number(u.coopOwner??0)!==s){u.coopOwner=s;n++;}});
 if(!T.adopted)T.adopted=[0,0];if(!T.adopted[team]){T.adopted[team]=1;try{banner('⚠️ '+esc(tm[1-s].name)+' 쓰러짐!',esc(tm[s].name)+'님이 포켓몬을 모두 조종해요',1600);}catch(e){}}}catch(e){console.warn('t2Adopt',e);}}
async function t2BeginTeam(team){if(!B||!B.t2||B.over)return;const T=B.t2;T2.proc=true;T2.turnAt=Date.now();T2.ff=0;
 try{T.turn=team;T.done[team]=[0,0];T.teams[team].forEach(p=>{p.t2done=0;p.t2uc=0;p.ctr=0;});B.busy=true;t2Adopt(team);
  for(const idx of [0,1]){const ft=T.teams[1-team],fh=(ft[0]&&ft[0].hp<=0&&ft[1]&&ft[1].hp>0)?1:0; // 상대 한 명이 쓰러졌으면 살아 있는 쪽을 대상으로 (불씨 등 차례 시작 피해가 쓰러진 영웅에게 들어가 사라지던 문제)
   t2Persp(team,idx,fh);await startTurn('me');if(!B||B.over)return;}
  T.teams[team].forEach((p,i)=>{if(!T.boss&&p.hp<=0){T.done[team][i]=1;p.t2done=1;}});
  t2Sync();
  B.busy=false;}
 finally{T2.proc=false;}
 if(!B||B.over)return;B.coop.processing=false;t2Rest();B.busy=false;t2TurnBanner(team);
 t2Raw({t:'t2-turn',team});renderBattle();t2Broadcast(true);}

/* ------------------------------ 방어 문제 (트레이너가 직접 공격받을 때) ------------------------------ */
async function t2Defend(def,a){const res={red:0,dh:0,ctr:0};const mem=T2.members.find(m=>m.id===def.mid);let r=null;
 try{msg(`${esc(def.name)}: 방어 문제를 푸는 중…`);}catch(e){}
 if(!mem||mem.host){const q=pickQ({cyc:1});if(q){const x=await battleQ(q,{who:def.av,what:`방어! ${esc(MON[a.id].name)}의 공격을 막아요`,defense:true,hint:'def'});r={ok:!!(x&&x.ok),sv:!!(x&&x.ok)&&q.tier==='H',hint:!!(x&&x.hint)};}}
 else r=await t2AskDefense(mem,def,a);
 if(r){res.dh=r.hint?1:0;if(r.ok){res.red=r.sv?2:1;qcUp(def);try{fx(heroEl(def),r.sv?'슈퍼세이브! -2':'방어 성공! -1',r.sv?'crit':'txt');heroBlockFx(heroEl(def));}catch(e){}if(def.ctr>0){res.ctr=def.ctr;def.ctr=0;}}else{try{fx(heroEl(def),'방어 실패','txt');}catch(e){}}}
 return res;}
function t2AskDefense(mem,def,a){return new Promise(async res=>{
 if(T2.ff){res(null);return;}
 if(mem&&mem.ai){setTimeout(()=>{const ok=Math.random()<.65;res({ok,sv:ok&&Math.random()<.15,hint:false});},900+Math.random()*900);return;} /* 랜덤 매칭 AI */
 if(mem&&!mem.host&&!(mem.conn&&mem.conn.open)){const t0=Date.now(); // 연결이 끊긴 친구는 다시 들어올 때까지 기다려요
  while(!(mem.conn&&mem.conn.open)&&T2.members.includes(mem)&&t2Active()&&!B.over&&Date.now()-t0<T2_RECO_MAX)await new Promise(r=>setTimeout(r,400));}
 if(!mem||!mem.conn||!mem.conn.open){res(null);return;}const id=++T2.defSeq;const q={t:'boss-defq',id,who:def.av,what:`방어! ${esc(MON[a.id].name)}의 공격을 막아요`};T2.defWait={id,res,mid:mem.id,q};
 t2SendTo(mem,q);
 setTimeout(()=>{if(T2.defWait&&T2.defWait.id===id){T2.defWait=null;res(null);}},90000);});}
async function t2ResolveAttack(me,fo,si,tg,ok,cb,crit,hint){let red=0,dh=0,ctr=0;const a=me.board[si];
 if(tg&&tg.hero&&a){const r=await t2Defend(fo,a);red=r.red;dh=r.dh;ctr=r.ctr;}
 await resolveAttack(me,fo,si,tg,ok,cb,red,crit,hint,dh);
 if(ctr>0&&B&&!B.over&&me.board[si]){try{fx(heroEl(fo),`반격 -${ctr}`,'txt');await trainerAtkFx(heroEl(fo),unitEl(me,si),Math.min(5,ctr),'counter');}catch(e){}await dealUnit(me,si,ctr);try{cleanup();}catch(e){}renderBattle();checkEnd();}}

/* ------------------------------ 끝내기 ------------------------------ */
/* ------------------------------ 협동 보스전 포획 (보스 체력 10% 이하) ------------------------------
   · 포획 버튼을 누른 사람이 공 1개를 골라 쓰고, 모두에게 게이지가 떠요 (퍼펙트 1명당 포획 확률 +2%)
   · 모두가 게이지를 끝내면 공이 동시에 날아가고, 방장이 한 번만 판정해요
   · 실패하면 그 보스에 대한 포획 시도 횟수만큼 도망 확률이 올라가요 (1번째 실패 뒤 10% … 5번째부터 50%)
   · 잡은 보스는 조각 대상에 남고, 도망간 보스는 조각 대상에서 빠져요
   · 도망 판정 위치: 아래 bossCapResolve() 안의 실패 분기 ('도망 판정' 표시 참고) — 포획 판정 직후에 있어요 */
function bossCapN(){try{return (B&&B.t2&&B.t2.teams&&B.t2.teams[0])?B.t2.teams[0].length:0;}catch(e){return 0;}}
function bossCapStart(d,idx){
  if(!B||!B.t2||!B.t2.boss||B.over)return;
  const st=B.wildState||(B.wildState={});
  if(st.bossCap&&st.bossCap.state==='gauge')return; // 이미 포획 진행 중이에요
  const slot=Number(d.slot),ball=String(d.ball||'monster');
  const u=B.foe.board[slot];
  if(!u||u.hp<=0||u.hp>u.max*0.1)return; // 10% 이하일 때만 포획해요
  if(!BALLS[ball])return;
  const fails=u.capFails||0,attempt=fails+1,fleePct=Math.min(50,attempt*10);
  const nm=(B.t2.teams[0][idx]||{}).name||'친구';
  st.bossCap={slot,ball,initiator:idx,name:nm,attempt,fleePct,results:{},state:'gauge',startedAt:Date.now()};
  try{clearTimeout(T2.capTimer);}catch(e){}
  T2.capTimer=setTimeout(()=>{try{bossCapResolve(true);}catch(e){}},25000); // 25초 안에 안 끝나면 안 한 사람은 GOOD(+0)으로 처리해요
  const msg={t:'t2-capstart',slot,ball,name:nm,attempt,fleePct};
  t2Raw(msg);
  try{bossCaptureGauge(msg);}catch(e){} // 방장 화면에도 게이지를 띄워요
  try{bossLog(idx,'포획 시작 → '+MON[u.id].name);}catch(e){}
  t2Broadcast(true);
}
function bossCapGaugeResult(d,idx){
  if(!B||!B.t2||!B.t2.boss||B.over)return;
  const st=B.wildState||{};const cap=st.bossCap;
  if(!cap||cap.state!=='gauge')return;
  const z=String(d.zone||'G');
  if(cap.results[idx]!=null)return;
  cap.results[idx]=z;
  if(Object.keys(cap.results).length>=bossCapN())bossCapResolve(false);
}
function bossCapResolve(timeout){
  if(!B||!B.t2||!B.t2.boss)return;
  const st=B.wildState||{};const cap=st.bossCap;
  if(!cap||cap.state!=='gauge')return;
  cap.state='done';
  try{clearTimeout(T2.capTimer);}catch(e){}
  const slot=Number(cap.slot),ball=String(cap.ball||'monster');
  const u=B.foe.board[slot];
  // 보스가 그 사이에 쓰러졌으면 포획은 없던 일로 해요 (공은 이미 소모됐어요)
  if(!u||u.hp<=0){
    const res0={t:'t2-capresult',slot,ball,ok:false,fled:false,void:true,perfects:0,chance:0,attempt:cap.attempt,fleePct:cap.fleePct};
    t2Raw(res0);
    try{bossCapThrowAnim(res0);}catch(e){}
    st.bossCap=null;t2Broadcast(true);return;
  }
  const n=bossCapN();
  for(let i=0;i<n;i++)if(cap.results[i]==null)cap.results[i]='G'; // 아직 안 낸 사람은 GOOD(+0)
  const perfects=Object.values(cap.results).filter(z=>z==='P').length;
  let chance=0;try{chance=ballChance(ball,u);}catch(e){chance=0;}
  chance=Math.max(0,Math.min(100,chance+perfects*2));
  const ok=rnd()*100<chance;
  const res={t:'t2-capresult',slot,ball,ok,perfects,chance,attempt:cap.attempt,fleePct:cap.fleePct,fled:false};
  const id=u.id;
  if(!ok){
    // ===== 도망 판정 (포획 판정 직후, 이 위치) =====
    // '시도 1회' = 전원 동시 던지기 1라운드. 그 보스에 대한 실패 횟수만큼 확률이 올라가요 (1번째 실패 뒤 10% … 5번째부터 50%)
    const fails=(u.capFails||0)+1;
    u.capFails=fails;
    const fleePct=Math.min(50,fails*10);
    res.fled=rnd()*100<fleePct;
    res.fleePct=fleePct;
  }
  const apply=()=>{
    if(!B||!B.t2||B.over)return;
    const uu=B.foe.board[slot];
    if(ok){
      // 잡았어요: 전장에서 빼고, 조각 대상에는 남겨 둬요
      if(uu&&uu.id===id)B.foe.board[slot]=null;
      st.caughtIds=st.caughtIds||[];if(!st.caughtIds.includes(id))st.caughtIds.push(id);
      B.wildIds=(B.wildIds||[]).filter(x=>x!==id);
      if(B.wildId===id){const nx=B.foe.board.findIndex(x=>x&&x.hp>0);B.wildId=nx>=0?B.foe.board[nx].id:null;B.wildSlot=nx>=0?nx:-1;}
      try{bossLog('b','포획 성공 → '+MON[id].name);}catch(e){}
    }else if(res.fled){
      // 도망갔어요: 전장에서 빼고, 조각 대상에서도 빠져요 (이미 잡았거나 쓰러뜨린 다른 보스 보상은 그대로)
      if(uu&&uu.id===id)B.foe.board[slot]=null;
      st.ids=(st.ids||[]).filter(x=>x!==id);
      B.wildIds=(B.wildIds||[]).filter(x=>x!==id);
      if(B.wildId===id){const nx=B.foe.board.findIndex(x=>x&&x.hp>0);B.wildId=nx>=0?B.foe.board[nx].id:null;B.wildSlot=nx>=0?nx:-1;}
      try{bossLog('b','도망 → '+MON[id].name);}catch(e){}
    }else{
      // 실패했지만 도망가지 않았어요: 보스는 그대로 남아서 전투가 계속돼요
      try{bossLog('b','포획 실패 → '+MON[id].name);}catch(e){}
    }
    st.bossCap=null;
    t2Broadcast(true);
    try{checkEnd();}catch(e){}
  };
  // 결과를 먼저 모두에게 알려 연출을 띄우고, 연출이 끝난 뒤(약 1.3초) 상태를 바꿔요
  t2Raw(res);
  try{bossCapThrowAnim(res);}catch(e){}
  setTimeout(apply,1300);
}
function t2CheckEnd(){if(!B||!B.t2||B.over)return !!(B&&B.over);if(!BC.host)return false;
 const T=B.t2;if(T.boss){if(!T.teams[1][0].board.some(u=>u&&u.hp>0)){t2FinishBoss('win');return true;}if(B.rl2?T.teams[0].every(p=>p.hp<=0):T.teams[0][0].hp<=0){t2FinishBoss('lose');return true;}return false;}for(let t=0;t<2;t++){if(T.teams[t].every(p=>p.hp<=0)){t2Finish(t,'ko');return true;}}return false;}
function t2Finish(loseTeam,why,who){if(!B||!B.t2||B.t2.fin)return;const T=B.t2;T.fin=1;B.over=true;
 const d={t:'t2-result',win:1-loseTeam,why:why||'ko',who:who||'',names:T.teams.map(tm=>tm.map(p=>p.name)),qcs:T.teams.map(tm=>tm.map(p=>p.qc||0))};
 t2Raw(d);let fin=0;try{fin=finaleFx(d.win===T.vt)||0;}catch(e){}
 setTimeout(()=>t2OnResult(d),700+fin);}
async function t2Quit(){if(!B||!B.t2)return;if(BC.host){if(B.t2.boss)t2FinishBoss('lose','quit',S.meta.name);else t2Finish(B.t2.vt,'quit',S.meta.name);return;}
 try{BC.conn.send({t:'t2-quit'});}catch(e){}B.over=true;
 setTimeout(()=>{if(!T2.resDone&&t2Active()){t2OnAbort({reason:'대전에서 나갔어요'});}},4000);}
function t2Abort(reason){if(!B||!B.t2||B.t2.fin)return;B.t2.fin=1;B.over=true;t2Raw({t:'t2-abort',reason});t2OnAbort({reason});}
function t2Done(){try{t2RecoReset();}catch(e){}try{pvSpecHide();}catch(e){}try{const q=$('#bq');if(q){q.classList.remove('on');q.innerHTML='';}}catch(e){}closeInfo();}
function t2OnAbort(d){if(T2.resDone)return;if((B&&B.rl2)||T2.rl2){T2.resDone=true;try{t2Done();}catch(e){}try{if(B)B.over=true;}catch(e){}rl2Pause('친구와 연결이 끊어졌어요. 2인 모험은 저장됐어요. 🔁 다시 들어가기로 이어 해요');return;}T2.resDone=true;t2Done();startBgm('adventure');const me=S.meta;let refunded=false,refundTxt='';if(T2.charged){if(T2.mode==='boss'&&T2.host){S.meta.tickets=bossTickets()+1;refundTxt='보스전 티켓 1장을 돌려받았어요.';}else if(T2.mode==='boss'){me.coins+=Math.round(BOSS_FEE/2);refundTxt='코인 '+Math.round(BOSS_FEE/2)+'개를 돌려받았어요.';}else{me.coins+=Math.round(PVP_COST/2);refundTxt='코인 '+Math.round(PVP_COST/2)+'개를 돌려받았어요.';}T2.charged=false;refunded=true;}autoSave();
 try{if(B&&B.t2)B.over=true;}catch(e){}
 M(`<div style="text-align:center"><h2 style="font-size:28px">${T2.mode==='boss'?'보스전이 멈췄어요':'대전이 멈췄어요'}</h2><p>${esc(d.reason||'연결이 끊어졌어요')}</p>${refunded?`<p class=mut>${refundTxt}</p>`:''}<div class=mbtns><button class="btn gold" data-a=x>확인</button></div></div>`,
  {x:()=>t2AfterResult(),_close:()=>{}});}
function t2OnResult(d){if(T2.resDone)return;T2.resDone=true;t2Done();const me=S.meta;const T=B&&B.t2;const vt=T?T.vt:0,li=BC.localIndex;
 const win=d.win===vt;const mine=T?T.teams[vt][li]:null;const qc=mine?(mine.qc||0):0;
 const foes=(d.names&&d.names[1-vt])||[];
 me.pvp=me.pvp||{n:0,w:0,l:0,gg:0,foes:{}};me.pvp.n++;if(win)me.pvp.w++;else me.pvp.l++;foes.forEach(n=>{me.pvp.foes[n]=(me.pvp.foes[n]||0)+1;});me.pvp.last=Date.now();
 me.coins+=win?PVP_WIN:PVP_LOSE;me.candy+=qc;me.stats.candyAll=(me.stats.candyAll||0)+qc;gainXP(win?30:15);autoSave();sfx(win?'win':'lose');if(win)confetti(60);startBgm('adventure');
 const why=d.why==='quit'?`${esc(d.who||'누군가')}님이 대전을 그만두었어요.`:'';
 const mates=(d.names&&d.names[vt])||[];
 M(`<div style="text-align:center"><h2 style="font-size:32px">${win?'승리!':'아쉬워요!'}</h2>
  <div style="display:flex;justify-content:center;height:96px">${monImg(partnerId(),'anim')}</div>
  <p><b>${mates.map(esc).join(' · ')}</b> 팀 vs <b>${foes.map(esc).join(' · ')}</b> 팀</p>${why?`<p class=mut>${why}</p>`:''}
  <p>내가 맞힌 문제 ${qc}개</p>
  <div class=row style="justify-content:center;gap:8px"><span class=pill>${I('coin')} +${win?PVP_WIN:PVP_LOSE}</span><span class=pill>${I('candy')} +${qc}</span></div>
  <div class=mbtns><button class="btn gold" data-a=x>확인</button></div></div>`,{x:()=>t2AfterResult(),_close:()=>{}});}
function t2AfterResult(){const md=t2Md();closeM();B=null;try{$('#battle').classList.remove('on');$('#battle').innerHTML='';}catch(e){}t2Close();if(S.lvUp)try{levelUpFx();}catch(e){}t2Home(md);}

/* ------------------------------ 화면 조각 (renderBattle에서 불러요) ------------------------------ */
const t2hc=P=>(P.hand&&P.hand.length)||P.hc||0,t2dc=P=>(P.deck&&P.deck.length)||P.dc||0;
function t2Done1(){return !!(B&&B.t2&&B.t2.done[B.t2.vt][BC.localIndex]);}
function t2TopHTML(valid,me){if(B.t2.boss)return t2BossTop();const E=B.coop.foeTeam;const sel=me.board[B.sel];
 const dmg=(valid.hero&&sel)?Math.max(1,Math.ceil(sel.atk*rlBoost(sel))+(B.combo>=2?1:0)+quakeB(sel)+dragonMod(sel)):0;
 const h=(P,id)=>`<div class="hero t2h${valid.hero?' tgt':''}" id=${id}>${dmg?`<div class=tbadge style="top:calc(100% + 2px);left:4px;transform:none;flex-direction:column;align-items:flex-start;z-index:50"><b class=dmgp>-${dmg}</b><b class=dmgp style="color:#2f62b5">방어 성공 시 -${Math.max(0,dmg-1)}</b></div>`:''}<div class=av style="background:${B.g.c}">${heroImgV(P,true)}</div><div><div class=hn>${nameTag(P.name)}${P.t2done?' ✔':''}</div><div class=hhp>${I('heart')}${P.hp}</div></div></div>`;
 return `${h(E[0],'heroFoe')}${h(E[1],'heroFoeB')}<span class=hudSp></span><span class=pill title="상대 팀이 손에 든 카드 수">${I('cards')} ${t2hc(E[0])+t2hc(E[1])}</span>`;}
function t2Msg(){if(!B||!B.t2)return '';if(B.t2.boss&&B.side==='foe')return '보스의 차례… 공격을 조심해요!';if(B.side==='foe'){const E=B.coop.foeTeam;return `상대 팀(${E.map(p=>esc(p.name)).join(' · ')})이 행동하는 중이에요…`;}
 if(t2Done1()){if(B.t2.boss){const w=B.coop.players.filter((p,i)=>!B.t2.done[0][i]).map(p=>esc(p.name));return `차례를 마쳤어요. ${w.join(' · ')}님을 기다리는 중…`;}const al=B.coop.players[1-BC.localIndex];return `차례를 마쳤어요. ${esc(al?al.name:'팀원')}님을 기다리는 중…`;}return '';}
window.t2TopHTML=t2TopHTML;window.t2Msg=t2Msg;window.t2Done1=t2Done1;window.t2ResolveAttack=t2ResolveAttack;window.t2CheckEnd=t2CheckEnd;window.t2Quit=t2Quit;

// 상대 트레이너를 눌러서 공격할 사람을 골라요 (둘 중 한 명)
const _bindBattle=bindBattle;
bindBattle=function(){_bindBattle.apply(this,arguments);if(!(B&&B.t2))return;
 [['heroFoe',0],['heroFoeB',1]].forEach(([id,hi])=>{const el=document.getElementById(id);if(!el)return;el.onclick=()=>t2HeroAttack(hi);});
 // 차례 끝: B.busy·active 값에 막히지 않고, '우리 팀 차례이고 아직 안 눌렀을 때'만 확인해요 (방장 포함 모두 같은 길)
 try{const be=document.getElementById('bEnd');if(be){const T=B.t2;const my=T.teams[T.vt][BC.localIndex];const can=!B.over&&T.turn===T.vt&&!t2Done1();
  const canCancel=!B.over&&T.turn===T.vt&&t2Done1()&&my&&!my.t2uc&&!T.done[T.vt].every(Boolean)&&(T.boss||my.hp>0);
  be.disabled=!(can||canCancel);if(canCancel)be.textContent='↩ 취소';
  be.onclick=()=>{if(!B||!B.t2||B.over)return;const T=B.t2;if(T.turn!==T.vt)return;if(t2Done1()){if(canCancel){sfx('tap');bossSubmit({type:'unend'});}else toast('이미 차례 끝을 눌렀어요. 다른 친구를 기다리는 중이에요');return;}
   sfx('tap');const go=()=>{if(!B||!B.t2||B.over||B.t2.turn!==B.t2.vt||t2Done1())return;B.sel=-1;B.pick=-1;B.trainerSkillTarget=null;bossSubmit({type:'end'});};
   const n=endLeftN();if(n>0){confirmBox(`아직 공격 안 한 포켓몬이 <b>${n}마리</b> 있어요.<br>차례를 끝낼까요?`,'끝낼래요','더 할래요').then(ok=>{if(ok)go();});return;}go();};
  if(BC.host&&!document.getElementById('t2Force')){const fb=document.createElement('button');fb.id='t2Force';fb.className='btn gold sm';fb.textContent='⏩ 강제 진행';fb.title='방장 전용: 차례가 시작되고 90초 뒤부터 쓸 수 있어요. 모든 친구가 동의해야 넘어가요';fb.onclick=t2ForceClick;be.insertAdjacentElement('beforebegin',fb);}t2ForceSync();}}catch(e){console.warn('t2 end btn',e);}};

/* ---- 방장 전용: 멈춘 전투 풀기 / 강제 진행 ---- */
function t2Unstick(){T2.queue.length=0;try{if(T2.defWait){const w=T2.defWait;T2.defWait=null;w.res(null);}}catch(e){}
 T2.pumping=false;T2.proc=false;if(B){B.busy=false;if(B.coop)B.coop.processing=false;}try{const q=document.getElementById('bq');if(q){q.classList.remove('on');q.innerHTML='';}}catch(e){}}
const T2_FORCE_MS=90000,T2_VOTE_MS=25000;
// 동의가 모두 모이면 실제로 넘겨요. 보스 차례면 남은 행동을 모두 적용(방어 문제는 실패)하고 넘어가요
async function t2Force(){if(!B||!B.t2||B.over||!BC.host)return;const T=B.t2,turn=T.turn,bossTurn=!!(T.boss&&turn===1);
 try{const b1='⏩ 강제 진행',b2=bossTurn?'보스의 남은 행동을 모두 적용해요':'아직 안 끝낸 차례를 넘겨요';banner.local=1;banner(b1,b2,1500);banner.local=0;t2Raw({t:'boss-banner',b1,b2,ms:1500});}catch(e){}
 try{
  if(bossTurn){
   T2.ff=1; // 남은 보스 공격은 그대로 이어서 처리하되, 방어 문제는 묻지 않고 실패로 처리
   try{if(T2.defWait){const w=T2.defWait;T2.defWait=null;w.res(null);}}catch(e){}
   const t0=Date.now();while(B&&!B.over&&B.t2&&B.t2.turn===1&&Date.now()-t0<25000)await new Promise(r=>setTimeout(r,300));
   if(B&&!B.over&&B.t2&&B.t2.turn===1){t2Unstick();await t2BossNext();} // 보스 행동은 끝났는데 차례가 안 넘어간 경우
   T2.ff=0;
  }else{
   t2Unstick();
   T.done[turn]=T.done[turn].map(()=>1);T.teams[turn].forEach(p=>{p.t2done=1;});B.sel=-1;B.pick=-1;
   if(T.boss)await t2BossTurn();else await t2BeginTeam(1-turn);
  }
 }catch(e){console.error('t2 force',e);T2.ff=0;T2.proc=false;try{t2Rest();renderBattle();t2Broadcast(true);}catch(_){}}
 try{renderBattle();t2Broadcast(true);}catch(e){}}
// 버튼: 차례 시작 90초 뒤에 켜져요
function t2ForceSync(){const b=document.getElementById('t2Force');if(!b)return;if(!B||!B.t2||B.over||!BC.host)return;
 const left=Math.ceil((T2_FORCE_MS-(Date.now()-(T2.turnAt||Date.now())))/1000);
 if(T2.fv){b.disabled=true;b.textContent='⏳ 친구 동의 기다리는 중…';return;}
 if(left>0){b.disabled=true;b.textContent=`⏩ 강제 진행 (${left}초 뒤)`;}else{b.disabled=false;b.textContent='⏩ 강제 진행';}}
setInterval(()=>{try{t2ForceSync();}catch(e){}},1000);
// 방장이 누르면 연결된 모든 친구에게 동의를 물어요. 한 명이라도 거부(또는 시간 안에 무응답)하면 넘기지 않아요
function t2ForceClick(){if(!B||!B.t2||B.over||!BC.host||T2.fv)return;const T=B.t2;
 const left=T2_FORCE_MS-(Date.now()-(T2.turnAt||Date.now()));if(left>0){toast(`차례가 시작되고 ${Math.ceil(left/1000)}초 뒤에 쓸 수 있어요`);return;}
 sfx('tap');const bossTurn=!!(T.boss&&T.turn===1);
 const ms=T2.members.filter(m=>!m.host&&m.conn&&m.conn.open&&!m.down);
 if(!ms.length){confirmBox('⏩ 강제 진행<br>'+(bossTurn?'보스의 남은 행동을 모두 적용하고 넘길까요?':'아직 안 끝낸 차례를 넘길까요?'),'넘기기','취소').then(ok=>{if(ok&&B&&B.t2&&!B.over)t2Force();});return;}
 T2.fvSeq=(T2.fvSeq||0)+1;const id=T2.fvSeq;
 T2.fv={id,key:T2.turnAt,need:new Set(ms.map(m=>m.id)),got:new Set(),done:false,t:setTimeout(()=>t2FvEnd(false,'응답이 없어요'),T2_VOTE_MS)};
 ms.forEach(m=>t2SendTo(m,{t:'t2-fvote',id,boss:bossTurn,name:S.meta.name}));
 toast('친구들에게 강제 진행 동의를 물었어요');t2ForceSync();}
function t2FvEnd(ok,why){const v=T2.fv;if(!v||v.done)return;v.done=true;clearTimeout(v.t);T2.fv=null;
 t2Raw({t:'t2-fres',id:v.id,ok,why:why||''});t2ForceSync();
 if(!ok){toast('강제 진행하지 않았어요 · '+(why||''));return;}
 if(!B||!B.t2||B.over||T2.turnAt!==v.key){toast('그 사이 차례가 넘어가서 취소했어요');return;}
 t2Force();}
// 친구 화면: 동의 팝업 (20초 안에 안 누르면 거부로 처리)
function t2FvHide(){try{const o=document.getElementById('t2FV');if(o)o.remove();clearInterval(window.__t2FvT);}catch(e){}}
function t2FvShow(d){t2FvHide();if(!(B&&B.t2)||BC.host)return;
 const o=document.createElement('div');o.id='t2FV';o.style.cssText='position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px';
 o.innerHTML=`<div style="background:#fffaf1;color:#3a2e3f;border:3px solid #8a7650;border-radius:18px;padding:18px 16px;max-width:340px;width:100%;text-align:center;box-shadow:0 6px 0 rgba(0,0,0,.3)"><div style="font-size:34px">⏩</div><h3 style="margin:4px 0 6px">강제 진행하시겠습니까?</h3><p style="line-height:1.6;font-size:15px">${esc(d.name||'방장')}님이 차례를 강제로 넘기자고 해요.<br>${d.boss?'보스의 남은 행동은 모두 적용되고, 풀던 방어 문제는 <b>실패</b>로 처리돼요.':'아직 차례 끝을 안 누른 사람도 끝낸 것으로 처리돼요.'}<br><small>모두 동의해야 넘어가요 · <span id=t2FVs>20</span>초 안에 답해 주세요</small></p><div style="display:flex;gap:8px;justify-content:center;margin-top:12px"><button class="btn red" id=t2FVy>동의</button><button class="btn ghost" id=t2FVn>거부</button></div></div>`;
 document.body.appendChild(o);let n=20;
 const ans=ok=>{t2FvHide();try{BC.conn.send({t:'t2-fans',id:d.id,ok:!!ok});}catch(e){}};
 o.querySelector('#t2FVy').onclick=()=>{sfx('tap');ans(true);};o.querySelector('#t2FVn').onclick=()=>{sfx('tap');ans(false);};
 window.__t2FvT=setInterval(()=>{n--;const s=document.getElementById('t2FVs');if(s)s.textContent=Math.max(0,n);if(n<=0)ans(false);},1000);}
// 알아서 풀기: 처리 중이 아닌데 방장 화면이 잠겨 있거나, 처리가 너무 오래 멈춰 있으면 풀어 줘요
setInterval(()=>{try{if(!B||!B.t2||!BC.host||B.over)return;const now=Date.now();const q=document.getElementById('bq');const qOpen=!!(q&&q.classList.contains('on'));
 if(B.busy&&!T2.proc&&!T2.pumping&&!qOpen){T2.bz=T2.bz||now;if(now-T2.bz>4000){T2.bz=0;B.busy=false;renderBattle();t2Broadcast(true);}}else T2.bz=0;
 if(T2.proc&&!T2.defWait&&!qOpen){T2.pz=T2.pz||now;if(now-T2.pz>40000){T2.pz=0;t2Unstick();toast('멈춰 있던 처리를 풀었어요');renderBattle();t2Broadcast(true);}}else T2.pz=0;
 if(T2.queue.length&&!T2.pumping&&!T2.proc)t2Pump();
 if(!T2.proc&&!T2.pumping&&!T2.queue.length&&now-(T2.lastSend||0)>5000)t2Broadcast(true);}catch(e){}},2000);
function t2HeroAttack(hi){if(!B||!B.t2||B.busy||B.sel<0||B.side!=='me'||t2Done1())return;closeInfo();const si=B.sel,me=B.me,u=me.board[si];if(!u)return;
 if(!targetsFor(si).hero){toast(gmxIdx(B.foe).length?'거다이맥스 포켓몬이 지키고 있어요! 먼저 쓰러뜨려야 해요':(blockNudge(),blockMsgH()));return;}
 if(B.coop.foeTeam[hi]&&B.coop.foeTeam[hi].hp<=0&&B.coop.foeTeam[1-hi]&&B.coop.foeTeam[1-hi].hp>0)hi=1-hi;const P=B.coop.foeTeam[hi];B.busy=true;const q=pickQ({cyc:1});
 (async()=>{let ok=true,crit=false,hint=0;try{if(q){const r=await battleQ(q,{who:u.id,what:`${esc(P.name)}에게 공격!`,hint:'atk'});ok=r.ok;crit=!!(ok&&q.tier==='H');hint=r.hint?1:0;}}catch(e){console.error(e);}
  bossSubmit({type:'attack',si,tg:{hero:1,h:hi},ok,crit,hint});if(B)B.busy=false;})();}
window.t2HeroAttack=t2HeroAttack;

if(typeof document!=='undefined'){const st=document.createElement('style');st.id='t2css';st.textContent=`
.t2modes{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.t2mode{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:18px 10px;border:3px solid var(--line);border-radius:20px;background:#fff;cursor:pointer;font-family:inherit;color:inherit;box-shadow:0 4px 0 rgba(0,0,0,.12)}
.t2mode b{font-family:'Jua';font-size:20px}.t2mode small{font-size:12px;opacity:.75;line-height:1.35}.t2mi{font-size:34px}
.t2mode.m1{background:linear-gradient(180deg,#fff5f5,#ffe3e3)}.t2mode.m3{background:linear-gradient(180deg,#fffbe8,#fff0b8)}.t2mode.m2{background:linear-gradient(180deg,#eef5ff,#dbe9ff)}
.t2mode:active{transform:translateY(2px);box-shadow:0 2px 0 rgba(0,0,0,.12)}
@media(max-width:420px){.t2modes{grid-template-columns:1fr}}
.t2teams{display:flex;align-items:stretch;justify-content:center;gap:8px}
.t2team{flex:1;min-width:0;border-radius:16px;padding:8px;display:flex;flex-direction:column;gap:8px;border:3px solid}
.t2team.ta{background:#eaf2ff;border-color:#3d7bff}.t2team.tb{background:#fff1e4;border-color:#ff8a3d}
.t2th{font-family:'Jua';font-size:16px}.t2th small{font-size:11px;opacity:.7}
.t2vs{align-self:center;font-family:'Black Han Sans';font-size:18px;color:#777}
.t2seat{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:84px;border-radius:14px;border:3px dashed #9fb0d4;background:rgba(255,255,255,.75);cursor:pointer;font-family:inherit;color:inherit;padding:6px 4px}
.t2seat.tb{border-color:#e0a572}.t2seat.full{border-style:solid;background:#fff}.t2seat.ta.full{border-color:#3d7bff}.t2seat.tb.full{border-color:#ff8a3d}
.t2seat.mine{box-shadow:0 0 0 3px rgba(255,200,0,.6);cursor:pointer}.t2seat:disabled{cursor:default;opacity:1}
.t2seat .t2av{width:40px;height:40px;display:flex;align-items:center;justify-content:center}.t2seat .t2av img{max-width:40px;max-height:40px}
.t2seat .t2nm{font-family:'Jua';font-size:14px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.t2seat small{font-size:11px;opacity:.75}.t2plus{font-size:26px;line-height:1;opacity:.55}
.hero.t2h{padding:2px 8px 2px 2px;gap:5px;min-width:0;flex:0 1 auto}
.hero.t2h .av{width:34px;height:34px;border-width:2px}.hero.t2h .av img,.hero.t2h .av svg{width:30px;height:30px}
.hero.t2h .hn{font-size:12px;max-width:24vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hero.t2h .hhp{font-size:17px}
.lane.coopLane.c10{grid-template-columns:repeat(10,minmax(0,1fr))}
.lane.coopLane.c12{grid-template-columns:repeat(12,minmax(0,1fr))}
@media(max-width:1100px){
 .lane.coopLane.c12{grid-template-columns:repeat(6,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr))}
}
#t2Force{font-size:12px;padding:5px 8px;margin-right:4px}
@media(max-width:560px){
 .lane.coopLane.c10{grid-template-columns:repeat(5,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr))}
 .lane.coopLane.c12{grid-template-columns:repeat(6,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr))}
 #foeLane.coopLane,#myLane.coopLane{flex:1 1 0}
 #foeLane.coopLane .slot{aspect-ratio:auto!important;height:100%!important;max-height:100%!important;min-height:0!important}
 body:has(#heroFoeB) #foeLane.coopLane{min-height:0}
}`;document.head.appendChild(st);}

/* ===================================================================
   4인 협동 보스전: 4명이 한 팀(10칸 공유 필드), 전설 보스 2마리, 트레이너 체력 공유
   5인 협동 보스전: 5명이 한 팀(12칸 공유 필드), 전설 보스 3마리, 기본 체력 25
   =================================================================== */
const B4_HP=30; // 기본 공유 체력 (각자 체력증강 레벨만큼 더해요: 모두 5레벨이면 30+20=50)
const B3_HP=40; // 3인 보스전 기본 공유 체력 (모두 5레벨이면 40+15=55)
const B5_HP=25; // 5인 보스전 기본 공유 체력 (모두 5레벨이면 25+25=50)
const _renderBossCoop=renderBossCoop;
renderBossCoop=function(keep){_renderBossCoop.apply(this,arguments);try{const p=document.querySelector('#view .panel');if(p&&!p.querySelector('#bmBack')){const h=p.querySelector('h2');const b=document.createElement('button');b.id='bmBack';b.className='btn ghost sm';b.style.cssText='float:right';b.textContent='← 모드 선택';b.onclick=()=>{sfx('tap');renderBossMode();};if(h)h.insertAdjacentElement('afterbegin',b);}}catch(e){}};

// 협동 보스전 모드 선택 (2인 / 3인 / 4인 / 5인)
function renderBossMode(){S.screen='bosscoop';bossClose();t2Close();const m=S.meta;
 $('#view').innerHTML=hudHTML()+`<div class=wrap><div class=panel><h2>⚔️ 협동 보스전</h2>
  <p style="line-height:1.6">보스전 방식을 골라요. 모두 인터넷으로 연결돼요.</p>
  <div class=t2modes style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
   <button class="t2mode m1" id=bmM2><span class=t2mi>⚔️</span><b>2인 턴제 보스전</b><small>친구 한 명과 번갈아 차례를 이어 가며 보스를 공략해요</small></button>
   <button class="t2mode m3" id=bmM2s><span class=t2mi>⚡</span><b>2인 동시 보스전</b><small>둘이 동시에 행동하고, 전설 보스 한 마리에 도전해요</small></button>
   <button class="t2mode m1" id=bmM3><span class=t2mi>👥</span><b>3인 보스전</b><small>친구 2명과 함께 전설 보스 2마리에 도전해요 · 기본 체력 40</small></button>
   <button class="t2mode m2" id=bmM4><span class=t2mi>👥</span><b>4인 보스전</b><small>친구 3명과 함께 전설 보스 2마리에 도전해요</small></button>
   <button class="t2mode m2" id=bmM5><span class=t2mi>👥</span><b>5인 보스전</b><small>친구 4명과 함께 전설 보스 3마리에 도전해요 · 기본 체력 25 · 12칸</small></button>
  </div>
  <p class=mut style="font-size:12px;margin-top:10px">인터넷 연결이 필요해요. <b>학교 와이파이는 작동하지 않을 수 있어요.</b> 모두 같은 버전의 게임 파일을 써 주세요.</p></div></div>`;
 bindHud();
 $('#bmM2').onclick=()=>{sfx('tap');renderBossCoop();};
 $('#bmM2s').onclick=()=>{sfx('tap');renderBoss4(2);};
 $('#bmM3').onclick=()=>{sfx('tap');renderBoss4(3);};
 $('#bmM4').onclick=()=>{sfx('tap');renderBoss4();};
 $('#bmM5').onclick=()=>{sfx('tap');renderBoss4(5);};}
function renderBoss4(n){n=n===2?2:n===3?3:n===5?5:4;S.screen='bosscoop';bossClose();t2Close();const m=S.meta;ensureDeck();
 $('#view').innerHTML=hudHTML()+`<div class=wrap><div class=panel><div class=row style="align-items:center"><h2 style="margin:0">${n===2?'⚡ 2인 동시 보스전':n===3?'👥 3인 협동 보스전':n===5?'👥 5인 협동 보스전':'👥 4인 협동 보스전'}</h2><span class=hudSp></span><button class="btn ghost sm" id=b4Back>← 모드 선택</button></div>
  <p style="line-height:1.65;margin-top:8px">방장이 방을 열고 친구 <b>${n-1}명</b>이 같은 번호로 들어오면 시작해요. <b>방장은 🎟️ 보스전 티켓 1장</b>이 필요하고, <b>친구는 참가비 코인 ${BOSS_FEE}개</b>를 방장에게 내요. (내 티켓 <b>${bossTickets()}장</b>) 보스는 ${n===2?'<b>4성 20% · 5성 80%</b>로 나타나고, 10% 확률로 <b>2마리</b>가 함께 나와요.':n===5?'<b>항상 전설 포켓몬 3마리</b>예요.':'<b>항상 전설 포켓몬 2마리</b>예요.'}</p>
  <div class="tiles cmp" style="margin-top:8px"><div class=tile><span class=ti>✨</span><span class=tn>${n===2?'4성 20% · 5성 80%':'5성 보스 100%'}</span><span class=td>${n===2?'보스 1마리 (10%는 2마리)':'항상 전설 포켓몬'}</span></div><div class=tile><span class=ti>👹</span><span class=tn>보스 ${n===2?'1~2마리':n===5?'3마리':'2마리'}</span><span class=td>${n===2?'가끔 두 마리가 나와요':'한꺼번에 등장해요'}</span></div></div>
  <details class=bossHow style="margin-top:10px"><summary class="btn ghost sm" style="cursor:pointer;list-style:none">📖 설명 보기 / 접기</summary><div class=explain style="margin-top:8px;font-size:14px;line-height:1.7">• ${n}명 모두 <b>동시에</b> 행동하고, 모두 <b>차례 끝</b>을 누르면 보스 차례가 돼요.<br>• ${n===2?8:n===5?12:10}칸 필드와 <b>트레이너 체력은 모두가 함께</b> 써요. 체력은 <b>${n===2?20:n===3?B3_HP:n===5?B5_HP:30}</b> + 각자의 체력증강 레벨 합(모두 5레벨이면 <b>${n===2?30:n===3?B3_HP+15:50}</b>)이에요.<br>• 트레이너 스킬은 <b>각자</b> 쓸 수 있어요.<br>${n===2?'• 보스는 <b>1마리면 2회</b>, <b>2마리면 각각 1회</b> 공격해요. 한 마리가 쓰러지면 남은 보스는 2회가 돼요. 우리 필드에 포켓몬이 <b>3마리 이상</b>이면 +1회(6마리 이상이면 +2회), 보스 체력이 <b>25% 이하</b>면 발악해서 +1회 (최대 4회). 체력이 50% 이하면 분노해서 공격력도 +1이에요.<br>':'• 보스는 <b>각각 2회</b> 공격해요. 체력이 <b>50% 이하</b>면 분노해서 공격력 +1, <b>25% 이하</b>면 발악해서 +1회, 우리 필드에 포켓몬이 <b>5마리 이상</b>이면 +1회 (최대 4회).<br>'}• 보스가 트레이너를 공격하면 <b>방어 문제가 한 명씩 돌아가며</b> 나와요. 다른 친구들은 그 친구가 고른 답을 보고, 결과가 <b>❤️ / 💔</b>로 나와요. 내 차례가 아닐 땐 <b>답이라고 생각하는 보기를 눌러 ❤️ 로 응원</b>할 수 있어요. 푸는 친구 화면에 작은 ❤️ 가 최대 ${n-1}개 떠요. ❤️는 <b>문제 시작 30초 뒤</b>에 떠요.<br>• <b>차례 끝</b>을 누르면 아직 행동 중인 친구의 <b>공격·공부 기술 문제</b>를 구경할 수 있어요. 친구가 여럿이면 <b>◀ ▶</b> 로 바꿔 볼 수 있어요. (방어 문제는 언제나 가장 먼저 보여요)<br>• 보스를 쓰러뜨리면 보스 1마리당 조각 ${n===5?2:(typeof BOSS_SHARDS!=='undefined'?BOSS_SHARDS:3)}개를 받아요.<br>• 보스 체력이 20% 이하가 되면 메가진화나 거다이맥스가 가능한 보스는 진화해요 (공격력만 올라요, 체력은 그대로). 10% 이하가 되면 포획 버튼이 떠요. 공 1개를 골라 던지면 모두에게 게이지가 떠요 (퍼펙트 1명당 +2%). 포획에 실패하면 도망갈 수 있어요 (시도할수록 확률 상승).</div></details>
  <div class=row style="margin-top:12px"><button class="btn red big" id=b4Host>방 만들기 (방장)</button><button class="btn blue big" id=b4Join>방 들어가기</button></div><button class="btn ghost big" id=b4Rj style="width:100%;margin-top:8px">🔁 다시 들어가기 (나갔다 돌아올 때)</button>
  <div class=row style="margin-top:8px;align-items:center"><input class="inp codeIn" id=b4Code maxlength=4 inputmode=numeric placeholder="방 번호 4자리" style="flex:1"></div>
  <p class=mut style="font-size:12.5px;margin-top:8px;line-height:1.5">🔁 <b>전투 중에 나갔다면?</b> <b>🔁 다시 들어가기</b>를 누르고 <b>같은 닉네임</b>으로 방 번호를 넣으면 원래 자리에서 이어서 할 수 있어요. (방장이 껐다면 방장이 「방장이었어요」를 고르고, 남은 친구들은 화면을 켠 채 기다려 주세요 · 방장 손패는 새로 뽑아요)</p>
  <p class=mut style="font-size:12px;margin-top:10px">인터넷 연결이 필요해요. 학교 와이파이는 작동하지 않을 수 있어요. <a href="#" id=b4Net style="color:inherit">📶 연결 시험</a> · 내 덱 ${m.deck.length}장</p></div>
  <div class=panel id=t2Box style="display:none;text-align:center"></div><div class=panel><h3>협동 규칙</h3><ul style="line-height:1.8;padding-left:20px"><li>${n}명이 한 팀 · 모두 동시에 행동</li><li>모두 <b>차례 끝</b>을 누르면 보스 차례</li><li>각자 자기 손패와 덱으로 행동</li><li>${n===2?8:n===5?12:10}칸 필드와 트레이너 체력은 모두가 함께 사용</li><li>문제는 행동한 플레이어가 풀고, 결과를 호스트가 판정·반영</li><li>보스 행동과 방어 문제(한 명씩 돌아가며)는 호스트가 한 번만 처리해 모든 화면에 전파</li></ul></div></div>`;
 bindHud();
 $('#b4Back').onclick=()=>{sfx('tap');renderBossMode();};
 $('#b4Net').onclick=e=>{e.preventDefault();sfx('tap');showNetTest();};
 $('#b4Host').onclick=()=>{sfx('tap');t2Host('boss',n);};
 $('#b4Rj').onclick=()=>rjPrompt('b'+n,(h,c)=>h?t2Host('boss',n,c):t2Join(c,'boss',n,true));
 $('#b4Join').onclick=()=>{const c=($('#b4Code').value||'').replace(/\D/g,'');if(c.length!==4){toast('방 번호 4자리를 입력해 주세요');return;}sfx('tap');t2Join(c,'boss',n);};}

function t2DrawBossLobby(){const N=t2N(),L=T2.lobby,ms=L.members,host=T2.host,can=host&&ms.length===N;
 const slots=Array.from({length:N},(_,i)=>i).map(i=>{const o=ms[i];return o?`<div class="t2seat ta full${o.id===L.you?' mine':''}"><span class=t2av>${monImg(o.av,'front')}</span><span class=t2nm>${nameTag(o.name)}</span><small>${o.host?'방장':o.id===L.you?'나':'준비 완료'}</small></div>`:`<div class="t2seat ta empty"><span class=t2plus>＋</span><span class=t2nm>기다리는 중</span><small>친구가 들어오면 채워져요</small></div>`;}).join('');
 t2Box(`<h3 style="margin:0 0 4px">${host?'친구에게 이 방 번호를 알려 주세요':'방 '+esc(T2.code)+'에 들어왔어요'}</h3>
  ${host?`<div class=tcode style="font-size:46px;margin:2px 0">${T2.code}</div>`:''}
  <p class=mut style="margin:2px 0 8px">모인 사람 ${ms.length}/${N}명</p>
  <p class=mut style="font-size:12px;margin:0 0 4px">${host?'시작하면 🎟️ 티켓 1장이 사용돼요 · 친구 1명당 참가비 50코인을 받아요.':'시작할 때 참가비 50코인을 방장에게 내요.'}</p>
  <div class=t2b4grid${N===2?' style="grid-template-columns:repeat(2,1fr)"':(N===3||N===5)?' style="grid-template-columns:repeat(3,minmax(0,1fr))"':''}>${slots}</div>
  <div class=row style="justify-content:center;margin-top:12px;gap:8px">${host?`<button class="btn red big" id=t2Start ${can?'':'disabled'}>⚔️ 보스전 시작</button>`:''}<button class="btn ghost" id=t2Cancel>나가기</button></div>
  <p class=mut style="font-size:12px;margin-top:8px">${host?(can?N+'명이 모였어요! 시작할 수 있어요.':'친구 '+(N-1)+'명이 모이면 시작 버튼이 켜져요.'):'방장이 보스전을 시작하기를 기다려요.'}</p>`);
 const st=$('#t2Start');if(st)st.onclick=()=>{sfx('tap');t2StartBoss();};}

function t2TurnBanner(team){banner.local=1;if(B.t2.boss)banner(team===0?'우리 차례!':'보스의 차례!',team===0?(t2N()===2?'두 명이':t2N()===3?'세 명이':t2N()===5?'다섯 명이':'네 명이')+' 동시에 행동해요':'공격을 조심해요',1200);else banner(team===B.t2.vt?'우리 팀 차례!':'상대 팀 차례!',team===B.t2.vt?'두 명이 동시에 행동해요':'',1200);banner.local=0;}

// 2인 동시 보스전: 2인 턴제와 같은 규칙 — ★4 20% · ★5 80%, 10% 확률로 2마리 (아직 없는 포켓몬 위주)
function t2BossPick2(hi){const pool=MON_IDS.filter(id=>MON[id]&&(MON[id].rar===4||MON[id].rar===5));const own=new Set();hi.forEach(h=>(h.owned||[]).forEach(x=>own.add(+x)));
 const one=()=>{const rar=rnd()<.8?5:4;const tier=r=>{const p=pool.filter(id=>MON[id].rar===r&&!own.has(id));return p.length?p:null;};
  const p=tier(rar)||tier(rar===5?4:5)||pool.filter(id=>MON[id].rar===rar);return rpick(p.length?p:pool);};
 const id=one();const ids=[id];if(rnd()<.1){let j=one(),n=0;while(j===id&&n++<10)j=one();ids.push(j);}return ids;}
function t2BossPick(hi,cnt){cnt=cnt||2; // 전설 2마리: 우리 중 아무도 없는 전설을 먼저 찾아요
 const pool=MON_IDS.filter(id=>MON[id]&&MON[id].rar===5);const own=new Set();hi.forEach(h=>(h.owned||[]).forEach(x=>own.add(+x)));
 const fresh=pool.filter(id=>!own.has(id));const pick=[];const src=()=>{const a=fresh.filter(x=>!pick.includes(x));return a.length?a:pool.filter(x=>!pick.includes(x));};
 while(pick.length<cnt){const a=src();pick.push(rpick(a));}return pick;}

function t2StartBoss(){if(!T2.host||T2.started||T2.mode!=='boss')return;const N=t2N();const ms=T2.members.filter(m=>m.hi);if(ms.length!==N)return;
 if(bossTickets()<1){toast('보스전 티켓이 없어요. 방을 열 때 티켓이 필요해요.');return;}
 ms.forEach((m,i)=>{m.team=0;m.pos=i;});
 const used={};const nameOf=m=>{let n=m.name||'친구';if(used[n]){used[n]++;n+=' '+'②③④⑤'[used[n]-2];}else used[n]=1;return n;};
 const sh={hp:0,max:0};ms.forEach(m=>{sh.max+=t2clamp(m.hi.vit,0,5);});sh.max+=(N===2?20:N===3?B3_HP:N===5?B5_HP:B4_HP);sh.hp=sh.max;
 const players=ms.map((m,i)=>{const hi=m.hi;const p=mkPlayer(nameOf(m),hi.deck,sh.max,MON[hi.av]?hi.av:25,false,hi.owned,true);
  p.manaLv=t2clamp(hi.mana,0,5);p.studyLv=t2clamp(hi.study,0,5);p.powerUses=Math.min(3,STUDY_BASE+studyExtraUses(p.studyLv));p.handLv=t2clamp(hi.hand,0,5);p.evoLv=t2clamp(hi.evo,0,5);
  p.skm=skinCleanMap(hi.sk);p.team=0;p.tix=i;p.mid=m.id;p.tsUsed={};p.ctr=0;p.t2done=0;p.qc=0;
  Object.defineProperty(p,'hp',{get:()=>sh.hp,set:v=>{sh.hp=v;},enumerable:true,configurable:true});Object.defineProperty(p,'max',{get:()=>sh.max,set:v=>{sh.max=v;},enumerable:true,configurable:true});return p;});
 const board=Array(N===2?8:N===5?12:10).fill(null);players.forEach(p=>{p.board=board;for(let i=0;i<3;i++)draw(p,true);}); // 2인 동시 보스전은 8칸, 4인 협동은 10칸, 5인 협동은 12칸
 const ids=N===2?t2BossPick2(ms.map(m=>m.hi)):t2BossPick(ms.map(m=>m.hi),N===5?3:2);const slots=N===2?(ids.length===2?[1,3]:[2]):N===5?[0,2,4]:[1,3];
 const foe=mkPlayer(ids.map(x=>MON[x].name).join(' · '),[],1,ids[0],true,[],false);foe.team=1;foe.tix=0;foe.mid=0;
 ids.forEach((wid,k)=>{const u=mkUnit(wid);u.hp=MON[wid].hp*15;u.max=u.hp;u.atk=MON[wid].atk;u.att=0;u.fresh=0;u.wildEncounter=1;foe.board[slots[k]]=u;});
 const li=0;BC.localIndex=li;BC.host=true;BC.t2=true;T2.started=true;T2.queue=[];T2.resDone=false;S.meta.tickets=bossTickets()-1;const feeN=ms.filter(x=>!x.host).length;if(feeN>0)S.meta.coins+=BOSS_FEE*feeN;T2.charged=true;autoSave();   // 방장은 티켓 1장 사용 · 친구 참가비 50코인씩 방장에게
 const st={n:0,id:ids[0],ids:ids.slice(),finished:false,caughtIds:[],caughtNewIds:[],captureModalOpen:false,note:'',previousScreen:'bosscoop',coopMode:true};
 B={gi:-2,g:{n:N+'인 동시 협동 보스전',ldr:'보스 포켓몬',c:TYPE_COL[MON[ids[0]].types[0]]||'#ffc93c'},diff:Math.max(1,Math.ceil(lvOf(S.meta.xp).lv/2)),turn:0,round:0,side:'me',me:players[li],foe,sel:-1,pick:-1,busy:false,combo:0,qn:0,qc:0,defUsed:false,over:false,
  wildMode:true,wildId:ids[0],wildSlot:slots[0],wildIds:ids.slice(),wildSlots:slots.slice(),wildState:st,capturePrompted:true,trainerSkillUsed:players[li].tsUsed,
  t2:{teams:[players,[foe]],boards:[board,foe.board],turn:0,eng:0,done:[Array(N).fill(0),[]],vt:0,boss:true,defRot:0,ver:T2_VER},
  coop:{players,foeTeam:[foe],active:li,localIndex:li,seq:0,processing:false,result:null,t2:true}};
 S.screen='battle';try{$('#bq').classList.remove('on');closeInfo();}catch(e){}$('#battle').innerHTML='';$('#battle').classList.add('on');startBgm('battle');
 t2Broadcast(true,true);renderBattle();banner(ids.length>1?('전설 보스 '+ids.length+'마리 등장!'):'전설 보스 등장!',`${ids.map(x=>esc(MON[x].name)).join(' · ')} · ${N}인 협동 전투 시작!`,1900);
 if(feeN>0)setTimeout(()=>toast('친구 '+feeN+'명이 참가비 '+BOSS_FEE+'코인씩 냈어요 (+'+(BOSS_FEE*feeN)+'코인)'),2000);
 setTimeout(()=>{if(B&&B.t2&&!B.over)t2BossNext(true);},1800);}

// 보스 차례가 끝나면(또는 처음) 네 사람이 한꺼번에 새 차례를 시작해요
async function t2BossNext(first){if(!B||!B.t2||B.over)return;const T=B.t2;T2.proc=true;T2.turnAt=Date.now();T2.ff=0;
 try{T.turn=0;T.done[0]=Array(T.teams[0].length).fill(0);T.teams[0].forEach(p=>{p.t2done=0;p.t2uc=0;p.ctr=0;});B.busy=true;if(B.rl2)t2Adopt(0);
  for(let idx=0;idx<T.teams[0].length;idx++){t2Persp(0,idx);await startTurn('me');if(!B||B.over)return;}
  if(B.rl2)T.teams[0].forEach((p,i)=>{if(p.hp<=0){T.done[0][i]=1;p.t2done=1;}});
  t2Sync();}
 finally{T2.proc=false;}
 if(!B||B.over)return;B.coop.processing=false;t2Rest();B.busy=false;t2TurnBanner(0);t2Raw({t:'t2-turn',team:0});renderBattle();t2Broadcast(true);}
async function t2BossTurn(){if(!B||!B.t2||B.over)return;const T=B.t2;T2.proc=true;T2.turnAt=Date.now();
 try{T.turn=1;t2Sync();B.coop.players=T.teams[0];B.coop.foeTeam=T.teams[1];B.coop.active=0;B.me=T.teams[0][0];B.foe=T.teams[1][0];B.side='me';T.eng=0;B.busy=true;
  t2TurnBanner(1);t2Raw({t:'t2-turn',team:1});renderBattle();t2Broadcast(true);
  await startTurn('foe');}
 catch(e){console.error('boss turn',e);}
 finally{T2.proc=false;}}
// 보스 공격 횟수: 기본 2회(전설 1마리만 남으면 3회) · 체력 25% 이하 +1 · 우리 필드 포켓몬 5마리 이상 +1 · 최대 5회
function bossEscalate4(foe){const live=foe.board.map((u,i)=>u&&u.hp>0?i:-1).filter(i=>i>=0);if(!live.length)return;
 const ally=B.t2.boards[0].filter(u=>u&&u.hp>0).length;
 if(live.length===1&&(B.wildIds||[]).length>=2&&!B.t2.soloRage){B.t2.soloRage=1;try{const su=foe.board[live[0]];banner('보스가 홀로 남아 분노하였습니다!',`${esc(MON[su.id].name)}의 기본 공격 횟수 3회`,1700);fx(unitEl(foe,live[0]),'홀로 남아 분노! 공격 3회','big');}catch(e){}}
 live.forEach(i=>{const u=foe.board[i];if(!u)return;
  if(!u.ph1&&u.hp<=u.max*BOSS_ESC.phase1){u.ph1=1;u.atk+=1;try{banner('보스가 흥분했어요!',`${esc(MON[u.id].name)}의 공격력 +1`,1500);fx(unitEl(foe,i),'흥분! 공격력 +1','big');}catch(e){}}
  if(!u.ph2&&u.hp<=u.max*.25){u.ph2=1;try{banner('보스가 발악해요!',`${esc(MON[u.id].name)}의 공격 횟수 +1`,1500);fx(unitEl(foe,i),'공격 +1회','big');}catch(e){}}
  if(u.frozen)return;let add=(u.ph2?1:0)+(ally>=5?1:0);
  if(add>0){u.att=Math.min(5,u.att+add);u.attTot=u.att;if(ally>=5){try{fx(unitEl(foe,i),'우리 필드가 넓어서 공격 +1','txt');}catch(e){}}}});}
// 방어 문제: 플레이어 4명이 한 명씩 번갈아 가며 받아요
function t2BossDefender(tg){const T=B.t2,L=T.teams[0];
 if(B.rl2){const al=L.filter(p=>p.hp>0);if(!al.length)return L[0];if(tg&&tg.p!=null&&L[tg.p]&&L[tg.p].hp>0)return L[tg.p];const q=al[(T.defRot||0)%al.length];T.defRot=((T.defRot||0)+1)%al.length;return q;}const p=L[(T.defRot||0)%L.length];T.defRot=((T.defRot||0)+1)%L.length;return p;}
const t2Member=p=>T2.members.find(m=>m.id===p.mid);
function t2IsRemote(p){const m=t2Member(p);return !!(m&&!m.host);}
/* ===== 2:2 · 2인 동시 · 4인 관전 문제 =====
   • 방어 문제: 모두가 구경 (다른 문제보다 우선)
   • 공격·공부 기술 문제: 내가 쉬는 차례(상대 팀 차례)이거나 내가 '차례 끝'을 누른 뒤에만 구경
   • 구경할 문제가 여러 개면 ◀ ▶ 로 친구를 바꿔 봐요 · ❤️는 같은 편에게만, 푸는 친구 화면에는 30초 뒤에 떠요 */
function t2RelayAll(srcMid,d){try{const T=B&&B.t2;if(!T)return;const ps=t2Pos(srcMid);if(!ps)return;const hm=t2HostMid();
 if(d.t==='boss-heart'){const to=Number(d.to),tp=t2Pos(to);if(!tp||tp.t!==ps.t||to===srcMid)return;
  if(to===hm){try{bossHeartShow(+d.i,0,srcMid);}catch(e){}}else{const mm=T2.members.find(x=>x.id===to);t2SendTo(mm,{t:'boss-heart',i:d.i,f:srcMid});}return;}
 const out=Object.assign({},d,{s:srcMid,tm:ps.t});
 T2.members.forEach(x=>{if(x.id!==srcMid&&!x.host)t2SendTo(x,out);});
 if(srcMid!==hm)t2Spec(out);}catch(e){console.warn('t2RelayAll',e);}}
const SPEC={items:{},tm:{},cur:null,sig:'',n:0,shown:0};
function t2SpecResting(){try{const T=B.t2;if(T.turn!==T.vt)return true;return !!(T.done&&T.done[T.vt]&&T.done[T.vt][BC.localIndex]);}catch(e){return false;}}
function t2SpecList(){const its=Object.values(SPEC.items).filter(x=>x&&x.q);const defs=its.filter(x=>x.k==='def');if(defs.length)return defs;return t2SpecResting()?its:[];}
function t2Spec(d){try{const s=d.s;if(s==null)return;
 if(d.t==='boss-dq'){clearTimeout(SPEC.tm[s]);SPEC.items[s]={s,n:++SPEC.n,k:d.k||'atk',q:d.q,name:d.name,tm:d.tm,res:null,heart:-1};SPEC.tm[s]=setTimeout(()=>t2SpecDrop(s),90000);}
 else{const it=SPEC.items[s];if(!it)return;it.res={i:d.i,ok:!!d.ok};clearTimeout(SPEC.tm[s]);SPEC.tm[s]=setTimeout(()=>t2SpecDrop(s),1800);}
 SPEC.sig='';t2SpecRefresh();
 if(d.t!=='boss-dq'){const it=SPEC.items[s];if(it&&it.res&&SPEC.cur===s&&$('#pvSpec')){try{it.res.ok?sfx('ok',1):sfx('wrong');}catch(e){}}}}catch(e){console.warn('t2Spec',e);}}
function t2SpecDrop(s){delete SPEC.items[s];clearTimeout(SPEC.tm[s]);SPEC.sig='';t2SpecRefresh();}
function t2SpecRefresh(){try{
 if(!B||!B.t2||B.over){if(SPEC.shown){pvSpecHide();SPEC.shown=0;}if(Object.keys(SPEC.items).length){Object.values(SPEC.tm).forEach(clearTimeout);SPEC.items={};SPEC.tm={};}SPEC.cur=null;SPEC.sig='';return;}
 const L=t2SpecList();
 if(!L.length){if(SPEC.shown){pvSpecHide();SPEC.shown=0;}SPEC.cur=null;SPEC.sig='';return;}
 const it=L.find(x=>x.s===SPEC.cur)||L[0];SPEC.cur=it.s;
 const sig=[it.s,it.n,it.k,it.res?it.res.i+':'+it.res.ok:'',L.length,L.indexOf(it)].join('|');
 if(sig===SPEC.sig&&$('#pvSpec'))return;SPEC.sig=sig;t2SpecDraw(it,L);}catch(e){console.warn('t2SpecRefresh',e);}}
function t2SpecDraw(it,L){const q=it.q;if(!q||!Array.isArray(q.ch))return;pvSpecHide();SPEC.shown=1;
 const k=it.k,mate=it.tm===B.t2.vt,nm=esc(it.name||'친구'),kt=k==='atk'?'공격':k==='pow'?'공부 기술':'방어',sk=SKM[q.sk]?esc(SKM[q.sk].n):'',idx=L.indexOf(it);
 const el=document.createElement('div');el.id='pvSpec';el.className='k-'+k;
 const help=it.res?'':mate?'<div class=pvsHelp>👆 답이라고 생각하는 보기를 눌러 ❤️ 로 푸는 친구를 응원해요 (친구 화면에는 문제 시작 30초 뒤에 떠요)</div>':`<div class=pvsHelp style="background:#eef2fb;color:#334155">👀 상대 팀의 ${kt} 문제를 구경하는 중이에요</div>`;
 el.innerHTML=`<div class=pvsHead>${k==='atk'?'⚔️':k==='pow'?'📚':'🛡️'} <b>${nm}</b>님이 ${kt} 문제를 푸는 중… <span class=pvsSt>생각하는 중 🤔</span></div>${L.length>1?`<div class=pvsNav><button data-d="-1">◀</button><span>${idx+1} / ${L.length}</span><button data-d="1">▶</button></div>`:''}${help}<div class=pvsQ>${sk?`<div class=pvsSk>${sk}</div>`:''}<div class=pvsText>${fmtMath(q.q||'')}</div>${q.pic?`<div class=pvsPic>${q.pic}</div>`:''}<div class=pvsCh>${q.ch.map((c,i)=>`<span class=pvsC data-i="${i}">${fmtMath(esc(c))}</span>`).join('')}</div></div>`;
 el.querySelectorAll('.pvsNav button').forEach(b=>b.onclick=()=>{const l=t2SpecList();if(l.length<2)return;const j=l.findIndex(x=>x.s===SPEC.cur);SPEC.cur=l[(j+Number(b.dataset.d)+l.length)%l.length].s;SPEC.sig='';try{sfx('tap');}catch(e){}t2SpecRefresh();});
 if(it.res){const c=el.querySelector(`.pvsC[data-i="${it.res.i}"]`);if(c)c.classList.add(it.res.ok?'ok':'no');const st=el.querySelector('.pvsSt');if(st){st.textContent=it.res.ok?(k==='def'?'정답! ⭕ 방어 성공':k==='pow'?'정답! ⭕ 카드 +1':'정답! ⭕'):'오답… ❌';st.classList.add(it.res.ok?'ok':'no');}}
 else if(mate){el.classList.add('canHelp');if(it.heart>=0){const h=el.querySelector(`.pvsC[data-i="${it.heart}"]`);if(h)h.classList.add('heart');}
  el.querySelectorAll('.pvsC').forEach(c=>c.onclick=()=>{if(it.res)return;el.querySelectorAll('.pvsC.heart').forEach(x=>x.classList.remove('heart'));c.classList.add('heart');it.heart=+c.dataset.i;try{sfx('tap');}catch(e){}try{bossSend({t:'boss-heart',i:+c.dataset.i,to:it.s});}catch(e){}});}
 document.body.appendChild(el);}
{const _rbSpec=renderBattle;renderBattle=function(){const r=_rbSpec.apply(this,arguments);try{t2SpecRefresh();}catch(e){}return r;};}
// 구경하는 친구들에게는 결과를 하트로 보여 줘요
const _pvSpecResult=pvSpecResult;
pvSpecResult=function(i,ok){_pvSpecResult.apply(this,arguments);try{if(t2Active()&&B.t2.boss){const st=$('#pvSpec .pvsSt');if(st){st.textContent=ok?'❤️ 방어 성공! 체력을 지켰어요':'💔 방어 실패… 체력이 줄어요';st.classList.add(ok?'ok':'no');}
 const h=document.createElement('div');h.className='b4heart';h.textContent=ok?'❤️':'💔';document.body.appendChild(h);setTimeout(()=>{try{h.remove();}catch(e){}},1500);}}catch(e){}};

function t2BossTop(){const fo=B.foe,T=B.t2,sh=B.coop.players[0];
 const slots=aliveWildSlots();
 const roster=slots.map(i=>{const wu=fo.board[i],wm=MON[wu.id],pct=clamp(wu.hp/wu.max*100,0,100);
  return `<div class=wildEntry><div class=av style="background:#fff3cf">${monImg(wu.wsk||wu.id,'front','',true)}</div><div class=wtInfo><div class=wtName>★ ${esc(wm.name)}</div><div class=wtHp>HP ${Math.max(0,wu.hp)}/${wu.max}<span class=wtAtt> · 공격 ${wu.att>0?wu.att+'회':'2회'}</span></div><div class=endWildHp><i class="${pct<=25?'low':''}" style="width:${pct}%"></i></div></div></div>`;}).join('');
 const mates=B.coop.players.map((p,i)=>`<span class="b4m${T.done[0][i]?' dn':''}${i===BC.localIndex?' me':''}">${esc(Array.from(p.name).slice(0,3).join(''))}${T.done[0][i]?'✔':''}</span>`).join('');
 return `<div class=wildTop id=wildStatus><div class=wildRoster>${roster}</div><div class=b4bar>${B.rl2?B.coop.players.map(p=>`<span class=b4hp>❤️ ${esc(Array.from(p.name).slice(0,4).join(''))} <b>${Math.max(0,p.hp)}</b>/${p.max}</span>`).join(''):`<span class=b4hp>❤️ 팀 체력 <b>${Math.max(0,sh.hp)}</b>/${sh.max}</span>`}<span class=b4mates>${mates}</span></div></div>`;}

function t2FinishBoss(outcome,why,who){if(!B||!B.t2||B.t2.fin)return;const T=B.t2;T.fin=1;B.over=true;
 if(B.rl2){setTimeout(()=>{try{rl2Finish(outcome);}catch(e){console.error('rl2Finish',e);}},outcome==='win'?1500:900);return;}
 const ids=(B.wildState.ids||[]).filter(x=>MON[x]);
 const d={t:'t2-result',boss:1,outcome,why:why||'',who:who||'',ids,names:T.teams[0].map(p=>p.name),qcs:T.teams[0].map(p=>p.qc||0)};
 t2Raw(d);setTimeout(()=>t2OnBossResult(d),outcome==='win'?1500:900);}
function t2BossShards(){return (typeof T2!=='undefined'&&T2.bn===5)?2:(typeof BOSS_SHARDS!=='undefined'?BOSS_SHARDS:3);}
function t2OnBossResult(d){if(T2.resDone)return;T2.resDone=true;t2Done();const me=S.meta,win=d.outcome==='win';const li=BC.localIndex;const qc=(d.qcs&&d.qcs[li])||0;
 let gs=[];if(win&&d.ids&&d.ids.length){gs=d.ids.map(x=>gainBossShards(x,t2BossShards()));me.coins=(me.coins||0)+100;me.dust=(me.dust||0)+10;me.candy=(me.candy||0)+10;}
 me.candy+=qc;me.stats.candyAll=(me.stats.candyAll||0)+qc;try{gainXP(win?30:15);}catch(e){}autoSave();sfx(win?'win':'lose');if(win)confetti(60);startBgm('adventure');
 const nm=(d.ids||[]).map(x=>esc(MON[x].name)).join(' · ');
 const why=d.why==='quit'?`${esc(d.who||'누군가')}님이 전투를 그만두었어요.`:'';
 M(`<div style="text-align:center"><h2 style="font-size:30px">${win?'🏆 보스 격파!':'아쉬워요…'}</h2><p><b>${nm}</b></p>${why?`<p class=mut>${why}</p>`:''}
  <p>${win?`보스 조각 ${(d.ids||[]).length*t2BossShards()}개를 받았어요!`:'이번에는 보스를 쓰러뜨리지 못했어요.'}</p><p>우리 팀: ${(d.names||[]).map(esc).join(' · ')}<br>내가 맞힌 문제 ${qc}개</p>
  ${win?`<div class=row style="justify-content:center;gap:8px"><span class=pill>${I('coin')} +100</span><span class=pill>${I('candy')} +${10+qc}</span></div>`:''}
  <div class=mbtns><button class="btn gold" data-a=x>확인</button></div></div>`,{x:()=>{t2AfterResult();},_close:()=>{}});
 if(win&&gs[0]){try{setTimeout(()=>{try{bossRewardPack(d.ids,gs);}catch(e){console.warn(e);}},300);}catch(e){}}}

{const st=document.createElement('style');st.id='t2bcss';st.textContent=`
.t2b4grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.t2b4grid .t2seat{cursor:default}
#wildStatus{flex-wrap:wrap}
#wildStatus .wildRoster{flex:1 1 100%;flex-wrap:nowrap;gap:4px}
#wildStatus .wildEntry{flex:1 1 0;min-width:0;gap:4px;padding:3px 4px}
#wildStatus .wildEntry .av{width:30px;height:30px}
#wildStatus .wtInfo{min-width:0}
#wildStatus .wtName,#wildStatus .wtHp{font-size:12px}
#wildStatus .wtHp{overflow:hidden;text-overflow:ellipsis}
@media(max-width:560px){#wildStatus .wtAtt{display:none}#wildStatus{flex:1 1 100%}#battle .bMenuCol{flex-direction:row;align-items:center}}
#wildStatus .b4bar{flex:1 1 100%;margin-top:4px}
#wildStatus .b4bar{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:3px;flex-wrap:wrap}
.b4hp{font-family:'Jua';font-size:14px;background:rgba(255,255,255,.9);border:2px solid #e8434f;border-radius:10px;padding:0 8px}.b4hp b{color:#e8434f;font-size:17px}
.b4mates{display:flex;gap:3px;flex-wrap:wrap}.b4m{font-size:11px;font-weight:900;background:#fff;border:2px solid #9fb0d4;border-radius:8px;padding:0 5px;color:#334155}.b4m.me{border-color:#3d7bff;background:#eaf2ff}.b4m.dn{background:#dff6e6;border-color:#3cc47c}
.b4heart{position:fixed;left:50%;top:38%;font-size:90px;z-index:400;pointer-events:none;transform:translate(-50%,-50%);animation:b4h 1.4s ease-out forwards}
@keyframes b4h{0%{opacity:0;transform:translate(-50%,-30%) scale(.4)}25%{opacity:1;transform:translate(-50%,-50%) scale(1.25)}100%{opacity:0;transform:translate(-50%,-110%) scale(1)}}`;document.head.appendChild(st);}
