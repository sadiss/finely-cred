import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { BusinessNav } from '../../components/business/BusinessNav';
import { BusinessCommandStrip } from '../../components/business/BusinessCommandStrip';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type DocTab = 'checklist' | 'vault';

export default function BusinessDocumentsPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [tab, setTab] = useState<DocTab>('checklist');

  return (
    <PageShell
      badge="Business Portal"
      title="Business Documents"
      subtitle="Document requirements, templates, and uploads for fundability."
    >
      <div className={FINELY_OS_PAGE}>
        <BusinessNav />
        <BusinessCommandStrip partner={partner ?? null} />

        <FinelyUnifiedHubLayout
          eyebrow="Business credit OS"
          title="Document readiness vault"
          subtitle="Entity, banking, and compliance artifacts lenders expect — organized before you apply."
          accent="amber"
          kpis={[
            { label: 'Entity docs', value: '4 types', accent: 'amber' },
            { label: 'Vault', value: 'Portal', accent: 'emerald' },
          ]}
          tabs={[
            { id: 'checklist', label: 'Checklist' },
            { id: 'vault', label: 'Open vault' },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as DocTab)}
          primaryAction={{ label: 'Documents vault', onClick: () => navigate('/portal/documents') }}
          secondaryAction={{ label: 'Business profile', onClick: () => navigate('/business/profile') }}
        >
          {tab === 'checklist' && (
            <div className={`${finelyOsCatalogCard('amber')} !p-6 space-y-4`} data-fc-accent="amber">
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Document checklist</p>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: 'Entity docs', desc: 'Articles, operating agreement, EIN letter, SOS filings.' },
                  { title: 'Identity + ownership', desc: 'Owner ID, ownership structure, verification artifacts.' },
                  { title: 'Banking', desc: 'Statements, balances, proof of revenue cadence.' },
                  { title: 'Compliance', desc: 'Licenses, domain/email proofs, 411, insurance where needed.' },
                ].map((x, idx) => (
                  <div key={x.title} className={`${finelyOsCatalogCard((['emerald', 'sky', 'violet', 'fuchsia'] as const)[idx % 4])} !p-6`} data-fc-accent={(['emerald', 'sky', 'violet', 'fuchsia'] as const)[idx % 4]}>
                    <div className={FINELY_OS_ENTITY_VALUE}>{x.title}</div>
                    <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{x.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'vault' && (
            <div className={`${finelyOsCatalogCard('emerald')} !p-6 space-y-4`} data-fc-accent="emerald">
              <p className={FINELY_OS_ENTITY_BODY}>
                Upload and organize files in the partner Documents Vault. Support can review from the same thread if you need help.
              </p>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => navigate('/portal/documents')} className={FINELY_OS_PRIMARY_BTN}>
                  Open Documents Vault
                </button>
                <button type="button" onClick={() => navigate('/portal/messages')} className={FINELY_OS_SECONDARY_BTN}>
                  Ask support
                </button>
              </div>
            </div>
          )}
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
