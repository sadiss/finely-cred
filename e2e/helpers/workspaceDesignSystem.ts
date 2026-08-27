import { expect, type Page } from '@playwright/test';

/** Cold navigations compile chunks on first request — dashboards are the heaviest adapters. */
export const WLP_PREVIEW_TIMEOUT = 180_000;
export const WLP_NAV_TIMEOUT = 120_000;
export const WLP_PAINT_TIMEOUT = 45_000;

export type WorkspaceArchetype =
  | 'focus'
  | 'pipeline'
  | 'journey'
  | 'ledger'
  | 'matrix'
  | 'feed';

/** Representative partner preview pages — mirrors `PARTNER_ARCHETYPE_BY_PAGE` in workspaceProductArchetypes.ts */
export const ARCHETYPE_SAMPLES: Array<{
  archetype: WorkspaceArchetype;
  pageId: string;
  path: string;
}> = [
  { archetype: 'focus', pageId: 'reports', path: '/preview/workspace-light/portal/reports' },
  { archetype: 'pipeline', pageId: 'projects', path: '/preview/workspace-light/portal/projects' },
  { archetype: 'journey', pageId: 'build', path: '/preview/workspace-light/portal/build' },
  { archetype: 'ledger', pageId: 'documents', path: '/preview/workspace-light/portal/documents' },
  { archetype: 'matrix', pageId: 'billing', path: '/preview/workspace-light/portal/billing' },
  { archetype: 'feed', pageId: 'messages', path: '/preview/workspace-light/portal/messages' },
];

/**
 * Stable structural hooks per archetype — body layout when wired, header insight as interim signal.
 * See `ProductHubScaffold` `ArchetypeHeaderInsight` and archetype layout components.
 */
export const ARCHETYPE_STRUCTURE: Record<WorkspaceArchetype, { selectors: string[]; minLanes?: number }> = {
  focus: { selectors: ['.fc-wlp-arch-focus', '.fc-wlp-arch-header-focus-title'] },
  pipeline: { selectors: ['.fc-wlp-arch-pipeline', '.fc-wlp-arch-header-strip'], minLanes: 2 },
  journey: { selectors: ['.fc-wlp-arch-journey', '.fc-wlp-arch-header-spine'] },
  ledger: { selectors: ['.fc-wlp-arch-ledger', '.fc-wlp-arch-header-dense'] },
  matrix: { selectors: ['.fc-wlp-arch-matrix', '.fc-wlp-arch-header-compare'] },
  feed: { selectors: ['.fc-wlp-arch-feed', '.fc-wlp-arch-header-live'] },
};

const MAIN_REGION_SELECTOR = '.fc-wlp-main, .fc-wlp-content';

export const ACCENT_SCAN_PAGES = [
  '/preview/workspace-light/admin/dashboard',
  '/preview/workspace-light/portal/dashboard',
  '/preview/workspace-light/admin/workflow',
  '/preview/workspace-light/admin/partners',
  '/preview/workspace-light/admin/marketing',
  '/preview/workspace-light/portal/projects',
  '/preview/workspace-light/portal/reports',
  '/preview/workspace-light/portal/messages',
  '/preview/workspace-light/portal/billing',
  '/preview/workspace-light/portal/build',
];

/**
 * Readability is scanned on more pages than accent arrangement.
 *
 * The restore, vault, and letter surfaces build their own cards instead of `finelyOsCatalogCard`,
 * so they miss the light-surface overrides that recolour the shared white/amber OS text tokens.
 * Every one of them shipped with invisible copy that `ACCENT_SCAN_PAGES` could not see.
 */
export const READABILITY_SCAN_PAGES = [
  ...ACCENT_SCAN_PAGES,
  '/preview/workspace-light/portal/checklist',
  '/preview/workspace-light/portal/evidence',
  '/preview/workspace-light/portal/documents',
  '/preview/workspace-light/portal/letters',
  '/preview/workspace-light/portal/letters-vault',
  '/preview/workspace-light/portal/disputes',
  '/preview/workspace-light/admin/leads',
  '/preview/workspace-light/admin/growth-command',
  '/preview/workspace-light/admin/testimonials',
];

export const ADMIN_PREVIEW = '/preview/workspace-light/admin/dashboard';
export const PARTNER_PREVIEW = '/preview/workspace-light/portal/dashboard';
export const PARTNER_REPORTS_PREVIEW = '/preview/workspace-light/portal/reports';

export async function seedWorkspacePreview(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('fc_wlp_view_mode', 'preview');
    localStorage.setItem('fc_wlp_data_mode', 'demo');
  });
}

