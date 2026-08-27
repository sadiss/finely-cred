import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  FileText,
  Mail,
  Moon,
  Radar,
  ShieldAlert,
  Users,
  Zap,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FinelyOsAlertBanner } from '../../../os/FinelyOsAlertBanner';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
} from '../../../os/finelyOsLightUi';
import {
  autopilotQueueKpis,
  listAutopilotQueue,
  setAutopilotQueueStatus,
  type AutopilotQueueItem,
} from '../../../../data/automationOpsQueue';
import { listRoleCoverageGaps, loadStaffRoster } from '../../../../data/staffRoster';
import type { AgentPersonaId } from '../../../../domain/agentPersonas';
import { getAgentPersona } from '../../../../domain/agentPersonas';
import { listAutomationRules } from '../../../../data/automationStudioRepo';
import { listLettersByPartner } from '../../../../data/lettersRepo';
import { listPartnersLocal } from '../../../../data/partnersRepo';
import { listAiActionAudit } from '../../../../data/aiActionAuditLog';
import { FINELY_MAIL_COPY } from '../../../../lib/mailWhiteLabel';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

type QueueTab = 'draft_review' | 'mail_confirm' | 'complaint' | 'staff_gap' | 'all';

const RUNWAY_LANES: Array<{
  id: QueueTab;
  label: string;
  hint: string;
  icon: typeof FileText;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
}> = [
  { id: 'all', label: 'All pending', hint: 'Every lane', icon: Zap, accent: 'emerald' },
  { id: 'draft_review', label: 'Draft review', hint: 'Letter autopilot', icon: FileText, accent: 'violet' },
  { id: 'mail_confirm', label: 'Mail confirm', hint: 'Before physical send', icon: Mail, accent: 'sky' },
  { id: 'complaint', label: 'Escalations', hint: 'Complaint queue', icon: ShieldAlert, accent: 'rose' },
];

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminOpsAutopilotProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'emerald';
  const [searchParams] = useSearchParams();
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState<QueueTab>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'all' || t === 'draft_review' || t === 'mail_confirm' || t === 'complaint' || t === 'staff_gap') {
      setTab(t);
    }
  }, [searchParams]);

  const selectTab = (id: QueueTab) => {
    setTab(id);
    setSelectedId(null);
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

  const selected = useMemo(
    () => (selectedId ? filtered.find((i) => i.id === selectedId) ?? pending.find((i) => i.id === selectedId) ?? null : null),
    [selectedId, filtered, pending],
  );

  useEffect(() => {
    if (!selectedId && filtered.length) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

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
    if (selectedId === id) setSelectedId(null);
  };

  const done = (id: string) => {
    setAutopilotQueueStatus(id, 'done');
    setVersion((v) => v + 1);
    if (selectedId === id) setSelectedId(null);
  };

  const tabCount = (id: QueueTab) => {
    if (id === 'all') return pending.length;
    if (id === 'draft_review') return kpis.draftReview;
    if (id === 'mail_confirm') return kpis.mailConfirm;
    if (id === 'complaint') return kpis.complaint;
    return 0;
  };

  const activeLane = RUNWAY_LANES.find((l) => l.id === tab) ?? RUNWAY_LANES[0]!;
  const ActiveLaneIcon = activeLane.icon;
  const activeLaneIndex = RUNWAY_LANES.findIndex((l) => l.id === tab);

  const renderDetail = (item: AutopilotQueueItem) => (
    <div className="space-y-6">
      <div>
        <div className={`text-xs font-black uppercase tracking-widest text-rose-700`}>{item.kind.replace(/_/g, ' ')}</div>
        <h2 className={`mt-2 text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{item.title}</h2>
        <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
          {item.partnerName ?? item.partnerId}
          {item.bureau ? ` · ${item.bureau}` : ''}
        </p>
        {item.body ? <p className={`mt-4 text-base ${FINELY_OS_ENTITY_BODY}`}>{item.body}</p> : null}
        <div className={`mt-3 text-sm ${FINELY_OS_ENTITY_SUBLABEL}`}>Queued {fmtWhen(item.createdAt)}</div>
      </div>

      <div className="flex flex-wrap gap-2">
        {item.letterId ? (
          <button
            type="button"
            onClick={() => navigate(`/admin/partners/${item.partnerId}?tab=letters`)}
            className={FINELY_OS_PRIMARY_BTN}
          >
            Open letters
          </button>
        ) : (
          <button type="button" onClick={() => navigate(`/admin/partners/${item.partnerId}`)} className={FINELY_OS_PRIMARY_BTN}>
            Open partner
          </button>
        )}
        <button type="button" onClick={() => done(item.id)} className={FINELY_OS_SUCCESS_BTN}>
          <CheckCircle2 size={14} /> Mark done
        </button>
        <button type="button" onClick={() => dismiss(item.id)} className={FINELY_OS_SECONDARY_BTN}>
          Dismiss
        </button>
      </div>
    </div>
  );

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Platform"
      title="Hands-free ops"
      description="Review autopilot drafts, mail confirmations, and escalations — one item at a time."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon ?? Zap}
      primaryAction={
        <ProductPagePrimaryAction label="Open Automation Studio" onClick={() => navigate('/admin/automations')} />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/staff?view=partner')}>
          Partner team roster
        </button>
      }
      metrics={[
        { label: 'Auto-drafted today', value: String(lettersToday), hint: 'Letter drafts', accent: 'emerald' },
        { label: 'Draft review', value: String(kpis.draftReview), hint: 'Awaiting human review', accent: 'violet' },
        { label: 'Mail confirm', value: String(kpis.mailConfirm), hint: 'Before physical send', accent: 'sky' },
        { label: 'Escalations', value: String(kpis.complaint), hint: 'Complaint queue', accent: 'rose' },
      ]}
      metricTitle="Autopilot pulse"
      metricDescription="Follow the runway by lane — newest pending items stack on the timeline."
      metricsVariant="inline"
    >
      <div className={FINELY_OS_PAGE} data-surface-layout="timeline-runway">
        {/* Runway hero — pending pulse + live rules */}
        <section className={`${finelyOsCatalogCard('sky')} p-6 lg:p-10 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end`} data-fc-accent="sky">
          <div>
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <Zap size={16} /> Autopilot runway
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <span className="text-6xl font-extrabold leading-none">{pending.length}</span>
              <span className="pb-2 text-xl font-extrabold opacity-90">pending review{pending.length === 1 ? '' : 's'}</span>
            </div>
            <p className={`mt-4 max-w-2xl text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              {pending.length > 0
                ? `${lettersToday} auto-drafted today · ${liveRules} live automation rules feeding this queue.`
                : 'Queue is clear — autopilot drafts and mail gates are caught up.'}
            </p>
            <button type="button" onClick={() => selectTab('draft_review')} className={`${FINELY_OS_PRIMARY_BTN} mt-5`}>
              {kpis.draftReview > 0 ? 'Review draft lane' : 'Open draft lane'} <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Draft review', value: kpis.draftReview, family: 'violet' as const },
              { label: 'Mail confirm', value: kpis.mailConfirm, family: 'sky' as const },
              { label: 'Escalations', value: kpis.complaint, family: 'rose' as const },
              { label: 'Live rules', value: liveRules, family: 'emerald' as const },
            ].map((tile) => (
              <div key={tile.label} className={`${finelyOsCatalogCard(tile.family)} p-4 text-center`} data-fc-accent={tile.family}>
                <div className={`text-[10px] font-black uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>{tile.label}</div>
                <div className={`mt-2 text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{tile.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Horizontal runway spine — queue lanes */}
        <nav
          className={`${finelyOsCatalogCard('violet')} p-5 lg:p-6 overflow-x-auto`}
          data-fc-accent="violet"
          aria-label="Autopilot queue lanes"
        >
          <div className="flex min-w-max items-stretch gap-0">
            {RUNWAY_LANES.map((lane, index) => {
              const Icon = lane.icon;
              const active = tab === lane.id;
              const count = tabCount(lane.id);
              return (
                <React.Fragment key={lane.id}>
                  <button
                    type="button"
                    onClick={() => selectTab(lane.id)}
                    className={`relative flex w-48 flex-col items-center rounded-2xl border-2 px-3 py-4 text-center transition ${
                      active
                        ? 'border-violet-400/60 bg-violet-500/15 shadow-lg shadow-violet-500/10'
                        : 'border-white/10 bg-black/20 hover:border-white/25'
                    }`}
                    data-fc-accent={lane.accent}
                    aria-current={active ? 'step' : undefined}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        active ? 'bg-violet-500 text-white' : `bg-white/10 ${FINELY_OS_ENTITY_BODY} text-sm`
                      }`}
                    >
                      <Icon size={18} />
                    </span>
                    <span className={`mt-3 text-sm font-extrabold leading-tight ${FINELY_OS_ENTITY_VALUE}`}>{lane.label}</span>
                    <span className={`mt-1 text-xs font-bold ${FINELY_OS_ENTITY_BODY}`}>{lane.hint}</span>
                    <span className={`mt-2 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{count}</span>
                  </button>
                  {index < RUNWAY_LANES.length - 1 ? (
                    <div className="flex w-10 items-center justify-center" aria-hidden>
                      <ChevronRight size={18} className="text-[color:var(--fc-os-entity-faint)]" />
                    </div>
                  ) : null}
                </React.Fragment>
              );
            })}
          </div>
        </nav>

        <div className="grid gap-6 xl:grid-cols-12 xl:items-start">
          {/* Vertical timeline — pending items for active lane */}
          <section className={`xl:col-span-4 ${finelyOsCatalogCard('emerald')} p-5 lg:p-6`} data-fc-accent="emerald">
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <ActiveLaneIcon size={16} />
              <span>
                Lane {activeLaneIndex + 1}: {activeLane.label}
              </span>
            </div>
            <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              {filtered.length} item{filtered.length === 1 ? '' : 's'} on this runway segment.
            </p>

            {filtered.length === 0 ? (
              <div className={`mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-center`}>
                <p className="text-lg font-extrabold">Lane clear</p>
                <p className={`mt-2 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>No pending items in {activeLane.label.toLowerCase()}.</p>
              </div>
            ) : (
              <ol className="mt-6 space-y-0">
                {filtered.map((item, index) => {
                  const nodeAccent = (['emerald', 'violet', 'sky', 'rose'] as const)[index % 4];
                  const isActive = selectedId === item.id;
                  const isLast = index === filtered.length - 1;
                  return (
                    <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
                      {!isLast ? (
                        <span
                          className="absolute left-[17px] top-9 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400/50 via-violet-400/30 to-transparent"
                          aria-hidden
                        />
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold transition-all ${
                          isActive
                            ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                            : `border-white/20 bg-white/5 hover:border-white/40 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`
                        }`}
                      >
                        {index + 1}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className={`min-w-0 flex-1 rounded-2xl border px-3 py-2.5 text-left transition-all ${
                          isActive ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-transparent hover:border-white/10 hover:bg-white/[0.03]'
                        }`}
                        data-fc-accent={isActive ? nodeAccent : undefined}
                      >
                        <div className={`text-[10px] font-black uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>
                          {item.kind.replace(/_/g, ' ')}
                        </div>
                        <div className={`mt-1 text-sm font-extrabold truncate ${FINELY_OS_ENTITY_VALUE}`}>{item.title}</div>
                        <div className={`mt-1 text-xs font-bold truncate ${FINELY_OS_ENTITY_BODY}`}>
                          {item.partnerName ?? item.partnerId}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {/* Selected run inspector */}
          <section className={`xl:col-span-5 ${finelyOsCatalogCard('violet')} p-6 lg:p-10 min-h-[420px]`} data-fc-accent="violet">
            <div className="text-xs font-black uppercase tracking-widest text-violet-700">Selected run</div>
            {selected ? (
              <div className="mt-6">{renderDetail(selected)}</div>
            ) : (
              <div className="mt-10 text-center space-y-3">
                <Zap size={40} className="mx-auto text-violet-400" />
                <p className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Pick a timeline node</p>
                <p className={`${FINELY_OS_ENTITY_BODY}`}>Draft reviews, mail confirmations, and escalations open here.</p>
              </div>
            )}
          </section>

          {/* Alert rail — staff gaps, gates, audit, shortcuts */}
          <aside className="xl:col-span-3 space-y-4">
            <div className={`${finelyOsCatalogCard('rose')} p-5 lg:p-6 space-y-4`} data-fc-accent="rose">
              <div className="flex items-center gap-2">
                <Users size={18} />
                <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Staff coverage</div>
              </div>
              {staffGaps.length ? (
                <>
                  <FinelyOsAlertBanner
                    tone="warning"
                    message={`${staffGaps.length} role gap${staffGaps.length === 1 ? '' : 's'} in the next 4 hours.`}
                  />
                  <ul className={`${FINELY_OS_ENTITY_BODY} text-sm space-y-2`}>
                    {staffGaps.map((g) => (
                      <li key={g} className="flex items-center gap-2 text-rose-700">
                        <ShieldAlert size={14} /> {g}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <FinelyOsAlertBanner
                  tone="success"
                  message={`Core roles covered · ${loadStaffRoster().filter((s) => s.active).length} active roster members`}
                />
              )}
            </div>

            <div className={`${finelyOsCatalogCard('sky')} p-5 lg:p-6 space-y-3`} data-fc-accent="sky">
              <div className={`text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Letter autopilot</div>
              <ul className={`${FINELY_OS_ENTITY_BODY} text-sm space-y-2 list-disc pl-4`}>
                <li>Report uploaded → optional auto-draft with factual dispute findings only.</li>
                <li>Draft lands in partner vault + appears on the draft review lane.</li>
                <li>{FINELY_MAIL_COPY.humanConfirm}</li>
              </ul>
            </div>

            <div className={`${finelyOsCatalogCard('emerald')} p-5 lg:p-6 space-y-3`} data-fc-accent="emerald">
              <div className={`text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Mail confirm gate</div>
              <p className={`text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                Letters with status <strong>mail_pending</strong> require admin approval in Letter Studio before physical mail sends.
              </p>
            </div>

            <div className={`${finelyOsCatalogCard('violet')} p-5 lg:p-6 space-y-3`} data-fc-accent="violet">
              <div className={`text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Related ops</div>
              <div className="flex flex-col gap-2">
                {[
                  { path: '/admin/overnight', label: 'Overnight50', icon: Moon },
                  { path: '/admin/geo-war-room', label: 'Geo war room', icon: Radar },
                  { path: '/admin/lead-intel', label: 'Lead intel', icon: Radar },
                ].map(({ path, label, icon: Icon }) => (
                  <button key={path} type="button" className={`${FINELY_OS_SECONDARY_BTN} w-full justify-start`} onClick={() => navigate(path)}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>

            <div className={`${finelyOsCatalogCard('sky')} p-5 lg:p-6`} data-fc-accent="sky">
              <div className={`text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>AI action audit</div>
              <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY} mb-3`}>Recent queue events and approval decisions.</p>
              {auditLog.length ? (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {auditLog.map((e) => (
                    <li key={e.id} className={`${finelyOsInlineListItem()} p-3 text-sm`}>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>
                        {fmtWhen(e.at)} · {e.kind.replace(/_/g, ' ')}
                      </div>
                      <div className={FINELY_OS_ENTITY_VALUE}>{e.action}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>No audit entries yet.</p>
              )}
            </div>
          </aside>
        </div>
      </div>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
