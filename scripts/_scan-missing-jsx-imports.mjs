import fs from 'fs';
import path from 'path';

/** Focused scan: PascalCase JSX tags that are neither imported nor locally declared. */
const TYPE_LIKE = new Set([
  'Record',
  'Partial',
  'Required',
  'Pick',
  'Omit',
  'Exclude',
  'Extract',
  'NonNullable',
  'ReturnType',
  'Parameters',
  'Awaited',
  'Promise',
  'Array',
  'ReadonlyArray',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'Readonly',
  'ReadonlyMap',
  'ReadonlySet',
  'Capitalize',
  'Uncapitalize',
  'Uppercase',
  'Lowercase',
  'InstanceType',
  'ThisType',
  'ConstructorParameters',
  'T',
  'K',
  'V',
  'U',
  'P',
  'R',
  'E',
  'S',
  'A',
  'B',
  'C',
  'D',
  'F',
  'G',
  'H',
  'I',
  'J',
  'L',
  'M',
  'N',
  'O',
  'Q',
  'W',
  'X',
  'Y',
  'Z',
]);

const COMMON_LOCAL = new Set([
  'Icon',
  'Tag',
  'Step',
  'Store',
  'Goal',
  'Track',
  'File',
  'Blob',
  'Image',
  'Audio',
  'Video',
  'Fragment',
  'Suspense',
  'StrictMode',
  'Profiler',
  'React',
  'ReactDOM',
]);

const roots = [
  'src/App.tsx',
  'src/components/landing',
  'src/components/pricing',
  'src/components/portal',
  'src/components/leadmagnet',
  'src/components/tradelines',
  'src/components/careers',
  'src/components/partner',
  'src/components/letters',
  'src/components/navigation',
  'src/features/os',
  'src/features/partner',
  'src/pages/PricingPage.tsx',
  'src/pages/PricingServicePage.tsx',
  'src/pages/PersonalCreditPage.tsx',
  'src/pages/portal',
  'src/pages/leadmagnet',
  'src/pages/au',
  'src/auth',
];

function walk(p, acc = []) {
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    for (const name of fs.readdirSync(p)) {
      if (name.startsWith('.')) continue;
      walk(path.join(p, name), acc);
    }
  } else if (p.endsWith('.tsx')) acc.push(p);
  return acc;
}

const files = [];
for (const r of roots) {
  if (!fs.existsSync(r)) continue;
  walk(r, files);
}

const issues = [];
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const withoutTypes = src
    .replace(/:\s*[^=;,)}\n]+/g, '')
    .replace(/as\s+[A-Za-z0-9_<>,\s|&\[\].]+/g, '');

  const importNames = new Set();
  for (const m of src.matchAll(
    /import\s+(?:type\s+)?(?:(\w+)|\{([^}]+)\}|\*\s+as\s+(\w+))\s+from\s+['"][^'"]+['"]/g,
  )) {
    if (m[1]) importNames.add(m[1]);
    if (m[3]) importNames.add(m[3]);
    if (m[2]) {
      for (const part of m[2].split(',')) {
        const cleaned = part.replace(/\btype\b/g, '').trim();
        if (!cleaned) continue;
        const asMatch = cleaned.match(/(\w+)\s+as\s+(\w+)/);
        const name = asMatch ? asMatch[2] : cleaned.split(/\s+/)[0];
        if (name) importNames.add(name);
      }
    }
  }

  const decl = new Set();
  for (const m of src.matchAll(/\b(?:function|class|const|let|var)\s+([A-Z][A-Za-z0-9_]*)/g)) {
    decl.add(m[1]);
  }

  // Only count real JSX open tags: <Name followed by space, >, or /
  // Ignore generics by requiring preceding char is not letter/digit/comma/</|
  const used = new Set();
  for (let i = 0; i < withoutTypes.length; i++) {
    if (withoutTypes[i] !== '<') continue;
    const prev = withoutTypes[i - 1] || ' ';
    if (/[A-Za-z0-9_,|?<]/.test(prev)) continue; // likely generic
    const rest = withoutTypes.slice(i + 1);
    const m = rest.match(/^([A-Z][A-Za-z0-9_]*)(\s|\/|>)/);
    if (!m) continue;
    used.add(m[1]);
  }

  for (const name of used) {
    if (name.startsWith('HTML') || name.startsWith('SVG')) continue;
    if (TYPE_LIKE.has(name) || COMMON_LOCAL.has(name)) continue;
    if (name.endsWith('Tab') || name.endsWith('Props') || name.endsWith('Type')) continue;
    if (name.endsWith('Key') || name.endsWith('Id') || name.endsWith('Mode')) continue;
    if (name.endsWith('Tone') || name.endsWith('Lane') || name.endsWith('View')) continue;
    if (decl.has(name) || importNames.has(name)) continue;
    // Component-like names only (contain lowercase letter somewhere after start, or long)
    if (!/[a-z]/.test(name.slice(1)) && name.length < 4) continue;
    issues.push({ file, name });
  }
}

console.log('FILES', files.length);
console.log('ISSUES', issues.length);
for (const i of issues) console.log(`${i.file} :: <${i.name}>`);
