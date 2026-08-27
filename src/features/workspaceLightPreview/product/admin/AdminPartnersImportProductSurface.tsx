import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Database, FileJson, FileArchive, Link, Upload } from 'lucide-react';
import JSZip from 'jszip';
import { useNavigate } from 'react-router-dom';
import type { LegacyPartnerExportV1 } from '../../../../domain/imports';
import {
  importLegacyPartners,
  importLegacyArtifactsForExistingPartners,
  listImportBatches,
  repairLegacyPartnerClassification,
} from '../../../../data/importsRepo';
import { pushLegacyExportToServer } from '../../../../lib/legacyImportServerClient';
import { getPartner, listPartners } from '../../../../data/partnersRepo';
import type { Partner } from '../../../../domain/partners';
import { createInvite, getInvite, listInvitesByPartner, upsertInvite } from '../../../../data/invitesRepo';
import { isFeatureEnabled } from '../../../../data/settingsRepo';
import { seedLegacyReferralAttributions, formatLegacyArtifactImportSummary } from '../../../../data/legacyPartnerArtifactsImport';
import { listAffiliatesByTenant } from '../../../../data/affiliateRepo';
import { FINELY_TENANT_ID } from '../../../../domain/tenants';
import { buildLegacyMigrationFromSql, auditRowsToCsv, type LegacyMigrationAuditResult } from '../../../../lib/legacyMigrationExport';
import { assessLegacyMigrationSignOff } from '../../../../lib/legacyMigrationSignOff';
import { formatLegacyArtifactBreakdown, summarizeLegacyExportArtifacts } from '../../../../lib/legacyArtifactBreakdown';
import bundledExport from '../../../../../data/legacy-migration/legacy-partners-export-v1.json';
import { getBlobStore } from '../../../../storage/getBlobStore';
import { listReportsByPartner, upsertReport } from '../../../../data/reportsRepo';
import { isLegacyPendingReportBlob, legacyPendingReportFilename } from '../../../../lib/legacyPendingReport';
import { bulkReparseStoredReports, listReportsNeedingReparse } from '../../../../lib/legacyReportReparse';
import { parseHtmlReportWithCache, parsePdfReportWithCache } from '../../../../lib/reportParsePipeline';
import { detectProviderFromHtml } from '../../../../creditReports/detectProvider';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
} from '../../../os/finelyOsLightUi';
import { sendInviteEmail, sendInviteSms } from '../../../../lib/inviteDeliveryClient';
import {
  ROOSEVELT_COURT_PARTNER_ID,
  ROOSEVELT_DISPLAY_NAME,
  ROOSEVELT_OUTCOME_SUMMARY,
  ROOSEVELT_PLAN_FINAL_PAYMENT_ISO,
  ROOSEVELT_PLAN_FIRST_PAYMENT_ISO,
  ensureRooseveltCourtPartnerAsync,
} from '../../../../data/rooseveltCourtPartnerSeed';
import { ADMIN_PARTNER_OVERRIDE_KEY } from '../../../../portal/getOrCreatePartnerForSession';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function asExportV1(obj: unknown): LegacyPartnerExportV1 | null {
  if (!obj || typeof obj !== 'object') return null;
  const record = obj as Record<string, unknown>;
  if (record.version !== 1) return null;
  if (!Array.isArray(record.partners)) return null;
  return obj as LegacyPartnerExportV1;
}

