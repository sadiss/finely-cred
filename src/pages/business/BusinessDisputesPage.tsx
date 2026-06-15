import React, { useMemo, useState } from 'react';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { BusinessNav } from '../../components/business/BusinessNav';
import { BusinessCommandStrip } from '../../components/business/BusinessCommandStrip';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { createBusinessDispute, deleteBusinessDispute, listBusinessDisputes, upsertBusinessDispute } from '../../data/businessCreditRepo';
import type { BusinessBureau } from '../../domain/businessCredit';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_DANGER_BTN,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type DisputeTab = 'queue' | 'create';

export default function BusinessDisputesPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState<DisputeTab>('queue');
  const disputes = useMemo(() => (partner ? listBusinessDisputes(partner.id) : []), [partner?.id, version]);
  const [newTitle, setNewTitle] = useState('');
  const [newBureau, setNewBureau] = useState<BusinessBureau>('dnb');

  return (
    <PageShell
      badge="Business Portal"
      title="Business Disputes"
      subtitle="Track negative items on business bureau files, attach evidence, generate letters, and mail from the Letters Vault."
    >
      <div className={FINELY_OS_PAGE}>
        <BusinessNav />
        <BusinessCommandStrip partner={partner ?? null} />

        <FinelyUnifiedHubLayout
          eyebrow="Business credit OS"
          title="Business bureau disputes"
          subtitle="Track negative items, attach evidence, generate letters, and mail from Letters Vault."
          accent="amber"
          kpis={[
            { label: 'Disputes', value: String(disputes.length), accent: 'amber' },
            { label: 'Vault', value: 'Letters', accent: 'emerald' },
          ]}
          tabs={[
            { id: 'queue', label: 'Queue' },
            { id: 'create', label: 'Create' },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as DisputeTab)}
          primaryAction={{ label: 'Letters Vault', onClick: () => navigate('/portal/letters/vault') }}
          secondaryAction={{ label: 'Evidence vault', onClick: () => navigate('/portal/evidence') }}
        >
          {tab === 'queue' && !partner && <div className={FINELY_OS_NOTICE}>Sign in as a partner to create and track business disputes.</div>}

          {tab === 'queue' && partner && (
            <div className={`${finelyOsCatalogCard('amber')} !p-6`} data-fc-accent="amber">
              <div className="flex items-center justify-between gap-3">
                <div className={FINELY_OS_ENTITY_TITLE}>Disputes</div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{disputes.length}</div>
              </div>
              <div className="mt-4">
                {disputes.length === 0 ? (
                  <div className={FINELY_OS_ENTITY_BODY}>No disputes yet. Switch to Create to add your first one.</div>
                ) : (
                  <FinelyOsPaginatedStack
                    items={disputes}
                    pageSize={8}
                    itemSpacingClassName="grid gap-3"
                    emptyMessage="No disputes yet."
                    renderItem={(d, idx) => (
                    <div key={d.id} className={`${finelyOsCatalogCard((['emerald', 'sky', 'violet'] as const)[idx % 3])} !p-4`} data-fc-accent={(['emerald', 'sky', 'violet'] as const)[idx % 3]}>
                      <div className="flex items-start justify-between gap-4">
                        <button type="button" onClick={() => navigate(`/business/disputes/${d.id}`)} className="min-w-0 text-left">
                          <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{d.title}</div>
                          <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                            {d.bureau.replaceAll('_', ' ')} • items:{d.negativeItems.length} • {d.status}
                          </div>
                        </button>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            className={FINELY_OS_SECONDARY_BTN}
                            title="Mark in progress"
                            onClick={() => {
                              upsertBusinessDispute({ ...d, status: d.status === 'draft' ? 'in_progress' : d.status });
                              setVersion((v) => v + 1);
                            }}
                          >
                            Start
                          </button>
                          <button
                            type="button"
                            className={FINELY_OS_DANGER_BTN}
                            title="Delete dispute"
                            onClick={() => {
                              const ok = window.confirm('Delete this dispute?');
                              if (!ok) return;
                              deleteBusinessDispute(partner.id, d.id);
                              setVersion((v) => v + 1);
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                    )}
                  />
                )}
              </div>
            </div>
          )}

          {tab === 'create' && (
            <>
        {!partner ? (
          <div className={FINELY_OS_NOTICE}>Sign in as a partner to create business disputes.</div>
        ) : (
          <div className={`${finelyOsCatalogCard('violet')} !p-6 space-y-4 max-w-xl`} data-fc-accent="violet">
              <div className={FINELY_OS_ENTITY_TITLE}>Create a dispute</div>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!partner) return;
                  const d = createBusinessDispute({ partnerId: partner.id, bureau: newBureau, title: newTitle.trim() || undefined });
                  setNewTitle('');
                  setVersion((v) => v + 1);
                  navigate(`/business/disputes/${d.id}`);
                }}
              >
                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Bureau</div>
                  <select value={newBureau} onChange={(e) => setNewBureau(e.target.value as BusinessBureau)} className={`mt-2 w-full ${FINELY_OS_ENTITY_SELECT}`}>
                    <option value="dnb">D&B</option>
                    <option value="experian_business">Experian Business</option>
                    <option value="equifax_business">Equifax Business</option>
                  </select>
                </label>
                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Title</div>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="e.g. Incorrect address + wrong trade line" />
                </label>
                <button type="submit" className={`${FINELY_OS_PRIMARY_BTN} w-full`}>
                  <Plus size={14} /> Create dispute
                </button>
              </form>
          </div>
        )}
            </>
          )}
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
