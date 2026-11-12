/* 포켓몬 그림 캐시 서비스 워커
 * - 한 번 받은 그림은 브라우저(Cache Storage)에 저장해 두고, 다음부터는 인터넷 없이 바로 보여 줘요.
 * - 저장 대상: PokeAPI 스프라이트(raw.githubusercontent.com/PokeAPI/sprites), Pokemon Showdown 스프라이트
 * - 404 같은 실패 응답은 저장하지 않아요. (앱이 "이 주소는 없음"을 정상적으로 알 수 있게)
 * - 그림을 바꿔야 할 때는 아래 VERSION 숫자를 올리면 예전 저장본이 지워져요.
 */
const VERSION = 'v1';
const CACHE = 'sprite-cache-' + VERSION;
const MAX_ENTRIES = 3000; /* 너무 많이 쌓이면 오래된 것부터 지워요 */

const isSprite = (url) =>
  (url.hostname === 'raw.githubusercontent.com' && url.pathname.indexOf('/PokeAPI/sprites/') === 0) ||
  (url.hostname === 'play.pokemonshowdown.com' && url.pathname.indexOf('/sprites/') === 0);

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.indexOf('sprite-cache-') === 0 && k !== CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

async function trim(cache) {
  try {
    const keys = await cache.keys();
    const extra = keys.length - MAX_ENTRIES;
    for (let i = 0; i < extra; i++) await cache.delete(keys[i]); /* keys()는 저장한 순서대로 나와요 */
  } catch (err) {}
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (!isSprite(url)) return;

  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      /* 1) 저장해 둔 그림이 있으면 바로 사용 */
      const hit = await cache.match(req.url);
      if (hit) return hit;

      /* 2) 없으면 인터넷에서 받아요 (CORS 방식: 저장 용량을 아끼기 위해) */
      try {
        const res = await fetch(req.url, { mode: 'cors', credentials: 'omit' });
        if (res && res.ok) {
          e.waitUntil(
            (async () => {
              await cache.put(req.url, res.clone());
              await trim(cache);
            })()
          );
        }
        return res; /* 404 등은 그대로 돌려줘요 (저장 안 함) */
      } catch (err) {
        /* CORS가 안 되는 경우: 원래 요청 그대로 시도 (저장은 안 함). 오프라인이면 실패 → 앱이 대체 그림을 써요 */
        try { return await fetch(req); } catch (err2) { return Response.error(); }
      }
    })()
  );
});