export async function openWorkspacePreview(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: WLP_NAV_TIMEOUT });
  await expect(
    page.locator('.fc-wlp-command, .fc-wlp-partner-header, .fc-wlp-product-page').first(),
  ).toBeVisible({ timeout: WLP_PAINT_TIMEOUT });
}

export async function mainRegionHandle(page: Page) {
  const main = page.locator(MAIN_REGION_SELECTOR).first();
  await expect(main).toBeVisible({ timeout: WLP_PAINT_TIMEOUT });
  return main;
}

export function mainRegionLocator(page: Page) {
  return page.locator(MAIN_REGION_SELECTOR).first();
}

export type AccentViolation = {
  kind: 'parent-child' | 'sibling';
  accent: string;
  other: string;
  path: string;
};

export type BannedFillViolation = {
  path: string;
  backgroundColor: string;
  hue: number;
  saturation: number;
};

/**
 * DOM accent audit — parent/child nesting and adjacent sibling clashes inside layout containers.
 * Family-aware (mirrors workspaceAccentArrangement `isSameAccentFamily`).
 */
export async function collectAccentViolations(page: Page): Promise<AccentViolation[]> {
  return page.evaluate(() => {
    const FAMILY: Record<string, string> = {
      emerald: 'green',
      violet: 'purple',
      sky: 'blue',
      rose: 'red',
      graphite: 'neutral',
    };

    function accentFamily(accent: string | null | undefined): string | undefined {
      if (!accent) return undefined;
      return FAMILY[accent] ?? accent;
    }

    function isSameFamily(a: string | null | undefined, b: string | null | undefined): boolean {
      if (!a || !b) return false;
      return accentFamily(a) === accentFamily(b);
    }

    function domPath(el: Element): string {
      const parts: string[] = [];
      let node: Element | null = el;
      while (node && node !== document.body) {
        let part = node.tagName.toLowerCase();
        if (node.id) {
          part += `#${node.id}`;
        } else if (node.classList.length) {
          const cls = [...node.classList]
            .filter((c) => c.startsWith('fc-wlp') || c.startsWith('fcm'))
            .slice(0, 2)
            .join('.');
          if (cls) part += `.${cls}`;
        }
        const accent = node.getAttribute('data-fcm-accent');
        if (accent) part += `[data-fcm-accent=${accent}]`;
        parts.unshift(part);
        node = node.parentElement;
      }
      return parts.join(' > ');
    }

    const decorativeFcmRe = /\bfcm-(depth|grain|corner-wash|specular|pedestal|lacquer|sheen)\b/;

    function isDecorativeAccentNode(el: Element): boolean {
      if (el.getAttribute('aria-hidden') === 'true') return true;
      if (el.tagName === 'SPAN' && decorativeFcmRe.test(el.className)) return true;
      return false;
    }

    function isLayoutContainer(el: Element): boolean {
      const style = window.getComputedStyle(el);
      if (style.display === 'grid' || style.display === 'flex') return true;
      const cls = el.className;
      if (
        typeof cls === 'string' &&
        /fc-wlp-(stack|section|grid|arch-pipeline-lanes|arch-metrics|module-shelf|kpi|panel|metrics|health-lattice|pipeline-bento)/.test(
          cls,
        )
      ) {
        return true;
      }
      return false;
    }

    const root =
      document.querySelector('.fc-wlp-main') ?? document.querySelector('.fc-wlp-content') ?? document.body;
    const violations: AccentViolation[] = [];

    root.querySelectorAll('[data-fcm-accent]').forEach((el) => {
      const accent = el.getAttribute('data-fcm-accent');
      if (!accent || isDecorativeAccentNode(el)) return;

      let parent = el.parentElement;
      while (parent && parent !== root && parent !== document.body) {
        const parentAccent = parent.getAttribute('data-fcm-accent');
        if (parentAccent && isSameFamily(accent, parentAccent)) {
          violations.push({
            kind: 'parent-child',
            accent,
            other: parentAccent,
            path: domPath(el),
          });
        }
        parent = parent.parentElement;
      }
    });

    root.querySelectorAll('*').forEach((parent) => {
      if (!isLayoutContainer(parent)) return;
      const children = [...parent.children];
      for (let index = 1; index < children.length; index += 1) {
        const leftEl = children[index - 1];
        const rightEl = children[index];
        if (isDecorativeAccentNode(leftEl) || isDecorativeAccentNode(rightEl)) continue;
        const left = leftEl.getAttribute('data-fcm-accent');
        const right = rightEl.getAttribute('data-fcm-accent');
        if (left && right && isSameFamily(left, right)) {
          violations.push({
            kind: 'sibling',
            accent: left,
            other: right,
            path: `${domPath(parent)} > adjacent [${left}] | [${right}]`,
          });
        }
      }
    });

    return violations;
  });
}

