import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight, Gavel, ShieldAlert } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { getCase } from '../../data/casesRepo';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { ActionLink, Button } from '../../components/ui';

export default function PartnerDisputeDetailPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const email = auth.user?.email || '';

  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);
  const disputeCase = useMemo(() => (id ? getCase(id) : null), [id]);

  if (!partner) {
    return (
      <PageShell
        badge="Partner Portal"
        title="Dispute Case"
        subtitle="No partner profile found for this account. If you’re an admin, use Partner Management to pick a partner."
      />
    );
  }

  if (!disputeCase || disputeCase.partnerId !== partner.id) {
    return (
      <PageShell
        badge="Partner Portal"
        title="Dispute Case not found"
        subtitle="This case does not exist, or you don’t have access to it."
      />
    );
  }

  const c = disputeCase;
  const lastRound = c.rounds.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;

  return (
    <PageShell
      badge="Partner Portal"
      title={`${c.bureau} Case`}
      subtitle="Single-bureau case tracking: items, rounds, and follow-up windows."
    >
      <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.disputes]}>
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ActionLink to="/portal/dashboard" title="Back to Partner Dashboard" icon={<ArrowLeft size={16} />}>
                Partner Dashboard
              </ActionLink>
              <div className="h-4 w-px bg-white/10" />
              <ActionLink to="/portal/disputes" icon={<ArrowLeft size={16} />}>
                Back to Dispute Center
              </ActionLink>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">case_id: {c.id}</div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <Gavel size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">{c.status}</span>
              </div>
              <p className="text-xl font-semibold text-white">{c.title}</p>
              <p className="text-white/60 text-sm">
                Items in this case are the exact set included in your bureau letter(s). Evidence IDs and reasons are snapshotted for auditability.
              </p>

            {lastRound?.letterId ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-white/80 text-sm">
                  Linked letter: <span className="font-mono text-white/90">{lastRound.letterId}</span>
                </div>
                <Button variant="primary" size="sm" onClick={() => navigate(`/portal/letters/vault?letterId=${encodeURIComponent(lastRound.letterId!)}`)}>
                  Open letter <ArrowRight size={14} />
                </Button>
              </div>
            ) : null}

            {c.status === 'open' && lastRound?.dueAt && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-white/70 text-sm flex items-start gap-3">
                <ShieldAlert size={16} className="text-amber-400 mt-0.5" />
                <div>
                  <p className="text-white/80 font-semibold">Follow-up window</p>
                  <p className="mt-1">
                    Next follow-up due by <span className="text-white/90">{new Date(lastRound.dueAt).toLocaleDateString()}</span>.
                  </p>
                  <button
                    onClick={() => navigate('/portal/tasks')}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                  >
                    Open tasks <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
            <p className="text-[10px] uppercase tracking-widest text-white/40">Rounds</p>
            <div className="space-y-3">
              {c.rounds
                .slice()
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((r) => (
                  <div key={`${r.round}-${r.createdAt}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-white font-semibold">{r.round}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          tone: {r.tone} • created {new Date(r.createdAt).toLocaleDateString()}
                          {r.dueAt ? ` • due ${new Date(r.dueAt).toLocaleDateString()}` : ''}
                        </div>
                        {r.notes && <div className="mt-2 text-white/60 text-sm">{r.notes}</div>}
                      </div>
                      {r.letterId ? (
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-300 uppercase tracking-widest">
                          letter linked
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-white/50 uppercase tracking-widest">
                          no letter id
                        </div>
                      )}
                    </div>
                    {r.letterId ? (
                      <div className="mt-3">
                        <ActionLink to={`/portal/letters/vault?letterId=${encodeURIComponent(r.letterId)}`} icon={<ArrowRight size={14} />}>
                          Open linked letter
                        </ActionLink>
                      </div>
                    ) : null}
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Disputed items</p>
          <div className="grid md:grid-cols-2 gap-4">
            {c.items.map((it) => (
              <div key={it.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
                <div className="text-white font-semibold">{it.account}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  {it.bureau} • {it.type} • {it.status}
                </div>
                <div className="text-[11px] text-white/60 font-mono">Code: {it.code}</div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <div className="text-[9px] uppercase tracking-widest text-white/40">Reasons</div>
                    <div className="mt-1 text-white/80 font-mono text-sm">{it.reasons.length}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <div className="text-[9px] uppercase tracking-widest text-white/40">Evidence</div>
                    <div className="mt-1 text-white/80 font-mono text-sm">{it.evidenceId ? 'linked' : '—'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/portal/reports')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
            >
              Upload report / capture screenshots <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate('/portal/documents')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
            >
              Upload supporting documents <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
      </EntitlementGate>
    </PageShell>
  );
}

