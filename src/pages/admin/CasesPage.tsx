import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Gavel, Search, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { listCases, closeCase } from '../../data/casesRepo';
import { listPartnersByTenant } from '../../data/partnersRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { useAuth } from '../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import { ActionLink, Button } from '../../components/ui';

export default function CasesPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'open' | 'closed'>('open');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const [partnerIndex, setPartnerIndex] = useState<Map<string, import('../../domain/partners').Partner>>(new Map());
  useEffect(() => {
    const u = auth.user;
    const tenantId = getActiveTenantId();
    if (!u) { setPartnerIndex(new Map()); return; }
    getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId })
      .then((allowed) => listPartnersByTenant(tenantId).then((all) => new Map(all.filter((p) => allowed.has(p.id)).map((p) => [p.id, p]))))
      .then(setPartnerIndex);
  }, [auth.user, version]);
  const partnerIds = useMemo(() => new Set(Array.from(partnerIndex.keys())), [partnerIndex]);

  const cases = useMemo(() => {
    const all = listCases();
    const query = q.trim().toLowerCase();
    return all.filter((c) => {
      if (c.partnerId && !partnerIds.has(c.partnerId)) return false;
      if (status !== 'all' && c.status !== status) return false;
      if (!query) return true;
      const partner = partnerIndex.get(c.partnerId) ?? null;
      const hay = `${c.title} ${c.bureau} ${c.status} ${partner?.profile.fullName ?? ''} ${partner?.profile.email ?? ''}`.toLowerCase();
      return hay.includes(query);
    });
  }, [partnerIds, partnerIndex, q, status]);

  return (
    <PageShell
      badge="Admin"
      title="Case Management"
      subtitle="Dispute cases are per bureau, multi-item, and round-based. Create them from letters and track deadlines + tasks."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <ActionLink to="/dashboard" title="Back to Finely Cred Dashboard" icon={<ArrowLeft size={16} />}>
              Dashboard
            </ActionLink>
            <ActionLink to="/admin/partners" title="Back to Partner Management" icon={<ArrowLeft size={16} />}>
              Partners
            </ActionLink>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-white/60">
              <Search size={16} className="text-white/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="bg-transparent outline-none w-72 max-w-full text-white/80 placeholder:text-white/20"
                placeholder="Search cases…"
              />
            </div>
            <div className="flex items-center gap-2">
              {(['open', 'closed', 'all'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                    status === s
                      ? 'bg-amber-500 text-black border-amber-400'
                      : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 text-[10px] uppercase tracking-widest text-white/40">{cases.length} cases</div>
        </div>

        {cases.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
            No cases yet. Generate a bureau letter from Partner Detail → Letters to create the first case.
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {cases.map((c) => {
              const partner = partnerIndex.get(c.partnerId) ?? null;
              const lastRound = c.rounds.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
              return (
                <div key={c.id} className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-2 text-amber-400">
                        <Gavel size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wider">{c.bureau} case</span>
                      </div>
                      <p className="mt-2 text-xl font-semibold text-white truncate">{c.title}</p>
                      <p className="mt-1 text-white/60 text-sm truncate">
                        {partner?.profile.fullName ?? 'Partner'} • {partner?.profile.email ?? 'no-email'}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        {c.status} • {c.items.length} items • rounds: {c.rounds.length}
                      </p>
                      {lastRound && (
                        <p className="mt-2 text-white/60 text-sm">
                          Latest: <span className="text-white/80 font-mono">{lastRound.round}</span> • Due:{' '}
                          <span className="text-white/80">{lastRound.dueAt ? new Date(lastRound.dueAt).toLocaleDateString() : '—'}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/partners/${c.partnerId}`)}>
                        View Partner <ArrowRight size={14} />
                      </Button>
                      {c.status === 'open' && (
                        <button
                          onClick={() => closeCase(c.id)}
                          className="fc-focus-ring inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-[10px] font-black uppercase tracking-widest text-red-200 transition-all"
                          title="Close case"
                        >
                          <ShieldAlert size={14} />
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}

