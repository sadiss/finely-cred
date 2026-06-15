import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Copy, FileText, Gavel, Layers, PenLine, ScrollText, Search, Sparkles, Star, Upload } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Partner } from '../../domain/partners';
import type { TemplateCategory, TemplateTone } from '../../domain/templates';
import type { TemplateVaultItem } from '../../domain/templateVault';
import { TEMPLATE_BASES } from '../../templates';
import { TEMPLATE_TONES, TEMPLATE_VARIANTS } from '../../templates/variants';
import { renderTemplate } from '../../templates/render';
import { TemplateIntelligencePanel } from './TemplateIntelligencePanel';
import { TemplatesVaultPanel } from './TemplatesVaultPanel';
import { ReasonsCommandHub } from '../../features/reasons/ReasonsCommandHub';
import { listSavedReasonsByPartner } from '../../data/partnerReasonPacksRepo';
import { listVisibleTemplateVaultItemsForPartner } from '../../data/templateVaultRepo';
import { getDisputeReasonsLibraryAsText, getFactualDisputeReasonsLibrary } from '../../creditReports/disputeReasons';
import { downloadText } from '../../utils/download';
import { injectPrintSafeCss } from '../letters/paperPreviewSrcDoc';
import { getCanonicalPartnerIdentity } from '../../utils/canonicalPartnerIdentity';
import { FINELY_TENANT_ID } from '../../domain/partners';
import { RichTextEditor } from '../ui/RichTextEditor';
import { plainTextToHtml, sanitizeHtmlForPreview } from '../../utils/richText';
import { FinelyOsCatalogBrowser, type FinelyOsCatalogItem } from '../../features/os/FinelyOsCatalogBrowser';
import {
  FINELY_OS_CATALOG_SHELL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsEntityKpi,
  finelyOsInlineListItem,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

const ACTIVE_TEMPLATE_KEY = 'fc.templateLibrary.activeVaultId';

type HubSection = 'overview' | 'vault' | 'reasons' | 'bases';

const SECTIONS: { id: HubSection; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'vault', label: 'My templates', icon: Upload },
  { id: 'reasons', label: 'Reasons library', icon: BookOpen },
  { id: 'bases', label: 'Starter bases', icon: Layers },
];

function categoryLabel(c: TemplateCategory) {
  return String(c).replaceAll('_', ' ');
}

export function setActiveTemplateForLetterStudio(templateId: string) {
  try {
    sessionStorage.setItem(ACTIVE_TEMPLATE_KEY, templateId);
  } catch {
    // ignore
  }
}

export function readActiveTemplateIdFromSession(): string | null {
  try {
    return sessionStorage.getItem(ACTIVE_TEMPLATE_KEY);
  } catch {
    return null;
  }
}

