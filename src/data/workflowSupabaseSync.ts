import type { CreditReportRecord } from '../domain/creditReports';
import type { EvidenceItem } from '../domain/evidence';
import type { LetterRecord } from '../domain/letters';
import type { DisputeCase } from '../domain/cases';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { mergeEvidenceSnapshotForPartner } from './evidenceRepo';
import { mergeLettersSnapshotForPartner } from './lettersRepo';
import { replaceReportsSnapshotForPartner } from './reportsRepo';
import { replaceCasesSnapshotForPartner } from './casesRepo';

function safeStr(v: any) {
  return String(v ?? '').trim();
}

export async function pullWorkflowSnapshotFromSupabase(args: { partnerId: string }) {
  try {
    const partnerId = safeStr(args.partnerId);
    if (!partnerId) return;
    if (!isSupabaseConfigured) return;

    const [reportsRes, evidenceRes, lettersRes, casesRes] = await Promise.all([
      supabase.from('credit_reports').select('*').eq('partner_id', partnerId).order('received_at', { ascending: false }).limit(200),
      supabase.from('evidence').select('*').eq('partner_id', partnerId).order('created_at', { ascending: false }).limit(500),
      supabase.from('letters').select('*').eq('partner_id', partnerId).order('created_at', { ascending: false }).limit(300),
      supabase.from('cases').select('*').eq('partner_id', partnerId).order('updated_at', { ascending: false }).limit(300),
    ]);

    if (reportsRes.error) {
      console.warn('Error fetching credit reports from Supabase:', reportsRes.error.message);
      return;
    }
    if (evidenceRes.error) {
      console.warn('Error fetching evidence from Supabase:', evidenceRes.error.message);
      return;
    }
    if (lettersRes.error) {
      console.warn('Error fetching letters from Supabase:', lettersRes.error.message);
      return;
    }
    if (casesRes.error) {
      console.warn('Error fetching cases from Supabase:', casesRes.error.message);
      return;
    }

    const reports: CreditReportRecord[] = (reportsRes.data ?? [])
      .map((r: any) => (r?.data ?? null))
      .filter(Boolean)
      .map((d: any) => d as CreditReportRecord);

    const evidence: EvidenceItem[] = (evidenceRes.data ?? []).map((r: any) => ({
      id: safeStr(r.id),
      partnerId: safeStr(r.partner_id),
      reportId: safeStr(r.report_id) || undefined,
      type: safeStr(r.type) as any,
      source: safeStr(r.source) || undefined,
      sectionKey: safeStr(r.section_key) || undefined,
      creditorName: safeStr(r.creditor_name) || undefined,
      caption: safeStr(r.caption) || undefined,
      filename: safeStr(r.filename) || undefined,
      mimeType: safeStr(r.mime_type) || undefined,
      sizeBytes: r.size_bytes != null ? Number(r.size_bytes) : undefined,
      blobRef: safeStr(r.blob_ref) || undefined,
      createdAt: safeStr(r.created_at),
    })) as any;

    const letters: LetterRecord[] = (lettersRes.data ?? []).map((r: any) => ({
      id: safeStr(r.id),
      partnerId: safeStr(r.partner_id),
      type: safeStr(r.type) as any,
      title: safeStr(r.title),
      body: safeStr(r.body),
      createdAt: safeStr(r.created_at),
      archivedAt: r.archived_at ? safeStr(r.archived_at) : null,
      status: safeStr(r.status) || undefined,
      meta: r.meta ?? undefined,
      pdfBlobRef: safeStr(r.pdf_blob_ref) || undefined,
      pdfFilename: safeStr(r.pdf_filename) || undefined,
      relatedEvidenceIds: r.related_evidence_ids ?? undefined,
      mailing: r.mailing ?? undefined,
    })) as any;

    const cases: DisputeCase[] = (casesRes.data ?? []).map((r: any) => ({
      id: safeStr(r.id),
      partnerId: safeStr(r.partner_id),
      projectId: safeStr(r.project_id) || undefined,
      bureau: safeStr(r.bureau) as any,
      title: safeStr(r.title),
      status: safeStr(r.status) as any,
      createdAt: safeStr(r.created_at),
      updatedAt: safeStr(r.updated_at),
      latestReportId: safeStr(r.latest_report_id) || undefined,
      items: (r.items ?? []) as any,
      rounds: (r.rounds ?? []) as any,
    })) as any;

    replaceReportsSnapshotForPartner({ partnerId, reports });
    // Use a non-destructive merge for evidence + letters so a blocked/failed
    // server write can't erase something the user just captured/generated.
    mergeEvidenceSnapshotForPartner({ partnerId, items: evidence });
    mergeLettersSnapshotForPartner({ partnerId, letters });
    replaceCasesSnapshotForPartner({ partnerId, cases });
  } catch (err: any) {
    console.warn('Error syncing workflow from Supabase:', err?.message || String(err));
  }
}

