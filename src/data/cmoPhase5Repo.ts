import { loadJson, saveJson } from './localJsonStore';
import { CmoAutonomyPolicy, CmoBudgetAllocation, CmoChannelModel, CmoGrowthEvent, CmoLeadForecast, CmoPhase5State, CmoScaleExperiment, DEFAULT_CMO_AUTONOMY_POLICY } from '../domain/cmoPhase5';

const KEY = 'fc.cmo.phase5.scale.intelligence.v1';
const VERSION = 1;

const fallback: CmoPhase5State = {
  events: [],
  channelModels: [],
  forecasts: [],
  budgetAllocations: [],
  policies: [DEFAULT_CMO_AUTONOMY_POLICY],
  experiments: [],
};

export function loadCmoPhase5State(): CmoPhase5State {
  return loadJson<CmoPhase5State>(KEY, fallback, VERSION);
}

export function saveCmoPhase5State(state: CmoPhase5State): void {
  saveJson(KEY, state, VERSION);
}

export function addCmoGrowthEvent(event: CmoGrowthEvent): CmoPhase5State {
  const state = loadCmoPhase5State();
  const events = [event, ...state.events].slice(0, 5000);
  const next = { ...state, events };
  saveCmoPhase5State(next);
  return next;
}

export function saveCmoChannelModels(models: CmoChannelModel[]): CmoPhase5State {
  const state = loadCmoPhase5State();
  const next = { ...state, channelModels: models };
  saveCmoPhase5State(next);
  return next;
}

export function addCmoLeadForecast(forecast: CmoLeadForecast): CmoPhase5State {
  const state = loadCmoPhase5State();
  const forecasts = [forecast, ...state.forecasts].slice(0, 120);
  const next = { ...state, forecasts };
  saveCmoPhase5State(next);
  return next;
}

export function addCmoBudgetAllocation(allocation: CmoBudgetAllocation): CmoPhase5State {
  const state = loadCmoPhase5State();
  const budgetAllocations = [allocation, ...state.budgetAllocations].slice(0, 120);
  const next = { ...state, budgetAllocations };
  saveCmoPhase5State(next);
  return next;
}

export function upsertCmoAutonomyPolicy(policy: CmoAutonomyPolicy): CmoPhase5State {
  const state = loadCmoPhase5State();
  const policies = [policy, ...state.policies.filter((item) => item.id !== policy.id)];
  const next = { ...state, policies };
  saveCmoPhase5State(next);
  return next;
}

export function upsertCmoScaleExperiment(experiment: CmoScaleExperiment): CmoPhase5State {
  const state = loadCmoPhase5State();
  const experiments = [experiment, ...state.experiments.filter((item) => item.id !== experiment.id)];
  const next = { ...state, experiments };
  saveCmoPhase5State(next);
  return next;
}
