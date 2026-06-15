import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Download, Eye, FileText, Heart, LayoutTemplate, Pencil, Search, Star, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import type { TemplateCategory, TemplateTone, TemplateVariantRecipe } from '../../domain/templates';
import { TEMPLATE_BASES } from '../../templates';
import { TEMPLATE_TONES, TEMPLATE_VARIANTS } from '../../templates/variants';
import { renderTemplate } from '../../templates/render';
import { US_STATE_CODES, countGeneratedTemplates } from '../../templates/catalog';
import { listPartners } from '../../data/partnersRepo';
import type { Partner } from '../../domain/partners';
import { listFavoriteTemplateIds, toggleFavoriteTemplate } from '../../data/templatesRepo';
import { getBlobStore } from '../../storage/getBlobStore';
import type { EvidenceItem } from '../../domain/evidence';
import { newId } from '../../utils/ids';
import { upsertEvidence } from '../../data/evidenceRepo';
import { downloadBlob as safeDownloadBlob } from '../../utils/download';
import { TemplatesVaultPanel } from '../../components/templates/TemplatesVaultPanel';
import { FINELY_TENANT_ID } from '../../domain/partners';
import { injectPrintSafeCss } from '../../components/letters/paperPreviewSrcDoc';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import { createTemplateVaultItem, defaultRequiredEntitlementsForCategory } from '../../data/templateVaultRepo';
import { getCanonicalPartnerIdentity } from '../../utils/canonicalPartnerIdentity';
import { AnalysisReportBuilderPanel } from '../../components/reports/AnalysisReportBuilderPanel';
import { FinelyOsCatalogBrowser, type FinelyOsCatalogItem } from '../../features/os/FinelyOsCatalogBrowser';
import { FINELY_OS_PAGE, FINELY_OS_BACK_LINK, FINELY_OS_BANNER, FINELY_OS_BOARD_SHELL, FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_TITLE, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_LABEL, FINELY_OS_ENTITY_VALUE, FINELY_OS_ENTITY_INPUT, FINELY_OS_ENTITY_SELECT, finelyOsCatalogCard, FINELY_OS_ENTITY_CHIP, FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN, FINELY_OS_SUCCESS_BTN, FINELY_OS_VIEW_TABS, finelyOsViewTab, finelyOsStatusChip } from '../../features/os/finelyOsLightUi';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';

const blobStore = getBlobStore();

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function partnerStateGuess(p: Partner | null): string {
  if (!p) return '';
  const r = p.primaryRoute;
  const st = r ? p.routes?.[r]?.personal?.state : undefined;
  return (st || '').toUpperCase();
}

function categoryLabel(c: TemplateCategory) {
  switch (c) {
    case 'credit_dispute':
      return 'Credit disputes';
    case 'furnisher_dispute':
      return 'Furnisher disputes';
    case 'identity_theft':
      return 'Identity theft';
    case 'debt_collection':
      return 'Debt & collections';
    case 'court_filing':
      return 'Court filings';
    case 'bankruptcy':
      return 'Bankruptcy';
    case 'chexsystems':
      return 'ChexSystems / EWS';
    case 'business_funding':
      return 'Business funding';
    case 'contracts':
      return 'Contracts';
    case 'ops':
      return 'Operations';
    default:
      return String(c);
  }
}

