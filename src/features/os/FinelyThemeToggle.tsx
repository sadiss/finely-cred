import React, { useMemo } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useFinelySiteTheme } from './FinelySiteThemeProvider';
import type { FinelySiteThemePreference } from '../../lib/finelySiteTheme';
import { themeToggleOptions, shouldShowPublicThemeToggle } from '../../lib/finelyThemeAccess';
import { useAuth } from '../../auth/AuthProvider';

const META: Record<
  FinelySiteThemePreference,
  { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  light: { label: 'Light', icon: Sun },
  dark: { label: 'Dark', icon: Moon },
  system: { label: 'Auto', icon: Monitor },
};

/** Public theme toggle — light option hidden until admin enables or user is admin. */
export function FinelyThemeToggle({
  compact = false,
  adminPreview = false,
  pair = false,
}: {
  compact?: boolean;
  adminPreview?: boolean;
  /** Light | Dark only — the dashboard back-and-forth control. */
  pair?: boolean;
}) {
  const { preference, setPreference, cyclePreference } = useFinelySiteTheme();
  const auth = useAuth();
  const options = useMemo(() => {
    if (pair) return ['light', 'dark'] as FinelySiteThemePreference[];
    if (adminPreview) return ['light', 'dark', 'system'] as FinelySiteThemePreference[];
    return themeToggleOptions(auth.user?.email);
  }, [adminPreview, auth.user?.email, pair]);

  if (!adminPreview && !shouldShowPublicThemeToggle(auth.user?.email)) {
    return null;
  }

  if (compact && !pair) {
    const active = META[preference === 'system' ? 'light' : preference] ?? META.light;
    const Icon = active.icon;
    return (
      <button
        type="button"
        onClick={() => cyclePreference()}
        className="fc-theme-toggle-compact inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all"
        title={`Theme: ${active.label}. Click to change.`}
        aria-label={`Theme ${active.label}. Click to change.`}
      >
        <Icon size={15} />
        <span>{active.label}</span>
      </button>
    );
  }

  return (
    <div
      className="fc-theme-toggle inline-flex items-center gap-1 rounded-xl border p-1"
      role="group"
      aria-label="Site appearance"
    >
      {options.map((id) => {
        const opt = META[id];
        const Icon = opt.icon;
        const active = pair && preference === 'system' ? id === 'light' : preference === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setPreference(id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all ${
              active ? 'fc-theme-toggle-active' : 'fc-theme-toggle-idle'
            }`}
            aria-pressed={active}
            title={opt.label}
          >
            <Icon size={14} />
            <span className={pair ? 'inline' : 'hidden sm:inline'}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
