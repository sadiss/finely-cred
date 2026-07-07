/**
 * Tenant-scoped JSON state in Supabase (staff_platform_state) with in-memory cache.
 * Replaces localStorage for admin staffing surfaces.
 */
import { FINELY_TENANT_ID } from '../domain/tenants';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const cache = new Map<string, unknown>();
const hydratedKeys = new Set<string>();

function cacheKey(tenantId: string, stateKey: string) {
  return `${tenantId}::${stateKey}`;
}

export function loadTenantState<T>(stateKey: string, fallback: T, tenantId = FINELY_TENANT_ID): T {
  const key = cacheKey(tenantId, stateKey);
  if (hydratedKeys.has(key) && cache.has(key)) return cache.get(key) as T;
  return fallback;
}

export function saveTenantState<T>(stateKey: string, data: T, tenantId = FINELY_TENANT_ID): T {
  const key = cacheKey(tenantId, stateKey);
  cache.set(key, data);
  hydratedKeys.add(key);
  void persistTenantState(stateKey, data, tenantId);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('finely:store', { detail: { key: stateKey } }));
  }
  return data;
}

export function seedTenantState<T>(stateKey: string, data: T, tenantId = FINELY_TENANT_ID): T {
  const key = cacheKey(tenantId, stateKey);
  if (hydratedKeys.has(key)) return cache.get(key) as T;
  cache.set(key, data);
  hydratedKeys.add(key);
  return data;
}

async function persistTenantState(stateKey: string, data: unknown, tenantId: string) {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from('staff_platform_state').upsert(
      {
        tenant_id: tenantId,
        state_key: stateKey,
        payload: data as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id,state_key' },
    );
    if (error) console.warn('[tenantStateRepo] persist failed', stateKey, error.message);
  } catch (err) {
    console.warn('[tenantStateRepo] persist error', stateKey, err);
  }
}

export async function hydrateTenantStateFromSupabase<T>(
  stateKey: string,
  fallback: T,
  tenantId = FINELY_TENANT_ID,
): Promise<T> {
  const key = cacheKey(tenantId, stateKey);
  if (!isSupabaseConfigured) {
    seedTenantState(stateKey, fallback, tenantId);
    return fallback;
  }

  try {
    const { data, error } = await supabase
      .from('staff_platform_state')
      .select('payload')
      .eq('tenant_id', tenantId)
      .eq('state_key', stateKey)
      .maybeSingle();

    if (error) {
      console.warn('[tenantStateRepo] hydrate failed', stateKey, error.message);
      seedTenantState(stateKey, fallback, tenantId);
      return fallback;
    }

    if (data?.payload && typeof data.payload === 'object') {
      const next = data.payload as T;
      cache.set(key, next);
      hydratedKeys.add(key);
      return next;
    }
  } catch (err) {
    console.warn('[tenantStateRepo] hydrate error', stateKey, err);
  }

  seedTenantState(stateKey, fallback, tenantId);
  return fallback;
}

export async function pushTenantStateToSupabase<T>(stateKey: string, data: T, tenantId = FINELY_TENANT_ID) {
  seedTenantState(stateKey, data, tenantId);
  await persistTenantState(stateKey, data, tenantId);
}

/** One-time localStorage migration into memory (then persisted to Supabase on next save). */
export function migrateLegacyLocalJson<T>(legacyKey: string, fallback: T, version = 1): T | null {
  try {
    const raw = localStorage.getItem(legacyKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v?: number; data?: T } | T;
    if (parsed && typeof parsed === 'object' && 'v' in parsed && parsed.v === version && parsed.data) {
      localStorage.removeItem(legacyKey);
      return parsed.data;
    }
    if (parsed && typeof parsed === 'object') {
      localStorage.removeItem(legacyKey);
      return parsed as T;
    }
  } catch {
    /* ignore */
  }
  return null;
}
