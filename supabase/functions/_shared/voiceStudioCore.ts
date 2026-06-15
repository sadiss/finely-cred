/** Shared Finely Voice Studio — multi-engine TTS + lexicon + chunking. */

export type VoiceProfile =
  | 'finely_brand_primary'
  | 'finely_female_warm'
  | 'finely_male_calm'
  | 'finely_documentary'
  | 'nora_funding_advisor';

export type VoiceTenantId = 'finely_cred' | 'nora_capital';

export type ContentType = 'guide' | 'ebook' | 'funding_module' | 'course_lesson';

export const VOICE_PIPELINE_VERSION = (Deno.env.get('VOICE_PIPELINE_VERSION') || 'v1').trim();

const PRONUNCIATION_LEXICON: Array<[RegExp, string]> = [
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

/** Performance Director — natural pacing before TTS (Phase 4). Strips producer markup, adds breath pauses. */
export function applyPerformanceDirector(script: string): string {
  let out = script
    .replace(/^TITLE:.*$/gm, '')
    .replace(/^VOICE DIRECTION:.*$/gm, '')
    .replace(/^\([^)]*\)$/gm, '')
    .replace(/\[pause [\d.]+s\]/gi, '…')
    .replace(/^#\d+\s*/gm, '')
    .trim();

  out = out
    .replace(/([.!?])\s+/g, '$1 … ')
    .replace(/,\s+/g, ', ')
    .replace(/:\s+/g, ': … ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/…\s*…/g, '…');

  return out.trim();
}

export function clampText(s: string, max = 24_000) {
  return String(s || '').trim().slice(0, max);
}

export function estimateDurationSec(script: string) {
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(10, Math.round((words / 135) * 60));
}

export function isValidVoiceProfile(v: string): v is VoiceProfile {
  return (
    v === 'finely_brand_primary' ||
    v === 'finely_female_warm' ||
    v === 'finely_male_calm' ||
    v === 'finely_documentary' ||
    v === 'nora_funding_advisor'
  );
}

function envVoice(key: string, fallback = '') {
  return (Deno.env.get(key) || '').trim() || fallback;
}

const ELEVEN_DEFAULTS: Record<VoiceProfile, string> = {
  finely_brand_primary: 'EXAVITQu4vr4xnSDxMaL',
  finely_female_warm: 'EXAVITQu4vr4xnSDxMaL',
  finely_male_calm: 'pNInz6obpgDQGcFmaJgB',
  finely_documentary: '21m00Tcm4TlvDq8ikWAM',
  nora_funding_advisor: 'pNInz6obpgDQGcFmaJgB',
};

const OPENAI_VOICES: Record<VoiceProfile, string> = {
  finely_brand_primary: 'nova',
  finely_female_warm: 'nova',
  finely_male_calm: 'onyx',
  finely_documentary: 'echo',
  nora_funding_advisor: 'onyx',
};

const CARTESIA_DEFAULTS: Record<VoiceProfile, string> = {
  finely_brand_primary: '694f9389-aac0-466b-b7bb-a182a5c2f409',
  finely_female_warm: '694f9389-aac0-466b-b7bb-a182a5c2f409',
  finely_male_calm: 'a0e99841-438c-4a64-b679-ae501e7d6091',
  finely_documentary: '79a125e8-cd45-4c13-8a67-662ae0b4cf56',
  nora_funding_advisor: 'a0e99841-438c-4a64-b679-ae501e7d6091',
};

export function elevenVoiceId(profile: VoiceProfile): string {
  const key =
    profile === 'finely_brand_primary'
      ? 'VOICE_CLONE_FINELY_PRIMARY_ID'
      : profile === 'nora_funding_advisor'
        ? 'VOICE_CLONE_NORA_PRIMARY_ID'
        : profile === 'finely_male_calm'
          ? 'ELEVENLABS_VOICE_FINELY_MALE_CALM'
          : profile === 'finely_documentary'
            ? 'ELEVENLABS_VOICE_FINELY_DOCUMENTARY'
            : 'ELEVENLABS_VOICE_FINELY_FEMALE_WARM';
  return envVoice(key, ELEVEN_DEFAULTS[profile]);
}

export function cartesiaVoiceId(profile: VoiceProfile): string {
  const key =
    profile === 'finely_brand_primary'
      ? 'CARTESIA_VOICE_FINELY_PRIMARY'
      : profile === 'nora_funding_advisor'
        ? 'CARTESIA_VOICE_NORA_ADVISOR'
        : profile === 'finely_male_calm'
          ? 'CARTESIA_VOICE_FINELY_MALE_CALM'
          : profile === 'finely_documentary'
            ? 'CARTESIA_VOICE_FINELY_DOCUMENTARY'
            : 'CARTESIA_VOICE_FINELY_FEMALE_WARM';
  return envVoice(key, CARTESIA_DEFAULTS[profile]);
}

export function toBase64(bytes: Uint8Array) {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export function splitScript(script: string, maxChars = 2800): string[] {
  const blocks = script
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let cur = '';
  for (const block of blocks) {
    if ((cur + '\n\n' + block).trim().length <= maxChars) {
      cur = (cur ? `${cur}\n\n${block}` : block).trim();
      continue;
    }
    if (cur) chunks.push(cur);
    if (block.length <= maxChars) {
      cur = block;
      continue;
    }
    const sentences = block.match(/[^.!?]+[.!?]+|\S.+$/g) ?? [block];
    cur = '';
    for (const sentence of sentences) {
      const next = (cur ? `${cur} ${sentence.trim()}` : sentence.trim()).trim();
      if (next.length > maxChars && cur) {
        chunks.push(cur);
        cur = sentence.trim();
      } else {
        cur = next;
      }
    }
  }
  if (cur) chunks.push(cur);
  return chunks.slice(0, 16);
}

export function concatBytes(parts: Uint8Array[]) {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function buildElevenPayload(args: { script: string; profile: VoiceProfile }) {
  const stability = args.profile === 'finely_documentary' ? 0.48 : 0.44;
  const similarity = args.profile === 'finely_documentary' ? 0.84 : 0.8;
  return {
    text: args.script,
    model_id: envVoice('ELEVENLABS_MODEL', 'eleven_multilingual_v2'),
    voice_settings: {
      stability,
      similarity_boost: similarity,
      style: args.profile === 'finely_documentary' ? 0.38 : 0.28,
      use_speaker_boost: true,
    },
  };
}

async function callCartesia(args: { apiKey: string; script: string; profile: VoiceProfile }) {
  const model = envVoice('CARTESIA_MODEL', 'sonic-2');
  const voiceId = cartesiaVoiceId(args.profile);
  const chunks = splitScript(args.script, 2600);
  const parts: Uint8Array[] = [];
  for (const chunk of chunks) {
    const res = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'X-API-Key': args.apiKey,
        'Cartesia-Version': '2024-06-10',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: model,
        transcript: chunk,
        voice: { mode: 'id', id: voiceId },
        output_format: { container: 'mp3', sample_rate: 44100, bit_rate: 128000 },
      }),
    });
    if (!res.ok) throw new Error(`Cartesia error: ${res.status} ${await res.text()}`);
    parts.push(new Uint8Array(await res.arrayBuffer()));
  }
  return { provider: 'cartesia', model, mimeType: 'audio/mpeg', bytes: concatBytes(parts), chunks: parts.length };
}

