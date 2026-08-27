import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Mail, MessageSquare, Plus, Search, Send, ShieldCheck, Sparkles, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { createCommsTemplate, deleteCommsTemplate, listCommsTemplates, setCommsTemplateEnabled } from '../../data/commsRepo';
import type { CommsChannel } from '../../domain/comms';
import { ALL_TEMPLATE_VAR_KEYS, TEMPLATE_VARIABLE_GROUPS } from '../../comms/templateVariables';
import { COMMS_TEMPLATE_CATEGORIES, type CommsTemplateCategory } from '../../domain/commsTemplateCategories';
import { COMMS_EMAIL_PROVIDERS, type CommsEmailProviderId } from '../../domain/commsEmailProviders';
import { CommsTemplateCard } from './CommsTemplateCard';
import { StudioKpiCards, StudioSection } from './StudioKpiCards';
import { FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';

const CHANNELS: Array<CommsChannel | 'all'> = ['all', 'email', 'sms', 'portal'];
const PAGE_SIZE = 24;

export function CommsCommandLibrary() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState('');
  const [channel, setChannel] = useState<CommsChannel | 'all'>('all');
  const [category, setCategory] = useState<CommsTemplateCategory | 'all'>('all');
  const [provider, setProvider] = useState<CommsEmailProviderId | 'all'>('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newName, setNewName] = useState('Premium dispute round update');
  const [page, setPage] = useState(0);
  const [showHtml, setShowHtml] = useState(true);
  const templates = useMemo(() => listCommsTemplates(), [version]);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (channel !== 'all' && t.channel !== channel) return false;
      if (category !== 'all' && t.meta?.category !== category) return false;
      if (provider !== 'all' && t.meta?.emailProvider !== provider && t.channel === 'email') return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return [t.name, t.subjectTemplate || '', t.bodyTemplate, ...(t.tags ?? []), t.meta?.category].join(' ').toLowerCase().includes(q);
    });
  }, [templates, query, channel, category, provider]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const active = useMemo(() => templates.find((t) => t.id === activeId) ?? paged[0] ?? null, [templates, activeId, paged]);

  const kpis = [
    { label: 'Templates', value: templates.length, hint: 'Email · SMS · portal — full library', tone: 'amber' as const },
    { label: 'Enabled', value: templates.filter((t) => t.enabled).length, hint: 'Production-ready', tone: 'emerald' as const },
    { label: 'SMS', value: templates.filter((t) => t.channel === 'sms').length, hint: 'TCPA-safe alerts + nurture', tone: 'sky' as const },
    { label: 'Dispute ops', value: templates.filter((t) => t.meta?.category === 'dispute_rounds' || t.meta?.category === 'complaints_escalation').length, hint: 'R1–R4 + escalation', tone: 'violet' as const },
  ];

  function createPremiumTemplate() {
    const t = createCommsTemplate({
      name: newName.trim() || 'Premium campaign template',
      channel: 'email',
      enabled: false,
      subjectTemplate: 'Your next Finely Cred step is ready, {{firstName}}',
      bodyTemplate:
        'Hi {{firstName}},\n\nHere is the next clean step based on your dispute workflow. Review the portal, upload evidence, and book when ready.\n\nCTA: {{trackedLink}}\n\nRespectfully,\n{{staffOnDuty}}',
      tags: ['premium', 'dispute', 'review-required'],
      meta: { source: 'studio_command_os', layout: 'modern', category: 'dispute_rounds', emailProvider: 'finely_native', contentType: 'plain' },
    });
    setActiveId(t.id);
    setVersion((v) => v + 1);
  }

  return (
    <div className="space-y-6">
      <StudioKpiCards items={kpis} />
      <StudioSection
        eyebrow="enterprise template library"
        title={`${filtered.length} templates — modern cards, categories, providers, roles`}
        right={
          <button className="fc-button-brand" type="button" onClick={createPremiumTemplate}>
            <Plus size={14} /> Create template
          </button>
        }
      >
        <div className="grid lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-4">
            <Search size={16} className="text-white/35" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              className="w-full bg-transparent py-3 text-sm text-white/80 outline-none placeholder:text-white/25"
              placeholder="Search templates, dispute rounds, SMS, roles…"
            />
          </div>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} className="fc-input" placeholder="New template name" />
          <button type="button" className="fc-button-soft" onClick={() => setShowHtml((v) => !v)}>
            <Sparkles size={14} /> {showHtml ? 'HTML preview on' : 'HTML preview off'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {CHANNELS.map((c) => (
            <button key={c} className={channel === c ? 'fc-button-brand' : 'fc-button-soft'} type="button" onClick={() => { setChannel(c); setPage(0); }}>
              {c === 'all' ? 'All channels' : c.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-2 items-center">
          <Filter size={14} className="text-white/35" />
          <button type="button" className={category === 'all' ? 'fc-button-brand' : 'fc-button-soft'} onClick={() => { setCategory('all'); setPage(0); }}>All categories</button>
          {COMMS_TEMPLATE_CATEGORIES.slice(0, 8).map((c) => (
            <button key={c.id} type="button" className={category === c.id ? 'fc-button-brand' : 'fc-button-soft'} onClick={() => { setCategory(c.id); setPage(0); }}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <button type="button" className={provider === 'all' ? 'fc-button-brand' : 'fc-button-soft'} onClick={() => setProvider('all')}>All providers</button>
          {COMMS_EMAIL_PROVIDERS.map((p) => (
            <button key={p.id} type="button" className={provider === p.id ? 'fc-button-brand' : 'fc-button-soft'} onClick={() => setProvider(p.id)}>
              {p.label.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
          {paged.map((t) => (
            <CommsTemplateCard key={t.id} template={t} active={active?.id === t.id} onClick={() => setActiveId(t.id)} />
          ))}
        </div>

        {pageCount > 1 ? (
          <div className="flex items-center justify-between gap-2 mt-4">
            <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span className="text-xs text-white/50">Page {page + 1} of {pageCount} · {filtered.length} templates</span>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        ) : null}
      </StudioSection>

      {active ? (
        <StudioSection
          eyebrow="template workstation"
          title={active.name}
          right={
            <div className="flex flex-wrap gap-2">
              <button type="button" className="fc-button-brand" onClick={() => navigate(`/admin/comms?room=compose&templateId=${active.id}`)}>
                <Send size={14} /> Test send
              </button>
              <button type="button" className="fc-button-soft" onClick={() => { setCommsTemplateEnabled(active.id, !active.enabled); setVersion((v) => v + 1); }}>
                {active.enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />} {active.enabled ? 'Disable' : 'Enable'}
              </button>
              <button type="button" className="fc-button-soft" onClick={() => { deleteCommsTemplate(active.id); setActiveId(null); setVersion((v) => v + 1); }}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          }
        >
          <div className="grid lg:grid-cols-4 gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Channel</div>
              <div className="mt-3 text-white font-black inline-flex gap-2">
                {active.channel === 'sms' ? <MessageSquare size={18} /> : <Mail size={18} />} {active.channel.toUpperCase()}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Category</div>
              <div className="mt-3 text-white font-semibold text-sm">{String(active.meta?.category ?? 'General')}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Provider</div>
              <div className="mt-3 text-white font-semibold text-sm">{String(active.meta?.emailProvider ?? 'finely_native')}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Compliance</div>
              <div className="mt-3 text-white font-black inline-flex gap-2"><ShieldCheck size={18} /> Velvet Hammer</div>
            </div>
          </div>

          {active.subjectTemplate ? (
            <div className="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-5 text-violet-100 mt-4">
              <div className="text-[10px] uppercase tracking-widest opacity-70">Subject</div>
              <div className="mt-2 font-semibold">{active.subjectTemplate}</div>
            </div>
          ) : null}

          {showHtml && (active.meta?.contentType === 'html' || active.bodyTemplate.trim().startsWith('<')) ? (
            <div className="rounded-3xl border border-white/10 bg-white mt-4 overflow-hidden shadow-2xl">
              <iframe title="HTML preview" className="w-full min-h-[420px] border-0" srcDoc={active.bodyTemplate} sandbox="" />
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-black/30 p-5 mt-4">
              <pre className="text-sm text-white/75 whitespace-pre-wrap font-sans leading-relaxed">{active.bodyTemplate}</pre>
            </div>
          )}

          <div className="mt-4 rounded-3xl border border-violet-400/20 bg-violet-500/10 p-5">
            <div className="text-[10px] uppercase tracking-widest text-violet-200/70">Merge fields ({ALL_TEMPLATE_VAR_KEYS.length})</div>
            <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {TEMPLATE_VARIABLE_GROUPS.map((g) => (
                <div key={g.label} className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <div className="text-xs font-bold text-white/70">{g.label}</div>
                  <div className="text-xs text-white/40 mt-1">{g.vars.slice(0, 6).map((v) => v.key).join(', ')}</div>
                </div>
              ))}
            </div>
          </div>
        </StudioSection>
      ) : null}
    </div>
  );
}
