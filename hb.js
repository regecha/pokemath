
/* ===== 몬스터디 아레나 (독립 모듈) — 기존 pickQ·gainCard·loadPeer·PO 만 빌려 써요. 아래 CFG 로 밸런스를 조절해요. ===== */
(function(){
const CFG={
 DURS:[5,7,10],MIN_P:2,MAX_P:16,HOST_AI_MAX:6,   // HOST_AI_MAX: 방장이 대기실에서 추가할 수 있는 AI 최대 인원
 
 END_CARDS:0,                                      // (사용 안 함) 종료 조건: 한 명이 모든 종류의 포켓몬을 모으면 즉시 종료
 EV:{one:30,two:20,three:10,x2:10,x3:5,hack:10,def:5,miss:10},      // 평소 합계 100
 EV_L30:{one:30,two:20,three:10,x2:15,x3:10,hack:10,def:5,miss:0},  // 마지막 30초 합계 100 (꽝 없음: 꽝 10% 중 5%→카드3배, 5%→카드2배)
 DEX_FLY_SCROLL:1,   // 카드가 도감 자리로 날아갈 때, 자리가 화면 밖이면 도감을 그 자리까지 스크롤 (0 이면 스크롤 안 함)
 HACK_RATE:.5,LAST30_MS:30000,HACK_PITY:10,   // 카드 고르기 10번마다 최소 1번은 해킹 이벤트 보장(자연 확률로 나오면 처음부터 다시 셈)

 MINI_ON:['color','memory','circuit','virus','code','order','reaction','laser','odd','simon','stack','wire','shadow','target','slide'],
 REWARD:{1:5,2:4,3:3},REWARD_BASE:[1,2],VER:1,HB_TIMEOUT:15000,
 REWARD_MIN_P:2,REWARD_MIN_SCORE:100,   // 보상: 참가자 2명 이상 · 내 점수가 게임 시간별 기준(REWARD_SCORE) 이상
  REWARD_SCORE:{5:50,7:70,10:100},        // 게임 시간(분)별 보상 받는 최소 점수: 5분 50점 · 7분 70점 · 10분 100점 (없는 시간이면 REWARD_MIN_SCORE)
  RAND_OPP:[3,5],                          // 🎲 랜덤 매칭: 상대(AI) 인원 최소~최대 (시간은 DURS 에서 무작위)
 SOLVE_MIN_MS:2500,WRONG_WAIT:[3,5,8],TAKEOVER_STALE_MS:9000,
  ACC_MIN_Q:5   // 정답률 1위 칭호: 최소 이만큼 푼 사람만 (1문제 100% 방지). 보상은 REWARD_MIN_P·REWARD_MIN_SCORE 조건 동일
};
const TEAM_MAX=5;   // 팀전: 한 팀 최대 인원 (2v2 ~ 5v5)
const needSc=d=>(CFG.REWARD_SCORE&&CFG.REWARD_SCORE[d])||CFG.REWARD_MIN_SCORE;
const sumOK=()=>[CFG.EV,CFG.EV_L30].every(o=>Object.values(o).reduce((a,b)=>a+b,0)===100);
const rr=n=>Math.floor(Math.random()*n),pk=a=>a[rr(a.length)],now=()=>Date.now();
const tok=n=>{const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<n;i++)s+=c[rr(c.length)];return s;};
/* 해킹 아이디 = 포켓몬 한글 이름 (도감 번호 순서, 1025마리) */
const ENG='이상해씨 이상해풀 이상해꽃 파이리 리자드 리자몽 꼬부기 어니부기 거북왕 캐터피 단데기 버터플 뿔충이 딱충이 독침붕 구구 피죤 피죤투 꼬렛 레트라 깨비참 깨비드릴조 아보 아보크 피카츄 라이츄 모래두지 고지 니드런♀ 니드리나 니드퀸 니드런♂ 니드리노 니드킹 삐삐 픽시 식스테일 나인테일 푸린 푸크린 주뱃 골뱃 뚜벅쵸 냄새꼬 라플레시아 파라스 파라섹트 콘팡 도나리 디그다 닥트리오 나옹 페르시온 고라파덕 골덕 망키 성원숭 가디 윈디 발챙이 슈륙챙이 강챙이 캐이시 윤겔라 후딘 알통몬 근육몬 괴력몬 모다피 우츠동 우츠보트 왕눈해 독파리 꼬마돌 데구리 딱구리 포니타 날쌩마 야돈 야도란 코일 레어코일 파오리 두두 두트리오 쥬쥬 쥬레곤 질퍽이 질뻐기 셀러 파르셀 고오스 고우스트 팬텀 롱스톤 슬리프 슬리퍼 크랩 킹크랩 찌리리공 붐볼 아라리 나시 탕구리 텅구리 시라소몬 홍수몬 내루미 또가스 또도가스 뿔카노 코뿌리 럭키 덩쿠리 캥카 쏘드라 시드라 콘치 왕콘치 별가사리 아쿠스타 마임맨 스라크 루주라 에레브 마그마 쁘사이저 켄타로스 잉어킹 갸라도스 라프라스 메타몽 이브이 샤미드 쥬피썬더 부스터 폴리곤 암나이트 암스타 투구 투구푸스 프테라 잠만보 프리져 썬더 파이어 미뇽 신뇽 망나뇽 뮤츠 뮤 치코리타 베이리프 메가니움 브케인 마그케인 블레이범 리아코 엘리게이 장크로다일 꼬리선 다꼬리 부우부 야부엉 레디바 레디안 페이검 아리아도스 크로뱃 초라기 랜턴 피츄 삐 푸푸린 토게피 토게틱 네이티 네이티오 메리프 보송송 전룡 아르코 마릴 마릴리 꼬지모 왕구리 통통코 두코 솜솜코 에이팜 해너츠 해루미 왕자리 우파 누오 에브이 블래키 니로우 야도킹 무우마 안농 마자용 키링키 피콘 쏘콘 노고치 글라이거 강철톤 블루 그랑블루 침바루 핫삼 단단지 헤라크로스 포푸니 깜지곰 링곰 마그마그 마그카르고 꾸꾸리 메꾸리 코산호 총어 대포무노 딜리버드 만타인 무장조 델빌 헬가 킹드라 코코리 코리갑 폴리곤2 노라키 루브도 배루키 카포에라 뽀뽀라 에레키드 마그비 밀탱크 해피너스 라이코 앤테이 스이쿤 애버라스 데기라스 마기라스 루기아 칠색조 세레비 나무지기 나무돌이 나무킹 아차모 영치코 번치코 물짱이 늪짱이 대짱이 포챠나 그라에나 지그제구리 직구리 개무소 실쿤 뷰티플라이 카스쿤 독케일 연꽃몬 로토스 로파파 도토링 잎새코 다탱구 테일로 스왈로 갈모매 패리퍼 랄토스 킬리아 가디안 비구술 비나방 버섯꼬 버섯모 게을로 발바로 게을킹 토중몬 아이스크 껍질몬 소곤룡 노공룡 폭음룡 마크탕 하리뭉 루리리 코코파스 에나비 델케티 깜까미 입치트 가보리 갱도라 보스로라 요가랑 요가램 썬더라이 썬더볼트 플러시 마이농 볼비트 네오비트 로젤리아 꼴깍몬 꿀꺽몬 샤프니아 샤크니아 고래왕자 고래왕 둔타 폭타 코터스 피그점프 피그킹 얼루기 톱치 비브라바 플라이곤 선인왕 밤선인 파비코 파비코리 쟝고 세비퍼 루나톤 솔록 미꾸리 메깅 가재군 가재장군 오뚝군 점토도리 릴링 릴리요 아노딥스 아말도 빈티나 밀로틱 캐스퐁 켈리몬 어둠대신 다크펫 해골몽 미라몽 트로피우스 치렁 앱솔 마자 눈꼬마 얼음귀신 대굴레오 씨레오 씨카이저 진주몽 헌테일 분홍장이 시라칸 사랑동이 아공이 쉘곤 보만다 메탕 메탕구 메타그로스 레지락 레지아이스 레지스틸 라티아스 라티오스 가이오가 그란돈 레쿠쟈 지라치 테오키스 모부기 수풀부기 토대부기 불꽃숭이 파이숭이 초염몽 팽도리 팽태자 엠페르트 찌르꼬 찌르버드 찌르호크 비버니 비버통 귀뚤뚜기 귀뚤톡크 꼬링크 럭시오 렌트라 꼬몽울 로즈레이드 두개도스 램펄드 방패톱스 바리톱스 도롱충이 도롱마담 나메일 세꿀버리 비퀸 파치리스 브이젤 플로젤 체리버 체리꼬 깝질무 트리토돈 겟핸보숭 흔들풍손 둥실라이드 이어롤 이어롭 무우마직 돈크로우 나옹마 몬냥이 랑딸랑 스컹뿡 스컹탱크 동미러 동탁군 꼬지지 흉내내 핑복 페라페 화강돌 딥상어동 한바이트 한카리아스 먹고자 리오르 루카리오 히포포타스 하마돈 스콜피 드래피온 삐딱구리 독개굴 무스틈니 형광어 네오라이트 타만타 눈쓰개 눈설왕 포푸니라 자포코일 내룸벨트 거대코뿌리 덩쿠림보 에레키블 마그마번 토게키스 메가자리 리피아 글레이시아 글라이온 맘모꾸리 폴리곤Z 엘레이드 대코파스 야느와르몽 눈여아 로토무 유크시 엠라이트 아그놈 디아루가 펄기아 히드런 레지기가스 기라티나 크레세리아 피오네 마나피 다크라이 쉐이미 아르세우스 비크티니 주리비얀 샤비 샤로다 뚜꾸리 차오꿀 염무왕 수댕이 쌍검자비 대검귀 보르쥐 보르그 요테리 하데리어 바랜드 쌔비냥 레파르다스 야나프 야나키 바오프 바오키 앗차프 앗차키 몽나 몽얌나 콩둘기 유토브 켄호로우 줄뮤마 제브라이카 단굴 암트르 기가이어스 또르박쥐 맘박쥐 두더류 몰드류 다부니 으랏차 토쇠골 노보청 동챙이 두까비 두빅굴 던지미 타격귀 두르보 두르쿤 모아머 마디네 휠구 펜드라 소미안 엘풍 치릴리 드레디어 배쓰나이 깜눈크 악비르 악비아르 달막화 불비달마 마라카치 돌살이 암팰리스 곤율랭 곤율거니 심보러 데스마스 데스니칸 프로토가 늑골라 아켄 아케오스 깨봉이 더스트나 조로아 조로아크 치라미 치라치노 고디탱 고디보미 고디모아젤 유니란 듀란 란쿨루스 꼬지보리 스완나 바닐프티 바닐리치 배바닐라 사철록 바라철록 에몽가 딱정곤 슈바르고 깜놀버슬 뽀록나 탱그릴 탱탱겔 맘복치 파쪼옥 전툴라 철시드 너트령 기어르 기기어르 기기기어르 저리어 저리릴 저리더프 리그레 벰크 불켜미 램프라 샹델라 터검니 액슨도 액스라이즈 코고미 툰베어 프리지오 쪼마리 어지리더 메더 비조푸 비조도 크리만 골비람 골루그 자망칼 절각참 버프론 수리둥보 워글 벌차이 버랜지나 앤티골 아이앤트 모노두 디헤드 삼삼드래 활화르바 불카모스 코바르온 테라키온 비리디온 토네로스 볼트로스 레시라무 제크로무 랜드로스 큐레무 케르디오 메로엣타 게노세크트 도치마론 도치보구 브리가론 푸호꼬 테르나 마폭시 개구마르 개굴반장 개굴닌자 파르빗 파르토 화살꼬빈 불화살빈 파이어로 분이벌레 분떠도리 비비용 레오꼬 화염레오 플라베베 플라엣테 플라제스 메이클 고고트 판짱 부란다 트리미앙 냐스퍼 냐오닉스 단칼빙 쌍검킬 킬가르도 슈쁘 프레프티르 나룸퍼프 나루림 오케이징 칼라마네로 거북손손 거북손데스 수레기 드래캄 완철포 블로스터 목도리키텔 일레도리자드 티고라스 견고라스 아마루스 아마루르가 님피아 루차불 데덴네 멜리시 미끄메라 미끄네일 미끄래곤 클레피 나목령 대로트 호바귀 펌킨인 꽁어름 크레베이스 음뱃 음번 제르네아스 이벨타르 지가르데 디안시 후파 볼케니온 나몰빼미 빼미스로우 모크나이퍼 냐오불 냐오히트 어흥염 누리공 키요공 누리레느 콕코구리 크라파 왕큰부리 영구스 형사구스 턱지충이 전지충이 투구뿌논 오기지게 모단단게 춤추새 에블리 에리본 암멍이 루가루암 약어리 시마사리 더시마사리 머드나기 만마드 물거미 깨비물거미 짜랑랑 라란티스 자마슈 마셰이드 야도뇽 염뉴트 포곰곰 이븐곰 달콤아 달무리나 달코퀸 큐아링 하랑우탄 내던숭이 꼬시레 갑주무사 모래꿍 모래성이당 해무기 타입:널 실버디 메테노 자말라 폭거북스 토게데마루 따라큐 치갈기 할비롱 타타륜 짜랑꼬 짜랑고우 짜랑고우거 카푸꼬꼬꼭 카푸나비나 카푸브루루 카푸느지느 코스모그 코스모움 솔가레오 루나아라 텅비드 매시붕 페로코체 전수목 철화구야 종이신도 악식킹 네크로즈마 마기아나 마샤도 베베놈 아고용 차곡차곡 두파팡 제라오라 멜탄 멜메탈 흥나숭 채키몽 고릴타 염버니 래비풋 에이스번 울머기 누겔레온 인텔리레온 탐리스 요씽리스 파라꼬 파크로우 아머까오 두루지벌레 레돔벌레 이올브 훔처우 폭슬라이 꼬모카 백솜모카 우르 배우르 깨물부기 갈가부기 멍파치 펄스멍 탄동 탄차곤 석탄산 과사삭벌레 애프룡 단지래플 모래뱀 사다이사 윽우지 찌로꼬치 꼬치조 일레즌 스트린더 태우지네 다태우지네 때때무노 케오퍼스 데인차 포트데스 몸지브림 손지브림 브리무음 메롱꿍 쏘겨모 오롱털 가로막구리 나이킹 산호르곤 창파나이트 마임꽁꽁 데스판 마빌크 마휘핑 대여르 찌르성게 누니머기 모스노우 돌헨진 빙큐보 에써르 모르페코 끼리동 대왕끼리동 파치래곤 파치르돈 어래곤 어치르돈 두랄루돈 드라꼰 드래런치 드래펄트 자시안 자마젠타 무한다이노 치고마 우라오스 자루도 레지에레키 레지드래고 블리자포스 레이스포스 버드렉스 신비록 사마자르 다투곰 대쓰여너 포푸니크 장침바루 러브로스 나오하 나로테 마스카나 뜨아거 악뜨거 라우드본 꾸왁스 아꾸왁 웨이니발 맛보돈 퍼퓨돈 타랜툴라 트래피더 콩알뚜기 엑스레그 빠모 빠모트 빠르모트 두리쥐 파밀리쥐 쫀도기 바우첼 미니브 올리뇨 올리르바 시비꼬 베베솔트 스태솔트 콜로솔트 카르본 카디나르마 파라블레이즈 빈나두 찌리배리 찌리비 찌리비크 오라티프 마피티프 땃쭈르 태깅구르 그푸리 공푸리 들눈해 육파리 절벼게 캡싸이 스코빌런 구르데 베라카스 하느라기 클레스퍼트라 어리짱 벼리짱 두드리짱 바다그다 바닥트리오 떨구새 맨돌핀 돌핀맨 부르롱 부르르룸 모토마 꿈트렁 초롱순 킬라플로르 망망이 묘두기 꼬이밍고 터벅고래 우락고래 가비루사 어써러셔 싸리용 저승갓숭 토오 키키링 노고고치 대도각참 위대한엄니 우렁찬꼬리 사나운버섯 날개치는머리 땅을기는날개 모래털가죽 무쇠바퀴 무쇠보따리 무쇠손 무쇠머리 무쇠독나방 무쇠가시 드니차 드니꽁 드닐레이브 모으령 타부자고 총지엔 파오젠 딩루 위유이 고동치는달 무쇠무인 코라이돈 미라이돈 굽이치는물결 무쇠잎새 과미르 차데스 그우린차 조타구 이야후 기로치 오거폰 브리두라스 과미드라 꿰뚫는화염 날뛰는우레 무쇠암석 무쇠감투 테라파고스 복숭악동'.toUpperCase().split(' ');
const ENGSET=new Set(ENG);
const engRand=used=>{let n;for(let i=0;i<300;i++){n=ENG[rr(ENG.length)];if(!used||!used.has(n))return n;}return n;};
const usedHids=()=>new Set(((typeof H!=='undefined'&&H&&H.players)||[]).map(x=>x.hid));
const wp=w=>{let t=0;for(const k in w)t+=w[k];let x=Math.random()*t;for(const k in w){x-=w[k];if(x<0)return k;}return Object.keys(w)[0];};
const POOL={};const pools=()=>{if(POOL[1])return;for(let r=1;r<=5;r++)POOL[r]=MON_IDS.filter(id=>id<=1025&&MON[id].rar===r);};
let ALLM=null;const rollMon=()=>{if(!ALLM)ALLM=[1,2,3,4,5].flatMap(r=>POOL[r]||[]);return pk(ALLM);};
const EVN={one:'포켓몬 획득!',two:'추가 획득! 2마리',three:'전체 획득! 3마리',x2:'2배 이벤트! 카드 ×2',x3:'3배 이벤트! 카드 ×3',hack:'해킹 이벤트!',def:'해킹 방어권 획득!',dupdef:'방어권은 1장만 가질 수 있어요.',miss:'꽝… 다음 기회에'};
let H=null,C=null,root=null,hbT=0,uiT=0;
const idOf=(code,g)=>'zhb-'+CFG.VER+'-'+code+(g?'-m'+g:'');
const cmp=(a,b)=>b.sc-a.sc||b.c5-a.c5||b.tot-a.tot||a.sAt-b.sAt;
const sha256=(()=>{const rot=(x,n)=>x>>>n|x<<32-n,K=[],H0=[];for(let c=2,p=0;p<64;c++){let q=1;for(let d=2;d*d<=c;d++)if(c%d===0){q=0;break;}if(q){if(p<8)H0[p]=Math.pow(c,.5)*4294967296|0;K[p++]=Math.pow(c,1/3)*4294967296|0;}}
 return s=>{const by=[...unescape(encodeURIComponent(s))].map(c=>c.charCodeAt(0)),L=by.length*8;by.push(128);while(by.length%64!==56)by.push(0);for(let i=7;i>=0;i--)by.push(i>3?0:(L>>>(i*8))&255);
  let h=H0.slice();for(let o=0;o<by.length;o+=64){const w=[];for(let i=0;i<16;i++)w[i]=by[o+i*4]<<24|by[o+i*4+1]<<16|by[o+i*4+2]<<8|by[o+i*4+3];for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2];w[i]=(w[i-16]+(rot(x,7)^rot(x,18)^x>>>3)+w[i-7]+(rot(y,17)^rot(y,19)^y>>>10))|0;}
   let[a,b,c,d,e,f,g,hh]=h;for(let i=0;i<64;i++){const t1=(hh+(rot(e,6)^rot(e,11)^rot(e,25))+((e&f)^(~e&g))+K[i]+w[i])|0,t2=((rot(a,2)^rot(a,13)^rot(a,22))+((a&b)^(a&c)^(b&c)))|0;hh=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;}
   const r=[a,b,c,d,e,f,g,hh];h=h.map((v,i)=>(v+r[i])|0);}
  return h.map(v=>(v>>>0).toString(16).padStart(8,'0')).join('');};})();
const RH={};
const rhash=rc=>{const k=(H?H.code:'')+'|'+rc;if(RH[k])return RH[k];let h='zhb|'+k;for(let i=0;i<1000;i++)h=sha256(h+k);return RH[k]=h.slice(0,24);}; // 재접속 번호는 8자리 + SHA-256 1000회 해시로만 넘겨요(방장 승격 스냅샷)
/* ---------- 방장(호스트) 쪽: 게임 상태를 확정하는 건 방장만 ---------- */
function newP(name,conn,host,tt){return{pid:tok(6),tt:ttIn(tt),name:(name||'트레이너').slice(0,8),hid:engRand(usedHids()),rc:String(1000+rr(9000)),conn,host:!!host,away:false,team:'',own:{},tot:0,sc:0,c5:0,sAt:now(),def:0,shield:0,lock:0,seq:0,pend:null,hk:null,last:now(),lastSolve:0,rch:'',hkCancel:0,ok:0,wr:0,lastWrong:0,hp:0,lastHkq:0};}
function calc(p){let t=0,s=0,c5=0;for(const id in p.own){const n=p.own[id],r=MON[id].rar;t+=n;s+=n*r;if(r===5)c5+=n;}if(s!==p.sc)p.sAt=now();p.tot=t;p.sc=s;p.c5=c5;}
function give(p,ids){for(const id of ids){p.own[id]=(p.own[id]||0)+1;p.tot++;}calc(p);}
function pickW(o){let t=0;for(const id in o)t+=o[id];let x=Math.random()*t;for(const id in o){x-=o[id];if(x<0)return id;}return Object.keys(o)[0];}
function rollSame(r){for(let l=r;l>=1;l--)if(POOL[l]&&POOL[l].length)return pk(POOL[l]);for(let l=r+1;l<=5;l++)if(POOL[l]&&POOL[l].length)return pk(POOL[l]);}
/* 카드 2배·3배: 같은 등급 카드를 늘어날 만큼, 그 등급 풀에서 무작위로(중복 허용) 뽑아 더해요.
   늘어날 장수 n 이 풀 크기 m 의 4배 이하면 예전처럼 한 장씩 뽑고, 그보다 많으면 '다항분포'로 종류별 장수를 한 번에 정해요
   (종류마다 이항분포를 차례로 뽑아요). 한 장씩 뽑는 것과 확률 분포가 같고, 계산량은 카드 수가 아니라 종류 수(m)에만 비례해요. */
const gauss=()=>Math.sqrt(-2*Math.log(1-Math.random()))*Math.cos(2*Math.PI*Math.random());
function binom(n,p){if(n<=0||p<=0)return 0;if(p>=1)return n;if(p>.5)return n-binom(n,1-p);
 const mu=n*p;if(mu<12){const q=1-p,sr=p/q,a=(n+1)*sr;let r=Math.exp(n*Math.log(q)),u=Math.random(),x=0;while(u>r&&x<n){u-=r;x++;r*=(a/x-sr);}return x;}
 return Math.max(0,Math.min(n,Math.round(mu+Math.sqrt(mu*(1-p))*gauss())));}
function mult(p,k){let add=0;const rc=[0,0,0,0,0,0];for(const id in p.own)rc[MON[id].rar]+=p.own[id];
 for(let r=1;r<=5;r++){const n=rc[r]*(k-1);if(n<=0)continue;
  let pl=null;for(let l=r;l>=1;l--)if(POOL[l]&&POOL[l].length){pl=POOL[l];break;}
  if(!pl)for(let l=r+1;l<=5;l++)if(POOL[l]&&POOL[l].length){pl=POOL[l];break;}
  if(!pl)continue;
  const m=pl.length;
  if(n<=m*4){for(let i=n;i>0;i--){const id=pl[rr(m)];p.own[id]=(p.own[id]||0)+1;}}
  else{let rem=n;for(let i=0;i<m&&rem>0;i++){const c=i===m-1?rem:binom(rem,1/(m-i));if(c){p.own[pl[i]]=(p.own[pl[i]]||0)+c;rem-=c;}}}
  add+=n;}
 calc(p);return add;}
/* 해킹으로 카드 뺏기: 카드 k장을 '종류별 비율'로 한 번에 계산해요. (예전엔 한 장씩 뽑느라 카드 수 x 종류 수만큼 느렸어요)
   종류마다 floor(보유수 x k / 전체)장을 먼저 가져오고, 남는 몇 장은 소수점 몫이 큰 종류일수록 잘 걸리게 뽑아요. 정수 계산이라 오차가 없고 정확히 k장이에요. */
function take(f,t,k){take.pts=0;k=Math.min(k,f.tot);if(!(k>0)){calc(f);calc(t);return 0;}
 let tot=0;const ids=[];for(const id in f.own){ids.push(id);tot+=f.own[id];}
 const tk={},w=[];let got=0;
 for(const id of ids){const x=f.own[id]*k,b=Math.floor(x/tot),rm=x-b*tot;if(b){tk[id]=b;got+=b;}if(rm>0)w.push([id,rm]);}
 let r=k-got;
 while(r>0&&w.length){let sm=0;for(const e of w)sm+=e[1];let x=Math.random()*sm,j=0;for(;j<w.length-1;j++){x-=w[j][1];if(x<0)break;}
  const id=w[j][0];tk[id]=(tk[id]||0)+1;w[j]=w[w.length-1];w.pop();r--;}
 let n=0;for(const id in tk){const c=tk[id];f.own[id]-=c;if(f.own[id]<=0)delete f.own[id];t.own[id]=(t.own[id]||0)+c;n+=c;take.pts+=c*(MON[id]?MON[id].rar:1);}
 calc(f);calc(t);return n;}
/* 팀 해킹용 빼앗기: 우선 종류(pref = 해킹하는 팀이 아직 없는 종)부터 비율대로 빼앗고, 모자라면 나머지 종류에서 비율대로 채워요. take()와 같은 비율 계산이에요 */
function takePref(f,t,k,pref){takePref.pts=0;k=Math.min(k,f.tot);if(!(k>0)){calc(f);calc(t);return 0;}
 const tk={};let got=0;
 const run=(list,kk,base)=>{if(!(kk>0)||!list.length||!(base>0))return 0;let g=0;const ww=[];
  for(const id of list){const x=f.own[id]*kk,b=Math.floor(x/base),rm=x-b*base;if(b){tk[id]=(tk[id]||0)+b;g+=b;}if(rm>0)ww.push([id,rm]);}
  let r=kk-g;
  while(r>0&&ww.length){let sm=0;for(const e of ww)sm+=e[1];let x=Math.random()*sm,j=0;for(;j<ww.length-1;j++){x-=ww[j][1];if(x<0)break;}
   const id=ww[j][0];tk[id]=(tk[id]||0)+1;ww[j]=ww[ww.length-1];ww.pop();r--;}
  return g;};
 const ids=Object.keys(f.own);
 const first=ids.filter(id=>pref&&pref.has(+id)),second=ids.filter(id=>!pref||!pref.has(+id));
 const mt=first.reduce((a,id)=>a+f.own[id],0);
 got+=run(first,Math.min(k,mt),mt);
 if(got<k){const rt=second.reduce((a,id)=>a+f.own[id],0);got+=run(second,k-got,rt);}
 let n=0;for(const id in tk){const c=tk[id];f.own[id]-=c;if(f.own[id]<=0)delete f.own[id];t.own[id]=(t.own[id]||0)+c;n+=c;takePref.pts+=c*(MON[id]?MON[id].rar:1);}
 calc(f);calc(t);return n;}
