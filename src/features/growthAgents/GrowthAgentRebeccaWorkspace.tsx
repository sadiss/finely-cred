import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GrowthAgentWorkspaceShell } from './GrowthAgentWorkspaceShell';
import { getGrowthAgent } from './growthAgentRegistry';
import { getRebeccaMaturity, markRebeccaApplyLinkCopied } from './growthAgentMaturity';
import { GrowthAgentRebeccaCommandGuide } from './GrowthAgentRebeccaCommandGuide';
import {
  buildRebeccaApplyMetrics,
  isSpecialistTaggedLead,
  rebeccaMailHandoffHref,
  REBECCA_SPECIALIST_SEQUENCE_ID,
} from './rebeccaApplyMetrics';
import {
  buildLaneAcquisitionUrl,
  LEAD_ACQUISITION_LANES,
  laneSyndicationMessage,
} from '../../lib/leadAcquisitionCatalog';
import { listLeadCaptures } from '../../data/leadsRepo';
import { leadOfferLabel } from '../../lib/leadOfferLabels';
import { getMarketingMailStatus } from '../marketingDesk/marketingDeskMailStatus';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowKpi,
  finelyOsMicroStat,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';

const SPECIALIST_LANE = LEAD_ACQUISITION_LANES.find((l) => l.id === 'credit_specialist')!;

