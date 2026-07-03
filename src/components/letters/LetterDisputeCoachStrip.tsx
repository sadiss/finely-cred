import React, { useState } from 'react';
import { Loader2, MessageSquare, Sparkles } from 'lucide-react';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { converseWithFinelyAi } from '../../lib/conversationalAi';
import { openCommunicationHub } from '../chat/communicationHubModel';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  finelyOsMessageBubble,
} from '../../features/os/finelyOsLightUi';

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
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [reply, setReply] = useState<string | null>(null);

  const chips = DISPUTE_SUGGESTIONS.map((s) => {
    if (!bureau) return s;
    return s.replace(' on this tradeline', ` on ${bureau}`).replace('first?', `first on ${bureau}?`);
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

  return (
    <div className={`${finelyOsCatalogCard('violet')} !p-4 space-y-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-violet-300" />
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Dispute letter coach</span>
        </div>
        <button
          type="button"
          className={FINELY_OS_SECONDARY_BTN}
          onClick={() => openCommunicationHub({ tab: 'ai', expanded: true })}
        >
          Open full coach
        </button>
      </div>
      <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
        Tap a suggestion or ask a question — get help with reasons, evidence, and compliant wording while you draft
        {bureau ? ` for ${bureau}` : ''}.
      </p>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            disabled={busy}
            onClick={() => void askCoach(chip)}
          >
            {chip}
          </button>
        ))}
      </div>
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
        />
        <button
          type="button"
          className={FINELY_OS_PRIMARY_BTN}
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
    </div>
  );
}
