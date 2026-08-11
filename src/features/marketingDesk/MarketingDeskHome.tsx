import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, HelpCircle, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsDeckTile,
  finelyOsMicroStat,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';
import { FinelyOsAlertBanner } from '../os/FinelyOsAlertBanner';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';
import { FinelyTourPlayer } from '../../components/tours/FinelyTourPlayer';
import { getTourById } from '../../config/tourManifest';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { MARKETING_DESK_HELPERS, type MarketingDeskHelperId } from './marketingDeskGlossary';
import { getMarketingDeskKpis, listMarketingMyWork } from './marketingDeskKpis';
import { getMarketingMailStatus } from './marketingDeskMailStatus';
import {
  countMarketingStagingPending,
  getMarketingFindLastRun,
  getMarketingFindReadiness,
} from './marketingDeskHunt';
import { deepLinkForMarketingTask } from './marketingDeskMyWork';
import {
  MARKETING_DESK_HOW_IT_WORKS,
  MARKETING_DESK_TOUR_ID,
  markMarketingDeskTourSeen,
  resetMarketingDeskTour,
  shouldAutoOpenMarketingDeskTour,
} from './marketingDeskTour';
import { getMarketingDeskAssignee, setMarketingDeskAssignee } from './marketingDeskAssignee';
import { ensureMarketingPipelineProject } from './marketingDeskProjects';
import { getMarketingMorningBrief } from './marketingDeskMorningBrief';
import { getMarketingLanePerformanceChips } from './marketingDeskLanePerformance';
import { getRuthWeeklyLaneTip } from './marketingDeskRuthLaneTip';

