# CLAUDE.md

Contexto del proyecto para Claude Code. Leelo antes de cualquier cambio y respetá las decisiones marcadas como **no negociables**.

## Qué es el proyecto

App móvil solidaria para **Santa Cruz de la Sierra, Bolivia**. Junta en un solo lugar campañas de ayuda (enfermedad, rescate de animales, desastres, etc.) que hoy circulan sueltas por WhatsApp. Cada campaña muestra una historia, una meta en bolivianos, una barra de progreso y un QR para aportar. La gente aporta y la barra se acerca a la meta.

Público: personas de Santa Cruz que quieren ayudar y organizadores que levantan un caso. Tono: cálido, humano, confiable. No es una fintech fría ni un clon genérico de crowdfunding.

## Principios que no se negocian

1. **La app NO custodia ni procesa dinero.** Cada campaña muestra el QR Simple propio del organizador; la gente paga directo a esa cuenta. Custodiar fondos implicaría regulación de ASFI y queda fuera de alcance hasta nuevo aviso.
2. **El monto recaudado (`current_amount`) tiene una sola fuente: el organizador, vía `progress_updates`.** Idealmente leyendo el saldo de una cuenta bancaria dedicada a la campaña. Nada más debe modificar ese total.
3. **Las fotos de comprobante (`payment_notifications`) y los montos auto-reportados en mensajes NO suman al total.** Son prueba social y ayuda de conciliación. Una captura editada jamás debe poder inflar la barra.
4. **Anti-fraude primero.** Las campañas nacen en estado `en_revision` y solo se muestran al público cuando un moderador las aprueba. Los documentos de verificación son privados.
5. **Diseño y reglas viven centralizados.** Identidad visual en `theme.ts`; reglas de acceso en las políticas RLS del esquema. No dupliques colores ni lógica de permisos por ahí suelta.

## Stack técnico

- **React Native + Expo + TypeScript.**
- **Navegación:** `@react-navigation/native` + `@react-navigation/native-stack`.
- **Iconos:** `@expo/vector-icons` (Ionicons), ya incluido en Expo.
- **Backend (objetivo):** Supabase — Postgres, Auth, Storage (fotos/QR), RLS y Realtime para la barra en vivo.
- **Estado actual de datos:** mock en `src/mockData.ts`. Supabase todavía NO está conectado.

## Modelo de datos

El esquema completo y comentado está en `schema.sql` (PostgreSQL/Supabase). Tablas principales:

- `profiles` — extiende `auth.users`. `role` distingue `user` / `moderator` / `admin`. Ser organizador no es un rol: es haber creado una campaña.
- `campaigns` — el caso. Incluye `goal_amount`, `current_amount`, QR (`qr_image_url`, `qr_bank_name`, `account_holder_name`), estado de moderación, y los campos de cuenta dedicada (`uses_dedicated_account`, `dedicated_account_verified`).
- `verification_documents` — **privados** (solo organizador dueño + moderadores vía RLS). Núcleo anti-fraude.
- `progress_updates` — el organizador reporta `new_total` y/o deja noticias. Un **trigger** sincroniza `campaigns.current_amount` y marca `completada` al llegar a la meta. **Única fuente del total.**
- `support_messages` — mensajes de apoyo. `self_reported_amount` es informativo, no afecta el total.
- `payment_notifications` — aviso de "ya pagué" con foto. Estado `pendiente`/`confirmado`/`rechazado`. **No modifica `current_amount`.** Privados por RLS.
- `reports` — denuncias de campañas.
- `campaign_follows`, `campaign_images`.

Invariantes a respetar siempre:
- Cambios de monto solo por inserción en `progress_updates`.
- Confirmar un `payment_notification` cambia su `status`, nunca suma al total automáticamente.
- Toda tabla con RLS habilitado; al agregar tablas, definir políticas en el mismo estilo que las existentes.

## SQL: historial de migraciones (no negociable)

Cada vez que se le pida al usuario correr algo en el **SQL Editor de Supabase**, ese SQL se guarda en un archivo dentro de `db/migrations/`, nunca solo en el chat. Así queda el historial de lo que se envió a la base.

