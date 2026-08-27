import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcPath = path.join(root, 'src/pages/admin/AdminSettingsPage.tsx');
const outDir = path.join(root, 'src/features/workspaceLightPreview/product/admin');
const src = fs.readFileSync(srcPath, 'utf8');
const lines = src.split(/\r?\n/);

const sharedLines = lines.slice(178, 293);
const sharedContent = `import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';

${sharedLines.join('\n').replace(/^function /gm, 'export function ')}
`;

fs.writeFileSync(path.join(outDir, 'adminSettingsInspectorShared.tsx'), sharedContent);

// State + handlers: skip activeTab, location, embedded tab routing
const skipLine = (line) => {
  const t = line.trim();
  if (t.includes('const location = useLocation()')) return true;
  if (t.includes('const [activeTab, setActiveTab]')) return true;
  if (t.includes('if (embedded) {')) return true;
  if (t.startsWith('setActiveTab(initialTab)')) return true;
  if (t === 'return;') return false; // keep other returns
  if (t.includes('const goTab =')) return true;
  if (t.includes('setActiveTab(t)')) return true;
  if (t.includes('location.search')) return true;
  if (t.includes('location.pathname')) return true;
  if (t.includes('[embedded, initialTab')) return true;
  return false;
};

const stateLines = [];
let inEmbeddedBlock = false;
let inGoTab = false;
let braceDepth = 0;

for (let i = 302; i < 494; i++) {
  const line = lines[i];
  const t = line.trim();

  if (t.startsWith('useEffect(() => {') && lines[i + 1]?.includes('if (embedded)')) {
    inEmbeddedBlock = true;
    braceDepth = 1;
    continue;
  }
  if (inEmbeddedBlock) {
    braceDepth += (line.match(/\{/g) || []).length;
    braceDepth -= (line.match(/\}/g) || []).length;
    if (braceDepth <= 0) inEmbeddedBlock = false;
    continue;
  }

  if (t.startsWith('const goTab =')) {
    inGoTab = true;
    braceDepth = 0;
    continue;
  }
  if (inGoTab) {
    if (t.startsWith('const ') || t.startsWith('useEffect')) {
      inGoTab = false;
    } else {
      continue;
    }
  }

  if (skipLine(line)) continue;
  stateLines.push(line);
}

const tabStart = lines.findIndex((l) => l.includes('{/* Tab Content */}')) + 2;
let tabEnd = tabStart;
for (let i = tabStart; i < lines.length; i++) {
  if (i > tabStart + 10 && lines[i].trim() === '</div>' && lines[i + 1]?.includes('FinelyOsPageFooter')) {
    tabEnd = i;
    break;
  }
}

