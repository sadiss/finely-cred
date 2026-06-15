import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Gavel, Search, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { listCases, closeCase } from '../../data/casesRepo';
import { listPartnersByTenant } from '../../data/partnersRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { useAuth } from '../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import { bureauShortCode } from '../../utils/bureaus';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_DANGER_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsInlineListItem,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

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
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_BACK_LINK} title="Back to Finely Cred Dashboard">
            <ArrowLeft size={16} /> Dashboard
          </button>
          <button type="button" onClick={() => navigate('/admin/partners')} className={FINELY_OS_BACK_LINK} title="Back to Partner Management">
            <ArrowLeft size={16} /> Partners
          </button>
        </div>

        <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className={`flex items-center gap-3 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony px-3 py-2`}>
              <Search size={16} className="text-violet-400 shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className={`bg-transparent outline-none w-72 max-w-full text-sm ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/30`}
                placeholder="Search cases…"
              />
            </div>
            <div className={FINELY_OS_VIEW_TABS}>
              {(['open', 'closed', 'all'] as const).map((s) => (
                <button key={s} type="button" onClick={() => setStatus(s)} className={finelyOsViewTab(status === s, 'fuchsia')}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>{cases.length} cases</div>
        </div>

        {cases.length === 0 ? (
          <div className={`${finelyOsCatalogCard('violet')} !p-5 ${FINELY_OS_ENTITY_BODY}`}>
            No cases yet. Generate a bureau letter from Partner Detail → Letters to create the first case.
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {cases.map((c) => {
              const partner = partnerIndex.get(c.partnerId) ?? null;
              const lastRound = c.rounds.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
              return (
                <div key={c.id} className={`${finelyOsInlineListItem()} p-6 space-y-4`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
                        <Gavel size={16} />
                        <span>{bureauShortCode(c.bureau)} case</span>
                      </div>
                      <p className={`mt-2 text-xl ${FINELY_OS_ENTITY_VALUE} truncate`}>{c.title}</p>
                      <p className={`mt-1 ${FINELY_OS_ENTITY_BODY} truncate`}>
                        {partner?.profile.fullName ?? 'Partner'} • {partner?.profile.email ?? 'no-email'}
                      </p>
                      <p className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
                        {c.status} • {c.items.length} items • rounds: {c.rounds.length}
                      </p>
                      {lastRound && (
                        <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                          Latest: <span className={`font-mono font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{lastRound.round}</span> • Due:{' '}
                          <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{lastRound.dueAt ? new Date(lastRound.dueAt).toLocaleDateString() : '—'}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button type="button" onClick={() => navigate(`/admin/cases/${c.id}`)} className={FINELY_OS_PRIMARY_BTN}>
                        Workflow <ArrowRight size={14} />
                      </button>
                      <button type="button" onClick={() => navigate(`/admin/partners/${c.partnerId}`)} className={FINELY_OS_SECONDARY_BTN}>
                        View Partner <ArrowRight size={14} />
                      </button>
                      {c.status === 'open' && (
                        <button type="button" onClick={() => closeCase(c.id)} className={FINELY_OS_DANGER_BTN} title="Close case">
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
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
