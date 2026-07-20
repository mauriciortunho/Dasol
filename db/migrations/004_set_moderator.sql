-- 004 · Marcar un usuario como moderador
-- OPERACIÓN MANUAL: ejecutar una sola vez en el SQL Editor de Supabase.
-- NO es parte del esquema ni corre automáticamente. Reemplazá el email por
-- el de la cuenta que querés convertir en moderador antes de ejecutarlo.

update public.profiles
set role = 'moderator'
where id = (select id from auth.users where email = 'mauricio.ortun@gmail.com');
