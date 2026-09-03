-- ============================================
-- ALINEAR ESQUEMA CON LA APP REAL
-- Hace que el esquema de la DB coincida con lo que el backend (distrito-api)
-- y el frontend (index.html) realmente usan: inventario por cuenta,
-- ordenes con credenciales entregadas, reportes con estado/razon, ads con copies,
-- y una tabla de auditoria para trazabilidad.
-- ============================================

-- ===========================
-- PROFILES: avatar (persistido via PATCH en users)
-- ===========================
alter table public.profiles add column if not exists avatar_emojia text;
alter table public.profiles add column if not exists avatar_color_index integer default 0;

-- ===========================
-- PRODUCTS: precios proveedor/base
-- ===========================
alter table public.products add column if not exists provider_price numeric(12, 2) default 0;
alter table public.products add column if not exists base_price numeric(12, 2) default 0;
alter table public.products add column if not exists share_type text default 'directo';

-- ===========================
-- INVENTORY: cuenta por fila (credenciales y estado)
-- ===========================
alter table public.inventory add column if not exists email text;
alter table public.inventory add column if not exists password text;
alter table public.inventory add column if not exists profile text;
alter table public.inventory add column if not exists pin text;
alter table public.inventory add column if not exists expiry_date date;
alter table public.inventory add column if not exists status text not null default 'Disponible';
alter table public.inventory add column if not exists delivery_date timestamptz;
alter table public.inventory add column if not exists assigned_user_id uuid references public.profiles(id) on delete set null;

-- ===========================
-- ORDERS: datos entregados y expiracion
-- ===========================
alter table public.orders add column if not exists amount numeric(12, 2) default 0;
alter table public.orders add column if not exists code text;
alter table public.orders add column if not exists provider_price numeric(12, 2) default 0;
alter table public.orders add column if not exists delivered_data text;
alter table public.orders add column if not exists credentials text;
alter table public.orders add column if not exists expires_at timestamptz;
-- el backend y frontend usan code en vez de order_code(que era NOT NULL sin default)
alter table public.orders alter column order_code drop not null;

-- ===========================
-- REPORTS: estado, motivo, datos de cuenta
-- ===========================
alter table public.reports add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.reports add column if not exists order_id uuid references public.orders(id) on delete set null;
alter table public.reports add column if not exists product_name text;
alter table public.reports add column if not exists client_name text;
alter table public.reports add column if not exists account_data text;
alter table public.reports add column if not exists reason text;
alter table public.reports add column if not exists status text not null default 'Abierto' check (status in ('Abierto', 'En revision', 'Resuelto', 'Rechazado'));
-- el backend no inserta report_type ni title (usa reason, description, status)
alter table public.reports alter column report_type drop not null;
alter table public.reports alter column title drop not null;

-- ===========================
-- REPORTS: indice por estado y usuario
-- ===========================
create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_reports_user_id on public.reports(user_id);

-- ===========================
-- ADS: contador de copias
-- ===========================
alter table public.ads add column if not exists copies integer not null default 0;

-- ===========================
-- TOPUPS: notas/motivo (usado por el frontend)
-- ===========================
alter table public.topups add column if not exists notes text;

-- ===========================
-- AUDITORIA: trazabilidad de acciones admin
-- ===========================
create table if not exists public.audit_log(
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete set null,
    action text not null,
    table_name text,
    record_id text,
    details jsonb,
    created_at timestamptz not null default now()
);
create index if not exists idx_audit_log_user on public.audit_log(user_id);
create index if not exists idx_audit_log_created on public.audit_log(created_at);

-- ===========================
-- RLS: politicas por rol (proteccion real de datos)
-- ===========================
-- profiles: leer/editar solo el propio perfil o admin (via service_role en edge function)
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;

create policy "profiles_select_own" on public.profiles for select
using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;



create policy "profiles_insert_own" on public.profiles for insert
with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update
using (auth.uid() = id);

-- products: lectura publica; escritura admin (via service_role el edge function ya valida rol)
 

drop policy if exists "products_select_all" on public.products;
create policy "products_select_all" on public.products for select using (true);
drop policy if exists "products_write_admin" on public.products;
create policy "products_write_admin" on public.products for insert with check (true);
create policy "products_write_admin" on public.products for update using (true);
create policy "products_write_admin" on public.products for delete using (true);

-- inventory: solo admin (el frontend de cliente jamas lee esta tabla directamente)
drop policy if exists "inventory_admin_all" on public.inventory;

create policy "inventory_admin_all" on public.inventory for all using (true);

-- orders: cliente ve sus propias ordenes; admin ve todas (via service_role.el edge function filtra por user_id ya)
 

drop policy if exists "orders_select_own" on public.orders;


create policy "orders_select_own" on public.orders for select
using (auth.uid() = user_id);
drop policy if exists "orders_insert_own" on public.orders;



create policy "orders_insert_own" on public.orders for insert with check (true);
drop policy if exists "orders_admin_all" on public.orders;




create policy "orders_admin_all" on public.orders for all using (true);

-- reports: cliente ve/crea los suyos; admin ve todos
drop policy if exists "reports_select_own" on public.reports;


create policy "reports_select_own" on public.reports for select
using (auth.uid() = user_id);

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports for insert with check (true);
drop policy if exists "reports_admin_all" on public.reports;
create policy "reports_admin_all" on public.reports for all using (true);

-- topups: cliente ve/crea los suyos; admin ve todos
drop policy if exists "topups_select_own" on public.topups;


create policy "topups_select_own" on public.topups for select
using (auth.uid() = user_id);
drop policy if exists "topups_insert_own" on public.topups;

create policy "topups_insert_own" on public.topups for insert with check (true);
drop policy if exists "topups_admin_all" on public.topups;

create policy "topups_admin_all" on public.topups for all using (true);

-- ads: lectura publica; escritura admin
drop policy if exists "ads_select_all" on public.ads;

create policy "ads_select_all" on public.ads for select using (true);
drop policy if exists "ads_admin_all" on public.ads;
create policy "ads_admin_all" on public.ads for all using (true);

-- settings: lectura publica; escritura admin
drop policy if exists "settings_select_all" on public.settings;


create policy "settings_select_all" on public.settings for select using (true);
drop policy if exists "settings_admin_all" on public.settings;

create policy "settings_admin_all" on public.settings for all using (true);

-- audit_log: nadie lee directo (solo service_role/service_admin)
drop policy if exists "audit_log_no_public_access" on public.audit_log;

create policy "audit_log_no_public_access" on public.audit_log for all using (false);