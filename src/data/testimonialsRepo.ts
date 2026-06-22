import type { Testimonial, TextTestimonial, VideoTestimonial } from '../domain/testimonials';
import { nowIso } from '../domain/testimonials';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import { FINELY_TENANT_ID } from '../domain/tenants';

const KEY = 'finely.testimonials.v1';

type Store = { testimonials: Testimonial[] };

function seed(): Testimonial[] {
  const now = nowIso();
  const videos: VideoTestimonial[] = [
    {
      kind: 'video',
      id: 'tvid_personal_restore_1',
      tenantId: FINELY_TENANT_ID,
      title: 'Personal Restore — “The first real shift”',
      service: 'Personal Restore',
      visibility: 'draft',
      internalNote: 'Add an embedUrl or videoSrc to publish.',
      createdAt: now,
      updatedAt: now,
    },
    {
      kind: 'video',
      id: 'tvid_business_foundation_1',
      tenantId: FINELY_TENANT_ID,
      title: 'Business Foundation — “Vendor sequencing works”',
      service: 'Business Foundation',
      visibility: 'draft',
      internalNote: 'Add an embedUrl or videoSrc to publish.',
      createdAt: now,
      updatedAt: now,
    },
    {
      kind: 'video',
      id: 'tvid_debt_summons_1',
      tenantId: FINELY_TENANT_ID,
      title: 'Debt & Summons — “Clarity and control”',
      service: 'Debt & Summons',
      visibility: 'draft',
      internalNote: 'Add an embedUrl or videoSrc to publish.',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const texts: TextTestimonial[] = [
    {
      kind: 'text',
      id: 'FC-T-001',
      tenantId: FINELY_TENANT_ID,
      service: 'Personal Restore',
      name: 'Amy Peaks',
      review: 'The month I was laid off is the very same month I was referred to Finely Cred. I joined and haven’t looked back.',
      milestone: 'Clarity + execution',
      amount: '$32,000',
      visibility: 'published',
      createdAt: now,
      updatedAt: now,
    },
    {
      kind: 'text',
      id: 'FC-T-002',
      tenantId: FINELY_TENANT_ID,
      service: 'Business Foundation',
      name: 'Jennifer Boykins',
      review: 'I was skeptical at first but took a leap of faith and was able to qualify for $58,000 in 5 months.',
      milestone: 'Fundability built',
      amount: '$58,000',
      visibility: 'published',
      createdAt: now,
      updatedAt: now,
    },
    {
      kind: 'text',
      id: 'FC-T-003',
      tenantId: FINELY_TENANT_ID,
      service: 'Debt & Summons',
      name: 'Bruce Cunningham',
      review: 'Not only did you resolve issues, you taught me how to think about the system while we executed.',
      milestone: 'Confidence restored',
      amount: '$45,000',
      visibility: 'published',
      createdAt: now,
      updatedAt: now,
    },
  ];

  return [...videos, ...texts];
}

function loadStore(): Store {
  const store = loadJson<Store>(KEY, { testimonials: seed() }, 1);
  // Back-compat migration: older items may not have tenantId.
  store.testimonials = (store.testimonials ?? []).map((t: any) => ({
    ...t,
    tenantId: String(t?.tenantId || FINELY_TENANT_ID),
  })) as any;
  return store;
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listAllTestimonials(): Testimonial[] {
  return loadStore().testimonials.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listTestimonialsByTenant(tenantId: string): Testimonial[] {
  const t = (tenantId || '').trim();
  if (!t) return [];
  return listAllTestimonials().filter((x) => x.tenantId === t);
}

export function listPublishedTestimonialsByTenant(tenantId: string): Testimonial[] {
  return listTestimonialsByTenant(tenantId).filter((t) => t.visibility === 'published');
}

export function upsertTestimonial(t: Testimonial): Testimonial {
  const store = loadStore();
  const idx = store.testimonials.findIndex((x) => x.id === t.id);
  const next: Testimonial = { ...(t as any), updatedAt: nowIso() };
  if (idx >= 0) store.testimonials[idx] = next;
  else store.testimonials.push(next);
  saveStore(store);
  return next;
}

export function createVideoTestimonial(tenantId?: string): VideoTestimonial {
  const now = nowIso();
  const tId = String((tenantId || FINELY_TENANT_ID) ?? FINELY_TENANT_ID);
  const t: VideoTestimonial = {
    kind: 'video',
    id: newId('tvid'),
    tenantId: tId,
    title: 'New video testimonial',
    service: 'Personal Restore',
    visibility: 'draft',
    createdAt: now,
    updatedAt: now,
  };
  upsertTestimonial(t);
  return t;
}

export function createTextTestimonial(tenantId?: string): TextTestimonial {
  const now = nowIso();
  const tId = String((tenantId || FINELY_TENANT_ID) ?? FINELY_TENANT_ID);
  const t: TextTestimonial = {
    kind: 'text',
    id: newId('ttxt'),
    tenantId: tId,
    service: 'Personal Restore',
    name: 'Customer name',
    review: 'Write the review…',
    visibility: 'draft',
    createdAt: now,
    updatedAt: now,
  };
  upsertTestimonial(t);
  return t;
}

export function deleteTestimonial(id: string) {
  const store = loadStore();
  store.testimonials = store.testimonials.filter((t) => t.id !== id);
  saveStore(store);
}

