/**
 * Zero-dependency QR Code encoder (byte mode, versions 1-10).
 *
 * Digital invite cards need a scannable code that survives PNG export, so the
 * matrix is generated in-app as plain data and drawn as inline SVG. No runtime
 * dependency, no network round-trip, no CORS-tainted canvas on capture.
 *
 * Spec coverage: ISO/IEC 18004 byte mode, ECC levels L/M/Q/H, versions 1-10
 * (up to 271 bytes at level M) which comfortably covers invite URLs.
 */

export type QrEccLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrMatrix {
  /** Module count per side (21 for v1, +4 per version). */
  size: number;
  /** Row-major booleans; true = dark module. */
  modules: boolean[][];
  version: number;
  ecc: QrEccLevel;
}

/** Total codewords (data + error correction) per version, index = version. */
const TOTAL_CODEWORDS = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346];

/**
 * Block layout per version/ECC:
 * [ecCodewordsPerBlock, group1Blocks, group1DataCodewords, group2Blocks, group2DataCodewords]
 */
const BLOCK_TABLE: Record<QrEccLevel, Array<[number, number, number, number, number]>> = {
  L: [
    [0, 0, 0, 0, 0],
    [7, 1, 19, 0, 0],
    [10, 1, 34, 0, 0],
    [15, 1, 55, 0, 0],
    [20, 1, 80, 0, 0],
    [26, 1, 108, 0, 0],
    [18, 2, 68, 0, 0],
    [20, 2, 78, 0, 0],
    [24, 2, 97, 0, 0],
    [30, 2, 116, 0, 0],
    [18, 2, 68, 2, 69],
  ],
  M: [
    [0, 0, 0, 0, 0],
    [10, 1, 16, 0, 0],
    [16, 1, 28, 0, 0],
    [26, 1, 44, 0, 0],
    [18, 2, 32, 0, 0],
    [24, 2, 43, 0, 0],
    [16, 4, 27, 0, 0],
    [18, 4, 31, 0, 0],
    [22, 2, 38, 2, 39],
    [22, 3, 36, 2, 37],
    [26, 4, 43, 1, 44],
  ],
  Q: [
    [0, 0, 0, 0, 0],
    [13, 1, 13, 0, 0],
    [22, 1, 22, 0, 0],
    [18, 2, 17, 0, 0],
    [26, 2, 24, 0, 0],
    [18, 2, 15, 2, 16],
    [24, 4, 19, 0, 0],
    [18, 2, 14, 4, 15],
    [22, 4, 18, 2, 19],
    [20, 4, 16, 4, 17],
    [24, 6, 19, 2, 20],
  ],
  H: [
    [0, 0, 0, 0, 0],
    [17, 1, 9, 0, 0],
    [28, 1, 16, 0, 0],
    [22, 2, 13, 0, 0],
    [16, 4, 9, 0, 0],
    [22, 2, 11, 2, 12],
    [28, 4, 15, 0, 0],
    [26, 4, 13, 1, 14],
    [26, 4, 14, 2, 15],
    [24, 4, 12, 4, 13],
    [28, 6, 15, 2, 16],
  ],
};

/** Alignment pattern centre coordinates, index = version. */
const ALIGNMENT_POSITIONS: number[][] = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

const ECC_FORMAT_BITS: Record<QrEccLevel, number> = { L: 0b01, M: 0b00, Q: 0b11, H: 0b10 };

const MAX_VERSION = 10;

// ---------------------------------------------------------------------------
// GF(256) arithmetic (primitive polynomial 0x11D)
// ---------------------------------------------------------------------------

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

/** Generator polynomial coefficients for `degree` error-correction codewords. */
function generatorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function reedSolomon(data: number[], ecLength: number): number[] {
  const gen = generatorPoly(ecLength);
  const remainder = new Array<number>(ecLength).fill(0);
  for (const byte of data) {
    const factor = byte ^ remainder[0];
    remainder.shift();
    remainder.push(0);
    for (let i = 0; i < ecLength; i += 1) {
      remainder[i] ^= gfMul(gen[i + 1], factor);
    }
  }
  return remainder;
}

// ---------------------------------------------------------------------------
// Bit buffer
// ---------------------------------------------------------------------------

class BitBuffer {
  private bits: number[] = [];

  push(value: number, length: number) {
    for (let i = length - 1; i >= 0; i -= 1) {
      this.bits.push((value >>> i) & 1);
    }
  }

  get length() {
    return this.bits.length;
  }

  toBytes(): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < this.bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j += 1) byte = (byte << 1) | (this.bits[i + j] ?? 0);
      bytes.push(byte);
    }
    return bytes;
  }
}

