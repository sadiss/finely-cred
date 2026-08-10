import React from 'react';
import { PartnerRestoreWorkspaceDock } from './PartnerRestoreWorkspaceDock';

type PartnerTabKey = 'overview' | 'profile' | 'reports' | 'analysis' | 'evidence' | 'letters' | 'tasks' | 'notes' | 'debt';

type Props = {
  reportsCount?: number;
  evidenceCount?: number;
  lettersCount?: number;
  onOpenTab: (tab: PartnerTabKey) => void;
  /** Highlight which restore tab is active on admin partner detail */
  activeTab?: 'reports' | 'evidence' | 'letters' | 'debt';
};

export function PartnerCreditRestoreMiniRail({ onOpenTab, activeTab }: Props) {
  return (
    <PartnerRestoreWorkspaceDock
      variant="admin"
      activeTab={activeTab}
      onOpenTab={(t) => onOpenTab(t)}
      className="sticky bottom-3 z-30"
    />
  );
}
