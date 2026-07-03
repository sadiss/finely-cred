import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search, Settings, ShieldCheck } from 'lucide-react';
import { countCommsCapabilities, searchCommsCapabilities } from '../../domain/commsCapabilityCatalog';
import { IntegrationGoLivePanel } from '../integrations/IntegrationGoLivePanel';
import { CommsEmailProviderPanel } from './CommsEmailProviderPanel';
import { getCommsSettings, updateCommsSettings } from '../../data/settingsRepo';
import { loadMetaIntegrationConfig, saveMetaIntegrationConfig } from '../../data/metaIntegrationRepo';
import { FINELY_OS_ENTITY_INPUT, FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';
import { StudioSection } from './StudioKpiCards';

export function CommsStudioSettingsPanel() {
  const navigate = useNavigate();
  const [capQuery, setCapQuery] = useState('');
  const [capPage, setCapPage] = useState(0);
  const caps = useMemo(() => searchCommsCapabilities(capQuery), [capQuery]);
  const capPageSize = 60;
  const capPages = Math.max(1, Math.ceil(caps.length / capPageSize));
  const pagedCaps = caps.slice(capPage * capPageSize, capPage * capPageSize + capPageSize);
  const meta = loadMetaIntegrationConfig();
  const comms = getCommsSettings();

  return (
    <div className="space-y-4">
      <StudioSection eyebrow="delivery settings" title="Settings — domains, compliance, integrations">
        <div className="grid md:grid-cols-3 gap-3">
          <button type="button" className="rounded-2xl border border-white/10 bg-black/30 p-4 text-left hover:border-sky-500/30" onClick={() => navigate('/admin/support')}>
            <div className="font-bold text-white text-sm">Support Inbox</div>
            <div className="text-xs text-white/50 mt-1">Live partner threads (Hub mirror)</div>
          </button>
          <button type="button" className="rounded-2xl border border-white/10 bg-black/30 p-4 text-left hover:border-sky-500/30" onClick={() => navigate('/admin/calendar')}>
            <Calendar size={16} className="text-sky-300 mb-2" />
            <div className="font-bold text-white text-sm">Calendar bridges</div>
            <div className="text-xs text-white/50 mt-1">Meeting invites & scheduled sends</div>
          </button>
          <button type="button" className="rounded-2xl border border-white/10 bg-black/30 p-4 text-left hover:border-violet-500/30" onClick={() => navigate('/admin/social-hub')}>
            <Settings size={16} className="text-violet-300 mb-2" />
            <div className="font-bold text-white text-sm">Meta inbox bridge</div>
            <div className="text-xs text-white/50 mt-1">{meta.connectedPages.length} page(s) connected</div>
          </button>
        </div>
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex gap-3">
          <ShieldCheck className="text-emerald-300 shrink-0" size={20} />
          <div className="text-sm text-white/70">
            TCPA / CAN-SPAM: marketing sends require consent evidence. Velvet Hammer + David Okonkwo gate live broadcasts. Default compose is dry-run.
          </div>
        </div>
      </StudioSection>

      <CommsEmailProviderPanel />

      <StudioSection eyebrow="go-live integrations" title="Email delivery, Meta OAuth, Supabase sync — full depth">
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <label className="block">
            <div className="text-[10px] uppercase tracking-widest text-white/40">From email</div>
            <input
              value={comms.sendgridFromEmail ?? ''}
              onChange={(e) => updateCommsSettings({ sendgridFromEmail: e.target.value })}
              className={`${FINELY_OS_ENTITY_INPUT} mt-2 w-full`}
              placeholder="noreply@finelycred.com"
            />
          </label>
          <label className="block">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Production site URL (Meta OAuth)</div>
            <input
              value={meta.productionSiteUrl ?? ''}
              onChange={(e) => saveMetaIntegrationConfig({ ...meta, productionSiteUrl: e.target.value })}
              className={`${FINELY_OS_ENTITY_INPUT} mt-2 w-full`}
              placeholder="https://finelycred.com"
            />
          </label>
        </div>
        <IntegrationGoLivePanel compact />
      </StudioSection>

      <StudioSection eyebrow="capability registry" title={`${countCommsCapabilities()}+ comms options — searchable catalog`}>
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-4 mb-3">
          <Search size={16} className="text-white/35" />
          <input
            value={capQuery}
            onChange={(e) => setCapQuery(e.target.value)}
            placeholder="Search merge fields, compliance, routing…"
            className="w-full bg-transparent py-3 text-sm text-white/80 outline-none"
          />
        </div>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {pagedCaps.map((c) => (
            <div key={`${c.group}-${c.option}`} className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm">
              <span className="text-white/80">{c.option}</span>
              <span className="text-[10px] text-white/35 shrink-0">{c.group}</span>
            </div>
          ))}
        </div>
        {capPages > 1 ? (
          <div className="flex items-center justify-between gap-2 mt-3">
            <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={capPage <= 0} onClick={() => setCapPage((p) => p - 1)}>
              Previous
            </button>
            <span className="text-xs text-white/50">
              Page {capPage + 1} of {capPages} · {caps.length} capabilities
            </span>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={capPage >= capPages - 1} onClick={() => setCapPage((p) => p + 1)}>
              Next
            </button>
          </div>
        ) : null}
        <button type="button" className={`${FINELY_OS_SECONDARY_BTN} mt-3`} onClick={() => navigate('/admin/automations?room=catalog')}>
          Open automation trigger catalog
        </button>
      </StudioSection>
    </div>
  );
}
