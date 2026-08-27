import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const files = [
  { file: 'src/pages/affiliate/AffiliateHubPage.tsx', kind: 'affiliate-hub-workstation', mapped: true },
  { file: 'src/pages/agent/AgentHubPage.tsx', kind: 'specialist-hub-workstation', mapped: true },
  { file: 'src/pages/agency/AgencyHubPage.tsx', kind: 'agency-hub-workstation', mapped: true },
  { file: 'src/pages/caseHelp/CaseHelpHubPage.tsx', kind: 'case-help-hub-workstation', mapped: true },
  { file: 'src/pages/realEstate/RealEstateHubPage.tsx', kind: 'real-estate-hub-workstation', mapped: true },
  { file: 'src/pages/portal/PartnerCoursePage.tsx', kind: 'course-detail-workstation', mapped: true },
  { file: 'src/pages/portal/PartnerProjectWorkspacePage.tsx', kind: 'project-detail-workstation', mapped: true },
  { file: 'src/pages/portal/VideoMeetingRoomPage.tsx', kind: 'meeting-workstation', mapped: true },
  { file: 'src/pages/portal/PortalPartnerSelectPage.tsx', kind: 'select-partner-workstation', mapped: true },
  { file: 'src/pages/developer/DeveloperQaHubPage.tsx', kind: 'developer-qa-workstation', mapped: false },
];

function stripUseNavigate(src) {
  src = src.replace(/import \{ useNavigate \} from 'react-router-dom';\r?\n/, '');
  src = src.replace(
    /import \{([^}]+)\} from 'react-router-dom';/,
    (_full, names) => {
      const next = String(names)
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part && part !== 'useNavigate');
      return next.length ? `import { ${next.join(', ')} } from 'react-router-dom';` : '';
    },
  );
  return src;
}

for (const item of files) {
  const abs = path.join(root, item.file);
  let src = fs.readFileSync(abs, 'utf8');
  if (src.includes('embedded = false')) {
    console.log(`skip already embedded: ${item.file}`);
    continue;
  }

  const partnerImport = item.mapped
    ? "import { PartnerWorkstationFrame, type PartnerEmbeddablePageProps } from '../../features/workspaceLightPreview/product/partner/PartnerWorkstationFrame';\nimport { useMappedPartnerNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';\n"
    : "import { PartnerWorkstationFrame, type PartnerEmbeddablePageProps } from '../../features/workspaceLightPreview/product/partner/PartnerWorkstationFrame';\n";

  src = src.replace(/import \{ PageShell \} from '[^']+';\r?\n/, partnerImport);
  src = stripUseNavigate(src);

  src = src.replace(
    /export default function ([A-Za-z0-9]+)\(\) \{/,
    `export default function $1({ embedded = false }: PartnerEmbeddablePageProps = {}) {`,
  );
  src = src.replace(/const navigate = useNavigate\(\);/, 'const navigate = useMappedPartnerNavigate();');
  src = src.replace(/<PageShell\b/g, `<PartnerWorkstationFrame embedded={embedded} kind="${item.kind}"`);
  src = src.replace(/<\/PageShell>/g, '</PartnerWorkstationFrame>');
  src = src.replace(/<FinelyOsPageFooter \/>/g, '{!embedded ? <FinelyOsPageFooter /> : null}');

  fs.writeFileSync(abs, src);
  console.log(`embedded ${item.file}`);
}
