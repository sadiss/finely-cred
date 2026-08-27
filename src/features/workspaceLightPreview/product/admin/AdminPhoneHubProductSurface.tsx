import React, { useMemo, useState } from 'react';
import { Inbox, MessageSquare, Phone, PhoneCall, Settings, Users, Voicemail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PHONE_AGENT_ROUTES, PHONE_HUB_FEATURES, resolvePhoneRoute } from '../../../../domain/phoneSystem';
import { isFeatureEnabled, getCommsSettings } from '../../../../data/settingsRepo';
import { sendSms } from '../../../../lib/commsDeliveryClient';
import { addAuditEvent } from '../../../../data/auditRepo';
import {
  appendPhoneMessage,
  getPhoneOpsSnapshot,
  listMissedCalls,
  listPhoneCalls,
  listPhoneThreads,
  logPhoneCall,
  upsertPhoneThread,
} from '../../../../data/phoneThreadsRepo';
import {
  simulateInboundSms,
  simulateInboundVoicemail,
  syncPhoneInboxFromEdge,
} from '../../../../lib/phoneInboxSync';
import { buildPhoneQueueBriefing, buildVoicemailSummaryPrompt } from '../../../../lib/phoneVoicemailOps';
import { PhoneProductionSetupPanel } from '../../../../components/phone/PhoneProductionSetupPanel';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  finelyOsCatalogCard,
  finelyOsGlowField,
  finelyOsGlowTextarea,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import { CO_OWNER_IDENTITY } from '../../../../domain/coOwnerPersona';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import './adminPhoneHubProductSurface.css';

type Lane = 'dialer' | 'threads' | 'setup' | 'escalate';

const LANE_META: Array<{
  id: Lane;
  label: string;
  purpose: string;
  icon: typeof PhoneCall;
  accent: 'sky' | 'emerald' | 'violet' | 'rose';
  metricKey: 'threads' | 'calls' | 'missed' | 'routes';
}> = [
  { id: 'dialer', label: 'Dialer', purpose: 'Outbound calls and SMS', icon: PhoneCall, accent: 'sky', metricKey: 'routes' },
  { id: 'threads', label: 'Threads', purpose: 'Inbox and call log', icon: Inbox, accent: 'emerald', metricKey: 'threads' },
  { id: 'setup', label: 'Production setup', purpose: 'Twilio and routing', icon: Settings, accent: 'violet', metricKey: 'calls' },
  { id: 'escalate', label: 'Escalation', purpose: 'Voicemail and features', icon: Voicemail, accent: 'rose', metricKey: 'missed' },
];

