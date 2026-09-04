import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Libreria Web Push (RFC 8030/8291) para Deno/Supabase Edge Functions.
// IMPORTANTE para el deploy: el CLI de Supabase resuelve los imports de JSR
// automaticamente al desplegar (funciona igual que esm.sh).
import * as webpush from "jsr:@negrel/webpush@0.5.0";

// Origenes que pueden usar credenciales (cookies httpOnly).
// El sitio vive en Vercel y se sirve desde CUALQUIER alias del proyecto
// (dominio canonico, deployments y previews: distrito-streaming-vercel-<x>.vercel.app).
// No aceptamos orígenes arbitrarios: solo el listado exacto, los *.vercel.app
// de ESTE proyecto (regex estricta) y localhost para desarrollo.
const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
]);

// Ej: https://distrito-streaming-vercel-ashen.vercel.app (canonico),
//     https://distrito-streaming-vercel-u1vnf87fe.vercel.app (deployment).
const VERCEL_ORIGIN_RE = /^https:\/\/distrito-streaming-vercel-[a-z0-9]+\.vercel\.app$/;

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.has(origin) || VERCEL_ORIGIN_RE.test(origin);
}

// Para el control CSRF de mutaciones se acepta CUALQUIER subdominio
// *.vercel.app (el proyecto se sirve desde alias, deployments y previews que
// cambian) + null (extensiones/privacidad) + localhost en cualquier puerto +
// ausencia de Origin (curl/APIs). Los orígenes web ajenos (sitios maliciosos
// NO alojados en vercel.app) siguen rechazados: con la cookie SameSite=Lax de
// primera parte, ese rechazo es defensa adicional contra CSRF.
function csrfOriginAllowed(origin: string): boolean {
  if (!origin || origin === "null") return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin);
}

function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  if (isAllowedOrigin(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-distrito-session",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
      "Vary": "Origin",
    };
  }
  // Sin credenciales: permitir cualquier origen (curl, integraciones, etc.)
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-distrito-session",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  };
}

// Lee una cookie del request (la sesion viaja en `ds_token` httpOnly).
function getCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const kv = part.trim();
    const idx = kv.indexOf("=");
    if (idx > 0 && kv.slice(0, idx).trim() === name) {
      try { return decodeURIComponent(kv.slice(idx + 1)); } catch { return kv.slice(idx + 1); }
    }
  }
  return null;
}

const ALLOWED_TABLES = new Set(["products", "inventory", "orders", "reports", "topups", "ads", "settings", "profiles", "users"]);

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req), "Content-Type": "application/json" },
  });
}

function error(req: Request, msg: string, status = 400) {
  return json(req, { error: msg }, status);
}

