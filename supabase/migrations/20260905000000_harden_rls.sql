-- ═══════════════════════════════════════════════════════════════════════
-- 20260905000000_harden_rls.sql
-- Endurecimiento RLS: eliminar políticas permisivas `using (true)` que
-- daban acceso total al rol `public` (anon + authenticated) sobre tablas
-- sensibles vía PostgREST con la anon key.
--
-- CONTEXTO:
--  * El frontend NO usa PostgREST directo: todo pasa por el edge function
--    `distrito-api` (rewrite /api/* en Vercel), que usa la service_role
--    key. service_role SALTA las políticas RLS.
--  * Por eso las políticas *_admin_all (using true, rol public) eran
--    innecesarias Y peligrosas: exponían inventory (credenciales de
--    cuentas), orders (delivered_data), profiles (role/balance/margin),
--    reports (account_data), settings/ads/products/topups a cualquiera
--    que tuviera la anon key.
--  * Se eliminan; las tablas quedan con RLS activado y CERO políticas,
--    es decir, acceso directo denegado por defecto (solo service_role).
--
-- Se conservan las políticas correctamente acotadas:
--   audit_log_no_public_access (denegado), bal_adj_* (admin o dueño),
--   push_* (solo el dueño del token).
-- ═══════════════════════════════════════════════════════════════════════

-- inventory: credenciales de cuentas (CRÍTICO)
drop policy if exists "inventory_admin_all" on public.inventory;

-- orders: delivered_data, códigos y montos (CRÍTICO)
drop policy if exists "orders_admin_all"    on public.orders;
drop policy if exists "orders_insert_own"   on public.orders;
drop policy if exists "orders_select_own"   on public.orders;

-- reports: account_data de clientes
drop policy if exists "reports_admin_all"   on public.reports;
drop policy if exists "reports_insert_own"  on public.reports;
drop policy if exists "reports_select_own"  on public.reports;

-- profiles: email, role, balance, margin (CRÍTICO: elevación de rol)
drop policy if exists "Insert profiles"     on public.profiles;
drop policy if exists "Public profiles"     on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

-- ads / settings / products / topups: lectura y escritura totales
drop policy if exists "ads_admin_all"        on public.ads;
drop policy if exists "ads_select_all"       on public.ads;
drop policy if exists "settings_admin_all"   on public.settings;
drop policy if exists "settings_select_all"  on public.settings;
drop policy if exists "products_select_all"  on public.products;
drop policy if exists "products_write_admin" on public.products;
drop policy if exists "topups_admin_all"     on public.topups;
drop policy if exists "topups_insert_own"    on public.topups;
drop policy if exists "topups_select_own"    on public.topups;

-- Nota: RLS queda activado en todas estas tablas; sin políticas el acceso
-- directo (anon/authenticated) se deniega. Si en el futuro el frontend
-- volviera a usar supabase-js con la anon key, habrá que crear políticas
-- explícitas y acotadas siguiendo el patrón de balance_adjustments.
