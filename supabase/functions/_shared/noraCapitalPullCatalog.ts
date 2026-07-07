/** Finely Cred → Nora Capital pull API catalog + path allow rules. */

export const NORA_PULL_OPERATIONS = {
  'pull.dossier': {
    title: 'Get one funding dossier',
    method: 'GET' as const,
    pathTemplate: '/v1/partners/finelycred/dossiers/{exportId}',
    noraMustImplement: true,
    finelyAction: 'pull.dossier',
    args: ['exportId'],
  },
  'pull.dossiers': {
    title: 'List dossiers for client/partner',
    method: 'GET' as const,
    pathTemplate: '/v1/partners/finelycred/dossiers?clientId=&partnerId=&limit=20',
    noraMustImplement: true,
    finelyAction: 'pull.dossiers',
    args: ['clientId?', 'partnerId?', 'limit?'],
  },
  'pull.client_status': {
    title: 'Finely client registration status on Nora',
    method: 'GET' as const,
    pathTemplate: '/v1/partners/finelycred/clients/status?clientId=',
    noraMustImplement: true,
    finelyAction: 'pull.client_status',
    args: ['clientId'],
  },
  'pull.crm_profile': {
    title: 'CRM client profile snapshot (Nora registry)',
    method: 'GET' as const,
    pathTemplate: '/v1/partners/finelycred/clients/profile?clientId=',
    noraMustImplement: true,
    finelyAction: 'pull.crm_profile',
    args: ['clientId'],
  },
  'pull.application': {
    title: 'Funding application by id',
    method: 'GET' as const,
    pathTemplate: '/v1/applications/{applicationId}',
    noraMustImplement: 'optional — expose when applications API exists',
    finelyAction: 'pull.application',
    args: ['applicationId'],
  },
  'pull.submission_status': {
    title: 'Lender submission status',
    method: 'GET' as const,
    pathTemplate: '/v1/submissions/{submissionId}',
    noraMustImplement: 'optional',
    finelyAction: 'pull.submission_status',
    args: ['submissionId'],
  },
} as const;

/** Prefix allowlist — paths must start with one of these (after safePath). */
export const NORA_PULL_PATH_PREFIXES = [
  '/ping',
  '/health',
  '/v1/ping',
  '/v1/leads',
  '/v1/applications',
  '/v1/offers',
  '/v1/submissions',
  '/v1/partners/finelycred/webhook',
  '/v1/partners/finelycred/dossiers',
  '/v1/partners/finelycred/clients/status',
  '/v1/partners/finelycred/clients/profile',
];

export function isNoraPathAllowed(path: string, extraExact?: Set<string>): boolean {
  const exact = extraExact ?? new Set<string>();
  if (exact.has(path)) return true;
  return NORA_PULL_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(prefix));
}

export function parseNoraJsonBody(raw: string, contentType: string): unknown {
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('json') || raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
    try {
      return JSON.parse(raw);
    } catch {
      return { raw };
    }
  }
  return { raw };
}
