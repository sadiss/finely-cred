/** Lightweight HT vs EN detection for chat replies (no external API). */
export function detectKbLang(text: string): 'en' | 'ht' {
  const t = (text || '').toLowerCase();
  const htMarkers = [
    'mwen',
    'nou',
    'kijan',
    'kredi',
    'kred',
    'pou',
    'nan',
    'yon',
    'pa ',
    'ki ',
    'sèvis',
    'èd',
    'bonjou',
    'mesi',
    'kreyòl',
    'kreyol',
    'ayiti',
  ];
  let ht = 0;
  for (const m of htMarkers) {
    if (t.includes(m)) ht += 1;
  }
  return ht >= 2 ? 'ht' : 'en';
}
