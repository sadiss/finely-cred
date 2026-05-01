import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Clipboard,
  ExternalLink,
  Filter,
  Mail,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldAlert,
  UserPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { KpiCard } from '../../components/ui';
import { getFeatureFlags, isFeatureEnabled } from '../../data/settingsRepo';
import { useAuth } from '../../auth/AuthProvider';
import type { Prospect, ProspectStage, ProspectTarget } from '../../domain/crmProspects';
import { addProspectNote, assignProspect, listProspects, patchProspect, setProspectStage } from '../../data/crmProspectsRepo';
import { listLeadCaptures } from '../../data/leadsRepo';
import type { LeadCapture } from '../../domain/leads';
import type { LeadStage } from '../../domain/leadOps';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { addLeadNote, getLeadOp, linkLeadToPartner, setLeadStage } from '../../data/leadOpsRepo';
import { createPartner, findPartnerByEmail, listPartnersByTenant } from '../../data/partnersRepo';
import type { PartnerRoute } from '../../domain/partners';
import { createTask } from '../../data/tasksRepo';
import { sendEmail, sendSms } from '../../lib/commsDeliveryClient';
import { recommendedPathForTarget } from '../../lib/prospectOffers';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { listMemberships } from '../../data/tenantsRepo';
import { createCrmCategory, deleteCrmCategory, listCrmCategories, getCrmCategoryIdsForEntity, setCrmCategoriesForEntity } from '../../data/crmCategoriesRepo';

type Tab = 'prospects' | 'inbound' | 'partners';

type RemoteStatus = 'idle' | 'loading' | 'ok' | 'not_configured' | 'error';

type LeadCaptureRow = {
  id: string;
  created_at: string;
  source: string;
  offer: string;
  interest: string | null;
  full_name: string;
  email: string;
  phone: string;
  consent_to_contact: boolean;
};

function toLeadCapture(r: LeadCaptureRow): LeadCapture {
  return {
    id: r.id,
    createdAt: r.created_at,
    source: r.source as any,
    offer: r.offer as any,
    interest: r.interest ?? undefined,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    consentToContact: r.consent_to_contact,
  };
}

const STAGES: { value: ProspectStage | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'researching', label: 'Researching' },
  { value: 'contact_ready', label: 'Contact ready' },
  { value: 'outreach_sent', label: 'Outreach sent' },
  { value: 'replied', label: 'Replied' },
  { value: 'booked', label: 'Booked' },
  { value: 'converted', label: 'Converted' },
  { value: 'disqualified', label: 'Disqualified' },
];

