import { getSupabase } from './supabase';
import { CampaignStatus } from '../types';

// Cambio en vivo de una campaña. La app SOLO escucha lo que el trigger movió;
// nunca escribe current_amount.
export type CampaignChange = {
  id: string;
  currentAmount: number;
  goalAmount: number;
  status: CampaignStatus;
};

type CampaignRealtimeRow = {
  id: string;
  current_amount: number | string;
  goal_amount: number | string;
  status: CampaignStatus;
};

const mapChange = (row: CampaignRealtimeRow): CampaignChange => ({
  id: String(row.id),
  currentAmount: Number(row.current_amount) || 0,
  goalAmount: Number(row.goal_amount) || 0,
  status: row.status,
});

// Cada suscripción usa un nombre de canal único. Los nombres fijos colisionan:
// al cerrar sesión el socket reconecta y supabase-js reusa el canal viejo, que
// ya pasó por subscribe(), y al re-agregar el callback tira
// "cannot add postgres_changes callbacks ... after subscribe()".
let channelSeq = 0;
const uniqueChannel = (base: string) => `${base}:${Date.now().toString(36)}:${channelSeq++}`;

// Suscripción a los UPDATE de UNA campaña (detalle). Devuelve la función para
// desuscribirse.
export function subscribeToCampaign(
  campaignId: string,
  onUpdate: (change: CampaignChange) => void
): () => void {
  const supabase = getSupabase();
  const channel = supabase
    .channel(uniqueChannel(`campaign:${campaignId}`))
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'campaigns', filter: `id=eq.${campaignId}` },
      (payload) => onUpdate(mapChange(payload.new as CampaignRealtimeRow))
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Suscripción a los UPDATE de TODAS las campañas (feed). Devuelve el unsubscribe.
export function subscribeToAllCampaigns(
  onUpdate: (change: CampaignChange) => void
): () => void {
  const supabase = getSupabase();
  const channel = supabase
    .channel(uniqueChannel('campaigns:all'))
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'campaigns' },
      (payload) => onUpdate(mapChange(payload.new as CampaignRealtimeRow))
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
