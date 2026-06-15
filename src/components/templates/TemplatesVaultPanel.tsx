import React, { useMemo, useState } from 'react';
import { ExternalLink, FileUp, Link2, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { TemplateCategory } from '../../domain/templates';
import type { TemplateVaultItem } from '../../domain/templateVault';
import {
  createTemplateVaultItem,
  defaultRequiredEntitlementsForCategory,
  deleteTemplateVaultItem,
  listTemplateVaultItems,
  listVisibleTemplateVaultItemsForPartner,
  upsertTemplateVaultItem,
} from '../../data/templateVaultRepo';
import { ENTITLEMENT_KEYS, type EntitlementKey } from '../../billing/entitlements';
import { getBlobStore } from '../../storage/getBlobStore';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { downloadText, openUrlInNewTab, triggerBrowserDownload } from '../../utils/download';
import { extractPdfTextWithMeta } from '../../creditReports/parsePdfText';
import { callAiGateway } from '../../lib/aiClient';
import { injectPrintSafeCss } from '../letters/paperPreviewSrcDoc';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';

const blobStore = getBlobStore();

function categoryLabel(c: TemplateCategory) {
  return String(c).replaceAll('_', ' ');
}

function safeEntitlementLabel(k: string) {
  if (k === ENTITLEMENT_KEYS.templates) return 'Templates';
  if (k === ENTITLEMENT_KEYS.disputes) return 'Disputes';
  if (k === ENTITLEMENT_KEYS.debt) return 'Debt / Summons';
  if (k === ENTITLEMENT_KEYS.identityTheft) return 'Identity theft';
  return k;
}

function asHttpUrl(raw: string): string | null {
  const s = (raw || '').trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

function escapeHtml(s: string) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

type EditorMode = 'create' | 'edit';
type KindMode = 'text' | 'file' | 'link';

function pickEntitlementsForEditor(args: { category: TemplateCategory; selected: EntitlementKey[] | null }) {
  const base = defaultRequiredEntitlementsForCategory(args.category);
  const uniq = Array.from(new Set([...(args.selected || []), ...base]));
  // Always keep templates entitlement in required list.
  if (!uniq.includes(ENTITLEMENT_KEYS.templates)) uniq.unshift(ENTITLEMENT_KEYS.templates);
  return uniq;
}

export function TemplatesVaultPanel({
  tenantId,
  partnerId,
  variant,
  allowCreate = false,
  allowEdit = false,
  defaultCategory = 'all',
  allowedCategories,
  onUseText,
  onAttachFile,
}: {
  tenantId: string;
  /** If provided, partner-scoped visibility will be enforced in partner variant. */
  partnerId?: string;
  variant: 'admin' | 'partner';
  allowCreate?: boolean;
  allowEdit?: boolean;
  /** Preselect a category filter in the panel. */
  defaultCategory?: TemplateCategory | 'all';
  /** If provided, restrict templates to these categories only. */
  allowedCategories?: TemplateCategory[];
  onUseText?: (text: string, template: TemplateVaultItem) => void;
  onAttachFile?: (template: TemplateVaultItem) => void;
}) {
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<TemplateCategory | 'all'>(defaultCategory);

  const items = useMemo(() => {
    if (!tenantId) return [];
    if (variant === 'partner' && partnerId) {
      return listVisibleTemplateVaultItemsForPartner({ tenantId, partnerId });
    }
    return listTemplateVaultItems({ tenantId });
  }, [tenantId, partnerId, variant, version]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((t) => {
      if (allowedCategories && allowedCategories.length && !allowedCategories.includes(t.category)) return false;
      if (cat !== 'all' && t.category !== cat) return false;
      if (!q) return true;
      const hay = [t.title, t.category, (t.tags || []).join(' '), t.kind, t.filename || '', t.url || ''].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, cat, allowedCategories]);

  const categories = useMemo(() => {
    const set = new Set<TemplateCategory>();
    for (const it of items) {
      if (allowedCategories && allowedCategories.length && !allowedCategories.includes(it.category)) continue;
      set.add(it.category);
    }
    return Array.from(set).sort();
  }, [items, allowedCategories]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [kindMode, setKindMode] = useState<KindMode>('text');
  const [active, setActive] = useState<TemplateVaultItem | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('credit_dispute' as any);
  const [tags, setTags] = useState('');
  const [requiredEntitlements, setRequiredEntitlements] = useState<EntitlementKey[] | null>(null);
  const [bodyText, setBodyText] = useState('');
  const [url, setUrl] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const openCreate = (k: KindMode) => {
    setEditorMode('create');
    setKindMode(k);
    setActive(null);
    setTitle('');
    setCategory((allowedCategories?.[0] as any) || ('credit_dispute' as any));
    setTags('');
    setRequiredEntitlements(null);
    setBodyText('');
    setUrl('');
    setFile(null);
    setErr(null);
    setEditorOpen(true);
  };

  const openEdit = (t: TemplateVaultItem) => {
    setEditorMode('edit');
    setKindMode(t.kind as KindMode);
    setActive(t);
    setTitle(t.title || '');
    setCategory(t.category);
    setTags((t.tags || []).join(', '));
    setRequiredEntitlements((t.requiredEntitlements || []) as EntitlementKey[]);
    setBodyText(t.bodyText || '');
    setUrl(t.url || '');
    setFile(null);
    setErr(null);
    setEditorOpen(true);
  };

  const entitlementOptions: EntitlementKey[] = [
    ENTITLEMENT_KEYS.templates,
    ENTITLEMENT_KEYS.disputes,
    ENTITLEMENT_KEYS.debt,
    ENTITLEMENT_KEYS.identityTheft,
  ];

  const effectiveEntitlements = useMemo(
    () => pickEntitlementsForEditor({ category, selected: requiredEntitlements }),
    [category, requiredEntitlements],
  );

  const onSave = async () => {
    setErr(null);
    setBusy(true);
    try {
      const titleClean = title.trim();
      if (!titleClean) throw new Error('Title is required.');

      const tagsArr = tags
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 40);

      if (kindMode === 'text') {
        const textClean = bodyText.trim();
        if (!textClean) throw new Error('Template text is empty.');
        const next: Omit<TemplateVaultItem, 'id' | 'createdAt' | 'updatedAt'> = {
          tenantId,
          title: titleClean,
          category,
          tags: tagsArr.length ? tagsArr : undefined,
          kind: 'text',
          bodyText: textClean,
          requiredEntitlements: effectiveEntitlements,
          createdBy: active?.createdBy,
        };
        if (editorMode === 'edit' && active) {
          upsertTemplateVaultItem({ ...active, ...next, id: active.id });
        } else {
          createTemplateVaultItem(next as any);
        }
        setEditorOpen(false);
        setVersion((v) => v + 1);
        return;
      }

      if (kindMode === 'link') {
        const u = asHttpUrl(url);
        if (!u) throw new Error('Enter a valid http(s) URL.');
        const next: Omit<TemplateVaultItem, 'id' | 'createdAt' | 'updatedAt'> = {
          tenantId,
          title: titleClean,
          category,
          tags: tagsArr.length ? tagsArr : undefined,
          kind: 'link',
          url: u,
          requiredEntitlements: effectiveEntitlements,
          createdBy: active?.createdBy,
        };
        if (editorMode === 'edit' && active) {
          upsertTemplateVaultItem({ ...active, ...next, id: active.id });
        } else {
          createTemplateVaultItem(next as any);
        }
        setEditorOpen(false);
        setVersion((v) => v + 1);
        return;
      }

      // file
      const f = file;
      if (!f && !(editorMode === 'edit' && active?.blobRef)) throw new Error('Choose a file.');

      // Hybrid: import PDF text into editor now; doc/docx store file only.
      const isPdf = (f?.type || active?.mimeType || '').toLowerCase().includes('pdf');
      let importedText: string | null = null;
      if (f && isPdf) {
        const res = await extractPdfTextWithMeta(f);
        importedText = (res.text || '').trim() || null;
      }

      let blobRef = active?.blobRef;
      let filename = active?.filename;
      let mimeType = active?.mimeType;
      let sizeBytes = active?.sizeBytes;
      if (f) {
        const put = await blobStore.put(f, { tenantId, kind: 'template_upload' });
        blobRef = put.ref;
        filename = f.name;
        mimeType = f.type || 'application/octet-stream';
        sizeBytes = f.size;
      }

      const next: Omit<TemplateVaultItem, 'id' | 'createdAt' | 'updatedAt'> = {
        tenantId,
        title: titleClean,
        category,
        tags: tagsArr.length ? tagsArr : undefined,
        kind: importedText ? 'text' : 'file',
        bodyText: importedText ?? undefined,
        blobRef,
        filename,
        mimeType,
        sizeBytes,
        requiredEntitlements: effectiveEntitlements,
        createdBy: active?.createdBy,
      };

      if (editorMode === 'edit' && active) {
        upsertTemplateVaultItem({ ...active, ...next, id: active.id });
      } else {
        createTemplateVaultItem(next as any);
      }
      setEditorOpen(false);
      setVersion((v) => v + 1);
    } catch (e: any) {
      setErr(e?.message || 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const runAiDraft = async () => {
    setAiErr(null);
    setAiBusy(true);
    try {
      const prompt = aiPrompt.trim();
      if (!prompt) throw new Error('Describe the template you want.');
      const system = `You write compliant, plain-text letter templates for a credit/funding platform.\n\nReturn ONLY the letter body text (no JSON). Use placeholders like [CREDITOR_NAME], [ACCOUNT_REF], [BUREAU], [STATE], [DATE], [FULL_NAME], [ADDRESS]. Keep it print-ready.`;
      const user = `CATEGORY: ${category}\nTITLE: ${title || '(untitled)'}\n\nREQUEST:\n${prompt}`;
      const ai = await callAiGateway({
        taskType: 'template_draft',
        responseFormat: 'text',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });
      const text = (ai.text || '').trim();
      if (!text) throw new Error('AI returned empty output.');
      setBodyText(text);
      setKindMode('text');
      setAiOpen(false);
      setEditorOpen(true);
    } catch (e: any) {
      setAiErr(e?.message || 'AI draft failed.');
    } finally {
      setAiBusy(false);
    }
  };

  const [previewItem, setPreviewItem] = useState<TemplateVaultItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewRevoke, setPreviewRevoke] = useState<null | (() => void)>(null);
  const [previewErr, setPreviewErr] = useState<string | null>(null);
  const [previewSrcDoc, setPreviewSrcDoc] = useState<string>('');
  const [previewText, setPreviewText] = useState<string>('');

  const closePreview = () => {
    try {
      previewRevoke?.();
    } catch {
      // ignore
    }
    setPreviewRevoke(null);
    setPreviewUrl('');
    setPreviewSrcDoc('');
    setPreviewText('');
    setPreviewItem(null);
    setPreviewErr(null);
  };

  const openPreview = async (t: TemplateVaultItem) => {
    setPreviewErr(null);
    setPreviewUrl('');
    setPreviewSrcDoc('');
    setPreviewText('');
    try {
      setPreviewItem(t);

      if (t.kind === 'text') {
        const body = (t.bodyText || '').trim();
        // Always render print-safe in an iframe so “View” matches PDF/print output styling.
        const safe = escapeHtml(body || '(Empty template body)');
        const html = `
          <div class="fc-paper-prose" style="white-space:pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">
            ${safe}
          </div>
        `.trim();
        setPreviewSrcDoc(injectPrintSafeCss({ html }));
        return;
      }

      if (t.kind === 'link') {
        const u = asHttpUrl(t.url || '');
        if (!u) throw new Error('Invalid link URL.');
        setPreviewUrl(u);
        return;
      }

      if (!t.blobRef) {
        throw new Error('No file available.');
      }

      const mime = String(t.mimeType || '').toLowerCase();
      const isHtml = mime.includes('text/html') || /\.(html?|xhtml)$/i.test(String(t.filename || ''));
      const isText = mime.startsWith('text/') || mime.includes('application/json');

      if (isHtml || isText) {
        const blob = await blobStore.get(t.blobRef);
        if (!blob) throw new Error('Preview file not found in storage.');
        const text = await blob.text();
        if (isHtml) setPreviewSrcDoc(injectPrintSafeCss({ html: text }));
        else setPreviewText(text || '(Empty file)');
        return;
      }

      // For “View”, prefer an object URL so iframe previews are reliable (signed URLs can be frame-blocked).
      const res = await getBlobUrl(t.blobRef, { mimeType: t.mimeType, preferSigned: false });
      if (!res?.url) throw new Error('Preview URL unavailable.');
      // Store the revoke fn directly (not wrapped), so closePreview actually revokes object URLs.
      setPreviewRevoke(res.revoke ?? null);
      setPreviewUrl(res.url);
    } catch (e: any) {
      setPreviewErr(e?.message || 'Failed to preview file.');
    }
  };

  const downloadFile = async (t: TemplateVaultItem) => {
    if (t.kind === 'text') {
      downloadText({ text: t.bodyText || '', filename: `${t.title || 'template'}.txt`, mimeType: 'text/plain;charset=utf-8' });
      return;
    }
    if (t.kind === 'link') {
      const u = asHttpUrl(t.url || '');
      if (u) openUrlInNewTab({ url: u });
      return;
    }
    if (!t.blobRef) return;
    const res = await getBlobUrl(t.blobRef, { mimeType: t.mimeType, preferSigned: true });
    if (!res?.url) return;
    triggerBrowserDownload({ url: res.url, filename: t.filename || `${t.title}`, revoke: res.revoke, revokeAfterMs: 60_000, targetBlank: true });
  };

  return (
    <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Templates vault</div>
          <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>Saved templates (text, uploads, or links) with entitlement-based access.</div>
        </div>
        {allowCreate ? (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => openCreate('text')} className={FINELY_OS_PRIMARY_BTN}>
              <Plus size={14} /> New template
            </button>
            <button
              type="button"
              onClick={() => {
                setAiPrompt('');
                setAiErr(null);
                setAiOpen(true);
              }}
              className={FINELY_OS_SECONDARY_BTN}
              title="Have AI draft a template body"
            >
              <Sparkles size={14} /> AI draft
            </button>
            <button type="button" onClick={() => openCreate('file')} className={FINELY_OS_SECONDARY_BTN}>
              <FileUp size={14} /> Upload
            </button>
            <button type="button" onClick={() => openCreate('link')} className={FINELY_OS_SECONDARY_BTN}>
              <Link2 size={14} /> Link
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search saved templates…"
          className={`${FINELY_OS_ENTITY_SELECT} w-full sm:w-80`}
        />
        {categories.length > 1 ? (
          <select value={cat} onChange={(e) => setCat(e.target.value as any)} className={FINELY_OS_ENTITY_SELECT}>
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        ) : null}
        <div className={FINELY_OS_ENTITY_SUBLABEL}>saved: {filtered.length}</div>
      </div>

      {filtered.length === 0 ? (
        <div className={FINELY_OS_ENTITY_EMPTY}>No saved templates yet.</div>
      ) : (
        <div className="space-y-3">
          {filtered.slice(0, 80).map((t) => (
            <div key={t.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{t.title}</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                    {categoryLabel(t.category)} • {t.kind}
                    {t.filename ? ` • ${t.filename}` : ''}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {(t.requiredEntitlements || []).map((k) => (
                      <span
                        key={k}
                        className={FINELY_OS_ENTITY_CHIP}
                      >
                        {safeEntitlementLabel(k)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {t.kind === 'text' && t.bodyText && onUseText ? (
                    <button
                      type="button"
                      onClick={() => onUseText(t.bodyText || '', t)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                    >
                      Use text
                    </button>
                  ) : null}
                  {t.kind === 'file' && onAttachFile ? (
                    <button
                      type="button"
                      onClick={() => onAttachFile(t)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                    >
                      Attach file
                    </button>
                  ) : null}
                  {t.kind === 'file' && t.blobRef ? (
                    <button
                      type="button"
                      onClick={() => void downloadFile(t)}
                      className={FINELY_OS_SECONDARY_BTN}
                      title="Download"
                    >
                      Download
                    </button>
                  ) : null}
                  {t.kind === 'file' && (t.mimeType || '').toLowerCase().includes('pdf') ? (
                    <button
                      type="button"
                      onClick={() => void openPreview(t)}
                      className={FINELY_OS_SECONDARY_BTN}
                      title="Preview PDF"
                    >
                      Preview
                    </button>
                  ) : null}
                  {t.kind === 'link' && t.url ? (
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noreferrer"
                      className={FINELY_OS_SECONDARY_BTN}
                    >
                      Open <ExternalLink size={14} />
                    </a>
                  ) : null}

                  {allowEdit ? (
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      className={FINELY_OS_SECONDARY_BTN}
                      title="Edit"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                  ) : null}
                  {allowEdit ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!window.confirm(`Delete template “${t.title}”?`)) return;
                        deleteTemplateVaultItem({ tenantId, id: t.id });
                        setVersion((v) => v + 1);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/15 text-[10px] font-black uppercase tracking-widest text-red-100/90 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          {filtered.length > 80 ? <div className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>Showing first 80 templates.</div> : null}
        </div>
      )}

      {/* AI draft modal */}
      {aiOpen ? (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setAiOpen(false)} />
          <div
            className={`relative w-full max-w-3xl ${finelyOsCatalogCard('violet')} !p-0 overflow-hidden shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/[0.08]">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>AI draft template</div>
              <div className={`mt-2 text-2xl font-light ${FINELY_OS_ENTITY_VALUE}`}>Describe what you need</div>
              <div className={FINELY_OS_ENTITY_BODY}>AI drafts a print-ready template body using placeholders.</div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={FINELY_OS_ENTITY_LABEL}>Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={FINELY_OS_ENTITY_INPUT}
                    placeholder="Example: Initial collection dispute letter"
                  />
                </div>
                <div>
                  <label className={FINELY_OS_ENTITY_LABEL}>Category</label>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className={FINELY_OS_ENTITY_INPUT}
                    placeholder="credit_dispute"
                  />
                </div>
              </div>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={8}
                className={`${FINELY_OS_ENTITY_INPUT} font-sans`}
                placeholder="Describe the scenario, what you’re disputing, and the tone you want."
              />
              {aiErr ? <div className={FINELY_OS_NOTICE_ERROR}>{aiErr}</div> : null}
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => setAiOpen(false)} className={FINELY_OS_SECONDARY_BTN}>
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={aiBusy}
                  onClick={() => void runAiDraft()}
                  className={`inline-flex items-center gap-2 ${FINELY_OS_PRIMARY_BTN}`}
                >
                  <Sparkles size={14} /> {aiBusy ? 'Drafting…' : 'Draft'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Create/edit modal */}
      {editorOpen ? (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditorOpen(false)} />
          <div
            className={`relative w-full max-w-4xl ${finelyOsCatalogCard('violet')} !p-0 overflow-hidden shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/[0.08] flex items-start justify-between gap-4">
              <div>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Template</div>
                <div className={`mt-2 text-2xl font-light ${FINELY_OS_ENTITY_VALUE}`}>
                  {editorMode === 'edit' ? 'Edit template' : 'Create template'}
                </div>
                <div className={FINELY_OS_ENTITY_BODY}>Saved templates are gated by entitlement keys.</div>
              </div>
              <button type="button" onClick={() => setEditorOpen(false)} className={FINELY_OS_SECONDARY_BTN}>
                Close
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={FINELY_OS_ENTITY_LABEL}>Title</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="Template title" />
                </div>
                <div>
                  <label className={FINELY_OS_ENTITY_LABEL}>Category</label>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className={FINELY_OS_ENTITY_INPUT}
                    placeholder="credit_dispute"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={FINELY_OS_ENTITY_LABEL}>Tags (comma separated)</label>
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className={FINELY_OS_ENTITY_INPUT}
                    placeholder="initial, bureau, reinvestigation"
                  />
                </div>
                <div>
                  <label className={FINELY_OS_ENTITY_LABEL}>Kind</label>
                  <select value={kindMode} onChange={(e) => setKindMode(e.target.value as any)} className={FINELY_OS_ENTITY_SELECT}>
                    <option value="text">Text</option>
                    <option value="file">File</option>
                    <option value="link">Link</option>
                  </select>
                </div>
              </div>

              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Required access</div>
                <div className="mt-3 grid sm:grid-cols-2 gap-2">
                  {entitlementOptions.map((k) => {
                    const checked = effectiveEntitlements.includes(k);
                    const locked = k === ENTITLEMENT_KEYS.templates;
                    return (
                      <label key={k} className={`flex items-center gap-2 ${FINELY_OS_ENTITY_BODY}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={locked}
                          onChange={(e) => {
                            const on = e.target.checked;
                            setRequiredEntitlements((prev) => {
                              const cur = new Set((prev || effectiveEntitlements) as EntitlementKey[]);
                              if (on) cur.add(k);
                              else cur.delete(k);
                              cur.add(ENTITLEMENT_KEYS.templates);
                              return Array.from(cur);
                            });
                          }}
                          className="accent-amber-500"
                        />
                        <span className={FINELY_OS_ENTITY_SUBLABEL}>{safeEntitlementLabel(k)}</span>
                      </label>
                    );
                  })}
                </div>
                <div className={`mt-2 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
                  Partners must have <span className={FINELY_OS_ENTITY_VALUE}>all</span> required keys to see/use this template.
                </div>
              </div>

              {kindMode === 'text' ? (
                <div>
                  <label className={FINELY_OS_ENTITY_LABEL}>Template body</label>
                  <textarea
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    rows={14}
                    className={`${FINELY_OS_ENTITY_INPUT} font-mono`}
                    placeholder="Write the template body here…"
                  />
                </div>
              ) : null}

              {kindMode === 'link' ? (
                <div>
                  <label className={FINELY_OS_ENTITY_LABEL}>URL</label>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className={FINELY_OS_ENTITY_INPUT}
                    placeholder="https://…"
                  />
                </div>
              ) : null}

              {kindMode === 'file' ? (
                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Upload</div>
                  <input
                    type="file"
                    accept=".pdf,.txt,.doc,.docx,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className={`block w-full text-sm ${FINELY_OS_ENTITY_BODY} file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-amber-500 file:text-black file:font-black file:uppercase file:tracking-widest file:text-[10px]`}
                  />
                  <div className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
                    PDF imports text automatically (editable). DOC/DOCX are stored as files (download/attach).
                  </div>
                </div>
              ) : null}

              {err ? <div className={FINELY_OS_NOTICE_ERROR}>{err}</div> : null}

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditorOpen(false)} className={FINELY_OS_SECONDARY_BTN}>
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onSave()}
                  className={`inline-flex items-center gap-2 ${FINELY_OS_PRIMARY_BTN}`}
                >
                  <Pencil size={14} /> {busy ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* File preview modal */}
      {previewItem ? (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closePreview} />
          <div
            className={`relative w-full max-w-6xl ${finelyOsCatalogCard('violet')} !p-0 overflow-hidden shadow-2xl`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/[0.08] flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Preview</div>
                <div className={`mt-2 truncate ${FINELY_OS_ENTITY_TITLE}`}>{previewItem.title}</div>
                <div className={`mt-1 truncate ${FINELY_OS_ENTITY_BODY}`}>{previewItem.filename}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void downloadFile(previewItem)}
                  className={`inline-flex items-center gap-2 ${FINELY_OS_SECONDARY_BTN}`}
                >
                  Download
                </button>
                <button type="button" onClick={closePreview} className={FINELY_OS_SECONDARY_BTN}>
                  Close
                </button>
              </div>
            </div>
            <div className="p-4 bg-fc-input">
              {previewErr ? <div className={FINELY_OS_NOTICE_ERROR}>{previewErr}</div> : null}
              {previewItem.kind === 'link' ? (
                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                  <div className={FINELY_OS_ENTITY_VALUE}>External link template</div>
                  <div className={`break-words ${FINELY_OS_ENTITY_BODY}`}>{previewItem.url}</div>
                  <button
                    type="button"
                    onClick={() => {
                      const u = asHttpUrl(previewItem.url || '');
                      if (u) openUrlInNewTab({ url: u });
                    }}
                    className={`inline-flex items-center gap-2 ${FINELY_OS_PRIMARY_BTN}`}
                  >
                    <ExternalLink size={14} /> Open link
                  </button>
                </div>
              ) : previewSrcDoc ? (
                <iframe title="Template preview" srcDoc={previewSrcDoc} className="w-full h-[75vh] rounded-2xl bg-white" />
              ) : previewText ? (
                <pre className="w-full h-[75vh] overflow-auto rounded-2xl bg-fc-chrome/80 border border-white/[0.08] text-white/85 p-5 text-sm whitespace-pre-wrap">
                  {previewText}
                </pre>
              ) : previewUrl ? (
                <iframe title="Template preview" src={previewUrl} className="w-full h-[75vh] rounded-2xl bg-white" />
              ) : (
                <div className={FINELY_OS_ENTITY_BODY}>Loading preview…</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

