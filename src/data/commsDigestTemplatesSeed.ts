import type { CommsTemplate } from '../domain/comms';
import { getCommsTemplate, upsertCommsTemplate } from './commsRepo';

const DIGEST_TEMPLATES: CommsTemplate[] = [
  {
    id: 'admin_daily_digest',
    name: 'Admin daily digest',
    channel: 'email',
    enabled: true,
    subjectTemplate: 'Finely admin digest — {{unread}} unread of {{total}}',
    bodyTemplate: `Daily platform summary (last 24 hours):

{{digestSummary}}

Open notifications: {{adminNotificationsUrl}}

— Finely Cred Ops`,
    tags: ['admin', 'digest', 'notifications'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'partner_daily_digest',
    name: 'Partner daily digest',
    channel: 'email',
    enabled: true,
    subjectTemplate: 'Your Finely Cred digest — {{unread}} unread',
    bodyTemplate: `Hi {{firstName}},

Here's your 24-hour portal summary:

{{digestSummary}}

Open notifications: {{portalNotificationsUrl}}

— Finely Cred`,
    tags: ['partner', 'digest', 'notifications'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/** Seed admin digest email template (Phase 33). */
export function ensureDigestCommsTemplates(): number {
  let added = 0;
  for (const tpl of DIGEST_TEMPLATES) {
    if (getCommsTemplate(tpl.id)) continue;
    upsertCommsTemplate(tpl);
    added += 1;
  }
  return added;
}
