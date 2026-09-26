import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  haitianCrmBucket,
  isColdHaitianCapture,
  isOptedInHaitianCapture,
} from './haitianLeadTags';

const coldLead = {
  source: 'haitian_csv_import' as const,
  offer: 'haitian_credit_kit' as const,
  funnelId: 'kreyol_companion',
  funnelPath: '/free-kreyol-guide',
  interest: 'haitian_community',
  consentToContact: false,
  consentEmailMarketing: false,
};

describe('haitian lead temperature', () => {
  it('keeps an unconsented CSV row in the cold bucket even with origin tags', () => {
    const tags = ['cold', 'temperature:cold', 'source:haitian_csv_import', 'haitian-community'];
    assert.equal(isColdHaitianCapture(coldLead, tags), true);
    assert.equal(isOptedInHaitianCapture(coldLead, tags), false);
    assert.equal(haitianCrmBucket(coldLead, tags), 'cold');
  });

  it('moves a consented row with hot tags out of cold even if cold tags were not stripped yet', () => {
    const lead = { ...coldLead, source: 'lead_magnet' as const, consentToContact: true, consentEmailMarketing: true };
    const tags = ['cold', 'temperature:cold', 'source:haitian_csv_import', 'hot-opt-in', 'temperature:hot'];
    assert.equal(isColdHaitianCapture(lead, tags), false);
    assert.equal(isOptedInHaitianCapture(lead, tags), true);
    assert.equal(haitianCrmBucket(lead, tags), 'opted_in');
  });

  it('counts an organic Kreyòl opt-in as opted-in without a CSV origin tag', () => {
    const lead = {
      ...coldLead,
      source: 'lead_magnet' as const,
      consentToContact: true,
      consentEmailMarketing: false,
    };
    assert.equal(haitianCrmBucket(lead, ['haitian-community']), 'opted_in');
  });

  it('does not treat a generic cold tag as a Haitian CSV row', () => {
    const lead = {
      ...coldLead,
      source: 'contact' as const,
      offer: 'general_inquiry' as const,
      funnelId: undefined,
      funnelPath: '/contact',
      interest: 'hello',
    };
    assert.equal(isColdHaitianCapture(lead, ['cold']), false);
    assert.equal(haitianCrmBucket(lead, ['cold']), null);
  });
});
