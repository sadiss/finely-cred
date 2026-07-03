import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FinelyUnifiedHubLayout } from '../unified/FinelyUnifiedHubLayout';
import { listCommsSends, listCommsTemplates } from '../../data/commsRepo';
import { listCommsSequences } from '../../data/commsSequencesRepo';
import { listLeadCaptures } from '../../data/leadsRepo';
import { listInboxMessages, listScheduledPosts } from '../../data/socialHubRepo';
import { FINELY_OS_ENTITY_BODY } from '../os/finelyOsLightUi';

const LANES = ['promote', 'nurture', 'communicate'] as const;
type Lane = (typeof LANES)[number];

function parseLane(raw: string | null): Lane {
  if (raw && LANES.includes(raw as Lane)) return raw as Lane;
  return 'promote';
}

const LANE_TOOLS: Record<
  Lane,
  Array<{ title: string; detail: string; href: string; accent: string }>
> = {
  promote: [
    { title: 'Lead Magnets', detail: 'Funnels, heroes, capture forms', href: '/admin/lead-magnets', accent: 'amber' },
    { title: 'Social Hub', detail: 'Meta scheduling, inbox, autopilot', href: '/admin/social-hub', accent: 'sky' },
    { title: 'Content Studio', detail: 'Video, e-books, publish bridges', href: '/admin/content-studio', accent: 'violet' },
    { title: 'CMO Command', detail: 'Campaigns, angles, channel mix', href: '/admin/cmo', accent: 'fuchsia' },
    { title: 'Lead Intel', detail: 'Swarm discovery + scoring', href: '/admin/lead-intel', accent: 'emerald' },
  ],
  nurture: [
    { title: 'Comms Studio', detail: 'Inbox, compose, 300+ templates, sequences', href: '/admin/comms?room=sequences', accent: 'fuchsia' },
    { title: 'Automation Studio', detail: 'Blueprints, flow builder, trigger catalog', href: '/admin/automations?room=scenarios', accent: 'amber' },
    { title: 'Training Academy', detail: 'Courses, drips, certifications', href: '/admin/courses', accent: 'violet' },
    { title: 'Resources', detail: 'Guides and downloadable assets', href: '/admin/resources', accent: 'sky' },
  ],
  communicate: [
    { title: 'Support Inbox', detail: 'Live partner threads', href: '/admin/support', accent: 'emerald' },
    { title: 'Comms campaigns', detail: 'Broadcasts + segments', href: '/admin/comms?room=campaigns', accent: 'fuchsia' },
    { title: 'Calendar', detail: 'Strategy calls + video bridges', href: '/admin/calendar', accent: 'sky' },
    { title: 'Phone Hub', detail: 'SMS, voicemail, co-owner escalation', href: '/admin/phone-hub', accent: 'amber' },
    { title: 'CRM', detail: 'Pipeline, routing, consult prep', href: '/admin/crm', accent: 'violet' },
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
      eyebrow="Growth command"
      title="Promote · Nurture · Communicate"
      subtitle="One operating surface — full-depth tools behind each lane (never a downgrade to a card gallery only)."
      accent="emerald"
      kpis={kpis}
      tabs={[
        { id: 'promote', label: 'Promote' },
        { id: 'nurture', label: 'Nurture' },
        { id: 'communicate', label: 'Communicate' },
      ]}
      activeTab={lane}
      onTabChange={(id) => setLane(id as Lane)}
      primaryAction={{ label: 'Open Comms Studio', onClick: () => navigate('/admin/comms') }}
      secondaryAction={{ label: 'Leads OS', onClick: () => navigate('/admin/leads-os') }}
      contentVariant="flush"
    >
      <p className={`text-sm mb-4 ${FINELY_OS_ENTITY_BODY}`}>
        Each tile opens the full department workspace — same depth as Comms Studio department tabs, not a simplified substitute.
      </p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {LANE_TOOLS[lane].map((tool) => (
          <button
            key={tool.href}
            type="button"
            onClick={() => navigate(tool.href)}
            className="rounded-2xl border border-white/10 bg-black/30 p-5 text-left hover:border-emerald-500/35 hover:bg-emerald-500/5 transition"
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-300/80">{lane}</div>
            <div className="mt-2 text-lg font-black text-white">{tool.title}</div>
            <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>{tool.detail}</p>
          </button>
        ))}
      </div>
    </FinelyUnifiedHubLayout>
  );
}
