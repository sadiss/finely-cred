#!/usr/bin/env node
/** Fail if Cold/Warm/Hot/Priority-hot gates regress. Usage: npm run heat:check */
import assert from 'node:assert/strict';
import { resolveProspectHeat } from '../src/lib/prospectHeat.ts';
import { isColdDirectoryCrmRecord, isPublicOrganizationRoleInbox } from '../src/lib/coldDirectory.ts';
import { HEAT_VERSION, heatVersionForServer, nextOutreachStage } from '../src/lib/prospectOutreach.ts';
import { dryRunColdProspectImport } from '../src/lib/coldProspectImport.ts';

function heat(partial) {
  return resolveProspectHeat({
    isColdDirectory: true,
    events: [],
    publicOrgInbox: true,
    hasWebsite: true,
    laneMatched: true,
    consent: false,
    ...partial,
  });
}

const completeCold = heat({});
assert.equal(completeCold.state, 'cold');
assert.ok(completeCold.fit >= 20);
assert.equal(completeCold.intent, 0);

const click = heat({ events: ['first_party_click'] });
assert.equal(click.state, 'warm');
assert.notEqual(click.state, 'hot');

const opens = heat({ events: ['email_open', 'bot_click'] });
assert.equal(opens.state, 'cold');
assert.equal(opens.intent, 0);

const reply = heat({ events: ['positive_reply'] });
assert.equal(reply.state, 'hot');

const meeting = heat({ events: ['meeting_booked'] });
assert.equal(meeting.state, 'priority_hot');

const partnered = heat({ events: ['partnership_accepted'] });
assert.equal(partnered.state, 'priority_hot');

const opted = heat({ events: ['form_opt_in'], consent: true });
assert.equal(opted.consent, true);
assert.equal(opted.state, 'hot');

const suppressed = heat({ events: ['unsubscribe'] });
assert.equal(suppressed.state, 'suppressed');

assert.equal(isPublicOrganizationRoleInbox('info@church.org').ok, true);
assert.equal(isPublicOrganizationRoleInbox('jane.doe@gmail.com').ok, false);
assert.equal(isPublicOrganizationRoleInbox('jane.doe@church.org').ok, false);

const inbound = {
  id: 'crm_lead_1',
  kind: 'inbound_lead',
  target: 'clients',
  stage: 'new',
  source: 'lead_magnet',
  tags: ['cold-directory'],
  contact: {},
  timeline: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
assert.equal(isColdDirectoryCrmRecord(inbound), false, 'inbound must never appear in cold directory list');

const prospect = { ...inbound, id: 'crm_prospect_1', kind: 'prospect', source: 'directory_cold', tags: ['cold-directory'] };
assert.equal(isColdDirectoryCrmRecord(prospect), true);

assert.equal(heatVersionForServer(null), HEAT_VERSION);
assert.equal(heatVersionForServer(undefined), HEAT_VERSION);
assert.equal(heatVersionForServer(''), HEAT_VERSION);
assert.equal(heatVersionForServer('v1'), 'v1');

assert.equal(nextOutreachStage(undefined, 'imported'), 'cold_imported');
assert.equal(nextOutreachStage('cold_imported', 'first_party_click'), 'warm_manual_review');
assert.notEqual(nextOutreachStage('cold_imported', 'imported'), 'email_1_sent');
assert.equal(nextOutreachStage('cold_imported', 'positive_reply'), 'hot');
assert.equal(nextOutreachStage('hot', 'meeting_booked'), 'priority_hot');
assert.equal(nextOutreachStage('unsubscribed', 'positive_reply'), 'unsubscribed');

const dry = dryRunColdProspectImport([
  { organization: 'Church', website: 'https://church.org', email: 'info@church.org', lane: 'haitian_orgs' },
  { organization: 'Person', email: 'jane.doe@gmail.com', lane: 'haitian_orgs' },
  { organization: 'Dup', website: 'https://church.org', email: 'info@church.org', lane: 'haitian_orgs' },
]);
assert.equal(dry.insert, 1);
assert.ok(dry.quarantine >= 1);
assert.ok(dry.skip >= 1);

console.log('heat:check passed — cold profile stays Cold; clicks Warm; opens ignored; reply Hot; meeting Priority hot; inbound excluded; outreach cannot skip to send');
