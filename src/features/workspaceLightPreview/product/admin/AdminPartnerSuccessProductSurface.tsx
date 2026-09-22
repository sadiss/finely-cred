import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check } from 'lucide-react';
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
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

export default function AdminPartnerSuccessProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'emerald';

  const [selectedId, setSelectedId] = useState(PARTNER_SUCCESS_MODULES[0]?.id ?? '');
  const [editing, setEditing] = useState(false);
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
      eyebrow="Success Edition"
      title="Success Edition"
      description="Edit the short success steps partners see — titles, descriptions, and the lesson each step opens."
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
      metricTitle="Success steps"
      metricDescription="Open one step to edit it. The list stays out of the way while you write."
    >
      {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}

      <div className="fc-admin-readable space-y-8">
      {!editing ? (
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[#e8e8e8]">Success steps</h2>
        <p className="max-w-3xl text-base leading-relaxed text-[#e8e8e8]">
          These are the steps partners follow. Open one to change its title, description, and lesson link.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {modules.map((m, index) => {
            const hasOverride = Boolean(getPartnerSuccessModuleOverride(m.id));
            return (
              <article key={m.id} className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-[#0b1110] p-6">
                <div className="text-sm font-semibold text-[#fbbf24]">Step {index + 1}</div>
                <h3 className="text-xl font-semibold text-[#e8e8e8]">{m.title}</h3>
                <p className="text-base leading-relaxed text-[#e8e8e8]">{m.description}</p>
                <div className="text-sm text-[#e8e8e8]">{hasOverride ? 'Custom copy saved' : m.type}</div>
                <button
                  type="button"
                  className={`${FINELY_OS_PRIMARY_BTN} mt-auto w-fit`}
                  onClick={() => {
                    setSelectedId(m.id);
                    setEditing(true);
                  }}
                >
                  Edit {hasOverride ? <Check size={14} /> : null}
                </button>
              </article>
            );
          })}
        </div>
      </section>
      ) : selected ? (
      <section className="space-y-5">
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setEditing(false)}>
          <ArrowLeft size={16} /> All success steps
        </button>
        <div className="space-y-5 rounded-2xl border border-white/15 bg-[#0b1110] p-6 lg:p-8">
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
        </div>
      </section>
      ) : null}
      </div>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
