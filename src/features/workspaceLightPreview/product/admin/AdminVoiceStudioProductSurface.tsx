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
  FINELY_OS_PAGE,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsGlowTextarea,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

type ToolRail = 'presets' | 'setup' | 'test';
type VoiceAccent = 'emerald' | 'violet' | 'sky' | 'rose';

const VOICE_CARD_SHAPE: Record<VoiceAccent, string> = {
  emerald: '!rounded-2xl',
  violet: '!rounded-3xl',
  sky: '!rounded-[2rem]',
  rose: '!rounded-xl',
};

const TOOL_RAIL: { id: ToolRail; label: string; icon: typeof Mic; accent: VoiceAccent; purpose: string }[] = [
  { id: 'presets', label: 'Public voice', icon: Headphones, accent: 'emerald', purpose: 'Narrator used on education pages' },
  { id: 'setup', label: 'Brand setup', icon: Mic, accent: 'violet', purpose: 'API keys and clone wiring' },
  { id: 'test', label: 'Test render', icon: Wand2, accent: 'sky', purpose: 'Render a guide with the brand voice' },
];

const GUIDE_ACCENTS: VoiceAccent[] = ['emerald', 'violet', 'sky', 'rose'];

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
      return 'Select a guide to preview its narration script. The public narrator preset applies to all site education pages.';
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
      <div className={FINELY_OS_PAGE} data-surface-layout="compose-studio">
        <section className="space-y-3">
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Narration script</p>
          <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
            {selectedGuide ? selectedGuide.title : 'Voice studio'}
          </h2>
          <p className={`max-w-3xl text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
            {selectedGuide ? `Previewing: ${selectedGuide.title}` : 'Pick a guide to preview its narration script.'}
          </p>
        </section>

        <nav className="grid gap-4 sm:grid-cols-3" aria-label="Voice tools">
          {TOOL_RAIL.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTool(tool.id)}
                className={`${finelyOsCatalogCard(tool.accent)} ${VOICE_CARD_SHAPE[tool.accent]} p-6 lg:p-8 text-left ${
                  isActive ? 'ring-2 ring-white/40' : ''
                }`}
                data-fc-accent={tool.accent}
              >
                <div className="flex items-center gap-2">
                  <Icon size={20} />
                  <span className={`text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{tool.label}</span>
                </div>
                <p className={`mt-3 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{tool.purpose}</p>
              </button>
            );
          })}
        </nav>

        <textarea
          readOnly
          value={scriptPreview}
          rows={14}
          className={`${finelyOsGlowTextarea('violet')} min-h-[320px] text-base font-semibold`}
          aria-label="Narration script preview"
        />

        {activeTool === 'presets' ? (
          <>
            <div className="grid gap-6 lg:grid-cols-2 items-start">
              <section className={`${finelyOsCatalogCard('emerald')} ${VOICE_CARD_SHAPE.emerald} p-6 lg:p-8 space-y-4`} data-fc-accent="emerald">
                <div className={FINELY_OS_ENTITY_VALUE}>Finely Cred public voice</div>
                <p className={`${FINELY_OS_ENTITY_BODY} text-base font-bold`}>
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
                  <option value="finely_kreyol_companion">Kreyòl companion</option>
                </select>
              </section>

              <section className={`${finelyOsCatalogCard('violet')} ${VOICE_CARD_SHAPE.violet} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
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
              </section>
            </div>

            <button type="button" onClick={savePreset} className={FINELY_OS_SUCCESS_BTN}>
              <Save size={14} /> Save public voice preset
            </button>

            <p className={`text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
              Visitors do not pick a voice — this preset is used on public education pages.
            </p>
          </>
        ) : null}

        {activeTool === 'setup' ? (
          <>
            <section className="space-y-3">
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
            </section>

            <div className="grid gap-6 lg:grid-cols-2 items-start">
              <section className={`${finelyOsCatalogCard('emerald')} ${VOICE_CARD_SHAPE.emerald} p-6 lg:p-8 space-y-2`} data-fc-accent="emerald">
                <div className="flex items-center gap-2">
                  <Mic size={16} />
                  <span className={FINELY_OS_ENTITY_VALUE}>Brand clone</span>
                </div>
                <p className={`${FINELY_OS_ENTITY_BODY} text-base font-semibold`}>
                  Upload 30–90 min clean speech to ElevenLabs, then set <code>VOICE_CLONE_FINELY_PRIMARY_ID</code>.
                </p>
              </section>
              <section className={`${finelyOsCatalogCard('rose')} ${VOICE_CARD_SHAPE.rose} p-6 lg:p-8 space-y-2`} data-fc-accent="rose">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} />
                  <span className={FINELY_OS_ENTITY_VALUE}>Nora Capital tenant</span>
                </div>
                <p className={`${FINELY_OS_ENTITY_BODY} text-base font-semibold`}>
                  Copy <code>src/lib/voiceStudioClient.ts</code> into Nora. Use <code>tenantId: nora_capital</code>.
                </p>
              </section>
            </div>
          </>
        ) : null}

        {activeTool === 'test' ? (
          <section className="space-y-4">
            <div className="space-y-2">
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Guide targets</p>
              <h3 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Render a guide</h3>
              <p className={`text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                Force a fresh render using the brand voice profile.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {guides.map((g, index) => {
                const family = GUIDE_ACCENTS[index % GUIDE_ACCENTS.length]!;
                return (
                  <button
                    key={g.id}
                    type="button"
                    disabled={busy || !status.available}
                    onClick={() => void testRender(g.id, g.title)}
                    className={`${finelyOsCatalogCard(family)} ${VOICE_CARD_SHAPE[family]} p-6 lg:p-8 text-left disabled:opacity-50`}
                    data-fc-accent={family}
                  >
                    <div className="flex items-center gap-2">
                      <Wand2 size={18} />
                      <span className={`text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{g.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {!status.available ? (
          <div className={FINELY_OS_NOTICE_ERROR}>{status.reason}</div>
        ) : (
          <div className={FINELY_OS_NOTICE_SUCCESS}>Voice studio API reachable.</div>
        )}
        {msg ? <div className={FINELY_OS_NOTICE_SUCCESS}>{msg}</div> : null}
        {err ? <div className={FINELY_OS_NOTICE_ERROR}>{err}</div> : null}
      </div>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
