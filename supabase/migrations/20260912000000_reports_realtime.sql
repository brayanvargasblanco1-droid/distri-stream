-- ═══════════════════════════════════════════════════════════════════════
-- 20260912000000_reports_realtime.sql
-- Notificaciones en tiempo real sobre la tabla reports (Supabase Realtime).
--
-- CONTEXTO:
--  * El frontend no usa PostgREST directo: todo pasa por el edge function
--    `distrito-api` (service_role, salta RLS). Pero Realtime NO usa el edge:
--    el navegador se suscribe con la anon key y Realtime respeta RLS al
--    enviar eventos. Tras 20260905000000_harden_rls.sql la tabla reports
--    quedo con CERO politicas de SELECT, asi que sin este cambio Realtime
--    no entregaria nada.
--  * Politica acotada: cada usuario solo recibe eventos de SUS reportes
--    (user_id = auth.uid()); los administradores reciben todos.
--    Nota tecnica: para UPDATE, Realtime evalua la politica SELECT sobre la
--    fila NUEVA; la fila vieja (OLD) se envia solo si la politica la cubre.
--    Con user_id inmutable esto es seguro.
--
-- PUBLICACION:
--  * alter publication supabase_realtime add table public.reports;
--    (idempotente: si ya estaba publicada, el IF evita el error de duplicado)
-- ═══════════════════════════════════════════════════════════════════════

-- 1) Politica SELECT para Realtime: dueño del reporte o administrador
drop policy if exists "reports_select_own_or_admin" on public.reports;
create policy "reports_select_own_or_admin" on public.reports
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'Administrador'
    )
  );

-- 2) Helper: saber si un uid es admin desde SQL (no expone datos)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'Administrador'
  );
$$;

-- 3) Publicar la tabla en la publicación supabase_realtime (idempotente)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reports'
  ) then
    alter publication supabase_realtime add table public.reports;
  end if;
end
$$;

-- 4) REPLICA IDENTITY FULL: en UPDATE/DELETE Realtime envia la fila completa
--    (con la clave y columnas necesarias para evaluar RLS). Sin esto, solo
--    llega la primary key y el filtro de dueño no puede evaluarse bien.
alter table public.reports replica identity full;
