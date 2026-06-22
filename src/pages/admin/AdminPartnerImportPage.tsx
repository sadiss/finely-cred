import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Database, FileJson, FileArchive, Link, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import { PageShell } from '../../components/layout/PageShell';
import type { LegacyPartnerExportV1 } from '../../domain/imports';
import { importLegacyPartners, importLegacyArtifactsForExistingPartners, listImportBatches } from '../../data/importsRepo';
import { pushLegacyExportToServer } from '../../lib/legacyImportServerClient';
import { getPartner, listPartners } from '../../data/partnersRepo';
import type { Partner } from '../../domain/partners';
import { createInvite, getInvite, listInvitesByPartner, upsertInvite } from '../../data/invitesRepo';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { seedLegacyReferralAttributions, formatLegacyArtifactImportSummary } from '../../data/legacyPartnerArtifactsImport';
import { listAffiliatesByTenant } from '../../data/affiliateRepo';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { buildLegacyMigrationFromSql, auditRowsToCsv, type LegacyMigrationAuditResult } from '../../lib/legacyMigrationExport';
import { assessLegacyMigrationSignOff } from '../../lib/legacyMigrationSignOff';
import { formatLegacyArtifactBreakdown, summarizeLegacyExportArtifacts } from '../../lib/legacyArtifactBreakdown';
import bundledExport from '../../../data/legacy-migration/legacy-partners-export-v1.json';
import { getBlobStore } from '../../storage/getBlobStore';
import { listReportsByPartner, upsertReport } from '../../data/reportsRepo';
import { isLegacyPendingReportBlob, legacyPendingReportFilename } from '../../lib/legacyPendingReport';
import { parseHtmlReportWithCache, parsePdfReportWithCache } from '../../lib/reportParsePipeline';
import { computeReportIdentityCheck } from '../../creditReports/identityCheck';
import { detectProviderFromHtml, detectProviderFromText } from '../../creditReports/detectProvider';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';
import { sendInviteEmail, sendInviteSms } from '../../lib/inviteDeliveryClient';