- **Un archivo por entrega de SQL**, con prefijo numérico secuencial: `db/migrations/NNN_descripcion-corta.sql` (ej. `001_storage_policies.sql`).
- **Título arriba** en un comentario que diga qué hace ese bloque; si el archivo tiene varias partes, cada parte lleva su propio subtítulo en comentario.
- El mensaje del chat **referencia el archivo** (ej. "corré `db/migrations/004_...sql`") en vez de pegar el SQL suelto.
- `schema.sql` sigue siendo el esquema completo y vigente (fuente de la verdad del modelo); `db/migrations/` es el registro cronológico de lo que se fue aplicando sobre una base ya creada.

## Sistema de diseño

Todo sale de `src/theme.ts`. No hardcodees colores ni tamaños en componentes.

- **Paleta:** verde profundo `#1B5E4A` (principal, confianza), ámbar cálido `#E8963C` (acento y progreso), fondo blanco tibio `#FBFAF7`, texto `#1C2520`. Cada categoría tiene su color.
- **Tipografía:** escala en `type` (display 28 / h1 22 / h2 18 / body 15 / small 13 / caption 12). Dos pesos efectivos: 400 y 600/700.
- **Pieza protagonista:** la barra de progreso (`ProgressBar`). Es de lo que se trata la app; cuidá su jerarquía visual.
- **Copy:** español, sentence case, voz activa y humana. El botón dice lo que hace. Nada de Title Case ni MAYÚSCULAS (salvo el kicker del feed).
- **Plata:** formatear con `formatBs()` (punto de miles). No usar `toLocaleString`/Intl, que falla en algunos motores de RN.

## Estructura del proyecto

```
App.tsx                              # entrada + navegación (stack)
src/
  theme.ts                           # tokens de diseño + categorías + formatBs
  mockData.ts                        # campañas de ejemplo (reemplazar por Supabase)
  components/
    ProgressBar.tsx                  # barra de progreso (prop `large` para detalle)
    CampaignCard.tsx                 # tarjeta del feed
  screens/
    FeedScreen.tsx                   # lista + filtros por categoría
    CampaignDetailScreen.tsx         # historia, progreso, QR, mensajes
```

Convención: pantallas en `src/screens`, piezas reutilizables en `src/components`, tipos de dominio en `src/mockData.ts` (migrarán a `src/types.ts` o a tipos generados de Supabase cuando conectemos).

## Convenciones de código

- TypeScript estricto; los tipos de dominio reflejan el esquema (camelCase en TS, snake_case en la base).
- Componentes funcionales con `StyleSheet.create`. Estilos al pie del archivo.
- Enums de la base en español (`'salud'`, `'en_revision'`, etc.); mantener consistencia con `schema.sql`.
- Textos visibles en español. No mezclar inglés en la UI.
- Importar tokens desde `theme.ts`, nunca repetir hex sueltos.

## Estado actual

- ✅ Esquema de base de datos (`schema.sql`).
- ✅ Feed con filtros y tarjetas.
- ✅ Detalle de campaña con QR, progreso y mensajes de apoyo.
- ✅ Sistema de diseño en `theme.ts`.
- ⏳ Botón "avisar pago": hoy es un stub (muestra un `Alert`).
- ❌ Pantalla de crear campaña.
- ❌ Conexión a Supabase (todo corre con mock).
- ❌ Auth, panel de moderación.

## Próximos pasos (orden tentativo)

1. Pantalla de **avisar pago** (subir foto de comprobante + monto → `payment_notifications`).
2. Pantalla de **crear campaña** (con subida de documentos de verificación; nace en `en_revision`).
3. **Conectar Supabase**: cliente, auth, lecturas del feed/detalle, Storage para imágenes, y luego Realtime para la barra.
4. Panel/flujo de **moderación**.

## Qué NO hacer

- No hacer que la app reciba, retenga o reparta dinero.
- No dejar que `payment_notifications` ni `self_reported_amount` modifiquen `current_amount`.
- No exponer `verification_documents` ni `payment_notifications` a usuarios que no sean el dueño/moderador.
- No mostrar campañas en estado distinto de `aprobada`/`completada` al público.
- No introducir librerías de UI pesadas ni cambiar la identidad visual sin tocar `theme.ts`.
- No usar `localStorage`/Intl ni asumir APIs de web; es React Native.
