-- Distrito Streaming - esquema inicial de base de datos
-- Tablas: profiles, products, inventory, orders, reports, topups, ads, settings.

create table if not exists public.profiles(
    id uuid primary key references auth.users(id) on delete cascade,
    name text not null,
    email text not null unique,
    phone text,
    role text not null default 'Cliente' check(role in('Cliente', 'Revendedor', 'Administrador')),
    balance numeric(12, 2) not null default 0,
    margin numeric(5, 2) not null default 1000,
    status text not null default 'Activo' check(status in('Activo', 'Bloqueado', 'Inactivo')),
    referrer_id uuid references public.profiles(id) on delete set null,
    assigned_account_id uuid,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.products(
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    price numeric(12, 2) not null default 0,
    provider_price numeric(12, 2) not null default 0,
    base_price numeric(12,,  2) not null default 0,
    share_type text not null default 'compartida' check(share_type in('compartida', 'personal')),
    shared boolean not null default true,
    status text not null default 'Activo' check(status in('Activo', 'Inactivo')),
    stock integer not null default 0,
    category text,
    image_url text,
    created_at timestamptz not null default now()
);

create table if not exists public.inventory(
    id uuid primary key default gen_random_uuid(),
    product_id uuid references public.products(id) on delete set null,
    email text,
    password text,
    profile text,
    pin text,
    status text not null default 'Disponible' check(status in('Disponible', 'Entregada', 'Agotada', 'Suspendida')),
    purchase_date date,
    expiry_date date,
    delivery_date timestamptz,
    assigned_user_id uuid references public.profiles(id) on delete set null,
    notes text,
    created_at timestamptz not null default now()
);

create table if not exists public.orders(
    id uuid primary key default gen_random_uuid(),
    code text unique,
    user_id uuid references public.profiles(id) on delete cascade,
    product_id uuid references public.products(id) on delete set null,
    product_name text not null,
    quantity integer not null default 1,
    amount numeric(12,,  2) not null default 0,
    total numeric(12,,  2) not null default 0,
    provider_price numeric(12,,  2),
    delivered_data text,
    credentials text,
    status text not null default 'Entregado' check(status in('Pendiente', 'Procesando', 'Entregado', 'Expirado', 'Reembolsado')),
    expires_at timestamptz,
    created_at timestamptz not null default now()
);

create table if not exists public.reports(
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade,
    order_id uuid references public.orders(id) on delete set null,
    product_name text,
    account_data text,
    reason text,
    description text,
    status text not null default 'Abierto' check(status in('Abierto', 'En revisión', 'En proceso', 'Resuelto', 'Rechazado')),
    provider_response text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.topups(
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade,
    amount numeric(12,,  2) not null default 0,
    method text default 'WhatsApp',
    reference text,
    status text not null default 'Pendiente' check(status in('Pendiente', 'Aprobada', 'Rechazada')),
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.ads(
    id uuid primary key default gen_random_uuid(),
    title text not null,
    short_text text,
    copy_text text,
    status text not null default 'Activo' check(status in('Activo', 'Inactivo')),
    category text,
    expiry date,
    "order" integer not null default 0,
    file_name text,
    file_url text,
    image_data text,
    price numeric(12,,  2),
    copies integer not null default 0,
    user_id uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
);

create table if not exists public.settings(
    key text primary key,
    value jsonb not null default '{}',
    updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_referrer on public.profiles(referrer_id);
create index if not exists idx_inventory_product on public.inventory(product_id);
create index if not exists idx_inventory_status on public.inventory(status);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_reports_user on public.reports(user_id);
create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_topups_user on public.topups(user_id);
create index if not exists idx_topups_status on public.topups(status);

create or replace function public.set_updated_at() returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
    for each row execute function public.set_updated_at();
drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at before update on public.reports
    for each row execute function public.set_updated_at();
drop trigger if exists topups_set_updated_at on public.topups;
create trigger topups_set_updated_at before update on public.topups
    for each row execute function public.set_updated_at();
drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at before update on public.settings
    for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.reports enable row level security;
alter table public.topups enable row level security;
alter table public.ads enable row level security;
alter table public.settings enable row level security;

create policy 'own_profile' on public.profiles
    for select using(auth.uid() = id);
create policy 'update_own_profile' on public.profiles
    for update using(auth.uid() = id);
create policy 'products_read' on public.products
    for select using(auth.role() = 'authenticated');
create policy 'own_orders' on public.orders
    for select using(auth.uid() = user_id);
create policy 'own_reports' on public.reports
    for select using(auth.uid() = user_id);
create policy 'own_topups' on public.topups
    for select using(auth.uid() = user_id);
create policy 'own_ads' on public.ads
    for select using(auth.uid() = user_id);

-- Nota: el edge function distrito-api usa service_role para operar
-- todas las tablas sin RLS. Configurar SUPABASE_SERVICE_ROLE_KEY en
-- el dashboard de Supabase antes de ejecutar migraciones en remoto.