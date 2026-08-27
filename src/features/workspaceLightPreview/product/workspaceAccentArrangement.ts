/**
 * Accent arrangement engine.
 *
 * The brand rule forbids placing two same-family accents next to each other, but "next to" has
 * three meanings that were previously unhandled, and all three produced the flat, monochrome look
 * the product layer was criticised for:
 *
 *   1. NESTING     — a violet panel whose children are also violet reads as one washed-out block.
 *   2. STACKING    — two same-accent panels stacked vertically look like a rendering bug.
 *   3. REPETITION  — a list that hardcodes one accent for every row has no rhythm at all.
 *
 * Callers previously wrote `accent: 'violet'` inside a `<ProductPanel accent="violet">`, which hits
 * all three. These helpers pick accents positionally instead, so colour rotates by construction
 * rather than by whoever edits the file remembering to alternate.
 */
import type { WorkspaceProductAccent } from './workspaceProductTokens';

/** Rotation order. Deliberately excludes `graphite`, which is a neutral bed, not an accent turn. */
export const ACCENT_ROTATION: WorkspaceProductAccent[] = ['emerald', 'violet', 'sky', 'rose'];

/**
 * Families that read as "the same colour" at a glance even though the tokens differ.
 * Sky and graphite both go cool-dark on a navy bed, so they are treated as clashing neighbours.
 */
const FAMILY: Record<WorkspaceProductAccent, string> = {
  emerald: 'green',
  violet: 'purple',
  sky: 'blue',
  rose: 'red',
  graphite: 'neutral',
};

export function isSameAccentFamily(
  a: WorkspaceProductAccent | undefined,
  b: WorkspaceProductAccent | undefined,
): boolean {
  if (!a || !b) return false;
  return FAMILY[a] === FAMILY[b];
}

export type AccentArrangementOptions = {
  /**
   * The accent of the containing panel/section. Children never inherit it, which is what stops the
   * "purple box on a purple box" nesting problem.
   */
  parent?: WorkspaceProductAccent;
  /** Grid width, so the engine can avoid a clash with the tile directly above as well as the left. */
  columns?: number;
  /** Shifts the whole sequence, so two sibling lists on one page do not open with the same colour. */
  offset?: number;
  /** Accents this particular surface should never use (e.g. a service line reserving its lead hue). */
  exclude?: WorkspaceProductAccent[];
};

/**
 * Choose accents for `count` items so that no item clashes with its left neighbour, the item
 * directly above it in the grid, or the parent container.
 */
export function arrangeAccents(
  count: number,
  options: AccentArrangementOptions = {},
): WorkspaceProductAccent[] {
  const { parent, columns = 1, offset = 0, exclude = [] } = options;

  const pool = ACCENT_ROTATION.filter(
    (accent) =>
      !exclude.some((banned) => isSameAccentFamily(accent, banned)) &&
      !isSameAccentFamily(accent, parent),
  );

  // Every candidate was excluded — fall back to the plain rotation rather than rendering nothing.
  const candidates = pool.length > 0 ? pool : ACCENT_ROTATION;

  const result: WorkspaceProductAccent[] = [];
  for (let index = 0; index < count; index += 1) {
    const left = index % columns === 0 ? undefined : result[index - 1];
    const above = index >= columns ? result[index - columns] : undefined;

    const start = (index + offset) % candidates.length;
    let chosen = candidates[start];
    for (let step = 0; step < candidates.length; step += 1) {
      const candidate = candidates[(start + step) % candidates.length];
      if (!isSameAccentFamily(candidate, left) && !isSameAccentFamily(candidate, above)) {
        chosen = candidate;
        break;
      }
    }
    result.push(chosen);
  }

  return result;
}

/**
 * Single-item convenience for `.map()` callbacks that cannot precompute the whole run.
 * Prefer `arrangeAccents` when the count is known, since it can also avoid vertical clashes.
 */
export function accentAt(
  index: number,
  options: AccentArrangementOptions = {},
): WorkspaceProductAccent {
  const { parent, offset = 0, exclude = [] } = options;
  const pool = ACCENT_ROTATION.filter(
    (accent) =>
      !exclude.some((banned) => isSameAccentFamily(accent, banned)) &&
      !isSameAccentFamily(accent, parent),
  );
  const candidates = pool.length > 0 ? pool : ACCENT_ROTATION;
  return candidates[(index + offset) % candidates.length];
}

