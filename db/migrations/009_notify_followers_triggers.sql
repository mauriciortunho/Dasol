-- 009 · Triggers de notificación a seguidores (push, etapa 2)
-- OPERACIÓN MANUAL: ejecutar en el SQL Editor de Supabase.
--
-- Dispara la Edge Function `notify-followers` vía HTTP (pg_net) cuando:
--   (A) una campaña pasa a 'completada' (llegó a su meta)  → tipo 'meta'
--   (B) se inserta un progress_update con texto             → tipo 'novedad'
--
-- Las notificaciones NO modifican datos ni montos: sólo avisan. La privacidad
-- (a quién se notifica) la resuelve la función leyendo campaign_follows.
--
-- ⚠️ ANTES DE CORRER, reemplazá los dos placeholders en AMBAS funciones:
--   <<EDGE_FUNCTION_URL>>  → URL de la función desplegada, del estilo:
--        https://<TU-REF-DE-PROYECTO>.supabase.co/functions/v1/notify-followers
--   <<AUTH_BEARER_TOKEN>>  → el SERVICE ROLE key (o el anon key) del proyecto.
--        Es el header que el gateway de Functions exige para invocarla; NO se
--        usa para leer datos (eso lo hace la función con su propio service role).
--
-- Recomendación: en vez de pegar el token en texto plano acá, podés guardarlo
-- en Vault y leerlo, pero para empezar alcanza con reemplazar el placeholder.
--
-- NOTA: este archivo se mantiene con el placeholder A PROPÓSITO para no commitear
-- el secreto. El token real ya quedó aplicado dentro de la función en la base
-- (se corrió este SQL con los valores reemplazados). Si volvés a correr el
-- archivo, reemplazá de nuevo los placeholders.


-- ── 0) Habilitar pg_net (si ya está, no hace nada) ───────────────────────────
-- Si tu proyecto no lo tiene activo, esta línea lo instala. La función queda
-- como net.http_post(...).
create extension if not exists pg_net;


-- ── A) Meta alcanzada: campaigns AFTER UPDATE → status = 'completada' ─────────
create or replace function public.notify_meta_alcanzada()
returns trigger
language plpgsql
security definer
set search_path = public, net, extensions
as $$
begin
  -- Sólo cuando recién pasa a 'completada' (evita repetir en updates futuros).
  if new.status = 'completada' and old.status is distinct from 'completada' then
    perform net.http_post(
      url     := 'https://isxhafcjdxrufoqfcaql.supabase.co/functions/v1/notify-followers',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <<AUTH_BEARER_TOKEN>>'
      ),
      body    := jsonb_build_object(
        'tipo', 'meta',
        'campaignId', new.id,
        'campaignTitle', new.title
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_meta_alcanzada on campaigns;
create trigger trg_notify_meta_alcanzada
  after update on campaigns
  for each row
  execute function public.notify_meta_alcanzada();


-- ── B) Novedad: progress_updates AFTER INSERT con update_text no vacío ────────
create or replace function public.notify_novedad()
returns trigger
language plpgsql
security definer
set search_path = public, net, extensions
as $$
declare
  v_title text;
begin
  if new.update_text is not null and length(trim(new.update_text)) > 0 then
    select title into v_title from campaigns where id = new.campaign_id;

    perform net.http_post(
      url     := 'https://isxhafcjdxrufoqfcaql.supabase.co/functions/v1/notify-followers',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <<AUTH_BEARER_TOKEN>>'
      ),
      body    := jsonb_build_object(
        'tipo', 'novedad',
        'campaignId', new.campaign_id,
        'campaignTitle', coalesce(v_title, 'Una campaña'),
        'texto', left(new.update_text, 140)
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_novedad on progress_updates;
create trigger trg_notify_novedad
  after insert on progress_updates
  for each row
  execute function public.notify_novedad();


-- NOTA: si un mismo progress_update alcanza la meta Y trae texto, se enviarán
-- dos avisos (meta + novedad). Es intencional y aceptable; si preferís sólo uno,
-- avisá y ajustamos la condición.