// ---------------------------------------------------------------------------
// Encoding
// ---------------------------------------------------------------------------

function utf8Bytes(text: string): number[] {
  const out: number[] = [];
  for (const char of text) {
    const cp = char.codePointAt(0) ?? 0;
    if (cp < 0x80) {
      out.push(cp);
    } else if (cp < 0x800) {
      out.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
    } else if (cp < 0x10000) {
      out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    } else {
      out.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      );
    }
  }
  return out;
}

function dataCapacityBytes(version: number, ecc: QrEccLevel): number {
  const [, g1Blocks, g1Data, g2Blocks, g2Data] = BLOCK_TABLE[ecc][version];
  return g1Blocks * g1Data + g2Blocks * g2Data;
}

function pickVersion(byteLength: number, ecc: QrEccLevel, minVersion: number): number {
  for (let version = Math.max(1, minVersion); version <= MAX_VERSION; version += 1) {
    const countBits = version < 10 ? 8 : 16;
    const needed = Math.ceil((4 + countBits + byteLength * 8) / 8);
    if (needed <= dataCapacityBytes(version, ecc)) return version;
  }
  throw new Error(`QR payload too long for version ${MAX_VERSION} at ECC ${ecc}`);
}

function buildCodewords(bytes: number[], version: number, ecc: QrEccLevel): number[] {
  const capacity = dataCapacityBytes(version, ecc);
  const buffer = new BitBuffer();
  buffer.push(0b0100, 4);
  buffer.push(bytes.length, version < 10 ? 8 : 16);
  for (const byte of bytes) buffer.push(byte, 8);

  const capacityBits = capacity * 8;
  const terminator = Math.min(4, capacityBits - buffer.length);
  if (terminator > 0) buffer.push(0, terminator);
  if (buffer.length % 8 !== 0) buffer.push(0, 8 - (buffer.length % 8));

  const data = buffer.toBytes();
  const padBytes = [0xec, 0x11];
  let padIndex = 0;
  while (data.length < capacity) {
    data.push(padBytes[padIndex % 2]);
    padIndex += 1;
  }

  const [ecLength, g1Blocks, g1Data, g2Blocks, g2Data] = BLOCK_TABLE[ecc][version];
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;
  for (let i = 0; i < g1Blocks + g2Blocks; i += 1) {
    const size = i < g1Blocks ? g1Data : g2Data;
    const block = data.slice(offset, offset + size);
    offset += size;
    dataBlocks.push(block);
    ecBlocks.push(reedSolomon(block, ecLength));
  }

  const interleaved: number[] = [];
  const maxData = Math.max(g1Data, g2Data);
  for (let i = 0; i < maxData; i += 1) {
    for (const block of dataBlocks) {
      if (i < block.length) interleaved.push(block[i]);
    }
  }
  for (let i = 0; i < ecLength; i += 1) {
    for (const block of ecBlocks) interleaved.push(block[i]);
  }
  return interleaved;
}

// ---------------------------------------------------------------------------
// Matrix construction
// ---------------------------------------------------------------------------

type Grid = Array<Array<number | null>>;

function placeFinder(grid: Grid, reserved: boolean[][], row: number, col: number) {
  for (let r = -1; r <= 7; r += 1) {
    for (let c = -1; c <= 7; c += 1) {
      const rr = row + r;
      const cc = col + c;
      if (rr < 0 || cc < 0 || rr >= grid.length || cc >= grid.length) continue;
      const inRing = (r >= 0 && r <= 6 && (c === 0 || c === 6)) || (c >= 0 && c <= 6 && (r === 0 || r === 6));
      const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      grid[rr][cc] = inRing || inCore ? 1 : 0;
      reserved[rr][cc] = true;
    }
  }
}

function placeAlignment(grid: Grid, reserved: boolean[][], version: number) {
  const centers = ALIGNMENT_POSITIONS[version];
  if (!centers.length) return;
  const last = grid.length - 1;
  for (const row of centers) {
    for (const col of centers) {
      const isFinderCorner =
        (row <= 8 && col <= 8) || (row <= 8 && col >= last - 8) || (row >= last - 8 && col <= 8);
      if (isFinderCorner) continue;
      for (let r = -2; r <= 2; r += 1) {
        for (let c = -2; c <= 2; c += 1) {
          const ring = Math.max(Math.abs(r), Math.abs(c));
          grid[row + r][col + c] = ring === 1 ? 0 : 1;
          reserved[row + r][col + c] = true;
        }
      }
    }
  }
}

function placeTiming(grid: Grid, reserved: boolean[][]) {
  const size = grid.length;
  for (let i = 8; i < size - 8; i += 1) {
    const bit = i % 2 === 0 ? 1 : 0;
    grid[6][i] = bit;
    reserved[6][i] = true;
    grid[i][6] = bit;
    reserved[i][6] = true;
  }
}

