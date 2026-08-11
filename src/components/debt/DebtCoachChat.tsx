import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Globe, MessageSquare, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { callAiGateway } from '../../lib/aiClient';
import { researchLegalTopic, formatResearchForPrompt, type LegalResearchSnippet } from '../../lib/legalWebResearch';
import { resourcesForCoach, type LegalResourceLink } from '../../lib/legalResources';
import type { DebtScenario } from '../../domain/debtLegal';
import { DEBT_LETTER_SPECS, SCENARIO_RECOMMENDATIONS } from '../../legal/debtLetterTemplates';
import { OnDutyStaffCoachHeader } from '../chat/OnDutyStaffCoachHeader';
import {
  FINELY_OS_AI_DRAFT_BTN_SM,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_SHELL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlowTextarea,
  type FinelyOsGlowAccent,
} from '../../features/os/finelyOsLightUi';
import { DebtCoachMessage, LegalResourceStrip } from './DebtCoachMessage';
import { FinelyOsOnPageCoachShell, type FinelyOsCoachChip } from '../../features/os/FinelyOsOnPageCoachShell';

export type DebtCoachQuickStep = {
  label: string;
  prompt: string;
};

export function DebtCoachChat({
  mode,
  scenario,
  debtName,
  caseNumber,
  stateJurisdiction,
  icon,
  title,
  tagline,
  taskType,
  systemPrompt,
  quickSteps,
  promptChips,
  accent = 'emerald',
  coachLane,
  injectPrompt,
  modalLaunch,
}: {
  mode: 'validation' | 'court' | 'foreclosure' | 'repossession';
  scenario: DebtScenario;
  debtName?: string;
  caseNumber?: string;
  stateJurisdiction?: string;
  icon: React.ReactNode;
  title: string;
  tagline: string;
  taskType: string;
  systemPrompt: string;
  quickSteps: DebtCoachQuickStep[];
  promptChips: DebtCoachQuickStep[];
  accent?: 'emerald' | 'fuchsia' | 'amber' | 'rose' | 'sky';
  coachLane?: string;
  injectPrompt?: string;
  modalLaunch?: { triggerLabel: string };
}) {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<LegalResearchSnippet[]>([]);
  const [busy, setBusy] = useState(false);
  const [webOn, setWebOn] = useState(true);
  const resources = resourcesForCoach(mode);
  const scenarioInfo = SCENARIO_RECOMMENDATIONS.find((s) => s.scenario === scenario);
  const recommended = (scenarioInfo?.recommendedLetterTypes ?? [])
    .map((id) => DEBT_LETTER_SPECS.find((s) => s.id === id))
    .filter(Boolean);

  const accentText =
    accent === 'fuchsia'
      ? 'text-fuchsia-300'
      : accent === 'amber'
        ? 'text-amber-300'
        : accent === 'rose'
          ? 'text-rose-300'
          : accent === 'sky'
            ? 'text-sky-300'
            : 'text-emerald-300';
  const chipBtn = FINELY_OS_SECONDARY_BTN;
  const coachChips: FinelyOsCoachChip[] = [
    ...quickSteps.map((s, i) => ({ id: `q-${i}`, label: s.label, prompt: s.prompt })),
    ...promptChips.map((c, i) => ({
      id: `p-${i}`,
      label: c.label.length > 40 ? `${c.label.slice(0, 37)}…` : c.label,
      prompt: c.prompt,
    })),
  ];

  const glowAccent: FinelyOsGlowAccent =
    accent === 'fuchsia' ? 'fuchsia' : accent === 'amber' ? 'amber' : accent === 'rose' ? 'rose' : accent === 'sky' ? 'sky' : 'emerald';

  const ask = async (prompt?: string) => {
    const q = (prompt ?? question).trim();
    if (!q) return;
    setQuestion(q);
    setBusy(true);
    setAnswer('');
    setSources([]);

    let researchBlock = '';
    let researchSnippets: LegalResearchSnippet[] = [];
    if (webOn) {
      const researchTopic =
        mode === 'foreclosure' || mode === 'repossession' ? 'court' : mode === 'validation' ? 'validation' : 'court';
      const res = await researchLegalTopic({ query: q, topic: researchTopic, state: stateJurisdiction });
      researchSnippets = res.snippets;
      researchBlock = formatResearchForPrompt(res.snippets);
      setSources(res.snippets);
    }

    const fallback = [
      `Here's a straight path for ${debtName || 'this matter'}:`,
      '',
      ...quickSteps.map((s, i) => `${i + 1}. ${s.label} — tap a chip above or open a resource link for the full move.`),
      '',
      `Letters to draw next: ${recommended.map((s) => s!.title).join(' → ') || (mode === 'court' ? 'Affidavit of Dispute' : mode === 'foreclosure' ? 'RESPA QWR' : mode === 'repossession' ? 'Wrongful Repo Demand' : 'Debt Validation Request')}.`,
      '',
      'Open Escalations when they ignore you: /portal/escalations',
    ].join('\n');

    try {
      if (!isFeatureEnabled('aiGateway')) throw new Error('AI off');
      const res = await callAiGateway({
        taskType,
        responseFormat: 'text',
        messages: [
          {
            role: 'system',
            content: `${systemPrompt}

Write like a sharp human coach — warm, direct, no legalese walls. Use numbered steps. Include markdown links [label](url) to official sources when citing law or filing portals. End with one clear "do this next" action. Educational only.`,
          },
          {
            role: 'user',
            content: [
              `Scenario: ${scenario}`,
              `Matter: ${debtName || 'unknown'}`,
              caseNumber ? `Case: ${caseNumber}` : '',
              stateJurisdiction ? `State: ${stateJurisdiction}` : '',
              `Recommended letters: ${recommended.map((s) => s!.title).join(', ') || 'none'}`,
              researchBlock ? `\nWEB / OFFICIAL SOURCES:\n${researchBlock}` : '',
              `\nQuestion: ${q}`,
            ]
              .filter(Boolean)
              .join('\n'),
          },
        ],
      });
      setAnswer(res.text.trim() || fallback);
      if (researchSnippets.length) setSources(researchSnippets);
    } catch {
      setAnswer(fallback);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!injectPrompt?.trim()) return;
    void ask(injectPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per injected prompt from parent
  }, [injectPrompt]);

  const triggerBtnClass =
    accent === 'emerald'
      ? 'inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-100 hover:bg-emerald-500/15 transition-all disabled:opacity-60'
      : accent === 'fuchsia'
        ? FINELY_OS_AI_DRAFT_BTN_SM
        : accent === 'amber'
          ? 'inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-amber-100 hover:bg-amber-500/15 transition-all disabled:opacity-60'
          : accent === 'rose'
            ? 'inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-rose-100 hover:bg-rose-500/15 transition-all disabled:opacity-60'
            : accent === 'sky'
              ? 'inline-flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-sky-100 hover:bg-sky-500/15 transition-all disabled:opacity-60'
              : FINELY_OS_AI_DRAFT_BTN_SM;

  const borderAccent =
    accent === 'emerald'
      ? 'border-emerald-400/20'
      : accent === 'fuchsia'
        ? 'border-fuchsia-400/20'
        : accent === 'amber'
          ? 'border-amber-400/20'
          : accent === 'rose'
            ? 'border-rose-400/20'
            : accent === 'sky'
              ? 'border-sky-400/20'
              : 'border-violet-400/20';

  const coachBody = (
    <div className="space-y-3">
      <OnDutyStaffCoachHeader lane={coachLane ?? mode} compact />
      <FinelyOsOnPageCoachShell
        accent={glowAccent}
        kicker={title}
        title={tagline}
        chips={coachChips}
        onChipSelect={(chip) => void ask(chip.prompt)}
        visibleChipCount={5}
        headerExtra={
          <button
            type="button"
            onClick={() => setWebOn((v) => !v)}
            className={`${FINELY_OS_AI_DRAFT_BTN_SM} ${webOn ? '' : 'opacity-60'}`}
          >
            <Globe size={12} /> {webOn ? 'Web on' : 'Web off'}
          </button>
        }
        composer={
          <>
            <LegalResourceStrip links={resources} accentClass={accentText} />
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              className={finelyOsGlowTextarea(glowAccent)}
              data-fc-coach-composer="1"
              placeholder="Ask your coach…"
            />
            <button type="button" onClick={() => void ask()} disabled={busy || !question.trim()} className={FINELY_OS_AI_DRAFT_BTN_SM}>
              <Send size={12} /> {busy ? 'Thinking…' : 'Get next steps'}
            </button>
            {answer ? (
              <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                <DebtCoachMessage text={answer} accentClass="text-sky-300 hover:brightness-110" />
              </div>
            ) : null}
            {sources.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {sources.map((s) => (
                  <a key={s.link} href={s.link} target="_blank" rel="noopener noreferrer" className={`text-[10px] font-semibold ${accentText} underline`}>
                    {s.title.slice(0, 36)}
                  </a>
                ))}
              </div>
            ) : null}
          </>
        }
        footer={
          scenarioInfo?.legalWarning ? (
            <p className={`text-xs ${FINELY_OS_ENTITY_BODY} rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2`}>
              {scenarioInfo.legalWarning}
            </p>
          ) : null
        }
      />
    </div>
  );

  if (modalLaunch) {
    return (
      <>
        <button type="button" className={triggerBtnClass} onClick={() => setModalOpen(true)}>
          <MessageSquare size={14} />
          {modalLaunch.triggerLabel}
        </button>

        {modalOpen
          ? createPortal(
              <div className={`${FINELY_OS_FIXED_OVERLAY} z-[9100] flex items-center justify-center p-3 sm:p-4`}>
                <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setModalOpen(false)} aria-hidden />
                <div
                  className={`${FINELY_OS_MODAL_SHELL} relative z-[1] w-full max-w-2xl ${borderAccent}`}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="debt-coach-modal-title"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
                    <div className="min-w-0 flex items-start gap-2">
                      {icon}
                      <div>
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>{title}</div>
                        <div id="debt-coach-modal-title" className="text-lg font-bold text-white">
                          {tagline}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className={`${FINELY_OS_SECONDARY_BTN} !p-2`}
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="p-4 max-h-[72vh] overflow-y-auto">{coachBody}</div>
                </div>
              </div>,
              document.body,
            )
          : null}
      </>
    );
  }

  return coachBody;
}
