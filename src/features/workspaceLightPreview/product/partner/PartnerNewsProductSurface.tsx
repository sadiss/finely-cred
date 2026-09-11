import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Newspaper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { getPartnerSync } from '../../../../data/partnersRepo';
import { partnerPreferredVoice } from '../../../../lib/haitianVoice';
import {
  loadPartnerNewsToday,
  partnerNewsActionLabel,
  partnerNewsActionPath,
  type PartnerNewsStory,
} from '../../../../lib/partnerNewsToday';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import './partnerNewsProductSurface.css';

const ACCENTS = ['sky', 'emerald', 'violet', 'rose'] as const;

export default function PartnerNewsProductSurface({ role, pageId, partnerId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const resolvePath = usePartnerProductPathResolver();
  const { partner: sessionPartner } = usePartnerSession();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const archetype = getWorkspaceProductArchetype('partner', pageId);
  const partner = (partnerId ? getPartnerSync(partnerId) : null) ?? sessionPartner;
  const voice = partnerPreferredVoice(partner);
  const [stories, setStories] = useState<PartnerNewsStory[]>([]);
  const [liveCount, setLiveCount] = useState(0);
  const [sources, setSources] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadPartnerNewsToday().then((pack) => {
      if (cancelled) return;
      setStories(pack.stories);
      setLiveCount(pack.liveCount);
      setSources(pack.sourcesLive);
      setSelectedId(pack.stories[0]?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => (filter === 'all' ? stories : stories.filter((s) => s.source === filter)),
    [filter, stories],
  );
  const selected = filtered.find((s) => s.id === selectedId) ?? filtered[0] ?? null;

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Restore · this week"
      title="Credit news"
      description="See government and news headlines, what they mean for your file, and one useful action."
      accent={navItem?.accent ?? 'sky'}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon ?? Newspaper}
      primaryAction={
        <ProductPagePrimaryAction
          label="Ask Finely"
          onClick={() =>
            openProductCopilot({
              prompt: selected
                ? `Explain this credit headline for a partner: ${selected.headline}`
                : 'What should I do with this week’s credit news?',
              contextLabel: 'Credit news',
            })
          }
        />
      }
    >
      <div className="fc-newsroom">
        <header className="fc-news-masthead">
          <div className="fc-news-masthead__live">
            <i aria-hidden />
            {liveCount ? `${liveCount} live sources` : 'This week'}
          </div>
          <h2 className="fc-news-shine">{liveCount ? 'Live' : 'News'}</h2>
          <p>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Scores still
            come from the report you upload.
          </p>
          <div className="fc-news-sources" role="tablist" aria-label="News sources">
            <button type="button" data-on={filter === 'all' ? '1' : '0'} onClick={() => setFilter('all')}>
              All
            </button>
            {sources.map((source) => (
              <button
                key={source}
                type="button"
                data-on={filter === source ? '1' : '0'}
                onClick={() => {
                  setFilter(source);
                  const first = stories.find((s) => s.source === source);
                  if (first) setSelectedId(first.id);
                }}
              >
                {source}
              </button>
            ))}
          </div>
        </header>

        <div className="fc-news-stage">
          <div className="fc-news-runway" role="list">
            {filtered.map((story, index) => {
              const accent = ACCENTS[index % 4];
              return (
                <button
                  key={story.id}
                  type="button"
                  className="fc-news-card"
                  data-accent={accent}
                  data-on={selected?.id === story.id ? '1' : '0'}
                  onClick={() => setSelectedId(story.id)}
                >
                  <div className="fc-news-card__src">
                    {story.source}
                    {story.when ? ` · ${story.when}` : ''}
                  </div>
                  <h3 className={`mt-2 text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{story.headline}</h3>
                  <p className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY}`}>{story.detail}</p>
                </button>
              );
            })}
          </div>

          {selected ? (
            <aside className="fc-news-inspector">
              <p className={FINELY_OS_ENTITY_SUBLABEL}>{selected.source}</p>
              <h3 className={`mt-2 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{selected.headline}</h3>
              {voice === 'ht' ? (
                <p className={`mt-3 text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{selected.meaningHt}</p>
              ) : null}
              <p className={`mt-3 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{selected.meaning}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {selected.href ? (
                  <a className={FINELY_OS_PRIMARY_BTN} href={selected.href} target="_blank" rel="noreferrer">
                    {partnerNewsActionLabel('open_source', true)} <ArrowRight size={16} />
                  </a>
                ) : null}
                {selected.cta !== 'open_source' ? (
                  <button
                    type="button"
                    className={selected.href ? FINELY_OS_SECONDARY_BTN : FINELY_OS_PRIMARY_BTN}
                    onClick={() => navigate(resolvePath(partnerNewsActionPath(selected.cta)))}
                  >
                    {partnerNewsActionLabel(selected.cta, false)}
                  </button>
                ) : null}
              </div>
            </aside>
          ) : (
            <aside className="fc-news-inspector">
              <p className={FINELY_OS_ENTITY_BODY}>No headlines yet — your weekly restore steps still apply.</p>
            </aside>
          )}
        </div>
        <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </div>
    </ProductHubScaffold>
  );
}
