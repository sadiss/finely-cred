/**
 * Wire notifyLetterMailed after admin mails a letter on PartnerDetailPage.
 * Patch scripts only — do not StrReplace PartnerDetailPage from the agent.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/pages/admin/PartnerDetailPage.tsx');
let src = fs.readFileSync(file, 'utf8');
const before = src;

if (!src.includes("import { notifyLetterMailed } from '../../lib/letterMailedNotify';")) {
  src = src.replace(
    "import { onDisputeLetterMailed } from '../../lib/disputeRoundEngine';",
    "import { onDisputeLetterMailed } from '../../lib/disputeRoundEngine';\nimport { notifyLetterMailed } from '../../lib/letterMailedNotify';",
  );
}

if (src.includes('void notifyLetterMailed({')) {
  console.log('notifyLetterMailed already wired');
} else {
  const needle = "onDisputeLetterMailed({ letter: updated, actor: 'admin' });";
  const insert = `onDisputeLetterMailed({ letter: updated, actor: 'admin' });
                      void notifyLetterMailed({
                        partnerId: partner.id,
                        partner,
                        letterIds: [updated.id],
                        letterTitles: [updated.title || mailLetter?.title || 'Letter'],
                        providerIds: [providerId],
                        to,
                        from,
                        expectedDeliveryDate,
                        actorEmail: auth.user?.email || undefined,
                        actorRole: 'admin',
                      });`;
  if (!src.includes(needle)) {
    console.warn('Needle not found for notifyLetterMailed wire');
  } else {
    src = src.replace(needle, insert);
    console.log('Wired notifyLetterMailed on admin mail success');
  }
}

if (src === before) {
  console.log('No change');
  process.exit(0);
}
fs.writeFileSync(file, src);
console.log('Patched PartnerDetailPage mail notify');
