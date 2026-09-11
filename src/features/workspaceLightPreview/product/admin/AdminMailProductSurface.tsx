import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Layers,
  Mail,
  Search,
  Send,
  X,
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchAllPartnersAsAdmin } from '../../../../data/partnersRepo';
import { listLettersByPartner, upsertLetter } from '../../../../data/lettersRepo';
import { listEvidenceByPartner } from '../../../../data/evidenceRepo';
import { checkDisputeLetterEvidenceGate } from '../../../../lib/evidenceGates';
import { isLetterDraft } from '../../../../lib/letterDraftLifecycle';
import { isLetterPhysicallyMailed } from '../../../../lib/letterMailState';
import { isFeatureEnabled } from '../../../../data/settingsRepo';
import { BatchMailWizard, type BatchMailItemResult } from '../../../../components/letters/BatchMailWizard';
import { MailProviderStatusBanner } from '../../../../components/mailing/MailProviderStatusBanner';
import { LetterStreamStatusCard } from '../../../../components/letters/LetterStreamStatusCard';
import { FinelyNowDoThisStrip } from '../../../../components/tours/FinelyNowDoThisStrip';
import { FinelyOsAlertBanner } from '../../../os/FinelyOsAlertBanner';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsGlowTextarea,
} from '../../../os/finelyOsLightUi';
import { FINELY_MAIL_COPY } from '../../../../lib/mailWhiteLabel';
import { notifyLetterMailed } from '../../../../lib/letterMailedNotify';
import { backfillPartnerLettersMailTo } from '../../../../lib/letterMailToBackfill';
import { useAuth } from '../../../../auth/AuthProvider';
import type { Partner } from '../../../../domain/partners';
import type { LetterRecord } from '../../../../domain/letters';
import type { EvidenceItem } from '../../../../domain/evidence';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { ProductDashboardSkeleton } from '../components/ProductUi';
import type { ProductMetric } from '../components/ProductUi';

type QueueStage = 'all' | 'drafting' | 'blocked' | 'ready' | 'mailed';
type QueueRow = { letter: LetterRecord; partner: Partner; evidence: EvidenceItem[] };

