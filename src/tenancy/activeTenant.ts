import { FINELY_TENANT_ID } from '../domain/tenants';
import type { Tenant } from '../domain/tenants';
import { getTenant, getFinelyCredTenant } from '../data/tenantsRepo';

const KEY = 'finely.activeTenantId.v1';

export function getActiveTenantId(): string {
  try {
    const v = localStorage.getItem(KEY);
    return (v || '').trim() || FINELY_TENANT_ID;
  } catch {
    return FINELY_TENANT_ID;
  }
}

export function setActiveTenantId(id: string) {
  const next = (id || '').trim() || FINELY_TENANT_ID;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // ignore
  }
  try {
    window.dispatchEvent(new Event('finely:store'));
  } catch {
    // ignore
  }
}

export function getActiveTenant(): Tenant {
  const id = getActiveTenantId();
  return getTenant(id) ?? getFinelyCredTenant();
}

function hexToRgbTriplet(hex: string): string | null {
  const raw = (hex || '').trim().replace(/^#/, '');
  if (raw.length === 3) {
    const r = parseInt(raw[0] + raw[0], 16);
    const g = parseInt(raw[1] + raw[1], 16);
    const b = parseInt(raw[2] + raw[2], 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return `${r} ${g} ${b}`;
  }
  if (raw.length === 6) {
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return `${r} ${g} ${b}`;
  }
  return null;
}

export function applyTenantBranding(tenant: Tenant) {
  try {
    const root = document.documentElement;
    // Default is a richer "true gold" (less orange) to match the Finely Gold card.
    const primaryHex = tenant.settings.primaryColor || '#fbbf24';
    const rgb = hexToRgbTriplet(primaryHex) ?? '251 191 36';
    root.style.setProperty('--brand-primary', primaryHex);
    root.style.setProperty('--brand-primary-rgb', rgb);

    const brandName = tenant.settings.brandName || tenant.name || 'Finely Cred';
    root.style.setProperty('--brand-name', brandName);

    // Title
    try {
      document.title = brandName;
    } catch {
      // ignore
    }

    // Favicon
    const faviconUrl = tenant.settings.faviconUrl || '';
    if (faviconUrl) {
      const link =
        (document.querySelector('link[rel="icon"]') as HTMLLinkElement | null) ??
        (document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement | null);
      if (link) link.href = faviconUrl;
    }
  } catch {
    // ignore
  }
}