function reserveFormatAreas(grid: Grid, reserved: boolean[][], version: number) {
  const size = grid.length;
  for (let i = 0; i <= 8; i += 1) {
    if (i !== 6) {
      reserved[8][i] = true;
      reserved[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i += 1) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }
  // Dark module.
  grid[size - 8][8] = 1;
  reserved[size - 8][8] = true;

  if (version >= 7) {
    for (let i = 0; i < 6; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        reserved[size - 11 + j][i] = true;
        reserved[i][size - 11 + j] = true;
      }
    }
  }
}

function placeData(grid: Grid, reserved: boolean[][], codewords: number[]) {
  const size = grid.length;
  let bitIndex = 0;
  const totalBits = codewords.length * 8;
  const nextBit = (): number => {
    if (bitIndex >= totalBits) return 0;
    const bit = (codewords[bitIndex >> 3] >> (7 - (bitIndex & 7))) & 1;
    bitIndex += 1;
    return bit;
  };

  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    const colRight = right <= 6 ? right - 1 : right;
    for (let step = 0; step < size; step += 1) {
      const row = upward ? size - 1 - step : step;
      for (let offset = 0; offset < 2; offset += 1) {
        const col = colRight - offset;
        if (reserved[row][col]) continue;
        grid[row][col] = nextBit();
      }
    }
    upward = !upward;
  }
}

function maskBit(mask: number, row: number, col: number): boolean {
  switch (mask) {
    case 0:
      return (row + col) % 2 === 0;
    case 1:
      return row % 2 === 0;
    case 2:
      return col % 3 === 0;
    case 3:
      return (row + col) % 3 === 0;
    case 4:
      return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5:
      return ((row * col) % 2) + ((row * col) % 3) === 0;
    case 6:
      return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
    default:
      return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
  }
}

function formatBits(ecc: QrEccLevel, mask: number): number {
  const data = (ECC_FORMAT_BITS[ecc] << 3) | mask;
  let rest = data << 10;
  for (let i = 14; i >= 10; i -= 1) {
    if ((rest >> i) & 1) rest ^= 0b10100110111 << (i - 10);
  }
  return ((data << 10) | rest) ^ 0b101010000010010;
}

function versionBits(version: number): number {
  let rest = version << 12;
  for (let i = 17; i >= 12; i -= 1) {
    if ((rest >> i) & 1) rest ^= 0b1111100100101 << (i - 12);
  }
  return (version << 12) | rest;
}

function applyFormatInfo(grid: Grid, ecc: QrEccLevel, mask: number) {
  const size = grid.length;
  const bits = formatBits(ecc, mask);
  // Copy 1 — down the left column beside the top-left finder.
  for (let i = 0; i < 15; i += 1) {
    const bit = (bits >> i) & 1;
    if (i < 6) grid[i][8] = bit;
    else if (i < 8) grid[i + 1][8] = bit;
    else grid[size - 15 + i][8] = bit;
  }
  // Copy 2 — along row 8, split between the two right/bottom finders.
  for (let i = 0; i < 15; i += 1) {
    const bit = (bits >> i) & 1;
    if (i < 8) grid[8][size - i - 1] = bit;
    else if (i < 9) grid[8][15 - i] = bit;
    else grid[8][14 - i] = bit;
  }
}

function applyVersionInfo(grid: Grid, version: number) {
  if (version < 7) return;
  const size = grid.length;
  const bits = versionBits(version);
  for (let i = 0; i < 18; i += 1) {
    const bit = (bits >> i) & 1;
    const row = Math.floor(i / 3);
    const col = i % 3;
    grid[size - 11 + col][row] = bit;
    grid[row][size - 11 + col] = bit;
  }
}

