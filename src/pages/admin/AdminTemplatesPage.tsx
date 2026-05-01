import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight, Download, Eye, FileText, Heart, Pencil, Search, Star, Upload } from 'lucide-react';
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
  const [outputGroupBy, setOutputGroupBy] = useState<'category' | 'base'>('category');
  const [openOutputGroups, setOpenOutputGroups] = useState<Record<string, boolean>>({});
  const [selectedBaseId, setSelectedBaseId] = useState<string>(TEMPLATE_BASES[0]?.id ?? '');
  const [countStates, setCountStates] = useState(true);

  const partners = useMemo(() => listPartners(), []);
  const [partnerId, setPartnerId] = useState<string>(partners[0]?.id ?? '');
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

  const outputGroups = useMemo(() => {
    if (outputGroupBy === 'base') {
      const m = new Map<string, { id: string; label: string; rows: typeof outputRows }>();
      for (const r of outputRows) {
        const key = r.baseId;
        const existing = m.get(key);
        if (existing) {
          existing.rows.push(r);
        } else {
          m.set(key, { id: key, label: r.title, rows: [r] });
        }
      }
      return Array.from(m.values()).sort((a, b) => a.label.localeCompare(b.label));
    }

    const m = new Map<string, { id: string; label: string; rows: typeof outputRows }>();
    for (const r of outputRows) {
      const key = r.category;
      const existing = m.get(key);
      if (existing) {
        existing.rows.push(r);
      } else {
        m.set(key, { id: key, label: categoryLabel(r.category), rows: [r] });
      }
    }
    return Array.from(m.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [outputRows, outputGroupBy]);

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

  const previewSrcDoc = useMemo(() => {
    if (!rendered?.html) return '';
    return injectPrintSafeCss({ html: rendered.html });
  }, [rendered?.html]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorHtml, setEditorHtml] = useState('');
  const [editorSavedMsg, setEditorSavedMsg] = useState<string | null>(null);

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
      <div className="space-y-6">
        {editorOpen ? (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditorOpen(false)} />
            <div
              className="relative w-full max-w-7xl rounded-3xl border border-white/10 bg-[#0a0f0d] shadow-2xl overflow-hidden"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Inline editor</div>
                  <div className="mt-2 text-xl font-semibold text-white truncate">{rendered?.title}</div>
                  <div className="mt-1 text-white/60 text-sm truncate">
                    {rendered ? `${rendered.variantId} • v${rendered.version} • ${rendered.tone}` : ''}
                  </div>
                  {editorSavedMsg ? <div className="mt-3 text-emerald-200/90 text-sm">{editorSavedMsg}</div> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void saveEditedToTemplatesVault()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/15 text-[10px] font-black uppercase tracking-widest text-emerald-200 transition-all"
                    title="Save as an edited HTML file in Templates Vault"
                  >
                    <Star size={14} /> Save to Templates Vault
                  </button>
                  <button
                    type="button"
                    onClick={() => void downloadPdf(editorHtml)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                  >
                    <Download size={14} /> Export PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadWordHtml(editorHtml)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                  >
                    <Download size={14} /> Export Word
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorOpen(false)}
                    className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="p-4 grid lg:grid-cols-2 gap-4 bg-black/40">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Edit</div>
                  <div className="mt-3">
                    <RichTextEditor
                      valueHtml={editorHtml}
                      onChangeHtml={(html) => setEditorHtml(html)}
                      placeholder="Edit the template here…"
                      minHeightPx={520}
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white p-4">
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

        <TemplatesVaultPanel
          key={`tplv:${tenantId}:${vaultRefresh}`}
          tenantId={tenantId}
          variant="admin"
          allowCreate={true}
          allowEdit={true}
        />

        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="text-white font-semibold">How the “2,000+ templates” works</div>
              <div className="text-white/70 text-sm leading-relaxed">
                We don’t store thousands of separate files — we store <span className="text-white/90 font-semibold">{baseCount}</span>{' '}
                base templates, then generate variations via tone, versioning, OCR-friendly layouts, and (optionally) state-aware
                specializations.
              </div>
              <div className="mt-2 text-white/60 text-sm">
                Current estimated library size:{' '}
                <span className="text-emerald-200 font-black">{generatedCount.toLocaleString()}</span>{' '}
                {countStates ? <span className="text-white/45">(including state specializations)</span> : <span className="text-white/45">(base × variants × tones × versions)</span>}
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/70">
              <input
                type="checkbox"
                checked={countStates}
                onChange={(e) => setCountStates(e.target.checked)}
                className="accent-emerald-500"
              />
              Count states in total
            </label>
          </div>
          <div className="mt-3 text-white/45 text-xs">
            Next step: expand base templates beyond the starter pack so the generator yields a true enterprise library across categories.
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft size={16} /> Admin Dashboard
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/portal/documents')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70"
              title="Open partner Documents Vault"
            >
              <Upload size={14} />
              Documents Vault
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-white/70">
                <Search size={16} className="text-white/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search templates…"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
              >
                {categoryOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                showing {filtered.length} / {TEMPLATE_BASES.length}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Templates</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLibraryView('outputs')}
                    className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${
                      libraryView === 'outputs'
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                        : 'border-white/10 bg-black/30 text-white/50 hover:text-white/70'
                    }`}
                    title="Browse generated outputs (base × variant × tone × version)"
                  >
                    Outputs
                  </button>
                  <button
                    type="button"
                    onClick={() => setLibraryView('bases')}
                    className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${
                      libraryView === 'bases'
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                        : 'border-white/10 bg-black/30 text-white/50 hover:text-white/70'
                    }`}
                    title="Browse base templates (source templates)"
                  >
                    Bases
                  </button>
                </div>
              </div>

              {libraryView === 'outputs' && (
                <div className="px-5 py-3 border-b border-white/10 bg-black/20">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-white/60 text-sm">
                      Showing <span className="text-white/80 font-semibold">{outputRows.length}</span> generated outputs (capped).
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30">
                        <Search size={14} className="text-white/35" />
                        <input
                          value={outputQuery}
                          onChange={(e) => setOutputQuery(e.target.value)}
                          placeholder="Search outputs…"
                          className="bg-transparent outline-none text-sm text-white/80 placeholder:text-white/30 w-44"
                        />
                      </div>
                      <select
                        value={outputGroupBy}
                        onChange={(e) => setOutputGroupBy(e.target.value as any)}
                        className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-amber-500"
                        title="Group outputs to reduce scrolling"
                      >
                        <option value="category">Group: Category</option>
                        <option value="base">Group: Base</option>
                      </select>
                      <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Cap</span>
                      <input
                        type="number"
                        min={50}
                        max={2000}
                        value={outputLimit}
                        onChange={(e) => setOutputLimit(parseInt(e.target.value || '500', 10))}
                        className="w-24 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                        title="Limit output list size for performance"
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-white/40 text-xs">
                    Tip: search + category filters apply to bases, which then expands into outputs.
                  </div>
                </div>
              )}

              <div className="divide-y divide-white/10">
                {libraryView === 'outputs'
                  ? outputGroups.map((g, gi) => {
                      const open = openOutputGroups[g.id] ?? gi === 0;
                      return (
                        <div key={g.id}>
                          <button
                            type="button"
                            onClick={() => setOpenOutputGroups((prev) => ({ ...prev, [g.id]: !(prev[g.id] ?? gi === 0) }))}
                            className="w-full px-5 py-3 flex items-center justify-between gap-3 bg-black/20 hover:bg-black/25 transition-colors"
                            title="Expand/collapse"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {open ? <ChevronDown size={16} className="text-white/35" /> : <ChevronRight size={16} className="text-white/35" />}
                              <div className="text-white/80 font-semibold truncate">{g.label}</div>
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                              {g.rows.length}
                            </div>
                          </button>
                          {open ? (
                            <div className="divide-y divide-white/10">
                              {g.rows.map((r) => {
                                const active =
                                  r.baseId === selectedBaseId && r.variantId === variantId && r.tone === tone && r.version === version;
                                const groupKey = outputGroupBy === 'base' ? r.baseId : r.category;
                                return (
                                  <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedBaseId(r.baseId);
                                      setVariantId(r.variantId);
                                      setTone(r.tone);
                                      setVersion(r.version);
                                      setOpenOutputGroups((prev) => ({ ...prev, [groupKey]: true }));
                                    }}
                                    className={`w-full text-left px-5 py-3 transition-all ${
                                      active ? 'bg-amber-500/10' : 'hover:bg-white/[0.03]'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="text-white font-semibold truncate">{r.title}</div>
                                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                          {categoryLabel(r.category)} • {r.variantLabel} • {r.tone} • v{r.version}
                                        </div>
                                      </div>
                                      <div className="text-[10px] uppercase tracking-widest text-white/35">output</div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  : filtered.map((t) => {
                      const active = t.id === selectedBaseId;
                      const fav = favorites.has(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedBaseId(t.id);
                            setVersion(1);
                          }}
                          className={`w-full text-left px-5 py-4 transition-all ${
                            active ? 'bg-amber-500/10' : 'hover:bg-white/[0.03]'
                          }`}
                          title={t.description}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-white font-semibold truncate">{t.title}</div>
                              <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                                {categoryLabel(t.category)} • {t.versions} version{t.versions === 1 ? '' : 's'}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavoriteTemplate(t.id);
                                setFavVersion((v) => v + 1);
                              }}
                              className={`p-2 rounded-xl border transition-all ${
                                fav ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-white/10 bg-white/[0.02] text-white/40'
                              }`}
                              title={fav ? 'Unfavorite' : 'Favorite'}
                            >
                              <Heart size={14} className={fav ? 'fill-current' : ''} />
                            </button>
                          </div>
                          <div className="mt-2 text-white/60 text-sm line-clamp-2">{t.description}</div>
                          {t.tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {t.tags.slice(0, 4).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] px-2 py-1 rounded-full border border-white/10 bg-black/30 text-white/50 uppercase tracking-widest"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 text-amber-400">
                    <FileText size={18} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Generate</span>
                  </div>
                  <div className="mt-2 text-white font-semibold">{base?.title ?? 'Select a template'}</div>
                  <div className="mt-1 text-white/50 text-sm">{base?.description ?? ''}</div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/partners')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70"
                >
                  Partner management <ArrowRight size={14} />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Partner</label>
                  <select
                    value={partnerId}
                    onChange={(e) => setPartnerId(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                  >
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.profile.fullName} ({p.id.slice(0, 6)})
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                    updated: {partner ? fmtWhen(partner.updatedAt) : '—'}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Jurisdiction state</label>
                  <input
                    value={stateOverride}
                    onChange={(e) => setStateOverride(e.target.value.toUpperCase())}
                    placeholder={partnerStateGuess(partner) || 'e.g. CA'}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                    maxLength={2}
                  />
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                    uses partner intake state when blank
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Variant</label>
                  <select
                    value={variantId}
                    onChange={(e) => setVariantId(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                  >
                    {TEMPLATE_VARIANTS.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                  >
                    {TEMPLATE_TONES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Copy version</label>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, base?.versions ?? 1)}
                    value={version}
                    onChange={(e) => setVersion(Math.max(1, Math.min(99, parseInt(e.target.value || '1', 10))))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                  />
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                    max: {base?.versions ?? 1}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Bureau (optional)</label>
                  <select
                    value={bureau}
                    onChange={(e) => setBureau(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                  >
                    <option value="EXP">Experian (EXP)</option>
                    <option value="EQF">Equifax (EQF)</option>
                    <option value="TUC">TransUnion (Trans)</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">
                    Creditor / furnisher (optional)
                  </label>
                  <input
                    value={creditorName}
                    onChange={(e) => setCreditorName(e.target.value)}
                    placeholder="e.g. ABC Collections"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">
                    Account reference (optional)
                  </label>
                  <input
                    value={accountRef}
                    onChange={(e) => setAccountRef(e.target.value)}
                    placeholder="last4 / case # / ref"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void downloadPdf()}
                  disabled={!rendered}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Download size={14} /> Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => downloadWordHtml()}
                  disabled={!rendered}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  title="Word-compatible HTML (.doc)"
                >
                  <Download size={14} /> Download Word
                </button>
                <button
                  type="button"
                  onClick={() => void saveToVault()}
                  disabled={!rendered || !partner}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/15 text-[10px] font-black uppercase tracking-widest text-emerald-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  title="Save generated PDF into partner Documents Vault"
                >
                  <Star size={14} /> Save to vault
                </button>
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                  title="Preview"
                >
                  <Eye size={14} /> Preview
                </button>
                <button
                  type="button"
                  onClick={openInlineEditor}
                  disabled={!rendered}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  title="Edit this output before exporting"
                >
                  <Pencil size={14} /> Edit & export
                </button>
                <div className="ml-auto text-[10px] uppercase tracking-widest text-white/40 font-mono">
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

            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between gap-3">
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Preview</div>
                {rendered && (
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                    {rendered.variantId} • v{rendered.version} • {rendered.tone}
                  </div>
                )}
              </div>
              {!rendered ? (
                <div className="p-6 text-white/60 text-sm">Select a template and partner to preview.</div>
              ) : (
                <div className="p-4 bg-white">
                  <iframe
                    title="Template preview"
                    srcDoc={previewSrcDoc}
                    className="w-full h-[720px] rounded-xl border border-black/10 bg-white"
                  />
                </div>
              )}
            </div>
            <div className="text-white/40 text-xs">
              Note: PDF export currently prints the text version (OCR-friendly). Word export uses HTML (.doc) for compatibility.
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

