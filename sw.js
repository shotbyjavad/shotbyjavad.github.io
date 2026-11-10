const CACHE = 'gallery-f8909b248cc1';
const ASSETS = [".nojekyll", "about/", "assets/app.js", "assets/apple-touch-icon.png", "assets/favicon-32.png", "assets/icon-192.png", "assets/icon-512.png", "assets/logo.png", "assets/og-default.jpg", "assets/style.css", "categories/", "category/animal/", "category/architecture/", "category/cities/", "category/nature/", "category/night-sky/", "img/bryggen-bergen-3cb937ed13-640.webp", "img/dannie-the-turtle-35627048ba-640.webp", "img/holy-bethlehem-church-881ed084dd-640.webp", "img/mazichal-trees-f6c8ee6c79-640.webp", "img/nasir-al-molk-mosque-9ee34aaef0-640.webp", "img/shapori-house-b92262915d-640.webp", "img/sheikh-lotfollah-mosque-in-night-e8a4f4b3bb-640.webp", "img/sheikh-lotfollah-mosque-in-rainy-day-7eb5ca338b-640.webp", "img/store-lungegardsvannet-6ea1c11268-640.webp", "img/zayande-rod-25cfcaaf8d-640.webp", "", "location/bergen-norway/", "location/isfahan-iran/", "location/lahijan-iran/", "location/mazichal-iran/", "location/shiraz-iran/", "locations/", "manifest.webmanifest", "photo/bryggen-bergen/", "photo/dannie-the-turtle/", "photo/holy-bethlehem-church/", "photo/mazichal-trees/", "photo/nasir-al-molk-mosque/", "photo/shapori-house/", "photo/sheikh-lotfollah-mosque-in-night/", "photo/sheikh-lotfollah-mosque-in-rainy-day/", "photo/store-lungegardsvannet/", "photo/zayande-rod/", "photos/", "search/", "search.json", "tag/animal/", "tag/architecture/", "tag/ceiling/", "tag/iran/", "tag/lake/", "tag/landscape/", "tag/mosque/", "tag/nature/", "tag/night/", "tag/norway/", "tag/river/", "tag/travel/", "tag/trees/", "tags/"];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS.map((a) => new URL(a, self.registration.scope).href)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function store(req, res) {
  if (res.ok) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
}

// images have a hash in their file name, so the cached copy is always right: cache first
function fromCache(req) {
  return caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => store(req, res)));
}

// pages, CSS, JS, search index: network first so new photos show up right away; cache when offline
function fromNetwork(req) {
  return fetch(req).then((res) => store(req, res)).catch(() =>
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match(new URL('./', self.registration.scope).href))
  );
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.indexOf('/admin/') !== -1) return;  // the web admin is never cached
  e.respondWith(/\/img\//.test(url.pathname) ? fromCache(req) : fromNetwork(req));
});
