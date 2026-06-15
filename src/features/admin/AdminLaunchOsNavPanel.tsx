import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { LAUNCH_OS_NAV_SECTIONS } from '../../lib/launchOsNavOps';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../os/finelyOsLightUi';

export function AdminLaunchOsNavPanel() {
  const navigate = useNavigate();

  return (
    <div id="launch-os-nav" className={`${finelyOsCatalogCard('sky')} !p-4 space-y-3`} data-fc-accent="sky">
      <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-sky-300 text-xs`}>
        <Compass size={14} />
        <span>Launch OS — jump to section</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {LAUNCH_OS_NAV_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`${FINELY_OS_SECONDARY_BTN} !py-1.5 !px-3 text-xs`}
            onClick={() => navigate(section.path ?? `/admin/launch-os${section.hash}`)}
          >
            {section.label}
          </button>
        ))}
      </div>
      <p className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
        Plan sealed at wave 69 — follow Sequencer first, then Ops runner when keys are ready.
      </p>
    </div>
  );
}
