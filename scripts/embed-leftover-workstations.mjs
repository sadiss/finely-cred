import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const adminImport =
  "import { AdminWorkstationFrame, type AdminEmbeddablePageProps } from '../../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';\nimport { useMappedAdminNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';\n";

const partnerImport =
  "import { PartnerWorkstationFrame, type PartnerEmbeddablePageProps } from '../../features/workspaceLightPreview/product/partner/PartnerWorkstationFrame';\nimport { useMappedPartnerNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';\n";

const files = [
  { file: 'src/pages/seller/SellerDashboardPage.tsx', role: 'partner', kind: 'au-seller-workstation' },
  { file: 'src/pages/seller/SellerListingsPage.tsx', role: 'partner', kind: 'au-seller-cards-workstation' },
  { file: 'src/pages/admin/AdminWorkloadPage.tsx', role: 'admin', kind: 'workload-workstation' },
  { file: 'src/pages/admin/AdminPartnerImportPage.tsx', role: 'admin', kind: 'partners-import-workstation' },
  { file: 'src/pages/admin/AdminDisputeCollaborationPage.tsx', role: 'admin', kind: 'dispute-collaboration-workstation' },
  { file: 'src/pages/admin/ParsingLabPage.tsx', role: 'admin', kind: 'parsing-lab-workstation' },
  { file: 'src/pages/admin/AdminComplianceReviewPage.tsx', role: 'admin', kind: 'compliance-review-workstation' },
  { file: 'src/pages/admin/AdminPartnerSuccessEditorPage.tsx', role: 'admin', kind: 'partner-success-workstation' },
  { file: 'src/pages/admin/AdminPortfolioDashboardPage.tsx', role: 'admin', kind: 'projects-portfolio-workstation' },
  { file: 'src/pages/admin/AdminVoiceStudioPage.tsx', role: 'admin', kind: 'voice-studio-workstation' },
  { file: 'src/pages/admin/AdminTourStudioPage.tsx', role: 'admin', kind: 'tour-studio-workstation' },
  { file: 'src/pages/admin/AdminBookstorePage.tsx', role: 'admin', kind: 'bookstore-workstation' },
  { file: 'src/pages/admin/AdminCmsPage.tsx', role: 'admin', kind: 'cms-workstation' },
  { file: 'src/pages/admin/AdminTemplatesPage.tsx', role: 'admin', kind: 'templates-workstation' },
  { file: 'src/pages/admin/AdminGuidePage.tsx', role: 'admin', kind: 'guide-workstation' },
  { file: 'src/pages/admin/AdminNoraCapitalPage.tsx', role: 'admin', kind: 'nora-capital-workstation' },
  { file: 'src/pages/admin/AdminAuSellersPage.tsx', role: 'admin', kind: 'au-sellers-workstation' },
  { file: 'src/pages/admin/AdminTeamRolesPage.tsx', role: 'admin', kind: 'team-workstation' },
  { file: 'src/pages/admin/AdminAccessCenterPage.tsx', role: 'admin', kind: 'access-workstation' },
];

function patch(file, role, kind) {
  const abs = path.join(root, file);
  let src = fs.readFileSync(abs, 'utf8');
  if (src.includes('embedded = false')) {
    console.log(`skip already embedded: ${file}`);
    return;
  }

  const frame = role === 'partner' ? 'PartnerWorkstationFrame' : 'AdminWorkstationFrame';
  const props = role === 'partner' ? 'PartnerEmbeddablePageProps' : 'AdminEmbeddablePageProps';
  const mapped = role === 'partner' ? 'useMappedPartnerNavigate' : 'useMappedAdminNavigate';
  const extraImport = role === 'partner' ? partnerImport : adminImport;

  src = src.replace(/import \{ PageShell \} from '[^']+';\r?\n/, extraImport);
  src = src.replace(/import \{ useNavigate \} from 'react-router-dom';\r?\n/, '');
  src = src.replace(/import \{ ([^}]*), useNavigate(?:, ([^}]*))? \} from 'react-router-dom';/, (full, before, after) => {
    const names = [before, after].filter(Boolean).join(', ').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '');
    return names ? `import { ${names} } from 'react-router-dom';` : '';
  });

  src = src.replace(
    /export default function ([A-Za-z0-9]+)\(\) \{/,
    `export default function $1({ embedded = false }: ${props} = {}) {`,
  );
  src = src.replace(/const navigate = useNavigate\(\);/, `const navigate = ${mapped}();`);

  src = src.replace(/<PageShell\b/g, `<${frame} embedded={embedded} kind="${kind}"`);
  src = src.replace(/<\/PageShell>/g, `</${frame}>`);
  src = src.replace(/<FinelyOsPageFooter \/>/g, '{!embedded ? <FinelyOsPageFooter /> : null}');

  fs.writeFileSync(abs, src);
  console.log(`embedded ${file}`);
}

for (const item of files) patch(item.file, item.role, item.kind);
