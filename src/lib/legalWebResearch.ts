import { supabase, isSupabaseConfigured } from './supabaseClient';
import { LAW_REFERENCES, REGULATORY_PORTALS, type LegalResourceLink } from './legalResources';

export type LegalResearchSnippet = {
  title: string;
  link: string;
  snippet: string;
};

/** Official-first web snippets for coach context (Serper via edge when configured). */
export async function researchLegalTopic(args: {
  query: string;
  topic: 'validation' | 'court' | 'bureau' | 'escalation';
  state?: string;
}): Promise<{ snippets: LegalResearchSnippet[]; fromWeb: boolean }> {
  const q = args.query.trim();
  if (!q) return { snippets: [], fromWeb: false };

  const fallback = curatedFallback(args.topic, args.state);

  if (!isSupabaseConfigured) {
    return { snippets: fallback, fromWeb: false };
  }

  try {
    const { data, error } = await supabase.functions.invoke('legal-research', {
      body: { query: q, topic: args.topic, state: args.state || undefined },
    });
    if (error || !data?.ok) return { snippets: fallback, fromWeb: false };
    const snippets = Array.isArray(data.snippets) ? (data.snippets as LegalResearchSnippet[]) : [];
    if (snippets.length === 0) return { snippets: fallback, fromWeb: false };
    return { snippets: [...snippets, ...fallback].slice(0, 8), fromWeb: true };
  } catch {
    return { snippets: fallback, fromWeb: false };
  }
}

function curatedFallback(topic: string, state?: string): LegalResearchSnippet[] {
  const pool: LegalResourceLink[] = [...LAW_REFERENCES, ...REGULATORY_PORTALS];
  const filtered =
    topic === 'court'
      ? pool.filter((p) => ['cfpb', 'naag', 'fdcpa-1692g', 'ucc-3-308'].includes(p.id))
      : topic === 'bureau'
        ? pool.filter((p) => ['fcra-611', 'fcra-623', 'cfpb'].includes(p.id))
        : pool.filter((p) => ['fdcpa-1692g', 'fcra-623', 'cfpb', 'naag'].includes(p.id));

  const stateNote = state ? ` (${state.trim().toUpperCase()} licensing/SOL may apply)` : '';
  return filtered.map((p) => ({
    title: p.label,
    link: p.href,
    snippet: `${p.hint || 'Official reference'}${stateNote}`,
  }));
}

export function formatResearchForPrompt(snippets: LegalResearchSnippet[]): string {
  if (!snippets.length) return '';
  return snippets
    .map((s, i) => `[${i + 1}] ${s.title}\nURL: ${s.link}\n${s.snippet}`)
    .join('\n\n');
}
