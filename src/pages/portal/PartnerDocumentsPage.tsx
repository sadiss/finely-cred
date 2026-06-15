import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { listEvidenceByPartner, upsertEvidence, deleteEvidence } from '../../data/evidenceRepo';
import { ProofDocumentsHub } from '../../components/evidence/ProofDocumentsHub';
import { DocumentIdScanPanel } from '../../components/documents/DocumentIdScanPanel';
import { checkIdentityDocumentGate } from '../../lib/documentVaultGates';
import { EvidenceList } from '../../components/evidence/EvidenceList';
import { addAuditEvent } from '../../data/auditRepo';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { listProcessedDocumentsByPartner } from '../../data/documentsRepo';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout, FinelyUnifiedSection } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildDocumentsNoticedItems } from '../../lib/finelyProactiveSignals';
import { listLettersByPartner } from '../../data/lettersRepo';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_NOTICE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

export default function PartnerDocumentsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const email = auth.user?.email || '';
  const [version, setVersion] = useState(0);
  const [docVersion, setDocVersion] = useState(0);
  const [docNotice, setDocNotice] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | 'screenshot' | 'upload'>('all');
  type DocTab = 'upload' | 'vault' | 'intel';
  const [tab, setTab] = useState<DocTab>('upload');

  const { partner } = usePartnerSession();
  const evidence = useMemo(() => (partner ? listEvidenceByPartner(partner.id) : []), [partner, version]);
  const processed = useMemo(() => (partner ? listProcessedDocumentsByPartner(partner.id) : []), [partner, docVersion]);

  const filteredEvidence = useMemo(() => {
    const q = query.trim().toLowerCase();
    return evidence.filter((e) => {
      if (kind !== 'all' && e.type !== kind) return false;
      if (!q) return true;
      const hay = `${e.filename || ''} ${e.caption || ''} ${e.creditorName || ''} ${e.sectionKey || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [evidence, kind, query]);

  const evidenceCounts = useMemo(() => {
    const screenshots = evidence.filter((e) => e.type === 'screenshot').length;
    const uploads = evidence.filter((e) => e.type === 'upload').length;
    return { total: evidence.length, screenshots, uploads };
  }, [evidence]);

  const lettersCount = useMemo(
    () => (partner ? listLettersByPartner(partner.id).length : 0),
    [partner, version],
  );
  const idGateOk = useMemo(() => checkIdentityDocumentGate(evidence).ok, [evidence]);

  const docKpis = useMemo(
    () => [
      { label: 'Files', value: String(evidenceCounts.total), hint: 'Total vault', accent: 'amber' as const },
      { label: 'Screenshots', value: String(evidenceCounts.screenshots), hint: 'From reports', accent: 'violet' as const },
      { label: 'Uploads', value: String(evidenceCounts.uploads), hint: 'PDFs & docs', accent: 'sky' as const },
      { label: 'Processed', value: String(processed.length), hint: 'Doc intel', accent: 'emerald' as const },
    ],
    [evidenceCounts, processed.length],
  );

  return (
    <PageShell
      badge="Partner Portal"
      title="Documents Vault"
      subtitle="Upload bureau mail responses, IDs, proof of address, creditor letters, and supporting evidence. Everything here can be used for disputes."
    >
      {!partner ? (
        <div className={FINELY_OS_PAGE}>
          <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>
            No partner profile found for this account. If you’re an admin, use Partner Management to pick a partner.
          </div>
          <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_PRIMARY_BTN}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.documents]}>
          <div className={FINELY_OS_PAGE}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => navigate('/portal/dashboard')}
                className={FINELY_OS_BACK_LINK}
                title="Back to Partner Dashboard"
              >
                <ArrowLeft size={16} /> Partner Dashboard
              </button>
              <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_BACK_LINK} title="Back to Finely Cred Dashboard">
                <ArrowLeft size={16} /> Finely Cred
              </button>
            </div>

            {(() => {
              const idGate = checkIdentityDocumentGate(evidence);
              return !idGate.ok ? (
                <div className={`${FINELY_OS_NOTICE_WARN} text-sm`}>{idGate.message}</div>
              ) : null;
            })()}

            <FinelyNoticedStrip
              items={buildDocumentsNoticedItems({
                evidenceCount: evidence.length,
                idGateOk,
                lettersCount,
              })}
            />

            <FinelyNowDoThisStrip currentIndex={tab === 'vault' ? 1 : evidence.length > 0 ? 2 : 0} />

            <FinelyUnifiedHubLayout
              eyebrow="Documents vault"
              title="Evidence & proof — tab-first"
              subtitle="Upload IDs, bureau mail, screenshots, and supporting docs for disputes."
              accent="sky"
              kpis={docKpis}
              tabs={[
                { id: 'upload', label: 'Upload' },
                { id: 'vault', label: 'Your files', badge: evidence.length || undefined },
                { id: 'intel', label: 'Doc intel', badge: processed.length || undefined },
              ]}
              activeTab={tab}
              onTabChange={(id) => setTab(id as DocTab)}
              primaryAction={{ label: 'Dispute center', onClick: () => navigate('/portal/disputes') }}
              secondaryAction={{ label: 'Letter Studio', onClick: () => navigate('/portal/letters') }}
            >
              {tab === 'upload' && (
                <div className="space-y-6">
                  <DocumentIdScanPanel
                    partnerId={partner.id}
                    onUploaded={() => {
                      setVersion((v) => v + 1);
                      setDocVersion((v) => v + 1);
                    }}
                  />
                  <ProofDocumentsHub
                    partner={partner}
                    email={email}
                    onUploaded={() => {
                      setVersion((v) => v + 1);
                      setDocVersion((v) => v + 1);
                    }}
                  />
                  <FinelyUnifiedSection title="How to use this vault" subtitle="Everything here can attach to dispute letters.">
                    <p className={FINELY_OS_ENTITY_BODY}>
                      Upload bureau responses, IDs, proof of address, creditor letters, and screenshots. Tradeline captures from Credit Intel
                      land here automatically.
                    </p>
                    <div className={`mt-4 ${FINELY_OS_NOTICE_WARN}`}>
                      Tip: When bureau mail arrives, upload it the same day and mark your follow-up task in progress.
                    </div>
                  </FinelyUnifiedSection>
                </div>
              )}

              {tab === 'vault' && (
                <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
              <p className={FINELY_OS_ENTITY_LABEL}>Your files</p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className={FINELY_OS_VIEW_TABS}>
                    {(['all', 'screenshot', 'upload'] as const).map((k) => (
                      <button key={k} type="button" onClick={() => setKind(k)} className={finelyOsViewTab(kind === k, 'emerald')}>
                        {k}
                      </button>
                    ))}
                  </div>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>
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
              <div>
                <EvidenceList
                  items={filteredEvidence}
                  onDelete={(id) => {
                    deleteEvidence(id);
                    addAuditEvent({
                      partnerId: partner.id,
                      actorType: 'partner',
                      actorEmail: email || undefined,
                      action: 'evidence.deleted',
                      entityType: 'evidence',
                      entityId: id,
                    });
                    setVersion((v) => v + 1);
                  }}
                  onUpsert={(item) => {
                    upsertEvidence(item);
                    addAuditEvent({
                      partnerId: partner.id,
                      actorType: 'partner',
                      actorEmail: email || undefined,
                      action: 'evidence.categorized',
                      entityType: 'evidence',
                      entityId: item.id,
                      meta: { sectionKey: item.sectionKey ?? null },
                    });
                    setVersion((v) => v + 1);
                  }}
                />
              </div>
                </div>
              )}

              {tab === 'intel' && isFeatureEnabled('docIntel') ? (
                <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className={FINELY_OS_ENTITY_LABEL}>Document Intelligence</p>
                    <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                      Uploaded PDFs/images can be classified and key fields extracted (EIN, legal name, address). Extracted fields can auto-fill your profile.
                    </p>
                  </div>
                  <button type="button" onClick={() => navigate('/business/profile')} className={FINELY_OS_SECONDARY_BTN}>
                    Open Business Profile <ArrowRight size={14} />
                  </button>
                </div>

                {docNotice ? <div className={FINELY_OS_NOTICE}>{docNotice}</div> : null}

                {processed.length === 0 ? (
                  <div className={FINELY_OS_ENTITY_BODY}>No processed documents yet.</div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {processed.slice(0, 6).map((d) => (
                      <div key={d.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{d.filename}</div>
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>
                          {d.docType} • {new Date(d.createdAt).toLocaleString()}
                        </div>
                        {d.summary ? <div className={FINELY_OS_ENTITY_BODY}>{d.summary}</div> : null}
                        {Object.keys(d.entities || {}).length ? (
                          <div className="mt-2 space-y-1">
                            {Object.entries(d.entities).slice(0, 6).map(([k, v]) => (
                              <div key={k} className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
                                <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{k}</span>: <span className={`${FINELY_OS_ENTITY_VALUE} font-mono`}>{v}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>No entities extracted.</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                </div>
              ) : tab === 'intel' ? (
                <div className={FINELY_OS_ENTITY_BODY}>Document Intelligence is not enabled for this workspace.</div>
              ) : null}
            </FinelyUnifiedHubLayout>

            <FinelyOsPageFooter />
          </div>
        </EntitlementGate>
      )}
    </PageShell>
  );
}
