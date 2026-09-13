// ═══════════════════════════════════════════════════════════════════════
//  reports-realtime.js v1 — Notificaciones en tiempo real (Supabase Realtime)
// ═══════════════════════════════════════════════════════════════════════
// Suscripción postgres_changes sobre la tabla `reports`:
//   • Cliente:  entra un reporte nuevo (no aplica), su reporte cambia de
//               estado o el admin responde (provider_response).
//   • Admin:    cualquier usuario abre un reporte o responde a uno abierto.
// Seguridad: la conexión usa la anon key y Realtime respeta RLS
// (migración 20260912000000_reports_realtime.sql: cada usuario solo recibe
// eventos de reportes propios; los admin, de todos).
//
// Contrato con index.html (todo opcional, tolera ausencia):
//   window.startReportsRealtime()  → llamar tras boot() exitoso
//   window.stopReportsRealtime()   → llamar en logout()
//   window.onRealtimeReport(row, eventType) → handler opcional (definido en index.html)
// ═══════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  // ---------- Estado del módulo ----------
  let channel = null;        // canal activo de Supabase Realtime
  let client = null;         // cliente supabase-js (solo para Realtime)
  let pollTimer = null;      // fallback de polling
  let reconnectTimer = null; // backoff de reconexión
  let reconnectDelay = 3000; // backoff exponencial, tope 60s
  let lastSignature = "";    // firma del último estado de reports (dedup)
  let lastEventAt = 0;       // para frenar tormentas de eventos
  let started = false;       // suscripción activa
  let pollMs = 60000;        // fallback: 1 minuto (default 2 min si realtime OK)

  const POLL_MS_REALTIME_OK = 120000; // con realtime vivo, poll cada 2 min (red de seguridad)
  const POLL_MS_FALLBACK = 60000;     // sin realtime, poll cada 1 min
  const EVENT_THROTTLE_MS = 1500;     // máx 1 toast por reporte cada 1.5s

  function log(...args) {
    try { console.info("[realtime]", ...args); } catch (_) {}
  }

  // ---------- Helpers de entorno (todo defensivo) ----------
  function appState() { return window.state || null; }
  function appUser() { return appState() && appState().user ? appState().user : null; }
  function appIsAdmin() {
    const u = appUser();
    if (!u) return false;
    if (typeof window.isAdmin === "function") { try { return !!window.isAdmin(); } catch (_) {} }
    return u.role === "admin" || u.role === "Administrador" || u.is_admin === true;
  }
  function escText(s) {
    // Escapado mínimo propio: no depender de esc() de index.html en este módulo.
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function appToast(msg, type) {
    if (typeof window.toast === "function") {
      try { window.toast(msg, type || ""); return; } catch (_) {}
    }
    log("toast:", msg);
  }

  // ---------- Toast UI (premium, consistente con la app) ----------
  function showToastNotification(title, body) {
    // 1) Intentar con el toast nativo de la app (no invasivo)
    appToast("🔔 " + title + (body ? " — " + body : ""), "ok");
    // 2) Notificación del sistema SOLO si el permiso ya fue concedido
    //    (nunca pedimos permiso desde aquí: eso lo maneja el flujo push).
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
        new Notification(title, { body: body || "", icon: "/assets/distrito-angel-blue-v1.png", tag: "report-" + Date.now() });
      }
    } catch (_) {}
  }

  // ---------- Carga de supabase-js (CDN, una sola vez) ----------
  const SUPABASE_JS_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
  function loadSupabaseJs() {
    if (window.supabase && typeof window.supabase.createClient === "function") return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-purpose="supabase-realtime-sdk"]');
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("No se pudo cargar supabase-js")));
        return;
      }
      const s = document.createElement("script");
      s.src = SUPABASE_JS_URL;
      s.async = true;
      s.dataset.purpose = "supabase-realtime-sdk";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("No se pudo cargar supabase-js"));
      document.head.appendChild(s);
    });
  }

  // ---------- Config ----------
  function realtimeConfig() {
    const s = appState();
    const cfg = s && s.realtime;
    if (!cfg || !cfg.url || !cfg.anonKey) return null;
    return { url: cfg.url, anonKey: cfg.anonKey, table: cfg.table || "reports" };
  }

  // ---------- Dedup: firma del estado de reports ----------
  function reportsSignature() {
    const reps = (appState() && appState().reports) || [];
    return reps.map(r => [r.id, r.status, r.provider_response || "", r.client_reply || ""].join("|")).sort().join(";");
  }
  function isDuplicateEvent() {
    const now = Date.now();
    if (now - lastEventAt < EVENT_THROTTLE_MS) return true;
    lastEventAt = now;
    return false;
  }

  // ---------- Notificaciones por evento ----------
  function describeRow(row, eventType) {
    if (!row) return null;
    const me = appUser();
    const isAdmin = appIsAdmin();
    const own = me && row.user_id === me.id;
    const service = row.product_name || "una cuenta";
    const code = row.code ? (" #" + row.code) : "";

    // INSERT
    if (eventType === "INSERT") {
      if (isAdmin) return { title: "🚨 Nuevo reporte" + code, body: (row.client_name || "Un cliente") + " reportó un problema con " + service };
      return null; // a un cliente no le notificamos reportes ajenos (RLS igual los filtra)
    }
    // UPDATE
    if (eventType === "UPDATE") {
      const st = row.status || "";
      // Cliente: su reporte fue respondido/resuelto/rechazado
      if (own) {
        if (row.provider_response && !isDuplicateEvent()) {
          if (st === "Resuelto") return { title: "✅ Reporte resuelto" + code, body: "Tu cuenta de " + service + " fue reparada. Revisa soporte." };
          if (st === "Rechazado") return { title: "❌ Reporte rechazado" + code, body: "Revisa la respuesta del equipo en soporte." };
          return { title: "💬 Respuesta del equipo" + code, body: "Hay novedades sobre " + service };
        }
        if (row.client_reply) return null; // respuesta del propio cliente: no notificar
        if (st && st !== "Abierto") return { title: "🔄 Reporte " + st.toLowerCase() + code, body: service };
        return null;
      }
      // Admin: cliente respondió a un reporte abierto
      if (isAdmin && row.client_reply && st && st !== "Resuelto" && st !== "Rechazado") {
        return { title: "💬 El cliente respondió" + code, body: (row.client_name || "El cliente") + " agregó info sobre " + service };
      }
      return null;
    }
    return null;
  }

  function handleEvent(eventType, payload) {
    try {
      const row = payload && (payload.new || payload.old);
      if (!row) return;
      log(eventType, row.id, row.status || "");
      // Handler personalizado de la app (actualizar state + UI)
      if (typeof window.onRealtimeReport === "function") {
        try { window.onRealtimeReport(row, eventType); } catch (e) { log("onRealtimeReport error:", e); }
      }
      // Notificación (dedup por throttle)
      const prev = lastEventAt;
      const desc = describeRow(row, eventType);
      if (desc) {
        if (!isDuplicateEvent() || Date.now() - prev > EVENT_THROTTLE_MS) {
          showToastNotification(desc.title, desc.body);
        }
      }
    } catch (e) {
      log("handleEvent error:", e);
    }
  }

  // ---------- Suscripción Realtime ----------
  async function subscribe(cfg) {
    if (client && typeof client.removeAllChannels === "function") {
      try { await client.removeAllChannels(); } catch (_) {}
    }
    client = window.supabase.createClient(cfg.url, cfg.anonKey, {
      realtime: { params: { eventsPerSecond: 5 } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Re-adjuntar el JWT del usuario (en memoria) para que Realtime evalúe
    // RLS como el usuario logueado y no como anon.
    try {
      const jwt = (appState() && appState().sessionToken) || "";
      if (jwt) await client.realtime.setAuth(jwt);
    } catch (e) { log("setAuth falló (seguirá como anon):", e && e.message); }

    channel = client
      .channel("reports-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: cfg.table },
        (payload) => handleEvent(payload.eventType || payload.type, payload)
      )
      .subscribe((status, err) => {
        log("status:", status);
        if (status === "SUBSCRIBED") {
          started = true;
          reconnectDelay = 3000;
          pollMs = POLL_MS_REALTIME_OK;
          setIndicator(true);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          started = false;
          setIndicator(false);
          scheduleReconnect();
        }
        if (err) log("subscribe error:", err);
      });
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    if (!appUser()) return; // sesión cerrada: no reconectar
    reconnectTimer = setTimeout(async () => {
      reconnectTimer = null;
      const cfg = realtimeConfig();
      if (!cfg) return;
      try { await subscribe(cfg); } catch (e) { log("reconnect falló:", e && e.message); scheduleReconnect(); }
    }, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 60000);
  }

  // ---------- Fallback: polling ligero ----------
  // Si Realtime no está disponible (edge antiguo, sin migración, red que
  // bloquea websockets), un poll de bootstrap cada 1-2 min mantiene las
  // notificaciones "casi en vivo". boot() ya maneja el render.
  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(async () => {
      if (!appUser()) return;
      if (typeof window.boot !== "function") return;
      try {
        const before = reportsSignature();
        await window.boot();
        const after = reportsSignature();
        if (before && after && before !== after) {
          log("poll detectó cambios en reports");
        }
      } catch (_) { /* silencio: boot ya maneja errores de sesión */ }
    }, pollMs);
    log("polling cada", pollMs, "ms");
  }

  // ---------- Indicador opcional de conexión ----------
  function setIndicator(connected) {
    try {
      const dot = document.getElementById("rtDot");
      if (dot) dot.style.background = connected ? "#10b981" : "#f59e0b";
    } catch (_) {}
  }

  // ---------- API pública ----------
  window.startReportsRealtime = async function startReportsRealtime() {
    const me = appUser();
    if (!me) return;
    if (started || channel) return;
    const cfg = realtimeConfig();
    if (!cfg) {
      log("sin config realtime (edge desplegado con versión anterior?): polling fallback");
      startPolling();
      return;
    }
    try {
      await loadSupabaseJs();
      await subscribe(cfg);
      startPolling(); // red de seguridad silenciosa
    } catch (e) {
      log("no se pudo iniciar realtime:", e && e.message);
      startPolling();
    }
  };

  window.stopReportsRealtime = function stopReportsRealtime() {
    try {
      if (channel) { try { channel.unsubscribe(); } catch (_) {} channel = null; }
      if (client && typeof client.removeAllChannels === "function") { try { client.removeAllChannels(); } catch (_) {} }
      client = null;
    } catch (_) {}
    started = false;
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    reconnectDelay = 3000;
    setIndicator(false);
    log("detenido");
  };

  // Al volver la pestaña a primer plano tras dormir el dispositivo,
  // verificar que el socket siga vivo; si no, reconectar de inmediato.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    if (!appUser() || !started) return;
    if (client && client.realtime && typeof client.realtime.isConnected === "function" && !client.realtime.isConnected()) {
      log("socket muerto tras sleep: reconectando");
      scheduleReconnect();
    }
  });

  log("módulo cargado");
})();