function formatShortDate(iso?: string): string {
  if (!iso) return 'Recently';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function letterEvidenceBlocked(letter: LetterRecord, evidence: EvidenceItem[]): boolean {
  if (isLetterPhysicallyMailed(letter)) return false;
  return !checkDisputeLetterEvidenceGate({ letter, evidence }).ok;
}

const SAMPLE_DEMO_PARTNERS: Partner[] = [
  {
    id: 'demo_p_marcus_vance',
    tenantId: 'finely_cred',
    status: 'active',
    profile: {
      fullName: 'Marcus Vance (Sample)',
      email: 'marcus.vance.demo@finelycred.com',
      phone: '(555) 234-8901',
    },
    primaryRoute: 'personal_restore',
    lane: 'funding_readiness',
    journeyStage: 'analysis',
    fundingStage: 'ready',
    consents: { eSignConsentAt: new Date().toISOString() },
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    routes: {
      personal_restore: {
        goal: 'Delete late payments and reach 720+ FICO',
        fundingTarget: 150000,
        score: 642,
        personal: {
          address1: '1044 Beacon Street',
          city: 'Boston',
          state: 'MA',
          postalCode: '02115',
        },
      },
    },
  },
  {
    id: 'demo_p_elena_rostova',
    tenantId: 'finely_cred',
    status: 'active',
    profile: {
      fullName: 'Elena Rostova (Sample)',
      email: 'elena.rostova.demo@finelycred.com',
    },
    primaryRoute: 'business_build',
    lane: 'business_credit',
    journeyStage: 'evidence',
    fundingStage: 'in_review',
    consents: { eSignConsentAt: new Date().toISOString() },
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    routes: { business_build: { goal: 'Establish Paydex 80+', fundingTarget: 100000 } },
  },
];

const SAMPLE_DEMO_MAIL_QUEUE: QueueRow[] = [
  {
    partner: SAMPLE_DEMO_PARTNERS[0]!,
    evidence: [],
    letter: {
      id: 'demo_letter_draft',
      partnerId: SAMPLE_DEMO_PARTNERS[0]!.id,
      type: 'dispute',
      title: 'Equifax factual findings — Round 2',
      body: 'Draft factual findings for review.',
      status: 'draft',
      createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
      meta: { bureau: 'EQF', round: 'Round 2', tone: 'formal', candidateIds: [], evidenceByCandidateId: {}, reasonsByCandidateId: {} },
    },
  },
  {
    partner: SAMPLE_DEMO_PARTNERS[0]!,
    evidence: [],
    letter: {
      id: 'demo_letter_blocked',
      partnerId: SAMPLE_DEMO_PARTNERS[0]!.id,
      type: 'dispute',
      title: 'TransUnion collection finding — Round 1',
      body: 'Generated factual finding awaiting a source exhibit.',
      status: 'generated',
      pdfBlobRef: 'demo-pdf-blocked',
      createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      meta: { bureau: 'TUC', round: 'Round 1', tone: 'formal', candidateIds: ['demo_candidate_blocked'], evidenceByCandidateId: {}, reasonsByCandidateId: {} },
    },
  },
  {
    partner: SAMPLE_DEMO_PARTNERS[1]!,
    evidence: [],
    letter: {
      id: 'demo_letter_ready',
      partnerId: SAMPLE_DEMO_PARTNERS[1]!.id,
      type: 'validation',
      title: 'Business vendor validation package',
      body: 'Final validation package ready for certified dispatch.',
      status: 'generated',
      pdfBlobRef: 'demo-pdf-ready',
      createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      meta: { context: 'debt', creditorName: 'Northstar Vendor Services' },
    },
  },
];

const MAIL_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;
type MailAccent = (typeof MAIL_ACCENTS)[number];

function mailAccentAt(index: number): MailAccent {
  return MAIL_ACCENTS[index % MAIL_ACCENTS.length]!;
}

const MAIL_CARD_SHAPE: Record<MailAccent, string> = {
  emerald: '!rounded-2xl',
  violet: '!rounded-3xl',
  sky: '!rounded-[2rem]',
  rose: '!rounded-xl',
};

const QUEUE_STAGES: Array<{ id: QueueStage; label: string; accent: MailAccent; icon: typeof Layers }> = [
  { id: 'all', label: 'All packages', accent: 'emerald', icon: Layers },
  { id: 'drafting', label: 'Drafts', accent: 'violet', icon: FileCheck2 },
  { id: 'blocked', label: 'Evidence blocked', accent: 'sky', icon: AlertTriangle },
  { id: 'ready', label: 'Ready to mail', accent: 'rose', icon: Mail },
  { id: 'mailed', label: 'Mailed', accent: 'emerald', icon: CheckCircle2 },
];

export default function AdminMailProductSurface({ role, pageId, dataMode }: WorkspaceProductSurfaceProps) {
  const isDemo = dataMode === 'demo';
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [params] = useSearchParams();
  const presetPartnerId = (params.get('partnerId') || '').trim();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'violet';
  const PageIcon = navItem?.icon ?? Mail;
  const mailingOn = isFeatureEnabled('letterMailing');
  const inWorkspacePreview = location.pathname.startsWith('/preview/workspace-light');
  const mailPath = inWorkspacePreview ? '/preview/workspace-light/admin/mail' : '/admin/mail';
  const partnersPath = inWorkspacePreview ? '/preview/workspace-light/admin/partners' : '/admin/partners';

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [partnerId, setPartnerId] = useState(presetPartnerId);
  const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null);
  const [queueStage, setQueueStage] = useState<QueueStage>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [wizardOpen, setWizardOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [mailedDone, setMailedDone] = useState(false);
  const [activeModal, setActiveModal] = useState<'inspect_package' | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    if (isDemo) {
      setPartners(SAMPLE_DEMO_PARTNERS);
      setSelectedLetterId(SAMPLE_DEMO_MAIL_QUEUE[0]?.letter.id ?? null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }
    fetchAllPartnersAsAdmin()
      .then((data) => {
        if (!cancelled) {
          setPartners(data);
          if (presetPartnerId && data.some((p) => p.id === presetPartnerId)) {
            setPartnerId(presetPartnerId);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isDemo, presetPartnerId]);

  const queue = useMemo(() => {
    if (isDemo) return SAMPLE_DEMO_MAIL_QUEUE;
    const list: QueueRow[] = [];
    for (const p of partners) {
      const evidence = listEvidenceByPartner(p.id);
      const letters = listLettersByPartner(p.id).filter((l) => !l.archivedAt);
      for (const letter of letters) {
        list.push({ letter, partner: p, evidence });
      }
    }
    return list;
  }, [isDemo, partners]);

  const drafting = queue.filter((r) => isLetterDraft(r.letter));
  const blockedEvidence = queue.filter((r) => !isLetterDraft(r.letter) && letterEvidenceBlocked(r.letter, r.evidence));
  const readyToMail = queue.filter(
    (r) => !isLetterDraft(r.letter) && !letterEvidenceBlocked(r.letter, r.evidence) && !isLetterPhysicallyMailed(r.letter),
  );
  const mailed = queue.filter((r) => isLetterPhysicallyMailed(r.letter));

  const stageBuckets = useMemo(
    () => ({ all: queue, drafting, blocked: blockedEvidence, ready: readyToMail, mailed }),
    [queue, drafting, blockedEvidence, readyToMail, mailed],
  );

  const filteredQueue = stageBuckets[queueStage];
  const selectedQueueItem = queue.find((r) => r.letter.id === selectedLetterId) ?? queue[0];

  const filteredPartners = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return partners;
    return partners.filter((p) => `${p.profile.fullName} ${p.profile.email ?? ''} ${p.id}`.toLowerCase().includes(query));
  }, [partners, q]);

  const partner = partners.find((p) => p.id === partnerId) || null;
  const letters: LetterRecord[] = useMemo(
    () => (partner ? listLettersByPartner(partner.id).filter((l) => !l.archivedAt) : []),
    [partner],
  );
  const pdfReady = useMemo(
    () => letters.filter((l) => Boolean(l.pdfBlobRef) && !isLetterPhysicallyMailed(l)),
    [letters],
  );

  useEffect(() => {
    if (!partner) {
      setSelectedIds(new Set());
      setMailedDone(false);
      return;
    }
    backfillPartnerLettersMailTo(partner.id);
    setSelectedIds(new Set(pdfReady.map((l) => l.id)));
    setMailedDone(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner?.id]);

  const fromDefaults = useMemo(() => {
    if (!partner) return undefined;
    const route: { personal?: { address1?: string; address2?: string; city?: string; state?: string; postalCode?: string } } | null =
      partner.primaryRoute ? (partner.routes as Record<string, typeof route>)?.[partner.primaryRoute] ?? null : null;
    const p = route?.personal ?? null;
    if (!p) return undefined;
    return {
      addressLine1: p.address1 ?? '',
      addressLine2: p.address2 ?? '',
      city: p.city ?? '',
      state: p.state ?? '',
      zip: p.postalCode ?? '',
    };
  }, [partner]);

  const selectedReady = pdfReady.filter((l) => selectedIds.has(l.id));
  const pathStep = !partner ? 0 : mailedDone ? 3 : wizardOpen ? 2 : 1;
  const editorLetter = selectedQueueItem?.letter ?? letters.find((l) => selectedIds.has(l.id)) ?? null;

  const onBatchComplete = (results: BatchMailItemResult[]) => {
    if (!partner) return;
    let okN = 0;
    let failN = 0;
    for (const r of results) {
      const letter = letters.find((l) => l.id === r.letterId);
      if (!letter) continue;
      const addr = {
        to: r.to || letter.mailing?.to || { name: '', addressLine1: '', city: '', state: '', zip: '' },
        from: r.from || letter.mailing?.from || { name: '', addressLine1: '', city: '', state: '', zip: '' },
      };
      if (r.ok && r.providerId) {
        okN += 1;
        upsertLetter({
          ...letter,
          status: 'mailed',
          mailing: {
            provider: 'finely',
            providerId: r.providerId,
            createdAt: new Date().toISOString(),
            status: 'mailed',
            ...addr,
          },
        });
      } else if (r.ok) {
        failN += 1;
        upsertLetter({
          ...letter,
          status: 'mail_failed',
          mailing: {
            provider: 'finely',
            providerId: letter.mailing?.providerId,
            createdAt: letter.mailing?.createdAt ?? new Date().toISOString(),
            status: 'failed',
            lastError: 'Mail provider did not return a job reference — do not resend until status is confirmed.',
            ...addr,
          },
        });
      } else {
        failN += 1;
        upsertLetter({
          ...letter,
          status: 'mail_failed',
          mailing: {
            provider: 'finely',
            providerId: letter.mailing?.providerId,
            createdAt: letter.mailing?.createdAt ?? new Date().toISOString(),
            status: 'failed',
            lastError: r.error || 'Mailing failed',
            ...addr,
          },
        });
      }
    }
    const ok = results.filter((r) => r.ok);
    if (ok.length && partner) {
      void notifyLetterMailed({
        partnerId: partner.id,
        partner,
        letterIds: ok.map((r) => r.letterId),
        letterTitles: ok.map((r) => letters.find((l) => l.id === r.letterId)?.title || r.letterId),
        providerIds: ok.map((r) => r.providerId || ''),
        to: ok[0]?.to,
        from: ok[0]?.from,
        actorEmail: auth.user?.email || undefined,
        actorRole: 'admin',
      });
    }
    setMailedDone(true);
    setNotice(
      `Mailed ${okN} · failed ${failN}. Partner email notification ${
        okN > 0 ? 'queued when commsDelivery is on' : 'skipped'
      }.`,
    );
  };

  const toggleLetter = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectQueueItem = (row: QueueRow) => {
    setSelectedLetterId(row.letter.id);
    setPartnerId(row.partner.id);
    setNotice(null);
    setMailedDone(false);
  };

  const openPackage = (row: QueueRow) => {
    selectQueueItem(row);
    setActiveModal('inspect_package');
  };

  const metrics: ProductMetric[] = [
    { label: 'Ready', value: readyToMail.length, hint: 'Certified dispatch', accent: 'emerald', icon: Mail },
    { label: 'Blocked', value: blockedEvidence.length, hint: 'Need exhibits', accent: 'rose', icon: AlertTriangle },
    { label: 'Drafts', value: drafting.length, hint: 'In progress', accent: 'violet', icon: FileCheck2 },
    { label: 'Mailed', value: mailed.length, hint: 'Tracked packages', accent: 'sky', icon: CheckCircle2 },
  ];

  if (loading) {
    return <ProductDashboardSkeleton label="Loading mail studio" />;
  }

  const packageBlocked = selectedQueueItem
    ? letterEvidenceBlocked(selectedQueueItem.letter, selectedQueueItem.evidence)
    : false;

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Delivery"
      title="Certified letter dispatch studio"
      description="Compose and send partner mail. Pick a partner, confirm PDF-ready letters, then dispatch."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={PageIcon}
      metrics={metrics}
      metricTitle="Fulfillment pulse"
      metricDescription="Queue counts refresh as letters move through draft, evidence, ready, and mailed."
      primaryAction={
        <ProductPagePrimaryAction
          label={selectedReady.length ? `Mail ${selectedReady.length} letter${selectedReady.length === 1 ? '' : 's'}` : 'Pick letters to mail'}
          onClick={() => setWizardOpen(true)}
          disabled={!mailingOn || !partner || selectedReady.length === 0}
        />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(partnersPath)}>
          Partner directory
        </button>
      }
    >
      <div className={FINELY_OS_PAGE} data-surface-layout="compose-studio">
        <section className="space-y-3">
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Mailing editor</p>
          <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Certified dispatch</h2>
          <p className={`max-w-3xl text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
            Pick a partner, confirm PDF-ready letters, and send through {FINELY_MAIL_COPY.serviceName}.
          </p>
        </section>

        <FinelyNowDoThisStrip
          title="Mail path"
          currentIndex={pathStep}
          items={[
            { label: 'Pick partner', detail: 'Search directory and select who you are mailing for', to: mailPath },
            { label: 'Confirm letters', detail: 'Check PDF-ready letters, then open Confirm address', to: mailPath },
            { label: 'Mail', detail: 'Confirm To/From → send via Finely Mail', to: mailPath },
            { label: 'Email notify', detail: 'Partner gets confirmation when commsDelivery is on', to: mailPath },
          ]}
        />

        {!mailingOn ? (
          <FinelyOsAlertBanner
            tone="warning"
            message="letterMailing feature flag is off. Enable it in Admin Settings before live sends."
          />
        ) : null}

        <MailProviderStatusBanner letterCount={selectedReady.length || pdfReady.length || 1} />
        <LetterStreamStatusCard compact />

        {notice ? <FinelyOsAlertBanner tone="success" message={notice} /> : null}

        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <section className={`${finelyOsCatalogCard('emerald')} ${MAIL_CARD_SHAPE.emerald} p-6 lg:p-8 space-y-4`} data-fc-accent="emerald">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Step 1 · Pick partner</div>
            <div className="flex items-center gap-2">
              <Search size={16} className="opacity-50" />
              <input
                aria-label="Search partners"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search partners…"
                className={`${FINELY_OS_ENTITY_INPUT} !mt-0 flex-1`}
              />
            </div>
            <FinelyOsPaginatedStack
              items={filteredPartners}
              pageSize={6}
              itemSpacingClassName="grid sm:grid-cols-2 gap-5"
              emptyMessage="No partners match."
              renderItem={(p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPartnerId(p.id);
                    setNotice(null);
                    setMailedDone(false);
                  }}
                  className={`w-full text-left py-3 border-b border-white/15 last:border-0 ${
                    partnerId === p.id ? 'text-sky-200' : 'hover:text-white'
                  }`}
                >
                  <div className={`${FINELY_OS_ENTITY_VALUE} text-sm truncate`}>{p.profile.fullName || 'Partner'}</div>
                  <div className={`${FINELY_OS_ENTITY_BODY} text-xs truncate`}>{p.profile.email || p.id}</div>
                </button>
              )}
            />
          </section>

          <section className={`${finelyOsCatalogCard('sky')} ${MAIL_CARD_SHAPE.sky} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
            {partner ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Step 2 · Letters for {partner.profile.fullName}</div>
                    <p className={`${FINELY_OS_ENTITY_BODY} text-base font-bold`}>
                      {selectedReady.length} selected · {pdfReady.length} PDF-ready · {letters.length} in vault
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={FINELY_OS_SECONDARY_BTN}
                      onClick={() => navigate(`${partnersPath}/${partner.id}?tab=letters`)}
                    >
                      Open partner letters
                    </button>
                    <button
                      type="button"
                      className={`${FINELY_OS_SUCCESS_BTN} disabled:opacity-60`}
                      disabled={!mailingOn || selectedReady.length === 0}
                      onClick={() => setWizardOpen(true)}
                    >
                      <Send size={16} /> Confirm address &amp; Mail ({selectedReady.length})
                    </button>
                  </div>
                </div>

                {pdfReady.length === 0 ? (
                  <FinelyOsAlertBanner
                    tone="warning"
                    message="No PDF-ready letters on this device. Open the partner file → Letters, generate PDFs, then return here."
                  />
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {pdfReady.slice(0, 40).map((l) => (
                      <li key={l.id}>
                        <label className="flex items-start gap-3 py-2 text-base cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={selectedIds.has(l.id)}
                            onChange={() => toggleLetter(l.id)}
                          />
                          <span className="min-w-0">
                            <span className="font-extrabold">{l.title}</span>
                            <span className="opacity-60"> · {l.status || 'generated'}</span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Step 2 · Letters</div>
                <FinelyOsAlertBanner tone="info" message="Select a partner to load vault letters and mail." />
              </>
            )}
          </section>
        </div>

        <section className="space-y-3">
          <label className="block space-y-2">
            <span className={`text-sm font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
              Letter preview {editorLetter ? `· ${editorLetter.title}` : ''}
            </span>
            <textarea
              readOnly
              value={editorLetter?.body ?? ''}
              placeholder="Select a package from the queue or pick letters above to preview body text here."
              rows={12}
              className={`${finelyOsGlowTextarea('violet')} w-full text-base font-bold min-h-[320px]`}
            />
          </label>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Dispatch queue</p>
            <h3 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Packages</h3>
          </div>

          <nav className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Mail queue stages">
            {QUEUE_STAGES.map((stage) => {
              const Icon = stage.icon;
              const count = stageBuckets[stage.id].length;
              const selected = queueStage === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => {
                    setQueueStage(stage.id);
                    const first = stageBuckets[stage.id][0];
                    if (first) selectQueueItem(first);
                  }}
                  className={`${finelyOsCatalogCard(stage.accent)} ${MAIL_CARD_SHAPE[stage.accent]} p-6 lg:p-8 text-left transition-all ${
                    selected ? 'ring-2 ring-white/40' : ''
                  }`}
                  data-fc-accent={stage.accent}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Icon size={20} />
                    <em className="not-italic text-2xl font-extrabold">{count}</em>
                  </div>
                  <div className={`mt-3 text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{stage.label}</div>
                </button>
              );
            })}
          </nav>

          <FinelyOsPaginatedStack
            items={filteredQueue}
            pageSize={8}
            itemSpacingClassName="grid sm:grid-cols-2 xl:grid-cols-4 gap-4"
            emptyMessage="No letters in this stage."
            renderItem={(row, index) => {
              const family = mailAccentAt(index);
              const selected = selectedQueueItem?.letter.id === row.letter.id;
              return (
                <button
                  key={row.letter.id}
                  type="button"
                  onClick={() => openPackage(row)}
                  className={`${finelyOsCatalogCard(family)} ${MAIL_CARD_SHAPE[family]} p-6 lg:p-8 text-left ${
                    selected ? 'ring-2 ring-white/40' : ''
                  }`}
                  data-fc-accent={family}
                >
                  <div className={`text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{row.letter.title}</div>
                  <div className={`mt-2 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{row.partner.profile?.fullName ?? 'Partner'}</div>
                  <div className={`mt-3 text-sm font-bold ${FINELY_OS_ENTITY_SUBLABEL}`}>
                    {(row.letter.status ?? 'unknown').replace(/_/g, ' ')}
                  </div>
                </button>
              );
            }}
          />
        </section>
      </div>

      {partner && wizardOpen ? (
        <BatchMailWizard
          open={wizardOpen}
          partnerId={partner.id}
          letters={letters}
          defaultFromName={partner.profile.fullName || 'Partner'}
          defaultFromAddress={fromDefaults}
          defaultSelectedIds={[...selectedIds]}
          onClose={() => setWizardOpen(false)}
          onComplete={onBatchComplete}
        />
      ) : null}

      {activeModal === 'inspect_package' && selectedQueueItem ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Inspect package"
          onClick={() => setActiveModal(null)}
        >
          <div className={`${finelyOsCatalogCard('violet')} max-w-lg w-full p-6 lg:p-8 space-y-4`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-2xl font-extrabold">{selectedQueueItem.letter.title}</h3>
              <button type="button" aria-label="Close" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              {selectedQueueItem.partner.profile?.fullName ?? 'Partner'} · Created {formatShortDate(selectedQueueItem.letter.createdAt)} · Status:{' '}
              {selectedQueueItem.letter.status}
            </p>
            <div className="grid grid-cols-2 gap-3 text-base">
              <div>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Type</div>
                <div className={`font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{selectedQueueItem.letter.type}</div>
              </div>
              <div>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>PDF</div>
                <div className={`font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                  {selectedQueueItem.letter.pdfBlobRef ? 'Generated' : 'Pending'}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {packageBlocked ? (
                <>
                  <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-extrabold">Evidence gate blocked</div>
                    <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Link source exhibits before certified dispatch.</p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-extrabold">Evidence gate clear</div>
                    <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Exhibits verified for this package.</p>
                  </div>
                </>
              )}
            </div>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{selectedQueueItem.letter.body}</p>
            <button type="button" className={`${FINELY_OS_PRIMARY_BTN} w-full`} onClick={() => setActiveModal(null)}>
              Close
            </button>
          </div>
        </div>
      ) : null}

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
