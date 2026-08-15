import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bot,
  CheckCircle2,
  Circle,
  ExternalLink,
  FlaskConical,
  Loader2,
  Mail,
  RefreshCw,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { DeveloperSandboxBanner } from '../../components/developer/DeveloperSandboxBanner';
import { DeveloperQaGuidePanel } from './DeveloperQaGuidePanel';
import { FinelyOsAIChatPanel, type FinelyOsChatMessage } from '../os/FinelyOsAIChatPanel';
import { FinelyOsOverviewStatTile } from '../os/FinelyOsOverviewStatTile';
import { callAiGateway } from '../../lib/aiClient';
import { getMailProviderStatus } from '../../lib/mailerClient';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { nowIso } from '../../domain/partners';
import {
  DEVELOPER_QA_AI_PROMPTS,
  DEVELOPER_QA_CHECKLIST,
  DEVELOPER_QA_LANES,
} from './developerQaConfig';
import {
  readDeveloperQaProgress,
  resetDeveloperQaSession,
  subscribeDeveloperQaProgress,
  toggleDeveloperQaCheck,
  type DeveloperQaProgress,
} from './developerQaProgress';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsDeckTile,
} from '../os/finelyOsLightUi';

function progressSnapshot(): DeveloperQaProgress {
  return readDeveloperQaProgress();
}

const DEVELOPER_AI_SYSTEM = `You are Finely Cred's Developer QA Copilot — an expert launch engineer helping Sadiss test the full platform before production.

You know:
- Developer sandbox: email/SMS redirect via EDGE_SANDBOX_EMAIL / EDGE_SANDBOX_SMS
- Physical mail: MAIL_TEST_MODE required; live mail blocked for developer tier when MAIL_LIVE_MODE
- LetterStream job names: PartnerFirst_Recipient (e.g. Yoli_TransUnion), 8-20 chars
- Mail quote fix: one live preauth per selected class, not three
- Partner view-as: admin/partners → View as partner
- QA hub lanes: partners, mail, cases, comms, growth, AI ops agent

Give numbered steps, link internal routes like /admin/partners, /developer, /admin/mail.
Be concise, actionable, senior-simple. Never say "client" — say partner.`;