export default function AdminPartnersImportProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'sky';

  const [raw, setRaw] = useState('');
  const [filename, setFilename] = useState('');
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
  const [rooseveltBusy, setRooseveltBusy] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [zipLog, setZipLog] = useState<string[]>([]);
  const [zipErr, setZipErr] = useState<string | null>(null);
  const [reparseBusy, setReparseBusy] = useState(false);
  const [reparseLog, setReparseLog] = useState<string[]>([]);
  const [reparseErr, setReparseErr] = useState<string | null>(null);
  const [repairBusy, setRepairBusy] = useState(false);
  const [repairLog, setRepairLog] = useState<string[]>([]);
  const [repairOnlyExternalId, setRepairOnlyExternalId] = useState('laravel:uid:176');

  const [claimBaseUrl, setClaimBaseUrl] = useState(() => {
    try {
      return `${window.location.origin}/claim`;
    } catch {
      return '/claim';
    }
  });

  useEffect(() => {
    listAffiliatesByTenant(FINELY_TENANT_ID).then((rows) => {
      setAffiliates(rows.map((a) => ({ id: a.id, label: `${a.fullName || a.email} (${a.id})` })));
      if (rows.length === 1) setAffiliateId(rows[0].id);
    });
  }, []);

  const parsed = useMemo(() => asExportV1(safeParseJson(raw)), [raw]);
  const preview = useMemo(() => parsed?.partners?.slice(0, 8) ?? [], [parsed]);
  const auditPreview = useMemo(() => auditResult?.rows.filter((r) => r.isReal).slice(0, 8) ?? [], [auditResult]);
  const batches = useMemo(() => listImportBatches().slice(0, 6), [notice]);
  const pendingReparseCount = useMemo(() => listReportsNeedingReparse().length, [zipLog, reparseLog]);

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

  const importEnabled = isFeatureEnabled('partnerImport');

  const runZipRestore = async (file: File) => {
    setZipBusy(true);
    setZipLog([]);
    setZipErr(null);
    const log: string[] = [];
    const addLog = (msg: string) => {
      log.push(msg);
      setZipLog([...log]);
    };
    try {
      addLog(`Reading ZIP: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)…`);
      const zip = await JSZip.loadAsync(file);
      const fileMap = new Map<string, JSZip.JSZipObject>();
      zip.forEach((relativePath: string, entry: JSZip.JSZipObject) => {
        if (entry.dir) return;
        const basename = relativePath.split('/').pop()!;
        fileMap.set(basename, entry);
        fileMap.set(basename.toLowerCase(), entry);
      });
      addLog(`ZIP contains ${fileMap.size / 2} file(s). Scanning partners for pending report placeholders…`);
      const allPartners = await listPartners();
      let matched = 0;
      let uploaded = 0;
      let skipped = 0;
      for (const partner of allPartners) {
        const reports = listReportsByPartner(partner.id);
        for (const report of reports) {
          if (!isLegacyPendingReportBlob(report.rawBlobRef)) continue;
          const reportFilename = legacyPendingReportFilename(report.rawBlobRef);
          matched++;
          const entry = fileMap.get(reportFilename) ?? fileMap.get(reportFilename.toLowerCase());
          if (!entry) {
            addLog(`  ⚠ No file in ZIP for: ${reportFilename} (${partner.profile?.fullName ?? partner.id})`);
            skipped++;
            continue;
          }
          addLog(`  ↑ Uploading ${reportFilename} for ${partner.profile?.fullName ?? partner.id}…`);
          try {
            const bytes = await entry.async('arraybuffer');
            const isPdf = reportFilename.toLowerCase().endsWith('.pdf');
            const mimeType = isPdf ? 'application/pdf' : 'text/html';
            const blob = new Blob([bytes], { type: mimeType });
            const fileObj = new File([blob], reportFilename, { type: mimeType });
            const store = getBlobStore();
            const { ref, sha256 } = await store.put(fileObj, {
              partnerId: partner.id,
              kind: 'credit_report',
              uploadedBy: 'admin_zip_restore',
            });
            let parsedReport: unknown;
            let provider = 'unknown';
            let reportDate: string | undefined;
            let pdfText: string | undefined;
            let pdfMeta: unknown;
            if (isPdf) {
              const bundle = await parsePdfReportWithCache({ reportId: report.id, file: fileObj });
              parsedReport = bundle.parsed;
              provider = bundle.provider;
              reportDate = bundle.reportDate;
              pdfText = bundle.pdfText;
              pdfMeta = bundle.pdfMeta;
            } else {
              const html = await fileObj.text();
              const bundle = await parseHtmlReportWithCache({ reportId: report.id, html });
              parsedReport = bundle.parsed;
              provider = bundle.provider ?? detectProviderFromHtml(html);
              reportDate = bundle.reportDate;
            }
            upsertReport({
              ...report,
              rawBlobRef: ref,
              sha256,
              provider: provider as never,
              reportDate,
              parsed: parsedReport as never,
              pdfText,
              pdfMeta: pdfMeta as never,
              sizeBytes: blob.size,
              mimeType,
            });
            uploaded++;
            const tlCount = (parsedReport as { tradelines?: unknown[] })?.tradelines?.length ?? 0;
            addLog(`  ✓ ${reportFilename} — uploaded + parsed (${tlCount} tradelines, provider: ${provider})`);
          } catch (e: unknown) {
            addLog(`  ✗ ${reportFilename} — error: ${(e as Error)?.message || 'unknown'}`);
            skipped++;
          }
        }
      }
      addLog(`Done. ${matched} pending report(s) found → ${uploaded} uploaded, ${skipped} skipped/unmatched.`);
    } catch (e: unknown) {
      setZipErr((e as Error)?.message || 'ZIP processing failed.');
    } finally {
      setZipBusy(false);
    }
  };

  const runBulkReparse = async () => {
    setReparseBusy(true);
    setReparseLog([]);
    setReparseErr(null);
    const log: string[] = [];
    const addLog = (msg: string) => {
      log.push(msg);
      setReparseLog([...log]);
    };
    try {
      await bulkReparseStoredReports({ onProgress: addLog });
    } catch (e: unknown) {
      setReparseErr((e as Error)?.message || 'Bulk re-parse failed.');
    } finally {
      setReparseBusy(false);
    }
  };

  const generateInvitesForPartnerIds = async (partnerIds: string[]) => {
    const created: string[] = [];
    for (const id of partnerIds) {
      const p = await getPartner(id);
      if (!p) continue;
      const existing = listInvitesByPartner(p.id);
      if (existing.length) continue;
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
        } catch (e: unknown) {
          failed += 1;
          upsertInvite({
            ...inv,
            channels: { ...(inv.channels ?? {}), email: { ...(inv.channels?.email ?? {}), status: 'error', to: email, lastError: (e as Error)?.message || 'send failed' } },
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
        } catch (e: unknown) {
          failed += 1;
          const latest = getInvite(invId) ?? inv;
          upsertInvite({
            ...latest,
            channels: { ...(latest.channels ?? {}), sms: { ...(latest.channels?.sms ?? {}), status: 'error', to: phone, lastError: (e as Error)?.message || 'send failed' } },
          });
        }
      }
    }
    return { emailSent, smsSent, failed };
  };

  const lastInvites = useMemo(
    () => lastInviteIds.map((id) => getInvite(id)).filter(Boolean) as NonNullable<ReturnType<typeof getInvite>>[],
    [lastInviteIds, notice],
  );

  const seedRoosevelt = () => {
    setRooseveltBusy(true);
    setErr(null);
    void ensureRooseveltCourtPartnerAsync()
      .then((r) => {
        try {
          localStorage.setItem(ADMIN_PARTNER_OVERRIDE_KEY, r.partner.id);
        } catch {
          /* ignore */
        }
        setNotice(
          `${r.created ? 'Created' : 'Updated'} ${ROOSEVELT_DISPLAY_NAME} (${r.partner.id}). Court outcome saved: ${r.outcome.verdictSummary}.`,
        );
        navigate('/admin/partners#ensure-roosevelt-court');
      })
      .catch((e: unknown) => {
        const msg = (e as Error)?.message || 'Roosevelt seed failed';
        setErr(/session|Forbidden|Unauthorized|RLS/i.test(msg) ? `Admin save blocked: ${msg}` : msg);
      })
      .finally(() => setRooseveltBusy(false));
  };

  const runImport = async () => {
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
      } catch (e: unknown) {
        setErr((e as Error)?.message || 'Dry run failed.');
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
        } catch (serverErr: unknown) {
          serverNote = ` Server sync failed (local import OK): ${(serverErr as Error)?.message || 'unknown error'}.`;
        }
      }
      const inviteIds = await generateInvitesForPartnerIds(batch.createdPartnerIds);
      const art = batch.artifacts;
      setLastInviteIds(inviteIds);
      const loaded = await Promise.all(
        inviteIds.map(async (id) => {
          const inv = getInvite(id);
          return inv ? getPartner(inv.partnerId) : null;
        }),
      );
      const pmap = new Map<string, Partner>();
      for (const p of loaded) {
        if (p) pmap.set(p.id, p);
      }
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
          (art ? ` Artifacts: ${formatLegacyArtifactImportSummary(art)}` : '') +
          deliveryNote +
          serverNote,
      );
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Import failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Delivery"
      title="Partner import"
      description="Upload legacy JSON, map partners, and restore reports — with live audit preview on the rail."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={
        <ProductPagePrimaryAction label="Partner directory" onClick={() => navigate('/admin/partners')} />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" disabled={rooseveltBusy} onClick={seedRoosevelt}>
          {rooseveltBusy ? 'Seeding…' : 'Ensure Roosevelt court'}
        </button>
      }
      metrics={[
        { label: 'In file', value: parsed ? String(parsed.partners.length) : '—', hint: 'Partners parsed', accent: 'sky' },
        { label: 'Sign-off', value: signOff.ready ? 'Ready' : 'Pending', hint: 'Migration gate', accent: signOff.ready ? 'emerald' : 'rose' },
        { label: 'Re-parse', value: String(pendingReparseCount), hint: 'Reports needing parse', accent: 'violet' },
        { label: 'Batches', value: String(batches.length), hint: 'Recent imports', accent: 'emerald' },
      ]}
      metricTitle="Import studio"
      metricDescription="Edit export JSON in the studio, watch the audit rail update, then import or backfill."
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button type="button" onClick={() => navigate('/admin/partners')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Partner Management
        </button>
        <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>import_v1</span>
      </div>

      {!importEnabled ? (
        <div className={`${FINELY_OS_NOTICE_ERROR} space-y-2`}>
          <div className={FINELY_OS_ENTITY_VALUE}>Partner import is disabled</div>
          <p className={FINELY_OS_ENTITY_BODY}>
            Enable <span className="font-mono">partnerImport</span> in Admin Settings → Features.
          </p>
          <button type="button" onClick={() => navigate('/admin/settings?tab=features')} className={FINELY_OS_PRIMARY_BTN}>
            Open feature flags <ArrowRight size={14} />
          </button>
        </div>
      ) : null}

      {err ? <div className={FINELY_OS_NOTICE_ERROR}>{err}</div> : null}
      {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}

      {/* Compose studio — editor + audit rail */}
      {importEnabled ? (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className={`lg:col-span-8 ${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-5`} data-fc-accent="sky">
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-sky-300`}>
              <FileJson size={18} />
              <span>Import map editor</span>
            </div>

            <div className={`${finelyOsCatalogCard('violet')} fc-surface-harmony p-4 space-y-2`} data-fc-accent="violet">
              <div className={FINELY_OS_ENTITY_VALUE}>Expected schema (v1)</div>
              <pre className={`text-[11px] font-mono whitespace-pre-wrap ${FINELY_OS_ENTITY_BODY}`}>
                {`{\n  "version": 1,\n  "source": "laravel",\n  "partners": [ { "externalId", "fullName", "email?", "tasks": [...] } ]\n}`}
              </pre>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <div className={FINELY_OS_ENTITY_LABEL}>Claim base URL</div>
                <input
                  value={claimBaseUrl}
                  onChange={(e) => setClaimBaseUrl(e.target.value)}
                  className={`${FINELY_OS_ENTITY_INPUT} font-mono text-sm mt-1`}
                />
              </label>
              <div className={`${finelyOsCatalogCard('emerald')} p-4`} data-fc-accent="emerald">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Upload file</div>
                <label className={`mt-2 ${FINELY_OS_PRIMARY_BTN} cursor-pointer inline-flex`}>
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
                  <Database size={14} /> Load bundled export
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
                        serverNote = ` Server: ${server.partnersUpserted} partners · ${server.reportsUpserted} reports.`;
                      } catch (serverErr: unknown) {
                        serverNote = ` Server sync failed: ${(serverErr as Error)?.message || 'unknown'}.`;
                      }
                      setNotice(
                        `Full legacy import complete — ${batch.createdPartnerIds.length}/${exportData.partners.length} partners processed.` +
                          serverNote,
                      );
                    } catch (e: unknown) {
                      setErr((e as Error)?.message || 'Bundled import failed.');
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Import all 13 bundled partners
                </button>
                {filename ? <div className={`mt-2 text-[11px] font-mono truncate ${FINELY_OS_ENTITY_BODY}`}>{filename}</div> : null}
              </div>
            </div>

            <label className="block">
              <div className={FINELY_OS_ENTITY_LABEL}>Raw JSON</div>
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                rows={14}
                className={`${FINELY_OS_ENTITY_INPUT} font-mono text-xs mt-1 w-full`}
                placeholder="Paste JSON export here…"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <label className={`flex items-center gap-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                <input type="checkbox" checked={dryRunOnly} onChange={(e) => setDryRunOnly(e.target.checked)} />
                Dry run only
              </label>
              <label className={`flex items-center gap-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                <input type="checkbox" checked={importArtifacts} onChange={(e) => setImportArtifacts(e.target.checked)} />
                Phase 2 artifacts
              </label>
              <label className={`flex items-center gap-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                <input
                  type="checkbox"
                  checked={autoSendInvites}
                  disabled={!isFeatureEnabled('inviteDelivery')}
                  onChange={(e) => setAutoSendInvites(e.target.checked)}
                />
                Auto-send claim invites
              </label>
              <button type="button" disabled={!parsed || busy} onClick={() => void runImport()} className={`${FINELY_OS_SUCCESS_BTN} disabled:opacity-60`}>
                Import now <ArrowRight size={14} />
              </button>
              <button
                type="button"
                disabled={!parsed || busy}
                onClick={async () => {
                  if (!parsed) return;
                  setBusy(true);
                  try {
                    const batch = await importLegacyArtifactsForExistingPartners({ exportData: parsed, dryRun: dryRunOnly });
                    setNotice(
                      `${dryRunOnly ? 'Dry run — would backfill' : 'Backfilled'} artifacts for ${batch.createdPartnerIds.length} partner(s).` +
                        (batch.artifacts ? ` ${formatLegacyArtifactImportSummary(batch.artifacts)}` : ''),
                    );
                  } catch (e: unknown) {
                    setErr((e as Error)?.message || 'Artifact backfill failed.');
                  } finally {
                    setBusy(false);
                  }
                }}
                className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-60`}
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

          <aside className={`lg:col-span-4 space-y-4`}>
            <div className={`${finelyOsCatalogCard('violet')} p-5 space-y-3`} data-fc-accent="violet">
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
                <Link size={16} />
                <span>Audit preview</span>
              </div>
              {!parsed ? (
                <div className={FINELY_OS_ENTITY_BODY}>Upload or paste JSON to preview.</div>
              ) : (
                <>
                  <div className={FINELY_OS_ENTITY_BODY}>
                    Partners: <span className={`font-mono font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{parsed.partners.length}</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {preview.map((p) => (
                      <div key={String(p.externalId)} className={`${finelyOsInlineListItem()} p-3`}>
                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate text-sm`}>{p.fullName}</div>
                        <div className={`text-[10px] font-mono ${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>ext:{p.externalId}</div>
                      </div>
                    ))}
                  </div>
                  <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                    docs {artifactPreview.docs} · reports {artifactPreview.reports} · letters {artifactPreview.letters}
                  </div>
                  <div className="text-xs text-emerald-200/90">{artifactPreview.classifiedSummary}</div>
                  {auditResult ? (
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
                  ) : null}
                </>
              )}
            </div>

            <div className={`${finelyOsCatalogCard('rose')} p-5 space-y-3`} data-fc-accent="rose">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Migration sign-off</div>
              <div className={`text-sm ${signOff.ready ? 'text-emerald-300' : 'text-rose-200'}`}>
                {signOff.ready ? 'Ready for live import.' : 'Complete audit before cutover.'}
              </div>
              {signOff.checks.map((c) => (
                <div key={c.id} className={`${finelyOsInlineListItem()} p-2 text-xs`}>
                  <div className={FINELY_OS_ENTITY_VALUE}>{c.ok ? '✓' : '○'} {c.label}</div>
                  <div className={FINELY_OS_ENTITY_BODY}>{c.detail}</div>
                </div>
              ))}
            </div>

            <div className={`${finelyOsCatalogCard('emerald')} p-5 space-y-3`} data-fc-accent="emerald">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Referral attributions</div>
              {affiliates.length ? (
                <select value={affiliateId} onChange={(e) => setAffiliateId(e.target.value)} className={FINELY_OS_ENTITY_INPUT}>
                  <option value="">Select affiliate…</option>
                  {affiliates.map((a) => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
              ) : (
                <input value={affiliateId} onChange={(e) => setAffiliateId(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="aff_…" />
              )}
              <button
                type="button"
                disabled={!auditResult?.referralSeeds?.length || !affiliateId.trim() || busy}
                className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-60`}
                onClick={async () => {
                  const seeds = auditResult?.referralSeeds ?? [];
                  if (!seeds.length) return;
                  setBusy(true);
                  try {
                    const count = await seedLegacyReferralAttributions({ seeds, affiliateId: affiliateId.trim(), dryRun: dryRunOnly });
                    setNotice(`${dryRunOnly ? 'Dry run — would seed' : 'Seeded'} ${count} referral attribution(s).`);
                  } catch (e: unknown) {
                    setErr((e as Error)?.message || 'Referral seed failed.');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Seed referral attributions
              </button>
            </div>

            {batches.length > 0 ? (
              <div className={`${finelyOsCatalogCard('sky')} p-5 space-y-2`} data-fc-accent="sky">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Recent batches</div>
                {batches.map((b) => (
                  <div key={b.id} className={`${finelyOsInlineListItem()} p-3 text-xs`}>
                    <div className={FINELY_OS_ENTITY_VALUE}>Batch {b.id}</div>
                    <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case`}>
                      {new Date(b.createdAt).toLocaleString()} · {b.createdPartnerIds.length}/{b.partnerCount}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {lastInvites.length > 0 ? (
              <div className={`${finelyOsCatalogCard('violet')} p-5 space-y-2`} data-fc-accent="violet">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Claim links</div>
                {lastInvites.map((inv) => {
                  const p = invitePartnerById.get(inv.partnerId);
                  const email = inv.channels?.email?.to;
                  const phone = inv.channels?.sms?.to;
                  return (
                    <div key={inv.id} className={`${finelyOsInlineListItem()} p-3 space-y-2`}>
                      <div className={`${FINELY_OS_ENTITY_VALUE} text-sm truncate`}>{p?.profile.fullName ?? inv.partnerId}</div>
                      <div className={`text-[10px] font-mono break-all ${FINELY_OS_ENTITY_BODY}`}>{inv.claimUrl}</div>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => void navigator.clipboard.writeText(inv.claimUrl).then(() => setNotice('Claim link copied.'))}
                          className={`${FINELY_OS_SECONDARY_BTN} !text-[10px] !px-2 !py-1`}
                        >
                          Copy
                        </button>
                        {email ? (
                          <button
                            type="button"
                            disabled={!isFeatureEnabled('inviteDelivery') || Boolean(sendBusyId)}
                            onClick={async () => {
                              setSendBusyId(inv.id);
                              try {
                                await sendInviteEmail({ toEmail: email, toName: p?.profile.fullName, claimUrl: inv.claimUrl });
                                setNotice(`Invite email sent to ${email}.`);
                              } catch (e: unknown) {
                                setErr((e as Error)?.message || 'Email send failed.');
                              } finally {
                                setSendBusyId(null);
                              }
                            }}
                            className={`${FINELY_OS_PRIMARY_BTN} !text-[10px] !px-2 !py-1 disabled:opacity-60`}
                          >
                            Email
                          </button>
                        ) : null}
                        {phone ? (
                          <button
                            type="button"
                            disabled={!isFeatureEnabled('inviteDelivery') || Boolean(sendBusyId)}
                            onClick={async () => {
                              setSendBusyId(inv.id);
                              try {
                                await sendInviteSms({ toPhone: phone, claimUrl: inv.claimUrl });
                                setNotice(`Invite SMS sent to ${phone}.`);
                              } catch (e: unknown) {
                                setErr((e as Error)?.message || 'SMS send failed.');
                              } finally {
                                setSendBusyId(null);
                              }
                            }}
                            className={`${FINELY_OS_SECONDARY_BTN} !text-[10px] !px-2 !py-1 disabled:opacity-60`}
                          >
                            SMS
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}

      {/* Roosevelt court seed */}
      <section id="ensure-roosevelt-court" className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-3`} data-fc-accent="violet">
        <div className={FINELY_OS_ENTITY_VALUE}>{ROOSEVELT_DISPLAY_NAME}</div>
        <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
          Upserts court partner into Supabase. Stable id <span className="font-mono text-[11px]">{ROOSEVELT_COURT_PARTNER_ID}</span>.
          Hearing decided — {ROOSEVELT_OUTCOME_SUMMARY.toLowerCase()} ({ROOSEVELT_PLAN_FIRST_PAYMENT_ISO} through {ROOSEVELT_PLAN_FINAL_PAYMENT_ISO}).
        </p>
        <button type="button" disabled={rooseveltBusy} className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60`} onClick={seedRoosevelt}>
          {rooseveltBusy ? 'Seeding…' : 'Ensure Roosevelt court → show in directory'}
        </button>
      </section>

      {/* ZIP restore */}
      <section className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
          <FileArchive size={18} />
          <span>Restore report files from bucket ZIP</span>
        </div>
        <p className={FINELY_OS_ENTITY_BODY}>
          Upload a Supabase storage bucket ZIP. Matches <span className="font-mono">legacy:pending-reupload:</span> placeholders, uploads, and parses reports.
        </p>
        <label className={`cursor-pointer ${FINELY_OS_PRIMARY_BTN} inline-flex ${zipBusy ? 'opacity-60 pointer-events-none' : ''}`}>
          <Upload size={14} />
          {zipBusy ? 'Processing…' : 'Choose ZIP file'}
          <input
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            disabled={zipBusy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void runZipRestore(f);
              e.currentTarget.value = '';
            }}
          />
        </label>
        {zipErr ? <div className={FINELY_OS_NOTICE_ERROR}>{zipErr}</div> : null}
        {zipLog.length > 0 ? (
          <pre className={`max-h-48 overflow-y-auto rounded-xl bg-black/30 border border-white/[0.08] p-4 text-[11px] font-mono ${FINELY_OS_ENTITY_BODY}`}>
            {zipLog.join('\n')}
          </pre>
        ) : null}
      </section>

      {/* Bulk re-parse */}
      <section className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-4`} data-fc-accent="emerald">
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
          <Database size={18} />
          <span>Re-parse legacy credit reports</span>
        </div>
        <button
          type="button"
          onClick={() => void runBulkReparse()}
          disabled={reparseBusy || pendingReparseCount === 0}
          className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60`}
        >
          {reparseBusy ? 'Re-parsing…' : `Re-parse ${pendingReparseCount} report(s)`}
        </button>
        {reparseErr ? <div className={FINELY_OS_NOTICE_ERROR}>{reparseErr}</div> : null}
        {reparseLog.length > 0 ? (
          <pre className={`max-h-48 overflow-y-auto rounded-xl bg-black/30 p-4 text-[11px] font-mono ${FINELY_OS_ENTITY_BODY}`}>
            {reparseLog.join('\n')}
          </pre>
        ) : null}
      </section>

      {/* Classification repair */}
      <section className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-4`} data-fc-accent="rose">
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
          <Database size={18} />
          <span>Repair legacy classification &amp; stage</span>
        </div>
        <input
          value={repairOnlyExternalId}
          onChange={(e) => setRepairOnlyExternalId(e.target.value)}
          className={`${FINELY_OS_ENTITY_INPUT} font-mono text-sm max-w-xl`}
          placeholder="laravel:uid:176 — blank for all"
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!parsed || repairBusy}
            className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-60`}
            onClick={async () => {
              if (!parsed) return;
              setRepairBusy(true);
              setRepairLog([]);
              try {
                const result = await repairLegacyPartnerClassification({
                  exportData: parsed,
                  dryRun: true,
                  onlyExternalId: repairOnlyExternalId.trim() || undefined,
                });
                setRepairLog([
                  `Dry run — ${result.repairedPartnerIds.length}/${result.partnerCount} partner(s)`,
                  ...result.previews,
                ]);
              } catch (e: unknown) {
                setErr((e as Error)?.message || 'Repair dry run failed.');
              } finally {
                setRepairBusy(false);
              }
            }}
          >
            Dry-run repair preview
          </button>
          <button
            type="button"
            disabled={!parsed || repairBusy}
            className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60`}
            onClick={async () => {
              if (!parsed) return;
              setRepairBusy(true);
              setRepairLog([]);
              try {
                const result = await repairLegacyPartnerClassification({
                  exportData: parsed,
                  dryRun: false,
                  onlyExternalId: repairOnlyExternalId.trim() || undefined,
                });
                setRepairLog([
                  `Repaired ${result.repairedPartnerIds.length}/${result.partnerCount} partner(s)`,
                  ...result.previews,
                ]);
                setNotice(`Legacy classification repair applied.`);
              } catch (e: unknown) {
                setErr((e as Error)?.message || 'Repair failed.');
              } finally {
                setRepairBusy(false);
              }
            }}
          >
            Apply repair now
          </button>
        </div>
        {repairLog.length > 0 ? (
          <pre className={`max-h-64 overflow-y-auto rounded-xl bg-black/30 p-4 text-[11px] font-mono ${FINELY_OS_ENTITY_BODY}`}>
            {repairLog.join('\n')}
          </pre>
        ) : null}
      </section>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
