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

const stateStart = lines.findIndex((l) => l.includes('const auth = useAuth()'));
const stateEnd = lines.findIndex((l, i) => i > stateStart && l.trim().startsWith('if (!settings)'));
const stateBlock = lines.slice(stateStart, stateEnd);

const tabStart = lines.findIndex((l) => l.includes('{/* Tab Content */}')) + 2;
let tabEnd = tabStart;
for (let i = tabStart; i < lines.length; i++) {
  if (i > tabStart + 10 && lines[i].trim() === '</div>' && lines[i + 1]?.includes('FinelyOsPageFooter')) {
    tabEnd = i;
    break;
  }
}
const tabPanels = lines.slice(tabStart, tabEnd).map((l) => l.replace(/goTab\(/g, 'onSelectTab('));

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
import { SETTINGS_INSPECTOR_TABS, tabPurposeLine } from './adminSettingsInspectorTabs';
import { SecretInput, StatusBadge, TextInput, Toggle } from './adminSettingsInspectorShared';

export type AdminSettingsInspectorProps = {
  activeTab: SettingsTab;
  onSelectTab: (tab: SettingsTab) => void;
  onSettingsSaved?: () => void;
};

export function AdminSettingsInspector({ activeTab, onSelectTab, onSettingsSaved }: AdminSettingsInspectorProps) {
  const auth = useAuth();
  const navigate = useNavigate();
${stateBlock.map((l) => '  ' + l.trimStart()).join('\n')}

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
${tabPanels.join('\n')}
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path.join(outDir, 'AdminSettingsInspector.tsx'), inspector);
console.log('Generated inspector files');
