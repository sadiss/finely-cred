import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  AdminStageHero,
  AdminStageSection,
  AdminStageShell,
} from '../../components/ProductAdminStage';
import { ProductPagePrimaryAction } from '../../components/ProductHubScaffold';
import type { AdminGrowthPageDefinition } from './adminGrowthPageDefinitions';
import type { AdminGrowthPageSnapshot, GrowthContentBlock } from './adminGrowthPageData';
import './adminGrowthWorkstations.css';

function GrowthContentBlockPanel({ block }: { block: GrowthContentBlock }) {
  return (
    <section className="fc-wlp-growth-block-panel" data-fcm-accent={block.accent}>
      <header className="fc-wlp-growth-block-head">
        <h3>{block.title}</h3>
      </header>
      {block.rows.length ? (
        <ul className="fc-wlp-growth-block-list">
          {block.rows.map((row) => (
            <li key={row.id}>
              {row.href ? (
                <Link to={row.href} className="fc-wlp-growth-row fc-wlp-growth-row--link">
                  <div>
                    <strong>{row.primary}</strong>
                    {row.secondary ? <span>{row.secondary}</span> : null}
                  </div>
                  {row.meta ? <em>{row.meta}</em> : null}
                </Link>
              ) : (
                <div className="fc-wlp-growth-row">
                  <div>
                    <strong>{row.primary}</strong>
                    {row.secondary ? <span>{row.secondary}</span> : null}
                  </div>
                  {row.meta ? <em>{row.meta}</em> : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="fc-wlp-growth-empty">{block.emptyMessage ?? 'Nothing to show yet.'}</p>
      )}
    </section>
  );
}

export function AdminGrowthPageShell({
  definition,
  snapshot,
  icon: Icon,
  relatedLinks,
  onPrimaryAction,
  chromeOnly = false,
}: {
  definition: AdminGrowthPageDefinition;
  snapshot: AdminGrowthPageSnapshot;
  icon: LucideIcon;
  relatedLinks: Array<{ label: string; path: string }>;
  onPrimaryAction: () => void;
  /** Tool-first rooms embed real workstations — skip duplicate signal/block grids. */
  chromeOnly?: boolean;
}) {
  return (
    <AdminStageShell family="growth-suite" signature={`growth-${definition.id}`} accent={definition.accent}>
      <span hidden data-surface-kind="real" data-surface-key={`admin:${definition.id}`} />

      <AdminStageHero
        tone="control"
        accent={definition.accent}
        eyebrow="Growth operations"
        title={definition.title}
        description={definition.purposeLine}
        status="Live growth workstation"
        freshness="just now"
        icon={Icon}
        primaryAction={
          <ProductPagePrimaryAction label={snapshot.primaryAction.label} onClick={onPrimaryAction} />
        }
      />

      {!chromeOnly ? (
        <>
          <AdminStageSection
            eyebrow="What matters now"
            title="One signal to act on first"
            description="The ranked signal below is the single most important thing on this page right now."
            tone="dark"
          >
            <div className="fc-wlp-growth-signal" data-fcm-accent={definition.accent}>
              <p>{snapshot.rankedSignal.sentence}</p>
              {snapshot.rankedSignal.href && snapshot.rankedSignal.linkLabel ? (
                <Link to={snapshot.rankedSignal.href} className="fc-wlp-growth-signal-link">
                  {snapshot.rankedSignal.linkLabel}
                  <ArrowUpRight size={14} aria-hidden />
                </Link>
              ) : null}
            </div>
          </AdminStageSection>

          <div className="fc-wlp-growth-blocks">
            {snapshot.blocks.map((block) => (
              <GrowthContentBlockPanel key={block.id} block={block} />
            ))}
          </div>

          {relatedLinks.length ? (
            <AdminStageSection
              eyebrow="Related"
              title="Sibling growth pages"
              description="Shortcuts only — the work stays on this screen."
              tone="dark"
            >
              <div className="fc-wlp-growth-related">
                {relatedLinks.map((link) => (
                  <Link key={link.path} to={link.path} className="fc-wlp-growth-related-link">
                    {link.label}
                  </Link>
                ))}
              </div>
            </AdminStageSection>
          ) : null}
        </>
      ) : null}

      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </AdminStageShell>
  );
}
