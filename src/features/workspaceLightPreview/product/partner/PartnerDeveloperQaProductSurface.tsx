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
import { useAuth } from '../../../../auth/AuthProvider';
import { isAdminEmail } from '../../../../auth/admin';
import { isDeveloperQaOnly } from '../../../../auth/staffIdentity';
import { DeveloperSandboxBanner } from '../../../../components/developer/DeveloperSandboxBanner';
import { FinelyOsAIChatPanel, type FinelyOsChatMessage } from '../../../os/FinelyOsAIChatPanel';
import { FinelyOsAlertBanner } from '../../../os/FinelyOsAlertBanner';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsDeckTile,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import { callAiGateway } from '../../../../lib/aiClient';
import { getMailProviderStatus } from '../../../../lib/mailerClient';
import { isFeatureEnabled } from '../../../../data/settingsRepo';
import { nowIso } from '../../../../domain/partners';
import {
  DEVELOPER_QA_AI_PROMPTS,
  DEVELOPER_QA_CHECKLIST,
  DEVELOPER_QA_LANES,
} from '../../../developer/developerQaConfig';
import {
  readDeveloperQaProgress,
  resetDeveloperQaSession,
  subscribeDeveloperQaProgress,
  toggleDeveloperQaCheck,
} from '../../../developer/developerQaProgress';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductEmptyState } from '../components/ProductUi';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import './partnerDeveloperQaSurface.css';

const ACCENT_CYCLE: Array<'emerald' | 'violet' | 'sky' | 'rose'> = ['emerald', 'violet', 'sky', 'rose'];

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

