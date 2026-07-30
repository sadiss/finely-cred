/**
 * ThinBookletEngine — composite cover + 2 full-height rear pages into a thin magazine booklet.
 * Geometry from plan premium_mockup_pipeline (spine 2.5–4% H, pages ≥96% H, peek 12–18% W).
 */
import sharp from 'sharp';
import { GEOMETRY, clampGeometry } from './geometry.mjs';

async function asPngBuffer(src) {
  if (Buffer.isBuffer(src)) return sharp(src).ensureAlpha().png().toBuffer();
  return sharp(src).ensureAlpha().png().toBuffer();
}

async function metaOf(buf) {
  return sharp(buf).metadata();
}

function rotatedBBox(w, h, deg) {
  const r = (Math.abs(deg) * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return {
    w: Math.ceil(Math.abs(w * cos) + Math.abs(h * sin)),
    h: Math.ceil(Math.abs(w * sin) + Math.abs(h * cos)),
  };
}

/** Thin spine strip (magazine depth) — subtle gold-edge dark gradient. */
async function makeSpine(spineW, H, { navy = false } = {}) {
  const c0 = navy ? '#08141e' : '#060807';
  const c1 = navy ? '#12263a' : '#121614';
  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${spineW}" height="${H}" viewBox="0 0 ${spineW} ${H}">
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#c9a227" stop-opacity="0.35"/>
      <stop offset="18%" stop-color="${c0}"/>
      <stop offset="82%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="#e8c96a" stop-opacity="0.28"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#s)"/>
</svg>`);
  return sharp(svg).ensureAlpha().png().toBuffer();
}

/** Soft elliptical contact shadow (true RGBA) via SVG + blur. */
async function buildContactShadow(productW, productH, g) {
  const expandBottom = Math.max(24, Math.round(productH * g.shadowExpandBottomFrac));
  const expandX = Math.max(12, Math.round(productW * g.shadowExpandXFrac));
  const outW = productW + expandX * 2;
  const outH = productH + expandBottom;
  const cx = outW / 2;
  const cy = productH - Math.round(productH * 0.01);
  const rx = productW * g.shadowRxFracOfW;
  const ry = Math.max(16, expandBottom * g.shadowRyFracOfExpand);
  const opacity = g.shadowOpacity;
  const sigma = Math.max(4, (g.shadowBlurPxAt1600 * productH) / 1600 / 2);

  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${outW}" height="${outH}" viewBox="0 0 ${outW} ${outH}">
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="rgb(6,8,10)" fill-opacity="${opacity}"/>
</svg>`);
  const blurred = await sharp(svg)
    .ensureAlpha()
    .blur(sigma)
    .png()
    .toBuffer();

  return { shadowPng: blurred, outW, outH, expandX, expandBottom };
}

async function trimAlpha(pngBuf, pad = 2) {
  try {
    const trimmed = await sharp(pngBuf)
      .trim({ threshold: 8 })
      .ensureAlpha()
      .png()
      .toBuffer();
    if (pad <= 0) return trimmed;
    const meta = await metaOf(trimmed);
    const outW = meta.width + pad * 2;
    const outH = meta.height + pad * 2;
    return sharp({
      create: {
        width: outW,
        height: outH,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: trimmed, left: pad, top: pad }])
      .png()
      .toBuffer();
  } catch {
    throw new Error('ThinBookletEngine: empty composite (no opaque pixels)');
  }
}

async function padTransparent(pngBuf, marginFrac) {
  const meta = await metaOf(pngBuf);
  const padX = Math.max(4, Math.round(meta.width * marginFrac));
  const padY = Math.max(4, Math.round(meta.height * marginFrac));
  const outW = meta.width + padX * 2;
  const outH = meta.height + padY * 2;
  return sharp({
    create: {
      width: outW,
      height: outH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: pngBuf, left: padX, top: padY }])
    .png({ compressionLevel: 9, force: true })
    .toBuffer();
}

/**
 * @typedef {object} ThinBookletComposeOptions
 * @property {string|Buffer} cover - Flat cover art (PNG/SVG buffer or path)
 * @property {[string|Buffer, string|Buffer]} pages - [page nearer cover, page further back]
 * @property {number} [coverHeight=1600]
 * @property {string} [outPath] - optional write path
 * @property {boolean} [navySpine=false] - Debt navy spine tint
 * @property {Partial<typeof GEOMETRY>} [geometry]
 * @property {number} [yawDeg] - override yaw
 * @property {number} [spineDepth] - override spine as fraction of H
 * @property {number} [pageHeightRatio]
 * @property {number} [peekWidthRatio]
 * @property {number} [marginRatio]
 */

