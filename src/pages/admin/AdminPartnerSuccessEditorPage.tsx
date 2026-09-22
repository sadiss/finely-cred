import React, { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AdminWorkstationFrame, type AdminEmbeddablePageProps } from '../../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';
import { PARTNER_SUCCESS_MODULES } from '../../domain/partnerSuccessExperience';
import {
  getPartnerSuccessModuleOverride,
  listEffectivePartnerSuccessModules,
  savePartnerSuccessModuleOverride,
} from '../../data/partnerSuccessModuleOverridesRepo';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN } from '../../features/os/finelyOsLightUi';

export default function AdminPartnerSuccessEditorPage({ embedded = false }: AdminEmbeddablePageProps = {}) {
  const [selectedId, setSelectedId] = useState(PARTNER_SUCCESS_MODULES[0]?.id ?? '');
  const [editing, setEditing] = useState(false);
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
    <AdminWorkstationFrame embedded={embedded} kind="partner-success-workstation"
      badge="Admin"
      title="Success Edition"
      subtitle="Edit the short success steps partners see — titles, descriptions, and the lesson each step opens."
      back={{ to: -1 }}
    >
      <div className="space-y-6">
        {notice ? (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{notice}</div>
        ) : null}
        {!editing ? (
          <div className="grid gap-6 md:grid-cols-2">
            {modules.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedId(m.id);
                  setEditing(true);
                }}
                className="w-full text-left rounded-2xl border border-white/15 bg-[#0b1110] p-6 space-y-2"
              >
                <div className="text-lg font-semibold text-[#e8e8e8]">{m.title}</div>
                <div className="text-base text-[#e8e8e8]">{m.description}</div>
                <div className="text-sm text-[#fbbf24]">Edit</div>
              </button>
            ))}
          </div>
        ) : selected ? (
          <div className="space-y-5">
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setEditing(false)}>
              <ArrowLeft size={16} /> All success steps
            </button>
            <div className="rounded-2xl border border-white/15 bg-[#0b1110] p-6 space-y-4">
              <div className="text-sm text-[#e8e8e8]">{selected.id}</div>
              <label className="block">
                <div className="text-sm font-semibold text-[#e8e8e8] mb-1">Title</div>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="fc-input w-full" />
              </label>
              <label className="block">
                <div className="text-sm font-semibold text-[#e8e8e8] mb-1">Description</div>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="fc-input w-full resize-y" />
              </label>
              <label className="block">
                <div className="text-sm font-semibold text-[#e8e8e8] mb-1">Hub path</div>
                <input value={hubPath} onChange={(e) => setHubPath(e.target.value)} className="fc-input w-full" />
              </label>
              <label className="block">
                <div className="text-sm font-semibold text-[#e8e8e8] mb-1">Training Academy lesson id</div>
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
          </div>
        ) : null}
      </div>
    </AdminWorkstationFrame>
  );
}