export async function collectStructuralSignature(page: Page): Promise<string> {
  return page.evaluate(() => {
    function walk(el: Element, depth = 0): string {
      if (depth > 14) return '';
      const tag = el.tagName.toLowerCase();
      const classes = [...el.classList]
        .filter((c) => c.startsWith('fc-wlp-arch-') || c.startsWith('fc-wlp-product'))
        .slice(0, 4)
        .join('.');
      let sig = tag + (classes ? `.${classes}` : '');
      const archetype = el.getAttribute('data-archetype');
      if (archetype) sig += `@${archetype}`;
      const kids = [...el.children]
        .map((child) => walk(child, depth + 1))
        .filter(Boolean);
      return sig + (kids.length ? `{${kids.join('|')}}` : '');
    }

    const main = document.querySelector('.fc-wlp-main');
    const productPage = main?.querySelector('.fc-wlp-product-page') ?? main;
    if (!productPage) return 'missing-main';
    return walk(productPage);
  });
}

export async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow, 'horizontal overflow on page').toBeLessThanOrEqual(1);
}

export async function collectClippedTextElements(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const root =
      document.querySelector('.fc-wlp-main') ?? document.querySelector('.fc-wlp-content');
    if (!root) return ['missing main region (.fc-wlp-main or .fc-wlp-content)'];

    function hasDirectText(el: Element): boolean {
      for (const child of el.childNodes) {
        if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) return true;
      }
      return false;
    }

    const problems: string[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let node = walker.currentNode as Element;

    while (node) {
      if (node.tagName === 'OPTION' || node.tagName === 'OPTGROUP') {
        node = walker.nextNode() as Element;
        continue;
      }

      if (!hasDirectText(node)) {
        node = walker.nextNode() as Element;
        continue;
      }

      const text = node.textContent?.trim() ?? '';
      if (text.length < 2) {
        node = walker.nextNode() as Element;
        continue;
      }

      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        node = walker.nextNode() as Element;
        continue;
      }

      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        const tag = node.tagName.toLowerCase();
        const cls = [...node.classList].filter((c) => c.startsWith('fc-wlp')).slice(0, 2).join('.');
        problems.push(`zero-size text "${text.slice(0, 40)}" on ${tag}${cls ? `.${cls}` : ''}`);
      }

      node = walker.nextNode() as Element;
    }

    return problems;
  });
}

export async function collectBannedBrandFills(page: Page): Promise<BannedFillViolation[]> {
  return page.evaluate(() => {
    function parseRgb(bg: string): { r: number; g: number; b: number; a: number } | null {
      const m = bg.match(/rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
      if (!m) return null;
      return {
        r: Number(m[1]),
        g: Number(m[2]),
        b: Number(m[3]),
        a: m[4] !== undefined ? Number(m[4]) : 1,
      };
    }

    function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
      r /= 255;
      g /= 255;
      b /= 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            break;
          case g:
            h = ((b - r) / d + 2) / 6;
            break;
          default:
            h = ((r - g) / d + 4) / 6;
        }
      }
      return { h: h * 360, s: s * 100, l: l * 100 };
    }

    function domPath(el: Element): string {
      const parts: string[] = [];
      let node: Element | null = el;
      while (node && node !== document.body) {
        let part = node.tagName.toLowerCase();
        if (node.classList.length) {
          const cls = [...node.classList].slice(0, 2).join('.');
          if (cls) part += `.${cls}`;
        }
        parts.unshift(part);
        node = node.parentElement;
      }
      return parts.join(' > ');
    }

    function isBannedFill(el: Element, bg: string): { banned: boolean; h: number; s: number } {
      if (el.classList.contains('pc-restore-btn--gold')) {
        return { banned: false, h: 0, s: 0 };
      }

      const parsed = parseRgb(bg);
      if (!parsed || parsed.a < 0.12) {
        return { banned: false, h: 0, s: 0 };
      }

      const { h, s, l } = rgbToHsl(parsed.r, parsed.g, parsed.b);
      if (s < 22) return { banned: false, h, s };
      if (h >= 118 && h <= 178) return { banned: false, h, s };
      if (h >= 20 && h <= 55 && s >= 28 && l >= 12 && l <= 88) {
        return { banned: true, h, s };
      }
      return { banned: false, h, s };
    }

    const root =
      document.querySelector('.fc-wlp-main') ?? document.querySelector('.fc-wlp-content');
    if (!root) return [];

    const violations: BannedFillViolation[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let node = walker.currentNode as Element;

    while (node) {
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') {
        node = walker.nextNode() as Element;
        continue;
      }

      const rect = node.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) {
        node = walker.nextNode() as Element;
        continue;
      }

      const bg = style.backgroundColor;
      const check = isBannedFill(node, bg);
      if (check.banned) {
        violations.push({
          path: domPath(node),
          backgroundColor: bg,
          hue: check.h,
          saturation: check.s,
        });
      }

      node = walker.nextNode() as Element;
    }

    return violations;
  });
}

