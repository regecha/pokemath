// ================= 연결 중계 서버(TURN) 설정 =================
// 이 파일은 index.html과 같은 폴더(GitHub 저장소라면 index.html 옆)에 두세요.
// index.html을 새 버전으로 바꿔도 이 파일은 그대로라서, 설정을 다시 넣을 필요가 없어요.
//
// 왜 필요한가요?
//   같은 학교 와이파이의 다른 기기끼리 · 휴대폰 핫스팟 · '학교 와이파이 ↔ 휴대폰 데이터'는
//   기기끼리 직접 연결할 수 없어서 '중계 서버(TURN)'를 거쳐야 해요.
//   (친구 대전 · 보스전 · 저장 보내기/받기 · 선생님께 기록 보내기)
//
// 아래 두 가지 중 하나만 채우면 돼요. (둘 다 채워도 돼요)
window.TURN_SETTINGS={

  // [방법 1] Metered(https://www.metered.ca) 무료 TURN
  //   가입 → 앱 만들기 → 앱 이름과 API Key를 아래 따옴표 안에 넣어요.
  //   앱 이름은 주소 'myclass.metered.live' 의 myclass 부분이에요.
  //   예) metered:{app:'myclass',key:'abcdef1234567890'},
  metered:{app:'monstudy',key:'312912282248ebb8d30d6fe1279419ea0994'},

  // [방법 2] 다른 TURN 서비스(ExpressTURN·Xirsys·직접 만든 서버 등)
  //   받은 주소·아이디·비밀번호를 그대로 넣어요.
  //   예) custom:[{urls:['turn:서버주소:3478','turns:서버주소:443?transport=tcp'],username:'아이디',credential:'비밀번호'}]
  custom:[]
};
// ※ 이 파일은 누구나 열어 볼 수 있어요. 이 게임 전용으로 새로 만든 키를 쓰세요.
