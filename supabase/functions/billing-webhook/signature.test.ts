import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyStripeSignature } from './signature';

const secret = 'whsec_test';
const body = JSON.stringify({ type: 'checkout.session.completed' });
const sign = (t: number, payload = body, key = secret) => `t=${t},v1=${createHmac('sha256', key).update(`${t}.${payload}`).digest('hex')}`;

describe('payment webhook signature', () => {
  const now = 1_800_000_000_000;
  const t = Math.floor(now / 1000);
  it('accepts a valid, fresh signature', async () => {
    expect(await verifyStripeSignature(body, sign(t), secret, 300, now)).toBe(true);
  });
  it('rejects a tampered payload', async () => {
    expect(await verifyStripeSignature(body.replace('completed', 'expired'), sign(t), secret, 300, now)).toBe(false);
  });
  it('rejects the wrong secret, missing header and stale timestamps', async () => {
    expect(await verifyStripeSignature(body, sign(t, body, 'other'), secret, 300, now)).toBe(false);
    expect(await verifyStripeSignature(body, null, secret, 300, now)).toBe(false);
    expect(await verifyStripeSignature(body, sign(t - 3600), secret, 300, now)).toBe(false);
  });
});
