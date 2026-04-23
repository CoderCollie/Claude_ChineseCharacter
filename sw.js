const CACHE = 'hanja-v13';
const ASSETS = [
  '/Claude_ChineseCharacter/',
  '/Claude_ChineseCharacter/index.html',
  '/Claude_ChineseCharacter/css/style.css',
  '/Claude_ChineseCharacter/js/data/level8.js',
  '/Claude_ChineseCharacter/js/data/level7.js',
  '/Claude_ChineseCharacter/js/data/level6.js',
  '/Claude_ChineseCharacter/js/data/level5.js',
  '/Claude_ChineseCharacter/js/data/level4.js',
  '/Claude_ChineseCharacter/js/data/level3.js',
  '/Claude_ChineseCharacter/js/data/level2.js',
  '/Claude_ChineseCharacter/js/data/level1.js',
  '/Claude_ChineseCharacter/js/data/index.js',
  '/Claude_ChineseCharacter/js/sm2.js',
  '/Claude_ChineseCharacter/js/app.js',
  '/Claude_ChineseCharacter/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
