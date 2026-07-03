/**
 * Generates long-form premium SFX + music bed WAV files (stereo, layered).
 * Replace files with licensed studio assets anytime — paths stay stable.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../public/assets/sfx/premium');

const SR = 44100;

function writeWavStereo(filePath, left, right, sampleRate = SR) {
  const n = Math.max(left.length, right.length);
  const numChannels = 2;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = n * 4;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < n; i += 1) {
    const l = Math.max(-1, Math.min(1, left[i] ?? 0));
    const r = Math.max(-1, Math.min(1, right[i] ?? 0));
    buffer.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
    buffer.writeInt16LE(Math.round(r * 32767), 44 + i * 4 + 2);
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
}

function env(durationSec, fn) {
  const n = Math.floor(durationSec * SR);
  const left = new Float64Array(n);
  const right = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    const p = i / n;
    const [l, r] = fn(t, p, i);
    left[i] = l;
    right[i] = r ?? l;
  }
  let peak = 0.0001;
  for (let i = 0; i < left.length; i += 1) {
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  }
  const gain = 0.9 / peak;
  return { left: left.map((x) => x * gain), right: right.map((x) => x * gain) };
}

function reverb(sample, decay = 0.42, delay = 2200) {
  const out = new Float64Array(sample.length);
  for (let i = 0; i < sample.length; i += 1) {
    const wet = i >= delay ? sample[i - delay] * decay : 0;
    out[i] = sample[i] + wet;
  }
  return out;
}

function pad(root, t, detune = 0) {
  return Math.sin(2 * Math.PI * root * (1 + detune) * t) * 0.22;
}

const defs = [];

for (let i = 1; i <= 8; i += 1) {
  defs.push({
    name: `whoosh_${i}.wav`,
    dur: 2.2 + i * 0.15,
    fn: (t, p) => {
      const noise = (Math.random() * 2 - 1) * (1 - p) * 0.28;
      const sweep = Math.sin(2 * Math.PI * (1400 - p * 900 * i) * t) * (1 - p) * 0.18;
      const tail = Math.sin(2 * Math.PI * (180 - p * 80) * t) * Math.exp(-p * 4) * 0.12;
      const v = noise + sweep + tail;
      return [v, v * 0.92];
    },
  });
}

for (let i = 1; i <= 6; i += 1) {
  defs.push({
    name: `impact_${i}.wav`,
    dur: 1.2 + i * 0.1,
    fn: (t, p) => {
      const hit = Math.sin(2 * Math.PI * (90 - p * 30 * i) * t) * Math.exp(-p * 5) * 0.85;
      const sub = Math.sin(2 * Math.PI * 45 * t) * Math.exp(-p * 3) * 0.35;
      const v = hit + sub;
      return [v, v * 0.95];
    },
  });
}

for (let i = 1; i <= 6; i += 1) {
  defs.push({
    name: `ui_${i}.wav`,
    dur: 0.45 + i * 0.05,
    fn: (t, p) => {
      const chime = Math.sin(2 * Math.PI * (880 + i * 120) * t) * Math.exp(-p * 8) * 0.35;
      const click = Math.sin(2 * Math.PI * 2400 * t) * Math.exp(-p * 30) * 0.15;
      const v = chime + click;
      return [v, v];
    },
  });
}

for (let i = 1; i <= 6; i += 1) {
  defs.push({
    name: `corporate_${i}.wav`,
    dur: 3.5 + i * 0.4,
    fn: (t, p) => {
      const roots = [196, 247, 294, 330][i % 4];
      const a = pad(roots, t) + pad(roots * 1.5, t, 0.002) + pad(roots * 2, t, -0.001);
      const swell = 0.55 + 0.45 * Math.sin(t * 0.8 + i);
      const v = a * swell * Math.exp(-p * 0.35);
      return [v, v * 0.97];
    },
  });
}

for (let i = 1; i <= 6; i += 1) {
  const roots = [110, 130, 98, 146, 123, 104][i - 1];
  defs.push({
    name: `music_bed_${i}.wav`,
    dur: 42 + i * 2,
    fn: (t, p) => {
      const chord = [1, 1.25, 1.5, 2][Math.floor((t / 8 + i) % 4)];
      const base = roots * chord;
      const l =
        pad(base, t) +
        pad(base * 2, t, 0.003) * 0.6 +
        pad(base * 3, t, -0.002) * 0.25 +
        Math.sin(2 * Math.PI * 0.12 * t) * 0.04;
      const r =
        pad(base * 1.01, t) +
        pad(base * 1.5, t, 0.004) * 0.55 +
        pad(base * 2.01, t, -0.003) * 0.22;
      const fade = p < 0.02 ? p / 0.02 : p > 0.96 ? (1 - p) / 0.04 : 1;
      return [l * fade, r * fade];
    },
  });
}

for (let i = 1; i <= 4; i += 1) {
  defs.push({
    name: `testimonial_${i}.wav`,
    dur: 6 + i * 0.5,
    fn: (t, p) => {
      const warm = pad(220 + i * 8, t) + pad(330 + i * 6, t) * 0.5;
      const v = warm * (0.7 + 0.3 * (1 - p)) * Math.exp(-p * 0.6);
      return [v, v * 0.96];
    },
  });
}

for (let i = 1; i <= 4; i += 1) {
  defs.push({
    name: `ambient_${i}.wav`,
    dur: 18 + i * 2,
    fn: (t, p) => {
      const air = (Math.random() * 2 - 1) * 0.04;
      const drone = pad(72 + i * 4, t) + pad(96 + i * 3, t) * 0.4;
      const v = (air + drone) * (0.85 + 0.15 * Math.sin(t * 0.2));
      return [v, v * 0.98];
    },
  });
}

for (let i = 1; i <= 4; i += 1) {
  defs.push({
    name: `tech_${i}.wav`,
    dur: 2.5 + i * 0.3,
    fn: (t, p) => {
      const pulse = Math.sin(2 * Math.PI * (400 + i * 60) * t) * (0.15 + 0.1 * Math.sin(t * 12));
      const glitch = (Math.random() > 0.992 ? 0.5 : 0) * (1 - p);
      const v = pulse + glitch;
      return [v, v * 0.9];
    },
  });
}

fs.mkdirSync(OUT, { recursive: true });
let count = 0;
for (const d of defs) {
  const { left, right } = env(d.dur, d.fn);
  const wetL = reverb(left);
  const wetR = reverb(right);
  writeWavStereo(path.join(OUT, d.name), wetL, wetR, SR);
  count += 1;
}
console.log(`Wrote ${count} long-form premium stereo WAV files to ${OUT}`);
