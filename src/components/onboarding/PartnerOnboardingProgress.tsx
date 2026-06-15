import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bot, ListChecks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { computePartnerOnboardingProgress } from '../../lib/partnerOnboardingEngine';
import { peekAgentHandoff } from '../../lib/agentHandoffBridge';
import { getAgentPersona } from '../../domain/agentPersonas';
import { openCommunicationHub } from '../chat/communicationHubModel';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsGlassShell,
} from '../../features/os/finelyOsLightUi';

export function PartnerOnboardingProgress({ partner }: { partner: { id: string; lane?: string; routes?: unknown; journeySignals?: unknown } }) {
  const navigate = useNavigate();
  const [handoffTick, setHandoffTick] = useState(0);
  const progress = useMemo(() => computePartnerOnboardingProgress(partner as import('../../domain/partners').Partner), [partner]);
  const next = progress.steps.find((s) => !s.done);
  const handoff = useMemo(() => peekAgentHandoff(), [handoffTick]);
  const handoffPersona = handoff ? getAgentPersona(handoff.personaId) : undefined;

  useEffect(() => {
    const onStore = () => setHandoffTick((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  return (
    <div className={`${finelyOsGlassShell('panel', 'violet')} p-4 space-y-3`}>
      {handoff && handoffPersona ? (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] p-3 space-y-2">
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <Bot size={14} className="text-emerald-300" /> Agent handoff ready
          </div>
          <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            {handoffPersona.name} is standing by from your {handoff.surface === 'public_chat' ? 'public chat' : handoff.surface.replace('_', ' ')}.
            {handoff.goal ? ` Goal: ${handoff.goal}.` : ''}
          </p>
          <button
            type="button"
            onClick={() => openCommunicationHub({ tab: 'ai', expanded: true })}
            className={FINELY_OS_SUCCESS_BTN}
          >
            Continue with {handoffPersona.name} <ArrowRight size={12} />
          </button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
          <ListChecks size={14} className="text-violet-300" /> Onboarding journey
        </div>
        <span className={`${FINELY_OS_ENTITY_VALUE} font-bold`}>{progress.percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-violet-500/70 transition-all" style={{ width: `${progress.percent}%` }} />
      </div>
      {next ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Next: {next.label}</span>
          <button type="button" onClick={() => navigate(next.path)} className={FINELY_OS_SECONDARY_BTN}>
            Continue <ArrowRight size={12} />
          </button>
        </div>
      ) : (
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Onboarding complete — keep executing your playbook.</p>
      )}
    </div>
  );
}
