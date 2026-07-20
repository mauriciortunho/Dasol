-- 010 · Diagnóstico de notificaciones push (SOLO LECTURA)
-- OPERACIÓN MANUAL: ejecutar en el SQL Editor de Supabase para verificar que
-- follows y push_tokens están bien cargados ANTES de probar el envío.
--
-- ⚠️ Esto NO cambia el esquema ni datos: son consultas SELECT. No es una
-- migración de estructura; queda acá como herramienta de chequeo.
--
-- Para las consultas B y C, reemplazá <<CAMPAIGN_ID>> por el id de la campaña
-- a probar (lo sacás con la consulta E).


-- ── A) ¿Quién tiene token registrado? (etapa 1) ──────────────────────────────
-- Si una cuenta no aparece, no inició sesión en el dev build o no dio permiso.
select pt.user_id,
       p.full_name,
       count(*)        as tokens,
       max(pt.created_at) as ultimo_registro
from push_tokens pt
left join profiles p on p.id = pt.user_id
group by pt.user_id, p.full_name
order by ultimo_registro desc;


-- ── B) Seguidores de UNA campaña y si pueden recibir push ────────────────────
-- tokens = 0  → sigue la campaña pero no le va a llegar nada (sin token).
select f.user_id,
       p.full_name,
       count(pt.token) as tokens
from campaign_follows f
left join profiles p     on p.id = f.user_id
left join push_tokens pt on pt.user_id = f.user_id
where f.campaign_id = '<<CAMPAIGN_ID>>'
group by f.user_id, p.full_name
order by tokens desc;


-- ── C) Resumen rápido de esa campaña ─────────────────────────────────────────
-- Cuántos la siguen y a cuántos efectivamente les llegaría el push.
select
  count(distinct f.user_id)  as seguidores,
  count(distinct pt.user_id) as seguidores_con_token
from campaign_follows f
left join push_tokens pt on pt.user_id = f.user_id
where f.campaign_id = '<<CAMPAIGN_ID>>';


-- ── D) Totales generales (sanity check) ──────────────────────────────────────
select
  (select count(*) from campaign_follows)               as follows_total,
  (select count(*) from push_tokens)                    as tokens_total,
  (select count(distinct user_id) from push_tokens)     as usuarios_con_token;


-- ── E) Encontrar el id de una campaña (para B y C) ───────────────────────────
select id, slug, title, status, current_amount, goal_amount
from campaigns
order by created_at desc;
