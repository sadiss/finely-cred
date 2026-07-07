import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquareText, Send, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Partner } from '../../domain/partners';
import type { SupportTopic } from '../../domain/support';
import { SUPPORT_TOPICS, openCommunicationHub } from '../chat/communicationHubModel';
import { FinelyChatComposeBox } from '../chat/FinelyChatComposeBox';
import {
  appendPartnerOutreachMessage,
  defaultPartnerWelcomeMessage,
  sendPartnerOutreachMessage,
} from '../../lib/partnerMessaging';
import { listThreadsByPartner } from '../../data/supportRepo';
import { listEvidenceByPartner, upsertEvidence } from '../../data/evidenceRepo';
import { getBlobStore } from '../../storage/getBlobStore';
import { newId } from '../../utils/ids';
import type { EvidenceItem } from '../../domain/evidence';
import {
  adminDeliveryState,
  formatAdminDeliveryWhen,
  recordAdminDelivery,
} from '../../lib/adminDeliveryCooldown';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type Props = {
  partner: Partner;
};

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

  const partnerName = (partner.profile.fullName || 'Partner').trim();
  const email = (partner.profile.email || '').trim();

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
      const blobStore = getBlobStore();
      const { ref } = await blobStore.put(file, {
        partnerId: partner.id,
        caption: 'Chat attachment',
        scanMode: false,
        kind: 'evidence',
      });
      const item: EvidenceItem = {
        id: newId('evidence'),
        partnerId: partner.id,
        type: 'upload',
        source: 'upload',
        caption: 'Chat attachment',
        filename: file.name || 'attachment',
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        blobRef: ref,
        createdAt: new Date().toISOString(),
      };
      upsertEvidence(item);
      setAttachmentIds((prev) => [...prev, item.id]);
      window.dispatchEvent(new CustomEvent('finely:store'));
    } catch (e: unknown) {
      setUploadErr((e as Error)?.message || 'Upload failed.');
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
      setNotice(`Message sent — ${partnerName} will see it in portal Team chat when they log in.`);
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
    <div className={`${finelyOsCatalogCard('fuchsia')} !p-5 space-y-4`} id="admin-partner-message">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquareText size={16} className="text-fuchsia-300" />
            <div className={FINELY_OS_ENTITY_VALUE}>Message partner</div>
          </div>
          <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Admins can do everything a credit specialist can on this file — plus invites, password resets, and direct portal
            messages. Messages appear in the partner&apos;s Team chat inbox.
          </p>
        </div>
        <button type="button" onClick={openHub} className={FINELY_OS_SECONDARY_BTN}>
          <ExternalLink size={14} /> Open chat hub
        </button>
      </div>

      {msgState.sentAt ? (
        <div className={FINELY_OS_NOTICE_WARN}>
          Last message sent {formatAdminDeliveryWhen(msgState.sentAt)}
          {!msgState.canSend ? ` — wait ${msgState.waitSeconds}s before sending again` : ' — you can send another now'}.
        </div>
      ) : null}

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="sm:col-span-2">
          <span className={FINELY_OS_ENTITY_LABEL}>Message to {partnerName}</span>
          <div className="mt-2">
            <FinelyChatComposeBox
              value={body}
              onChange={setBody}
              onSubmit={() => void sendMessage()}
              placeholder={defaultPartnerWelcomeMessage(partnerName)}
              busy={busy}
              disabled={busy}
              submitLabel="Send message"
              onUploadFile={(file) => uploadAttachment(file)}
              uploadBusy={uploadBusy}
              uploadError={uploadErr}
              attachments={vaultAttachments}
              selectedAttachmentIds={attachmentIds}
              onToggleAttachment={(id) =>
                setAttachmentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
              }
            />
          </div>
        </label>
        <label>
          <span className={FINELY_OS_ENTITY_LABEL}>Topic</span>
          <select value={topic} onChange={(e) => setTopic(e.target.value as SupportTopic)} className={FINELY_OS_ENTITY_SELECT}>
            {SUPPORT_TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.emoji} {t.label}
              </option>
            ))}
          </select>
        </label>
        <div className={`text-xs ${FINELY_OS_ENTITY_BODY} self-end pb-2`}>
          Portal inbox for: <span className="font-mono text-white/80">{email || 'no email on file'}</span>
        </div>
      </div>

      {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}
      {err ? <div className="text-rose-300 text-sm">{err}</div> : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy || !body.trim()} onClick={() => void sendMessage()} className={FINELY_OS_PRIMARY_BTN}>
          <Send size={14} /> {busy ? 'Sending…' : 'Send to partner inbox'}
        </button>
        <button type="button" onClick={() => navigate(`/admin/support?partner=${partner.id}`)} className={FINELY_OS_SECONDARY_BTN}>
          Support inbox
        </button>
      </div>

      {recentThreads.length ? (
        <div className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Recent threads</div>
          {recentThreads.map((t) => (
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
              className={`w-full text-left rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5 ${FINELY_OS_ENTITY_BODY} text-sm`}
            >
              <div className={FINELY_OS_ENTITY_VALUE}>{t.subject}</div>
              <div className="text-xs text-white/50">
                {formatAdminDeliveryWhen(t.lastMessageAt)} · {t.status}
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
