import React from 'react';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import type { WorkspaceProductAccent } from '../workspaceProductTokens';
import { ProductAnimatedNumber } from './ProductMotion';
import './productSignalRail.css';

export type ProductSignalItem = {
  id: string;
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent: WorkspaceProductAccent;
  icon: LucideIcon;
  onClick?: () => void;
  featured?: boolean;
};

/**
 * Role-neutral KPI signal rail — large values, accent icon chips, radial wash cards.
 * Accents should rotate emerald → violet → sky → rose via `arrangeAccents`.
 */
export function ProductSignalRail({
  items,
  label,
}: {
  items: ProductSignalItem[];
  label?: string;
}) {
  return (
    <section className="fc-wlp-signal-rail" aria-label={label}>
      {items.map((item) => {
        const Icon = item.icon;
        const valueContent =
          typeof item.value === 'number' ? <ProductAnimatedNumber value={item.value} /> : item.value;

        return (
          <button
            key={item.id}
            type="button"
            className="fc-wlp-signal"
            data-accent={item.accent}
            data-featured={item.featured ? 'true' : undefined}
            onClick={item.onClick}
            disabled={!item.onClick}
          >
            <span className="fc-wlp-signal-icon">
              <Icon size={17} strokeWidth={2.15} aria-hidden />
            </span>
            <span className="fc-wlp-signal-copy">
              <em>{item.label}</em>
              <strong>{valueContent}</strong>
              {item.hint ? <small>{item.hint}</small> : null}
            </span>
            {item.onClick ? <ArrowUpRight size={14} className="fc-wlp-signal-arrow" aria-hidden /> : null}
          </button>
        );
      })}
    </section>
  );
}
