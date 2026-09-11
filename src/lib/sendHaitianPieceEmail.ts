import { wrapTwoVoiceEmailHtml } from '../comms/twoVoiceEmailHtml';
import { wrapFinelyEmailHtml, buildPrimaryCtaButton, buildDefaultEmailFooter } from '../comms/prebuiltHtmlEmailLayout';
import { defaultSignatureHtml } from '../data/emailDomainsRepo';
import { addCommsSend } from '../data/commsRepo';
import { submitLeadCapture } from '../data/leadsRepo';
import { listPartnersLocal } from '../data/partnersRepo';
import { FINELY_COPY_COMPLIANCE_EN, FINELY_COPY_COMPLIANCE_HT } from './finelyCopyVoice';
import { getPublicSiteOrigin } from './funnelPublicLinks';
import { haitianPieceById, type HaitianPieceSpec } from './haitianPieceSpec';
import { sendEmail } from './commsDeliveryClient';
import { normalizeEmail } from '../domain/partners';

export type HaitianPieceAudience = 'lead' | 'helper' | 'specialist' | 'church' | 'affiliate';

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function firstNameFrom(fullName: string, email: string): string {
  const fromName = fullName.trim().split(/\s+/)[0];
  if (fromName) return fromName;
  const local = email.split('@')[0] || 'there';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function pieceHref(piece: HaitianPieceSpec): string {
  const origin = getPublicSiteOrigin().replace(/\/$/, '');
  return `${origin}${piece.ctaPath}`;
}

function audienceLine(audience: HaitianPieceAudience, locale: 'en' | 'ht', metro?: string): string {
  if (locale === 'ht') {
    if (audience === 'helper')
      return 'Ou gen dwa chita la. Pa pran telefòn nan. Se li ki kenbe l. Ou montre yon fraz angle.';
    if (audience === 'specialist') return 'Yon paj pou kay ki devan ou. Pa trant bwat. Pa afiche yon pri.';
    if (audience === 'church') return 'Enprime paj la. Mete l kote moun deja chita. Yo skan lè yo pare.';
    if (audience === 'affiliate') return 'Pataje verite yo pa t konnen. Se pa yon koupon.';
    return 'Lè w pare, ouvri pwochen etap la oswa Pale Kreyòl.';
  }
  const metroNote = metro ? ` This flyer is about households in ${metro}. Send it to a person.` : '';
  if (audience === 'helper')
    return 'You’re allowed to sit there. Don’t take the phone. Point at one English sentence and wait until they can say it back.' + metroNote;
  if (audience === 'specialist')
    return 'One page for the household in front of you. Tell them the fact they did not know. Do not post a price.' + metroNote;
  if (audience === 'church') return 'Print this page. Put it where people already sit. They scan when they are ready.';
  if (audience === 'affiliate') return 'Share the fact they did not know. Not a coupon. If they ask a number, then answer.';
  return 'When you are ready, open the next step or Pale Kreyòl.' + metroNote;
}

function metroLabel(piece: HaitianPieceSpec): string | undefined {
  if (!piece.metroKey) return undefined;
  const titles: Record<string, string> = {
    miami: 'Miami',
    brooklyn: 'Brooklyn',
    boston: 'Boston',
    houston: 'Houston',
    atlanta: 'Atlanta',
    washington: 'Washington',
    chicago: 'Chicago',
    philadelphia: 'Philadelphia',
    jacksonville: 'Jacksonville',
    newjersey: 'New Jersey',
  };
  return titles[piece.metroKey];
}

function buildPieceHtml(args: {
  piece: HaitianPieceSpec;
  firstName: string;
  locale: 'en' | 'ht';
  audience: HaitianPieceAudience;
}) {
  const href = pieceHref(args.piece);
  const metro = metroLabel(args.piece);
  if (args.locale === 'ht') {
    return wrapTwoVoiceEmailHtml({
      headline: args.piece.emailSubjectHt,
      subheadline: args.piece.titleHt,
      englishArtifact: args.piece.hookEn,
      kreyolMeaning: `${args.piece.hookHt} ${args.piece.emailLedeHt}`,
      englishWords: args.piece.glossary.map((row) => row.en).slice(0, 3).join(', ') || 'credit file, letter, next step',
      ctaLabel: 'Ouvri pwochen etap la',
      ctaHref: href,
    }).replaceAll('{{firstName}}', escapeHtml(args.firstName));
  }
  return wrapFinelyEmailHtml({
    headline: args.piece.emailSubjectEn,
    subheadline: args.piece.title,
    bodyHtml: `<p style="margin:0 0 16px;">Hello ${escapeHtml(args.firstName)} —</p>
<p style="margin:0 0 16px;font-weight:800;">${escapeHtml(args.piece.hookEn)}</p>
<p style="margin:0 0 16px;">${escapeHtml(args.piece.emailLedeEn)}</p>
<p style="margin:0 0 16px;">${escapeHtml(audienceLine(args.audience, 'en', metro))}</p>
<p style="margin:0 0 16px;font-weight:700;">${escapeHtml(args.piece.actionEn)}</p>
${buildPrimaryCtaButton({ label: 'Open the next step', href })}
<p style="margin:16px 0 0;font-size:13px;color:#64748b;">${FINELY_COPY_COMPLIANCE_EN}</p>
<p style="margin:8px 0 0;font-size:13px;color:#64748b;">${FINELY_COPY_COMPLIANCE_HT}</p>`,
    signatureHtml: defaultSignatureHtml('Marie-Claire Baptiste', 'Haitian Community Guide'),
    footerHtml: buildDefaultEmailFooter('{{email}}'),
    headerTheme: args.piece.accent === 'violet' ? 'violet' : args.piece.accent === 'rose' ? 'violet' : 'emerald',
  });
}

export async function sendHaitianPieceEmail(args: {
  pieceId: string;
  email: string;
  name: string;
  audience: HaitianPieceAudience;
  locale: 'en' | 'ht';
}) {
  const piece = haitianPieceById(args.pieceId);
  if (!piece) return { ok: false as const, error: 'Piece not found.' };

  const email = normalizeEmail(args.email);
  if (!email || !email.includes('@')) return { ok: false as const, error: 'Enter a valid email.' };

  const name = args.name.trim() || firstNameFrom('', email);
  const firstName = firstNameFrom(name, email);
  const partner = listPartnersLocal().find((row) => normalizeEmail(row.profile.email) === email);

  await submitLeadCapture({
    source: args.audience === 'specialist' ? 'agent' : 'lead_magnet',
    offer: 'haitian_credit_kit',
    interest: piece.title,
    fullName: name,
    email,
    phone: '',
    consentToContact: true,
    funnelPath: piece.ctaPath,
    guideId: piece.id,
    guideTitle: piece.title,
    funnelId: 'kreyol_companion',
  });

  const subject = args.locale === 'ht' ? piece.emailSubjectHt : piece.emailSubjectEn;
  const html = buildPieceHtml({ piece, firstName, locale: args.locale, audience: args.audience }).replaceAll(
    '{{email}}',
    email,
  );
  const text = `${piece.hookEn}\n\n${piece.emailLedeEn}\n\n${piece.emailLedeHt}\n\n${pieceHref(piece)}\n\n${FINELY_COPY_COMPLIANCE_EN}`;

  try {
    await sendEmail({
      toEmail: email,
      toName: name,
      subject,
      text,
      html,
      emailDomainId: 'domain_finely_primary',
    });
    addCommsSend({
      id: `send_ht_${Date.now()}`,
      templateId: `haitian_piece_${piece.id}`,
      channel: 'email',
      partnerId: partner?.id ?? email,
      to: email,
      createdAt: new Date().toISOString(),
      status: 'sent',
      subject,
      body: text,
      meta: { haitianPieceId: piece.id, audience: args.audience, locale: args.locale },
    });
    return { ok: true as const, attachedPartnerId: partner?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email send failed.';
    return { ok: false as const, error: message, savedLead: true as const };
  }
}