function randomCode(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ─── Rate limiting (en memoria) ───
// Nota: el estado vive por instancia de la edge function, asi que no es un
// limite global estricto entre instancias. Para proteccion total usa Redis
// (Upstash) con la IP como clave; esto ya frena el abuso masivo en la practica.
const rateLimitHits = new Map<string, number[]>();

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

function isRateLimited(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (rateLimitHits.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= maxAttempts) {
    rateLimitHits.set(key, recent);
    return true;
  }
  recent.push(now);
  rateLimitHits.set(key, recent);
  // Limpieza basica para que el Map no crezca sin limite
  if (rateLimitHits.size > 5000) {
    for (const [k, times] of rateLimitHits) {
      if (now - times[times.length - 1] > 60 * 60 * 1000) rateLimitHits.delete(k);
    }
  }
  return false;
}

function rateLimited(req: Request) {
  return json(req, { error: "Demasiados intentos. Espera unos minutos y vuelve a intentar." }, 429);
}

// Error generico de base de datos: registra el detalle en los logs de la
// funcion y devuelve un mensaje generico al cliente (sin filtrar detalles
// internos ni errores crudos de Postgres/Supabase).
function dbError(req: Request, context: string, err: unknown) {
  console.error("[db:" + context + "]", err && typeof err === "object" && "message" in err ? (err as any).message : String(err));
  return error(req, "No se pudo completar la operacion. Intenta de nuevo.", 400);
}

async function audit(supabase, userId, action, tableName, recordId, details = null) {
  try {
    await supabase.from("audit_log").insert({
      user_id: userId,
      action,
      table_name: tableName,
      record_id: recordId ? String(recordId) : null,
      details: details || null,
    });
  } catch (_) {
    // La auditoria no debe romper la operacion principal
  }
}

// ─── Notificaciones push (Web Push, RFC 8030/8291) ───
// Claves VAPID en secrets de la funcion: VAPID_PUBLIC_JWK / VAPID_PRIVATE_JWK
// (JWK JSON generadas con la herramienta de la carpeta supabase/) y
// VAPID_SUBJECT (mailto de contacto). Si faltan, la API sigue funcionando y
// solo se desactiva el envío (sin romper nada).
let _pushApp: Awaited<ReturnType<typeof webpush.ApplicationServer.new>> | null = null;
let _pushAppKey: string | null = null;
let _pushInitError: string | null = null;

async function pushInit() {
  if (_pushApp) return _pushApp;
  const pub = Deno.env.get("VAPID_PUBLIC_JWK");
  const priv = Deno.env.get("VAPID_PRIVATE_JWK");
  if (!pub || !priv) {
    _pushInitError = "VAPID keys no configuradas (VAPID_PUBLIC_JWK/VAPID_PRIVATE_JWK)";
    console.warn("[push]", _pushInitError);
    return null;
  }
  try {
    const vapidKeys = await webpush.importVapidKeys(
      { publicKey: JSON.parse(pub), privateKey: JSON.parse(priv) },
      { extractable: false }
    );
    _pushApp = await webpush.ApplicationServer.new({
      vapidKeys,
      contactInformation: Deno.env.get("VAPID_SUBJECT") || "mailto:admin@distrito.com",
    });
    _pushAppKey = await webpush.exportApplicationServerKey(vapidKeys);
    console.log("[push] Web Push listo (VAPID ok)");
    return _pushApp;
  } catch (e) {
    _pushInitError = e && (e as any).message ? String((e as any).message) : String(e);
    console.error("[push] init fallo:", e);
    return null;
  }
}

// Lanza un push en segundo plano. En Supabase Edge Runtime hay que usar
// EdgeRuntime.waitUntil para que el envío no se cancele al responder la petición.
function firePush(promise: Promise<void>) {
  try {
    const rt = (globalThis as any).EdgeRuntime;
    if (rt && typeof rt.waitUntil === "function") rt.waitUntil(promise);
    else promise.catch(() => {});
  } catch { promise.catch(() => {}); }
}

// Envia una notificacion push a TODAS las suscripciones de una lista de usuarios.
// Fire-and-forget: nunca debe romper ni ralentizar la operacion principal.
async function pushToUsers(supabase: any, userIds: string[], payload: { title: string; body: string; icon?: string; tag?: string; view?: string }) {
  try {
    const app = await pushInit();
    if (!app || !userIds.length) return;
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", userIds);
    if (!subs || !subs.length) return;
    const body = JSON.stringify(payload);
    for (const s of subs) {
      try {
        const sub = app.subscribe({
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        } as any);
        await sub.pushTextMessage(body, { ttl: 60 * 60 * 24, urgency: webpush.Urgency.High });
      } catch (e: any) {
        // 404/410 = suscripcion muerta: limpiarla para no reintentar siempre
        if (e && typeof e.isGone === "function") {
          try { await supabase.from("push_subscriptions").delete().eq("id", s.id); } catch (_) {}
        }
      }
    }
  } catch (e) {
    console.error("[push] pushToUsers fallo:", e);
  }
}

async function pushToAdmins(supabase: any, payload: { title: string; body: string; icon?: string; tag?: string; view?: string }) {
  try {
    const { data: admins } = await supabase.from("profiles").select("id").eq("role", "Administrador");
    if (!admins || !admins.length) return;
    await pushToUsers(supabase, admins.map((a: any) => a.id), payload);
  } catch (_) {}
}

Deno.serve(async (req) => {
  try {
  const url = new URL(req.url);
  let segs = url.pathname.split("/").filter(Boolean);
  if (segs[0] === "functions" && segs[1] === "v1") segs = segs.slice(3);
  else if (segs[0] === "distrito-api") segs = segs.slice(1);
  let path = segs.join("/");
  const method = req.method;

  if (method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeadersFor(req) });
  // CSRF: con cookies, solo aceptamos mutaciones desde origenes conocidos.
  // Los navegadores siempre envian Origin en POST cross-site; curl/APIs no lo
  // envian y se permiten (no llevan cookies de navegador). La cookie de sesion
  // ahora es de primera parte (SameSite=Lax, dominio del sitio via proxy /api),
  // asi que el bloqueo por Origin es defensa adicional, no la unica barrera.
  // Se tolera Origin "null" (alguna extension/privacidad/navegador lo envia) y
  // localhost en cualquier puerto (desarrollo); los origenes web extranos
  // (ej. un sitio malicioso) siguen rechazados.
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const origin = req.headers.get("origin") || "";
    if (!csrfOriginAllowed(origin)) {
      console.warn("[csrf] origen no permitido:", origin);
      return error(req, "Origen no permitido", 403);
    }
  }
  if (path === "health" && method === "GET") return json(req, { ok: true }, 200);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Sesion: cabecera x-distrito-session (compatibilidad) o cookie httpOnly ds_token
  const token = req.headers.get("x-distrito-session") || getCookie(req, "ds_token") || "";
  let authUser = null;
  if (token) {
    const { data: au, error: auErr } = await supabase.auth.getUser(token);
    if (!auErr && au && au.user) authUser = au.user;
  }

  // REGISTER
  if (path === "register" && method === "POST") {
    if (isRateLimited("register:" + getClientIp(req), 5, 15 * 60 * 1000)) return rateLimited(req);
    let body: any; try { body = await req.json(); } catch { return error(req, "JSON invalido"); }
    const { name, email, phone, password, referrer_id } = body;
    if (!name || !email || !password) return error(req, "name, email y password son requeridos");
    if (String(password).length < 8) return error(req, "La contrasena debe tener al menos 8 caracteres");
    const { data: existing } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
    if (existing) return error(req, "Ya existe una cuenta con este correo");
    // SEGURIDAD: el registro publico SIEMPRE crea un Cliente. El campo `role`
    // del body se ignora a proposito (antes cualquier persona podia enviar
    // role:"Administrador" y obtener una cuenta admin via ?ref=admin_XXX).
    // Los roles solo los asigna un administrador desde el panel (/users).
    const roleNorm = "Cliente";
    // admin.createUser (con email_confirm) no envia email y no dispara el rate limit de SMTP
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr) return dbError(req, "create-user", createErr);
    const authId = created?.user?.id;
    if (!authId) return error(req, "No se pudo crear el usuario en Supabase Auth");
    // upsert para tolerar el trigger handle_new_user que ya inserta el perfil
    const { error: profileErr } = await supabase.from("profiles").upsert({
      id: authId,
      name,
      email,
      phone: phone || null,
      role: roleNorm,
      balance: 0,
      margin: 100,
      status: "Activo",
      referrer_id: referrer_id || null,
    }, { onConflict: "id" });
    if (profileErr) return dbError(req, "create-profile", profileErr);
    await audit(supabase, authId, "register", "profiles", authId, { email, role: roleNorm, referrer_id: referrer_id || null });
    return json(req, { ok: true, id: authId }, 201);
  }

  // CHECK-USER-STATUS (no lo usa el frontend; ya no revela si el correo existe)
  if (path === "check-user-status" && method === "POST") {
    if (isRateLimited("status:" + getClientIp(req), 30, 15 * 60 * 1000)) return rateLimited(req);
    let body: any; try { body = await req.json(); } catch { return error(req, "JSON invalido"); }
    const { email } = body;
    if (!email) return error(req, "email requerido");
    const { data: profile } = await supabase.from("profiles").select("status").eq("email", email).maybeSingle();
    if (!profile) return json(req, { blocked: false }, 200);
    return json(req, {
      blocked: profile.status === "Bloqueado" || profile.status === "Inactivo",
      status: profile.status,
    }, 200);
  }

  // FORGOT-PASSWORD — recuperación ASISTIDA por el administrador (sin correo SMTP)
  // El proyecto no tiene proveedor de email, así que aquí NO se envía ningún
  // enlace: se registra la solicitud (audit) para que un administrador genere la
  // clave nueva desde el panel (Usuarios -> Clave) y se la entregue al usuario
  // por WhatsApp/teléfono. Siempre responde ok (anti-enumeración).
  if (path === "forgot-password" && method === "POST") {
    if (isRateLimited("forgot:" + getClientIp(req), 5, 15 * 60 * 1000)) return rateLimited(req);
    let body: any; try { body = await req.json(); } catch { return error(req, "JSON invalido"); }
    const { email } = body;
    if (!email) return error(req, "email requerido");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email))) return error(req, "El formato del correo es invalido. Ejemplo: nombre@dominio.com");
    const { data: existing } = await supabase.from("profiles").select("id, email").eq("email", String(email).trim()).maybeSingle();
    if (existing) {
      await audit(supabase, existing.id, "password_reset_request", "profiles", existing.id, {
        email: existing.email,
        ip: getClientIp(req),
        via: "administrador-whatsapp",
      });
    }
    return json(req, { ok: true }, 200);
  }

  // RESET-PASSWORD
  if (path === "reset-password" && method === "POST") {
    let body: any; try { body = await req.json(); } catch { return error(req, "JSON invalido"); }
    const { token, password } = body;
    if (!token || !password) return error(req, "token y password son requeridos");
    if (String(password).length < 8) return error(req, "La contrasena debe tener al menos 8 caracteres");
    const { error: updErr } = await supabase.auth.updateUser(token, { password });
    if (updErr) return dbError(req, "reset-password", updErr);
    return json(req, { ok: true }, 200);
  }

  // LOGOUT (limpia la cookie httpOnly de sesion)
  if (path === "logout" && method === "POST") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        ...corsHeadersFor(req),
        "Content-Type": "application/json",
        "Set-Cookie": "ds_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
      },
    });
  }

  // LOGIN
  if (path === "login" && method === "POST") {
    if (isRateLimited("login:" + getClientIp(req), 15, 5 * 60 * 1000)) return rateLimited(req);
    let body: any; try { body = await req.json(); } catch { return error(req, "JSON invalido"); }
    const { email, password } = body;

    // Validacion de campos vacios
    if (!email && !password) return json(req, { error: "Ingresa tu correo y tu contrasena.", field: "all" }, 400);
    if (!email) return json(req, { error: "Ingresa tu correo electronico.", field: "email" }, 400);
    if (!password) return json(req, { error: "Ingresa tu contrasena.", field: "password" }, 400);

    // Validacion de formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return json(req, { error: "El formato del correo es invalido. Ejemplo: nombre@dominio.com", field: "email" }, 400);

    // Verificar si el correo existe en la base
    const { data: existingUser } = await supabase.from("profiles").select("id, email, status").eq("email", email).maybeSingle();
    if (!existingUser) {
      // No revelar si el correo existe (anti-enumeracion): mismo mensaje generico
      return json(req, { error: "Correo o contrasena incorrectos.", field: "all" }, 400);
    }

    // Verificar si la cuenta esta bloqueada/inactiva ANTES de validar la contrasena
    if (existingUser.status === "Bloqueado" || existingUser.status === "Inactivo") {
      return json(req, { error: "Tu cuenta ha sido bloqueada por un administrador.", blocked: true, status: existingUser.status }, 403);
    }

    const { data: sessionData, error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
    if (loginErr) {
      const msg = (loginErr.message || "").toLowerCase();
      if (msg.includes("blocked") || msg.includes("disabled") || msg.includes("banned")) {
        return json(req, { error: "Tu cuenta ha sido bloqueada por un administrador.", blocked: true }, 403);
      }
      if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials") || msg.includes("password") || msg.includes("wrong")) {
        return json(req, { error: "Correo o contrasena incorrectos.", field: "all" }, 400);
      }
      return json(req, { error: "Correo o contrasena incorrectos.", field: "all" }, 400);
    }

    const authId = sessionData?.user?.id;
    const accessToken = sessionData?.session?.access_token;
    const { data: profile, error: profileErr } = await supabase.from("profiles").select("*").eq("id", authId).maybeSingle();
    if (profileErr || !profile) return error(req, "No se encontro el perfil del usuario");
    if (profile.status === "Bloqueado" || profile.status === "Inactivo") {
      return json(req, { error: "Tu cuenta ha sido bloqueada por un administrador.", blocked: true, status: profile.status }, 403);
    }
    // Sesion en cookie httpOnly (ademas de devolver el token para compatibilidad)
    return new Response(JSON.stringify({ token: accessToken, user: profile }), {
      status: 200,
      headers: {
        ...corsHeadersFor(req),
        "Content-Type": "application/json",
        // Cookie de sesion de PRIMERA PARTE: el navegador solo habla con /api/*
        // del propio dominio (proxy en Vercel), asi que SameSite=Lax es seguro
        // y ademas blinda contra CSRF desde otros sitios.
        "Set-Cookie": "ds_token=" + accessToken + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000",
      },
    });
  }

  // BOOTSTRAP
  if (path === "bootstrap" && (method === "GET" || method === "POST")) {
    if (!authUser) return error(req, "No autorizado", 401);
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
    if (!profile) return error(req, "Sesion invalida");
    if (profile.status === "Bloqueado" || profile.status === "Inactivo") return json(req, { error: "Tu cuenta ha sido bloqueada por un administrador.", blocked: true, status: profile.status }, 403);
    const isAdmin = profile.role === "Administrador";
    // SEGURIDAD: los no-admins solo ven sus propios pedidos/reportes/recargas.
    // Antes /bootstrap devolvia TODAS las filas (incluidas las credenciales
    // delivered_data de otros clientes) a cualquier usuario logueado, porque
    // la service_role key salta las politicas RLS.
    const scopedOrders = isAdmin
      ? supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(1000)
      : supabase.from("orders").select("*").eq("user_id", authUser.id).order("created_at", { ascending: false }).limit(1000);
    const scopedReports = isAdmin
      ? supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(500)
      : supabase.from("reports").select("*").eq("user_id", authUser.id).order("created_at", { ascending: false }).limit(500);
    const scopedTopups = isAdmin
      ? supabase.from("topups").select("*").order("created_at", { ascending: false }).limit(500)
      : supabase.from("topups").select("*").eq("user_id", authUser.id).order("created_at", { ascending: false }).limit(500);
    const [pRes, oRes, rRes, tRes, aRes, sRes, uRes, iRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: true }).limit(1000),
      scopedOrders,
      scopedReports,
      scopedTopups,
      supabase.from("ads").select("*").order("created_at", { ascending: true }).limit(500),
      supabase.from("settings").select("*").limit(100),
      isAdmin ? supabase.from("profiles").select("*").limit(1000) : Promise.resolve({ data: [], error: null }),
      isAdmin ? supabase.from("inventory").select("*").limit(1000) : Promise.resolve({ data: [], error: null }),
    ]);
    const settingsMap = {};
    for (const row of (sRes.data || [])) settingsMap[row.key] = row.value;
    return json(req, {
      user: profile,
      products: pRes.data || [],
      orders: oRes.data || [],
      reports: rRes.data || [],
      topups: tRes.data || [],
      ads: aRes.data || [],
      users: uRes.data || [],
      inventory: iRes.data || [],
      settings: settingsMap,
      notifications: [],
    }, 200);
  }

  // AUDIT-LOG (solo admin: ver trazabilidad de acciones)
  if (path === "audit-log" && method === "GET") {
    if (!authUser) return error(req, "No autorizado", 401);
    const { data: prof } = await supabase.from("profiles").select("role").eq("id", authUser.id).maybeSingle();
    if (!prof || prof.role !== "Administrador") return error(req, "Solo administradores", 403);
    const { data: rows } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(500);
    return json(req, rows || [], 200);
  }

  // PUSH: clave publica VAPID (para que el frontend pueda suscribirse)
  if (path === "push/vapid-key" && method === "GET") {
    const app = await pushInit();
    if (!app || !_pushAppKey) return json(req, { ok: false, error: "push no configurado" }, 503);
    return json(req, { publicKey: _pushAppKey }, 200);
  }
  // PUSH: registrar suscripcion del usuario logueado
  if (path === "push/subscribe" && method === "POST") {
    if (!authUser) return error(req, "No autorizado", 401);
    let body: any; try { body = await req.json(); } catch { return error(req, "JSON invalido"); }
    const endpoint = String(body.endpoint || "");
    const p256dh = String(body.p256dh || (body.keys && body.keys.p256dh) || "");
    const auth = String(body.auth || (body.keys && body.keys.auth) || "");
    if (!endpoint || !p256dh || !auth) return error(req, "Suscripcion incompleta");
    // Un solo endpoint por usuario: si ya existe otra fila con este endpoint
    // (por ejemplo de un usuario previo en el mismo navegador), se reasigna.
    const { error: delErr } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    if (delErr) return dbError(req, "push-del", delErr);
    const { error: insErr } = await supabase.from("push_subscriptions").insert({
      user_id: authUser.id,
      endpoint,
      p256dh,
      auth,
      user_agent: (req.headers.get("user-agent") || "").slice(0, 300),
    });
    if (insErr) return dbError(req, "push-sub", insErr);
    return json(req, { ok: true }, 201);
  }
  // PUSH: eliminar suscripcion
  if (path === "push/unsubscribe" && method === "POST") {
    if (!authUser) return error(req, "No autorizado", 401);
    let body: any; try { body = await req.json(); } catch { return error(req, "JSON invalido"); }
    const endpoint = String(body.endpoint || "");
    if (!endpoint) return error(req, "endpoint requerido");
    const { error: delErr } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", authUser.id);
    if (delErr) return dbError(req, "push-unsub", delErr);
    return json(req, { ok: true }, 200);
  }
  // PUSH: notificacion de prueba al propio usuario
  if (path === "push/test" && method === "POST") {
    if (!authUser) return error(req, "No autorizado", 401);
    firePush(pushToUsers(supabase, [authUser.id], {
      title: "🔔 Distrito Streaming",
      body: "¡Notificaciones activadas! Recibirás avisos de recargas, reportes y ventas aquí.",
      tag: "push-test",
    }));
    return json(req, { ok: true }, 200);
  }

  // BUY (atomico: un solo UPDATE reclama el inventario con guarda de estado)
  if (path === "buy" && method === "POST") {
    if (!authUser) return error(req, "No autorizado", 401);
    let body: any; try { body = await req.json(); } catch { return error(req, "JSON invalido"); }
    const { data: profile, error: profileErr } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
    if (profileErr || !profile) return error(req, "Sesion invalida");
    if (profile.status === "Bloqueado" || profile.status === "Inactivo") return error(req, "Tu cuenta ha sido bloqueada por un administrador.", 403);
    const productId = body.product_id;
    const quantity = Math.max(1, Math.min(10, Number(body.quantity || 1)));
    const { data: product } = await supabase.from("products").select("*").eq("id", productId).maybeSingle();
    if (!product) return error(req, "Producto no encontrado");
    if (product.status !== "Activo") return error(req, "Producto no disponible");
    if (Number(product.stock || 0) < quantity) return error(req, "Stock insuficiente");
    const base = Number(product.provider_price ?? product.base_price ?? 0);
    const margin = Number(profile.margin ?? 0);
    const isAdmin = profile.role === "Administrador";
    const price = isAdmin ? Number(product.base_price ?? base) : base + Math.max(0, margin);
    const total = price * quantity;
    const balanceBefore = Number(profile.balance || 0);
    if (!isAdmin && balanceBefore < total) return error(req, "Saldo insuficiente");

    // 1) CLAIM ATOMICO cuenta por cuenta (CAS): se selecciona 1 fila Disponible
    //    y se actualiza solo si SIGUE Disponible (.eq status). Si dos compradores
    //    eligen la misma cuenta, solo uno gana el UPDATE; el otro reintenta con
    //    la siguiente. Asi nunca se entrega dos veces la misma cuenta (PostgREST
    //    no respeta LIMIT en UPDATE, por eso el claim es por fila).
    const taken: any[] = [];
    const seen = new Set<string>();
    const maxAttempts = quantity + 3;
    for (let attempt = 0; attempt < maxAttempts && taken.length < quantity; attempt++) {
      const { data: cand } = await supabase
        .from("inventory")
        .select("id")
        .eq("product_id", productId)
        .eq("status", "Disponible")
        .order("created_at", { ascending: true })
        .limit(1);
      const row = cand && cand[0];
      if (!row || seen.has(row.id)) break;
      seen.add(row.id);
      const { data: upd, error: updErr } = await supabase
        .from("inventory")
        .update({
          status: "Entregada",
          delivery_date: new Date().toISOString(),
          assigned_user_id: authUser.id,
        })
        .eq("id", row.id)
        .eq("status", "Disponible")
        .select("id, email, password, profile, pin, expiry_date")
        .maybeSingle();
      if (updErr) return dbError(req, "claim-inventory", updErr);
      if (upd) taken.push(upd);
    }
    if (taken.length < quantity) {
      // No alcanzaron las cuentas: devolver las tomadas a Disponible
      if (taken.length > 0) {
        await supabase.from("inventory").update({ status: "Disponible", delivery_date: null, assigned_user_id: null })
          .in("id", taken.map((a: any) => a.id));
      }
      return error(req, "No hay cuentas disponibles para este producto");
    }

    const release = () => supabase.from("inventory").update({ status: "Disponible", delivery_date: null, assigned_user_id: null })
      .in("id", taken.map((a: any) => a.id));

    try {
      // 2) Crear pedidos (1 fila por cuenta)
      const { data: orderInserts, error: orderErr } = await supabase.from("orders").insert(
        taken.map((acc: any) => ({
          user_id: authUser.id,
          product_id: productId,
          product_name: product.name,
          client_name: profile.name || profile.email,
          quantity: 1,
          amount: total,
          total: total,
          provider_price: base,
          delivered_data: [acc.email, acc.password, acc.profile, acc.pin].filter(Boolean).join(" | "),
          credentials: [acc.email, acc.password].filter(Boolean).join(" | "),
          status: "Entregado",
          code: randomCode("ORD"),
          expires_at: acc.expiry_date ? new Date(acc.expiry_date + "T00:00:00").toISOString() : null,
        }))
      ).select("id");
      if (orderErr) throw orderErr;

      // 3) Stock con guarda optimista (evita perdidas de actualizacion)
      const { data: stockRow } = await supabase.from("products").select("stock").eq("id", productId).maybeSingle();
      const stockFresh = Number(stockRow?.stock || 0);
      const { data: stockUpd, error: stockErr } = await supabase.from("products")
        .update({ stock: Math.max(0, stockFresh - taken.length) })
        .eq("id", productId)
        .eq("stock", stockFresh)
        .select("stock");
      if (stockErr) throw stockErr;
      if (!stockUpd || stockUpd.length === 0) throw new Error("stock-conflict");

      // 4) Saldo con guarda optimista (solo clientes/revendedores)
      if (!isAdmin) {
        const { data: balUpd, error: balErr } = await supabase.from("profiles")
          .update({ balance: balanceBefore - total })
          .eq("id", authUser.id)
          .eq("balance", balanceBefore)
          .select("balance");
        if (balErr) throw balErr;
        if (!balUpd || balUpd.length === 0) throw new Error("balance-conflict");
      }

      const finalOrders = (orderInserts || []).map((row, i) => {
        const acc = taken[i] || {};
        return { ...row, delivered_data: [acc.email, acc.password, acc.profile, acc.pin].filter(Boolean).join(" | ") };
      });
      const newBalance = isAdmin ? profile.balance : balanceBefore - total;
      return json(req, { orders: finalOrders, balance: newBalance }, 200);
    } catch (err) {
      // Cualquier fallo posterior al claim: liberar el inventario tomado
      await release();
      const msg = err && (err as any).message;
      if (msg === "balance-conflict") return error(req, "Tu saldo cambió. Intenta de nuevo.", 400);
      if (msg === "stock-conflict") return error(req, "El stock cambió. Intenta de nuevo.", 400);
      return error(req, "No se pudo completar la compra. Intenta de nuevo.", 400);
    }
  }

  // CRUD GENERICO
  if (ALLOWED_TABLES.has(path.split("/")[0]) && ["GET", "POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    if (!authUser) return error(req, "No autorizado", 401);
    const { data: profile, error: profErr } = await supabase.from("profiles").select("role, status, id, name, email").eq("id", authUser.id).maybeSingle();
    if (profErr || !profile) return error(req, "Sesion invalida");
    if (profile.status === "Bloqueado" || profile.status === "Inactivo") return error(req, "Tu cuenta ha sido bloqueada por un administrador.", 403);
    const table = path.split("/")[0];
    const resourceId = path.split("/")[1] || null;
    const isAdmin = profile.role === "Administrador";
    if (method === "GET") {
      if (!isAdmin) {
        if (["orders", "reports", "topups"].includes(table)) {
          const { data: rows } = await supabase.from(table).select("*").eq("user_id", authUser.id).limit(1000);
          return json(req, rows || [], 200);
        }
        return json(req, [], 200);
      }
      const { data: rows } = await supabase.from(table).select("*").limit(1000);
      return json(req, rows || [], 200);
    }
    let body: any = {};
    try { body = await req.json() || {}; } catch {}
    // users POST
    if (table === "users" && method === "POST") {
      if (!isAdmin) return error(req, "Solo administradores pueden crear usuarios", 403);
      const { name, email, password, role, balance, margin } = body;
      if (!name || !email || !password) return error(req, "name, email y password son requeridos");
      const { data: existing } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
      if (existing) return error(req, "Ya existe una cuenta con este correo");
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr) return dbError(req, "create-user", createErr);
      const authId = created?.user?.id;
      if (!authId) return error(req, "No se pudo crear el usuario");
      const roleNorm = role === "Administrador" ? "Administrador" : role === "Revendedor" ? "Revendedor" : "Cliente";
      // upsert para tolerar el trigger handle_new_user que ya inserta el perfil
      const { error: profileErr } = await supabase.from("profiles").upsert({
        id: authId,
        name,
        email,
        role: roleNorm,
        balance: Number(balance || 0),
        margin: Number(margin || 100),
        status: "Activo",
      }, { onConflict: "id" });
      if (profileErr) return dbError(req, "create-profile", profileErr);
      await audit(supabase, authUser.id, "user_create", "profiles", authId, { email, role: roleNorm, balance: Number(balance || 0) });
      return json(req, { ok: true, id: authId }, 201);
    }
    // users PATCH
    if (table === "users" && method === "PATCH") {
      if (!isAdmin) return error(req, "Solo administradores pueden editar usuarios", 403);
      const id = resourceId || body.id;
      if (!id) return error(req, "id requerido");
      // Un admin no puede cambiar su propio rol ni bloquearse a si mismo
      if (id === authUser.id && (body.role || body.status)) {
        return error(req, "No puedes cambiar tu propio rol o estado", 403);
      }
      const patch = { ...body };
      delete patch.id;
      delete patch.increment_copies;
      const hasPassword = patch.password !== undefined && patch.password !== null && patch.password !== "";
      const newPassword = patch.password;
      delete patch.password;
      if (hasPassword) {
        if (String(newPassword).length < 8) return error(req, "La contrasena debe tener al menos 8 caracteres");
        const { error: pwdErr } = await supabase.auth.admin.updateUserById(id, { password: newPassword });
        if (pwdErr) return dbError(req, "update-password", pwdErr);
        await audit(supabase, authUser.id, "user_password_reset", "profiles", id, {});
      }
      const { data, error: updErr } = await supabase.from("profiles").update(patch).eq("id", id);
      if (updErr) return dbError(req, "update", updErr);
      await audit(supabase, authUser.id, "user_update", "profiles", id, patch);
      return json(req, data || [], 200);
    }
    // users DELETE
    if (table === "users" && method === "DELETE") {
      if (!isAdmin) return error(req, "Solo administradores pueden eliminar usuarios", 403);
      const id = resourceId || body.id;
      if (!id) return error(req, "id requerido");
      if (id === authUser.id) return error(req, "No puedes eliminar tu propia cuenta", 403);
      await audit(supabase, authUser.id, "user_delete", "profiles", id);
      const { error: delErr } = await supabase.from("profiles").delete().eq("id", id);
      if (delErr) return dbError(req, "delete", delErr);
      return json(req, { ok: true }, 200);
    }
    // ads increment_copies
    if (table === "ads" && method === "PATCH" && body.increment_copies) {
      const { data: row } = await supabase.from("ads").select("copies").eq("id", body.id).maybeSingle();
      const copies = Number(row?.copies || 0) + 1;
      const { error: updErr } = await supabase.from("ads").update({ copies }).eq("id", body.id);
      if (updErr) return dbError(req, "update", updErr);
      return json(req, { ok: true }, 200);
    }
    // settings PUT
    if (table === "settings" && method === "PUT") {
      if (!isAdmin) return error(req, "Solo administradores pueden editar configuracion", 403);
      const { key, value } = body;
      if (!key) return error(req, "key requerido");
      const { data, error: upsertErr } = await supabase.from("settings").upsert({ key, value, updated_at: new Date().toISOString() }).select("*");
      if (upsertErr) return dbError(req, "settings", upsertErr);
      return json(req, data || [], 200);
    }
    // reports POST
    if (table === "reports" && method === "POST") {
      const { order_id, product_name, account_data, reason, description } = body;
      const { data: order } = await supabase.from("orders").select("*").eq("id", order_id || "").maybeSingle();
      if (order && !isAdmin && order.user_id !== authUser.id) return error(req, "No autorizado", 403);
      const { data, error: insErr } = await supabase.from("reports").insert({
        user_id: authUser.id,
        order_id: order_id || null,
        product_name: product_name || order?.product_name || null,
        client_name: profile.name || profile.email || null,
        account_data: account_data || null,
        reason: reason || null,
        description: description || null,
        status: "Abierto",
      }).select("*");
      if (insErr) return dbError(req, "insert", insErr);
      // Avisar a los administradores: hay un nuevo reporte por atender
      firePush(pushToAdmins(supabase, {
        title: "🚨 Nuevo reporte",
        body: `${profile.name || "Un usuario"} abrió un reporte${product_name ? " sobre " + product_name : ""}${reason ? " (" + reason + ")" : ""}.`,
        tag: "report-open",
        view: "reports",
      }));
      return json(req, data || [], 201);
    }
    // topups POST
    if (table === "topups" && method === "POST") {
      const { amount, method: payMethod, reference } = body;
      const { data, error: insErr } = await supabase.from("topups").insert({
        user_id: authUser.id,
        amount: Number(amount || 0),
        method: payMethod || "WhatsApp",
        reference: reference || null,
        status: "Pendiente",
      }).select("*");
      if (insErr) return dbError(req, "insert", insErr);
      // Avisar a los administradores: hay una recarga pendiente por aprobar
      firePush(pushToAdmins(supabase, {
        title: "💰 Recarga pendiente",
        body: `${profile.name || "Un usuario"} solicitó recargar $${Number(amount || 0).toLocaleString("es-CO")}. Revisa el panel de recargas.`,
        tag: "topup-pending",
        view: "payments",
      }));
      return json(req, data || [], 201);
    }
    // inventory POST
    if (table === "inventory" && method === "POST") {
      if (!isAdmin) return error(req, "Solo administradores pueden gestionar inventario", 403);
      const { data, error: insErr } = await supabase.from("inventory").insert({ ...body, status: body.status || "Disponible" }).select("*");
      if (insErr) return dbError(req, "insert", insErr);
      return json(req, data || [], 201);
    }
    // inventory PATCH
    if (table === "inventory" && method === "PATCH") {
      if (!isAdmin) return error(req, "Solo administradores pueden editar inventario", 403);
      const id = resourceId || body.id;
      if (!id) return error(req, "id requerido");
      const patch = { ...body };
      delete patch.id;
      const { data, error: updErr } = await supabase.from("inventory").update(patch).eq("id", id);
      if (updErr) return dbError(req, "update", updErr);
      return json(req, data || [], 200);
    }
    // inventory DELETE
    if (table === "inventory" && method === "DELETE") {
      if (!isAdmin) return error(req, "Solo administradores pueden eliminar cuentas", 403);
      const id = resourceId || body.id;
      if (!id) return error(req, "id requerido");
      const { error: delErr } = await supabase.from("inventory").delete().eq("id", id);
      if (delErr) return dbError(req, "delete", delErr);
      return json(req, { ok: true }, 200);
    }
    // products POST
    if (table === "products" && method === "POST") {
      if (!isAdmin) return error(req, "Solo administradores pueden gestionar productos", 403);
      const { data, error: insErr } = await supabase.from("products").insert({ ...body, status: body.status || "Activo" }).select("*");
      if (insErr) return dbError(req, "insert", insErr);
      return json(req, data || [], 201);
    }
    // products PATCH
    if (table === "products" && method === "PATCH") {
      if (!isAdmin) return error(req, "Solo administradores pueden editar productos", 403);
      const id = resourceId || body.id;
      if (!id) return error(req, "id requerido");
      const patch = { ...body };
      delete patch.id;
      const { data, error: updErr } = await supabase.from("products").update(patch).eq("id", id);
      if (updErr) return dbError(req, "update", updErr);
      return json(req, data || [], 200);
    }
    // products DELETE
    if (table === "products" && method === "DELETE") {
      if (!isAdmin) return error(req, "Solo administradores pueden eliminar productos", 403);
      const id = resourceId || body.id;
      if (!id) return error(req, "id requerido");
      const { error: delErr } = await supabase.from("products").delete().eq("id", id);
      if (delErr) return dbError(req, "delete", delErr);
      return json(req, { ok: true }, 200);
    }
    // reports PATCH
    if (table === "reports" && method === "PATCH") {
      if (!isAdmin) return error(req, "Solo administradores pueden actualizar reportes", 403);
      const id = resourceId || body.id;
      if (!id) return error(req, "id requerido");
      const patch = { ...body };
      delete patch.id;
      await audit(supabase, authUser.id, "report_update", "reports", id, patch);
      const { data: report } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
      const statusChanged = report && patch.status && patch.status !== report.status;
      const { data, error: updErr } = await supabase.from("reports").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
      if (updErr) return dbError(req, "update", updErr);
      // Si un reporte fue resuelto/rechazado, avisar al usuario que lo creó
      if (report && report.user_id && statusChanged && (patch.status === "Resuelto" || patch.status === "Rechazado")) {
        firePush(pushToUsers(supabase, [report.user_id], {
          title: patch.status === "Resuelto" ? "✅ Reporte resuelto" : "ℹ️ Reporte cerrado",
          body: `Tu reporte${report.product_name ? " de " + report.product_name : ""} fue ${patch.status === "Resuelto" ? "resuelto" : "cerrado"}${patch.solution ? ". " + String(patch.solution).slice(0, 140) : ""}.`,
          tag: "report-" + patch.status.toLowerCase(),
          view: "",
        }));
      }
      return json(req, data || [], 200);
    }
    // reports DELETE
    if (table === "reports" && method === "DELETE") {
      if (!isAdmin) return error(req, "Solo administradores pueden eliminar reportes", 403);
      const id = resourceId || body.id;
      if (!id) return error(req, "id requerido");
      const { error: delErr } = await supabase.from("reports").delete().eq("id", id);
      if (delErr) return dbError(req, "delete", delErr);
      return json(req, { ok: true }, 200);
    }
    // topups PATCH
    if (table === "topups" && method === "PATCH") {
      if (!isAdmin) return error(req, "Solo administradores pueden aprobar recargas", 403);
      const id = resourceId || body.id;
      if (!id) return error(req, "id requerido");
      const patch = { ...body };
      delete patch.id;
      const { data: row } = await supabase.from("topups").select("*").eq("id", id).maybeSingle();
      if (!row) return error(req, "Recarga no encontrada", 404);
      await audit(supabase, authUser.id, "topup_update", "topups", id, { status: patch.status, amount: row.amount, user_id: row.user_id });
      const statusChanged = patch.status && patch.status !== row.status;
      if (patch.status === "Aprobada") {
        const { data: owner } = await supabase.from("profiles").select("balance, role").eq("id", row.user_id).maybeSingle();
        const newBal = Number(owner?.balance ?? 0) + Number(row.amount || 0);
        const { error: balErr } = await supabase.from("profiles").update({ balance: newBal }).eq("id", row.user_id);
        if (balErr) return dbError(req, "balance", balErr);
        // Avisar al dueño: su recarga fue aprobada y el saldo ya está disponible
        if (statusChanged) {
          firePush(pushToUsers(supabase, [row.user_id], {
            title: "✅ Recarga aprobada",
            body: `¡Tu recarga de $${Number(row.amount || 0).toLocaleString("es-CO")} fue aprobada! Ya está disponible en tu saldo.`,
            tag: "topup-approved",
            view: owner?.role === "Administrador" ? "payments" : "",
          }));
        }
      } else if (patch.status === "Rechazada" && statusChanged) {
        firePush(pushToUsers(supabase, [row.user_id], {
          title: "❌ Recarga rechazada",
          body: `Tu recarga de $${Number(row.amount || 0).toLocaleString("es-CO")} fue rechazada. Si crees que es un error, contacta al administrador.`,
          tag: "topup-rejected",
          view: "",
        }));
      }
      const { data, error: updErr } = await supabase.from("topups").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
      if (updErr) return dbError(req, "update", updErr);
      return json(req, data || [], 200);
    }
    // topups DELETE
    if (table === "topups" && method === "DELETE") {
      if (!isAdmin) return error(req, "Solo administradores pueden eliminar recargas", 403);
      const id = resourceId || body.id;
      if (!id) return error(req, "id requerido");
      const { error: delErr } = await supabase.from("topups").delete().eq("id", id);
      if (delErr) return dbError(req, "delete", delErr);
      return json(req, { ok: true }, 200);
    }
    // ads POST
    if (table === "ads" && method === "POST") {
      if (!isAdmin) return error(req, "Solo administradores pueden gestionar material", 403);
      const { data, error: insErr } = await supabase.from("ads").insert({ ...body, copies: 0 }).select("*");
      if (insErr) return dbError(req, "insert", insErr);
      return json(req, data || [], 201);
    }
    // ads PATCH
    if (table === "ads" && method === "PATCH") {
      if (!isAdmin) return error(req, "Solo administradores pueden editar material", 403);
      const id = resourceId || body.id;
      if (!id) return error(req, "id requerido");
      const patch = { ...body };
      delete patch.id;
      delete patch.increment_copies;
      const { data, error: updErr } = await supabase.from("ads").update(patch).eq("id", id);
      if (updErr) return dbError(req, "update", updErr);
      return json(req, data || [], 200);
    }
    // ads DELETE
    if (table === "ads" && method === "DELETE") {
      if (!isAdmin) return error(req, "Solo administradores pueden eliminar material", 403);
      const id = resourceId || body.id;
      if (!id) return error(req, "id requerido");
      const { error: delErr } = await supabase.from("ads").delete().eq("id", id);
      if (delErr) return dbError(req, "delete", delErr);
      return json(req, { ok: true }, 200);
    }
    // settings PATCH
    if (table === "settings" && method === "PATCH") {
      if (!isAdmin) return error(req, "Solo administradores pueden editar configuracion", 403);
      const { key, value } = body;
      if (!key) return error(req, "key requerido");
      const { data, error: updErr } = await supabase.from("settings").upsert({ key, value, updated_at: new Date().toISOString() }).select("*");
      if (updErr) return dbError(req, "update", updErr);
      return json(req, data || [], 200);
    }
    return error(req, "Ruta no encontrada: [" + path + "] method=" + method, 404);
  }
  return error(req, "Ruta no encontrada FINAL path=[" + path + "] method=" + method, 404);
  } catch (e) {
    return error(req, "EXCEPCION: " + (e && e.message ? e.message : String(e)), 500);
  }
});
