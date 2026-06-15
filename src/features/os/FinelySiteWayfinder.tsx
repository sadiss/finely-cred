import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SITE_WAYFINDER_LANES } from '../../config/siteWayfinderLanes';
import { finelyOsCatalogCard } from './finelyOsLightUi';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE } from './finelyOsLightUi';

export function FinelySiteWayfinder() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  return (
    <div
      className="fc-wayfinder sticky z-40 border-b backdrop-blur-xl"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 4.25rem)' }}
    >
      <div className="fc-container py-3">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div>
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} fc-wayfinder-kicker`}>Where do you want to go?</div>
            <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Pick one lane — no maze of menus</div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/services')}
            className="fc-wayfinder-secondary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
          >
            All services <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {SITE_WAYFINDER_LANES.map((lane) => {
            const active = path === lane.path || path.startsWith(`${lane.path}/`);
            return (
              <button
                key={lane.id}
                type="button"
                onClick={() => navigate(lane.path)}
                data-fc-accent={lane.accent}
                className={`text-left p-3 sm:p-4 rounded-2xl border transition-all ${finelyOsCatalogCard(lane.accent)} ${
                  active ? 'fc-wayfinder-lane-active' : ''
                }`}
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
