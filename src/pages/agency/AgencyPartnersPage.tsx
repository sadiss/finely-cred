import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Book, Building2, Download, LayoutDashboard, Rocket, ShieldCheck, UserCheck, Users, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { CareerOtherTracksLink } from '../../components/careers/CareerOtherTracksLink';
import { CareerPriceCardGrid, type CareerPriceCardOption } from '../../components/careers/CareerPriceCard';
import type { CareerAccent } from '../../components/careers/careerUi';
import { CareerPackagePanel } from '../../components/careers/CareerPackagePanel';
import { CareerQualificationsPanel, type CareerQualificationItem } from '../../components/careers/CareerQualificationsPanel';
import { CareerGuideTwoSheetMedia } from '../../components/careers/CareerGuideTwoSheetMedia';
import { CareerChoiceApply } from '../../components/careers/CareerChoiceApply';
import { CareerTierStickySummary } from '../../components/careers/CareerTierStickySummary';
import { DigitalInviteShareBand } from '../../components/digitalCards';
import {
  AGENCY,
  AGENCY_TRAINING_PHASE_LABEL,
  AGENCY_WHITE_LABEL_LABEL,
  agencyCapacityTierIdForBuyIn,
  getAgencyPlanBullets,
  getPublicAgencyBuyInTiers,
  getPublicAgencyTiers,
  recommendedAgencyBuyInIdForTier,
} from '../../config/agencyPartnersProgram';
import { formatAgencyTierKeepHeadline } from '../../config/pricingCatalog';
import { ROLE_COMPLIANCE_FOOTNOTES, ROLE_WORK_SPLIT } from '../../config/rolePartnerPrograms';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import {
  captureDigitalInviteCardFromUrl,
  getDigitalInviteCardEligibilityForRole,
} from '../../lib/digitalInviteCardAttribution';
import { getDigitalInviteCardDef } from '../../config/digitalInviteCards';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_PAGE,
} from '../../features/os/finelyOsLightUi';

const ROLE = 'agency' as const;

