import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, FolderOpen, PenLine, Scale } from 'lucide-react';
import { finelyOsGlowTile } from '../os/finelyOsLightUi';

export type RestoreWorkspaceDockKey = 'reports' | 'evidence' | 'letters' | 'debt';

type DockItem = {
  key: RestoreWorkspaceDockKey;
  label: string;
  short: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: 'violet' | 'emerald' | 'fuchsia' | 'sky';
};

const DOCK_ITEMS: DockItem[] = [
  { key: 'reports', label: 'Reports', short: 'Credit intel', path: '/portal/reports', icon: FileText, accent: 'violet' },
  { key: 'evidence', label: 'Evidence', short: 'Vault & proof', path: '/portal/documents', icon: FolderOpen, accent: 'emerald' },
  { key: 'letters', label: 'Credit letters', short: 'Bureau disputes', path: '/portal/letters', icon: PenLine, accent: 'fuchsia' },
  { key: 'debt', label: 'Debt', short: 'Validation & court', path: '/portal/debt', icon: Scale, accent: 'sky' },
];

function isActive(pathname: string, item: DockItem): boolean {
  if (item.key === 'reports') return pathname.startsWith('/portal/reports') || pathname.startsWith('/portal/analysis');
  if (item.key === 'evidence') return pathname.startsWith('/portal/documents');
  if (item.key === 'letters') return pathname.startsWith('/portal/letters') || pathname.startsWith('/portal/disputes');
  if (item.key === 'debt') return pathname.startsWith('/portal/debt');
  return false;
}

type AdminTabKey = 'reports' | 'evidence' | 'letters' | 'debt';

type Props =
  | {
      variant: 'portal';
      className?: string;
    }
  | {
      variant: 'admin';
      activeTab?: AdminTabKey;
      onOpenTab: (tab: AdminTabKey) => void;
      className?: string;
    };

/**
 * Full-width restore lane — Reports (left) · Evidence · Credit letters · Debt (right).
 */
export function PartnerRestoreWorkspaceDock(props: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const items = DOCK_ITEMS;

  return (
    <div
      className={`rounded-2xl border border-white/[0.1] bg-fc-shell/95 backdrop-blur-md px-3 py-3 sm:px-4 sm:py-4 shadow-lg ${props.className ?? ''}`}
      data-fc-restore-workspace-dock="1"
    >
      <div className="flex w-full items-stretch gap-2 sm:gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            props.variant === 'portal'
              ? isActive(pathname, item)
              : props.activeTab === item.key;
          const glow = finelyOsGlowTile(item.accent);
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                if (props.variant === 'portal') navigate(item.path);
                else props.onOpenTab(item.key);
              }}
              aria-current={active ? 'page' : undefined}
              className={`flex-1 min-w-0 min-h-[52px] sm:min-h-[56px] rounded-xl border px-2 sm:px-4 py-2.5 sm:py-3 text-left transition-all ${glow} ${
                active
                  ? 'border-white/25 bg-white/[0.08] ring-1 ring-white/15'
                  : 'border-white/[0.08] hover:border-white/18 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Icon size={18} className={active ? 'text-white/90' : 'text-white/55 shrink-0'} />
                <div className="min-w-0">
                  <div className={`text-xs sm:text-sm font-bold truncate ${active ? 'text-white' : 'text-white/85'}`}>
                    {item.label}
                  </div>
                  <div className="hidden sm:block text-[10px] text-white/45 truncate">{item.short}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