const tabPanelsRaw = lines.slice(tabStart, tabEnd).map((l) => l.replace(/goTab\(/g, 'onSelectTab('));
let tabPanelsText = tabPanelsRaw.join('\n');
tabPanelsText = tabPanelsText.replace(/TABS\.filter\(\(t\) => t\.key !== 'home'\)/g, 'INSPECTOR_CATEGORY_TABS');
tabPanelsText = tabPanelsText.replace(
  /Pick a category below\. Everything deep-links via[\s\S]*?with your team\./,
  'Jump to another settings family or open related admin areas.',
);
tabPanelsText = tabPanelsText.replace(
  /<div className=\{\`mt-1 \$\{FINELY_OS_ENTITY_BODY\}\`\}>[\s\S]*?\{t\.key === 'site'[\s\S]*?: 'Custom fields for partners\/cases\.'\}[\s\S]*?<\/div>/,
  '<div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{t.purpose}</div>',
);

const tabsContent = `import React from 'react';
import {
  BriefcaseBusiness,
  Building2,
  Columns3,
  CreditCard,
  Crown,
  Facebook,
  FileText,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Settings,
  Shield,
  Sparkles,
  ToggleRight,
} from 'lucide-react';
import type { SettingsTab } from '../../../../pages/admin/AdminSettingsPage';

export type InspectorCategoryTab = {
  key: SettingsTab;
  label: string;
  icon: React.ReactNode;
  purpose: string;
};

export const INSPECTOR_CATEGORY_TABS: InspectorCategoryTab[] = [
  { key: 'site', label: 'Site', icon: <Settings size={16} />, purpose: 'Branding, legal links, contact defaults.' },
  { key: 'comms', label: 'Comms', icon: <Mail size={16} />, purpose: 'Delivery defaults, templates, channels.' },
  { key: 'chat', label: 'Chat', icon: <MessageCircle size={16} />, purpose: 'Assistant configuration and routing.' },
  { key: 'meta', label: 'Meta', icon: <Facebook size={16} />, purpose: 'Facebook / Instagram Lead Ads and OAuth.' },
  { key: 'stripe', label: 'Stripe', icon: <CreditCard size={16} />, purpose: 'Stripe keys and checkout behavior.' },
  { key: 'denefits', label: 'In‑House Financing', icon: <Building2 size={16} />, purpose: 'In-house financing contracts and mapping.' },
  { key: 'nora', label: 'Nora Capital', icon: <BriefcaseBusiness size={16} />, purpose: 'Nora Capital integration settings.' },
  { key: 'pricing', label: 'Pricing Controls', icon: <LayoutDashboard size={16} />, purpose: 'Catalog toggles and package visibility.' },
  { key: 'workboard', label: 'WorkBoard', icon: <Columns3 size={16} />, purpose: 'WorkBoard stages and SLA defaults.' },
  { key: 'features', label: 'Features', icon: <ToggleRight size={16} />, purpose: 'Feature flags and rollout switches.' },
  { key: 'appearance', label: 'Appearance', icon: <Sparkles size={16} />, purpose: 'Admin chrome and theme defaults.' },
  { key: 'security', label: 'Security', icon: <Shield size={16} />, purpose: 'Admin allowlist and policies.' },
  { key: 'heta', label: 'Head of Society', icon: <Crown size={16} />, purpose: 'HOS access codes and program controls.' },
  { key: 'customFields', label: 'Custom Fields', icon: <FileText size={16} />, purpose: 'Custom fields for partners and cases.' },
];
`;

fs.writeFileSync(path.join(outDir, 'adminSettingsInspectorTabs.tsx'), tabsContent);

const inspector = `import React, { useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  Building2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Columns3,
  CreditCard,
  Crown,
  ExternalLink,
  Facebook,
  FileText,
  LayoutDashboard,
  Link,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Shield,
  ToggleRight,
  Trash2,
  Users,
  Webhook,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MailCreditsPanel } from '../../../../components/mailing/MailCreditsPanel';
import { ADMIN_EMAIL_ALLOWLIST, isAdminEmail } from '../../../../auth/admin';
import { useAuth } from '../../../../auth/AuthProvider';
import {
  loadSettings,
  updateSiteSettings,
  updateCommsSettings,
  updateChatSettings,
  updateStripeSettings,
  updateDenefitsSettings,
  updateNoraCapitalSettings,
  updateFeatureFlags,
  updatePricingControls,
  updateSecuritySettings,
  updateWorkboardSettings,
  getDenefitsContracts,
  setDenefitsContract,
  removeDenefitsContract,
} from '../../../../data/settingsRepo';
import type {
  PlatformSettings,
  StripeSettings,
  DenefitsSettings,
  NoraCapitalSettings,
  SiteSettings,
  CommsSettings,
  ChatSettings,
  SecuritySettings,
  FeatureFlags,
  PricingControls,
  WorkStageDefinition,
} from '../../../../domain/settings';
import { DEFAULT_SETTINGS } from '../../../../domain/settings';
import { WelcomeExperienceEditor } from '../../../../components/comms/WelcomeExperienceEditor';
import { allPackages, formatPrice } from '../../../../config/pricingCatalog';
import type { CustomFieldDefinition, CustomFieldScope, CustomFieldType } from '../../../../domain/customFields';
import { createCustomFieldDefinition } from '../../../../domain/customFields';
import {
  deleteCustomFieldDefinition,
  listCustomFieldDefinitionsByScope,
  upsertCustomFieldDefinition,
} from '../../../../data/customFieldsRepo';
import { getActiveTenantId } from '../../../../tenancy/activeTenant';
import type { FieldLayout } from '../../../../domain/fieldLayouts';
import { createFieldLayout } from '../../../../domain/fieldLayouts';
import { getFieldLayout, upsertFieldLayout } from '../../../../data/fieldLayoutsRepo';
import { FINELY_TENANT_ID } from '../../../../domain/tenants';
import { canManageCustomFields, canManageFieldLayouts, getMembershipByUserAndTenant } from '../../../../data/tenantsRepo';
import { downloadText } from '../../../../utils/download';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import { FINELY_MAIL_COPY } from '../../../../lib/mailWhiteLabel';
import { ADMIN_FEATURE_MATRIX } from '../../../../data/adminFeatureMatrix';
import { MetaIntegrationSettingsPanel } from '../../../meta/MetaIntegrationSettingsPanel';
import { FinelyAdminAppearancePanel } from '../../../os/FinelyAdminAppearancePanel';
import { HosAccessCodesAdminPanel } from '../../../../components/heta/HosAccessCodesAdminPanel';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_DANGER_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
  finelyOsInlineListItem,
} from '../../../os/finelyOsLightUi';
import type { SettingsTab } from '../../../../pages/admin/AdminSettingsPage';
import { INSPECTOR_CATEGORY_TABS } from './adminSettingsInspectorTabs';
import { SecretInput, StatusBadge, TextInput, Toggle } from './adminSettingsInspectorShared';

export type AdminSettingsInspectorProps = {
  activeTab: SettingsTab;
  onSelectTab: (tab: SettingsTab) => void;
  onSettingsSaved?: () => void;
};

export function AdminSettingsInspector({ activeTab, onSelectTab, onSettingsSaved }: AdminSettingsInspectorProps) {
  const auth = useAuth();
  const navigate = useNavigate();
${stateLines.join('\n')}

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="animate-spin text-violet-400" size={24} />
      </div>
    );
  }

  const financingPackages = allPackages.filter((p) => p.rail === 'in_house' || p.rail === 'both');
  const contracts = getDenefitsContracts();
  const filteredFinancingPackages = financingPackages.filter((p) => {
    const q = contractQuery.trim().toLowerCase();
    if (!q) return true;
    const hay = [p.name, p.id, p.category].join(' ').toLowerCase();
    return hay.includes(q);
  });

  const handleSaveClick = () => {
    handleSave();
    onSettingsSaved?.();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className={\`\${FINELY_OS_ENTITY_SUBLABEL} !mb-1\`}>Family controls</p>
          <h3 className={\`\${FINELY_OS_ENTITY_TITLE} !m-0\`}>Edit settings</h3>
        </div>
        <button type="button" onClick={handleSaveClick} disabled={saved} className={saved ? FINELY_OS_SUCCESS_BTN : FINELY_OS_PRIMARY_BTN}>
          {saved ? (
            <>
              <CheckCircle size={16} /> Saved
            </>
          ) : (
            <>
              <Save size={16} /> Save changes
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
${tabPanelsText}
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path.join(outDir, 'AdminSettingsInspector.tsx'), inspector);

// Remove old .ts tabs file if present
const oldTabs = path.join(outDir, 'adminSettingsInspectorTabs.ts');
if (fs.existsSync(oldTabs)) fs.unlinkSync(oldTabs);

console.log('Generated inspector:', stateLines.length, 'state lines,', tabPanelsRaw.length, 'panel lines');
