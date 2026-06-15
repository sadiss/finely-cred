import React, { useMemo, useState } from 'react';
import { AlertTriangle, Download, Eye, FileText, Save, Sparkles } from 'lucide-react';
import type { Partner } from '../../domain/partners';
import { listReportsByPartner } from '../../data/reportsRepo';
import { deriveDisputeCandidates } from '../../creditReports/disputeCandidates';
import {
  buildAnalysisReportPreviewModel,
  generateCreditAnalysisReportPdf,
  type AnalysisVariant,
  type CreditAnalysisReportTemplateConfig,
} from '../../reports/generateCreditAnalysisReportPdf';
import { FINELY_TENANT_ID } from '../../domain/partners';
import { createTemplateVaultItem, defaultRequiredEntitlementsForCategory } from '../../data/templateVaultRepo';
import { getBlobStore } from '../../storage/getBlobStore';
import { upsertEvidence } from '../../data/evidenceRepo';
import { newId } from '../../utils/ids';
import { downloadBlob } from '../../utils/download';
import { notifyAnalysisReportReady } from '../../lib/analysisReportDelivery';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsGlassShell,
  finelyOsKpiTile,
} from '../../features/os/finelyOsLightUi';

type Props = {
  partners: Partner[];
  defaultPartnerId?: string;
  compact?: boolean;
};

const DEFAULT_TEMPLATE: CreditAnalysisReportTemplateConfig = {
  version: 1,
  title: 'Credit Analysis Report',
  badgeLine: 'Premium deliverable • Strategy • Negatives • Next steps',
  minPages: 22,
  variant: 'negatives_heavy',
  negatives: { maxPerBucket: 24 },
};

