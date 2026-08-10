import { listProspects } from '../../data/crmProspectsRepo';
import type { Prospect } from '../../domain/crmProspects';
import { prospectScoresFromProspect, type ProspectMlScores } from './growthMlScore';

export type GrowthQueuedProspect = {
  prospect: Prospect;
  conversationScore: number;
  selfSignupScore: number;
  reasons: string[];
};

function toQueued(p: Prospect, ml: ProspectMlScores): GrowthQueuedProspect {
  return {
    prospect: p,
    conversationScore: ml.conversationScore,
    selfSignupScore: ml.selfSignupScore,
    reasons: ml.reasons,
  };
}

/** Top prospects to contact today — ML conversation score + recent discovery tags. */
export function getTodaysContactQueue(limit = 10): GrowthQueuedProspect[] {
  const rows = listProspects()
    .filter((p) => {
      const tags = p.tags ?? [];
      if (!tags.some((t) => ['lead-intel', 'lead-engine', 'marketing-desk'].includes(t))) return false;
      if (p.stage === 'disqualified') return false;
      return true;
    })
    .map((p) => toQueued(p, prospectScoresFromProspect(p)))
    .sort((a, b) => b.conversationScore - a.conversationScore);
  return rows.slice(0, limit);
}