export default function PartnerDeveloperQaProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || '').trim();
  const isAdmin = isAdminEmail(email);
  const isDeveloper = isDeveloperQaOnly(email);

  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const archetype = getWorkspaceProductArchetype('partner', pageId);
  const accent = navItem?.accent ?? 'violet';

  const progress = useSyncExternalStore(subscribeDeveloperQaProgress, readDeveloperQaProgress, readDeveloperQaProgress);

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

  const priorityLanes = useMemo(() => DEVELOPER_QA_LANES.slice(0, 8), []);

  if (!email) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Developer"
        title="Sign in required"
        description="Developer QA accounts land here after sign-in."
        accent={accent}
        surfaceMode={navItem?.surfaceMode ?? 'studio'}
        archetype={archetype}
        primaryAction={<ProductPagePrimaryAction label="Sign in" onClick={() => navigate('/login')} />}
      >
        <ProductEmptyState
          title="Sign in to open the QA bench"
          description="Use your developer allowlist email to access the launch command center."
          action={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
              Sign in
            </button>
          }
        />
      </ProductHubScaffold>
    );
  }

  if (!isAdmin && !isDeveloper) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Developer"
        title="Not authorized"
        description="This bench is for developer QA allowlist accounts."
        accent={accent}
        surfaceMode={navItem?.surfaceMode ?? 'studio'}
        archetype={archetype}
      >
        <ProductEmptyState
          title="Developer access required"
          description="Ask an owner to add your email to VITE_DEVELOPER_EMAILS and EDGE_DEVELOPER_EMAILS."
        />
      </ProductHubScaffold>
    );
  }

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow={isAdmin ? 'Admin preview' : 'Developer QA'}
      title="Launch QA control room"
      description="Status monitors, checklist queue, AI copilot, and quick lanes — everything on one command floor."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon ?? FlaskConical}
      status={`${progress.sessionScore}% session · ${doneCount}/${checklistTotal} checks`}
      freshness="live bench"
      primaryAction={
        <ProductPagePrimaryAction label="Start QA run" onClick={() => navigate('/admin/partners')} />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => resetDeveloperQaSession()}>
          <RefreshCw size={14} /> Reset session
        </button>
      }
      metrics={[
        { label: 'Session', value: `${progress.sessionScore}%`, hint: `${doneCount}/${checklistTotal} checks`, accent: 'emerald' },
        { label: 'All-time', value: `${progress.allTimeHigh}%`, hint: 'Best QA session', accent: 'violet' },
        { label: 'Runs', value: String(progress.runsCompleted), hint: 'Sessions reset', accent: 'sky' },
        {
          label: 'Mail',
          value: mailStatus.loading ? '…' : mailStatus.ok ? 'Online' : 'Check',
          hint: mailStatus.testMode ? 'Test mode' : 'LetterStream',
          accent: mailStatus.ok && mailStatus.testMode ? 'emerald' : 'rose',
        },
      ]}
      metricTitle="Control room status"
      metricDescription="Monitors refresh live — checklist and lanes stay on the command floor."
      metricsVariant="instrument"
    >
      <section className="fc-qa-control-room" data-surface-layout="control-room">
        <div className="fc-qa-alert-rail">
          <DeveloperSandboxBanner />
          {isAdmin ? (
            <FinelyOsAlertBanner
              tone="info"
              message="You are previewing the developer QA bench as an admin. Sadiss lands here automatically after sign-in."
            />
          ) : null}
        </div>

        <div className="fc-qa-monitor-grid">
          {[
            { label: 'Session score', value: `${progress.sessionScore}%`, hint: `${doneCount}/${checklistTotal} checks`, accent: 'emerald' as const, icon: Trophy },
            { label: 'All-time best', value: `${progress.allTimeHigh}%`, hint: 'Peak QA session', accent: 'violet' as const, icon: Sparkles },
            { label: 'Runs completed', value: String(progress.runsCompleted), hint: 'Reset sessions', accent: 'sky' as const, icon: RefreshCw },
            {
              label: 'LetterStream',
              value: mailStatus.loading ? '…' : mailStatus.ok ? 'Online' : 'Check',
              hint: mailStatus.testMode ? 'Test mode' : mailStatus.message || 'Provider',
              accent: (mailStatus.ok && mailStatus.testMode ? 'emerald' : 'rose') as 'emerald' | 'rose',
              icon: Mail,
            },
          ].map((monitor) => {
            const Icon = monitor.icon;
            return (
              <div
                key={monitor.label}
                className={`fc-qa-monitor ${finelyOsCatalogCard(monitor.accent)}`}
                data-fc-accent={monitor.accent}
              >
                <div className="fc-qa-monitor-label inline-flex items-center gap-2">
                  <Icon size={14} /> {monitor.label}
                </div>
                <div className={`fc-qa-monitor-value ${FINELY_OS_ENTITY_VALUE}`}>{monitor.value}</div>
                <div className={`fc-qa-monitor-hint ${FINELY_OS_ENTITY_BODY}`}>{monitor.hint}</div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/admin/partners')}>
            <Zap size={14} /> Start QA run
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void refreshMailStatus()}>
            <RefreshCw size={14} /> Ping mail
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/mail')}>
            <Mail size={14} /> Mail queue
          </button>
        </div>

        <div className="fc-qa-control-body">
          <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>Check queue</p>
                <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Launch checklist</h2>
              </div>
              <span className="text-sm font-mono font-bold text-white/50">
                {doneCount}/{checklistTotal}
              </span>
            </div>
            <div className="fc-qa-check-queue">
              {DEVELOPER_QA_CHECKLIST.map((item) => {
                const done = Boolean(progress.completed[item.id]);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleDeveloperQaCheck(item.id)}
                    className="fc-qa-check-row"
                    data-done={done ? 'true' : undefined}
                  >
                    {done ? (
                      <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle size={20} className="text-white/35 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className={`text-base font-bold text-[color:var(--fc-os-entity-ink)]`}>{item.label}</div>
                      <div className={`text-sm font-bold mt-0.5 text-[color:var(--fc-os-entity-muted)]`}>{item.hint}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`${finelyOsCatalogCard('sky')} p-5 lg:p-6 min-h-[560px]`} data-fc-accent="sky">
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
          </div>

          <aside className="space-y-4">
            <div className={`${finelyOsCatalogCard('rose')} p-5 lg:p-6 space-y-3`} data-fc-accent="rose">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-rose-300" />
                <div>
                  <h3 className={`text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Mail health</h3>
                  <p className={`text-sm font-bold mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>
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
                <span className={finelyOsStatusChip(mailStatus.ok ? 'ok' : 'warn')}>
                  {mailStatus.testMode ? 'Test mode' : mailStatus.ok ? 'Online' : 'Check provider'}
                </span>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void refreshMailStatus()}>
                  <RefreshCw size={14} /> Ping
                </button>
              </div>
            </div>

            <div className={`${finelyOsCatalogCard('emerald')} p-5 lg:p-6 space-y-3`} data-fc-accent="emerald">
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Quick lanes</p>
              <div className="fc-qa-lane-stack">
                {priorityLanes.map((lane, index) => {
                  const Icon = lane.icon;
                  const laneAccent = lane.accent === 'navy' ? 'sky' : lane.accent;
                  return (
                    <Link
                      key={lane.id}
                      to={lane.href}
                      className={`${finelyOsDeckTile(laneAccent)} block hover:brightness-110 transition-all group p-4`}
                      data-fcm-accent={ACCENT_CYCLE[index % 4]}
                    >
                      <div className="flex items-start gap-3">
                        <Icon size={18} className="shrink-0 mt-0.5 text-[color:var(--fc-os-entity-muted)] group-hover:text-[color:var(--fc-os-entity-ink)]" />
                        <div className="min-w-0">
                          <h4 className={`font-bold text-base text-[color:var(--fc-os-entity-ink)]`}>{lane.title}</h4>
                          <p className={`text-sm font-bold mt-0.5 line-clamp-2 text-[color:var(--fc-os-entity-muted)]`}>{lane.detail}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

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
          </aside>
        </div>
      </section>
    </ProductHubScaffold>
  );
}
