import type { Partner } from '../domain/partners';
import { ensureHaitianCommsTemplatesOnce, haitianTemplateIdForKind } from '../data/commsHaitianTemplatesSeed';
import { getCommsTemplate } from '../data/commsRepo';
import { buildDefaultCommsContext, sendEmailFromTemplate } from './commsEngine';
import { partnerPreferredVoice } from './haitianVoice';

export async function sendHaitianDeskEmail(args: {
  kind: 'welcome' | 'kit' | 'session' | 'news';
  partner?: Partner;
  email?: string;
  name?: string;
  kitId?: string;
  ctx?: Record<string, any>;
  dryRun?: boolean;
}) {
  if (!args.partner && args.email && args.kitId) {
    const { sendHaitianPieceEmail } = await import('./sendHaitianPieceEmail');
    return sendHaitianPieceEmail({
      pieceId: args.kitId,
      email: args.email,
      name: args.name ?? '',
      audience: 'lead',
      locale: 'en',
    });
  }
  if (!args.partner) {
    return { ok: false as const, error: 'partner_or_email_required' };
  }
  ensureHaitianCommsTemplatesOnce();
  const voice = partnerPreferredVoice(args.partner);
  const template = getCommsTemplate(haitianTemplateIdForKind(args.kind, voice));
  if (!template) {
    return { ok: false as const, error: 'template_missing' };
  }
  const kitId = args.kitId?.trim() || undefined;
  const ctx = {
    ...buildDefaultCommsContext({ partner: args.partner, extra: kitId ? { kitId } : undefined }),
    ...(args.ctx ?? {}),
    ...(kitId ? { kitId } : {}),
  };
  const result = await sendEmailFromTemplate({
    template,
    partner: args.partner,
    ctx,
    dryRun: args.dryRun,
    meta: { haitianKind: args.kind, locale: voice, ...(kitId ? { kitId } : {}) },
  });
  return { ok: result.ok, log: result.log, error: result.log.error };
}
