import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, FileText, Save, Sparkles } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsGlassPanel } from '../../features/os/FinelyOsGlassPanel';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsListItem,
} from '../../features/os/finelyOsLightUi';
import { LEAD_MAGNET_FUNNELS } from '../../domain/leadMagnetFunnels';
import { listAllPersonas } from '../../data/agentPersonasRepo';
import type { AgentPersonaId } from '../../domain/agentPersonas';
import {
  clearFunnelOverride,
  getFunnelOverride,
  loadFunnelOverrides,
  saveFunnelOverride,
} from '../../data/leadMagnetFunnelsRepo';

export default function AdminLeadMagnetFunnelsPage() {
  const [selectedId, setSelectedId] = useState(LEAD_MAGNET_FUNNELS[0]!.id);
  const [notice, setNotice] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const base = LEAD_MAGNET_FUNNELS.find((f) => f.id === selectedId) ?? LEAD_MAGNET_FUNNELS[0]!;
  const override = useMemo(() => getFunnelOverride(base.funnelId) ?? getFunnelOverride(base.id), [selectedId, version]);
  const personas = useMemo(() => listAllPersonas(), []);

  const [urgencyText, setUrgencyText] = useState('');
  const [heroHeadline, setHeroHeadline] = useState('');
  const [heroHighlight, setHeroHighlight] = useState('');
  const [heroSub, setHeroSub] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [offer, setOffer] = useState('');
  const [agentPersonaId, setAgentPersonaId] = useState<AgentPersonaId>('finely_advisor');

  useEffect(() => {
    setUrgencyText(override?.urgencyText ?? base.urgencyText);
    setHeroHeadline(override?.heroHeadline ?? base.heroHeadline);
    setHeroHighlight(override?.heroHighlight ?? base.heroHighlight);
    setHeroSub(override?.heroSub ?? base.heroSub);
    setMetaTitle(override?.metaTitle ?? base.metaTitle);
    setMetaDesc(override?.metaDesc ?? base.metaDesc);
    setOffer(override?.offer ?? base.offer);
    setAgentPersonaId(override?.agentPersonaId ?? base.agentPersonaId);
  }, [selectedId, version, base, override]);

  const save = () => {
    saveFunnelOverride(base.funnelId, {
      urgencyText,
      heroHeadline,
      heroHighlight,
      heroSub,
      metaTitle,
      metaDesc,
      offer,
      agentPersonaId,
    });
    setNotice('Funnel copy saved — live on next page load.');
    setVersion((v) => v + 1);
  };

  const reset = () => {
    clearFunnelOverride(base.funnelId);
    clearFunnelOverride(base.id);
    setNotice('Reset to code defaults.');
    setVersion((v) => v + 1);
  };

  const overrideCount = Object.keys(loadFunnelOverrides()).length;

  return (
    <PageShell title="Lead magnet funnels" subtitle="Edit public funnel copy and assigned role without a code deploy">
      <div className="space-y-6">
        {notice ? (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{notice}</div>
        ) : null}

        <FinelyOsGlassPanel icon={Sparkles} title="Funnel catalog" accent="emerald">
          <p className={`${FINELY_OS_ENTITY_BODY} text-sm mb-4`}>
            {LEAD_MAGNET_FUNNELS.length} funnels · {overrideCount} with admin overrides · staff roster resolves live names at runtime.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {LEAD_MAGNET_FUNNELS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedId(f.id)}
                className={`w-full text-left ${finelyOsListItem(selectedId === f.id, 'emerald')}`}
              >
                <div className={`${FINELY_OS_ENTITY_BODY} font-semibold text-sm`}>{f.metaTitle}</div>
                <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>{f.path}</div>
              </button>
            ))}
          </div>
        </FinelyOsGlassPanel>

        <FinelyOsGlassPanel icon={FileText} title={`Edit · ${base.metaTitle}`} accent="violet">
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Urgency bar</label>
              <input value={urgencyText} onChange={(e) => setUrgencyText(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Offer slug</label>
              <input value={offer} onChange={(e) => setOffer(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Hero headline</label>
              <input value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Hero highlight</label>
              <input value={heroHighlight} onChange={(e) => setHeroHighlight(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Hero sub</label>
              <input value={heroSub} onChange={(e) => setHeroSub(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Assigned role</label>
              <select value={agentPersonaId} onChange={(e) => setAgentPersonaId(e.target.value as AgentPersonaId)} className={FINELY_OS_ENTITY_SELECT}>
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayTitle ?? p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>SEO title</label>
              <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <div className="md:col-span-2">
              <label className={FINELY_OS_ENTITY_SUBLABEL}>SEO description</label>
              <textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} rows={2} className={`${FINELY_OS_ENTITY_INPUT} w-full`} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            <button type="button" onClick={save} className={FINELY_OS_SUCCESS_BTN}>
              <Save size={14} /> Save funnel
            </button>
            <button type="button" onClick={reset} className={FINELY_OS_SECONDARY_BTN}>
              Reset to defaults
            </button>
            <a href={base.path} target="_blank" rel="noreferrer" className={FINELY_OS_PRIMARY_BTN}>
              Preview <ExternalLink size={14} />
            </a>
            <a href="/admin/funnel-experiments" className={FINELY_OS_SECONDARY_BTN}>
              A/B experiments →
            </a>
          </div>
        </FinelyOsGlassPanel>
      </div>
    </PageShell>
  );
}
