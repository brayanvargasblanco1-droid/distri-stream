import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/functions\/v1\/distrito-api/, "");
  const method = req.method;
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" };

  if (method === "OPTIONS") return new Response("ok", { status: 204, headers: corsHeaders });

  if (path === "/health") return new Response("distrito-api ok", { status: 200, headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));

  const token = req.headers.get("x-distrito-session");
  const authUser = token ? await supabase.auth.getUser(token) : null;
  if (!authUser || authUser.error || !authUser.data.user) return new Response("No autorizado", { status: 401, headers: corsHeaders });

  const table = path.split("/")[1] || "";
  if (!["products", "inventory", "orders", "reports", "topups", "ads", "settings", "profiles"].includes(table)) return new Response("Ruta no encontrada", { status: 404, headers: corsHeaders });

  const body = method === "GET" ? null : await req.json();

  let query = supabase.from(table).select("*");
  for (const key in body || { }) query = query.eq(key, body[key]);

  if (method === "GET") query = query.limit(1000);

  const { data: rows, error: err } = await query;
  if (err) return new Response(err.message, { status: 400, headers: corsHeaders });

  // Para crear/registrar usuarios se usa el panel de Supabase o la ruta /bootstrap.
 
 return new Response(JSON.stringify(rows), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});