import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, Inbox, Mail, MessageSquareText, Send, ExternalLink, Tag, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Partner } from '../../domain/partners';
import type { SupportTopic, SupportThreadStatus } from '../../domain/support';
import { SUPPORT_TOPICS, openCommunicationHub } from '../chat/communicationHubModel';
import { FinelyChatComposeBox } from '../chat/FinelyChatComposeBox';
import {
  appendPartnerOutreachMessage,
  defaultPartnerWelcomeMessage,
  sendPartnerOutreachMessage,
} from '../../lib/partnerMessaging';
import { STAFF_MESSAGE_SNIPPETS } from '../../lib/staffMessageSnippets';
import { fetchSupportReplySuggestions } from '../../lib/supportReplySuggestions';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { listThreadsByPartner } from '../../data/supportRepo';
import { listEvidenceByPartner } from '../../data/evidenceRepo';
import { describeChatAttachmentError, uploadChatAttachment } from '../../lib/chatAttachments';
import {
  adminDeliveryState,
  formatAdminDeliveryWhen,
  recordAdminDelivery,
} from '../../lib/adminDeliveryCooldown';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type Props = {
  partner: Partner;
};

function threadStatusStyle(status: SupportThreadStatus): { label: string; className: string } {
  switch (status) {
    case 'new':
      return { label: 'New', className: 'border-amber-400/40 bg-amber-500/15 text-amber-100' };
    case 'triaged':
      return { label: 'Triaged', className: 'border-sky-400/40 bg-sky-500/15 text-sky-100' };
    case 'waiting_on_team':
      return { label: 'Waiting on team', className: 'border-rose-400/40 bg-rose-500/15 text-rose-100' };
    case 'waiting_on_partner':
      return { label: 'Waiting on partner', className: 'border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-100' };
    case 'resolved':
      return { label: 'Resolved', className: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100' };
    case 'closed':
      return { label: 'Closed', className: 'border-white/15 bg-white/[0.06] text-white/55' };
    default:
      return { label: status, className: 'border-white/15 bg-white/[0.06] text-white/65' };
  }
}

function fmtThreadWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function AdminPartnerMessagePanel({ partner }: Props) {
  const navigate = useNavigate();
  const [body, setBody] = useState('');
  const [topic, setTopic] = useState<SupportTopic>('general');
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ title: string; body: string }>>([]);

  const partnerName = (partner.profile.fullName || 'Partner').trim();
  const email = (partner.profile.email || '').trim();
  const commsOn = isFeatureEnabled('commsDelivery');

  const msgState = useMemo(
    () => adminDeliveryState(partner.id, 'partner_message'),
    [partner.id, tick],
  );

  useEffect(() => {
    if (!msgState.isRepeat || msgState.canSend) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [msgState.isRepeat, msgState.canSend]);

  const recentThreads = useMemo(
    () =>
      listThreadsByPartner(partner.id)
        .slice()
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
        .slice(0, 3),
    [partner.id, notice],
  );

  const vaultAttachments = useMemo(
    () =>
      listEvidenceByPartner(partner.id)
        .slice(0, 8)
        .map((item) => ({ id: item.id, label: item.filename })),
    [partner.id, notice, attachmentIds.length],
  );

  const uploadAttachment = async (file: File) => {
    setUploadBusy(true);
    setUploadErr(null);
    try {
      const { item, warning } = await uploadChatAttachment({ file, partnerId: partner.id });
      setAttachmentIds((prev) => [...prev, item.id]);
      if (warning) setUploadErr(warning);
      window.dispatchEvent(new CustomEvent('finely:store'));
    } catch (e: unknown) {
      setUploadErr(describeChatAttachmentError(e));
    } finally {
      setUploadBusy(false);
    }
  };

  const sendMessage = async () => {
    const text = body.trim();
    if (!text) {
      setErr('Write a message first.');
      return;
    }
    if (uploadBusy) {
      setErr('An attachment is still uploading — wait a moment, then send.');
      return;
    }
    if (msgState.isRepeat && !msgState.canSend) {
      setErr(`Please wait ${msgState.waitSeconds}s before sending another message to this partner.`);
      return;
    }
    if (msgState.isRepeat && msgState.canSend) {
      const ok = window.confirm(
        `You already sent a message ${formatAdminDeliveryWhen(msgState.sentAt)}. Send another now?`,
      );
      if (!ok) return;
    }

    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      const existing = recentThreads[0];
      let threadId = existing?.id;
      if (existing && Date.now() - new Date(existing.lastMessageAt).getTime() < 7 * 24 * 60 * 60 * 1000) {
        appendPartnerOutreachMessage({
          threadId: existing.id,
          partnerId: partner.id,
          topic: existing.topic,
          body: text,
          attachments: attachmentIds.map((evidenceId) => ({ evidenceId })),
        });
        threadId = existing.id;
      } else {
        const thread = sendPartnerOutreachMessage({
          partnerId: partner.id,
          partnerName,
          body: text,
          topic,
          subject: `Message from Finely · ${partnerName}`,
          attachments: attachmentIds.map((evidenceId) => ({ evidenceId })),
        });
        threadId = thread.id;
      }
      recordAdminDelivery(partner.id, 'partner_message');
      setBody('');
      setAttachmentIds([]);
      setAiSuggestions([]);
      setNotice(
        commsOn && email
          ? `Message sent — ${partnerName} will see it in portal Team chat and receive an email alert.`
          : `Message sent — ${partnerName} will see it in portal Team chat when they log in.`,
      );
      openCommunicationHub({
        tab: 'team',
        threadId,
        topic,
        expanded: true,
        partnerId: partner.id,
        partnerDisplayName: partnerName,
        lane: partner.lane,
      });
      setTick((t) => t + 1);
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Could not send message.');
    } finally {
      setBusy(false);
    }
  };

  const openHub = () => {
    openCommunicationHub({
      tab: 'team',
      topic,
      expanded: true,
      partnerId: partner.id,
      partnerDisplayName: partnerName,
      lane: partner.lane,
    });
  };

  return (
    <div className={`${finelyOsCatalogCard('fuchsia')} !p-5 space-y-5`} id="admin-partner-message">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <MessageSquareText size={18} className="text-fuchsia-300" />
            <div className={`text-lg ${FINELY_OS_ENTITY_VALUE}`}>Message partner</div>
          </div>
          <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Send a direct portal message to {partnerName}. Each section below is separated so the compose box, topic, and
            recent threads are easy to tell apart.
          </p>
        </div>
        <button type="button" onClick={openHub} className={`${FINELY_OS_SECONDARY_BTN} shrink-0`}>
          <ExternalLink size={14} /> Open chat hub
        </button>
      </div>

      {msgState.sentAt ? (
        <div className={FINELY_OS_NOTICE_WARN}>
          Last message sent {formatAdminDeliveryWhen(msgState.sentAt)}
          {!msgState.canSend ? ` — wait ${msgState.waitSeconds}s before sending again` : ' — you can send another now'}.
        </div>
      ) : null}

      <div className="rounded-2xl border border-fuchsia-400/20 bg-[#101815] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={FINELY_OS_ENTITY_LABEL}>Suggested messages</span>
          <button
            type="button"
            disabled={aiBusy}
            onClick={() => {
              setAiBusy(true);
              void fetchSupportReplySuggestions({
                thread: {
                  id: recentThreads[0]?.id ?? 'draft',
                  partnerId: partner.id,
                  topic,
                  subject: `Message from Finely · ${partnerName}`,
                  status: 'new',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  lastMessageAt: new Date().toISOString(),
                },
                messages: [],
                partnerId: partner.id,
                staffOutbound: true,
              })
                .then(setAiSuggestions)
                .catch(() => setAiSuggestions([]))
                .finally(() => setAiBusy(false));
            }}
            className={FINELY_OS_SECONDARY_BTN}
          >
            <Sparkles size={14} /> {aiBusy ? 'Drafting…' : 'AI drafts'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {STAFF_MESSAGE_SNIPPETS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setBody(chip.body(partnerName))}
              className="px-2.5 py-1.5 rounded-lg border border-fuchsia-400/25 bg-fuchsia-500/10 text-[11px] text-fuchsia-100"
            >
              {chip.emoji} {chip.label}
            </button>
          ))}
        </div>
        {aiSuggestions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {aiSuggestions.map((s, i) => (
              <button
                key={`${s.title}-${i}`}
                type="button"
                onClick={() => setBody(s.body)}
                className="text-left px-3 py-2 rounded-xl border border-violet-400/25 bg-violet-500/10 text-xs text-white/80 max-w-full"
                title={s.body}
              >
                ✨ {s.title}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <FinelyChatComposeBox
        value={body}
        onChange={setBody}
        onSubmit={() => void sendMessage()}
        label={`Message to ${partnerName}`}
        placeholder={defaultPartnerWelcomeMessage(partnerName)}
        busy={busy}
        disabled={busy}
        submitLabel="Send to partner inbox"
        onUploadFile={(file) => uploadAttachment(file)}
        uploadBusy={uploadBusy}
        uploadError={uploadErr}
        attachments={vaultAttachments}
        selectedAttachmentIds={attachmentIds}
        onToggleAttachment={(id) =>
          setAttachmentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border-2 border-violet-400/25 bg-[#101815] p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-violet-300" />
            <span className={FINELY_OS_ENTITY_LABEL}>Message topic</span>
          </div>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value as SupportTopic)}
            className={`${FINELY_OS_ENTITY_SELECT} w-full !mt-1 border-2 border-violet-400/20 bg-[#151d19] text-white`}
          >
            {SUPPORT_TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.emoji} {t.label}
              </option>
            ))}
          </select>
          <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Used when starting a new thread.</p>
        </div>

        <div className="rounded-2xl border-2 border-emerald-400/25 bg-[#101815] p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-emerald-300" />
            <span className={FINELY_OS_ENTITY_LABEL}>Portal inbox email</span>
          </div>
          <div className="rounded-xl border border-emerald-400/20 bg-[#151d19] px-3 py-3 font-mono text-sm text-emerald-100 break-all">
            {email || 'No email on file'}
          </div>
          <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            {commsOn && email
              ? 'Partner sees your message in Team chat and gets an instant email when delivery is enabled.'
              : 'Partner sees your message in Team chat after login.'}
          </p>
        </div>
      </div>

      {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}
      {err ? <div className="rounded-xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{err}</div> : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => navigate(`/admin/support?partner=${partner.id}`)} className={FINELY_OS_SECONDARY_BTN}>
          <Inbox size={14} /> Open support inbox
        </button>
      </div>

      {recentThreads.length ? (
        <div className="rounded-2xl border-2 border-amber-400/20 bg-[#0d1411] p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Clock3 size={14} className="text-amber-300" />
                <span className={FINELY_OS_ENTITY_LABEL}>Recent threads</span>
              </div>
              <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>Tap a card to reopen the conversation in chat.</p>
            </div>
            <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-100">
              {recentThreads.length} active
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recentThreads.map((t, index) => {
              const topicMeta = SUPPORT_TOPICS.find((x) => x.value === t.topic);
              const status = threadStatusStyle(t.status);
              const accents = [
                'border-fuchsia-400/35 hover:bg-fuchsia-500/8',
                'border-sky-400/35 hover:bg-sky-500/8',
                'border-emerald-400/35 hover:bg-emerald-500/8',
              ];
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    openCommunicationHub({
                      tab: 'team',
                      threadId: t.id,
                      topic: t.topic,
                      expanded: true,
                      partnerId: partner.id,
                      partnerDisplayName: partnerName,
                    })
                  }
                  className={`text-left rounded-2xl border-2 bg-[#121a17] p-4 transition-all ${accents[index % accents.length]}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl border border-white/10 bg-black/30 flex items-center justify-center text-xl shrink-0">
                      {topicMeta?.emoji ?? '💬'}
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className={`mt-3 text-sm font-semibold leading-snug ${FINELY_OS_ENTITY_VALUE}`}>{t.subject}</div>
                  <div className={`mt-2 text-[11px] ${FINELY_OS_ENTITY_SUBLABEL}`}>
                    {topicMeta?.label ?? t.topic}
                  </div>
                  <div className={`mt-3 text-xs ${FINELY_OS_ENTITY_BODY}`}>{fmtThreadWhen(t.lastMessageAt)}</div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-8 text-center">
          <Send size={18} className="mx-auto text-fuchsia-300/80 mb-2" />
          <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>No recent threads yet. Your first message will create one here.</p>
        </div>
      )}
    </div>
  );
}
