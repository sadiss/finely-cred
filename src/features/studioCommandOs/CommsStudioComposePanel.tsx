import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Send, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { listCommsTemplates } from '../../data/commsRepo';
import { listPartnersLocal } from '../../data/partnersRepo';
import type { CommsChannel } from '../../domain/comms';
import { sendPortalFromTemplate, sendEmailFromTemplate, sendSmsFromTemplate } from '../../lib/commsEngine';
import { ALL_TEMPLATE_VAR_KEYS } from '../../comms/templateVariables';
import { loadComposeHandoffDraft, clearComposeHandoffDraft } from '../../lib/commsConversationHandoff';
import { FINELY_OS_ENTITY_LABEL, FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN, finelyOsGlowTextarea } from '../os/finelyOsLightUi';
import { StudioSection } from './StudioKpiCards';

export function CommsStudioComposePanel({ onSent }: { onSent?: () => void }) {
  const [searchParams] = useSearchParams();
  const templates = useMemo(() => listCommsTemplates().filter((t) => t.enabled), []);
  const partners = useMemo(() => listPartnersLocal().slice(0, 200), []);
  const [channel, setChannel] = useState<CommsChannel>('email');
  const [templateId, setTemplateId] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [preheader, setPreheader] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const channelTemplates = templates.filter((t) => t.channel === channel);
  const partner = partners.find((p) => p.id === partnerId) ?? null;

  useEffect(() => {
    const handoff = loadComposeHandoffDraft();
    const urlPartner = searchParams.get('partnerId');
    const urlTemplate = searchParams.get('templateId');
    const urlChannel = searchParams.get('channel') as CommsChannel | null;
    if (handoff) {
      setPartnerId(handoff.partnerId);
      setChannel(handoff.channel);
      setSubject(handoff.subject);
      setBody(handoff.body);
      if (handoff.templateHints[0]) {
        const tpl = templates.find((t) => t.id === handoff.templateHints[0]);
        if (tpl) {
          setTemplateId(tpl.id);
          setSubject(tpl.subjectTemplate ?? handoff.subject);
          setBody(tpl.bodyTemplate);
        }
      }
      clearComposeHandoffDraft();
      return;
    }
    if (urlPartner) setPartnerId(urlPartner);
    if (urlChannel === 'email' || urlChannel === 'sms' || urlChannel === 'portal') setChannel(urlChannel);
    if (urlTemplate) {
      const tpl = templates.find((t) => t.id === urlTemplate);
      if (tpl) {
        setTemplateId(tpl.id);
        setChannel(tpl.channel);
        setSubject(tpl.subjectTemplate ?? '');
        setBody(tpl.bodyTemplate);
      }
    }
  }, [searchParams, templates]);

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    setChannel(tpl.channel);
    setSubject(tpl.subjectTemplate ?? '');
    setBody(tpl.bodyTemplate);
  };

  const send = async () => {
    setBusy(true);
    setNotice(null);
    try {
      if (scheduleAt && new Date(scheduleAt).getTime() > Date.now()) {
        setNotice(`Scheduled for ${new Date(scheduleAt).toLocaleString()} — queue wiring uses Automation Studio (saved as dry-run preview).`);
      }
      if (templateId && partner) {
        const tpl = templates.find((t) => t.id === templateId);
        if (!tpl) throw new Error('Template not found');
        const res =
          channel === 'portal'
            ? sendPortalFromTemplate({ template: tpl, partner, dryRun })
            : channel === 'email'
              ? await sendEmailFromTemplate({ template: tpl, partner, dryRun })
              : await sendSmsFromTemplate({ template: tpl, partner, dryRun });
        setNotice(res.ok ? `${dryRun ? 'Dry-run logged' : 'Sent'} — ${res.log.status}` : `Error: ${res.log.error}`);
      } else if (partner && body.trim()) {
        const fakeTpl = {
          id: 'compose_ad_hoc',
          name: 'Ad hoc compose',
          channel,
          enabled: true,
          subjectTemplate: subject,
          bodyTemplate: preheader ? `${preheader}\n\n${body}` : body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const res =
          channel === 'portal'
            ? sendPortalFromTemplate({ template: fakeTpl, partner, dryRun })
            : channel === 'email'
              ? await sendEmailFromTemplate({ template: fakeTpl, partner, dryRun })
              : await sendSmsFromTemplate({ template: fakeTpl, partner, dryRun });
        setNotice(res.ok ? `${dryRun ? 'Dry-run logged' : 'Sent'} — ${res.log.status}` : `Error: ${res.log.error}`);
      } else {
        setNotice('Pick a partner and template or write a body.');
      }
      onSent?.();
    } catch (e: unknown) {
      setNotice((e as Error)?.message ?? 'Send failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <StudioSection
        eyebrow="outlook-class compose"
        title="Compose — To, Cc, Bcc, subject, body, schedule, compliance gate"
        right={
          <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
            Dry-run (recommended)
          </label>
        }
      >
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Channel</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value as CommsChannel)} className="fc-input mt-1 w-full">
                <option value="email">Email</option>
                <option value="portal">Portal / Hub thread</option>
                <option value="sms">SMS</option>
              </select>
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Template (optional)</label>
              <select value={templateId} onChange={(e) => applyTemplate(e.target.value)} className="fc-input mt-1 w-full">
                <option value="">— Ad hoc —</option>
                {channelTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Partner</label>
              <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="fc-input mt-1 w-full">
                <option value="">— Select partner —</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.profile.fullName || p.profile.email}
                  </option>
                ))}
              </select>
            </div>
            {channel === 'email' ? (
              <>
                <div>
                  <label className={FINELY_OS_ENTITY_LABEL}>To</label>
                  <input value={to} onChange={(e) => setTo(e.target.value)} placeholder={partner?.profile.email ?? 'email@…'} className="fc-input mt-1 w-full" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={FINELY_OS_ENTITY_LABEL}>Cc</label>
                    <input value={cc} onChange={(e) => setCc(e.target.value)} className="fc-input mt-1 w-full" />
                  </div>
                  <div>
                    <label className={FINELY_OS_ENTITY_LABEL}>Bcc</label>
                    <input value={bcc} onChange={(e) => setBcc(e.target.value)} className="fc-input mt-1 w-full" />
                  </div>
                </div>
                <div>
                  <label className={FINELY_OS_ENTITY_LABEL}>Preheader</label>
                  <input value={preheader} onChange={(e) => setPreheader(e.target.value)} className="fc-input mt-1 w-full" placeholder="Inbox preview line…" />
                </div>
              </>
            ) : null}
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className="fc-input mt-1 w-full" />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Schedule send</label>
              <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className="fc-input mt-1 w-full" />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Body</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14} className={`${finelyOsGlowTextarea('fuchsia')} mt-1 w-full`} />
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/45 mb-2">Merge fields</div>
              <div className="flex flex-wrap gap-1">
                {ALL_TEMPLATE_VAR_KEYS.slice(0, 12).map((f) => (
                  <button key={f} type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setBody((b) => `${b}{{${f}}}`)}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button type="button" className={FINELY_OS_PRIMARY_BTN} disabled={busy} onClick={() => void send()}>
                <Send size={14} /> {busy ? 'Sending…' : dryRun ? 'Preview send' : 'Send live'}
              </button>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-200/80">
                <ShieldCheck size={12} /> Velvet Hammer scan on live sends
              </span>
              {scheduleAt ? (
                <span className="inline-flex items-center gap-1 text-xs text-sky-200/80">
                  <Calendar size={12} /> Schedule queues via Automation Studio
                </span>
              ) : null}
            </div>
            {notice ? <p className="text-sm text-white/70">{notice}</p> : null}
          </div>
        </div>
      </StudioSection>
    </div>
  );
}
