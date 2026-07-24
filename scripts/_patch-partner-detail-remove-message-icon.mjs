/**
 * Remove useless top "Message partner" header button on PartnerDetailPage.
 * Message compose already exists in the Communication Hub / admin-partner-message box.
 * Do NOT StrReplace PartnerDetailPage from the agent — run this script instead.
 *
 * Usage (PowerShell): node scripts/_patch-partner-detail-remove-message-icon.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/pages/admin/PartnerDetailPage.tsx');
let src = fs.readFileSync(file, 'utf8');
const before = src;

// Remove the headerRight Message partner button (keep partner_id label).
const headerBtnRe =
  /<button type="button" onClick=\{messagePartner\} className=\{`\$\{FINELY_OS_SECONDARY_BTN\} !py-2 !text-xs`\}>\s*<Send size=\{14\} \/> Message partner\s*<\/button>\s*/;

if (headerBtnRe.test(src)) {
  src = src.replace(headerBtnRe, '');
  console.log('Removed header "Message partner" button');
} else if (!src.includes('onClick={messagePartner}')) {
  console.log('Message partner header button already absent');
} else {
  // Broader fallback — only the headerRight block instance
  const alt =
    /headerRight=\{\s*<div className="flex flex-wrap items-center gap-2">\s*<button type="button" onClick=\{messagePartner\}[\s\S]*?<\/button>\s*<div className=\{`\$\{FINELY_OS_ENTITY_SUBLABEL\}/;
  if (alt.test(src)) {
    src = src.replace(
      alt,
      'headerRight={\n        <div className="flex flex-wrap items-center gap-2">\n          <div className={`${FINELY_OS_ENTITY_SUBLABEL}',
    );
    console.log('Removed header Message partner button (alt pattern)');
  } else {
    console.warn('Could not find Message partner header button — check PartnerDetailPage manually');
  }
}

// Wire Finely Mail confirmation email after admin mails a letter (if not already wired).
if (!src.includes('notifyLetterMailed')) {
  if (src.includes("import { onDisputeLetterMailed } from '../../lib/disputeRoundEngine';")) {
    src = src.replace(
      "import { onDisputeLetterMailed } from '../../lib/disputeRoundEngine';",
      "import { onDisputeLetterMailed } from '../../lib/disputeRoundEngine';\nimport { notifyLetterMailed } from '../../lib/letterMailedNotify';",
    );
  }
  const mailedHook =
    /onDisputeLetterMailed\(\{\s*letter: updated,\s*actor: 'admin',\s*\}\);/;
  if (mailedHook.test(src)) {
    src = src.replace(
      mailedHook,
      `onDisputeLetterMailed({ letter: updated, actor: 'admin' });
                      void notifyLetterMailed({
                        partnerId: partner.id,
                        partner,
                        letterIds: [updated.id],
                        letterTitles: [updated.title || mailLetter?.title || 'Letter'],
                        providerIds: [providerId],
                        to,
                        from,
                        expectedDeliveryDate,
                        actorEmail: email || undefined,
                        actorRole: 'admin',
                      });`,
    );
    console.log('Wired notifyLetterMailed on admin MailLetterModal success');
  } else {
    console.warn('Could not wire notifyLetterMailed — pattern missing');
  }
} else {
  console.log('notifyLetterMailed already present');
}

if (src === before) {
  console.log('No change (already patched or patterns missing)');
  process.exit(0);
}
fs.writeFileSync(file, src);
console.log('Patched PartnerDetailPage → removed message icon + mail notify');
