#!/usr/bin/env node
/**
 * Phase 6 — Finely Cred launch presenter demo (WebM).
 *
 * 3-scene Ken Burns pan/zoom on branded slides + voice narration.
 * Uses ffmpeg (required). Voice priority:
 *   1. Supabase voice-studio edge (ELEVENLABS / Cartesia on function)
 *   2. OS TTS fallback (Windows SAPI, macOS `say`, Linux `espeak`)
 *   3. Silent render with on-screen captions only (still real motion video)
 *
 * Output: public/demos/finely-launch-demo.webm
 *
 * Usage:
 *   node scripts/generate-launch-demo-video.mjs
 *   node scripts/generate-launch-demo-video.mjs --force
 *   node scripts/generate-launch-demo-video.mjs --voice=local
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'public', 'demos');
const workDir = path.join(outDir, '.render-work');
const finalWebm = path.join(outDir, 'finely-launch-demo.webm');
const manifestPath = path.join(outDir, 'finely-launch-demo.json');

const force = process.argv.includes('--force');
const voiceMode = process.argv.find((a) => a.startsWith('--voice='))?.split('=')[1] ?? 'auto';

const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 30;

/** Presenter demo scenes — mirrors Content Studio fallback beats (3-scene cut). */
const SCENES = [
  {
    id: 'hook',
    beat: 'Hook the pain point',
    image: path.join(root, 'public/tours/tour-home-overview/step-01.png'),
    caption: 'Your credit path should feel organized.',
    voiceover:
      'Your next credit move should feel clear before it feels urgent. Finely Cred helps partners understand the next step without pressure or unrealistic promises.',
    durationSec: 9,
    motion: 'zoom-in',
  },
  {
    id: 'path',
    beat: 'Show the organized path',
    image: path.join(root, 'public/tours/tour-portal-dispute-letter/step-02.png'),
    caption: 'Dispute letters, portal tools, one lane at a time.',
    voiceover:
      'Upload your report, review factual findings, and send dispute letters from one workspace. No scattered tabs, no guesswork about what to do next.',
    durationSec: 10,
    motion: 'pan-left',
  },
  {
    id: 'cta',
    beat: 'Clear CTA',
    image: path.join(root, 'public/marketing/personal-credit-restore-hero-reference.png'),
    caption: 'Start your free guide or book a strategy call.',
    voiceover:
      'Start with a free guide, or book a strategy call when you want a human in the loop. Results vary — this is education, not legal advice.',
    durationSec: 9,
    motion: 'zoom-out',
  },
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const fileEnv = {
  ...parseEnvFile(path.join(root, '.env')),
  ...parseEnvFile(path.join(root, '.env.local')),
};
for (const [k, v] of Object.entries(fileEnv)) {
  if (!process.env[k]) process.env[k] = v;
}

const portableFfmpeg = path.join(__dirname, '.tools', 'ffmpeg', 'bin', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');

function resolveFfmpeg() {
  if (spawnSync('ffmpeg', ['-version'], { encoding: 'utf8', shell: process.platform === 'win32' }).status === 0) {
    return 'ffmpeg';
  }
  if (fs.existsSync(portableFfmpeg)) return portableFfmpeg;
  return null;
}

function hasFfmpeg() {
  return resolveFfmpeg() !== null;
}

function runFfmpeg(args, label) {
  const bin = resolveFfmpeg();
  if (!bin) throw new Error('ffmpeg not found');
  const r = spawnSync(bin, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32' && bin === 'ffmpeg',
  });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${label}`);
}


function kenBurnsFilter(scene, durationSec) {
  const frames = Math.max(1, Math.round(durationSec * FPS));
  const s = `${WIDTH}x${HEIGHT}`;

  if (scene.motion === 'pan-left') {
    return (
      `zoompan=z='1.18':x='(iw-iw/zoom)*on/${frames}':y='ih/2-(ih/zoom/2)':` +
      `d=${frames}:s=${s}:fps=${FPS}`
    );
  }
  if (scene.motion === 'zoom-out') {
    return (
      `zoompan=z='if(lte(on,1),1.35,max(1.001,zoom-0.0018))':` +
      `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${s}:fps=${FPS}`
    );
  }
  // zoom-in (default)
  return (
    `zoompan=z='min(zoom+0.0016,1.35)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':` +
    `d=${frames}:s=${s}:fps=${FPS}`
  );
}

async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function renderVoiceStudio(text, outPath, sceneId) {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  if (!url || !anonKey) return { ok: false, reason: 'missing Supabase env' };

  const script = text.trim();
  const scriptHash = await sha256(script);
  const contentId = `launch-demo-${sceneId}`;

  const res = await fetch(`${url}/functions/v1/voice-studio`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'render',
      tenantId: 'finely_cred',
      contentType: 'content_studio',
      contentId,
      title: `Launch demo · ${sceneId}`,
      voiceProfile: 'finely_brand_primary',
      script,
      scriptHash,
      force: true,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    return { ok: false, reason: data.error || `HTTP ${res.status}` };
  }

  if (data.audioDataUrl && typeof data.audioDataUrl === 'string') {
    const m = data.audioDataUrl.match(/^data:[^;]+;base64,(.+)$/);
    if (m) {
      fs.writeFileSync(outPath, Buffer.from(m[1], 'base64'));
      return { ok: true, via: 'voice-studio:dataUrl' };
    }
  }

  if (data.signedUrl) {
    const audioRes = await fetch(data.signedUrl);
    if (!audioRes.ok) return { ok: false, reason: `download HTTP ${audioRes.status}` };
    fs.writeFileSync(outPath, Buffer.from(await audioRes.arrayBuffer()));
    return { ok: true, via: 'voice-studio:signedUrl' };
  }

  return { ok: false, reason: 'no audio payload' };
}

function renderVoiceLocal(text, outWav) {
  const safe = text.replace(/'/g, "''").replace(/\r?\n/g, ' ');

  if (process.platform === 'win32') {
    const ps = `
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.Rate = 0
$s.SetOutputToWaveFile('${outWav.replace(/'/g, "''")}')
$s.Speak('${safe}')
$s.Dispose()
`;
    const r = spawnSync('powershell', ['-NoProfile', '-Command', ps], {
      stdio: 'pipe',
      encoding: 'utf8',
      shell: false,
    });
    if (r.status === 0 && fs.existsSync(outWav)) return { ok: true, via: 'windows-sapi' };
    return { ok: false, reason: r.stderr || 'Windows SAPI failed' };
  }

  if (process.platform === 'darwin') {
    const r = spawnSync('say', ['-o', outWav, '--data-format=LEI16@22050', safe], { stdio: 'pipe', encoding: 'utf8' });
    if (r.status === 0 && fs.existsSync(outWav)) return { ok: true, via: 'macos-say' };
    return { ok: false, reason: r.stderr || 'say failed' };
  }

  const r = spawnSync('espeak', ['-w', outWav, safe], { stdio: 'pipe', encoding: 'utf8', shell: process.platform === 'win32' });
  if (r.status === 0 && fs.existsSync(outWav)) return { ok: true, via: 'espeak' };
  return { ok: false, reason: r.stderr || 'espeak not found' };
}

async function ensureSlidePng(scene, outPng) {
  const fallback = path.join(root, 'public/brand/finely-cred-logo-dark.png');
  const src = fs.existsSync(scene.image) ? scene.image : fallback;
  if (!fs.existsSync(src)) {
    throw new Error(`Missing slide image for ${scene.id}: ${scene.image}`);
  }

  const meta = await sharp(src).metadata();
  const srcW = meta.width ?? WIDTH;
  const srcH = meta.height ?? HEIGHT;

  const captionSvg = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="vig" x1="0" y1="0" x2="0" y2="1">
      <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.45"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#vig)"/>
  <rect x="40" y="${HEIGHT - 120}" width="${WIDTH - 80}" height="72" rx="18" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
  <text x="56" y="${HEIGHT - 72}" fill="rgba(255,255,255,0.92)" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="600">${scene.caption.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>
</svg>`;

  await sharp(src)
    .resize(WIDTH, HEIGHT, {
      fit: 'cover',
      position: 'centre',
      kernel: sharp.kernel.lanczos3,
    })
    .composite([{ input: Buffer.from(captionSvg), top: 0, left: 0 }])
    .png()
    .toFile(outPng);

  return { src, srcW, srcH };
}

