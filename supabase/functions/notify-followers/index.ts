// Edge Function: notify-followers
// Notifica (push) a quienes SIGUEN una campaña cuando:
//   - tipo 'meta'    → la campaña llegó a su meta (pasó a 'completada').
//   - tipo 'novedad' → la campaña publicó una novedad con texto.
//
// REGLAS: esto sólo notifica, no toca montos ni datos. Privacidad: se notifica
// únicamente a los user_id presentes en campaign_follows para esa campaña.
//
// Lee credenciales SOLO de variables de entorno (nunca hardcodeadas):
//   - SUPABASE_URL                (lo inyecta la plataforma automáticamente)
//   - SERVICE_ROLE_KEY            (secret propio; cae a SUPABASE_SERVICE_ROLE_KEY,
//                                  que también inyecta la plataforma)
// Se usa el service role para leer follows/tokens saltando RLS.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100; // Expo acepta hasta 100 mensajes por request.

type Tipo = 'meta' | 'novedad';

interface Payload {
  tipo: Tipo;
  campaignId: string;
  campaignTitle: string;
  texto?: string; // sólo para 'novedad'
}

interface ExpoMessage {
  to: string;
  sound: 'default';
  title: string;
  body: string;
  channelId: 'default';
  data: { campaignId: string };
}

// Título/cuerpo cálidos, en español sentence case.
function buildContent(p: Payload): { title: string; body: string } {
  const titulo = p.campaignTitle?.trim() || 'Una campaña';
  if (p.tipo === 'meta') {
    return {
      title: `¡${titulo} llegó a su meta!`,
      body: 'Gracias por ser parte. Tocá para ver cómo quedó.',
    };
  }
  const texto = p.texto?.trim();
  return {
    title: `${titulo} publicó una novedad`,
    body: texto && texto.length > 0 ? texto : 'Tocá para ver la novedad.',
  };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405);
  }

  // ---- Validar payload ----
  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Body inválido (se esperaba JSON)' }, 400);
  }

  const { tipo, campaignId, campaignTitle } = payload ?? {};
  if ((tipo !== 'meta' && tipo !== 'novedad') || !campaignId || !campaignTitle) {
    return json({ error: 'Faltan campos: tipo, campaignId, campaignTitle' }, 400);
  }

  // ---- Cliente con service role (salta RLS para leer follows/tokens) ----
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey =
    Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Faltan SUPABASE_URL o SERVICE_ROLE_KEY en el entorno.');
    return json({ error: 'Configuración del servidor incompleta' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1) Quiénes siguen la campaña.
    const { data: follows, error: followsError } = await supabase
      .from('campaign_follows')
      .select('user_id')
      .eq('campaign_id', campaignId);

    if (followsError) throw followsError;

    const userIds = [...new Set((follows ?? []).map((f) => f.user_id))];
    if (userIds.length === 0) {
      return json({ ok: true, sent: 0, reason: 'La campaña no tiene seguidores' });
    }

    // 2) Tokens de esos usuarios.
    const { data: tokenRows, error: tokensError } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds);

    if (tokensError) throw tokensError;

    const tokens = [...new Set((tokenRows ?? []).map((t) => t.token).filter(Boolean))];
    if (tokens.length === 0) {
      return json({ ok: true, sent: 0, reason: 'Los seguidores no tienen tokens' });
    }

    // 3) Armar mensajes para Expo Push.
    const { title, body } = buildContent(payload);
    const messages: ExpoMessage[] = tokens.map((to) => ({
      to,
      sound: 'default',
      title,
      body,
      channelId: 'default',
      data: { campaignId },
    }));

    // 4) Enviar en lotes de 100.
    let sent = 0;
    const errors: unknown[] = [];
    for (const batch of chunk(messages, BATCH_SIZE)) {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(batch),
      });

      if (!res.ok) {
        const detail = await res.text();
        console.error(`Expo Push respondió ${res.status}: ${detail}`);
        errors.push({ status: res.status, detail });
        continue;
      }
      sent += batch.length;
    }

    console.log(
      `notify-followers: tipo=${tipo} campaña=${campaignId} seguidores=${userIds.length} ` +
        `tokens=${tokens.length} enviados=${sent} errores=${errors.length}`
    );

    return json({ ok: errors.length === 0, sent, tokens: tokens.length, errors });
  } catch (e) {
    console.error('notify-followers falló:', e);
    return json({ error: 'Error al notificar', detail: String(e) }, 500);
  }
});
