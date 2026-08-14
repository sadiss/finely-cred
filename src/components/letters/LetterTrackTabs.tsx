import React from 'react';
import { Gavel, Scale, FileText, Landmark } from 'lucide-react';
import type { LettersStudioTab } from './LettersCommandCenter';
import {
  LETTER_TRACK_TAB,
  LETTER_TRACK_TAB_ACTIVE,
  LETTER_TRACK_TAB_IDLE,
} from './letterEasyFlowTokens';

export type LetterTrackTabItem = {
  id: LettersStudioTab;
  label: string;
  icon?: React.ReactNode;
};

export type LetterStudioTrackMode = 'credit' | 'debt';

/**
 * Credit Letters: bureau disputes + credit-report FC/repo/BK + templates.
 * Debt Letters: validation + affidavits/court + debt FC/repo/BK (no templates).
 */
export function buildLetterStudioTrackTabs(options: {
  mode: LetterStudioTrackMode;
  hasTemplates?: boolean;
  /** @deprecated — credit mode no longer includes debt tracks via hasDebt */
  hasDebt?: boolean;
}): LetterTrackTabItem[] {
  if (options.mode === 'debt') {
    return [
      { id: 'validation', label: 'Validation', icon: <Scale size={16} aria-hidden /> },
      { id: 'court', label: 'Litigation', icon: <Scale size={16} aria-hidden /> },
      { id: 'foreclosure', label: 'Foreclosure', icon: <Landmark size={16} aria-hidden /> },
      { id: 'repossession', label: 'Repossession', icon: <Landmark size={16} aria-hidden /> },
      { id: 'bankruptcy', label: 'Bankruptcy', icon: <Landmark size={16} aria-hidden /> },
    ];
  }

  const tabs: LetterTrackTabItem[] = [
    { id: 'dispute', label: 'Bureaus', icon: <Gavel size={16} aria-hidden /> },
    { id: 'foreclosure', label: 'Foreclosure', icon: <Landmark size={16} aria-hidden /> },
    { id: 'repossession', label: 'Repossession', icon: <Landmark size={16} aria-hidden /> },
    { id: 'bankruptcy', label: 'Bankruptcy', icon: <Landmark size={16} aria-hidden /> },
  ];
  if (options.hasTemplates) {
    tabs.push({ id: 'templates', label: 'Templates', icon: <FileText size={16} aria-hidden /> });
  }
  return tabs;
}

export function LetterTrackTabs({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  'aria-label': ariaLabel = 'Letter studio tracks',
}: {
  tabs: LetterTrackTabItem[];
  activeTab: LettersStudioTab;
  onTabChange: (id: LettersStudioTab) => void;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:thin]">
    <div
      className={`flex flex-wrap sm:flex-nowrap gap-2 p-1 rounded-2xl border border-white/10 bg-black/30 min-w-max sm:min-w-0 ${className}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((t) => {
        const selected = activeTab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onTabChange(t.id)}
            className={`${LETTER_TRACK_TAB} shrink-0 ${selected ? LETTER_TRACK_TAB_ACTIVE : LETTER_TRACK_TAB_IDLE}`}
          >
            {t.icon}
            {t.label}
          </button>
        );
      })}
    </div>
    </div>
  );
}