async function renderScene(scene, index, voiceReport) {
  const slidePng = path.join(workDir, `${scene.id}-slide.png`);
  const voiceMp3 = path.join(workDir, `${scene.id}-voice.mp3`);
  const voiceWav = path.join(workDir, `${scene.id}-voice.wav`);
  const segWebm = path.join(workDir, `${scene.id}-seg.webm`);

  await ensureSlidePng(scene, slidePng);

  let audioPath = null;
  let voiceVia = 'none';

  if (voiceMode !== 'none') {
    if (voiceMode === 'auto' || voiceMode === 'studio') {
      try {
        const studio = await renderVoiceStudio(scene.voiceover, voiceMp3, scene.id);
        if (studio.ok && fs.existsSync(voiceMp3)) {
          audioPath = voiceMp3;
          voiceVia = studio.via;
        } else if (voiceMode === 'studio') {
          voiceReport.push({ scene: scene.id, error: studio.reason });
        }
      } catch (e) {
        if (voiceMode === 'studio') voiceReport.push({ scene: scene.id, error: e?.message ?? e });
      }
    }

    if (!audioPath && (voiceMode === 'auto' || voiceMode === 'local')) {
      const local = renderVoiceLocal(scene.voiceover, voiceWav);
      if (local.ok) {
        audioPath = voiceWav;
        voiceVia = local.via;
      } else {
        voiceReport.push({ scene: scene.id, error: local.reason });
      }
    }
  }

  const vf = kenBurnsFilter(scene, scene.durationSec);
  const ffmpegArgs = ['-y', '-loop', '1', '-i', slidePng, '-vf', vf, '-t', String(scene.durationSec), '-an', '-c:v', 'libvpx-vp9', '-b:v', '2M', '-pix_fmt', 'yuv420p', segWebm];

  if (audioPath) {
    runFfmpeg(
      [
        '-y',
        '-loop',
        '1',
        '-i',
        slidePng,
        '-i',
        audioPath,
        '-vf',
        vf,
        '-map',
        '0:v',
        '-map',
        '1:a',
        '-t',
        String(scene.durationSec),
        '-c:v',
        'libvpx-vp9',
        '-b:v',
        '2M',
        '-c:a',
        'libopus',
        '-b:a',
        '128k',
        '-shortest',
        '-pix_fmt',
        'yuv420p',
        segWebm,
      ],
      `${scene.id} segment`,
    );
  } else {
    runFfmpeg(ffmpegArgs, `${scene.id} segment (silent)`);
  }

  return { segWebm, voiceVia, index };
}