const TARGETS: { value: ProspectTarget | 'all'; label: string }[] = [
  { value: 'all', label: 'All targets' },
  { value: 'clients', label: 'Clients' },
  { value: 'affiliates', label: 'Affiliates' },
  { value: 'agents', label: 'Agents' },
  { value: 'teams', label: 'Teams' },
  { value: 'au_sellers', label: 'AU sellers' },
  { value: 'b2b_partners', label: 'B2B partners' },
];

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminCrmPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const features = useMemo(() => getFeatureFlags(), []);

  const [tab, setTab] = useState<Tab>('prospects');
  const tenantId = useMemo(() => getActiveTenantId(), []);
  const [q, setQ] = useState('');
  const [stage, setStage] = useState<ProspectStage | 'all'>('all');
  const [target, setTarget] = useState<ProspectTarget | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [outreachDraft, setOutreachDraft] = useState('');
  const [outreachChan, setOutreachChan] = useState<'email' | 'sms'>('email');
  const [notice, setNotice] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [nextActionLabel, setNextActionLabel] = useState('');
  const [nextActionDue, setNextActionDue] = useState(''); // yyyy-mm-dd

  const [leadQuery, setLeadQuery] = useState('');
  const [remoteStatus, setRemoteStatus] = useState<RemoteStatus>('idle');
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [remoteLeads, setRemoteLeads] = useState<LeadCapture[] | null>(null);
  const [crmCategoryFilter, setCrmCategoryFilter] = useState<string | 'all'>('all');
  const [crmCategoryNewLabel, setCrmCategoryNewLabel] = useState('');
  const [crmCategoryNewColor, setCrmCategoryNewColor] = useState('#f59e0b');
  const [partnerQuery, setPartnerQuery] = useState('');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const localLeads = useMemo(() => listLeadCaptures(), [version]);
  const crmCategories = useMemo(() => listCrmCategories(), [version]);
  const crmCategoryById = useMemo(() => new Map(crmCategories.map((c) => [c.id, c])), [crmCategories]);

  const fetchRemoteLeads = async () => {
    if (!isSupabaseConfigured) {
      setRemoteStatus('not_configured');
      setRemoteLeads(null);
      setRemoteError(null);
      return;
    }
    setRemoteStatus('loading');
    setRemoteError(null);
    try {
      const { data, error } = await supabase
        .from('lead_captures')
        .select('id, created_at, source, offer, interest, full_name, email, phone, consent_to_contact')
        .order('created_at', { ascending: false })
        .limit(250);
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as LeadCaptureRow[];
      setRemoteLeads(rows.map(toLeadCapture));
      setRemoteStatus('ok');
    } catch (e: any) {
      setRemoteStatus('error');
      setRemoteError(e?.message || 'Failed to fetch remote leads.');
      setRemoteLeads(null);
    }
  };

  useEffect(() => {
    if (tab !== 'inbound') return;
    void fetchRemoteLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const combinedLeads = useMemo(() => {
    const seen = new Set<string>();
    const out: LeadCapture[] = [];
    const push = (l: LeadCapture) => {
      if (seen.has(l.id)) return;
      seen.add(l.id);
      out.push(l);
    };
    (remoteLeads ?? []).forEach(push);
    localLeads.forEach(push);
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [localLeads, remoteLeads]);

  const filteredLeads = useMemo(() => {
    const q = leadQuery.trim().toLowerCase();
    const base = !q
      ? combinedLeads
      : combinedLeads.filter((l) => {
          const hay = [l.fullName, l.email, l.phone, l.interest ?? '', l.id].join(' ').toLowerCase();
          return hay.includes(q);
        });
    if (crmCategoryFilter === 'all') return base;
    return base.filter((l) => getCrmCategoryIdsForEntity('lead', l.id).includes(crmCategoryFilter));
  }, [combinedLeads, leadQuery, crmCategoryFilter, version]);

  const leadStageCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of combinedLeads) {
      const st = getLeadOp(l.id).stage;
      m[st] = (m[st] ?? 0) + 1;
    }
    return m;
  }, [combinedLeads, version]);

  const prospects = useMemo(() => {
    const base = listProspects({ q, stage, target });
    if (crmCategoryFilter === 'all') return base;
    return base.filter((p) => getCrmCategoryIdsForEntity('prospect', p.id).includes(crmCategoryFilter));
  }, [q, stage, target, version, crmCategoryFilter]);

  const partners = useMemo(() => listPartnersByTenant(tenantId), [tenantId, version]);
  const filteredPartners = useMemo(() => {
    const q = partnerQuery.trim().toLowerCase();
    const base = !q
      ? partners
      : partners.filter((p) => {
          const hay = [p.profile?.fullName ?? '', p.profile?.email ?? '', p.profile?.phone ?? '', p.id].join(' ').toLowerCase();
          return hay.includes(q);
        });
    if (crmCategoryFilter === 'all') return base;
    return base.filter((p) => getCrmCategoryIdsForEntity('partner', p.id).includes(crmCategoryFilter));
  }, [partners, partnerQuery, crmCategoryFilter, version]);
  const selected: Prospect | null = useMemo(() => {
    if (!prospects.length) return null;
    return selectedId ? prospects.find((p) => p.id === selectedId) ?? prospects[0] ?? null : prospects[0] ?? null;
  }, [prospects, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setNextActionLabel(selected.nextAction?.label ?? '');
    try {
      const due = selected.nextAction?.dueAt ? new Date(selected.nextAction.dueAt) : null;
      if (!due || Number.isNaN(due.getTime())) {
        setNextActionDue('');
      } else {
        const yyyy = due.getFullYear();
        const mm = String(due.getMonth() + 1).padStart(2, '0');
        const dd = String(due.getDate()).padStart(2, '0');
        setNextActionDue(`${yyyy}-${mm}-${dd}`);
      }
    } catch {
      setNextActionDue('');
    }
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const stageCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of prospects) m[p.stage] = (m[p.stage] ?? 0) + 1;
    return m;
  }, [prospects]);

  const prospectKpis = useMemo(() => {
    const unassigned = prospects.filter((p) => !p.assignedTo?.userId).length;
    const contactReady = prospects.filter((p) => p.stage === 'contact_ready').length;
    const missingContact = prospects.filter((p) => (p.contact.emails?.length ?? 0) === 0 || (p.contact.phones?.length ?? 0) === 0).length;
    const dueSoon = prospects.filter((p) => {
      const due = (p.nextAction as any)?.dueAt ? String((p.nextAction as any).dueAt) : '';
      if (!due) return false;
      const t = Date.parse(due);
      if (!Number.isFinite(t)) return false;
      return t <= Date.now() + 7 * 24 * 60 * 60 * 1000;
    }).length;
    return { total: prospects.length, unassigned, contactReady, missingContact, dueSoon };
  }, [prospects]);

  const canComms = isFeatureEnabled('commsDelivery');

  const routeFromInterest = (interest?: string | null): PartnerRoute => {
    const s = (interest || '').toLowerCase();
    if (s.includes('business')) return 'business_build';
    if (s.includes('tradeline')) return 'personal_build';
    return 'personal_restore';
  };

  const convertLeadToPartner = (lead: LeadCapture) => {
    const existing = lead.email ? findPartnerByEmail(lead.email) : null;
    if (existing) {
      linkLeadToPartner(lead.id, existing.id);
      addLeadNote(lead.id, `Linked to existing partner: ${existing.id}`);
      try {
        createTask({
          partnerId: existing.id,
          title: `Lead follow-up: ${lead.fullName || lead.email || lead.id}`,
          kind: 'follow_up',
          status: 'pending',
          stage: 'intake',
          dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          notes: `Follow up on inbound lead. Source: ${lead.source} • Offer: ${lead.offer} • Interest: ${lead.interest ?? '—'}`,
          assignedTo: 'admin',
        });
      } catch {
        // best-effort only
      }
      setNotice('Linked to existing partner.');
      setTimeout(() => setNotice(null), 2000);
      return;
    }

    const p = createPartner({
      status: 'lead',
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      primaryRoute: routeFromInterest(lead.interest),
      intake: {},
    });
    linkLeadToPartner(lead.id, p.id);
    addLeadNote(lead.id, `Converted to partner: ${p.id}`);
    try {
      createTask({
        partnerId: p.id,
        title: `Lead follow-up: ${lead.fullName || lead.email || lead.id}`,
        kind: 'follow_up',
        status: 'pending',
        stage: 'intake',
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        notes: `Follow up on inbound lead. Source: ${lead.source} • Offer: ${lead.offer} • Interest: ${lead.interest ?? '—'}`,
        assignedTo: 'admin',
      });
    } catch {
      // best-effort only
    }
    setNotice(`Converted to partner: ${p.id}`);
    setTimeout(() => setNotice(null), 2500);
  };

  const members = useMemo(() => {
    const tenantId = getActiveTenantId();
    return listMemberships(tenantId)
      .filter((m) => m.status === 'active')
      .map((m) => ({ userId: m.userId, email: m.email, role: m.role }));
  }, [version]);

  const saveNote = () => {
    if (!selected) return;
    addProspectNote(selected.id, noteDraft);
    setNoteDraft('');
    window.dispatchEvent(new Event('finely:store'));
  };

  const assignToMe = () => {
    if (!selected) return;
    assignProspect(selected.id, { userId: auth.user?.id, email: auth.user?.email });
    window.dispatchEvent(new Event('finely:store'));
    setNotice('Assigned to you.');
    setTimeout(() => setNotice(null), 2500);
  };

  const clearAssign = () => {
    if (!selected) return;
    assignProspect(selected.id, null);
    window.dispatchEvent(new Event('finely:store'));
  };

  const assignTo = (userId: string) => {
    if (!selected) return;
    if (!userId) return clearAssign();
    const m = members.find((x) => x.userId === userId) ?? null;
    assignProspect(selected.id, m ? { userId: m.userId, email: m.email } : { userId });
    window.dispatchEvent(new Event('finely:store'));
  };

  const sendOutreach = async () => {
    if (!selected) return;
    if (!canComms) {
      setNotice('Comms Delivery is disabled (Feature Flags).');
      setTimeout(() => setNotice(null), 2500);
      return;
    }
    const msg = outreachDraft.trim();
    if (!msg) return;

    try {
      if (outreachChan === 'email') {
        const toEmail = selected.contact.emails[0] ?? '';
        if (!toEmail) throw new Error('No email found for this prospect.');
        await sendEmail({
          toEmail,
          subject: `Quick question — ${selected.company.name ?? selected.company.domain ?? 'Finely Cred'}`,
          text: msg,
          toName: selected.contact.name,
        });
        addProspectNote(selected.id, `Outbound email sent to ${toEmail}\n\n${msg}`);
      } else {
        const toPhone = selected.contact.phones[0] ?? '';
        if (!toPhone) throw new Error('No phone found for this prospect.');
        await sendSms({ toPhone, body: msg });
        addProspectNote(selected.id, `Outbound SMS sent to ${toPhone}\n\n${msg}`);
      }
      setProspectStage(selected.id, 'outreach_sent');
      setOutreachDraft('');
      setOutreachOpen(false);
      window.dispatchEvent(new Event('finely:store'));
      setNotice('Outreach sent.');
      setTimeout(() => setNotice(null), 2500);
    } catch (e: any) {
      setNotice(e?.message || 'Send failed.');
      setTimeout(() => setNotice(null), 3000);
    }
  };

  return (
    <PageShell
      badge="Admin"
      title="CRM"
      subtitle="Prospects + inbound leads, unified with assignments, scoring, next-actions, and compliant outreach workflows."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/admin/lead-intel')}
              className="fc-button-soft"
            >
              Lead Intel Agent <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {!features.crm && (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 text-white/75 text-sm">
            CRM is disabled. Enable it in <span className="text-white/90 font-semibold">Admin Settings → Feature Flags</span>.
          </div>
        )}

        {notice && (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-emerald-100 text-sm">
            {notice}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('prospects')}
            className={`fc-chip ${tab === 'prospects' ? 'fc-chip-active' : 'fc-chip-muted'}`}
          >
            Prospects
          </button>
          <button
            type="button"
            onClick={() => setTab('inbound')}
            className={`fc-chip ${tab === 'inbound' ? 'fc-chip-active' : 'fc-chip-muted'}`}
          >
            Inbound leads
          </button>
          <button
            type="button"
            onClick={() => setTab('partners')}
            className={`fc-chip ${tab === 'partners' ? 'fc-chip-active' : 'fc-chip-muted'}`}
          >
            Partners
          </button>
        </div>

        <details className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-5">
          <summary className="cursor-pointer select-none text-white font-semibold">
            CRM categories
          </summary>
          <div className="mt-4 grid lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCrmCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${
                    crmCategoryFilter === 'all' ? 'border-amber-500/40 bg-amber-500/10 text-amber-200' : 'border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/[0.04]'
                  }`}
                >
                  All
                </button>
                {crmCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCrmCategoryFilter(c.id)}
                    className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${
                      crmCategoryFilter === c.id ? 'border-amber-500/40 bg-amber-500/10 text-amber-200' : 'border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/[0.04]'
                    }`}
                    title={c.id}
                    style={c.color ? { borderColor: `${c.color}55` } : undefined}
                  >
                    {c.label}
                  </button>
                ))}
                {crmCategories.length === 0 ? (
                  <div className="text-white/55 text-sm">No categories yet.</div>
                ) : null}
              </div>
            </div>
            <div className="lg:col-span-4 space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Create category</div>
              <div className="grid grid-cols-12 gap-2">
                <input
                  value={crmCategoryNewLabel}
                  onChange={(e) => setCrmCategoryNewLabel(e.target.value)}
                  placeholder="e.g. VIP, Agent, AU Seller…"
                  className="col-span-8 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-sm placeholder:text-white/30"
                />
                <input
                  type="color"
                  value={crmCategoryNewColor}
                  onChange={(e) => setCrmCategoryNewColor(e.target.value)}
                  className="col-span-2 h-[40px] w-full rounded-xl border border-white/10 bg-black/40"
                  title="Color"
                />
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const created = createCrmCategory({ label: crmCategoryNewLabel, color: crmCategoryNewColor });
                      setCrmCategoryNewLabel('');
                      window.dispatchEvent(new Event('finely:store'));
                      setVersion((v) => v + 1);
                      setCrmCategoryFilter(created.id);
                      setNotice('Category created.');
                      setTimeout(() => setNotice(null), 2000);
                    } catch (e: any) {
                      setNotice(e?.message || 'Failed to create category.');
                      setTimeout(() => setNotice(null), 3000);
                    }
                  }}
                  className="col-span-2 inline-flex items-center justify-center px-3 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest"
                >
                  Add
                </button>
              </div>
              {crmCategories.length ? (
                <div className="pt-1 flex flex-wrap gap-2">
                  {crmCategories.slice(0, 12).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        deleteCrmCategory(c.id);
                        if (crmCategoryFilter === c.id) setCrmCategoryFilter('all');
                        window.dispatchEvent(new Event('finely:store'));
                        setVersion((v) => v + 1);
                      }}
                      className="px-3 py-1.5 rounded-full border border-rose-500/25 bg-rose-500/10 text-[10px] font-black uppercase tracking-widest text-rose-200 hover:bg-rose-500/15"
                      title={`Delete ${c.label}`}
                    >
                      Delete {c.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </details>

        {tab === 'prospects' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <KpiCard label="Prospects" value={prospectKpis.total} hint="In view" tone="amber" />
              <KpiCard label="Unassigned" value={prospectKpis.unassigned} hint="Needs owner" tone="violet" />
              <KpiCard label="Contact ready" value={prospectKpis.contactReady} hint="Stage" tone="emerald" />
              <KpiCard label="Due soon" value={prospectKpis.dueSoon} hint="Next action" tone="sky" />
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <div className="fc-card p-5 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Filter size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Pipeline</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{prospects.length} prospects</div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3">
                    <Search size={16} className="text-white/40" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search company, website, email, tags…"
                      className="w-[260px] max-w-full bg-transparent py-2.5 text-sm text-white/80 placeholder:text-white/30 outline-none"
                    />
                  </div>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as any)}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white/80"
                  >
                    {STAGES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value as any)}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white/80"
                  >
                    {TARGETS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  {Object.entries(stageCounts)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([k, v]) => (
                      <span key={k} className="text-[10px] px-3 py-1.5 rounded-full border border-white/10 bg-black/30 text-white/60 uppercase tracking-widest font-bold">
                        {k}: {v}
                      </span>
                    ))}
                </div>
              </div>

              <div className="space-y-4">
                {prospects.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60">
                    No prospects yet. Run the <span className="text-white/85 font-semibold">Lead Intel Agent</span> to discover qualified prospects.
                  </div>
                ) : (
                  (() => {
                    const stageLabel = new Map(STAGES.filter((s) => s.value !== 'all').map((s) => [s.value, s.label]));
                    const order = STAGES.filter((s) => s.value !== 'all').map((s) => s.value as ProspectStage);
                    const groups: Array<{ stage: ProspectStage; label: string; items: Prospect[] }> = [];
                    const by: Record<string, Prospect[]> = {};
                    for (const p of prospects) {
                      by[p.stage] = by[p.stage] ?? [];
                      by[p.stage]!.push(p);
                    }
                    for (const st of order) {
                      const items = by[st] ?? [];
                      if (!items.length) continue;
                      groups.push({ stage: st, label: stageLabel.get(st) || st, items });
                    }
                    // If filtering to a single stage, keep that stage visible even if it wasn't in the default order.
                    if (!groups.length && prospects.length) {
                      const st = prospects[0]!.stage;
                      groups.push({ stage: st, label: stageLabel.get(st as any) || String(st), items: prospects });
                    }
                    return (
                      <div className="space-y-4">
                        {groups.map((g) => (
                          <details key={g.stage} className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden" open>
                            <summary className="cursor-pointer select-none px-5 py-4 flex items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors">
                              <div className="min-w-0">
                                <div className="text-white font-semibold truncate">{g.label}</div>
                                <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                  {g.items.length} prospect{g.items.length === 1 ? '' : 's'}
                                </div>
                              </div>
                              <div className="text-white/50 text-sm">Show</div>
                            </summary>
                            <div className="p-5 pt-0">
                              <div className="grid gap-3">
                                {g.items.slice(0, 120).map((p) => {
                                  const active = p.id === selected?.id;
                                  return (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => setSelectedId(p.id)}
                                      className={`w-full text-left rounded-2xl border p-4 transition-all ${
                                        active
                                          ? 'border-amber-500/35 bg-amber-500/10'
                                          : 'border-white/10 bg-black/30 hover:bg-white/[0.03]'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                          <div className="text-white/90 font-semibold truncate">
                                            {p.company.name ?? p.company.domain ?? p.id}
                                          </div>
                                          <div className="mt-1 text-white/50 text-xs break-all">{p.company.website ?? '—'}</div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-white font-semibold">{p.score}</div>
                                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">{fmtWhen(p.updatedAt)}</div>
                                        </div>
                                      </div>
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="text-[10px] px-3 py-1.5 rounded-full border border-white/10 bg-black/30 text-white/60 uppercase tracking-widest font-bold">
                                          target: {p.target}
                                        </span>
                                        <span className="text-[10px] px-3 py-1.5 rounded-full border border-white/10 bg-black/30 text-white/60 uppercase tracking-widest font-bold">
                                          {p.contact.emails.length} email
                                        </span>
                                        <span className="text-[10px] px-3 py-1.5 rounded-full border border-white/10 bg-black/30 text-white/60 uppercase tracking-widest font-bold">
                                          {p.contact.phones.length} phone
                                        </span>
                                      {p.nextAction?.dueAt ? (
                                        <span className="text-[10px] px-3 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-200 uppercase tracking-widest font-bold">
                                          due: {fmtWhen(p.nextAction.dueAt)}
                                        </span>
                                      ) : null}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </details>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              {!selected ? (
                <div className="fc-card p-6 text-white/60">Select a prospect.</div>
              ) : (
                <>
                  <div className="fc-card p-6 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="inline-flex items-center gap-2 text-amber-400">
                          <Building2 size={18} />
                          <span className="text-xs font-semibold uppercase tracking-wider">Prospect</span>
                        </div>
                        <div className="text-white text-xl font-semibold">{selected.company.name ?? selected.company.domain ?? selected.id}</div>
                        <div className="text-white/60 text-sm">{selected.company.description ?? selected.intel?.snippet ?? '—'}</div>
                        <div className="text-white/50 text-xs font-mono break-all">{selected.company.website ?? '—'}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selected.company.website && (
                          <a
                            href={selected.company.website}
                            target="_blank"
                            rel="noreferrer"
                            className="fc-button-soft"
                          >
                            <ExternalLink size={14} /> Website
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={assignToMe}
                          className="fc-button-brand"
                        >
                          <UserPlus size={14} /> Assign to me
                        </button>
                        <button
                          type="button"
                          onClick={clearAssign}
                          className="fc-button-soft"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Stage</div>
                        <select
                          value={selected.stage}
                          onChange={(e) => {
                            setProspectStage(selected.id, e.target.value as ProspectStage);
                            window.dispatchEvent(new Event('finely:store'));
                          }}
                          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white/80"
                        >
                          {STAGES.filter((s) => s.value !== 'all').map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Score</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{selected.score}</div>
                        <div className="mt-1 text-white/50 text-xs">Higher = more reachable + relevant</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Owner</div>
                        <select
                          value={selected.assignedTo?.userId ?? ''}
                          onChange={(e) => assignTo(e.target.value)}
                          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white/80"
                        >
                          <option value="">Unassigned</option>
                          {members.map((m) => (
                            <option key={m.userId} value={m.userId}>
                              {m.email} ({m.role})
                            </option>
                          ))}
                        </select>
                        <div className="mt-2 text-white/50 text-xs">Target: {selected.target}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                      <div className="text-white font-semibold">Next action</div>
                      <div className="grid md:grid-cols-3 gap-3">
                        <label className="block md:col-span-2">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">Label</div>
                          <input
                            value={nextActionLabel}
                            onChange={(e) => setNextActionLabel(e.target.value)}
                            placeholder="e.g. Send outreach email, Enrich contact, Follow up call…"
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white/80 placeholder:text-white/30 text-sm outline-none"
                          />
                        </label>
                        <label className="block">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">Due date</div>
                          <input
                            type="date"
                            value={nextActionDue}
                            onChange={(e) => setNextActionDue(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white/80 text-sm outline-none"
                          />
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!selected) return;
                            const label = nextActionLabel.trim();
                            const dueAt =
                              nextActionDue && nextActionDue.trim()
                                ? new Date(`${nextActionDue}T12:00:00.000Z`).toISOString()
                                : undefined;
                            patchProspect(selected.id, { nextAction: label || dueAt ? { label: label || 'Follow up', dueAt } : undefined } as any);
                            window.dispatchEvent(new Event('finely:store'));
                            setNotice('Next action saved.');
                            setTimeout(() => setNotice(null), 2000);
                          }}
                          className="fc-button-brand"
                        >
                          Save <ArrowRight size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNextActionLabel('');
                            setNextActionDue('');
                            if (!selected) return;
                            patchProspect(selected.id, { nextAction: undefined } as any);
                            window.dispatchEvent(new Event('finely:store'));
                            setNotice('Next action cleared.');
                            setTimeout(() => setNotice(null), 2000);
                          }}
                          className="fc-button-soft"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="text-white/55 text-xs">
                        Use this to keep the pipeline tight. Due dates surface as “Due soon” in the KPI row.
                      </div>
                    </div>

                    {/* Recommended path */}
                    {(() => {
                      const rec = recommendedPathForTarget(selected.target);
                      return (
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                          <div className="text-white font-semibold">{rec.title}</div>
                          <div className="text-white/60 text-sm">{rec.subtitle}</div>
                          <div className="flex flex-wrap gap-2">
                            {rec.ctas.map((c) => (
                              <button
                                key={c.url}
                                type="button"
                                onClick={() => {
                                  const full = `${window.location.origin}${c.url}`;
                                  void navigator.clipboard.writeText(full);
                                  setNotice(`Copied link: ${c.label}`);
                                  setTimeout(() => setNotice(null), 2000);
                                }}
                                className="fc-button-soft"
                              >
                                Copy link • {c.label}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                setOutreachDraft(rec.defaultOutreach.replaceAll('\n', '\n'));
                                setOutreachOpen(true);
                                setNotice('Outreach template drafted.');
                                setTimeout(() => setNotice(null), 2000);
                              }}
                              className="fc-button-brand"
                            >
                              Draft outreach
                            </button>
                          </div>
                          <div className="text-white/45 text-xs">
                            Tip: the copied links are absolute URLs, ready to paste into email/SMS.
                          </div>
                        </div>
                      );
                    })()}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Emails</div>
                        <div className="mt-2 space-y-2">
                          {selected.contact.emails.length ? (
                            selected.contact.emails.slice(0, 5).map((e) => (
                              <div key={e} className="flex items-center justify-between gap-3 text-white/70 text-sm font-mono">
                                <span className="truncate">{e}</span>
                                <button
                                  type="button"
                                  onClick={() => navigator.clipboard.writeText(e)}
                                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-[10px] font-black uppercase tracking-widest text-white/70"
                                >
                                  <Clipboard size={12} />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="text-white/50 text-sm">None found.</div>
                          )}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Phones</div>
                        <div className="mt-2 space-y-2">
                          {selected.contact.phones.length ? (
                            selected.contact.phones.slice(0, 5).map((p) => (
                              <div key={p} className="flex items-center justify-between gap-3 text-white/70 text-sm font-mono">
                                <span className="truncate">{p}</span>
                                <button
                                  type="button"
                                  onClick={() => navigator.clipboard.writeText(p)}
                                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-[10px] font-black uppercase tracking-widest text-white/70"
                                >
                                  <Clipboard size={12} />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="text-white/50 text-sm">None found.</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setOutreachOpen((v) => !v)}
                        disabled={!canComms}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
                      >
                        <Mail size={14} /> Outreach
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          patchProspect(selected.id, { tags: Array.from(new Set([...(selected.tags ?? []), 'high_priority'])) } as any);
                          window.dispatchEvent(new Event('finely:store'));
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      >
                        <MessageSquareText size={14} /> Mark high priority
                      </button>
                    </div>

                    {outreachOpen && (
                      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-emerald-100 text-sm font-semibold">Outbound outreach</div>
                          <select
                            value={outreachChan}
                            onChange={(e) => setOutreachChan(e.target.value as any)}
                            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                          >
                            <option value="email">Email</option>
                            <option value="sms">SMS</option>
                          </select>
                        </div>
                        <textarea
                          value={outreachDraft}
                          onChange={(e) => setOutreachDraft(e.target.value)}
                          placeholder="Write a short, professional message. Be compliant and respectful."
                          className="w-full min-h-[140px] rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white/80 placeholder:text-white/30 text-sm outline-none resize-y"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void sendOutreach()}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                          >
                            Send <ArrowRight size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setOutreachOpen(false)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                          >
                            Close
                          </button>
                        </div>
                        <div className="text-white/60 text-xs">
                          Outbound messaging uses your configured SendGrid/Twilio delivery (admin allowlist required). Follow CAN‑SPAM/TCPA and only contact with a lawful basis.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="fc-panel p-6 space-y-3">
                    <div className="text-white/80 font-semibold">Notes</div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Add a note, next step, or context…"
                        className="flex-1 min-w-[240px] rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white/80 placeholder:text-white/30 text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={saveNote}
                        className="fc-button-brand"
                      >
                        Save <ArrowRight size={14} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(selected.notes ?? []).slice(0, 10).map((n) => (
                        <div key={n.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{fmtWhen(n.createdAt)}</div>
                          <div className="mt-2 text-white/75 text-sm whitespace-pre-wrap">{n.text}</div>
                        </div>
                      ))}
                      {(selected.notes ?? []).length === 0 && <div className="text-white/50 text-sm">No notes yet.</div>}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        )}

        {tab === 'inbound' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Inbound leads</div>
                  <div className="mt-2 text-white/70 text-sm">Consultation requests and resource unlocks, unified inside CRM.</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void fetchRemoteLeads()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70"
                    title="Refresh from Supabase"
                  >
                    <RefreshCw size={14} />
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/leads')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                    title="Open dedicated Leads page"
                  >
                    Full Leads Page <ArrowRight size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-white/70">
                  <Search size={16} className="text-white/40" />
                  <input
                    value={leadQuery}
                    onChange={(e) => setLeadQuery(e.target.value)}
                    placeholder="Search name, email, phone, guide, or ID…"
                    className="w-[420px] max-w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  showing {filteredLeads.length} / {combinedLeads.length} • remote: {remoteStatus}
                </div>
              </div>

              {remoteStatus === 'error' && (
                <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-white/70 text-sm">
                  <div className="inline-flex items-center gap-2 text-amber-200/90 font-semibold">
                    <ShieldAlert size={16} />
                    Remote leads unavailable
                  </div>
                  <div className="mt-2">{remoteError || 'Remote fetch failed.'}</div>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <KpiCard label="Leads" value={combinedLeads.length} hint="Total" tone="amber" />
              <KpiCard label="Local" value={localLeads.length} hint="Browser store" tone="sky" />
              <KpiCard label="Remote" value={remoteLeads?.length ?? 0} hint={isSupabaseConfigured ? 'Supabase' : 'Not configured'} tone="violet" />
              <KpiCard label="New" value={leadStageCounts.new ?? 0} hint="Not touched" tone="emerald" />
            </div>

            <div className="space-y-4">
              {(['new', 'contacted', 'booked', 'converted', 'disqualified'] as LeadStage[]).map((st) => {
                const items = filteredLeads.filter((l) => getLeadOp(l.id).stage === st);
                if (!items.length) return null;
                return (
                  <details key={st} className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden" open>
                    <summary className="cursor-pointer select-none px-5 py-4 flex items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors">
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">{st.replaceAll('_', ' ')}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          {items.length} lead{items.length === 1 ? '' : 's'}
                        </div>
                      </div>
                      <div className="text-white/50 text-sm">Show</div>
                    </summary>
                    <div className="p-5 pt-0">
                      <div className="grid lg:grid-cols-2 gap-4">
                        {items.slice(0, 120).map((l) => {
                          const op = getLeadOp(l.id);
                          return (
                            <div key={l.id} className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="text-white font-semibold truncate">{l.fullName}</div>
                                  <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                    {fmtWhen(l.createdAt)} • {l.source} • {l.offer}
                                  </div>
                                  <div className="mt-2 text-white/70 text-sm truncate">{l.interest || '—'}</div>
                                </div>
                                <select
                                  value={op.stage}
                                  onChange={(e) => setLeadStage(l.id, e.target.value as LeadStage)}
                                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-[11px]"
                                  title="Lead stage"
                                >
                                  {(['new', 'contacted', 'booked', 'converted', 'disqualified'] as LeadStage[]).map((x) => (
                                    <option key={x} value={x}>
                                      {x}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1 text-sm">
                                <div className="text-white/80">
                                  <a className="hover:text-amber-300 transition-colors" href={`mailto:${l.email}`}>
                                    {l.email}
                                  </a>
                                </div>
                                <div className="text-white/70">
                                  <a className="hover:text-amber-300 transition-colors" href={`tel:${l.phone}`}>
                                    {l.phone}
                                  </a>
                                </div>
                                <div className="text-[10px] uppercase tracking-widest text-white/40">
                                  consent: {l.consentToContact ? 'yes' : 'no'}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => void navigator.clipboard.writeText(`${l.fullName} <${l.email}> ${l.phone} (${l.id})`)}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70"
                                  title="Copy lead"
                                >
                                  <Clipboard size={14} /> Copy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => convertLeadToPartner(l)}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:brightness-110 text-black text-[10px] font-black uppercase tracking-widest transition-all"
                                  title="Convert lead to partner"
                                >
                                  <UserPlus size={14} /> Convert
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'partners' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <KpiCard label="Partners" value={filteredPartners.length} hint="In view" tone="amber" />
              <KpiCard label="Categories" value={crmCategories.length} hint="Defined" tone="violet" />
              <KpiCard
                label="Filtered"
                value={crmCategoryFilter === 'all' ? 'All' : (crmCategoryById.get(crmCategoryFilter)?.label ?? 'Category')}
                hint="Category"
                tone="sky"
              />
              <KpiCard label="Tenant" value={tenantId.slice(0, 8)} hint="Active tenant" tone="emerald" />
            </div>

            <div className="fc-card p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <Filter size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Partners</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  {filteredPartners.length} partner(s)
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3">
                  <Search size={16} className="text-white/40" />
                  <input
                    value={partnerQuery}
                    onChange={(e) => setPartnerQuery(e.target.value)}
                    placeholder="Search name, email, phone…"
                    className="w-[320px] max-w-full bg-transparent py-2.5 text-sm text-white/80 placeholder:text-white/30 outline-none"
                  />
                </div>
              </div>
            </div>

            {filteredPartners.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
                No partners match your filters.
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-4">
                {filteredPartners.slice(0, 200).map((p) => {
                  const catIds = getCrmCategoryIdsForEntity('partner', p.id);
                  const availableToAdd = crmCategories.filter((c) => !catIds.includes(c.id));
                  return (
                    <div key={p.id} className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-5 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">{p.profile?.fullName ?? 'Partner'}</div>
                          <div className="mt-1 text-white/60 text-sm truncate">{p.profile?.email ?? '—'}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            {p.id} • updated {fmtWhen(p.updatedAt)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/partners/${p.id}`)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                        >
                          Open <ArrowRight size={14} />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Categories</div>
                        <div className="flex flex-wrap items-center gap-2">
                          {catIds.length === 0 ? (
                            <div className="text-white/55 text-sm">No categories.</div>
                          ) : (
                            catIds.map((cid) => {
                              const c = crmCategoryById.get(cid);
                              const label = c?.label ?? cid;
                              return (
                                <button
                                  key={cid}
                                  type="button"
                                  onClick={() => {
                                    setCrmCategoriesForEntity('partner', p.id, catIds.filter((x) => x !== cid));
                                    window.dispatchEvent(new Event('finely:store'));
                                    setVersion((v) => v + 1);
                                  }}
                                  className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/[0.04]"
                                  style={c?.color ? { borderColor: `${c.color}66` } : undefined}
                                  title="Click to remove"
                                >
                                  {label}
                                </button>
                              );
                            })
                          )}

                          {availableToAdd.length ? (
                            <select
                              value=""
                              onChange={(e) => {
                                const nextId = e.target.value;
                                if (!nextId) return;
                                setCrmCategoriesForEntity('partner', p.id, [nextId, ...catIds]);
                                window.dispatchEvent(new Event('finely:store'));
                                setVersion((v) => v + 1);
                              }}
                              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-white/80"
                              title="Add category"
                            >
                              <option value="">+ Add category</option>
                              {availableToAdd.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/70 text-sm">
          <div className="font-semibold text-white">CRM upgrade included</div>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li>Prospects pipeline with targets (clients/affiliates/agents/teams/AU sellers/B2B partners)</li>
            <li>Qualification scoring + notes + assignments + stage transitions</li>
            <li>Optional outbound delivery via SendGrid/Twilio when enabled</li>
          </ul>
        </div>
      </div>
    </PageShell>
  );
}

