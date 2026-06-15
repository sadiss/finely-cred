/** Deploy environment detection (Phase 45). */
export type DeployEnvironment = 'local' | 'staging' | 'production';

export function getDeployEnvironment(): DeployEnvironment {
  if (typeof window === 'undefined') return 'local';
  const host = window.location.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return 'local';
  if (host.includes('staging') || host.includes('preview') || host.includes('vercel.app')) return 'staging';
  return 'production';
}

export function getDeployEnvironmentLabel(): string {
  const env = getDeployEnvironment();
  if (env === 'local') return 'Local dev';
  if (env === 'staging') return 'Staging';
  return 'Production';
}
