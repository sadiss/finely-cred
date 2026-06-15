import fs from 'fs';

const lccPath = 'e:/Finely-Cred/Tishobe/finely-cred-main/src/components/letters/LettersCommandCenter.tsx';
const zipPath = 'e:/Finely-Cred/Tishobe/finely-cred-main/scripts/_LCC_from_zip.tsx';

let head = fs.readFileSync(lccPath, 'utf8');
const zip = fs.readFileSync(zipPath, 'utf8');

// If already truncated, recover head from zip + merge newer imports from partial head if possible
if (!head.includes('if (layout === \'embedded\') return main;')) {
  const partial = head;
  const marker = '  const suggestionsById = useMemo(() => {';
  const tailMarker = '  // --- Validation/Court letter flow (Debt module) ---';
  const headIdx = partial.indexOf(marker);
  const tailIdx = zip.indexOf(tailMarker);
  if (headIdx < 0 || tailIdx < 0) throw new Error('cannot recover LCC');

  const suggestionsBlock = `${marker}
    const m: Record<string, { id: string; text: string }[]> = {};
    for (const s of selectedDisputes) {
      if (s.source.kind === 'case') {
        const uniq = Array.from(new Set((s.prefillReasons ?? []).map((x) => x.trim()).filter(Boolean)));
        m[s.key] = uniq.map((text, idx) => ({ id: \`\${s.key}_\${idx}\`, text }));
        continue;
      }
      const rid = s.source.reportId || s.candidate.reportId || '';
      const parsed = rid ? parsedByReportId.get(rid) : undefined;
      const texts = buildEnrichedReasonsForCandidate({
        candidate: s.candidate as any,
        parsed,
        maxReasons: 12,
      });
      m[s.key] = texts.map((text, idx) => ({ id: \`\${s.key}_\${idx}\`, text }));
    }
    return m;
  }, [selectedDisputes, parsedByReportId]);

`;

  head = partial.slice(0, headIdx) + suggestionsBlock + zip.slice(tailIdx);
  console.log('spliced recovery', head.split('\n').length, 'lines');
}

// Embedded bureau tabs patch
if (!head.includes('onClick={() => setWorkspaceBureau(b)}')) {
  const bureauMapNeedle = `              ) : (
                (['EXP', 'EQF', 'TUC'] as Bureau[]).map((b) => {
                  const items = selectedByBureau[b] ?? [];
                  if (!items.length) return null;`;

  const bureauMapPatch = `              ) : (
                <>
                  {layout === 'embedded' ? (
                    <div className="flex flex-wrap gap-2 border-b border-white/[0.08] pb-3 mb-1">
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
                                : 'bg-white/5 text-white/70 border-white/[0.08] hover:bg-white/10 hover:text-white')
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

  if (head.includes(bureauMapNeedle)) {
    head = head.replace(bureauMapNeedle, bureauMapPatch);
    const closeNeedle = `                })
              )}`;
    const closePatch = `                })
                  )}
                </>
              )}`;
    const idx = head.indexOf('onClick={() => setWorkspaceBureau(b)}');
    if (idx > 0) {
      const afterTabs = head.slice(idx);
      const closeIdx = afterTabs.indexOf(closeNeedle);
      if (closeIdx > 0 && !afterTabs.slice(0, closeIdx).includes('</>')) {
        head = head.slice(0, idx) + afterTabs.replace(closeNeedle, closePatch);
      }
    }
    console.log('embedded bureau tabs patched');
  }
}

head = head.replaceAll('border-white/10', 'border-white/[0.08]');
fs.writeFileSync(lccPath, head, 'utf8');
console.log('final lines', head.split('\n').length);
console.log('has embedded tabs', head.includes('setWorkspaceBureau(b)'));
console.log('complete', head.trimEnd().endsWith('}'));
