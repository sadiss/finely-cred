import React, { useMemo, useState } from 'react';
import { Film, MessageCircle, Mic, MicOff, Volume2, Users } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { resolveFinelyPageContext, finelyBrainOrchestrate, pickPersonaForRoute } from '../../lib/finelyBrain/finelyBrainOrchestrate';
import { FinelyTourPlayer } from './FinelyTourPlayer';
import { useFinelyVoiceInput, speakFinelyText } from '../../hooks/useFinelyVoiceInput';
import { appendAiActionAudit } from '../../data/aiActionAuditLog';
import { openPublicChat } from '../../lib/publicChatEvents';
import { FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN } from '../../features/os/finelyOsLightUi';

export function FinelyLaunchHelpStrip() {
  const { pathname } = useLocation();
  const ctx = useMemo(() => resolveFinelyPageContext(pathname), [pathname]);
  const [tourOpen, setTourOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [askInput, setAskInput] = useState('');
  const [askReply, setAskReply] = useState<string | null>(null);
  const [seniorMode, setSeniorMode] = useState(true);

  const show =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/portal') ||
    pathname.startsWith('/business') ||
    pathname.startsWith('/credit-specialist') ||
    pathname.startsWith('/resources') ||
    pathname.startsWith('/start-here') ||
    pathname.startsWith('/help-center') ||
    pathname.startsWith('/affiliate') ||
    pathname.startsWith('/fundability-readiness') ||
    pathname.startsWith('/personal-credit') ||
    pathname.startsWith('/enlightenment-session') ||
    pathname.startsWith('/consultation') ||
    pathname.startsWith('/onboarding') ||
    pathname === '/';

  const voice = useFinelyVoiceInput((text) => setAskInput(text));

  if (!show) return null;

  const runAsk = () => {
    const msg = askInput.trim() || 'What should I do on this page?';
    const result = finelyBrainOrchestrate({ pathname, userMessage: msg, seniorMode });
    setAskReply(result.reply);
    appendAiActionAudit({
      kind: 'brain_ask',
      action: 'Ask Finely',
      detail: msg.slice(0, 120),
      status: 'info',
      meta: { personaId: result.personaId, sopId: result.sopId, tourId: result.tourId },
    });
    if (result.tourId && (msg.toLowerCase().includes('video') || msg.toLowerCase().includes('watch'))) {
      setTourOpen(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-6 z-[165] flex max-w-[min(100vw-2rem,420px)] flex-col gap-2">
        {ctx.tour ? (
          <button
            type="button"
            className={`fc-senior-tap-target fc-senior-simple ${FINELY_OS_PRIMARY_BTN} !text-base !py-4 !px-5 justify-center shadow-lg`}
            onClick={() => setTourOpen(true)}
          >
            <Film size={20} /> Watch how
          </button>
        ) : null}
        <button
          type="button"
          className={`fc-senior-tap-target fc-senior-simple ${FINELY_OS_SECONDARY_BTN} !text-base !py-3 !px-5 justify-center`}
          onClick={() => setAskOpen((v) => !v)}
        >
          <MessageCircle size={18} /> Ask Finely
        </button>

        {askOpen ? (
          <div className="fc-senior-simple fc-light-glass-panel fc-light-chrome-panel rounded-2xl border p-4 shadow-xl space-y-3">
            <p className="text-base font-semibold">Ask in plain English</p>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={seniorMode} onChange={(e) => setSeniorMode(e.target.checked)} />
              Easy read mode (short sentences)
            </label>
            <div className="flex gap-2">
              <input
                value={askInput}
                onChange={(e) => setAskInput(e.target.value)}
                placeholder="What should I do here?"
                className="fc-senior-simple flex-1 rounded-xl border px-4 py-3 text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runAsk();
                }}
              />
              {voice.supported ? (
                <button
                  type="button"
                  className={`${FINELY_OS_SECONDARY_BTN} !px-3`}
                  title={voice.listening ? 'Stop listening' : 'Speak your question'}
                  onClick={() => (voice.listening ? voice.stop() : voice.start())}
                >
                  {voice.listening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={`flex-1 ${FINELY_OS_PRIMARY_BTN} !py-3 !text-sm`} onClick={runAsk}>
                Get answer
              </button>
              {askReply ? (
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  title="Read answer aloud"
                  onClick={() => speakFinelyText(askReply)}
                >
                  <Volume2 size={16} />
                </button>
              ) : null}
            </div>
            {askReply ? <p className="text-base leading-relaxed opacity-90">{askReply}</p> : null}
            <button
              type="button"
              className={`w-full ${FINELY_OS_SECONDARY_BTN} !text-sm`}
              onClick={() =>
                openPublicChat({
                  personaId: pickPersonaForRoute(pathname),
                })
              }
            >
              <Users size={16} /> Talk to staff chat
            </button>
          </div>
        ) : null}
      </div>

      <FinelyTourPlayer tour={ctx.tour} open={tourOpen} onClose={() => setTourOpen(false)} />
    </>
  );
}