export function TemplateLibraryHub({ partner, unifiedShell }: { partner: Partner; unifiedShell?: boolean }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const section = (params.get('section') as HubSection) || 'overview';
  const setSection = (s: HubSection) => setParams({ section: s });

  const [vaultVersion, setVaultVersion] = useState(0);
  const [selectedBaseId, setSelectedBaseId] = useState(TEMPLATE_BASES[0]?.id ?? '');
  const [tone, setTone] = useState<TemplateTone>('formal');
  const [previewHtml, setPreviewHtml] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [activeVault, setActiveVault] = useState<TemplateVaultItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [baseCategory, setBaseCategory] = useState<TemplateCategory | 'all'>('all');
  const [basesRailCollapsed, setBasesRailCollapsed] = useState(false);
  const [editableBodyHtml, setEditableBodyHtml] = useState('');

  const tenantId = partner.tenantId || FINELY_TENANT_ID;
  const vaultItems = useMemo(
    () => listVisibleTemplateVaultItemsForPartner({ tenantId, partnerId: partner.id }),
    [tenantId, partner.id, vaultVersion],
  );
  const savedReasons = useMemo(() => listSavedReasonsByPartner(partner.id), [partner.id, vaultVersion]);
  const builtInReasonCount = useMemo(
    () => Object.values(getFactualDisputeReasonsLibrary()).reduce((a, b) => a + b.reasons.length, 0),
    [],
  );

  const identity = useMemo(() => getCanonicalPartnerIdentity({ partner, tenantId }), [partner, tenantId]);
  const base = useMemo(() => TEMPLATE_BASES.find((b) => b.id === selectedBaseId) ?? null, [selectedBaseId]);
  const variant = TEMPLATE_VARIANTS.find((v) => v.id === 'ocr_friendly') ?? TEMPLATE_VARIANTS[0]!;

  useEffect(() => {
    const onStore = () => setVaultVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    const id = readActiveTemplateIdFromSession();
    if (!id) return;
    const item = vaultItems.find((v) => v.id === id);
    if (item) setActiveVault(item);
  }, [vaultItems]);

  const baseCategories = useMemo(() => {
    const set = new Set<TemplateCategory>();
    for (const b of TEMPLATE_BASES) set.add(b.category);
    return ['all', ...Array.from(set)] as const;
  }, []);

  const filteredBases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return TEMPLATE_BASES.filter((b) => {
      if (baseCategory !== 'all' && b.category !== baseCategory) return false;
      if (!q) return true;
      return [b.title, b.description, b.category].some((x) => String(x || '').toLowerCase().includes(q));
    });
  }, [searchQuery, baseCategory]);

  const baseCatalogItems = useMemo((): FinelyOsCatalogItem[] => {
    return filteredBases.map((b, i) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      subtitle: categoryLabel(b.category),
      groupKey: b.category,
      accentIndex: i,
    }));
  }, [filteredBases]);

  const filteredVault = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return vaultItems;
    return vaultItems.filter((v) => [v.title, v.category, ...(v.tags ?? [])].some((x) => String(x || '').toLowerCase().includes(q)));
  }, [vaultItems, searchQuery]);

  useEffect(() => {
    if (!base || !partner) {
      setPreviewHtml('');
      return;
    }
    const ctx = {
      nowIso: new Date().toISOString(),
      jurisdictionState: (identity.state || '').toUpperCase() || undefined,
      partner: {
        id: partner.id,
        fullName: identity.fullName,
        email: partner.profile.email,
        phone: identity.phone,
        address1: identity.address1 ?? identity.addressLine1,
        address2: identity.address2,
        city: identity.city,
        state: identity.state,
        postalCode: identity.postalCode,
      },
      bureau: 'EXP' as const,
    };
    const rendered = renderTemplate({ baseId: base.id, variant, ctx, version: 1, tone });
    setPreviewHtml(injectPrintSafeCss({ html: rendered.html }));
    setEditableBodyHtml(plainTextToHtml(rendered.text));
  }, [base, tone, identity, partner]);

  const openLetterStudio = (opts?: { vaultId?: string; baseId?: string }) => {
    if (opts?.vaultId) setActiveTemplateForLetterStudio(opts.vaultId);
    const q = new URLSearchParams();
    if (opts?.vaultId) q.set('template', opts.vaultId);
    if (opts?.baseId) q.set('base', opts.baseId);
    navigate(`/portal/letters${q.toString() ? `?${q}` : ''}`);
  };

  return (
    <div className="space-y-6">
      {!unifiedShell ? (
      <div className={`${finelyOsCatalogCard('violet')} !p-5`}>
        <div className="inline-flex items-center gap-2 text-amber-300/90">
          <ScrollText size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Template library — letter building hub</span>
        </div>
        <h1 className={`mt-2 text-3xl font-semibold tracking-tight ${FINELY_OS_ENTITY_VALUE}`}>Build, store, and draft every letter from here</h1>
        <p className={`mt-3 ${FINELY_OS_ENTITY_BODY} max-w-3xl`}>
          Templates, saved reasons, and starter bases live in this library. <strong className={`${FINELY_OS_ENTITY_VALUE} font-medium`}>Letter Studio</strong> is
          where you execute — pick disputes, attach evidence, generate PDFs — using what you set up here.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => openLetterStudio(activeVault ? { vaultId: activeVault.id } : undefined)}
            className={FINELY_OS_PRIMARY_BTN}
          >
            <PenLine size={14} /> Open letter studio
          </button>
          <button type="button" onClick={() => setSection('vault')} className={FINELY_OS_SECONDARY_BTN}>
            Upload template
          </button>
          <button type="button" onClick={() => setSection('reasons')} className={FINELY_OS_SECONDARY_BTN}>
            Browse reasons
          </button>
          <div className={`${FINELY_OS_VIEW_TABS} flex-wrap`}>
          {SECTIONS.filter((s) => s.id !== 'overview').map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={finelyOsViewTab(section === s.id, 'violet')}
            >
              {s.label}
            </button>
          ))}
          </div>
        </div>
        <div className="mt-5 relative max-w-xl">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates, bases, or reasons…"
            className={`${FINELY_OS_ENTITY_INPUT} !mt-0 pl-9`}
          />
        </div>
      </div>
      ) : null}

      {!unifiedShell ? (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Vault templates', value: vaultItems.length, hint: 'Your saved letter bodies' },
          { label: 'Saved reasons', value: savedReasons.length, hint: 'Custom dispute snippets' },
          { label: 'Starter bases', value: TEMPLATE_BASES.length, hint: 'Professional letter scaffolds' },
          { label: 'Built-in reasons', value: builtInReasonCount, hint: 'Full dispute library' },
        ].map((m, i) => (
          <div key={m.label} className={finelyOsEntityKpi(i)}>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>{m.label}</p>
            <p className={`text-3xl font-bold ${FINELY_OS_ENTITY_VALUE} mt-2`}>{m.value}</p>
            <p className={`text-xs ${FINELY_OS_ENTITY_BODY} mt-1`}>{m.hint}</p>
          </div>
        ))}
      </div>
      ) : null}

      <div className={unifiedShell ? '' : 'grid lg:grid-cols-12 gap-6'}>
        {!unifiedShell ? (
        <aside className="lg:col-span-3 space-y-2">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const on = section === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={`w-full text-left rounded-xl border px-4 py-3 flex items-center gap-3 transition-all ${
                  on
                    ? 'border-emerald-500/35 bg-emerald-500/10 ring-1 ring-emerald-400/20 text-emerald-100'
                    : `${finelyOsInlineListItem()} hover:border-white/20`
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-semibold">{s.label}</span>
              </button>
            );
          })}
          <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony mt-4 text-xs ${FINELY_OS_ENTITY_BODY}`}>
            Workflow: pick template + reasons here → Letter Studio to draft, preview, and save PDFs.
          </div>
        </aside>
        ) : null}

        <div className={unifiedShell ? 'min-w-0' : 'lg:col-span-9 min-w-0'}>
          {section === 'overview' && (
            <div className="space-y-4">
              <TemplateIntelligencePanel
                partner={partner}
                vaultCount={vaultItems.length}
                savedReasonCount={savedReasons.length}
                onOpenReasons={() => setSection('reasons')}
                onOpenBases={() => setSection('bases')}
                onUseBase={(baseId) => {
                  setSelectedBaseId(baseId);
                  setSection('bases');
                }}
              />
              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony grid md:grid-cols-2 gap-4`}>
                {[
                  {
                    title: 'My templates',
                    desc: 'Upload PDFs, paste letter text, or save drafts from Letter Studio.',
                    action: () => setSection('vault'),
                    cta: 'Manage vault',
                  },
                  {
                    title: 'Reasons library',
                    desc: 'Browse 100+ built-in dispute reasons, save your own packs, export .txt.',
                    action: () => setSection('reasons'),
                    cta: 'Open reasons',
                  },
                  {
                    title: 'Starter bases',
                    desc: 'Professional dispute, debt, identity, and funding letter scaffolds with tone variants.',
                    action: () => setSection('bases'),
                    cta: 'Preview bases',
                  },
                  {
                    title: 'Letter Studio',
                    desc: 'Execute your round: select disputes, attach evidence, AI draft, generate bureau PDFs.',
                    action: () => openLetterStudio(),
                    cta: 'Draft now',
                  },
                ].map((card) => (
                  <button
                    key={card.title}
                    type="button"
                    onClick={card.action}
                    className="text-left fc-light-glass-panel fc-light-chrome-panel ring-1 ring-inset ring-white/80 shadow-sm p-5 hover:border-amber-500/25 hover:bg-amber-500/5 transition-all"
                  >
                    <p className="font-semibold text-white/90">{card.title}</p>
                    <p className="mt-2 text-sm text-white/45">{card.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-300">
                      {card.cta} <ArrowRight size={12} />
                    </span>
                  </button>
                ))}
              </div>
              {activeVault ? (
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-emerald-100">
                    Active for Letter Studio: <span className="font-semibold">{activeVault.title}</span>
                  </p>
                  <button type="button" onClick={() => openLetterStudio({ vaultId: activeVault.id })} className="text-[10px] font-black uppercase text-emerald-200">
                    Draft with this →
                  </button>
                </div>
              ) : null}
              {filteredVault.length ? (
                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white/90">Recent vault templates</p>
                    <button type="button" onClick={() => setSection('vault')} className="text-[10px] font-black uppercase text-amber-300">
                      View all
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {filteredVault.slice(0, 4).map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setActiveVault(v);
                          setActiveTemplateForLetterStudio(v.id);
                          setNotice(`"${v.title}" set active for Letter Studio.`);
                        }}
                        className="text-left fc-light-glass-panel fc-light-chrome-panel rounded-xl p-4 hover:border-amber-500/25 transition-all"
                      >
                        <p className="font-semibold text-white/90 text-sm truncate">{v.title}</p>
                        <p className="text-[10px] uppercase tracking-widest text-white/45 mt-1">{categoryLabel(v.category)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {section === 'vault' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-white/45">Upload, edit, and set your default intro for dispute PDFs.</p>
                <button
                  type="button"
                  onClick={() => downloadText({ text: getDisputeReasonsLibraryAsText(), filename: 'dispute-reasons-library.txt' })}
                  className="text-[10px] font-black uppercase tracking-widest text-white/45"
                >
                  Export reasons .txt
                </button>
              </div>
              <TemplatesVaultPanel
                tenantId={tenantId}
                partnerId={partner.id}
                variant="partner"
                allowCreate
                defaultCategory="credit_dispute"
                onUseText={(text, template) => {
                  setActiveVault(template);
                  setActiveTemplateForLetterStudio(template.id);
                  setNotice(`Template "${template.title}" set active. Open Letter Studio to draft.`);
                }}
                onAttachFile={(template) => {
                  setActiveVault(template);
                  setActiveTemplateForLetterStudio(template.id);
                  openLetterStudio({ vaultId: template.id });
                }}
              />
            </div>
          )}

          {section === 'reasons' && (
            <ReasonsCommandHub
              partnerId={partner.id}
              onApplyReason={(text) => {
                void navigator.clipboard?.writeText(text);
                setNotice('Reason copied — paste in Letter Studio or save to a dispute item.');
              }}
            />
          )}

          {section === 'bases' && (
            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-4`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">Template workspace</p>
                  <p className="text-sm text-white/45 mt-1">Pick a starter base, edit the body inline, then send to Letter Studio.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setBasesRailCollapsed((v) => !v)}
                  className="fc-button-soft px-3 py-2 text-[10px] lg:hidden"
                >
                  {basesRailCollapsed ? 'Show bases' : 'Hide bases'}
                </button>
              </div>

              <div className="grid lg:grid-cols-12 gap-4 min-h-[520px]">
                <aside
                  className={'lg:col-span-3 space-y-3 ' + (basesRailCollapsed ? 'hidden lg:block' : 'block')}
                >
                  <div className="flex flex-wrap gap-2 pb-1 sticky top-0 bg-[#070b09]/95 py-1 z-10">
                    {baseCategories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBaseCategory(c)}
                        className={`px-2 py-1 rounded-lg border text-[9px] font-black uppercase ${
                          baseCategory === c
                            ? 'border-amber-500/35 bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/20'
                            : 'border-white/[0.08] text-white/60 hover:bg-white/[0.04]'
                        }`}
                      >
                        {c === 'all' ? 'All' : categoryLabel(c)}
                      </button>
                    ))}
                  </div>
                  <div className={FINELY_OS_CATALOG_SHELL}>
                    <FinelyOsCatalogBrowser
                      items={baseCatalogItems}
                      pageSize={8}
                      searchPlaceholder="Search starter bases…"
                      emptyMessage="No starter bases match your filters."
                      onItemClick={setSelectedBaseId}
                      initialView="grid"
                      showViewToggle={false}
                      renderTrailing={(item) =>
                        item.id === selectedBaseId ? (
                          <span className="text-[10px] font-bold uppercase text-amber-300">Selected</span>
                        ) : null
                      }
                    />
                  </div>
                </aside>

                <div className="lg:col-span-5 flex flex-col min-h-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-white/45">Tone</span>
                    {TEMPLATE_TONES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTone(t.id as TemplateTone)}
                        className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase ${
                          tone === t.id
                            ? 'border-amber-500/35 bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/20'
                            : 'border-white/[0.08] text-white/60 hover:bg-white/[0.04]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  {base ? (
                    <>
                      <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl ring-1 ring-inset ring-white/80 shadow-sm px-4 py-3">
                        <p className="font-semibold text-white/90 text-sm">{base.title}</p>
                        {base.description ? <p className="text-xs text-white/45 mt-1">{base.description}</p> : null}
                      </div>
                      <div className="flex-1 min-h-[360px] fc-light-glass-panel fc-light-chrome-panel overflow-hidden ring-1 ring-inset ring-white/5">
                        <RichTextEditor
                          valueHtml={editableBodyHtml}
                          onChangeHtml={(html) => {
                            setEditableBodyHtml(html);
                            setPreviewHtml(injectPrintSafeCss({ html: sanitizeHtmlForPreview(html) }));
                          }}
                          placeholder="Edit your letter body here…"
                          minHeightPx={360}
                        />
                      </div>
                    </>
                  ) : (
                    <div className={`flex-1 rounded-2xl border border-dashed border-white/15 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony text-sm flex items-center justify-center ${FINELY_OS_ENTITY_BODY}`}>
                      Select a starter base from the left rail.
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!base}
                      onClick={() => base && openLetterStudio({ baseId: base.id })}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] disabled:opacity-50"
                    >
                      <Gavel size={14} /> Use in letter studio
                    </button>
                    <button
                      type="button"
                      disabled={!editableBodyHtml}
                      onClick={() => {
                        void navigator.clipboard?.writeText(editableBodyHtml.replace(/<[^>]+>/g, ' '));
                        setNotice('Edited body copied to clipboard.');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl fc-button-white-sm"
                    >
                      <Copy size={14} /> Copy edits
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-2 min-h-0">
                  <div className="text-[10px] uppercase tracking-widest text-white/45">Live preview</div>
                  <div className="fc-light-glass-panel fc-light-chrome-panel overflow-hidden h-[480px] lg:h-full min-h-[320px] ring-1 ring-inset ring-white/5">
                    {previewHtml ? (
                      <iframe title="Template preview" srcDoc={previewHtml} className="w-full h-full bg-white" />
                    ) : (
                      <div className={`p-8 text-sm h-full flex items-center justify-center ${FINELY_OS_ENTITY_BODY}`}>
                        Preview updates as you edit tone or base.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {notice ? (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 flex items-center justify-between gap-3">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-white/45 text-xs uppercase">
            Dismiss
          </button>
        </div>
      ) : null}
    </div>
  );
}
