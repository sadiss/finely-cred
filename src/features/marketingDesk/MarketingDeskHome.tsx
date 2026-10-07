import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, HelpCircle, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../os/finelyOsLightUi';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';
import { FinelyTourPlayer } from '../../components/tours/FinelyTourPlayer';
import { getTourById } from '../../config/tourManifest';
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
} from './marketingDeskTour';
import { getMarketingDeskAssignee, setMarketingDeskAssignee } from './marketingDeskAssignee';
import { ensureMarketingPipelineProject } from './marketingDeskProjects';
import type { MarketingDeskHelperId } from './marketingDeskGlossary';

const CARD = 'rounded-2xl border border-slate-200 bg-white p-5';

function statusChipClass(tone: 'ok' | 'warn' | 'blocked') {
  const fill =
    tone === 'ok'
      ? 'border-emerald-800 bg-emerald-800'
      : tone === 'warn'
        ? 'border-sky-800 bg-sky-800'
        : 'border-rose-800 bg-rose-800';
  return `inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-black uppercase tracking-widest text-[#f8fafc] ${fill}`;
}

const MODE_TOGGLE_SELECTED =
  'rounded-xl border border-slate-800 bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition';
const MODE_TOGGLE_IDLE =
  'rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0a1628] transition hover:border-slate-300';

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
  const mailChip = mail.status === 'ready' ? 'ok' : mail.status === 'paused' ? 'warn' : 'blocked';

  const mission = !findReady.ready
    ? 'Fix Find setup, then Find new people'
    : mail.status === 'needs_setup'
      ? 'Check Mail setup, then Find new people'
      : stagingPending > 0
        ? `Clear ${stagingPending} exception${stagingPending === 1 ? '' : 's'}`
        : myWork.length > 0
          ? 'Clear today’s to-dos'
          : 'Find new people';

  const missionCtaLabel = !findReady.ready
    ? 'Fix Find setup'
    : mail.status === 'needs_setup'
      ? 'Check Mail setup'
      : stagingPending > 0
        ? 'Clear exceptions'
        : myWork.length > 0
          ? 'Open to-dos'
          : 'Find new people';

  const onMissionClick = () => {
    if (!findReady.ready) {
      onOpenHelper('find');
      return;
    }
    if (mail.status === 'needs_setup') {
      onOpenHelper('mail');
      return;
    }
    if (stagingPending > 0) {
      onOpenHelper('find');
      return;
    }
    if (myWork.length > 0) {
      navigate('/admin/my-tasks');
      return;
    }
    onOpenHelper('find');
  };

  return (
    <div className={FINELY_OS_COMPACT_PAGE}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Today’s mission</p>
          <p className="mt-1 text-base font-semibold text-[#0a1628]">{mission}</p>
        </div>
        <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={onMissionClick}>
          {missionCtaLabel} <ArrowRight size={14} />
        </button>
      </div>

      {findLast ? (
        <p className="text-xs font-semibold text-slate-600">
          Last Find: {findLast.found} found · {findLast.autoSaved} auto-saved · {findLast.review} exceptions
        </p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <button
            key={k.id}
            type="button"
            className={`${CARD} text-left ${k.helper ? 'hover:border-slate-300 transition' : ''}`}
            onClick={() => (k.helper ? onOpenHelper(k.helper) : undefined)}
            disabled={!k.helper}
          >
            <div className="text-xs font-bold uppercase tracking-wide text-[#0a1628]">{k.label}</div>
            <div className="mt-2 text-3xl font-bold tabular-nums text-[#0a1628]">{k.value}</div>
            {k.hint ? <div className="mt-2 text-sm font-semibold text-slate-600">{k.hint}</div> : null}
          </button>
        ))}
      </div>

      <button
        type="button"
        className={`${CARD} w-full text-left hover:border-slate-300 transition`}
        onClick={() => onOpenHelper('mail')}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Mail size={16} className="text-slate-600" />
            <span className="font-bold text-[#0a1628]">Mail on autopilot</span>
            <span className={statusChipClass(mailChip)}>{mail.label}</span>
          </div>
          <span className="text-xs font-semibold text-slate-600">{mail.activeEnrollments} active</span>
        </div>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          {/supabase|cron|webhook|dryRun|email-webhook/i.test(mail.detail)
            ? mail.status === 'needs_setup'
              ? 'Mail is not connected yet. To-dos still work.'
              : 'Mail can send when delivery is on.'
            : mail.detail}
        </p>
      </button>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-[#0a1628]">My work</h2>
          {myWork.length > 0 ? (
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/my-tasks')}>
              See all
            </button>
          ) : null}
        </div>
        {myWork.length === 0 ? (
          <div className={`${CARD} flex flex-wrap items-center justify-between gap-3`}>
            <p className="text-sm font-semibold text-slate-600">No marketing to-dos yet — run Find to queue work.</p>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => onOpenHelper('find')}>
              Find people
            </button>
          </div>
        ) : (
          <FinelyOsPaginatedStack
            items={myWork}
            pageSize={5}
            emptyMessage=""
            itemSpacingClassName="space-y-2"
            renderItem={(t) => (
              <button
                key={t.id}
                type="button"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-slate-300 transition"
                onClick={() => navigate(deepLinkForMarketingTask(t))}
              >
                <div className="truncate text-sm font-semibold text-[#0a1628]">{t.title}</div>
                <div className="text-xs font-semibold text-slate-600">
                  {t.dueAt ? `Due ${new Date(t.dueAt).toLocaleDateString()}` : 'No due date'} · {t.status}
                </div>
              </button>
            )}
          />
        )}
      </section>

      <section className={`${CARD} space-y-4`}>
        <h2 className="text-lg font-bold text-[#0a1628]">Seats</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[160px] flex-1">
            <div className="text-xs font-semibold text-slate-600">Work goes to</div>
            <input
              value={assigneeLabel}
              onChange={(e) => setAssigneeLabel(e.target.value)}
              onBlur={saveSeats}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-[#0a1628] outline-none placeholder:text-slate-400 focus:border-slate-400"
              placeholder="Marketing hire name or email"
            />
          </label>
          <label className="min-w-[160px] flex-1">
            <div className="text-xs font-semibold text-slate-600">Alternate</div>
            <input
              value={alternateLabel}
              onChange={(e) => setAlternateLabel(e.target.value)}
              onBlur={saveSeats}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-[#0a1628] outline-none placeholder:text-slate-400 focus:border-slate-400"
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
            className={seatMode === 'primary' ? MODE_TOGGLE_SELECTED : MODE_TOGGLE_IDLE}
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
            className={seatMode === 'round_robin' ? MODE_TOGGLE_SELECTED : MODE_TOGGLE_IDLE}
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
          <span className="text-[11px] font-semibold text-slate-600">
            New Desk tasks use Work goes to
            {seatMode === 'round_robin' && alternateLabel.trim() ? ' · Alternate in turn' : ''}.
          </span>
        </div>
      </section>

      <details className={CARD}>
        <summary className="flex cursor-pointer select-none items-center gap-2 font-bold text-[#0a1628]">
          <HelpCircle size={16} className="text-slate-600" />
          How this works
        </summary>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm font-semibold text-slate-600">
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
    </div>
  );
}
