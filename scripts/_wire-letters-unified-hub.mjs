/** Wire unified hub shell props into LettersCommandCenter (safe node edit). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filePath = path.join(root, 'src/components/letters/LettersCommandCenter.tsx');
let s = fs.readFileSync(filePath, 'utf8');

if (!s.includes('unifiedShell')) {
  s = s.replace(
    "type TabKey = 'dispute' | 'validation' | 'court' | 'templates';",
    "export type LettersStudioTab = 'dispute' | 'validation' | 'court' | 'templates';\ntype TabKey = LettersStudioTab;",
  );

  s = s.replace(
    `export function LettersCommandCenter({
  partner,
  layout = 'standalone',
  onOpenVault,
  onOpenReports,
  onOpenDisputeCenter,
  onOpenDebtCenter,
  onRequestGrantEntitlements,
}: {
  partner: Partner;
  layout?: 'standalone' | 'embedded';
  onOpenVault?: (args?: { letterId?: string }) => void;
  onOpenReports?: () => void;
  onOpenDisputeCenter?: () => void;
  onOpenDebtCenter?: () => void;
  onRequestGrantEntitlements?: (keys: string[]) => void;
}) {`,
    `export function LettersCommandCenter({
  partner,
  layout = 'standalone',
  unifiedShell,
  activeTab,
  onTabChange,
  onOpenVault,
  onOpenReports,
  onOpenDisputeCenter,
  onOpenDebtCenter,
  onRequestGrantEntitlements,
}: {
  partner: Partner;
  layout?: 'standalone' | 'embedded';
  unifiedShell?: boolean;
  activeTab?: LettersStudioTab;
  onTabChange?: (tab: LettersStudioTab) => void;
  onOpenVault?: (args?: { letterId?: string }) => void;
  onOpenReports?: () => void;
  onOpenDisputeCenter?: () => void;
  onOpenDebtCenter?: () => void;
  onRequestGrantEntitlements?: (keys: string[]) => void;
}) {`,
  );

  s = s.replace(
    "  const [tab, setTab] = useState<TabKey>('dispute');",
    `  const [internalTab, setInternalTab] = useState<TabKey>('dispute');
  const tab = activeTab ?? internalTab;
  const setTab = (next: TabKey) => {
    if (onTabChange) onTabChange(next);
    else setInternalTab(next);
  };`,
  );

  s = s.replace(
    `        {layout === 'standalone' ? (
          <div className="flex flex-wrap items-center justify-between gap-4">`,
    `        {layout === 'standalone' && !unifiedShell ? (
          <div className="flex flex-wrap items-center justify-between gap-4">`,
  );

  s = s.replace(
    `        <div className="flex flex-wrap gap-3">
          {tabKeys.filter((t) => !t.hidden).map((t) => (
            <button key={t.key} className={tabBtn(tab === t.key)} onClick={() => setTab(t.key)}>
              {t.icon} {t.label}
            </button>
          ))}`,
    `        {!unifiedShell ? (
        <div className="flex flex-wrap gap-3">
          {tabKeys.filter((t) => !t.hidden).map((t) => (
            <button key={t.key} className={tabBtn(tab === t.key)} onClick={() => setTab(t.key)}>
              {t.icon} {t.label}
            </button>
          ))}`,
  );

  const tabBarCloseAnchor = `          ))}
        </div>

        {returnNotice ? (`;
  const tabBarCloseReplacement = `          ))}
        </div>
        ) : null}

        {returnNotice ? (`;
  if (s.includes(tabBarCloseAnchor) && !s.includes('!unifiedShell ? (')) {
    console.error('Tab bar close anchor mismatch');
    process.exit(1);
  }
  if (s.includes(tabBarCloseAnchor)) {
    s = s.replace(tabBarCloseAnchor, tabBarCloseReplacement);
  }

  s = s.replace(
    "  if (layout === 'embedded') return main;",
    "  if (layout === 'embedded' || unifiedShell) return main;",
  );

  fs.writeFileSync(filePath, s);
  console.log('Wired unified hub shell props in LettersCommandCenter');
} else {
  console.log('LettersCommandCenter already has unifiedShell — skipped');
}
