import React, { useEffect, useMemo, useState } from 'react';
import { Headphones, Mic, Save, Settings, Sparkles, Wand2 } from 'lucide-react';
import { getPublicVoiceProfile, getVoiceStudioStatus, renderVoiceAsset, voiceProfileLabel } from '../../../../lib/voiceStudioClient';
import { getGuideNarration, narrationToPlainText } from '../../../../resources/guideNarration';
import { listFreeGuidesEffective } from '../../../../data/freeGuidesRepo';
import { getVoiceStudioSettings, updateVoiceStudioSettings } from '../../../../data/settingsRepo';
import type { VoiceStudioSettings } from '../../../../domain/settings';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsGlowTextarea,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

type ToolRail = 'presets' | 'setup' | 'test';

const TOOL_RAIL: { id: ToolRail; label: string; icon: typeof Mic; accent: 'emerald' | 'violet' | 'sky' }[] = [
  { id: 'presets', label: 'Public voice', icon: Headphones, accent: 'emerald' },
  { id: 'setup', label: 'Brand setup', icon: Mic, accent: 'violet' },
  { id: 'test', label: 'Test render', icon: Wand2, accent: 'sky' },
];

export default function AdminVoiceStudioProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'emerald';
  const status = getVoiceStudioStatus();
  const guides = useMemo(() => listFreeGuidesEffective().slice(0, 6), []);
  const [activeTool, setActiveTool] = useState<ToolRail>('presets');
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(guides[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [voiceSettings, setVoiceSettings] = useState<VoiceStudioSettings>(() => getVoiceStudioSettings());

  const selectedGuide = useMemo(
    () => (selectedGuideId ? listFreeGuidesEffective().find((g) => g.id === selectedGuideId) ?? null : null),
    [selectedGuideId],
  );

  const scriptPreview = useMemo(() => {
    if (!selectedGuide) {
      return 'Select a guide from the tool rail to preview its narration script here. The public narrator preset applies to all site education pages.';
    }
    return narrationToPlainText(getGuideNarration(selectedGuide.id, selectedGuide.title, selectedGuide.sections));
  }, [selectedGuide]);

  useEffect(() => {
    const onStore = () => setVoiceSettings(getVoiceStudioSettings());
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const savePreset = () => {
    updateVoiceStudioSettings(voiceSettings);
    setMsg(`Public narrator set to ${voiceProfileLabel(voiceSettings.publicVoiceProfile as Parameters<typeof voiceProfileLabel>[0])}`);
    setErr(null);
  };

  const testRender = async (guideId: string, title: string) => {
    setBusy(true);
    setMsg(null);
    setErr(null);
    setSelectedGuideId(guideId);
    setActiveTool('test');
    try {
      const guide = listFreeGuidesEffective().find((g) => g.id === guideId);
      if (!guide) throw new Error('Guide not found');
      const narration = getGuideNarration(guide.id, guide.title, guide.sections);
      const result = await renderVoiceAsset({
        contentId: guide.id,
        title: guide.title,
        narration,
        voiceProfile: getPublicVoiceProfile('finely_cred'),
        force: true,
      });
      setMsg(`Rendered ${title} via ${result.asset.provider ?? 'studio'} (${result.asset.durationSec ?? '?'}s)`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Render failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Studio"
      title="Voice studio"
      description="Choose the public narrator, wire brand clones, and test guide audio before it ships."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={<ProductPagePrimaryAction label="Save voice preset" onClick={savePreset} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => setActiveTool('test')}>
          Test render
        </button>
      }
      metrics={[
        { label: 'API status', value: status.available ? 'Live' : 'Setup', hint: status.available ? 'Supabase reachable' : 'Add API keys', accent: status.available ? 'emerald' : 'rose', onClick: () => setActiveTool('setup') },
        { label: 'Public voice', value: voiceProfileLabel(voiceSettings.publicVoiceProfile as Parameters<typeof voiceProfileLabel>[0]).split(' ')[0], hint: 'Finely Cred narrator', accent: 'violet', onClick: () => setActiveTool('presets') },
        { label: 'Guides ready', value: String(guides.length), hint: 'Quick test targets', accent: 'sky', onClick: () => setActiveTool('test') },
        { label: 'Presets', value: '4', hint: 'Finely + Nora options', accent: 'rose', onClick: () => setActiveTool('presets') },
      ]}
      metricTitle="Voice coverage"
      metricDescription="Save a preset or run a test render on a live guide."
    >
      {/* Compose studio — script canvas + vertical tool rail */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <section className={`lg:col-span-8 space-y-5 ${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-violet-300">Compose studio</div>
            <h2 className="mt-2 text-3xl font-extrabold">Narration script</h2>
            <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              {selectedGuide ? `Previewing: ${selectedGuide.title}` : 'Pick a guide to preview its narration script.'}
            </p>
          </div>

          <textarea
            readOnly
            value={scriptPreview}
            rows={14}
            className={`${finelyOsGlowTextarea('violet')} min-h-[320px] text-base font-semibold`}
            aria-label="Narration script preview"
          />

          {activeTool === 'presets' || activeTool === 'test' ? (
            <div className={`${finelyOsCatalogCard('emerald')} p-5 lg:p-6 space-y-4`} data-fc-accent="emerald">
              <div className={FINELY_OS_ENTITY_VALUE}>Finely Cred public voice</div>
              <p className={`${FINELY_OS_ENTITY_BODY} text-sm font-bold`}>
                Current: <strong>{voiceProfileLabel(voiceSettings.publicVoiceProfile as Parameters<typeof voiceProfileLabel>[0])}</strong>
              </p>
              <label className={FINELY_OS_ENTITY_LABEL}>Narrator preset</label>
              <select
                value={voiceSettings.publicVoiceProfile}
                onChange={(e) => setVoiceSettings((s) => ({ ...s, publicVoiceProfile: e.target.value as VoiceStudioSettings['publicVoiceProfile'] }))}
                className={`${FINELY_OS_ENTITY_SELECT} bg-[#0f1412] [&>option]:bg-[#0f1412] [&>option]:text-white`}
              >
                <option value="finely_female_warm">Warm female advisor (default preset)</option>
                <option value="finely_male_calm">Calm male advisor</option>
                <option value="finely_documentary">Documentary narrator</option>
                <option value="finely_brand_primary">Brand voice (custom clone)</option>
              </select>

              <div className={FINELY_OS_ENTITY_VALUE}>Nora Capital public voice</div>
              <label className={FINELY_OS_ENTITY_LABEL}>Tenant narrator</label>
              <select
                value={voiceSettings.noraPublicVoiceProfile}
                onChange={(e) => setVoiceSettings((s) => ({ ...s, noraPublicVoiceProfile: e.target.value as VoiceStudioSettings['noraPublicVoiceProfile'] }))}
                className={`${FINELY_OS_ENTITY_SELECT} bg-[#0f1412] [&>option]:bg-[#0f1412] [&>option]:text-white`}
              >
                <option value="nora_funding_advisor">Nora funding advisor</option>
                <option value="finely_brand_primary">Brand voice (shared clone)</option>
                <option value="finely_male_calm">Calm male advisor</option>
                <option value="finely_documentary">Documentary narrator</option>
              </select>

              <button type="button" onClick={savePreset} className={FINELY_OS_SUCCESS_BTN}>
                <Save size={14} /> Save public voice preset
              </button>
            </div>
          ) : null}

          {activeTool === 'setup' ? (
            <div className={`${finelyOsCatalogCard('sky')} p-5 lg:p-6 space-y-4`} data-fc-accent="sky">
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <Settings size={16} /> API wiring
              </div>
              <p className={`${FINELY_OS_ENTITY_BODY} text-base font-semibold`}>
                Shared with Nora Capital Group via <code className="text-sky-200/80">voice-studio</code> and{' '}
                <code className="text-sky-200/80">finely-partner-api</code>. Set{' '}
                <code className="text-sky-200/80">CARTESIA_API_KEY</code>,{' '}
                <code className="text-sky-200/80">ELEVENLABS_API_KEY</code>, and{' '}
                <code className="text-sky-200/80">VOICE_CLONE_FINELY_PRIMARY_ID</code> in Supabase secrets.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className={`${finelyOsCatalogCard('emerald')} p-4 space-y-2`} data-fc-accent="emerald">
                  <div className="flex items-center gap-2">
                    <Mic size={16} />
                    <span className={FINELY_OS_ENTITY_VALUE}>Brand clone</span>
                  </div>
                  <p className={`${FINELY_OS_ENTITY_BODY} text-sm font-semibold`}>
                    Upload 30–90 min clean speech to ElevenLabs, then set <code>VOICE_CLONE_FINELY_PRIMARY_ID</code>.
                  </p>
                </div>
                <div className={`${finelyOsCatalogCard('rose')} p-4 space-y-2`} data-fc-accent="rose">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} />
                    <span className={FINELY_OS_ENTITY_VALUE}>Nora Capital tenant</span>
                  </div>
                  <p className={`${FINELY_OS_ENTITY_BODY} text-sm font-semibold`}>
                    Copy <code>src/lib/voiceStudioClient.ts</code> into Nora. Use <code>tenantId: nora_capital</code>.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {!status.available ? (
            <div className={FINELY_OS_NOTICE_ERROR}>{status.reason}</div>
          ) : (
            <div className={FINELY_OS_NOTICE_SUCCESS}>Voice studio API reachable.</div>
          )}
          {msg ? <div className={FINELY_OS_NOTICE_SUCCESS}>{msg}</div> : null}
          {err ? <div className={FINELY_OS_NOTICE_ERROR}>{err}</div> : null}
        </section>

        <aside className={`lg:col-span-4 space-y-4 ${finelyOsCatalogCard('sky')} p-5 lg:p-6`} data-fc-accent="sky">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Voice tools</div>

          <div className="space-y-2">
            {TOOL_RAIL.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setActiveTool(tool.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                    isActive
                      ? tool.accent === 'emerald'
                        ? 'border-emerald-400/40 bg-emerald-500/15'
                        : tool.accent === 'violet'
                          ? 'border-violet-400/40 bg-violet-500/15'
                          : 'border-sky-400/40 bg-sky-500/15'
                      : 'border-white/10 bg-black/20 hover:border-white/25'
                  }`}
                  data-fc-accent={isActive ? tool.accent : undefined}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} />
                    <span className="text-sm font-extrabold">{tool.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {activeTool === 'test' ? (
            <div className={`${finelyOsCatalogCard('rose')} p-4 space-y-3`} data-fc-accent="rose">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Guide targets</div>
              <p className={`text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                Force a fresh render using the brand voice profile.
              </p>
              <div className="space-y-2">
                {guides.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    disabled={busy || !status.available}
                    onClick={() => void testRender(g.id, g.title)}
                    className={`${FINELY_OS_PRIMARY_BTN} w-full justify-start disabled:opacity-50 text-sm`}
                  >
                    <Wand2 size={14} /> {g.title.slice(0, 32)}
                    {g.title.length > 32 ? '…' : ''}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {activeTool === 'presets' ? (
            <div className={`${finelyOsCatalogCard('emerald')} p-4`} data-fc-accent="emerald">
              <p className={`text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                Visitors do not pick a voice — this preset is used on public education pages.
              </p>
            </div>
          ) : null}
        </aside>
      </div>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
