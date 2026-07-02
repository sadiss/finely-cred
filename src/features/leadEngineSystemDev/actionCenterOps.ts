import { buildActionRecommendation, buildNurtureHandoff, importCandidateToCrm } from './leadIntelActionEngine';
import { addLeadEngineEvent, listCandidates, upsertAction, upsertCandidate, upsertHandoff } from './leadEngineSystemRepo';

export function buildActionForCandidate(candidateId: string, origin?: string) {
  const candidate = listCandidates().find((c) => c.id === candidateId);
  if (!candidate) return null;
  const action = buildActionRecommendation(candidate, origin);
  const saved = upsertAction(action);
  const updated = upsertCandidate({ ...candidate, shortLinkId: action.shortLink.id, status: 'review' });
  addLeadEngineEvent('action_recommended', `Built action recommendation for ${updated.title}.`, { candidateId: candidate.id, funnel: candidate.funnel, cityId: candidate.cityId, source: candidate.source });
  return saved;
}

export function importAndHandoffCandidate(candidateId: string) {
  const candidate = listCandidates().find((c) => c.id === candidateId);
  if (!candidate) return null;
  const prospect = importCandidateToCrm(candidate);
  if (!prospect) return null;
  const updated = upsertCandidate({ ...candidate, prospectId: prospect.id, status: 'routed' });
  const handoff = buildNurtureHandoff(updated, prospect.id);
  const savedHandoff = upsertHandoff(handoff);
  addLeadEngineEvent('candidate_imported', `Imported ${updated.title} to CRM and prepared nurture.`, { candidateId: updated.id, funnel: updated.funnel, cityId: updated.cityId, source: updated.source });
  return { prospect, handoff: savedHandoff };
}

export function buildTopActions(limit = 25, origin?: string) {
  const candidates = listCandidates().filter((c) => c.score >= 60 && !c.shortLinkId).slice(0, limit);
  return candidates.map((c) => buildActionForCandidate(c.id, origin)).filter(Boolean);
}

export function routeTopCandidates(limit = 10) {
  const candidates = listCandidates().filter((c) => c.score >= 60 && !c.prospectId).slice(0, limit);
  return candidates.map((c) => importAndHandoffCandidate(c.id)).filter(Boolean);
}
