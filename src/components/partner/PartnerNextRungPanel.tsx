/**
 * Lifecycle-stage-aware upsell/cross-sell card (Wave 5 / L2).
 *
 * Reads the partner's real agreement history (`listAgreementsByPartner` from `billingRepo.ts`,
 * kept fresh via `pullBillingSnapshotFromSupabase` on session init) and their real credit-score
 * history (`listCreditScoreSnapshots` from `creditScoreSnapshotsRepo.ts`), then asks the pure
 * `recommendNextRung()` function (`domain/partnerLadderProgression.ts`) whether a natural next-tier
 * recommendation applies — using the SAME graduated-partner definition as the admin E1a.3 ladder
 * metric. Renders nothing when no honest recommendation applies — no forced upsell, no permanent
 * empty box (`no-duplicate-ui-layers` rule). Uses "partner" terminology throughout.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Compass } from 'lucide-react';
import { listAgreementsByPartner } from '../../data/billingRepo';
import { listCreditScoreSnapshots } from '../../data/creditScoreSnapshotsRepo';
import { recommendNextRung } from '../../domain/partnerLadderProgression';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  type FinelyOsPublicAccent,
} from '../../features/os/finelyOsLightUi';

export function PartnerNextRungPanel({
  partnerId,
  accent = 'sky',
}: {
  partnerId?: string;
  accent?: FinelyOsPublicAccent;
}) {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const agreements = useMemo(
    () => (partnerId ? listAgreementsByPartner(partnerId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [partnerId, version],
  );

  const creditScoreTrend = useMemo(() => {
    if (!partnerId) return undefined;
    const snapshots = listCreditScoreSnapshots(partnerId, 24)
      .filter((s) => typeof s.headlineScore === 'number')
      .slice()
      .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
    const values = snapshots.map((s) => s.headlineScore as number);
    return values.length ? values : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, version]);

  const recommendation = useMemo(
    () => recommendNextRung({ activeAgreements: agreements, creditScoreTrend }),
    [agreements, creditScoreTrend],
  );

  if (!partnerId || !recommendation) return null;

  return (
    <div className={finelyOsCatalogCardCompact(accent)} data-fc-accent={accent} data-fc-partner-next-rung-panel="1">
      <div className="flex items-center gap-2">
        <Compass size={15} className="text-sky-300 shrink-0" />
        <div className="min-w-0">
          <div className={FINELY_OS_ENTITY_VALUE}>Your next rung</div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>
            {recommendation.fromTier} → {recommendation.toTier}
          </div>
        </div>
      </div>

      <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>{recommendation.rationale}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate(`/pricing?tab=${recommendation.toCategory}`)}
          className={FINELY_OS_PRIMARY_BTN}
        >
          Explore {recommendation.toTier} <ArrowRight size={14} />
        </button>
        <button type="button" onClick={() => navigate('/portal/calendar')} className={FINELY_OS_SECONDARY_BTN}>
          <Calendar size={14} /> Book a session
        </button>
      </div>
    </div>
  );
}

export default PartnerNextRungPanel;
