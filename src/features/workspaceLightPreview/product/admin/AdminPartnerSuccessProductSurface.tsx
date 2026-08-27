import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PARTNER_SUCCESS_MODULES } from '../../../../domain/partnerSuccessExperience';
import {
  getPartnerSuccessModuleOverride,
  listEffectivePartnerSuccessModules,
  savePartnerSuccessModuleOverride,
} from '../../../../data/partnerSuccessModuleOverridesRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

const STAGE_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

export default function AdminPartnerSuccessProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'emerald';

  const [selectedId, setSelectedId] = useState(PARTNER_SUCCESS_MODULES[0]?.id ?? '');
  const [version, setVersion] = useState(0);
  const modules = useMemo(() => {
    void version;
    return listEffectivePartnerSuccessModules();
  }, [version]);
  const selected = modules.find((m) => m.id === selectedId) ?? modules[0] ?? null;
  const selectedIndex = modules.findIndex((m) => m.id === selected?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hubPath, setHubPath] = useState('');
  const [trainingLessonId, setTrainingLessonId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) return;
    const override = getPartnerSuccessModuleOverride(selected.id);
    setTitle(override?.title ?? selected.title);
    setDescription(override?.description ?? selected.description);
    setHubPath(override?.hubPath ?? selected.hubPath);
    setTrainingLessonId(override?.trainingLessonId ?? selected.trainingLessonId ?? '');
  }, [selected?.id]);

  const save = () => {
    if (!selected) return;
    savePartnerSuccessModuleOverride(selected.id, {
      title: title.trim() || selected.title,
      description: description.trim() || selected.description,
      hubPath: hubPath.trim() || selected.hubPath,
      trainingLessonId: trainingLessonId.trim() || undefined,
    });
    setVersion((v) => v + 1);
    setNotice(`Saved override for ${selected.id}`);
  };

  const reset = () => {
    if (!selected) return;
    savePartnerSuccessModuleOverride(selected.id, {});
    setVersion((v) => v + 1);
    setNotice('Reset to defaults');
  };

  const overrideCount = useMemo(
    () => modules.filter((m) => Boolean(getPartnerSuccessModuleOverride(m.id))).length,
    [modules, version],
  );

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Delivery"
      title="Success content editor"
      description="Edit success module copy and Training Academy links along the partner journey runway."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={
        <ProductPagePrimaryAction label="Open training hub" onClick={() => navigate('/admin/courses')} />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/portal/training')}>
          Preview partner view
        </button>
      }
      metrics={[
        { label: 'Modules', value: String(modules.length), hint: 'On the runway', accent: 'emerald' },
        { label: 'Overrides', value: String(overrideCount), hint: 'Custom copy saved', accent: 'violet' },
        { label: 'Types', value: String(new Set(modules.map((m) => m.type)).size), hint: 'Quiz, review, milestone…', accent: 'sky' },
        { label: 'Lanes', value: String(new Set(modules.flatMap((m) => m.lanes)).size), hint: 'Restore, debt, dispute…', accent: 'rose' },
      ]}
      metricTitle="Success playbook"
      metricDescription="Pick a stage on the runway, edit copy, then save or reset to defaults."
    >
      {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}

      {/* Journey runway — horizontal spine with stage nodes */}
      <section className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
          <Star size={16} />
          <span>Success journey runway</span>
        </div>
        <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} max-w-3xl`}>
          Each node is a partner success module. Select one to edit title, description, hub path, and academy lesson links.
        </p>

        <div className="mt-6 overflow-x-auto pb-2">
          <div className="flex min-w-max items-stretch gap-0">
            {modules.map((m, index) => {
              const active = m.id === selected?.id;
              const stageAccent = STAGE_ACCENTS[index % STAGE_ACCENTS.length];
              const hasOverride = Boolean(getPartnerSuccessModuleOverride(m.id));
              return (
                <React.Fragment key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(m.id)}
                    className={`relative flex w-44 flex-col items-center rounded-2xl border-2 px-3 py-4 text-center transition ${
                      active
                        ? 'border-violet-400/60 bg-violet-500/15 shadow-lg shadow-violet-500/10'
                        : 'border-white/10 bg-black/20 hover:border-white/25'
                    }`}
                    data-fc-accent={stageAccent}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold ${
                        active ? 'bg-violet-500 text-white' : `bg-white/10 ${FINELY_OS_ENTITY_BODY} text-sm`
                      }`}
                    >
                      {hasOverride ? <Check size={16} /> : index + 1}
                    </span>
                    <span className={`mt-3 text-sm font-bold leading-tight ${FINELY_OS_ENTITY_VALUE}`}>{m.title}</span>
                    <span className={`mt-1 text-[10px] uppercase tracking-wide ${FINELY_OS_ENTITY_SUBLABEL}`}>
                      {m.type}
                    </span>
                    {active ? (
                      <span className="mt-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200">
                        Editing
                      </span>
                    ) : null}
                  </button>
                  {index < modules.length - 1 ? (
                    <div className="flex w-8 items-center justify-center" aria-hidden>
                      <ChevronRight size={18} className="text-[color:var(--fc-os-entity-faint)]" />
                    </div>
                  ) : null}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* Active stage editor panel */}
      {selected ? (
        <section className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-5`} data-fc-accent="emerald">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>{selected.id}</div>
              <h2 className={`mt-1 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                Stage {selectedIndex + 1}: {selected.title}
              </h2>
              <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                {selected.type} · lanes: {selected.lanes.join(', ')}
              </p>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100`}>
              <BookOpen size={14} />
              Hub: <span className="font-mono">{hubPath || selected.hubPath}</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <label className="block">
              <div className={FINELY_OS_ENTITY_LABEL}>Title</div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${FINELY_OS_ENTITY_INPUT} mt-1`} />
            </label>
            <label className="block">
              <div className={FINELY_OS_ENTITY_LABEL}>Hub path</div>
              <input value={hubPath} onChange={(e) => setHubPath(e.target.value)} className={`${FINELY_OS_ENTITY_INPUT} mt-1 font-mono text-sm`} />
            </label>
            <label className="block lg:col-span-2">
              <div className={FINELY_OS_ENTITY_LABEL}>Description</div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={`${FINELY_OS_ENTITY_INPUT} mt-1 resize-y`}
              />
            </label>
            <label className="block lg:col-span-2">
              <div className={FINELY_OS_ENTITY_LABEL}>Training Academy lesson id</div>
              <input
                value={trainingLessonId}
                onChange={(e) => setTrainingLessonId(e.target.value)}
                className={`${FINELY_OS_ENTITY_INPUT} mt-1 font-mono text-sm`}
                placeholder="e.g. core_l3_evidence"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={save}>
              Save override <ArrowRight size={14} />
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={reset}>
              Reset to defaults
            </button>
          </div>
        </section>
      ) : null}

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
