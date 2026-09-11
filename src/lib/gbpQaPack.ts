/** Google Business Profile Q&A — paste into the GBP profile. Educational only. */

export const GBP_QA_PACK: Array<{ q: string; a: string }> = [
  {
    q: 'What does Finely Cred do?',
    a: 'Finely Cred helps partners organize credit restore, disputes, debt validation education, and funding readiness. Results vary. This is not legal advice.',
  },
  {
    q: 'Do you guarantee a score increase?',
    a: 'No. Bureau and furnisher responses vary. We work from the report you upload and track letters and evidence — we do not promise a score.',
  },
  {
    q: 'How do I start?',
    a: 'Start the free guide at finelycred.com/free-guide or book a session. Chat is available on the site if you want a human walkthrough.',
  },
  {
    q: 'Do you pull my credit without me?',
    a: 'No live bureau score API is used. You upload your own reports so the workspace can analyze what is already on the file.',
  },
];

export function formatGbpQaPack(): string {
  return GBP_QA_PACK.map((row, i) => `${i + 1}. ${row.q}\n${row.a}`).join('\n\n');
}
