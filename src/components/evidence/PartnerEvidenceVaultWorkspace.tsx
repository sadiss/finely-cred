import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Partner } from '../../domain/partners';
import { listEvidenceByPartner, upsertEvidence, deleteEvidence } from '../../data/evidenceRepo';
import { UnifiedEvidenceCapture } from './UnifiedEvidenceCapture';
import { EvidenceList } from './EvidenceList';
import { addAuditEvent } from '../../data/auditRepo';
import { FinelyUnifiedHubLayout, FinelyUnifiedSection } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../tours/FinelyNowDoThisStrip';
import '../partner/partnerVaultWorkspace.css';
import {
  EVIDENCE_VAULT_BUCKET_LABELS,
  EVIDENCE_VAULT_BUCKET_ORDER,
  evidenceDestination,
  evidenceVaultBucket,
  type EvidenceVaultBucketId,
} from '../../lib/evidenceVaultGrouping';
import type { UploadIntentId } from '../../lib/evidenceDocumentTaxonomy';
import {
  approveEvidenceForMail,
  isMailEligibleEvidence,
  isSourceLinkedEvidence,
  needsEvidenceMailReview,
} from '../../lib/evidenceMailReview';
import {
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_VIEW_TABS,
  finelyOsCatalogCard,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

export type PartnerEvidenceVaultNavigation = {
  evidenceVaultPath: string;
  reportsPath: string;
  lettersPath: string;
  disputesPath: string;
  documentsPath: string;
  dashboardPath: string;
};

type ExhibitTab = 'exhibits' | 'upload' | 'review';

export type PartnerEvidenceVaultTab = ExhibitTab;

const EVIDENCE_ONLY_BUCKETS: EvidenceVaultBucketId[] = [
  'screenshots',
  'bureau_responses',
  'debt_docket',
  'dispute_proof',
];

const EVIDENCE_UPLOAD_INTENTS = [
  'bureau_response',
  'affidavit',
  'summons',
  'docket',
  'collection_notice',
  'creditor_response',
  'court_filing',
  'bankruptcy_order',
  'dispute_proof',
] as const satisfies readonly UploadIntentId[];

/**
 * Dispute exhibits — report crops, bureau replies, collector and court paper, payment proof.
 * Partner identity uploads and correspondence live in Documents vault instead.
 */
export function PartnerEvidenceVaultWorkspace({
  partner,
  actorEmail = '',
  navigation,
  surface = 'dark',
  embedded = false,
  tab: externalTab,
  onTabChange,
}: {
  partner: Partner;
  actorEmail?: string;
  navigation: PartnerEvidenceVaultNavigation;
  surface?: 'dark' | 'light';
  embedded?: boolean;
  tab?: ExhibitTab;
  onTabChange?: (tab: ExhibitTab) => void;
}) {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState('');
  const [bucketFilter, setBucketFilter] = useState<'all' | EvidenceVaultBucketId>('all');
  const [internalTab, setInternalTab] = useState<ExhibitTab>('exhibits');
  const tab = externalTab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;

  const evidence = useMemo(() => {
    return listEvidenceByPartner(partner.id).filter((item) => evidenceDestination(item) === 'evidence');
  }, [partner.id, version]);

  const reviewCount = useMemo(() => evidence.filter(needsEvidenceMailReview).length, [evidence]);
  const mailCount = useMemo(() => evidence.filter(isMailEligibleEvidence).length, [evidence]);
  const sourceLinked = useMemo(() => evidence.filter(isSourceLinkedEvidence).length, [evidence]);

  const filteredEvidence = useMemo(() => {
    const q = query.trim().toLowerCase();
    return evidence.filter((e) => {
      if (tab === 'review' && !needsEvidenceMailReview(e)) return false;
      if (bucketFilter !== 'all' && evidenceVaultBucket(e) !== bucketFilter) return false;
      if (!q) return true;
      const hay = `${e.filename || ''} ${e.caption || ''} ${e.creditorName || ''} ${e.sectionKey || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [evidence, bucketFilter, query, tab]);

  const bucketCounts = useMemo(() => {
    const counts = new Map<EvidenceVaultBucketId, number>();
    for (const e of evidence) {
      const b = evidenceVaultBucket(e);
      counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    return counts;
  }, [evidence]);

  const exhibitKpis = useMemo(
    () => [
      {
        label: 'Exhibits on file',
        value: String(evidence.length),
        hint: 'Crops, replies, and proof',
        accent: 'emerald' as const,
      },
      {
        label: 'Needs review',
        value: String(reviewCount),
        hint: reviewCount ? 'Cannot mail until confirmed' : 'Nothing blocking this round',
        accent: 'rose' as const,
      },
      {
        label: 'Mail-eligible',
        value: String(mailCount),
        hint: mailCount ? 'Ready in Letter Studio' : 'Approve exhibits to unlock mailing',
        accent: 'violet' as const,
      },
      {
        label: 'Source-linked',
        value: String(sourceLinked),
        hint: sourceLinked ? 'Point to a report region' : 'Capture from Credit reports',
        accent: 'sky' as const,
      },
    ],
    [evidence.length, mailCount, reviewCount, sourceLinked],
  );

  const bumpEvidence = () => setVersion((v) => v + 1);

  const handleUpsert = (item: Parameters<typeof upsertEvidence>[0]) => {
    upsertEvidence(item);
    addAuditEvent({
      partnerId: partner.id,
      actorType: 'partner',
      actorEmail: actorEmail || undefined,
      action: 'evidence.categorized',
      entityType: 'evidence',
      entityId: item.id,
      meta: { sectionKey: item.sectionKey ?? null },
    });
    bumpEvidence();
  };

  const handleApprove = (item: Parameters<typeof upsertEvidence>[0]) => {
    const approved = approveEvidenceForMail(item);
    upsertEvidence(approved);
    addAuditEvent({
      partnerId: partner.id,
      actorType: 'partner',
      actorEmail: actorEmail || undefined,
      action: 'evidence.approved_for_mail',
      entityType: 'evidence',
      entityId: item.id,
    });
    bumpEvidence();
  };

  const tabBody = (
    <>
      {tab === 'upload' && (
        <div className="space-y-4">
          <UnifiedEvidenceCapture
            partner={partner}
            email={actorEmail}
            uploadContext="general"
            allowedIntentIds={EVIDENCE_UPLOAD_INTENTS}
            captureEyebrow="Evidence upload"
            captureTitle="Add a source exhibit"
            captureDescription="Choose the proof type, then use camera, gallery, or multi-file drag and drop. Field extraction stays beside the exhibit so you can verify it before mailing."
            enableScrape
            surface={surface}
            vaultOpenPath={navigation.evidenceVaultPath}
            vaultOpenLabel="Open evidence vault"
            onUploaded={() => bumpEvidence()}
          />
          {!embedded ? (
            <FinelyUnifiedSection
              title="What belongs here"
              subtitle="Exhibits that cite a dispute reason — not your identity paperwork."
              vaultTypography
            >
              <p className="fc-vault-body">
                Upload bureau investigation results, collector notices, court filings, and payment proof. Capture report
                region crops from Credit reports — they land here automatically after review.
              </p>
              <p className="mt-3 fc-vault-body">
                Government ID and proof of address belong in{' '}
                <button type="button" className="underline font-semibold" onClick={() => navigate(navigation.documentsPath)}>
                  Documents vault
                </button>
                .
              </p>
            </FinelyUnifiedSection>
          ) : null}
        </div>
      )}

      {(tab === 'exhibits' || tab === 'review') && (
        <div className={`${finelyOsCatalogCard('violet')} !p-6 lg:!p-8 space-y-4`} data-accent="violet">
          <p className="fc-vault-eyebrow">{tab === 'review' ? 'Review queue' : 'Exhibits by dispute'}</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {tab === 'exhibits' ? (
                <div className={FINELY_OS_VIEW_TABS}>
                  <button
                    type="button"
                    onClick={() => setBucketFilter('all')}
                    className={finelyOsViewTab(bucketFilter === 'all', 'emerald')}
                  >
                    All
                  </button>
                  {EVIDENCE_VAULT_BUCKET_ORDER.filter((b) => EVIDENCE_ONLY_BUCKETS.includes(b)).map((b) => {
                    const n = bucketCounts.get(b) ?? 0;
                    if (!n) return null;
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBucketFilter(b)}
                        className={finelyOsViewTab(bucketFilter === b, 'emerald')}
                        title={EVIDENCE_VAULT_BUCKET_LABELS[b]}
                      >
                        {EVIDENCE_VAULT_BUCKET_LABELS[b].replace(/ &.*/, '')} ({n})
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="fc-vault-sublabel">
                  Confirm each crop matches the original report before mailing.
                </div>
              )}
              <div className="fc-vault-sublabel">
                {filteredEvidence.length} shown / {evidence.length} total
              </div>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exhibits…"
              className={`w-full sm:w-[320px] ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}
            />
          </div>
          {filteredEvidence.length === 0 ? (
            <div className="fc-vault-body">
              {tab === 'review'
                ? 'No exhibits waiting for review — open Letter Studio to attach approved proof.'
                : 'No exhibits yet — capture a report region or upload a bureau reply to start.'}
            </div>
          ) : (
            <EvidenceList
              items={filteredEvidence}
              showMailReview
              needsMailReview={needsEvidenceMailReview}
              onApproveForMail={handleApprove}
              onDelete={(id) => {
                deleteEvidence(id);
                addAuditEvent({
                  partnerId: partner.id,
                  actorType: 'partner',
                  actorEmail: actorEmail || undefined,
                  action: 'evidence.deleted',
                  entityType: 'evidence',
                  entityId: id,
                });
                bumpEvidence();
              }}
              onUpsert={handleUpsert}
            />
          )}
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <div
        data-surface-kind="evidence-vault"
        data-fc-partner-vault-workspace="1"
        data-fc-partner-vault-surface={surface}
        data-embedded="true"
      >
        {reviewCount > 0 ? (
          <div className={`${FINELY_OS_NOTICE_WARN} fc-wlp-light-notice text-sm mb-4`}>
            {reviewCount} exhibit{reviewCount === 1 ? '' : 's'} need review before they can be attached to dispute letters.
          </div>
        ) : null}
        {tabBody}
      </div>
    );
  }

  return (
    <div
      className="space-y-3"
      data-surface-kind="evidence-vault"
      data-fc-partner-portal="1"
      data-fc-partner-vault-workspace="1"
      data-fc-partner-vault-surface={surface}
    >
      {reviewCount > 0 ? (
        <div className={`${FINELY_OS_NOTICE_WARN} fc-wlp-light-notice text-sm`}>
          {reviewCount} exhibit{reviewCount === 1 ? '' : 's'} need review before they can be attached to dispute letters.
        </div>
      ) : null}

      <FinelyNowDoThisStrip
        currentIndex={reviewCount > 0 ? 0 : evidence.length > 0 ? 2 : 1}
        surface={surface}
      />

      <FinelyUnifiedHubLayout
        eyebrow="Evidence vault"
        title="Source exhibits and proof that back every dispute reason"
        subtitle="Report crops, bureau replies, collector paper, and payment proof — each tied to the finding it supports. ID and address paperwork live in Documents."
        accent="emerald"
        variant={surface === 'light' ? 'workspaceLight' : 'default'}
        kpis={exhibitKpis}
        tabs={[
          { id: 'exhibits', label: 'Exhibits', badge: evidence.length || undefined },
          { id: 'upload', label: 'Upload response' },
          { id: 'review', label: 'Review queue', badge: reviewCount || undefined },
        ]}
        activeTab={tab}
        onTabChange={(id) => setTab(id as ExhibitTab)}
        primaryAction={{ label: 'Credit reports', onClick: () => navigate(navigation.reportsPath) }}
        secondaryAction={{ label: 'Letter Studio', onClick: () => navigate(navigation.lettersPath) }}
      >
        {tabBody}
      </FinelyUnifiedHubLayout>
    </div>
  );
}
