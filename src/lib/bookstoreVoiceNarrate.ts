import type { BookstoreProduct } from '../domain/bookstore';
import { splitBookIntoChapters } from '../domain/libraryEntitlements';
import { buildDefaultNarration } from '../resources/guideNarration';
import { getPublicVoiceProfile, renderVoiceAsset, getVoiceStudioStatus } from './voiceStudioClient';

export async function narrateBookstoreProduct(args: {
  product: BookstoreProduct;
  force?: boolean;
}): Promise<{ ok: number; failed: number }> {
  const studio = getVoiceStudioStatus();
  if (!studio.available) {
    throw new Error(studio.reason ?? 'Voice Studio not configured.');
  }

  const chapters = splitBookIntoChapters(args.product.contentMarkdown ?? '', args.product.slug);
  let ok = 0;
  let failed = 0;

  for (const ch of chapters) {
    const narration = buildDefaultNarration(
      `ebook-${args.product.slug}-${ch.id}`,
      `${args.product.title} — ${ch.title}`,
      [{ heading: ch.title, bullets: ch.body.split('\n').filter((l) => l.trim().length > 20).slice(0, 14) }],
    );
    try {
      await renderVoiceAsset({
        tenantId: 'finely_cred',
        contentType: 'ebook',
        contentId: `${args.product.slug}-${ch.id}`,
        title: `${args.product.title} — ${ch.title}`,
        narration,
        voiceProfile: getPublicVoiceProfile('finely_cred'),
        force: args.force,
      });
      ok += 1;
    } catch {
      failed += 1;
    }
  }

  return { ok, failed };
}
