-- ============================================
-- DISTRITO STREAMING - AJUSTES DE SALDO
-- Registro de ajustes manuales de saldo hechos por el administrador
-- (bonos, descuentos, correcciones, cobros). Cada ajuste tiene motivo y
-- queda visible en el historial del usuario afectado.
-- ============================================

create table if not exists public.balance_adjustments(
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    amount numeric not null default 0,          -- positivo = abono, negativo = descuento
    reason text not null default '',            -- motivo obligatorio (lo exige el frontend)
    created_by uuid references public.profiles(id) on delete set null, -- admin que lo hizo
    created_at timestamptz not null default now()
);

create index if not exists bal_adj_user_idx on public.balance_adjustments(user_id);
create index if not exists bal_adj_created_idx on public.balance_adjustments(created_at desc);

alter table public.balance_adjustments enable row level security;

-- El usuario lee los suyos; el admin lee todos
drop policy if exists "bal_adj_select" on public.balance_adjustments;
create policy "bal_adj_select" on public.balance_adjustments
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Administrador')
  );

-- Solo el admin (o la edge function con service role) puede insertar/borrar
drop policy if exists "bal_adj_admin_insert" on public.balance_adjustments;
create policy "bal_adj_admin_insert" on public.balance_adjustments
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Administrador')
  );

drop policy if exists "bal_adj_admin_delete" on public.balance_adjustments;
create policy "bal_adj_admin_delete" on public.balance_adjustments
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Administrador')
  );