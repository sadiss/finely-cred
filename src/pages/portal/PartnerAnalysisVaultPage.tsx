import React, { useMemo, useState } from 'react';
import { ArrowLeft, FileText, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { listEvidenceByPartner } from '../../data/evidenceRepo';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { openUrlInNewTab } from '../../utils/download';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { FinelyOsEmptyState } from '../../features/os/FinelyOsEmptyState';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SUCCESS_BTN,
} from '../../features/os/finelyOsLightUi';

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

type VaultTab = 'overview' | 'reports';

export default function PartnerAnalysisVaultPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [tab, setTab] = useState<VaultTab>('reports');

  const items = useMemo(() => {
    if (!partner) return [];
    const all = listEvidenceByPartner(partner.id);
    return all
      .filter((e) => (e.tags ?? []).includes('analysis_report'))
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [partner]);

  const sourceReportCount = useMemo(() => new Set(items.map((x) => x.reportId).filter(Boolean)).size, [items]);

  const openPdf = async (blobRef: string, mimeType?: string) => {
    const res = await getBlobUrl(blobRef, { mimeType: mimeType || 'application/pdf' });
    if (!res?.url) return;
    openUrlInNewTab({ url: res.url, revoke: res.revoke, revokeAfterMs: 60_000 });
  };

  return (
    <PageShell
      badge="Partner Portal"
      title="Analysis Vault"
      subtitle="Your saved Credit Analysis Reports (PDF). Generate new ones from Reports, and keep versions here."
    >
      {!partner ? (
        <FinelyOsEmptyState
          icon={FileText}
          title="No partner profile"
          description="Sign in with a partner account to view saved analysis reports."
          primaryAction={{ label: 'Back to dashboard', onClick: () => navigate('/dashboard') }}
        />
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.reports]}>
          <div className={FINELY_OS_PAGE}>
            <button type="button" onClick={() => navigate('/portal/reports')} className={FINELY_OS_BACK_LINK}>
              <ArrowLeft size={16} /> Back to Reports
            </button>

            <FinelyUnifiedHubLayout
              eyebrow="Analysis vault"
              title="Saved credit analysis PDFs"
              subtitle="Generate new reports from Credit Intel — every version lands here for disputes and funding prep."
              accent="violet"
              kpis={[
                { label: 'Saved', value: String(items.length), hint: 'PDF reports', accent: 'violet' },
                { label: 'Sources', value: String(sourceReportCount), hint: 'Upload reports', accent: 'amber' },
                { label: 'Latest', value: items[0] ? fmtWhen(items[0].createdAt).split(',')[0] : '—', hint: 'Most recent', accent: 'sky' },
                { label: 'Vault', value: 'Linked', hint: 'Documents', accent: 'emerald' },
              ]}
              tabs={[
                { id: 'overview', label: 'Overview' },
                { id: 'reports', label: 'Saved reports', badge: items.length || undefined },
              ]}
              activeTab={tab}
              onTabChange={(id) => setTab(id as VaultTab)}
              primaryAction={{ label: 'Credit intel', onClick: () => navigate('/portal/reports') }}
              secondaryAction={{ label: 'Documents vault', onClick: () => navigate('/portal/documents') }}
            >
              {tab === 'overview' && (
                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony ${FINELY_OS_ENTITY_BODY} space-y-3`}>
                  <p>After you upload and parse a credit report, generate a Credit Analysis PDF from the Reports hub. Each saved version appears here with open-in-new-tab access.</p>
                  <p>Use these PDFs for dispute prep, specialist review, and funding-readiness conversations.</p>
                  <button type="button" onClick={() => navigate('/portal/reports')} className={FINELY_OS_SUCCESS_BTN}>
                    Open Reports <ExternalLink size={14} />
                  </button>
                </div>
              )}

              {tab === 'reports' && (
                <>
                  {items.length === 0 ? (
                    <FinelyOsEmptyState
                      icon={FileText}
                      title="No analysis reports yet"
                      description="Generate a Credit Analysis PDF from Reports after you upload and parse a credit file."
                      primaryAction={{ label: 'Open Reports', onClick: () => navigate('/portal/reports') }}
                    />
                  ) : (
                    <FinelyOsPaginatedStack
                      items={items}
                      pageSize={12}
                      itemSpacingClassName="grid lg:grid-cols-2 gap-4"
                      renderItem={(e) => (
                        <div key={e.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-violet-300">
                                <FileText size={18} />
                                <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{e.caption || e.filename}</div>
                              </div>
                              <div className={`mt-2 text-[12px] ${FINELY_OS_ENTITY_BODY}`}>
                                {fmtWhen(e.createdAt)}
                                {e.reportId ? <span className="text-white/35"> • </span> : null}
                                {e.reportId ? <span className="text-white/50">report: {String(e.reportId).slice(0, 8)}</span> : null}
                              </div>
                              <div className={`mt-1 text-[12px] truncate ${FINELY_OS_ENTITY_SUBLABEL}`}>{e.filename}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => void openPdf(e.blobRef, e.mimeType)}
                              className={`shrink-0 ${FINELY_OS_SUCCESS_BTN}`}
                            >
                              Open <ExternalLink size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    />
                  )}
                </>
              )}
            </FinelyUnifiedHubLayout>

            <FinelyOsPageFooter />
          </div>
        </EntitlementGate>
      )}
    </PageShell>
  );
}
