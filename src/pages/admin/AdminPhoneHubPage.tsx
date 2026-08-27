import React, { useMemo, useState } from 'react';
import { ArrowLeft, Phone, PhoneCall, MessageSquare, Voicemail, Users, Settings, Inbox } from 'lucide-react';
import { AdminWorkstationFrame, type AdminEmbeddablePageProps } from '../../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';
import { useMappedAdminNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';
import { PHONE_AGENT_ROUTES, PHONE_HUB_FEATURES, resolvePhoneRoute } from '../../domain/phoneSystem';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { getCommsSettings } from '../../data/settingsRepo';
import { sendSms } from '../../lib/commsDeliveryClient';
import { addAuditEvent } from '../../data/auditRepo';
import {
  appendPhoneMessage,
  getPhoneOpsSnapshot,
  listMissedCalls,
  listPhoneCalls,
  listPhoneThreads,
  logPhoneCall,
  upsertPhoneThread,
} from '../../data/phoneThreadsRepo';
import {
  simulateInboundSms,
  simulateInboundVoicemail,
  syncPhoneInboxFromEdge,
} from '../../lib/phoneInboxSync';
import { buildPhoneQueueBriefing, buildVoicemailSummaryPrompt } from '../../lib/phoneVoicemailOps';
import { PhoneProductionSetupPanel } from '../../components/phone/PhoneProductionSetupPanel';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  finelyOsCatalogCard,
  finelyOsGlowField,
  finelyOsGlowTextarea,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsGlassPanel } from '../../features/os/FinelyOsGlassPanel';
import { FinelyOsOverviewStatTile } from '../../features/os/FinelyOsOverviewStatTile';
import { CO_OWNER_IDENTITY } from '../../domain/coOwnerPersona';

