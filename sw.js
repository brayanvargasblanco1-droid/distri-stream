const CACHE_NAME = "distrito-v8";
const ASSETS_TO_CACHE = ["/", "/manifest.json", "/assets/distrito-angel-blue-v1.png", "/distrito-2026.css?v=4"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.url.includes("supabase.co")) return;
  // Siempre fetch fresh para HTML (navegacion)
  if (e.request.mode === "navigate" || e.request.url.endsWith("/") || e.request.url.includes("index.html")) {
    e.respondWith(
      fetch(e.request).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return resp;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache-first para assets estaticos
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