/**
 * Lightness cadence for a row of sibling tiles.
 *
 * Rotating hue alone was not enough: four deep-fill tiles in a row still read as "the same
 * colour arrangement" because they share a value. Distinct features should be distinguishable
 * at a glance, so tiles alternate BED as well as accent — light, dark, light, dark. The dark
 * tiles keep the jewel/lacquer weight; the light tiles let the accent read as a tint, which is
 * what makes a row feel composed rather than like one painted block.
 *
 * `startDark` flips the phase so two adjacent sections do not open on the same value.
 */
export function bedAt(index: number, startDark = false): 'light' | 'dark' {
  const even = index % 2 === 0;
  return even === startDark ? 'dark' : 'light';
}

/** Row-level convenience: the light/dark cadence for `count` tiles. */
export function arrangeBeds(count: number, startDark = false): ('light' | 'dark')[] {
  return Array.from({ length: count }, (_, index) => bedAt(index, startDark));
}

/**
 * Pick an accent for a nested element that must differ from its container — used for a single
 * callout or badge inside an accented panel, where there is no index to rotate on.
 */
export function contrastingAccent(
  parent: WorkspaceProductAccent | undefined,
  preferred?: WorkspaceProductAccent,
): WorkspaceProductAccent {
  if (preferred && !isSameAccentFamily(preferred, parent)) return preferred;
  return ACCENT_ROTATION.find((accent) => !isSameAccentFamily(accent, parent)) ?? 'emerald';
}

/**
 * Development guard. Returns the positions where a rendered sequence breaks the adjacency rule, so
 * tests can assert an arrangement rather than relying on visual review.
 */
/** Inline surfaces for intelligence callouts that must contrast with a parent panel accent. */
export function intelligenceSurfaceStyles(accent: WorkspaceProductAccent): {
  root: { borderColor: string; background: string };
  icon: { background: string };
} {
  const surfaces: Record<
    WorkspaceProductAccent,
    { borderColor: string; background: string; iconBackground: string }
  > = {
    emerald: {
      borderColor: 'rgba(8, 116, 90, 0.2)',
      background: '#dcf1e9',
      iconBackground: '#08745a',
    },
    violet: {
      borderColor: 'rgba(117, 76, 211, 0.18)',
      background: '#eee9fb',
      iconBackground: '#6537ca',
    },
    sky: {
      borderColor: 'rgba(64, 130, 168, 0.22)',
      background: '#e0f0f7',
      iconBackground: '#064d70',
    },
    rose: {
      borderColor: 'rgba(181, 46, 83, 0.22)',
      background: '#f8e4ea',
      iconBackground: '#aa294e',
    },
    graphite: {
      borderColor: 'rgba(30, 40, 55, 0.24)',
      background: '#edf1f6',
      iconBackground: '#202936',
    },
  };
  const surface = surfaces[accent];
  return {
    root: { borderColor: surface.borderColor, background: surface.background },
    icon: { background: surface.iconBackground },
  };
}

export function accentBrightVar(accent: WorkspaceProductAccent): string {
  return `var(--wlp-${accent}-bright)`;
}

export function findAccentClashes(
  accents: (WorkspaceProductAccent | undefined)[],
  options: { columns?: number; parent?: WorkspaceProductAccent } = {},
): string[] {
  const { columns = 1, parent } = options;
  const problems: string[] = [];

  accents.forEach((accent, index) => {
    if (!accent) return;
    if (isSameAccentFamily(accent, parent)) {
      problems.push(`index ${index} (${accent}) matches its parent container`);
    }
    const left = index % columns === 0 ? undefined : accents[index - 1];
    if (isSameAccentFamily(accent, left)) {
      problems.push(`index ${index} (${accent}) clashes with the tile to its left`);
    }
    const above = index >= columns ? accents[index - columns] : undefined;
    if (isSameAccentFamily(accent, above)) {
      problems.push(`index ${index} (${accent}) clashes with the tile above it`);
    }
  });

  return problems;
}
