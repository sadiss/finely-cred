import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GrowthAgentWorkspaceShell } from './GrowthAgentWorkspaceShell';
import { getGrowthAgent, buildGrowthContentStudioPromoteUrl, buildGrowthContentStudioWizardUrl } from './growthAgentRegistry';
import { getJordanMaturity } from './growthAgentMaturity';
import { buildGrowthResultsSnapshot } from './growthResultsMetrics';
import { GrowthAgentJordanCommandGuide } from './GrowthAgentJordanCommandGuide';
import {
  buildGrowthPillarScript,
  buildGrowthShotList,
  promoteVideoIdForGrowthRecord,
  resolveGrowthPillarVideoRecord,
} from './growthPillarVideoPack';
import { buildVideoCommandPromoteUrl } from '../../lib/videoCommandService';
import { getResourceVideo } from '../../data/resourceVideosRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCardCompact,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';

export function GrowthAgentJordanWorkspace() {
  const navigate = useNavigate();
  const agent = getGrowthAgent('media')!;
  const [tick, setTick] = useState(0);
  const [copied, setCopied] = useState<'script' | 'shots' | null>(null);

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

  const pillarScript = useMemo(() => {
    if (!pillar) return '';
    return buildGrowthPillarScript({ record: pillar });
  }, [pillar]);

  const shotList = useMemo(() => {
    if (!pillar) return [];
    return buildGrowthShotList({ record: pillar });
  }, [pillar]);

  const hannahUrl = useMemo(() => {
    if (!pillar) return '';
    return buildVideoCommandPromoteUrl(pillar);
  }, [pillar]);

  const maturity = useMemo(() => {
    void tick;
    return getJordanMaturity();
  }, [tick]);

  const results = useMemo(() => buildGrowthResultsSnapshot(), []);

  const resourceLabel = useMemo(() => {
    if (!pillar?.resourceVideoId) return null;
    const rv = getResourceVideo(pillar.resourceVideoId);
    if (!rv) return null;
    return rv.isPublic ? 'Public resource' : 'Draft resource';
  }, [pillar]);

  const copyText = async (key: 'script' | 'shots', text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <GrowthAgentWorkspaceShell
      accent={agent.accent}
      name={agent.name}
      roleTitle={agent.roleTitle}
      mission={agent.mission}
      maturityPercent={maturity.percent}
      maturityLabel={maturity.label}
      headerAside={<GrowthAgentJordanCommandGuide tick={tick} />}
      alertMessage={
        pillar
          ? `Produce from "${pillar.title}" — open Hannah UTM factory before publishing.`
          : 'Import pillar upload in Content Studio — script and shot list generate from intel.'
      }
      alertTone={pillar ? 'info' : 'warning'}
      primaryAction={{
        label: 'Hannah UTM factory',
        onClick: () => navigate(hannahUrl || '/admin/growth-agents/capture-links'),
        disabled: !pillar,
      }}
      secondaryAction={
        pillarScript
          ? {
              label: copied === 'script' ? 'Copied' : 'Copy script',
              onClick: () => void copyText('script', pillarScript),
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
          {pillar ? `${pillar.title} · ${resourceLabel ?? pillar.lifecycle}` : 'No pillar'} · {shotList.length} shot(s)
        </p>
      }
      statusBlock={
        <ul className="space-y-1 text-sm">
          <li>Script length: {pillarScript.length > 0 ? `${pillarScript.length} chars` : '—'}</li>
          <li>Promote id: {promoteId ?? '—'}</li>
        </ul>
      }
    >
      {!pillar ? (
        <div className={finelyOsCatalogCardCompact('fuchsia')}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Pillar video</div>
          <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Upload in Content Studio or link Esther pillar id — Jordan builds narration outline and shot list from upload intel.
          </p>
          <button
            type="button"
            className={`${FINELY_OS_PRIMARY_BTN} mt-3`}
            onClick={() => navigate(buildGrowthContentStudioPromoteUrl())}
          >
            Open Content Studio
          </button>
          <button
            type="button"
            className={`${FINELY_OS_SECONDARY_BTN} mt-2`}
            onClick={() => navigate(buildGrowthContentStudioWizardUrl({ preset: 'ad_60', fromPillar: true }))}
          >
            Open video wizard · ad
          </button>
        </div>
      ) : (
        <>
          <div className={finelyOsCatalogCardCompact('fuchsia')}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Pillar script outline</div>
            <p className={`mt-1 text-xs font-semibold text-white truncate`}>{pillar.title}</p>
            <p className={`mt-1 text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
              {resourceLabel ?? pillar.lifecycle} · educational only · results vary
            </p>
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-white/10 bg-black/30 p-2 text-[10px] leading-relaxed text-white/75 whitespace-pre-wrap">
              {pillarScript}
            </pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={FINELY_OS_PRIMARY_BTN}
                onClick={() =>
                  navigate(
                    buildGrowthContentStudioWizardUrl({
                      fromPillar: true,
                      videoId: promoteId,
                      preset: 'ad_60',
                    }),
                  )
                }
              >
                Create video from pillar
              </button>
              <button
                type="button"
                className={copied === 'script' ? FINELY_OS_SUCCESS_BTN : FINELY_OS_SECONDARY_BTN}
                onClick={() => void copyText('script', pillarScript)}
              >
                {copied === 'script' ? 'Script copied' : 'Copy script'}
              </button>
            </div>
          </div>

          <div className={finelyOsCatalogCardCompact('fuchsia')}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Shot list</div>
            <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
              Cuts and B-roll mapped from pillar topics — blur PII on bureau screenshots.
            </p>
            <FinelyOsPaginatedStack
              items={shotList.map((s, i) => ({ id: `shot-${i}`, text: s }))}
              pageSize={4}
              renderItem={(row) => (
                <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm flex flex-wrap items-start justify-between gap-2">
                  <span className="text-white/90">{row.text}</span>
                  {finelyOsStatusChip('warn')}
                </div>
              )}
            />
            <button
              type="button"
              className={`${copied === 'shots' ? FINELY_OS_SUCCESS_BTN : FINELY_OS_SECONDARY_BTN} mt-3`}
              onClick={() => void copyText('shots', shotList.join('\n'))}
            >
              {copied === 'shots' ? 'List copied' : 'Copy shot list'}
            </button>
          </div>

          <div className={finelyOsCatalogCardCompact('amber')}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Promote → Hannah UTM factory</div>
            <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
              Deep link opens Hannah with videoId and utm_content pre-filled from this pillar.
            </p>
            <div className={`mt-2 text-[10px] font-mono break-all ${FINELY_OS_ENTITY_BODY}`}>{hannahUrl}</div>
            <button type="button" className={`${FINELY_OS_SECONDARY_BTN} mt-3`} onClick={() => navigate(hannahUrl)}>
              Open Hannah · tracked links
            </button>
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
                fromPillar: true,
                videoId: promoteId,
                preset: 'ad_60',
              }),
            )
          }
        >
          Video wizard · ad
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/growth-agents/social')}>
          Miriam · shorts pack
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/growth-agents/seo-local')}>
          Lydia · local SEO
        </button>
      </div>
    </GrowthAgentWorkspaceShell>
  );
}
