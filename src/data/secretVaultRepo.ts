import type { SecretVaultItem, SecretVaultMediaKind, SecretVaultShareRole } from '../domain/secretVault';
import { nowIso } from '../domain/secretVault';
import { classifyMediaFromFile, classifyMediaFromUrl } from '../lib/secretVaultMedia';
import { defaultShareRolesForMedia } from '../lib/roleCrossRecognition';
import { newId } from '../utils/ids';
import { loadJson, saveJson } from './localJsonStore';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const KEY = 'finely.secretVault.v1';

type Store = {
  items: SecretVaultItem[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { items: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function normalizeItem(item: SecretVaultItem): SecretVaultItem {
  return {
    ...item,
    mediaKind: item.mediaKind ?? (item.type === 'url' ? 'url' : 'document'),
    sharedWithRoles: item.sharedWithRoles ?? defaultShareRolesForMedia(item.mediaKind ?? 'document'),
    shareWithNcg: item.shareWithNcg ?? false,
  };
}

export function listSecretVaultItemsByTenant(tenantId: string): SecretVaultItem[] {
  const t = (tenantId || '').trim();
  if (!t) return [];
  return loadStore()
    .items
    .filter((i) => i.tenantId === t)
    .map(normalizeItem)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSecretVaultItem(id: string): SecretVaultItem | null {
  return loadStore().items.find((i) => i.id === id) ?? null;
}

export function upsertSecretVaultItem(item: SecretVaultItem): SecretVaultItem {
  const store = loadStore();
  const idx = store.items.findIndex((x) => x.id === item.id);
  const next = normalizeItem({ ...item, updatedAt: nowIso() });
  if (idx >= 0) store.items[idx] = next;
  else store.items.push(next);
  saveStore(store);
  void syncSecretVaultItemToSupabase(next);
  return next;
}

export function createSecretVaultFileItem(
  args: Omit<SecretVaultItem, 'id' | 'createdAt' | 'updatedAt' | 'type' | 'mediaKind'> & {
    mediaKind?: SecretVaultMediaKind;
    filename: string;
    mimeType?: string;
  },
): SecretVaultItem {
  const now = nowIso();
  const mediaKind = args.mediaKind ?? classifyMediaFromFile({ name: args.filename, type: args.mimeType });
  return upsertSecretVaultItem({
    id: newId('vault'),
    createdAt: now,
    updatedAt: now,
    type: 'file',
    mediaKind,
    sharedWithRoles: args.sharedWithRoles ?? defaultShareRolesForMedia(mediaKind),
    shareWithNcg: args.shareWithNcg ?? false,
    ...args,
  });
}

export function createSecretVaultUrlItem(
  args: Omit<SecretVaultItem, 'id' | 'createdAt' | 'updatedAt' | 'type' | 'mediaKind' | 'youtubeId'> & {
    sourceUrl: string;
    mediaKind?: SecretVaultMediaKind;
  },
): SecretVaultItem {
  const now = nowIso();
  const classified = classifyMediaFromUrl(args.sourceUrl);
  const mediaKind = args.mediaKind ?? classified.mediaKind;
  return upsertSecretVaultItem({
    id: newId('vault'),
    createdAt: now,
    updatedAt: now,
    type: classified.youtubeId ? 'url' : 'url',
    mediaKind,
    youtubeId: classified.youtubeId,
    sharedWithRoles: args.sharedWithRoles ?? defaultShareRolesForMedia(mediaKind),
    shareWithNcg: args.shareWithNcg ?? (mediaKind === 'youtube' || mediaKind === 'ebook'),
    ...args,
  });
}

export function createSecretVaultIntelItem(
  args: Omit<SecretVaultItem, 'id' | 'createdAt' | 'updatedAt' | 'type' | 'mediaKind'>,
): SecretVaultItem {
  const now = nowIso();
  return upsertSecretVaultItem({
    id: newId('vault_intel'),
    createdAt: now,
    updatedAt: now,
    type: 'intel',
    mediaKind: 'other',
    ...args,
  });
}

export function updateSecretVaultSharing(id: string, patch: { sharedWithRoles?: SecretVaultShareRole[]; shareWithNcg?: boolean }) {
  const cur = getSecretVaultItem(id);
  if (!cur) return null;
  return upsertSecretVaultItem({
    ...cur,
    sharedWithRoles: patch.sharedWithRoles ?? cur.sharedWithRoles,
    shareWithNcg: patch.shareWithNcg ?? cur.shareWithNcg,
  });
}

export function deleteSecretVaultItem(id: string) {
  const store = loadStore();
  store.items = store.items.filter((i) => i.id !== id);
  saveStore(store);
  if (isSupabaseConfigured) {
    void supabase.from('secret_vault_items').delete().eq('id', id);
  }
}

export function listNcgShareableIntel(tenantId: string): SecretVaultItem[] {
  return listSecretVaultItemsByTenant(tenantId).filter((i) => i.shareWithNcg && i.intel?.summary);
}

async function syncSecretVaultItemToSupabase(item: SecretVaultItem) {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('secret_vault_items').upsert(
      {
        id: item.id,
        tenant_id: item.tenantId,
        type: item.type,
        media_kind: item.mediaKind,
        title: item.title,
        notes: item.notes ?? null,
        tags: item.tags ?? [],
        blob_ref: item.blobRef ?? null,
        filename: item.filename ?? null,
        mime_type: item.mimeType ?? null,
        size_bytes: item.sizeBytes ?? null,
        sha256: item.sha256 ?? null,
        source_url: item.sourceUrl ?? null,
        youtube_id: item.youtubeId ?? null,
        intel: item.intel ?? null,
        shared_with_roles: item.sharedWithRoles ?? [],
        share_with_ncg: Boolean(item.shareWithNcg),
        created_at: item.createdAt,
        updated_at: item.updatedAt,
        created_by_user_id: item.createdByUserId ?? null,
      },
      { onConflict: 'id' },
    );
  } catch {
    // Table may not exist until migration applied — local vault still works.
  }
}

export async function pullSecretVaultFromSupabase(tenantId: string) {
  if (!isSupabaseConfigured) return;
  const { data, error } = await supabase
    .from('secret_vault_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false })
    .limit(500);
  if (error || !data?.length) return;

  const store = loadStore();
  const incoming = data.map((r: any) =>
    normalizeItem({
      id: r.id,
      tenantId: r.tenant_id,
      type: r.type,
      mediaKind: r.media_kind,
      title: r.title,
      notes: r.notes ?? undefined,
      tags: r.tags ?? [],
      blobRef: r.blob_ref ?? undefined,
      filename: r.filename ?? undefined,
      mimeType: r.mime_type ?? undefined,
      sizeBytes: r.size_bytes ?? undefined,
      sha256: r.sha256 ?? undefined,
      sourceUrl: r.source_url ?? undefined,
      youtubeId: r.youtube_id ?? undefined,
      intel: r.intel ?? undefined,
      sharedWithRoles: r.shared_with_roles ?? [],
      shareWithNcg: Boolean(r.share_with_ncg),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      createdByUserId: r.created_by_user_id ?? undefined,
    }),
  );
  const ids = new Set(incoming.map((i) => i.id));
  const localOnly = store.items.filter((i) => i.tenantId === tenantId && !ids.has(i.id));
  store.items = [...store.items.filter((i) => i.tenantId !== tenantId), ...incoming, ...localOnly];
  saveStore(store);
}
