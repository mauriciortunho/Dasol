-- 008 · Tabla push_tokens (notificaciones push, etapa 1: cliente)
-- OPERACIÓN MANUAL: ya aplicada por el usuario en el SQL Editor de Supabase.
-- Este archivo deja registrado en el repo qué se aplicó.
--
-- Guarda los Expo push tokens de cada usuario. RLS: cada usuario gestiona
-- únicamente sus propios tokens. `token` es unique para poder hacer upsert
-- desde el cliente sin duplicar (y reasignar el token si cambia de cuenta en
-- el mismo equipo). El total recaudado no se toca acá: esto es sólo entrega.

create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now()
);

alter table push_tokens enable row level security;

-- Cada usuario ve/gestiona sólo sus tokens.
create policy "push_tokens_select_propios" on push_tokens
  for select using (auth.uid() = user_id);

create policy "push_tokens_insert_propios" on push_tokens
  for insert with check (auth.uid() = user_id);

create policy "push_tokens_update_propios" on push_tokens
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "push_tokens_delete_propios" on push_tokens
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on push_tokens to authenticated;
