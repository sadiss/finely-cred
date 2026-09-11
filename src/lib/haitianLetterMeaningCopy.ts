/** Shared teaching copy for the internal letter-meaning collector kit (PDF + paper preview). */

export const HAITIAN_LETTER_MEANING_KIT_ID = 'letter-meaning';

export const HAITIAN_COLLECTOR_LETTER = {
  sampleBanner: 'SAMPLE / TEACHING EXAMPLE',
  collectorName: 'Harborline Recovery Services',
  collectorUnit: 'Collections Education Desk',
  collectorAddress: 'P.O. Box 1840',
  collectorCityLine: 'Harborline, NY 10001',
  accountRefLabel: 'Account ref',
  accountRef: 'HRS-EDU-4401',
  reLine: 'Re: Collection account — teaching example',
  salutation: 'Dear Account Holder:',
  artifactLine: 'This account is reporting a collection.',
  validationParagraph:
    'Federal consumer-protection rules give you a limited window after you receive a collection notice to request validation. Validation means you may ask the collector to show that the debt is yours and that the amount is accurate. Keep the envelope and the date you received this letter. This page is a teaching example. It is not a live bill and it is not a demand for payment.',
  closing: 'Sincerely,',
  signoffName: 'Harborline Recovery Services',
  signoffUnit: 'Collections Education Desk',
  footer: 'Educational sample · not a live account · not legal advice · Results vary',
} as const;

export const HAITIAN_LETTER_MEANING_VOICE = {
  title: 'What this letter says',
  titleHt: 'Lèt sa a di kisa?',
  artifactLabel: 'English on the letter',
  meaningLabel: 'Kreyòl meaning',
  meaningHt:
    'Yon kolektè ap rapòte yon kont sou dosye kredi w. Sa pa vle di ou dwe peye jodi a.',
  wordsHeading: 'Words you will see again',
  wordsHeadingHt: 'Mo w ap wè ankò',
  words: [
    { en: 'collection', ht: 'koleksyon' },
    { en: 'account', ht: 'kont' },
    { en: 'reporting', ht: 'ap rapòte' },
  ],
  nextStepHeading: 'One next step',
  nextStepHeadingHt: 'Yon pwochen etap',
  nextStepEn: 'Keep the envelope. Write the date it arrived. Do not pay this week from fear.',
  nextStepHt: 'Kenbe anvlòp la. Ekri dat li rive. Pa peye semèn sa a paske w pè.',
  footer: 'Educational sample · not a live account · not legal advice · Results vary',
} as const;

export function formatHaitianLetterDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