export default function AgencyPartnersPage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'Agency partners — your brand, Finely’s operating system',
    description:
      'Launch a branded credit services agency on Finely OS: white-label tenant, team seats, lead routing, compliance workflows, one-time buy-in, and capacity payout tiers.',
    path: AGENCY.publicPath,
  });

  const [cardEligibility, setCardEligibility] = useState(() => getDigitalInviteCardEligibilityForRole('agency'));

  useEffect(() => {
    captureDigitalInviteCardFromUrl(window.location.search, window.location.pathname);
    setCardEligibility(getDigitalInviteCardEligibilityForRole('agency'));
  }, []);

  const cardBonus = getDigitalInviteCardDef('agency')?.bonus;
  const workSplit = ROLE_WORK_SPLIT[ROLE];

  const buyInTiers = useMemo(() => getPublicAgencyBuyInTiers(), []);
  const capacityTiers = useMemo(() => getPublicAgencyTiers(), []);
  const buyInAccents: CareerAccent[] = ['slate', 'emerald', 'sky', 'gold', 'rose', 'navy'];

  const defaultCapacityId = capacityTiers.find((t) => t.badge === 'Popular')?.id ?? capacityTiers[0]?.id ?? '';
  const [selectedCapacityId, setSelectedCapacityId] = useState(defaultCapacityId);
  const [selectedBuyInId, setSelectedBuyInId] = useState<string>(
    () => recommendedAgencyBuyInIdForTier(defaultCapacityId) ?? buyInTiers[0]?.id ?? '',
  );

  const selectedBuyIn = buyInTiers.find((b) => b.id === selectedBuyInId) ?? buyInTiers[0] ?? null;
  const selectedCapacity = capacityTiers.find((t) => t.id === selectedCapacityId) ?? capacityTiers[0] ?? null;
  // 1:1 mapping — each buy-in activates exactly one capacity tier, and vice versa.
  const recommendedBuyInId = selectedCapacity ? recommendedAgencyBuyInIdForTier(selectedCapacity.id) : null;

  const selectBuyIn = (id: string) => {
    setSelectedBuyInId(id);
    const matchedCapacityId = agencyCapacityTierIdForBuyIn(id);
    if (matchedCapacityId) setSelectedCapacityId(matchedCapacityId);
  };

  // One luxury card per buy-in — merges the 1:1 capacity tier's seats/files/white-label/keep%
  // into 4 plain-English bullets, so partners make ONE choice instead of two dense grids.
  const planOptions: CareerPriceCardOption[] = buyInTiers.map((b, i) => {
    const capacity = capacityTiers.find((t) => t.id === b.capacityTierId);
    return {
      id: b.id,
      name: b.name,
      tagline: b.tagline,
      badge: capacity?.badge,
      priceLabel: b.priceLabel,
      priceSubLabel: 'one-time buy-in',
      bullets: getAgencyPlanBullets(capacity),
      accent: buyInAccents[i % buyInAccents.length],
    };
  });

  const qualifications: CareerQualificationItem[] = useMemo(() => {
    if (!selectedCapacity) return [];
    const seatText =
      selectedCapacity.seatLimit === -1
        ? 'Unlimited team seats'
        : `Up to ${selectedCapacity.seatLimit} team seat${selectedCapacity.seatLimit === 1 ? '' : 's'}`;
    const fileText =
      selectedCapacity.activeClientLimit === -1
        ? 'Unlimited active partner files'
        : `Up to ${selectedCapacity.activeClientLimit} active partner files`;
    const wl = selectedCapacity.whiteLabelLevel ? AGENCY_WHITE_LABEL_LABEL[selectedCapacity.whiteLabelLevel] : null;
    const phase = selectedCapacity.recommendedTrainingPhase
      ? AGENCY_TRAINING_PHASE_LABEL[selectedCapacity.recommendedTrainingPhase]
      : null;
    const recommendedBuyIn = recommendedBuyInId ? buyInTiers.find((b) => b.id === recommendedBuyInId) : null;
    const items: CareerQualificationItem[] = [
      { title: 'Team capacity', body: seatText },
      { title: 'File capacity', body: fileText },
    ];
    if (wl) items.push({ title: 'White-label depth', body: wl });
    if (phase) items.push({ title: 'Training phase', body: phase });
    if (recommendedBuyIn) items.push({ title: 'Matching buy-in', body: `${recommendedBuyIn.name} activates this tier` });
    items.push({ title: 'Finely account', body: 'Required to provision and own your tenant.' });
    return items;
  }, [selectedCapacity, recommendedBuyInId, buyInTiers]);

  const goToSignup = () => navigate(`${AGENCY.signupPath}?tier=${selectedCapacityId}`);

  return (
    <PageShell
      badge="Public"
      title={AGENCY.programName}
      subtitle="Company-level partnership — your brand, your team, Finely powers the operating system."
      hideHero
    >
      <div className={`${FINELY_OS_PAGE} max-w-6xl mx-auto pb-20`}>
        {/* Header — Back · Home · single CS cross-link (no 6-track jumble) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => navigate(-1)} className={FINELY_OS_BACK_LINK}>
              <ArrowLeft size={16} /> Back
            </button>
            <a href="/" className={FINELY_OS_BACK_LINK}>
              <ArrowLeft size={16} /> Home
            </a>
          </div>
          <CareerOtherTracksLink currentId="agency_partners" only={['credit_specialists']} />
        </div>

        {cardEligibility && cardBonus ? <FinelyOsAlertBanner tone="success" message={cardBonus.description} /> : null}

        {/* Hero — white/slate, gold brand accent, large guide imagery */}
        <section className="rounded-3xl border-2 border-amber-200 bg-white p-6 sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="space-y-5">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-700">{AGENCY.programName}</p>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.08] text-slate-900">
                Own a branded credit services company.
              </h1>
              <p className="max-w-xl text-[15px] leading-relaxed text-slate-600">
                Agency partner means you run a tenant: your brand, your team seats, your partner routing, and a
                white-label portal. Your operators run the files; Finely runs the platform, the method, and the
                compliance rails underneath.
              </p>

              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Building2, label: workSplit.youDo[0], tone: 'text-amber-700 bg-amber-50 border-amber-200' },
                  { icon: UserCheck, label: workSplit.finelyRuns[0], tone: 'text-sky-700 bg-sky-50 border-sky-200' },
                  { icon: XCircle, label: workSplit.notYourJob[0], tone: 'text-slate-500 bg-slate-50 border-slate-200' },
                ].map(({ icon: Icon, label, tone }) => (
                  <span key={label} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${tone}`}>
                    <Icon size={13} /> {label}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={goToSignup}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-bold text-[#1a1205] shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-400"
              >
                Create agency workspace <ArrowRight size={15} />
              </button>
            </div>

            <CareerGuideTwoSheetMedia
              theme="light"
              book={
                <img
                  src="/images/lead-magnets/agency-guide-book.png"
                  alt="Agency launch guide — book"
                  className="w-full rounded-2xl border border-slate-200/70 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.35)]"
                />
              }
              bundle={
                <img
                  src="/images/lead-magnets/agency-guide-bundle.png"
                  alt="Agency launch guide — bundle"
                  className="w-full rounded-2xl border border-slate-200/70 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.35)]"
                />
              }
              actions={
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/free-agency-guide/read')}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-600/25 transition-all hover:bg-sky-700"
                  >
                    <Book size={16} /> Read free
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/free-agency-guide')}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3.5 text-sm font-bold text-[#1a1205] shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-400"
                  >
                    <Download size={16} /> Download
                  </button>
                </div>
              }
            />
          </div>
        </section>

        {/* Top light panel — one choice, six luxury cards (no dense spreadsheet) */}
        <section className="rounded-3xl border-2 border-slate-200 bg-slate-50 p-6 sm:p-8 space-y-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Build your plan</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Pick your buy-in.</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              One-time buy-in, activates a matching capacity tier — seats, active partner files, white-label depth,
              and your ongoing payout share while training vs when certified, all in one card.
            </p>
          </div>

          <CareerPriceCardGrid options={planOptions} selectedId={selectedBuyInId} onSelect={selectBuyIn} columns={3} />
        </section>

        {/* What you get for the selected tier */}
        <section className="space-y-3">
          <div className="max-w-2xl space-y-1.5">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">What you get</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {selectedCapacity ? `${selectedBuyIn?.name ?? ''} + ${selectedCapacity.name}` : 'Pick a plan above'}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {selectedBuyIn ? (
              <CareerPackagePanel kicker="One-time buy-in" title={`${selectedBuyIn.name} (one-time)`} included={selectedBuyIn.included} accent="emerald" />
            ) : null}
            {selectedCapacity ? (
              <CareerPackagePanel kicker="This tier includes" title={selectedCapacity.name} included={selectedCapacity.features} accent="gold" />
            ) : null}
          </div>
        </section>

        <CareerQualificationsPanel
          heading="What it takes to qualify"
          subheading="Plain-English requirements for the tier you picked above."
          requirements={qualifications}
          accent="navy"
        />

        {/* Upgrade dashboard mock — larger light console */}
        <section className="rounded-3xl border-2 border-slate-200 bg-white p-6 sm:p-10 space-y-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">This is your OS</p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">Upgrade the console, upgrade the tier.</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Seats, lanes, and white-label depth all live in one tenant workspace — the same console you provision on
              signup, sized to whichever tier you pick above.
            </p>
          </div>
          <AgencyLightConsoleMock />
        </section>

        {/* Choice CTA */}
        <CareerChoiceApply
          kicker="Provision your tenant"
          title="Create your agency workspace."
          selectedLabel={selectedCapacity ? `${selectedBuyIn?.name ?? ''} · ${selectedCapacity.name}` : 'No tier selected yet'}
          description="Sign in or create a Finely account, then provision your tenant — agency name, tier, buy-in, and branding."
          ctaLabel="Open agency signup"
          onCtaClick={goToSignup}
          loginNote="Requires a Finely login. If you only want to run your own partner files without a company tenant, use the Credit Specialist track instead."
          secondaryLabel="Solo specialist instead?"
          onSecondaryClick={() => navigate('/credit-specialist')}
          accent="gold"
        />

        <DigitalInviteShareBand role="agency" />

        <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>{ROLE_COMPLIANCE_FOOTNOTES[ROLE]}</p>

        <FinelyOsPageFooter />
      </div>

      <CareerTierStickySummary
        roleLabel="Agency"
        tierName={selectedCapacity?.name}
        economics={{
          keepPctLabel: selectedCapacity ? formatAgencyTierKeepHeadline(selectedCapacity) ?? undefined : undefined,
          buyInLabel: selectedBuyIn ? `${selectedBuyIn.name} ${selectedBuyIn.priceLabel}` : undefined,
        }}
        ctaLabel="Create workspace"
        onCta={goToSignup}
        accent="gold"
        visible={Boolean(selectedCapacity)}
      />
    </PageShell>
  );
}

/** Larger, light-themed tenant console mock — sells "this is your operating system," not a screenshot of the dark OS. */
function AgencyLightConsoleMock() {
  const lanes = ['Restore', 'Build', 'Funding', 'AU'];
  const seats = ['JD', 'MK', 'AR', '+'];
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-slate-200 shadow-[0_40px_90px_-40px_rgba(15,23,42,0.25)]">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <span className="flex-1 truncate rounded-md border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs text-slate-500">
          portal.yourbrand.com/partners
        </span>
        <span className="hidden rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-700 sm:inline">
          White-label
        </span>
      </div>

      <div className="grid gap-0 sm:grid-cols-[13rem_1fr]">
        <aside className="border-b border-slate-200 bg-slate-50 p-5 sm:border-b-0 sm:border-r">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg border-2 border-dashed border-amber-300 text-[9px] font-black uppercase tracking-widest text-amber-700">
              Logo
            </span>
            <span className="text-sm font-bold text-slate-900">Your Agency</span>
          </div>
          <div className="mt-5 space-y-1.5">
            {['Partners', 'Disputes', 'Letters', 'Payouts', 'Team'].map((n, i) => (
              <div
                key={n}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${i === 0 ? 'bg-amber-100 text-amber-800' : 'text-slate-500'}`}
              >
                {n}
              </div>
            ))}
          </div>
        </aside>

        <div className="p-5 sm:p-8 space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Users, label: 'Seats filled', value: `${seats.length - 1} / 6`, tone: 'text-sky-700 bg-sky-50 border-sky-200' },
              { icon: LayoutDashboard, label: 'Active files', value: '38 / 100', tone: 'text-amber-700 bg-amber-50 border-amber-200' },
              { icon: ShieldCheck, label: 'White-label', value: 'Co-branded', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
            ].map(({ icon: Icon, label, value, tone }) => (
              <div key={label} className={`rounded-xl border-2 p-4 ${tone}`}>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                  <Icon size={13} /> {label}
                </div>
                <div className="mt-1.5 text-xl font-black">{value}</div>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Service lanes</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {lanes.map((lane) => (
                <span key={lane} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                  {lane}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Seat roster</p>
            <div className="mt-2 flex -space-x-2">
              {seats.map((s) => (
                <span key={s} className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-slate-800 text-[11px] font-black text-white">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Rocket size={16} className="shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-slate-500">
              Upgrade a tier and this console grows with you — more seats, more file capacity, deeper white-label.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
