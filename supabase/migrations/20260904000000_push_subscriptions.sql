-- ============================================
-- DISTRITO STREAMING - NOTIFICACIONES PUSH
-- Suscripciones Web Push (RFC 8030/8291) por usuario
-- La edge function (service role) inserta/borra con el user_id del token de
-- sesión; por RLS el propio usuario solo puede leer/borrar las suyas.
-- ============================================

create table if not exists public.push_subscriptions(
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    endpoint text not null,
    p256dh text not null,
    auth text not null,
    user_agent text,
    created_at timestamptz not null default now(),
    unique(user_id, endpoint)
);

create index if not exists push_subs_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_select_own" on public.push_subscriptions;
create policy "push_select_own" on public.push_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "push_delete_own" on public.push_subscriptions;
create policy "push_delete_own" on public.push_subscriptions
  for delete using (auth.uid() = user_id);