export function AnalysisReportBuilderPanel({ partners, defaultPartnerId, compact }: Props) {
  const [partnerId, setPartnerId] = useState(defaultPartnerId || partners[0]?.id || '');
  const partner = useMemo(() => partners.find((p) => p.id === partnerId) ?? null, [partners, partnerId]);
  const reports = useMemo(() => (partner ? listReportsByPartner(partner.id) : []), [partner]);
  const parsedReports = useMemo(() => reports.filter((r) => r.parsed), [reports]);
  const [reportId, setReportId] = useState('');
  const selectedReport = useMemo(
    () => parsedReports.find((r) => r.id === reportId) ?? parsedReports[0] ?? null,
    [parsedReports, reportId],
  );

  const [variant, setVariant] = useState<AnalysisVariant>('negatives_heavy');
  const [minPages, setMinPages] = useState(22);
  const [templateTitle, setTemplateTitle] = useState('Credit Analysis Report • Premium');
  const [roadmapNow, setRoadmapNow] = useState('');
  const [roadmapNext, setRoadmapNext] = useState('');
  const [roadmapLater, setRoadmapLater] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const templateConfig = useMemo((): CreditAnalysisReportTemplateConfig => {
    const split = (s: string) =>
      s
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean);
    return {
      ...DEFAULT_TEMPLATE,
      title: templateTitle.trim() || DEFAULT_TEMPLATE.title,
      minPages,
      variant,
      roadmap: {
        now: split(roadmapNow).length ? split(roadmapNow) : undefined,
        next: split(roadmapNext).length ? split(roadmapNext) : undefined,
        later: split(roadmapLater).length ? split(roadmapLater) : undefined,
      },
    };
  }, [templateTitle, minPages, variant, roadmapNow, roadmapNext, roadmapLater]);

  const preview = useMemo(() => {
    if (!partner || !selectedReport?.parsed) return null;
    const candidates = deriveDisputeCandidates(selectedReport.parsed, selectedReport.id);
    return buildAnalysisReportPreviewModel({
      partner,
      report: selectedReport,
      candidates,
      variant,
      template: templateConfig,
    });
  }, [partner, selectedReport, variant, templateConfig]);

  const saveTemplate = () => {
    const tenantId = partner?.tenantId?.trim() || FINELY_TENANT_ID;
    createTemplateVaultItem({
      tenantId,
      title: templateTitle.trim() || 'Credit Analysis Template',
      category: 'ops',
      tags: ['analysis_report_template', `analysis_variant:${variant}`, `min_pages:${minPages}`],
      kind: 'text',
      bodyText: JSON.stringify(templateConfig, null, 2),
      requiredEntitlements: defaultRequiredEntitlementsForCategory('ops'),
      createdBy: { actorType: 'admin' },
    });
    setNotice('Template saved to Templates Vault.');
    window.setTimeout(() => setNotice(null), 2500);
  };

  const generatePdf = async () => {
    if (!partner || !selectedReport?.parsed) {
      setNotice('Select a partner with a parsed credit report.');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const candidates = deriveDisputeCandidates(selectedReport.parsed, selectedReport.id);
      const { blob, filename, pages } = await generateCreditAnalysisReportPdf({
        partner,
        report: selectedReport,
        candidates,
        variant,
        template: templateConfig,
      });
      const store = getBlobStore();
      const put = await store.put(blob, { partnerId: partner.id, reportId: selectedReport.id, kind: 'analysis_report' });
      upsertEvidence({
        id: newId('evidence'),
        partnerId: partner.id,
        reportId: selectedReport.id,
        type: 'upload',
        source: 'upload',
        caption: `Credit Analysis Report • ${selectedReport.filename}`,
        tags: ['analysis_report'],
        filename,
        mimeType: 'application/pdf',
        sizeBytes: blob.size,
        blobRef: put.ref,
        createdAt: new Date().toISOString(),
      } as any);
      downloadBlob({ blob, filename });
      const emailResult = await notifyAnalysisReportReady({
        partner,
        report: selectedReport,
        candidates,
      });
      setNotice(
        `Generated ${pages}-page PDF and saved to Documents Vault.${emailResult.sent ? ' Analysis email sent.' : ''}`,
      );
    } catch (e: unknown) {
      setNotice((e as Error)?.message || 'Generation failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`${finelyOsGlassShell('panel', 'sky')} ${compact ? '!p-6' : ''} space-y-10`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-sky-800">
            <Sparkles size={18} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Analysis report builder</span>
          </div>
          <h2 className={`mt-2 ${FINELY_OS_ENTITY_TITLE}`}>Build 20–30 page credit analysis reports</h2>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} max-w-2xl leading-relaxed`}>
            Pick a real partner profile and uploaded report to preview negatives in the center of the document. Adjust page count, roadmap, and variant — then save or export PDF.
          </p>
        </div>
        {preview ? (
          <div className={`${finelyOsKpiTile(2)} text-center min-w-[120px]`}>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Est. pages</p>
            <p className={`text-2xl font-bold ${FINELY_OS_ENTITY_VALUE}`}>{preview.estimatedPages}</p>
          </div>
        ) : null}
      </div>

      <div className={`${finelyOsCatalogCard('violet')} !p-6 lg:!p-8 space-y-6`}>
        <p className={FINELY_OS_ENTITY_SUBLABEL}>1 · Sample profile & report</p>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 min-w-0">
          <label className="block md:col-span-2 min-w-0">
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Partner profile</span>
            <select
              value={partnerId}
              onChange={(e) => {
                setPartnerId(e.target.value);
                setReportId('');
              }}
              className={FINELY_OS_ENTITY_SELECT}
            >
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.profile.fullName} ({p.id.slice(0, 6)})
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2 min-w-0">
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Credit report (parsed)</span>
            <select
              value={selectedReport?.id ?? ''}
              onChange={(e) => setReportId(e.target.value)}
              className={FINELY_OS_ENTITY_SELECT}
            >
              {parsedReports.length === 0 ? (
                <option value="">No parsed reports — upload in Reports</option>
              ) : (
                parsedReports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.filename} · {r.provider || 'bureau'}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="block min-w-0">
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Variant</span>
            <select
              value={variant}
              onChange={(e) => setVariant(e.target.value as AnalysisVariant)}
              className={FINELY_OS_ENTITY_SELECT}
            >
              <option value="standard">Standard</option>
              <option value="negatives_heavy">Negatives heavy</option>
              <option value="funding_focus">Funding focus</option>
            </select>
          </label>
          <label className="block min-w-0">
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Min pages ({minPages})</span>
            <input
              type="range"
              min={20}
              max={30}
              value={minPages}
              onChange={(e) => setMinPages(Number(e.target.value))}
              className="mt-4 w-full accent-sky-600"
            />
          </label>
          <label className="block md:col-span-2 min-w-0">
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Report title</span>
            <input value={templateTitle} onChange={(e) => setTemplateTitle(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
          </label>
        </div>
      </div>

      <div className={`${finelyOsCatalogCard('violet')} !p-6 lg:!p-8 space-y-5`}>
        <p className={FINELY_OS_ENTITY_SUBLABEL}>2 · Roadmap bullets (one per line)</p>
        <div className="grid lg:grid-cols-3 gap-5 min-w-0">
          {[
            { label: 'Now (0–7 days)', value: roadmapNow, set: setRoadmapNow },
            { label: 'Next (7–30 days)', value: roadmapNext, set: setRoadmapNext },
            { label: 'Later (30–90 days)', value: roadmapLater, set: setRoadmapLater },
          ].map((f) => (
            <label key={f.label} className="block min-w-0">
              <span className={FINELY_OS_ENTITY_SUBLABEL}>{f.label}</span>
              <textarea
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                rows={5}
                placeholder="Leave blank for defaults…"
                className={`${FINELY_OS_ENTITY_INPUT} resize-none`}
              />
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => void generatePdf()}
            disabled={busy || !selectedReport?.parsed}
            className={FINELY_OS_PRIMARY_BTN}
          >
            <Download size={14} /> {busy ? 'Generating…' : 'Generate & download PDF'}
          </button>
          <button type="button" onClick={saveTemplate} className={FINELY_OS_SUCCESS_BTN}>
            <Save size={14} /> Save template
          </button>
        </div>
        {notice ? <p className={FINELY_OS_NOTICE}>{notice}</p> : null}
      </div>

      <div className={`${finelyOsCatalogCard('violet')} !p-5 border border-sky-500/25 space-y-4`}>
        <div className="flex items-center gap-2 text-white/85">
          <Eye size={18} className="text-sky-300" />
          <span className={`text-sm font-black uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL} !normal-case`}>3 · Live preview</span>
          {preview ? (
            <span className={`ml-auto text-xs ${FINELY_OS_ENTITY_BODY}`}>
              {preview.negativesCount} negative line(s) · negatives appear in the middle sections
            </span>
          ) : null}
        </div>
        {!preview ? (
          <p className={`${FINELY_OS_ENTITY_BODY} text-sm py-8 text-center`}>Select a partner with a parsed report to preview the full report outline.</p>
        ) : (
          <div className="space-y-4">
            <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl p-4">
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Cover</p>
              <p className={`text-lg font-semibold ${FINELY_OS_ENTITY_VALUE} mt-1`}>{templateTitle}</p>
              <p className={FINELY_OS_ENTITY_BODY}>{partner?.profile.fullName} · {selectedReport?.filename}</p>
            </div>
            <FinelyOsPaginatedStack
              items={preview.sections}
              pageSize={4}
              emptyMessage="No sections in preview."
              renderItem={(sec, i) => (
                <div
                  key={`${sec.title}_${i}`}
                  className={`rounded-xl border p-4 ${
                    sec.kind === 'negative'
                      ? 'border-fuchsia-500/35 bg-fuchsia-500/10 ring-1 ring-fuchsia-400/20'
                      : sec.kind === 'roadmap'
                        ? 'border-sky-500/30 bg-sky-500/10'
                        : sec.kind === 'appendix'
                          ? 'border-white/[0.08] bg-white/[0.06]'
                          : 'border-white/[0.08] bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {sec.kind === 'negative' ? <AlertTriangle size={14} className="text-amber-300" /> : <FileText size={14} className="text-white/40" />}
                    <p className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{sec.title}</p>
                    {sec.kind === 'negative' ? (
                      <span className="ml-auto text-[9px] font-black uppercase text-fuchsia-200 bg-fuchsia-500/20 px-2 py-0.5 rounded-full">Negatives</span>
                    ) : null}
                  </div>
                  <ul className={`mt-3 space-y-1.5 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                    {sec.bullets.slice(0, 8).map((b, j) => (
                      <li key={j} className="flex gap-2">
                        <span className="text-white/35">•</span>
                        <span className="line-clamp-2">{b}</span>
                      </li>
                    ))}
                    {sec.bullets.length > 8 ? (
                      <li className="text-xs text-white/45 italic">+ {sec.bullets.length - 8} more lines in PDF…</li>
                    ) : null}
                  </ul>
                </div>
              )}
            />
            <div className={`rounded-xl border border-dashed border-white/15 p-4 text-center text-sm ${FINELY_OS_ENTITY_BODY}`}>
              Premium padding fills to <strong className={FINELY_OS_ENTITY_VALUE}>{preview.estimatedPages}</strong> pages total
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
