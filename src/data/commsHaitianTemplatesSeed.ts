import type { CommsTemplate } from '../domain/comms';
import { wrapTwoVoiceEmailHtml } from '../comms/twoVoiceEmailHtml';
import { listCommsTemplates, upsertCommsTemplate } from './commsRepo';
import { defaultSignatureHtml } from './emailDomainsRepo';
import { wrapFinelyEmailHtml, buildDefaultEmailFooter, buildPrimaryCtaButton } from '../comms/prebuiltHtmlEmailLayout';

function nowIso() {
  return new Date().toISOString();
}

function haitianTpl(
  id: string,
  name: string,
  subject: string,
  body: string,
  locale: 'en' | 'ht',
  pairId: string,
  kind: 'welcome' | 'kit' | 'session' | 'news',
): Omit<CommsTemplate, 'createdAt' | 'updatedAt'> {
  return {
    id,
    name,
    channel: 'email',
    enabled: true,
    subjectTemplate: subject,
    bodyTemplate: body,
    tags: ['haitian', 'html', 'seed', `locale:${locale}`, kind],
    meta: {
      contentType: 'html',
      emailDomainId: 'domain_finely_primary',
      locale,
      pairId,
      haitianKind: kind,
    },
  };
}

const WELCOME_EN = wrapFinelyEmailHtml({
  headline: 'Haitian community is open, {{firstName}}',
  subheadline: 'Credit help for Haitian Americans.',
  bodyHtml: `<p style="margin:0 0 16px;">Hi {{firstName}},</p>
<p style="margin:0 0 16px;">You asked for Haitian community. We help with credit letters, collections, and a next step. Pale Kreyòl when you want to talk.</p>
${buildPrimaryCtaButton({ label: 'Open Haitian community', href: 'https://finelycred.com/haitian' })}
<p style="margin:16px 0 0;font-size:13px;color:#64748b;">Results vary · not legal advice · funding subject to underwriting</p>`,
  signatureHtml: defaultSignatureHtml('Marie-Claire Baptiste', 'Haitian Community Guide'),
  footerHtml: buildDefaultEmailFooter('{{partner.profile.email}}'),
  headerTheme: 'emerald',
});

const WELCOME_HT = wrapTwoVoiceEmailHtml({
  headline: 'Kominote ayisyen ouvè, {{firstName}}',
  subheadline: 'Nou ede w ak kredi, lèt, ak kolektè.',
  englishArtifact: 'Credit help for Haitian Americans.',
  kreyolMeaning: 'Nou ede w ak dosye kredi, lèt, ak kolektè. Pale Kreyòl.',
  englishWords: 'credit file, letter, collection',
  ctaLabel: 'Ouvri kominote ayisyen',
  ctaHref: 'https://finelycred.com/haitian',
});

const KIT_EN = wrapFinelyEmailHtml({
  headline: 'One Haitian community piece',
  subheadline: 'Read this piece. Then take one English step.',
  bodyHtml: `<p style="margin:0 0 16px;">Hi {{firstName}},</p>
<p style="margin:0 0 16px;">We sent one Haitian community piece — not a zip of thirty. Stay with the person you are helping. Read this page. Then take one English step and stop there.</p>
${buildPrimaryCtaButton({ label: 'Open Haitian community', href: 'https://finelycred.com/haitian' })}
<p style="margin:16px 0 0;font-size:13px;color:#64748b;">Results vary · not legal advice · funding subject to underwriting</p>`,
  signatureHtml: defaultSignatureHtml('Samuel Augustin', 'Community Walkthrough'),
  footerHtml: buildDefaultEmailFooter('{{partner.profile.email}}'),
  headerTheme: 'emerald',
});

const KIT_HT = wrapTwoVoiceEmailHtml({
  headline: 'Kit kredi ou yo pare',
  subheadline: 'Enprime, pòste, oswa skan. Apre sa, yon sèl etap angle.',
  englishArtifact: 'Download your credit kits. Then open one English page.',
  kreyolMeaning: 'Telechaje kit kredi yo. Apre sa, ouvri yon sèl paj angle — dosye pèsonèl oswa dèt.',
  englishWords: 'download, kit, restore, debt',
  ctaLabel: 'Telechaje kit yo',
  ctaHref: 'https://finelycred.com/free-kreyol-guide',
});

const SESSION_EN = wrapFinelyEmailHtml({
  headline: 'Your strategy call is on the calendar',
  subheadline: 'Bring the English letter. We will say what it means.',
  bodyHtml: `<p style="margin:0 0 16px;">Hi {{firstName}},</p>
<p style="margin:0 0 16px;">Bring the English letter or bureau page. We will keep that line on screen and explain it in Kreyòl. One next step after the call.</p>
${buildPrimaryCtaButton({ label: 'Open your calendar', href: '{{links.calendar}}' })}
<p style="margin:16px 0 0;font-size:13px;color:#64748b;">Results vary · not legal advice · funding subject to underwriting</p>`,
  footerHtml: buildDefaultEmailFooter('{{partner.profile.email}}'),
  headerTheme: 'violet',
});