async function htmlToPdfBytes(htmlText: string): Promise<Blob> {
  // For Phase 1 of templates, export a PDF that contains the plain-text version.
  // This avoids heavy HTML layout in PDF, but ensures a printable artifact.
  // Phase 2 can upgrade to richer PDF rendering (or server-side PDF).
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const pageSize: [number, number] = [612, 792]; // US Letter
  const margin = 54;
  const fontSize = 11;
  const lineHeight = 14;

  const lines = (htmlText || '').split('\n');
  let page = doc.addPage(pageSize);
  let y = page.getHeight() - margin;

  const drawLine = (s: string) => {
    if (y < margin + lineHeight) {
      page = doc.addPage(pageSize);
      y = page.getHeight() - margin;
    }
    const isHeading = /^[A-Z][A-Z0-9 \-:]{6,}$/.test(s.trim());
    page.drawText(s, {
      x: margin,
      y,
      size: isHeading ? 12 : fontSize,
      font: isHeading ? fontBold : font,
      color: rgb(0.05, 0.05, 0.05),
      maxWidth: page.getWidth() - margin * 2,
    });
    y -= lineHeight;
  };

  for (const line of lines) drawLine(line);
  const bytes = await doc.save();
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

function stripHtmlForExport(html: string): string {
  const withNewlines = String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|h1|h2|h3|li|tr)>/gi, '\n')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '');
  const text = withNewlines.replace(/<[^>]+>/g, '');
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function AdminTemplatesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all');
  const [libraryView, setLibraryView] = useState<'outputs' | 'bases'>('outputs');
  const [outputLimit, setOutputLimit] = useState(500);
  const [outputQuery, setOutputQuery] = useState('');
  const [outputCategoryFilter, setOutputCategoryFilter] = useState<TemplateCategory | 'all'>('all');
  const [selectedBaseId, setSelectedBaseId] = useState<string>(TEMPLATE_BASES[0]?.id ?? '');
  const [countStates, setCountStates] = useState(true);

  const [partners, setPartners] = useState<Partner[]>([]);
  useEffect(() => { listPartners().then(setPartners); }, []);
  const [partnerId, setPartnerId] = useState<string>('');
  useEffect(() => { if (!partnerId && partners[0]?.id) setPartnerId(partners[0].id); }, [partners, partnerId]);
  const partner = useMemo(() => partners.find((p) => p.id === partnerId) ?? null, [partners, partnerId]);
  const tenantId = partner?.tenantId ?? FINELY_TENANT_ID;

  const [favVersion, setFavVersion] = useState(0);
  const favorites = useMemo(() => new Set(listFavoriteTemplateIds()), [favVersion]);
  const [vaultRefresh, setVaultRefresh] = useState(0);

  const [variantId, setVariantId] = useState<string>(TEMPLATE_VARIANTS[0]!.id);
  const variant = useMemo<TemplateVariantRecipe>(
    () => TEMPLATE_VARIANTS.find((v) => v.id === variantId) ?? TEMPLATE_VARIANTS[0]!,
    [variantId],
  );
  const [tone, setTone] = useState<TemplateTone>('formal');
  const [version, setVersion] = useState(1);

  const [bureau, setBureau] = useState<'EXP' | 'EQF' | 'TUC'>('EXP');
  const [creditorName, setCreditorName] = useState('');
  const [accountRef, setAccountRef] = useState('');
  const [stateOverride, setStateOverride] = useState('');

  const base = useMemo(() => TEMPLATE_BASES.find((t) => t.id === selectedBaseId) ?? null, [selectedBaseId]);
  const baseCount = TEMPLATE_BASES.length;

  const generatedCount = useMemo(() => {
    return countGeneratedTemplates({
      bases: TEMPLATE_BASES,
      variants: TEMPLATE_VARIANTS,
      tones: TEMPLATE_TONES.map((t) => t.id),
      includeStates: countStates,
      stateCount: US_STATE_CODES.length,
    });
  }, [countStates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATE_BASES.filter((t) => {
      if (category !== 'all' && t.category !== category) return false;
      if (!q) return true;
      const hay = [t.title, t.description, t.category, t.tags.join(' ')].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [query, category]);

  const outputRows = useMemo(() => {
    const cap = Math.max(50, Math.min(2000, Math.round(outputLimit)));
    const q = outputQuery.trim().toLowerCase();
    const tones = TEMPLATE_TONES.map((t) => t.id);
    const rows: Array<{
      id: string;
      baseId: string;
      title: string;
      category: TemplateCategory;
      variantId: string;
      variantLabel: string;
      tone: TemplateTone;
      version: number;
    }> = [];

    // NOTE: This is intentionally capped for UI performance.
    for (const b of filtered) {
      for (const v of TEMPLATE_VARIANTS) {
        for (const t of tones) {
          for (let ver = 1; ver <= Math.max(1, b.versions || 1); ver++) {
            const id = `${b.id}__${v.id}__${t}__v${ver}`;
            if (q) {
              const hay = `${b.title} ${b.description} ${b.category} ${v.id} ${v.label} ${t} v${ver}`.toLowerCase();
              if (!hay.includes(q)) continue;
            }
            rows.push({ id, baseId: b.id, title: b.title, category: b.category, variantId: v.id, variantLabel: v.label, tone: t, version: ver });
            if (rows.length >= cap) return rows;
          }
        }
      }
    }
    return rows;
  }, [filtered, outputLimit, outputQuery]);

  const visibleOutputRows = useMemo(() => {
    if (outputCategoryFilter === 'all') return outputRows;
    return outputRows.filter((r) => r.category === outputCategoryFilter);
  }, [outputRows, outputCategoryFilter]);

  const outputRowById = useMemo(() => new Map(visibleOutputRows.map((r) => [r.id, r])), [visibleOutputRows]);

  const outputCatalogItems = useMemo((): FinelyOsCatalogItem[] => {
    return visibleOutputRows.map((r, i) => ({
      id: r.id,
      title: r.title,
      subtitle: `${r.variantLabel} · ${r.tone} · v${r.version}`,
      groupKey: r.category,
      accentIndex: i,
      badges: [
        { label: categoryLabel(r.category), className: FINELY_OS_ENTITY_CHIP },
        { label: r.tone, className: FINELY_OS_ENTITY_CHIP },
      ],
    }));
  }, [visibleOutputRows]);

  const baseCatalogItems = useMemo((): FinelyOsCatalogItem[] => {
    return filtered.map((t, i) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      subtitle: categoryLabel(t.category),
      groupKey: t.category,
      accentIndex: i,
      badges: [
        { label: `${t.versions} versions`, className: FINELY_OS_ENTITY_CHIP },
        ...(favorites.has(t.id) ? [{ label: 'Favorite', className: finelyOsStatusChip('warn') }] : []),
      ],
      meta: t.tags.slice(0, 3),
    }));
  }, [filtered, favorites]);

  const selectOutputRow = (r: (typeof outputRows)[number]) => {
    setSelectedBaseId(r.baseId);
    setVariantId(r.variantId);
    setTone(r.tone);
    setVersion(r.version);
  };

  const rendered = useMemo(() => {
    if (!base || !partner) return null;
    const nowIso = new Date().toISOString();
    const guessedState = partnerStateGuess(partner);
    const st = (stateOverride || guessedState || '').toUpperCase() || undefined;
    const canonical = getCanonicalPartnerIdentity({ partner, tenantId: (partner.tenantId || '').trim() || FINELY_TENANT_ID });

    const ctx = {
      nowIso,
      jurisdictionState: st,
      partner: {
        id: partner.id,
        fullName: canonical.fullName,
        email: partner.profile.email,
        phone: canonical.phone,
        address1: canonical.address1 ?? canonical.addressLine1,
        address2: canonical.address2,
        city: canonical.city,
        state: st ?? canonical.state,
        postalCode: canonical.postalCode,
      },
      bureau,
      creditorName: creditorName.trim() || undefined,
      accountRef: accountRef.trim() || undefined,
    };

    return renderTemplate({ baseId: base.id, variant, ctx, version, tone });
  }, [base, partner, bureau, creditorName, accountRef, stateOverride, variant, version, tone]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorHtml, setEditorHtml] = useState('');
  const [editorSavedMsg, setEditorSavedMsg] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'builder' | 'preview'>('builder');

  useEffect(() => {
    if (rendered?.html) {
      setEditorHtml(rendered.html);
      setWorkspaceTab('builder');
    }
  }, [rendered?.baseId, rendered?.variantId, rendered?.version, rendered?.tone, rendered?.html]);

  const previewSrcDoc = useMemo(() => {
    const html = editorHtml.trim() || rendered?.html || '';
    if (!html) return '';
    return injectPrintSafeCss({ html });
  }, [editorHtml, rendered?.html]);

  const editorPreviewSrcDoc = useMemo(() => {
    if (!editorOpen) return '';
    if (!editorHtml.trim()) return '';
    return injectPrintSafeCss({ html: editorHtml });
  }, [editorOpen, editorHtml]);

  const downloadWordHtml = (htmlOverride?: string) => {
    if (!rendered) return;
    const html = String(htmlOverride ?? rendered.html ?? '');
    const blob = new Blob([html], { type: 'application/msword' });
    safeDownloadBlob({ blob, filename: `${rendered.baseId}_${rendered.variantId}_v${rendered.version}.doc` });
  };

  const downloadPdf = async (htmlOverride?: string) => {
    if (!rendered) return;
    const text = htmlOverride ? stripHtmlForExport(htmlOverride) : rendered.text;
    const blob = await htmlToPdfBytes(text);
    safeDownloadBlob({ blob, filename: `${rendered.baseId}_${rendered.variantId}_v${rendered.version}.pdf` });
  };

  const openInlineEditor = () => {
    if (!rendered) return;
    setEditorSavedMsg(null);
    setEditorHtml(rendered.html || '');
    setEditorOpen(true);
  };

  const saveEditedToTemplatesVault = async () => {
    if (!rendered) return;
    const html = String(editorHtml || '').trim();
    if (!html) return;
    const file = new File([html], `${rendered.title.replace(/[^\w\- ]+/g, '').slice(0, 80) || 'template'}.html`, { type: 'text/html' });
    const { ref } = await blobStore.put(file, { tenantId, kind: 'template_vault', baseId: rendered.baseId, variantId: rendered.variantId });
    createTemplateVaultItem({
      tenantId,
      title: `${rendered.title} (edited)`,
      category: rendered.category,
      tags: ['edited', rendered.baseId, rendered.variantId, `tone:${rendered.tone}`, `v${rendered.version}`],
      kind: 'file',
      blobRef: ref,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      requiredEntitlements: defaultRequiredEntitlementsForCategory(rendered.category),
      createdBy: { actorType: 'admin' },
    });
    setEditorSavedMsg('Saved to Templates Vault.');
    setVaultRefresh((v) => v + 1);
  };

  const saveToVault = async () => {
    if (!rendered || !partner) return;
    const blob = await htmlToPdfBytes(rendered.text);
    const file = new File([blob], `${rendered.title}.pdf`, { type: 'application/pdf' });
    const { ref } = await blobStore.put(file, { partnerId: partner.id, kind: 'evidence', source: 'template' });
    const item: EvidenceItem = {
      id: newId('evidence'),
      partnerId: partner.id,
      type: 'upload',
      source: 'upload',
      caption: `Generated template: ${rendered.title} • ${rendered.variantId} • version ${rendered.version} • tone ${rendered.tone}`,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      blobRef: ref,
      createdAt: new Date().toISOString(),
    };
    upsertEvidence(item);
  };

  const categoryOptions: Array<{ id: TemplateCategory | 'all'; label: string }> = [
    { id: 'all', label: 'All categories' },
    ...Array.from(new Set(TEMPLATE_BASES.map((t) => t.category))).map((c) => ({ id: c, label: categoryLabel(c) })),
  ];

  return (
    <PageShell
      badge="Admin"
      title="Template Library"
      subtitle="Generator-first templates: multiple OCR-friendly variants, partner/state-aware context, and export to PDF/Word."
    >
      <div className={FINELY_OS_PAGE}>
        {editorOpen ? (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditorOpen(false)} />
            <div
              className="relative w-full max-w-7xl rounded-3xl border border-white/[0.08] bg-fc-shell shadow-2xl overflow-hidden"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/[0.08] bg-fc-input flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Inline editor</div>
                  <div className={`mt-2 ${FINELY_OS_ENTITY_TITLE} truncate`}>{rendered?.title}</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} truncate`}>
                    {rendered ? `${rendered.variantId} • v${rendered.version} • ${rendered.tone}` : ''}
                  </div>
                  {editorSavedMsg ? <div className={`mt-3 ${FINELY_OS_ENTITY_BODY} text-emerald-300`}>{editorSavedMsg}</div> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void saveEditedToTemplatesVault()}
                    className={FINELY_OS_SUCCESS_BTN}
                    title="Save as an edited HTML file in Templates Vault"
                  >
                    <Star size={14} /> Save to Templates Vault
                  </button>
                  <button type="button" onClick={() => void downloadPdf(editorHtml)} className={FINELY_OS_PRIMARY_BTN}>
                    <Download size={14} /> Export PDF
                  </button>
                  <button type="button" onClick={() => downloadWordHtml(editorHtml)} className={FINELY_OS_SECONDARY_BTN}>
                    <Download size={14} /> Export Word
                  </button>
                  <button type="button" onClick={() => setEditorOpen(false)} className={FINELY_OS_SECONDARY_BTN}>
                    Close
                  </button>
                </div>
              </div>
              <div className="p-4 grid lg:grid-cols-2 gap-4 bg-fc-input">
                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Edit</div>
                  <div className="mt-3">
                    <RichTextEditor
                      valueHtml={editorHtml}
                      onChangeHtml={(html) => setEditorHtml(html)}
                      placeholder="Edit the template here…"
                      minHeightPx={520}
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white p-4">
                  <div className="text-[10px] uppercase tracking-widest text-black/50 font-mono">Preview</div>
                  {editorPreviewSrcDoc ? (
                    <iframe title="Edited preview" srcDoc={editorPreviewSrcDoc} className="mt-3 w-full h-[520px] rounded-xl border border-black/10 bg-white" />
                  ) : (
                    <div className="mt-3 text-black/60 text-sm">Nothing to preview yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className={FINELY_OS_BANNER}>
          <LayoutTemplate size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className={FINELY_OS_ENTITY_TITLE}>How the “2,000+ templates” works</div>
            <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
              We don’t store thousands of separate files — we store <strong className="text-emerald-200">{baseCount}</strong> base templates, then generate variations via tone, versioning, OCR-friendly layouts, and (optionally) state-aware specializations.
            </p>
            <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
              Current estimated library size: <strong className="text-emerald-300">{generatedCount.toLocaleString()}</strong>{' '}
              {countStates ? '(including state specializations)' : '(base × variants × tones × versions)'}
            </p>
            <label className={`mt-3 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
              <input type="checkbox" checked={countStates} onChange={(e) => setCountStates(e.target.checked)} className="accent-emerald-600" />
              Count states in total
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK} title="Back to Admin Dashboard">
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <button type="button" onClick={() => navigate('/portal/documents')} className={FINELY_OS_SECONDARY_BTN} title="Open partner Documents Vault">
            <Upload size={14} /> Documents Vault
          </button>
        </div>

        <div className="space-y-12">
          <section className={`${finelyOsCatalogCard('amber')} !p-5 space-y-5`} data-fc-accent="amber">
            <div>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Step 1</p>
              <h2 className={`mt-1 ${FINELY_OS_ENTITY_TITLE}`}>Template library</h2>
              <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>Browse bases or generated outputs — full width, no cramped side panels.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 sm:col-span-2">
                <Search size={16} className="text-violet-400 shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search templates…"
                  className={`${FINELY_OS_ENTITY_SELECT} text-sm py-3`}
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className={`${FINELY_OS_ENTITY_SELECT} text-sm py-3`}
              >
                {categoryOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              <div className={`flex items-center ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
                showing {filtered.length} / {TEMPLATE_BASES.length}
              </div>
            </div>

            <div className={`${finelyOsCatalogCard('violet')} !p-5 overflow-hidden`}>
              <div className="px-5 py-3 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>Templates</div>
                <div className={FINELY_OS_VIEW_TABS}>
                  <button
                    type="button"
                    onClick={() => setLibraryView('outputs')}
                    className={finelyOsViewTab(libraryView === 'outputs', 'fuchsia')}
                    title="Browse generated outputs (base × variant × tone × version)"
                  >
                    Outputs
                  </button>
                  <button
                    type="button"
                    onClick={() => setLibraryView('bases')}
                    className={finelyOsViewTab(libraryView === 'bases', 'violet')}
                    title="Browse base templates (source templates)"
                  >
                    Bases
                  </button>
                </div>
              </div>

              {libraryView === 'outputs' && (
                <div className="px-5 py-3 border-b border-white/[0.08] bg-white/[0.05] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className={FINELY_OS_ENTITY_BODY}>
                      <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{visibleOutputRows.length}</span> template cards (capped at {outputLimit})
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 px-3 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl">
                        <Search size={14} className="text-violet-400" />
                        <input
                          value={outputQuery}
                          onChange={(e) => setOutputQuery(e.target.value)}
                          placeholder="Search outputs…"
                          className={`bg-transparent outline-none text-sm w-36 sm:w-44 ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/35`}
                        />
                      </div>
                      <input
                        type="number"
                        min={50}
                        max={2000}
                        value={outputLimit}
                        onChange={(e) => setOutputLimit(parseInt(e.target.value || '500', 10))}
                        className={`${FINELY_OS_ENTITY_SELECT} w-20 text-sm py-2`}
                        title="Cap for performance"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setOutputCategoryFilter('all')}
                      className={finelyOsViewTab(outputCategoryFilter === 'all', 'fuchsia')}
                    >
                      All
                    </button>
                    {categoryOptions.filter((o) => o.id !== 'all').map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setOutputCategoryFilter(o.id as TemplateCategory)}
                        className={finelyOsViewTab(outputCategoryFilter === o.id, 'violet')}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4">
                <div className={`${finelyOsCatalogCard('violet')} !p-5`} data-fc-accent="violet">
                  {libraryView === 'outputs' ? (
                    <FinelyOsCatalogBrowser
                      items={outputCatalogItems}
                      pageSize={12}
                      searchPlaceholder="Search generated outputs…"
                      emptyMessage="No outputs match — adjust cap or filters."
                      onItemClick={(id) => {
                        const row = outputRowById.get(id);
                        if (row) selectOutputRow(row);
                      }}
                      initialView="grid"
                      renderTrailing={(item) => {
                        const row = outputRowById.get(item.id);
                        if (!row) return null;
                        const active =
                          row.baseId === selectedBaseId && row.variantId === variantId && row.tone === tone && row.version === version;
                        return active ? (
                          <span className={`text-[10px] font-bold uppercase text-fuchsia-300`}>Selected</span>
                        ) : null;
                      }}
                    />
                  ) : (
                    <FinelyOsCatalogBrowser
                      items={baseCatalogItems}
                      pageSize={12}
                      searchPlaceholder="Search template bases…"
                      emptyMessage="No bases match your filters."
                      onItemClick={(id) => {
                        setSelectedBaseId(id);
                        setVersion(1);
                      }}
                      initialView="grid"
                      renderTrailing={(item) =>
                        item.id === selectedBaseId ? (
                          <span className={`text-[10px] font-bold uppercase text-fuchsia-300`}>Selected</span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavoriteTemplate(item.id);
                              setFavVersion((v) => v + 1);
                            }}
                            className={`text-[10px] font-bold uppercase ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal hover:text-fuchsia-300 transition-colors`}
                          >
                            {favorites.has(item.id) ? 'Unfavorite' : 'Favorite'}
                          </button>
                        )
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className={`${FINELY_OS_BOARD_SHELL} space-y-6`}>
            <div>
              <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>Step 2</p>
              <h2 className={`mt-1 ${FINELY_OS_ENTITY_TITLE}`}>Generate letter</h2>
              <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>Configure partner, variant, and tone — then build below.</p>
            </div>
            <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-6`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
                    <FileText size={18} />
                    <span>Generate</span>
                  </div>
                  <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>{base?.title ?? 'Select a template'}</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{base?.description ?? ''}</div>
                </div>
                <button type="button" onClick={() => navigate('/admin/partners')} className={FINELY_OS_SECONDARY_BTN}>
                  Partner management <ArrowRight size={14} />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`block ${FINELY_OS_ENTITY_LABEL} mb-1`}>Partner</label>
                  <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className={FINELY_OS_ENTITY_SELECT}>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.profile.fullName} ({p.id.slice(0, 6)})
                      </option>
                    ))}
                  </select>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
                    updated: {partner ? fmtWhen(partner.updatedAt) : '—'}
                  </div>
                </div>

                <div>
                  <label className={`block ${FINELY_OS_ENTITY_LABEL} mb-1`}>Jurisdiction state</label>
                  <input
                    value={stateOverride}
                    onChange={(e) => setStateOverride(e.target.value.toUpperCase())}
                    placeholder={partnerStateGuess(partner) || 'e.g. CA'}
                    className={FINELY_OS_ENTITY_SELECT}
                    maxLength={2}
                  />
                  <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                    uses partner intake state when blank
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className={`block ${FINELY_OS_ENTITY_LABEL} mb-1`}>Variant</label>
                  <select value={variantId} onChange={(e) => setVariantId(e.target.value)} className={FINELY_OS_ENTITY_SELECT}>
                    {TEMPLATE_VARIANTS.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block ${FINELY_OS_ENTITY_LABEL} mb-1`}>Tone</label>
                  <select value={tone} onChange={(e) => setTone(e.target.value as any)} className={FINELY_OS_ENTITY_SELECT}>
                    {TEMPLATE_TONES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block ${FINELY_OS_ENTITY_LABEL} mb-1`}>Copy version</label>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, base?.versions ?? 1)}
                    value={version}
                    onChange={(e) => setVersion(Math.max(1, Math.min(99, parseInt(e.target.value || '1', 10))))}
                    className={FINELY_OS_ENTITY_SELECT}
                  />
                  <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                    max: {base?.versions ?? 1}
                  </div>
                </div>
                <div>
                  <label className={`block ${FINELY_OS_ENTITY_LABEL} mb-1`}>Bureau (optional)</label>
                  <select value={bureau} onChange={(e) => setBureau(e.target.value as any)} className={FINELY_OS_ENTITY_SELECT}>
                    <option value="EXP">Experian (EXP)</option>
                    <option value="EQF">Equifax (EQF)</option>
                    <option value="TUC">TransUnion (Trans)</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`block ${FINELY_OS_ENTITY_LABEL} mb-1`}>Creditor / furnisher (optional)</label>
                  <input
                    value={creditorName}
                    onChange={(e) => setCreditorName(e.target.value)}
                    placeholder="e.g. ABC Collections"
                    className={FINELY_OS_ENTITY_SELECT}
                  />
                </div>
                <div>
                  <label className={`block ${FINELY_OS_ENTITY_LABEL} mb-1`}>Account reference (optional)</label>
                  <input
                    value={accountRef}
                    onChange={(e) => setAccountRef(e.target.value)}
                    placeholder="last4 / case # / ref"
                    className={FINELY_OS_ENTITY_SELECT}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void downloadPdf(editorHtml.trim() ? editorHtml : undefined)}
                  disabled={!rendered}
                  className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  <Download size={14} /> Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => downloadWordHtml(editorHtml.trim() || undefined)}
                  disabled={!rendered}
                  className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}
                  title="Word-compatible HTML (.doc)"
                >
                  <Download size={14} /> Download Word
                </button>
                <button
                  type="button"
                  onClick={() => void saveToVault()}
                  disabled={!rendered || !partner}
                  className={`${FINELY_OS_SUCCESS_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}
                  title="Save generated PDF into partner Documents Vault"
                >
                  <Star size={14} /> Save to vault
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspaceTab((t) => (t === 'builder' ? 'preview' : 'builder'))}
                  disabled={!rendered}
                  className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-60`}
                  title="Toggle builder / preview focus"
                >
                  {workspaceTab === 'builder' ? <Eye size={14} /> : <LayoutTemplate size={14} />}
                  {workspaceTab === 'builder' ? 'Preview focus' : 'Builder focus'}
                </button>
                <button
                  type="button"
                  onClick={openInlineEditor}
                  disabled={!rendered}
                  className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}
                  title="Full-screen letter builder"
                >
                  <Pencil size={14} /> Full screen
                </button>
                <div className={`ml-auto ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
                  bases: {TEMPLATE_BASES.length} • outputs:{" "}
                  {countGeneratedTemplates({
                    bases: TEMPLATE_BASES,
                    variants: TEMPLATE_VARIANTS,
                    tones: TEMPLATE_TONES.map((t) => t.id),
                  }).toLocaleString()}
                  {" "}• across states:{" "}
                  {countGeneratedTemplates({
                    bases: TEMPLATE_BASES,
                    variants: TEMPLATE_VARIANTS,
                    tones: TEMPLATE_TONES.map((t) => t.id),
                    includeStates: true,
                    stateCount: US_STATE_CODES.length,
                  }).toLocaleString()}
                </div>
              </div>
            </div>
          </section>

          <section className={`${FINELY_OS_BOARD_SHELL} space-y-8`}>
            <div>
              <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-700`}>Step 3</p>
              <h2 className={`mt-1 ${FINELY_OS_ENTITY_TITLE}`}>Letter builder & live preview</h2>
              <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>Full-width editor and preview stacked with generous spacing.</p>
            </div>

            <div className={`${finelyOsCatalogCard('violet')} !p-5 overflow-hidden`}>
              <div className="px-5 py-3 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <div className={FINELY_OS_VIEW_TABS}>
                  <button type="button" onClick={() => setWorkspaceTab('builder')} className={finelyOsViewTab(workspaceTab === 'builder', 'fuchsia')}>
                    <LayoutTemplate size={12} /> Builder
                  </button>
                  <button type="button" onClick={() => setWorkspaceTab('preview')} className={finelyOsViewTab(workspaceTab === 'preview', 'violet')}>
                    <Eye size={12} /> Live preview
                  </button>
                </div>
                {rendered && (
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
                    {rendered.variantId} • v{rendered.version} • {rendered.tone}
                  </div>
                )}
              </div>
              {!rendered ? (
                <div className={`p-8 ${FINELY_OS_ENTITY_BODY}`}>Select a template and partner to open the letter builder.</div>
              ) : workspaceTab === 'preview' ? (
                <div className="p-6 lg:p-8 bg-white">
                  <iframe
                    title="Template preview"
                    srcDoc={previewSrcDoc}
                    className="w-full h-[720px] rounded-xl border border-slate-200 bg-white shadow-inner"
                  />
                </div>
              ) : (
                <div className="space-y-8 p-6 lg:p-8">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-4">Letter builder — fonts, images, attachments</div>
                    <RichTextEditor
                      valueHtml={editorHtml}
                      onChangeHtml={(html) => setEditorHtml(html)}
                      placeholder="Build your letter here — changes sync to preview instantly…"
                      minHeightPx={480}
                    />
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void saveEditedToTemplatesVault()}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase shadow-md hover:bg-emerald-500"
                      >
                        <Star size={12} /> Save to vault
                      </button>
                      {editorSavedMsg ? <span className="text-emerald-600 text-xs self-center font-medium">{editorSavedMsg}</span> : null}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-4">Live preview</div>
                    {previewSrcDoc ? (
                      <iframe title="Live letter preview" srcDoc={previewSrcDoc} className="w-full h-[640px] rounded-xl border border-slate-200 bg-white" />
                    ) : (
                      <div className="text-slate-500 text-sm">Generate a template to preview.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <p className={`${FINELY_OS_ENTITY_BODY} text-xs px-1`}>
              PDF export prints the text version (OCR-friendly). Word export uses HTML (.doc) for compatibility.
            </p>
          </section>

          <section className="space-y-4">
            <div>
              <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-700`}>Saved letters vault</p>
              <h2 className={`mt-1 ${FINELY_OS_ENTITY_TITLE}`}>Templates vault — separate from the builder</h2>
            </div>
            <TemplatesVaultPanel
              key={`tplv-bottom:${tenantId}:${vaultRefresh}`}
              tenantId={tenantId}
              variant="admin"
              allowCreate={true}
              allowEdit={true}
            />
          </section>

          <AnalysisReportBuilderPanel partners={partners} defaultPartnerId={partnerId} />
        <FinelyOsPageFooter />
</div>
      </div>
    </PageShell>
  );
}

