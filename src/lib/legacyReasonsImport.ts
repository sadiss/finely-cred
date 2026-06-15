import { parseInsertRows } from './legacySqlParser';

export type LegacyReasonCategory = {
  id: number;
  name: string;
  parentId: number;
  deleted: boolean;
};

export type LegacyReasonText = {
  id: number;
  categoryId: number;
  description: string;
  deleted: boolean;
};

export type LegacyReasonsExport = {
  exportedAt: string;
  sourceFile: string;
  categories: LegacyReasonCategory[];
  texts: LegacyReasonText[];
  /** Grouped by top-level category name for DISPUTE_REASONS_LIBRARY merge */
  library: Record<string, { label: string; reasons: string[] }>;
};

function str(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

function slugKey(name: string): string {
  return `legacy_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 48)}`;
}

export function buildLegacyReasonsFromSql(sql: string, sourceFile = 'finelyno_finelycred.sql'): LegacyReasonsExport {
  const catRows = parseInsertRows(sql, 'inaccuracy_categories');
  const textRows = parseInsertRows(sql, 'inaccuracy_text');

  const categories: LegacyReasonCategory[] = catRows.map((r) => ({
    id: Number(r.id),
    name: str(r.name),
    parentId: Number(r.parent ?? 0),
    deleted: false,
  })).filter((c) => c.name && c.name !== 'Add child category');

  const texts: LegacyReasonText[] = textRows
    .map((r) => ({
      id: Number(r.id),
      categoryId: Number(r.category_id),
      description: str(r.description),
      deleted: false,
    }))
    .filter((t) => t.description);

  const byId = new Map(categories.map((c) => [c.id, c]));

  function topLevel(catId: number): LegacyReasonCategory | null {
    let cur = byId.get(catId);
    let guard = 0;
    while (cur && cur.parentId !== 0 && guard++ < 20) {
      cur = byId.get(cur.parentId);
    }
    return cur ?? null;
  }

  const library: Record<string, { label: string; reasons: string[] }> = {};

  for (const t of texts) {
    const cat = byId.get(t.categoryId);
    const top = topLevel(t.categoryId);
    const label = top?.name || cat?.name || 'Legacy Laravel';
    const key = slugKey(label);
    if (!library[key]) library[key] = { label: `Legacy — ${label}`, reasons: [] };
    if (!library[key].reasons.includes(t.description)) {
      library[key].reasons.push(t.description);
    }
  }

  return {
    exportedAt: new Date().toISOString(),
    sourceFile,
    categories,
    texts,
    library,
  };
}
