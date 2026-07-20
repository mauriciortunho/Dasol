-- =============================================================
-- SEED de prueba — App Solidaria
-- Crea un par de campañas APROBADAS para ver el feed funcionando.
--
-- Respeta los invariantes de CLAUDE.md:
--  · current_amount NO se escribe a mano: arranca en 0 y se mueve sólo
--    insertando en progress_updates (el trigger sincroniza el total).
--  · Las campañas nacen visibles sólo si están 'aprobada'/'completada'.
--
-- REQUISITO (un paso manual):
--  1) En el panel de Supabase: Authentication > Users > Add user.
--     Creá un usuario (email + contraseña cualquiera).
--  2) Copiá su "User UID" y pegalo abajo en :uid (reemplazá el placeholder).
-- =============================================================

-- ---------- 1) Perfil del organizador ----------
-- Reemplazá 'PEGA-EL-UUID-AQUI' por el UID del usuario que creaste.
insert into profiles (id, full_name, phone, role, is_verified)
values ('783ffc8a-747b-4e30-b7af-d8451a4e52ba', 'Organizador demo', '+591 70000000', 'user', true)
on conflict (id) do nothing;

-- ---------- 2) Campañas (aprobadas, current_amount = 0 por defecto) ----------
insert into campaigns (
  organizer_id, title, slug, story, category, beneficiary_name,
  goal_amount, currency, qr_image_url, qr_bank_name, account_holder_name,
  uses_dedicated_account, dedicated_account_verified, cover_image_url,
  status, location
)
select p.id,
  'Una mano para la cirugía de cadera de Doña Marta', 'cirugia-marta',
  'Doña Marta tiene 68 años y se cayó hace dos semanas. Necesita una prótesis de cadera para volver a caminar. Su familia ya cubrió los estudios, pero la operación se les escapa de las manos.',
  'salud', 'Marta Áñez', 20000, 'BOB',
  'https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=PAGO-MARTA',
  'BNB', 'Marta Áñez Suárez', true, true,
  'https://picsum.photos/seed/marta/800/500', 'aprobada', 'Santa Cruz de la Sierra'
from profiles p where p.full_name = 'Organizador demo'
on conflict (slug) do nothing;

insert into campaigns (
  organizer_id, title, slug, story, category, beneficiary_name,
  goal_amount, currency, qr_image_url, qr_bank_name, account_holder_name,
  uses_dedicated_account, dedicated_account_verified, cover_image_url,
  status, location
)
select p.id,
  'Operación urgente para Rocco, atropellado en el 4to anillo', 'operacion-rocco',
  'Rocco es un perrito que apareció herido cerca del mercado. Una rescatista lo llevó a la veterinaria y necesita una cirugía de la pata trasera. Ya está internado y estable, pero la operación no espera.',
  'animales', 'Rocco (rescate)', 3500, 'BOB',
  'https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=PAGO-ROCCO',
  'Banco Mercantil Santa Cruz', 'Refugio Patitas SC', true, true,
  'https://picsum.photos/seed/rocco/800/500', 'aprobada', 'Santa Cruz de la Sierra'
from profiles p where p.full_name = 'Organizador demo'
on conflict (slug) do nothing;

-- ---------- 3) Monto recaudado: SÓLO vía progress_updates ----------
-- El trigger sync_campaign_amount refleja new_total en campaigns.current_amount.
insert into progress_updates (campaign_id, new_total, update_text)
select id, 12350, 'Ya juntamos buena parte, ¡gracias a todos!'
from campaigns where slug = 'cirugia-marta';

insert into progress_updates (campaign_id, new_total, update_text)
select id, 2890, 'Rocco está estable y esperando la cirugía.'
from campaigns where slug = 'operacion-rocco';

-- ---------- 4) Mensajes de apoyo (prueba social, no afectan el total) ----------
insert into support_messages (campaign_id, message, self_reported_amount, is_anonymous)
select id, 'Fuerza Doña Marta, pronto va a estar caminando.', 100, true
from campaigns where slug = 'cirugia-marta';

insert into support_messages (campaign_id, message, is_anonymous)
select id, 'Lo poco que pude, de corazón.', true
from campaigns where slug = 'cirugia-marta';

insert into support_messages (campaign_id, message, self_reported_amount, is_anonymous)
select id, 'Gracias por rescatarlo 🐾', 50, true
from campaigns where slug = 'operacion-rocco';
