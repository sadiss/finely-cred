import type { SecretVaultIntel, SecretVaultItem } from '../domain/secretVault';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export type VaultIntelRequest = {
  action: 'analyze_item' | 'web_research' | 'generate_secrets';
  tenantId: string;
  title: string;
  notes?: string;
  sourceUrl?: string;
  mediaKind?: string;
  tags?: string[];
  researchDepth?: 'quick' | 'deep';
};

export async function runVaultIntelligence(req: VaultIntelRequest): Promise<SecretVaultIntel> {
  if (!isSupabaseConfigured) {
    return buildOfflineIntel(req);
  }
  const { data, error } = await supabase.functions.invoke('vault-intelligence', { body: req });
  if (error) throw new Error(error.message || 'Vault intelligence failed.');
  const intel = (data as any)?.intel as SecretVaultIntel | undefined;
  if (!intel) throw new Error('No intelligence returned.');
  return intel;
}

function buildOfflineIntel(req: VaultIntelRequest): SecretVaultIntel {
  const title = req.title.trim();
  const tags = [...(req.tags ?? [])];
  const queries = [
    `${title} credit repair compliance`,
    `${title} business funding underwriting`,
    `${title} FCRA dispute strategy`,
  ];
  if (req.sourceUrl) {
    try {
      queries.unshift(`site:${new URL(req.sourceUrl).hostname} ${title}`);
    } catch {
      // ignore invalid url
    }
  }
  return {
    summary: `Offline preview for "${title}". Connect Supabase + deploy vault-intelligence for ML-powered analysis and web research.`,
    keyPoints: [
      'Classify asset by media type and tag for role-based sharing.',
      'Link funding-ready partners to Nora Capital readiness API.',
      'Store binaries in encrypted pii bucket; metadata in vault index.',
    ],
    researchQueries: queries,
    suggestedTags: [...new Set([...tags, req.mediaKind ?? 'intel', 'owner-vault'].filter(Boolean))],
    confidence: 0.35,
    model: 'offline-heuristic',
    generatedAt: new Date().toISOString(),
  };
}

export async function enrichVaultItemWithIntel(item: SecretVaultItem): Promise<SecretVaultIntel> {
  return runVaultIntelligence({
    action: 'analyze_item',
    tenantId: item.tenantId,
    title: item.title,
    notes: item.notes,
    sourceUrl: item.sourceUrl,
    mediaKind: item.mediaKind,
    tags: item.tags,
    researchDepth: 'deep',
  });
}

export async function generateVaultSecretsBundle(args: {
  tenantId: string;
  items: SecretVaultItem[];
}): Promise<SecretVaultIntel> {
  const titles = args.items.slice(0, 12).map((i) => i.title).join('; ');
  return runVaultIntelligence({
    action: 'generate_secrets',
    tenantId: args.tenantId,
    title: 'Owner vault intelligence bundle',
    notes: `Vault corpus (${args.items.length} items): ${titles}`,
    tags: ['bundle', 'owner-vault', 'ncg-share'],
    researchDepth: 'deep',
  });
}
