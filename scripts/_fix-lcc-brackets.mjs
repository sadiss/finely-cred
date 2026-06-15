import fs from 'fs';

const p = 'e:/Finely-Cred/Tishobe/finely-cred-main/src/components/letters/LettersCommandCenter.tsx';
let s = fs.readFileSync(p, 'utf8');

const bad = `                })
                  )}
                </>
              )}`;

const good = `                })}
                </>
              )}`;

if (!s.includes(bad)) {
  console.error('bad block not found');
  process.exit(1);
}

s = s.replace(bad, good);
fs.writeFileSync(p, s);
console.log('fixed closing brackets, lines', s.split('\n').length);
