// Dodo Payments webhook. Plans change only here, after the signature checks out.
// Configure in Dodo: Developer → Webhooks → endpoint
//   https://ahokskmczlkhsppzqcuk.supabase.co/functions/v1/billing-webhook
// and store its signing secret as DODO_PAYMENTS_WEBHOOK_KEY.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

import { verifyStandardWebhook } from './signature.ts';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

type Sub = {
  subscription_id?: string;
  status?: string;
  next_billing_date?: string | null;
  cancel_at_next_billing_date?: boolean;
  metadata?: Record<string, unknown> | null;
  customer?: { customer_id?: string; email?: string } | null;
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const secret = Deno.env.get('DODO_PAYMENTS_WEBHOOK_KEY');
  if (!secret) return json(501, { error: 'webhook_not_configured' });

  const raw = await req.text();
  const ok = await verifyStandardWebhook(raw, {
    id: req.headers.get('webhook-id'),
    timestamp: req.headers.get('webhook-timestamp'),
    signature: req.headers.get('webhook-signature'),
  }, secret);
  if (!ok) return json(400, { error: 'invalid_signature' });

  const event = JSON.parse(raw) as { type?: string; data?: Sub };
  const type = event.type ?? '';
  const d = event.data ?? {};
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  // Idempotency: Dodo retries deliveries; process each webhook-id once.
  const { error: dupErr } = await admin.from('billing_webhook_events').insert({ id: req.headers.get('webhook-id'), event_type: type, provider: 'dodo' });
  if (dupErr) {
    if (dupErr.code === '23505') return json(200, { received: true, duplicate: true });
    return json(500, { error: 'store_failed' });
  }

  if (!type.startsWith('subscription.') || !d.subscription_id) return json(200, { received: true, ignored: true });

  const periodEnd = d.next_billing_date ? new Date(d.next_billing_date) : null;
  const paidUntilFuture = periodEnd !== null && periodEnd.getTime() > Date.now();
  let plan: 'free' | 'family_monthly' = 'family_monthly';
  let status: 'active' | 'past_due' | 'canceled' | 'incomplete' = 'active';
  let cancelAtEnd = Boolean(d.cancel_at_next_billing_date);

  const kind = type === 'subscription.updated' ? `subscription.${d.status ?? 'updated'}` : type;
  switch (kind) {
    case 'subscription.active':
    case 'subscription.renewed':
    case 'subscription.unpaused':
    case 'subscription.plan_changed':
      break;
    case 'subscription.past_due':
    case 'subscription.on_hold':
    case 'subscription.paused':
      status = 'past_due';
      break;
    case 'subscription.failed':
      plan = 'free'; status = 'incomplete';
      break;
    case 'subscription.cancelled':
      // Access continues to the end of the paid month.
      status = 'canceled'; cancelAtEnd = true; plan = paidUntilFuture ? 'family_monthly' : 'free';
      break;
    case 'subscription.expired':
      plan = 'free'; status = 'canceled';
      break;
    default:
      return json(200, { received: true, ignored: true });
  }

  const row = {
    plan,
    status,
    provider: 'dodo',
    provider_subscription_id: d.subscription_id,
    provider_customer_id: d.customer?.customer_id ?? null,
    provider_status: d.status ?? type,
    current_period_end: periodEnd ? periodEnd.toISOString() : null,
    cancel_at_period_end: cancelAtEnd,
    updated_at: new Date().toISOString(),
  };

  const parentId = typeof d.metadata?.parent_id === 'string' ? d.metadata.parent_id : null;
  let res;
  if (parentId) {
    res = await admin.from('subscriptions').upsert({ parent_id: parentId, ...row }, { onConflict: 'parent_id' }).select('parent_id');
  } else {
    res = await admin.from('subscriptions').update(row).eq('provider_subscription_id', d.subscription_id).select('parent_id');
  }
  if (res.error) return json(500, { error: 'update_failed' });
  if (!res.data?.length) return json(200, { received: true, unmatched: true });
  await admin.from('audit_logs').insert({ actor_id: null, action: `billing.${type}`, target_type: 'parent', target_id: res.data[0].parent_id, detail: { subscription_id: d.subscription_id, plan, status } });
  return json(200, { received: true });
});
