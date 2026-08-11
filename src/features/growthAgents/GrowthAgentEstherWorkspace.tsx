import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GrowthAgentWorkspaceShell } from './GrowthAgentWorkspaceShell';
import { getGrowthAgent, GROWTH_AGENT_WAVE0_LANE } from './growthAgentRegistry';
import { getEstherMaturity } from './growthAgentMaturity';
import { buildGrowthResultsSnapshot } from './growthResultsMetrics';
import { getGrowthWeekFocus, setGrowthWeekFocus } from './growthWeekFocus';
import { GrowthAgentEstherCommandGuide } from './GrowthAgentEstherCommandGuide';
import {
  calebAutoStatusLine,
  isCalebAutoFindEnabled,
  setCalebAutoFindEnabled,
} from './calebAutoFind';
import { setMarketingFindGeo, getMarketingFindGeo } from '../marketingDesk/marketingDeskHunt';
import { buildHuntQueries, HUNT_LANE_PRESETS, type LeadEngineLane } from '../leadIntel/leadEngineAutonomy';
import { getVideoCommandRecord, listVideoCommandRecords } from '../../data/videoCommandRecordRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsMicroStat,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

const CTA_PRESETS = [
  { path: '/enlightenment-session', label: 'Book a session' },
  { path: '/personal-credit', label: 'Personal credit restore' },
  { path: '/resources', label: 'Resources hub' },
] as const;

