import React from 'react';
import { Star } from 'lucide-react';
import { ProductStatusPill } from '../ProductUi';
import { deriveMatrixColumns, deriveRecommendedId } from './archetypeDerive';
import { ArchetypeEmptyState, ArchetypeSkeleton, ArchSpectrumBar } from './archetypeChrome';
import type { MatrixAttributeDef, ProductMatrixLayoutProps } from './archetypeTypes';
import type { ProductCollectionItem } from '../ProductCollectionSurface';

const DEFAULT_ATTRIBUTES: MatrixAttributeDef[] = [
  { id: 'status', label: 'Status' },
  { id: 'priority', label: 'Priority' },
  { id: 'tags', label: 'Tags' },
  { id: 'detail', label: 'Detail' },
];

function renderDefaultAttribute(attributeId: string, item: ProductCollectionItem) {
  switch (attributeId) {
    case 'status':
      return <ProductStatusPill status={item.status} label={item.statusLabel} />;
    case 'priority':
      return <ArchSpectrumBar value={item.priority ?? 0} max={100} accent={item.accent} />;
    case 'tags':
      return item.tags?.length ? (
        <span className="fc-wlp-arch-matrix-tags">{item.tags.slice(0, 3).map((tag) => <em key={tag}>{tag}</em>)}</span>
      ) : (
        <span className="fc-wlp-arch-matrix-muted">—</span>
      );
    default:
      return <span>{item.meta || item.description}</span>;
  }
}

/**
 * Matrix archetype — peer items as columns, attributes as rows, one recommended column highlighted
 * on its own dark "comparison bed" so it reads instantly, tier-card style.
 */
export function ProductMatrixLayout({
  accent,
  items,
  emptyState,
  loading,
  onOpenItem,
  title = 'Compare',
  columns: columnsOverride,
  attributes = DEFAULT_ATTRIBUTES,
  recommendedId: recommendedIdOverride,
}: ProductMatrixLayoutProps) {
  if (loading) return <ArchetypeSkeleton kind="matrix" accent={accent} />;

  if (!items.length) {
    return (
      <ArchetypeEmptyState
        accent={accent}
        title="Nothing to compare yet"
        description="Once there are peer items, they line up here side by side with a recommended column called out."
        action={emptyState}
      />
    );
  }

  const columns = columnsOverride ?? deriveMatrixColumns(items);
  const recommendedId = recommendedIdOverride ?? deriveRecommendedId(columns);
  const gridTemplate = `168px repeat(${columns.length}, minmax(148px, 1fr))`;

  return (
    <div className="fc-wlp-arch-matrix" data-fcm-accent={accent}>
      <div className="fc-wlp-arch-matrix-grid" style={{ gridTemplateColumns: gridTemplate }}>
        <div className="fc-wlp-arch-matrix-corner fcm-depth fcm-specular" data-bed="dark" data-fcm-accent={accent}>
          <span className="fcm-grain" aria-hidden />
          {title}
        </div>
        {columns.map((item, index) => {
          const recommended = item.id === recommendedId;
          return (
            <button
              key={item.id}
              type="button"
              className={`fc-wlp-arch-matrix-colhead${recommended ? ' fcm-depth fcm-specular' : ' fcm-specular'}`}
              data-recommended={recommended ? 'true' : undefined}
              data-bed={recommended ? 'dark' : undefined}
              data-fcm-accent={recommended ? (item.accent ?? accent) : undefined}
              style={{ ['--fc-arch-index' as string]: index }}
              onClick={() => (onOpenItem ? onOpenItem(item) : item.onOpen())}
            >
              {recommended ? <span className="fcm-grain" aria-hidden /> : null}
              {recommended ? (
                <span className="fc-wlp-arch-matrix-recommended-badge">
                  <Star size={11} strokeWidth={2.4} /> Recommended
                </span>
              ) : null}
              <span className="fc-wlp-arch-matrix-colhead-title">{item.title}</span>
              <span className="fc-wlp-arch-matrix-colhead-meta">{item.meta}</span>
            </button>
          );
        })}

        {attributes.map((attribute) => (
          <React.Fragment key={attribute.id}>
            <div className="fc-wlp-arch-matrix-attr fcm-depth fcm-specular" data-bed="dark" data-fcm-accent={accent}>
              <span className="fcm-grain" aria-hidden />
              {attribute.label}
            </div>
            {columns.map((item) => {
              const recommended = item.id === recommendedId;
              return (
                <div
                  key={`${attribute.id}-${item.id}`}
                  className={`fc-wlp-arch-matrix-cell${recommended ? ' fcm-depth fcm-specular' : ''}`}
                  data-recommended={recommended ? 'true' : undefined}
                  data-bed={recommended ? 'dark' : undefined}
                  data-fcm-accent={recommended ? (item.accent ?? accent) : undefined}
                >
                  {attribute.render ? attribute.render(item) : renderDefaultAttribute(attribute.id, item)}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
