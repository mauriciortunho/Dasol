-- 001 · Exponer tablas a la Data API (GRANTS)
-- El proyecto tiene DESACTIVADO "exponer nuevas tablas automáticamente", así
-- que PostgREST no ve las tablas hasta otorgar privilegios a los roles de la
-- API. La RLS sigue siendo el control real: estos GRANT sólo permiten que la
-- API "vea" la tabla; las políticas deciden qué filas/operaciones se permiten.
-- 'anon' sólo lee (feed/detalle, ya filtrado por RLS); la escritura es de
-- 'authenticated'. Idempotente: se puede re-ejecutar sin romper.

grant usage on schema public to anon, authenticated;

grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
