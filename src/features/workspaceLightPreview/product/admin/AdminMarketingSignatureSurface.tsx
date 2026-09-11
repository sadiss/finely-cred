import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Compass,
  Megaphone,
  Radio,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadOwnerTodayRows } from '../../../../lib/ownerTodayDeck';
import {
  formatLoopLastRun,
  listMarketingChannelLoops,
  runEnabledDailyPackIfDue,
  setMarketingChannelLoop,
  type MarketingChannelLoop,
} from '../../../../lib/marketingChannelLoops';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import './adminMarketingSignature.css';

const MORE_ROOMS = [
  { label: 'Desk', href: '/admin/marketing-desk', accent: 'emerald' as const },
  { label: 'Data feeds', href: '/admin/data-feeds', accent: 'violet' as const },
  { label: 'Growth agents', href: '/admin/growth-agents', accent: 'sky' as const },
  { label: 'Director', href: '/admin/cmo', accent: 'rose' as const },
  { label: 'Geo', href: '/admin/geo-war-room', accent: 'emerald' as const },
  { label: 'Experiments', href: '/admin/funnel-experiments', accent: 'violet' as const },
  { label: 'Studio', href: '/admin/content-studio', accent: 'sky' as const },
  { label: 'Automation', href: '/admin/growth-automation', accent: 'rose' as const },
];

function capabilityLabel(loop: MarketingChannelLoop): string {
  if (loop.capability === 'live') return 'Live';
  if (loop.capability === 'paste_pack') return 'Paste pack';
  return 'Needs account';
}

export default function AdminMarketingSignatureSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const [tick, setTick] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setTick((n) => n + 1);
    window.addEventListener('finely:store', refresh as EventListener);
    void runEnabledDailyPackIfDue().then(refresh);
    return () => window.removeEventListener('finely:store', refresh as EventListener);
  }, []);

  const loops = useMemo(() => {
    void tick;
    return listMarketingChannelLoops();
  }, [tick]);

  const todayCount = useMemo(() => {
    void tick;
    return loadOwnerTodayRows().length;
  }, [tick]);

  const blocked = loops.find((loop) => loop.capability === 'needs_account' && !loop.enabled);
  const next = todayCount
    ? {
        title: `${todayCount} item${todayCount === 1 ? '' : 's'} waiting on Today`,
        detail: 'Approve or skip one row. Marketing stays here for the next send.',
        cta: 'Open Today',
        href: '/admin/today',
      }
    : blocked
      ? {
          title: `Turn on ${blocked.label}`,
          detail: blocked.detail,
          cta: 'Turn it on',
          href: '#turn-on',
        }
      : {
          title: 'Nothing waiting — post today’s draft',
          detail: 'Social Hub has the pack. Guides stay one click away.',
          cta: 'Open Post',
          href: '/admin/social-hub',
        };

  const goNext = () => {
    if (next.href.startsWith('#')) {
      document.getElementById('turn-on')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    navigate(next.href);
  };

  const toggleLoop = (loop: MarketingChannelLoop) => {
    if (!loop.canToggle || busyId) return;
    setBusyId(loop.id);
    void setMarketingChannelLoop(loop.id, !loop.enabled)
      .then((message) => {
        setNotice(message);
        setTick((n) => n + 1);
      })
      .finally(() => setBusyId(null));
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Growth · marketing"
      title="Marketing"
      description="Turn channels on, publish posts, and open guides. Additional rooms stay under More."
      accent={navItem?.accent ?? 'emerald'}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon ?? Megaphone}
      status={todayCount ? `${todayCount} waiting on Today` : 'Clear'}
      primaryAction={<ProductPagePrimaryAction label={next.cta} onClick={goNext} />}
      secondaryAction={
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/today')}>
          Today
        </button>
      }
    >
      <div className="fc-mkt-home">
        <button type="button" className="fc-mkt-next" onClick={goNext}>
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Your next step</span>
          <strong>{next.title}</strong>
          <em>{next.detail}</em>
          <span className={FINELY_OS_PRIMARY_BTN}>
            {next.cta} <ArrowRight size={14} />
          </span>
        </button>

        <div className="fc-mkt-jobs" aria-label="Marketing jobs">
          <a className="fc-mkt-job" data-accent="emerald" data-shape="rail" href="#turn-on">
            <Radio size={22} />
            <b>Turn it on</b>
            <span>Each channel runs on its own schedule.</span>
          </a>
          <button
            type="button"
            className="fc-mkt-job"
            data-accent="violet"
            data-shape="cut"
            onClick={() => navigate('/admin/social-hub')}
          >
            <Megaphone size={22} />
            <b>Post</b>
            <span>Captions, the queue, and connected sends.</span>
          </button>
          <button
            type="button"
            className="fc-mkt-job"
            data-accent="sky"
            data-shape="band"
            onClick={() => navigate('/admin/lead-magnets')}
          >
            <BookOpen size={22} />
            <b>Guides</b>
            <span>Lead magnets that capture partners.</span>
          </button>
          <button
            type="button"
            className="fc-mkt-job"
            data-accent="rose"
            data-shape="ticket"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
          >
            <Compass size={22} />
            <b>More rooms</b>
            <span>Desk, director, markets, studio, and growth staff.</span>
          </button>
        </div>

        {moreOpen ? (
          <div className="fc-mkt-more" aria-label="Additional rooms">
            {MORE_ROOMS.map((room) => (
              <button
                key={room.href}
                type="button"
                className="fc-mkt-more-chip"
                data-accent={room.accent}
                onClick={() => navigate(room.href)}
              >
                {room.label}
              </button>
            ))}
          </div>
        ) : null}

        {notice ? <p className={`fc-mkt-notice ${FINELY_OS_ENTITY_BODY}`}>{notice}</p> : null}

        <section id="turn-on" className="fc-mkt-loops" aria-label="Channel loops">
          <div className="fc-mkt-loops-head">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Who sends</p>
            <h2>Each channel on its own schedule</h2>
          </div>
          <div className="fc-mkt-loop-grid">
            {loops.map((loop) => (
              <article key={loop.id} className="fc-mkt-loop" data-accent={loop.accent} data-shape={loop.shape}>
                <div className="fc-mkt-loop-top">
                  <Sparkles size={16} />
                  <strong>{loop.label}</strong>
                  <em data-owner={loop.owner}>{loop.owner === 'machine' ? 'Machine' : 'You'}</em>
                </div>
                <p>{loop.detail}</p>
                <div className="fc-mkt-loop-meta">
                  <span>{capabilityLabel(loop)}</span>
                  <span>Last {formatLoopLastRun(loop.lastRunAt)}</span>
                  <span>{loop.nextRunLabel}</span>
                </div>
                <div className="fc-mkt-loop-actions">
                  {loop.canToggle ? (
                    <button
                      type="button"
                      className={loop.enabled ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
                      disabled={busyId === loop.id}
                      onClick={() => toggleLoop(loop)}
                    >
                      {busyId === loop.id ? 'Saving…' : loop.enabled ? 'On' : 'Off'}
                    </button>
                  ) : (
                    <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(loop.href)}>
                      Open setup
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <p className="fc-wlp-section-description fc-wlp-compliance-line">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </div>
    </ProductHubScaffold>
  );
}