export type ContrastFailure = {
  path: string;
  sample: string;
  color: string;
  background: string;
  ratio: number;
  fontSize: number;
};

export type TinyTextViolation = {
  path: string;
  sample: string;
  fontSize: number;
};

/**
 * WCAG contrast audit for the workspace product layer.
 *
 * Guards the `[data-bed]` / `--fcm-ink` contract: a surface that declares a bed must also
 * declare matching ink. When those drift apart you get near-white copy on a light panel,
 * which is invisible but passes typecheck and every structural test. That regression shipped
 * once (a `fcm-lacquer` overlay class applied to a container erased its dark background while
 * the frost text colour survived), so it gets a permanent guard.
 */
export async function collectContrastFailures(page: Page): Promise<ContrastFailure[]> {
  return page.evaluate(() => {
    type Rgb = { r: number; g: number; b: number; a: number };

    function parseColor(input: string): Rgb | null {
      const m = input.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.%]+))?/);
      if (m) {
        let a = 1;
        if (m[4] !== undefined) a = m[4].endsWith('%') ? Number(m[4].slice(0, -1)) / 100 : Number(m[4]);
        return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a };
      }
      const hex = input.match(/^#([0-9a-f]{3,8})$/i);
      if (hex) {
        let h = hex[1];
        if (h.length === 3) h = h.split('').map((c) => c + c).join('');
        if (h.length < 6) return null;
        return {
          r: parseInt(h.slice(0, 2), 16),
          g: parseInt(h.slice(2, 4), 16),
          b: parseInt(h.slice(4, 6), 16),
          a: h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
        };
      }
      return null;
    }

    /** Composite a translucent colour over an already-resolved backdrop. */
    function over(fg: Rgb, bg: Rgb): Rgb {
      const a = fg.a + bg.a * (1 - fg.a);
      if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
      return {
        r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
        g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
        b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
        a,
      };
    }

    /**
     * Gradients cannot be sampled from computed style, so approximate a gradient layer by
     * averaging its colour stops. Good enough to distinguish a dark ramp from a light wash,
     * which is the distinction this audit cares about.
     */
    function averageGradient(image: string): Rgb | null {
      if (!image || image === 'none') return null;
      const tokens = image.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/gi);
      if (!tokens?.length) return null;
      const stops = tokens.map(parseColor).filter((c): c is Rgb => c !== null && c.a > 0.05);
      if (!stops.length) return null;
      const sum = stops.reduce(
        (acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b, a: acc.a + c.a }),
        { r: 0, g: 0, b: 0, a: 0 },
      );
      return {
        r: sum.r / stops.length,
        g: sum.g / stops.length,
        b: sum.b / stops.length,
        a: Math.min(1, sum.a / stops.length),
      };
    }

    /** Walk ancestors compositing every paint layer until fully opaque. */
    function resolveBackground(el: Element): Rgb {
      let acc: Rgb = { r: 0, g: 0, b: 0, a: 0 };
      let node: Element | null = el;
      while (node) {
        const style = window.getComputedStyle(node);
        const gradient = averageGradient(style.backgroundImage);
        const base = parseColor(style.backgroundColor);
        // Paint order within one element: background-color sits under background-image.
        let layer: Rgb | null = null;
        if (base && base.a > 0) layer = base;
        if (gradient) layer = layer ? over(gradient, layer) : gradient;
        if (layer && layer.a > 0) acc = over(acc, layer);
        if (acc.a >= 0.99) return acc;
        node = node.parentElement;
      }
      return over(acc, { r: 255, g: 255, b: 255, a: 1 });
    }

    function channel(v: number): number {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    }

    function luminance(c: Rgb): number {
      return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
    }

    function contrast(a: Rgb, b: Rgb): number {
      const la = luminance(a);
      const lb = luminance(b);
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    }

    function domPath(el: Element): string {
      const parts: string[] = [];
      let node: Element | null = el;
      while (node && node !== document.body) {
        let part = node.tagName.toLowerCase();
        const cls = [...node.classList].filter((c) => c.startsWith('fc-wlp') || c.startsWith('fcm')).slice(0, 2);
        if (cls.length) part += `.${cls.join('.')}`;
        const bed = node.getAttribute('data-bed');
        if (bed) part += `[data-bed=${bed}]`;
        parts.unshift(part);
        node = node.parentElement;
      }
      return parts.slice(-5).join(' > ');
    }

    function hasDirectText(el: Element): boolean {
      for (const child of el.childNodes) {
        if (child.nodeType === Node.TEXT_NODE && (child.textContent?.trim().length ?? 0) > 1) return true;
      }
      return false;
    }

    const root = document.querySelector('.fc-wlp-main') ?? document.querySelector('.fc-wlp-content');
    if (!root) return [];

    const failures: ContrastFailure[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let node = walker.currentNode as Element | null;

    while (node) {
      if (!hasDirectText(node)) {
        node = walker.nextNode() as Element | null;
        continue;
      }

      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < 0.15) {
        node = walker.nextNode() as Element | null;
        continue;
      }
      // Foil type paints through background-clip, so its computed colour is transparent.
      if (style.webkitTextFillColor === 'transparent' || node.classList.contains('fcm-foil')) {
        node = walker.nextNode() as Element | null;
        continue;
      }

      const rect = node.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) {
        node = walker.nextNode() as Element | null;
        continue;
      }

      const fg = parseColor(style.color);
      if (!fg || fg.a < 0.15) {
        node = walker.nextNode() as Element | null;
        continue;
      }

      const bg = resolveBackground(node);
      const effective = over(fg, bg);
      const ratio = contrast(effective, bg);

      const fontSize = parseFloat(style.fontSize) || 0;
      const weight = Number(style.fontWeight) || 400;
      const isLarge = fontSize >= 24 || (fontSize >= 18.66 && weight >= 700);
      const threshold = isLarge ? 3 : 4.5;

      if (ratio < threshold) {
        failures.push({
          path: domPath(node),
          sample: (node.textContent ?? '').trim().slice(0, 48),
          color: style.color,
          background: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
          ratio: Math.round(ratio * 100) / 100,
          fontSize,
        });
      }

      node = walker.nextNode() as Element | null;
    }

    return failures;
  });
}

