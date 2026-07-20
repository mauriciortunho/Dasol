import { getSupabase } from './supabase';
import { fetchCampaignsByIds } from './campaigns';
import { Campaign } from '../types';

// Seguir no modifica nada de la campaña ni montos: solo gestiona la fila del
// usuario en campaign_follows (la RLS deja a cada quien ver/editar las suyas).

async function currentUserId(): Promise<string | null> {
  const { data } = await getSupabase().auth.getUser();
  return data.user?.id ?? null;
}

// Idempotente: si ya seguía, no falla (insert con on conflict do nothing).
export async function followCampaign(campaignId: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId) throw new Error('Necesitás iniciar sesión.');
  const { error } = await getSupabase()
    .from('campaign_follows')
    .upsert(
      { user_id: userId, campaign_id: campaignId },
      { onConflict: 'user_id,campaign_id', ignoreDuplicates: true }
    );
  if (error) throw new Error(error.message);
}

export async function unfollowCampaign(campaignId: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId) throw new Error('Necesitás iniciar sesión.');
  const { error } = await getSupabase()
    .from('campaign_follows')
    .delete()
    .eq('user_id', userId)
    .eq('campaign_id', campaignId);
  if (error) throw new Error(error.message);
}

export async function isFollowing(campaignId: string): Promise<boolean> {
  const userId = await currentUserId();
  if (!userId) return false;
  const { data, error } = await getSupabase()
    .from('campaign_follows')
    .select('campaign_id')
    .eq('user_id', userId)
    .eq('campaign_id', campaignId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

// Campañas que sigue el usuario. Primero los campaign_id propios, luego las
// campañas (la RLS de campaigns filtra a las visibles).
export async function fetchFollowedCampaigns(): Promise<Campaign[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  const { data, error } = await getSupabase()
    .from('campaign_follows')
    .select('campaign_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const ids = (data ?? []).map((r) => r.campaign_id as string);
  return fetchCampaignsByIds(ids);
}
