import React from 'react';
import { ArrowRight, Radio } from 'lucide-react';
import { deriveProductCollectionActionLabel } from '../productCollectionActionLabel';
import { ProductStatusPill } from '../ProductUi';
import { defaultFeedGroupBy, deriveFeedActor, deriveFeedGroups, sortByPriority } from './archetypeDerive';
import { ArchetypeEmptyState, ArchetypeSkeleton } from './archetypeChrome';
import type { ProductFeedLayoutProps } from './archetypeTypes';

/**
 * Feed archetype — reverse-chronological stream with date dividers, actor avatars, and inline
 * actions. The composer bar and one pinned announcement are the only dark moments on the page.
 */
export function ProductFeedLayout({
  accent,
  items,
  emptyState,
  loading,
  onOpenItem,
  groupBy = defaultFeedGroupBy,
  getActor = deriveFeedActor,
  composerLabel = "What's new",
  pinnedItemId,
}: ProductFeedLayoutProps) {
  if (loading) return <ArchetypeSkeleton kind="feed" accent={accent} />;

  if (!items.length) {
    return (
      <ArchetypeEmptyState
        accent={accent}
        title="Nothing in the stream yet"
        description="New activity will show up here first, newest on top, with a date divider between days."
        action={emptyState}
      />
    );
  }

  const pinned = pinnedItemId
    ? items.find((item) => item.id === pinnedItemId)
    : sortByPriority(items)[0];
  const rest = pinned ? items.filter((item) => item.id !== pinned.id) : items;
  const groups = deriveFeedGroups(rest, groupBy);

  let rowIndex = 0;

  return (
    <div className="fc-wlp-arch-feed" data-fcm-accent={accent}>
      <div className="fc-wlp-arch-feed-composer fcm-depth fcm-specular" data-bed="dark" data-fcm-accent={accent}>
        <span className="fcm-grain" aria-hidden />
        <span className="fc-wlp-arch-feed-live">
          <Radio size={13} strokeWidth={2.4} /> Live
        </span>
        <span>{composerLabel}</span>
      </div>

      {pinned ? (
        <article
          className="fc-wlp-arch-feed-pinned fcm-depth fcm-specular"
          data-bed="dark"
          data-fcm-accent={pinned.accent ?? accent}
        >
          <span className="fcm-grain" aria-hidden />
          <div className="fc-wlp-arch-feed-pinned-head">
            <span className="fc-wlp-arch-feed-pinned-badge">Pinned · needs you now</span>
            <ProductStatusPill status={pinned.status} label={pinned.statusLabel} />
          </div>
          <strong>{pinned.title}</strong>
          <span className="fc-wlp-arch-feed-pinned-copy">{pinned.description}</span>
          {deriveProductCollectionActionLabel(pinned) ? (
            <button
              type="button"
              className="fc-wlp-arch-feed-pinned-action"
              onClick={() => (onOpenItem ? onOpenItem(pinned) : pinned.onOpen())}
            >
              {deriveProductCollectionActionLabel(pinned)} <ArrowRight size={14} />
            </button>
          ) : null}
        </article>
      ) : null}

      {groups.map((group) => (
        <div key={group.key} className="fc-wlp-arch-feed-group">
          <div className="fc-wlp-arch-feed-divider">
            <span>{group.label}</span>
          </div>
          {group.items.map((item) => {
            const actor = getActor(item);
            const index = rowIndex;
            rowIndex += 1;
            return (
              <div key={item.id} className="fc-wlp-arch-feed-item" style={{ ['--fc-arch-index' as string]: index }}>
                <span className="fc-wlp-arch-feed-avatar" data-accent={actor.accent} aria-hidden>
                  {actor.initials}
                </span>
                <div className="fc-wlp-arch-feed-body">
                  <div className="fc-wlp-arch-feed-top">
                    <strong>{item.title}</strong>
                    <ProductStatusPill status={item.status} label={item.statusLabel} />
                  </div>
                  <p>{item.description}</p>
                  {item.tags?.length ? (
                    <div className="fc-wlp-arch-feed-tags">
                      {item.tags.slice(0, 4).map((tag) => <em key={tag}>{tag}</em>)}
                    </div>
                  ) : null}
                </div>
                {deriveProductCollectionActionLabel(item) ? (
                  <button
                    type="button"
                    className="fc-wlp-arch-feed-action"
                    onClick={() => (onOpenItem ? onOpenItem(item) : item.onOpen())}
                  >
                    {deriveProductCollectionActionLabel(item)} <ArrowRight size={13} />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
