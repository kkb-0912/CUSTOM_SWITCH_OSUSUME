// 스위치 아카이브 서비스 워커 — 한 번 열어본 뒤에는 오프라인에서도 열리게 하고, 온라인이면 뒤에서 최신 파일로 갱신한다.
const CACHE = 'switch-archive-20260929-656';
const CORE = ['./', 'index.html', 'data.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('switch-archive-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;          // 글꼴·외부 링크는 브라우저에 맡김
  if (/\.xlsx$/i.test(url.pathname)) return;           // 엑셀은 캐시하지 않고 항상 새로 받음
  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req, { ignoreSearch: true }).then((hit) => {
        const fresh = fetch(req).then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => hit || (req.mode === 'navigate' ? cache.match('index.html') : undefined));
        return hit || fresh;                           // 캐시 우선(빠름), 뒤에서 갱신
      })
    )
  );
});
