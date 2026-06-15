/** Inbound Zapier / Make event map for Integration Hub (Phase 42). */

export type InboundIntegrationEvent = {
  id: string;
  label: string;
  method: 'POST';
  path: string;
  description: string;
  samplePayload: Record<string, unknown>;
};

export const INBOUND_INTEGRATION_EVENTS: InboundIntegrationEvent[] = [
  {
    id: 'inbound_lead',
    label: 'Lead capture',
    method: 'POST',
    path: '/functions/v1/finely-partner-api/leads',
    description: 'Create or update a lead from external CRM or form tool.',
    samplePayload: { email: 'lead@example.com', source: 'zapier', ref: 'campaign_q2' },
  },
  {
    id: 'inbound_meta_lead',
    label: 'Meta lead webhook',
    method: 'POST',
    path: '/functions/v1/automation-runner/hook_meta_lead',
    description: 'Meta Lead Ads → nurture + CRM pipeline.',
    samplePayload: { email: 'meta@example.com', ad_id: '123', form_id: '456' },
  },
  {
    id: 'inbound_stripe',
    label: 'Stripe checkout',
    method: 'POST',
    path: '/functions/v1/stripe/webhook',
    description: 'Purchase completed → commerce hub + partner billing.',
    samplePayload: { type: 'checkout.session.completed', id: 'cs_test_…' },
  },
  {
    id: 'inbound_nora',
    label: 'Nora Capital partner API',
    method: 'POST',
    path: '/functions/v1/nora-llc-api/capture',
    description: 'Funding partner handoff from Nora Capital stack.',
    samplePayload: { partnerId: '…', lane: 'funding', score: 680 },
  },
];
