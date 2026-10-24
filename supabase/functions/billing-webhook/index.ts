// Verified payment webhook. Entitlements change only here, after the provider's signature checks out.
import { createClient } from 'npm:@supabase/supabase-js@2';

import { verifyStripeSignature } from './signature.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method_not_allowed', { status: 405 });
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!secret) return new Response(JSON.stringify({ error: 'webhook_not_configured' }), { status: 501 });

  const raw = await req.text();
  if (!(await verifyStripeSignature(raw, req.headers.get('Stripe-Signature'), secret))) {
    return new Response(JSON.stringify({ error: 'invalid_signature' }), { status: 400 });
  }

  const event = JSON.parse(raw);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const obj = event.data?.object ?? {};

  if (event.type === 'checkout.session.completed' && obj.mode === 'subscription' && obj.client_reference_id) {
    await admin.from('subscriptions').update({
      plan: 'family_monthly',
      status: 'active',
      provider: 'stripe',
      provider_customer_id: obj.customer,
      provider_subscription_id: obj.subscription,
      updated_at: new Date().toISOString(),
    }).eq('parent_id', obj.client_reference_id);
  } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const deleted = event.type === 'customer.subscription.deleted';
    const status = deleted ? 'canceled' : (['active', 'trialing', 'past_due', 'canceled', 'incomplete'].includes(obj.status) ? obj.status : 'incomplete');
    await admin.from('subscriptions').update({
      plan: deleted || status === 'canceled' ? 'free' : 'family_monthly',
      status,
      current_period_end: obj.current_period_end ? new Date(obj.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: Boolean(obj.cancel_at_period_end),
      updated_at: new Date().toISOString(),
    }).eq('provider_subscription_id', obj.id);
  }
  return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
