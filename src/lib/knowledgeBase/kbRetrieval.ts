import { retrieveKnowledgeSync } from '../knowledgeBaseRouter';

export { detectKbLang } from './kbLang';

/** @deprecated use retrieveKnowledge from knowledgeBaseRouter */
export function retrieveKnowledgeBase(query: string, lang: 'en' | 'ht', limit = 6): string {
  return retrieveKnowledgeSync(query, lang, limit);
}
