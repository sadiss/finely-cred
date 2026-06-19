// Edge Function: admin-import-legacy
// POST { export: LegacyPartnerExportV1 } — service-role upsert of partners + workflow metadata
// Ensures legacy clients/reports/docs/letters persist server-side (not only browser localStorage).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { json, requireAuth, requireEnv } from '../_shared/edgeGuard.ts';
import { classifyLegacyFileName } from '../_shared/classifyLegacyFileName.ts';

const ADMIN_EMAILS = new Set([
  'partnersupport@finelycred.com',
  'sanzstlouis@finelycred.com',
  'shellystlouis@finelycred.com',
]);

const LEGACY_BLOB_PREFIX = 'legacy:pending-reupload:';
const TENANT_ID = 'finely_cred';

function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.trim().toLowerCase());
}

function stableId(prefix: string, ...parts: string[]): string {
  const raw = parts.join('|');
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0;
  return `${prefix}_${Math.abs(h).toString(16)}_${raw.length}`;
}

function legacyBlobRef(filename: string) {
  return `${LEGACY_BLOB_PREFIX}${filename}`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mapLegacyBureau(raw?: string): string {
  const b = (raw || '').trim().toUpperCase();
  if (b.includes('EXP')) return 'EXP';
  if (b.includes('EQF') || b.includes('EQUIFAX')) return 'EQF';
  if (b.includes('TUC') || b.includes('TRANSUNION')) return 'TUC';
  return 'EXP';
}

function parseReceivedAt(raw?: string): string {
  const s = (raw || '').trim();
  if (!s) return new Date().toISOString();
  const d = new Date(s.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  let ctx: Awaited<ReturnType<typeof requireAuth>>;
  try {
    ctx = await requireAuth(req);
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const userEmail = ctx.user.email?.trim().toLowerCase() || '';
  let adminAllowed = isAdmin(userEmail);
  if (!adminAllowed) {
    const { data: adminRow } = await adminClient.from('admin_emails').select('email').eq('email', userEmail).maybeSingle();
    adminAllowed = Boolean(adminRow);
  }
  if (!adminAllowed) return json({ error: 'Forbidden: not an admin' }, { status: 403 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const exportData = body?.export;
  if (!exportData || exportData.version !== 1 || !Array.isArray(exportData.partners)) {
    return json({ error: 'Missing or invalid export (expected version=1 with partners[])' }, { status: 400 });
  }

  const summary = {
    partnersUpserted: 0,
    reportsUpserted: 0,
    evidenceUpserted: 0,
    lettersUpserted: 0,
    errors: [] as Array<{ externalId?: string; message: string }>,
  };

  for (const p of exportData.partners) {
    const externalId = String(p?.externalId || '').trim();
    const fullName = String(p?.fullName || '').trim();
    if (!externalId || !fullName) {
      summary.errors.push({ externalId, message: 'Missing externalId or fullName' });
      continue;
    }

    try {
      const { data: existingRows } = await adminClient
        .from('partners')
        .select('id, notes')
        .eq('import_external_id', externalId)
        .limit(1);

      let partnerId = existingRows?.[0]?.id as string | undefined;
      const now = new Date().toISOString();
      const notesText = p.notes ? String(p.notes).trim() : '';

      if (!partnerId) {
        partnerId = stableId('partner', externalId);
        const row = {
          id: partnerId,
          tenant_id: TENANT_ID,
          status: 'active',
          profile: {
            fullName,
            email: p.email ? String(p.email).trim() : undefined,
            phone: p.phone ? String(p.phone).trim() : undefined,
          },
          primary_route: p.primaryRoute ?? 'personal_restore',
          lane: p.lane ?? null,
          journey_stage: p.journeyStage ?? null,
          journey_signals: p.journeySignals ?? {},
          import_source: 'laravel',
          import_external_id: externalId,
          notes: notesText || null,
          routes: {},
          consents: {},
          created_at: now,
          updated_at: now,
        };
        const { error } = await adminClient.from('partners').upsert(row, { onConflict: 'id' });
        if (error) throw new Error(error.message);
        summary.partnersUpserted += 1;
      } else {
        const patch: Record<string, unknown> = { updated_at: now };
        if (notesText && !existingRows?.[0]?.notes) patch.notes = notesText;
        const { error } = await adminClient.from('partners').update(patch).eq('id', partnerId);
        if (error) throw new Error(error.message);
        summary.partnersUpserted += 1;
      }

      for (const doc of p.legacyDocuments ?? []) {
        const fileName = String(doc?.fileName || '').trim();
        if (!fileName) continue;
        const classification = classifyLegacyFileName(fileName);
        const receivedAt = parseReceivedAt(doc.uploadedAt);

        if (classification.kind === 'credit_report') {
          const id = stableId('report', externalId, fileName);
          const fileType = fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'html';
          const record = {
            id,
            partnerId,
            provider: 'unknown',
            fileType,
            uploadedBy: 'admin',
            receivedAt,
            filename: fileName,
            mimeType: fileType === 'pdf' ? 'application/pdf' : 'text/html',
            sizeBytes: 0,
            rawBlobRef: legacyBlobRef(fileName),
          };
          const { error } = await adminClient.from('credit_reports').upsert(
            {
              id,
              partner_id: partnerId,
              received_at: receivedAt,
              filename: fileName,
              provider: 'unknown',
              data: record,
              updated_at: now,
            },
            { onConflict: 'id' },
          );
          if (error) throw new Error(`report: ${error.message}`);
          summary.reportsUpserted += 1;
          continue;
        }

        const id = stableId('evidence', externalId, fileName);
        const { error } = await adminClient.from('evidence').upsert(
          {
            id,
            partner_id: partnerId,
            type: 'upload',
            source: 'upload',
            caption: classification.caption,
            filename: fileName,
            mime_type: 'application/octet-stream',
            size_bytes: 0,
            blob_ref: legacyBlobRef(fileName),
            created_at: receivedAt,
          },
          { onConflict: 'id' },
        );
        if (error) throw new Error(`evidence: ${error.message}`);
        summary.evidenceUpserted += 1;
      }

      for (const rep of p.legacyReports ?? []) {
        const fileName = String(rep?.fileName || '').trim();
        if (!fileName) continue;
        const id = stableId('report', externalId, fileName);
        const receivedAt = parseReceivedAt(rep.uploadedAt);
        const fileType = fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'html';
        const record = {
          id,
          partnerId,
          provider: 'unknown',
          fileType,
          uploadedBy: 'admin',
          receivedAt,
          filename: fileName,
          mimeType: fileType === 'pdf' ? 'application/pdf' : 'text/html',
          sizeBytes: 0,
          rawBlobRef: legacyBlobRef(fileName),
        };
        const { error } = await adminClient.from('credit_reports').upsert(
          {
            id,
            partner_id: partnerId,
            received_at: receivedAt,
            filename: fileName,
            provider: 'unknown',
            data: record,
            updated_at: now,
          },
          { onConflict: 'id' },
        );
        if (error) throw new Error(`report: ${error.message}`);
        summary.reportsUpserted += 1;
      }

      for (const letter of p.legacyLetters ?? []) {
        const extId = String(letter?.externalId || '').trim();
        if (!extId) continue;
        const id = stableId('letter', extId);
        const bodyHtml = String(letter?.bodyHtml || letter?.body || '').trim();
        const plain = bodyHtml.startsWith('<') ? stripHtml(bodyHtml) : bodyHtml;
        const { error } = await adminClient.from('letters').upsert(
          {
            id,
            partner_id: partnerId,
            type: 'dispute',
            title: letter?.title ? String(letter.title) : 'Legacy dispute letter',
            body: plain || '[Legacy letter — body was empty in export]',
            status: 'generated',
            meta: {
              bureau: mapLegacyBureau(letter?.bureau),
              round: '1',
              tone: 'formal',
              candidateIds: [],
              evidenceByCandidateId: {},
              reasonsByCandidateId: {},
              introOverride: `[legacy-import:${extId}]`,
              legacyExternalId: extId,
            },
            created_at: parseReceivedAt(letter?.createdAt),
          },
          { onConflict: 'id' },
        );
        if (error) throw new Error(`letter: ${error.message}`);
        summary.lettersUpserted += 1;
      }
    } catch (e) {
      summary.errors.push({ externalId, message: (e as Error)?.message || 'Import failed' });
    }
  }

  return json({ ok: true, summary });
});
