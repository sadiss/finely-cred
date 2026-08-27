import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GrowthAgentWorkspaceShell } from './GrowthAgentWorkspaceShell';
import { getGrowthAgent, buildGrowthContentStudioPromoteUrl, buildGrowthContentStudioWizardUrl, GROWTH_AGENT_WAVE0_LANE } from './growthAgentRegistry';
import { getMiriamMaturity } from './growthAgentMaturity';
import { buildGrowthResultsSnapshot } from './growthResultsMetrics';
import { GrowthAgentMiriamCommandGuide } from './GrowthAgentMiriamCommandGuide';
import {
  buildGrowthShortsPack,
  promoteVideoIdForGrowthRecord,
  resolveGrowthPillarVideoRecord,
} from './growthPillarVideoPack';
import {
  buildLaneAcquisitionUrl,
  buildVideoUtmContent,
  LEAD_ACQUISITION_LANES,
} from '../../lib/leadAcquisitionCatalog';
import { getResourceVideo } from '../../data/resourceVideosRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCardCompact,
  finelyOsMicroStat,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';

const POST_CALENDAR_STUB = [
  { id: 'mon-am', day: 'Mon', slot: '9:00 AM', format: 'Hook A reel', status: 'draft' as const },
  { id: 'wed-pm', day: 'Wed', slot: '6:30 PM', format: 'Checklist carousel', status: 'draft' as const },
  { id: 'fri-am', day: 'Fri', slot: '11:00 AM', format: 'Hook B + CTA', status: 'draft' as const },
];

type ShortsDraftRow = { id: string; label: string; body: string };

function parseShortsDraftRows(pack: string): ShortsDraftRow[] {
  if (!pack.trim()) return [];
  const sections: Array<{ label: string; body: string }> = [];
  const blocks = pack.split('\n\n');
  for (const block of blocks) {
    const lines = block.split('\n');
    const head = lines[0]?.replace(/:$/, '').trim();
    if (!head || head.startsWith('SHORTS PACK')) continue;
    sections.push({ label: head, body: lines.slice(1).join('\n').trim() });
  }
  if (!sections.length) {
    return [{ id: 'full', label: 'Full pack', body: pack }];
  }
  return sections.map((s, i) => ({ id: `row-${i}`, label: s.label, body: s.body }));
}

