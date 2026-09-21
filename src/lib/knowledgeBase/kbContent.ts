/** Knowledge Base markdown — build-time bundle from docs/knowledge-base */
const modules = import.meta.glob('../../../docs/knowledge-base/**/*.md', { query: '?raw', import: 'default', eager: true });

export type KbDoc = { path: string; lang: 'en' | 'ht'; topic: string; body: string };

export function listKnowledgeBaseDocs(): KbDoc[] {
  const out: KbDoc[] = [];
  for (const [path, body] of Object.entries(modules)) {
    const raw = String(body ?? '');
    const lang = path.includes('/ht/') ? 'ht' : 'en';
    const topic = path.split('/').pop()?.replace('.md', '') ?? 'doc';
    out.push({ path, lang, topic, body: raw });
  }
  return out;
}
