import React from 'react';
import { ArrowRight, Folder } from 'lucide-react';
import { deriveProductCollectionActionLabel } from '../productCollectionActionLabel';
import { ProductStatusPill } from '../ProductUi';
import { deriveFocusHero, deriveFocusRail } from './archetypeDerive';
import { ArchetypeEmptyState, ArchetypeSkeleton } from './archetypeChrome';
import type { ProductFocusLayoutProps } from './archetypeTypes';

/**
 * Focus archetype — one dominant hero object on a wide dark stage, with a narrow rail beside it
 * for metadata, context, and secondary actions. Used for reports, letters, tradelines, readiness.
 */
export function ProductFocusLayout({
  accent,
  items,
  emptyState,
  loading,
  onOpenItem,
  hero: heroOverride,
  railTitle = 'Everything else here',
  railDescription = 'Ranked by what needs your attention next.',
  rail: railOverride,
}: ProductFocusLayoutProps) {
  if (loading) return <ArchetypeSkeleton kind="focus" accent={accent} />;

  const hero = heroOverride ?? deriveFocusHero(items);
  const rail = railOverride ?? deriveFocusRail(items, hero?.id);

  if (!hero) {
    return (
      <ArchetypeEmptyState
        accent={accent}
        title="Nothing to feature yet"
        description="Once you have activity here, the most important item takes center stage automatically."
        action={emptyState}
      />
    );
  }

  const HeroIcon = hero.icon ?? Folder;

  return (
    <div className="fc-wlp-arch-focus" data-fcm-accent={accent}>
      <article
        className="fc-wlp-arch-focus-hero fcm-depth fcm-specular"
        data-bed="dark"
        data-fcm-accent={hero.accent ?? accent}
      >
        <span className="fcm-lacquer" data-bed="dark" aria-hidden />
        <span className="fcm-grain" aria-hidden />
        <div className="fc-wlp-arch-focus-hero-body">
          {hero.figure ? (
            <div className="fc-wlp-arch-focus-hero-figure">{hero.figure}</div>
          ) : (
            <span className="fc-wlp-arch-focus-hero-icon fcm-jewel" aria-hidden>
              <HeroIcon size={26} strokeWidth={1.9} />
            </span>
          )}
          <div className="fc-wlp-arch-focus-hero-copy">
            {hero.status ? (
              <div className="fc-wlp-arch-focus-hero-status">
                <ProductStatusPill status={hero.status} label={hero.statusLabel} />
                {hero.meta ? <span>{hero.meta}</span> : null}
              </div>
            ) : null}
            <h3 className="fc-wlp-arch-focus-hero-title">{hero.title}</h3>
            <p className="fc-wlp-arch-focus-hero-copy-text">{hero.description}</p>
            {hero.tags?.length ? (
              <div className="fc-wlp-arch-focus-hero-tags">
                {hero.tags.slice(0, 5).map((tag) => <em key={tag}>{tag}</em>)}
              </div>
            ) : null}
          </div>
          {hero.onOpen && deriveProductCollectionActionLabel(hero) ? (
            <button type="button" className="fc-wlp-arch-focus-hero-action" onClick={hero.onOpen}>
              {deriveProductCollectionActionLabel(hero)} <ArrowRight size={15} />
            </button>
          ) : null}
        </div>
        <span className="fcm-pedestal" aria-hidden />
      </article>

      <aside className="fc-wlp-arch-focus-rail">
        <div className="fc-wlp-arch-focus-rail-head">
          <span className="fc-wlp-arch-focus-rail-title">{railTitle}</span>
          <p className="fc-wlp-arch-focus-rail-description">{railDescription}</p>
        </div>

        <div className="fc-wlp-arch-focus-rail-action fcm-depth fcm-specular" data-bed="dark" data-fcm-accent={accent}>
          <span className="fcm-grain" aria-hidden />
          <span className="fc-wlp-arch-focus-rail-action-count">{rail.length}</span>
          <span className="fc-wlp-arch-focus-rail-action-label">item{rail.length === 1 ? '' : 's'} waiting behind this</span>
        </div>

        {rail.length ? (
          <div className="fc-wlp-arch-focus-rail-list">
            {rail.map((item, index) => {
              const Icon = item.icon ?? Folder;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="fc-wlp-arch-focus-rail-item"
                  data-accent={item.accent}
                  style={{ ['--fc-arch-index' as string]: index }}
                  onClick={() => (onOpenItem ? onOpenItem(item) : item.onOpen())}
                >
                  <span className="fc-wlp-arch-focus-rail-item-icon">
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  <span className="fc-wlp-arch-focus-rail-item-copy">
                    <strong>{item.title}</strong>
                    <span>{item.meta}</span>
                  </span>
                  <ProductStatusPill status={item.status} label={item.statusLabel} />
                </button>
              );
            })}
          </div>
        ) : (
          emptyState ?? (
            <p className="fc-wlp-arch-focus-rail-empty">Nothing else is queued right now.</p>
          )
        )}
      </aside>
    </div>
  );
}
