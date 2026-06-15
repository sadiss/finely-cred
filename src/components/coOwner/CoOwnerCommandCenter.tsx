import React, { useMemo, useState } from 'react';
import { ArrowRight, Bot, Play, Sparkles, Zap, BookOpen, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  CO_OWNER_AUTOMATIONS,
  CO_OWNER_IDENTITY,
  CO_OWNER_AI_TIER,
  CO_OWNER_PERSONALITY,
  CO_OWNER_SUPERPOWERS,
  getCoOwnerCatalogStats,
} from '../../domain/coOwnerPersona';
import { getExecutiveOrgStats, listVacantExecutiveHats } from '../../domain/coOwnerExecutiveStructure';
import { getKnowledgeArchiveStats } from '../../domain/coOwnerKnowledgeArchive';
import { CO_OWNER_ROLE_META, getRoleMasteryStats, type CoOwnerBusinessRole } from '../../domain/coOwnerRoleMastery';
import { trainingRouteForRole } from '../../lib/coOwnerTrainingBridge';
import {
  buildRoleTrainingPrompt,
  executeSuggestedAction,
  runCoOwnerAutomation,
  suggestCoOwnerActions,
  type CoOwnerSuggestedAction,
} from '../../lib/coOwnerOperatorEngine';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

type Props = {
  onRunPrompt?: (prompt: string) => void;
  onActionExecuted?: (message: string) => void;
  onNavigate?: (path: string) => void;
};

