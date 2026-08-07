import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { SITE_WAYFINDER_LANES } from '../../config/siteWayfinderLanes';
import { LandingTypewriterTitle } from '../../components/landing/LandingTypewriterTitle';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE } from './finelyOsLightUi';

const ACCENT_ACTIVE: Record<string, string> = {
  emerald: 'fc-wayfinder-lane-active border-emerald-400/45 bg-emerald-500/12 shadow-[0_0_0_1px_rgba(52,211,153,0.25)]',
  violet: 'fc-wayfinder-lane-active border-violet-400/45 bg-violet-500/12 shadow-[0_0_0_1px_rgba(167,139,250,0.25)]',
  fuchsia: 'fc-wayfinder-lane-active border-fuchsia-400/45 bg-fuchsia-500/12 shadow-[0_0_0_1px_rgba(232,121,249,0.25)]',
  amber: 'fc-wayfinder-lane-active border-amber-400/45 bg-amber-500/12 shadow-[0_0_0_1px_rgba(251,191,36,0.25)]',
  sky: 'fc-wayfinder-lane-active border-sky-400/45 bg-sky-500/12 shadow-[0_0_0_1px_rgba(56,189,248,0.25)]',
};

function laneActive(path: string, lanePath: string, tab: string | null): boolean {
  if (path === lanePath || path.startsWith(`${lanePath}/`)) return true;
  if (lanePath.includes('personal-credit') && (path === '/pricing' || path === '/services')) {
    return !tab || tab === 'personal_credit' || tab === 'banking_reports';
  }
  if (lanePath.includes('business-credit') && (path === '/pricing' || path === '/services')) {
    return tab === 'business_credit';
  }
  if (lanePath.includes('debt-legal') && (path === '/pricing' || path === '/services')) {
    return tab === 'debt_legal';
  }
  return false;
}

export function FinelySiteWayfinder() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const path = location.pathname;
  const tab = searchParams.get('tab');
  const onSolutions =
    path.startsWith('/pricing') || path.startsWith('/services') || path.startsWith('/start-here');
  const onPersonalRestoreHero = path.includes('/personal-credit-restore');

  const activeLane = useMemo(
    () => SITE_WAYFINDER_LANES.find((lane) => laneActive(path, lane.path, tab)) ?? null,
    [path, tab],
  );

  /* Restore: stretch black band to top — no photo, no service tiles. */
  if (onPersonalRestoreHero) {
    return (
      <div
        className="fc-wayfinder fc-wayfinder--restore-hero relative z-30 w-full overflow-hidden bg-[#060c12]"
        style={{ marginTop: 'calc(-1 * (env(safe-area-inset-top, 0px) + 4.25rem))' }}
        aria-label="Personal credit restore"
      >
        <div className="fc-wayfinder-restore-veil absolute inset-0" aria-hidden />
        <div className="relative fc-container flex min-h-[12rem] sm:min-h-[14rem] items-end pb-5 pt-[calc(env(safe-area-inset-top,0px)+5.75rem)]">
          <div className="max-w-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-200/90">
              Personal credit restore
            </p>
            <p className="mt-1.5 text-sm sm:text-base font-semibold text-white/88 leading-snug">
              Disputes · deletions · restoration sequencing
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fc-wayfinder sticky z-40 border-b backdrop-blur-xl ${onSolutions ? 'fc-wayfinder--solutions' : ''}`}
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 4.25rem)' }}
    >
      <div className="fc-container py-3">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="min-w-0">
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} fc-wayfinder-kicker`}>
              {onSolutions ? 'Solutions' : 'Where do you want to go?'}
            </div>
            {activeLane && onSolutions ? (
              <LandingTypewriterTitle
                key={activeLane.id}
                text={activeLane.label}
                as="div"
                immediate
                className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}
                speedMs={32}
              />
            ) : (
              <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
                {onSolutions ? 'Pick one solution — then DIY or DFY' : 'Pick one lane — no maze of menus'}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate('/pricing')}
            className="fc-wayfinder-secondary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
          >
            All packages <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {SITE_WAYFINDER_LANES.map((lane) => {
            const active = laneActive(path, lane.path, tab);
            return (
              <button
                key={lane.id}
                type="button"
                onClick={() => navigate(lane.path)}
                data-fc-accent={lane.accent}
                className={`fc-wayfinder-lane text-left p-3 sm:p-4 rounded-2xl border border-white/[0.1] bg-white/[0.04] transition-colors hover:bg-white/[0.07] ${
                  active ? ACCENT_ACTIVE[lane.accent] ?? 'fc-wayfinder-lane-active border-amber-400/35' : ''
                } ${active && onSolutions ? 'sm:p-5' : ''}`}
              >
                <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{lane.label}</div>
                <div className={`text-xs mt-1 ${FINELY_OS_ENTITY_BODY}`}>{lane.hint}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
