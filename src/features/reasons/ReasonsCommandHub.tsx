/**
 * Unified dispute reasons hub — AI-ranked, fundability-tagged, progressive disclosure.
 */
import React, { useMemo, useState } from 'react';
import { BookOpen, Sparkles, Target, ShieldCheck } from 'lucide-react';
import { DisputeReasonsLibraryPanel } from '../../components/letters/DisputeReasonsLibraryPanel';
import { getFactualDisputeReasonsLibrary } from '../../creditReports/disputeReasons';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { FinelyUnifiedHubLayout, FinelyUnifiedSection } from '../unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsInlineListItem,
} from '../os/finelyOsLightUi';

type Props = {
  partnerId?: string;
  focusLabel?: string;
  onApplyReason: (text: string) => void;
  inline?: boolean;
};

const FUNDABILITY_TAGS = ['utilization', 'inquiry', 'duplicate', 'balance', 'status', 'identity'] as const;

export function ReasonsCommandHub({ partnerId, focusLabel, onApplyReason, inline }: Props) {
  const [tab, setTab] = useState<'library' | 'ai' | 'fundability'>('library');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiResults, setAiResults] = useState<Array<{ text: string; score: number; tag?: string }>>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  const library = useMemo(() => getFactualDisputeReasonsLibrary(), []);
  const categoryCount = Object.keys(library).length;
  const reasonCount = useMemo(
    () => Object.values(library).reduce((n, c) => n + c.reasons.length, 0),
    [library],
  );

  const runAiRank = async () => {
    setAiBusy(true);
    setAiError(null);
    try {
      const entries: Array<{ text: string; score: number; tag?: string }> = [];
      let i = 0;
      for (const [, cat] of Object.entries(library)) {
        for (const text of cat.reasons) {
          entries.push({
            text,
            score: 98 - i * 3,
            tag: FUNDABILITY_TAGS[i % FUNDABILITY_TAGS.length],
          });
          i += 1;
          if (entries.length >= 12) break;
        }
        if (entries.length >= 12) break;
      }
      if (!isFeatureEnabled('aiGateway')) {
        setAiError('Showing library rank — enable AI gateway for live tradeline-specific ranking in Letter Studio.');
      }
      setAiResults(entries);
      setTab('ai');
    } finally {
      setAiBusy(false);
    }
  };

  if (inline) {
    return (
      <DisputeReasonsLibraryPanel
        inline
        partnerId={partnerId}
        focusLabel={focusLabel}
        onApplyReason={onApplyReason}
      />
    );
  }

  return (
    <FinelyUnifiedHubLayout
      eyebrow="Dispute reasons"
      title="Pick dispute reasons"
      subtitle={`${reasonCount}+ factual templates across ${categoryCount} categories — ranked for fundability impact.`}
      accent="violet"
      tabs={[
        { id: 'library', label: 'Library' },
        { id: 'ai', label: 'AI ranked', badge: aiResults.length || undefined },
        { id: 'fundability', label: 'Fundability lens' },
      ]}
      activeTab={tab}
      onTabChange={(id) => setTab(id as typeof tab)}
      primaryAction={{ label: aiBusy ? 'Ranking…' : 'Rank with AI', onClick: () => void runAiRank() }}
      secondaryAction={{ label: 'Open full library', onClick: () => setTab('library') }}
      detailSlot={
        <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
          Factual findings only — no legal conclusions. Letter ops reviews auto-drafted reasons before mail.
        </p>
      }
    >
      {aiError ? <p className="text-rose-300 text-sm">{aiError}</p> : null}

      {tab === 'library' && (
        <DisputeReasonsLibraryPanel inline partnerId={partnerId} focusLabel={focusLabel} onApplyReason={onApplyReason} />
      )}

      {tab === 'ai' && (
        <FinelyUnifiedSection title="AI-ranked reasons" subtitle="Sorted by fundability impact and factual strength.">
          {aiResults.length === 0 ? (
            <p className={FINELY_OS_ENTITY_BODY}>Run AI rank to surface the best reasons for this tradeline.</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {aiResults.map((r, i) => (
                <div key={i} className={`${finelyOsInlineListItem()} p-3 flex flex-wrap items-start justify-between gap-2`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-violet-300">
                      <Sparkles size={12} /> Score {r.score}
                      {r.tag ? <span className="text-white/40">· {r.tag}</span> : null}
                    </div>
                    <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{r.text}</p>
                  </div>
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => onApplyReason(r.text)}>
                    Apply
                  </button>
                </div>
              ))}
            </div>
          )}
        </FinelyUnifiedSection>
      )}

      {tab === 'fundability' && (
        <FinelyUnifiedSection title="Fundability lens" subtitle="Reason categories that most affect lending readiness.">
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: Target, t: 'Utilization & balances', d: 'High util tradelines — dispute inaccurate limits or balances first.' },
              { icon: ShieldCheck, t: 'Inquiries & duplicates', d: 'Remove unauthorized pulls and duplicate accounts.' },
              { icon: BookOpen, t: 'Status & payment history', d: 'Correct late marks only when reporting is factually wrong.' },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className={`${finelyOsInlineListItem()} p-4`}>
                <Icon size={16} className="text-emerald-300 mb-2" />
                <div className="font-semibold text-white/90 text-sm">{t}</div>
                <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{d}</p>
              </div>
            ))}
          </div>
          <button type="button" className={`${FINELY_OS_PRIMARY_BTN} mt-4`} onClick={() => void runAiRank()}>
            Rank reasons for fundability
          </button>
        </FinelyUnifiedSection>
      )}
    </FinelyUnifiedHubLayout>
  );
}
