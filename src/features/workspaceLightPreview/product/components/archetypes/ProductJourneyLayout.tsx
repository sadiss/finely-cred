import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { deriveJourneySteps } from './archetypeDerive';
import { ArchetypeEmptyState, ArchetypeSkeleton } from './archetypeChrome';
import type { ProductJourneyLayoutProps } from './archetypeTypes';

/**
 * Journey archetype — a connected spine of numbered steps. Completed / current / upcoming read at
 * a glance from the marker state alone; the current step's detail panel is the only one dark.
 */
export function ProductJourneyLayout({
  accent,
  items,
  emptyState,
  loading,
  onOpenItem,
  steps: stepsOverride,
}: ProductJourneyLayoutProps) {
  const derivedSteps = stepsOverride ?? deriveJourneySteps(items);
  const [expandedId, setExpandedId] = useState<string | null>(() => derivedSteps.find((step) => step.current)?.id ?? null);

  if (loading) return <ArchetypeSkeleton kind="journey" accent={accent} />;

  if (!derivedSteps.length) {
    return (
      <ArchetypeEmptyState
        accent={accent}
        title="No steps on the route yet"
        description="Once work starts, each step will appear here as a numbered stop with its own status."
        action={emptyState}
      />
    );
  }

  const columnStyle = { ['--fc-arch-journey-cols' as string]: derivedSteps.length } as React.CSSProperties;

  return (
    <div className="fc-wlp-arch-journey" data-fcm-accent={accent}>
      <div
        className="fc-wlp-arch-journey-track fcm-depth fcm-specular"
        data-bed="dark"
        data-fcm-accent={accent}
        style={columnStyle}
        aria-hidden
      >
        <span className="fcm-grain" />
        {derivedSteps.map((step, index) => (
          <span
            key={step.id}
            className="fc-wlp-arch-journey-track-slot"
            data-complete={step.complete ? 'true' : undefined}
            data-current={step.current ? 'true' : undefined}
            style={{ ['--fc-arch-index' as string]: index }}
          >
            <span className="fc-wlp-arch-journey-track-dot">{step.complete ? <Check size={13} strokeWidth={2.6} /> : index + 1}</span>
          </span>
        ))}
      </div>

      <ol className="fc-wlp-arch-journey-steps" style={columnStyle}>
        {derivedSteps.map((step, index) => {
          const expanded = expandedId === step.id;
          return (
            <li
              key={step.id}
              className="fc-wlp-arch-journey-step"
              data-complete={step.complete ? 'true' : undefined}
              data-current={step.current ? 'true' : undefined}
              style={{ ['--fc-arch-index' as string]: index }}
            >
              <span className="fc-wlp-arch-journey-step-marker" aria-hidden>
                {step.complete ? <Check size={12} strokeWidth={2.6} /> : index + 1}
              </span>
              <button
                type="button"
                className="fc-wlp-arch-journey-step-head"
                onClick={() => setExpandedId((current) => (current === step.id ? null : step.id))}
                aria-expanded={expanded}
              >
                <span className="fc-wlp-arch-journey-step-label">{step.label}</span>
                {step.current ? <span className="fc-wlp-arch-journey-now">You are here</span> : null}
                <ChevronDown size={14} className="fc-wlp-arch-journey-chevron" data-open={expanded ? 'true' : undefined} />
              </button>

              {expanded ? (
                <div
                  className={`fc-wlp-arch-journey-panel${step.current ? ' fcm-depth fcm-specular' : ''}`}
                  data-bed={step.current ? 'dark' : undefined}
                  data-fcm-accent={step.current ? accent : undefined}
                >
                  {step.current ? <span className="fcm-grain" aria-hidden /> : null}
                  <p className="fc-wlp-arch-journey-step-copy">{step.description}</p>
                  {step.tags?.length ? (
                    <div className="fc-wlp-arch-journey-step-tags">
                      {step.tags.slice(0, 4).map((tag) => <em key={tag}>{tag}</em>)}
                    </div>
                  ) : null}
                  {step.meta ? <span className="fc-wlp-arch-journey-step-meta">{step.meta}</span> : null}
                  {step.onOpen ? (
                    <button
                      type="button"
                      className="fc-wlp-arch-journey-step-action"
                      onClick={() => (onOpenItem && step.sourceItem ? onOpenItem(step.sourceItem) : step.onOpen?.())}
                    >
                      {step.actionLabel ?? 'Open this step'}
                    </button>
                  ) : null}
                </div>
              ) : (
                <p className="fc-wlp-arch-journey-step-preview">{step.description}</p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
