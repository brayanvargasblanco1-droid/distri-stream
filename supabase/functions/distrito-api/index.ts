import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-distrito-session",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
};

const ALLOWED_TABLES = new Set(["products", "inventory", "orders", "reports", "topups", "ads", "settings", "profiles", "users"]);

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function error(msg, status = 400) {
  return json({ error: msg }, status);
}

function randomCode(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
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

Deno.serve(async (req) => {
  try {
  const url = new URL(req.url);
  let segs = url.pathname.split("/").filter(Boolean);
  if (segs[0] === "functions" && segs[1] === "v1") segs = segs.slice(3);
  else if (segs[0] === "distrito-api") segs = segs.slice(1);
  let path = segs.join("/");
  const method = req.method;

  if (method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (path === "health" && method === "GET") return json({ ok: true }, 200);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const token = req.headers.get("x-distrito-session") || "";
  let authUser = null;
  if (token) {
    const { data: au, error: auErr } = await supabase.auth.getUser(token);
    if (!auErr && au && au.user) authUser = au.user;
  }

  // REGISTER
  if (path === "register" && method === "POST") {
    let body: any; try { body = await req.json(); } catch { return error("JSON invalido"); }
    const { name, email, phone, password, role, referrer_id } = body;
    if (!name || !email || !password) return error("name, email y password son requeridos");
    if (String(password).length < 6) return error("La contrasena debe tener al menos 6 caracteres");
    const { data: existing } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
    if (existing) return error("Ya existe una cuenta con este correo");
    const roleNorm = role === "Administrador" ? "Administrador" : role === "Revendedor" ? "Revendedor" : "Cliente";
    // admin.createUser (con email_confirm) no envia email y no dispara el rate limit de SMTP
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr) return error(createErr.message || "No se pudo crear la cuenta");
    const authId = created?.user?.id;
    if (!authId) return error("No se pudo crear el usuario en Supabase Auth");
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
    if (profileErr) return error("No se pudo crear el perfil: " + profileErr.message);
    await audit(supabase, authId, "register", "profiles", authId, { email, role: roleNorm, referrer_id: referrer_id || null });
    return json({ ok: true, id: authId }, 201);
  }

  // CHECK-USER-STATUS
  if (path === "check-user-status" && method === "POST") {
    let body: any; try { body = await req.json(); } catch { return error("JSON invalido"); }
    const { email } = body;
    if (!email) return error("email requerido");
    const { data: profile } = await supabase.from("profiles").select("status, email").eq("email", email).maybeSingle();
    if (!profile) return json({ exists: false }, 200);
    return json({
      exists: true,
      blocked: profile.status === "Bloqueado" || profile.status === "Inactivo",
      status: profile.status,
    }, 200);
  }

  // FORGOT-PASSWORD
  if (path === "forgot-password" && method === "POST") {
    let body: any; try { body = await req.json(); } catch { return error("JSON invalido"); }
    const { email } = body;
    if (!email) return error("email requerido");
    const { data: existing } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
    // No revelar si el correo existe por seguridad; simpre responder ok
    if (existing) {
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: "https://distrito-streaming-vercel-ashen.vercel.app/?reset=1" });
    }
    return json({ ok: true }, 200);
  }

  // RESET-PASSWORD
  if (path === "reset-password" && method === "POST") {
    let body: any; try { body = await req.json(); } catch { return error("JSON invalido"); }
    const { token, password } = body;
    if (!token || !password) return error("token y password son requeridos");
    if (String(password).length < 6) return error("La contrasena debe tener al menos 6 caracteres");
    const { error: updErr } = await supabase.auth.updateUser(token, { password });
    if (updErr) return error(updErr.message || "No se pudo restablecer la contrasena");
    return json({ ok: true }, 200);
  }

  // LOGIN
  if (path === "login" && method === "POST") {
    let body: any; try { body = await req.json(); } catch { return error("JSON invalido"); }
    const { email, password } = body;

    // Validacion de campos vacios
    if (!email && !password) return json({ error: "Ingresa tu correo y tu contrasena.", field: "all" }, 400);
    if (!email) return json({ error: "Ingresa tu correo electronico.", field: "email" }, 400);
    if (!password) return json({ error: "Ingresa tu contrasena.", field: "password" }, 400);

    // Validacion de formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return json({ error: "El formato del correo es invalido. Ejemplo: nombre@dominio.com", field: "email" }, 400);

    // Verificar si el correo existe en la base
    const { data: existingUser } = await supabase.from("profiles").select("id, email, status").eq("email", email).maybeSingle();
    if (!existingUser) {
      return json({ error: "Este correo no esta registrado. Revisa que este bien escrito o crea una cuenta.", field: "email" }, 400);
    }

    // Verificar si la cuenta esta bloqueada/inactiva ANTES de validar la contrasena
    if (existingUser.status === "Bloqueado" || existingUser.status === "Inactivo") {
      return json({ error: "Tu cuenta ha sido bloqueada por un administrador.", blocked: true, status: existingUser.status }, 403);
    }

    const { data: sessionData, error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
    if (loginErr) {
      const msg = (loginErr.message || "").toLowerCase();
      if (msg.includes("blocked") || msg.includes("disabled") || msg.includes("banned")) {
        return json({ error: "Tu cuenta ha sido bloqueada por un administrador.", blocked: true }, 403);
      }
      if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials") || msg.includes("password") || msg.includes("wrong")) {
        return json({ error: "La contrasena es incorrecta. Verifica que la hayas escrito bien.", field: "password" }, 400);
      }
      return json({ error: "No se pudo iniciar sesion: " + (loginErr.message || "error desconocido"), field: "all" }, 400);
    }

    const authId = sessionData?.user?.id;
    const accessToken = sessionData?.session?.access_token;
    const { data: profile, error: profileErr } = await supabase.from("profiles").select("*").eq("id", authId).maybeSingle();
    if (profileErr || !profile) return error("No se encontro el perfil del usuario");
    if (profile.status === "Bloqueado" || profile.status === "Inactivo") {
      return json({ error: "Tu cuenta ha sido bloqueada por un administrador.", blocked: true, status: profile.status }, 403);
    }
    return json({ token: accessToken, user: profile }, 200);
  }

  // BOOTSTRAP
  if (path === "bootstrap" && (method === "GET" || method === "POST")) {
    if (!authUser) return error("No autorizado", 401);
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
    if (!profile) return error("Sesion invalida");
    if (profile.status === "Bloqueado" || profile.status === "Inactivo") return json({ error: "Tu cuenta ha sido bloqueada por un administrador.", blocked: true, status: profile.status }, 403);
    const isAdmin = profile.role === "Administrador";
    const [pRes, oRes, rRes, tRes, aRes, sRes, uRes, iRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: true }).limit(1000),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(1000),
      supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("topups").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("ads").select("*").order("created_at", { ascending: true }).limit(500),
      supabase.from("settings").select("*").limit(100),
      isAdmin ? supabase.from("profiles").select("*").limit(1000) : Promise.resolve({ data: [], error: null }),
      isAdmin ? supabase.from("inventory").select("*").limit(1000) : Promise.resolve({ data: [], error: null }),
    ]);
    const settingsMap = {};
    for (const row of (sRes.data || [])) settingsMap[row.key] = row.value;
    return json({
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
    if (!authUser) return error("No autorizado", 401);
    const { data: prof } = await supabase.from("profiles").select("role").eq("id", authUser.id).maybeSingle();
    if (!prof || prof.role !== "Administrador") return error("Solo administradores", 403);
    const { data: rows } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(500);
    return json(rows || [], 200);
  }

  // BUY
  if (path === "buy" && method === "POST") {
    if (!authUser) return error("No autorizado", 401);
    let body: any; try { body = await req.json(); } catch { return error("JSON invalido"); }
    const { data: profile, error: profileErr } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
    if (profileErr || !profile) return error("Sesion invalida");
    if (profile.status === "Bloqueado" || profile.status === "Inactivo") return error("Tu cuenta ha sido bloqueada por un administrador.", 403);
    const productId = body.product_id;
    const quantity = Math.max(1, Math.min(10, Number(body.quantity || 1)));
    const { data: product } = await supabase.from("products").select("*").eq("id", productId).maybeSingle();
    if (!product) return error("Producto no encontrado");
    if (product.status !== "Activo") return error("Producto no disponible");
    if (Number(product.stock || 0) < quantity) return error("Stock insuficiente");
    const base = Number(product.provider_price ?? product.base_price ?? 0);
    const margin = Number(profile.margin ?? 0);
    const isAdmin = profile.role === "Administrador";
    const price = isAdmin ? Number(product.base_price ?? base) : base + Math.max(0, margin);
    const total = price * quantity;
    if (!isAdmin && Number(profile.balance || 0) < total) return error("Saldo insuficiente");
    const { data: invRows, error: invErr } = await supabase.from("inventory").select("*").eq("product_id", productId).eq("status", "Disponible").limit(quantity);
    if (invErr) return error(invErr.message);
    const available = invRows || [];
    if (available.length < quantity) return error("No hay cuentas disponibles para este producto");
    const taken = available.slice(0, quantity);
    const { data: orderInserts, error: orderErr } = await supabase.from("orders").insert(
      taken.map((acc, i) => ({
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
      }))).select("id");
    if (orderErr) return error(orderErr.message);
    const { error: invUpdErr } = await supabase.from("inventory").update({
      status: "Entregada",
      delivery_date: new Date().toISOString(),
      assigned_user_id: authUser.id,
    }).in("id", taken.map(a => a.id));
    if (invUpdErr) return error(invUpdErr.message);
    const { error: stockErr } = await supabase.from("products").update({
      stock: Math.max(0, Number(product.stock || 0)) - taken.length,
    }).eq("id", productId);
    if (stockErr) return error(stockErr.message);
    const newBalance = isAdmin ? profile.balance : Number(profile.balance || 0) - total;
    if (!isAdmin) {
      await supabase.from("profiles").update({ balance: newBalance }).eq("id", authUser.id);
    }
    const finalOrders = orderInserts.map((row, i) => {
      const acc = taken[i] || {};
      return { ...row, delivered_data: [acc.email, acc.password, acc.profile, acc.pin].filter(Boolean).join(" | ") };
    });
    return json({ orders: finalOrders, balance: newBalance }, 200);
  }

  // CRUD GENERICO
  if (ALLOWED_TABLES.has(path.split("/")[0]) && ["GET", "POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    if (!authUser) return error("No autorizado", 401);
    const { data: profile, error: profErr } = await supabase.from("profiles").select("role, status, id").eq("id", authUser.id).maybeSingle();
    if (profErr || !profile) return error("Sesion invalida");
    if (profile.status === "Bloqueado" || profile.status === "Inactivo") return error("Tu cuenta ha sido bloqueada por un administrador.", 403);
    const table = path.split("/")[0];
    const resourceId = path.split("/")[1] || null;
    const isAdmin = profile.role === "Administrador";
    if (method === "GET") {
      if (!isAdmin) {
        if (["orders", "reports", "topups"].includes(table)) {
          const { data: rows } = await supabase.from(table).select("*").eq("user_id", authUser.id).limit(1000);
          return json(rows || [], 200);
        }
        return json([], 200);
      }
      const { data: rows } = await supabase.from(table).select("*").limit(1000);
      return json(rows || [], 200);
    }
    let body: any = {};
    try { body = await req.json() || {}; } catch {}
    // users POST
    if (table === "users" && method === "POST") {
      if (!isAdmin) return error("Solo administradores pueden crear usuarios", 403);
      const { name, email, password, role, balance, margin } = body;
      if (!name || !email || !password) return error("name, email y password son requeridos");
      const { data: existing } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
      if (existing) return error("Ya existe una cuenta con este correo");
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr) return error(createErr.message || "No se pudo crear el usuario");
      const authId = created?.user?.id;
      if (!authId) return error("No se pudo crear el usuario");
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
      if (profileErr) return error(profileErr.message);
      await audit(supabase, authUser.id, "user_create", "profiles", authId, { email, role: roleNorm, balance: Number(balance || 0) });
      return json({ ok: true, id: authId }, 201);
    }
    // users PATCH
    if (table === "users" && method === "PATCH") {
      if (!isAdmin) return error("Solo administradores pueden editar usuarios", 403);
      const id = resourceId || body.id;
      if (!id) return error("id requerido");
      // Un admin no puede cambiar su propio rol ni bloquearse a si mismo
      if (id === authUser.id && (body.role || body.status)) {
        return error("No puedes cambiar tu propio rol o estado", 403);
      }
      const patch = { ...body };
      delete patch.id;
      delete patch.increment_copies;
      const hasPassword = patch.password !== undefined && patch.password !== null && patch.password !== "";
      const newPassword = patch.password;
      delete patch.password;
      if (hasPassword) {
        if (String(newPassword).length < 6) return error("La contrasena debe tener al menos 6 caracteres");
        const { error: pwdErr } = await supabase.auth.admin.updateUserById(id, { password: newPassword });
        if (pwdErr) return error(pwdErr.message || "No se pudo restablecer la contrasena");
        await audit(supabase, authUser.id, "user_password_reset", "profiles", id, {});
      }
      const { data, error: updErr } = await supabase.from("profiles").update(patch).eq("id", id);
      if (updErr) return error(updErr.message);
      await audit(supabase, authUser.id, "user_update", "profiles", id, patch);
      return json(data || [], 200);
    }
    // users DELETE
    if (table === "users" && method === "DELETE") {
      if (!isAdmin) return error("Solo administradores pueden eliminar usuarios", 403);
      const id = resourceId || body.id;
      if (!id) return error("id requerido");
      if (id === authUser.id) return error("No puedes eliminar tu propia cuenta", 403);
      await audit(supabase, authUser.id, "user_delete", "profiles", id);
      const { error: delErr } = await supabase.from("profiles").delete().eq("id", id);
      if (delErr) return error(delErr.message);
      return json({ ok: true }, 200);
    }
    // ads increment_copies
    if (table === "ads" && method === "PATCH" && body.increment_copies) {
      const { data: row } = await supabase.from("ads").select("copies").eq("id", body.id).maybeSingle();
      const copies = Number(row?.copies || 0) + 1;
      const { error: updErr } = await supabase.from("ads").update({ copies }).eq("id", body.id);
      if (updErr) return error(updErr.message);
      return json({ ok: true }, 200);
    }
    // settings PUT
    if (table === "settings" && method === "PUT") {
      if (!isAdmin) return error("Solo administradores pueden editar configuracion", 403);
      const { key, value } = body;
      if (!key) return error("key requerido");
      const { data, error: upsertErr } = await supabase.from("settings").upsert({ key, value, updated_at: new Date().toISOString() }).select("*");
      if (upsertErr) return error(upsertErr.message);
      return json(data || [], 200);
    }
    // reports POST
    if (table === "reports" && method === "POST") {
      const { order_id, product_name, account_data, reason, description } = body;
      const { data: order } = await supabase.from("orders").select("*").eq("id", order_id || "").maybeSingle();
      if (order && !isAdmin && order.user_id !== authUser.id) return error("No autorizado", 403);
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
      if (insErr) return error(insErr.message);
      return json(data || [], 201);
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
      if (insErr) return error(insErr.message);
      return json(data || [], 201);
    }
    // inventory POST
    if (table === "inventory" && method === "POST") {
      if (!isAdmin) return error("Solo administradores pueden gestionar inventario", 403);
      const { data, error: insErr } = await supabase.from("inventory").insert({ ...body, status: body.status || "Disponible" }).select("*");
      if (insErr) return error(insErr.message);
      return json(data || [], 201);
    }
    // inventory PATCH
    if (table === "inventory" && method === "PATCH") {
      if (!isAdmin) return error("Solo administradores pueden editar inventario", 403);
      const id = resourceId || body.id;
      if (!id) return error("id requerido");
      const patch = { ...body };
      delete patch.id;
      const { data, error: updErr } = await supabase.from("inventory").update(patch).eq("id", id);
      if (updErr) return error(updErr.message);
      return json(data || [], 200);
    }
    // inventory DELETE
    if (table === "inventory" && method === "DELETE") {
      if (!isAdmin) return error("Solo administradores pueden eliminar cuentas", 403);
      const id = resourceId || body.id;
      if (!id) return error("id requerido");
      const { error: delErr } = await supabase.from("inventory").delete().eq("id", id);
      if (delErr) return error(delErr.message);
      return json({ ok: true }, 200);
    }
    // products POST
    if (table === "products" && method === "POST") {
      if (!isAdmin) return error("Solo administradores pueden gestionar productos", 403);
      const { data, error: insErr } = await supabase.from("products").insert({ ...body, status: body.status || "Activo" }).select("*");
      if (insErr) return error(insErr.message);
      return json(data || [], 201);
    }
    // products PATCH
    if (table === "products" && method === "PATCH") {
      if (!isAdmin) return error("Solo administradores pueden editar productos", 403);
      const id = resourceId || body.id;
      if (!id) return error("id requerido");
      const patch = { ...body };
      delete patch.id;
      const { data, error: updErr } = await supabase.from("products").update(patch).eq("id", id);
      if (updErr) return error(updErr.message);
      return json(data || [], 200);
    }
    // products DELETE
    if (table === "products" && method === "DELETE") {
      if (!isAdmin) return error("Solo administradores pueden eliminar productos", 403);
      const id = resourceId || body.id;
      if (!id) return error("id requerido");
      const { error: delErr } = await supabase.from("products").delete().eq("id", id);
      if (delErr) return error(delErr.message);
      return json({ ok: true }, 200);
    }
    // reports PATCH
    if (table === "reports" && method === "PATCH") {
      if (!isAdmin) return error("Solo administradores pueden actualizar reportes", 403);
      const id = resourceId || body.id;
      if (!id) return error("id requerido");
      const patch = { ...body };
      delete patch.id;
      await audit(supabase, authUser.id, "report_update", "reports", id, patch);
      const { data, error: updErr } = await supabase.from("reports").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
      if (updErr) return error(updErr.message);
      return json(data || [], 200);
    }
    // reports DELETE
    if (table === "reports" && method === "DELETE") {
      if (!isAdmin) return error("Solo administradores pueden eliminar reportes", 403);
      const id = resourceId || body.id;
      if (!id) return error("id requerido");
      const { error: delErr } = await supabase.from("reports").delete().eq("id", id);
      if (delErr) return error(delErr.message);
      return json({ ok: true }, 200);
    }
    // topups PATCH
    if (table === "topups" && method === "PATCH") {
      if (!isAdmin) return error("Solo administradores pueden aprobar recargas", 403);
      const id = resourceId || body.id;
      if (!id) return error("id requerido");
      const patch = { ...body };
      delete patch.id;
      const { data: row } = await supabase.from("topups").select("*").eq("id", id).maybeSingle();
      if (!row) return error("Recarga no encontrada", 404);
      await audit(supabase, authUser.id, "topup_update", "topups", id, { status: patch.status, amount: row.amount, user_id: row.user_id });
      if (patch.status === "Aprobada") {
        const { data: owner } = await supabase.from("profiles").select("balance").eq("id", row.user_id).maybeSingle();
        const newBal = Number(owner?.balance ?? 0) + Number(row.amount || 0);
        const { error: balErr } = await supabase.from("profiles").update({ balance: newBal }).eq("id", row.user_id);
        if (balErr) return error(balErr.message);
      }
      const { data, error: updErr } = await supabase.from("topups").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
      if (updErr) return error(updErr.message);
      return json(data || [], 200);
    }
    // topups DELETE
    if (table === "topups" && method === "DELETE") {
      if (!isAdmin) return error("Solo administradores pueden eliminar recargas", 403);
      const id = resourceId || body.id;
      if (!id) return error("id requerido");
      const { error: delErr } = await supabase.from("topups").delete().eq("id", id);
      if (delErr) return error(delErr.message);
      return json({ ok: true }, 200);
    }
    // ads POST
    if (table === "ads" && method === "POST") {
      if (!isAdmin) return error("Solo administradores pueden gestionar material", 403);
      const { data, error: insErr } = await supabase.from("ads").insert({ ...body, copies: 0 }).select("*");
      if (insErr) return error(insErr.message);
      return json(data || [], 201);
    }
    // ads PATCH
    if (table === "ads" && method === "PATCH") {
      if (!isAdmin) return error("Solo administradores pueden editar material", 403);
      const id = resourceId || body.id;
      if (!id) return error("id requerido");
      const patch = { ...body };
      delete patch.id;
      delete patch.increment_copies;
      const { data, error: updErr } = await supabase.from("ads").update(patch).eq("id", id);
      if (updErr) return error(updErr.message);
      return json(data || [], 200);
    }
    // ads DELETE
    if (table === "ads" && method === "DELETE") {
      if (!isAdmin) return error("Solo administradores pueden eliminar material", 403);
      const id = resourceId || body.id;
      if (!id) return error("id requerido");
      const { error: delErr } = await supabase.from("ads").delete().eq("id", id);
      if (delErr) return error(delErr.message);
      return json({ ok: true }, 200);
    }
    // settings PATCH
    if (table === "settings" && method === "PATCH") {
      if (!isAdmin) return error("Solo administradores pueden editar configuracion", 403);
      const { key, value } = body;
      if (!key) return error("key requerido");
      const { data, error: updErr } = await supabase.from("settings").upsert({ key, value, updated_at: new Date().toISOString() }).select("*");
      if (updErr) return error(updErr.message);
      return json(data || [], 200);
    }
    return error("Ruta no encontrada: [" + path + "] method=" + method, 404);
  }
  return error("Ruta no encontrada FINAL path=[" + path + "] method=" + method, 404);
  } catch (e) {
    return error("EXCEPCION: " + (e && e.message ? e.message : String(e)), 500);
  }
});
