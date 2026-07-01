import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileText, Mail, ShieldAlert, Users, Zap } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsGlassPanel } from '../../features/os/FinelyOsGlassPanel';
import { FinelyOsOverviewStatTile } from '../../features/os/FinelyOsOverviewStatTile';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsInlineListItem,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';
import {
  autopilotQueueKpis,
  listAutopilotQueue,
  setAutopilotQueueStatus,
  type AutopilotQueueItem,
} from '../../data/automationOpsQueue';
import { listRoleCoverageGaps, loadStaffRoster } from '../../data/staffRoster';
import type { AgentPersonaId } from '../../domain/agentPersonas';
import { getAgentPersona } from '../../domain/agentPersonas';
import { listAutomationRules } from '../../data/automationStudioRepo';
import { listLettersByPartner } from '../../data/lettersRepo';
import { listPartnersLocal } from '../../data/partnersRepo';
import { listAiActionAudit } from '../../data/aiActionAuditLog';
import { FINELY_MAIL_COPY } from '../../lib/mailWhiteLabel';
import { Overnight50AdminNav } from '../../components/overnight50/Overnight50AdminNav';

type QueueTab = 'draft_review' | 'mail_confirm' | 'complaint' | 'staff_gap' | 'all';

export default function AdminHandsFreeOpsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState<QueueTab>('all');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'all' || t === 'draft_review' || t === 'mail_confirm' || t === 'complaint' || t === 'staff_gap') {
      setTab(t);
    }
  }, [searchParams]);

  const selectTab = (id: QueueTab) => {
    setTab(id);
    navigate(`/admin/hands-free-ops?tab=${id}`, { replace: true });
  };

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const kpis = useMemo(() => autopilotQueueKpis(), [version]);
  const pending = useMemo(() => listAutopilotQueue('pending'), [version]);
  const filtered = useMemo(() => {
    if (tab === 'all') return pending;
    return pending.filter((i) => i.kind === tab);
  }, [pending, tab]);

  const auditLog = useMemo(() => listAiActionAudit(12), [version]);

  const liveRules = useMemo(() => listAutomationRules().filter((r) => r.enabled).length, [version]);
  const partners = useMemo(() => listPartnersLocal(), [version]);

  const lettersToday = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const ts = start.getTime();
    let n = 0;
    for (const p of partners) {
      n += listLettersByPartner(p.id).filter((l) => Date.parse(l.createdAt) >= ts && l.title.includes('Auto-draft')).length;
    }
    return n;
  }, [partners, version]);

  const staffGaps = useMemo(() => {
    const roles: AgentPersonaId[] = [
      'dispute_coach',
      'processing_agent',
      'finely_advisor',
      'support_specialist',
      'debt_strategist',
      'letter_ops_agent',
      'compliance_agent',
    ];
    return listRoleCoverageGaps(roles).map((g) => {
      const roleId = g.split(':')[0] as AgentPersonaId;
      const label = getAgentPersona(roleId)?.displayTitle ?? roleId;
      return g.includes('no roster') ? `${label}: no roster members` : `${label}: no one on shift now`;
    });
  }, [version]);

  const dismiss = (id: string) => {
    setAutopilotQueueStatus(id, 'dismissed');
    setVersion((v) => v + 1);
  };

  const done = (id: string) => {
    setAutopilotQueueStatus(id, 'done');
    setVersion((v) => v + 1);
  };

  const tabBtn = (id: QueueTab, label: string, count: number) => (
    <button type="button" onClick={() => selectTab(id)} className={finelyOsViewTab(tab === id, 'emerald')}>
      {label} {count ? `(${count})` : ''}
    </button>
  );

  const queueCard = (item: AutopilotQueueItem) => (
    <div key={item.id} className={`${finelyOsInlineListItem()} p-4 flex flex-wrap items-start justify-between gap-3`}>
      <div className="min-w-0">
        <div className={FINELY_OS_ENTITY_SUBLABEL}>{item.kind.replace(/_/g, ' ')}</div>
        <div className={`${FINELY_OS_ENTITY_VALUE} mt-1`}>{item.title}</div>
        <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>
          {item.partnerName ?? item.partnerId}
          {item.bureau ? ` · ${item.bureau}` : ''}
        </div>
        {item.body ? <p className={`${FINELY_OS_ENTITY_BODY} text-sm mt-2`}>{item.body}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        {item.letterId ? (
          <button
            type="button"
            onClick={() => navigate(`/admin/partners/${item.partnerId}?tab=letters`)}
            className={FINELY_OS_SECONDARY_BTN}
          >
            Open letters
          </button>
        ) : (
          <button type="button" onClick={() => navigate(`/admin/partners/${item.partnerId}`)} className={FINELY_OS_SECONDARY_BTN}>
            Open partner
          </button>
        )}
        <button type="button" onClick={() => done(item.id)} className={FINELY_OS_SUCCESS_BTN}>
          <CheckCircle2 size={12} /> Done
        </button>
        <button type="button" onClick={() => dismiss(item.id)} className={FINELY_OS_SECONDARY_BTN}>
          Dismiss
        </button>
      </div>
    </div>
  );

  return (
    <PageShell title="Hands-Free Ops" subtitle="Autopilot queues — draft review, mail confirm, escalations">
      <div className="space-y-6">
        <Overnight50AdminNav compact />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <FinelyOsOverviewStatTile icon={FileText} label="Auto-drafted today" value={String(lettersToday)} accent="emerald" iconAccent="emerald" />
          <FinelyOsOverviewStatTile icon={FileText} label="Draft review queue" value={String(kpis.draftReview)} accent="amber" iconAccent="amber" />
          <FinelyOsOverviewStatTile icon={Mail} label="Mail confirm" value={String(kpis.mailConfirm)} accent="violet" iconAccent="violet" />
          <FinelyOsOverviewStatTile icon={ShieldAlert} label="Escalations" value={String(kpis.complaint)} accent="rose" iconAccent="rose" />
          <FinelyOsOverviewStatTile icon={Zap} label="Live automations" value={String(liveRules)} accent="sky" iconAccent="sky" />
        </div>

        <FinelyOsGlassPanel icon={Zap} title="Autopilot queues" accent="emerald">
          <div className={`${FINELY_OS_VIEW_TABS} mb-4`}>
            {tabBtn('all', 'All', pending.length)}
            {tabBtn('draft_review', 'Draft review', kpis.draftReview)}
            {tabBtn('mail_confirm', 'Mail confirm', kpis.mailConfirm)}
            {tabBtn('complaint', 'Complaints', kpis.complaint)}
          </div>
          {filtered.length ? (
            <div className="space-y-2">{filtered.map(queueCard)}</div>
          ) : (
            <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>No pending items — autopilot is caught up.</p>
          )}
          <button type="button" onClick={() => navigate('/admin/automations')} className={`${FINELY_OS_PRIMARY_BTN} mt-4`}>
            Open Automation Studio
          </button>
        </FinelyOsGlassPanel>

        <div className="grid lg:grid-cols-2 gap-4">
          <FinelyOsGlassPanel icon={FileText} title="How letter autopilot works" accent="amber">
            <ul className={`${FINELY_OS_ENTITY_BODY} text-sm space-y-2 list-disc pl-4`}>
              <li>Report uploaded → optional auto-draft with factual dispute findings only.</li>
              <li>Draft lands in partner vault + appears here for human review.</li>
              <li>{FINELY_MAIL_COPY.humanConfirm}</li>
            </ul>
          </FinelyOsGlassPanel>

          <FinelyOsGlassPanel icon={Users} title="Staff coverage (next 4h)" accent="violet">
            {staffGaps.length ? (
              <ul className={`${FINELY_OS_ENTITY_BODY} text-sm space-y-2`}>
                {staffGaps.map((g) => (
                  <li key={g} className="flex items-center gap-2 text-amber-200/90">
                    <ShieldAlert size={14} /> {g}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
                Core roles covered · {loadStaffRoster().filter((s) => s.active).length} active roster members
              </p>
            )}
            <button type="button" onClick={() => navigate('/admin/agent-staff')} className={`${FINELY_OS_SECONDARY_BTN} mt-3`}>
              Manage roster
            </button>
          </FinelyOsGlassPanel>
        </div>

        <FinelyOsGlassPanel icon={Mail} title="Mail confirm gate" accent="rose">
          <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
            Letters with status <strong className="text-white/80">mail_pending</strong> or items in the mail confirm queue require admin approval in Letter Studio before physical mail is sent.
          </p>
        </FinelyOsGlassPanel>

        <FinelyOsGlassPanel icon={Zap} title="AI action audit log" accent="sky">
          <p className={`${FINELY_OS_ENTITY_BODY} text-sm mb-3`}>
            Recent hands-free queue events, Ask Finely queries, and approval decisions (local store).
          </p>
          {auditLog.length ? (
            <ul className="space-y-2">
              {auditLog.map((e) => (
                <li key={e.id} className={`${finelyOsInlineListItem()} p-3 text-sm`}>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>
                    {new Date(e.at).toLocaleString()} · {e.kind.replace(/_/g, ' ')} · {e.status}
                  </div>
                  <div className={FINELY_OS_ENTITY_VALUE}>{e.action}</div>
                  {e.detail ? <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>{e.detail}</div> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>No audit entries yet — autopilot and Ask Finely actions appear here.</p>
          )}
        </FinelyOsGlassPanel>
      </div>
    </PageShell>
  );
}
