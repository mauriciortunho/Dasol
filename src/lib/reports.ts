import { getSupabase } from './supabase';
import { ReportReason, ReportStatus, OpenReport } from '../types';

// Motivos con etiqueta legible en español (para el selector y la lista).
export const REPORT_REASONS: { key: ReportReason; label: string }[] = [
  { key: 'fraude_sospechoso', label: 'Fraude sospechoso' },
  { key: 'contenido_inapropiado', label: 'Contenido inapropiado' },
  { key: 'duplicada', label: 'Campaña duplicada' },
  { key: 'ya_completada', label: 'Ya está completada' },
  { key: 'otro', label: 'Otro' },
];

export const reasonLabel = (r: ReportReason): string =>
  REPORT_REASONS.find((x) => x.key === r)?.label ?? 'Otro';

async function currentUserId(): Promise<string | null> {
  const { data } = await getSupabase().auth.getUser();
  return data.user?.id ?? null;
}

// Reportar una campaña. No cambia nada de la campaña: sólo crea el registro
// (status 'abierto' por defecto en la base).
export async function createReport(params: {
  campaignId: string;
  reason: ReportReason;
  details: string | null;
}): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('reports').insert({
    campaign_id: params.campaignId,
    reporter_id: await currentUserId(),
    reason: params.reason,
    details: params.details,
  });
  if (error) throw new Error(error.message);
}

type ReportRow = {
  id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  campaign: { id: string; title: string } | { id: string; title: string }[] | null;
  reporter: { full_name: string } | { full_name: string }[] | null;
};

// Para moderadores: reportes abiertos o en revisión, con la campaña reportada
// y quién la reportó.
export async function fetchOpenReports(): Promise<OpenReport[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('reports')
    .select(
      'id, reason, details, status, created_at, ' +
        'campaign:campaigns!campaign_id(id, title), reporter:profiles!reporter_id(full_name)'
    )
    .in('status', ['abierto', 'en_revision'])
    .order('created_at', { ascending: false })
    .returns<ReportRow[]>();

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => {
    const campaign = Array.isArray(r.campaign) ? r.campaign[0] : r.campaign;
    const reporter = Array.isArray(r.reporter) ? r.reporter[0] : r.reporter;
    return {
      id: r.id,
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.created_at,
      campaignId: campaign?.id ?? '',
      campaignTitle: campaign?.title ?? 'Campaña',
      reporterName: reporter?.full_name ?? null,
    };
  });
}

// Resolver o descartar. No toca montos ni nada de la campaña.
export async function setReportStatus(
  id: string,
  status: 'resuelto' | 'descartado'
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('reports')
    .update({
      status,
      resolved_by: await currentUserId(),
      resolved_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
}
