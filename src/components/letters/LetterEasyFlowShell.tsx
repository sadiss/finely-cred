import React from 'react';
import { FINELY_OS_COMPACT_PAGE } from '../../features/os/finelyOsLightUi';
import {
  LETTER_L1_PAPER_WRAP,
  LETTER_L3_CONTEXT_BODY,
  LETTER_L3_CONTEXT_CARD,
  LETTER_L3_CONTEXT_TITLE,
} from './letterEasyFlowTokens';

/**
 * Shared easy-letter chrome: context → path → work → letter-width paper + compact rail.
 * Used across dispute + debt letter tracks.
 */
export function LetterEasyFlowShell({
  contextTitle,
  contextSubtitle,
  context,
  actions,
  work,
  body,
  paper,
  rail,
  footer,
}: {
  contextTitle: string;
  contextSubtitle?: string;
  context: React.ReactNode;
  actions: React.ReactNode;
  /** Bureau tabs, toolbars, address — between path and paper grid */
  work?: React.ReactNode;
  /** Full-width studio body (skips paper+rail grid when set) */
  body?: React.ReactNode;
  paper?: React.ReactNode;
  rail?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className={`${FINELY_OS_COMPACT_PAGE} w-full`}>
      <section className={`${LETTER_L3_CONTEXT_CARD} space-y-3`}>
        <div>
          <h2 className={LETTER_L3_CONTEXT_TITLE}>{contextTitle}</h2>
          {contextSubtitle ? <p className={`${LETTER_L3_CONTEXT_BODY} mt-1`}>{contextSubtitle}</p> : null}
        </div>
        {context}
      </section>

      <section className="space-y-2 w-full">{actions}</section>

      {work ? <section className="space-y-2 w-full">{work}</section> : null}

      {body ? (
        <section className="space-y-3 w-full">{body}</section>
      ) : (
        <section className="grid gap-3 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] items-start w-full">
          <div className="min-w-0 w-full">
            <div className={`${LETTER_L1_PAPER_WRAP} mx-auto lg:mx-0`}>{paper}</div>
          </div>
          {rail ? <aside className="min-w-0 w-full space-y-3 lg:sticky lg:top-3">{rail}</aside> : null}
        </section>
      )}

      {footer ? <section className="space-y-2 w-full">{footer}</section> : null}
    </div>
  );
}