/* ---------- 팀전: 팀 도감은 팀원 보유분의 합집합, 팀 점수는 팀원 점수 합산 ---------- */
const teamMembers=t=>H?H.players.filter(p=>p.team===t):[];
const teamKindSet=t=>{const s=new Set();teamMembers(t).forEach(p=>{for(const id in p.own)s.add(+id);});return s;};
const teamKinds=t=>teamKindSet(t).size;
const teamScore=t=>teamMembers(t).reduce((a,p)=>a+p.sc,0);
const teamTot=t=>teamMembers(t).reduce((a,p)=>a+p.tot,0);
const teamDefender=t=>teamMembers(t).find(p=>p.def>0)||null;
const teamLabel=t=>t==='A'?'🔴 A팀':'🔵 B팀';
function snd(p,m){if(p.host){setTimeout(()=>cm(m),0);return;}try{p.conn&&p.conn.open&&p.conn.send(m);}catch(e){}}
const bc=m=>H.players.forEach(p=>snd(p,m));
const mePk=p=>({t:'me',own:Object.entries(p.own),sc:p.sc,tot:p.tot,def:p.def,sh:Math.max(0,p.shield-now()),lock:p.lock,team:p.team||''});
function lobBC(){bc({t:'lob',pl:H.players.map(p=>({n:p.name,t:p.tt|0,a:p.away,b:p.ai?1:0,id:p.pid,team:p.team||''})),dur:H.dur,code:H.code,tm:H.teamMode?1:0});}
function topBC(){if(!H||H.state!=='play')return;const l=Math.max(0,H.end-now());bc({t:'top',top:[...H.players].sort(cmp).slice(0,3).map(p=>({n:p.name,t:p.tt|0,s:p.sc})),all:[...H.players].sort(cmp).map(p=>({id:p.pid,n:p.name,t:p.tt|0,s:p.sc})),left:l,away:H.players.filter(p=>p.away).length,order:H.players.filter(p=>!p.ai).map(p=>p.pid),gen:H.gen||0,tm:H.teamMode?['A','B'].map(t=>({t,k:teamKinds(t),s:teamScore(t)})):null});}
function snapPk(){return{t:'snap',dur:H.dur,gid:H.gid,t0:H.t0,tm:H.teamMode?1:0,pl:H.players.map(p=>({pid:p.pid,name:p.name,tt:p.tt|0,rch:p.rc?rhash(p.rc):(p.rch||''),own:Object.entries(p.own),sh:Math.max(0,p.shield-now()),def:p.def,lock:p.lock,seq:p.seq,sAt:p.sAt,pend:p.pend?{n:p.pend.n}:null,hk:p.hk?{n:p.hk.n}:null,ok:p.ok|0,wr:p.wr|0,hp:p.hp|0,ai:p.ai?1:0,team:p.team||''}))};}
function weights(){return H.end-now()<=CFG.LAST30_MS?CFG.EV_L30:CFG.EV;}
function mkSlot(){const ev=wp(weights());const n={one:1,two:2,three:3}[ev]||0;const ids=[];for(let i=0;i<n;i++)ids.push(rollMon());return{ev,ids};}
function welcome(p){snd(p,{t:'wel',pid:p.pid,hid:p.hid,rc:p.rc,code:H.code});lobBC();if(H.state==='pick'&&!p.idDone&&p.cands)snd(p,{t:'idc',c:p.cands,left:Math.max(1000,PICK_MS-(now()-H.pickAt))});if(H.state==='play'){snd(p,{t:'go',left:Math.max(0,H.end-now()),dur:H.dur,re:1});snd(p,mePk(p));if(p.pend&&!p.lock)snd(p,{t:'tri',n:p.pend.n});if(p.hkCancel){p.hkCancel=0;snd(p,{t:'hkr',ok:false,why:'방장이 바뀌어 해킹이 취소됐어요'});}}}
function bind(conn,p){conn._p=p;conn.on('close',()=>{if(p.conn!==conn)return;p.conn=null;p.away=true;if(H.state==='lobby'){H.players=H.players.filter(x=>x!==p);}lobBC();topBC();});}
function hjoin(conn,m){
 let p=m.rc&&H.players.find(x=>!x.host&&((x.rc&&x.rc===String(m.rc))||(!x.rc&&x.rch&&x.rch===rhash(String(m.rc)))));
 if(p){if(H.state==='end'){conn.send({t:'no',m:'이미 끝난 게임이에요'});return;}
  if(p.conn&&p.conn!==conn&&p.conn.open&&!p.away&&now()-p.last<CFG.TAKEOVER_STALE_MS){conn.send({t:'no',m:'이미 접속 중이에요. 잠시 뒤에 다시 시도해 주세요'});return;}
  if(!p.rc)p.rc=String(m.rc);if(p.conn&&p.conn!==conn)try{p.conn.close();}catch(e){}p.conn=conn;p.away=false;p.last=now();bind(conn,p);welcome(p);return;}
 if(H.state!=='lobby'){conn.send({t:'no',m:H.state==='play'?'이미 시작했어요. 끊겼다면 재접속 번호를 같이 넣어 주세요':'끝난 게임이에요'});return;}
 if(H.players.length>=(H.teamMode?TEAM_MAX*2:CFG.MAX_P)){conn.send({t:'no',m:'방이 가득 찼어요'});return;}
 p=newP(m.name,conn,false,m.tt);while(H.players.some(x=>x.rc===p.rc))p.rc=String(1000+rr(9000));
 if(H.teamMode)p.team=teamMembers('A').length<=teamMembers('B').length?'A':'B';   // 팀전: 들어오는 순서대로 작은 팀에 교대로 배정
 H.players.push(p);bind(conn,p);welcome(p);
}
function hmsg(p,m){
 if(!m||H.state!=='play'&&m.t!=='hb'&&m.t!=='st'&&m.t!=='dur'&&m.t!=='idp'&&m.t!=='aip'&&m.t!=='aim'&&m.t!=='tmm'&&m.t!=='tmv'&&m.t!=='tfill')return;
 if(m.t==='dur'&&p.host&&H.state==='lobby'&&CFG.DURS.includes(m.v)){H.dur=m.v;lobBC();}
 else if(m.t==='aip'&&p.host&&H.state==='lobby')hostAddAI();
 else if(m.t==='aim'&&p.host&&H.state==='lobby')hostDelAI();
 else if(m.t==='tmm'&&p.host&&H.state==='lobby'){H.teamMode=H.teamMode?0:1;if(H.teamMode)H.players.forEach((pl,i)=>{pl.team=i%2?'B':'A';});lobBC();}   // 팀전 켜기: 입장 순서대로 A/B 교대 배정
 else if(m.t==='tmv'&&p.host&&H.state==='lobby'){const t=H.players.find(x=>x.pid===m.pid);if(t&&H.teamMode){t.team=t.team==='A'?'B':'A';lobBC();}}   // 방장이 친구 이름을 눌러 팀을 바꿔요
 else if(m.t==='tfill'&&p.host&&H.state==='lobby')hostFillAI();
 else if(m.t==='st'&&p.host&&H.state==='lobby')hostStart();
 else if(m.t==='idp')idPick(p,m);
 else if(m.t==='solve'){if(p.lock||p.away)return;if(p.pend){snd(p,{t:'tri',n:p.pend.n});return;}{const t=now();if(t-p.lastSolve<CFG.SOLVE_MIN_MS)return;p.lastSolve=t;}p.pend={n:++p.seq,slots:[mkSlot(),mkSlot(),mkSlot()]};p.ok=(p.ok|0)+1;snd(p,{t:'tri',n:p.pend.n});}
  else if(m.t==='wrong'){const t=now();if(p.away||t-(p.lastWrong||0)<1500)return;p.lastWrong=t;p.wr=(p.wr|0)+1;}
 else if(m.t==='pick'){const e=p.pend;if(!e||e.n!==m.n||!(m.i>=0&&m.i<3))return;p.pend=null;const s=e.slots[m.i];p.hp=(p.hp|0)+1;if(p.hp>=CFG.HACK_PITY&&s.ev!=='hack'){s.ev='hack';s.ids=[];}let res={t:'res',n:m.n,ev:s.ev,ids:s.ids};
  if(s.ev==='one'||s.ev==='two'||s.ev==='three'){give(p,s.ids);s.ids.forEach(id=>{if(MON[id].rar===5)bc({t:'leg',id,who:p.name});});}
  else if(s.ev==='x2'||s.ev==='x3'){const a=mult(p,s.ev==='x2'?2:3);res.note=a>0?'카드 +'+a+'장!':'늘어날 카드가 없어요';}
  else if(s.ev==='def'){if(p.def)res={t:'res',n:m.n,ev:'dupdef',ids:[]};else p.def=1;}
  else if(s.ev==='hack'){const oth=H.teamMode?H.players.filter(x=>x.team&&x.team!==p.team&&!x.away):H.players.filter(x=>x!==p&&!x.away),el=oth.filter(x=>x.tot>0);
   if(!el.length)res={t:'res',n:m.n,ev:'miss',ids:[],note:'해킹할 상대가 없어요'};
   else{const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);const real=sh(el).slice(0,2);if(real.length<2){const rest=sh(oth.filter(x=>!real.includes(x)));if(rest.length)real.push(rest[0]);}
    const used=new Set(H.players.map(x=>x.hid)),opts=real.map(x=>({hid:x.hid,pid:x.pid}));while(opts.length<4){const f=engRand(used);if(!used.has(f)){used.add(f);opts.push({hid:f,pid:null});}}
    const so=sh(opts);p.hk={n:m.n,opts:so,elim:[]};p.hp=0;snd(p,{t:'hk',n:m.n,opts:so.map(o=>o.hid),real:real.length});}}
  if(!(s.ev==='hack'&&p.hk&&p.hk.n===m.n))snd(p,res);snd(p,mePk(p));afterChange();}
 else if(m.t==='hit'){const k=p.hk;if(!k||k.n!==m.n)return;p.hk=null;const o=Number.isInteger(m.i)?k.opts[m.i]:null,t=o&&o.pid?H.players.find(x=>x.pid===o.pid):null;let r={t:'hkr',ok:false,why:'가짜 아이디였어요… 꽝!'};
  if(t){
   if(H.teamMode&&t.team){const defTeam=t.team,def=teamDefender(defTeam);
    if(def){def.def=0;const kk=Math.max(1,Math.ceil(teamTot(defTeam)*CFG.HACK_RATE));r.why='상대 팀의 해킹 방어권에 막혔어요!';r.blk=1;r.k=kk;r.from=def.name;snd(def,{t:'blk',by:p.name,k:kk});snd(def,mePk(def));H.players.filter(x=>x!==def).forEach(x=>snd(x,{t:'tdef',by:p.name,def:def.name,tm:defTeam}));}   // 팀 방어: 팀원 한 명의 방어권 1장이 팀 전체 해킹을 막아요
    else{let total=0,pts=0;
     H.players.filter(x=>x.team===defTeam&&!x.away&&x.tot>0).forEach(v=>{const kk=Math.ceil(v.tot*CFG.HACK_RATE);const missing=new Set(Object.keys(v.own).map(Number).filter(id=>!teamKindSet(p.team).has(id)));const mv=takePref(v,p,kk,missing);total+=mv;pts+=takePref.pts;v.lock=(v.lock|0)+1;snd(v,{t:'hit',by:p.name,k:mv});snd(v,mePk(v));});   // 팀 해킹: 상대 팀 전원에게 해킹 + 각자 복구 게임, 우리 팀이 없는 종부터 절반씩 빼앗아요
     if(total>0){r={t:'hkr',ok:true,k:total,pts:pts,from:teamLabel(defTeam),tm:1};bc({t:'hsc',by:p.name,to:teamLabel(defTeam)+' 전체',k:total});}
     else r.why='대상이 지금은 해킹할 수 없어요';}}
   else if(t.away||t.tot<1)r.why='대상이 지금은 해킹할 수 없어요';
   else if(t.def){const kk=Math.max(1,Math.ceil(t.tot*CFG.HACK_RATE));t.def=0;r.why='상대의 해킹 방어권에 막혔어요!';r.blk=1;r.k=kk;r.from=t.name;snd(t,{t:'blk',by:p.name,k:kk});snd(t,mePk(t));}
   else{const mv=take(t,p,Math.ceil(t.tot*CFG.HACK_RATE));t.lock=(t.lock|0)+1;r={t:'hkr',ok:true,k:mv,pts:take.pts|0,from:t.name};snd(t,{t:'hit',by:p.name,k:mv});snd(t,mePk(t));bc({t:'hsc',by:p.name,to:t.name,k:mv});}}
  snd(p,r);snd(p,mePk(p));afterChange();}
 else if(m.t==='hkq'){const k=p.hk;if(!k||k.n!==m.n||p.away)return;const t=now();   // [해킹] 버튼: 문제를 풀었으니 가짜 아이디 1개를 알려줘요 (어느 게 가짜인지는 방장만 알아요)
  if(t-(p.lastHkq||0)<CFG.SOLVE_MIN_MS){snd(p,{t:'hkx',n:k.n,i:-2});return;}p.lastHkq=t;
  const fk=k.opts.map((o,i)=>i).filter(i=>!k.opts[i].pid&&!k.elim.includes(i));let i=-1;if(fk.length){i=pk(fk);k.elim.push(i);}
  p.ok=(p.ok|0)+1;snd(p,{t:'hkx',n:k.n,i});}
 else if(m.t==='rec'){if(!p.lock)return;p.lock--;snd(p,mePk(p));if(!p.lock&&p.pend)snd(p,{t:'tri',n:p.pend.n});}
}
const totKinds=()=>{pools();return [1,2,3,4,5].reduce((a,r)=>a+(POOL[r]||[]).length,0);};
function afterChange(){const tk=totKinds();
 if(H.teamMode){if(tk>0){for(const t of ['A','B']){if(teamKinds(t)>=tk)return endGame('all',t);}}topBC();return;}   // 팀전: 팀 도감 합집합이 1025종이면 그 팀 승리
 if(tk>0&&H.players.some(p=>Object.keys(p.own).length>=tk))return endGame('all');topBC();}
