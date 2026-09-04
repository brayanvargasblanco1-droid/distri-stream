const CACHE_NAME = "distrito-v12";
const ASSETS_TO_CACHE = ["/", "/manifest.json", "/assets/distrito-angel-blue-v1.png", "/distrito-2026.css?v=5"];

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
  const url = new URL(e.request.url);
  const path = url.pathname;
  // Nunca interceptar la API (ahora es /api/* del mismo origen, y antes
  // supabase.co): siempre debe ir a la red y jamás guardarse en caché.
  if (path === "/api" || path.startsWith("/api/") || e.request.url.includes("supabase.co")) return;
  // Navegacion, HTML, JS y CSS: network-first (los deploys nuevos se ven de
  // inmediato) con fallback a cache solo si no hay red (offline).
  const isDoc = e.request.mode === "navigate" || path === "/" || path.endsWith("index.html");
  const isCode = path.endsWith(".js") || path.endsWith(".css") || path.includes(".js?") || path.includes(".css?");
  if (isDoc || isCode) {
    e.respondWith(
      fetch(e.request).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return resp;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Assets estaticos (imagenes, fuentes): cache-first
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

// ─── NOTIFICACIONES PUSH ───────────────────────────────
// El backend (edge function /api) envía un JSON con:
//   { title, body, icon?, tag?, view? }
// view = vista a abrir al hacer clic (ej: "payments", "reports", "" = inicio).

function notifIcon() {
  return "/assets/distrito-angel-blue-v1.png";
}

self.addEventListener("push", e => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch (_) {
    data = { title: "Distrito Streaming", body: e.data ? String(e.data) : "" };
  }
  const title = data.title || "Distrito Streaming";
  const options = {
    body: data.body || "",
    icon: data.icon || notifIcon(),
    badge: notifIcon(),
    tag: data.tag || "distrito-notif",
    renotify: true,
    data: { view: data.view || "", ts: Date.now() },
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Clic en la notificación: enfocar la app abierta (y navegar a la vista) o abrirla.
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const view = (e.notification.data && e.notification.data.view) || "";
  const url = new URL("/", self.location.origin);
  if (view) url.searchParams.set("view", view);
  e.waitUntil((async () => {
    const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clientList) {
      if ("focus" in client) {
        await client.focus();
        client.postMessage({ type: "ds-goto", view });
        return;
      }
    }
    await self.clients.openWindow(url.toString());
  })());
});
