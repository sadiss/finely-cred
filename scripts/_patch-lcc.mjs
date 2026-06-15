import fs from 'fs';

const path = 'e:/Finely-Cred/Tishobe/finely-cred-main/src/components/letters/LettersCommandCenter.tsx';
let src = fs.readFileSync(path, 'utf8');
console.log('lines before', src.split('\n').length);

if (!src.includes('buildEnrichedReasonsForCandidate')) {
  src = src.replace(
    "import { getDisputeReasonsLibraryAsText, suggestDisputeReasons, suggestDisputeReasonsForCandidate } from '../../creditReports/disputeReasons';",
    "import { getDisputeReasonsLibraryAsText, suggestDisputeReasons, suggestDisputeReasonsForCandidate } from '../../creditReports/disputeReasons';\nimport { buildEnrichedReasonsForCandidate } from '../../lib/disputeLetterBuilder';\nimport { filterFactualDisputeReasons, pickBestDisputeReasons } from '../../creditReports/disputeFactualReasons';",
  );
}

const oldBlock = `      const rid = s.source.reportId || s.candidate.reportId || '';
      const parsed = rid ? parsedByReportId.get(rid) : undefined;
      if (!parsed) {
        // Still offer baseline reasons even if the parsed report isn't available in-memory.
        m[s.key] = suggestDisputeReasonsForCandidate(s.candidate as any).slice(0, 8);
        continue;
      }
      m[s.key] = suggestDisputeReasons(parsed as any, s.candidate as any).slice(0, 8);`;

const newBlock = `      const rid = s.source.reportId || s.candidate.reportId || '';
      const parsed = rid ? parsedByReportId.get(rid) : undefined;
      const texts = buildEnrichedReasonsForCandidate({
        candidate: s.candidate as any,
        parsed,
        maxReasons: 12,
      });
      m[s.key] = texts.map((text, idx) => ({ id: \`\${s.key}_\${idx}\`, text }));`;

if (src.includes(oldBlock)) {
  src = src.replace(oldBlock, newBlock);
  console.log('patched suggestionsById');
} else if (src.includes('buildEnrichedReasonsForCandidate({')) {
  console.log('suggestionsById already patched');
} else {
  console.log('WARNING: could not find suggestionsById block');
}

fs.writeFileSync(path, src);
console.log('lines after', src.split('\n').length);
