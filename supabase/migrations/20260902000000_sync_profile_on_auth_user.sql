-- ===========================
-- TRIGGER: SINCRONIZAR PERFIL AL CREAR AUTH USER
-- Crea el perfil en public.profiles automaticamente cuando se crea un
-- usuario en auth.users (via dashboard, API o admin.createUser).
-- Usa ON CONFLICT DO NOTHING para no romper cuando el edge function
-- (distrito-api) inserta/upsertea el perfil manualmente despues.

-- ===========================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, name, email, role, balance, margin, status)
    values (
        new.id,
        coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
        new.email,
        'Cliente',
        0,
        100,
        'Activo'
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();