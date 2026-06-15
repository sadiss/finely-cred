/** Wire ReasonsCommandHub modal into LettersCommandCenter (safe node edit). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filePath = path.join(root, 'src/components/letters/LettersCommandCenter.tsx');
let s = fs.readFileSync(filePath, 'utf8');

if (!s.includes('commandHub')) {
  const modalBlock = `
      {reasonsLibraryOpen && partner ? (
        <DisputeReasonsLibraryPanel
          commandHub
          open={reasonsLibraryOpen}
          partnerId={partner.id}
          onClose={() => setReasonsLibraryOpen(false)}
          onApplyReason={(text) => {
            void navigator.clipboard?.writeText(text);
            setReasonsLibraryOpen(false);
            setReturnNotice('Reason copied from Reasons OS — paste into the active dispute item.');
          }}
        />
      ) : null}
`;

  const anchor = '\n  if (layout === \'embedded\') return main;';
  if (!s.includes(anchor)) {
    console.error('Could not find embedded layout anchor');
    process.exit(1);
  }
  s = s.replace(anchor, `${modalBlock}${anchor}`);
}

const oldBtn =
  "onClick={() => downloadText({ text: getDisputeReasonsLibraryAsText(), filename: 'dispute-reasons-library.txt' })}";
const newBtn = 'onClick={() => setReasonsLibraryOpen(true)}';

if (s.includes(oldBtn)) {
  s = s.replace(oldBtn, newBtn);
  s = s.replace('<FileText size={14} /> Reasons library', '<FileText size={14} /> Reasons OS');
}

fs.writeFileSync(filePath, s);
console.log('Wired Reasons OS modal in LettersCommandCenter');
