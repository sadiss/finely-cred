import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Partner } from '../../domain/partners';
import { listEvidenceByPartner, upsertEvidence, deleteEvidence } from '../../data/evidenceRepo';
import { UnifiedEvidenceCapture } from './UnifiedEvidenceCapture';
import { checkIdentityDocumentGate } from '../../lib/documentVaultGates';
import { EvidenceList } from './EvidenceList';
import { addAuditEvent } from '../../data/auditRepo';
import { listProcessedDocumentsByPartner } from '../../data/documentsRepo';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { FinelyUnifiedHubLayout, FinelyUnifiedSection } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../tours/FinelyNoticedStrip';
import '../partner/partnerVaultWorkspace.css';
import { buildDocumentsNoticedItems } from '../../lib/finelyProactiveSignals';
import { listLettersByPartner } from '../../data/lettersRepo';
import { listReportsByPartner } from '../../data/reportsRepo';
import {
  EVIDENCE_VAULT_BUCKET_LABELS,
  EVIDENCE_VAULT_BUCKET_ORDER,
  evidenceDestination,
  evidenceVaultBucket,
  type EvidenceVaultBucketId,
} from '../../lib/evidenceVaultGrouping';
import type { UploadIntentId } from '../../lib/evidenceDocumentTaxonomy';
import {
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_NOTICE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsCatalogCard,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

export type PartnerDocumentsVaultNavigation = {
  documentsPath: string;
  reportsPath: string;
  lettersPath: string;
  disputesPath: string;
  evidenceVaultPath: string;
  dashboardPath: string;
  businessProfilePath?: string;
};

type DocTab = 'upload' | 'vault' | 'intel';

export type PartnerDocumentsVaultTab = DocTab;

const DOCUMENT_UPLOAD_INTENTS = [
  'id_document',
  'ssn_card',
  'utility_bill',
  'dispute_proof',
] as const satisfies readonly UploadIntentId[];

/**
 * Partner paperwork vault — ID, proof of address, statements, correspondence, and completed letters.
 * Dispute exhibits (report crops, bureau replies, collector paper) live in the Evidence vault instead.
 */
export function PartnerDocumentsVaultWorkspace({
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
  navigation: PartnerDocumentsVaultNavigation;
  surface?: 'dark' | 'light';
  embedded?: boolean;
  tab?: DocTab;
  onTabChange?: (tab: DocTab) => void;
}) {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [docVersion, setDocVersion] = useState(0);
  const [docNotice, setDocNotice] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [bucketFilter, setBucketFilter] = useState<'all' | EvidenceVaultBucketId>('all');
  const [internalTab, setInternalTab] = useState<DocTab>('upload');
  const tab = externalTab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;

  const evidence = useMemo(() => {
    return listEvidenceByPartner(partner.id).filter((item) => evidenceDestination(item) === 'documents');
  }, [partner.id, version]);

  const processed = useMemo(
    () => listProcessedDocumentsByPartner(partner.id),
    [partner.id, docVersion],
  );

  const filteredEvidence = useMemo(() => {
    const q = query.trim().toLowerCase();
    return evidence.filter((e) => {
      if (bucketFilter !== 'all' && evidenceVaultBucket(e) !== bucketFilter) return false;
      if (!q) return true;
      const hay = `${e.filename || ''} ${e.caption || ''} ${e.creditorName || ''} ${e.sectionKey || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [evidence, bucketFilter, query]);

  const bucketCounts = useMemo(() => {
    const counts = new Map<EvidenceVaultBucketId, number>();
    for (const e of evidence) {
      const b = evidenceVaultBucket(e);
      counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    return counts;
  }, [evidence]);

  const lettersCount = useMemo(() => listLettersByPartner(partner.id).length, [partner.id, version]);
  const reportsCount = useMemo(() => listReportsByPartner(partner.id).length, [partner.id, version]);
  const idGate = useMemo(() => checkIdentityDocumentGate(evidence), [evidence]);
  const idGateOk = idGate.ok;

  const legacyImportTotal = useMemo(
    () => evidence.filter((e) => (e.tags ?? []).includes('legacy-import')).length + reportsCount + lettersCount,
    [evidence, reportsCount, lettersCount],
  );

  const docKpis = useMemo(
    () => [
      {
        label: 'Documents on file',
        value: String(evidence.length),
        hint: idGateOk ? 'IDs and supporting docs' : 'Upload required identity proof',
        accent: 'sky' as const,
      },
      {
        label: 'Still needed',
        value: String(idGate.missing.length),
        hint: idGateOk
          ? 'Government ID and proof of address on file'
          : idGate.missing.map((m) => m.label).join(' · '),
        accent: 'rose' as const,
      },
      {
        label: 'Letters',
        value: String(lettersCount),
        hint: 'Dispute and validation',
        accent: 'violet' as const,
      },
      {
        label: 'Processed',
        value: String(processed.length),
        hint: 'Doc intel',
        accent: 'emerald' as const,
      },
    ],
    [evidence.length, idGate, idGateOk, lettersCount, processed.length],
  );

  const bumpEvidence = () => setVersion((v) => v + 1);

  const tabBody = (
    <>
      {tab === 'upload' && (
        <div className="space-y-4">
          <UnifiedEvidenceCapture
            partner={partner}
            email={actorEmail}
            uploadContext="general"
            allowedIntentIds={DOCUMENT_UPLOAD_INTENTS}
            captureEyebrow="Document upload"
            captureTitle="Add identity and supporting paperwork"
            captureDescription="Choose the document type, then use camera, gallery, or multi-file drag and drop. Document intelligence files extracted fields under Doc intel after upload."
            enableScrape={false}
            surface={surface}
            vaultOpenPath={navigation.documentsPath}
            vaultOpenLabel="Open documents vault"
            onUploaded={() => {
              bumpEvidence();
              setDocVersion((v) => v + 1);
            }}
          />
          {!embedded ? (
            <FinelyUnifiedSection
              title="How to use this vault"
              subtitle="Identity proof and correspondence — not dispute exhibit crops."
              vaultTypography
            >
              <p className="fc-vault-body">
                Use document-type chips, drag and drop, camera, or gallery for multi-file capture. Document intelligence
                organizes processed fields under Doc intel. For report region crops and bureau reply exhibits, use Credit
                reports and Evidence vault.
              </p>
              <div className={`mt-4 ${FINELY_OS_NOTICE_WARN} fc-wlp-light-notice`}>
                Tip: When bureau mail arrives, upload it to Evidence vault the same day and mark your follow-up task in progress.
              </div>
            </FinelyUnifiedSection>
          ) : null}
        </div>
      )}

      {tab === 'vault' && (
        <div className={`${finelyOsCatalogCard('violet')} !p-6 lg:!p-8 space-y-4`} data-accent="violet">
          <p className="fc-vault-eyebrow">Your files</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className={FINELY_OS_VIEW_TABS}>
                <button
                  type="button"
                  onClick={() => setBucketFilter('all')}
                  className={finelyOsViewTab(bucketFilter === 'all', 'emerald')}
                >
                  All
                </button>
                {EVIDENCE_VAULT_BUCKET_ORDER.map((b) => {
                  if (['screenshots', 'bureau_responses', 'debt_docket', 'dispute_proof'].includes(b)) return null;
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
              <div className="fc-vault-sublabel">
                {filteredEvidence.length} shown / {evidence.length} total
              </div>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files…"
              className={`w-full sm:w-[320px] ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}
            />
          </div>
          <EvidenceList
            items={filteredEvidence}
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
            onUpsert={(item) => {
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
            }}
          />
        </div>
      )}

      {tab === 'intel' && isFeatureEnabled('docIntel') ? (
        <div className={`${finelyOsCatalogCard('violet')} !p-6 lg:!p-8 space-y-4`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="fc-vault-eyebrow">Document Intelligence</p>
              <p className="mt-2 fc-vault-body">
                Uploaded PDFs/images can be classified and key fields extracted (EIN, legal name, address). Extracted
                fields can auto-fill your profile.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(navigation.businessProfilePath ?? '/business/profile')}
              className={FINELY_OS_SECONDARY_BTN}
            >
              Open Business Profile <ArrowRight size={14} />
            </button>
          </div>

          {docNotice ? <div className={`${FINELY_OS_NOTICE} fc-wlp-light-notice`}>{docNotice}</div> : null}

          {processed.length === 0 ? (
            <div className="fc-vault-body">No processed documents yet.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {processed.slice(0, 6).map((d) => (
                <div key={d.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`} data-accent="sky">
                  <div className="fc-vault-value truncate">{d.filename}</div>
                  <div className="fc-vault-sublabel">
                    {d.docType} • {new Date(d.createdAt).toLocaleString()}
                  </div>
                  {d.summary ? <div className="fc-vault-body">{d.summary}</div> : null}
                  {Object.keys(d.entities || {}).length ? (
                    <div className="mt-2 space-y-1">
                      {Object.entries(d.entities).slice(0, 6).map(([k, v]) => (
                        <div key={k} className="text-[11px] fc-vault-body">
                          <span className="fc-vault-sublabel font-mono">{k}</span>:{' '}
                          <span className="fc-vault-value font-mono">{v}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] fc-vault-body">No entities extracted.</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : tab === 'intel' ? (
        <div className="fc-vault-body">Document Intelligence is not enabled for this workspace.</div>
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <div
        data-surface-kind="documents-vault"
        data-fc-partner-vault-workspace="1"
        data-fc-partner-vault-surface={surface}
        data-embedded="true"
      >
        {tabBody}
      </div>
    );
  }

  return (
    <div
      className="space-y-3"
      data-surface-kind="documents-vault"
      data-fc-partner-portal="1"
      data-fc-partner-vault-workspace="1"
      data-fc-partner-vault-surface={surface}
    >
      <FinelyNoticedStrip
        surface={surface}
        items={buildDocumentsNoticedItems({
          evidenceCount: evidence.length,
          idGateOk,
          lettersCount,
        }).map((item) => ({
          ...item,
          to:
            item.to === '/portal/letters'
              ? navigation.lettersPath
              : item.to === '/portal/reports'
                ? navigation.reportsPath
                : item.to,
        }))}
      />

      {legacyImportTotal > evidence.length ? (
        <div className={`${FINELY_OS_NOTICE} fc-wlp-light-notice text-sm`}>
          Legacy import: {legacyImportTotal} total files across your account — {reportsCount} credit report(s) in{' '}
          <button type="button" className="underline font-semibold" onClick={() => navigate(navigation.reportsPath)}>
            Credit reports
          </button>
          , {lettersCount} letter(s) in{' '}
          <button type="button" className="underline font-semibold" onClick={() => navigate(navigation.lettersPath)}>
            Letter Studio
          </button>
          , and {evidence.length} document(s) in this vault. Dispute exhibits are in{' '}
          <button type="button" className="underline font-semibold" onClick={() => navigate(navigation.evidenceVaultPath)}>
            Evidence vault
          </button>
          .
        </div>
      ) : null}

      <FinelyNowDoThisStrip
        currentIndex={tab === 'vault' ? 1 : evidence.length > 0 ? 2 : 0}
        surface={surface}
      />

      <FinelyUnifiedHubLayout
        eyebrow="Documents vault"
        title="Your uploads — ID, address, statements, and correspondence"
        subtitle="Upload IDs, proof of address, statements, creditor letters, and completed paperwork. Report crops, bureau responses, and dispute exhibits live in Evidence vault."
        accent="sky"
        variant={surface === 'light' ? 'workspaceLight' : 'default'}
        kpis={docKpis}
        tabs={[
          { id: 'upload', label: 'Upload' },
          { id: 'vault', label: 'Your files', badge: evidence.length || undefined },
          { id: 'intel', label: 'Doc intel', badge: processed.length || undefined },
        ]}
        activeTab={tab}
        onTabChange={(id) => setTab(id as DocTab)}
        primaryAction={{ label: 'Dispute center', onClick: () => navigate(navigation.disputesPath) }}
        secondaryAction={{ label: 'Evidence vault', onClick: () => navigate(navigation.evidenceVaultPath) }}
      >
        {tabBody}
      </FinelyUnifiedHubLayout>
    </div>
  );
}