/* 게임 시작을 누르면 먼저 '아이디 고르기' 단계예요. 방장이 참가자마다 서로 겹치지 않는 후보 6개씩을 나눠 주니까 아이디가 겹칠 수 없어요. */
const PICK_MS=25000;
function hostStart(){if(H.state!=='lobby'||H.players.filter(p=>!p.away).length<CFG.MIN_P){toast('2명 이상 모여야 시작할 수 있어요');return;}
 if(H.teamMode){const a=teamMembers('A').length,b=teamMembers('B').length;
  if(a<2||b<2){toast('팀전은 각 팀 2명 이상이 필요해요 (지금 🔴 A팀 '+a+'명 · 🔵 B팀 '+b+'명)');return;}
  if(a!==b){toast('두 팀 인원수가 같아야 시작할 수 있어요 (🔴 A팀 '+a+'명 · 🔵 B팀 '+b+'명) — AI로 채워 주세요');return;}}
 H.state='pick';H.pickAt=now();
 const pool=ENG.slice();for(let i=pool.length-1;i>0;i--){const j=rr(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}
 H.players.forEach((p,i)=>{p.cands=pool.slice(i*6,i*6+6);p.idDone=0;});
 H.players.forEach(p=>{if(!p.away)snd(p,{t:'idc',c:p.cands,left:PICK_MS});});idWait();}
function idPick(p,m){if(H.state!=='pick'||p.idDone||!p.cands)return;const v=String(m.v||'').toUpperCase();if(!p.cands.includes(v))return;p.hid=v;p.idDone=1;idWait();}
function idWait(){if(!H||H.state!=='pick')return;const act=H.players.filter(p=>!p.away),d=act.filter(p=>p.idDone).length;
 if((act.length&&d>=act.length)||now()-H.pickAt>=PICK_MS)return hostBegin();bc({t:'idw',d,n:act.length});}
function hostBegin(){if(H.state!=='pick')return;
 H.players.forEach(p=>{if(!p.idDone){p.hid=(p.cands&&p.cands[0])||p.hid;p.idDone=1;}});
 H.state='play';H.t0=now();H.end=H.t0+H.dur*60000;H.gid=H.code+'-'+H.t0;H.players.forEach(p=>{p.sAt=now();});
 H.players.forEach(p=>snd(p,{t:'idf',hid:p.hid}));
 bc({t:'go',left:H.dur*60000,dur:H.dur});H.players.forEach(p=>snd(p,mePk(p)));}
function hostTick(){if(!H)return;const t=now();H.players.forEach(p=>{if(!p.host&&p.conn&&t-p.last>CFG.HB_TIMEOUT){try{p.conn.close();}catch(e){}p.conn=null;p.away=true;}});
 if(H.state==='pick')idWait();
 if(H.state==='play'){if(t>=H.end)endGame('time');else{topBC();if(t-(H.snapAt||0)>=2000){H.snapAt=t;H.players.filter(p=>!p.ai).slice(1,3).forEach(p=>{if(!p.host&&p.conn)snd(p,snapPk());});}}}}
function endGame(why,wteam){if(H.state==='end')return;H.state='end';const rk=[...H.players].sort(cmp).map((p,i)=>{const st=[0,0,0,0,0];for(const id in p.own)st[MON[id].rar-1]+=p.own[id];return{pid:p.pid,n:p.name,t:p.tt|0,s:p.sc,c5:p.c5,tot:p.tot,st,ok:p.ok|0,wr:p.wr|0,r:i+1};});
 let tm=null,win=null;
 if(H.teamMode){tm=['A','B'].map(t=>({t,k:teamKinds(t),s:teamScore(t),m:teamMembers(t).map(p=>p.name)}));
  if(why==='all')win=wteam||null;
  else{const a=tm[0],b=tm[1];win=a.s!==b.s?(a.s>b.s?'A':'B'):(a.k!==b.k?(a.k>b.k?'A':'B'):null);}}   // 시간 종료: 팀 점수 높은 쪽 승리 (동점이면 도감 종류 수)
 bc({t:'end',rank:rk,why,gid:H.gid,dur:H.dur,ok:true,tm,wteam:win});}
function wire(peer){peer.on('connection',conn=>{conn.on('data',d=>{if(!H)return;const p=conn._p;if(!p){if(d&&d.t==='join')hjoin(conn,d);return;}p.last=now();hmsg(p,d);});});}
async function hostOpen(name){
 try{await loadPeer();}catch(e){toast(e.message);return;}
 pools();let tries=0;
 const open=()=>{const code=String(1000+rr(9000));const peer=new Peer(idOf(code,0),PO());H={code,peer,dur:5,state:'lobby',players:[],gen:0,teamMode:0};
  peer.on('open',()=>{const me=newP(name,null,true,ttNum());H.players.push(me);H.me=me;C.pid=me.pid;C.hid=me.hid;C.rc=me.rc;C.code=code;C.role='host';C.phase='lobby';sv();lobBC();H.tm=setInterval(hostTick,1000);});
  wire(peer);
  peer.on('error',e=>{if(e.type==='unavailable-id'&&tries++<6){try{peer.destroy();}catch(x){}open();}else toast('연결 오류: '+e.type);});
  C.peer=peer;};
 open();}
/* ---------- 참가자(클라이언트) 쪽 ---------- */
const tx=m=>{if(C.role==='host'){if(H&&H.me)setTimeout(()=>{H.me.last=now();hmsg(H.me,m);},0);}else try{C.conn&&C.conn.open&&C.conn.send(m);}catch(e){}};
async function joinGame(code,rc,name,gen){
 gen=gen||0;try{await loadPeer();}catch(e){toast(e.message);return;}
 pools();C.role='guest';C.code=code;C.gen=gen;try{C.peer&&C.peer.destroy();}catch(e){}
 const peer=new Peer(PO());C.peer=peer;stat('접속 중…');
 peer.on('open',()=>{const conn=peer.connect(idOf(code,gen),{reliable:true});C.conn=conn;
  conn.on('open',()=>{conn.send({t:'join',name,rc,tt:ttNum()});C.lastRx=now();});conn.on('data',m=>{C.lastRx=now();cm(m);});conn.on('close',lost);});
 peer.on('error',e=>{if(C.phase==='play'){if(!C.conn||!C.conn.open){C.tries=(C.tries||0)+1;if(C.tries>(C.gen?5:3)){C.tries=0;migrate();}else setTimeout(reTry,2000);}return;}
  if(e.type==='peer-unavailable'&&gen<3){joinGame(code,rc,name,gen+1);return;}stat(e.type==='peer-unavailable'?'그 번호의 방을 찾지 못했어요':'연결 오류: '+e.type);});
 setTimeout(()=>{if(!C.pid&&root.classList.contains('on'))stat('접속 시간이 지났어요. 번호를 확인해 주세요');},15000);}
function reTry(){if(C.role!=='guest'||C.phase!=='play'||(C.conn&&C.conn.open))return;stat('다시 접속 중…');joinGame(C.code,C.rc,C.name,C.gen||0);}
function lost(){if(C.phase==='end'||!C.role||C.role==='host')return;C.conn=null;if(C.phase==='play'){C.tries=0;stat('연결이 끊겼어요. 다시 접속해요…');setTimeout(reTry,1500);}else stat('방장 연결이 끊겼어요');}
/* 방장 승격: 방장이 2~3초마다 차순위(참가 순서 2·3번째)에게 상태 스냅샷을 보내 둬요. 방장이 사라지면 차순위가 같은 상태로 새 방을 열고, 나머지는 재접속 번호로 다시 들어와요 */
function migrate(){if(C.phase!=='play'||C.role==='host')return;C.gen=(C.gen||0)+1;const c=(C.order||[])[C.gen];
 if(!c){stat('방장 승격에 실패했어요. 게임이 중단돼요 (보상 없음)');toast('방장 승격 실패');C.phase='end';return;}
 if(c===C.pid)return becomeHost();stat('새 방장을 찾는 중…');C.tries=0;setTimeout(reTry,1500);}
async function becomeHost(){const s=C.snap;if(!s)return migrate();try{await loadPeer();}catch(e){return migrate();}
 try{C.peer&&C.peer.destroy();}catch(e){}C.conn=null;const peer=new Peer(idOf(C.code,C.gen),PO());C.peer=peer;
 peer.on('open',()=>{H={code:C.code,peer,dur:s.dur,state:'play',players:[],t0:s.t0,end:C.end,gid:s.gid,gen:C.gen,teamMode:s.tm?1:0};
  s.pl.forEach(o=>{const me=o.pid===C.pid,p=newP(o.name,null,me,o.tt);Object.assign(p,{pid:o.pid,hid:me?C.hid:p.hid,rc:me?C.rc:null,rch:o.rch||'',team:o.team||'',own:Object.fromEntries(o.own),def:o.def,lock:o.lock,seq:o.seq,pend:o.pend?{n:o.pend.n,slots:[mkSlot(),mkSlot(),mkSlot()]}:null,hk:null,hkCancel:o.hk?1:0,ok:+o.ok|0,wr:+o.wr|0,hp:+o.hp|0,shield:now()+o.sh,away:!me,last:now()});calc(p);p.sAt=o.sAt;if(o.ai){p.ai=1;p.conn={open:true,send(){},close(){}};p.away=false;}H.players.push(p);if(p.host)H.me=p;});
  if(!H.me){H=null;try{peer.destroy();}catch(e){}return migrate();}
  wire(peer);H.tm=setInterval(hostTick,1000);if(H.players.some(p=>p.ai))H.botT=setInterval(aiTick,700);C.role='host';C.rc=H.me.rc;sv();toast('👑 내가 새 방장이 됐어요!');stat('');H.players.forEach(p=>{if(p.host&&p.hkCancel){p.hkCancel=0;snd(p,{t:'hkr',ok:false,why:'방장이 바뀌어 해킹이 취소됐어요'});}});topBC();});
 peer.on('error',e=>{if(!H)migrate();});}
function stat(s){const e=root&&root.querySelector('#hbSt');if(e)e.textContent=s;}
function sv(){try{localStorage.setItem('zhb_sv',JSON.stringify({code:C.code,rc:C.rc,name:C.name}));}catch(e){}}
function cm(m){
 if(!m||!C)return;
 if(m.t==='wel'){C.tries=0;C.pid=String(m.pid);C.hid=esc(m.hid);if(C.role==='guest')C.rc=esc(m.rc);sv();if(C.phase!=='play'){C.phase='lobby';paintLobby();}}
 else if(m.t==='no'){stat(m.m);toast(esc(m.m));}
 else if(m.t==='lob'){C.pl=m.pl;C.dur=m.dur;C.teamMode=m.tm?1:0;if(C.phase==='lobby')paintLobby();}
 else if(m.t==='go'){if(C.phase!=='play'||!m.re){C.me={own:[],sc:0,tot:0,def:0,sh:0,lock:0,team:''};}C.end=now()+m.left;C.phase='play';C.top=[];paintPlay();setTimeout(next,m.re?600:900);}
 else if(m.t==='me'){C.me={own:(Array.isArray(m.own)?m.own:[]).filter(e=>e&&MON[e[0]]).map(e=>[+e[0],+e[1]|0]),sc:+m.sc|0,tot:+m.tot|0,def:m.def?1:0,lock:+m.lock|0,shEnd:now()+(+m.sh||0),team:m.team||''};if(C.phase==='play'){paintMe();if(m.lock&&C.mode!=='mini'&&C.mode!=='warn')mini();}}
 else if(m.t==='snap'){C.snap=m;}
 else if(m.t==='top'){C.order=m.order;C.top=(Array.isArray(m.top)?m.top:[]).map(p=>({n:String(p.n),s:+p.s|0}));C.all=(Array.isArray(m.all)?m.all:[]).map(p=>({id:String(p.id),n:String(p.n),s:+p.s|0}));C.end=now()+m.left;C.away=m.away;C.tm=m.tm||null;if(C.phase==='play')paintTop();}
 else if(m.t==='tri'){if(C.mode==='mini'||C.mode==='warn'||C.phase!=='play')return;showPick(m.n);}
 else if(m.t==='idc'){C.phase='pick';C.cand=(Array.isArray(m.c)?m.c:[]).map(String).filter(v=>ENGSET.has(v));C.pickEnd=now()+(+m.left||PICK_MS);C.hidPick=null;C.idw=null;paintPick();}
 else if(m.t==='idw'){if(C.phase==='pick'){C.idw=m;pickInfo();}}
 else if(m.t==='idf'){C.hid=esc(String(m.hid||''));}
 else if(m.t==='res')showRes(m);
 else if(m.t==='hk')showHack(m);
 else if(m.t==='hkr')showHkr(m);
 else if(m.t==='hkx')hackElim(m);
 else if(m.t==='hit'){C.hitBy=m;hitWarn(m);}
 else if(m.t==='blk')defWin(m);
 else if(m.t==='tdef'){nwAdd('nwD','🛡 <b>'+esc(m.def||'팀원')+'</b>의 방어권이 팀 해킹을 막았어요!');try{toast('🛡 팀 방어권이 해킹을 막았어요!');}catch(e){}}   // 팀 방어 알림 (방어권을 쓴 본인은 defWin 연출만 봐요)
 else if(m.t==='leg')legend(m);
  else if(m.t==='hsc')hackNews(m);
 else if(m.t==='end')finish(m);
}
const $h=s=>root.querySelector(s);
function pop(html){const p=$h('#hbP');try{window.PADX&&PADX.end(p);}catch(e){}p.innerHTML='<div class=pb><div class=dosHp>hack@dex:~$ <i class=cur></i></div>'+html+'<div style="text-align:right;margin-top:6px"><button class=b data-k=1 style="padding:2px 8px;font-size:12px">🔑 내 번호</button> <small class=hbKv></small></div></div>';p.classList.add('on');showGo(0);syncPad();return p;}
function popx(){try{window.PADX&&PADX.end($h('#hbP'));}catch(e){}$h('#hbP').classList.remove('on');syncPad();}
function showGo(on){const g=$h('#hbGo');if(g)g.style.display=on?'flex':'none';}
function syncPad(){const w=$h('.w'),p=$h('#hbP'),pb=p&&p.firstChild;if(!w)return;w.style.paddingBottom=((p&&p.classList.contains('on')&&pb)?pb.offsetHeight+24:(C&&C.mode==='closed'?84:12))+'px';}
function closeQ(){if(!C||C.mode!=='q')return;C.mode='closed';popx();showGo(1);syncPad();}
function next(){if(!C||C.phase!=='play'||C.mode==='mini'||C.mode==='warn')return;C.mode=null;if(C.me.lock){mini();return;}if(C.hkM){renderHack();return;}if(C.pendWait)return;question();}
/* 문제: 내가 고른 모드(수학·영어·국어·영수)를 따르되, 영어·국어는 어떤 세부 모드여도 '종합 모드'로만 출제하고(풀이 속도 균형), IQ·상식 문제는 평소처럼 섞여요. 내 설정은 건드리지 않고 바로 되돌려요 */
function hbPick(){const m=S.meta,sv=[m.enStudyMode,m.koMode,S.enForce,S.koForce,m.enModes,m.koModes];let q=null;
 try{m.enStudyMode='mixed';m.koMode='mixed';m.enModes=null;m.koModes=null;S.enForce=null;S.koForce=null;
  const t=nextCyc();if(t==='I'){q=iqQ();}
  if(!q)q=pickQ({cyc:1,tier:t==='I'?'H':t});}
 catch(e){q=null;}
 finally{m.enStudyMode=sv[0];m.koMode=sv[1];S.enForce=sv[2];S.koForce=sv[3];m.enModes=sv[4];m.koModes=sv[5];}
 return q&&q.ch&&q.ch.length>=2&&q.ch.map(String).includes(String(q.a))?q:null;}
/* 학습 기록: 평소 문제 풀이와 똑같이 앱 기록(푼 문제·정답률·오답 노트·별·경험치·영어/국어/IQ 통계)에 반영해요 */
function hbRec(q,ok,pick){try{recordAnswer(q,ok,Math.max(300,now()-(C.qAt||now())),{choice:pick});}catch(e){console.warn('hb record',e);}try{qStreak(ok);}catch(e){}try{autoSave();}catch(e){}}
function question(){
 if(C.mode)return;C.mode='q';showGo(0);let q=hbPick();
 if(!q){const a=2+rr(8),b=2+rr(8);q={q:a+' × '+b+' = ?',a:String(a*b),ch:[a*b,a*b+a,a*b-b,a*b+2].map(String),sk:Object.keys(SKM)[0]};}
 try{S.curQ=q;}catch(e){}
 C.qAt=now();
 const p=pop('<div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><div style="color:#3f8;font-size:15px">🔓 해킹 접속! 문제를 풀어 카드를 얻으세요</div><button class="b r qclose" data-x=qclose>✖ 닫기</button></div>'+qHTML(q));const qc=p.querySelector('[data-x=qclose]');if(qc)qc.onclick=closeQ;
 let hinted=false;try{window.PADX&&PADX.start(p,q,{mode:'hack',onUse:()=>{hinted=true;}});}catch(e){}   // ✏️ 연습장 · 💡 힌트 (힌트를 쓰면 정답 뒤 대기 +3초)
 p.querySelectorAll('.ch').forEach(b=>b.onclick=()=>{if(C.mode!=='q')return;const pk0=q.ch[+b.dataset.i];hbRec(q,pk0===q.a,pk0);if(pk0===q.a){C.wrong=0;C.mode='wait';C.pendWait=1;pop('<h3 style="text-align:center">✅ 정답! 보안 서버 응답 대기…</h3>');tx({t:'solve'});setTimeout(()=>{if(C&&C.mode==='wait'){C.pendWait=0;C.mode=null;next();}},hinted?9000:6000);}
  else{b.classList.add('shk');C.mode='x';C.wrong=(C.wrong||0)+1;tx({t:'wrong'});const w=CFG.WRONG_WAIT[Math.min(C.wrong-1,CFG.WRONG_WAIT.length-1)],ah=(p.querySelectorAll('.ch')[q.ch.indexOf(q.a)]||{}).innerHTML||esc(String(q.a));
  pop('<h3 style="color:#f88;text-align:center">❌ 오답!</h3><div style="text-align:center">정답은 <b>'+ah+'</b> 였어요.<br>천천히 읽고 풀어 봐요. <b id=hbWw>'+w+'</b>초 뒤에 새 문제가 나와요.</div>');
  let left=w;const iv=setInterval(()=>{if(!C||C.phase!=='play'||C.mode!=='x'){clearInterval(iv);return;}left--;const e=$h('#hbWw');if(e)e.textContent=Math.max(0,left);if(left<=0){clearInterval(iv);C.mode=null;popx();next();}},1000);}});
}
/* ---------- 카드 고르기: 카드팩 뒷면 → 눌러서 뒤집기 ---------- */
const SPEV={x2:{g:'thunder',t:'카드 2배',s:'가진 카드가 2배!'},x3:{g:'sun',t:'카드 3배',s:'가진 카드가 3배!'},def:{g:'water',t:'해킹 방어권',s:'해킹을 한 번 막아요'},dupdef:{g:'water',t:'방어권 보유 중',s:'방어권은 1장만 가져요'},hack:{g:'fire',t:'해킹!',s:'다른 친구를 해킹해요'},miss:{g:'moon',t:'꽝',s:'다음 기회에…'}};
function gemH(g){try{return stoneGemHTML(g);}catch(e){return '<div style="font-size:40px">'+({fire:'🔥',water:'💧',thunder:'⚡',moon:'🌙',sun:'☀️'}[g]||'✦')+'</div>';}}
function evFace(ev,note){const d=SPEV[ev]||SPEV.miss;const tc={fire:'#d94828',water:'#267aca',thunder:'#b78000',moon:'#6248b8',sun:'#d4204f'}[d.g];
 return '<div class="card sm battleSpec '+d.g+' hbSp" style="--tc:'+tc+'"><div class=hbSpA>'+gemH(d.g)+'</div><div class=hbSpT>'+d.t+'</div><div class=hbSpS>'+esc(note&&ev!=='miss'?note:(ev==='miss'&&note?note:d.s))+'</div></div>';}
function monFace(id){try{return cardHTML(id);}catch(e){return '<div style="text-align:center">'+monImg(id,'front')+'<br>'+esc(MON[id].name)+'</div>';}}
function flipRow(){const r=root&&root.querySelector('#hbP .hbPk');return r&&r.isConnected?r:null;}
function flipHTML(i){return '<div class="flip hbFlip" data-i='+i+'><div class=in><div class=bk></div><div class=fc></div></div></div>';}
function openFlip(row,idx,html,badge){const f=row.children[idx];if(!f)return;const fc=f.querySelector('.fc');fc.innerHTML=html;try{const rr=f.querySelector('.fc .card');if(rr){const g=(MON[+rr.dataset.id]||{}).rar;if(g)f.classList.add('g'+g);}}catch(e){}
 if(badge){const bd=document.createElement('b');bd.className='hbBadge';bd.textContent=badge;f.appendChild(bd);}
 void f.offsetWidth;f.classList.add('open');try{snd_flip();}catch(e){}}
function snd_flip(){try{sfx('flip');}catch(e){}}
function showPick(n){C.mode='pick';C.pendWait=0;C.pk=null;C.hkTok=0;C.hkM=null;
 const p=pop('<h3 id=hbPT style="text-align:center">🃏 카드를 한 장 고르세요</h3><div class=hbPk>'+[0,1,2].map(flipHTML).join('')+'</div>');
 p.querySelectorAll('.hbFlip').forEach(f=>f.onclick=()=>{if(C.mode!=='pick')return;C.mode='wait';const i=+f.dataset.i;C.pk={i};f.classList.add('hbSel');const row=f.parentNode;row.classList.add('hbPicked');const t=$h('#hbPT');if(t)t.textContent='…해독 중…';try{sfx('tap');}catch(e){}tx({t:'pick',n,i});});}
/* 고른 카드 자리를 찾아요. 화면이 사라졌으면(재접속 등) 한 장짜리 새 화면을 만들어요 */
function pkRow(){let row=flipRow(),ci=C.pk&&Number.isInteger(C.pk.i)?C.pk.i:-1;if(row&&row.children.length===3&&ci>=0)return {row,ci};
 pop('<h3 id=hbPT style="text-align:center"></h3><div class="hbPk hbPicked">'+[0,1,2].map(flipHTML).join('')+'</div>');row=flipRow();row.children[1].classList.add('hbSel');return {row,ci:1};}
function setPT(h,col){const t=$h('#hbPT');if(t){t.innerHTML=h;t.style.color=col||'';}}
function monRow(ids){ids=(Array.isArray(ids)?ids:[]).map(Number).filter(id=>MON[id]);return '<div style="display:flex;gap:6px;justify-content:center">'+ids.map(id=>'<div style="width:90px;text-align:center">'+monImg(id,'front')+'<div style="font-size:13px">'+esc(MON[id].name)+'<br>'+'★'.repeat(MON[id].rar)+'</div></div>').join('')+'</div>';}
/* ---------- 카드가 열리면 포켓몬이 도감으로 쏙 날아 들어가는 연출 ---------- */
const reduceMo=()=>{try{return matchMedia('(prefers-reduced-motion:reduce)').matches;}catch(e){return false;}};
const lowFx=()=>{try{return document.documentElement.classList.contains('lowfx')||!!S.meta.settings.lowfx;}catch(e){return false;}};   // 게임 설정의 '저사양 모드': 무거운 효과(매트릭스 비·파티클·날아가는 카드)를 꺼요
function holdNew(ids){if(!C)return;const have=new Set(((C.me&&C.me.own)||[]).map(e=>+e[0]));C.hold=C.hold||{};ids.forEach(id=>{if(!have.has(id))C.hold[id]=1;});}
function release(id,land){if(C&&C.hold)delete C.hold[id];const c=root&&root.querySelector('#hbD .cc[data-id="'+id+'"]');if(!c)return;c.classList.remove('hbHold');if(land){c.classList.remove('hbLand');void c.offsetWidth;c.classList.add('hbLand');setTimeout(()=>c.classList.remove('hbLand'),700);}}
/* ---------- 카드 2배·3배: 섬광 + 빛줄기 + 큰 글자 + 포켓몬 폭죽 → 도감으로 빨려 들어가요 ---------- */
function dexBurst(){if(!root||!root.isConnected)return;const tg=root.querySelector('#hbDh'),bx=tg&&tg.parentNode;
 if(bx){bx.classList.remove('hbDexP');void bx.offsetWidth;bx.classList.add('hbDexP');setTimeout(()=>bx.classList.remove('hbDexP'),750);}
 [...root.querySelectorAll('#hbD .cc')].slice(0,80).forEach((c,i)=>{c.style.animation='hbMul .55s ease-out '+Math.min(i*14,700)+'ms';setTimeout(()=>{c.style.animation='';},1500);});}
function multFx(k,note){
 if(!root||!root.isConnected||reduceMo())return;
 const add=(String(note||'').match(/\+(\d+)/)||[])[1]|0;
 const ov=document.createElement('div');ov.className='hbMx mx'+k;
 ov.innerHTML='<div class=mxFlash></div><div class=mxRays></div><div class=mxBig>×'+k+'</div><div class=mxSub>'+(k===3?'카드 3배!!':'카드 2배!')+'</div><div class=mxCnt>'+(add?'카드 +<b>0</b>장!':esc(note||''))+'</div>';
 root.appendChild(ov);
 try{sfx('flip');}catch(e){}
 try{navigator.vibrate&&navigator.vibrate(k===3?[50,40,90,40,140]:[40,30,80]);}catch(e){}
 try{const a=k===3?9:6;root.animate([{transform:'translate(0,0)'},{transform:'translate('+a+'px,'+(-a)+'px)'},{transform:'translate('+(-a)+'px,'+a+'px)'},{transform:'translate('+a+'px,'+a+'px)'},{transform:'translate('+(-a)+'px,'+(-a)+'px)'},{transform:'translate(0,0)'}],{duration:k===3?620:460,delay:250,easing:'linear'});}catch(e){}
 if(add){const nb=ov.querySelector('.mxCnt b'),st0=performance.now()+650;const st=()=>{if(!ov.isConnected||!nb)return;const p=Math.min(1,Math.max(0,(performance.now()-st0)/700));nb.textContent=Math.round(add*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(st);};requestAnimationFrame(st);}
 const own=((C&&C.me&&C.me.own)||[]).filter(e=>e&&MON[e[0]]);
 const N=k===3?20:12,cx=innerWidth/2,cy=innerHeight*.38,sz=Math.round(Math.min(64,Math.max(44,innerWidth/8)));
 const tg=root.querySelector('#hbDh'),b=tg?tg.getBoundingClientRect():null;
 const dp=dexPt(),X=dp?dp.X:cx,Y=dp?dp.Y:22;
 let last=null,done=0;const fin=()=>{if(done)return;done=1;dexBurst();};
 for(let i=0;i<N;i++){
  const p=document.createElement('div');p.className='mxP';p.style.cssText='left:'+(cx-sz/2)+'px;top:'+(cy-sz/2)+'px;width:'+sz+'px;height:'+sz+'px';
  p.innerHTML=own.length?monImg(own[rr(own.length)][0],'front'):'✨';ov.appendChild(p);
  const ang=i/N*Math.PI*2+Math.random()*.5,d=(k===3?150:110)+rr(k===3?110:80),bx=Math.cos(ang)*d,by=Math.sin(ang)*d*.8,dx=X-cx,dy=Y-cy,rot=rr(120)-60;
  last=p.animate([
   {transform:'translate(0,0) scale(.1) rotate(0deg)',opacity:0,offset:0},
   {transform:'translate('+bx+'px,'+by+'px) scale(1.15) rotate('+rot+'deg)',opacity:1,offset:.28},
   {transform:'translate('+bx*1.08+'px,'+(by*1.08-10)+'px) scale(1) rotate('+rot+'deg)',opacity:1,offset:.55},
   {transform:'translate('+dx+'px,'+dy+'px) scale(.25) rotate('+(rot+180)+'deg)',opacity:.3,offset:1}
  ],{duration:1400,delay:650+i*28,easing:'cubic-bezier(.4,0,.5,1)',fill:'both'});}
 if(last)last.onfinish=fin;setTimeout(fin,650+N*28+1500);
 setTimeout(()=>{if(ov.isConnected)ov.remove();},3600);}
/* 도감 칸의 '가운데'(화면에 보이는 부분 기준)를 날아가는 목적지로 써요 */
function dexPt(){const h=root&&root.querySelector('#hbDh'),bx=h&&(h.closest('.box')||h.parentNode);if(!bx)return null;
 const r=bx.getBoundingClientRect(),t=Math.max(r.top,0),bt=Math.min(r.bottom,innerHeight);
 const X=Math.min(Math.max(r.left+r.width/2,16),innerWidth-16);
 const Y=bt>t?Math.min(Math.max((t+bt)/2,22),innerHeight-22):(r.bottom<=0?22:innerHeight-22);
 return{X,Y};}
/* 도감에서 이 포켓몬이 들어갈 '진짜 자리'(= 희귀도 → 번호 순으로 정렬된 도감 타일)를 찾아요.
   새로 얻은 카드는 hbHold 로 숨겨져 있어도 자리는 이미 차지하고 있어서, 그 타일의 위치가 곧 날아갈 목적지예요. */
const slotOf=id=>root&&root.querySelector('#hbD .cc[data-id="'+id+'"]');
/* 카드가 보이는 띠: 위는 고정 상단바 아래, 아래는 문제창(화면 아래쪽 최대 56%)에 안 가리는 곳까지 */
const bandOf=()=>{const tp=root.querySelector('.top'),t=(tp?Math.max(0,tp.getBoundingClientRect().bottom):0)+8;return{t,b:Math.max(t+72,innerHeight*.42)};};
/* 자리가 그 띠 밖(화면 밖·문제창 뒤)이면 도감을 부드럽게 스크롤해서 보이게 해 줘요. 이미 보이면 가만히 둬요. (CFG.DEX_FLY_SCROLL:0 으로 끌 수 있어요) */
function showSlot(s){if(!CFG.DEX_FLY_SCROLL||!s||!root)return;
 const r=s.getBoundingClientRect(),bd=bandOf();if(r.top>=bd.t&&r.bottom<=bd.b)return;
 const d=r.top+r.height/2-(bd.t+bd.b)/2;
 try{if('scrollBehavior' in document.documentElement.style)root.scrollBy({top:d,behavior:'smooth'});else root.scrollTop+=d;}catch(e){root.scrollTop+=d;}}
function fly(row,idx,id){const f=row&&row.children[idx];
  if(!f||reduceMo()){setTimeout(()=>release(id,1),900);return;}
  let begun=0;
  /* 카드가 열리자마자 도감을 그 자리까지 스크롤해 둬요 (내 도감 정보가 조금 늦게 와도 잠깐 기다려요) */
  const look=n=>{if(begun)return;const s=slotOf(id);if(s)showSlot(s);else if(n<25)setTimeout(()=>look(n+1),80);};look(0);
  const go=n=>{try{
   if(!root||!root.isConnected||!f.isConnected||!root.querySelector('#hbDh')){release(id,1);return;}
   if(!slotOf(id)&&n<12){setTimeout(()=>go(n+1),100);return;}   // 도감 타일이 아직 없으면 최대 1.2초 더 기다려요 (끝내 없으면 예전처럼 도감 가운데로)
   begun=1;showSlot(slotOf(id));
   const a=f.getBoundingClientRect();if(a.width<10){release(id,1);return;}
   const sx=a.left+a.width/2,sy=a.top+a.height/2;
   /* 목적지는 매 프레임 다시 재요: 스크롤 중이거나 도감이 다시 그려져도 카드가 자리를 따라가요 */
   const aim=()=>{const s=slotOf(id),r=s&&s.getBoundingClientRect();
    if(r&&r.width>2)return{X:r.left+r.width/2,Y:r.top+r.height/2,k:Math.min(r.width/a.width,r.height/a.height),r};
    const dp=dexPt();return dp?{X:dp.X,Y:dp.Y,k:Math.min(.3,46/a.width),r:null}:null;};
   let T=aim();if(!T){release(id,1);return;}
   const dist=Math.hypot(T.X-sx,T.Y-sy),D=Math.round(Math.min(1150,Math.max(760,560+dist*.9)));
   const g=document.createElement('div');g.className='hbSlot';root.appendChild(g);   // 들어갈 자리를 점선 테두리로 알려줘요
   const w=document.createElement('div');w.className='hbPk';
   w.style.cssText='position:fixed;margin:0;gap:0;display:block;left:'+a.left+'px;top:'+a.top+'px;width:'+a.width+'px;z-index:9600;pointer-events:none;will-change:transform,opacity';
   const c=f.cloneNode(true);c.classList.remove('hbSel');c.querySelectorAll('.hbBadge').forEach(x=>x.remove());c.style.cssText='width:100%;opacity:1;filter:none;transform:none';
   w.appendChild(c);root.appendChild(w);
   f.style.transition='none';f.style.opacity='0';
   try{sfx('tap');}catch(e){}
   let done=0,rel=0;
   const fin=()=>{if(done)return;done=1;w.remove();g.remove();if(!rel){rel=1;release(id,1);}
    const tg=root&&root.querySelector('#hbDh'),bx=tg&&tg.parentNode;if(bx){bx.classList.remove('hbDexP');void bx.offsetWidth;bx.classList.add('hbDexP');setTimeout(()=>bx.classList.remove('hbDexP'),750);}};
   const sm=x=>x*x*(3-2*x),t0=performance.now();
   const step=now=>{if(done)return;try{
    if(!w.isConnected||!root.isConnected){fin();return;}
    const u=Math.min(1,(now-t0)/D),e=sm(u);T=aim()||T;
    const x=(T.X-sx)*e,y=(T.Y-sy)*e-Math.sin(Math.PI*u)*Math.min(46,16+dist*.18);              // 위로 살짝 포물선을 그리며
    const sc=u<.2?1+.1*(u/.2):1.1+(T.k-1.1)*sm((u-.2)/.8),rot=Math.sin(u*Math.PI*1.6)*8*(1-u);   // 살짝 커졌다가 → 자리 크기로 줄어들며 똑바로
    w.style.transform='translate('+x+'px,'+y+'px) scale('+sc+') rotate('+rot+'deg)';
    w.style.opacity=u<.86?1:1-(u-.86)/.14*.9;
    if(T.r){g.style.display='block';g.style.left=T.r.left+'px';g.style.top=T.r.top+'px';g.style.width=T.r.width+'px';g.style.height=T.r.height+'px';}else g.style.display='none';
    if(u>=.9&&!rel){rel=1;release(id,1);}                                                       // 거의 닿는 순간 도감 칸이 톡 나타나요
    if(u<1)requestAnimationFrame(step);else fin();
   }catch(err){fin();}};
   requestAnimationFrame(step);setTimeout(fin,D+1500);
  }catch(e){release(id,1);}};
  setTimeout(()=>go(0),900);}
function showRes(m){C.mode='res';const ids=(Array.isArray(m.ids)?m.ids:[]).map(Number).filter(id=>MON[id]);const tok=C.resTok=(C.resTok|0)+1;C.hkTok=0;
 const {row,ci}=pkRow();C.pk=null;
 const mon=['one','two','three'].includes(m.ev)&&ids.length>0,isMul=m.ev==='x2'||m.ev==='x3';
 if(mon){holdNew(ids);setTimeout(()=>ids.forEach(id=>release(id,0)),3200+Math.min(ids.length,3)*1250);}
 const order=[ci].concat([0,1,2].filter(x=>x!==ci).sort((x,y)=>Math.abs(x-ci)-Math.abs(y-ci)||y-x));
 const n=mon?Math.min(ids.length,3):1;
 const alive=()=>C&&C.mode==='res'&&C.resTok===tok;
 const t0=550,gap=1250;
 const title=esc(EVN[m.ev]||'')+(m.note?'<br><small>'+esc(m.note)+'</small>':'');
 setPT(mon?'🃏 카드 공개!':title,mon?'':'#ff6');
 for(let k=0;k<n;k++)setTimeout(()=>{if(!alive())return;
  openFlip(row,order[k],mon?monFace(ids[k]):evFace(m.ev,m.note),k>0?'보너스 1장 더!':'');
   if(mon)fly(row,order[k],ids[k]);
   if(isMul){const ff=row.children[order[k]];if(ff)ff.classList.add('hbMulGlow');setTimeout(()=>{if(alive())multFx(m.ev==='x3'?3:2,m.note);},120);}
  if(mon&&k>0)setPT('🎁 보너스 1장 더!','#ffd23f');
  else if(mon)setPT('✨ '+esc(MON[ids[0]].name)+(n>1?' 획득! 그런데…':' 획득!'),'#ff6');
  if(!mon)setPT(title,'#ff6');
 },t0+k*gap);
 const endAt=isMul?t0+2400:t0+(n-1)*gap+(mon?1950:1500);
 if(mon&&n>1)setTimeout(()=>{if(alive())setPT(esc(EVN[m.ev]||''),'#ff6');},t0+(n-1)*gap+500);
 setTimeout(()=>{if(alive()){popx();next();}},endAt);}
function showHack(m){const live=flipRow(),ci=C.pk&&Number.isInteger(C.pk.i)?C.pk.i:-1;
 if(live&&live.children.length===3&&ci>=0&&C.mode==='wait'){C.mode='res';const tok=C.hkTok=(m.n|0)||1;C.pk=null;openFlip(live,ci,evFace('hack'),'');setPT('💥 해킹 이벤트!','#f66');
  setTimeout(()=>{if(C&&C.hkTok===tok&&C.mode==='res'){C.hkTok=0;showHack2(m);}},1100);return;}
 showHack2(m);}
/* ---------- 해킹 대상 고르기: 아이디 4개 중 진짜는 1~2개. [해킹] 버튼 → 문제 풀이 → 가짜 아이디 1개를 연출과 함께 삭제 ---------- */
function showHack2(m){C.hkM=m;C.hkElim=[];renderHack();}
function renderHack(note){const m=C.hkM;if(!m||!C||C.phase!=='play')return;C.mode='hack';clearTimeout(C.hkTmo);
 const el=C.hkElim||[],real=+m.real||1,fakes=Math.max(0,m.opts.length-real-el.length);
 const p=pop('<h3 style="color:#f66;text-align:center">⚠ 해킹 시스템에 침투했습니다.<br>해킹 대상을 선택하세요!</h3>'
  +(note?'<div class=hkNote>'+note+'</div>':'')
  +(fakes>0?'<button class="b g hkBtn" data-x=hkq>🔓 [해킹]<small>문제를 풀면 가짜 아이디 1개를 지워요 · 가짜 '+fakes+'개 남음</small></button>':'<div class=hkNone>✅ 남은 아이디는 전부 진짜예요! 하나를 골라요</div>')
  +'<div class=choices>'+m.opts.map((o,i)=>el.includes(i)?'':'<button class=ch data-i='+i+'>'+esc(o)+'</button>').join('')+'</div><div style="font-size:13px;margin-top:6px">내 아이디: <b>'+C.hid+'</b> (이 중 진짜 플레이어 아이디는 '+real+'개!)</div>');
 p.querySelectorAll('.ch').forEach(b=>b.onclick=()=>{if(C.mode!=='hack')return;C.mode='wait';C.hkM=null;tx({t:'hit',n:m.n,i:+b.dataset.i});});
 const hb=p.querySelector('[data-x=hkq]');if(hb)hb.onclick=()=>hkQuestion();}
function hkQuestion(){const m=C.hkM;if(!m||C.mode!=='hack')return;C.mode='hkq';
 let q=hbPick();if(!q){const a=2+rr(8),b=2+rr(8);q={q:a+' × '+b+' = ?',a:String(a*b),ch:[a*b,a*b+a,a*b-b,a*b+2].map(String),sk:Object.keys(SKM)[0]};}
 try{S.curQ=q;}catch(e){}
 C.qAt=now();
 const p=pop('<div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><div style="color:#3f8;font-size:15px">🔓 해킹 중! 문제를 풀면 가짜 아이디 1개를 지워요</div><button class="b r qclose" data-x=hkback>↩ 돌아가기</button></div>'+qHTML(q));
 const bk=p.querySelector('[data-x=hkback]');if(bk)bk.onclick=()=>{if(C.mode==='hkq')renderHack();};
 let hinted=false;try{window.PADX&&PADX.start(p,q,{mode:'hack',onUse:()=>{hinted=true;}});}catch(e){}   // ✏️ 연습장 · 💡 힌트 (힌트를 쓰면 정답 뒤 해킹 결과가 3초 늦게 와요)
 p.querySelectorAll('.ch').forEach(b=>b.onclick=()=>{if(C.mode!=='hkq')return;const pk0=q.ch[+b.dataset.i];hbRec(q,pk0===q.a,pk0);
  if(pk0===q.a){C.wrong=0;C.mode='hkw';pop('<h3 style="text-align:center;color:#3f8">✅ 정답! 가짜 아이디를 추적하는 중…</h3>');const pen=hinted?3000:0;if(pen)setTimeout(()=>{if(C&&C.mode==='hkw'&&C.hkM===m)tx({t:'hkq',n:m.n});},pen);else tx({t:'hkq',n:m.n});C.hkTmo=setTimeout(()=>{if(C&&C.mode==='hkw')renderHack();},6000+pen);}
  else{b.classList.add('shk');C.mode='x';C.wrong=(C.wrong||0)+1;tx({t:'wrong'});const w=CFG.WRONG_WAIT[Math.min(C.wrong-1,CFG.WRONG_WAIT.length-1)],ah=(p.querySelectorAll('.ch')[q.ch.indexOf(q.a)]||{}).innerHTML||esc(String(q.a));
   pop('<h3 style="color:#f88;text-align:center">❌ 오답!</h3><div style="text-align:center">정답은 <b>'+ah+'</b> 였어요.<br><b id=hbWw>'+w+'</b>초 뒤에 해킹 창으로 돌아가요.</div>');
   let left=w;const iv=setInterval(()=>{if(!C||C.phase!=='play'||C.mode!=='x'){clearInterval(iv);return;}left--;const e=$h('#hbWw');if(e)e.textContent=Math.max(0,left);if(left<=0){clearInterval(iv);renderHack();}},1000);}});}
/* 방장이 알려준 가짜 아이디를 '삭제' 연출과 함께 지워요 */
function hackElim(m){if(!C||!C.hkM||(+m.n|0)!==(+C.hkM.n|0))return;clearTimeout(C.hkTmo);
 const i=+m.i,mm=C.hkM,live=C.mode==='hkw'||C.mode==='hkq'||C.mode==='hack';
 if(i===-2){toast('⏳ 너무 빨라요! 조금 뒤에 다시 해킹해 주세요');if(live)renderHack();return;}
 if(!(i>=0)||(C.hkElim||[]).includes(i)){if(live)renderHack('가짜 아이디가 더 없어요');return;}
 if(!live){(C.hkElim=C.hkElim||[]).push(i);return;}
 renderHack();const pb=$h('#hbP .pb'),btn=pb&&pb.querySelector('.ch[data-i="'+i+'"]');C.mode='hkfx';
 try{sfx('crit');setTimeout(()=>{try{sfx('hit');}catch(e){}},500);}catch(e){}
 if(btn){btn.classList.add('hkDel');const tg=document.createElement('span');tg.className='hkTag';tg.textContent='FAKE';btn.appendChild(tg);}
 if(pb){const fx=document.createElement('div');fx.className='hkFx';fx.textContent='💥 가짜 아이디 삭제!';pb.insertBefore(fx,pb.children[1]||null);}
 setTimeout(()=>{if(!C||C.hkM!==mm||C.phase!=='play'||C.mode!=='hkfx')return;(C.hkElim=C.hkElim||[]).push(i);renderHack('🧹 가짜 아이디를 지웠어요!');},reduceMo()?500:1150);}
/* ---------- 해킹 성공 연출 (해킹한 사람): 매트릭스 비 + 터미널 + ACCESS GRANTED + 빼앗은 카드 수 ---------- */
function hackWin(m){
 popx();showGo(0);
 const from=String(m.from||'트레이너').slice(0,8),k=Math.max(1,+m.k|0),calm=reduceMo();
 const sx=n=>{try{sfx(n);}catch(e){}};
 sx('tap');
 root.querySelectorAll('.hkWin').forEach(x=>x.remove());
 const o=document.createElement('div');o.className='hkWin';
 o.innerHTML='<canvas class=hkCv></canvas><div class=hkFly></div><div class=hkBox><div class=hkTerm></div><div class=hkTi>ACCESS GRANTED</div><div class=hkSub>💥 해킹 성공! 💥</div><div class=hkLoot></div><div class=hkHint>화면을 누르면 계속해요</div></div>';
 root.appendChild(o);
 const q=s=>o.querySelector(s),tm=[],ivs=[],at=(f,ms)=>tm.push(setTimeout(()=>{if(o.isConnected)f();},calm?0:ms));
 let rain=0;
 if(!calm&&!lowFx()){const cv=q('.hkCv'),cx=cv.getContext('2d');if(cx){const W=cv.width=innerWidth,Hh=cv.height=innerHeight,cols=Math.ceil(W/16),dr=Array.from({length:cols},()=>rr(Math.ceil(Hh/16))),gl='01ABCDEF▌▐░▒ｱｲｳｴｵ';
  rain=setInterval(()=>{if(!o.isConnected){clearInterval(rain);return;}cx.fillStyle='rgba(0,12,8,.16)';cx.fillRect(0,0,W,Hh);cx.fillStyle='#3f8';cx.font='16px monospace';
   for(let i=0;i<cols;i++){cx.fillText(gl[rr(gl.length)],i*16,dr[i]*16);if(dr[i]*16>Hh&&Math.random()>.97)dr[i]=0;dr[i]++;}},60);}}
 const term=q('.hkTerm'),fly=q('.hkFly'),line=(t,c)=>{const d=document.createElement('div');d.textContent=t;if(c)d.style.color=c;term.appendChild(d);sx('tap');return d;};
 const bar=p=>'['+'#'.repeat(Math.round(p/10))+'.'.repeat(10-Math.round(p/10))+'] '+p+'%';
 const sparks=(col,n,top)=>{if(calm||lowFx())return;for(let i=0;i<n;i++){const s=document.createElement('i'),a=Math.PI*2*i/n+Math.random()*.3,d=90+rr(Math.min(innerWidth,innerHeight)*.55);s.className='hkSp';s.style.cssText='--c:'+col+';--sx:'+Math.round(Math.cos(a)*d)+'px;--sy:'+Math.round(Math.sin(a)*d)+'px;--d:'+(.7+rr(50)/100)+'s;top:'+top+'%;';fly.appendChild(s);setTimeout(()=>s.remove(),1500);}};
 const rings=col=>{if(calm||lowFx())return;for(let i=0;i<3;i++){const r=document.createElement('i');r.className='hkRg';r.style.cssText='--c:'+col+';animation-delay:'+(i*.2)+'s';fly.appendChild(r);setTimeout(()=>r.remove(),1900);}};
 const flash=()=>{if(calm||lowFx())return;const f=document.createElement('div');f.className='hkFl2';o.appendChild(f);setTimeout(()=>f.remove(),520);};
 line('> TARGET LOCKED : '+from);
 at(()=>{const lb='> 방화벽 우회  ',d=line(lb+bar(calm?100:0));if(calm)return;let p=0;const iv=setInterval(()=>{p=Math.min(100,p+10);d.textContent=lb+bar(p);if(p>=100||!o.isConnected)clearInterval(iv);},70);ivs.push(iv);},350);
 at(()=>line('> 관리자 권한 획득  root@dex ✔','#ffd23f'),1150);
 at(()=>{line('> 카드 데이터 전송 중...');if(calm||lowFx())return;const n=Math.min(k,10);   // 빼앗은 카드가 위(상대)에서 아래(내 도감)로 날아와요
  for(let i=0;i<n;i++){const c=document.createElement('i');c.className='hkCd';c.style.cssText='--x0:'+(rr(120)-60)+'px;--x1:'+(rr(300)-150)+'px;--r:'+(rr(70)-35)+'deg;--dl:'+(i*.07).toFixed(2)+'s;--d:'+(.8+rr(30)/100).toFixed(2)+'s';fly.appendChild(c);setTimeout(()=>c.remove(),2600);}
  for(let i=0;i<Math.min(n,8);i++)tm.push(setTimeout(()=>sx('tap'),250+i*110));},1450);
 at(()=>{q('.hkTi').classList.add('show');q('.hkBox').classList.add('shk');flash();rings('#3f8');sparks('#3f8',18,40);sx('crit');},2150);
 at(()=>q('.hkSub').classList.add('show'),2650);
 at(()=>{const l=q('.hkLoot');const pt=(m.pts==null)?-1:Math.max(0,+m.pts|0);l.innerHTML='<b>'+esc(from)+'</b>'+(m.tm?' 팀의 포켓몬':' 님의 포켓몬')+' <b id=hkN>0</b>마리 탈취!'+(pt>=0?'<div style="margin-top:6px;color:#ffd23f">⭐ 내 점수 <b id=hkP>0</b>점 획득!</div>':'');l.classList.add('show');sx('win');sparks('#ffd23f',16,62);
  if(calm){q('#hkN').textContent=k;const pe=q('#hkP');if(pe)pe.textContent=pt;return;}
  const t0=now(),iv=setInterval(()=>{const n=q('#hkN');if(!n||!o.isConnected){clearInterval(iv);return;}const p=Math.min(1,(now()-t0)/900);n.textContent=Math.round(k*p);const pe=q('#hkP');if(pe)pe.textContent=Math.round(pt*p);if(p>=1)clearInterval(iv);},40);ivs.push(iv);
  for(let i=0;i<6;i++)tm.push(setTimeout(()=>sx('coin'),i*150));},3050);
 at(()=>q('.hkHint').classList.add('show'),4000);
 let done=0;const close=()=>{if(done)return;done=1;clearInterval(rain);ivs.forEach(clearInterval);tm.forEach(clearTimeout);o.classList.add('out');setTimeout(()=>{o.remove();if(C&&C.mode==='res'){popx();next();}},calm?0:320);};
 const t0=now();o.onclick=()=>{if(now()-t0>1200||calm)close();};tm.push(setTimeout(close,calm?2500:7200));}
/* ---------- 해킹당함 연출 (해킹당한 사람): 화면이 붉게 · WARNING 문구 → 복구 미니게임. 붉은 화면은 복구를 마칠 때까지 유지돼요 ---------- */
function hitWarn(m){
 if(!root||!C||C.phase!=='play')return;
 const by=String(m.by||'트레이너').slice(0,8),k=Math.max(0,+m.k|0),prev=C.mode,tk=C.warnTk=(C.warnTk|0)+1,calm=reduceMo();
 const sx=n=>{try{sfx(n);}catch(e){}};
 sx('faint');setTimeout(()=>sx('thud'),260);
 if(!root.querySelector('#hbRed')){const r=document.createElement('div');r.id='hbRed';r.className='hkRed';root.appendChild(r);}
 root.classList.remove('hkShake');void root.offsetWidth;root.classList.add('hkShake');setTimeout(()=>{if(root)root.classList.remove('hkShake');},700);
 root.querySelectorAll('.hkWin').forEach(x=>x.remove());
 root.querySelectorAll('.hkWarn').forEach(x=>x.remove());
 if(prev!=='mini'){C.mode='warn';C.pendWait=0;popx();showGo(0);}
 const w=document.createElement('div');w.className='hkWarn v2';
 w.innerHTML='<div class=hkFly></div><div class=hkRFl></div>'
  +'<div class=hkW1>⚠ WARNING ⚠</div><div class=hkW2>SYSTEM BREACH DETECTED</div>'
  +'<div class="hkW3 hid"><b>'+esc(by)+'</b>'+jo(by,'이','가')+' 내 시스템을 해킹했어요!</div>'
  +(k?'<div class="hkW5 hid">📤 카드 <b class=hkLk>0</b>장 유출 중…</div>':'')
  +'<div class="hkW6 hid"><div class=hkW6t>🔧 복구 프로그램 실행 중…</div><div class=hkBarO><i></i></div></div>';
 root.appendChild(w);
 const q=s=>w.querySelector(s),tm=[],ivs=[],at=(f,ms)=>tm.push(setTimeout(()=>{if(w.isConnected)f();},calm?0:ms));
 // 가짜 오류 창이 하나씩 튀어나와요 (위·아래 띠 영역에 무작위로)
 const ERR=['⛔ ACCESS VIOLATION','🔓 FIREWALL DOWN','📤 DATA LEAK','☠ ROOT ACCESS LOST','⚠ UNKNOWN USER','💀 SECURITY FAULT'];
 for(let i=0;i<4;i++){const e=document.createElement('div');e.className='hkErrW';const top=i%2?78+rr(10):4+rr(10);e.style.cssText='left:'+(2+rr(46))+'%;top:'+top+'%;animation-delay:'+(calm?0:.25+i*.4)+'s;'+(calm?'':'opacity:0');
  e.innerHTML='<b>'+ERR[(i*2+rr(2))%ERR.length]+'</b><span>0x'+(rr(0xFFFFF)+0x10000).toString(16).toUpperCase()+' 오류</span>';w.appendChild(e);}
 at(()=>q('.hkW3').classList.remove('hid'),450);
 at(()=>{const lk=q('.hkLk');if(!lk)return;q('.hkW5').classList.remove('hid');   // 빼앗긴 카드가 위로 날아가며 숫자가 올라가요
  if(calm){lk.textContent=k;return;}
  const fly=q('.hkFly'),n=lowFx()?0:Math.min(k,9);
  for(let i=0;i<n;i++){const c=document.createElement('i');c.className='hkCd rd';c.style.cssText='--x0:'+(rr(160)-80)+'px;--x1:'+(rr(320)-160)+'px;--r:'+(rr(80)-40)+'deg;--dl:'+(i*.09).toFixed(2)+'s;--d:'+(.7+rr(30)/100).toFixed(2)+'s';fly.appendChild(c);setTimeout(()=>c.remove(),2400);}
  const t0=now(),iv=setInterval(()=>{if(!w.isConnected){clearInterval(iv);return;}const p=Math.min(1,(now()-t0)/1100),v=Math.round(k*p);if(lk.textContent!=v){lk.textContent=v;sx('wrong');}if(p>=1)clearInterval(iv);},90);ivs.push(iv);},950);
 at(()=>{q('.hkW6').classList.remove('hid');const f=q('.hkBarO i');if(f){f.style.transition=calm?'none':'width 1.15s linear';void f.offsetWidth;f.style.width='100%';}sx('tap');},2550);
 let done=0;const go=()=>{if(done)return;done=1;tm.forEach(clearTimeout);ivs.forEach(clearInterval);w.remove();if(!C||C.warnTk!==tk||C.phase!=='play')return;
  if(C.me&&C.me.lock&&C.mode!=='mini')mini();
  else if(C.mode==='warn'){C.mode=null;redOff();next();}};
 const t0=now();w.onclick=()=>{if(calm||now()-t0>1500)go();};
 tm.push(setTimeout(go,calm?1800:3900));}
function redOff(){const r=root&&root.querySelector('#hbRed');if(r){r.classList.add('out');setTimeout(()=>r.remove(),450);}}
/* ---------- 방어권 사용 성공 연출 (방어한 사람): 파란 방화벽이 켜지며 해킹을 막아내요. 화면 조작은 막지 않아요 ---------- */
function defWin(m){
 const by=String(m.by||'트레이너').slice(0,8),k=Math.max(0,+m.k|0),calm=reduceMo();
 if(!root||!C||C.phase!=='play'){try{toast('🛡 '+esc(by)+' 님의 해킹을 방어권으로 막았어요!');}catch(e){}return;}
 try{sfx('thud');setTimeout(()=>{try{sfx('level');}catch(e){}},220);}catch(e){}
 root.querySelectorAll('.hkDef').forEach(x=>x.remove());
 const o=document.createElement('div');o.className='hkDef';
 o.innerHTML='<div class=hkDFl></div><i class=hkDRg></i><i class=hkDRg style="animation-delay:.22s"></i><i class=hkDRg style="animation-delay:.44s"></i>'
  +'<div class=hkD0>&gt; INTRUSION DETECTED ▸ FIREWALL ONLINE ▸ BLOCKED</div><div class=hkDSh>🛡️</div><div class=hkDTi>DEFENSE SUCCESS</div>'
  +'<div class=hkDSub><b>'+esc(by)+'</b>'+jo(by,'이','가')+' 시도한 해킹을<br>방어권으로 막아냈어요!</div>'
  +(k?'<div class=hkDInfo>포켓몬 <b>'+k+'</b>마리를 지켰어요! 🎉</div>':'')
  +'<div class=hkDUse>🛡 방어권 1장을 사용했어요</div>';
 root.appendChild(o);
 setTimeout(()=>{o.classList.add('out');setTimeout(()=>o.remove(),calm?0:420);},calm?2200:3300);}
/* ---------- 방어권에 막힌 해킹 연출 (해킹한 사람): 거의 뚫었는데… 막혀서 아쉬운 실패 연출 ---------- */
function hackBlock(m){
 popx();showGo(0);
 const from=String(m.from||'상대').slice(0,8),k=Math.max(0,+m.k|0),calm=reduceMo();
 root.querySelectorAll('.hkWin').forEach(x=>x.remove());
 const o=document.createElement('div');o.className='hkWin blk';
 o.innerHTML='<canvas class=hkCv></canvas><div class=hkBox><div class=hkTerm></div><div class=hkTi>ACCESS DENIED</div><div class=hkSub>🛡 방어권에 막혔어요!</div><div class=hkLoot></div><div class=hkHint>화면을 누르면 계속해요</div></div>';
 root.appendChild(o);
 const q=s=>o.querySelector(s),tm=[],ivs=[],at=(f,ms)=>tm.push(setTimeout(()=>{if(o.isConnected)f();},calm?0:ms));
 let rain=0;
 if(!calm&&!lowFx()){const cv=q('.hkCv'),cx=cv.getContext('2d');if(cx){const W=cv.width=innerWidth,Hh=cv.height=innerHeight,cols=Math.ceil(W/16),dr=Array.from({length:cols},()=>rr(Math.ceil(Hh/16))),gl='01ABCDEF▌▐░▒ｱｲｳｴｵ';
  rain=setInterval(()=>{if(!o.isConnected){clearInterval(rain);return;}cx.fillStyle='rgba(12,2,6,.18)';cx.fillRect(0,0,W,Hh);cx.fillStyle=o.classList.contains('dn')?'#f45':'#3f8';cx.font='16px monospace';
   for(let i=0;i<cols;i++){cx.fillText(gl[rr(gl.length)],i*16,dr[i]*16);if(dr[i]*16>Hh&&Math.random()>.97)dr[i]=0;dr[i]++;}},60);}}
 const term=q('.hkTerm'),line=(t,c)=>{const d=document.createElement('div');d.textContent=t;if(c)d.style.color=c;term.appendChild(d);return d;};
 const bar=p=>'['+'#'.repeat(Math.round(p/10))+'.'.repeat(10-Math.round(p/10))+'] '+p+'%';
 try{sfx('tap');}catch(e){}
 line('> TARGET LOCKED : '+from);
 at(()=>{const lb='> 방화벽 우회 중  ',d=line(lb+bar(calm?87:0));if(calm)return;let p=0;const iv=setInterval(()=>{p=Math.min(87,p+9);d.textContent=lb+bar(p);try{sfx('tap');}catch(e){}if(p>=87||!o.isConnected)clearInterval(iv);},95);ivs.push(iv);},380);
 at(()=>line('> 87%... 87%... 응답 없음...','#fd6'),1450);
 at(()=>line('> ⚠ 방어권 감지! 침투 차단됨','#ff6a7a'),1950);
 at(()=>{o.classList.add('dn');q('.hkTi').classList.add('show');q('.hkBox').classList.add('shk');try{sfx('faint');setTimeout(()=>{try{sfx('thud');}catch(e){}},260);}catch(e){}},2350);
 at(()=>q('.hkSub').classList.add('show'),2850);
 at(()=>{const l=q('.hkLoot');l.innerHTML=(k?'빼앗을 뻔한 포켓몬 <b>'+k+'</b>마리가<br>눈앞에서 사라졌어요… 💨':'눈앞에서 놓쳐 버렸어요… 💨')+'<div class=hkLs>아깝다! 거의 다 뚫었는데…<br><b>'+esc(from)+'</b>의 방어권은 사라졌어요. 다시 도전해 봐요!</div>';l.classList.add('show');},3350);
 at(()=>q('.hkHint').classList.add('show'),4200);
 let done=0;const close=()=>{if(done)return;done=1;clearInterval(rain);ivs.forEach(clearInterval);tm.forEach(clearTimeout);o.classList.add('out');setTimeout(()=>{o.remove();if(C&&C.mode==='res'){popx();next();}},calm?0:320);};
 const t0=now();o.onclick=()=>{if(now()-t0>1300||calm)close();};tm.push(setTimeout(close,calm?2800:6500));}
function showHkr(m){C.hkTok=0;C.hkM=null;C.mode='res';if(m.ok){hackWin(m);return;}if(m.blk||/방어권에 막혔/.test(String(m.why||''))){hackBlock(m);return;}pop('<h3 style="text-align:center;color:'+(m.ok?'#3f8':'#f88')+'">'+(m.ok?'💥 해킹 성공! '+esc(m.from)+' 님의 포켓몬 '+(+m.k|0)+'마리를 빼앗았어요!'+(m.pts==null?'':' (⭐ +'+(m.pts|0)+'점)'):'🚫 해킹 실패 — '+esc(m.why))+'</h3>');setTimeout(()=>{if(C&&C.mode==='res'){popx();next();}},2000);}
/* ---------- 상단 알림: 전설 채굴 / 해킹 성공 (모든 참가자 화면 맨 위에 잠깐 떠요) ---------- */
/* 알림에는 방에서 쓰는 '닉네임'(p.name)만 써요. 해킹용 아이디(hid)는 절대 쓰지 않아요. */
const jo=(w,a,b)=>{w=String(w||'');const ch=w.slice(-1),c=ch.charCodeAt(0);if(c>=0xAC00&&c<=0xD7A3)return (c-0xAC00)%28?a:b;if(/[0-9]/.test(ch))return '013678'.includes(ch)?a:b;if(/[aeiouyAEIOUY]/.test(ch))return b;return a;};
function nwAdd(cls,html,ms){if(!root||!C||C.phase!=='play')return;let b=root.querySelector('#hbNw');if(!b){b=document.createElement('div');b.id='hbNw';b.className='nw';root.appendChild(b);}
 while(b.children.length>=3)b.firstChild.remove();
 const d=document.createElement('div');d.className='nwI '+cls;d.innerHTML=html;b.appendChild(d);
 setTimeout(()=>{d.classList.add('out');setTimeout(()=>d.remove(),450);},ms||3600);}
function legend(m){if(!m||!MON[+m.id])return;m.id=+m.id;const raw=String(m.who||'트레이너'),isAI=/^🤖/.test(raw),who=raw.replace(/^🤖\s*/,'').slice(0,8)||'AI',nm=String(MON[m.id].name);
 nwAdd('nwL',monImg(m.id,'front','nwMon')+'<div>'+(isAI?'<span class=nwAi>AI</span>':'')+'<b>'+esc(who)+'</b>'+jo(who,'이','가')+' <b>'+esc(nm)+'</b>'+jo(nm,'을','를')+' 채굴했어요!</div>',4200);}
function hackNews(m){if(!m)return;const a=String(m.by||'트레이너').slice(0,8),b=String(m.to||'트레이너').slice(0,8),k=Math.max(1,+m.k|0);
 nwAdd('nwH','💥 <b>'+esc(a)+'</b>'+jo(a,'이','가')+' <b>'+esc(b)+'</b>의 포켓몬 <b>'+k+'</b>마리 해킹 성공!',3800);}
/* ---------- 복구 미니게임: MINI 에 함수만 추가하면 새 게임이 늘어요 ---------- */
const MINI={
 color:{n:'컬러 코드 해독',f(box,ok){
  /* 규칙: 8칸에 4가지 색이 랜덤으로 섞여 있어요. 칸을 누르면 '그 칸'의 색이 (지금 색을 뺀) 나머지 3색 중 하나로 랜덤하게 바뀌어요. 8칸이 어떤 색이든 전부 같아지면 성공! */
  const N=8,CL=[{n:'빨강',c:'255,77,109',s:'▲'},{n:'파랑',c:'61,155,255',s:'●'},{n:'초록',c:'53,224,138',s:'■'},{n:'노랑',c:'255,210,63',s:'◆'}];
  const S=Array.from({length:N},()=>rr(4));while(S.every(v=>v===S[0]))S[rr(N)]=rr(4);
  let done=false,moves=0;
  if(!document.getElementById('hbClCss')){const st=document.createElement('style');st.id='hbClCss';st.textContent=[
   '.cl{font-family:var(--mono,monospace);color:#cfe;max-width:340px;margin:4px auto 2px;user-select:none;-webkit-user-select:none}',
   '.cl .clMsg{font-size:14px;line-height:1.45;color:#bfe}',
   '.cl .clGr{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0 8px;padding:10px;border:2px solid #0a8;border-radius:10px;background:linear-gradient(#03130f,#020b0a);box-shadow:inset 0 0 24px rgba(0,170,130,.3),0 0 14px rgba(0,170,130,.35);transition:border-color .3s,box-shadow .3s}',
   '.cl .clGr.win{border-color:#8fb;box-shadow:inset 0 0 30px rgba(90,255,160,.5),0 0 22px #3f8}',
   '.cl .clB{position:relative;height:62px;margin:0;padding:0;border-radius:10px;border:2px solid rgba(var(--k),.9);background:linear-gradient(rgba(var(--k),.55),rgba(var(--k),.22));color:#fff!important;font-size:26px!important;line-height:1;cursor:pointer;touch-action:manipulation;box-shadow:0 0 12px rgba(var(--k),.55),inset 0 0 14px rgba(var(--k),.35);text-shadow:0 0 8px rgba(0,0,0,.7);transition:background .15s,border-color .15s,box-shadow .15s}',
   '.cl .clB:before{content:"";position:absolute;left:6px;right:6px;top:4px;height:30%;border-radius:6px;background:linear-gradient(rgba(255,255,255,.28),transparent);pointer-events:none}',
   '.cl .clB.pp{animation:clpp .22s ease-out}',
   '@keyframes clpp{0%{transform:scale(.82) rotate(-4deg);filter:brightness(1.8)}60%{transform:scale(1.08)}100%{transform:scale(1);filter:none}}',
   '.cl .clB:active{transform:scale(.95)}',
   '.cl .clBar{display:flex;align-items:center;gap:8px;font-size:13px;color:#9ab}',
   '.cl .clBar i{flex:1;height:8px;border-radius:4px;background:#0a2a24;overflow:hidden;box-shadow:inset 0 0 0 1px #0a6}',
   '.cl .clBar i b{display:block;height:100%;width:0;border-radius:4px;background:linear-gradient(90deg,#3f8,#ff9);transition:width .25s}',
   '.cl .clBar span{min-width:92px;text-align:right}',
   '@media (prefers-reduced-motion:reduce){.cl .clB.pp{animation:none}}'
  ].join('\n');document.head.appendChild(st);}
  box.innerHTML='<div class=cl><div class=clMsg>🎨 8칸을 <b>모두 같은 색</b>으로 만드세요! 칸을 누르면 그 칸의 색이 <b>다른 색으로 랜덤하게</b> 바뀌어요 (어떤 색이든 OK)</div>'
   +'<div class=clGr>'+S.map((v,i)=>'<button class=clB data-i='+i+'></button>').join('')+'</div>'
   +'<div class=clBar><i><b></b></i><span></span></div></div>';
  const gr=box.querySelector('.clGr'),bs=[...box.querySelectorAll('.clB')],bar=box.querySelector('.clBar b'),tx=box.querySelector('.clBar span');
  const dr=()=>{bs.forEach((b,i)=>{const c=CL[S[i]];b.style.setProperty('--k',c.c);b.textContent=c.s;b.setAttribute('aria-label',c.n);});
   const cnt=CL.map((_,k)=>S.filter(v=>v===k).length),best=Math.max(...cnt);bar.style.width=(best/N*100)+'%';tx.textContent='같은 색 '+best+' / '+N+' · '+moves+'번';};
  bs.forEach((b,i)=>b.onclick=()=>{if(done)return;moves++;S[i]=(S[i]+1+rr(3))%4;dr();b.classList.remove('pp');void b.offsetWidth;b.classList.add('pp');
   if(S.every(v=>v===S[0])){done=true;gr.classList.add('win');box.querySelector('.clMsg').innerHTML='<b style="color:#8fb">🎉 모든 칸이 같은 색! 해독 성공</b>';setTimeout(ok,500);}});
  dr();}},
 memory:{n:'기억력 카드',f(box,ok){
  /* 규칙은 그대로: 카드 8장(4쌍)을 뒤집어 같은 그림 짝을 모두 찾아요. 틀리면 0.7초 뒤에 다시 뒤집혀요. */
  const E='🔥💧🌿⚡'.match(/.[️]?/gu),TC=['255,120,60','70,160,255','70,220,130','255,215,70'],d=[...E,...E].sort(()=>Math.random()-.5);
  let open=[],done=0,lock=0,tries=0;
  if(!document.getElementById('hbMmCss')){const st=document.createElement('style');st.id='hbMmCss';st.textContent=[
   '.mm{font-family:var(--mono,monospace);color:#cfe;max-width:340px;margin:4px auto 2px;user-select:none;-webkit-user-select:none}',
   '.mm .mmMsg{font-size:14px;line-height:1.45;color:#bfe}',
   '.mm .mmGr{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0 8px;padding:10px;border:2px solid #0a8;border-radius:10px;background:linear-gradient(#03130f,#020b0a);box-shadow:inset 0 0 24px rgba(0,170,130,.3),0 0 14px rgba(0,170,130,.35);transition:border-color .3s,box-shadow .3s}',
   '.mm .mmGr.win{border-color:#8fb;box-shadow:inset 0 0 30px rgba(90,255,160,.5),0 0 22px #3f8}',
   '.mm .mmC{position:relative;height:74px;margin:0;padding:0;border:0;background:none;perspective:500px;cursor:pointer;touch-action:manipulation;font-size:inherit!important;-webkit-tap-highlight-color:transparent}',
   '.mm .mmIn{position:absolute;left:0;right:0;top:0;bottom:0;transform-style:preserve-3d;transition:transform .35s}',
   '.mm .mmC.up .mmIn{transform:rotateY(180deg)}',
   '.mm .mmF,.mm .mmK{position:absolute;left:0;right:0;top:0;bottom:0;display:flex;align-items:center;justify-content:center;border-radius:10px;backface-visibility:hidden;-webkit-backface-visibility:hidden}',
   '.mm .mmK{border:2px solid #0cc;background:repeating-linear-gradient(45deg,rgba(0,255,200,.09) 0 6px,transparent 6px 12px),linear-gradient(#06322d,#031a18);box-shadow:0 0 10px rgba(0,200,200,.35),inset 0 0 12px rgba(0,255,200,.15);color:#3ff;font-size:26px;text-shadow:0 0 8px #3ff}',
   '.mm .mmC:active .mmK{filter:brightness(1.4)}',
   '.mm .mmF{transform:rotateY(180deg);border:2px solid rgba(var(--k),.95);background:linear-gradient(rgba(var(--k),.4),rgba(var(--k),.12));box-shadow:0 0 14px rgba(var(--k),.6),inset 0 0 14px rgba(var(--k),.3);font-size:34px}',
   '.mm .mmC.ok .mmF{border-color:#8fb;box-shadow:0 0 16px #3f8,inset 0 0 16px rgba(80,255,150,.35);animation:mmok .45s ease-out}',
   '@keyframes mmok{50%{transform:rotateY(180deg) scale(1.1)}}',
   '.mm .mmC.bad .mmF{border-color:#f55;box-shadow:0 0 14px #f55}',
   '.mm .mmC.bad .mmIn{animation:mmbad .3s}',
   '@keyframes mmbad{25%{transform:rotateY(180deg) translateX(-5px)}75%{transform:rotateY(180deg) translateX(5px)}}',
   '.mm .mmBar{display:flex;align-items:center;gap:8px;font-size:13px;color:#9ab}',
   '.mm .mmBar i{flex:1;height:8px;border-radius:4px;background:#0a2a24;overflow:hidden;box-shadow:inset 0 0 0 1px #0a6}',
   '.mm .mmBar i b{display:block;height:100%;width:0;border-radius:4px;background:linear-gradient(90deg,#3f8,#ff9);transition:width .25s}',
   '.mm .mmBar span{min-width:92px;text-align:right}',
   '@media (prefers-reduced-motion:reduce){.mm .mmIn{transition:none}.mm .mmC.ok .mmF,.mm .mmC.bad .mmIn{animation:none}}'
  ].join('\n');document.head.appendChild(st);}
  box.innerHTML='<div class=mm><div class=mmMsg>🃏 같은 그림 <b>짝</b>을 모두 찾으세요! (틀리면 다시 뒤집혀요)</div>'
   +'<div class=mmGr>'+d.map((e,i)=>'<button class=mmC data-i='+i+' style="--k:'+TC[E.indexOf(e)]+'" aria-label="카드 '+(i+1)+'"><div class=mmIn><div class=mmK>?</div><div class=mmF>'+e+'</div></div></button>').join('')+'</div>'
   +'<div class=mmBar><i><b></b></i><span></span></div></div>';
  const gr=box.querySelector('.mmGr'),bs=[...box.querySelectorAll('.mmC')],bar=box.querySelector('.mmBar b'),tx=box.querySelector('.mmBar span');
  const st=()=>{bar.style.width=(done/4*100)+'%';tx.textContent='짝 '+done+' / 4 · '+tries+'번';};st();
  bs.forEach((b,i)=>b.onclick=()=>{if(lock||b.classList.contains('ok')||open.includes(i))return;b.classList.add('up');open.push(i);
   if(open.length===2){const[a,c]=open;tries++;if(d[a]===d[c]){bs[a].classList.add('ok');bs[c].classList.add('ok');open=[];done++;st();if(done===4){gr.classList.add('win');box.querySelector('.mmMsg').innerHTML='<b style="color:#8fb">🎉 모든 짝을 찾았어요! 해독 성공</b>';setTimeout(ok,500);}}
    else{lock=1;st();bs[a].classList.add('bad');bs[c].classList.add('bad');setTimeout(()=>{[a,c].forEach(k=>bs[k].classList.remove('up','bad'));open=[];lock=0;},700);}}});}},
 order:{n:'데이터 순서 복구',f(box,ok){const a=[1,2,3,4,5,6,7,8].sort(()=>Math.random()-.5);let nx=1;box.innerHTML='<div>1부터 8까지 순서대로 누르세요</div><div class=mg style="grid-template-columns:repeat(4,1fr)">'+a.map(v=>'<button data-v='+v+'>'+v+'</button>').join('')+'</div>';box.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(+b.dataset.v===nx){b.classList.add('ok');if(++nx>8)ok();}else{box.querySelectorAll('button').forEach(x=>x.classList.remove('ok'));nx=1;b.classList.add('shk');}});}},
 code:{n:'숫자 암호 해독',f(box,ok){let d;do{d=String(10+rr(90));}while(d[0]===d[1]);
  const T=(c,ch,lb)=>'<span style="display:inline-block;text-align:center;margin:0 4px;vertical-align:top"><span style="display:block;width:54px;height:62px;line-height:62px;border-radius:10px;font-size:36px;font-weight:bold;color:'+(c==='y'?'#222':'#fff')+';background:'+({g:'#1fae52',y:'#f3c316',x:'#5b6470'}[c])+';border:3px solid '+({g:'#8fffb4',y:'#fff1a0',x:'#aab'}[c])+'">'+ch+'</span><span style="display:block;font-size:13px;margin-top:2px;color:'+({g:'#8fffb4',y:'#ffe066',x:'#ccd'}[c])+'">'+lb+'</span></span>';
  box.innerHTML='<div style="font-size:17px;line-height:1.5">🔢 <b>두 자리 숫자</b>를 맞혀 보세요! <small>(두 숫자는 서로 달라요 · 예: 47)</small></div>'
   +'<div style="margin:8px 0;padding:6px;border:1px dashed #0a8;border-radius:8px;font-size:14px">색깔로 알려 줘요!<br>'+T('g','7','딱 맞아요!')+T('y','4','자리만 달라요')+T('x','9','없는 숫자')+'</div>'
   +'<div style="text-align:center"><input id=hbCg maxlength=2 inputmode=numeric placeholder="00" style="width:100px;font-size:34px;padding:6px"> <button class="b g" id=hbCb style="font-size:22px;padding:10px 18px">확인</button></div>'
   +'<div id=hbCl></div><div id=hbCn style="font-size:16px;margin-top:6px">♾ 기회는 무제한! 맞힐 때까지 도전해요</div>';
  const go=()=>{const v=$h('#hbCg').value.trim();if(!/^\d{2}$/.test(v)||v[0]===v[1]){toast('서로 다른 숫자 두 개를 넣어 주세요 (예: 47)');return;}
   const ts=[0,1].map(i=>v[i]===d[i]?T('g',v[i],'딱 맞아요!'):d.includes(v[i])?T('y',v[i],'자리만 달라요'):T('x',v[i],'없는 숫자'));
   const win=v===d;
   $h('#hbCl').insertAdjacentHTML('afterbegin','<div style="margin:8px 0;padding:6px;border-radius:10px;background:rgba(0,40,40,.55);text-align:center">'+ts.join('')+'</div>');
   if(win)return ok();$h('#hbCg').value='';$h('#hbCg').focus();};
  $h('#hbCb').onclick=go;$h('#hbCg').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go();}});}},
 circuit:{n:'회로 연결',f(box,ok){const rot=m=>((m<<1)|(m>>3))&15,D=[[0,1,2,8],[1,0,4,1]];
  let path=[[0,0]];let r=0,c=0;while(r<3||c<3){if(r<3&&(c>=3||Math.random()<.5))r++;else c++;path.push([r,c]);}
  const sol={},cur={};path.forEach(([r,c],i)=>{const pv=i?path[i-1]:null,nx=i<path.length-1?path[i+1]:null;let m=0;const add=o=>{if(!o)return;if(o[0]<r)m|=1;else if(o[0]>r)m|=4;else if(o[1]>c)m|=2;else m|=8;};if(pv)add(pv);else m|=8;if(nx)add(nx);else m|=2;sol[r+','+c]=m;});
  const keys=Object.keys(sol),OPP={1:4,2:8,4:1,8:2};
  /* 가짜 전선: 길이 아닌 칸에도 전선 조각을 섞어 놔요 (돌릴 수는 있지만 건전지에서 이어지는 길만 중요해요) */
  for(let r=0;r<4;r++)for(let c=0;c<4;c++){const k=r+','+c;if(!sol[k]&&Math.random()<.65){let m=pk([5,3]),n=rr(4);while(n--)m=rot(m);cur[k]=m;}}
  /* 전기가 건전지(왼쪽 위)에서 출발해 이어진 전선을 따라가 봐요. 이어진 칸은 노랗게 빛나고, 전구까지 닿으면 성공! */
  const trace=()=>{const lit=[];let y=0,x=0,from=8,win=false;for(let g=0;g<20;g++){const m=cur[y+','+x];if(m==null||!(m&from))break;lit.push(y+','+x);const out=m&~from;if(y===3&&x===3&&out===2){win=true;break;}if(out===1)y--;else if(out===2)x++;else if(out===4)y++;else if(out===8)x--;else break;from=OPP[out];if(y<0||x<0||y>3||x>3)break;}return{lit,win};};
  do{keys.forEach(k=>{let m=sol[k],n=rr(4);while(n--)m=rot(m);cur[k]=m;});}while(trace().win);
  const wire=(m,lit)=>{const col=lit?'#ffe14d':'#7b8da4';let l='';[[1,50,0],[2,100,50],[4,50,100],[8,0,50]].forEach(([b,x,y])=>{if(m&b)l+='<line x1=50 y1=50 x2='+x+' y2='+y+' />';});
   return '<svg viewBox="0 0 100 100" width="100%" height="100%" style="display:block'+(lit?';filter:drop-shadow(0 0 5px #fd2)':'')+'"><g stroke="'+col+'" stroke-width="20" fill="'+col+'">'+l+'<circle cx="50" cy="50" r="10" stroke="none"/></g></svg>';};
  const CS='clamp(54px,16vw,72px)';
  box.innerHTML='<div style="font-size:17px;line-height:1.55">⚡ <b>🔋 건전지</b>에서 <b>💡 전구</b>까지 전선을 이어 주세요!</div>'
   +'<div style="font-size:14px;color:#8fd;margin:4px 0 8px;line-height:1.5">① 칸을 <b>누르면 전선이 빙글 돌아가요</b> (👆 시계 방향)<br>② 전기가 닿은 전선은 <b style="color:#ffe14d">노란색</b>으로 빛나요<br>③ 노란색이 💡 전구까지 가면 성공!<br>④ 길과 상관없는 <b>가짜 전선</b>도 섞여 있어요. 🔋에서 이어지는 길만 보세요!</div>'
   +'<div style="display:flex;justify-content:center;align-items:stretch;gap:4px"><div style="display:flex;align-items:flex-start;font-size:30px;padding-top:calc('+CS+'/2 - 18px)">🔋</div>'
   +'<div id=hbCk style="display:grid;grid-template-columns:repeat(4,'+CS+');grid-auto-rows:'+CS+';border:2px solid #0a8;border-radius:8px;overflow:hidden;background:#021a14">'+[0,1,2,3].flatMap(r=>[0,1,2,3].map(c=>'<button data-k='+r+','+c+' style="padding:0;margin:0;border:1px solid #0a4a44;border-radius:0;background:'+(cur[r+','+c]!=null?'#0b2f3c':'#020d0b')+';min-height:0"></button>')).join('')+'</div>'
   +'<div id=hbCb2 style="display:flex;align-items:flex-end;font-size:30px;padding-bottom:calc('+CS+'/2 - 18px);filter:grayscale(1) brightness(.7);transition:filter .3s">💡</div></div>'
   +'<div id=hbCs style="text-align:center;font-size:16px;margin-top:8px;min-height:1.6em"></div>';
  const bs=[...box.querySelectorAll('#hbCk button')];let done=false;
  const dr=()=>{const t=trace(),L=new Set(t.lit);bs.forEach(b=>{const k=b.dataset.k;b.innerHTML=cur[k]!=null?wire(cur[k],L.has(k)):'<span style="opacity:.25;font-size:12px">빈칸</span>';});
   const st=box.querySelector('#hbCs'),bu=box.querySelector('#hbCb2');
   if(t.win){done=true;bu.style.filter='drop-shadow(0 0 14px #ffe14d) brightness(1.3)';st.innerHTML='<b style="color:#ffe14d;font-size:20px">🎉 전구에 불이 켜졌어요!</b>';setTimeout(ok,900);}
   else st.innerHTML=t.lit.length?'⚡ 전기가 <b style="color:#ffe14d">'+t.lit.length+'칸</b>까지 왔어요! 계속 이어 보세요':'🔌 건전지 옆 첫 칸부터 돌려서 이어 보세요';};
  bs.forEach(b=>b.onclick=()=>{const k=b.dataset.k;if(done||cur[k]==null)return;cur[k]=rot(cur[k]);dr();});dr();}},
 virus:{n:'디지털 바이러스 제거',f(box,ok){const G=16,NEED=5;let sc=0,at=-1,t0=now(),tk=0,done=false;
  let sp='';for(let k=0;k<8;k++){const a=k*Math.PI/4,c=Math.cos(a),n=Math.sin(a);sp+='<line x1='+(50+27*c).toFixed(1)+' y1='+(50+27*n).toFixed(1)+' x2='+(50+36*c).toFixed(1)+' y2='+(50+36*n).toFixed(1)+' /><circle cx='+(50+38*c).toFixed(1)+' cy='+(50+38*n).toFixed(1)+' r=6 />';}
  /* 화난 얼굴의 초록 바이러스 (그림이라 어떤 기기에서도 똑같이 보여요) */
  const VIR='<svg class=vir viewBox="0 0 100 100"><g fill="#4be05f" stroke="#0b5a1f" stroke-width="4" stroke-linecap="round">'+sp+'<circle cx=50 cy=50 r=27 /></g><g stroke="#0b5a1f" stroke-width="3.5" stroke-linecap="round" fill="none"><path d="M33 36 L45 42"/><path d="M67 36 L55 42"/><path d="M39 64 Q50 56 61 64"/></g><circle cx=41 cy=49 r=7 fill="#fff"/><circle cx=59 cy=49 r=7 fill="#fff"/><circle cx=42 cy=50 r=3.5 fill="#111"/><circle cx=58 cy=50 r=3.5 fill="#111"/></svg>';
  box.innerHTML='<div style="font-size:17px;line-height:1.55">🧼 <b style="color:#6f6">초록 바이러스</b>가 나타나면 <b>콕! 눌러서</b> 없애요!</div>'
   +'<div style="font-size:14px;color:#8fd;margin:2px 0 6px">바이러스가 없는 칸을 누르면 점수가 1점 줄어요 · 5마리를 잡으면 성공!</div>'
   +'<div id=hbVp style="display:flex;justify-content:center;gap:8px;margin:6px 0"></div>'
   +'<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#8fd">⏱ 남은 시간<span style="flex:1;height:10px;background:#0a2a2a;border:1px solid #0a8;border-radius:6px;overflow:hidden"><i id=hbVt style="display:block;height:100%;width:100%;background:#4f8"></i></span></div>'
   +'<div class=mg style="grid-template-columns:repeat(4,1fr);gap:6px;max-width:340px">'+Array.from({length:G},(_,i)=>'<button data-i='+i+'></button>').join('')+'</div>'
   +'<div id=hbVm style="text-align:center;font-size:17px;min-height:1.8em"></div>';
  const bs=[...box.querySelectorAll('.mg button')],q=id=>box.querySelector(id);
  const base=b=>{b.style.cssText='padding:3px;aspect-ratio:1/1;min-height:0;background:radial-gradient(circle,#0e3b3b,#041a1a);border:2px solid #0a6;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-direction:column;line-height:1.1';b.innerHTML='';};
  bs.forEach(base);
  const dots=()=>{q('#hbVp').innerHTML=Array.from({length:NEED},(_,i)=>'<span style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;'+(i<sc?'background:#2fc65a;color:#fff;border:2px solid #9fffb4;box-shadow:0 0 8px #3f8':'background:#0a2a2a;color:#4a7;border:2px dashed #3a7')+'">'+(i<sc?'✓':'')+'</span>').join('')+'<b style="align-self:center;margin-left:6px;font-size:18px">'+sc+' / '+NEED+'</b>';};
  const msg=(h,c)=>{const m=q('#hbVm');if(m){m.innerHTML=h;m.style.color=c||'#cfe';}};
  const show=()=>{bs.forEach(b=>{if(!b._f)base(b);});let n;do{n=rr(G);}while(n===at);at=n;const b=bs[at];b._f=0;base(b);b.innerHTML=VIR;b.style.borderColor='#ffe14d';b.style.boxShadow='0 0 14px #ffe14d99';};
  const flash=(b,h,bg,ms)=>{base(b);b._f=1;b.style.background=bg;b.innerHTML=h;setTimeout(()=>{if(b._f){b._f=0;base(b);}},ms);};
  bs.forEach((b,i)=>b.onclick=()=>{if(done)return;
   if(i===at){sc++;dots();flash(b,'<span style="font-size:36px">💥</span><b style="color:#ffe14d;font-size:16px">퍽!</b>','radial-gradient(circle,#7a5a00,#2a1a00)',380);
    if(sc>=NEED){done=true;clearInterval(tm);msg('🎉 바이러스를 모두 없앴어요!','#6f6');setTimeout(ok,650);return;}
    msg('💥 잡았다! 계속 잡아요!','#ffe14d');show();}
   else{sc=Math.max(0,sc-1);dots();b.classList.add('shk');flash(b,'<span style="font-size:32px">❌</span><b style="color:#f88;font-size:15px">앗!</b>','#4a1010',450);msg('앗! 바이러스가 있는 칸을 눌러요 (-1점)','#f88');}});
  const tm=setInterval(()=>{if(!document.body.contains(box)){clearInterval(tm);return;}if(done)return;tk++;
   const el=now()-t0,left=Math.max(0,1-el/20000),bar=q('#hbVt');if(bar){bar.style.width=(left*100)+'%';bar.style.background=left<.25?'#f55':'#4f8';}
   if(el>20000){t0=now();sc=0;dots();msg('⏰ 시간이 지났어요! 처음부터 다시!','#fd6');}
   if(tk%9===0)show();},100);
  dots();msg('👆 눈에 불을 켠 초록 바이러스를 찾아요!');show();}},
 reaction:{n:'반응 속도 테스트',f(box,ok){const SY=[['빨강','#e53935','#fff'],['초록','#2ea043','#fff'],['파랑','#1e6fe0','#fff'],['노랑','#f6c90e','#222'],['보라','#8e44ad','#fff'],['하양','#f4f4f4','#222'],['주황','#fb8c00','#222'],['분홍','#ff7ab0','#222']],NEED=5,EVERY=14;
  let sc=0,tg=pk(SY),lay=[],tk=0,done=false;
  box.innerHTML='<div style="font-size:17px;line-height:1.55">👀 <b>이 색깔</b>의 버튼을 빨리 눌러요!</div>'
   +'<div style="font-size:14px;color:#8fd;margin:2px 0 6px">버튼 색깔이 계속 바뀌어요 · 다른 색을 누르면 -1점 · 5번 맞히면 성공!</div>'
   +'<div id=hbRt style="display:flex;align-items:center;justify-content:center;gap:12px;margin:6px auto;padding:8px 14px;max-width:300px;border:2px dashed #fd6;border-radius:14px;background:#10201f"><span style="font-size:15px;color:#fd6">누를 색 ▶</span><span id=hbRc style="width:58px;height:58px;border-radius:50%;border:4px solid #fff;box-shadow:0 0 12px #fff8"></span><b id=hbRn style="font-size:28px"></b></div>'
   +'<div id=hbRp style="display:flex;justify-content:center;gap:8px;margin:6px 0"></div>'
   +'<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#8fd">🔀 색이 바뀌기까지<span style="flex:1;height:10px;background:#0a2a2a;border:1px solid #0a8;border-radius:6px;overflow:hidden"><i id=hbRb style="display:block;height:100%;width:100%;background:#4af"></i></span></div>'
   +'<div class=mg style="grid-template-columns:repeat(4,1fr);gap:6px;max-width:340px">'+SY.map((_,i)=>'<button data-i='+i+'></button>').join('')+'</div>'
   +'<div id=hbRm style="text-align:center;font-size:17px;min-height:1.8em"></div>';
  const bs=[...box.querySelectorAll('.mg button')],q=id=>box.querySelector(id);
  const msg=(h,c)=>{const m=q('#hbRm');if(m){m.innerHTML=h;m.style.color=c||'#cfe';}};
  const dots=()=>{q('#hbRp').innerHTML=Array.from({length:NEED},(_,i)=>'<span style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;'+(i<sc?'background:#2fc65a;color:#fff;border:2px solid #9fffb4;box-shadow:0 0 8px #3f8':'background:#0a2a2a;color:#4a7;border:2px dashed #3a7')+'">'+(i<sc?'✓':'')+'</span>').join('')+'<b style="align-self:center;margin-left:6px;font-size:18px">'+sc+' / '+NEED+'</b>';};
  const paintT=()=>{const c=q('#hbRc'),n=q('#hbRn');if(c)c.style.background=tg[1];if(n){n.textContent=tg[0];n.style.color=tg[1]==='#f4f4f4'?'#fff':tg[1]==='#8e44ad'?'#d9a6ff':tg[1]==='#1e6fe0'?'#7db4ff':tg[1];n.style.textShadow='0 0 6px #000';}};
  const shuf=(chg)=>{lay=[...SY].sort(()=>Math.random()-.5);bs.forEach((b,i)=>{const c=lay[i];b.className='';b.style.cssText='min-height:76px;border-radius:16px;border:3px solid #fff;background:'+c[1]+';color:'+c[2]+';font-size:18px;font-weight:bold;padding:0;box-shadow:0 3px 0 #0006;text-shadow:'+(c[2]==='#fff'?'0 1px 2px #0008':'none');b.textContent=c[0];});
   if(chg){const old=tg;do{tg=pk(SY);}while(tg===old);if(tg!==old)msg('🔔 새 신호! <b>'+tg[0]+'</b>'+jo(tg[0],'을','를')+' 눌러요','#fd6');}paintT();tk=0;};
  bs.forEach((b,i)=>b.onclick=()=>{if(done)return;
   if(lay[i]===tg){sc++;dots();if(sc>=NEED){done=true;clearInterval(tm);msg('🎉 반응이 정말 빨라요!','#6f6');setTimeout(ok,650);return;}msg('⭕ 좋아요! 다음 신호!','#6f6');shuf(Math.random()<.7);}
   else{sc=Math.max(0,sc-1);dots();b.classList.add('shk');b.style.outline='4px solid #f33';setTimeout(()=>{b.style.outline='';},400);msg('❌ 앗! <b>'+tg[0]+'</b> 버튼을 눌러요 (-1점)','#f88');}});
  const tm=setInterval(()=>{if(!document.body.contains(box)){clearInterval(tm);return;}if(done)return;tk++;const bar=q('#hbRb');if(bar)bar.style.width=Math.max(0,100-tk/EVERY*100)+'%';if(tk>=EVERY)shuf(Math.random()<.7);},100);
  dots();shuf(false);msg('👆 위에 나온 색깔과 같은 버튼을 눌러요!');}},
 laser:{n:'레이저 보안망 탈출',f(box,ok){
  /* 난이도는 원본 그대로: 5x7 칸 · 레이저 3줄(1·3·5번째 줄) · 0.7초 켜짐/0.7초 꺼짐 · 150ms마다 판정 · 시작(2,6) → 맨 위 도착.
     바뀐 것은 줄마다 켜지는 타이밍(o)뿐이에요. 8가지 모두 평균 통과 시간이 원본과 거의 같게(±4%) 맞춰 뒀고, 할 때마다 랜덤(직전과 같은 패턴은 피함)으로 나와요.
     c = 레이저 색(r,g,b) */
  const W=5,Hh=7,LR=[1,3,5],PAT=[
   {n:'순차 스캔',o:[0,500,1000],c:'255,59,78'},
   {n:'더블 펄스',o:[0,200,700],c:'255,92,214'},
   {n:'물결',o:[0,300,600],c:'255,154,46'},
   {n:'엇박 점멸',o:[0,400,1000],c:'176,110,255'},
   {n:'추격',o:[0,300,900],c:'255,225,60'},
   {n:'쌍둥이 점멸',o:[0,100,600],c:'90,200,255'},
   {n:'빠른 물결',o:[0,200,500],c:'190,255,80'},
   {n:'느린 추격',o:[0,500,700],c:'255,140,140'}];
  const L=MINI.laser;let pi=rr(PAT.length);if(pi===L._last)pi=(pi+1+rr(PAT.length-1))%PAT.length;L._last=pi;
  const P=PAT[pi],OF=P.o;let x=2,y=6,hits=0,done=false;
  if(!document.getElementById('hbLzCss')){const s=document.createElement('style');s.id='hbLzCss';s.textContent=[
   '.lz{--ch:36px;font-family:var(--mono,monospace);color:#cfe;max-width:340px;margin:4px auto 2px;user-select:none;-webkit-user-select:none}',
   '.lz .lzTop{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:13px;margin:6px 0 5px}',
   '.lz .lzTag{padding:1px 8px;border:1px solid var(--ac);border-radius:4px;color:var(--ac);background:rgba(var(--rgb),.1);text-shadow:0 0 6px var(--ac);box-shadow:0 0 8px rgba(var(--rgb),.45)}',
   '.lz .lzZ{color:#9ab;font-size:13px}',
   '.lz .lzMsg{font-size:14px;line-height:1.45;color:#bfe}',
   '.lz .lzBd{position:relative;border:2px solid #0a8;border-radius:10px;background:linear-gradient(#03130f,#020b0a);box-shadow:inset 0 0 24px rgba(0,170,130,.3),0 0 14px rgba(0,170,130,.35);overflow:hidden}',
   '.lz .lzBd:before{content:"";position:absolute;left:0;right:0;top:0;bottom:0;background:repeating-linear-gradient(0deg,rgba(0,255,170,.05) 0 1px,transparent 1px 3px);pointer-events:none;z-index:4}',
   '.lz .lzR{position:relative;display:grid;grid-template-columns:18px repeat(5,1fr) 18px;height:var(--ch)}',
   '.lz .lzC{border:1px solid rgba(0,255,170,.1);background:rgba(0,255,170,.035)}',
   '.lz .sf .lzC{background:rgba(0,255,170,.075)}',
   '.lz .st .lzC{background:rgba(90,200,255,.12);border-color:rgba(90,200,255,.22)}',
   '.lz .gl .lzC{background:linear-gradient(rgba(70,255,150,.34),rgba(70,255,150,.1));border-color:rgba(120,255,170,.4)}',
   '.lz .lzLb{position:absolute;left:18px;right:18px;top:0;bottom:0;display:flex;align-items:center;justify-content:center;font-size:12px;letter-spacing:3px;pointer-events:none;z-index:1}',
   '.lz .st .lzLb{color:#7cf;justify-content:flex-start;padding-left:6px;font-size:11px;letter-spacing:2px}.lz .gl .lzLb{color:#c8ffd8;text-shadow:0 0 8px #3f8}',
   '.lz .ln .lzC{background:rgba(var(--rgb),.05);border-color:rgba(var(--rgb),.12)}',
   '.lz .ln .lzE{position:relative}',
   '.lz .ln .lzE:before{content:"";position:absolute;left:3px;right:3px;top:5px;bottom:5px;border-radius:5px;background:linear-gradient(#35232b,#1a1015);border:1px solid #6b3d4d}',
   '.lz .ln .lzE:after{content:"";position:absolute;left:50%;top:50%;width:7px;height:7px;margin:-3.5px 0 0 -3.5px;border-radius:50%;background:#5a2a34}',
   '.lz .lzBm{position:absolute;left:14px;right:14px;top:50%;height:2px;margin-top:-1px;background:repeating-linear-gradient(90deg,rgba(var(--rgb),.4) 0 6px,transparent 6px 12px)}',
   '.lz .ln.on .lzC{background:rgba(var(--rgb),.26);border-color:rgba(var(--rgb),.55)}',
   '.lz .ln.on .lzE:after{background:var(--ac);box-shadow:0 0 8px 2px var(--ac)}',
   '.lz .ln.on .lzE:before{border-color:var(--ac)}',
   '.lz .ln.on .lzBm{height:4px;margin-top:-2px;border-radius:2px;background:linear-gradient(90deg,transparent,#fff 6%,#fff 94%,transparent);box-shadow:0 0 6px 2px var(--ac),0 0 18px 6px rgba(var(--rgb),.65);animation:lzfk .12s infinite alternate}',
   '@keyframes lzfk{from{opacity:.8}to{opacity:1}}',
   '.lz .lzPl{position:absolute;left:18px;right:18px;top:0;bottom:0;pointer-events:none;z-index:3}',
   '.lz .lzP{position:absolute;left:0;top:0;width:20%;height:var(--ch);display:flex;align-items:center;justify-content:center;transform:translate(calc(var(--x)*100%),calc(var(--y)*100%));transition:transform .09s ease-out}',
   '.lz .lzP i{width:20px;height:20px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f2fff6,#3f8 45%,#0a6);box-shadow:0 0 0 3px rgba(60,255,140,.25),0 0 14px #3f8;animation:lzpl 1.2s ease-in-out infinite}',
   '@keyframes lzpl{50%{box-shadow:0 0 0 5px rgba(60,255,140,.12),0 0 20px #3f8}}',
   '.lz .lzFl{position:absolute;left:0;right:0;top:0;bottom:0;background:rgba(var(--rgb),.55);opacity:0;pointer-events:none;z-index:5}',
   '.lz .lzBd.zap{animation:lzsk .35s}.lz .lzBd.zap .lzFl{animation:lzfl .35s}',
   '@keyframes lzsk{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}',
   '@keyframes lzfl{from{opacity:1}to{opacity:0}}',
   '.lz .lzBd.win{border-color:#8fb;box-shadow:inset 0 0 30px rgba(90,255,160,.5),0 0 22px #3f8}',
   '.lz .lzPad{display:grid;grid-template-columns:repeat(3,64px);grid-template-rows:repeat(2,44px);gap:6px;justify-content:center;margin-top:8px}',
   '.lz .lzPad button{touch-action:manipulation;margin:0;padding:0;min-height:0;border:1px solid #3ff;border-radius:8px;background:rgba(0,40,40,.6);color:#3ff;font-size:18px!important;cursor:pointer;box-shadow:0 0 8px rgba(0,170,170,.5)}',
   '.lz .lzPad button:active{background:#0a6;color:#fff}',
   '.lz .lzPad [data-d=u]{grid-column:2;grid-row:1}.lz .lzPad [data-d=l]{grid-column:1;grid-row:2}.lz .lzPad [data-d=d]{grid-column:2;grid-row:2}.lz .lzPad [data-d=r]{grid-column:3;grid-row:2}',
   '@media (prefers-reduced-motion:reduce){.lz .lzBm,.lz .lzP i,.lz .lzBd.zap{animation:none!important}.lz .lzP{transition:none}}'
  ].join('\n');document.head.appendChild(s);}
  let rows='';for(let r=0;r<Hh;r++){const ln=LR.includes(r);rows+='<div class="lzR '+(ln?'ln':r===0?'gl':r===Hh-1?'st':'sf')+'"><div class=lzE></div>'+'<i class=lzC></i>'.repeat(W)+'<div class=lzE></div>'+(ln?'<b class=lzBm></b>':'')+(r===0?'<span class=lzLb>▲ EXIT ▲</span>':r===Hh-1?'<span class=lzLb>START</span>':'')+'</div>';}
  box.innerHTML='<div class=lz style="--rgb:'+P.c+';--ac:rgb('+P.c+')">'
   +'<div class=lzMsg>🟢 초록 점을 맨 위 <b>EXIT</b>까지 이동! 켜진 <b style="color:var(--ac)">레이저</b>에 닿으면 처음으로 돌아가요</div>'
   +'<div class=lzTop><span class=lzTag>패턴 '+(pi+1)+'/'+PAT.length+' · '+P.n+'</span><span class=lzZ>⚡ 감전 0회</span></div>'
   +'<div class=lzBd>'+rows+'<div class=lzPl><div class=lzP><i></i></div></div><div class=lzFl></div></div>'
   +'<div class=lzPad><button data-d=u aria-label=위>▲</button><button data-d=l aria-label=왼쪽>◀</button><button data-d=d aria-label=아래>▼</button><button data-d=r aria-label=오른쪽>▶</button></div></div>';
  const bd=box.querySelector('.lzBd'),rowEl=[...box.querySelectorAll('.lzR')],pl=box.querySelector('.lzP'),zc=box.querySelector('.lzZ');
  const on=(r,t)=>{const i=LR.indexOf(r);return i>=0&&Math.floor((t+OF[i])/700)%2===0;};
  const dr=()=>{const t=now();LR.forEach(r=>rowEl[r].classList.toggle('on',on(r,t)));
   if(LR.includes(y)&&on(y,t)){x=2;y=6;hits++;zc.textContent='⚡ 감전 '+hits+'회';bd.classList.remove('zap');void bd.offsetWidth;bd.classList.add('zap');try{sfx('wrong');}catch(e){}}
   pl.style.setProperty('--x',x);pl.style.setProperty('--y',y);};
  const kd=e=>{const m={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r'}[e.key];if(m){e.preventDefault();mv(m);}};
  const tm=setInterval(()=>{if(!document.body.contains(box)){clearInterval(tm);document.removeEventListener('keydown',kd);return;}dr();},150);
  const mv=d=>{if(done)return;if(d==='u')y=Math.max(0,y-1);if(d==='d')y=Math.min(Hh-1,y+1);if(d==='l')x=Math.max(0,x-1);if(d==='r')x=Math.min(W-1,x+1);dr();
   if(y===0){done=true;clearInterval(tm);document.removeEventListener('keydown',kd);bd.classList.add('win');box.querySelector('.lzMsg').innerHTML='<b style="color:#8fb">🎉 탈출 성공! 보안망을 뚫었어요</b>';setTimeout(ok,450);}};
  document.addEventListener('keydown',kd);
  box.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>mv(b.dataset.d));
  dr();}},
 odd:{n:'가짜 파일 찾기',f(box,ok){
  /* 규칙: 똑같아 보이는 파일 중 '다른 것 1개'를 찾아 누르세요. 3라운드(3×3 → 4×4 → 5×5)를 모두 찾으면 성공! 틀리면 0.6초 쉬어요. */
  const LV=[{g:3,fs:34,p:[['🍎','🍏'],['🐶','🐱'],['🌞','🌙'],['🚗','🚌'],['🐸','🐵']]},
   {g:4,fs:28,p:[['😀','😃'],['🌕','🌖'],['🔴','🟠'],['🐻','🐼'],['🍊','🍋']]},
   {g:5,fs:24,p:[['b','d'],['6','9'],['ㅂ','ㅁ'],['O','Q'],['E','F'],['ㄹ','ㄷ']]}];
  if(!document.getElementById('hbOdCss')){const st=document.createElement('style');st.id='hbOdCss';st.textContent=[
   '.od{font-family:var(--mono,monospace);color:#cfe;max-width:340px;margin:4px auto 2px;user-select:none;-webkit-user-select:none}',
   '.od .odMsg{font-size:14px;line-height:1.45;color:#bfe}',
   '.od .odGr{display:grid;gap:6px;margin:8px 0;padding:8px;border:2px solid #0a8;border-radius:10px;background:linear-gradient(#03130f,#020b0a);box-shadow:inset 0 0 22px rgba(0,170,130,.3),0 0 12px rgba(0,170,130,.3)}',
   '.od .odGr.win{border-color:#8fb;box-shadow:inset 0 0 30px rgba(90,255,160,.5),0 0 22px #3f8}',
   '.od .odC{display:flex;align-items:center;justify-content:center;height:52px;border:1px solid #0a6;border-radius:8px;background:rgba(0,255,200,.06);font-size:var(--fs,28px);line-height:1;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}',
   '.od .odC:active{filter:brightness(1.5)}',
   '.od .odC.ok{border-color:#8fb;background:rgba(80,255,150,.25);box-shadow:0 0 14px #3f8;animation:odok .4s ease-out}',
   '.od .odC.bad{border-color:#f55;background:rgba(255,80,80,.22);animation:odbad .3s}',
   '@keyframes odok{50%{transform:scale(1.18)}}@keyframes odbad{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}',
   '.od .odBar{display:flex;gap:6px;justify-content:center;font-size:13px;color:#9ab}',
   '.od .odBar i{width:34px;height:8px;border-radius:4px;background:#0a2a24;box-shadow:inset 0 0 0 1px #0a6}',
   '.od .odBar i.on{background:linear-gradient(90deg,#3f8,#ff9)}',
   '@media (prefers-reduced-motion:reduce){.od .odC.ok,.od .odC.bad{animation:none}}'].join('\n');document.head.appendChild(st);}
  let r=0,lock=0,done=false;
  const draw=()=>{if(!document.body.contains(box))return;const lv=LV[r],n=lv.g*lv.g,pr=pk(lv.p),sw=Math.random()<.5,a=sw?pr[1]:pr[0],b=sw?pr[0]:pr[1],odd=rr(n);
   box.innerHTML='<div class=od><div class=odMsg>🗂 <b>다른 파일 1개</b>를 찾아 누르세요! ('+(r+1)+'/3)</div><div class=odGr style="grid-template-columns:repeat('+lv.g+',1fr);--fs:'+lv.fs+'px">'
    +Array.from({length:n},(_,i)=>'<div class=odC role=button data-i='+i+'>'+(i===odd?b:a)+'</div>').join('')+'</div><div class=odBar>'+[0,1,2].map(i=>'<i'+(i<r?' class=on':'')+'></i>').join('')+'</div></div>';
   const gr=box.querySelector('.odGr');
   box.querySelectorAll('.odC').forEach(c=>c.onclick=()=>{if(lock||done)return;
    if(+c.dataset.i===odd){c.classList.add('ok');lock=1;r++;
     if(r>=3){done=true;gr.classList.add('win');box.querySelector('.odMsg').innerHTML='<b style="color:#8fb">🎉 가짜 파일을 모두 찾았어요!</b>';setTimeout(ok,650);}
     else setTimeout(()=>{lock=0;draw();},450);}
    else{c.classList.add('bad');lock=1;setTimeout(()=>{lock=0;c.classList.remove('bad');},600);}});};
  draw();}},
 simon:{n:'보안 코드 따라 하기',f(box,ok){
  /* 규칙: 4색 패드가 깜빡이는 순서를 보고 그대로 누르세요. 2개 → 3개 → 4개 → 5개로 늘어나요. 틀리면 같은 순서를 다시 보여줘요. */
  const COL=[['255,70,90','▲'],['70,220,130','●'],['70,160,255','■'],['255,215,70','◆']],LEN=5;
  if(!document.getElementById('hbSmCss')){const st=document.createElement('style');st.id='hbSmCss';st.textContent=[
   '.sm{font-family:var(--mono,monospace);color:#cfe;max-width:340px;margin:4px auto 2px;user-select:none;-webkit-user-select:none}',
   '.sm .smMsg{font-size:14px;line-height:1.45;color:#bfe;min-height:21px}',
   '.sm .smGr{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0 8px;padding:10px;border:2px solid #0a8;border-radius:12px;background:linear-gradient(#03130f,#020b0a);box-shadow:inset 0 0 24px rgba(0,170,130,.3),0 0 14px rgba(0,170,130,.35)}',
   '.sm .smGr.win{border-color:#8fb;box-shadow:inset 0 0 30px rgba(90,255,160,.5),0 0 22px #3f8}',
   '.sm .smP{display:flex;align-items:center;justify-content:center;height:78px;border-radius:12px;border:2px solid rgba(var(--k),.75);background:rgba(var(--k),.16);color:rgba(var(--k),1);font-size:30px;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:filter .1s,box-shadow .1s,background .1s}',
   '.sm .smP.on{background:rgba(var(--k),.95);color:#fff;box-shadow:0 0 26px rgba(var(--k),1),inset 0 0 18px rgba(255,255,255,.45);filter:brightness(1.25)}',
   '.sm .smGr.bad{animation:smbad .35s}@keyframes smbad{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}',
   '.sm .smBar{display:flex;gap:6px;justify-content:center;font-size:13px;color:#9ab;align-items:center}',
   '.sm .smBar i{width:26px;height:8px;border-radius:4px;background:#0a2a24;box-shadow:inset 0 0 0 1px #0a6}',
   '.sm .smBar i.on{background:linear-gradient(90deg,#3f8,#ff9)}',
   '@media (prefers-reduced-motion:reduce){.sm .smGr.bad{animation:none}}'].join('\n');document.head.appendChild(st);}
  const seq=[];for(let i=0;i<LEN;i++){let v;do{v=rr(4);}while(i>=2&&seq[i-1]===v&&seq[i-2]===v);seq.push(v);}
  box.innerHTML='<div class=sm><div class=smMsg></div><div class=smGr>'+COL.map((c,i)=>'<div class=smP role=button data-i='+i+' style="--k:'+c[0]+'">'+c[1]+'</div>').join('')+'</div><div class=smBar><span>코드 길이</span>'+[2,3,4,5].map(n=>'<i data-n='+n+'></i>').join('')+'</div></div>';
  const ps=[...box.querySelectorAll('.smP')],gr=box.querySelector('.smGr'),mg=box.querySelector('.smMsg'),dots=[...box.querySelectorAll('.smBar i')];
  let round=2,pos=0,tok=0,accept=false,done=false;
  const alive=()=>document.body.contains(box)&&!done;
  const msg=h=>{mg.innerHTML=h;};const bar=()=>dots.forEach(d=>d.classList.toggle('on',+d.dataset.n<round||(+d.dataset.n===round&&pos>=round)));
  const lit=(i,ms)=>{ps[i].classList.add('on');try{sfx('tap');}catch(e){}setTimeout(()=>ps[i].classList.remove('on'),ms);};
  const play=()=>{if(!alive())return;const my=++tok;accept=false;pos=0;bar();msg('👀 깜빡이는 순서를 <b>잘 보세요</b> ('+round+'개)');let k=0;
   const step=()=>{if(my!==tok||!alive())return;if(k>=round){accept=true;msg('👆 같은 순서로 <b>눌러 보세요</b> (0/'+round+')');return;}lit(seq[k],360);k++;setTimeout(step,640);};setTimeout(step,600);};
  ps.forEach((p,i)=>p.onclick=()=>{if(!accept||done)return;lit(i,200);
   if(i===seq[pos]){pos++;msg('👆 같은 순서로 <b>눌러 보세요</b> ('+pos+'/'+round+')');
    if(pos>=round){accept=false;bar();
     if(round>=LEN){done=true;gr.classList.add('win');msg('<b style="color:#8fb">🎉 보안 코드를 해독했어요!</b>');setTimeout(ok,650);}
     else{round++;msg('✅ 좋아요! 한 개 더 늘어나요');setTimeout(play,900);}}}
   else{accept=false;gr.classList.remove('bad');void gr.offsetWidth;gr.classList.add('bad');msg('❌ 틀렸어요! 같은 순서를 다시 보여줄게요');setTimeout(play,1000);}});
  play();}},
 stack:{n:'서버 랙 쌓기',f(box,ok){
  /* 규칙: 좌우로 움직이는 서버 랙을 타이밍 맞춰 '고정!'으로 멈춰 5층을 쌓아요. 겹친 만큼만 남고, 거의 정확하면 퍼펙트(안 줄어요)! 완전히 빗나가면 처음부터 다시 쌓아요. */
  const SW=300,BH=28,NEED=5,MINW=18,SNAP=8,BASEW=150;
  if(!document.getElementById('hbSkCss')){const st=document.createElement('style');st.id='hbSkCss';st.textContent=[
   '.sk{font-family:var(--mono,monospace);color:#cfe;max-width:340px;margin:4px auto 2px;user-select:none;-webkit-user-select:none;text-align:center}',
   '.sk .skMsg{font-size:14px;line-height:1.45;color:#bfe;min-height:21px;text-align:left}',
   '.sk .skSt{position:relative;width:300px;max-width:100%;height:'+(BH*(NEED+2))+'px;margin:8px auto;border:2px solid #0a8;border-radius:10px;overflow:hidden;background:repeating-linear-gradient(0deg,rgba(0,255,200,.05) 0 1px,transparent 1px '+BH+'px),linear-gradient(#03130f,#020b0a);box-shadow:inset 0 0 22px rgba(0,170,130,.3),0 0 12px rgba(0,170,130,.3);touch-action:manipulation}',
   '.sk .skSt.win{border-color:#8fb;box-shadow:inset 0 0 30px rgba(90,255,160,.5),0 0 22px #3f8}',
   '.sk .skSt.bad{border-color:#f55;box-shadow:inset 0 0 26px rgba(255,80,80,.45),0 0 18px #f55}',
   '.sk .skB{position:absolute;height:'+(BH-3)+'px;border-radius:5px;border:1px solid rgba(255,255,255,.35);box-shadow:0 0 8px rgba(0,255,200,.35),inset 0 0 8px rgba(255,255,255,.25)}',
   '.sk .skB.mv{box-shadow:0 0 14px #fff6,inset 0 0 10px rgba(255,255,255,.4)}',
   '.sk .skCut{position:absolute;height:'+(BH-3)+'px;border-radius:5px;opacity:.9;transition:transform .7s ease-in,opacity .7s}',
   '.sk .skBtn{display:block;width:300px;max-width:100%;margin:6px auto 2px;padding:14px 0;border:2px solid #3f8;border-radius:10px;background:#062a3a;color:#3f8;font-size:22px;font-weight:700;box-shadow:0 0 10px #3f86;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}',
   '.sk .skBtn:active{filter:brightness(1.5);transform:scale(.98)}',
   '.sk .skBar{font-size:13px;color:#9ab}',
   '@media (prefers-reduced-motion:reduce){.sk .skCut{transition:none}}'].join('\n');document.head.appendChild(st);}
  box.innerHTML='<div class=sk><div class=skMsg></div><div class=skSt></div><div class="skBtn" role=button>⏹ 고정!</div><div class=skBar></div></div>';
  const stg=box.querySelector('.skSt'),mg=box.querySelector('.skMsg'),btn=box.querySelector('.skBtn'),bar=box.querySelector('.skBar');
  const hue=i=>'hsl('+(170+i*28)+',75%,45%)';
  let L,cur,t0,spd,done=false,hold=0,perf=0;
  const alive=()=>document.body.contains(box);
  const msg=h=>{mg.innerHTML=h;};
  const place=(i,x,w,cls)=>{const d=document.createElement('div');d.className='skB'+(cls?' '+cls:'');d.style.cssText='left:'+x+'px;width:'+w+'px;bottom:'+(i*BH+1)+'px;background:'+hue(i);stg.appendChild(d);return d;};
  const reset=()=>{stg.querySelectorAll('.skB,.skCut').forEach(e=>e.remove());stg.classList.remove('bad');L=[{x:(SW-BASEW)/2,w:BASEW}];place(0,L[0].x,L[0].w);start();};
  const start=()=>{const top=L[L.length-1];spd=170+L.length*22;t0=performance.now()-rr(900);cur=place(L.length,0,top.w,'mv');hold=0;
   msg('🧱 서버 랙을 <b>맞춰서 고정!</b> ('+(L.length-1)+'/'+NEED+'층)');bar.textContent=perf?'✨ 퍼펙트 '+perf+'번':'';};
  const px=()=>{const top=L[L.length-1],R=SW-top.w,p=((performance.now()-t0)/1000*spd)%(2*R);return p<R?p:2*R-p;};
  const frame=()=>{if(!alive()||done)return;if(cur&&!hold)cur.style.left=px()+'px';requestAnimationFrame(frame);};
  const fix=e=>{if(e&&e.preventDefault)e.preventDefault();if(done||hold||!cur)return;hold=1;
   const top=L[L.length-1],x=px(),d=x-top.x,w=top.w;try{sfx('tap');}catch(er){}
   let nx,nw,isP=Math.abs(d)<=SNAP;
   if(isP){nx=top.x;nw=top.w;perf++;}
   else{nx=Math.max(x,top.x);nw=Math.min(x+w,top.x+top.w)-nx;}
   if(nw<MINW){cur.style.left=x+'px';cur.style.opacity='.5';stg.classList.add('bad');msg('💥 <b>균형이 무너졌어요!</b> 처음부터 다시 쌓아요');perf=0;
    setTimeout(()=>{if(alive()&&!done)reset();},950);return;}
   cur.style.left=nx+'px';cur.style.width=nw+'px';cur.classList.remove('mv');
   if(!isP){const cw=w-nw,cx=x<top.x?x:x+nw,cut=document.createElement('div');cut.className='skCut';cut.style.cssText='left:'+cx+'px;width:'+cw+'px;bottom:'+(L.length*BH+1)+'px;background:'+hue(L.length);stg.appendChild(cut);requestAnimationFrame(()=>{cut.style.transform='translateY('+(BH*3)+'px)';cut.style.opacity='0';});setTimeout(()=>cut.remove(),800);}
   L.push({x:nx,w:nw});
   if(L.length-1>=NEED){done=true;stg.classList.add('win');msg('<b style="color:#8fb">🎉 서버 랙 '+NEED+'층 완성!</b>');setTimeout(ok,650);return;}
   msg(isP?'✨ <b>퍼펙트!</b>':'👍 좋아요! 폭이 줄었어요');setTimeout(()=>{if(alive()&&!done)start();},320);};
  btn.onpointerdown=fix;stg.onpointerdown=fix;
  reset();requestAnimationFrame(frame);}},
 wire:{n:'와이어 자르기',f(box,ok){
  /* 규칙: 안내된 색 순서대로 전선 5개를 모두 자르세요. 순서가 틀리면 전선이 다시 이어지고 처음부터! (진짜 전선처럼: 구불구불한 피복 + 금속 단자, 자르면 구리선이 드러나요) */
  const COLS=[['빨강','#ff4d5a'],['파랑','#4da3ff'],['노랑','#ffd84d'],['초록','#3fe08a'],['보라','#c77dff']];
  if(!document.getElementById('hbWrCss2')){const st=document.createElement('style');st.id='hbWrCss2';st.textContent=[
   '.mgW{font-family:var(--mono,monospace);color:#cfe;max-width:340px;margin:4px auto 2px;user-select:none;-webkit-user-select:none}',
   '.mgW .wMsg{font-size:14px;line-height:1.45;color:#bfe;min-height:21px}',
   '.mgW .wClue{display:flex;gap:4px;justify-content:center;align-items:center;margin:8px 0;flex-wrap:wrap;font-size:13px}',
   '.mgW .wClue b{padding:3px 8px;border-radius:12px;color:#111;font-size:13px}',
   '.mgW .wBox{padding:8px 8px 6px;border:2px solid #0a8;border-radius:12px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.025) 0 2px,transparent 2px 6px),linear-gradient(#03130f,#020b0a);box-shadow:inset 0 0 24px rgba(0,170,130,.3)}',
   '.mgW .wBox.win{border-color:#8fb;box-shadow:inset 0 0 30px rgba(90,255,160,.5),0 0 22px #3f8}',
   '.mgW .wBox.bad{animation:wbad .4s;border-color:#f55}@keyframes wbad{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}',
   '.mgW .wW{position:relative;height:46px;margin:5px 0;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;outline:none}',
   '.mgW .wW svg{position:absolute;left:14px;top:0;width:calc(100% - 28px);height:46px;overflow:visible;pointer-events:none;z-index:1}',
   '.mgW .wW path{fill:none;stroke-linecap:round;vector-effect:non-scaling-stroke}',
   '.mgW .wW .wo{stroke:#000;stroke-opacity:.55;stroke-width:16}',
   '.mgW .wW .wc{stroke:var(--wc);stroke-width:11}',
   '.mgW .wW .wr{stroke:#000;stroke-opacity:.22;stroke-width:11;stroke-dasharray:2 7;stroke-linecap:butt}',
   '.mgW .wW .wh{stroke:#fff;stroke-opacity:.5;stroke-width:3;transform:translateY(-2.5px)}',
   '.mgW .wW .wT{position:absolute;top:9px;width:15px;height:28px;border-radius:4px;z-index:2;background:linear-gradient(90deg,#8b949d,#eef3f7 45%,#69737d);box-shadow:0 1px 3px #000,inset 0 0 0 1px rgba(0,0,0,.35)}',
   '.mgW .wW .wT::after{content:"";position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:radial-gradient(#2b3138,#10151a)}',
   '.mgW .wW .wT.l{left:0}.mgW .wW .wT.r{right:0}',
   '.mgW .wW .wLb{position:absolute;left:21%;top:50%;transform:translateY(-50%);z-index:3;padding:1px 7px;border-radius:8px;background:rgba(0,0,0,.68);color:#fff;font-size:12px;font-weight:700;letter-spacing:.5px;pointer-events:none;white-space:nowrap}',
   '.mgW .wW .wFr{display:none;position:absolute;z-index:2;width:9px;height:14px;border-radius:2px;background:repeating-linear-gradient(0deg,#f0b070 0 2px,#8a5a2a 2px 3px);pointer-events:none}',
   '.mgW .wW .wFr.a{left:calc(14px + (100% - 28px)*.42);top:var(--ya,23px);transform:translate(-100%,-50%)}',
   '.mgW .wW .wFr.b{left:calc(14px + (100% - 28px)*.58);top:var(--yb,23px);transform:translate(0,-50%)}',
   '.mgW .wW.cut .wFr{display:block;animation:wsp .5s ease-out}@keyframes wsp{0%{box-shadow:0 0 14px 7px #ffe9a0}100%{box-shadow:0 0 0 0 transparent}}',
   '.mgW .wW.cut svg{-webkit-mask-image:linear-gradient(90deg,#000 0,#000 42%,transparent 42%,transparent 58%,#000 58%,#000 100%);mask-image:linear-gradient(90deg,#000 0,#000 42%,transparent 42%,transparent 58%,#000 58%,#000 100%)}',
   '.mgW .wW.cut .wLb{opacity:.45}',
   '.mgW .wW.cut::after{content:"✂";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:3;font-size:18px;color:#fff;text-shadow:0 0 6px #000;pointer-events:none}',
   '.mgW .wW:focus-visible .wo{stroke:#fff;stroke-opacity:.9}',
   '@media (prefers-reduced-motion:reduce){.mgW .wBox.bad,.mgW .wW.cut .wFr{animation:none}}'].join('\n');document.head.appendChild(st);}
  const sh=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;};
  const need=sh(COLS.map(c=>c[0]));                              // 자를 순서: 5가지 색 모두
  let order=sh(COLS);                                            // 화면에 놓인 전선 순서 (자를 순서와 같지 않게)
  while(order.map(c=>c[0]).join()===need.join())order=sh(COLS);
  const wireHTML=c=>{const a=5+Math.random()*8,s=Math.random()<.5?1:-1,y1=(23-s*a).toFixed(1),y2=(23+s*a).toFixed(1);
   const d='M0 23 C 50 '+y1+', 100 '+y2+', 150 23 S 250 '+y1+', 300 23';
   return '<div class=wW role=button tabindex=0 aria-label="'+c[0]+' 전선" data-n="'+c[0]+'" style="--wc:'+c[1]+'"><i class="wT l"></i><i class="wT r"></i>'
    +'<svg viewBox="0 0 300 46" preserveAspectRatio="none" aria-hidden="true"><path class=wo d="'+d+'"/><path class=wc d="'+d+'"/><path class=wr d="'+d+'"/><path class=wh d="'+d+'"/></svg>'
    +'<span class=wLb>'+c[0]+'</span><i class="wFr a"></i><i class="wFr b"></i></div>';};
  box.innerHTML='<div class=mgW><div class=wMsg></div><div class=wClue></div><div class=wBox>'+order.map(wireHTML).join('')+'</div></div>';
  const ws=[...box.querySelectorAll('.wW')],bx=box.querySelector('.wBox'),mg=box.querySelector('.wMsg'),cl=box.querySelector('.wClue');
  // 자른 자리(전선의 42%~58%)에 구리선 끝이 정확히 전선 위에 오도록 높이를 계산해요
  const yAt=(p,x)=>{let lo=0,hi=p.getTotalLength();for(let i=0;i<16;i++){const m=(lo+hi)/2;if(p.getPointAtLength(m).x<x)lo=m;else hi=m;}return p.getPointAtLength(hi).y;};
  ws.forEach(w=>{let ya=23,yb=23;try{const p=w.querySelector('path.wc');ya=yAt(p,126);yb=yAt(p,174);}catch(e){}w.style.setProperty('--ya',ya+'px');w.style.setProperty('--yb',yb+'px');});
  let pos=0,done=false,lock=false;
  const col=n=>COLS.find(c=>c[0]===n)[1];
  const alive=()=>document.body.contains(box);
  const clue=()=>{cl.innerHTML=need.map((n,i)=>'<span>'+(i?'→ ':'')+'<b style="background:'+col(n)+'">'+n+'</b></span>').join(' ');cl.querySelectorAll('span').forEach((s,i)=>{if(i<pos)s.style.opacity='.35';});};
  const msg=h=>{mg.innerHTML=h;};
  const snip=w=>{if(done||lock||w.classList.contains('cut')||!alive())return;
   try{sfx('tap');}catch(e){}
   if(w.dataset.n===need[pos]){w.classList.add('cut');pos++;clue();
    if(pos>=need.length){done=true;bx.classList.add('win');msg('<b style="color:#8fb">🎉 보안 장치를 해제했어요!</b>');setTimeout(ok,650);}
    else msg('✂ 좋아요! 다음은 <b>'+need[pos]+'</b> ('+pos+'/'+need.length+')');}
   else{lock=true;bx.classList.remove('bad');void bx.offsetWidth;bx.classList.add('bad');msg('💥 순서가 틀렸어요! 전선이 다시 이어져요');
    setTimeout(()=>{if(!alive())return;ws.forEach(x=>x.classList.remove('cut'));bx.classList.remove('bad');pos=0;lock=false;clue();msg('✂ 안내된 <b>순서대로</b> 잘라 보세요');},800);}};
  ws.forEach(w=>{w.onclick=()=>snip(w);w.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();snip(w);}};});
  clue();msg('✂ 안내된 <b>순서대로</b> 전선 5개를 잘라 보세요');}},
 shadow:{n:'포켓몬 그림자 맞추기',f(box,ok){
  /* 규칙: 까만 그림자의 주인공 이름을 4개 중에서 고르세요. 3번 맞히면 성공! */
  const NEED=3;
  if(!document.getElementById('hbShCss')){const st=document.createElement('style');st.id='hbShCss';st.textContent=[
   '.mgS{font-family:var(--mono,monospace);color:#cfe;max-width:340px;margin:4px auto 2px;user-select:none;-webkit-user-select:none;text-align:center}',
   '.mgS .sMsg{font-size:14px;line-height:1.45;color:#bfe;min-height:21px;text-align:left}',
   '.mgS .sPic{height:150px;margin:8px 0;border:2px solid #0a8;border-radius:12px;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,#0a3a50,#03121c)}',
   '.mgS .sPic img{max-height:130px;max-width:80%;object-fit:contain;filter:brightness(0);transition:filter .4s}',
   '.mgS .sPic.rev img{filter:none}',
   '.mgS .sCh{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
   '.mgS .sB{padding:12px 4px;border:2px solid #0a8;border-radius:10px;background:#062a3a;color:#bfe;font-size:15px;font-weight:700;cursor:pointer;touch-action:manipulation}',
   '.mgS .sB.bad{border-color:#f55;color:#f99;background:#3a0a14;opacity:.6}',
   '.mgS .sB.good{border-color:#8fb;color:#8fb;background:#0a3a22}',
   '.mgS .sBar{display:flex;gap:6px;justify-content:center;margin-top:8px;font-size:13px;color:#9ab;align-items:center}',
   '.mgS .sBar i{width:26px;height:8px;border-radius:4px;background:#0a2a24;box-shadow:inset 0 0 0 1px #0a6}',
   '.mgS .sBar i.on{background:linear-gradient(90deg,#3f8,#ff9)}'].join('\n');document.head.appendChild(st);}
  box.innerHTML='<div class=mgS><div class=sMsg></div><div class=sPic></div><div class=sCh></div><div class=sBar><span>맞힌 수</span>'+Array.from({length:NEED},()=>'<i></i>').join('')+'</div></div>';
  const pic=box.querySelector('.sPic'),chs=box.querySelector('.sCh'),mg=box.querySelector('.sMsg'),dots=[...box.querySelectorAll('.sBar i')];
  const ids=MON_IDS.filter(id=>id<=1025&&MON[id]&&MON[id].name);
  let got=0,cur=0,lock=false,done=false,tries=0;
  const alive=()=>document.body.contains(box);
  const msg=h=>{mg.innerHTML=h;};
  const round=()=>{if(!alive()||done)return;lock=false;cur=pk(ids);const nm=MON[cur].name,opts=[nm];let g=0;
   while(opts.length<4&&g++<200){const n=MON[pk(ids)].name;if(!opts.includes(n))opts.push(n);}
   opts.sort(()=>Math.random()-.5);
   pic.className='sPic';pic.innerHTML=monImg(cur,'front');
   const im=pic.querySelector('img');if(im)im.addEventListener('error',()=>{if(alive()&&!done&&tries++<6)round();});
   chs.innerHTML=opts.map(o=>'<div class=sB role=button data-n="'+esc(o)+'">'+esc(o)+'</div>').join('');
   chs.querySelectorAll('.sB').forEach(b=>b.onclick=()=>{if(lock||done||b.classList.contains('bad'))return;
    if(b.dataset.n===nm){lock=true;b.classList.add('good');pic.classList.add('rev');got++;dots.forEach((d,i)=>d.classList.toggle('on',i<got));try{sfx('tap');}catch(e){}
     if(got>=NEED){done=true;msg('<b style="color:#8fb">🎉 정체를 모두 밝혔어요!</b>');setTimeout(ok,800);}
     else{msg('✅ 정답! <b>'+esc(nm)+'</b>');setTimeout(round,900);}}
    else{b.classList.add('bad');msg('❌ 아니에요! 다시 골라 보세요');}});
   msg('🕵 이 그림자는 <b>누구</b>일까요? ('+(got+1)+'/'+NEED+')');};
  round();}},
 target:{n:'목표 숫자 만들기',f(box,ok){
  /* (1학년 숫자 2~3개 · 1~2학년 유형은 왼쪽부터 순차 계산, 괄호 없음 · 5·6학년도 나누어떨어지는 것만) 규칙: 숫자를 모두 한 번씩 써서 목표 숫자를 만드세요. 학년·학기(S.meta.gs)에 따라 연산·숫자 개수가 달라져요.
     내 학년 유형이 절반, 나머지는 아래 학년 유형이 섞여 나와요(1학년은 1학년 유형만). 곱셈이 나오는 유형은 곱셈·나눗셈 먼저 + ( ) 버튼. 1라운드.
     친구 대전: 이 게임은 해킹당한 본인 화면에서 돌아가므로 각자 자기 S.meta.gs 로 출제돼요. */
  const TIERS=[ // 학년별 유형 (ops 쓰는 연산 · n 숫자 개수 · sig 꼭 한 번은 쓰는 연산 · paren 괄호 버튼 · exact 나누어떨어지는 나눗셈만 · big 두 자리 수 나누어지는 수)
   {k:'1학년',ops:['+','−'],n:[2,3],ltr:1},
   {k:'2학년 1학기',ops:['+','−'],n:[3],ltr:1},
   {k:'2학년 2학기',ops:['+','−','×'],n:[3],sig:'×',ltr:1},
   {k:'3학년',ops:['+','−','×','÷'],n:[3],sig:'÷',paren:1,exact:1},
   {k:'4학년',ops:['+','−','×','÷'],n:[3,4],sig:'÷',paren:1,exact:1},
   {k:'5학년',ops:['+','−','×','÷'],n:[3],sig:'÷',paren:1,exact:1,big:1},
   {k:'6학년',ops:['+','−','×','÷'],n:[3,4],sig:'÷',paren:1,exact:1,big:1}];
  const tierOf=gs=>{const m=/^([1-6])-([12])$/.exec(String(gs||''));const g=m?+m[1]:3,s=m?+m[2]:1;return g<=1?0:g===2?(s===1?1:2):g;};
  if(!document.getElementById('hbTgCss')){const st=document.createElement('style');st.id='hbTgCss';st.textContent=[
   '.mgT{font-family:var(--mono,monospace);color:#cfe;max-width:340px;margin:4px auto 2px;user-select:none;-webkit-user-select:none;text-align:center}',
   '.mgT .tMsg{font-size:14px;line-height:1.45;color:#bfe;min-height:21px;text-align:left}',
   '.mgT .tGoal{margin:8px 0;padding:8px;border:2px solid #0a8;border-radius:12px;background:linear-gradient(#03130f,#020b0a);font-size:15px;color:#9ab}',
   '.mgT .tGoal b{display:block;font-size:40px;color:#ff9;line-height:1.1}',
   '.mgT .tGoal.win{border-color:#8fb;box-shadow:0 0 22px #3f8}',
   '.mgT .tGoal.bad{border-color:#f55;animation:tbad .4s}@keyframes tbad{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}',
   '.mgT .tEx{min-height:34px;font-size:22px;color:#fff;margin:6px 0;word-break:keep-all}',
   '.mgT .tRow{display:flex;gap:8px;justify-content:center;margin:6px 0;flex-wrap:wrap}',
   '.mgT .tRow:empty{display:none}',
   '.mgT .tB{min-width:62px;padding:12px 0;border:2px solid #0a8;border-radius:10px;background:#062a3a;color:#bfe;font-size:22px;font-weight:700;cursor:pointer;touch-action:manipulation}',
   '.mgT .tB.op{border-color:#fa4;color:#fc7}',
   '.mgT .tB.par{border-color:#6bf;color:#9cf;min-width:62px}',
   '.mgT .tB.off{opacity:.3;pointer-events:none}',
   '.mgT .tB.sm{font-size:14px;min-width:96px;padding:10px 0;border-color:#789;color:#abc}',
   '.mgT .tBar{font-size:13px;color:#9ab;margin-top:6px;line-height:1.4}',
   '@media (prefers-reduced-motion:reduce){.mgT .tGoal.bad{animation:none}}'].join('\n');document.head.appendChild(st);}
  box.innerHTML='<div class=mgT><div class=tMsg></div><div class=tGoal>목표 숫자<b></b></div><div class=tEx></div><div class="tRow tN"></div><div class="tRow tO"></div><div class="tRow tP"></div><div class=tRow><div class="tB sm" role=button data-a=undo>↩ 한 칸 지우기</div><div class="tB sm" role=button data-a=clear>🔄 처음부터</div></div><div class=tBar></div></div>';
  const goalBox=box.querySelector('.tGoal'),goal=goalBox.querySelector('b'),ex=box.querySelector('.tEx'),rn=box.querySelector('.tN'),ro=box.querySelector('.tO'),rp=box.querySelector('.tP'),mg=box.querySelector('.tMsg'),bar=box.querySelector('.tBar');
  const isN=t=>typeof t==='number',OPSET=['+','−','×','÷'];
  /* 분수로 정확히 계산: 곱셈·나눗셈 먼저, 괄호 먼저. ex=나누어떨어지는 나눗셈만 허용, nn=뺄셈 결과가 음수면 안 됨(문제 만들 때만) */
  const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){const t=a%b;a=b;b=t;}return a||1;};
  const fr=(n,d)=>{if(d<0){n=-n;d=-d;}const g=gcd(n,d);return{n:n/g,d:d/g};};
  const ev=(tk,ex2,nn,lt)=>{let p=0,bad='';   // lt: 1~2학년 유형은 혼합계산을 안 배우므로 왼쪽부터 차례로 계산(괄호 없음)
   const ap=(v,o,b)=>{
    if(o==='×')return fr(v.n*b.n,v.d*b.d);
    if(o==='÷'){if(b.n===0){if(!bad)bad='zero';return v;}const r=fr(v.n*b.d,v.d*b.n);if(ex2&&r.d!==1&&!bad)bad='rem';return r;}
    const r=o==='+'?fr(v.n*b.d+b.n*v.d,v.d*b.d):fr(v.n*b.d-b.n*v.d,v.d*b.d);if(nn&&r.n<0&&!bad)bad='neg';return r;};
   if(lt){let v=fr(tk[0],1);for(let i=1;i+1<tk.length;i+=2)v=ap(v,tk[i],fr(tk[i+1],1));return bad?{e:bad}:{v};}
   const fac=()=>{const t=tk[p++];if(t==='('){const v=exp();p++;return v;}return fr(t,1);};
   const trm=()=>{let v=fac();while(p<tk.length&&(tk[p]==='×'||tk[p]==='÷')){const o=tk[p++];v=ap(v,o,fac());}return v;};
   const exp=()=>{let v=trm();while(p<tk.length&&(tk[p]==='+'||tk[p]==='−')){const o=tk[p++];v=ap(v,o,trm());}return v;};
   const v=exp();return bad?{e:bad}:{v};};
  const fmt=f=>f.d===1?String(f.n):f.n+'/'+f.d;
  /* 문제 만들기: 풀이가 하나는 있는 숫자 묶음+목표 숫자 */
  const gen=ti=>{const T=TIERS[ti];
   for(let a=0;a<2000;a++){
    const n=pk(T.n),cap=ti>=5?99:n===2?18:n===3?40:60,un=[];let k=n;
    if(T.big&&n>=3&&Math.random()<.6){let d,q;do{d=2+rr(8);q=2+rr(8);}while(d*q<10);un.push([d*q,'÷',d]);k-=2;}   // 5·6학년: 두 자리 수 ÷ 한 자리 수
    for(let i=0;i<k;i++)un.push([1+rr(9)]);
    un.sort(()=>Math.random()-.5);
    const tk=[];un.forEach((u,i)=>{if(i)tk.push(pk(T.ops));u.forEach(x=>tk.push(x));});
    if(T.sig&&!tk.includes(T.sig))continue;
    let g=tk,grouped=false;
    if(T.paren&&Math.random()<.5){const i=rr(n-1),j=i+1+rr(n-1-i);if(!(i===0&&j===n-1)){g=tk.slice(0,2*i).concat('(',tk.slice(2*i,2*j+1),')',tk.slice(2*j+1));grouped=true;}}
    const r=ev(g,1,1,T.ltr);if(r.e||r.v.d!==1)continue;
    const v=r.v.n,tiles=tk.filter(isN);
    if(v<2||v>cap||tiles.includes(v))continue;
    if(grouped){const b=ev(tk,1,1);if(!b.e&&b.v.d===1&&b.v.n===v)continue;}   // 괄호가 꼭 필요한 문제만
    return{a:tiles,v};}
   return ti>=1?{a:[2,3,4],v:9}:{a:[3,4],v:7};};
  let T=TIERS[0],nums=[],target=0,toks=[],used=[],busy=false,done=false;
  const alive=()=>document.body.contains(box);
  const msg=h=>{mg.innerHTML=h;};
  const depth=()=>toks.reduce((d,t)=>d+(t==='('?1:t===')'?-1:0),0);
  const expOpd=()=>{const l=toks[toks.length-1];return l===undefined||l==='('||OPSET.includes(l);};   // 지금 숫자나 ( 를 눌러야 하는 차례?
  const allUsed=()=>used.every(Boolean);
  const txt=()=>{let s='';toks.forEach((t,i)=>{s+=t===')'?')':((i&&toks[i-1]!=='('?' ':'')+t);});return s;};
  const draw=()=>{const eo=expOpd(),au=allUsed(),dp=depth();let tail='';
   if(toks.length&&!eo&&dp===0){const r=ev(toks,T.exact,0,T.ltr);if(!r.e)tail=' = <b style="color:#8fb">'+fmt(r.v)+'</b>';}
   ex.innerHTML=toks.length?txt()+tail:'<span style="color:#678;font-size:15px">숫자를 눌러 시작하세요</span>';
   rn.innerHTML=nums.map((n,i)=>'<div class="tB'+(used[i]||!eo?' off':'')+'" role=button data-i='+i+'>'+n+'</div>').join('');
   ro.innerHTML=T.ops.map(o=>'<div class="tB op'+(eo||au?' off':'')+'" role=button data-o="'+o+'">'+o+'</div>').join('');
   rp.innerHTML=T.paren?'<div class="tB par'+(eo&&!au&&dp<2?'':' off')+'" role=button data-p="(">(</div><div class="tB par'+(!eo&&dp>0?'':' off')+'" role=button data-p=")">)</div>':'';
   bar.textContent='📘 '+T.k+' 문제 · '+(T.paren?'곱셈·나눗셈을 먼저 계산해요. ( )로 묶으면 그 부분을 먼저 계산해요':'숫자는 한 번씩만, 왼쪽부터 계산')+(T.exact?' · 나눗셈은 나누어떨어지게':'');
   rn.querySelectorAll('.tB').forEach(b=>b.onclick=()=>pickN(+b.dataset.i));
   ro.querySelectorAll('.tB').forEach(b=>b.onclick=()=>pickO(b.dataset.o));
   rp.querySelectorAll('.tB').forEach(b=>b.onclick=()=>pickP(b.dataset.p));};
  const check=()=>{const r=ev(toks,T.exact,0,T.ltr);busy=true;let why='';
   if(r.e)why=r.e==='zero'?'0으로는 나눌 수 없어요':'나누어떨어지지 않는 나눗셈이에요';
   else if(r.v.d===1&&r.v.n===target){goalBox.classList.add('win');try{sfx('tap');}catch(e){}done=true;msg('<b style="color:#8fb">🎉 목표 숫자를 만들었어요!</b>');setTimeout(ok,700);return;}
   else why='결과가 <b>'+fmt(r.v)+'</b>예요';
   goalBox.classList.remove('bad');void goalBox.offsetWidth;goalBox.classList.add('bad');msg('❌ '+why+'. 다시 만들어 보세요');setTimeout(()=>{if(alive())reset();},1000);};
  const finish=()=>{if(allUsed()&&depth()===0&&!expOpd())check();};
  const pickN=i=>{if(busy||done||used[i]||!expOpd())return;used[i]=1;toks.push(nums[i]);draw();finish();};
  const pickO=o=>{if(busy||done||expOpd()||allUsed())return;toks.push(o);draw();};
  const pickP=p=>{if(busy||done)return;if(p==='('){if(!T.paren||!expOpd()||allUsed()||depth()>=2)return;}else if(expOpd()||depth()<=0)return;toks.push(p);draw();finish();};
  const reset=()=>{toks=[];used=nums.map(()=>0);busy=false;goalBox.classList.remove('bad','win');msg('🧮 숫자와 기호를 눌러 <b>'+target+'</b>을 만들어 보세요');draw();};
  const start=()=>{let gs='3-1';try{gs=S.meta.gs||gs;}catch(e){}   // 전역 S 의 학년·학기 (1-1 ~ 6-2)
   const my=tierOf(gs),ti=my>1&&Math.random()<.5?1+rr(my-1):my;   // 절반은 내 학년, 나머지는 아래 학년 유형 (1학년 유형은 1학년만 — 다른 학년에선 너무 쉬워서 제외)
   T=TIERS[ti];const g=gen(ti);nums=g.a.slice().sort(()=>Math.random()-.5);target=g.v;goal.textContent=target;reset();};
  box.querySelector('[data-a=undo]').onclick=()=>{if(busy||done||!toks.length)return;const t=toks.pop();if(isN(t)){const i=nums.findIndex((n,k)=>used[k]&&n===t);if(i>=0)used[i]=0;}draw();};
  box.querySelector('[data-a=clear]').onclick=()=>{if(busy||done)return;reset();};
  start();}},
 slide:{n:'슬라이딩 퍼즐',f(box,ok){
  /* 규칙: 빈칸 옆의 숫자 조각을 눌러 밀어서 1~8 순서대로 맞추세요. */
  if(!document.getElementById('hbSlCss')){const st=document.createElement('style');st.id='hbSlCss';st.textContent=[
   '.mgL{font-family:var(--mono,monospace);color:#cfe;max-width:340px;margin:4px auto 2px;user-select:none;-webkit-user-select:none;text-align:center}',
   '.mgL .lMsg{font-size:14px;line-height:1.45;color:#bfe;min-height:21px;text-align:left}',
   '.mgL .lGr{display:grid;grid-template-columns:repeat(3,86px);grid-template-rows:repeat(3,86px);gap:6px;justify-content:center;margin:10px 0;padding:10px;border:2px solid #0a8;border-radius:12px;background:linear-gradient(#03130f,#020b0a);box-shadow:inset 0 0 24px rgba(0,170,130,.3)}',
   '.mgL .lGr.win{border-color:#8fb;box-shadow:inset 0 0 30px rgba(90,255,160,.5),0 0 22px #3f8}',
   '.mgL .lT{display:flex;align-items:center;justify-content:center;border-radius:12px;border:2px solid #3fd;background:linear-gradient(145deg,#0b4a66,#062a3a);color:#dff;font-size:34px;font-weight:700;cursor:pointer;touch-action:manipulation;box-shadow:0 0 10px rgba(0,255,200,.3)}',
   '.mgL .lT.ok{border-color:#8fb;color:#8fb}',
   '.mgL .lT.e{border:2px dashed #0a6;background:transparent;box-shadow:none;cursor:default}',
   '.mgL .lBar{font-size:13px;color:#9ab}'].join('\n');document.head.appendChild(st);}
  box.innerHTML='<div class=mgL><div class=lMsg></div><div class=lGr></div><div class=lBar></div></div>';
  const gr=box.querySelector('.lGr'),mg=box.querySelector('.lMsg'),bar=box.querySelector('.lBar');
  let t=[1,2,3,4,5,6,7,8,0],mv=0,done=false;
  const alive=()=>document.body.contains(box);
  const nb=i=>{const r=Math.floor(i/3),c=i%3,a=[];if(r>0)a.push(i-3);if(r<2)a.push(i+3);if(c>0)a.push(i-1);if(c<2)a.push(i+1);return a;};
  const solved=()=>t.every((v,i)=>v===(i<8?i+1:0));
  (()=>{let z=8,prev=-1;for(let k=0;k<16||solved();k++){const c=nb(z).filter(x=>x!==prev),n=pk(c);t[z]=t[n];t[n]=0;prev=z;z=n;}})();
  const draw=()=>{gr.innerHTML=t.map((v,i)=>'<div class="lT'+(v?(v===i+1?' ok':''):' e')+'" role=button data-i='+i+'>'+(v||'')+'</div>').join('');
   gr.querySelectorAll('.lT').forEach(d=>d.onclick=()=>tap(+d.dataset.i));bar.textContent='움직인 횟수 '+mv;};
  const tap=i=>{if(done||!alive())return;const z=t.indexOf(0);if(!nb(i).includes(z))return;t[z]=t[i];t[i]=0;mv++;try{sfx('tap');}catch(e){}draw();
   if(solved()){done=true;gr.classList.add('win');mg.innerHTML='<b style="color:#8fb">🎉 퍼즐 완성!</b>';setTimeout(ok,700);}};
  mg.innerHTML='🧩 빈칸 옆 조각을 눌러 <b>1~8 순서</b>로 맞춰 보세요';draw();}}
};
function mini(){if(C.phase!=='play')return;C.mode='mini';C.pendWait=0;const key=pk(CFG.MINI_ON.filter(k=>MINI[k])),g=MINI[key];
 pop('<h3 style="color:#f66">🚨 시스템이 해킹당했어요!'+(C.hitBy?' ('+esc(C.hitBy.by)+')':'')+'</h3><div style="color:#fd6">복구 미니게임: '+g.n+' — 해결해야 다시 문제를 풀 수 있어요. (시간은 계속 흘러요)</div><div id=hbMg></div>');
 g.f($h('#hbMg'),()=>{if(C.mode!=='mini')return;C.mode=null;C.hitBy=null;popx();tx({t:'rec'});C.me.lock=Math.max(0,(C.me.lock|0)-1);if(!C.me.lock)redOff();toast(C.me.lock?'✅ 복구! 그런데 또 해킹당했어요…':'✅ 복구 완료!');setTimeout(next,500);});}
