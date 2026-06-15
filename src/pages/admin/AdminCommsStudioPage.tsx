import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Bot, Mail, MessageSquare, Plus, Save, Send, ToggleLeft, ToggleRight, Trash2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import type { CommsChannel, CommsTemplate } from '../../domain/comms';
import type { SupportTopic } from '../../domain/support';
import type { Partner } from '../../domain/partners';
import { listPartners } from '../../data/partnersRepo';
import { listCommsSends, listCommsTemplates, createCommsTemplate, deleteCommsTemplate, upsertCommsTemplate, setCommsTemplateEnabled } from '../../data/commsRepo';
import { countNurtureCommsTemplates, ensureNurtureCommsTemplatesOnce } from '../../data/commsNurtureSeed';
import { countCommsHtmlTemplates, ensureCommsHtmlTemplatesOnce } from '../../data/commsHtmlTemplateSeed';
import { ensureDefaultEmailDomainsOnce } from '../../data/emailDomainsRepo';
import { EmailDomainsPanel } from '../../components/comms/EmailDomainsPanel';
import { NURTURE_SEQUENCES, getNurtureSequence } from '../../domain/nurtureSequences';
import { listNurtureEnrollments } from '../../lib/nurtureEngine';
import { buildDefaultCommsContext, bulkSendPortalFromTemplate, renderCommsTemplate, sendEmailFromTemplate, sendPortalFromTemplate, sendSmsFromTemplate } from '../../lib/commsEngine';
import { extractTemplateVars } from '../../utils/textTemplate';
import { isFeatureEnabled, getSiteSettings } from '../../data/settingsRepo';
import { MessageTemplateEditor } from '../../components/comms/MessageTemplateEditor';
import { TEMPLATE_VARIABLE_GROUPS, WELCOME_HTML_STARTER } from '../../comms/templateVariables';
import { Sparkles } from 'lucide-react';
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
import { ADMIN_COMMS_PATHS, COMMS_SURFACE_GUIDE } from '../../components/comms/commsWorkspaceModel';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyOsIconBadge, FinelyOsSectionTitle } from '../../features/os/FinelyOsIconBadge';
import { FinelyOsOverviewStatTile } from '../../features/os/FinelyOsOverviewStatTile';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_PAGE,
  FINELY_OS_TOOLBAR,
  FINELY_OS_COMMS_BANNER,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_DANGER_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_NOTICE,
  FINELY_OS_KPI_ACCENTS,
  FINELY_OS_VIEW_TABS,
  finelyOsListItem,
  finelyOsInlineListItem,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

