import { loadJson, saveJson } from './localJsonStore';
import type { PlaybookStageId, PlaybookTemplateId } from '../domain/partnerPlaybook';

const KEY = 'finely.partnerPlaybook.v1';

type PartnerPlaybookState = {
  partnerId: string;
  templateId: PlaybookTemplateId;
  stageDone: Partial<Record<PlaybookStageId, boolean>>;
  vertical?: string;
  updatedAt: string;
};

type Store = { byPartner: Record<string, PartnerPlaybookState> };

function load(): Store {
  return loadJson<Store>(KEY, { byPartner: {} }, 1);
}

function save(s: Store) {
  saveJson(KEY, s, 1);
  window.dispatchEvent(new CustomEvent('finely:store'));
}

export function getPartnerPlaybook(partnerId: string): PartnerPlaybookState | null {
  return load().byPartner[partnerId] ?? null;
}

export function setPartnerPlaybookTemplate(partnerId: string, templateId: PlaybookTemplateId, vertical?: string) {
  const s = load();
  s.byPartner[partnerId] = {
    partnerId,
    templateId,
    stageDone: s.byPartner[partnerId]?.stageDone ?? {},
    vertical,
    updatedAt: new Date().toISOString(),
  };
  save(s);
  return s.byPartner[partnerId];
}

export function togglePartnerPlaybookStage(partnerId: string, stageId: PlaybookStageId, done: boolean) {
  const s = load();
  const cur = s.byPartner[partnerId] ?? {
    partnerId,
    templateId: 'anna_apparel_design_tech' as PlaybookTemplateId,
    stageDone: {},
    updatedAt: new Date().toISOString(),
  };
  cur.stageDone[stageId] = done;
  cur.updatedAt = new Date().toISOString();
  s.byPartner[partnerId] = cur;
  save(s);
  return cur;
}