export function GrowthAgentMiriamWorkspace() {
  const navigate = useNavigate();
  const agent = getGrowthAgent('social')!;
  const [tick, setTick] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [posted, setPosted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const pillar = useMemo(() => {
    void tick;
    return resolveGrowthPillarVideoRecord();
  }, [tick]);

  const promoteId = useMemo(() => (pillar ? promoteVideoIdForGrowthRecord(pillar) : undefined), [pillar]);

  const captureUrl = useMemo(() => {
    if (!promoteId) return '';
    const lane = LEAD_ACQUISITION_LANES.find((l) => l.id === GROWTH_AGENT_WAVE0_LANE);
    if (!lane) return '';
    return buildLaneAcquisitionUrl(lane, {
      utmSource: 'growth_agent_miriam',
      utmContent: buildVideoUtmContent(promoteId),
    });
  }, [promoteId]);

  const shortsPack = useMemo(() => {
    if (!pillar) return '';
    return buildGrowthShortsPack({ record: pillar, captureUrl: captureUrl || undefined });
  }, [pillar, captureUrl]);

  const draftRows = useMemo(() => parseShortsDraftRows(shortsPack), [shortsPack]);

  const maturity = useMemo(() => {
    void tick;
    return getMiriamMaturity();
  }, [tick]);

  const results = useMemo(() => buildGrowthResultsSnapshot(), []);

  const resourceLabel = useMemo(() => {
    if (!pillar?.resourceVideoId) return null;
    const rv = getResourceVideo(pillar.resourceVideoId);
    if (!rv) return null;
    return rv.isPublic ? 'Public resource' : 'Draft resource';
  }, [pillar]);

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const togglePosted = (id: string) => {
    setPosted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <GrowthAgentWorkspaceShell
      accent={agent.accent}
      name={agent.name}
      roleTitle={agent.roleTitle}
      mission={agent.mission}
      maturityPercent={maturity.percent}
      maturityLabel={maturity.label}
      headerAside={<GrowthAgentMiriamCommandGuide tick={tick} />}
      alertMessage={
        pillar
          ? `Shorts from "${pillar.title}" — copy tracked CTA before scheduling.`
          : 'Upload pillar in Content Studio or set Esther pillar id — then copy shorts + Hannah link.'
      }
      alertTone={pillar ? 'info' : 'warning'}
      primaryAction={{
        label: copied === 'cta' ? 'CTA copied' : 'Copy tracked CTA',
        onClick: () => {
          if (captureUrl) void copyText('cta', captureUrl);
          else navigate(buildGrowthContentStudioPromoteUrl());
        },
        disabled: !captureUrl,
      }}
      secondaryAction={
        shortsPack
          ? {
              label: copied === 'pack' ? 'Copied' : 'Copy full shorts pack',
              onClick: () => void copyText('pack', shortsPack),
            }
          : undefined
      }
      nextStep={results.todaySentence}
      setupBlock={
        <ul className="space-y-1 text-sm">
          {maturity.items.map((i) => (
            <li key={i.id} className={i.done ? 'text-emerald-300/90' : 'text-amber-200/90'}>
              {i.done ? '✓' : '○'} {i.label}
            </li>
          ))}
        </ul>
      }
      lastRunBlock={
        <p className={FINELY_OS_ENTITY_BODY}>
          {pillar ? `${pillar.title} · ${resourceLabel ?? pillar.lifecycle}` : 'No pillar linked'} · {draftRows.length} draft row(s)
        </p>
      }
      statusBlock={
        <ul className="space-y-1 text-sm">
          <li>Hannah link: {captureUrl ? 'ready' : 'needs pillar id'}</li>
          <li>Calendar slots: {POST_CALENDAR_STUB.length}</li>
          <li>Posted (local): {Object.values(posted).filter(Boolean).length}</li>
        </ul>
      }
    >
      {!pillar ? (
        <div className={finelyOsCatalogCardCompact('fuchsia')}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Pillar video</div>
          <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Upload in Content Studio or set Esther&apos;s pillar video id — Miriam builds hooks and captions from upload intel.
          </p>
          <button
            type="button"
            className={`${FINELY_OS_SECONDARY_BTN} mt-3`}
            onClick={() => navigate(buildGrowthContentStudioPromoteUrl())}
          >
            Open promote step
          </button>
          <button
            type="button"
            className={`${FINELY_OS_SECONDARY_BTN} mt-2`}
            onClick={() => navigate(buildGrowthContentStudioWizardUrl({ preset: 'reel_28' }))}
          >
            Open video wizard · reel
          </button>
        </div>
      ) : (
        <>
          <div className={finelyOsCatalogCardCompact('fuchsia')}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Tracked CTA chip</div>
            <p className={`mt-1 text-xs font-semibold text-white truncate`}>{pillar.title}</p>
            <p className={`mt-1 text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
              {resourceLabel ?? pillar.lifecycle} · utm_source=growth_agent_miriam
            </p>
            {captureUrl ? (
              <>
                <div className={`mt-2 text-[10px] font-mono break-all ${FINELY_OS_ENTITY_BODY}`}>{captureUrl}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={copied === 'cta' ? FINELY_OS_SUCCESS_BTN : FINELY_OS_SECONDARY_BTN}
                    onClick={() => void copyText('cta', captureUrl)}
                  >
                    {copied === 'cta' ? 'CTA copied' : 'Copy tracked link'}
                  </button>
                  <button
                    type="button"
                    className={finelyOsMicroStat('amber')}
                    onClick={() => void copyText('utm', buildVideoUtmContent(promoteId!))}
                  >
                    {copied === 'utm' ? 'Copied' : `utm_content=${buildVideoUtmContent(promoteId!).slice(0, 14)}…`}
                  </button>
                  {finelyOsStatusChip('ok')}
                </div>
              </>
            ) : (
              <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>Set pillar id to load Hannah capture URL.</p>
            )}
          </div>

          <div className={finelyOsCatalogCardCompact('fuchsia')}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Shorts pack draft list</div>
            <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
              Copy individual hooks and caption blocks — educational only · results vary.
            </p>
            <button
              type="button"
              className={`${FINELY_OS_PRIMARY_BTN} mt-3`}
              onClick={() =>
                navigate(
                  buildGrowthContentStudioWizardUrl({
                    preset: 'reel_28',
                    videoId: promoteId,
                  }),
                )
              }
            >
              Create reel from pillar
            </button>
            {draftRows.length === 0 ? (
              <p className={`mt-3 text-sm ${FINELY_OS_ENTITY_BODY}`}>Generate pillar in Content Studio first.</p>
            ) : (
              <FinelyOsPaginatedStack
                items={draftRows}
                pageSize={4}
                renderItem={(row) => (
                  <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm space-y-2">
                    <div className="font-semibold text-white">{row.label}</div>
                    <p className={`text-xs whitespace-pre-wrap ${FINELY_OS_ENTITY_BODY}`}>{row.body}</p>
                    <button
                      type="button"
                      className={FINELY_OS_SECONDARY_BTN}
                      onClick={() => void copyText(row.id, row.body)}
                    >
                      {copied === row.id ? 'Copied' : 'Copy block'}
                    </button>
                  </div>
                )}
              />
            )}
          </div>

          <div className={finelyOsCatalogCardCompact('sky')}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Post calendar stub</div>
            <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
              Mark posted locally — Meta scheduler connects in a later wave.
            </p>
            <ul className="mt-3 space-y-2">
              {POST_CALENDAR_STUB.map((slot) => (
                <li key={slot.id} className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-white">
                      {slot.day} · {slot.slot}
                    </span>
                    <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{slot.format}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {posted[slot.id] ? finelyOsStatusChip('ok') : finelyOsStatusChip('warn')}
                    <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => togglePosted(slot.id)}>
                      {posted[slot.id] ? 'Posted' : 'Mark posted'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={FINELY_OS_SECONDARY_BTN}
          onClick={() => navigate(buildGrowthContentStudioPromoteUrl(promoteId))}
        >
          Content Studio promote
        </button>
        <button
          type="button"
          className={FINELY_OS_SECONDARY_BTN}
          onClick={() =>
            navigate(
              buildGrowthContentStudioWizardUrl({
                preset: 'reel_28',
                videoId: promoteId,
              }),
            )
          }
        >
          Video wizard · reel
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/growth-agents/capture-links')}>
          Hannah · UTM factory
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/growth-agents/media')}>
          Jordan · shot list
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/marketing-desk?helper=board')}>
          Desk · Board
        </button>
      </div>
    </GrowthAgentWorkspaceShell>
  );
}
