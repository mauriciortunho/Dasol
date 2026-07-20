-- 007 · Habilitar Realtime para la tabla campaigns
-- OPERACIÓN MANUAL: ejecutar una vez en el SQL Editor de Supabase.
-- Suma la tabla a la publicación de Realtime para que la barra de progreso se
-- actualice en vivo cuando el trigger mueve current_amount (la app solo
-- ESCUCHA; nunca escribe current_amount).
-- Verificá además que Realtime esté activo para la tabla en el panel:
-- Database -> Replication / Realtime.

alter publication supabase_realtime add table public.campaigns;
