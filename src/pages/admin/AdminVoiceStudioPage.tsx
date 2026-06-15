import React, { useEffect, useState } from 'react';
import { ArrowLeft, Headphones, Mic, Save, Sparkles, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { getPublicVoiceProfile, getVoiceStudioStatus, renderVoiceAsset, voiceProfileLabel } from '../../lib/voiceStudioClient';
import { getGuideNarration } from '../../resources/guideNarration';
import { listFreeGuidesEffective } from '../../data/freeGuidesRepo';
import { getVoiceStudioSettings, updateVoiceStudioSettings } from '../../data/settingsRepo';
import type { VoiceStudioSettings } from '../../domain/settings';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_SUCCESS_BTN,
} from '../../features/os/finelyOsLightUi';

export default function AdminVoiceStudioPage() {
  const navigate = useNavigate();
  const status = getVoiceStudioStatus();
  const guides = listFreeGuidesEffective().slice(0, 6);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [voiceSettings, setVoiceSettings] = useState<VoiceStudioSettings>(() => getVoiceStudioSettings());

  useEffect(() => {
    const onStore = () => setVoiceSettings(getVoiceStudioSettings());
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const savePreset = () => {
    updateVoiceStudioSettings(voiceSettings);
    setMsg(`Public narrator set to ${voiceProfileLabel(voiceSettings.publicVoiceProfile as any)}`);
    setErr(null);
  };

  const testRender = async (guideId: string, title: string) => {
    setBusy(true);
    setMsg(null);
    setErr(null);
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
    <PageShell badge="Admin" title="Voice Studio" subtitle="Neural narration — brand clone, presets, Nora shared API.">
      <div className={FINELY_OS_PAGE}>
        <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Admin
        </button>

        <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
          <div className="flex items-center gap-2 text-emerald-300">
            <Headphones size={18} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Finely Voice Studio</span>
          </div>
          <p className={FINELY_OS_ENTITY_BODY}>
            Shared with Nora Capital Group (5173) via <code className="text-emerald-200/80">voice-studio</code> +{' '}
            <code className="text-emerald-200/80">finely-partner-api</code>. Set{' '}
            <code className="text-emerald-200/80">CARTESIA_API_KEY</code>,{' '}
            <code className="text-emerald-200/80">ELEVENLABS_API_KEY</code>, and{' '}
            <code className="text-emerald-200/80">VOICE_CLONE_FINELY_PRIMARY_ID</code> in Supabase secrets.
          </p>

          {!status.available ? (
            <div className={FINELY_OS_NOTICE_ERROR}>{status.reason}</div>
          ) : (
            <div className={FINELY_OS_NOTICE_SUCCESS}>Voice Studio API reachable (Supabase configured).</div>
          )}

          <div className={`rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4 space-y-3`}>
            <div className={FINELY_OS_ENTITY_VALUE}>Public site narrator (Resources / education)</div>
            <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
              Visitors do not pick a voice — this preset is used everywhere on public pages. Current:{' '}
              <strong>{voiceProfileLabel(voiceSettings.publicVoiceProfile as any)}</strong>
            </p>
            <label className={FINELY_OS_ENTITY_LABEL}>Finely Cred public voice</label>
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
            <label className={FINELY_OS_ENTITY_LABEL}>Nora Capital (5173) public voice</label>
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

          <div className="grid md:grid-cols-2 gap-4">
            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
              <div className="flex items-center gap-2 text-violet-300">
                <Mic size={16} />
                <span className={FINELY_OS_ENTITY_VALUE}>Brand clone</span>
              </div>
              <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
                Upload 30–90 min clean speech to ElevenLabs, then set <code>VOICE_CLONE_FINELY_PRIMARY_ID</code>. This becomes the default
                &quot;Brand voice&quot; on guides and can be shared with Nora.
              </p>
            </div>
            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
              <div className="flex items-center gap-2 text-sky-300">
                <Sparkles size={16} />
                <span className={FINELY_OS_ENTITY_VALUE}>Nora Capital (5173)</span>
              </div>
              <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
                Copy <code>src/lib/voiceStudioClient.ts</code> into Nora. Use <code>tenantId: nora_capital</code>. See{' '}
                <code>docs/VOICE_STUDIO_API.md</code>.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className={FINELY_OS_ENTITY_VALUE}>Test render (brand voice)</div>
            <div className="flex flex-wrap gap-2">
              {guides.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  disabled={busy || !status.available}
                  onClick={() => void testRender(g.id, g.title)}
                  className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-50`}
                >
                  <Wand2 size={14} /> {g.title.slice(0, 28)}…
                </button>
              ))}
            </div>
          </div>

          {msg ? <div className={FINELY_OS_NOTICE_SUCCESS}>{msg}</div> : null}
          {err ? <div className={FINELY_OS_NOTICE_ERROR}>{err}</div> : null}
        </div>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
