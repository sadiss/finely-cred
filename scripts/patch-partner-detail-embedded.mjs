/**
 * Teaches PartnerDetailPage.tsx to render inside the product workspace shell.
 *
 * `/admin/partners/:id` now resolves through the graduated admin surface, which already
 * supplies the app chrome. Without an `embedded` mode the legacy page stacks its own
 * `PageShell` (admin rail + nav bar) inside the product shell's rail.
 *
 * Repo convention forbids string-replacement tooling on this file, so the change lands here.
 *
 * Run: node scripts/patch-partner-detail-embedded.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, '..', 'src', 'pages', 'admin', 'PartnerDetailPage.tsx');

/** Exact-once replacements, re-runnable: an edit whose result is already present is skipped. */
const replacements = [
  {
    label: 'drop now-unused PageShell import',
    from: "import { PageShell } from '../../components/layout/PageShell';\n",
    to: '',
  },
  {
    label: 'import AdminWorkstationFrame',
    from: "import { EntityDetailShell } from '../../components/layout/EntityDetailShell';",
    to:
      "import { EntityDetailShell } from '../../components/layout/EntityDetailShell';\n" +
      "import {\n" +
      "  AdminWorkstationFrame,\n" +
      "  type AdminEmbeddablePageProps,\n" +
      "} from '../../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';",
  },
  {
    label: 'error boundary accepts embedded',
    optional: true,
    from:
      'class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {\n' +
      '  constructor(props: { children: ReactNode }) {',
    to:
      'class ErrorBoundary extends Component<\n' +
      '  { children: ReactNode; embedded?: boolean },\n' +
      '  { hasError: boolean; error: Error | null }\n' +
      '> {\n' +
      '  constructor(props: { children: ReactNode; embedded?: boolean }) {',
  },
  {
    label: 'error boundary frame',
    optional: true,
    from:
      '        <PageShell badge="Admin" title="Error loading partner" subtitle={`Render error: ${this.state.error?.message || \'Unknown error\'}`}>\n' +
      "          <button onClick={() => window.location.href = '/admin/partners'} className=\"px-4 py-2 rounded-xl bg-violet-600 text-white\">\n" +
      '            Back to Partners\n' +
      '          </button>\n' +
      '        </PageShell>',
    to:
      '        <AdminWorkstationFrame\n' +
      '          embedded={this.props.embedded}\n' +
      '          kind="partner-file-workstation"\n' +
      '          badge="Admin"\n' +
      '          title="Error loading partner"\n' +
      "          subtitle={`Render error: ${this.state.error?.message || 'Unknown error'}`}\n" +
      '        >\n' +
      "          <button onClick={() => window.location.href = '/admin/partners'} className=\"px-4 py-2 rounded-xl bg-violet-600 text-white\">\n" +
      '            Back to Partners\n' +
      '          </button>\n' +
      '        </AdminWorkstationFrame>',
  },
  {
    label: 'inner component accepts embedded',
    optional: true,
    from: 'function PartnerDetailPageInner() {\n  const { id } = useParams();',
    to: 'function PartnerDetailPageInner({ embedded = false }: AdminEmbeddablePageProps) {\n  const { id } = useParams();',
  },
  {
    label: 'not-authorized frame',
    optional: true,
    from:
      '      <PageShell badge="Admin" title="Not authorized" subtitle="You don’t have access to this partner in the active tenant.">',
    to:
      '      <AdminWorkstationFrame\n' +
      '        embedded={embedded}\n' +
      '        kind="partner-file-workstation"\n' +
      '        badge="Admin"\n' +
      '        title="Not authorized"\n' +
      '        subtitle="You don’t have access to this partner in the active tenant."\n' +
      '      >',
  },
  {
    label: 'not-authorized frame close',
    optional: true,
    from:
      '            Back to Partners\n' +
      '          </button>\n' +
      '        </div>\n' +
      '      </PageShell>\n' +
      '    );\n' +
      '  }\n' +
      '\n' +
      '  if (!partner) {',
    to:
      '            Back to Partners\n' +
      '          </button>\n' +
      '        </div>\n' +
      '      </AdminWorkstationFrame>\n' +
      '    );\n' +
      '  }\n' +
      '\n' +
      '  if (!partner) {',
  },
  {
    label: 'not-found frame',
    optional: true,
    from:
      '      <PageShell badge="Admin" title="Partner not found" subtitle="This Partner record does not exist or the link may be invalid.">',
    to:
      '      <AdminWorkstationFrame\n' +
      '        embedded={embedded}\n' +
      '        kind="partner-file-workstation"\n' +
      '        badge="Admin"\n' +
      '        title="Partner not found"\n' +
      '        subtitle="This Partner record does not exist or the link may be invalid."\n' +
      '      >',
  },
  {
    label: 'not-found frame close',
    optional: true,
    from:
      '            Back to Partner Management\n' +
      '          </button>\n' +
      '        </div>\n' +
      '      </PageShell>\n' +
      '    );\n' +
      '  }',
    to:
      '            Back to Partner Management\n' +
      '          </button>\n' +
      '        </div>\n' +
      '      </AdminWorkstationFrame>\n' +
      '    );\n' +
      '  }',
  },
  {
    label: 'entity shell embedded prop',
    optional: true,
    from: '    <EntityDetailShell\n      badge="Admin"',
    to: '    <EntityDetailShell\n      embedded={embedded}\n      badge="Admin"',
  },
  {
    label: 'hide duplicate page footer when embedded',
    optional: true,
    from: '        <FinelyOsPageFooter />\n</div>\n    </EntityDetailShell>',
    to: '        {embedded ? null : <FinelyOsPageFooter />}\n</div>\n    </EntityDetailShell>',
  },
  {
    label: 'default export threads embedded',
    optional: true,
    from:
      'export default function PartnerDetailPage() {\n' +
      '  return (\n' +
      '    <ErrorBoundary>\n' +
      '      <PartnerDetailPageInner />\n' +
      '    </ErrorBoundary>\n' +
      '  );\n' +
      '}',
    to:
      'export default function PartnerDetailPage({ embedded = false }: AdminEmbeddablePageProps = {}) {\n' +
      '  return (\n' +
      '    <ErrorBoundary embedded={embedded}>\n' +
      '      <PartnerDetailPageInner embedded={embedded} />\n' +
      '    </ErrorBoundary>\n' +
      '  );\n' +
      '}',
  },
];

const raw = readFileSync(target, 'utf8');
const usesCrlf = raw.includes('\r\n');
let source = raw.replace(/\r\n/g, '\n');
const failures = [];
const applied = [];
const skipped = [];

for (const { label, from, to } of replacements) {
  // `to` always contains `from` for the additive edits, so check the applied state first.
  if (to && source.includes(to)) {
    skipped.push(label);
    continue;
  }
  const count = source.split(from).length - 1;
  if (count === 0) {
    skipped.push(label);
    continue;
  }
  if (count !== 1) {
    failures.push(`${label}: expected exactly 1 match, found ${count}`);
    continue;
  }
  source = source.replace(from, to);
  applied.push(label);
}

if (failures.length > 0) {
  console.error('Aborted — no changes written:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

writeFileSync(target, usesCrlf ? source.replace(/\n/g, '\r\n') : source, 'utf8');
console.log(`Patched PartnerDetailPage.tsx (${applied.length} applied, ${skipped.length} already done)`);
for (const label of applied) console.log(`  + ${label}`);
if (skipped.length) {
  console.log('Already applied:');
  for (const label of skipped) console.log(`  · ${label}`);
}
