import React from 'react';
import { Folder } from 'lucide-react';
import { ProductStatusPill } from '../ProductUi';
import { DEFAULT_PIPELINE_STAGES, derivePipelineLanes } from './archetypeDerive';
import { ArchetypeEmptyState, ArchetypeSkeleton, ArchSpectrumBar } from './archetypeChrome';
import type { ProductPipelineLayoutProps } from './archetypeTypes';

/**
 * Pipeline archetype — horizontal stage lanes with cards flowing between states. The lane holding
 * the most work is called out as the bottleneck so the flow reads at a glance, not just a count.
 */
export function ProductPipelineLayout({
  accent,
  items,
  emptyState,
  loading,
  onOpenItem,
  stages = DEFAULT_PIPELINE_STAGES,
  laneTitle = 'Work by stage',
}: ProductPipelineLayoutProps) {
  if (loading) return <ArchetypeSkeleton kind="pipeline" accent={accent} />;

  if (!items.length) {
    return (
      <ArchetypeEmptyState
        accent={accent}
        title="No work in the pipeline yet"
        description="Items will flow through needs action, in progress, ready, and complete lanes as they move."
        action={emptyState}
      />
    );
  }

  const lanes = derivePipelineLanes(items, stages);
  const bottleneck = lanes.find((lane) => lane.isBottleneck);

  return (
    <div className="fc-wlp-arch-pipeline" data-fcm-accent={accent} aria-label={laneTitle}>
      <div className="fc-wlp-arch-pipeline-lanes">
        {lanes.map((lane, index) => (
          <div
            key={lane.stage.id}
            className="fc-wlp-arch-pipeline-lane"
            data-bottleneck={lane.isBottleneck ? 'true' : undefined}
            style={{ ['--fc-arch-index' as string]: index }}
          >
            <div className="fc-wlp-arch-pipeline-lane-head fcm-depth fcm-specular" data-bed="dark" data-fcm-accent={accent}>
              <span className="fcm-grain" aria-hidden />
              <span className="fc-wlp-arch-pipeline-lane-label">{lane.stage.label}</span>
              <span className="fc-wlp-arch-pipeline-lane-count">{lane.items.length}</span>
              <ArchSpectrumBar value={lane.items.length} max={lane.maxCount} accent={accent} />
            </div>

            <div className="fc-wlp-arch-pipeline-lane-body">
              {lane.items.length ? (
                lane.items.map((item) => {
                  const Icon = item.icon ?? Folder;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="fc-wlp-arch-pipeline-card"
                      data-accent={item.accent}
                      onClick={() => (onOpenItem ? onOpenItem(item) : item.onOpen())}
                    >
                      <span className="fc-wlp-arch-pipeline-card-icon">
                        <Icon size={16} strokeWidth={2} />
                      </span>
                      <span className="fc-wlp-arch-pipeline-card-copy">
                        <strong>{item.title}</strong>
                        <span>{item.meta}</span>
                      </span>
                      <ProductStatusPill status={item.status} label={item.statusLabel} />
                    </button>
                  );
                })
              ) : (
                <div className="fc-wlp-arch-pipeline-lane-empty">Nothing here</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="fc-wlp-arch-pipeline-dots" aria-hidden>
        {lanes.map((lane) => <span key={lane.stage.id} data-bottleneck={lane.isBottleneck ? 'true' : undefined} />)}
      </div>

      <div className="fc-wlp-arch-pipeline-footer fcm-depth fcm-specular" data-bed="dark" data-fcm-accent={accent}>
        <span className="fcm-grain" aria-hidden />
        {bottleneck && bottleneck.items.length > 0 ? (
          <span>
            <strong>{bottleneck.stage.label}</strong> is holding the most work — {bottleneck.items.length} item
            {bottleneck.items.length === 1 ? '' : 's'} of {items.length} total.
          </span>
        ) : (
          <span>Work is evenly spread across every stage right now.</span>
        )}
      </div>
    </div>
  );
}
