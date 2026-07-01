import type { CmoIntegrationHealth } from '../../domain/cmoPhase3';
import { saveCmoIntegrationHealth } from '../../data/cmoPhase3Repo';

const stamp = () => new Date().toISOString();

export function checkCmoIntegrationHealth(): CmoIntegrationHealth[] {
  const now = stamp();
  const checks: CmoIntegrationHealth[] = [
    { id: 'health_lead_intel', integration: 'lead_intel', status: 'partial', message: 'Requires wiring to saved Lead Intel/CRM prospect selections.', lastCheckedAt: now, requiredNextStep: 'Wire selected prospect IDs into CMO audience snapshots.' },
    { id: 'health_crm', integration: 'crm', status: 'partial', message: 'CRM updates should be routed through existing prospect repo/task patterns.', lastCheckedAt: now, requiredNextStep: 'Add CMO notes/stage updates after campaign interactions.' },
    { id: 'health_comms', integration: 'comms_studio', status: 'partial', message: 'Comms drafts can be created; send gates must be enforced before launch.', lastCheckedAt: now, requiredNextStep: 'Add CMO copy/compliance gate to template save/send.' },
    { id: 'health_media', integration: 'media_studio', status: 'partial', message: 'Media project handoff should create projects/scenes from playbook assets.', lastCheckedAt: now, requiredNextStep: 'Add create Media project action from CMO playbook.' },
    { id: 'health_scheduler', integration: 'scheduler', status: 'partial', message: 'Manual scheduler queue is preferred before external social publishing.', lastCheckedAt: now, requiredNextStep: 'Use manual queue first; external adapters later.' },
    { id: 'health_analytics', integration: 'analytics', status: 'partial', message: 'Events need to flow back into channel model and experiments.', lastCheckedAt: now, requiredNextStep: 'Emit leads, clicks, bookings, revenue, and reply events.' },
    { id: 'health_supabase', integration: 'supabase_sync', status: 'missing', message: 'LocalStorage is good for install; Supabase sync is needed for multi-admin operations.', lastCheckedAt: now, requiredNextStep: 'Apply migration and edge functions when ready.' },
    { id: 'health_social_publishers', integration: 'social_publishers', status: 'missing', message: 'External publishers should stay disabled until credentials/scopes are configured.', lastCheckedAt: now, requiredNextStep: 'Connect official provider APIs only, approval-first.' },
    { id: 'health_site_watch', integration: 'site_watch', status: 'partial', message: 'Browser page watch exists; repo-wide audit should run in CI.', lastCheckedAt: now, requiredNextStep: 'Run Python audit in Cursor/CI after page changes.' },
    { id: 'health_coowner', integration: 'coowner', status: 'partial', message: 'CMO staff should eventually route strategic language through CoOwner/AI Gateway.', lastCheckedAt: now, requiredNextStep: 'Bridge staff prompts to callAiGateway or existing CoOwner command center.' },
  ];
  return saveCmoIntegrationHealth(checks);
}