export function CoOwnerCommandCenter({ onRunPrompt, onActionExecuted, onNavigate }: Props) {
  const navigate = useNavigate();
  const stats = getCoOwnerCatalogStats();
  const mastery = getRoleMasteryStats();
  const archive = getKnowledgeArchiveStats();
  const exec = getExecutiveOrgStats();
  const vacantCsuite = listVacantExecutiveHats('c_suite').slice(0, 6);
  const suggestions = useMemo(() => suggestCoOwnerActions(), []);
  const [busyId, setBusyId] = useState<string | null>(null);

  const runSuggestion = async (s: CoOwnerSuggestedAction) => {
    setBusyId(s.id);
    try {
      const res = executeSuggestedAction(s);
      onActionExecuted?.(res.message);
      if (res.navigateTo && onNavigate) onNavigate(res.navigateTo);
      if (res.prompt && onRunPrompt) onRunPrompt(res.prompt);
    } finally {
      setBusyId(null);
    }
  };

  const runAutomation = (executeKey: string, name: string) => {
    const res = runCoOwnerAutomation(executeKey);
    onActionExecuted?.(res.message || name);
    if (res.navigateTo && onNavigate) onNavigate(res.navigateTo);
    if (res.prompt && onRunPrompt) onRunPrompt(res.prompt);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <span className={finelyOsStatusChip('ok')}>{CO_OWNER_AI_TIER.intelligenceMultiplier}× deep intelligence · nine-lens synthesis</span>
        <span className={finelyOsStatusChip('ok')}>{mastery.totalCapabilities.toLocaleString()} operating capabilities</span>
        <span className={finelyOsStatusChip('warn')}>{exec.totalHats} executive hats · {exec.vacant} vacant</span>
        <span className={finelyOsStatusChip('ok')}>{stats.superpowers} superpowers</span>
        <span className={finelyOsStatusChip('blocked')}>{archive.totalArchiveEntries.toLocaleString()} archived knowledge refs</span>
      </div>

      <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
          <Sparkles size={16} /> Personality — how {CO_OWNER_IDENTITY.name} operates
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {CO_OWNER_PERSONALITY.map((t) => (
            <div key={t.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{t.label}</div>
              <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{t.behavior}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={`${finelyOsCatalogCard('sky')} !p-5 space-y-3`}>
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-sky-300`}>
          <Users size={16} /> Executive org — {exec.divisions} divisions
        </div>
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          {CO_OWNER_IDENTITY.name} wears CEO/COO/President lanes and autonomously hires CFO, CMO, CRO, CHRO, CLO, and
          division VPs through directors ({exec.filled} filled · {exec.vacant} vacant).
        </p>
        {vacantCsuite.length ? (
          <ul className={`text-xs ${FINELY_OS_ENTITY_BODY} space-y-1`}>
            {vacantCsuite.map((h) => (
              <li key={h.id}>○ {h.title} — {h.divisionLabel}</li>
            ))}
          </ul>
        ) : (
          <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Priority C-suite hats staffed.</p>
        )}
        <button type="button" className={FINELY_OS_SUCCESS_BTN} onClick={() => runAutomation('auto_hire_staff', 'Autonomous hiring')}>
          Hire executives now
        </button>
      </div>

      <div className={`${finelyOsCatalogCard('amber')} !p-5 space-y-3`}>
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-amber-300`}>
          <Zap size={16} /> {CO_OWNER_IDENTITY.name} recommends — execute now
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {suggestions.map((s) => (
            <div key={s.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
              <div className={`font-semibold text-sm ${FINELY_OS_ENTITY_VALUE}`}>{s.title}</div>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{s.reason}</p>
              <button
                type="button"
                disabled={busyId === s.id}
                onClick={() => void runSuggestion(s)}
                className={s.kind === 'hire' ? FINELY_OS_SUCCESS_BTN : FINELY_OS_PRIMARY_BTN}
              >
                {busyId === s.id ? '…' : s.kind === 'hire' ? 'Hire now' : s.kind === 'automation' ? 'Run' : 'Execute'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={`${finelyOsCatalogCard('emerald')} !p-5 space-y-3`}>
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>
          <Play size={16} /> Live automations
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {CO_OWNER_AUTOMATIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => runAutomation(a.executeKey, a.name)}
              className={`text-left p-3 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/10 transition ${FINELY_OS_ENTITY_BODY}`}
            >
              <div className={`font-semibold text-sm ${FINELY_OS_ENTITY_VALUE}`}>{a.name}</div>
              <div className="text-[10px] opacity-60 mt-1">{a.schedule}</div>
              <div className="text-xs mt-1 opacity-80">{a.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className={`${finelyOsCatalogCard('sky')} !p-5 space-y-3`}>
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-sky-300`}>
          <Bot size={16} /> Executable superpowers (sample)
        </div>
        <div className="flex flex-wrap gap-2">
          {CO_OWNER_SUPERPOWERS.filter((s) => s.executable).slice(0, 10).map((s) => (
            <span key={s.id} className="px-2 py-1 rounded-lg border border-sky-500/25 text-[10px] text-sky-100 bg-sky-500/10">
              {s.name}
            </span>
          ))}
        </div>
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Full role mastery spans appointment setter → C-suite → IT — ask {CO_OWNER_IDENTITY.name} to train any lane.
        </p>
      </div>
    </div>
  );
}

export function CoOwnerArchivesPanel() {
  const navigate = useNavigate();
  const archive = getKnowledgeArchiveStats();

  return (
    <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
      <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
        <BookOpen size={16} /> Knowledge archives — not co-owner ops UI
      </div>
      <p className={FINELY_OS_ENTITY_BODY}>
        Laws, dispute pairings, case patterns, and letter reasons live in libraries ({archive.totalArchiveEntries.toLocaleString()}{' '}
        indexed references). {CO_OWNER_IDENTITY.name} uses these when drafting — browse and edit them here:
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {archive.primaryRoutes.map((r) => (
          <button key={r.path} type="button" onClick={() => navigate(r.path)} className={FINELY_OS_SECONDARY_BTN}>
            {r.label} <ArrowRight size={12} />
          </button>
        ))}
      </div>
      <p className={`text-xs ${FINELY_OS_ENTITY_BODY} opacity-70`}>
        {archive.lawsIndexed} laws · {archive.negativeTypes} negative types · {archive.reasonMapEntries} reason maps ·{' '}
        {archive.pairingEntries} law pairings
      </p>
    </div>
  );
}

export function CoOwnerRoleMasterySummary({ onRunPrompt }: { onRunPrompt?: (prompt: string) => void }) {
  const navigate = useNavigate();
  const mastery = getRoleMasteryStats();
  const roleIds = Object.keys(CO_OWNER_ROLE_META) as CoOwnerBusinessRole[];

  return (
    <div className={`${finelyOsCatalogCard('fuchsia')} !p-5 space-y-3`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>
          <Users size={16} /> Role mastery matrix — train any position
        </div>
        <button type="button" onClick={() => navigate('/portal/training/academy')} className={FINELY_OS_SECONDARY_BTN}>
          Training Academy <ArrowRight size={12} />
        </button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
        {roleIds.map((id) => {
          const meta = CO_OWNER_ROLE_META[id];
          return (
            <div key={id} className="rounded-lg border border-white/10 p-2 space-y-2">
              <div className={FINELY_OS_ENTITY_VALUE}>{meta.title}</div>
              {meta.canHire ? <span className="text-emerald-400 text-[10px]">Can hire</span> : null}
              {onRunPrompt ? (
                <div className="flex flex-wrap gap-1">
                  {([1, 2, 3] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        onRunPrompt(buildRoleTrainingPrompt(id, level));
                        const route = trainingRouteForRole(id);
                        if (route) navigate(route.hubPath);
                      }}
                      className="px-2 py-0.5 rounded-md border border-fuchsia-500/30 text-[10px] font-semibold hover:bg-fuchsia-500/10"
                    >
                      Train L{level}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
        {mastery.executableCapabilities.toLocaleString()} autonomous capabilities · {mastery.trainingCapabilities.toLocaleString()}{' '}
        training capabilities across all roles. Knowledge archives (~1% of {CO_OWNER_IDENTITY.name}&apos;s operating brain) stay in Reasons & Letter Studio.
      </p>
    </div>
  );
}