type CommsStudioTab = 'overview' | 'templates' | 'sequences' | 'delivery' | 'domains';

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
  const [commsTab, setCommsTab] = useState<CommsStudioTab>('templates');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    ensureNurtureCommsTemplatesOnce();
    ensureCommsHtmlTemplatesOnce();
    ensureDefaultEmailDomainsOnce();
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const [partners, setPartners] = useState<Partner[]>([]);
  useEffect(() => { listPartners().then(setPartners); }, [version]);
  const templates = useMemo(() => listCommsTemplates(), [version]);
  const sends = useMemo(() => listCommsSends(60), [version]);
  const sequences = useMemo(() => listCommsSequences(), [version]);

  const selectedTpl = useMemo(() => (selectedTplId ? templates.find((t) => t.id === selectedTplId) ?? null : templates[0] ?? null), [selectedTplId, templates]);
  const selectedPartner = useMemo(() => (selectedPartnerId ? partners.find((p) => p.id === selectedPartnerId) : partners[0]) ?? null, [selectedPartnerId, partners]);
  const partnerById = useMemo(() => new Map(partners.map(p => [p.id, p])), [partners]);

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
  const seqEnrollments = useMemo(
    () => (seqEdit ? listEnrollmentsBySequence(seqEdit.id) : []),
    [seqEdit?.id, version],
  );

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

  const nurtureEnrollments = useMemo(() => listNurtureEnrollments(40), [version]);

  const commsStats = useMemo(
    () => {
      const nurture = countNurtureCommsTemplates();
      const htmlTemplates = countCommsHtmlTemplates();
      return {
        templates: templates.length,
        enabled: templates.filter((t) => t.enabled).length,
        sequences: sequences.length,
        sends: sends.length,
        nurtureSequences: NURTURE_SEQUENCES.length,
        nurtureTemplates: nurture.present,
        htmlTemplates: htmlTemplates.total,
      };
    },
    [templates, sequences, sends, version],
  );

  return (
    <PageShell badge="Admin" title="Comms Studio" subtitle="Outbound templates & sequences — posts into partner Communication Hub threads. Live chat is Support Inbox.">
      <div className={FINELY_OS_PAGE}>
        {!commsDeliveryOn ? (
          <div className={`${FINELY_OS_NOTICE} mb-4 border-amber-500/30 bg-amber-500/10`}>
            Email/SMS delivery is off — portal thread posts still work. Enable Comms delivery in{' '}
            <button type="button" className="text-amber-200 underline" onClick={() => navigate('/admin/settings?tab=features')}>
              Admin Settings → Features
            </button>
            .
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => navigate(ADMIN_COMMS_PATHS.supportInbox)} className={FINELY_OS_SECONDARY_BTN}>
              Support Inbox <ArrowRight size={12} />
            </button>
            <button type="button" onClick={() => navigate(ADMIN_COMMS_PATHS.calendar)} className={FINELY_OS_SECONDARY_BTN}>
              Admin calendar <ArrowRight size={12} />
            </button>
            <button
              type="button"
              onClick={() => setDryRun((x) => !x)}
              className={dryRun ? FINELY_OS_SECONDARY_BTN : FINELY_OS_SUCCESS_BTN}
              title="Toggle dry-run vs send"
            >
              {dryRun ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
              {dryRun ? 'Dry‑run' : 'Send'}
            </button>
          </div>
        </div>

        <FinelyUnifiedHubLayout
          eyebrow="Outbound comms"
          title="Comms Studio"
          subtitle="Templates, sequences, and delivery logs — posts into partner Communication Hub threads."
          accent="fuchsia"
          kpis={[
            { label: 'Templates', value: String(commsStats.templates), accent: 'fuchsia' },
            { label: 'Enabled', value: String(commsStats.enabled), accent: 'emerald' },
            { label: 'Sequences', value: String(commsStats.sequences), accent: 'violet' },
            { label: 'Recent sends', value: String(commsStats.sends), accent: 'sky' },
          ]}
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'templates', label: 'Templates' },
            { id: 'domains', label: 'Domains & signatures' },
            { id: 'sequences', label: 'Sequences' },
            { id: 'delivery', label: 'Delivery log' },
          ]}
          activeTab={commsTab}
          onTabChange={(id) => setCommsTab(id as CommsStudioTab)}
          primaryAction={{ label: 'Support Inbox', onClick: () => navigate(ADMIN_COMMS_PATHS.supportInbox) }}
          secondaryAction={{ label: 'Welcome settings', onClick: () => navigate('/admin/settings?tab=site') }}
          detailSlot={
            <div className="space-y-2">
              <div className={`${FINELY_OS_ENTITY_TITLE} text-base`}>Comms Studio ≠ Communication Hub</div>
              <p className={FINELY_OS_ENTITY_BODY}>
                Comms Studio sends template messages (portal, email, SMS). Partners read portal sends in their Communication Hub → Team threads — the same threads you reply to in Support Inbox.
              </p>
              <ul className={`space-y-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                {COMMS_SURFACE_GUIDE.filter((s) => s.audience !== 'partner').map((s) => (
                  <li key={s.id}>
                    <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{s.emoji} {s.title}:</span> {s.when}
                  </li>
                ))}
              </ul>
            </div>
          }
          detailLabel="Studio vs Hub guide"
        >
        {notice && <div className={FINELY_OS_NOTICE}>{notice}</div>}

        {commsTab === 'overview' ? (
          <div className="space-y-4">
            <div className={`${FINELY_OS_TOOLBAR} justify-between`}>
              <div className="flex items-start gap-3">
                <FinelyOsIconBadge icon={Sparkles} accent="fuchsia" size={16} className="p-2" />
                <div>
                  <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>Welcome & intro messages</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                    Configure the post-login banner, HTML templates, sending domains, and welcome email. Pre-built HTML templates: {commsStats.htmlTemplates}.
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => navigate('/admin/settings?tab=site')} className={FINELY_OS_SECONDARY_BTN}>
                Edit welcome experience
              </button>
            </div>
            <div className={`${finelyOsCatalogCard('violet')} !p-5 p-4 space-y-3`}>
              <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>Active funnel nurture enrollments</div>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Leads enrolled from funnels, Meta ads, and purchases — processed by platform cron / Automation autopilot.
              </p>
              {nurtureEnrollments.filter((e) => e.status === 'active').length === 0 ? (
                <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>No active enrollments yet — capture a lead from any funnel to start.</p>
              ) : (
                <FinelyOsPaginatedStack
                  items={nurtureEnrollments.filter((e) => e.status === 'active')}
                  pageSize={8}
                  emptyMessage="No active enrollments."
                  itemSpacingClassName="space-y-2"
                  renderItem={(e) => {
                    const seq = getNurtureSequence(e.sequenceId);
                    return (
                      <div key={e.id} className={`${finelyOsInlineListItem()} px-3 py-2 text-xs flex justify-between gap-2`}>
                        <span className={FINELY_OS_ENTITY_VALUE}>{seq?.name ?? e.sequenceId}</span>
                        <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono shrink-0`}>next {new Date(e.nextRunAt).toLocaleString()}</span>
                      </div>
                    );
                  }}
                />
              )}
            </div>
          </div>
        ) : null}

        {commsTab === 'templates' ? (
        <>
        <div className={`${FINELY_OS_TOOLBAR} justify-between`}>
          <div className={`${FINELY_OS_ENTITY_BODY} text-sm`}>Author portal, email, and SMS templates with live preview + test send.</div>
          <button type="button" onClick={() => navigate('/admin/support')} className={FINELY_OS_SECONDARY_BTN}>
            Support Inbox <ArrowRight size={12} />
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-4 ${finelyOsCatalogCard('violet')} !p-5`}>
            <div className="flex items-center justify-between gap-3">
              <FinelyOsSectionTitle icon={Mail} label="Templates" accent="fuchsia" />
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
                className={FINELY_OS_PRIMARY_BTN}
              >
                <Plus size={14} /> New
              </button>
            </div>

            <div className="mt-4">
            <FinelyOsPaginatedStack
              items={templates}
              pageSize={8}
              emptyMessage="No templates yet."
              renderItem={(t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTplId(t.id)}
                  className={finelyOsListItem(selectedTpl?.id === t.id, 'fuchsia')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{t.name}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
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
                      className={`shrink-0 ${FINELY_OS_SECONDARY_BTN}`}
                    >
                      {t.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      {t.enabled ? 'On' : 'Off'}
                    </button>
                  </div>
                </button>
              )}
            />
            </div>
          </div>

          <div className={`lg:col-span-8 ${finelyOsCatalogCard('violet')} !p-5 space-y-5`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <FinelyOsSectionTitle icon={Bot} label="Editor" accent="violet" />
                <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                  Variables: <span className="font-mono text-violet-200/90">{vars.length ? vars.join(', ') : '—'}</span>
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
                  className={FINELY_OS_PRIMARY_BTN}
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
                  className={FINELY_OS_DANGER_BTN}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>

            {!edit ? (
              <div className={FINELY_OS_ENTITY_BODY}>Select a template to edit.</div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="grid gap-1">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Name</div>
                    <input
                      value={edit.name}
                      onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                      className={FINELY_OS_ENTITY_INPUT}
                    />
                  </label>
                  <label className="grid gap-1">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Channel</div>
                    <select
                      value={edit.channel}
                      onChange={(e) => setEdit({ ...edit, channel: e.target.value as CommsChannel })}
                      className={FINELY_OS_ENTITY_SELECT}
                    >
                      <option value="portal">portal (in‑app)</option>
                      <option value="email">email (next)</option>
                      <option value="sms">sms (next)</option>
                    </select>
                  </label>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <label className="grid gap-1">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Portal topic</div>
                    <select
                      value={edit.topic ?? 'general'}
                      onChange={(e) => setEdit({ ...edit, topic: e.target.value as SupportTopic })}
                      className={FINELY_OS_ENTITY_SELECT}
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
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Thread strategy</div>
                    <select
                      value={edit.threadStrategy ?? 'append_by_subject'}
                      onChange={(e) => setEdit({ ...edit, threadStrategy: e.target.value as any })}
                      className={FINELY_OS_ENTITY_SELECT}
                      disabled={edit.channel !== 'portal'}
                    >
                      <option value="append_by_subject">append by subject</option>
                      <option value="new_thread">new thread</option>
                    </select>
                  </label>
                </div>

                {edit.channel !== 'sms' && (
                  <label className="grid gap-1">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Subject template</div>
                    <input
                      value={edit.subjectTemplate ?? ''}
                      onChange={(e) => setEdit({ ...edit, subjectTemplate: e.target.value })}
                      className={FINELY_OS_ENTITY_INPUT}
                      placeholder="e.g. Next steps for {{partner.profile.fullName}}"
                    />
                  </label>
                )}

                <label className="grid gap-1">
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Body template</div>
                  {edit.channel === 'email' && (edit.meta?.contentType === 'html' || (edit.bodyTemplate || '').includes('<')) ? (
                    <MessageTemplateEditor
                      html={edit.bodyTemplate || WELCOME_HTML_STARTER}
                      onChangeHtml={(bodyTemplate) => setEdit({ ...edit, bodyTemplate, meta: { ...(edit.meta ?? {}), contentType: 'html' } })}
                      previewContext={ctx ?? undefined}
                    />
                  ) : (
                    <>
                      {edit.channel === 'email' ? (
                        <button
                          type="button"
                          onClick={() =>
                            setEdit({
                              ...edit,
                              meta: { ...(edit.meta ?? {}), contentType: 'html' },
                              bodyTemplate: edit.bodyTemplate || WELCOME_HTML_STARTER,
                            })
                          }
                          className={`mb-2 ${FINELY_OS_SECONDARY_BTN}`}
                        >
                          Switch to HTML editor (drag & drop)
                        </button>
                      ) : null}
                      <textarea
                        value={edit.bodyTemplate}
                        onChange={(e) => setEdit({ ...edit, bodyTemplate: e.target.value })}
                        rows={8}
                        className={`${FINELY_OS_ENTITY_INPUT} resize-y`}
                      />
                    </>
                  )}
                  <div className={`mt-2 text-[10px] ${FINELY_OS_ENTITY_SUBLABEL}`}>
                    Merge tags: {TEMPLATE_VARIABLE_GROUPS.flatMap((g) => g.vars.slice(0, 2).map((v) => `{{${v.key}}}`)).slice(0, 8).join(', ')}…
                  </div>
                </label>

                <div className="grid lg:grid-cols-12 gap-4">
                  <div className={`lg:col-span-5 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                    <div className={FINELY_OS_ENTITY_VALUE}>Preview target</div>
                    <label className="grid gap-1">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Partner</div>
                      <select
                        value={selectedPartner?.id ?? ''}
                        onChange={(e) => setSelectedPartnerId(e.target.value)}
                        className={FINELY_OS_ENTITY_SELECT}
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
                      className={`${FINELY_OS_SUCCESS_BTN} w-full justify-center py-3`}
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
                      className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center py-3`}
                    >
                      <Users size={16} /> {sending ? 'Sending…' : `Bulk ${dryRun ? 'dry‑run' : 'send'} (${partners.length})`}
                    </button>
                  </div>

                  <div className={`lg:col-span-7 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                    <div className={FINELY_OS_ENTITY_VALUE}>Rendered preview</div>
                    <div className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>subject</div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap`}>{preview.subject || '—'}</div>
                    <div className={`mt-3 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>body</div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap`}>{preview.body || '—'}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        </>
        ) : null}

        {commsTab === 'domains' ? (
          <EmailDomainsPanel version={version} onChanged={() => setVersion((v) => v + 1)} />
        ) : null}

        {commsTab === 'delivery' ? (
        <div className={`${finelyOsCatalogCard('violet')} !p-5`} data-fc-accent="violet">
          <FinelyOsSectionTitle icon={Send} label="Delivery logs" accent="sky" />
          <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>Recent sends (portal/email/sms).</div>
          <div className="mt-4">
          <FinelyOsPaginatedStack
            items={sends}
            pageSize={8}
            emptyMessage="No sends yet."
            renderItem={(s) => (
              <div key={s.id} className={finelyOsInlineListItem()}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>
                      {s.subject ?? templates.find((t) => t.id === s.templateId)?.name ?? 'Send'}
                    </div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                      {s.channel} • {s.status} • {fmtIso(s.createdAt)} • {s.partnerId ? `partner ${s.partnerId}` : 'system'}
                    </div>
                    {s.error && <div className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-rose-300 whitespace-pre-wrap`}>{s.error}</div>}
                  </div>
                  <div className={`shrink-0 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                    {s.templateId ? `tpl ${s.templateId}` : '—'}
                  </div>
                </div>
              </div>
            )}
          />
          </div>
        </div>
        ) : null}

        {commsTab === 'sequences' ? (
        <div className={`${finelyOsCatalogCard('violet')} !p-5`} data-fc-accent="violet">
          <FinelyOsSectionTitle icon={Users} label="Sequences / Campaigns" accent="violet" />
          <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
            Create multi-step campaigns (templates + delays), enroll partners, then run “due sends” in dry-run or live mode.
          </div>

          <div className="mt-5 grid lg:grid-cols-12 gap-6">
            <div className={`lg:col-span-4 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
              <div className="flex items-center justify-between gap-3">
                <div className={FINELY_OS_ENTITY_VALUE}>Sequences</div>
                <button
                  type="button"
                  onClick={() => {
                    const created = createCommsSequence({ name: 'New sequence', defaultChannel: 'portal', enabled: true });
                    window.dispatchEvent(new Event('finely:store'));
                    setSelectedSeqId(created.id);
                    setNotice('Created sequence.');
                    setVersion((v) => v + 1);
                  }}
                  className={FINELY_OS_PRIMARY_BTN}
                >
                  <Plus size={14} /> New
                </button>
              </div>

              <div className="mt-1">
              <FinelyOsPaginatedStack
                items={sequences}
                pageSize={6}
                emptyMessage="No sequences yet."
                renderItem={(s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSeqId(s.id)}
                    className={finelyOsListItem(selectedSeq?.id === s.id, 'fuchsia')}
                  >
                    <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{s.name}</div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                      {s.enabled ? 'enabled' : 'disabled'} • {s.defaultChannel} • steps:{s.steps.length}
                    </div>
                  </button>
                )}
              />
              </div>
            </div>

            <div className={`lg:col-span-8 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-4`}>
              {!seqEdit ? (
                <div className={FINELY_OS_ENTITY_BODY}>Select a sequence.</div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className={FINELY_OS_ENTITY_VALUE}>Sequence editor</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>Steps run relative to enrollment time.</div>
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
                        className={FINELY_OS_PRIMARY_BTN}
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
                        className={FINELY_OS_DANGER_BTN}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="grid gap-1">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Name</div>
                      <input
                        value={seqEdit.name}
                        onChange={(e) => setSeqEdit({ ...seqEdit, name: e.target.value })}
                        className={FINELY_OS_ENTITY_INPUT}
                      />
                    </label>
                    <label className="grid gap-1">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Default channel</div>
                      <select
                        value={seqEdit.defaultChannel}
                        onChange={(e) => setSeqEdit({ ...seqEdit, defaultChannel: e.target.value as any })}
                        className={FINELY_OS_ENTITY_SELECT}
                      >
                        <option value="portal">portal</option>
                        <option value="email">email</option>
                        <option value="sms">sms</option>
                      </select>
                    </label>
                    <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                      <input
                        type="checkbox"
                        checked={seqEdit.enabled}
                        onChange={(e) => setSeqEdit({ ...seqEdit, enabled: e.target.checked })}
                        className="accent-violet-600"
                      />
                      Enabled
                    </label>
                  </div>

                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className={FINELY_OS_ENTITY_VALUE}>Steps</div>
                      <button
                        type="button"
                        onClick={() =>
                          setSeqEdit({
                            ...seqEdit,
                            steps: [...seqEdit.steps, { id: `step_${Date.now().toString(16)}`, templateId: '', delayHours: 48 }],
                          })
                        }
                        className={FINELY_OS_SECONDARY_BTN}
                      >
                        <Plus size={14} /> Step
                      </button>
                    </div>

                    <div className="space-y-3">
                      {seqEdit.steps.map((st, i) => (
                        <div key={st.id} className={`${finelyOsInlineListItem()} space-y-3`}>
                          <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>Step {i + 1}</div>
                          <div className="grid md:grid-cols-3 gap-3">
                            <label className="grid gap-1 md:col-span-2">
                              <div className={FINELY_OS_ENTITY_SUBLABEL}>Template</div>
                              <select
                                value={st.templateId}
                                onChange={(e) => {
                                  const next = seqEdit.steps.slice();
                                  next[i] = { ...st, templateId: e.target.value };
                                  setSeqEdit({ ...seqEdit, steps: next });
                                }}
                                className={`${FINELY_OS_ENTITY_SELECT} text-[11px] py-2`}
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
                              <div className={FINELY_OS_ENTITY_SUBLABEL}>Delay (hours)</div>
                              <input
                                type="number"
                                min={0}
                                value={st.delayHours ?? 0}
                                onChange={(e) => {
                                  const next = seqEdit.steps.slice();
                                  next[i] = { ...st, delayHours: Math.max(0, Number(e.target.value) || 0) };
                                  setSeqEdit({ ...seqEdit, steps: next });
                                }}
                                className={`${FINELY_OS_ENTITY_SELECT} text-[11px] py-2`}
                              />
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSeqEdit({ ...seqEdit, steps: seqEdit.steps.filter((x) => x.id !== st.id) })}
                            className={`${FINELY_OS_ENTITY_SUBLABEL} text-rose-300 hover:text-rose-200`}
                          >
                            Remove step
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className={FINELY_OS_ENTITY_VALUE}>Enrollments</div>
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
                          className={FINELY_OS_SUCCESS_BTN}
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
                                const partner = partnerById.get(d.enrollment.partnerId);
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
                          className={FINELY_OS_PRIMARY_BTN}
                          disabled={sending}
                        >
                          <Send size={14} /> Run due sends
                        </button>
                      </div>
                    </div>

                    <div className="mt-2">
                    <FinelyOsPaginatedStack
                      items={seqEnrollments}
                      pageSize={8}
                      emptyMessage="No enrollments yet."
                      renderItem={(e) => (
                        <div key={e.id} className={`${finelyOsInlineListItem()} flex flex-wrap items-start justify-between gap-3`}>
                          <div className="min-w-0">
                            <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{partnerById.get(e.partnerId)?.profile.fullName ?? e.partnerId}</div>
                            <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                              enrolled {fmtIso(e.enrolledAt)} • last step {e.lastSentStepIndex + 1}/{seqEdit!.steps.length}{' '}
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
                            className={FINELY_OS_SECONDARY_BTN}
                          >
                            {e.pausedAt ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                            {e.pausedAt ? 'Paused' : 'Active'}
                          </button>
                        </div>
                      )}
                    />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        ) : null}

        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
</div>
    </PageShell>
  );
}