function penaltyScore(grid: Grid): number {
  const size = grid.length;
  const at = (r: number, c: number) => (grid[r][c] ? 1 : 0);
  let score = 0;

  // Rule 1 — runs of 5+ same-colour modules.
  for (let i = 0; i < size; i += 1) {
    for (const horizontal of [true, false]) {
      let run = 1;
      let prev = horizontal ? at(i, 0) : at(0, i);
      for (let j = 1; j < size; j += 1) {
        const value = horizontal ? at(i, j) : at(j, i);
        if (value === prev) {
          run += 1;
        } else {
          if (run >= 5) score += 3 + (run - 5);
          run = 1;
          prev = value;
        }
      }
      if (run >= 5) score += 3 + (run - 5);
    }
  }

  // Rule 2 — 2x2 blocks of the same colour.
  for (let r = 0; r < size - 1; r += 1) {
    for (let c = 0; c < size - 1; c += 1) {
      const v = at(r, c);
      if (v === at(r, c + 1) && v === at(r + 1, c) && v === at(r + 1, c + 1)) score += 3;
    }
  }

  // Rule 3 — finder-like 1:1:3:1:1 patterns with 4 light modules.
  const pattern = [1, 0, 1, 1, 1, 0, 1];
  const light4 = [0, 0, 0, 0];
  const matches = (values: number[], start: number, seq: number[]) =>
    seq.every((bit, index) => values[start + index] === bit);
  for (let i = 0; i < size; i += 1) {
    const row: number[] = [];
    const col: number[] = [];
    for (let j = 0; j < size; j += 1) {
      row.push(at(i, j));
      col.push(at(j, i));
    }
    for (const line of [row, col]) {
      for (let j = 0; j + 7 <= size; j += 1) {
        if (!matches(line, j, pattern)) continue;
        const before = j - 4 >= 0 && matches(line, j - 4, light4);
        const after = j + 7 + 4 <= size && matches(line, j + 7, light4);
        if (before || after) score += 40;
      }
    }
  }

  // Rule 4 — dark/light balance.
  let dark = 0;
  for (let r = 0; r < size; r += 1) for (let c = 0; c < size; c += 1) dark += at(r, c);
  const ratio = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(ratio - 50) / 5) * 10;

  return score;
}

function buildBaseGrid(version: number, codewords: number[]) {
  const size = version * 4 + 17;
  const grid: Grid = Array.from({ length: size }, () => new Array<number | null>(size).fill(null));
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));

  placeFinder(grid, reserved, 0, 0);
  placeFinder(grid, reserved, 0, size - 7);
  placeFinder(grid, reserved, size - 7, 0);
  placeAlignment(grid, reserved, version);
  placeTiming(grid, reserved);
  reserveFormatAreas(grid, reserved, version);
  placeData(grid, reserved, codewords);

  return { grid, reserved, size };
}

export interface QrOptions {
  ecc?: QrEccLevel;
  /** Force a minimum version so a logo knockout stays inside error-correction headroom. */
  minVersion?: number;
  /** Pin the mask pattern (0-7) instead of picking the lowest-penalty one. Used by tests. */
  mask?: number;
}

/** Encode `text` into a QR module matrix. Throws only if the payload exceeds version 10. */
export function encodeQrMatrix(text: string, options: QrOptions = {}): QrMatrix {
  const ecc = options.ecc ?? 'H';
  const bytes = utf8Bytes(text);
  const version = pickVersion(bytes.length, ecc, options.minVersion ?? 1);
  const codewords = buildCodewords(bytes, version, ecc);
  const { grid, reserved, size } = buildBaseGrid(version, codewords);

  let best: { mask: number; modules: boolean[][] } | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  const candidateMasks =
    options.mask === undefined ? [0, 1, 2, 3, 4, 5, 6, 7] : [Math.max(0, Math.min(7, options.mask))];

  for (const mask of candidateMasks) {
    const candidate: Grid = grid.map((row, r) =>
      row.map((value, c) => {
        const bit = value ?? 0;
        return reserved[r][c] ? bit : bit ^ (maskBit(mask, r, c) ? 1 : 0);
      }),
    );
    applyFormatInfo(candidate, ecc, mask);
    applyVersionInfo(candidate, version);
    const score = penaltyScore(candidate);
    if (score < bestScore) {
      bestScore = score;
      best = {
        mask,
        modules: candidate.map((row) => row.map((value) => value === 1)),
      };
    }
  }

  return { size, modules: best!.modules, version, ecc };
}

/**
 * Encode with graceful degradation: try the requested ECC level, then step down
 * until the payload fits. Returns `null` instead of throwing so a card can fall
 * back to its printed short-link cue rather than crashing the page.
 */
export function encodeQrMatrixBestFit(text: string, preferred: QrEccLevel = 'H'): QrMatrix | null {
  const order: QrEccLevel[] = ['H', 'Q', 'M', 'L'];
  const startAt = Math.max(0, order.indexOf(preferred));
  for (let i = startAt; i < order.length; i += 1) {
    try {
      return encodeQrMatrix(text, { ecc: order[i] });
    } catch {
      // Payload too large at this level — try the next-lower correction level.
    }
  }
  return null;
}

/** True when the module sits inside one of the three finder-eye squares. */
export function isFinderModule(size: number, row: number, col: number): boolean {
  const inBox = (r0: number, c0: number) => row >= r0 && row < r0 + 7 && col >= c0 && col < c0 + 7;
  return inBox(0, 0) || inBox(0, size - 7) || inBox(size - 7, 0);
}
