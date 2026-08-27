import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FinelyUnifiedHubLayout } from '../unified/FinelyUnifiedHubLayout';
import { listCommsSends, listCommsTemplates } from '../../data/commsRepo';
import { listCommsSequences } from '../../data/commsSequencesRepo';
import { listLeadCaptures } from '../../data/leadsRepo';
import { listInboxMessages, listScheduledPosts } from '../../data/socialHubRepo';
import { FINELY_OS_ENTITY_BODY } from '../os/finelyOsLightUi';
import { MarketingVividActionTile } from '../marketingDepartment/marketingHubUi';

const LANES = ['promote', 'nurture', 'communicate'] as const;
type Lane = (typeof LANES)[number];

const LANE_HELP: Record<Lane, string> = {
  promote: 'promote_lane',
  nurture: 'nurture_lane',
  communicate: 'communicate_lane',
};

function parseLane(raw: string | null): Lane {
  if (raw && LANES.includes(raw as Lane)) return raw as Lane;
  return 'promote';
}

const LANE_TOOLS: Record<
  Lane,
  Array<{ title: string; detail: string; href: string; accent: 'emerald' | 'sky' | 'violet' | 'fuchsia' | 'amber'; purpose: string }>
> = {
  promote: [
    { title: 'Lead Magnets', detail: 'Funnels, heroes, capture forms', href: '/admin/lead-magnets', accent: 'amber', purpose: 'Capture intent' },
    { title: 'Social Hub', detail: 'Meta scheduling, inbox, autopilot', href: '/admin/social-hub', accent: 'sky', purpose: 'Organic reach' },
    { title: 'Content Studio', detail: 'Video, e-books, publish bridges', href: '/admin/marketing?tab=content', accent: 'violet', purpose: 'Create assets' },
    { title: 'CMO Command', detail: 'Campaigns, angles, channel mix', href: '/admin/cmo', accent: 'fuchsia', purpose: 'Strategy' },
    { title: 'Lead hunt preview', detail: 'Live search + scoring (Find room)', href: '/admin/marketing?tab=desk&helper=find', accent: 'emerald', purpose: 'Find people' },
  ],
  nurture: [
    { title: 'Comms Studio', detail: 'Inbox, compose, 300+ templates, sequences', href: '/admin/comms?room=sequences', accent: 'fuchsia', purpose: 'Email sequences ($0)' },
    { title: 'Automation Studio', detail: 'Blueprints, flow builder, trigger catalog', href: '/admin/automations?room=scenarios', accent: 'amber', purpose: 'Triggers' },
    { title: 'Training Academy', detail: 'Courses, drips, certifications', href: '/admin/courses', accent: 'violet', purpose: 'Education drips' },
    { title: 'Resources', detail: 'Guides and downloadable assets', href: '/admin/resources', accent: 'sky', purpose: 'Lead magnets' },
  ],
  communicate: [
    { title: 'Partner conversations', detail: 'Live partner threads', href: '/admin/support', accent: 'emerald', purpose: 'Conversations' },
    { title: 'Comms campaigns', detail: 'Broadcasts + segments', href: '/admin/comms?room=campaigns', accent: 'fuchsia', purpose: 'Broadcasts' },
    { title: 'Calendar', detail: 'Strategy calls + video bridges', href: '/admin/calendar', accent: 'sky', purpose: 'Book sessions' },
    { title: 'Phone Hub', detail: 'SMS, voicemail, co-owner escalation', href: '/admin/phone-hub', accent: 'amber', purpose: 'Voice/SMS' },
    { title: 'CRM', detail: 'Pipeline, routing, consult prep', href: '/admin/crm', accent: 'violet', purpose: 'Pipeline' },
  ],
};

export function GrowthCommandDepartmentPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const lane = parseLane(searchParams.get('lane'));
  const [version] = useState(0);

  const metrics = useMemo(() => {
    void version;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const sends = listCommsSends(400).filter((s) => Date.parse(s.createdAt) >= weekAgo);
    const leads = listLeadCaptures().filter((l) => Date.parse(l.createdAt) >= weekAgo);
    const posts = listScheduledPosts().filter((p) => Date.parse(p.createdAt) >= weekAgo);
    const inbox = listInboxMessages();
    return {
      sends: sends.length,
      leads: leads.length,
      posts: posts.length,
      replies: inbox.filter((m) => m.direction === 'inbound').length,
      templates: listCommsTemplates().length,
      sequences: listCommsSequences().length,
    };
  }, [version]);

  const setLane = (id: Lane) => {
    const next = new URLSearchParams(searchParams);
    next.set('lane', id);
    setSearchParams(next, { replace: true });
  };

  const kpis = [
    { label: 'Sends this week', value: String(metrics.sends), hint: 'Portal + email + SMS', accent: 'fuchsia' as const },
    { label: 'New leads', value: String(metrics.leads), hint: 'Captured inbound', accent: 'emerald' as const },
    { label: 'Social posts', value: String(metrics.posts), hint: 'Queued or published', accent: 'sky' as const },
    { label: 'Comms depth', value: `${metrics.templates}+`, hint: `${metrics.sequences} sequences`, accent: 'amber' as const },
  ];

  return (
    <FinelyUnifiedHubLayout
      eyebrow="Marketing plan"
      title="Promote · Nurture · Communicate"
      subtitle="Each lane has a different job — tiles are full-color so you always know which funnel stage you are in."
      accent="emerald"
      kpis={kpis}
      tabs={[
        { id: 'promote', label: 'Promote' },
        { id: 'nurture', label: 'Nurture' },
        { id: 'communicate', label: 'Communicate' },
      ]}
      activeTab={lane}
      onTabChange={(id) => setLane(id as Lane)}
      tabDensity="comfortable"
      tabStripVariant="marketing"
      primaryAction={{ label: 'Open Comms Studio', onClick: () => navigate('/admin/comms') }}
      secondaryAction={{ label: 'Leads & CRM', onClick: () => navigate('/admin/marketing?tab=leads') }}
      contentVariant="flush"
    >
      <p className={`text-sm mb-4 ${FINELY_OS_ENTITY_BODY}`}>
        <strong className="text-white/90">Purpose of {lane}:</strong>{' '}
        {lane === 'promote' ? 'Get new names into the pipeline.' : lane === 'nurture' ? 'Warm them with sequences and education.' : 'Talk, book, and close conversations.'}
        {' '}Tap <strong className="text-white/90">?</strong> on any tile for what it does.
      </p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {LANE_TOOLS[lane].map((tool) => (
          <MarketingVividActionTile
            key={tool.href}
            accent={tool.accent}
            eyebrow={tool.purpose}
            title={tool.title}
            detail={tool.detail}
            helpId={LANE_HELP[lane]}
            onClick={() => navigate(tool.href)}
          />
        ))}
      </div>
    </FinelyUnifiedHubLayout>
  );
}
