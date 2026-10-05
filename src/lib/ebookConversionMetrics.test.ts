import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildEbookConversionSnapshot,
  hasPhoneValue,
  mergeEbookConversionLeads,
  resolveEbookFunnelId,
  type EbookConversionLead,
} from './ebookConversionMetrics';

function lead(partial: Partial<EbookConversionLead> & { id: string; createdAt: string }): EbookConversionLead {
  return {
    funnelId: resolveEbookFunnelId(partial),
    ...partial,
  };
}

describe('ebookConversionMetrics', () => {
  it('maps free-guide and free-kreyol-guide paths to funnel ids', () => {
    assert.equal(resolveEbookFunnelId({ funnelPath: '/free-guide' }), 'credit_dispute');
    assert.equal(resolveEbookFunnelId({ funnelPath: '/free-kreyol-guide/what-is-credit' }), 'kreyol_companion');
    assert.equal(resolveEbookFunnelId({ offer: 'haitian_credit_kit' }), 'kreyol_companion');
    assert.equal(resolveEbookFunnelId({ funnelId: 'partner_refer' }), 'partner_refer');
  });

  it('counts 7/14/30 windows, phone %, and featured funnels', () => {
    const now = Date.parse('2026-09-20T12:00:00.000Z');
    const leads = [
      lead({ id: '1', createdAt: '2026-09-18T12:00:00.000Z', funnelPath: '/free-guide', phone: '3055550100', utmSource: 'ig' }),
      lead({ id: '2', createdAt: '2026-09-10T12:00:00.000Z', funnelPath: '/free-kreyol-guide', phone: '3055550101' }),
      lead({ id: '3', createdAt: '2026-08-01T12:00:00.000Z', funnelPath: '/free-guide', phone: '3055550102' }),
      lead({ id: '4', createdAt: '2026-09-19T12:00:00.000Z', offer: 'debt_validation_playbook' }),
    ];
    const d7 = buildEbookConversionSnapshot(leads, 7, now);
    assert.equal(d7.total, 2);
    assert.equal(d7.freeGuide, 1);
    assert.equal(d7.kreyolGuide, 0);
    assert.equal(d7.otherMagnets, 1);
    assert.equal(d7.phonePct, 50);
    assert.equal(d7.utmRows.find((r) => r.key === 'ig')?.captures, 1);

    const d14 = buildEbookConversionSnapshot(leads, 14, now);
    assert.equal(d14.kreyolGuide, 1);
    assert.equal(d14.featuredTotal, 2);

    const d30 = buildEbookConversionSnapshot(leads, 30, now);
    assert.equal(d30.total, 3);
  });

  it('merges remote over local by id and treats 10-digit phones as present', () => {
    assert.equal(hasPhoneValue('(305) 555-0100'), true);
    assert.equal(hasPhoneValue('123'), false);
    const merged = mergeEbookConversionLeads(
      [lead({ id: 'a', createdAt: '2026-09-01T00:00:00.000Z', funnelId: 'credit_dispute' })],
      [lead({ id: 'a', createdAt: '2026-09-01T00:00:00.000Z', funnelId: 'credit_dispute', utmSource: 'fb' })],
    );
    assert.equal(merged.length, 1);
    assert.equal(merged[0]?.utmSource, 'fb');
  });
});
