import React, { useState } from 'react';
import { BookOpen, MessageSquare } from 'lucide-react';
import {
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  type FinelyOsGlowAccent,
} from './finelyOsLightUi';
import { FinelyOsWorkstationLauncherButton, FinelyOsWorkstationModal } from './FinelyOsWorkstationModal';

export type FinelyOsWorkstationCoachHubTab = 'coach' | 'laws';

export function FinelyOsWorkstationCoachHub({
  accent = 'emerald',
  launcherLabel,
  launcherHint,
  coachTab,
  lawsTab,
  defaultTab = 'coach',
  modalTitle = 'Workstation coach',
  modalSubtitle = 'Ask Finely · laws & playbooks',
}: {
  accent?: FinelyOsGlowAccent;
  launcherLabel: string;
  launcherHint: string;
  coachTab: React.ReactNode;
  lawsTab: React.ReactNode;
  defaultTab?: FinelyOsWorkstationCoachHubTab;
  modalTitle?: string;
  modalSubtitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<FinelyOsWorkstationCoachHubTab>(defaultTab);

  return (
    <>
      <FinelyOsWorkstationLauncherButton
        accent={accent}
        label={launcherLabel}
        hint={launcherHint}
        onClick={() => {
          setTab(defaultTab);
          setOpen(true);
        }}
      />

      <FinelyOsWorkstationModal
        open={open}
        accent={accent}
        size="large"
        title={modalTitle}
        subtitle={modalSubtitle}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab('coach')}
              className={tab === 'coach' ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
            >
              <MessageSquare size={13} /> Coach
            </button>
            <button
              type="button"
              onClick={() => setTab('laws')}
              className={tab === 'laws' ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
            >
              <BookOpen size={13} /> Laws
            </button>
          </div>

          <div className="min-h-[12rem]">{tab === 'coach' ? coachTab : lawsTab}</div>
        </div>
      </FinelyOsWorkstationModal>
    </>
  );
}