export class ThinBookletEngine {
  /**
   * @param {Partial<typeof GEOMETRY>} [geometryOverrides]
   */
  constructor(geometryOverrides = {}) {
    this.geometry = clampGeometry(geometryOverrides);
  }

  /**
   * Composite cover + 2 rear pages → thin booklet PNG buffer (true RGBA).
   * @param {ThinBookletComposeOptions} opts
   */
  async compose(opts) {
    const g = clampGeometry({ ...this.geometry, ...(opts.geometry || {}) });
    const coverHeight = opts.coverHeight ?? g.defaultCoverHeight;
    const yaw = opts.yawDeg ?? g.yawDefaultDeg;
    const spineDepth = opts.spineDepth ?? g.spineDepthDefault;
    const pageHeightRatio = opts.pageHeightRatio ?? g.pageHeightDefault;
    const peekWidthRatio = opts.peekWidthRatio ?? g.peekWidthDefault;
    const marginRatio = opts.marginRatio ?? g.marginDefault;

    if (!opts.cover) throw new Error('ThinBookletEngine.compose: cover required');
    if (!opts.pages || opts.pages.length < 2) {
      throw new Error('ThinBookletEngine.compose: pages[2] required (full-height rear spreads)');
    }

    const coverSrc = await asPngBuffer(opts.cover);
    const coverResized = await sharp(coverSrc)
      .resize({ height: coverHeight, fit: 'inside', kernel: sharp.kernel.lanczos3 })
      .ensureAlpha()
      .png()
      .toBuffer();
    const coverMeta = await metaOf(coverResized);
    const W = coverMeta.width;
    const H = coverMeta.height;

    const spineW = Math.max(3, Math.round(H * spineDepth));
    if (spineW / H > g.spineDepthMax + 0.001) {
      throw new Error(`Spine depth ${(spineW / H).toFixed(3)} exceeds max ${g.spineDepthMax}`);
    }

    const pageH = Math.max(1, Math.round(H * pageHeightRatio));
    if (pageH / H < g.pageHeightMin - 0.001) {
      throw new Error(`Page height ratio ${(pageH / H).toFixed(3)} below min ${g.pageHeightMin}`);
    }
    const pageW = W;
    const peek = Math.round(W * peekWidthRatio);

    const spine = await makeSpine(spineW, H, { navy: Boolean(opts.navySpine) });
    const coverWithSpine = await sharp({
      create: {
        width: spineW + W,
        height: H,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: spine, left: 0, top: 0 },
        { input: coverResized, left: spineW, top: 0 },
      ])
      .png()
      .toBuffer();

    const pageBufs = [];
    for (let i = 0; i < 2; i++) {
      const raw = await asPngBuffer(opts.pages[i]);
      const resized = await sharp(raw)
        .resize(pageW, pageH, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
        .ensureAlpha()
        .png()
        .toBuffer();
      pageBufs.push(resized);
    }

    // Unrotated layout: cover at origin; pages peek to the right; bottoms near-aligned.
    const coverRight = spineW + W;
    const page1Left = coverRight + peek - pageW + Math.round(W * g.page1RightExtra);
    const page2Left = coverRight + peek - pageW + Math.round(W * g.page2RightExtra);
    const page1Top = Math.round((H - pageH) / 2 - H * g.page1UpExtra);
    const page2Top = Math.round((H - pageH) / 2 - H * g.page2UpExtra);

    const layoutMinX = Math.min(0, page1Left, page2Left);
    const layoutMaxX = Math.max(coverRight, page1Left + pageW, page2Left + pageW);
    const layoutMinY = Math.min(0, page1Top, page2Top);
    const layoutMaxY = Math.max(H, page1Top + pageH, page2Top + pageH);
    const baseW = layoutMaxX - layoutMinX;
    const baseH = layoutMaxY - layoutMinY;
    const ox = -layoutMinX;
    const oy = -layoutMinY;

    // Soft separation shadow between page layers (drawn under each page)
    const sepW = Math.max(8, Math.round(W * 0.02));
    const sepPng = await sharp(
      Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${sepW}" height="${pageH}">
  <defs>
    <linearGradient id="sep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="rgb(20,18,16)" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="rgb(20,18,16)" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#sep)"/>
</svg>`),
    )
      .ensureAlpha()
      .png()
      .toBuffer();

    let product;
    if (opts.layeredYaw) {
      product = await this.#composeLayeredYaw({
        coverWithSpine,
        pageBufs,
        spineW,
        W,
        H,
        pageW,
        pageH,
        peek,
        yaw,
        g,
        sepPng,
      });
    } else {
      const stack = await sharp({
        create: {
          width: baseW,
          height: baseH,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([
          // furthest page first
          { input: pageBufs[1], left: ox + page2Left, top: oy + page2Top },
          { input: sepPng, left: ox + page2Left - Math.floor(sepW * 0.35), top: oy + page2Top },
          { input: pageBufs[0], left: ox + page1Left, top: oy + page1Top },
          { input: sepPng, left: ox + page1Left - Math.floor(sepW * 0.35), top: oy + page1Top },
          { input: coverWithSpine, left: ox, top: oy },
        ])
        .png()
        .toBuffer();

      const rotated = await sharp(stack)
        .rotate(yaw, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .ensureAlpha()
        .png()
        .toBuffer();

      product = await trimAlpha(rotated, 2);
    }

    const pMeta = await metaOf(product);
    const { shadowPng, outW, outH, expandX } = await buildContactShadow(pMeta.width, pMeta.height, g);

    const withShadow = await sharp({
      create: {
        width: outW,
        height: outH,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: shadowPng, left: 0, top: 0 },
        { input: product, left: expandX, top: 0 },
      ])
      .png({ compressionLevel: 9, force: true })
      .toBuffer();

    // Tight transparent margins (3–5%)
    const finalBuf = await padTransparent(withShadow, marginRatio);

    if (opts.outPath) {
      await sharp(finalBuf).png({ compressionLevel: 9, force: true }).toFile(opts.outPath);
    }

    const finalMeta = await metaOf(finalBuf);
    return {
      buffer: finalBuf,
      width: finalMeta.width,
      height: finalMeta.height,
      metrics: {
        coverW: W,
        coverH: H,
        spineW,
        spineDepthFrac: spineW / H,
        pageH,
        pageHeightFrac: pageH / H,
        peek,
        peekFrac: peek / W,
        yawDeg: yaw,
        marginRatio,
      },
      outPath: opts.outPath || null,
    };
  }

  async #composeLayeredYaw({
    coverWithSpine,
    pageBufs,
    spineW,
    W,
    H,
    pageW,
    pageH,
    peek,
    yaw,
    g,
    sepPng,
  }) {
    const yawCover = yaw;
    const yaw1 = yaw + g.page1YawBiasDeg;
    const yaw2 = yaw + g.page2YawBiasDeg;

    const [coverR, page1R, page2R, sepR] = await Promise.all([
      sharp(coverWithSpine).rotate(yawCover, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
      sharp(pageBufs[0]).rotate(yaw1, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
      sharp(pageBufs[1]).rotate(yaw2, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
      sharp(sepPng).rotate(yaw1, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
    ]);

    const cMeta = await metaOf(coverR);
    const p1Meta = await metaOf(page1R);
    const p2Meta = await metaOf(page2R);

    const coverBox = rotatedBBox(spineW + W, H, yawCover);
    const peekPx = peek + Math.round(W * g.page2RightExtra);
    const canvasW = coverBox.w + peekPx + Math.round(W * 0.08);
    const canvasH = Math.max(coverBox.h, p1Meta.height, p2Meta.height) + Math.round(H * 0.08);

    const coverLeft = Math.round(W * 0.04);
    const coverTop = Math.round(H * 0.04);
    const page1Left = coverLeft + Math.round(cMeta.width * 0.55);
    const page2Left = coverLeft + Math.round(cMeta.width * 0.62);
    const page1Top = coverTop - Math.round(H * g.page1UpExtra);
    const page2Top = coverTop - Math.round(H * g.page2UpExtra);

    const layered = await sharp({
      create: {
        width: canvasW + Math.max(p1Meta.width, p2Meta.width),
        height: canvasH + Math.round(H * 0.06),
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: page2R, left: page2Left, top: Math.max(0, page2Top) },
        { input: page1R, left: page1Left, top: Math.max(0, page1Top) },
        { input: sepR, left: page1Left - 4, top: Math.max(0, page1Top) },
        { input: coverR, left: coverLeft, top: coverTop },
      ])
      .png()
      .toBuffer();

    return trimAlpha(layered, 2);
  }
}

/** Convenience: one-shot compose with default engine. */
export async function composeThinBooklet(opts) {
  const engine = new ThinBookletEngine(opts.geometry || {});
  return engine.compose(opts);
}

export { GEOMETRY };
