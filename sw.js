// Offline cache for Pocket. Bump VERSION whenever you upload a new index.html.
const VERSION = 'pocket-35';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'];
// cache: 'reload' skips the browser's own cache, so a new version never stores the old page.
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, {cache: 'reload'})))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && !['pocket-fonts', 'pocket-ocr', 'pocket-share'].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  // Shared from another app (a GPay screenshot or a copied SMS): park it, then open Pocket to read it.
  if (req.method === 'POST' && url.origin === self.location.origin && /\/share\/?$/.test(url.pathname)) {
    e.respondWith((async () => {
      try {
        const fd = await req.formData(), c = await caches.open('pocket-share'), img = fd.get('image');
        await c.delete('shared-image'); await c.delete('shared-text');
        if (img && img.size) await c.put('shared-image', new Response(img, {headers: {'Content-Type': img.type || 'image/png'}}));
        const text = [fd.get('title'), fd.get('text')].filter(Boolean).join(' ');
        if (text) await c.put('shared-text', new Response(text));
      } catch (err) {}
      return Response.redirect(new URL('./?shared=1', self.registration.scope).href, 303);
    })());
    return;
  }
  if (req.method !== 'GET') return;
  const host = url.hostname;
  // Screenshot reader (Tesseract, in ocr/): kept in its own cache after the first use so it works offline without re-downloading on every update.
  if (url.origin === self.location.origin && /\/ocr\//.test(url.pathname)) {
    e.respondWith(caches.open('pocket-ocr').then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }))));
    return;
  }
  // Fonts: keep a copy so the app looks the same offline.
  if (host === 'fonts.googleapis.com' || host === 'fonts.gstatic.com') {
    e.respondWith(caches.open('pocket-fonts').then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }))));
    return;
  }
  if (new URL(req.url).origin !== self.location.origin) return;
  // The page itself: fetch fresh when online, fall back to the saved copy offline.
  if (req.mode === 'navigate' || /\/(index\.html)?$/.test(new URL(req.url).pathname)) {
    e.respondWith(fetch(req, {cache: 'no-cache'}).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, {ignoreSearch: true}).then(hit => hit || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req).then(res => {
    const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res;
  }).catch(() => caches.match('index.html'))));
});
