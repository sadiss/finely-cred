import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FinelyUnifiedHubLayout } from '../unified/FinelyUnifiedHubLayout';
import { CommsCommandLibrary } from './CommsCommandLibrary';
import { CommsStudioInboxPanel } from './CommsStudioInboxPanel';
import { CommsStudioComposePanel } from './CommsStudioComposePanel';
import { CommsStudioSequencesPanel } from './CommsStudioSequencesPanel';
import { CommsStudioCampaignsPanel } from './CommsStudioCampaignsPanel';
import { CommsStudioSettingsPanel } from './CommsStudioSettingsPanel';
import { listCommsTemplates, listCommsSends } from '../../data/commsRepo';
import { listCommsSequences } from '../../data/commsSequencesRepo';
import { ensureNurtureCommsTemplatesOnce } from '../../data/commsNurtureSeed';
import { ensureCommsHtmlTemplatesOnce } from '../../data/commsHtmlTemplateSeed';
import { ensureBillingCommsTemplates } from '../../data/commsBillingTemplatesSeed';
import { ensureDigestCommsTemplates } from '../../data/commsDigestTemplatesSeed';
import { ensureFunnelSessionCommsTemplates } from '../../data/commsFunnelSessionSeed';
import { ensureProfessionalCommsTemplatesOnce } from '../../data/commsProfessionalTemplateSeed';
import { countCommsCapabilities } from '../../domain/commsCapabilityCatalog';
import { CommsConversationBridgePanel } from './CommsConversationBridgePanel';

const TABS = ['inbox', 'conversations', 'compose', 'templates', 'sequences', 'campaigns', 'calendar', 'settings'] as const;
type Tab = (typeof TABS)[number];

function parseTab(raw: string | null): Tab {
  if (raw && TABS.includes(raw as Tab)) return raw as Tab;
  return 'inbox';
}

function seedAllCommsAssets() {
  ensureNurtureCommsTemplatesOnce();
  ensureCommsHtmlTemplatesOnce();
  ensureBillingCommsTemplates();
  ensureDigestCommsTemplates();
  ensureFunnelSessionCommsTemplates();
  ensureProfessionalCommsTemplatesOnce();
}

export function CommsStudioDepartmentPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [version, setVersion] = useState(0);
  const tab = parseTab(searchParams.get('room'));

  useEffect(() => {
    seedAllCommsAssets();
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!searchParams.get('room')) {
      const next = new URLSearchParams(searchParams);
      next.set('room', 'inbox');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const stats = useMemo(() => {
    void version;
    const templates = listCommsTemplates();
    const emailCount = templates.filter((t) => t.channel === 'email').length;
    const smsCount = templates.filter((t) => t.channel === 'sms').length;
    const sends = listCommsSends(500);
    const failed = sends.filter((s) => s.status === 'error').length;
    return { templates, emailCount, smsCount, sequences: listCommsSequences().length, failed };
  }, [version]);

  const setTab = (id: Tab) => {
    const next = new URLSearchParams(searchParams);
    next.set('room', id);
    setSearchParams(next, { replace: true });
  };

  const bump = () => setVersion((v) => v + 1);

  const kpis = [
    { label: 'Email templates', value: String(stats.emailCount), hint: 'Seeded + custom', accent: 'sky' as const },
    { label: 'SMS templates', value: String(stats.smsCount), hint: 'Text drafts', accent: 'violet' as const },
    { label: 'Sequences', value: String(stats.sequences), hint: 'Nurture + CRM', accent: 'emerald' as const },
    { label: 'Capabilities', value: `${countCommsCapabilities()}+`, hint: 'Searchable in Settings', accent: 'fuchsia' as const },
  ];

  return (
    <FinelyUnifiedHubLayout
      eyebrow="Communication department"
      title="Comms Studio"
      subtitle="Outlook-class inbox, compose, 300+ templates, sequences, campaigns — under Ruth's operating stack."
      accent="fuchsia"
      kpis={kpis}
      tabs={[
        { id: 'inbox', label: 'Inbox', badge: stats.failed || undefined },
        { id: 'conversations', label: 'Conversations' },
        { id: 'compose', label: 'Compose' },
        { id: 'templates', label: 'Templates', badge: stats.templates.length || undefined },
        { id: 'sequences', label: 'Sequences' },
        { id: 'campaigns', label: 'Campaigns' },
        { id: 'calendar', label: 'Calendar' },
        { id: 'settings', label: 'Settings' },
      ]}
      activeTab={tab}
      onTabChange={(id) => setTab(id as Tab)}
      primaryAction={{ label: 'Compose', onClick: () => setTab('compose') }}
      secondaryAction={{ label: 'Partner conversations', onClick: () => navigate('/admin/support') }}
      contentVariant="flush"
      tabDensity="comfortable"
    >
      {tab === 'inbox' ? <CommsStudioInboxPanel /> : null}
      {tab === 'conversations' ? <CommsConversationBridgePanel /> : null}
      {tab === 'compose' ? <CommsStudioComposePanel onSent={bump} /> : null}
      {tab === 'templates' ? <CommsCommandLibrary /> : null}
      {tab === 'sequences' ? <CommsStudioSequencesPanel /> : null}
      {tab === 'campaigns' ? <CommsStudioCampaignsPanel onSent={bump} /> : null}
      {tab === 'calendar' ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-3">
          <p className="text-sm text-white/70">Scheduled sends and meeting bridges live in Calendar — open the full scheduler there.</p>
          <button type="button" className="fc-button-brand" onClick={() => navigate('/admin/calendar')}>
            Open admin calendar
          </button>
        </div>
      ) : null}
      {tab === 'settings' ? <CommsStudioSettingsPanel /> : null}
    </FinelyUnifiedHubLayout>
  );
}
