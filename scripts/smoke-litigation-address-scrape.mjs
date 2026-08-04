/**
 * Smoke test: litigation doc scraper single-line / OCR-flattened firm address
 * extraction (the regex patterns added to fix party addresses not flowing into
 * validation fields / letters).
 *
 * Run: npm run smoke:litigation-address-scrape
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

let failures = 0;

function check(label, condition, detail) {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function main() {
  process.chdir(root);
  const { extractEntitiesFromText, debtPatchFromLitigationScrape } = await import(
    '../src/lib/ocr/litigationDocScraper.ts'
  );

  // Case 1: single-line, comma-separated letterhead address (never had a newline).
  {
    const text = [
      'SUMMONS',
      'CityBank, N.A. v. Jane Doe',
      'Case No. 24-CV-004512',
      'Attorneys for Plaintiff',
      'Shermeta Law Group, PLLC',
      '2530 Union Lake Rd, Suite 219, Commerce Township, MI 48382',
      'Phone: (248) 645-0500',
    ].join('\n');

    const { entities } = extractEntitiesFromText(text);
    console.log('Case 1: single-line comma-separated letterhead');
    check('plaintiffLawFirm extracted', /shermeta/i.test(entities.plaintiffLawFirm || ''), entities.plaintiffLawFirm);
    check(
      'address extracted (single-line)',
      /2530 Union Lake Rd/i.test(entities.address || '') && /48382/.test(entities.address || ''),
      entities.address,
    );
    check('plaintiffLawFirmAddress mirrors address', entities.plaintiffLawFirmAddress === entities.address);
  }

  // Case 2: OCR-flattened address — street tokens run into city/state/ZIP with no comma.
  {
    const text = [
      'IN THE CIRCUIT COURT FOR THE COUNTY OF WAYNE',
      'Portfolio Recovery Associates LLC v. John Smith',
      'Case Number 23-123456-CK',
      'Counsel for Plaintiff',
      'Weber Olcese PLC',
      '2211 Livernois Rd Ste 320 Troy MI 48083',
    ].join('\n');

    const { entities } = extractEntitiesFromText(text);
    console.log('Case 2: OCR-flattened address (no comma before city/state/ZIP)');
    check(
      'address extracted (OCR-flattened)',
      /2211 Livernois Rd/i.test(entities.address || '') && /48083/.test(entities.address || ''),
      entities.address,
    );
    check('caseNumber extracted', entities.caseNumber === '23-123456-CK', entities.caseNumber);
  }

  // Case 3: PO Box single-line form.
  {
    const text = [
      'NOTICE OF DEBT COLLECTION',
      'This is an attempt to collect a debt.',
      'Remit payment to:',
      'PO Box 41067, Norfolk, VA 23541',
    ].join('\n');

    const { entities } = extractEntitiesFromText(text);
    console.log('Case 3: single-line PO Box');
    check('PO Box address extracted', /PO Box 41067/i.test(entities.address || ''), entities.address);
  }

  // Case 4: debtPatchFromLitigationScrape carries the scraped firm address through
  // to the patch consumed by mergeEmptyDebtFieldsFromScrape / Apply.
  {
    const text = [
      'Summons and Complaint',
      'Midland Credit Management, Inc. v. Sample Defendant',
      'Case No. 22-SC-9981',
      'Attorney for Plaintiff',
      'Hunt & Henriques',
      '151 Bernal Rd, Suite 8, San Jose, CA 95119',
    ].join('\n');
    const { entities } = extractEntitiesFromText(text);
    const patch = debtPatchFromLitigationScrape(entities);
    console.log('Case 4: scrape entities -> debt patch (recipient/firm address)');
    check('patch.plaintiffLawFirmAddress set', /151 Bernal Rd/i.test(patch.plaintiffLawFirmAddress || ''), patch.plaintiffLawFirmAddress);
    check('patch.recipientAddress set', /151 Bernal Rd/i.test(patch.recipientAddress || ''), patch.recipientAddress);
  }

  if (failures > 0) {
    console.error(`\n${failures} assertion(s) failed.`);
    process.exit(1);
  }
  console.log('\nAll litigation address-scrape assertions passed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
