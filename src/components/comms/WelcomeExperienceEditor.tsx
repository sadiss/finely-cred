import React, { useMemo } from 'react';
import { ExternalLink, Mail, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PostLoginWelcomeSettings } from '../../domain/settings';
import type { Partner } from '../../domain/partners';
import type { User } from '@supabase/supabase-js';
import { MessageTemplateEditor } from './MessageTemplateEditor';
import { buildMessageContext } from '../../comms/buildMessageContext';
import { WELCOME_EMAIL_SUBJECT_STARTER, WELCOME_HTML_STARTER } from '../../comms/templateVariables';
import { getCommsTemplate, listCommsTemplates } from '../../data/commsRepo';
import { getRenderedWelcomeMessage } from '../../onboarding/welcomeMessage';
import { renderTextTemplate } from '../../utils/textTemplate';
import { sanitizeHtmlForPreview } from '../../utils/richText';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

type TextInputProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helperText?: string;
};

function Field({ label, value, onChange, placeholder, helperText }: TextInputProps) {
  return (
    <label className="space-y-2 block">
      <span className={FINELY_OS_ENTITY_LABEL}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={FINELY_OS_ENTITY_INPUT}
      />
      {helperText ? <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>{helperText}</div> : null}
    </label>
  );
}

export function WelcomeExperienceEditor({
  value,
  onChange,
  previewUser,
  previewPartner,
}: {
  value: PostLoginWelcomeSettings;
  onChange: (patch: Partial<PostLoginWelcomeSettings>) => void;
  previewUser?: User | null;
  previewPartner?: Partner | null;
}) {
  const navigate = useNavigate();
  const mode = value.mode || 'simple';
  const templates = useMemo(() => listCommsTemplates().filter((t) => t.channel === 'email' || t.channel === 'portal'), []);
  const ctx = useMemo(() => buildMessageContext({ user: previewUser, partner: previewPartner }), [previewUser, previewPartner]);

  const simplePreview = getRenderedWelcomeMessage({ user: previewUser ?? null, partner: previewPartner, overrides: value });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-fuchsia-400">
            <Sparkles size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Welcome & intro experience</span>
          </div>
          <p className="mt-2 text-white/55 text-sm max-w-2xl">
            Controls the banner customers see after sign-in, optional welcome email, and ties into{' '}
            <button type="button" onClick={() => navigate('/admin/comms')} className="text-fuchsia-300 hover:text-fuchsia-200 underline">
              Comms Studio
            </button>{' '}
            templates for outbound delivery.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/comms')}
          className={FINELY_OS_SECONDARY_BTN}
        >
          Open Comms Studio <ExternalLink size={14} />
        </button>
      </div>

      <div className={FINELY_OS_VIEW_TABS}>
        {(['simple', 'html', 'comms'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange({ mode: m })}
            className={finelyOsViewTab(mode === m, 'fuchsia')}
          >
            {m === 'simple' ? 'Simple text' : m === 'html' ? 'HTML template' : 'Comms template'}
          </button>
        ))}
      </div>

      <label className="inline-flex items-center gap-3 text-sm text-white/70">
        <input
          type="checkbox"
          checked={value.enabled !== false}
          onChange={(e) => onChange({ enabled: e.target.checked })}
        />
        Show welcome banner after sign-in
      </label>

      {mode === 'simple' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Field label="Headline" value={value.headline ?? ''} onChange={(v) => onChange({ headline: v })} placeholder="Welcome back, {{firstName}}" />
          <Field label="Button label" value={value.ctaLabel ?? ''} onChange={(v) => onChange({ ctaLabel: v })} placeholder="Upload a report" />
          <div className="lg:col-span-2 space-y-2">
            <span className={FINELY_OS_ENTITY_LABEL}>Message body</span>
            <textarea
              value={value.body ?? ''}
              onChange={(e) => onChange({ body: e.target.value })}
              rows={4}
              className={`${FINELY_OS_ENTITY_INPUT} w-full`}
            />
          </div>
          <Field label="Button path" value={value.ctaPath ?? ''} onChange={(v) => onChange({ ctaPath: v })} placeholder="/portal/reports" />
        </div>
      )}

      {mode === 'html' && (
        <MessageTemplateEditor
          html={value.htmlTemplate || WELCOME_HTML_STARTER}
          onChangeHtml={(htmlTemplate) => onChange({ htmlTemplate })}
          previewContext={ctx}
          placeholder="Welcome message HTML…"
        />
      )}

      {mode === 'comms' && (
        <div className="grid md:grid-cols-2 gap-4">
          <label className="space-y-2 block">
            <span className={FINELY_OS_ENTITY_LABEL}>Linked Comms template</span>
            <select
              value={value.commsTemplateId ?? ''}
              onChange={(e) => onChange({ commsTemplateId: e.target.value || undefined })}
              className={FINELY_OS_ENTITY_INPUT}
            >
              <option value="">Select a template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.channel})
                </option>
              ))}
            </select>
            <div className="text-white/40 text-xs">Edit and send this template from Comms Studio. Banner uses the rendered body.</div>
          </label>
          {value.commsTemplateId ? (
            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony text-sm ${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap`}>
              {(() => {
                const tpl = getCommsTemplate(value.commsTemplateId!);
                if (!tpl) return 'Template not found.';
                return renderTextTemplate(tpl.bodyTemplate, ctx);
              })()}
            </div>
          ) : null}
        </div>
      )}

      <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-4`}>
        <div className="flex items-center gap-2 text-emerald-300">
          <Mail size={16} />
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Welcome email (optional)</span>
        </div>
        <label className="inline-flex items-center gap-3 text-sm text-white/70">
          <input
            type="checkbox"
            checked={Boolean(value.sendWelcomeEmail)}
            onChange={(e) => onChange({ sendWelcomeEmail: e.target.checked })}
          />
          Enable welcome email template (send manually or via Comms Studio / sequences)
        </label>
        <Field
          label="Email subject"
          value={value.emailSubject ?? WELCOME_EMAIL_SUBJECT_STARTER}
          onChange={(v) => onChange({ emailSubject: v })}
          placeholder={WELCOME_EMAIL_SUBJECT_STARTER}
        />
        <Field label="Simple banner CTA path" value={value.ctaPath ?? ''} onChange={(v) => onChange({ ctaPath: v })} placeholder="/portal/reports" />
      </div>

      <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-3`}>Dashboard banner preview</div>
        {mode === 'html' && value.htmlTemplate ? (
          <div className="welcome-html-preview prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtmlForPreview(renderTextTemplate(value.htmlTemplate, ctx)) }} />
        ) : mode === 'comms' && value.commsTemplateId ? (
          <div className="text-white/70 text-sm whitespace-pre-wrap">
            {renderTextTemplate(getCommsTemplate(value.commsTemplateId!)?.bodyTemplate || '', ctx)}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xl text-white font-light">{simplePreview.headline}</div>
            <div className="text-white/65 text-sm">{simplePreview.body}</div>
            {simplePreview.ctaLabel ? (
              <div className="inline-flex mt-2 px-3 py-1.5 rounded-lg bg-fuchsia-500/20 text-[10px] font-black uppercase tracking-widest text-fuchsia-200">
                {simplePreview.ctaLabel}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
