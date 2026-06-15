import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CreditCard, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { tradelinePromoPackages, formatPrice } from '../../config/pricingCatalog';
import { completeTradelinePurchase } from '../../lib/commerceHub';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { PricingPackageCatalog } from '../../components/pricing/PricingPackageCatalog';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsListItem,
} from '../../features/os/finelyOsLightUi';

type TradelineTab = 'overview' | 'packages' | 'next';

export default function PartnerTradelineMarketplacePage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [tab, setTab] = useState<TradelineTab>('packages');
  const [lane, setLane] = useState<'all' | 'au' | 'primary'>('all');
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const packages = useMemo(() => tradelinePromoPackages.filter((p) => p.isPublic), []);

  const filteredPackages = useMemo(() => {
    if (lane === 'all') return packages;
    if (lane === 'au') {
      return packages.filter(
        (p) =>
          /authorized|au/i.test(p.name + p.tagline + p.description) ||
          (p.highlights ?? []).some((h) => /authorized|au/i.test(h)),
      );
    }
    return packages.filter(
      (p) =>
        /primary|installment/i.test(p.name + p.tagline + p.description) ||
        (p.highlights ?? []).some((h) => /primary|installment/i.test(h)),
    );
  }, [lane, packages]);

  const handleDemoPurchase = (packageId: string) => {
    if (!partner) return;
    setBusyId(packageId);
    setNotice(null);
    try {
      const result = completeTradelinePurchase({
        partnerId: partner.id,
        packageId,
        tenantId: partner.tenantId ?? FINELY_TENANT_ID,
        rail: 'in_house',
      });
      setNotice(result.ok ? result.message : result.message);
    } catch (e: unknown) {
      setNotice((e as Error)?.message || 'Purchase failed.');
    } finally {
      setBusyId(null);
    }
  };

  if (!partner) {
    return (
      <PageShell badge="Partner Portal" title="Tradeline Marketplace" subtitle="Sign in with a partner profile to browse tradeline packages.">
        <div className={FINELY_OS_PAGE}>
          <div className={FINELY_OS_LUXURY_EMPTY}>Sign in to browse tradeline packages.</div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      badge="Partner Portal"
      title="Tradeline Marketplace"
      subtitle="Authorized user + primary installment lanes — purchase activates Work OS onboarding tasks and nurture follow-up."
    >
      <div className={FINELY_OS_PAGE}>
        <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Partner Dashboard
        </button>

        {notice ? (
          <div className={notice.includes('activated') ? FINELY_OS_NOTICE_SUCCESS : FINELY_OS_NOTICE_WARN}>{notice}</div>
        ) : null}

        <FinelyUnifiedHubLayout
          eyebrow="Tradeline marketplace"
          title="AU + primary installment lanes"
          subtitle="Packages include authorized user placements and in-house primary reporting. Educational only — no score guarantees."
          accent="violet"
          kpis={[
            { label: 'Packages', value: String(packages.length), hint: 'Public catalog', accent: 'violet' },
            { label: 'Lane', value: lane === 'all' ? 'All' : lane === 'au' ? 'AU' : 'Primary', hint: 'Filter', accent: 'amber' },
            { label: 'Showing', value: String(filteredPackages.length), hint: 'Filtered', accent: 'emerald' },
            { label: 'Rail', value: 'In-house', hint: 'Demo activate', accent: 'sky' },
          ]}
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'packages', label: 'Packages', badge: filteredPackages.length || undefined },
            { id: 'next', label: 'After purchase' },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as TradelineTab)}
          primaryAction={{ label: 'Full checkout', onClick: () => navigate('/portal/checkout?category=tradeline_promo') }}
          secondaryAction={{ label: 'Work OS projects', onClick: () => navigate('/portal/projects') }}
        >
          {tab === 'overview' && (
            <div className={`${finelyOsCatalogCard('violet')} !p-6 space-y-4`} data-fc-accent="violet">
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-700`}>
                <Sparkles size={14} className="text-violet-700" /> AU + Primary lanes
              </div>
              <p className={FINELY_OS_ENTITY_BODY}>
                Browse tradeline packages, activate demo purchases locally, or open full checkout for in-house financing rails.
              </p>
              <div className="flex flex-wrap gap-2">
                {(['all', 'au', 'primary'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => {
                      setLane(l);
                      setTab('packages');
                    }}
                    className={lane === l ? FINELY_OS_SUCCESS_BTN : FINELY_OS_SECONDARY_BTN}
                  >
                    {l === 'all' ? 'All packages' : l === 'au' ? 'Authorized user' : 'Primary focus'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'packages' && (
            <>
              <div className="flex flex-wrap gap-2 mb-2">
                {(['all', 'au', 'primary'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLane(l)}
                    className={lane === l ? FINELY_OS_SUCCESS_BTN : FINELY_OS_SECONDARY_BTN}
                  >
                    {l === 'all' ? 'All' : l === 'au' ? 'AU' : 'Primary'}
                  </button>
                ))}
              </div>
              <PricingPackageCatalog
                packages={filteredPackages}
                pageSize={6}
                searchPlaceholder="Search tradeline packages…"
                selectLabel="Checkout"
                onSelect={(pkgId) =>
                  navigate(`/portal/checkout?package=${encodeURIComponent(pkgId)}&category=tradeline_promo&rail=in_house`)
                }
              />
              <div className="flex flex-wrap gap-2 pt-2">
                {filteredPackages.slice(0, 3).map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    disabled={busyId === pkg.id}
                    onClick={() => handleDemoPurchase(pkg.id)}
                    className={FINELY_OS_SECONDARY_BTN}
                  >
                    <CreditCard size={14} /> Demo: {pkg.name.split('—')[0]?.trim() || pkg.name}
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === 'next' && (
            <div className={`${finelyOsListItem(false, 'emerald')} p-4 flex flex-wrap items-center justify-between gap-4`}>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-300" />
                <span className={FINELY_OS_ENTITY_BODY}>After purchase, open Work OS tasks for intake and posting watch.</span>
              </div>
              <button type="button" onClick={() => navigate('/portal/projects')} className={FINELY_OS_SUCCESS_BTN}>
                Open projects
              </button>
            </div>
          )}
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