export function DeveloperQaCommandCenter() {
  const navigate = useNavigate();
  const progress = useSyncExternalStore(subscribeDeveloperQaProgress, progressSnapshot, progressSnapshot);

  const [mailStatus, setMailStatus] = useState<{ ok: boolean; testMode: boolean; message?: string; loading: boolean }>({
    ok: false,
    testMode: false,
    loading: true,
  });
  const [aiMessages, setAiMessages] = useState<FinelyOsChatMessage[]>([]);
  const [aiDraft, setAiDraft] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const doneCount = useMemo(() => Object.values(progress.completed).filter(Boolean).length, [progress.completed]);
  const checklistTotal = DEVELOPER_QA_CHECKLIST.length;

  const refreshMailStatus = useCallback(async () => {
    setMailStatus((s) => ({ ...s, loading: true }));
    try {
      if (!isFeatureEnabled('letterMailing')) {
        setMailStatus({ ok: false, testMode: false, message: 'Letter mailing feature flag off', loading: false });
        return;
      }
      const st = await getMailProviderStatus();
      setMailStatus({
        ok: st.ok,
        testMode: st.testMode,
        message: st.message || st.error,
        loading: false,
      });
    } catch (e) {
      setMailStatus({ ok: false, testMode: false, message: (e as Error).message, loading: false });
    }
  }, []);

  useEffect(() => {
    void refreshMailStatus();
  }, [refreshMailStatus]);

  const sendAi = async (prompt: string) => {
    const p = prompt.trim();
    if (!p) return;
    setAiError(null);
    setAiBusy(true);
    const userMsg: FinelyOsChatMessage = { role: 'user', content: p, createdAt: nowIso() };
    setAiMessages((m) => [...m, userMsg]);
    setAiDraft('');
    try {
      if (!isFeatureEnabled('aiGateway')) {
        throw new Error('Enable AI Gateway in Admin Settings → Features.');
      }
      const res = await callAiGateway({
        taskType: 'developer.qa_copilot',
        providerHint: 'anthropic',
        responseFormat: 'text',
        messages: [
          { role: 'system', content: DEVELOPER_AI_SYSTEM },
          ...[...aiMessages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        ],
        context: { route: '/developer', qaScore: progress.sessionScore, allTimeHigh: progress.allTimeHigh },
      });
      setAiMessages((m) => [
        ...m,
        { role: 'assistant', content: String(res.text || '').trim() || '(no response)', createdAt: nowIso() },
      ]);
    } catch (e) {
      setAiError((e as Error).message || 'AI request failed');
    } finally {
      setAiBusy(false);
    }
  };

  const lanesByCategory = useMemo(() => {
    const groups: Record<string, typeof DEVELOPER_QA_LANES> = {};
    for (const lane of DEVELOPER_QA_LANES) {
      groups[lane.category] = groups[lane.category] ?? [];
      groups[lane.category].push(lane);
    }
    return groups;
  }, []);

  const categoryLabels: Record<string, string> = {
    core: 'Core launch paths',
    comms: 'Email & messages',
    ai: 'AI & intelligence',
    marketing: 'Marketing & growth',
    ops: 'Ops & settings',
  };

  const categoryAccents: Array<'emerald' | 'violet' | 'sky' | 'rose'> = ['emerald', 'violet', 'sky', 'rose'];

  return (
    <div className={FINELY_OS_COMPACT_PAGE}>
      <DeveloperSandboxBanner />

      <DeveloperQaGuidePanel />

      {/* Hero + all-time high */}
      <section className={`${finelyOsCatalogCardCompact('violet')} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.15),transparent_55%)] pointer-events-none" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Developer QA · AI command center</p>
            <h2 className={`${FINELY_OS_ENTITY_TITLE} mt-1`}>Launch test bench</h2>
            <p className={`${FINELY_OS_ENTITY_BODY} mt-2 max-w-2xl`}>
              Full product access with sandbox guardrails — create partners, run letters, mail, email, SMS, marketing, and AI
              flows exactly like production.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/admin/partners')}>
              <Zap size={14} /> Start QA run
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => resetDeveloperQaSession()}>
              <RefreshCw size={14} /> Reset session
            </button>
          </div>
        </div>
      </section>

      {/* Scoreboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <FinelyOsOverviewStatTile
          icon={Trophy}
          label="Session score"
          value={`${progress.sessionScore}%`}
          hint={`${doneCount}/${checklistTotal} checks`}
          accent="emerald"
        />
        <FinelyOsOverviewStatTile
          icon={Sparkles}
          label="All-time high"
          value={`${progress.allTimeHigh}%`}
          hint="Best QA session"
          accent="violet"
        />
        <FinelyOsOverviewStatTile
          icon={RefreshCw}
          label="QA runs"
          value={String(progress.runsCompleted)}
          hint="Sessions reset"
          accent="sky"
        />
        <FinelyOsOverviewStatTile
          icon={Mail}
          label="Mail provider"
          value={mailStatus.loading ? '…' : mailStatus.ok ? 'Online' : 'Check'}
          hint={mailStatus.testMode ? 'Test mode' : mailStatus.message?.slice(0, 40) || 'LetterStream'}
          accent={mailStatus.ok && mailStatus.testMode ? 'emerald' : 'rose'}
        />
      </div>

      {/* AI Copilot */}
      <section className={finelyOsCatalogCardCompact('sky')}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-violet-300" />
          <h3 className="text-white/90 font-semibold">AI QA copilot</h3>
        </div>
        <FinelyOsAIChatPanel
          icon={Bot}
          title="Developer QA AI"
          subtitle="Launch engineer · mail, letters, partners, sandbox comms"
          messages={aiMessages}
          draft={aiDraft}
          onDraftChange={setAiDraft}
          onSend={() => void sendAi(aiDraft)}
          busy={aiBusy}
          error={aiError}
          placeholder="Ask how to test mail, letters, partners, AI features…"
          quickPrompts={DEVELOPER_QA_AI_PROMPTS}
          onQuickPrompt={(p) => void sendAi(p)}
          footerHint="Powered by AI Gateway · developer.qa_copilot"
        />
      </section>

      {/* Interactive checklist */}
      <section className={finelyOsCatalogCardCompact('emerald')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-emerald-300" />
            <h3 className="text-white/90 font-semibold">Launch checklist</h3>
          </div>
          <span className="text-xs text-white/50 font-mono">
            {doneCount}/{checklistTotal} complete
          </span>
        </div>
        <ul className="mt-3 space-y-2">
          {DEVELOPER_QA_CHECKLIST.map((item) => {
            const done = Boolean(progress.completed[item.id]);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggleDeveloperQaCheck(item.id)}
                  className={`w-full flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                    done
                      ? 'border-emerald-400/40 bg-emerald-500/10'
                      : 'border-white/10 bg-black/20 hover:bg-black/30'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle size={18} className="text-white/35 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-white/90">{item.label}</div>
                    <div className="text-xs text-white/50 mt-0.5">{item.hint}</div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Tool lanes by category */}
      {Object.entries(lanesByCategory).map(([cat, lanes], idx) => (
        <section key={cat} className="space-y-3">
          <p className={FINELY_OS_ENTITY_SUBLABEL}>{categoryLabels[cat] || cat}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lanes.map((lane) => {
              const Icon = lane.icon;
              return (
                <Link
                  key={lane.id}
                  to={lane.href}
                  className={`${finelyOsDeckTile(lane.accent === 'navy' ? 'sky' : lane.accent)} block hover:brightness-110 transition-all group`}
                >
                  <div className="flex items-start gap-3">
                    <Icon size={20} className="text-white/70 shrink-0 mt-0.5 group-hover:text-white/90" />
                    <div className="min-w-0">
                      <h4 className="text-white/90 font-semibold text-sm">{lane.title}</h4>
                      <p className="text-white/55 text-xs mt-1 line-clamp-2">{lane.detail}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {/* Mail health strip */}
      <section className={finelyOsCatalogCardCompact('rose')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-rose-300" />
            <div>
              <h3 className="text-white/90 font-semibold text-sm">LetterStream health</h3>
              <p className="text-xs text-white/55 mt-0.5">
                {mailStatus.loading ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> Checking…
                  </span>
                ) : (
                  mailStatus.message || (mailStatus.ok ? 'Reachable' : 'Unreachable')
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void refreshMailStatus()}>
              <RefreshCw size={14} /> Ping
            </button>
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/admin/mail')}>
              Open mail queue
            </button>
          </div>
        </div>
      </section>

      {/* Docs link */}
      <div className="flex flex-wrap gap-2">
        <a
          href="/docs/plans/developer-qa-role.md"
          target="_blank"
          rel="noopener noreferrer"
          className={FINELY_OS_SECONDARY_BTN}
        >
          <ExternalLink size={14} /> Full QA plan
        </a>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/account/settings?tab=security')}>
          <FlaskConical size={14} /> Reset password
        </button>
      </div>
    </div>
  );
}
