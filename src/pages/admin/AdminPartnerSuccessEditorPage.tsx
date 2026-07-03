import React, { useMemo, useState } from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { PARTNER_SUCCESS_MODULES } from '../../domain/partnerSuccessExperience';
import {
  getPartnerSuccessModuleOverride,
  listEffectivePartnerSuccessModules,
  savePartnerSuccessModuleOverride,
} from '../../data/partnerSuccessModuleOverridesRepo';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN } from '../../features/os/finelyOsLightUi';

export default function AdminPartnerSuccessEditorPage() {
  const [selectedId, setSelectedId] = useState(PARTNER_SUCCESS_MODULES[0]?.id ?? '');
  const [version, setVersion] = useState(0);
  const modules = useMemo(() => {
    void version;
    return listEffectivePartnerSuccessModules();
  }, [version]);
  const selected = modules.find((m) => m.id === selectedId) ?? modules[0] ?? null;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hubPath, setHubPath] = useState('');
  const [trainingLessonId, setTrainingLessonId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  React.useEffect(() => {
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

  return (
    <PageShell
      badge="Admin"
      title="Partner Success Editor"
      subtitle="Edit success module copy and Training Academy links — full module set preserved."
      back={{ to: -1 }}
    >
      <div className="space-y-6">
        {notice ? (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{notice}</div>
        ) : null}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-2 max-h-[32rem] overflow-y-auto">
            {modules.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.id)}
                className={`w-full text-left rounded-xl border p-3 transition ${
                  selected?.id === m.id ? 'border-violet-400/40 bg-violet-500/10' : 'border-white/10 bg-black/25 hover:border-white/20'
                }`}
              >
                <div className="text-sm font-bold text-white">{m.title}</div>
                <div className={`text-xs mt-1 ${FINELY_OS_ENTITY_BODY}`}>{m.type} · {m.lanes.join(', ')}</div>
              </button>
            ))}
          </div>
          {selected ? (
            <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4">
              <div className="text-[10px] uppercase tracking-widest text-white/40">{selected.id}</div>
              <label className="block">
                <div className="text-xs text-white/50 mb-1">Title</div>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="fc-input w-full" />
              </label>
              <label className="block">
                <div className="text-xs text-white/50 mb-1">Description</div>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="fc-input w-full resize-y" />
              </label>
              <label className="block">
                <div className="text-xs text-white/50 mb-1">Hub path</div>
                <input value={hubPath} onChange={(e) => setHubPath(e.target.value)} className="fc-input w-full" />
              </label>
              <label className="block">
                <div className="text-xs text-white/50 mb-1">Training Academy lesson id</div>
                <input value={trainingLessonId} onChange={(e) => setTrainingLessonId(e.target.value)} className="fc-input w-full" placeholder="e.g. core_l3_evidence" />
              </label>
              <div className="flex gap-2">
                <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={save}>
                  Save override
                </button>
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => {
                    savePartnerSuccessModuleOverride(selected.id, {});
                    setVersion((v) => v + 1);
                    setNotice('Reset to defaults');
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
