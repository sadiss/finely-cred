import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bot, Mail, Plus, Save, Send, ToggleLeft, ToggleRight, Trash2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import type { CommsChannel, CommsTemplate } from '../../domain/comms';
import type { SupportTopic } from '../../domain/support';
import { listPartners, getPartner } from '../../data/partnersRepo';
import { listCommsSends, listCommsTemplates, createCommsTemplate, deleteCommsTemplate, upsertCommsTemplate, setCommsTemplateEnabled } from '../../data/commsRepo';
import { buildDefaultCommsContext, bulkSendPortalFromTemplate, renderCommsTemplate, sendEmailFromTemplate, sendPortalFromTemplate, sendSmsFromTemplate } from '../../lib/commsEngine';
import { extractTemplateVars } from '../../utils/textTemplate';
import { isFeatureEnabled } from '../../data/settingsRepo';
import type { CommsSequence } from '../../domain/commsSequences';
import {
  advanceEnrollmentStep,
  completeEnrollment,
  createCommsSequence,
  deleteCommsSequence,
  dueSequenceSends,
  enrollPartnerInSequence,
  listCommsSequences,
  listEnrollmentsBySequence,
  pauseEnrollment,
  upsertCommsSequence,
} from '../../data/commsSequencesRepo';

const TOPICS: { value: SupportTopic; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'billing', label: 'Billing' },
  { value: 'disputes', label: 'Disputes & reports' },
  { value: 'documents', label: 'Documents & uploads' },
  { value: 'debt_summons', label: 'Debt & summons' },
  { value: 'identity_theft', label: 'Identity theft' },
  { value: 'business', label: 'Business portal' },
  { value: 'au', label: 'Tradelines / AU' },
  { value: 'other', label: 'Other' },
];

function nowIso() {
  return new Date().toISOString();
}

