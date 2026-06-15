import fs from 'fs';

const path = 'e:/Finely-Cred/Tishobe/finely-cred-main/src/components/letters/LettersCommandCenter.tsx';
let src = fs.readFileSync(path, 'utf8');

if (!src.includes('workspaceBureau')) {
  src = src.replace(
    "  const [previewModalBureau, setPreviewModalBureau] = useState<null | Bureau>(null);\n\n  const isPaidLettersPackage",
    "  const [previewModalBureau, setPreviewModalBureau] = useState<null | Bureau>(null);\n  const [workspaceBureau, setWorkspaceBureau] = useState<Bureau>('EXP');\n\n  const isPaidLettersPackage",
  );
  console.log('added workspaceBureau state');
}

if (!src.includes('setWorkspaceBureau(next)')) {
  src = src.replace(
    `  const selectedByBureau = useMemo(() => {
    const m: Record<Bureau, SelectedDispute[]> = { EXP: [], EQF: [], TUC: [] };
    for (const s of selectedDisputes) m[s.candidate.bureau].push(s);
    return m;
  }, [selectedDisputes]);

  const evidencePickerCandidate`,
    `  const selectedByBureau = useMemo(() => {
    const m: Record<Bureau, SelectedDispute[]> = { EXP: [], EQF: [], TUC: [] };
    for (const s of selectedDisputes) m[s.candidate.bureau].push(s);
    return m;
  }, [selectedDisputes]);

  useEffect(() => {
    if (layout !== 'embedded') return;
    if (!selectedDisputes.length) return;
    if ((selectedByBureau[workspaceBureau] ?? []).length > 0) return;
    const next = (['EXP', 'EQF', 'TUC'] as Bureau[]).find((b) => (selectedByBureau[b] ?? []).length > 0);
    if (next) setWorkspaceBureau(next);
  }, [layout, selectedDisputes.length, selectedByBureau, workspaceBureau]);

  const evidencePickerCandidate`,
  );
  console.log('added workspaceBureau auto-switch effect');
}

const bureauMapNeedle = `              ) : (
                (['EXP', 'EQF', 'TUC'] as Bureau[]).map((b) => {
                  const items = selectedByBureau[b] ?? [];
                  if (!items.length) return null;`;

const bureauMapPatch = `              ) : (
                <>
                  {layout === 'embedded' ? (
                    <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3 mb-1">
                      {(['EXP', 'EQF', 'TUC'] as Bureau[]).map((b) => {
                        const count = (selectedByBureau[b] ?? []).length;
                        if (!count) return null;
                        const on = workspaceBureau === b;
                        return (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setWorkspaceBureau(b)}
                            className={
                              'px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ' +
                              (on
                                ? 'bg-amber-500 text-black border-amber-400'
                                : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white')
                            }
                            title={bureauFullName(b)}
                          >
                            {bureauShortCode(b)} ({count})
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  {(['EXP', 'EQF', 'TUC'] as Bureau[])
                    .filter((b) => layout !== 'embedded' || b === workspaceBureau)
                    .map((b) => {
                  const items = selectedByBureau[b] ?? [];
                  if (!items.length) return null;`;

if (src.includes(bureauMapNeedle) && !src.includes('onClick={() => setWorkspaceBureau(b)}')) {
  src = src.replace(bureauMapNeedle, bureauMapPatch);
  console.log('patched embedded bureau focus tabs');
} else if (src.includes('onClick={() => setWorkspaceBureau(b)}')) {
  console.log('embedded bureau tabs already present');
} else {
  console.log('WARNING: could not find bureau map block');
}

// Close the fragment wrapper after bureau map — find the closing of the ternary's map
const closeNeedle = `                })
              )}`;

const closePatch = `                })
                  )}
                </>
              )}`;

if (src.includes(bureauMapPatch.split('\n')[1]?.trim() || 'onClick={() => setWorkspaceBureau(b)}')) {
  const idx = src.indexOf('onClick={() => setWorkspaceBureau(b)}');
  if (idx > 0) {
    const afterTabs = src.slice(idx);
    const closeIdx = afterTabs.indexOf(closeNeedle);
    if (closeIdx > 0 && !afterTabs.slice(0, closeIdx).includes('</>')) {
      src = src.slice(0, idx) + afterTabs.replace(closeNeedle, closePatch, 1);
      console.log('closed embedded bureau fragment');
    }
  }
}

fs.writeFileSync(path, src);
console.log('lines after', src.split('\n').length);
