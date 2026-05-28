import React, { useEffect, useMemo, useState } from 'react';
import { Building2, ExternalLink, FileText, LayoutGrid, Target, Users, Crown, Lock, CheckCircle2, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { BusinessReadinessChecklist } from '../../components/business/BusinessReadinessChecklist';
import { useAuth } from '../../auth/AuthProvider';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { listVendors } from '../../data/vendorsRepo';
import { listVendorProgress, setVendorProgress } from '../../data/vendorProgressRepo';
import { KpiCard } from '../../components/ui/KpiCards';
import type { Vendor, VendorTier } from '../../domain/vendors';

function navBtn(active: boolean) {
  return `px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
    active ? 'bg-amber-500 text-black border-amber-400' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
  }`;
}

function tierBadge(tier: VendorTier) {
  if (tier === 1) return { label: 'Tier 1', cls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200' };
  if (tier === 2) return { label: 'Tier 2', cls: 'bg-amber-500/15 border-amber-500/30 text-amber-200' };
  return { label: 'Tier 3', cls: 'bg-violet-500/15 border-violet-500/30 text-violet-200' };
}

export default function BusinessVendorsPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const tenantId = (partner?.tenantId || '').trim() || FINELY_TENANT_ID;
  const vendors = useMemo(() => listVendors({ tenantId }), [tenantId, version]);
  const progress = useMemo(() => (partner ? listVendorProgress({ partnerId: partner.id, tenantId }) : []), [partner?.id, tenantId, version]);
  const progressByVendorId = useMemo(() => new Map(progress.map((r) => [r.vendorId, r])), [progress]);

  const openedIds = useMemo(() => new Set(progress.filter((r) => r.status === 'opened').map((r) => r.vendorId)), [progress]);

  const openedTier1 = useMemo(() => vendors.filter((v) => v.tier === 1 && openedIds.has(v.id)).length, [vendors, openedIds]);
  const openedTier2 = useMemo(() => vendors.filter((v) => v.tier === 2 && openedIds.has(v.id)).length, [vendors, openedIds]);
  const openedTier3 = useMemo(() => vendors.filter((v) => v.tier === 3 && openedIds.has(v.id)).length, [vendors, openedIds]);

  const business = useMemo(() => {
    const r: any = partner?.routes?.business_build ?? {};
    return r.business ?? {};
  }, [partner]);

  const hasTier1Basics = Boolean(String(business.businessName || '').trim()) && Boolean(String(business.entityState || '').trim());
  const tier1Unlocked = hasTier1Basics;
  const tier2Unlocked = tier1Unlocked && openedTier1 >= 3;
  const tier3Unlocked = tier2Unlocked && openedTier2 >= 3;
  const unlockedTier: 0 | VendorTier = tier3Unlocked ? 3 : tier2Unlocked ? 2 : tier1Unlocked ? 1 : 0;

  const vendorsByTier = useMemo(() => {
    const by: Record<string, Vendor[]> = { '1': [], '2': [], '3': [] };
    for (const v of vendors) by[String(v.tier)]?.push(v);
    return by as Record<'1' | '2' | '3', Vendor[]>;
  }, [vendors]);

  const groupedByCategory = (arr: Vendor[]) => {
    const m = new Map<string, Vendor[]>();
    for (const v of arr) m.set(v.category, [...(m.get(v.category) ?? []), v]);
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  return (
    <PageShell
      badge="Business Portal"
      title="Vendor Center"
      subtitle="Sequenced vendors and accounts that build business credit the right way — aligned to fundability signals and reporting."
      back={{ to: -1 }}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <button className={navBtn(false)} onClick={() => navigate('/business/dashboard')}>
            <LayoutGrid size={12} className="inline mr-2" /> Dashboard
          </button>
          <button className={navBtn(false)} onClick={() => navigate('/business/profile')}>
            <Building2 size={12} className="inline mr-2" /> Profile
          </button>
          <button className={navBtn(true)} onClick={() => navigate('/business/vendors')}>
            <Users size={12} className="inline mr-2" /> Vendors
          </button>
          <button className={navBtn(false)} onClick={() => navigate('/business/lender-logic')}>
            <Target size={12} className="inline mr-2" /> Lender Logic
          </button>
          <button className={navBtn(false)} onClick={() => navigate('/business/documents')}>
            <FileText size={12} className="inline mr-2" /> Documents
          </button>
          <button className={navBtn(false)} onClick={() => navigate('/business/billion-path')}>
            <Crown size={12} className="inline mr-2" /> Billion Path
          </button>
        </div>

        {!partner ? (
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
            Sign in as a partner to see your vendor sequencing and track which accounts you’ve opened.
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-4">
              <KpiCard label="Unlocked tier" value={unlockedTier ? `Tier ${unlockedTier}` : 'Locked'} hint="Sequencing access" tone={unlockedTier ? 'emerald' : 'amber'} />
              <KpiCard label="Tier 1 opened" value={openedTier1} hint="Starter accounts" tone="emerald" />
              <KpiCard label="Tier 2 opened" value={openedTier2} hint="Scaling accounts" tone="amber" />
              <KpiCard label="Tier 3 opened" value={openedTier3} hint="Mature approvals" tone="violet" />
            </div>

            {!tier1Unlocked ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-white/70">
                <div className="flex items-start gap-3">
                  <Lock size={18} className="text-amber-300 mt-0.5" />
                  <div>
                    <div className="text-white font-semibold">Tier 1 is locked</div>
                    <div className="mt-1 text-white/70 text-sm">
                      Complete your <strong>business basics</strong> first (business legal name + entity state). That unlocks Tier 1 sequencing.
                    </div>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => navigate('/business/profile')}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                      >
                        Go to Business Profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-4">
              {[1, 2, 3].map((tier) => {
                const t = tier as VendorTier;
                const unlocked = t === 1 ? tier1Unlocked : t === 2 ? tier2Unlocked : tier3Unlocked;
                const items = vendorsByTier[String(t) as '1' | '2' | '3'] ?? [];
                const b = tierBadge(t);
                return (
                  <details key={t} open={t === 1} className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
                    <summary className="cursor-pointer select-none flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${b.cls}`}>
                          {b.label}
                        </span>
                        <span className="text-white font-semibold">Vendors</span>
                        <span className="text-white/50 text-sm">({items.length})</span>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${unlocked ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {unlocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </summary>

                    {!unlocked ? (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-white/70">
                        <div className="flex items-start gap-3">
                          <Lock size={18} className="text-amber-300 mt-0.5" />
                          <div className="space-y-1">
                            <div className="text-white font-semibold">Complete Tier {t - 1} first</div>
                            <div className="text-white/70 text-sm">
                              Unlock rule: open at least <strong>3 vendors</strong> in Tier {t - 1}.
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 space-y-4">
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-[11px] text-white/60">
                          Tip: These are curated starters. Availability + reporting behavior can change — always confirm terms and keep sequencing clean.
                        </div>
                        {groupedByCategory(items).map(([cat, catItems]) => (
                          <details key={cat} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                            <summary className="cursor-pointer select-none text-white/80 font-semibold">
                              {cat} <span className="text-white/40 font-normal">({catItems.length})</span>
                            </summary>
                            <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {catItems.map((v) => {
                                const pr = progressByVendorId.get(v.id) ?? null;
                                const opened = pr?.status === 'opened';
                                const skipped = pr?.status === 'skipped';
                                return (
                                  <div key={v.id} className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="text-white font-semibold truncate">{v.name}</div>
                                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                          Tier {v.tier} • {v.category}
                                        </div>
                                      </div>
                                      <div
                                        className={`px-2 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                                          opened
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                                            : skipped
                                              ? 'border-white/10 bg-white/[0.02] text-white/50'
                                              : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                                        }`}
                                      >
                                        {opened ? 'Opened' : skipped ? 'Skipped' : 'New'}
                                      </div>
                                    </div>

                                    {v.notes ? <div className="text-white/60 text-sm">{v.notes}</div> : null}

                                    {Array.isArray(v.prerequisites) && v.prerequisites.length ? (
                                      <div className="text-white/50 text-xs">
                                        <span className="text-white/40 uppercase tracking-widest text-[10px] font-mono">Prereqs:</span>{' '}
                                        {v.prerequisites.slice(0, 4).join(' • ')}
                                      </div>
                                    ) : null}

                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                      {v.website ? (
                                        <a
                                          href={v.website}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                                        >
                                          Open <ExternalLink size={14} />
                                        </a>
                                      ) : null}

                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!partner) return;
                                          setVendorProgress({ partnerId: partner.id, vendorId: v.id, status: opened ? 'recommended' : 'opened', tenantId });
                                          setVersion((x) => x + 1);
                                        }}
                                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                          opened
                                            ? 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white/70'
                                            : 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200'
                                        }`}
                                        title={opened ? 'Mark as not opened' : 'Mark as opened'}
                                      >
                                        {opened ? <Circle size={14} /> : <CheckCircle2 size={14} />} {opened ? 'Undo' : 'Opened'}
                                      </button>

                                      {!opened ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!partner) return;
                                            setVendorProgress({ partnerId: partner.id, vendorId: v.id, status: skipped ? 'recommended' : 'skipped', tenantId });
                                            setVersion((x) => x + 1);
                                          }}
                                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/60 transition-all"
                                          title={skipped ? 'Unskip vendor' : 'Skip vendor'}
                                        >
                                          Skip
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        ))}
                      </div>
                    )}
                  </details>
                );
              })}
            </div>
          </>
        )}

        <BusinessReadinessChecklist title="Sequencing + readiness (track progress)" compact />
      </div>
    </PageShell>
  );
}

