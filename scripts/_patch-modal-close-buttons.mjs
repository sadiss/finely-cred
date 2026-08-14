#!/usr/bin/env node
/**
 * Patch modal close buttons to use FinelyOsModalCloseButton + FINELY_OS_MODAL_HEADER.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

const patches = [
  {
    file: 'src/features/os/FinelyOsTypedDeleteDialog.tsx',
    replacements: [
      [
        "import { AlertTriangle, X } from 'lucide-react';",
        "import { AlertTriangle } from 'lucide-react';",
      ],
      [
        `  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_SHELL,
  finelyOsGlowField,
} from './finelyOsLightUi';`,
        `  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_HEADER,
  FINELY_OS_MODAL_SHELL,
  finelyOsGlowField,
} from './finelyOsLightUi';
import { FinelyOsModalCloseButton } from './FinelyOsModalCloseButton';`,
      ],
      [
        `        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-rose-400/35 bg-rose-500/15 text-rose-200">
              <AlertTriangle size={18} />
            </span>
            <div className="min-w-0">
              <h2 id={\`\${inputId}-title\`} className={\`text-base font-bold \${FINELY_OS_ENTITY_VALUE}\`}>
                {title}
              </h2>
              {entityLabel ? <p className="mt-0.5 text-xs text-rose-200/80 truncate">{entityLabel}</p> : null}
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className={\`\${FINELY_OS_SECONDARY_BTN} !p-2\`} aria-label="Close">
            <X size={16} />
          </button>
        </div>`,
        `        <div className={FINELY_OS_MODAL_HEADER}>
          <div className="flex items-start gap-3 min-w-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-rose-400/35 bg-rose-500/15 text-rose-200">
              <AlertTriangle size={18} />
            </span>
            <div className="min-w-0">
              <h2 id={\`\${inputId}-title\`} className={\`text-base font-bold \${FINELY_OS_ENTITY_VALUE}\`}>
                {title}
              </h2>
              {entityLabel ? <p className="mt-0.5 text-xs text-rose-200/80 truncate">{entityLabel}</p> : null}
            </div>
          </div>
          <FinelyOsModalCloseButton onClick={onClose} disabled={busy} />
        </div>`,
      ],
    ],
  },
  {
    file: 'src/components/pricing/ServicePackageDetailModal.tsx',
    replacements: [
      [
        "import { CheckCircle2, X } from 'lucide-react';",
        "import { CheckCircle2 } from 'lucide-react';",
      ],
      [
        `  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';`,
        `  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_HEADER,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../../features/os/FinelyOsModalCloseButton';`,
      ],
      [
        `          <div className="p-6 border-b border-white/[0.08] flex items-start justify-between gap-4">
            <div className="min-w-0">`,
        `          <div className={\`\${FINELY_OS_MODAL_HEADER} sm:px-6 sm:py-5\`}>
            <div className="min-w-0">`,
      ],
      [
        `            <button type="button" onClick={onClose} className={FINELY_OS_SECONDARY_BTN} title="Close" aria-label="Close">
              <X size={18} />
            </button>`,
        `            <FinelyOsModalCloseButton onClick={onClose} />`,
      ],
    ],
  },
  {
    file: 'src/components/pricing/ServicesChooserModal.tsx',
    replacements: [
      [
        /import \{([^}]*),\s*X\s*,([^}]*)\} from 'lucide-react';/,
        "import {$1,$2} from 'lucide-react';",
      ],
      [
        `  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_SHELL,
  finelyOsCatalogCardCompact,
} from '../../features/os/finelyOsLightUi';`,
        `  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_HEADER,
  FINELY_OS_MODAL_SHELL,
  finelyOsCatalogCardCompact,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../../features/os/FinelyOsModalCloseButton';`,
      ],
      [
        `          <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-start justify-between gap-4">`,
        `          <div className={\`\${FINELY_OS_MODAL_HEADER} sm:px-6 sm:py-5\`}>`,
      ],
      [
        `            <button type="button" onClick={onClose} className={FINELY_OS_SECONDARY_BTN} aria-label="Close">
              <X size={18} />
            </button>`,
        `            <FinelyOsModalCloseButton onClick={onClose} />`,
      ],
    ],
  },
  {
    file: 'src/components/partner/PartnerHubWorkModal.tsx',
    replacements: [
      [
        /,\s*X\s*(?=\} from 'lucide-react')/,
        '',
      ],
      [
        `  FINELY_OS_MODAL_SHELL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';`,
        `  FINELY_OS_MODAL_HEADER,
  FINELY_OS_MODAL_SHELL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../../features/os/FinelyOsModalCloseButton';`,
      ],
      [
        `        <div className="p-4 md:p-5 border-b border-white/[0.08] flex items-start justify-between gap-3">`,
        `        <div className={FINELY_OS_MODAL_HEADER}>`,
      ],
      [
        `          <button type="button" onClick={onClose} className={\`\${FINELY_OS_SECONDARY_BTN} !py-2 shrink-0\`} aria-label="Close">
            <X size={16} />
          </button>`,
        `          <FinelyOsModalCloseButton onClick={onClose} />`,
      ],
    ],
  },
  {
    file: 'src/features/work/components/TaskCompleteModal.tsx',
    replacements: [
      [
        /,\s*X\s*(?=\} from 'lucide-react')/,
        '',
      ],
      [
        `  FINELY_OS_MODAL_SHELL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../os/finelyOsLightUi';`,
        `  FINELY_OS_MODAL_HEADER,
  FINELY_OS_MODAL_SHELL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../../os/FinelyOsModalCloseButton';`,
      ],
      [
        `          <button type="button" onClick={onClose} className={FINELY_OS_SECONDARY_BTN} aria-label="Close">
            <X size={14} />
          </button>`,
        `          <FinelyOsModalCloseButton onClick={onClose} iconSize={16} />`,
      ],
    ],
  },
  {
    file: 'src/components/workboard/WorkItemCreateModal.tsx',
    replacements: [
      [
        /,\s*X\s*(?=\} from 'lucide-react')/,
        '',
      ],
      [
        `  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';`,
        `  FINELY_OS_MODAL_HEADER,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../../features/os/FinelyOsModalCloseButton';`,
      ],
      [
        `          <button type="button" onClick={onClose} className={FINELY_OS_SECONDARY_BTN} title="Close">
            <X size={16} />
          </button>`,
        `          <FinelyOsModalCloseButton onClick={onClose} />`,
      ],
    ],
  },
  {
    file: 'src/components/workboard/TaskDetailModal.tsx',
    replacements: [
      [
        /,\s*X\s*(?=\} from 'lucide-react')/,
        '',
      ],
      [
        `  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';`,
        `  FINELY_OS_MODAL_HEADER,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../../features/os/FinelyOsModalCloseButton';`,
      ],
      [
        `        <div className="shrink-0 p-6 border-b border-white/[0.08] flex flex-wrap items-start justify-between gap-4">`,
        `        <div className={\`\${FINELY_OS_MODAL_HEADER} sm:px-6 sm:py-5\`}>`,
      ],
      [
        `          <button type="button" onClick={onClose} className={FINELY_OS_SECONDARY_BTN}>
            <X size={16} />
          </button>`,
        `          <FinelyOsModalCloseButton onClick={onClose} />`,
      ],
    ],
  },
  {
    file: 'src/components/workboard/ProjectDetailModal.tsx',
    replacements: [
      [
        /,\s*X\s*(?=\} from 'lucide-react')/,
        '',
      ],
      [
        `  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';`,
        `  FINELY_OS_MODAL_HEADER,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../../features/os/FinelyOsModalCloseButton';`,
      ],
      [
        `          <button type="button" onClick={onClose} className={FINELY_OS_SECONDARY_BTN}>
            <X size={16} />
          </button>`,
        `          <FinelyOsModalCloseButton onClick={onClose} />`,
      ],
    ],
  },
  {
    file: 'src/components/disputes/DisputePickerModal.tsx',
    replacements: [
      [
        /,\s*X\s*(?=\} from 'lucide-react')/,
        '',
      ],
      [
        `} from '../../creditReports/letterCategory';`,
        `} from '../../creditReports/letterCategory';
import { FinelyOsModalCloseButton } from '../../features/os/FinelyOsModalCloseButton';`,
      ],
      [
        `            <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/70 hover:bg-white/10">
              <X size={18} />
            </button>`,
        `            <FinelyOsModalCloseButton onClick={onClose} />`,
      ],
    ],
  },
  {
    file: 'src/components/letters/MailLetterModal.tsx',
    replacements: [
      [
        /,\s*X\s*(?=\} from 'lucide-react')/,
        '',
      ],
      [
        `  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';`,
        `  FINELY_OS_MODAL_HEADER,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../../features/os/FinelyOsModalCloseButton';`,
      ],
      [
        `          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-white/70 disabled:opacity-60"
            title="Close"
          >
            <X size={16} />
          </button>`,
        `          <FinelyOsModalCloseButton onClick={onClose} disabled={busy} />`,
      ],
    ],
  },
  {
    file: 'src/features/partner/PartnerProfileTab.tsx',
    replacements: [
      [
        `import { FINELY_OS_FIXED_OVERLAY, FINELY_OS_MODAL_SHELL, finelyOsGlowField } from '../os/finelyOsLightUi';`,
        `import { FINELY_OS_FIXED_OVERLAY, FINELY_OS_MODAL_HEADER, FINELY_OS_MODAL_SHELL, finelyOsGlowField } from '../os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../os/FinelyOsModalCloseButton';`,
      ],
      [
        `        <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">`,
        `        <header className={FINELY_OS_MODAL_HEADER}>`,
      ],
      [
        `          <button
            type="button"
            className="shrink-0 rounded-lg border border-white/20 bg-black/25 p-2 text-white/75 hover:bg-white/10 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            onClick={props.onClose}
            aria-label={\`Close \${props.title}\`}
            autoFocus
          >
            <X size={18} aria-hidden="true" />
          </button>`,
        `          <FinelyOsModalCloseButton onClick={props.onClose} aria-label={\`Close \${props.title}\`} />`,
      ],
    ],
  },
  {
    file: 'src/pages/admin/PartnerDetailPage.tsx',
    replacements: [
      [
        `  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_SHELL,`,
        `  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_HEADER,
  FINELY_OS_MODAL_SHELL,`,
      ],
      [
        `} from '../../features/os/finelyOsLightUi';`,
        `} from '../../features/os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../../features/os/FinelyOsModalCloseButton';`,
      ],
      [
        `                  <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
                    <div className="min-w-0">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Parse overview</div>
                      <h2 id="parse-overview-title" className={\`mt-1 \${FINELY_OS_ENTITY_TITLE} truncate\`}>
                        {selectedReport.filename}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setParseOverviewOpen(false)}
                      className="shrink-0 rounded-full p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>`,
        `                  <div className={FINELY_OS_MODAL_HEADER}>
                    <div className="min-w-0">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Parse overview</div>
                      <h2 id="parse-overview-title" className={\`mt-1 \${FINELY_OS_ENTITY_TITLE} truncate\`}>
                        {selectedReport.filename}
                      </h2>
                    </div>
                    <FinelyOsModalCloseButton onClick={() => setParseOverviewOpen(false)} />
                  </div>`,
      ],
    ],
  },
];

let changed = 0;
for (const { file, replacements } of patches) {
  const abs = path.join(root, file);
  if (!fs.existsSync(abs)) {
    console.warn('skip missing', file);
    continue;
  }
  let src = fs.readFileSync(abs, 'utf8');
  const before = src;
  for (const [from, to] of replacements) {
    if (typeof from === 'string') {
      if (!src.includes(from)) {
        console.warn(`pattern not found in ${file}`);
        continue;
      }
      src = src.replace(from, to);
    } else {
      src = src.replace(from, to);
    }
  }
  if (src !== before) {
    fs.writeFileSync(abs, src);
    changed++;
    console.log('patched', file);
  }
}
console.log('done', changed, 'files');
