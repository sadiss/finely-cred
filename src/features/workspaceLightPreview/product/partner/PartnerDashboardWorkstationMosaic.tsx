import React, { useMemo } from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { hasEntitlement } from '../../../../data/billingRepo';
import {
  PARTNER_SERVICE_LINES,
  type PartnerServiceLine,
} from '../workspaceProductNav';
import { arrangeAccents } from '../workspaceAccentArrangement';
import type { WorkspaceProductAccent } from '../workspaceProductTokens';
import { ProductSectionHeader } from '../components/ProductUi';
import './partnerDashboardWorkstationMosaic.css';

export type PartnerDashboardWorkstationMosaicProps = {
  partnerId?: string;
  dataMode: 'demo' | 'real';
  stats: {
    reports: number;
    openCases: number;
    openDebt: number;
    letters: number;
    readinessScore: number;
  };
  onOpen: (path: string) => void;
};

function catalogAccent(accent: WorkspaceProductAccent): Exclude<WorkspaceProductAccent, 'graphite'> {
  return accent === 'graphite' ? 'emerald' : accent;
}

function lineStat(line: PartnerServiceLine, stats: PartnerDashboardWorkstationMosaicProps['stats']): string {
  switch (line.id) {
    case 'restore':
      return `${stats.reports} report${stats.reports === 1 ? '' : 's'} · ${stats.openCases} open dispute${stats.openCases === 1 ? '' : 's'}`;
    case 'build':
      return 'Utilization, courses, and positive history';
    case 'business':
      return 'Entity profile, vendors, and bureaus';
    case 'tradelines':
      return 'Placements, orders, and posting dates';
    case 'funding':
      return `${stats.readinessScore} / 100 readiness`;
    case 'debt':
      return `${stats.openDebt} open matter${stats.openDebt === 1 ? '' : 's'} · ${stats.letters} letter${stats.letters === 1 ? '' : 's'}`;
    case 'programs':
      return 'Specialist, affiliate, and partner hubs';
    default:
      return line.description;
  }
}

export function PartnerDashboardWorkstationMosaic({
  partnerId,
  dataMode,
  stats,
  onOpen,
}: PartnerDashboardWorkstationMosaicProps) {
  const lines = useMemo(
    () => PARTNER_SERVICE_LINES.filter((line) => line.id !== 'workspace'),
    [],
  );
  const accents = useMemo(() => arrangeAccents(lines.length, { columns: 2 }), [lines.length]);

  const rooms = useMemo(
    () =>
      lines.map((line, index) => {
        const unlocked =
          dataMode !== 'real' ||
          !partnerId ||
          line.entitlementAnyOf.length === 0 ||
          line.entitlementAnyOf.some((key) => hasEntitlement(partnerId, key));
        return {
          line,
          unlocked,
          accent: catalogAccent(accents[index] ?? line.accent),
          dest: unlocked ? line.landingPath : line.upsellPath || line.landingPath,
        };
      }),
    [accents, dataMode, lines, partnerId],
  );

  return (
    <section className="fc-partner-service-mosaic" aria-label="Credit services" data-fc-dashboard-mosaic="1">
      <ProductSectionHeader
        eyebrow="Your services"
        title="Open the workspace for this job"
        description="Each room is a different credit service. The one you need now is the next click."
      />
      <div className="fc-partner-service-mosaic__grid">
        {rooms.map((room, index) => {
          const Icon = room.line.icon;
          return (
            <button
              key={room.line.id}
              type="button"
              className="fc-partner-service-tile"
              data-accent={room.accent}
              data-featured={index === 0 ? '1' : '0'}
              data-locked={room.unlocked ? '0' : '1'}
              onClick={() => onOpen(room.dest)}
            >
              <span className="fc-partner-service-tile__chip" aria-hidden>
                <Icon size={22} strokeWidth={2.2} />
              </span>
              <span className="fc-partner-service-tile__copy">
                <span className="fc-partner-service-tile__kicker">
                  {room.unlocked ? 'Open now' : 'Available to add'}
                </span>
                <span className="fc-partner-service-tile__title">{room.line.label}</span>
                <span className="fc-partner-service-tile__purpose">{room.line.description}</span>
                <span className="fc-partner-service-tile__stat">{lineStat(room.line, stats)}</span>
              </span>
              <span className="fc-partner-service-tile__go">
                {room.unlocked ? (
                  <>
                    Open <ArrowRight size={16} strokeWidth={2.4} />
                  </>
                ) : (
                  <>
                    See this service <Lock size={15} strokeWidth={2.4} />
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
