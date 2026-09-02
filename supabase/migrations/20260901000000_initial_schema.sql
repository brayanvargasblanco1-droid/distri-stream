-- ============================================
-- DISTRITO STREAMING - ESQUEMA COMPLETO
-- Plataforma de distribución, compras y ventas
-- ============================================

-- ===========================
-- EXTENSIONES
-- ===========================
create extension if not exists pgcrypto;

-- ===========================
-- TABLA: PROFILES
-- ===========================
create table if not exists public.profiles(
    id uuid primary key references auth.users(id) on delete cascade,
    name text not null,
    email text unique not null,
    phone text,
    role text not null default 'Cliente' check (role in ('Cliente', 'Revendedor', 'Administrador')),
    balance numeric(12, 2) not null default 0,
    margin numeric(12, 2) not null default 1000,
    status text not null default 'Activo' check (status in ('Activo', 'Inactivo', 'Suspendido')),
    referrer_id uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
);

-- ===========================
-- TABLA: PRODUCTS
-- ===========================
create table if not exists public.products(
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    category text,
    price numeric(12, 2) not null default 0,
    cost numeric(12, 2) default 0,
    stock integer not null default 0,
    status text not null default 'Activo' check (status in ('Activo', 'Agotado', 'Inactivo')),
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
);

-- ===========================
-- TABLA: INVENTORY
-- ===========================
create table if not exists public.inventory(
    id uuid primary key default gen_random_uuid(),
    product_id uuid references public.products(id) on delete cascade,
    quantity integer not null default 0,
    type text not null default 'entrada' check (type in ('entrada', 'salida', 'ajuste')),
    note text,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
);

-- ===========================
-- TABLA: ORDERS
-- ===========================
create table if not exists public.orders(
    id uuid primary key default gen_random_uuid(),
    order_code text unique not null,
    user_id uuid references public.profiles(id) on delete cascade,
    product_id uuid references public.products(id) on delete set null,
    product_name text not null,
    quantity integer not null default 1,
    unit_price numeric(12, 2) not null default 0,
    total numeric(12, 2) not null default 0,
    status text not null default 'Pendiente' check (status in ('Pendiente', 'Pagado', 'Enviado', 'Entregado', 'Cancelado', 'Reembolsado', 'Bloqueado', 'Inactivo')),
    payment_method text,
    reference text,
    delivery_data jsonb,
    client_name text,
    client_email text,
    client_phone text,
    client_address text,
    notes text,
    created_at timestamptz not null default now()
);

-- ===========================
-- TABLA: REPORTS
-- ===========================
create table if not exists public.reports(
    id uuid primary key default gen_random_uuid(),
    report_type text not null,
    title text not null,
    description text,
    data jsonb,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
);

-- ===========================
-- TABLA: TOPUPS (Recargas)
-- ===========================
create table if not exists public.topups(
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade,
    amount numeric(12, 2) not null default 0,
    method text not null default 'efectivo',
    status text not null default 'Pendiente' check (status in ('Pendiente', 'Aprobada', 'Rechazada')),
    reference text,
    created_at timestamptz not null default now()
);

-- ===========================
-- TABLA: ADS (Publicidad)
-- ===========================
create table if not exists public.ads(
    id uuid primary key default gen_random_uuid(),
    title text not null,
    content text,
    image_url text,
    link text,
    status text not null default 'Activo' check (status in ('Activo', 'Inactivo')),
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
);

-- ===========================
-- TABLA: SETTINGS
-- ===========================
create table if not exists public.settings(
    key text primary key,
    value jsonb not null,
    updated_at timestamptz not null default now()
);

-- ===========================
-- ÍNDICES
-- ===========================
create index if not exists idx_products_name on public.products(name);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at);
create index if not exists idx_inventory_product_id on public.inventory(product_id);
create index if not exists idx_topups_user_id on public.topups(user_id);
create index if not exists idx_topups_status on public.topups(status);

-- ===========================
-- FUNCIÓN: ACTUALIZAR TIMESTAMP
-- ===========================
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- ===========================
-- RLS (Row Level Security)
-- ===========================
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.reports enable row level security;
alter table public.topups enable row level security;
alter table public.ads enable row level security;
alter table public.settings enable row level security;

-- Políticas: cualquier usuario autenticado puede leer/insertar (se protege por rol en la app)
drop policy if exists "Public profiles" on public.profiles;
create policy "Public profiles" on public.profiles for select using (true);
drop policy if exists "Insert profiles" on public.profiles;
create policy "Insert profiles" on public.profiles for insert with check (true);