/* ---------- 화면 ---------- */
const fmt2=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
/* ---------- 첫 화면: DOS 부팅 · 타이핑 연출 ---------- */
let bootSeen=false,bootTk=0;
const BOOT_FULL=[
 {t:'MONSTUDY-DEX BIOS v9.25 ........ [OK]',c:'dim'},
 {t:'> 아레나 서버에 접속하는 중...',d:220},
 {t:'> 대전 준비  [##########] 100%',c:'ok'},
 {t:'> 참가자 확인 ........ 완료',c:'ok'},
 {t:'> 접속 권한: CHALLENGER (아레나 모듈 로드됨)',c:'warn',d:260},
 {t:'몬스터디 아레나',c:'ttl',d:200},
 {t:'문제를 풀어 포켓몬 카드를 모으고, 친구의 포켓몬을 뺏고 복제해서 전부 모아보자!',c:'txt'},
 {t:'로그인 정보를 입력하세요.',c:'txt'}
];
const BOOT_QUICK=[
 {t:'몬스터디 아레나',c:'ttl'},
 {t:'문제를 풀어 포켓몬 카드를 모으고, 친구의 포켓몬을 뺏고 복제해서 전부 모아보자!',c:'txt'},
 {t:'로그인 정보를 입력하세요.',c:'txt'}
];
function bootType(box,lines,spd,done){
 const tk=++bootTk,cur=document.createElement('i');cur.className='cur';let fin=0,li=0,ci=0,el=null,tm=0;
 const alive=()=>tk===bootTk&&C&&C.phase==='menu'&&box.isConnected;
 const end=()=>{if(fin)return;fin=1;clearTimeout(tm);box._skip=null;done();};
 box._skip=()=>{if(fin)return;clearTimeout(tm);box.innerHTML='';lines.forEach(l=>{const d=document.createElement('div');d.className='dl '+(l.c||'');d.textContent=l.t;box.appendChild(d);});box.lastChild.appendChild(cur);end();};
 const step=()=>{if(fin)return;if(!alive()){clearTimeout(tm);return;}
  if(li>=lines.length){if(el)el.appendChild(cur);return end();}
  const l=lines[li];
  if(!el){el=document.createElement('div');el.className='dl '+(l.c||'');el.appendChild(document.createTextNode(''));el.appendChild(cur);box.appendChild(el);ci=0;}
  ci=Math.min(l.t.length,ci+spd);el.firstChild.nodeValue=l.t.slice(0,ci);
  if(ci>=l.t.length){li++;el=null;tm=setTimeout(step,Math.round((l.d||90)*(spd>3?.3:1)));}else tm=setTimeout(step,24);};
 step();}