/** Enforces the 12px minimum type floor across the product layer. */
export async function collectTinyText(page: Page, floorPx = 12): Promise<TinyTextViolation[]> {
  return page.evaluate((floor) => {
    // Deliberate miniature type: the credit-card face and the printed-report mock both rely on
    // sub-12px text for their physical-object illusion.
    const EXEMPT = /fc-wlp-card__|fc-wlp-source-/;

    function hasDirectText(el: Element): boolean {
      for (const child of el.childNodes) {
        if (child.nodeType === Node.TEXT_NODE && (child.textContent?.trim().length ?? 0) > 1) return true;
      }
      return false;
    }

    function domPath(el: Element): string {
      const parts: string[] = [];
      let node: Element | null = el;
      while (node && node !== document.body) {
        let part = node.tagName.toLowerCase();
        const cls = [...node.classList].filter((c) => c.startsWith('fc-wl')).slice(0, 2);
        if (cls.length) part += `.${cls.join('.')}`;
        parts.unshift(part);
        node = node.parentElement;
      }
      return parts.slice(-4).join(' > ');
    }

    const root = document.querySelector('.fc-wlp-main') ?? document.querySelector('.fc-wlp-content');
    if (!root) return [];

    const violations: TinyTextViolation[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let node = walker.currentNode as Element | null;

    while (node) {
      if (!hasDirectText(node) || EXEMPT.test(node.className?.toString?.() ?? '')) {
        node = walker.nextNode() as Element | null;
        continue;
      }
      if (node.closest('[class*="fc-wlp-card__"], [class*="fc-wlp-source-"]')) {
        node = walker.nextNode() as Element | null;
        continue;
      }

      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') {
        node = walker.nextNode() as Element | null;
        continue;
      }

      const fontSize = parseFloat(style.fontSize) || 0;
      if (fontSize > 0 && fontSize < floor) {
        violations.push({
          path: domPath(node),
          sample: (node.textContent ?? '').trim().slice(0, 40),
          fontSize,
        });
      }

      node = walker.nextNode() as Element | null;
    }

    return violations;
  }, floorPx);
}

export function formatViolationList<T extends { path: string }>(
  label: string,
  violations: T[],
  formatter: (v: T) => string,
): string {
  if (!violations.length) return '';
  const lines = violations.slice(0, 25).map((v) => `  • ${formatter(v)}`);
  const more = violations.length > 25 ? `\n  … and ${violations.length - 25} more` : '';
  return `${label} (${violations.length}):\n${lines.join('\n')}${more}`;
}