export default function AdminPhoneHubProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'sky';
  const [lane, setLane] = useState<Lane>('dialer');
  const [dial, setDial] = useState('');
  const [smsBody, setSmsBody] = useState('');
  const [interest, setInterest] = useState('general');
  const [busy, setBusy] = useState<'call' | 'sms' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [syncBusy, setSyncBusy] = useState(false);
  const [simulateFrom, setSimulateFrom] = useState('+15551234567');
  const [simulateBody, setSimulateBody] = useState('Hi, I need help with my credit report.');
  const commsOn = isFeatureEnabled('commsDelivery');
  const twilioFrom = getCommsSettings().twilioFromPhone ?? '(configure in Settings)';

  const phoneSnap = useMemo(() => {
    void refreshKey;
    return getPhoneOpsSnapshot();
  }, [refreshKey]);
  const threads = useMemo(() => {
    void refreshKey;
    return listPhoneThreads().slice(0, 8);
  }, [refreshKey]);
  const recentCalls = useMemo(() => {
    void refreshKey;
    return listPhoneCalls(6);
  }, [refreshKey]);
  const missed = useMemo(() => {
    void refreshKey;
    return listMissedCalls().slice(0, 4);
  }, [refreshKey]);

  const route = resolvePhoneRoute({ channel: 'voice_out', interest });
  const dialE164 = dial.replace(/[^\d+]/g, '');

  const laneMetric = (key: 'threads' | 'calls' | 'missed' | 'routes') => {
    switch (key) {
      case 'threads':
        return String(phoneSnap.threadCount);
      case 'calls':
        return String(recentCalls.length);
      case 'missed':
        return String(phoneSnap.missedCalls);
      case 'routes':
        return String(PHONE_AGENT_ROUTES.length);
      default:
        return '—';
    }
  };

  const syncInbound = async () => {
    setSyncBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await syncPhoneInboxFromEdge();
      if (res.error) setError(res.error);
      else setNotice(res.imported ? `Synced ${res.imported} inbound event(s) from Twilio.` : 'No new inbound events.');
      setRefreshKey((k) => k + 1);
    } finally {
      setSyncBusy(false);
    }
  };

  const summarizeForCoOwner = () => {
    const briefing = buildPhoneQueueBriefing(
      missed.map((c) => ({ from: c.from, status: c.status, transcription: c.transcription })),
    );
    const firstVm = missed.find((c) => c.transcription);
    const prompt = firstVm?.transcription
      ? buildVoicemailSummaryPrompt({ from: firstVm.from, transcription: firstVm.transcription })
      : briefing;
    navigate('/admin/ops-agent', { state: { sagePrompt: prompt } });
  };

  const placeCall = async () => {
    setNotice(null);
    setError(null);
    if (!dialE164) {
      setError('Enter a valid phone number.');
      return;
    }
    setBusy('call');
    try {
      addAuditEvent({
        actorType: 'admin',
        action: 'phone.outbound',
        entityType: 'phone',
        meta: { to: dialE164, interest, personaId: route.personaId },
      });
      logPhoneCall({
        direction: 'outbound',
        from: twilioFrom.startsWith('(') ? '+10000000000' : twilioFrom,
        to: dialE164,
        status: 'completed',
        personaId: route.personaId,
      });
      window.open(`tel:${dialE164}`, '_self');
      setNotice(`Call initiated via device dialer → routed to ${route.label}. Log callback notes in CRM.`);
      setRefreshKey((k) => k + 1);
    } finally {
      setBusy(null);
    }
  };

  const sendText = async () => {
    setNotice(null);
    setError(null);
    if (!dialE164) {
      setError('Enter a valid phone number.');
      return;
    }
    if (!smsBody.trim()) {
      setError('Enter an SMS message.');
      return;
    }
    setBusy('sms');
    try {
      await sendSms({ toPhone: dialE164, body: smsBody.trim() });
      const thread = upsertPhoneThread({
        phoneE164: dialE164,
        channel: 'sms',
        assignedPersonaId: route.personaId,
      });
      appendPhoneMessage({ threadId: thread.id, direction: 'outbound', body: smsBody.trim() });
      addAuditEvent({
        actorType: 'admin',
        action: 'sms.outbound',
        entityType: 'phone',
        meta: { to: dialE164, interest },
      });
      setNotice(`SMS sent to ${dialE164} via Twilio.`);
      setSmsBody('');
      setRefreshKey((k) => k + 1);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'SMS send failed.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Delivery"
      title="Phone hub"
      description="Place outbound calls, send SMS, and review missed voicemails."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={<ProductPagePrimaryAction label="Open dialer" onClick={() => setLane('dialer')} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" disabled={syncBusy} onClick={() => void syncInbound()}>
          {syncBusy ? 'Syncing…' : 'Sync inbound'}
        </button>
      }
      metrics={[
        { label: 'Threads', value: String(phoneSnap.threadCount), hint: `${phoneSnap.unreadThreads} unread`, accent: 'sky', onClick: () => setLane('threads') },
        { label: 'Recent calls', value: String(recentCalls.length), hint: 'Last six logged', accent: 'violet', onClick: () => setLane('threads') },
        { label: 'Missed', value: String(phoneSnap.missedCalls), hint: 'Voicemail and missed', accent: 'rose', onClick: () => setLane('escalate') },
        { label: 'Routes', value: String(PHONE_AGENT_ROUTES.length), hint: 'Persona lanes', accent: 'emerald', onClick: () => setLane('dialer') },
      ]}
      metricTitle="Phone queue"
      metricDescription="Sync inbound events, then open threads or dial out with the right route."
    >
      <section className="fc-admin-phone-control" data-surface-layout="control-room">
        <div className={`${finelyOsCatalogCard('sky')} p-5 lg:p-6`} data-fc-accent="sky">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Control room pulse</p>
              <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                {phoneSnap.missedCalls
                  ? `${phoneSnap.missedCalls} missed call${phoneSnap.missedCalls === 1 ? '' : 's'} waiting — review the alert rail.`
                  : `${phoneSnap.threadCount} thread${phoneSnap.threadCount === 1 ? '' : 's'} on file — pick a lane to dial or reply.`}
              </p>
            </div>
            <span className={finelyOsStatusChip(phoneSnap.missedCalls ? 'warn' : 'ok')}>
              {phoneSnap.missedCalls ? 'Missed calls' : 'Lines clear'}
            </span>
          </div>
        </div>

        <div className="fc-admin-phone-layout">
          <aside className="fc-admin-phone-grid">
            <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Phone lanes</h2>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Status grid — each lane opens its inspector.</p>
            {LANE_META.map((item) => {
              const Icon = item.icon;
              const selected = lane === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-selected={selected ? 'true' : undefined}
                  className={`fc-admin-phone-lane fc-wlp-control-room-family ${finelyOsCatalogCard(item.accent)}`}
                  data-fc-accent={item.accent}
                  onClick={() => setLane(item.id)}
                >
                  <div className="fc-admin-phone-lane-head">
                    <Icon size={20} className="shrink-0 opacity-90" />
                    <span className={finelyOsStatusChip(selected ? 'ok' : 'warn')}>{selected ? 'Active' : 'Open'}</span>
                  </div>
                  <div className={`text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{item.label}</div>
                  <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{item.purpose}</p>
                  <div className="fc-admin-phone-lane-value">{laneMetric(item.metricKey)}</div>
                </button>
              );
            })}
          </aside>

          <div className="fc-admin-phone-inspector">
            <div className="fc-admin-phone-inspector-bed">
              {lane === 'dialer' ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Phone size={20} />
                    <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Desktop dialer</h2>
                  </div>
                  <p className={FINELY_OS_ENTITY_BODY}>Outbound calls and SMS route through Twilio.</p>
                  <div className="grid lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 space-y-4">
                      <input
                        value={dial}
                        onChange={(e) => setDial(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className={`${finelyOsGlowField('sky')} font-mono text-lg`}
                      />
                      <textarea
                        value={smsBody}
                        onChange={(e) => setSmsBody(e.target.value)}
                        placeholder="SMS message (for text send)…"
                        rows={4}
                        className={finelyOsGlowTextarea('violet')}
                      />
                      <select value={interest} onChange={(e) => setInterest(e.target.value)} className={finelyOsGlowField('emerald')}>
                        <option value="general">General intake</option>
                        <option value="debt">Debt / validation</option>
                        <option value="affiliate">Affiliate</option>
                        <option value="sales">Sales</option>
                      </select>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={FINELY_OS_PRIMARY_BTN}
                          disabled={!dialE164.trim() || busy === 'call'}
                          onClick={() => void placeCall()}
                        >
                          <PhoneCall size={14} /> {busy === 'call' ? 'Dialing…' : `Call (routes to ${route.label})`}
                        </button>
                        <button
                          type="button"
                          className={FINELY_OS_SECONDARY_BTN}
                          disabled={!commsOn || !dialE164.trim() || !smsBody.trim() || busy === 'sms'}
                          onClick={() => void sendText()}
                        >
                          <MessageSquare size={14} /> {busy === 'sms' ? 'Sending…' : 'Send SMS'}
                        </button>
                        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/settings')}>
                          <Settings size={14} /> Twilio settings
                        </button>
                      </div>
                      {!commsOn ? (
                        <p className={`${FINELY_OS_ENTITY_BODY} text-violet-700`}>Enable Comms Delivery in Admin Settings for live SMS.</p>
                      ) : null}
                      {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}
                      {error ? <div className={FINELY_OS_NOTICE_ERROR}>{error}</div> : null}
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>From number: {twilioFrom}</div>
                    </div>
                    <div className="lg:col-span-7 space-y-3">
                      <div className={`${FINELY_OS_ENTITY_VALUE} flex items-center gap-2 text-xl`}>
                        <Users size={20} /> Agent routing
                      </div>
                      {PHONE_AGENT_ROUTES.sort((a, b) => a.priority - b.priority).map((r, i) => (
                        <div key={r.id} className={`fc-admin-phone-route-row ${finelyOsCatalogCard((['violet', 'emerald', 'sky', 'rose'] as const)[i % 4])}`}>
                          <div>
                            <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>{r.label}</div>
                            <div className={`${FINELY_OS_ENTITY_BODY} mt-1`}>Persona: {r.personaId}</div>
                          </div>
                          <div className={`${FINELY_OS_ENTITY_SUBLABEL} shrink-0`}>{r.channels.join(' · ')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {lane === 'threads' ? (
                <div className="space-y-6">
                  <div>
                    <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>SMS and voice threads</h2>
                    <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                      {phoneSnap.threadCount} thread(s) · {phoneSnap.unreadThreads} unread · {phoneSnap.missedCalls} missed
                    </p>
                  </div>
                  <div className="grid lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 space-y-3">
                      {threads.length ? (
                        threads.map((t, i) => (
                          <div key={t.id} className={`${finelyOsCatalogCard((['emerald', 'violet', 'sky'] as const)[i % 3])} p-4`}>
                            <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>{t.displayName ?? t.phoneE164}</div>
                            <div className={`${FINELY_OS_ENTITY_BODY} mt-1`}>
                              {t.channel} · {t.unreadCount ? `${t.unreadCount} unread` : 'read'}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className={FINELY_OS_ENTITY_BODY}>No threads yet — send an SMS or log a call.</p>
                      )}
                    </div>
                    <div className="lg:col-span-7 space-y-3">
                      <div className={`${FINELY_OS_ENTITY_VALUE} text-xl`}>Recent call log</div>
                      {recentCalls.length ? (
                        recentCalls.map((c, i) => (
                          <div key={c.id} className={`${finelyOsCatalogCard((['sky', 'violet', 'emerald', 'rose'] as const)[i % 4])} flex justify-between gap-3 p-4`}>
                            <span className={FINELY_OS_ENTITY_VALUE}>
                              {c.direction === 'inbound' ? '↓' : '↑'} {c.from} → {c.to}
                            </span>
                            <span className={FINELY_OS_ENTITY_BODY}>
                              {c.status} · {c.personaId ?? 'unassigned'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className={FINELY_OS_ENTITY_BODY}>Call log empty.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {lane === 'setup' ? (
                <div className="space-y-4">
                  <h2 className="text-3xl font-extrabold">Production setup</h2>
                  <p className={FINELY_OS_ENTITY_BODY}>Configure Twilio numbers, webhooks, and routing before going live.</p>
                  <PhoneProductionSetupPanel />
                </div>
              ) : null}

              {lane === 'escalate' ? (
                <div className="space-y-6">
                  <div>
                    <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Escalation path</h2>
                    <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                      Missed calls and voicemails escalate to <strong>{CO_OWNER_IDENTITY.name}</strong> (co-owner) for summary and callback tasks.
                      Voicemail transcripts appear in the missed queue for review.
                    </p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    {Object.entries(PHONE_HUB_FEATURES).map(([key, on], i) => (
                      <div key={key} className={`${finelyOsCatalogCard(on ? (['emerald', 'sky', 'violet'] as const)[i % 3] : (['violet', 'rose', 'sky'] as const)[i % 3])} p-6`}>
                        <div className={`${FINELY_OS_ENTITY_VALUE} capitalize`}>{key.replace(/([A-Z])/g, ' $1')}</div>
                        <div className={`${FINELY_OS_ENTITY_BODY} mt-2`}>{on ? 'Enabled' : 'Planned'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <aside className="fc-admin-phone-alert-rail">
            <h3>Alert rail</h3>
            <div className="fc-admin-phone-status-grid">
              <div className="fc-admin-phone-status-cell">
                <strong>{phoneSnap.threadCount}</strong>
                <span>Threads</span>
              </div>
              <div className="fc-admin-phone-status-cell">
                <strong>{phoneSnap.unreadThreads}</strong>
                <span>Unread</span>
              </div>
              <div className="fc-admin-phone-status-cell">
                <strong>{phoneSnap.missedCalls}</strong>
                <span>Missed</span>
              </div>
              <div className="fc-admin-phone-status-cell">
                <strong>{recentCalls.length}</strong>
                <span>Recent</span>
              </div>
            </div>

            {missed.length ? (
              <div className={`${finelyOsCatalogCard('rose')} space-y-3 p-4`} data-fc-accent="rose">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Missed / voicemail</div>
                {missed.map((c) => (
                  <div key={c.id} className={FINELY_OS_ENTITY_BODY}>
                    {c.from} · {c.status}
                    {c.transcription ? ` — "${c.transcription.slice(0, 80)}…"` : ''}
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={summarizeForCoOwner}>
                    Summarize for {CO_OWNER_IDENTITY.name}
                  </button>
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/ops-agent')}>
                    Escalate to {CO_OWNER_IDENTITY.name}
                  </button>
                </div>
              </div>
            ) : (
              <p className={FINELY_OS_ENTITY_BODY}>No missed calls in queue.</p>
            )}

            <div className={`${finelyOsCatalogCard('sky')} space-y-3 p-4`} data-fc-accent="sky">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Simulate inbound (dev)</div>
              <input value={simulateFrom} onChange={(e) => setSimulateFrom(e.target.value)} className={finelyOsGlowField('sky')} placeholder="+1..." />
              <input value={simulateBody} onChange={(e) => setSimulateBody(e.target.value)} className={finelyOsGlowField('violet')} placeholder="SMS body" />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => {
                    simulateInboundSms(simulateFrom, simulateBody);
                    setRefreshKey((k) => k + 1);
                    setNotice('Simulated inbound SMS.');
                  }}
                >
                  Simulate SMS
                </button>
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => {
                    simulateInboundVoicemail(simulateFrom, simulateBody);
                    setRefreshKey((k) => k + 1);
                    setNotice('Simulated voicemail.');
                  }}
                >
                  Simulate VM
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