const DOTS='<span class=dosDots><i></i><i></i><i></i></span>';
function tline(el,text,spd){if(!el)return;if(reduceMo()||!spd){el.textContent=text;return;}
 const cur=document.createElement('i');cur.className='cur';const tn=document.createTextNode('');el.textContent='';el.appendChild(tn);el.appendChild(cur);let i=0;
 const st=()=>{if(!el.isConnected)return;i=Math.min(text.length,i+spd);tn.nodeValue=text.slice(0,i);if(i<text.length)setTimeout(st,28);};st();}
function accWin(rank){const el=rank.filter(p=>p.ok+p.wr>=CFG.ACC_MIN_Q);if(!el.length)return null;
 el.sort((a,b)=>{const ta=a.ok+a.wr,tb=b.ok+b.wr;return (b.ok*ta-a.ok*tb)||(b.ok-a.ok)||(a.r-b.r);});return el[0];}
function accBox(w){if(!w)return '';const t=w.ok+w.wr,me=w.pid===C.pid;
 return '<div class=box style="text-align:center;border-color:#3ff;box-shadow:0 0 12px #0cf8">🎯 칭호 <b style="color:#ffd23f">정답률 1위</b> — '+(me?'🎉 바로 나!':'<b>'+esc(w.n)+'</b>')+'<br><small>'+w.ok+' / '+t+' · '+Math.round(w.ok/t*100)+'%</small></div>';}
