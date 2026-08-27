import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const files = [
  {
    file: 'src/pages/seller/SellerContractsPage.tsx',
    role: 'partner',
    kind: 'au-seller-contracts-workstation',
    frameImport:
      "import { PartnerWorkstationFrame, type PartnerEmbeddablePageProps } from '../../features/workspaceLightPreview/product/partner/PartnerWorkstationFrame';\nimport { useMappedPartnerNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';\n",
  },
  {
    file: 'src/pages/seller/SellerPayoutsPage.tsx',
    role: 'partner',
    kind: 'au-seller-payouts-workstation',
    frameImport:
      "import { PartnerWorkstationFrame, type PartnerEmbeddablePageProps } from '../../features/workspaceLightPreview/product/partner/PartnerWorkstationFrame';\nimport { useMappedPartnerNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';\n",
  },
  {
    file: 'src/pages/seller/AuSellerHubPage.tsx',
    role: 'partner',
    kind: 'au-seller-hub-workstation',
    frameImport:
      "import { PartnerWorkstationFrame, type PartnerEmbeddablePageProps } from '../../features/workspaceLightPreview/product/partner/PartnerWorkstationFrame';\nimport { useMappedPartnerNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';\n",
  },
  {
    file: 'src/pages/admin/AdminMessagesPage.tsx',
    role: 'admin',
    kind: 'messages-workstation',
    frameImport:
      "import { AdminWorkstationFrame, type AdminEmbeddablePageProps } from '../../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';\nimport { useMappedAdminNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';\n",
  },
  {
    file: 'src/pages/admin/AdminOpsAgentPage.tsx',
    role: 'admin',
    kind: 'ops-agent-workstation',
    frameImport:
      "import { AdminWorkstationFrame, type AdminEmbeddablePageProps } from '../../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';\nimport { useMappedAdminNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';\n",
  },
  {
    file: 'src/pages/admin/AdminStudioUxCommandPage.tsx',
    role: 'admin',
    kind: 'studio-ux-command-workstation',
    frameImport:
      "import { AdminWorkstationFrame, type AdminEmbeddablePageProps } from '../../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';\n",
  },
  {
    file: 'src/pages/admin/AdminCaseDetailPage.tsx',
    role: 'admin',
    kind: 'case-detail-workstation',
    frameImport:
      "import { AdminWorkstationFrame, type AdminEmbeddablePageProps } from '../../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';\nimport { useMappedAdminNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';\n",
  },
  {
    file: 'src/pages/admin/AdminHandsFreeOpsPage.tsx',
    role: 'admin',
    kind: 'ops-autopilot-workstation',
    frameImport:
      "import { AdminWorkstationFrame, type AdminEmbeddablePageProps } from '../../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';\nimport { useMappedAdminNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';\n",
  },
  {
    file: 'src/pages/admin/FinelyBridgeOpsPage.tsx',
    role: 'admin',
    kind: 'bridge-ops-workstation',
    frameImport:
      "import { AdminWorkstationFrame, type AdminEmbeddablePageProps } from '../../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';\nimport { useMappedAdminNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';\n",
  },
  {
    file: 'src/pages/business/BusinessDisputeDetailPage.tsx',
    role: 'partner',
    kind: 'business-dispute-detail-workstation',
    frameImport:
      "import { PartnerWorkstationFrame, type PartnerEmbeddablePageProps } from '../../features/workspaceLightPreview/product/partner/PartnerWorkstationFrame';\nimport { useMappedPartnerNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';\n",
  },
  {
    file: 'src/pages/LaunchHelpCenterPage.tsx',
    role: 'admin',
    kind: 'launch-os-workstation',
    frameImport:
      "import { AdminWorkstationFrame, type AdminEmbeddablePageProps } from '../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';\nimport { useMappedAdminNavigate } from '../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';\n",
  },
];

function patch(item) {
  const abs = path.join(root, item.file);
  let src = fs.readFileSync(abs, 'utf8');
  if (src.includes('embedded = false')) {
    console.log(`skip already embedded: ${item.file}`);
    return;
  }

  const frame = item.role === 'partner' ? 'PartnerWorkstationFrame' : 'AdminWorkstationFrame';
  const props = item.role === 'partner' ? 'PartnerEmbeddablePageProps' : 'AdminEmbeddablePageProps';
  const mapped = item.role === 'partner' ? 'useMappedPartnerNavigate' : 'useMappedAdminNavigate';

  src = src.replace(/import \{ PageShell \} from '[^']+';\r?\n/, item.frameImport);
  src = src.replace(/import \{ useNavigate \} from 'react-router-dom';\r?\n/, '');
  src = src.replace(/import \{ ([^}]*), useNavigate(?:, ([^}]*))? \} from 'react-router-dom';/, (_full, before, after) => {
    const names = [before, after].filter(Boolean).join(', ').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '');
    return names ? `import { ${names} } from 'react-router-dom';` : '';
  });

  src = src.replace(
    /export default function ([A-Za-z0-9]+)\(\) \{/,
    `export default function $1({ embedded = false }: ${props} = {}) {`,
  );
  if (src.includes('useNavigate()')) {
    src = src.replace(/const navigate = useNavigate\(\);/, `const navigate = ${mapped}();`);
  }

  src = src.replace(/<PageShell\b/g, `<${frame} embedded={embedded} kind="${item.kind}"`);
  src = src.replace(/<\/PageShell>/g, `</${frame}>`);
  src = src.replace(/<FinelyOsPageFooter \/>/g, '{!embedded ? <FinelyOsPageFooter /> : null}');

  fs.writeFileSync(abs, src);
  console.log(`embedded ${item.file}`);
}

for (const item of files) patch(item);
