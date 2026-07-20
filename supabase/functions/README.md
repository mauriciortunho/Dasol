# Edge Functions — notificaciones push (etapa 2)

Función `notify-followers`: recibe un evento de una campaña y manda push (vía
Expo Push) a quienes la **siguen**. Sólo notifica; no toca montos ni datos.

Disparada por triggers de la base (ver `db/migrations/009_notify_followers_triggers.sql`):
- **meta** → la campaña pasó a `completada`.
- **novedad** → se publicó un `progress_update` con texto.

## Requisitos previos (una vez)

```bash
# Supabase CLI instalado y logueado
supabase login

# Enlazar el repo con tu proyecto (te pide la ref del proyecto)
supabase link --project-ref <TU-REF-DE-PROYECTO>
```

## 1) Secrets de la función

La plataforma ya inyecta `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
automáticamente, así que **normalmente no necesitás setear nada**.

Si querés forzar un service role explícito (opcional), seteá `SERVICE_ROLE_KEY`
(sin el prefijo reservado `SUPABASE_`):

```bash
supabase secrets set SERVICE_ROLE_KEY=<tu-service-role-key>
```

> Nunca subas la key al repo. Va sólo como secret.

## 2) Desplegar

La función no recibe un usuario final (la llama un trigger interno), así que se
despliega sin verificación de JWT:

```bash
supabase functions deploy notify-followers --no-verify-jwt
```

(Si preferís dejar `verify_jwt` activo, el trigger igual manda un `Authorization:
Bearer <key>` válido; ver el SQL.)

## 3) URL que queda y dónde pegarla

Tras el deploy, la URL es:

```
https://<TU-REF-DE-PROYECTO>.supabase.co/functions/v1/notify-followers
```

Pegá esa URL en `db/migrations/009_notify_followers_triggers.sql` reemplazando
**`<<EDGE_FUNCTION_URL>>`** (aparece en las dos funciones), y reemplazá
**`<<AUTH_BEARER_TOKEN>>`** por tu **service role key** (o el anon key) del
proyecto. Recién entonces corré ese SQL en el SQL Editor.

## 4) Probar a mano (opcional)

```bash
curl -X POST 'https://<TU-REF-DE-PROYECTO>.supabase.co/functions/v1/notify-followers' \
  -H 'Authorization: Bearer <service-role-o-anon-key>' \
  -H 'Content-Type: application/json' \
  -d '{"tipo":"novedad","campaignId":"<id-de-una-campaña>","campaignTitle":"Prueba","texto":"Hola"}'
```

Debería responder `{"ok":true,"sent":N,...}` y llegar el push a los seguidores
de esa campaña que tengan token registrado (etapa 1).
