import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import type { BookstoreProduct } from '../domain/bookstore';
import { BOOKSTORE_EXTRA_PRODUCTS, BOOKSTORE_RICH_CONTENT } from './bookstoreRichContent';
import {
  BOOKSTORE_CONTENT_VERSION,
  getStoredBookstoreContentVersion,
  markBookstoreContentVersionApplied,
} from './bookstoreContentVersion';

const KEY = 'finely.bookstore.v1';

type Store = { products: BookstoreProduct[] };

function nowIso() {
  return new Date().toISOString();
}

function seed(): BookstoreProduct[] {
  const t = nowIso();
  return [
    {
      id: newId('book'),
      slug: 'sovereign-blueprint',
      title: 'Finely Blueprint',
      sub: 'Personal Restoration',
      vol: '04',
      priceAmount: 49700,
      accentColor: '#f59e0b',
      desc: 'A premium playbook for restoring and stabilizing your personal credit file with evidence discipline and clean execution.',
      bullets: [
        'Report triage and contradiction mapping',
        'Evidence pack structure and labeling rules',
        'Dispute cadence + escalation checkpoints',
        'Utilization control rules for underwriting optics',
      ],
      contentMarkdown:
        BOOKSTORE_RICH_CONTENT['sovereign-blueprint'] ??
        '## Overview\n\nThis is a premium long-form playbook.\n\n## What you will build\n\n- A clean evidence pack\n- A dispute cadence\n- A readiness checklist\n',
      published: true,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: newId('book'),
      slug: 'corporate-architect',
      title: 'Corporate Architect',
      sub: 'Business Structure',
      vol: '02',
      priceAmount: 69700,
      accentColor: '#d4af37',
      desc: 'Boardroom-grade sequencing for entity structure, fundability signals, and vendor stacking discipline.',
      bullets: ['Entity hygiene checklist', 'Fundability matrix', 'Vendor stack sequencing', 'Documentation discipline'],
      contentMarkdown: BOOKSTORE_RICH_CONTENT['corporate-architect'] ?? '## Overview\n\nStructure first; volume later.\n',
      published: true,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: newId('book'),
      slug: 'administrative-remedy',
      title: 'Administrative Remedy',
      sub: 'Legal Escalation',
      vol: '03',
      priceAmount: 99700,
      accentColor: '#94a3b8',
      desc: 'A compliance-safe escalation playbook focused on workflow, documentation, and timing discipline.',
      bullets: ['Response decoding', 'Escalation ladder', 'Template library usage', 'Case tracking'],
      contentMarkdown: BOOKSTORE_RICH_CONTENT['administrative-remedy'] ?? '## Overview\n\nEducational-only escalation workflow support.\n',
      published: true,
      createdAt: t,
      updatedAt: t,
    },
  ];
}

function mergeSeedProducts(products: BookstoreProduct[]): { products: BookstoreProduct[]; dirty: boolean } {
  const t = nowIso();
  let dirty = false;
  const bySlug = new Map(products.map((p) => [p.slug, p] as const));
  const storedContentVersion = getStoredBookstoreContentVersion();
  const forceContentRefresh = storedContentVersion < BOOKSTORE_CONTENT_VERSION;

  for (const [slug, md] of Object.entries(BOOKSTORE_RICH_CONTENT)) {
    const p = bySlug.get(slug);
    if (p && (forceContentRefresh || (p.contentMarkdown?.length ?? 0) < 400)) {
      p.contentMarkdown = md;
      p.updatedAt = t;
      dirty = true;
    }
  }

  for (const extra of BOOKSTORE_EXTRA_PRODUCTS) {
    const existing = bySlug.get(extra.slug);
    if (!existing) {
      products.push({
        id: newId('book'),
        slug: extra.slug,
        title: extra.title,
        sub: extra.sub,
        vol: extra.vol,
        priceAmount: extra.priceAmount,
        accentColor: extra.accentColor,
        desc: extra.desc,
        bullets: extra.bullets,
        contentMarkdown: BOOKSTORE_RICH_CONTENT[extra.slug] ?? `## ${extra.title}\n\n${extra.desc}`,
        published: true,
        createdAt: t,
        updatedAt: t,
      });
      dirty = true;
    } else if (forceContentRefresh) {
      existing.title = extra.title;
      existing.sub = extra.sub;
      existing.vol = extra.vol;
      existing.desc = extra.desc;
      existing.bullets = extra.bullets;
      existing.accentColor = extra.accentColor;
      if (BOOKSTORE_RICH_CONTENT[extra.slug]) {
        existing.contentMarkdown = BOOKSTORE_RICH_CONTENT[extra.slug];
      }
      existing.updatedAt = t;
      dirty = true;
    }
  }

  if (dirty && forceContentRefresh) {
    markBookstoreContentVersionApplied(BOOKSTORE_CONTENT_VERSION);
  }

  return { products, dirty };
}

