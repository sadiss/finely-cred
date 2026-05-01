import type { PartnerMessage } from '../domain/messages';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.messages.v1';
type Store = { messages: PartnerMessage[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { messages: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listMessagesByPartner(partnerId: string): PartnerMessage[] {
  return loadStore().messages
    .filter((m) => m.partnerId === partnerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createMessage(args: Omit<PartnerMessage, 'id' | 'createdAt'>): PartnerMessage {
  const store = loadStore();
  const msg: PartnerMessage = {
    id: newId('msg'),
    createdAt: new Date().toISOString(),
    ...args,
  };
  store.messages.push(msg);
  saveStore(store);
  return msg;
}

export function getMessage(id: string): PartnerMessage | null {
  return loadStore().messages.find((m) => m.id === id) ?? null;
}