export function MarketingDeskHome({
  onOpenHelper,
}: {
  onOpenHelper: (id: MarketingDeskHelperId) => void;
}) {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [tourOpen, setTourOpen] = useState(false);
  const [assigneeLabel, setAssigneeLabel] = useState(() => getMarketingDeskAssignee().label);
  const [alternateLabel, setAlternateLabel] = useState(() => getMarketingDeskAssignee().alternateLabel || '');
  const [seatMode, setSeatMode] = useState<'primary' | 'round_robin'>(
    () => getMarketingDeskAssignee().mode || 'primary',
  );

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    ensureMarketingPipelineProject();
    if (shouldAutoOpenMarketingDeskTour()) setTourOpen(true);
  }, []);

  const kpis = useMemo(() => {
    void tick;
    const all = getMarketingDeskKpis();
    const pick = ['found', 'review', 'booked'];
    return pick.map((id) => all.find((k) => k.id === id)).filter(Boolean) as ReturnType<typeof getMarketingDeskKpis>;
  }, [tick]);
  const mail = useMemo(() => {
    void tick;
    return getMarketingMailStatus();
  }, [tick]);
  const myWork = useMemo(() => {
    void tick;
    return listMarketingMyWork(5);
  }, [tick]);
  const stagingPending = useMemo(() => {
    void tick;
    return countMarketingStagingPending();
  }, [tick]);
  const findReady = useMemo(() => {
    void tick;
    return getMarketingFindReadiness();
  }, [tick]);
  const findLast = useMemo(() => {
    void tick;
    return getMarketingFindLastRun();
  }, [tick]);
  const brief = useMemo(() => {
    void tick;
    return getMarketingMorningBrief();
  }, [tick]);
  const laneChips = useMemo(() => {
    void tick;
    return getMarketingLanePerformanceChips(3);
  }, [tick]);
  const ruthTip = useMemo(() => {
    void tick;
    return getRuthWeeklyLaneTip();
  }, [tick]);

  const saveSeats = () => {
    setMarketingDeskAssignee({
      label: assigneeLabel.trim() || 'Marketing',
      alternateLabel: alternateLabel.trim() || undefined,
      mode: seatMode === 'round_robin' && alternateLabel.trim() ? 'round_robin' : 'primary',
      rrNext: getMarketingDeskAssignee().rrNext ?? 0,
    });
    setTick((t) => t + 1);
  };

  const tour = getTourById(MARKETING_DESK_TOUR_ID);
  const flagOn = isFeatureEnabled('marketingDesk');
  const mailChip = mail.status === 'ready' ? 'ok' : mail.status === 'paused' ? 'warn' : 'blocked';
  const findChip = findReady.ready ? 'ok' : 'blocked';
  const mission =
    !findReady.ready
      ? 'Fix Find setup, then Find new people'
      : mail.status === 'needs_setup'
        ? 'Check Mail setup, then Find new people'
        : stagingPending > 0
          ? `Clear ${stagingPending} exception${stagingPending === 1 ? '' : 's'}`
          : myWork.length > 0
            ? 'Clear today’s to-dos'
            : 'Find new people';

  const primary = () => navigate('/admin/growth-agents/lead-discovery');

  return (
    <div className={FINELY_OS_COMPACT_PAGE}>
      {/* 1. Command strip */}
      <div className="rounded-2xl border border-amber-400/30 bg-black/40 !p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className={FINELY_OS_ENTITY_TITLE}>Marketing Desk</h1>
            <span className={finelyOsStatusChip(findChip)}>{findReady.label}</span>
            <span className={finelyOsStatusChip(mailChip)}>Mail {mail.label}</span>
            {!flagOn ? <span className={finelyOsMicroStat('amber')}>Flag off</span> : null}
          </div>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>Today’s mission: {mission}</p>
          <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
            Specialists live in{' '}
            <button type="button" className="text-emerald-300/90 underline" onClick={() => navigate('/admin/growth-agents')}>
              Growth Agents
            </button>
            {' '}— this desk is Caleb Brooks’s daily workroom.
          </p>
          {findLast ? (
            <p className={`mt-0.5 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
              Last Find: {findLast.found} found · {findLast.autoSaved} auto-saved · {findLast.review} exceptions
            </p>
          ) : null}
        </div>
        <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={primary}>
          Open Caleb desk <ArrowRight size={14} />
        </button>
      </div>

      {/* While you slept — morning brief */}
      {brief.hasSignal || brief.sleepOn ? (
        <section className={`${finelyOsDeckTile('amber')} !p-4 space-y-2`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>
                {brief.overnight || brief.sleepOn ? 'While you slept' : 'Morning brief'}
              </div>
              <p className="text-sm font-semibold text-white">{brief.summaryLine}</p>
              <p className={`mt-1 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
                {brief.sleepOn ? 'Find while I sleep is On. ' : ''}
                {brief.at
                  ? `Last Find ${new Date(brief.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.`
                  : 'No overnight Find yet — run Daily pack or turn sleep On.'}
              </p>
            </div>
            {brief.findFailed ? (
              <button
                type="button"
                className={FINELY_OS_PRIMARY_BTN}
                onClick={() => navigate('/admin/marketing-desk?helper=find')}
              >
                Fix setup <ArrowRight size={14} />
              </button>
            ) : brief.exceptions > 0 ? (
              <button
                type="button"
                className={FINELY_OS_PRIMARY_BTN}
                onClick={() => navigate('/admin/marketing-desk?helper=find#exceptions')}
              >
                Clear exceptions <ArrowRight size={14} />
              </button>
            ) : (
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => onOpenHelper('find')}>
                Open Find
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={finelyOsMicroStat('violet')}>{brief.found} found</span>
            <span className={finelyOsMicroStat('emerald')}>{brief.autoSaved} auto-saved</span>
            <span className={finelyOsMicroStat('amber')}>{brief.exceptions} exceptions</span>
            <span className={finelyOsMicroStat('sky')}>{brief.mailed} mailed</span>
            <span className={finelyOsMicroStat('fuchsia')}>{brief.booked} booked</span>
          </div>
        </section>
      ) : null}

      <FinelyOsAlertBanner
        tone="info"
        message="Works on this browser profile — use the same machine/profile for marketing daily."
      />

      {/* 2. KPI chips — deck tiles only, no list chrome */}
      <div className="grid grid-cols-3 gap-2">
        {kpis.map((k) => (
          <button
            key={k.id}
            type="button"
            className={`${finelyOsDeckTile('violet')} !p-3 text-left`}
            onClick={() => (k.helper ? onOpenHelper(k.helper) : undefined)}
          >
            <div className={FINELY_OS_ENTITY_SUBLABEL}>{k.label}</div>
            <div className="mt-1 text-2xl font-bold text-white tabular-nums">{k.value}</div>
            {k.hint ? <div className={`mt-0.5 text-[10px] ${FINELY_OS_ENTITY_BODY}`}>{k.hint}</div> : null}
          </button>
        ))}
      </div>

      {laneChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Lane pace (30d)</span>
          {laneChips.map((c) => (
            <button
              key={c.lane}
              type="button"
              className={finelyOsMicroStat('emerald')}
              onClick={() => onOpenHelper('find')}
              title={`${c.found} found · ${c.booked} booked`}
            >
              {c.label} {c.ratePct}% booked
            </button>
          ))}
        </div>
      ) : null}

      {ruthTip ? (
        <button
          type="button"
          className={`${finelyOsDeckTile('amber')} !p-3 w-full text-left`}
          onClick={() => onOpenHelper('ruth')}
          title="Ruth weekly tip from lane pace"
        >
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Ruth tip · this week</div>
          <p className="mt-1 text-sm text-white">{ruthTip.tip}</p>
        </button>
      ) : null}

      {/* 3. Mail status tile */}
      <button
        type="button"
        className={`${finelyOsDeckTile('sky')} !p-4 w-full text-left`}
        onClick={() => onOpenHelper('mail')}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-sky-200" />
            <span className="font-semibold text-white">Mail on autopilot</span>
            <span className={finelyOsStatusChip(mailChip)}>{mail.label}</span>
          </div>
          <span className={finelyOsMicroStat('sky')}>{mail.activeEnrollments} active</span>
        </div>
        <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>{mail.detail}</p>
      </button>

      {/* 4. Helper tiles (2×2 + mail already above — four primary helpers) */}
      <div className="grid sm:grid-cols-2 gap-3">
        {MARKETING_DESK_HELPERS.filter((h) => h.id !== 'mail').map((h) => (
          <button
            key={h.id}
            type="button"
            className={`${finelyOsDeckTile(h.accent)} !p-4 text-left`}
            onClick={() => onOpenHelper(h.id)}
          >
            <div className="font-semibold text-white">{h.title}</div>
            <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{h.blurb}</p>
            <span className={`mt-3 inline-flex text-xs font-semibold text-amber-200/90`}>{h.cta} →</span>
          </button>
        ))}
      </div>

      {/* 5. My work */}
      <section className="rounded-2xl border border-white/10 bg-black/30 !p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Today’s to-dos</div>
            <h2 className="text-lg font-bold text-white">My work</h2>
          </div>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/my-tasks')}>
            See all
          </button>
        </div>
        <FinelyOsPaginatedStack
          items={myWork}
          pageSize={5}
          emptyMessage="No marketing to-dos yet — Find people or ask Ruth to queue nurture."
          itemSpacingClassName="space-y-2"
          renderItem={(t) => (
            <button
              key={t.id}
              type="button"
              className="w-full rounded-xl border border-white/10 bg-black/25 !p-3 text-left hover:border-amber-400/30"
              onClick={() => navigate(deepLinkForMarketingTask(t))}
            >
              <div className="font-semibold text-white text-sm truncate">{t.title}</div>
              <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                {t.dueAt ? `Due ${new Date(t.dueAt).toLocaleDateString()}` : 'No due date'} · {t.status}
              </div>
            </button>
          )}
        />
      </section>

      <div className="rounded-2xl border border-white/10 bg-black/25 !p-4 space-y-2">
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[160px] flex-1">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Work goes to</div>
            <input
              value={assigneeLabel}
              onChange={(e) => setAssigneeLabel(e.target.value)}
              onBlur={saveSeats}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/40"
              placeholder="Marketing hire name or email"
            />
          </label>
          <label className="min-w-[160px] flex-1">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Alternate</div>
            <input
              value={alternateLabel}
              onChange={(e) => setAlternateLabel(e.target.value)}
              onBlur={saveSeats}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/40"
              placeholder="Second seat (optional)"
            />
          </label>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={saveSeats}>
            Save seats
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={seatMode === 'primary' ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
            onClick={() => {
              setSeatMode('primary');
              setMarketingDeskAssignee({
                label: assigneeLabel.trim() || 'Marketing',
                alternateLabel: alternateLabel.trim() || undefined,
                mode: 'primary',
                rrNext: 0,
              });
              setTick((t) => t + 1);
            }}
          >
            Always primary
          </button>
          <button
            type="button"
            className={seatMode === 'round_robin' ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
            disabled={!alternateLabel.trim()}
            onClick={() => {
              setSeatMode('round_robin');
              setMarketingDeskAssignee({
                label: assigneeLabel.trim() || 'Marketing',
                alternateLabel: alternateLabel.trim() || undefined,
                mode: 'round_robin',
                rrNext: getMarketingDeskAssignee().rrNext ?? 0,
              });
              setTick((t) => t + 1);
            }}
          >
            Round-robin
          </button>
          <span className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
            New Desk tasks use Work goes to
            {seatMode === 'round_robin' && alternateLabel.trim() ? ' · Alternate in turn' : ''}.
          </span>
        </div>
      </div>

      {/* 6. How this works */}
      <details className="rounded-2xl border border-white/10 bg-black/25 !p-4">
        <summary className="cursor-pointer select-none flex items-center gap-2 text-white font-semibold">
          <HelpCircle size={16} /> How this works
        </summary>
        <ol className={`mt-3 list-decimal pl-5 space-y-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
          {MARKETING_DESK_HOW_IT_WORKS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => {
              resetMarketingDeskTour();
              setTourOpen(true);
            }}
          >
            Replay tour
          </button>
        </div>
      </details>

      {tour ? (
        <FinelyTourPlayer
          tour={tour}
          open={tourOpen}
          onClose={() => {
            markMarketingDeskTourSeen();
            setTourOpen(false);
          }}
        />
      ) : null}

      {/* 7. Footer owner tools */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/projects')}>
          Projects & Tasks
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/comms')}>
          Comms Studio
        </button>
      </div>
    </div>
  );
}