export function GrowthAgentRebeccaWorkspace() {
  const navigate = useNavigate();
  const agent = getGrowthAgent('specialist-recruit')!;
  const [tick, setTick] = useState(0);
  const [referralCode, setReferralCode] = useState('finely');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const maturity = useMemo(() => {
    void tick;
    return getRebeccaMaturity();
  }, [tick]);

  const metrics = useMemo(() => {
    void tick;
    return buildRebeccaApplyMetrics();
  }, [tick]);

  const mailStatus = useMemo(() => {
    void tick;
    return getMarketingMailStatus();
  }, [tick]);

  const applyUrl = useMemo(
    () =>
      buildLaneAcquisitionUrl(SPECIALIST_LANE, {
        referralCode: referralCode.trim() || undefined,
        utmSource: 'growth_agent_rebecca',
      }),
    [referralCode],
  );

  const recentApplies = useMemo(() => {
    void tick;
    return listLeadCaptures()
      .filter(isSpecialistTaggedLead)
      .slice(0, 20);
  }, [tick]);

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      if (key === 'apply') {
        markRebeccaApplyLinkCopied();
        setTick((t) => t + 1);
      }
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const mailChip = mailStatus.status === 'ready' ? 'ok' : mailStatus.status === 'paused' ? 'warn' : 'blocked';

  return (
    <GrowthAgentWorkspaceShell
      accent={agent.accent}
      name={agent.name}
      roleTitle={agent.roleTitle}
      mission={agent.mission}
      maturityPercent={maturity.percent}
      maturityLabel={maturity.label}
      headerAside={<GrowthAgentRebeccaCommandGuide tick={tick} />}
      alertMessage={
        metrics.applies7d > 0
          ? `${metrics.applies7d} specialist apply(s) in 7d — confirm nurture handoff in Desk · Mail.`
          : 'Wave 4 — copy the apply funnel link and syndicate where credit pros look for work.'
      }
      alertTone={metrics.activeNurture > 0 ? 'success' : 'info'}
      primaryAction={{
        label: copied === 'apply' ? 'Copied' : 'Copy apply link',
        onClick: () => void copyText('apply', applyUrl),
      }}
      secondaryAction={{
        label: 'Desk · Mail handoff',
        onClick: () => navigate(rebeccaMailHandoffHref()),
      }}
      nextStep={metrics.todaySentence}
      setupBlock={
        <ul className="space-y-1 text-sm">
          {maturity.items.map((i) => (
            <li key={i.id} className={i.done ? 'text-emerald-300/90' : 'text-amber-200/90'}>
              {i.done ? '✓' : '○'} {i.label}
            </li>
          ))}
        </ul>
      }
      lastRunBlock={
        <p className={FINELY_OS_ENTITY_BODY}>
          All-time specialist captures: {metrics.totalAllTime} · Active nurture: {metrics.activeNurture} · Mail: {mailStatus.label}
        </p>
      }
      statusBlock={
        <ul className="space-y-1 text-sm">
          <li>Applies (7d): {metrics.applies7d}</li>
          <li>Guide downloads (7d): {metrics.guides7d}</li>
          <li>Email opt-in (7d): {metrics.emailOptIn7d}</li>
        </ul>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className={finelyOsGlowKpi('violet')}>
          <div className="text-[10px] uppercase text-white/50">Applies 7d</div>
          <div className="text-lg font-bold text-white">{metrics.applies7d}</div>
        </div>
        <div className={finelyOsGlowKpi('sky')}>
          <div className="text-[10px] uppercase text-white/50">Guides 7d</div>
          <div className="text-lg font-bold text-white">{metrics.guides7d}</div>
        </div>
        <div className={finelyOsGlowKpi('emerald')}>
          <div className="text-[10px] uppercase text-white/50">Email opt-in</div>
          <div className="text-lg font-bold text-white">{metrics.emailOptIn7d}</div>
        </div>
        <div className={finelyOsGlowKpi('amber')}>
          <div className="text-[10px] uppercase text-white/50">Nurture active</div>
          <div className="text-lg font-bold text-white">{metrics.activeNurture}</div>
        </div>
      </div>

      <div className={finelyOsCatalogCardCompact('violet')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Specialist apply funnel</div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{SPECIALIST_LANE.description}</p>
        <label className={`mt-3 block text-xs ${FINELY_OS_ENTITY_BODY}`}>Referral code</label>
        <input
          className={`${FINELY_OS_ENTITY_INPUT} mt-1 max-w-md`}
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
        />
        <div className={`mt-3 text-xs font-mono break-all ${FINELY_OS_ENTITY_BODY}`}>{applyUrl}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={copied === 'apply' ? FINELY_OS_SUCCESS_BTN : FINELY_OS_PRIMARY_BTN}
            onClick={() => void copyText('apply', applyUrl)}
          >
            {copied === 'apply' ? 'Link copied' : 'Copy apply link'}
          </button>
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => void copyText('blurb', laneSyndicationMessage(SPECIALIST_LANE, applyUrl))}
          >
            {copied === 'blurb' ? 'Blurb copied' : 'Copy blurb'}
          </button>
          <span className={finelyOsMicroStat('violet')}>{SPECIALIST_LANE.utmCampaign}</span>
        </div>
      </div>

      <div className={finelyOsCatalogCardCompact('sky')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Nurture handoff · Marketing Desk Mail</div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Sequence <span className="font-mono text-sky-200/90">{REBECCA_SPECIALIST_SEQUENCE_ID}</span> — enrolls on apply capture when Comms Delivery is Ready.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={finelyOsStatusChip(mailChip)}>{mailStatus.label}</span>
          <span className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            {metrics.completedNurture} completed · {metrics.activeNurture} active
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate(rebeccaMailHandoffHref())}>
            Open Desk · Mail
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/settings?tab=features')}>
            Comms setup
          </button>
        </div>
      </div>

      <div className={finelyOsCatalogCardCompact('violet')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Recent specialist captures</div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Lead captures with specialist tags — guide downloads and full apply submissions.
        </p>
        {recentApplies.length === 0 ? (
          <p className={`mt-3 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            No specialist-tagged captures yet — syndicate the apply link or open Careers pages.
          </p>
        ) : (
          <FinelyOsPaginatedStack
            items={recentApplies}
            pageSize={5}
            renderItem={(lead) => (
              <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white truncate max-w-[160px]">{lead.fullName || 'Capture'}</span>
                  <span className={finelyOsMicroStat('violet')}>{leadOfferLabel(lead.offer)}</span>
                  {lead.consentEmailMarketing ? finelyOsStatusChip('ok') : finelyOsStatusChip('warn')}
                </div>
                <p className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
                  {new Date(lead.createdAt).toLocaleDateString()} · {lead.email || 'no email'}
                </p>
              </div>
            )}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/growth-agents/capture-links')}>
          Hannah · link factory
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/leads-os')}>
          Leads OS
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/credit-specialist-apply')}>
          Public apply page
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/marketing?tab=desk&helper=board')}>
          Desk · Board
        </button>
      </div>
    </GrowthAgentWorkspaceShell>
  );
}
