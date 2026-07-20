-- 002 · Crear el perfil automáticamente al registrarse un usuario
-- full_name y phone llegan en raw_user_meta_data desde el signUp del cliente
-- (options.data). El cliente NO inserta en profiles: lo hace este trigger.
-- security definer para poder escribir en public.profiles.
-- Nota: si ya existe el trigger, el CREATE TRIGGER da "already exists"
-- (inofensivo); la función se actualiza igual por el "create or replace".

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), 'Usuario'),
    nullif(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
