import type { GeoCluster, StaffMember } from './types';
import { GEO_CLUSTERS, STAFF_MEMBERS } from './staffDirectory';

export type GeoClusterScore = {
  cluster: GeoCluster;
  readiness: number;
  leadPotential: number;
  missingPieces: string[];
  ownerNames: string[];
  recommendedMission: string;
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function staffByGeoCluster(cluster: GeoCluster): StaffMember[] {
  return cluster.assignedStaffIds.map((id) => STAFF_MEMBERS.find((s) => s.id === id)).filter(Boolean) as StaffMember[];
}

export function scoreGeoCluster(cluster: GeoCluster): GeoClusterScore {
  const sourceHealth = cluster.sourceMix.reduce((sum, s) => sum + (s.health === 'good' ? 20 : s.health === 'thin' ? 8 : -12), 0);
  const statusBonus = cluster.status === 'active' ? 20 : cluster.status === 'warmup' ? 8 : cluster.status === 'needs_content' ? 2 : cluster.status === 'needs_budget' ? 4 : -10;
  const funnelBonus = cluster.activeFunnels.length * 5;
  const staffBonus = cluster.assignedStaffIds.length * 4;
  const readiness = clamp(sourceHealth + statusBonus + funnelBonus + staffBonus);
  const leadPotential = clamp(readiness * 0.65 + cluster.priority * -2 + cluster.dailyTarget * 0.8);
  const missingPieces = cluster.sourceMix.filter((s) => s.health !== 'good').map((s) => `${s.source} is ${s.health}`);
  if (cluster.status === 'needs_content') missingPieces.push('Needs stronger local lead magnet/content page');
  if (cluster.status === 'needs_budget') missingPieces.push('Needs paid budget connection before retargeting can run');
  if (cluster.status === 'warmup') missingPieces.push('Still warming up; focus on content and source coverage before heavy spend');

  const owners = staffByGeoCluster(cluster).map((s) => s.name);
  const recommendedMission = missingPieces.some((m) => m.toLowerCase().includes('content'))
    ? 'geo_page_push'
    : missingPieces.some((m) => m.toLowerCase().includes('lead intel'))
      ? 'deep_swarm'
      : missingPieces.some((m) => m.toLowerCase().includes('partners'))
        ? 'partner_outreach'
        : 'city_growth_sprint';

  return { cluster, readiness, leadPotential, missingPieces, ownerNames: owners, recommendedMission };
}

export function buildGeoWarRoomSummary(activeIds?: string[]) {
  const list = activeIds?.length ? GEO_CLUSTERS.filter((g) => activeIds.includes(g.id)) : GEO_CLUSTERS;
  const scores = list.map(scoreGeoCluster).sort((a, b) => b.leadPotential - a.leadPotential);
  const totals = scores.reduce(
    (acc, x) => {
      acc.dailyTarget += x.cluster.dailyTarget;
      acc.overnightTarget += x.cluster.overnightTarget;
      acc.ready += x.readiness >= 70 ? 1 : 0;
      acc.blocked += x.missingPieces.filter((m) => m.toLowerCase().includes('blocked')).length;
      return acc;
    },
    { dailyTarget: 0, overnightTarget: 0, ready: 0, blocked: 0 },
  );
  const nextMoves = scores.flatMap((s) => s.cluster.nextMoves.map((m) => `${s.cluster.city}: ${m}`)).slice(0, 8);
  return { scores, totals, nextMoves };
}
