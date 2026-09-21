import type { BusinessJourneyStepId } from '../domain/businessCreditJourney';
import { BUSINESS_CREDIT_JOURNEY_STEPS } from '../domain/businessCreditJourney';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.businessCredit.journey.v1';

type Store = {
  completed: Partial<Record<BusinessJourneyStepId, boolean>>;
  lastStep: BusinessJourneyStepId;
  updatedAt: string;
};

function load(): Store {
  return loadJson<Store>(
    KEY,
    { completed: {}, lastStep: 'foundation', updatedAt: new Date().toISOString() },
    1,
  );
}

function save(store: Store) {
  saveJson(KEY, store, 1);
  window.dispatchEvent(new CustomEvent('finely:store'));
}

export function getJourneyProgress() {
  return load();
}

export function setJourneyStepComplete(stepId: BusinessJourneyStepId, done: boolean) {
  const s = load();
  s.completed[stepId] = done;
  s.lastStep = stepId;
  s.updatedAt = new Date().toISOString();
  save(s);
}

export function setJourneyLastStep(stepId: BusinessJourneyStepId) {
  const s = load();
  s.lastStep = stepId;
  s.updatedAt = new Date().toISOString();
  save(s);
}

export function journeyPercentComplete(): number {
  const s = load();
  const done = BUSINESS_CREDIT_JOURNEY_STEPS.filter((x) => s.completed[x.id]).length;
  return Math.round((done / BUSINESS_CREDIT_JOURNEY_STEPS.length) * 100);
}
