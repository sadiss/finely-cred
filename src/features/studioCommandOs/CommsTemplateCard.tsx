import React from 'react';
import { Mail, MessageSquare, Inbox, Sparkles } from 'lucide-react';
import type { CommsTemplate } from '../../domain/comms';
import type { CommsTemplateCategory } from '../../domain/commsTemplateCategories';
import { categoryLabel, categoryTone } from '../../domain/commsTemplateCategories';
import type { CommsEmailProviderId } from '../../domain/commsEmailProviders';
import { providerBadgeTone, providerLabel } from '../../domain/commsEmailProviders';

type Props = {
  template: CommsTemplate;
  active?: boolean;
  onClick: () => void;
};

const CHANNEL_ICON = {
  email: Mail,
  sms: MessageSquare,
  portal: Inbox,
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function CommsTemplateCard({ template, active, onClick }: Props) {
  const Icon = CHANNEL_ICON[template.channel];
  const meta = template.meta ?? {};
  const category = meta.category as CommsTemplateCategory | undefined;
  const provider = meta.emailProvider as CommsEmailProviderId | undefined;
  const isHtml = meta.contentType === 'html' || template.bodyTemplate.trim().startsWith('<');
  const preview = isHtml
    ? stripHtml(template.bodyTemplate).slice(0, 140)
    : template.bodyTemplate.slice(0, 140);
  const roles = (meta.staffRoles as string[] | undefined) ?? [];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full text-left rounded-2xl border transition-all duration-200 overflow-hidden ${
        active
          ? 'border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-500/15 via-violet-500/10 to-black/40 shadow-lg shadow-fuchsia-500/10'
          : 'border-white/10 bg-gradient-to-br from-white/[0.06] to-black/30 hover:border-white/20 hover:from-white/[0.08]'
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fuchsia-500/60 via-sky-400/50 to-emerald-400/50 opacity-80" />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl border ${
                template.channel === 'sms' ? 'border-sky-500/30 bg-sky-500/10 text-sky-300' :
                template.channel === 'portal' ? 'border-violet-500/30 bg-violet-500/10 text-violet-300' :
                'border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}>
                <Icon size={15} />
              </span>
              <div className="min-w-0">
                <div className="font-semibold text-white text-sm leading-snug line-clamp-2">{template.name}</div>
                {template.subjectTemplate ? (
                  <div className="text-[11px] text-white/45 mt-0.5 line-clamp-1">{template.subjectTemplate}</div>
                ) : null}
              </div>
            </div>
          </div>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
            template.enabled ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : 'text-white/40 border-white/10'
          }`}>
            {template.enabled ? 'Live' : 'Draft'}
          </span>
        </div>

        <div className={`rounded-xl border p-3 min-h-[72px] ${
          isHtml ? 'border-white/8 bg-gradient-to-b from-slate-900/80 to-black/60' : 'border-white/6 bg-black/25'
        }`}>
          <p className="text-[11px] text-white/55 leading-relaxed line-clamp-3">{preview}…</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {category ? (
            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${categoryTone(category)}`}>
              {categoryLabel(category)}
            </span>
          ) : null}
          {provider && template.channel === 'email' ? (
            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${providerBadgeTone(provider)}`}>
              {providerLabel(provider)}
            </span>
          ) : null}
          {isHtml ? (
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/50">
              HTML
            </span>
          ) : null}
          {roles.slice(0, 2).map((r) => (
            <span key={r} className="rounded-full border border-white/8 px-2 py-0.5 text-[9px] text-white/40">
              {r.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>
      {active ? (
        <div className="absolute top-3 right-3">
          <Sparkles size={14} className="text-fuchsia-300" />
        </div>
      ) : null}
    </button>
  );
}