function accRow(p){const t=p.ok+p.wr,r=t?Math.round(p.ok/t*100):0;return '<div class=dacc>🎯 맞힌 문제 <b>'+p.ok+'</b> / 푼 문제 <b>'+t+'</b> · 정답률 <b>'+(t?r+'%':'-')+'</b><span class=dbar><i style="width:'+r+'%"></i></span></div>';}
function paintMenu(){let sv={};try{sv=JSON.parse(localStorage.getItem('zhb_sv')||'{}');}catch(e){}
 const nmv=esc(sv.name||(S.meta&&(S.meta.name||S.meta.nick))||''),cdv=esc(sv.code||''),rcv=esc(sv.rc&&sv.rc!=='(방장)'?sv.rc:'');
 root.innerHTML='<div class=w><div class=dos><div class=dosH><span class=dosDots><i></i><i></i><i></i></span><b>C:\\MONSTUDY\\ARENA.EXE</b></div>'
 +'<div class=dosB id=hbBoot></div>'
 +'<div class=dosF id=hbForm>'
 +'<label class=dr><span>사용자명<small>USER</small></span><input id=hbNm maxlength=8 value="'+nmv+'" placeholder="내 이름" autocomplete=off spellcheck=false></label>'
 +'<button class="dbt" data-x=host>▶ 방 만들기 (방장)</button>'
  +'<button class="dbt" data-x=rand style="--c:#fd2">🎲 랜덤 매칭</button>'
 +'<div class=dsep>또는 기존 방에 접속</div>'
 +'<label class=dr><span>방 번호<small>ROOM</small></span><input id=hbCd maxlength=4 inputmode=numeric value="" placeholder="4자리" autocomplete=off></label>'
 +'<label class=dr><span>재접속 번호<small>REJOIN</small></span><input id=hbRc maxlength=4 inputmode=numeric value="" placeholder="끊겼을 때만" autocomplete=off></label>'
 +'<button class="dbt j" data-x=join>▷ 참가하기</button>'
 +'<button class="dbt" data-x=rejoin style="--c:#fd2">🔄 재접속하기 (방 번호·재접속 번호 불러오기)</button>'
 +'<button class="dbt" data-x=prac style="--c:#fd2">🛠 해킹 복구 연습</button><div id=hbPr></div>'
 +'<div id=hbSt class=dosSt></div>'
 +'<button class="dbt q" data-x=quit>✖ 닫기</button>'
 +'</div></div><div id=hbP class=pop></div></div>';
 root.onclick=e=>{const x=e.target.dataset&&e.target.dataset.x;if(!x)return;const nm=($h('#hbNm')||{}).value||'트레이너';
  if(x==='quit')return quit();if(x==='prac'){if(!(pracBox()&&pracBox().dataset.on))pracMenu();return;}
  if(x==='rejoin'){if(!cdv)return stat('저장된 접속 기록이 없어요');$h('#hbCd').value=cdv;$h('#hbRc').value=rcv;stat('불러왔어요! 아래 「참가하기」를 눌러 주세요');return;}
  C.name=nm;if(x==='rand'){randHB(nm);return;}if(x==='host'){stat('방을 여는 중…');hostOpen(nm);}
  if(x==='join'){const c=$h('#hbCd').value.trim(),r=$h('#hbRc').value.trim();if(!/^\d{4}$/.test(c))return stat('방 번호 4자리를 넣어 주세요');C.rc=r||null;joinGame(c,r||'',nm);}};
 const bx=$h('#hbBoot'),fm=$h('#hbForm');$h('#hbPr').addEventListener('click',pracClick);
 fm.querySelectorAll('input').forEach(i=>i.addEventListener('keydown',e=>{if(e.key!=='Enter')return;e.preventDefault();if(i.id==='hbNm'){const n=$h('#hbCd');if(n)n.focus();}else{const j=fm.querySelector('[data-x=join]');if(j)j.click();}}));
 $h('.dos').addEventListener('pointerdown',()=>{if(bx._skip)bx._skip();});
 bootType(bx,bootSeen?BOOT_QUICK:BOOT_FULL,bootSeen?5:2,()=>{bootSeen=true;fm.classList.add('show');});
 if(reduceMo()&&bx._skip)bx._skip();}