function safeParseJson(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function asExportV1(obj: any): LegacyPartnerExportV1 | null {
  if (!obj || typeof obj !== 'object') return null;
  if (obj.version !== 1) return null;
  if (!Array.isArray(obj.partners)) return null;
  return obj as LegacyPartnerExportV1;
}

export default function AdminPartnerImportPage() {
  const navigate = useNavigate();
  const [raw, setRaw] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastInviteIds, setLastInviteIds] = useState<string[]>([]);
  const [sendBusyId, setSendBusyId] = useState<string | null>(null);
  const [invitePartnerById, setInvitePartnerById] = useState<Map<string, Partner>>(new Map());
  const [auditResult, setAuditResult] = useState<LegacyMigrationAuditResult | null>(null);
  const [dryRunOnly, setDryRunOnly] = useState(false);
  const [importArtifacts, setImportArtifacts] = useState(true);
  const [autoSendInvites, setAutoSendInvites] = useState(() => isFeatureEnabled('inviteDelivery'));
  const [affiliateId, setAffiliateId] = useState('');
  const [affiliates, setAffiliates] = useState<Array<{ id: string; label: string }>>([]);

  useEffect(() => {
    listAffiliatesByTenant(FINELY_TENANT_ID).then((rows) => {
      setAffiliates(rows.map((a) => ({ id: a.id, label: `${a.fullName || a.email} (${a.id})` })));
      if (rows.length === 1) setAffiliateId(rows[0].id);
    });
  }, []);

  const [claimBaseUrl, setClaimBaseUrl] = useState<string>(() => {
    try {
      return `${window.location.origin}/claim`;
    } catch {
      return '/claim';
    }
  });

  const parsed = useMemo(() => asExportV1(safeParseJson(raw)), [raw]);

  const preview = useMemo(() => {
    const partners = parsed?.partners ?? [];
    return partners.slice(0, 8);
  }, [parsed]);

  const auditPreview = useMemo(() => auditResult?.rows.filter((r) => r.isReal).slice(0, 8) ?? [], [auditResult]);

  const [existingByExternalId, setExistingByExternalId] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    // No need to pre-check existing partners; import handles deduplication via Supabase
    setExistingByExternalId(new Map());
  }, [raw]);

  const [zipBusy, setZipBusy] = useState(false);
  const [zipLog, setZipLog] = useState<string[]>([]);
  const [zipErr, setZipErr] = useState<string | null>(null);

  const runZipRestore = async (file: File) => {
    setZipBusy(true);
    setZipLog([]);
    setZipErr(null);
    const log: string[] = [];
    const addLog = (msg: string) => { log.push(msg); setZipLog([...log]); };
    try {
      addLog(`Reading ZIP: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)…`);
      const zip = await JSZip.loadAsync(file);

      // Build a flat map of basename → JSZip entry (skip directories)
      const fileMap = new Map<string, JSZip.JSZipObject>();
      zip.forEach((relativePath, entry) => {
        if (entry.dir) return;
        const basename = relativePath.split('/').pop()!;
        fileMap.set(basename, entry);
        // Also index without extension variations
        fileMap.set(basename.toLowerCase(), entry);
      });
      addLog(`ZIP contains ${fileMap.size / 2} file(s). Scanning all partners for pending report placeholders…`);

      const allPartners = await listPartners();
      let matched = 0;
      let uploaded = 0;
      let skipped = 0;

      for (const partner of allPartners) {
        const reports = listReportsByPartner(partner.id);
        for (const report of reports) {
          if (!isLegacyPendingReportBlob(report.rawBlobRef)) continue;
          const filename = legacyPendingReportFilename(report.rawBlobRef);
          matched++;

          // Try exact match then lowercase match
          const entry = fileMap.get(filename) ?? fileMap.get(filename.toLowerCase());
          if (!entry) {
            addLog(`  ⚠ No file in ZIP for: ${filename} (${partner.profile?.fullName ?? partner.id})`);
            skipped++;
            continue;
          }

          addLog(`  ↑ Uploading ${filename} for ${partner.profile?.fullName ?? partner.id}…`);
          try {
            const bytes = await entry.async('arraybuffer');
            const isPdf = filename.toLowerCase().endsWith('.pdf');
            const mimeType = isPdf ? 'application/pdf' : 'text/html';
            const blob = new Blob([bytes], { type: mimeType });
            const fileObj = new File([blob], filename, { type: mimeType });

            const store = getBlobStore();
            const { ref, sha256 } = await store.put(fileObj, {
              partnerId: partner.id,
              kind: 'credit_report',
              uploadedBy: 'admin_zip_restore',
            });

            let parsed: any;
            let provider: string = 'unknown';
            let reportDate: string | undefined;
            let pdfText: string | undefined;
            let pdfMeta: any;

            if (isPdf) {
              const bundle = await parsePdfReportWithCache({ reportId: report.id, file: fileObj });
              parsed = bundle.parsed;
              provider = bundle.provider;
              reportDate = bundle.reportDate;
              pdfText = bundle.pdfText;
              pdfMeta = bundle.pdfMeta;
            } else {
              const html = await fileObj.text();
              const bundle = await parseHtmlReportWithCache({ reportId: report.id, html });
              parsed = bundle.parsed;
              provider = bundle.provider ?? detectProviderFromHtml(html);
              reportDate = bundle.reportDate;
            }

            upsertReport({
              ...report,
              rawBlobRef: ref,
              sha256,
              provider: provider as any,
              reportDate,
              parsed,
              pdfText,
              pdfMeta,
              sizeBytes: blob.size,
              mimeType,
            });
            uploaded++;
            const tlCount = parsed?.tradelines?.length ?? 0;
            addLog(`  ✓ ${filename} — uploaded + parsed (${tlCount} tradelines, provider: ${provider})`);
          } catch (e: any) {
            addLog(`  ✗ ${filename} — error: ${e?.message || 'unknown'}`);
            skipped++;
          }
        }
      }

      addLog(`Done. ${matched} pending report(s) found → ${uploaded} uploaded, ${skipped} skipped/unmatched.`);
    } catch (e: any) {
      setZipErr(e?.message || 'ZIP processing failed.');
    } finally {
      setZipBusy(false);
    }
  };

  const batches = useMemo(() => listImportBatches().slice(0, 6), [notice]);

  const artifactPreview = useMemo(() => {
    const partners = parsed?.partners ?? [];
    const classified = summarizeLegacyExportArtifacts(partners);
    return {
      letters: partners.reduce((n, p) => n + (p.legacyLetters?.length ?? 0), 0),
      docs: partners.reduce((n, p) => n + (p.legacyDocuments?.length ?? 0), 0),
      reports: partners.reduce((n, p) => n + (p.legacyReports?.length ?? 0), 0),
      business: partners.filter((p) => p.legacyBusiness?.businessName || p.legacyBusiness?.ein).length,
      classified,
      classifiedSummary: formatLegacyArtifactBreakdown(classified),
    };
  }, [parsed]);

  const signOff = useMemo(
    () => assessLegacyMigrationSignOff({ exportData: parsed, phase2: auditResult?.phase2 ?? null }),
    [parsed, auditResult],
  );

  const generateInvitesForPartnerIds = async (partnerIds: string[]) => {
    const created: string[] = [];
    for (const id of partnerIds) {
      const p = await getPartner(id);
      if (!p) continue;
      const existing = listInvitesByPartner(p.id);
      if (existing.length) continue; // don’t spam duplicates by default
      const inv = createInvite({
        partnerId: p.id,
        claimUrl: claimBaseUrl,
        toEmail: p.profile.email,
        toPhone: p.profile.phone,
      });
      created.push(inv.id);
    }
    return created;
  };

  const deliverInvitesForIds = async (inviteIds: string[], partnerMap: Map<string, Partner>) => {
    let emailSent = 0;
    let smsSent = 0;
    let failed = 0;
    for (const invId of inviteIds) {
      const inv = getInvite(invId);
      if (!inv) continue;
      const p = partnerMap.get(inv.partnerId);
      const email = inv.channels?.email?.to ?? p?.profile.email;
      const phone = inv.channels?.sms?.to ?? p?.profile.phone;
      if (email) {
        try {
          await sendInviteEmail({ toEmail: email, toName: p?.profile.fullName, claimUrl: inv.claimUrl });
          upsertInvite({
            ...inv,
            sentAt: new Date().toISOString(),
            sentBy: 'admin',
            channels: { ...(inv.channels ?? {}), email: { ...(inv.channels?.email ?? {}), status: 'sent', to: email } },
          });
          emailSent += 1;
        } catch (e: any) {
          failed += 1;
          upsertInvite({
            ...inv,
            channels: { ...(inv.channels ?? {}), email: { ...(inv.channels?.email ?? {}), status: 'error', to: email, lastError: e?.message || 'send failed' } },
          });
        }
      }
      if (phone) {
        try {
          await sendInviteSms({ toPhone: phone, claimUrl: inv.claimUrl });
          const latest = getInvite(invId) ?? inv;
          upsertInvite({
            ...latest,
            sentAt: new Date().toISOString(),
            sentBy: 'admin',
            channels: { ...(latest.channels ?? {}), sms: { ...(latest.channels?.sms ?? {}), status: 'sent', to: phone } },
          });
          smsSent += 1;
        } catch (e: any) {
          failed += 1;
          const latest = getInvite(invId) ?? inv;
          upsertInvite({
            ...latest,
            channels: { ...(latest.channels ?? {}), sms: { ...(latest.channels?.sms ?? {}), status: 'error', to: phone, lastError: e?.message || 'send failed' } },
          });
        }
      }
    }
    return { emailSent, smsSent, failed };
  };

  const lastInvites = useMemo(() => lastInviteIds.map((id) => getInvite(id)).filter(Boolean) as any[], [lastInviteIds, notice]);

  const importEnabled = isFeatureEnabled('partnerImport');

  return (
    <PageShell
      badge="Admin"
      title="Import Partners (Legacy Resume)"
      subtitle="Upload a JSON export from your legacy system and import partners + tasks without restarting their journey. Then generate claim links so each partner can connect their profile after signup."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={() => navigate('/admin/partners')} className={FINELY_OS_BACK_LINK} title="Back to Partner Management">
            <ArrowLeft size={16} /> Partner Management
          </button>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>import_v1</div>
        </div>

        {!importEnabled ? (
          <div className={`${FINELY_OS_NOTICE_ERROR} space-y-2`}>
            <div className={FINELY_OS_ENTITY_VALUE}>Partner import is disabled</div>
            <p className={FINELY_OS_ENTITY_BODY}>
              Enable <span className="font-mono">partnerImport</span> in Admin Settings → Features to run legacy imports and claim-link delivery.
            </p>
            <button type="button" onClick={() => navigate('/admin/settings?tab=features')} className={FINELY_OS_PRIMARY_BTN}>
              Open feature flags <ArrowRight size={14} />
            </button>
          </div>
        ) : null}

        {err ? <div className={FINELY_OS_NOTICE_ERROR}>{err}</div> : null}
        {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}

        {importEnabled ? (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-7 ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>
              <FileJson size={18} />
              <span>Legacy JSON upload</span>
            </div>

            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony ${FINELY_OS_ENTITY_BODY} space-y-2`} data-fc-accent="sky">
              <div className={FINELY_OS_ENTITY_VALUE}>Expected schema (v1)</div>
              <div className={`text-[11px] font-mono whitespace-pre-wrap ${FINELY_OS_ENTITY_BODY}`}>
                {`{\n  "version": 1,\n  "source": "laravel",\n  "exportedAt": "ISO",\n  "partners": [\n    {\n      "externalId": "string",\n      "fullName": "string",\n      "email": "string? (optional)",\n      "phone": "string? (optional)",\n      "lane": "funding_readiness|business_credit|... (optional)",\n      "journeyStage": "intake|report_upload|... (optional)",\n      "tasks": [ { "title": "...", "kind": "...", "status": "...", "stage": "...", "dueAt": "ISO?" } ]\n    }\n  ]\n}`}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <div className={FINELY_OS_ENTITY_LABEL}>Claim base URL</div>
                <input
                  value={claimBaseUrl}
                  onChange={(e) => setClaimBaseUrl(e.target.value)}
                  className={`${FINELY_OS_ENTITY_INPUT} font-mono text-sm`}
                  placeholder="https://app.yourdomain.com/claim"
                />
                <div className={`mt-2 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>Invite links will be generated as `{claimBaseUrl}?token=...`</div>
              </label>
              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`} data-fc-accent="sky">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Upload file</div>
                <label className={`mt-2 ${FINELY_OS_PRIMARY_BTN} cursor-pointer`}>
                  <Upload size={14} /> Choose JSON or SQL
                  <input
                    type="file"
                    accept="application/json,.json,.sql,text/plain"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setErr(null);
                      setNotice(null);
                      setFilename(f.name);
                      const text = await f.text();
                      if (f.name.toLowerCase().endsWith('.sql')) {
                        const audit = buildLegacyMigrationFromSql(text, f.name);
                        setAuditResult(audit);
                        setRaw(JSON.stringify(audit.export, null, 2));
                        setNotice(`Parsed SQL: ${audit.realPartners} real partner(s), ${audit.skippedTest} skipped.`);
                      } else {
                        setAuditResult(null);
                        setRaw(text);
                      }
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
                <button
                  type="button"
                  className={`mt-3 ${FINELY_OS_SECONDARY_BTN}`}
                  onClick={() => {
                    setErr(null);
                    setNotice(null);
                    setFilename('legacy-partners-export-v1.json (bundled)');
                    setAuditResult(null);
                    setRaw(JSON.stringify(bundledExport, null, 2));
                    setNotice(`Loaded bundled export with ${(bundledExport as LegacyPartnerExportV1).partners?.length ?? 0} partner(s).`);
                  }}
                >
                  <Database size={14} /> Load bundled export (13 real partners)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className={`mt-3 w-full ${FINELY_OS_SUCCESS_BTN}`}
                  onClick={async () => {
                    setErr(null);
                    setNotice(null);
                    setFilename('legacy-partners-export-v1.json (bundled)');
                    setAuditResult(null);
                    const exportData = bundledExport as LegacyPartnerExportV1;
                    setRaw(JSON.stringify(exportData, null, 2));
                    setBusy(true);
                    try {
                      const batch = await importLegacyPartners({
                        exportData,
                        claimBaseUrl,
                        filename: 'legacy-partners-export-v1.json (bundled)',
                        importArtifacts: true,
                      });
                      let serverNote = '';
                      try {
                        const server = await pushLegacyExportToServer(exportData);
                        serverNote =
                          ` Server: ${server.partnersUpserted} partners · ${server.reportsUpserted} reports · ${server.evidenceUpserted} docs · ${server.lettersUpserted} letters.`;
                      } catch (serverErr: any) {
                        serverNote = ` Server sync failed: ${serverErr?.message || 'unknown'}.`;
                      }
                      setNotice(
                        `Full legacy import complete — ${batch.createdPartnerIds.length}/${exportData.partners.length} partners processed.` +
                          ` ${batch.errors.length ? `${batch.errors.length} skipped.` : ''}` +
                          serverNote,
                      );
                    } catch (e: any) {
                      setErr(e?.message || 'Bundled import failed.');
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Import all 13 bundled partners + workflow
                </button>
                {filename ? <div className={`mt-2 text-[11px] ${FINELY_OS_ENTITY_BODY} font-mono truncate`}>{filename}</div> : null}
              </div>
            </div>

            <div>
              <div className={FINELY_OS_ENTITY_LABEL}>Raw JSON (optional)</div>
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                rows={10}
                className={`${FINELY_OS_ENTITY_INPUT} font-mono text-xs`}
                placeholder="Paste JSON export here…"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className={`flex items-center gap-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                <input type="checkbox" checked={dryRunOnly} onChange={(e) => setDryRunOnly(e.target.checked)} />
                Dry run only (preview, no Supabase writes)
              </label>
              <label className={`flex items-center gap-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                <input type="checkbox" checked={importArtifacts} onChange={(e) => setImportArtifacts(e.target.checked)} />
                Phase 2 artifacts (docs, reports, legacy letters, business profile hints)
              </label>
              <label className={`flex items-center gap-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                <input
                  type="checkbox"
                  checked={autoSendInvites}
                  disabled={!isFeatureEnabled('inviteDelivery')}
                  onChange={(e) => setAutoSendInvites(e.target.checked)}
                />
                Auto-send claim invites (email/SMS when contact on file)
              </label>
              <button
                type="button"
                disabled={!parsed || busy}
                onClick={async () => {
                  setErr(null);
                  setNotice(null);
                  setLastInviteIds([]);
                  if (!parsed) {
                    setErr('Invalid export. Ensure version=1 and partners[] is present.');
                    return;
                  }
                  if (dryRunOnly) {
                    setBusy(true);
                    try {
                      const batch = await importLegacyPartners({
                        exportData: parsed,
                        claimBaseUrl,
                        filename,
                        dryRun: true,
                        importArtifacts,
                      });
                      const art = batch.artifacts;
                      setNotice(
                        `Dry run OK — would import ${batch.createdPartnerIds.length}/${parsed.partners.length} partner(s). ` +
                          `${batch.errors.length ? `Skipped/errors: ${batch.errors.length}.` : 'No conflicts detected.'}` +
                          (art ? ` Artifacts: ${formatLegacyArtifactImportSummary(art)}` : ''),
                      );
                    } catch (e: any) {
                      setErr(e?.message || 'Dry run failed.');
                    } finally {
                      setBusy(false);
                    }
                    return;
                  }
                  setBusy(true);
                  try {
                    const batch = await importLegacyPartners({ exportData: parsed, claimBaseUrl, filename, importArtifacts });
                    let serverNote = '';
                    if (importArtifacts) {
                      try {
                        const server = await pushLegacyExportToServer(parsed);
                        serverNote =
                          ` Server sync: ${server.partnersUpserted} partners · ${server.reportsUpserted} reports · ${server.evidenceUpserted} docs · ${server.lettersUpserted} letters` +
                          (server.errors.length ? ` · ${server.errors.length} server error(s).` : '.');
                      } catch (serverErr: any) {
                        serverNote = ` Server sync failed (local import OK): ${serverErr?.message || 'unknown error'}. Deploy admin-import-legacy edge function if missing.`;
                      }
                    }
                    const inviteIds = await generateInvitesForPartnerIds(batch.createdPartnerIds);
                    const art = batch.artifacts;
                    setLastInviteIds(inviteIds);
                    const loaded = await Promise.all(inviteIds.map((id) => getInvite(id)).filter(Boolean).map(async (inv: any) => getPartner(inv.partnerId)));
                    const pmap = new Map<string, Partner>();
                    for (const p of loaded) { if (p) pmap.set(p.id, p); }
                    setInvitePartnerById(pmap);
                    let deliveryNote = '';
                    if (autoSendInvites && isFeatureEnabled('inviteDelivery') && inviteIds.length) {
                      const delivery = await deliverInvitesForIds(inviteIds, pmap);
                      deliveryNote =
                        ` Delivery: ${delivery.emailSent} email · ${delivery.smsSent} SMS` +
                        (delivery.failed ? ` · ${delivery.failed} failed` : '') +
                        '.';
                    }
                    setNotice(
                      `Imported ${batch.createdPartnerIds.length}/${batch.partnerCount} partners. ` +
                        `${inviteIds.length} claim link(s) generated. ` +
                        `${batch.errors.length ? `Errors: ${batch.errors.length}.` : ''}` +
                        (art
                          ? ` Artifacts: ${formatLegacyArtifactImportSummary(art)}`
                          : '') +
                        deliveryNote +
                        serverNote,
                    );
                  } catch (e: any) {
                    setErr(e?.message || 'Import failed.');
                  } finally {
                    setBusy(false);
                  }
                }}
                className={`${FINELY_OS_SUCCESS_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                Import now <ArrowRight size={14} />
              </button>
              <button
                type="button"
                disabled={!parsed || busy}
                onClick={async () => {
                  setErr(null);
                  setNotice(null);
                  if (!parsed) {
                    setErr('Load an export first.');
                    return;
                  }
                  setBusy(true);
                  try {
                    const batch = await importLegacyArtifactsForExistingPartners({
                      exportData: parsed,
                      dryRun: dryRunOnly,
                    });
                    const art = batch.artifacts;
                    setNotice(
                      `${dryRunOnly ? 'Dry run — would backfill' : 'Backfilled'} artifacts for ${batch.createdPartnerIds.length} partner(s). ` +
                        `${batch.errors.length ? `Skipped/errors: ${batch.errors.length}.` : ''}` +
                        (art ? ` ${formatLegacyArtifactImportSummary(art)}` : ''),
                    );
                  } catch (e: any) {
                    setErr(e?.message || 'Artifact backfill failed.');
                  } finally {
                    setBusy(false);
                  }
                }}
                className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}
                title="Tier 376 — import Phase 2 artifacts for partners already imported from this export"
              >
                Backfill Phase 2 artifacts
              </button>
              <button
                type="button"
                onClick={() => {
                  setRaw('');
                  setFilename('');
                  setErr(null);
                  setNotice(null);
                }}
                className={FINELY_OS_SECONDARY_BTN}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>
                <Link size={18} />
                <span>Preview & duplicates</span>
              </div>
              {!parsed ? (
                <div className={FINELY_OS_ENTITY_BODY}>Upload/paste a JSON export to preview.</div>
              ) : (
                <div className="space-y-3">
                  <div className={FINELY_OS_ENTITY_BODY}>
                    Partners in file: <span className={`font-mono font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{parsed.partners.length}</span>
                  </div>
                  <div className="space-y-2">
                    {preview.map((p) => {
                      const ext = String(p.externalId || '');
                      const dupId = existingByExternalId.get(ext);
                      return (
                        <div key={ext} className={`${finelyOsInlineListItem()} p-4`}>
                          <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{p.fullName}</div>
                          <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate normal-case tracking-normal`}>
                            ext:{ext} {dupId ? `• already imported (${dupId})` : ''}
                          </div>
                          <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                            lane: <span className="font-mono">{p.lane ?? '—'}</span> • stage:{' '}
                            <span className="font-mono">{p.journeyStage ?? '—'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {parsed.partners.length > preview.length ? (
                    <div className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>Showing {preview.length} of {parsed.partners.length}.</div>
                  ) : null}
                  {parsed ? (
                    <div className={`text-xs ${FINELY_OS_ENTITY_BODY} pt-2 space-y-1`}>
                      <div>
                        Raw export — doc_files {artifactPreview.docs} · html_reports {artifactPreview.reports} · generated_letters {artifactPreview.letters} · business {artifactPreview.business}
                      </div>
                      <div className="text-emerald-200/90">
                        After classification — {artifactPreview.classifiedSummary}. Credit reports land in Reports hub; dispute/validation PDFs in Letters hub; IDs &amp; proof stay in Documents vault.
                      </div>
                    </div>
                  ) : null}
                  {auditResult?.phase2 ? (
                    <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                      SQL phase 2 — templates {auditResult.phase2.templateCount} · letters {auditResult.phase2.letterRows} · business {auditResult.phase2.businessRows} · referrals {auditResult.phase2.referralRows}
                    </div>
                  ) : null}
                  {auditResult ? (
                    <div className="pt-3 space-y-2">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>SQL audit (real partners)</div>
                      {auditPreview.map((r) => (
                        <div key={r.userId} className={`${finelyOsInlineListItem()} p-3 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                          {r.fullName} • stage {r.journeyStage} • docs {r.docCount} • reports {r.reportCount}
                        </div>
                      ))}
                      <button
                        type="button"
                        className={FINELY_OS_SECONDARY_BTN}
                        onClick={() => {
                          const csv = auditRowsToCsv(auditResult.rows);
                          const blob = new Blob([csv], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'legacy-partners-audit.csv';
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        Download audit CSV
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Legacy referral attributions (Tier 377)</div>
              <div className={FINELY_OS_ENTITY_BODY}>
                Seeds affiliate lead events from SQL audit referral rows. Requires an affiliate workspace ID.
              </div>
              {affiliates.length ? (
                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Affiliate</div>
                  <select
                    value={affiliateId}
                    onChange={(e) => setAffiliateId(e.target.value)}
                    className={FINELY_OS_ENTITY_INPUT}
                  >
                    <option value="">Select affiliate…</option>
                    {affiliates.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Affiliate ID</div>
                  <input
                    value={affiliateId}
                    onChange={(e) => setAffiliateId(e.target.value)}
                    className={`${FINELY_OS_ENTITY_INPUT} font-mono text-sm`}
                    placeholder="aff_…"
                  />
                </label>
              )}
              <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Referral seeds in audit: {auditResult?.referralSeeds?.length ?? 0}
              </div>
              <button
                type="button"
                disabled={!auditResult?.referralSeeds?.length || !affiliateId.trim() || busy}
                onClick={async () => {
                  setErr(null);
                  setNotice(null);
                  const seeds = auditResult?.referralSeeds ?? [];
                  if (!seeds.length || !affiliateId.trim()) return;
                  setBusy(true);
                  try {
                    const count = await seedLegacyReferralAttributions({
                      seeds,
                      affiliateId: affiliateId.trim(),
                      dryRun: dryRunOnly,
                    });
                    setNotice(
                      `${dryRunOnly ? 'Dry run — would seed' : 'Seeded'} ${count} legacy referral attribution(s) for affiliate ${affiliateId.trim()}.`,
                    );
                  } catch (e: any) {
                    setErr(e?.message || 'Referral seed failed.');
                  } finally {
                    setBusy(false);
                  }
                }}
                className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                Seed referral attributions
              </button>
            </div>

            <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Migration sign-off (Tier 380)</div>
              <div className={`text-sm ${signOff.ready ? 'text-emerald-300' : 'text-amber-200'}`}>
                {signOff.ready ? 'Phase 1 export looks ready for live import.' : 'Complete audit + import before production cutover.'}
              </div>
              <div className="space-y-2">
                {signOff.checks.map((c) => (
                  <div key={c.id} className={`${finelyOsInlineListItem()} p-3 text-xs`}>
                    <div className={FINELY_OS_ENTITY_VALUE}>{c.ok ? '✓' : '○'} {c.label}</div>
                    <div className={FINELY_OS_ENTITY_BODY}>{c.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Recent import batches</div>
              {batches.length === 0 ? (
                <div className={FINELY_OS_ENTITY_BODY}>No imports yet.</div>
              ) : (
                <div className="space-y-2">
                  {batches.map((b) => (
                    <div key={b.id} className={`${finelyOsInlineListItem()} p-4`}>
                      <div className={FINELY_OS_ENTITY_VALUE}>Batch {b.id}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
                        {new Date(b.createdAt).toLocaleString()} • partners:{b.createdPartnerIds.length}/{b.partnerCount} • errors:{b.errors.length}
                        {b.artifacts
                          ? ` • artifacts:${b.artifacts.evidenceCreated}d/${b.artifacts.reportsCreated}r/${b.artifacts.lettersCreated}l`
                          : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {lastInvites.length ? (
              <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Generated claim links</div>
                <div className={FINELY_OS_ENTITY_BODY}>
                  Partners claim their imported profile via these links. Sending is gated by the <span className="font-mono">Invite Delivery</span> feature flag.
                </div>
                <div className="space-y-2">
                  {lastInvites.map((inv) => {
                    const p = invitePartnerById.get(inv.partnerId);
                    const email = inv.channels?.email?.to;
                    const phone = inv.channels?.sms?.to;
                    return (
                      <div key={inv.id} className={`${finelyOsInlineListItem()} p-4 space-y-2`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{p?.profile.fullName ?? inv.partnerId}</div>
                            <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
                              invite:{inv.id} • {new Date(inv.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(inv.claimUrl);
                                setNotice('Claim link copied.');
                              } catch {
                                window.prompt('Copy claim link:', inv.claimUrl);
                              }
                            }}
                            className={FINELY_OS_SECONDARY_BTN}
                          >
                            Copy link <ArrowRight size={12} />
                          </button>
                        </div>

                        <div className={`text-[11px] ${FINELY_OS_ENTITY_BODY} font-mono break-all`}>{inv.claimUrl}</div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={!isFeatureEnabled('inviteDelivery') || !email || Boolean(sendBusyId)}
                            onClick={async () => {
                              if (!email) return;
                              setErr(null);
                              setSendBusyId(inv.id);
                              try {
                                await sendInviteEmail({ toEmail: email, toName: p?.profile.fullName, claimUrl: inv.claimUrl });
                                upsertInvite({
                                  ...inv,
                                  sentAt: new Date().toISOString(),
                                  sentBy: 'admin',
                                  channels: { ...(inv.channels ?? {}), email: { ...(inv.channels?.email ?? {}), status: 'sent' } },
                                });
                                setNotice(`Invite email sent to ${email}.`);
                              } catch (e: any) {
                                upsertInvite({
                                  ...inv,
                                  channels: { ...(inv.channels ?? {}), email: { ...(inv.channels?.email ?? {}), status: 'error', lastError: e?.message || 'send failed' } },
                                });
                                setErr(e?.message || 'Email send failed.');
                              } finally {
                                setSendBusyId(null);
                              }
                            }}
                            className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}
                            title={isFeatureEnabled('inviteDelivery') ? 'Send invite email' : 'Enable Invite Delivery in Admin Settings'}
                          >
                            Email {email ? `→ ${email}` : ''}
                          </button>
                          <button
                            type="button"
                            disabled={!isFeatureEnabled('inviteDelivery') || !phone || Boolean(sendBusyId)}
                            onClick={async () => {
                              if (!phone) return;
                              setErr(null);
                              setSendBusyId(inv.id);
                              try {
                                await sendInviteSms({ toPhone: phone, claimUrl: inv.claimUrl });
                                upsertInvite({
                                  ...inv,
                                  sentAt: new Date().toISOString(),
                                  sentBy: 'admin',
                                  channels: { ...(inv.channels ?? {}), sms: { ...(inv.channels?.sms ?? {}), status: 'sent' } },
                                });
                                setNotice(`Invite SMS sent to ${phone}.`);
                              } catch (e: any) {
                                upsertInvite({
                                  ...inv,
                                  channels: { ...(inv.channels ?? {}), sms: { ...(inv.channels?.sms ?? {}), status: 'error', lastError: e?.message || 'send failed' } },
                                });
                                setErr(e?.message || 'SMS send failed.');
                              } finally {
                                setSendBusyId(null);
                              }
                            }}
                            className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}
                            title={isFeatureEnabled('inviteDelivery') ? 'Send invite SMS' : 'Enable Invite Delivery in Admin Settings'}
                          >
                            SMS {phone ? `→ ${phone}` : ''}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        ) : null}

        {/* ── ZIP Bucket Restore ── */}
        <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-amber-300`}>
            <FileArchive size={18} />
            <span>Restore report files from Supabase bucket ZIP</span>
          </div>
          <p className={FINELY_OS_ENTITY_BODY}>
            Download your old Supabase storage bucket as a ZIP, then upload it here. This tool scans all
            partner records for <span className="font-mono">legacy:pending-reupload:</span> placeholders,
            matches filenames against the ZIP contents, uploads each file to the current bucket, parses it,
            and updates the report record — no manual re-upload per partner needed.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className={`cursor-pointer ${FINELY_OS_PRIMARY_BTN} ${zipBusy ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}>
              <Upload size={14} />
              {zipBusy ? 'Processing…' : 'Choose ZIP file'}
              <input
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                className="hidden"
                disabled={zipBusy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void runZipRestore(f);
                  e.currentTarget.value = '';
                }}
              />
            </label>
            {zipLog.length > 0 && !zipBusy && (
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setZipLog([])}>
                Clear log
              </button>
            )}
          </div>
          {zipErr && <div className={FINELY_OS_NOTICE_ERROR}>{zipErr}</div>}
          {zipLog.length > 0 && (
            <div className="max-h-72 overflow-y-auto rounded-xl bg-black/30 border border-white/[0.08] p-4">
              <pre className={`text-[11px] font-mono whitespace-pre-wrap ${FINELY_OS_ENTITY_BODY}`}>
                {zipLog.join('\n')}
              </pre>
            </div>
          )}
        </div>

        <FinelyOsPageFooter />
</div>
    </PageShell>
  );
}