async function main() {
  if (!hasFfmpeg()) {
    console.error('ffmpeg not found on PATH. Install ffmpeg and retry.');
    console.error('Manual run: node scripts/generate-launch-demo-video.mjs');
    process.exit(1);
  }

  if (!force && fs.existsSync(finalWebm)) {
    console.log(`Exists (use --force): ${finalWebm}`);
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(workDir, { recursive: true });

  console.log('Finely Cred launch presenter demo — 3-scene Ken Burns WebM\n');

  const voiceReport = [];
  const segments = [];

  for (let i = 0; i < SCENES.length; i += 1) {
    const scene = SCENES[i];
    console.log(`Scene ${i + 1}/${SCENES.length}: ${scene.beat}`);
    // eslint-disable-next-line no-await-in-loop
    const seg = await renderScene(scene, i, voiceReport);
    segments.push(seg);
    console.log(`  → ${path.basename(seg.segWebm)} · voice: ${seg.voiceVia}\n`);
  }

  const listPath = path.join(workDir, 'concat.txt');
  fs.writeFileSync(
    listPath,
    segments.map((s) => `file '${s.segWebm.replace(/\\/g, '/')}'`).join('\n'),
    'utf8',
  );

  runFfmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', finalWebm], 'concat');

  const voiceModes = segments.map((s) => s.voiceVia);
  const hasVoice = voiceModes.some((v) => v !== 'none');
  const usedStudio = voiceModes.some((v) => String(v).startsWith('voice-studio'));
  const label = usedStudio ? 'Content Studio voice' : hasVoice ? 'Presenter demo (local TTS)' : 'Presenter demo (motion + captions, no voice API)';

  const manifest = {
    id: 'finely-launch-demo',
    title: 'Finely Cred launch presenter demo',
    label,
    kind: 'presenter_demo',
    cinematicApi: usedStudio,
    output: '/demos/finely-launch-demo.webm',
    durationSec: SCENES.reduce((a, s) => a + s.durationSec, 0),
    scenes: SCENES.map((s, idx) => ({
      id: s.id,
      beat: s.beat,
      caption: s.caption,
      durationSec: s.durationSec,
      motion: s.motion,
      voice: voiceModes[idx],
    })),
    voiceWarnings: voiceReport,
    generatedAt: new Date().toISOString(),
    generator: 'scripts/generate-launch-demo-video.mjs',
    complianceNote: 'Results vary · not legal advice · educational only',
  };

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`\nWrote ${finalWebm}`);
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Label: ${label}`);
  if (voiceReport.length) {
    console.log('\nVoice fallbacks / warnings:');
    for (const w of voiceReport) console.log(`  ${w.scene}: ${w.error}`);
  }
  if (!hasVoice) {
    console.log('\nNo voice track — set Supabase keys or use local TTS. Video still has Ken Burns motion + captions.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