const SESSION_HT = wrapTwoVoiceEmailHtml({
  headline: 'Apèl la sou kalandriye a',
  subheadline: 'Pote lèt angle a. Nou di sa l vle di.',
  englishArtifact: 'Bring the English letter. We will explain the meaning.',
  kreyolMeaning: 'Pote lèt angle a. Nou pral di sans li. Yon sèl pwochen etap apre apèl la.',
  englishWords: 'letter, calendar, next step',
  ctaLabel: 'Ouvri kalandriye a',
  ctaHref: '{{links.calendar}}',
});

const NEWS_EN = wrapFinelyEmailHtml({
  headline: 'This week in credit news',
  subheadline: 'What moved — and one useful action.',
  bodyHtml: `<p style="margin:0 0 16px;">Hi {{firstName}},</p>
<p style="margin:0 0 8px;font-weight:800;">{{newsHeadline}}</p>
<p style="margin:0 0 16px;">{{newsMeaning}}</p>
${buildPrimaryCtaButton({ label: 'Open Credit news', href: '{{links.portal}}/news' })}
<p style="margin:16px 0 0;font-size:13px;color:#64748b;">Results vary · not legal advice · funding subject to underwriting</p>`,
  footerHtml: buildDefaultEmailFooter('{{partner.profile.email}}'),
  headerTheme: 'slate',
});

const NEWS_HT = wrapTwoVoiceEmailHtml({
  headline: 'Nouvèl kredi semèn sa a',
  subheadline: 'Sa ki deplase — ak yon aksyon itil.',
  englishArtifact: '{{newsHeadline}}',
  kreyolMeaning: '{{newsMeaningHt}}',
  englishWords: 'credit news, report, letter',
  bodyHtml: `<p style="margin:0 0 16px;">{{newsMeaning}}</p>`,
  ctaLabel: 'Ouvri nouvèl kredi',
  ctaHref: '{{links.portal}}/news',
});

const HAITIAN_TEMPLATES: Array<Omit<CommsTemplate, 'createdAt' | 'updatedAt'>> = [
  haitianTpl('tpl_haitian_welcome_en', 'Haitian community welcome (English)', 'Haitian community is open, {{firstName}}', WELCOME_EN, 'en', 'tpl_haitian_welcome_ht', 'welcome'),
  haitianTpl('tpl_haitian_welcome_ht', 'Haitian community welcome (Kreyòl)', 'Kominote ayisyen ouvè, {{firstName}}', WELCOME_HT, 'ht', 'tpl_haitian_welcome_en', 'welcome'),
  haitianTpl('tpl_haitian_kit_en', 'Credit kits sent (English)', 'Your credit kits are ready, {{firstName}}', KIT_EN, 'en', 'tpl_haitian_kit_ht', 'kit'),
  haitianTpl('tpl_haitian_kit_ht', 'Credit kits sent (Kreyòl)', 'Kit kredi ou yo pare, {{firstName}}', KIT_HT, 'ht', 'tpl_haitian_kit_en', 'kit'),
  haitianTpl('tpl_haitian_session_en', 'Haitian session reminder (English)', 'Your strategy call is on the calendar', SESSION_EN, 'en', 'tpl_haitian_session_ht', 'session'),
  haitianTpl('tpl_haitian_session_ht', 'Haitian session reminder (Kreyòl)', 'Apèl la sou kalandriye a', SESSION_HT, 'ht', 'tpl_haitian_session_en', 'session'),
  haitianTpl('tpl_haitian_news_en', 'Credit news digest (English)', 'This week in credit news', NEWS_EN, 'en', 'tpl_haitian_news_ht', 'news'),
  haitianTpl('tpl_haitian_news_ht', 'Credit news digest (Kreyòl)', 'Nouvèl kredi semèn sa a', NEWS_HT, 'ht', 'tpl_haitian_news_en', 'news'),
];

export function haitianTemplateIdForKind(kind: 'welcome' | 'kit' | 'session' | 'news', voice: 'en' | 'ht'): string {
  return `tpl_haitian_${kind}_${voice}`;
}

export function ensureHaitianCommsTemplatesOnce() {
  const existing = new Map(listCommsTemplates().map((t) => [t.id, t]));
  const ts = nowIso();
  for (const tpl of HAITIAN_TEMPLATES) {
    const cur = existing.get(tpl.id);
    if (cur && cur.meta?.seedLocked) continue;
    if (cur && cur.bodyTemplate.includes('<!DOCTYPE html>') && cur.updatedAt > '2020-01-01' && !cur.tags?.includes('seed')) {
      continue;
    }
    upsertCommsTemplate({
      ...tpl,
      createdAt: cur?.createdAt ?? ts,
      updatedAt: ts,
      meta: { ...(cur?.meta ?? {}), ...(tpl.meta ?? {}), seededAt: ts },
    });
  }
}