export function GrowthAgentEstherWorkspace() {
  const navigate = useNavigate();
  const agent = getGrowthAgent('marketing-director')!;
  const [tick, setTick] = useState(0);
  const [pillarDraft, setPillarDraft] = useState('');

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const focus = useMemo(() => {
    void tick;
    return getGrowthWeekFocus();
  }, [tick]);

  useEffect(() => {
    setPillarDraft(focus.pillarVideoId ?? '');
  }, [focus.pillarVideoId]);

  const maturity = useMemo(() => {
    void tick;
    return getEstherMaturity();
  }, [tick]);

  const results = useMemo(() => {
    void tick;
    return buildGrowthResultsSnapshot();
  }, [tick]);

  const autoEnabled = useMemo(() => {
    void tick;
    return isCalebAutoFindEnabled();
  }, [tick]);

  const calebGeoMatch =
    getMarketingFindGeo().trim().toLowerCase() === focus.city.trim().toLowerCase() && focus.city.trim().length > 0;

  const huntPreview = useMemo(() => {
    return buildHuntQueries({ lane: focus.lane, location: focus.city }).slice(0, 3);
  }, [focus.lane, focus.city]);

  const pillarRecord = useMemo(() => {
    void tick;
    const key = focus.pillarVideoId?.trim();
    if (!key) return null;
    return (
      getVideoCommandRecord(key) ??
      listVideoCommandRecords().find((r) => r.resourceVideoId === key || r.id === key) ??
      null
    );
  }, [focus.pillarVideoId, tick]);

  const syncCityToCaleb = (city: string) => {
    setGrowthWeekFocus({ city });
    setMarketingFindGeo(city);
    if (isCalebAutoFindEnabled()) setCalebAutoFindEnabled(true, city);
    setTick((t) => t + 1);
  };

  const savePillarId = () => {
    setGrowthWeekFocus({ pillarVideoId: pillarDraft.trim() || undefined });
    setTick((t) => t + 1);
  };

  return (
    <GrowthAgentWorkspaceShell
      accent={agent.accent}
      name={agent.name}
      roleTitle={agent.roleTitle}
      mission={agent.mission}
      maturityPercent={maturity.percent}
      maturityLabel={maturity.label}
      headerAside={<GrowthAgentEstherCommandGuide tick={tick} />}
      alertMessage={autoEnabled ? calebAutoStatusLine() : 'Set city below — then open Caleb to turn auto-find on for daily pack.'}
      alertTone={maturity.percent >= 80 ? 'success' : 'info'}
      primaryAction={{
        label: calebGeoMatch ? 'Caleb city synced' : 'Sync city to Caleb Find',
        onClick: () => syncCityToCaleb(focus.city),
        disabled: calebGeoMatch,
      }}
      secondaryAction={{
        label: 'Open Caleb',
        onClick: () => navigate('/admin/growth-agents/lead-discovery'),
      }}
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
          Updated {focus.updatedAt ? new Date(focus.updatedAt).toLocaleString() : '—'} · Find geo: {getMarketingFindGeo()}
        </p>
      }
      statusBlock={
        <ul className="space-y-1 text-sm">
          <li>Lane: {focus.laneLabel}</li>
          <li>City: {focus.city}</li>
          <li>Auto-find: {autoEnabled ? 'on' : 'off'}</li>
        </ul>
      }
    >
      <div className={finelyOsCatalogCardCompact('violet')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Week plan editor</div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          One offer, one audience, one city — Caleb and Hannah read this focus from local store.
        </p>

        <label className={`mt-3 block text-xs ${FINELY_OS_ENTITY_BODY}`}>Lane</label>
        <select
          className={`${FINELY_OS_ENTITY_SELECT} mt-1 max-w-md`}
          value={focus.lane}
          onChange={(e) => {
            setGrowthWeekFocus({ lane: e.target.value as LeadEngineLane });
            setTick((t) => t + 1);
          }}
        >
          {HUNT_LANE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>

        <label className={`mt-3 block text-xs ${FINELY_OS_ENTITY_BODY}`}>Target city</label>
        <input
          className={`${FINELY_OS_ENTITY_INPUT} mt-1 max-w-md`}
          value={focus.city}
          onChange={(e) => {
            setGrowthWeekFocus({ city: e.target.value });
            setTick((t) => t + 1);
          }}
          onBlur={(e) => syncCityToCaleb(e.target.value)}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {calebGeoMatch ? finelyOsStatusChip('ok') : finelyOsStatusChip('warn')}
          <span className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            {calebGeoMatch ? 'Caleb Find geo matches' : 'Blur city or tap Sync to align Caleb'}
          </span>
        </div>

        <label className={`mt-3 block text-xs ${FINELY_OS_ENTITY_BODY}`}>Book CTA path</label>
        <select
          className={`${FINELY_OS_ENTITY_SELECT} mt-1 max-w-md`}
          value={focus.ctaPath}
          onChange={(e) => {
            setGrowthWeekFocus({ ctaPath: e.target.value });
            setTick((t) => t + 1);
          }}
        >
          {CTA_PRESETS.map((c) => (
            <option key={c.path} value={c.path}>
              {c.label}
            </option>
          ))}
          {!CTA_PRESETS.some((c) => c.path === focus.ctaPath) ? (
            <option value={focus.ctaPath}>{focus.ctaPath}</option>
          ) : null}
        </select>
        <input
          className={`${FINELY_OS_ENTITY_INPUT} mt-2 max-w-md`}
          placeholder="Custom CTA path"
          value={focus.ctaPath}
          onChange={(e) => {
            setGrowthWeekFocus({ ctaPath: e.target.value });
            setTick((t) => t + 1);
          }}
        />

        <label className={`mt-3 block text-xs ${FINELY_OS_ENTITY_BODY}`}>Pillar video id (optional)</label>
        <div className="mt-1 flex flex-wrap gap-2 max-w-md">
          <input
            className={`${FINELY_OS_ENTITY_INPUT} flex-1 min-w-[180px]`}
            value={pillarDraft}
            onChange={(e) => setPillarDraft(e.target.value)}
            placeholder="Content Studio video id"
          />
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={savePillarId}>
            Save pillar
          </button>
        </div>
        {focus.pillarVideoId ? (
          <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
            Linked: <span className="text-white/90">{pillarRecord?.title ?? focus.pillarVideoId}</span>
            {pillarRecord ? <span className="text-white/45"> · {pillarRecord.lifecycle}</span> : null}
          </p>
        ) : null}
      </div>

      <div className={finelyOsCatalogCardCompact('emerald')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Caleb hunt query preview</div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Wave 0 find still uses restore lane; these queries show where multi-lane pack is heading.
        </p>
        <ul className="mt-2 space-y-2">
          {huntPreview.map((q) => (
            <li key={q} className="rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-xs text-white/85">
              {q}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => {
              setMarketingFindGeo(focus.city);
              navigate('/admin/marketing-desk?helper=find');
            }}
          >
            Open Desk · Find
          </button>
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => navigate(`/admin/growth-agents/capture-links`)}
          >
            Hannah · {GROWTH_AGENT_WAVE0_LANE} links
          </button>
        </div>
      </div>

      <div className={finelyOsCatalogCardCompact('sky')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Auto-find status</div>
        <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>{calebAutoStatusLine()}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={FINELY_OS_PRIMARY_BTN}
            onClick={() => {
              const next = !isCalebAutoFindEnabled();
              setCalebAutoFindEnabled(next, focus.city);
              setTick((t) => t + 1);
            }}
          >
            {autoEnabled ? 'Turn auto-find off' : 'Turn auto-find on'}
          </button>
          <span className={finelyOsMicroStat('violet')}>City: {focus.city}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/marketing-desk?helper=board')}>
          Desk · Board
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/growth-agents/lead-discovery')}>
          Caleb workspace
        </button>
      </div>
    </GrowthAgentWorkspaceShell>
  );
}
