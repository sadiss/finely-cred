import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const adminImport =
  "import { AdminWorkstationFrame, type AdminEmbeddablePageProps } from '../../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';\nimport { useMappedAdminNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';\n";
const adminImportNoNav =
  "import { AdminWorkstationFrame, type AdminEmbeddablePageProps } from '../../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';\n";

const files = [
  { file: 'src/pages/admin/AdminCrmRecordPage.tsx', kind: 'crm-record-workstation', mapped: true },
  { file: 'src/pages/admin/AdminGrowthAgentsPage.tsx', kind: 'growth-agent-detail-workstation', mapped: true },
  { file: 'src/pages/admin/AdminOvernight50Page.tsx', kind: 'overnight-workstation', mapped: false },
];

function stripUseNavigate(src) {
  src = src.replace(/import \{ useNavigate \} from 'react-router-dom';\r?\n/, '');
  src = src.replace(/import \{([^}]+)\} from 'react-router-dom';/, (_full, names) => {
    const next = String(names)
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part && part !== 'useNavigate');
    return next.length ? `import { ${next.join(', ')} } from 'react-router-dom';` : '';
  });
  return src;
}

for (const item of files) {
  const abs = path.join(root, item.file);
  let src = fs.readFileSync(abs, 'utf8');
  if (src.includes('embedded = false')) {
    console.log(`skip already embedded: ${item.file}`);
    continue;
  }

  src = src.replace(/import \{ PageShell \} from '[^']+';\r?\n/, item.mapped ? adminImport : adminImportNoNav);
  src = stripUseNavigate(src);
  src = src.replace(
    /export default function ([A-Za-z0-9]+)\(\) \{/,
    `export default function $1({ embedded = false }: AdminEmbeddablePageProps = {}) {`,
  );
  src = src.replace(/const navigate = useNavigate\(\);/, 'const navigate = useMappedAdminNavigate();');
  src = src.replace(/<PageShell\b/g, `<AdminWorkstationFrame embedded={embedded} kind="${item.kind}"`);
  src = src.replace(/<\/PageShell>/g, '</AdminWorkstationFrame>');
  src = src.replace(/<FinelyOsPageFooter \/>/g, '{!embedded ? <FinelyOsPageFooter /> : null}');

  fs.writeFileSync(abs, src);
  console.log(`embedded ${item.file}`);
}
