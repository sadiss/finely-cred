import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  approveDataFeedAction,
  dismissDataFeedAction,
  enqueueDataFeedAction,
  listDataFeedActions,
} from '../../../../data/dataFeedActionQueueRepo';
import { queueDailyAuthorityPack } from '../../../../lib/dailyAuthorityPack';
import { loadDataFeedsToday, type DataFeedStory, type DataFeedTopic } from '../../../../lib/dataFeedsToday';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import './adminDataFeedsProductSurface.css';

const TOPICS: Array<{ id: DataFeedTopic; label: string }> = [
  { id: 'marketing', label: 'Marketing firehose' },
  { id: 'credit', label: 'Credit conditions' },
  { id: 'debt', label: 'Debt & courts' },
];

export default function AdminDataFeedsProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const [stories, setStories] = useState<DataFeedStory[]>([]);
  const [liveCount, setLiveCount] = useState(0);
  const [setupCount, setSetupCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [packBusy, setPackBusy] = useState(false);

  const refreshQueue = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadDataFeedsToday().then((pack) => {
      if (cancelled) return;
      setStories(pack.stories);
      setLiveCount(pack.liveCount);
      setSetupCount(pack.setupCount);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const pending = useMemo(() => {
    void tick;
    return listDataFeedActions('pending');
  }, [tick]);

  const queueStory = (story: DataFeedStory) => {
    enqueueDataFeedAction({
      source: story.source,
      headline: story.headline,
      detail: story.detail,
      href: story.href,
      cta: story.cta,
    });
    refreshQueue();
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Growth · live feeds"
      title="Data feeds"
      description="Live headlines become today’s queue. Approve a row to create a Marketing Desk task."
      accent={navItem?.accent ?? 'sky'}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon ?? Radio}
      status={`${liveCount} live · ${setupCount} need a key`}
      primaryAction={
        <ProductPagePrimaryAction
          label={packBusy ? 'Queuing pack…' : 'Queue this week’s pack'}
          disabled={packBusy}
          onClick={() => {
            setPackBusy(true);
            void queueDailyAuthorityPack()
              .then(() => refreshQueue())
              .finally(() => setPackBusy(false));
          }}
        />
      }
      secondaryAction={
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/marketing-desk')}>
          Marketing Desk
        </button>
      }
    >
      <div className="fc-data-feeds">
        <div>
          <div className="fc-data-feeds-pulse">
            <div className="fc-data-feeds-pulse-kicker">Assignment board</div>
            <h2 className="fc-data-feeds-pulse-title">What just moved</h2>
            <p className="fc-data-feeds-pulse-body">
              GDELT, Federal Register, FRED, Congress, Guardian, CFPB, and courts. Each ticket can become an email,
              post, or book task — nothing sends until you approve.
            </p>
          </div>

          <div className="fc-data-feeds-columns">
            {TOPICS.map((topic) => {
              const rows = stories.filter((s) => s.topic === topic.id);
              return (
                <div key={topic.id} className="fc-data-feeds-col" data-topic={topic.id}>
                  <div className="fc-data-feeds-col-label">{topic.label}</div>
                  {loading && !rows.length ? (
                    <p className={FINELY_OS_ENTITY_BODY}>Loading this lane…</p>
                  ) : (
                    rows.slice(0, 5).map((story) => (
                      <button
                        key={story.id}
                        type="button"
                        className="fc-data-feeds-ticket"
                        data-live={story.live ? 'true' : 'false'}
                        onClick={() => queueStory(story)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="fc-data-feeds-ticket-source">{story.source}</span>
                          <span className={story.live ? finelyOsStatusChip('ok') : finelyOsStatusChip('warn')}>
                            {story.live ? 'Live' : 'Setup'}
                          </span>
                        </div>
                        <div className="fc-data-feeds-ticket-title">{story.headline}</div>
                        <div className="fc-data-feeds-ticket-detail">{story.detail}</div>
                      </button>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="fc-data-feeds-rail">
          <div className="fc-data-feeds-pulse-kicker" style={{ color: '#f9a8d4' }}>
            Today
          </div>
          <h3 className="fc-data-feeds-rail-title">Needs a human</h3>
          <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Approve to put a task on the Marketing Desk. Dismiss to drop it.
          </p>
          <FinelyOsPaginatedStack
            items={pending}
            pageSize={6}
            emptyMessage="Queue a ticket from the board."
            renderItem={(row) => (
              <div key={row.id} className="fc-data-feeds-rail-item">
                <div className="text-sm font-extrabold text-white">{row.headline}</div>
                <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  {row.source} · {row.cta}
                </p>
                <div className="fc-data-feeds-rail-actions">
                  <button
                    type="button"
                    className={FINELY_OS_PRIMARY_BTN}
                    onClick={() => {
                      approveDataFeedAction(row.id);
                      refreshQueue();
                      navigate('/admin/marketing-desk');
                    }}
                  >
                    Approve <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    className={FINELY_OS_SECONDARY_BTN}
                    onClick={() => {
                      dismissDataFeedAction(row.id);
                      refreshQueue();
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          />
        </aside>
      </div>
    </ProductHubScaffold>
  );
}
