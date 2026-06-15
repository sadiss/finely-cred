import React from 'react';
import { CalendarDays, MessageCircle, Info } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  COMMS_WORKSPACE_EXPLAINER,
  COMMS_WORKSPACE_TABS,
  activeCommsWorkspaceTab,
  type CommsWorkspaceTab,
} from './commsWorkspaceModel';
import { FINELY_OS_BANNER, FINELY_OS_VIEW_TABS, finelyOsViewTab } from '../../features/os/finelyOsLightUi';
import { FinelyOsIconBadge } from '../../features/os/FinelyOsIconBadge';

const TAB_ICONS: Record<CommsWorkspaceTab, typeof MessageCircle> = {
  hub: MessageCircle,
  calendar: CalendarDays,
};

const TAB_ACCENTS: Record<CommsWorkspaceTab, 'fuchsia' | 'sky'> = {
  hub: 'fuchsia',
  calendar: 'sky',
};

type Props = {
  active?: CommsWorkspaceTab;
  showExplainer?: boolean;
  compact?: boolean;
};

export function CommunicationWorkspaceNav({ active, showExplainer = true, compact }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const current = active ?? activeCommsWorkspaceTab(location.pathname, location.search);
  const currentTab = COMMS_WORKSPACE_TABS.find((t) => t.id === current);

  return (
    <div className="space-y-3">
      <div className={compact ? 'inline-flex flex-wrap gap-1' : FINELY_OS_VIEW_TABS} role="tablist" aria-label="Communication workspace">
        {COMMS_WORKSPACE_TABS.map((tab) => {
          const isActive = current === tab.id;
          const Icon = TAB_ICONS[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => navigate(tab.path)}
              className={finelyOsViewTab(isActive, TAB_ACCENTS[tab.id])}
            >
              <FinelyOsIconBadge icon={Icon} accent={TAB_ACCENTS[tab.id]} size={12} className="p-1.5 rounded-lg" />
              {compact ? tab.shortLabel : tab.label}
            </button>
          );
        })}
      </div>

      {showExplainer && currentTab && (
        <div className={`${FINELY_OS_BANNER} py-3`}>
          <FinelyOsIconBadge icon={Info} accent="emerald" size={14} className="p-2 rounded-lg mt-0.5" />
          <div className="text-xs leading-relaxed text-emerald-200">
            <span className="font-semibold">{currentTab.label}:</span> {currentTab.desc}{' '}
            <span className="text-emerald-300/80">{COMMS_WORKSPACE_EXPLAINER}</span>
          </div>
        </div>
      )}
    </div>
  );
}
