import React from 'react';
import { ArrowRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { PublicLaneTitle } from '../components/public/PublicLaneTitle';
import { PUBLIC_ONE_SHEET_PACKS } from '../config/publicResourcesHub';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../features/os/finelyOsLightUi';

export default function ResourcesOneSheetsHubPage() {
  const navigate = useNavigate();

  usePublicSeoMeta({
    title: 'Partner one-sheets',
    description:
      'Finely Cred partner one-sheet packs — business credit offer sheets, process briefs, and Credit Specialist path PDFs.',
    path: '/resources/one-sheets',
  });

  return (
    <PageShell
      badge="Partner resources"
      title="Partner one-sheets"
      subtitle="Short PDFs for offers, tiers, and talking points — pick a pack, download, then book a session."
    >
      <div className={`${FINELY_OS_PAGE} fc-senior-simple`}>
        <PublicLaneTitle
          lane="resources"
          eyebrow="One-sheets hub"
          text="Short PDFs. Fast talking points."
          highlight="talking points."
        />
        <FinelyUnifiedHubLayout
          eyebrow="One-sheets hub"
          title="Partner one-sheets"
          subtitle="Business credit destination sheets and Credit Specialist path materials. Results vary · not legal advice · funding subject to underwriting."
          accent="violet"
          kpis={[
            { label: 'Packs', value: String(PUBLIC_ONE_SHEET_PACKS.length), accent: 'violet' },
            { label: 'Format', value: 'PDF', accent: 'amber' },
          ]}
          primaryAction={{
            label: 'Business credit pack',
            onClick: () => navigate('/resources/business-credit-one-sheets'),
          }}
          secondaryAction={{ label: 'Resource hub', onClick: () => navigate('/resources') }}
        >
          <div className="grid gap-3 md:grid-cols-2">
            {PUBLIC_ONE_SHEET_PACKS.map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => navigate(pack.path)}
                className={`${finelyOsCatalogCard(pack.accent)} !p-5 text-left transition-all hover:brightness-110`}
                data-fc-accent={pack.accent}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-black/25">
                    <FileText size={18} />
                  </div>
                  {pack.badge ? (
                    <span className={`${FINELY_OS_ENTITY_SUBLABEL}`}>{pack.badge}</span>
                  ) : null}
                </div>
                <div className={`mt-3 text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{pack.title}</div>
                <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>{pack.desc}</p>
                <span className={`${FINELY_OS_PRIMARY_BTN} mt-4`}>
                  Open pack <ArrowRight size={14} />
                </span>
              </button>
            ))}
          </div>

          <div className={`mt-4 flex flex-wrap gap-3 ${finelyOsCatalogCard('sky')} !p-4`} data-fc-accent="sky">
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/resources/guides')}>
              All free guides
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/pricing/business-credit')}>
              Business credit pricing
            </button>
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/enlightenment-session')}>
              Book a session <ArrowRight size={14} />
            </button>
          </div>

          <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-4`}>
            Results vary · not legal advice · funding subject to underwriting.
          </p>
        </FinelyUnifiedHubLayout>

        <MarketingStaffChatStrip
          roleId="nurture_concierge"
          goal="business"
          roleLabel="welcome concierge"
          subline="Need the right one-sheet for your offer conversation?"
        />
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