function fmtIso(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminCommsStudioPage() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [selectedTplId, setSelectedTplId] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [notice, setNotice] = useState<string | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const partners = useMemo(() => listPartners(), [version]);
  const templates = useMemo(() => listCommsTemplates(), [version]);
  const sends = useMemo(() => listCommsSends(60), [version]);
  const sequences = useMemo(() => listCommsSequences(), [version]);

  const selectedTpl = useMemo(() => (selectedTplId ? templates.find((t) => t.id === selectedTplId) ?? null : templates[0] ?? null), [selectedTplId, templates]);
  const selectedPartner = useMemo(() => (selectedPartnerId ? getPartner(selectedPartnerId) : partners[0] ?? null), [selectedPartnerId, partners]);

  const [selectedSeqId, setSelectedSeqId] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedSeqId && sequences[0]?.id) setSelectedSeqId(sequences[0].id);
  }, [selectedSeqId, sequences]);
  const selectedSeq = useMemo<CommsSequence | null>(
    () => (selectedSeqId ? sequences.find((s) => s.id === selectedSeqId) ?? null : sequences[0] ?? null),
    [selectedSeqId, sequences],
  );
  const [seqEdit, setSeqEdit] = useState<CommsSequence | null>(null);
  useEffect(() => setSeqEdit(selectedSeq), [selectedSeq?.id]);

  useEffect(() => {
    if (!selectedTplId && templates[0]?.id) setSelectedTplId(templates[0].id);
  }, [selectedTplId, templates]);
  useEffect(() => {
    if (!selectedPartnerId && partners[0]?.id) setSelectedPartnerId(partners[0].id);
  }, [selectedPartnerId, partners]);

  const draft = useMemo<CommsTemplate | null>(() => {
    if (!selectedTpl) return null;
    return selectedTpl;
  }, [selectedTpl]);

  const [edit, setEdit] = useState<CommsTemplate | null>(null);
  useEffect(() => setEdit(draft), [draft?.id]); // reset when switching templates

  const ctx = useMemo(() => (selectedPartner ? buildDefaultCommsContext({ partner: selectedPartner }) : null), [selectedPartner]);
  const preview = useMemo(() => (edit && ctx ? renderCommsTemplate({ template: edit, ctx }) : { subject: '', body: '' }), [edit, ctx]);
  const vars = useMemo(() => extractTemplateVars(`${edit?.subjectTemplate ?? ''}\n${edit?.bodyTemplate ?? ''}`), [edit?.subjectTemplate, edit?.bodyTemplate]);

  const channel = (edit?.channel ?? 'portal') as CommsChannel;
  const commsDeliveryOn = isFeatureEnabled('commsDelivery');

  return (
    <PageShell badge="Admin" title="Comms Studio" subtitle="Reusable message templates + partner delivery. (Portal now; email/SMS next.)">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <button
            type="button"
            onClick={() => setDryRun((x) => !x)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
            title="Toggle dry-run vs send"
          >
            {dryRun ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
            {dryRun ? 'Dry‑run' : 'Send'}
          </button>
        </div>

        {notice && <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white/75 text-sm whitespace-pre-wrap">{notice}</div>}

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <Mail size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Templates</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const created = createCommsTemplate({
                    name: 'New portal message',
                    channel: 'portal',
                    enabled: true,
                    topic: 'general',
                    threadStrategy: 'append_by_subject',
                    subjectTemplate: 'Message for {{partner.profile.fullName}}',
                    bodyTemplate: 'Hello {{partner.profile.fullName}},\n\nYour next step is:\n- \n\n— Finely Cred',
                    tags: ['starter'],
                    meta: { createdBy: 'admin', createdAt: nowIso() },
                  });
                  setSelectedTplId(created.id);
                  setNotice('Created a new template.');
                  setVersion((v) => v + 1);
                }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 text-[10px] font-black uppercase tracking-widest text-amber-200 transition-all"
              >
                <Plus size={14} /> New
              </button>
            </div>

            <div className="mt-4 space-y-2 max-h-[520px] overflow-y-auto">
              {templates.length === 0 ? (
                <div className="text-white/60 text-sm">No templates yet.</div>
              ) : (
                templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTplId(t.id)}
                    className={`w-full text-left rounded-2xl border p-4 transition-all ${
                      selectedTpl?.id === t.id ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">{t.name}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          {t.enabled ? 'enabled' : 'disabled'} • {t.channel}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCommsTemplateEnabled(t.id, !t.enabled);
                          setVersion((v) => v + 1);
                        }}
                        className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      >
                        {t.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        {t.enabled ? 'On' : 'Off'}
                      </button>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 text-amber-400">
                  <Bot size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Editor</span>
                </div>
                <div className="mt-2 text-white/60 text-sm">
                  Variables: <span className="font-mono text-white/70">{vars.length ? vars.join(', ') : '—'}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!edit) return;
                    upsertCommsTemplate({ ...edit, updatedAt: nowIso() });
                    setNotice('Saved template.');
                    setVersion((v) => v + 1);
                  }}
                  disabled={!edit}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
                >
                  <Save size={14} /> Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedTpl) return;
                    const ok = deleteCommsTemplate(selectedTpl.id);
                    if (ok) setNotice('Deleted template.');
                    setSelectedTplId(null);
                    setVersion((v) => v + 1);
                  }}
                  disabled={!selectedTpl}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/15 text-[10px] font-black uppercase tracking-widest text-rose-200 transition-all disabled:opacity-60"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>

            {!edit ? (
              <div className="text-white/60 text-sm">Select a template to edit.</div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="grid gap-1">
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Name</div>
                    <input
                      value={edit.name}
                      onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                      className="px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30"
                    />
                  </label>
                  <label className="grid gap-1">
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Channel</div>
                    <select
                      value={edit.channel}
                      onChange={(e) => setEdit({ ...edit, channel: e.target.value as CommsChannel })}
                      className="px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white"
                    >
                      <option value="portal">portal (in‑app)</option>
                      <option value="email">email (next)</option>
                      <option value="sms">sms (next)</option>
                    </select>
                  </label>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <label className="grid gap-1">
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Portal topic</div>
                    <select
                      value={edit.topic ?? 'general'}
                      onChange={(e) => setEdit({ ...edit, topic: e.target.value as SupportTopic })}
                      className="px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white"
                      disabled={edit.channel !== 'portal'}
                    >
                      {TOPICS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1">
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Thread strategy</div>
                    <select
                      value={edit.threadStrategy ?? 'append_by_subject'}
                      onChange={(e) => setEdit({ ...edit, threadStrategy: e.target.value as any })}
                      className="px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white"
                      disabled={edit.channel !== 'portal'}
                    >
                      <option value="append_by_subject">append by subject</option>
                      <option value="new_thread">new thread</option>
                    </select>
                  </label>
                </div>

                {edit.channel !== 'sms' && (
                  <label className="grid gap-1">
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Subject template</div>
                    <input
                      value={edit.subjectTemplate ?? ''}
                      onChange={(e) => setEdit({ ...edit, subjectTemplate: e.target.value })}
                      className="px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30"
                      placeholder="e.g. Next steps for {{partner.profile.fullName}}"
                    />
                  </label>
                )}

                <label className="grid gap-1">
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Body template</div>
                  <textarea
                    value={edit.bodyTemplate}
                    onChange={(e) => setEdit({ ...edit, bodyTemplate: e.target.value })}
                    rows={8}
                    className="px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 resize-y"
                  />
                </label>

                <div className="grid lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                    <div className="text-white font-semibold">Preview target</div>
                    <label className="grid gap-1">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Partner</div>
                      <select
                        value={selectedPartner?.id ?? ''}
                        onChange={(e) => setSelectedPartnerId(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white"
                      >
                        {partners.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.profile.fullName} ({p.id.slice(0, 6)})
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={async () => {
                        if (!edit || !selectedPartner) return;
                        if (!edit.enabled) {
                          setNotice('Template is disabled. Turn it on first.');
                          return;
                        }
                        setSending(true);
                        setNotice(null);
                        try {
                          if (channel === 'portal') {
                            const res = sendPortalFromTemplate({ template: edit, partner: selectedPartner, dryRun });
                            setNotice(`${dryRun ? 'Dry-run' : 'Sent'}: ${res.log.subject}`);
                          } else {
                            if (!commsDeliveryOn) {
                              setNotice('Comms Delivery is OFF. Turn on Feature Flags → Comms Delivery (Email/SMS).');
                              return;
                            }
                            if (channel === 'email') {
                              const res = await sendEmailFromTemplate({ template: edit, partner: selectedPartner, dryRun });
                              setNotice(`${dryRun ? 'Dry-run' : 'Sent'}: ${res.log.subject ?? edit.name}`);
                            } else if (channel === 'sms') {
                              const res = await sendSmsFromTemplate({ template: edit, partner: selectedPartner, dryRun });
                              setNotice(`${dryRun ? 'Dry-run' : 'Sent'}: ${res.log.to}`);
                            }
                          }
                        } finally {
                          setVersion((v) => v + 1);
                          setSending(false);
                        }
                      }}
                      disabled={!selectedPartner || !edit || sending}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 w-full"
                    >
                      <Send size={16} /> {sending ? 'Sending…' : dryRun ? 'Dry‑run send' : 'Send now'}
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (!edit || !edit.enabled) { setNotice('Template must be enabled for bulk send.'); return; }
                        setSending(true);
                        setNotice(null);
                        try {
                          const res = bulkSendPortalFromTemplate({ template: edit, partners, dryRun });
                          setNotice(`Bulk ${dryRun ? 'dry-run' : 'sent'}: ${res.sent} delivered, ${res.failed} failed.`);
                        } finally {
                          setSending(false);
                          setVersion((v) => v + 1);
                        }
                      }}
                      disabled={!edit || sending || partners.length === 0}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/15 text-[10px] font-black uppercase tracking-widest text-amber-200 transition-all disabled:opacity-60 w-full"
                    >
                      <Users size={16} /> {sending ? 'Sending…' : `Bulk ${dryRun ? 'dry‑run' : 'send'} (${partners.length})`}
                    </button>
                  </div>

                  <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-black/40 p-4">
                    <div className="text-white font-semibold">Rendered preview</div>
                    <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40 font-mono">subject</div>
                    <div className="mt-1 text-white/80 text-sm whitespace-pre-wrap">{preview.subject || '—'}</div>
                    <div className="mt-3 text-[10px] uppercase tracking-widest text-white/40 font-mono">body</div>
                    <div className="mt-1 text-white/70 text-sm whitespace-pre-wrap">{preview.body || '—'}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
          <div className="text-white font-semibold">Delivery logs</div>
          <div className="mt-2 text-white/60 text-sm">Recent sends (portal/email/sms).</div>
          <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto">
            {sends.length === 0 ? (
              <div className="text-white/60 text-sm">No sends yet.</div>
            ) : (
              sends.map((s) => (
                <div key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-white font-semibold truncate">
                        {s.subject ?? templates.find((t) => t.id === s.templateId)?.name ?? 'Send'}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        {s.channel} • {s.status} • {fmtIso(s.createdAt)} • {s.partnerId ? `partner ${s.partnerId}` : 'system'}
                      </div>
                      {s.error && <div className="mt-2 text-rose-200 text-sm whitespace-pre-wrap">{s.error}</div>}
                    </div>
                    <div className="shrink-0 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                      {s.templateId ? `tpl ${s.templateId}` : '—'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <details className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
          <summary className="cursor-pointer select-none text-white font-semibold">
            Sequences / Campaigns (beta)
          </summary>
          <div className="mt-4 text-white/60 text-sm">
            Create multi-step campaigns (templates + delays), enroll partners, then run “due sends” in dry-run or live mode.
          </div>

          <div className="mt-5 grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-white font-semibold">Sequences</div>
                <button
                  type="button"
                  onClick={() => {
                    const created = createCommsSequence({ name: 'New sequence', defaultChannel: 'portal', enabled: true });
                    window.dispatchEvent(new Event('finely:store'));
                    setSelectedSeqId(created.id);
                    setNotice('Created sequence.');
                    setVersion((v) => v + 1);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 text-[10px] font-black uppercase tracking-widest text-amber-200 transition-all"
                >
                  <Plus size={14} /> New
                </button>
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {sequences.length === 0 ? (
                  <div className="text-white/60 text-sm">No sequences yet.</div>
                ) : (
                  sequences.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSeqId(s.id)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all ${
                        selectedSeq?.id === s.id ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="text-white font-semibold truncate">{s.name}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        {s.enabled ? 'enabled' : 'disabled'} • {s.defaultChannel} • steps:{s.steps.length}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-black/40 p-6 space-y-4">
              {!seqEdit ? (
                <div className="text-white/60 text-sm">Select a sequence.</div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-white font-semibold">Sequence editor</div>
                      <div className="mt-1 text-white/60 text-sm">Steps run relative to enrollment time.</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          upsertCommsSequence(seqEdit);
                          window.dispatchEvent(new Event('finely:store'));
                          setNotice('Saved sequence.');
                          setVersion((v) => v + 1);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                      >
                        <Save size={14} /> Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!seqEdit) return;
                          deleteCommsSequence(seqEdit.id);
                          window.dispatchEvent(new Event('finely:store'));
                          setSelectedSeqId(null);
                          setNotice('Deleted sequence.');
                          setVersion((v) => v + 1);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/15 text-[10px] font-black uppercase tracking-widest text-rose-200 transition-all"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="grid gap-1">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Name</div>
                      <input
                        value={seqEdit.name}
                        onChange={(e) => setSeqEdit({ ...seqEdit, name: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30"
                      />
                    </label>
                    <label className="grid gap-1">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Default channel</div>
                      <select
                        value={seqEdit.defaultChannel}
                        onChange={(e) => setSeqEdit({ ...seqEdit, defaultChannel: e.target.value as any })}
                        className="px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white"
                      >
                        <option value="portal">portal</option>
                        <option value="email">email</option>
                        <option value="sms">sms</option>
                      </select>
                    </label>
                    <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/70">
                      <input
                        type="checkbox"
                        checked={seqEdit.enabled}
                        onChange={(e) => setSeqEdit({ ...seqEdit, enabled: e.target.checked })}
                        className="accent-amber-500"
                      />
                      Enabled
                    </label>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-white font-semibold">Steps</div>
                      <button
                        type="button"
                        onClick={() =>
                          setSeqEdit({
                            ...seqEdit,
                            steps: [...seqEdit.steps, { id: `step_${Date.now().toString(16)}`, templateId: '', delayHours: 48 }],
                          })
                        }
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      >
                        <Plus size={14} /> Step
                      </button>
                    </div>

                    <div className="space-y-3">
                      {seqEdit.steps.map((st, i) => (
                        <div key={st.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Step {i + 1}</div>
                          <div className="grid md:grid-cols-3 gap-3">
                            <label className="grid gap-1 md:col-span-2">
                              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Template</div>
                              <select
                                value={st.templateId}
                                onChange={(e) => {
                                  const next = seqEdit.steps.slice();
                                  next[i] = { ...st, templateId: e.target.value };
                                  setSeqEdit({ ...seqEdit, steps: next });
                                }}
                                className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                              >
                                <option value="">(select)</option>
                                {templates.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name} • {t.channel}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="grid gap-1">
                              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Delay (hours)</div>
                              <input
                                type="number"
                                min={0}
                                value={st.delayHours ?? 0}
                                onChange={(e) => {
                                  const next = seqEdit.steps.slice();
                                  next[i] = { ...st, delayHours: Math.max(0, Number(e.target.value) || 0) };
                                  setSeqEdit({ ...seqEdit, steps: next });
                                }}
                                className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                              />
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSeqEdit({ ...seqEdit, steps: seqEdit.steps.filter((x) => x.id !== st.id) })}
                            className="text-[10px] font-black uppercase tracking-widest text-rose-200 hover:text-rose-100"
                          >
                            Remove step
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-white font-semibold">Enrollments</div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!selectedPartner) return;
                            enrollPartnerInSequence({ partnerId: selectedPartner.id, sequenceId: seqEdit.id });
                            window.dispatchEvent(new Event('finely:store'));
                            setNotice(`Enrolled ${selectedPartner.profile.fullName ?? selectedPartner.id}.`);
                            setVersion((v) => v + 1);
                          }}
                          disabled={!selectedPartner}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/15 text-[10px] font-black uppercase tracking-widest text-emerald-200 transition-all disabled:opacity-60"
                        >
                          <Users size={14} /> Enroll selected partner
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setSending(true);
                            setNotice(null);
                            try {
                              const due = dueSequenceSends({}).filter((x) => x.sequence.id === seqEdit.id);
                              if (!due.length) {
                                setNotice('No due sends right now.');
                                return;
                              }
                              let ok = 0;
                              let bad = 0;
                              for (const d of due.slice(0, 200)) {
                                const partner = getPartner(d.enrollment.partnerId);
                                const tpl = templates.find((t) => t.id === d.templateId) ?? null;
                                if (!partner || !tpl) {
                                  bad++;
                                  continue;
                                }
                                const ch = (d.channel ?? seqEdit.defaultChannel) as any;
                                if (ch === 'portal') {
                                  const res = sendPortalFromTemplate({ template: tpl, partner, dryRun });
                                  if (res.ok) ok++; else bad++;
                                  if (!dryRun && res.ok) {
                                    advanceEnrollmentStep({ enrollmentId: d.enrollment.id, stepIndex: d.stepIndex });
                                    if (d.stepIndex >= (d.sequence.steps.length - 1)) completeEnrollment(d.enrollment.id);
                                  }
                                } else if (ch === 'email') {
                                  if (!dryRun && !commsDeliveryOn) { bad++; continue; }
                                  // eslint-disable-next-line no-await-in-loop
                                  const res = await sendEmailFromTemplate({ template: tpl, partner, dryRun });
                                  if (res.ok) ok++; else bad++;
                                  if (!dryRun && res.ok) {
                                    advanceEnrollmentStep({ enrollmentId: d.enrollment.id, stepIndex: d.stepIndex });
                                    if (d.stepIndex >= (d.sequence.steps.length - 1)) completeEnrollment(d.enrollment.id);
                                  }
                                } else if (ch === 'sms') {
                                  if (!dryRun && !commsDeliveryOn) { bad++; continue; }
                                  // eslint-disable-next-line no-await-in-loop
                                  const res = await sendSmsFromTemplate({ template: tpl, partner, dryRun });
                                  if (res.ok) ok++; else bad++;
                                  if (!dryRun && res.ok) {
                                    advanceEnrollmentStep({ enrollmentId: d.enrollment.id, stepIndex: d.stepIndex });
                                    if (d.stepIndex >= (d.sequence.steps.length - 1)) completeEnrollment(d.enrollment.id);
                                  }
                                } else {
                                  bad++;
                                }
                              }
                              window.dispatchEvent(new Event('finely:store'));
                              setVersion((v) => v + 1);
                              setNotice(`${dryRun ? 'Dry-run' : 'Sent'} due steps: ok ${ok}, failed ${bad}.`);
                            } finally {
                              setSending(false);
                            }
                          }}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
                          disabled={sending}
                        >
                          <Send size={14} /> Run due sends
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-[260px] overflow-y-auto">
                      {listEnrollmentsBySequence(seqEdit.id).length === 0 ? (
                        <div className="text-white/60 text-sm">No enrollments yet.</div>
                      ) : (
                        listEnrollmentsBySequence(seqEdit.id).slice(0, 80).map((e) => (
                          <div key={e.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-white/85 font-semibold truncate">{getPartner(e.partnerId)?.profile.fullName ?? e.partnerId}</div>
                              <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                enrolled {fmtIso(e.enrolledAt)} • last step {e.lastSentStepIndex + 1}/{seqEdit.steps.length}{' '}
                                {e.completedAt ? '• completed' : e.pausedAt ? '• paused' : ''}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                pauseEnrollment(e.id, !e.pausedAt);
                                window.dispatchEvent(new Event('finely:store'));
                                setVersion((v) => v + 1);
                              }}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                            >
                              {e.pausedAt ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                              {e.pausedAt ? 'Paused' : 'Active'}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </details>
      </div>
    </PageShell>
  );
}

