/**
 * Clear re-parse guards on PartnerDetailPage: legacy pending blobs and missing
 * storage should show actionable errors; Creditors tab re-parse only when possible.
 * Patch scripts only — do not StrReplace PartnerDetailPage from the agent.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/pages/admin/PartnerDetailPage.tsx');
let src = fs.readFileSync(file, 'utf8');
const before = src;
const eol = src.includes('\r\n') ? '\r\n' : '\n';

const canReparseBlock = [
  '  const canReparseSelectedReport = Boolean(',
  '    selectedReport &&',
  '    !isLegacyPendingReportBlob(selectedReport.rawBlobRef) &&',
  '    canAccessReportBlob(selectedReport.rawBlobRef),',
  '  );',
].join(eol);

if (!src.includes('const canReparseSelectedReport = Boolean(')) {
  const anchor = `  }, [reports, selectedReportId]);${eol}`;
  if (!src.includes(anchor)) {
    console.warn('Needle not found for canReparseSelectedReport insertion');
  } else {
    src = src.replace(anchor, `${anchor}${canReparseBlock}${eol}`);
    console.log('Added canReparseSelectedReport');
  }
}

const oldHandle = [
  '  const handleReparseReport = async (report: any) => {',
  '    if (!report || Boolean(reparseReportId)) return;',
  '    setReparseReportErr(null);',
  '    setReparseReportId(report.id);',
  '    try {',
  '      const updated = await reparseStoredCreditReport({ record: report });',
].join(eol);

const newHandle = [
  '  const handleReparseReport = async (report: any) => {',
  '    if (!report || Boolean(reparseReportId)) return;',
  '    setReparseReportErr(null);',
  '    setReparseReportId(report.id);',
  '    try {',
  '      if (isLegacyPendingReportBlob(report.rawBlobRef)) {',
  "        throw new Error('This report was migrated without the original file. Re-upload the HTML export above, or restore files from the legacy server ZIP on Admin → Partner Import.');",
  '      }',
  '      if (!canAccessReportBlob(report.rawBlobRef)) {',
  "        throw new Error('This report has no accessible stored file. Re-upload the original HTML or PDF export.');",
  '      }',
  '      const updated = await reparseStoredCreditReport({ record: report });',
].join(eol);

if (src.includes(newHandle)) {
  console.log('handleReparseReport guards already present');
} else if (!src.includes(oldHandle)) {
  console.warn('Needle not found for handleReparseReport guards');
} else {
  src = src.replace(oldHandle, newHandle);
  console.log('Patched handleReparseReport guards');
}

const oldOnReparse = `onReparseRequest={() => handleReparseReport(selectedReport)}`;
const newOnReparse = `onReparseRequest={canReparseSelectedReport ? () => handleReparseReport(selectedReport) : undefined}`;
if (src.includes(newOnReparse)) {
  console.log('onReparseRequest guard already present');
} else if (src.includes(oldOnReparse)) {
  src = src.split(oldOnReparse).join(newOnReparse);
  console.log('Guarded CreditIntelTabs onReparseRequest');
}

if (src === before) {
  console.log('No change');
  process.exit(0);
}
fs.writeFileSync(file, src);
console.log('Patched PartnerDetailPage reparse guards');