function pickInfo(){const t=$h('#hbIt'),w=$h('#hbIw');if(!t||!C||C.phase!=='pick')return;const left=Math.ceil((C.pickEnd-now())/1000);
 t.textContent=C.hidPick?'✅ 선택 완료! 다른 친구를 기다려요…':(left>0?'⏱ '+left+'초 안에 골라 주세요 (안 고르면 맨 앞 아이디로 자동 선택돼요)':'곧 시작해요…');
 if(w)w.textContent=(C.idw&&C.idw.n?'선택한 친구 '+(C.idw.d|0)+' / '+(C.idw.n|0)+'명':'')+(left<-12?' · 방장과 연결이 끊긴 것 같아요. 나가기를 눌러 주세요':'');}
/* 아이디 고를 때 포켓몬 도트 그림을 이름 옆에 작게 보여줘요 (ENG 순서 = 도감 번호) */
function hbFace(n){const id=ENG.indexOf(n)+1;if(id<1||typeof MON==='undefined'||!MON[id])return '';try{return monImg(id,'front').replace('style="--d:','style="width:42px;height:42px;object-fit:contain;vertical-align:middle;margin-right:6px;image-rendering:pixelated;--d:');}catch(e){return '';}}
function paintPick(){root.className='on';
 root.innerHTML='<div class=w><div class=dos><div class=dosH>'+DOTS+'<b>C:\\MONSTUDY\\ID_SELECT.EXE</b></div><div class=dosP><div class="dl ttl s" id=hbTt></div><div class="dl txt">해킹할 때 친구들이 보는 내 이름표예요. 참가자마다 <b>서로 다른 후보</b>가 나와서 아이디가 겹치지 않아요!</div><div class="dl warn" style="background:none;border:0;padding:0"><b id=hbIt></b></div><div class=idg id=hbIc></div><div id=hbIw class=dosSt></div><button class="dbt q" data-x=quit>✖ 나가기</button></div></div><div id=hbP class=pop></div></div>';
 tline($h('#hbTt'),'> 해킹 아이디 선택',2);
 const draw=()=>{const b=$h('#hbIc');if(!b)return;b.innerHTML=C.cand.map(n=>'<button class="dbt'+(C.hidPick===n?' sel':'')+'" data-x=pid data-v="'+esc(n)+'"'+(C.hidPick&&C.hidPick!==n?' disabled':'')+'>'+(C.hidPick===n?'✔ ':'')+hbFace(n)+esc(n)+'</button>').join('');};
 draw();pickInfo();
 root.onclick=e=>{const x=e.target.dataset&&e.target.dataset.x;if(!x)return;if(x==='quit')return quit();
  if(x==='pid'&&!C.hidPick){const v=String(e.target.dataset.v||'');if(!C.cand.includes(v))return;C.hidPick=v;C.hid=esc(v);draw();pickInfo();tx({t:'idp',v});}};
 clearInterval(C.pkT);C.pkT=setInterval(()=>{if(!C||C.phase!=='pick'||!$h('#hbIt')){clearInterval(C&&C.pkT);return;}pickInfo();},500);}
/* ---------- 대기실 해킹 복구 연습: 친구를 기다리는 동안 15종 미니게임을 연습해요 (게임이 시작되면 화면이 바뀌며 자동으로 끝나요) ---------- */
const PRAC_KEYS=['color','memory','order','code','circuit','virus','reaction','laser','odd','simon','stack','wire','shadow','target','slide'];
function pracBox(){return root&&root.querySelector('#hbPr');}
function pracMenu(){const b=pracBox();if(!b)return;b.dataset.on=1;
 b.innerHTML='<div class=dsep>🛠 해킹 복구 연습 — 하고 싶은 게임을 고르세요</div><div class=dnote>방장이 게임을 시작하면 연습은 자동으로 끝나고 바로 시작해요!</div><div class=durs style="flex-wrap:wrap">'+PRAC_KEYS.filter(k=>MINI[k]).map(k=>'<button class=dbt data-pg="'+k+'">'+MINI[k].n+'</button>').join('')+'</div><button class="dbt q" data-pg=close>✖ 연습 닫기</button>';}
function pracRun(k){const b=pracBox();if(!b||!MINI[k])return;b.dataset.on=1;
 b.innerHTML='<div class=dsep>🛠 연습: '+MINI[k].n+'</div><div id=hbMg style="padding:4px 0"></div><div class=durs style="flex-wrap:wrap"><button class=dbt data-pg="'+k+'">↻ 처음부터</button><button class=dbt data-pg=menu>◀ 다른 게임</button><button class="dbt q" data-pg=close>✖ 연습 닫기</button></div>';
 MINI[k].f(b.querySelector('#hbMg'),()=>{const g=b.querySelector('#hbMg');if(!g)return;g.innerHTML='<div style="text-align:center;font-size:24px;color:#3f8;padding:14px 0">🎉 복구 성공! 잘했어요!</div>';try{sfx('win');}catch(e){}});}
function pracClick(e){const x=e.target.closest&&e.target.closest('[data-pg]');if(!x||!pracBox()||!pracBox().contains(x))return;const k=x.dataset.pg;
 if(k==='close'){const b=pracBox();b.innerHTML='';delete b.dataset.on;}else if(k==='menu')pracMenu();else pracRun(k);}
function paintLobby(){const host=C.role==='host',first=!C.lobTyped;C.lobTyped=1;const pl=C.pl||[];
 const tm=!!C.teamMode;
 const keepPr=pracBox();const prOn=keepPr&&keepPr.dataset.on?keepPr:null;if(prOn)prOn.remove();   // 연습 중이면 화면이 갱신돼도 그대로 유지해요
 const tag=p=>'<span class="ptag'+(p.a?' away':'')+'"'+(host&&tm&&p.id?' data-x=tmv data-pid="'+p.id+'"':'')+'>'+ttTxt(p.t)+esc(p.n)+(p.a?' (자리비움)':'')+(p.b?' 🤖':'')+'</span>';
 const teamBox=t=>{const ms=pl.filter(p=>p.team===t);return '<div class=dsep>'+(t==='A'?'🔴 A팀':'🔵 B팀')+' '+ms.length+'명</div><div class=ptags>'+(ms.length?ms.map(tag).join(''):'<span style="opacity:.6">아직 없어요</span>')+'</div>';};
 const nA=pl.filter(p=>p.team==='A').length,nB=pl.filter(p=>p.team==='B').length;
 root.innerHTML='<div class=w><div class=dos><div class=dosH>'+DOTS+'<b>C:\\MONSTUDY\\LOBBY.EXE</b></div><div class=dosP>'
 +'<div class="dl ttl s" id=hbTt></div>'
 +'<div class=dkv><span>ROOM</span><b class=big>'+C.code+'</b></div>'
 +'<div class=dkv><span>MY_ID</span><b>'+C.hid+'</b></div>'
 +'<div class=dkv><span>REJOIN</span><b>'+(C.rc||'')+'</b></div>'
 +'<div class=dnote>재접속 번호는 나만 보는 번호예요! 끊기면 이 번호로 돌아와요.</div>'
 +(tm?teamBox('A')+teamBox('B'):'<div class=dsep>참가자 '+pl.length+'명</div><div class=ptags>'+pl.map(tag).join('')+'</div>')
 +(host?(()=>{const na=pl.filter(p=>p.b).length,full=na>=CFG.HOST_AI_MAX||pl.length>=(tm?TEAM_MAX*2:CFG.MAX_P);return '<div class=dsep>🤖 AI 친구 '+na+'명</div><div class=durs><button class="dbt" data-x=aim'+(na?'':' disabled')+'>− 빼기</button><button class="dbt" data-x=aip'+(full?' disabled':'')+'>+ 추가</button></div><div class=dnote>친구가 적을 때 AI를 더해서 같이 할 수 있어요 (최대 '+CFG.HOST_AI_MAX+'명)</div>';})():'')
 +(host?'<div class=dsep>모드</div><div class=durs><button class="dbt'+(tm?' sel':'')+'" data-x=tmm>👥 팀전 모드: '+(tm?'켜짐':'꺼짐')+'</button></div><div class=dnote>팀전은 2v2부터 5v5까지, 두 팀 인원수가 같아야 시작해요. 팀 도감은 팀원끼리 공유하고, 해킹은 상대 팀 전원에게 들어가요.</div>':'')
 +(host&&tm&&nA!==nB?'<button class="dbt" data-x=tfill>🤖 AI로 인원 맞추기 (🔴 A팀 '+nA+'명 · 🔵 B팀 '+nB+'명)</button><div class=dnote>두 팀 인원수가 같아야 시작할 수 있어요. 작은 팀에 AI를 채워요.</div>':'')
 +(host&&tm?'<div class=dnote>팀을 바꾸려면 친구 이름을 눌러요 (방장만 가능)</div>':'')
 +(host?'<div class=dsep>게임 시간</div><div class=durs>'+CFG.DURS.map(d=>'<button class="dbt'+(C.dur===d?' sel':'')+'" data-x=d'+d+'>'+d+'분</button>').join('')+'</div><button class="dbt" data-x=st>'+(tm?'▶ 팀전 시작 (2v2 이상 · 같은 인원)':'▶ 게임 시작 (2명 이상)')+'</button>':'<div class=dnote style="font-size:14px;color:#8fd">방장이 시작하길 기다려요… ('+(C.dur||5)+'분 게임)<i class=cur></i></div>')
 +arenaRecLine()+'<div class=dnote>🎁 보상: 참가자 '+CFG.REWARD_MIN_P+'명 이상 · 내 점수 '+needSc(CFG.DURS.includes(+C.dur)?+C.dur:5)+'점 이상('+CFG.DURS.map(d=>d+'분 '+needSc(d)+'점').join(' · ')+')이면 ★1~2 포켓몬 1마리 · 1·2·3등은 5·4·3성 조각 추가 · 🎯 정답률 1위('+CFG.ACC_MIN_Q+'문제 이상 푼 사람)도 5성 조각 추가</div>'
 +'<button class="dbt" data-x=prac style="--c:#fd2">🛠 해킹 복구 연습 (기다리는 동안 해 보세요)</button><div id=hbPr class=dosP></div>'
 +'<div id=hbSt class=dosSt></div><button class="dbt q" data-x=quit>✖ 나가기</button></div></div><div id=hbP class=pop></div></div>';
 if(prOn){const n=$h('#hbPr');if(n)n.replaceWith(prOn);}else{const n=$h('#hbPr');if(n)n.addEventListener('click',pracClick);}
 tline($h('#hbTt'),'> 대기실 접속 완료',first?2:0);
 root.onclick=e=>{const x=e.target.dataset&&e.target.dataset.x;if(!x)return;if(x==='quit')return quit();if(x==='prac'){if(pracBox()&&pracBox().dataset.on)return;pracMenu();return;}if(x==='aip')tx({t:'aip'});if(x==='aim')tx({t:'aim'});if(x==='st')tx({t:'st'});if(x==='tmm')tx({t:'tmm'});if(x==='tfill')tx({t:'tfill'});if(x==='tmv')tx({t:'tmv',pid:e.target.dataset.pid});if(/^d\d+$/.test(x))tx({t:'dur',v:+x.slice(1)});};}
function paintPlay(){root.className='on';root.innerHTML='<div class="w hbPlay"><div class="dosH dosHs">'+DOTS+'<b>C:\\MONSTUDY\\HACK.EXE — LIVE</b></div><div class="box top"><div>⏱ <b id=hbT>--:--</b></div><div>🃏 <b id=hbN>0</b>장 · ⭐ <b id=hbS>0</b>점</div><div id=hbB></div><button class=b data-x=key>🔑 내 번호</button></div><div id=hbW></div><div class=box><b id=hbRh class=bh>▌RANK ▸ 실시간 순위</b><div class=rk id=hbR style="margin-top:6px">집계 중…</div></div><div class=box><b id=hbDh class=bh>▌DEX ▸ 내 도감</b><div class=dex id=hbD style="margin-top:6px"></div></div><div id=hbSt class=dosSt></div><div id=hbP class=pop></div><div id=hbGo class=gobar><button class="b g" data-x=go>🔓 해킹하기 · 문제 풀기</button></div></div>';
 root.onclick=e=>{const d=e.target.dataset||{};if(d.x==='go'){if(C.mode==='closed'){C.mode=null;showGo(0);question();}return;}if(d.x==='key'||d.k){const v=d.k?e.target.parentNode.querySelector('.hbKv'):$h('#hbSt');if(v)v.textContent=v.textContent?'':'재접속 번호 '+C.rc+' · 해킹 아이디 '+C.hid+' · 방 '+C.code+' (남에게 보여 주지 마세요)';}};
 clearInterval(uiT);uiT=setInterval(tick,250);paintMe();paintTop();}
function tick(){if(C.phase!=='play')return;syncPad();const l=C.end-now();const t=$h('#hbT');if(t){t.textContent=fmt2(l);}const on=l<=CFG.LAST30_MS&&l>0;root.classList.toggle('l30',on);if(!!C._l30!==on){C._l30=on;hbBgm();}const w=$h('#hbW');if(w)w.innerHTML=on?'<div class=warn>🚨 마지막 30초! 카드 획득 확률 UP · 남은 '+Math.ceil(l/1000)+'초</div>':'';
 if(C.role==='guest'&&C.lastRx&&now()-C.lastRx>CFG.HB_TIMEOUT+2000&&C.conn){try{C.conn.close();}catch(e){}lost();}}
