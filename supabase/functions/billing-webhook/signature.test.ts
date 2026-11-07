import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyStandardWebhook } from './signature';

// Secret in Dodo's dashboard format: whsec_ + base64 key.
const key = Buffer.from('heir-of-wisdom-test-key-32-bytes!');
const secret = `whsec_${key.toString('base64')}`;
const body = JSON.stringify({ type: 'subscription.active', data: { subscription_id: 'sub_1' } });
const id = 'msg_2abc';
// Independent reference implementation of the Standard Webhooks spec.
const sign = (ts: string, payload = body, k = key) => `v1,${createHmac('sha256', k).update(`${id}.${ts}.${payload}`).digest('base64')}`;

describe('Dodo (Standard Webhooks) signature', () => {
  const now = 1_800_000_000_000;
  const ts = String(Math.floor(now / 1000));
  const h = (signature: string | null, t = ts, i: string | null = id) => ({ id: i, timestamp: t, signature });

  it('accepts a valid, fresh signature, including when several are listed', async () => {
    expect(await verifyStandardWebhook(body, h(sign(ts)), secret, 300, now)).toBe(true);
    expect(await verifyStandardWebhook(body, h(`v1,AAAA ${sign(ts)}`), secret, 300, now)).toBe(true);
  });
  it('rejects a tampered payload or a changed message id', async () => {
    expect(await verifyStandardWebhook(body.replace('active', 'expired'), h(sign(ts)), secret, 300, now)).toBe(false);
    expect(await verifyStandardWebhook(body, h(sign(ts), ts, 'msg_other'), secret, 300, now)).toBe(false);
  });
  it('rejects the wrong secret, missing headers and stale timestamps', async () => {
    expect(await verifyStandardWebhook(body, h(sign(ts, body, Buffer.from('another-key'))), secret, 300, now)).toBe(false);
    expect(await verifyStandardWebhook(body, h(null), secret, 300, now)).toBe(false);
    expect(await verifyStandardWebhook(body, h(sign(ts), ts, null), secret, 300, now)).toBe(false);
    const old = String(Number(ts) - 3600);
    expect(await verifyStandardWebhook(body, h(sign(old), old), secret, 300, now)).toBe(false);
  });
});
