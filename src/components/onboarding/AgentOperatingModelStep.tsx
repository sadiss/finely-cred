import React, { useMemo } from 'react';
import { ArrowLeft, CheckCircle2, Crown, GraduationCap, Layers } from 'lucide-react';
import { Button } from '../ui';
import { agencyTiers } from '../../config/pricingCatalog';
import { CS } from '../../config/creditSpecialistProgram';
import type { AgentOperatingModel, AgentSpecialtyId, PlatformLeverId } from '../../domain/agentProgram';
import {
  AGENT_SPECIALTIES,
  AGENT_TRAINING_PHASES,
  defaultAgentOperatingModel,
  PLATFORM_VALUE_LEVERS,
} from '../../domain/agentProgram';
import { AgentSplitCalculator } from '../agent/AgentSplitCalculator';
import { AgencySplitSummaryLine } from '../pricing/AgencySplitBreakdown';

type StepProps = {
  next: () => void;
  prev?: () => void;
  data: any;
  update: (data: any) => void;
};

function modelFromData(data: any): AgentOperatingModel {
  const existing = data.agentOperatingModel as Partial<AgentOperatingModel> | undefined;
  return defaultAgentOperatingModel({
    specialties: (data.agentSpecialties as AgentSpecialtyId[])?.length
      ? data.agentSpecialties
      : existing?.specialties,
    trainingPhase: existing?.trainingPhase ?? data.agentTrainingPhase,
    capacityTierId: data.agentTierId || existing?.capacityTierId || 'agency_solo',
    levers: existing?.levers,
    sampleClientFeeCents: existing?.sampleClientFeeCents ?? 150000,
  });
}

function syncModel(data: any, model: AgentOperatingModel, update: (d: any) => void) {
  update({
    agentOperatingModel: model,
    agentTierId: model.capacityTierId,
    agentSpecialties: model.specialties,
    agentTrainingPhase: model.trainingPhase,
  });
}

export function AgentOperatingModelStep({ next, prev, data, update }: StepProps) {
  const model = useMemo(() => modelFromData(data), [data]);
  const tiers = useMemo(
    () => agencyTiers.filter((t) => t.isPublic).slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [],
  );

  const toggleSpecialty = (id: AgentSpecialtyId) => {
    const set = new Set(model.specialties);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    const specialties = Array.from(set);
    const nextModel = defaultAgentOperatingModel({
      ...model,
      specialties: specialties.length ? specialties : [id],
    });
    syncModel(data, nextModel, update);
  };

  const patchModel = (patch: Partial<AgentOperatingModel>) => {
    const nextModel = defaultAgentOperatingModel({ ...model, ...patch });
    syncModel(data, nextModel, update);
  };

  const setLever = (leverId: string, performer: 'platform' | 'agent' | 'shared') => {
    patchModel({ levers: { ...model.levers, [leverId as PlatformLeverId]: performer } });
  };

  const canContinue = model.specialties.length > 0 && Boolean(model.capacityTierId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-3">
        <p className="text-[10px] font-black tracking-[0.6em] text-fuchsia-400 uppercase">{CS.programName}</p>
        <h2 className="text-4xl md:text-5xl font-light text-white">
          Build your <span className="text-fuchsia-400">operating model</span>
        </h2>
        <p className="text-white/45 text-lg font-light max-w-2xl">
          Pricing is <strong className="text-white/70 font-normal">revenue share only</strong> — no platform access fee. Your split is driven by
          training phase and who performs each lever: software, marketing, fulfillment, and mentoring.
        </p>
      </div>

      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 text-fuchsia-300">
          <Layers size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Specialty tracks</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {AGENT_SPECIALTIES.map((spec) => {
            const active = model.specialties.includes(spec.id);
            return (
              <button
                key={spec.id}
                type="button"
                onClick={() => toggleSpecialty(spec.id)}
                className={`text-left rounded-2xl border p-4 transition-all ${
                  active ? 'border-fuchsia-500/50 bg-fuchsia-500/10' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className="text-white font-semibold">{spec.label}</div>
                <div className="text-white/50 text-sm mt-1">{spec.description}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 text-fuchsia-300">
          <GraduationCap size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Training phase</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {AGENT_TRAINING_PHASES.map((phase) => {
            const active = model.trainingPhase === phase.id;
            return (
              <button
                key={phase.id}
                type="button"
                onClick={() => patchModel({ trainingPhase: phase.id })}
                className={`text-left rounded-2xl border p-4 transition-all ${
                  active ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white font-semibold">{phase.label}</span>
                  <span className="text-[10px] font-mono text-white/45">~{phase.platformBasePct}% platform base</span>
                </div>
                <div className="text-white/50 text-sm mt-1">{phase.description}</div>
              </button>
            );
          })}
        </div>
      </section>

      <AgentSplitCalculator
        model={model}
        onChangeModel={patchModel}
        onChangeLever={setLever}
        onChangeSampleFee={(cents: number) => patchModel({ sampleClientFeeCents: cents })}
      />

      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 text-fuchsia-300">
          <Crown size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Workspace capacity</span>
        </div>
        <p className="text-white/45 text-sm">Revenue share is separate from capacity limits (clients & seats).</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tiers.map((t) => {
            const active = model.capacityTierId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() =>
                  patchModel({
                    capacityTierId: t.id,
                    trainingPhase: t.recommendedTrainingPhase ?? model.trainingPhase,
                  })
                }
                className={`text-left rounded-2xl border p-5 transition-all ${
                  active ? 'border-fuchsia-500/50 bg-fuchsia-500/10' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-white font-semibold">{t.name}</div>
                  <div className="text-sm text-emerald-300 shrink-0">
                    <AgencySplitSummaryLine tier={t} />
                  </div>
                </div>
                <div className="text-white/50 text-xs mt-2 capitalize">{(t.whiteLabelLevel ?? '').replace(/_/g, ' ')}</div>
                <div className="text-white/50 text-xs mt-2">
                  {t.activeClientLimit === -1 ? 'Unlimited' : t.activeClientLimit} clients •{' '}
                  {t.seatLimit === -1 ? 'Unlimited' : t.seatLimit} seats
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        {prev ? (
          <button
            type="button"
            onClick={prev}
            className="inline-flex items-center gap-2 px-5 py-3 fc-light-glass-panel fc-light-chrome-panel rounded-xl hover:bg-white/[0.09] text-[10px] font-black uppercase tracking-widest text-white/70"
          >
            <ArrowLeft size={14} /> Previous
          </button>
        ) : (
          <div />
        )}
        <Button onClick={next} disabled={!canContinue} size="lg">
          Continue
        </Button>
      </div>
    </div>
  );
}

/** @deprecated Use AgentOperatingModelStep — kept for legacy step key */
export function AgentTierStep(props: StepProps) {
  return <AgentOperatingModelStep {...props} />;
}