function paintMe(){const m=C.me;if(!m)return;const q=(id,v)=>{const e=$h(id);if(e)e.textContent=v;};q('#hbN',m.tot);q('#hbS',m.sc);const b=$h('#hbB');if(b)b.innerHTML=(m.def?'🛡방어권 ':'')+(m.shEnd>now()?'✨보호막 ':'');
 const dh=$h('#hbDh');if(dh){const tk=(C.tm&&C.me&&C.me.team)?(C.me.team==='A'?C.tm[0].k:C.tm[1].k):null;dh.textContent='▌DEX ▸ 내 도감 · '+m.own.length+'종 / '+m.tot+'장'+(tk!=null?' · 팀 도감 '+tk+'종':'');}const d=$h('#hbD');if(!d)return;const own=[...m.own].sort((a,b)=>MON[b[0]].rar-MON[a[0]].rar||a[0]-b[0]);const NM={5:'전설',4:'영웅',3:'희귀',2:'고급',1:'일반'};let shown=0,hh='';
 for(let r=5;r>=1;r--){const g=own.filter(e=>MON[e[0]].rar===r);if(!g.length)continue;const cut=g.slice(0,Math.max(0,400-shown));shown+=cut.length;hh+='<div class=dgh>'+'★'.repeat(r)+' '+NM[r]+' · '+g.length+'종 / '+g.reduce((a,e)=>a+e[1],0)+'장</div>'+cut.map(([id,n])=>'<div class="cc r'+r+((C.hold&&C.hold[id])?' hbHold':'')+'" data-id='+id+'>'+monImg(id,'front')+'<i>×'+n+'</i></div>').join('')+(g.length>cut.length?'<div class=dgh>…외 '+(g.length-cut.length)+'종</div>':'');}
 d.innerHTML=own.length?hh:'<div style="grid-column:1/-1;opacity:.7">도감이 비어 있어요. 문제를 풀어 포켓몬을 획득하세요!</div>';}
function paintTop(){const r=$h('#hbR');if(!r)return;const all=C.all||[];const list=all.length?all:(C.top||[]).map(p=>({id:'',n:p.n,s:p.s}));
 if(!list.length){r.textContent='집계 중…';return;}const mi=all.findIndex(x=>x.id===C.pid);const h=$h('#hbRh');if(h)h.innerHTML='▌RANK ▸ 실시간 순위'+(mi>=0?' · <b style="color:#ff6">내 순위 '+(mi+1)+'위 / '+all.length+'명</b>':'');
 const tmLine=(C.tm&&C.tm.length===2)?'<div style="margin:4px 0;padding:5px 8px;border:1px solid #0a85;border-radius:8px;font-size:14px;text-align:center">🔴 A팀 <b>'+C.tm[0].k+'</b>종 · <b>'+C.tm[0].s+'</b>점'+(C.me&&C.me.team==='A'?' ◀ 우리 팀':'')+' &nbsp;|&nbsp; 🔵 B팀 <b>'+C.tm[1].k+'</b>종 · <b>'+C.tm[1].s+'</b>점'+(C.me&&C.me.team==='B'?' ◀ 우리 팀':'')+'</div>':'';
 r.innerHTML=tmLine+list.map((p,i)=>'<span'+(p.id&&p.id===C.pid?' style="border-color:#ff6;color:#ff6"':'')+'>'+(i<3?['🥇','🥈','🥉'][i]:(i+1)+'위')+' '+ttTxt(p.t)+esc(p.n)+' '+p.s+'점</span>').join('');}
/* ---------- 게임 종료 연출: 해킹 접속 종료 (터미널 로그 → CONNECTION TERMINATED → CRT 꺼짐 → 결과 화면) ---------- */
function endCut(m,show){
 if(!root||!C){show(false);return;}
 if(C.cutOn)return;C.cutOn=1;
 const calm=reduceMo(),all=m.why==='all';
 try{popx();}catch(e){}try{showGo(0);}catch(e){}
 root.classList.remove('hkShake');
 root.querySelectorAll('.hkWin,.hkWarn,.hkEnd,#hbRed,#hbNw').forEach(x=>x.remove());
 const o=document.createElement('div');o.className='hkEnd';
 o.innerHTML='<div class=hkIn><canvas class=hkCv></canvas><div class=hkBox><div class=hkTerm></div><div class=hkTi></div><div class=hkSub></div><div class=hkHint>화면을 누르면 건너뛰어요</div></div></div><div class=hkEFl></div>';
 root.appendChild(o);
 const q=s=>o.querySelector(s),tm=[],ivs=[];let done=0,rain=0,col='#3f8';
 const at=(f,ms)=>tm.push(setTimeout(()=>{if(o.isConnected)f();},calm?0:ms));
 const sx=n=>{try{sfx(n);}catch(e){}};
 if(!calm&&!lowFx()){const cv=q('.hkCv'),cx=cv.getContext('2d');if(cx){const W=cv.width=innerWidth,Hh=cv.height=innerHeight,cols=Math.ceil(W/16),dr=Array.from({length:cols},()=>rr(Math.ceil(Hh/16))),gl='01ABCDEF▌▐░▒ｱｲｳｴｵ';
  rain=setInterval(()=>{if(!o.isConnected){clearInterval(rain);return;}cx.fillStyle='rgba(0,0,0,.16)';cx.fillRect(0,0,W,Hh);cx.fillStyle=col;cx.font='16px monospace';
   for(let i=0;i<cols;i++){cx.fillText(gl[rr(gl.length)],i*16,dr[i]*16);if(dr[i]*16>Hh&&Math.random()>.97)dr[i]=0;dr[i]++;}},60);}}
 const term=q('.hkTerm'),line=(t,c)=>{const d=document.createElement('div');d.textContent=t;if(c)d.style.color=c;term.appendChild(d);sx('tap');return d;};
 const bar=p=>{const n=Math.round(p/10);return '['+'#'.repeat(n)+'.'.repeat(10-n)+'] '+p+'%';};
 line(all?'> ALL TARGETS CAPTURED — 도감 100% 달성!':'> TIMER EXPIRED — 종료 신호 수신',all?'#fd2':'#ff8a8a');
 at(()=>{const lb='> 연결 차단 중  ',d=line(lb+bar(calm?100:0));if(calm)return;let p=0;const iv=setInterval(()=>{p=Math.min(100,p+10);d.textContent=lb+bar(p);if(p>=100||!o.isConnected)clearInterval(iv);},70);ivs.push(iv);},400);
 at(()=>line('> 흔적 삭제  rm -rf /tmp/trace ... OK'),1250);
 at(()=>line('> 해킹 로그 암호화 ... DONE'),1700);
 at(()=>line('> 최종 순위 집계 중...'),2050);
 at(()=>{
  if(!all)o.classList.add('bad');col=all?'#fd2':'#f45';
  const t=q('.hkTi');t.textContent=all?'FULL ACCESS':'CONNECTION TERMINATED';t.classList.add('show');
  const f=q('.hkEFl');f.classList.add('go');const ib=q('.hkIn');ib.classList.add('shk');
  sx(all?'win':'crit');},2450);
 at(()=>{const s=q('.hkSub');s.textContent=all?(m.wteam?'👑 '+(m.wteam==='A'?'🔴 A팀':'🔵 B팀')+'이(가) 도감 1025종을 모두 모았어요!':'👑 모든 포켓몬을 해킹했어요!'):'🔌 해킹 종료! 결과를 확인해요';s.classList.add('show');},2900);
 at(()=>q('.hkHint').classList.add('show'),3000);
 const fin=()=>{clearInterval(rain);ivs.forEach(clearInterval);if(C)C.cutOn=0;show(true);};
 const out=()=>{if(done||!o.isConnected)return;done=1;tm.forEach(clearTimeout);clearInterval(rain);ivs.forEach(clearInterval);
  if(calm){fin();return;}o.classList.add('off');sx('thud');setTimeout(fin,520);};
 const t0=now();o.onclick=e=>{e.stopPropagation();if(calm||now()-t0>700)out();};
 tm.push(setTimeout(out,calm?1800:4000));
}
/* 아레나 전적: 최고 점수·1등 횟수·판수를 저장해요 (1등·판수는 2명 이상 게임만 쳐요) */
function arenaRec(){try{return (S.meta.hb&&S.meta.hb.rec)||null;}catch(e){return null;}}
function arenaRecLine(){try{const r=arenaRec();if(!r||!(r.games||r.best))return '';return '<div class="dnote">🏆 내 아레나 전적 · 최고 <b>'+(r.best||0)+'점</b> · 🥇 1등 <b>'+(r.wins||0)+'번</b> · 총 '+(r.games||0)+'판</div>';}catch(e){return '';}}
function finish(m){m.rank=(Array.isArray(m.rank)?m.rank:[]).map(p=>({pid:String(p.pid),n:String(p.n),s:+p.s||0,c5:+p.c5||0,tot:+p.tot||0,st:[0,1,2,3,4].map(i=>+(p.st||[])[i]||0),ok:Math.max(0,+p.ok|0),wr:Math.max(0,+p.wr|0),r:+p.r||0}));m.gid=String(m.gid);C.phase='end';C.mode='end';clearInterval(uiT);hbBgm();root.classList.remove('l30');let rw='';const gains=[];const me=m.rank.find(x=>x.pid===C.pid),accW=accWin(m.rank);if(me&&me.r>=1&&me.r<=3){try{window.wqTick&&wqTick('arena')}catch(e){}}
if(me){try{const k=(S.meta.hb=S.meta.hb||{paid:{}});const r=(k.rec=k.rec||{best:0,wins:0,games:0});if((m.rank||[]).length>=CFG.REWARD_MIN_P){r.games=(r.games||0)+1;if(me.r===1)r.wins=(r.wins||0)+1;}if((me.s||0)>(r.best||0))r.best=me.s|0;try{autoSave();}catch(e){}}catch(e){}}
 if(m.ok&&me){pools();const k=(S.meta.hb=S.meta.hb||{paid:{}});k.paid=k.paid||{};
  const dm=CFG.DURS.includes(+m.dur)?+m.dur:(CFG.DURS.includes(+C.dur)?+C.dur:5),need=needSc(dm);
  const why=m.rank.length<CFG.REWARD_MIN_P?'참가자가 '+CFG.REWARD_MIN_P+'명 이상일 때만 보상을 받아요':me.s<need?dm+'분 게임은 '+need+'점 이상이어야 보상을 받아요 (내 점수 '+me.s+'점)':'';
  if(k.paid[m.gid])rw='<div class=box style="text-align:center">이미 받은 보상이에요</div>';
  else if(why)rw='<div class=box style="text-align:center">🎁 '+why+(accW&&me&&accW.pid===me.pid?'<br><small>(🎯 정답률 1위 보상도 같은 조건이에요)</small>':'')+'</div>';
  else{k.paid[m.gid]=1;
   const card=(id,g)=>{id=(g&&g.id)||id;return monImg(id,'front')+'<br>'+esc(MON[id].name)+' '+'★'.repeat(MON[id].rar)+(g&&g.k==='shard'?' 조각 '+g.n+'/'+g.need:g&&g.k==='done'?' 카드 완성!':g&&g.k==='dup'?' (이미 있는 카드 → 코인·별가루)':g&&g.k==='new'?' 새 카드!':'');};
   const col=S.meta.col||{},bp=[].concat(...CFG.REWARD_BASE.map(r=>POOL[r]||[])),fresh=bp.filter(id=>!col[id]),id1=pk(fresh.length?fresh:bp);let g1=null;try{g1=gainCard(id1);}catch(e){}if(g1)gains.push({id:g1.id||id1,g:g1});
   rw='<div class=box style="text-align:center;font-size:18px">🎁 기본 보상<br>'+card(id1,g1)+'</div>';
   if(me.r<=3){const star=CFG.REWARD[me.r],id2=pk(POOL[star]);let g2=null;try{g2=gainCard(id2);}catch(e){}if(g2)gains.push({id:g2.id||id2,g:g2});rw+='<div class=box style="border-color:#fd2;text-align:center;font-size:20px">'+['🥇','🥈','🥉'][me.r-1]+' '+me.r+'등 추가 보상 — '+star+'성 조각 획득!<br>'+card(id2,g2)+'</div>';}
   if(accW&&accW.pid===me.pid){const id3=pk(POOL[5]);let g3=null;try{g3=gainCard(id3);}catch(e){}if(g3)gains.push({id:g3.id||id3,g:g3});rw+='<div class=box style="border-color:#3ff;text-align:center;font-size:20px">🎯 정답률 1위 추가 보상 — 5성 조각 획득!<br>'+card(id3,g3)+'</div>';}
   try{autoSave();}catch(e){}try{saveLocal();}catch(e){}}}
 const show=anim=>{if(!C||C.phase!=='end'||!root)return;const tmHtml=(m.tm&&m.tm.length===2)?'<div class=box style="text-align:center;border-color:#fd2">'+(m.wteam?'<div style="font-size:22px">🏆 '+(m.wteam==='A'?'🔴 A팀':'🔵 B팀')+' 승리!</div>':'<div style="font-size:20px">🤝 무승부!</div>')+m.tm.map(t=>'<div style="margin-top:6px;font-size:16px">'+(t.t==='A'?'🔴':'🔵')+' '+t.t+'팀 — 도감 <b>'+t.k+'</b>종 · <b>'+t.s+'</b>점<br><small>'+t.m.map(esc).join(', ')+'</small></div>').join('')+'</div>':'';
  root.innerHTML='<div class=w><div class=dos><div class=dosH>'+DOTS+'<b>C:\\MONSTUDY\\RESULT.EXE</b></div><div class=dosP><div class="dl ttl s" id=hbTt></div>'+arenaRecLine()+rw+accBox(accW)+tmHtml+'<div class=box>'+m.rank.map(p=>'<div style="padding:4px 0;border-bottom:1px dashed #0a85;'+(p.pid===C.pid?'color:#ff6':'')+'">'+(p.r<=3?['🥇','🥈','🥉'][p.r-1]:p.r+'위')+' <b>'+ttTxt(p.t)+esc(p.n)+'</b>'+(accW&&accW.pid===p.pid?' <span class=dtt>🎯 정답률 1위</span>':'')+' — '+p.s+'점 · 카드 '+p.tot+'장 · ★1~5: '+p.st.join('/')+accRow(p)+'</div>').join('')+'</div><button class="dbt q" data-x=quit>✖ 닫기</button></div></div><div id=hbP class=pop></div></div>';tline($h('#hbTt'),'> 게임 종료'+(m.why==='all'?(m.wteam?' ('+m.wteam+'팀 도감 완성!)':' (모든 포켓몬을 모았어요!)'):''),2);root.onclick=e=>{if(e.target.dataset&&e.target.dataset.x==='quit')quit();};;if(gains.length){const gg=gains.splice(0),rk=me?me.r:0,ttl=rk>=1&&rk<=3?['🥇','🥈','🥉'][rk-1]+' '+rk+'등! 아레나 보상 카드':'🎁 아레나 보상 카드';setTimeout(async()=>{if(!C||C.phase!=='end'||!root)return;document.body.classList.add('hbRw');try{await cardRewardFx(gg,{title:ttl,logo:'ARENA REWARD'});}catch(e){console.warn('hb reward fx',e);}document.body.classList.remove('hbRw');},reduceMo()?200:900);}if(anim&&!reduceMo()){const w0=root.firstChild;if(w0&&w0.classList)w0.classList.add('hkOn');}};endCut(m,show);}
function quit(){try{S.curQ=null;}catch(e){}try{const mt=document.getElementById('hbMt');if(mt)mt.remove();}catch(e){}clearInterval(uiT);if(H){clearInterval(H.tm);clearInterval(H.botT);try{H.peer.destroy();}catch(e){}H=null;}try{C&&C.peer&&C.peer.destroy();}catch(e){}C=null;root.className='';root.innerHTML='';setTimeout(hbBgm,0);try{S.screen='hub';S.hubTab='adv';renderHub();}catch(e){}}  /* 해킹 배틀은 모험 탭 메뉴라서 끝나면 모험 탭으로 돌아와요 */
/* ---------- 배경음악: 해킹 배틀 전용 곡 (게임의 MUS 엔진에 곡만 등록해서 써요) ----------
   hack  = 사이버 해킹 분위기(프리지안 단조 · 달리는 16분 아르페지오 · 펌핑 톱니파 베이스 · 4박 킥)
   hackL = 같은 곡의 '마지막 30초' 빠른 버전(템포↑ · 드럼 풀 · 종소리)
   배경음악 설정(S.meta.settings.bgm)과 음량(bgmVol)은 게임 설정을 그대로 따라요. */
(function hbSongs(){try{const SG=MUS&&MUS.SONGS;if(!SG||SG.hack)return;
 const HK={bpm:128,swing:0,scale:'phr',tonic:9,oct:5,seed:97,vol:.88,lift:0,
  prog:{A:['Am','Bb','Am','Gm','Am','Bb','F','E'],B:['Dm','Am','Bb','Am','Dm','F','Bb','E']},rhyA:['synco','run'],rhyB:['driving','synco'],
  lead:{w:'pulse',v:.05,vib:0,rev:.15,dly:.3,short:1,cut:3000},arp:{pat:'ud16',w:'square',v:.02,base:57,rev:.1,dly:.15,cut:2200},
  bass:{st:'pump',w:'sawtooth',v:.1,base:33,cut:520},pad:{w:'sawtooth',v:.016,cut:900,base:52},bell:{v:.045},kit:'rock2',
  lay:{A:{arp:1,pad:1,bass:1,dr:1},A2:{lead:1,arp:1,pad:1,bass:1,dr:1},B:{lead:1,harm:1,arp:1,pad:1,bass:1,dr:2,bell:1},A3:{lead:1,harm:1,arp:1,pad:1,bass:1,dr:2,bell:1}}};
 const F2={lead:1,harm:1,arp:1,pad:1,bass:1,dr:2,bell:1};
 SG.hack=HK;SG.hackL=Object.assign({},HK,{bpm:148,vol:.92,lay:{A:F2,A2:F2,B:F2,A3:F2}});
}catch(e){console.warn('hb songs',e);}})();
/* 해킹 배틀 화면에서는 위 곡을 틀어요. 마지막 30초에는 빠른 버전으로 바뀌어요. */
function hbBgmKey(){const l=C&&C.phase==='play'&&C.end?C.end-now():0;return l>0&&l<=CFG.LAST30_MS?'hackL':'hack';}
try{if(typeof bgmKey==='function'&&!bgmKey._hb){const _bk=bgmKey;bgmKey=function(mode){try{if(!mode&&S.screen==='hb')return hbBgmKey();}catch(e){}return _bk.apply(this,arguments);};bgmKey._hb=1;}}catch(e){console.warn('hb bgmKey',e);}
const hbBgm=()=>{try{startBgm();}catch(e){}};
/* 제목줄 오른쪽 🎵 버튼: 해킹 배틀 안에서도 배경음악을 껐다 켤 수 있어요 (게임 전체 설정과 같은 값) */
const musOn=()=>{try{return !!S.meta.settings.bgm;}catch(e){return true;}};
function musBtn(){if(!root||!root.classList.contains('on'))return;const h=root.querySelector('.dosH');if(!h)return;let b=root.querySelector('#hbMus');
 if(!b){b=document.createElement('button');b.id='hbMus';b.type='button';b.onclick=e=>{e.stopPropagation();try{sfx('tap');}catch(er){}try{S.meta.settings.bgm=!S.meta.settings.bgm;}catch(er){}try{autoSave();}catch(er){}hbBgm();musBtn();};}
 if(b.parentNode!==h)h.appendChild(b);b.className=musOn()?'':'off';b.textContent=musOn()?'🎵':'🔇';b.setAttribute('aria-label',musOn()?'배경음악 끄기':'배경음악 켜기');}
let musMo=null;function musWatch(){if(musMo||!root||typeof MutationObserver==='undefined')return;musMo=new MutationObserver(()=>{if(root.classList.contains('on')&&!root.querySelector('#hbMus'))musBtn();});musMo.observe(root,{childList:true});}
function open(){if(!sumOK()){toast('설정 오류: 확률 합계가 100이 아니에요');return;}if(!root){root=document.createElement('div');root.id='hb';document.body.appendChild(root);try{new MutationObserver(()=>document.body.classList.toggle('hbOn',root.classList.contains('on'))).observe(root,{attributes:true,attributeFilter:['class']});}catch(e){}}
 C={phase:'menu',role:null,me:{own:[],sc:0,tot:0,def:0,lock:0},mode:null};S.screen='hb';root.className='on';paintMenu();musWatch();musBtn();hbBgm();}
function addModeBtn(){const box=document.querySelector('#view .t2modes');if(!box||box.querySelector('[data-hb]'))return;const b=document.createElement('button');b.className='t2mode';b.setAttribute('data-hb','1');b.id='pvMHack';b.style.cssText='grid-column:1/-1;background:linear-gradient(180deg,#14304f,#07101f);border-color:#2fd6ff;color:#aef;box-shadow:0 4px 0 #0a3a5c';b.innerHTML='<span class=t2mi>🏆</span><b style="color:#3ff">아레나</b><small style="color:#9fe;opacity:.9">여러 친구와 함께! 문제를 풀어 카드를 모으고, 친구의 포켓몬을 뺏고 복제하자!</small>';b.onclick=e=>{e.stopPropagation();try{sfx('tap');}catch(_){}open();};box.appendChild(b);}
if(typeof renderPvp==='function'){const rp=renderPvp;renderPvp=function(){const r=rp.apply(this,arguments);return r;  /* 해킹 배틀은 홈 > 모험 탭의 별도 메뉴로 옮겼어요 */};}
/* ---------- 🎲 랜덤 매칭: 지금은 AI 3명과 한 방에서 해요 (진짜 자동 매칭을 넣을 땐 이 부분만 바꿔요) ---------- */
/* 방장이 대기실에서 AI 친구를 더하거나 빼요 (학생 2명이 할 때 AI를 몇 명 더해서 같이 하기). AI 이름 앞에는 🤖 가 붙어요 */
const AI_FB=['별빛','도토리','파랑새','구름','하늘','달토끼','솜사탕','번개','바람','초코','나무','불꽃'];
function hostAddAI(){if(!H||H.state!=='lobby')return;const n=H.players.filter(p=>p.ai).length;if(n>=CFG.HOST_AI_MAX||H.players.length>=CFG.MAX_P)return;
 if(H.teamMode){if(H.players.length>=TEAM_MAX*2||(teamMembers('A').length>=TEAM_MAX&&teamMembers('B').length>=TEAM_MAX))return;}
 const used=new Set(H.players.map(p=>p.name));let pool=[];try{if(typeof rmNames==='function')pool=rmNames(6)||[];}catch(e){}
 pool=pool.concat(AI_FB.slice().sort(()=>Math.random()-.5)).map(x=>'🤖'+String(x).slice(0,5));
 const nm=pool.find(x=>!used.has(x))||'🤖AI'+(n+1);
 const p=newP(nm,{open:true,send(){},close(){}},false);p.ai=1;while(H.players.some(x=>x!==p&&x.rc===p.rc))p.rc=String(1000+rr(9000));
 if(H.teamMode)p.team=teamMembers('A').length<=teamMembers('B').length?'A':'B';   // 팀전: AI는 작은 팀으로 들어가요
 H.players.push(p);if(!H.botT)H.botT=setInterval(aiTick,700);lobBC();}
/* 팀전 AI 채우기: 두 팀 인원수가 같아질 때까지 작은 팀에 AI를 넣어 맞춤 (5v5까지) */
function hostFillAI(){if(!H||H.state!=='lobby'||!H.teamMode)return;let guard=0;while(teamMembers('A').length!==teamMembers('B').length&&guard++<8){const before=H.players.length;hostAddAI();if(H.players.length===before)break;}}
function hostDelAI(){if(!H||H.state!=='lobby')return;for(let i=H.players.length-1;i>=0;i--)if(H.players[i].ai){H.players.splice(i,1);break;}lobBC();}
function aiTick(){
 if(!H||H.state==='end')return;const t=now();
 if(H.state==='lobby'){H.players.forEach(p=>{if(p.ai){p.last=t;p.away=false;}});return;}   // 대기실에서도 AI가 '자리비움'이 되지 않게
 H.players.forEach(p=>{
  if(!p.ai)return;p.last=t;p.away=false;
  const b=p.bot||(p.bot={at:t+1500+rr(2500)});
  if(H.state==='pick'){if(!p.idDone&&p.cands&&t>=b.at)idPick(p,{t:'idp',v:p.cands[rr(p.cands.length)]});return;}
  if(H.state!=='play'||t<b.at)return;
  if(p.lock>0){hmsg(p,{t:'rec'});b.at=t+2500+rr(3500);return;}
  if(p.hk){const k=p.hk;let i=-1;if(k.opts&&k.opts.length){const real=k.opts.map((o,j)=>o.pid?j:-1).filter(j=>j>=0);i=(real.length&&Math.random()<.6)?real[rr(real.length)]:rr(k.opts.length);}hmsg(p,{t:'hit',n:k.n,i});b.at=t+3000+rr(4000);return;}
  if(p.pend){hmsg(p,{t:'pick',n:p.pend.n,i:rr(3)});b.at=t+5000+rr(9000);return;}
  if(Math.random()<.2){hmsg(p,{t:'wrong'});b.at=t+3000+rr(3000);return;}
  hmsg(p,{t:'solve'});b.at=t+1200+rr(1800);
 });}
function hostLocalAI(name,names,dur){
 pools();
 const code=String(1000+rr(9000));
 H={code,peer:null,dur:CFG.DURS.includes(dur)?dur:5,state:'lobby',players:[],gen:0,teamMode:0};
 const me=newP(name,null,true,ttNum());H.players.push(me);H.me=me;
 C.pid=me.pid;C.hid=me.hid;C.rc=me.rc;C.code=code;C.role='host';C.phase='lobby';
 (names||['별빛','도토리','파랑새']).slice(0,CFG.RAND_OPP[1]).forEach(n=>{const p=newP(n,{open:true,send(){},close(){}},false);p.ai=1;H.players.push(p);});
 H.tm=setInterval(hostTick,1000);H.botT=setInterval(aiTick,700);
 lobBC();
 setTimeout(()=>{if(H&&H.state==='lobby'&&C&&C.role==='host')hostStart();},1800);}
/* 🎲 랜덤 매칭: 게임 시간(5·7·10분)과 상대 인원(RAND_OPP)을 무작위로 정하고, 해킹 테마 로딩 팝업을 보여준 뒤 시작해요.
   (예전 rmMatch 팝업은 z-index 500 이라 해킹 배틀 화면(9000) 뒤에 가려졌어요 → 이 팝업은 그 위(9650)에 떠요) */
function randHB(nm){
 if(document.getElementById('hbMt')||!C||C.phase!=='menu')return;
 const dur=pk(CFG.DURS),nOpp=CFG.RAND_OPP[0]+rr(CFG.RAND_OPP[1]-CFG.RAND_OPP[0]+1),total=nOpp+1,need=needSc(dur);
 let names=[];try{if(typeof rmNames==='function')names=rmNames(nOpp);}catch(e){}
 const fb=['별빛','도토리','파랑새','구름','하늘','달토끼','솜사탕','번개','바람','초코','나무','불꽃'].filter(x=>!names.includes(x));
 while(names.length<nOpp&&fb.length)names.push(fb.splice(rr(fb.length),1)[0]);
 const o=document.createElement('div');o.id='hbMt';
 o.innerHTML='<div class=hbMtBx><div class=hbMtT>🎲 랜덤 매칭 중<span class=hbMtD></span></div><div class=hbMtSp></div><div class=hbMtBar><i></i></div>'
  +'<div class=hbMtTm>⏱ 게임 시간 <b>?</b>분 추첨 중</div><div class=hbMtL></div><div class=hbMtSt>상대를 찾는 중…</div><button type=button class=hbMtX>취소</button></div>';
 document.body.appendChild(o);
 const tms=[],ivs=[];let dead=0,settled=0,k=0;
 const stop=()=>{dead=1;tms.forEach(clearTimeout);ivs.forEach(clearInterval);o.remove();};
 const q=s=>o.querySelector(s),L=q('.hbMtL'),St=q('.hbMtSt'),Tm=q('.hbMtTm'),Dt=q('.hbMtD'),X=q('.hbMtX');
 const sx=n=>{try{sfx(n);}catch(e){}};
 const at=(f,ms)=>tms.push(setTimeout(()=>{if(dead||!o.isConnected){stop();return;}f();},ms));
 const add=h=>{const d=document.createElement('div');d.innerHTML=h;L.appendChild(d);sx('tap');};
 const cnt=()=>{St.textContent='참가자를 모으는 중… ('+L.children.length+'/'+total+'명)';};
 ivs.push(setInterval(()=>{if(dead||!o.isConnected){stop();return;}k++;Dt.textContent='.'.repeat(k%4);if(!settled)q('.hbMtTm b').textContent=CFG.DURS[k%CFG.DURS.length];},170));
 X.onclick=()=>{sx('tap');stop();};
 at(()=>{add('&gt; <b>'+esc(nm)+'</b> (나) <span>✔ 접속</span>');cnt();},350);
 names.forEach((n,i)=>at(()=>{add('&gt; '+esc(n)+' <span>✔ 접속</span>');cnt();},350+(i+1)*480+rr(160)));
 const tEnd=350+total*480+500;
 at(()=>{settled=1;o.classList.add('ok');Tm.innerHTML='⏱ 게임 시간 <b>'+dur+'분</b> 확정!';St.innerHTML='✅ 매칭 완료! 👥 참가자 <b>'+total+'명</b> · 🎁 <b>'+need+'점</b> 이상이면 보상';X.style.display='none';sx('ok');},tEnd);
 at(()=>{stop();if(!C||C.phase!=='menu'||!root||!root.classList.contains('on'))return;C.name=nm;hostLocalAI(nm,names,dur);},tEnd+1400);
}
window.HB={CFG,MINI,open,_t:!window.__sim?undefined:{hostStart,hostBegin,idPick,idWait,get Cc(){return C;},showPick,showRes,showHack,pkRow,hbPick,cm,finish,question,hjoin,rhash,snapPk,becomeHost,migrate,hostTick,get H(){return H;},setH(h){H=h;},setC(c){C=c;},newP,give,mult,take,takePref,calc,endGame,hmsg,mkSlot,pools,sumOK,cmp,teamMembers,teamKinds,teamKindSet,teamScore,teamTot,teamDefender,teamLabel,hostFillAI,hostAddAI,afterChange}};

setInterval(()=>{if(C&&C.role==='guest'&&C.phase==='play'){tx({t:'hb'});}else if(C&&C.role==='guest'&&(C.phase==='lobby'||C.phase==='pick')){tx({t:'hb'});}},4000);
})();