function loadStore(): Store {
  const store = loadJson<Store>(KEY, { products: [] }, 1);
  if (!store.products.length) {
    const seeded: Store = { products: seed() };
    saveJson(KEY, seeded, 1);
    return seeded;
  }
  const { products: merged, dirty } = mergeSeedProducts(store.products.slice());
  if (dirty) {
    saveJson(KEY, { products: merged }, 1);
    return { products: merged };
  }
  return store;
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listBookstoreProducts(args?: { includeUnpublished?: boolean }): BookstoreProduct[] {
  const includeUnpublished = Boolean(args?.includeUnpublished);
  const all = loadStore().products.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return includeUnpublished ? all : all.filter((p) => p.published);
}

export function getBookstoreProductBySlug(slug: string): BookstoreProduct | null {
  const s = (slug || '').trim().toLowerCase();
  if (!s) return null;
  return loadStore().products.find((p) => p.slug.toLowerCase() === s) ?? null;
}

export function getBookstoreProduct(id: string): BookstoreProduct | null {
  return loadStore().products.find((p) => p.id === id) ?? null;
}

export function createBookstoreProduct(args?: Partial<Pick<BookstoreProduct, 'title' | 'sub' | 'accentColor'>>): BookstoreProduct {
  const t = nowIso();
  const product: BookstoreProduct = {
    id: newId('book'),
    slug: `new-book-${Date.now().toString(16)}`,
    title: (args?.title ?? 'New book').trim() || 'New book',
    sub: (args?.sub ?? 'Resource').trim() || 'Resource',
    vol: '01',
    accentColor: args?.accentColor ?? '#f59e0b',
    priceAmount: 9900,
    desc: 'In-depth resource.',
    bullets: ['Outcome 1', 'Outcome 2', 'Outcome 3'],
    contentMarkdown: '## Chapter 1\n\nWrite your book here.\n',
    published: false,
    createdAt: t,
    updatedAt: t,
  };
  return upsertBookstoreProduct(product);
}

export function upsertBookstoreProduct(product: BookstoreProduct): BookstoreProduct {
  const store = loadStore();
  const t = nowIso();
  const cleaned: BookstoreProduct = {
    ...product,
    slug: (product.slug || '').trim() || product.id,
    title: (product.title || '').trim() || 'Untitled book',
    sub: (product.sub || '').trim() || 'Resource',
    accentColor: (product.accentColor || '').trim() || '#f59e0b',
    desc: (product.desc || '').trim(),
    bullets: (product.bullets || []).map((b) => (b ?? '').toString().trim()).filter(Boolean).slice(0, 24),
    contentMarkdown: (product.contentMarkdown || '').toString(),
    updatedAt: t,
  };
  const idx = store.products.findIndex((p) => p.id === cleaned.id);
  if (idx >= 0) store.products[idx] = cleaned;
  else store.products.push(cleaned);
  saveStore(store);
  return cleaned;
}

export function deleteBookstoreProduct(id: string) {
  const store = loadStore();
  store.products = store.products.filter((p) => p.id !== id);
  saveStore(store);
}