export default function AdminPhoneHubPage({ embedded = false }: AdminEmbeddablePageProps = {}) {
  const navigate = useMappedAdminNavigate();
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
    <AdminWorkstationFrame
      embedded={embedded}
      kind="phone-hub-workstation"
      badge="Admin"
      title="Finely Phone Hub"
      subtitle="Desktop softphone — inbound/outbound calls, SMS threads, agent routing, voicemail, and co-owner escalation."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <button type="button" onClick={() => navigate('/admin/settings')} className={FINELY_OS_SECONDARY_BTN}>
            <Settings size={14} /> Twilio settings
          </button>
          <button type="button" disabled={syncBusy} onClick={() => void syncInbound()} className={FINELY_OS_SECONDARY_BTN}>
            {syncBusy ? 'Syncing…' : 'Sync inbound'}
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <FinelyOsOverviewStatTile icon={Inbox} label="Threads" value={phoneSnap.threadCount} hint={`${phoneSnap.unreadThreads} unread`} accent="sky" iconAccent="sky" />
          <FinelyOsOverviewStatTile icon={PhoneCall} label="Recent calls" value={recentCalls.length} hint="Last six" accent="violet" iconAccent="violet" />
          <FinelyOsOverviewStatTile icon={Voicemail} label="Missed" value={phoneSnap.missedCalls} hint="Voicemail + missed" accent="rose" iconAccent="rose" />
          <FinelyOsOverviewStatTile icon={Users} label="Routes" value={PHONE_AGENT_ROUTES.length} hint="Persona lanes" accent="emerald" iconAccent="emerald" />
        </div>

        <FinelyOsGlassPanel icon={Phone} title="Desktop dialer" subtitle="Outbound calls and SMS route through Twilio. Configure the from-number and enable Comms Delivery for live send." accent="sky">
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
            <select
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              className={finelyOsGlowField('emerald')}
            >
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
            </div>
            {!commsOn ? (
              <p className={`${FINELY_OS_ENTITY_BODY} text-violet-200`}>Enable Comms Delivery in Admin Settings for live SMS.</p>
            ) : null}
            {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}
            {error ? <div className={FINELY_OS_NOTICE_ERROR}>{error}</div> : null}
            <div className={FINELY_OS_ENTITY_SUBLABEL}>From number: {twilioFrom}</div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className={`${FINELY_OS_ENTITY_VALUE} flex items-center gap-2 text-xl`}>
              <Users size={20} /> Agent routing
            </div>
            {PHONE_AGENT_ROUTES.sort((a, b) => a.priority - b.priority).map((r, i) => (
              <div key={r.id} className={`${finelyOsCatalogCard((['violet', 'emerald', 'sky', 'rose'] as const)[i % 4])} flex justify-between gap-3`}>
                <div>
                  <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>{r.label}</div>
                  <div className={`${FINELY_OS_ENTITY_BODY} mt-1`}>Persona: {r.personaId}</div>
                </div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} shrink-0`}>{r.channels.join(' · ')}</div>
              </div>
            ))}
          </div>
        </div>
        </FinelyOsGlassPanel>

        <PhoneProductionSetupPanel />

        <FinelyOsGlassPanel icon={Inbox} title="SMS / voice threads" subtitle={`${phoneSnap.threadCount} thread(s) · ${phoneSnap.unreadThreads} unread · ${phoneSnap.missedCalls} missed`} accent="emerald">
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            {threads.length ? (
              threads.map((t, i) => (
                <div key={t.id} className={finelyOsCatalogCard((['emerald', 'violet', 'sky'] as const)[i % 3])}>
                  <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>{t.displayName ?? t.phoneE164}</div>
                  <div className={`${FINELY_OS_ENTITY_BODY} mt-1`}>{t.channel} · {t.unreadCount ? `${t.unreadCount} unread` : 'read'}</div>
                </div>
              ))
            ) : (
              <p className={FINELY_OS_ENTITY_BODY}>No threads yet — send an SMS or log a call.</p>
            )}
            {missed.length ? (
              <div className={`${finelyOsCatalogCard('rose')} space-y-3`}>
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
            ) : null}
            <div className={`${finelyOsCatalogCard('sky')} space-y-3`}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Simulate inbound (dev)</div>
              <input
                value={simulateFrom}
                onChange={(e) => setSimulateFrom(e.target.value)}
                className={finelyOsGlowField('sky')}
                placeholder="+1..."
              />
              <input
                value={simulateBody}
                onChange={(e) => setSimulateBody(e.target.value)}
                className={finelyOsGlowField('violet')}
                placeholder="SMS body"
              />
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
          </div>
          <div className="lg:col-span-8 space-y-3">
            <div className={`${FINELY_OS_ENTITY_VALUE} text-xl`}>Recent call log</div>
            {recentCalls.length ? (
              recentCalls.map((c, i) => (
                <div key={c.id} className={`${finelyOsCatalogCard((['sky', 'violet', 'emerald', 'rose'] as const)[i % 4])} flex justify-between gap-3`}>
                  <span className={FINELY_OS_ENTITY_VALUE}>{c.direction === 'inbound' ? '↓' : '↑'} {c.from} → {c.to}</span>
                  <span className={FINELY_OS_ENTITY_BODY}>{c.status} · {c.personaId ?? 'unassigned'}</span>
                </div>
              ))
            ) : (
              <p className={FINELY_OS_ENTITY_BODY}>Call log empty.</p>
            )}
          </div>
        </div>
        </FinelyOsGlassPanel>

        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(PHONE_HUB_FEATURES).map(([key, on], i) => (
            <div key={key} className={finelyOsCatalogCard(on ? (['emerald', 'sky', 'violet'] as const)[i % 3] : (['violet', 'rose', 'sky'] as const)[i % 3])}>
              <div className={`${FINELY_OS_ENTITY_VALUE} capitalize`}>{key.replace(/([A-Z])/g, ' $1')}</div>
              <div className={`${FINELY_OS_ENTITY_BODY} mt-2`}>{on ? 'Enabled' : 'Planned'}</div>
            </div>
          ))}
        </div>

        <FinelyOsGlassPanel icon={Voicemail} title="Escalation path" accent="rose">
          <p className={FINELY_OS_ENTITY_BODY}>
            Missed calls and voicemails escalate to <strong>{CO_OWNER_IDENTITY.name}</strong> (co-owner) for summary + callback tasks.
            Transcription hooks integrate with Voice Studio neural TTS/STT pipeline.
          </p>
        </FinelyOsGlassPanel>

        {!embedded ? <FinelyOsPageFooter /> : null}
      </div>
    </AdminWorkstationFrame>
  );
}
