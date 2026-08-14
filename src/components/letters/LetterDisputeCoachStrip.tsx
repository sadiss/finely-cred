import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, MessageSquare } from 'lucide-react';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { converseWithFinelyAi } from '../../lib/conversationalAi';
import { openCommunicationHub } from '../chat/communicationHubModel';
import { OnDutyStaffCoachHeader } from '../chat/OnDutyStaffCoachHeader';
import {
  FINELY_OS_AI_DRAFT_BTN_SM,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_HEADER,
  FINELY_OS_MODAL_SHELL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsMessageBubble,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../../features/os/FinelyOsModalCloseButton';
import { FinelyOsOnPageCoachShell, type FinelyOsCoachChip } from '../../features/os/FinelyOsOnPageCoachShell';

const DISPUTE_SUGGESTIONS = [
  'Which negative items should I dispute first?',
  'Draft a factual reason for this collection — not commanding language.',
  'What evidence should I attach for a late payment dispute?',
  'Explain Metro 2 fields that look wrong on this tradeline.',
  'Help me phrase Round 2 follow-up after no bureau response.',
  'What should I avoid saying in a dispute letter?',
];

const DISPUTE_COACH_SYSTEM = `You are Finely Cred's dispute letter coach inside Letter Studio. The user is drafting bureau dispute letters.

Be concise, practical, and compliance-minded. Focus on factual dispute reasons (what reports inaccurately), evidence to attach, sequencing rounds, and wording that avoids legal threats or commanding bureau language.

Do not provide legal advice. Suggest portal actions (evidence vault, dispute picker, reasons library) when helpful.`;

export function LetterDisputeCoachStrip({
  bureau,
  partnerId,
}: {
  bureau?: string;
  partnerId?: string;
}) {
  const enabled = isFeatureEnabled('aiGateway');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [reply, setReply] = useState<string | null>(null);

  const chips: FinelyOsCoachChip[] = DISPUTE_SUGGESTIONS.map((s, i) => {
    const prompt = !bureau
      ? s
      : s.replace(' on this tradeline', ` on ${bureau}`).replace('first?', `first on ${bureau}?`);
    const short = prompt.length > 52 ? `${prompt.slice(0, 49)}…` : prompt;
    return { id: `d-${i}`, label: short, prompt };
  });

  const askCoach = async (prompt: string) => {
    const text = prompt.trim();
    if (!text) return;
    setDraft(text);
    setErr(null);
    setReply(null);

    if (!enabled) {
      openCommunicationHub({ tab: 'ai', expanded: true });
      return;
    }

    setBusy(true);
    try {
      const result = await converseWithFinelyAi({
        userMessage: text,
        messages: [],
        systemPromptBase: DISPUTE_COACH_SYSTEM,
        taskType: 'letter_dispute_coach',
        context: {
          partnerId,
          pathname: '/portal/letters',
          surface: 'communication_hub',
        },
      });
      setReply(result.text?.trim() || 'No response — try rephrasing your question.');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Coach unavailable right now.');
    } finally {
      setBusy(false);
    }
  };

  const coachBody = (
    <div className="w-full space-y-3">
      <OnDutyStaffCoachHeader lane="dispute" subtitle="Dispute letter specialist — on shift for bureau questions." />
      <FinelyOsOnPageCoachShell
        accent="fuchsia"
        kicker="Letter studio coach"
        title="Dispute letter coach"
        subtitle={
          bureau
            ? `Tap a suggestion or ask about reasons, evidence, and compliant wording for ${bureau}.`
            : 'Tap a suggestion or ask about reasons, evidence, and compliant wording.'
        }
        chips={chips}
        onChipSelect={(chip) => void askCoach(chip.prompt)}
        headerExtra={
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => openCommunicationHub({ tab: 'ai', expanded: true })}>
            Full coach
          </button>
        }
        composer={
          <>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void askCoach(draft);
                  }
                }}
                placeholder="Ask about dispute strategy, reasons, or evidence…"
                className={`flex-1 ${FINELY_OS_ENTITY_INPUT}`}
                disabled={busy}
                data-fc-coach-composer="1"
              />
              <button
                type="button"
                className={FINELY_OS_AI_DRAFT_BTN_SM}
                disabled={!draft.trim() || busy}
                onClick={() => void askCoach(draft)}
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                {busy ? 'Thinking…' : 'Ask coach'}
              </button>
            </div>
            {err ? <div className="text-xs text-red-200/90">{err}</div> : null}
            {reply ? (
              <div className={`${finelyOsMessageBubble('assistant')} text-sm leading-relaxed whitespace-pre-wrap`}>{reply}</div>
            ) : null}
          </>
        }
      />
    </div>
  );

  return (
    <>
      <button type="button" className={FINELY_OS_AI_DRAFT_BTN_SM} onClick={() => setOpen(true)}>
        <MessageSquare size={14} />
        Ask dispute coach
      </button>

      {open
        ? createPortal(
            <div className={`${FINELY_OS_FIXED_OVERLAY} z-[9100] flex items-center justify-center p-3 sm:p-4`}>
              <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setOpen(false)} aria-hidden />
              <div
                className={`${FINELY_OS_MODAL_SHELL} relative z-[1] w-full max-w-2xl border-fuchsia-400/20`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="letter-dispute-coach-title"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={FINELY_OS_MODAL_HEADER}>
                  <div className="min-w-0">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Letter studio</div>
                    <div id="letter-dispute-coach-title" className="text-lg font-bold text-white">
                      Dispute letter coach
                    </div>
                  </div>
                  <FinelyOsModalCloseButton onClick={() => setOpen(false)} />
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
