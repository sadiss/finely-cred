import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const filePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src/components/letters/LettersCommandCenter.tsx');
let s = fs.readFileSync(filePath, 'utf8');

const old = `        </div>

        {/* Always-visible dispute selection shortcut (so it can't be missed). */}`;
const neu = `        </div>
        ) : null}

        {/* Always-visible dispute selection shortcut (so it can't be missed). */}`;

if (s.includes(neu)) {
  console.log('already fixed');
} else if (s.includes(old)) {
  s = s.replace(old, neu);
  fs.writeFileSync(filePath, s);
  console.log('fixed tab bar close');
} else {
  console.error('anchor not found');
  process.exit(1);
}
