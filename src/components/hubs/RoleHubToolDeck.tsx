import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsDeckTile,
  finelyOsMicroStat,
  type FinelyOsDeckAccent,
} from '../../features/os/finelyOsLightUi';

export type RoleHubTool = {
  id: string;
  label: string;
  detail: string;
  path: string;
  icon: LucideIcon;
  accent?: FinelyOsDeckAccent;
  badge?: string;
};

type Props = {
  title?: string;
  subtitle?: string;
  tools: RoleHubTool[];
  className?: string;
};

/**
 * Compact tool deck for role hubs — discoverability without a second KPI strip.
 */
export function RoleHubToolDeck({
  title = 'Tools · one tap',
  subtitle = 'Where am I going next? Open the tool for today’s job.',
  tools,
  className = '',
}: Props) {
  const navigate = useNavigate();

  if (!tools.length) return null;

  return (
    <section className={`space-y-2 ${className}`} data-fc-role-hub-tools="1">
      <div>
        <p className={FINELY_OS_ENTITY_SUBLABEL}>{title}</p>
        <p className={`mt-0.5 text-xs ${FINELY_OS_ENTITY_BODY}`}>{subtitle}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const accent = tool.accent ?? 'violet';
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => navigate(tool.path)}
              className={`${finelyOsDeckTile(accent)} !p-3`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/25 text-white/80">
                  <Icon size={15} />
                </span>
                {tool.badge ? <span className={finelyOsMicroStat(accent)}>{tool.badge}</span> : null}
              </div>
              <div className={`mt-2 text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{tool.label}</div>
              <p className={`mt-0.5 text-[11px] leading-snug ${FINELY_OS_ENTITY_BODY}`}>{tool.detail}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