async function callElevenLabs(args: { apiKey: string; script: string; profile: VoiceProfile }) {
  const voiceId = elevenVoiceId(args.profile);
  const chunks = splitScript(args.script);
  const parts: Uint8Array[] = [];
  for (const chunk of chunks) {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
      method: 'POST',
      headers: {
        'xi-api-key': args.apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify(buildElevenPayload({ script: chunk, profile: args.profile })),
    });
    if (!res.ok) throw new Error(`ElevenLabs error: ${res.status} ${await res.text()}`);
    parts.push(new Uint8Array(await res.arrayBuffer()));
  }
  return {
    provider: 'elevenlabs',
    model: envVoice('ELEVENLABS_MODEL', 'eleven_multilingual_v2'),
    mimeType: 'audio/mpeg',
    bytes: concatBytes(parts),
    chunks: parts.length,
  };
}

async function callOpenAiTts(args: { apiKey: string; script: string; profile: VoiceProfile }) {
  const model = envVoice('OPENAI_TTS_MODEL', 'tts-1-hd');
  const chunks = splitScript(args.script, 2400);
  const parts: Uint8Array[] = [];
  for (const chunk of chunks) {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        voice: OPENAI_VOICES[args.profile],
        input: chunk,
        response_format: 'mp3',
        speed: args.profile === 'finely_documentary' ? 0.94 : 0.92,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI TTS error: ${res.status} ${await res.text()}`);
    parts.push(new Uint8Array(await res.arrayBuffer()));
  }
  return { provider: 'openai', model, mimeType: 'audio/mpeg', bytes: concatBytes(parts), chunks: parts.length };
}

/** Brand clone profiles prefer ElevenLabs; presets prefer Cartesia quality tier. */
export async function renderStudioAudio(args: { script: string; profile: VoiceProfile }) {
  const prepared = applyPerformanceDirector(applyPronunciationLexicon(clampText(args.script)));
  const cartesiaKey = envVoice('CARTESIA_API_KEY');
  const elevenKey = envVoice('ELEVENLABS_API_KEY');
  const openAiKey = envVoice('OPENAI_API_KEY');

  const useClone = args.profile === 'finely_brand_primary' || args.profile === 'nora_funding_advisor';

  if (useClone && elevenKey) {
    return callElevenLabs({ apiKey: elevenKey, script: prepared, profile: args.profile });
  }
  if (cartesiaKey) {
    return callCartesia({ apiKey: cartesiaKey, script: prepared, profile: args.profile });
  }
  if (elevenKey) {
    return callElevenLabs({ apiKey: elevenKey, script: prepared, profile: args.profile });
  }
  if (openAiKey) {
    return callOpenAiTts({ apiKey: openAiKey, script: prepared, profile: args.profile });
  }
  throw new Error('No voice provider configured. Set CARTESIA_API_KEY, ELEVENLABS_API_KEY, or OPENAI_API_KEY.');
}

export function storagePath(args: {
  tenantId: VoiceTenantId;
  contentType: ContentType;
  contentId: string;
  voiceProfile: VoiceProfile;
  scriptHash: string;
}) {
  return `tenants/${args.tenantId}/${args.contentType}/${args.contentId}/${args.voiceProfile}/${VOICE_PIPELINE_VERSION}_${args.scriptHash.slice(0, 16)}.mp3`;
}
