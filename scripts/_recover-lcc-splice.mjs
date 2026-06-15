import fs from 'fs';

const lccPath = 'e:/Finely-Cred/Tishobe/finely-cred-main/src/components/letters/LettersCommandCenter.tsx';
const zipPath = 'e:/Finely-Cred/Tishobe/finely-cred-main/scripts/_LCC_from_zip.tsx';

const head = fs.readFileSync(lccPath, 'utf8');
const zip = fs.readFileSync(zipPath, 'utf8');

const marker = '  const suggestionsById = useMemo(() => {';
const tailMarker = '  // --- Validation/Court letter flow (Debt module) ---';

const headIdx = head.indexOf(marker);
if (headIdx < 0) throw new Error('suggestionsById marker missing in truncated head');

const tailIdx = zip.indexOf(tailMarker);
if (tailIdx < 0) throw new Error('validation/court marker missing in zip backup');

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

const recovered = head.slice(0, headIdx) + suggestionsBlock + zip.slice(tailIdx);
fs.writeFileSync(lccPath, recovered);
console.log('recovered lines', recovered.split('\n').length);
