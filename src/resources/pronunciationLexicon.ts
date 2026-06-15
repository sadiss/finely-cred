/** Credit/legal pronunciation — mirrored on server in voiceStudioCore. */
export const PRONUNCIATION_LEXICON: Array<[RegExp, string]> = [
  [/\bMetro2\b/gi, 'Metro 2'],
  [/\bFICO\b/g, 'FY co'],
  [/\bEquifax\b/g, 'EQU-ih-fax'],
  [/\bExperian\b/g, 'ex-PEER-ee-an'],
  [/\bTransUnion\b/g, 'Trans Union'],
  [/\bPermissible purpose\b/gi, 'per-MISS-ih-bul PUR-pus'],
  [/\bUCC-1\b/g, 'U C C 1'],
  [/\bUCC1\b/g, 'U C C 1'],
  [/\bFCRA\b/g, 'F C R A'],
  [/\bFDCPA\b/g, 'F D C P A'],
  [/\bD-U-N-S\b/g, 'D U N S'],
  [/\bDUNS\b/g, 'D U N S'],
  [/\bPG\b/g, 'personal guarantee'],
  [/\bNAICS\b/g, 'NAY-iks'],
  [/\btradelines\b/gi, 'trade lines'],
  [/\btradeline\b/gi, 'trade line'],
  [/\breinvestigation\b/gi, 're-investigation'],
  [/\bOCR\b/g, 'O C R'],
  [/\bCFPB\b/g, 'C F P B'],
  [/\bUSPS\b/g, 'U S P S'],
];

export function applyPronunciationLexicon(script: string): string {
  let out = script;
  for (const [pattern, replacement] of PRONUNCIATION_LEXICON) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
