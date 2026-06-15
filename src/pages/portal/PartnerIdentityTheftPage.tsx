import React, { useState } from 'react';
import { ArrowLeft, ShieldAlert, FileCheck, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout, FinelyUnifiedSection } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_ACCENT_LINK,
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
} from '../../features/os/finelyOsLightUi';

type IdTab = 'overview' | 'freeze' | 'recovery';

export default function PartnerIdentityTheftPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [tab, setTab] = useState<IdTab>('overview');

  return (
    <PageShell
      badge="Partner Portal"
      title="Identity Theft Center"
      subtitle="Report identity theft, freeze your credit, and track recovery steps in one place."
    >
      {!partner ? (
        <div className={FINELY_OS_PAGE}>
          <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>
            No partner profile found. If you&apos;re an admin, use Partner Management to pick a partner.
          </div>
          <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_SUCCESS_BTN}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.identityTheft]}>
          <div className={FINELY_OS_PAGE}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_BACK_LINK}>
                <ArrowLeft size={16} /> Partner Dashboard
              </button>
              <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_BACK_LINK}>
                <ArrowLeft size={16} /> Finely Cred
              </button>
            </div>

            <FinelyUnifiedHubLayout
              eyebrow="Identity theft"
              title="Recovery & protection — step by step"
              subtitle="FTC report, bureau freezes, dispute inaccurate accounts, and document everything."
              accent="violet"
              kpis={[
                { label: 'Step 1', value: 'FTC report', hint: 'identitytheft.gov', accent: 'violet' },
                { label: 'Step 2', value: '3 bureaus', hint: 'Freeze files', accent: 'amber' },
                { label: 'Step 3', value: 'Disputes', hint: 'Inaccurate tradelines', accent: 'emerald' },
                { label: 'Step 4', value: 'Vault', hint: 'Proof pack', accent: 'sky' },
              ]}
              tabs={[
                { id: 'overview', label: 'Overview' },
                { id: 'freeze', label: 'Freeze & alert' },
                { id: 'recovery', label: 'Recovery path' },
              ]}
              activeTab={tab}
              onTabChange={(id) => setTab(id as IdTab)}
              primaryAction={{ label: 'Documents vault', onClick: () => navigate('/portal/documents') }}
              secondaryAction={{ label: 'Dispute center', onClick: () => navigate('/portal/disputes') }}
            >
              {tab === 'overview' && (
                <div className={`${FINELY_OS_NOTICE_WARN} flex items-start gap-4`}>
                  <ShieldAlert size={24} className="text-violet-300 shrink-0 mt-0.5" />
                  <div>
                    <h2 className={FINELY_OS_ENTITY_VALUE}>Identity theft support</h2>
                    <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                      File your official FTC Identity Theft Report, freeze your bureau files, and keep your proof pack organized. Store
                      documents in the Documents Vault and keep communications inside Messages.
                    </p>
                  </div>
                </div>
              )}

              {tab === 'freeze' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony flex items-start gap-3`}>
                    <FileCheck size={20} className="text-violet-300 shrink-0 mt-0.5" />
                    <div>
                      <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>FTC Identity Theft Report</div>
                      <a
                        href="https://www.identitytheft.gov/"
                        target="_blank"
                        rel="noreferrer"
                        className={`mt-1 inline-block ${FINELY_OS_ENTITY_ACCENT_LINK} text-xs`}
                      >
                        Open identitytheft.gov
                      </a>
                    </div>
                  </div>
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony flex items-start gap-3`}>
                    <AlertTriangle size={20} className="text-violet-300 shrink-0 mt-0.5" />
                    <div>
                      <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>Fraud alert & freeze</div>
                      <div className="mt-1 space-y-1 text-xs">
                        <a href="https://www.equifax.com/personal/credit-report-services/credit-freeze/" target="_blank" rel="noreferrer" className={`block ${FINELY_OS_ENTITY_ACCENT_LINK}`}>
                          Equifax freeze
                        </a>
                        <a href="https://www.experian.com/freeze/center.html" target="_blank" rel="noreferrer" className={`block ${FINELY_OS_ENTITY_ACCENT_LINK}`}>
                          Experian freeze
                        </a>
                        <a href="https://www.transunion.com/credit-freeze" target="_blank" rel="noreferrer" className={`block ${FINELY_OS_ENTITY_ACCENT_LINK}`}>
                          TransUnion freeze
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'recovery' && (
                <FinelyUnifiedSection title="Recovery workflow" subtitle="Execute in order — document each step in your vault.">
                  <ol className={`list-decimal pl-5 space-y-3 ${FINELY_OS_ENTITY_BODY}`}>
                    <li>File FTC report and save confirmation PDF to Documents Vault.</li>
                    <li>Place fraud alerts or full freezes at all three bureaus.</li>
                    <li>Dispute fraudulent or inaccurate tradelines in Dispute Center.</li>
                    <li>Upload bureau responses and creditor letters as they arrive.</li>
                    <li>Message your case team if you need escalation support.</li>
                  </ol>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button type="button" onClick={() => navigate('/portal/documents')} className={FINELY_OS_PRIMARY_BTN}>
                      Open vault <ArrowRight size={14} />
                    </button>
                    <button type="button" onClick={() => navigate('/portal/messages')} className={FINELY_OS_SECONDARY_BTN}>
                      Communication hub <ArrowRight size={14} />
                    </button>
                  </div>
                </FinelyUnifiedSection>
              )}
            </FinelyUnifiedHubLayout>

            <FinelyOsPageFooter />
          </div>
        </EntitlementGate>
      )}
    </PageShell>
  );
}
