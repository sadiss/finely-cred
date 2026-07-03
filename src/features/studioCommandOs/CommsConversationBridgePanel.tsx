import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Mail, MessageSquare, Inbox, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listThreadsByPartner, listMessagesByThread } from '../../data/supportRepo';
import { listPartnersLocal } from '../../data/partnersRepo';
import {
  buildComposeHandoffFromThread,
  commsStudioUrlFromHandoff,
  saveComposeHandoffDraft,
} from '../../lib/commsConversationHandoff';
import {
  buildComposeHandoffFromBankruptcyScenario,
  commsStudioUrlFromBankruptcyHandoff,
} from '../../lib/bankruptcyCommsHandoff';
import { getBankruptcyScenarioSelection } from '../../data/bankruptcyLaneStateRepo';
import { getDisputeLaneFocus } from '../../data/disputeLaneStateRepo';
import { getFundingLaneFocus } from '../../data/fundingLaneStateRepo';
import { BANKRUPTCY_LIBERATION_SCENARIOS } from '../../legal/bankruptcyLiberationPaths';
import { bureauFullName } from '../../utils/bureaus';
import type { Bureau } from '../../domain/creditReports';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsMessageBubble,
} from '../os/finelyOsLightUi';
import { StudioSection } from './StudioKpiCards';

export function CommsConversationBridgePanel() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const partners = useMemo(() => listPartnersLocal().slice(0, 300), [version]);
  const threads = useMemo(() => {
    if (!partnerId) return [];
    return listThreadsByPartner(partnerId).sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }, [partnerId, version]);

  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => [t.subject, t.topic, t.status].join(' ').toLowerCase().includes(q));
  }, [threads, query]);

  const activeThread = threads.find((t) => t.id === threadId) ?? filteredThreads[0] ?? null;
  const bankruptcySelection = useMemo(() => {
    if (!partnerId) return null;
    return getBankruptcyScenarioSelection(partnerId);
  }, [partnerId, version]);
  const disputeFocus = useMemo(() => {
    if (!partnerId) return null;
    return getDisputeLaneFocus(partnerId);
  }, [partnerId, version]);
  const fundingFocus = useMemo(() => {
    if (!partnerId) return null;
    return getFundingLaneFocus(partnerId);
  }, [partnerId, version]);
  const bankruptcyScenario = bankruptcySelection
    ? BANKRUPTCY_LIBERATION_SCENARIOS.find((s) => s.id === bankruptcySelection.scenarioId)
    : null;

  const messages = useMemo(
    () => (activeThread ? listMessagesByThread(activeThread.id) : []),
    [activeThread?.id, version],
  );

  const prepSend = (channel: 'email' | 'sms' | 'portal') => {
    if (!activeThread || !partnerId) return;
    const handoff = buildComposeHandoffFromThread({ thread: activeThread, channel, partnerId });
    saveComposeHandoffDraft(handoff);
    navigate(commsStudioUrlFromHandoff(handoff));
  };

  const prepBankruptcy = (channel: 'email' | 'sms') => {
    if (!partnerId || !bankruptcySelection?.scenarioId) return;
    const handoff = buildComposeHandoffFromBankruptcyScenario({
      partnerId,
      scenarioId: bankruptcySelection.scenarioId,
      threadId: bankruptcySelection.threadId,
      channel,
    });
    saveComposeHandoffDraft(handoff);
    navigate(commsStudioUrlFromBankruptcyHandoff(handoff));
  };

  return (
    <div className="space-y-6">
      <div className={`${finelyOsCatalogCard('violet')} !p-6 space-y-3`} data-fc-accent="violet">
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
          <Users size={16} />
          <span>Conversation → Comms bridge</span>
        </div>
        <p className={FINELY_OS_ENTITY_BODY}>
          Read live Hub threads, then pre-prep email, SMS, or portal messages with thread context and recommended dispute templates.
          Unified across credit specialists, dispute specialists, partner success, and admin roles.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <StudioSection eyebrow="partner" title="Select partner thread">
            <select
              value={partnerId}
              onChange={(e) => {
                setPartnerId(e.target.value);
                setThreadId(null);
              }}
              className="fc-input w-full mb-3"
            >
              <option value="">Choose partner…</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.profile?.fullName ?? p.id}</option>
              ))}
            </select>
            {bankruptcyScenario ? (
              <div className="mb-3 rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
                <div className="font-bold">Bankruptcy path: {bankruptcyScenario.title}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => prepBankruptcy('email')}>
                    <Mail size={12} /> Prep bankruptcy email
                  </button>
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => prepBankruptcy('sms')}>
                    <MessageSquare size={12} /> Prep bankruptcy SMS
                  </button>
                </div>
              </div>
            ) : null}
            {disputeFocus?.bureau ? (
              <div className="mb-3 rounded-xl border border-fuchsia-500/25 bg-fuchsia-500/10 px-3 py-2 text-xs text-fuchsia-100">
                <div className="font-bold">
                  Dispute focus: {bureauFullName(disputeFocus.bureau as Bureau)} bureau specialist lane
                </div>
                <p className="mt-1 text-white/50">Thread prep will suggest bureau-appropriate dispute templates.</p>
              </div>
            ) : null}
            {fundingFocus?.laneTitle ? (
              <div className="mb-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                <div className="font-bold">Wealth path: {fundingFocus.laneTitle}</div>
                <p className="mt-1 text-white/50">Funding specialist lane active for this partner.</p>
              </div>
            ) : null}
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-4 mb-3">
              <Search size={16} className="text-white/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search threads…"
                className="w-full bg-transparent py-3 text-sm text-white/80 outline-none"
              />
            </div>
            <FinelyOsPaginatedStack
              items={filteredThreads}
              pageSize={8}
              emptyMessage={partnerId ? 'No threads for this partner.' : 'Select a partner to load conversations.'}
              renderItem={(t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThreadId(t.id)}
                  className={`w-full text-left rounded-xl border p-3 ${
                    activeThread?.id === t.id ? 'border-violet-500/30 bg-violet-500/10' : 'border-white/10 bg-black/20'
                  }`}
                >
                  <div className={FINELY_OS_ENTITY_VALUE}>{t.subject}</div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-xs mt-1`}>{t.topic} · {t.status}</div>
                </button>
              )}
            />
          </StudioSection>
        </div>

        <div className="lg:col-span-8 space-y-4">
          {activeThread ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className={FINELY_OS_ENTITY_VALUE}>{activeThread.subject}</div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-xs`}>
                    {activeThread.topic} · {messages.length} message(s)
                    {activeThread.relatedCaseId ? ` · case ${activeThread.relatedCaseId}` : ''}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => prepSend('email')}>
                    <Mail size={14} /> Prep email <ArrowRight size={12} />
                  </button>
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => prepSend('sms')}>
                    <MessageSquare size={14} /> Prep SMS
                  </button>
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => prepSend('portal')}>
                    <Inbox size={14} /> Prep portal
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 max-h-80 overflow-y-auto space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={finelyOsMessageBubble(m.fromPartner ? 'user' : 'assistant')}>
                    <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">
                      {m.fromPartner ? 'Partner' : 'Team'} · {new Date(m.createdAt).toLocaleString()}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{m.body}</div>
                  </div>
                ))}
                {!messages.length ? <p className={FINELY_OS_ENTITY_BODY}>No messages in this thread yet.</p> : null}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/25 p-8 text-center">
              <p className={FINELY_OS_ENTITY_BODY}>Select a partner and thread to preview the conversation and prep outbound comms.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
