import React from 'react';
import { AlertTriangle, Upload } from 'lucide-react';
import { legacyPendingReportFilename } from '../../lib/legacyPendingReport';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

/** Shown when a legacy-imported report row exists but the file bytes were never re-attached. */
export function LegacyPendingReportNotice({
  filename,
  rawBlobRef,
  variant = 'admin',
}: {
  filename: string;
  rawBlobRef: string;
  variant?: 'partner' | 'admin';
}) {
  const archiveName = legacyPendingReportFilename(rawBlobRef) || filename;

  return (
    <div className={`${FINELY_OS_NOTICE_WARN} space-y-3`}>
      <div className="inline-flex items-center gap-2 font-semibold">
        <AlertTriangle size={16} />
        Legacy credit report — file needs re-upload
      </div>
      <p className={FINELY_OS_ENTITY_BODY}>
        {variant === 'admin'
          ? 'This partner was migrated from the previous Finely Cred site. We saved the report filename and metadata, but the actual file is not in storage yet — so parsing and Credit Intelligence cannot run until you upload the HTML/PDF again.'
          : 'Your credit report was imported from our previous system. Re-upload the same export (HTML preferred) so we can parse tradelines, collections, and negatives.'}
      </p>
      <div className="flex flex-wrap gap-2">
        <span className={finelyOsStatusChip('warn')}>
          Archive file: <span className={`font-mono normal-case ${FINELY_OS_ENTITY_VALUE}`}>{archiveName}</span>
        </span>
        <span className={finelyOsStatusChip('warn')}>
          <Upload size={12} className="inline mr-1" />
          Use the uploader above with IdentityIQ / MyScoreIQ HTML export
        </span>
      </div>
    </div>
  );
}
