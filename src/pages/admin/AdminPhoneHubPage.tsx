import React, { useMemo, useState } from 'react';
import { ArrowLeft, Phone, PhoneCall, MessageSquare, Voicemail, Users, Settings, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
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
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { CO_OWNER_IDENTITY } from '../../domain/coOwnerPersona';

export default function AdminPhoneHubPage() {
  const navigate = useNavigate();
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
    <PageShell
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

        <div className={`${finelyOsCatalogCard('sky')} !p-5 grid lg:grid-cols-12 gap-6`}>
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
              <Phone size={20} />
              <span className="font-semibold">Desktop dialer</span>
            </div>
            <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
              Outbound calls and SMS route through Twilio edge functions. Configure <code>twilioFromPhone</code> and enable
              Comms Delivery for live send. Inbound webhooks queue to agent personas below.
            </p>
            <input
              value={dial}
              onChange={(e) => setDial(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-mono dark:border-slate-700 dark:bg-slate-900"
            />
            <textarea
              value={smsBody}
              onChange={(e) => setSmsBody(e.target.value)}
              placeholder="SMS message (for text send)…"
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <select
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
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
              <p className="text-xs text-amber-700">Enable Comms Delivery in Admin Settings for live SMS.</p>
            ) : null}
            {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}
            {error ? <div className={FINELY_OS_NOTICE_ERROR}>{error}</div> : null}
            <div className={FINELY_OS_ENTITY_SUBLABEL}>From number: {twilioFrom}</div>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <div className="font-semibold flex items-center gap-2">
              <Users size={18} /> Agent routing
            </div>
            {PHONE_AGENT_ROUTES.sort((a, b) => a.priority - b.priority).map((r) => (
              <div key={r.id} className={`${finelyOsCatalogCard('violet')} !p-3 flex justify-between gap-3`}>
                <div>
                  <div className="font-medium text-sm">{r.label}</div>
                  <div className="text-xs text-slate-500">Persona: {r.personaId}</div>
                </div>
                <div className="text-[10px] uppercase text-violet-600">{r.channels.join(' · ')}</div>
              </div>
            ))}
          </div>
        </div>

        <PhoneProductionSetupPanel />

        <div className={`${finelyOsCatalogCard('emerald')} !p-5 mt-6 grid lg:grid-cols-12 gap-6`}>
          <div className="lg:col-span-4 space-y-3">
            <div className="font-semibold flex items-center gap-2">
              <Inbox size={18} /> SMS / voice threads
            </div>
            <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
              {phoneSnap.threadCount} thread(s) · {phoneSnap.unreadThreads} unread · {phoneSnap.missedCalls} missed
            </p>
            {threads.length ? (
              threads.map((t) => (
                <div key={t.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm">
                  <div className="font-medium">{t.displayName ?? t.phoneE164}</div>
                  <div className="text-xs opacity-70">{t.channel} · {t.unreadCount ? `${t.unreadCount} unread` : 'read'}</div>
                </div>
              ))
            ) : (
              <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>No threads yet — send an SMS or log a call.</p>
            )}
            {missed.length ? (
              <div className="pt-2">
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-amber-700`}>Missed / voicemail</div>
                {missed.map((c) => (
                  <div key={c.id} className="text-xs mt-1 text-amber-800">
                    {c.from} · {c.status}
                    {c.transcription ? ` — "${c.transcription.slice(0, 80)}…"` : ''}
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 mt-2">
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={summarizeForCoOwner}>
                    Summarize for {CO_OWNER_IDENTITY.name}
                  </button>
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/ops-agent')}>
                    Escalate to {CO_OWNER_IDENTITY.name}
                  </button>
                </div>
              </div>
            ) : null}
            <div className={`${finelyOsCatalogCard('sky')} !p-3 mt-3 space-y-2`}>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-xs`}>Simulate inbound (dev)</div>
              <input
                value={simulateFrom}
                onChange={(e) => setSimulateFrom(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                placeholder="+1..."
              />
              <input
                value={simulateBody}
                onChange={(e) => setSimulateBody(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
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
          <div className="lg:col-span-8 space-y-2">
            <div className="font-semibold text-sm">Recent call log</div>
            {recentCalls.length ? (
              recentCalls.map((c) => (
                <div key={c.id} className="flex justify-between gap-3 text-xs border-b border-white/10 py-2">
                  <span>{c.direction === 'inbound' ? '↓' : '↑'} {c.from} → {c.to}</span>
                  <span className="opacity-70">{c.status} · {c.personaId ?? 'unassigned'}</span>
                </div>
              ))
            ) : (
              <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>Call log empty.</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {Object.entries(PHONE_HUB_FEATURES).map(([key, on]) => (
            <div key={key} className={`${finelyOsCatalogCard(on ? 'emerald' : 'violet')} !p-4`}>
              <div className="font-medium text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
              <div className={`text-xs mt-1 ${on ? 'text-emerald-700' : 'text-slate-500'}`}>{on ? 'Enabled' : 'Planned'}</div>
            </div>
          ))}
        </div>

        <div className={`${finelyOsCatalogCard('amber')} !p-4 mt-6 flex gap-3`}>
          <Voicemail size={20} className="shrink-0 text-amber-700" />
          <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
            Missed calls and voicemails escalate to <strong>{CO_OWNER_IDENTITY.name}</strong> (co-owner) for summary + callback tasks.
            Transcription hooks integrate with Voice Studio neural TTS/STT pipeline.
          </p>
        </div>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
