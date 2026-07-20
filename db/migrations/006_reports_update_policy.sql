-- 006 · Permitir a moderadores actualizar el estado de un reporte
-- OPERACIÓN MANUAL: ejecutar una vez en el SQL Editor de Supabase.
-- La tabla reports y sus políticas de insert (crear denuncia) y select
-- (sólo moderadores leen) ya existen. Falta habilitar el UPDATE para que un
-- moderador pueda resolver/descartar un reporte. is_moderator() ya está
-- definida en el esquema.

create policy "reportes_actualizar_mod" on reports
  for update using (public.is_moderator());
