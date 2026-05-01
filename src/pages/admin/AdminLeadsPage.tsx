import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Clipboard, RefreshCw, Search, ShieldAlert, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { KpiCard } from '../../components/ui';
import { listLeadCaptures } from '../../data/leadsRepo';
import type { LeadCapture } from '../../domain/leads';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { addLeadNote, getLeadOp, linkLeadToPartner, setLeadStage } from '../../data/leadOpsRepo';
import type { LeadStage } from '../../domain/leadOps';
import { createPartner, findPartnerByEmail } from '../../data/partnersRepo';
import type { PartnerRoute } from '../../domain/partners';
import { createTask } from '../../data/tasksRepo';

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

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminLeadsPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [remoteStatus, setRemoteStatus] = useState<RemoteStatus>('idle');
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [remoteLeads, setRemoteLeads] = useState<LeadCapture[] | null>(null);
  const [noteOpenFor, setNoteOpenFor] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const localLeads = useMemo(() => listLeadCaptures(), []);

  const combined = useMemo(() => {
    const seen = new Set<string>();
    const out: LeadCapture[] = [];
    const push = (l: LeadCapture) => {
      if (seen.has(l.id)) return;
      seen.add(l.id);
      out.push(l);
    };
    // Prefer remote first if present.
    (remoteLeads ?? []).forEach(push);
    localLeads.forEach(push);
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [localLeads, remoteLeads]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return combined;
    return combined.filter((l) => {
      const hay = [l.fullName, l.email, l.phone, l.interest ?? '', l.id].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [combined, query]);

  const stageCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of combined) {
      const st = getLeadOp(l.id).stage;
      m[st] = (m[st] ?? 0) + 1;
    }
    return m;
  }, [combined]);

  const consentNo = useMemo(() => combined.filter((l) => !l.consentToContact).length, [combined]);

  const fetchRemote = async () => {
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
    void fetchRemote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  const stageOptions: { value: LeadStage; label: string }[] = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'booked', label: 'Booked' },
    { value: 'converted', label: 'Converted' },
    { value: 'disqualified', label: 'Disqualified' },
  ];

  const routeFromInterest = (interest?: string | null): PartnerRoute => {
    const s = (interest || '').toLowerCase();
    if (s.includes('business')) return 'business_build';
    if (s.includes('tradeline')) return 'personal_build';
    return 'personal_restore';
  };

  const convertToPartner = (lead: LeadCapture) => {
    // If partner exists, just link and open.
    const existing = lead.email ? findPartnerByEmail(lead.email) : null;
    if (existing) {
      linkLeadToPartner(lead.id, existing.id);
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
      navigate(`/admin/partners/${existing.id}?tab=reports`);
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
    navigate(`/admin/partners/${p.id}?tab=reports`);
  };

  return (
    <PageShell badge="Admin" title="Leads" subtitle="Consultation requests and resource unlocks.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft size={16} /> Admin Dashboard
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/admin/crm')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              title="Open CRM pipeline"
            >
              CRM <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => void fetchRemote()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70"
              title="Refresh from Supabase"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white/70">
              <Search size={16} className="text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email, phone, guide, or ID…"
                className="w-[320px] max-w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
              showing {filtered.length} / {combined.length}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-[10px] px-3 py-1.5 rounded-full border border-white/10 bg-black/30 text-white/60 uppercase tracking-widest font-bold">
              Local: {localLeads.length}
            </span>
            <span className="text-[10px] px-3 py-1.5 rounded-full border border-white/10 bg-black/30 text-white/60 uppercase tracking-widest font-bold">
              Remote: {remoteLeads?.length ?? 0}
            </span>
            <span className="text-[10px] px-3 py-1.5 rounded-full border border-white/10 bg-black/30 text-white/60 uppercase tracking-widest font-bold">
              Supabase: {isSupabaseConfigured ? 'configured' : 'not configured'}
            </span>
            <span className="text-[10px] px-3 py-1.5 rounded-full border border-white/10 bg-black/30 text-white/60 uppercase tracking-widest font-bold">
              Remote status: {remoteStatus}
            </span>
          </div>

          {remoteStatus === 'error' && (
            <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-white/70 text-sm">
              <div className="inline-flex items-center gap-2 text-amber-200/90 font-semibold">
                <ShieldAlert size={16} />
                Remote leads unavailable
              </div>
              <div className="mt-2">
                {remoteError || 'This usually means your Supabase RLS does not allow reads for the current session.'}
              </div>
              <div className="mt-2 text-white/60">
                Tip: add an admin-only read policy (or use the service role server-side later).
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <KpiCard label="Leads" value={combined.length} hint="Total" tone="amber" />
          <KpiCard label="New" value={stageCounts.new ?? 0} hint="Triage" tone="emerald" />
          <KpiCard label="Converted" value={stageCounts.converted ?? 0} hint="Partner linked" tone="sky" />
          <KpiCard label="Consent: no" value={consentNo} hint="Do not contact" tone="violet" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-6 text-white/60">No leads match your search.</div>
          ) : (
            <div className="p-5 space-y-4">
              {(['new', 'contacted', 'booked', 'converted', 'disqualified'] as LeadStage[]).map((st) => {
                const items = filtered.filter((l) => getLeadOp(l.id).stage === st);
                if (!items.length) return null;
                return (
                  <details key={st} className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden" open>
                    <summary className="cursor-pointer select-none px-5 py-4 flex items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors">
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">{st}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          {items.length} lead{items.length === 1 ? '' : 's'}
                        </div>
                      </div>
                      <div className="text-white/50 text-sm">Show</div>
                    </summary>
                    <div className="p-5 pt-0">
                      <div className="grid lg:grid-cols-2 gap-4">
                        {items.slice(0, 250).map((l) => {
                          const op = getLeadOp(l.id);
                          const latestNote = op.notes[0]?.text ?? null;
                          const partnerId = op.partnerId ?? null;
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
                                <div className="space-y-2">
                                  <select
                                    value={op.stage}
                                    onChange={(e) => setLeadStage(l.id, e.target.value as LeadStage)}
                                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-[11px]"
                                    title="Lead stage"
                                  >
                                    {stageOptions.map((s) => (
                                      <option key={s.value} value={s.value}>
                                        {s.label}
                                      </option>
                                    ))}
                                  </select>
                                  {partnerId ? (
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/admin/partners/${partnerId}`)}
                                      className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-300/90 hover:text-amber-200 transition-colors"
                                      title="Open linked partner"
                                    >
                                      Partner {partnerId.slice(0, 8)}… <ArrowRight size={12} />
                                    </button>
                                  ) : (
                                    <div className="text-[10px] uppercase tracking-widest text-white/30">No partner linked</div>
                                  )}
                                </div>
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
                                  consent: {l.consentToContact ? 'yes' : 'no'} • id:{l.id.slice(0, 10)}…
                                </div>
                              </div>

                              {latestNote ? <div className="text-[11px] text-white/50 line-clamp-2">“{latestNote}”</div> : null}

                              {noteOpenFor === l.id ? (
                                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                                  <div className="text-[10px] uppercase tracking-widest text-white/40">Add note</div>
                                  <textarea
                                    value={noteDraft}
                                    onChange={(e) => setNoteDraft(e.target.value)}
                                    className="mt-2 w-full min-h-[70px] bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                                    placeholder="Contact attempt, qualification notes, next steps…"
                                  />
                                  <div className="mt-3 flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        addLeadNote(l.id, noteDraft);
                                        setNoteDraft('');
                                        setNoteOpenFor(null);
                                      }}
                                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:brightness-110 text-black text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                      Save note <ArrowRight size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNoteDraft('');
                                        setNoteOpenFor(null);
                                      }}
                                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : null}

                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void copy(`${l.fullName} <${l.email}> ${l.phone} (${l.id})`)}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70"
                                    title="Copy lead"
                                  >
                                    <Clipboard size={14} /> Copy
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => convertToPartner(l)}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:brightness-110 text-black text-[10px] font-black uppercase tracking-widest transition-all"
                                    title="Convert lead to partner"
                                  >
                                    <UserPlus size={14} /> Convert
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNoteDraft('');
                                    setNoteOpenFor((cur) => (cur === l.id ? null : l.id));
                                  }}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                                >
                                  Add note
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
          )}
        </div>
      </div>
    </PageShell>
  );
}

