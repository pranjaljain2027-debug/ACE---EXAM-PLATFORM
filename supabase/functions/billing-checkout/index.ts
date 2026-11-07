// Parent-only Dodo Payments checkout and customer portal.
// Needs a signed-in parent with the parent gate open.
// Secrets (Supabase → Edge Functions → Secrets):
//   DODO_PAYMENTS_API_KEY           API key from Dodo (Developer → API Keys)
//   DODO_PRODUCT_FAMILY_MONTHLY     product id of the $14/month subscription (pdt_...)
//   DODO_PAYMENTS_ENVIRONMENT       live_mode or test_mode (default live_mode)
// Returns 501 until the first two are set.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const ALLOWED = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://www.hierofwisdom.me,https://hierofwisdom.me,http://localhost:3000')
  .split(',')
  .map((s) => s.trim());

function cors(origin: string | null) {
  const o = origin && ALLOWED.includes(origin) ? origin : ALLOWED[0];
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = { ...cors(origin), 'Content-Type': 'application/json' };
  const out = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return out(405, { error: 'method_not_allowed' });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false },
  });
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return out(401, { error: 'not_authenticated' });
  const { data: gate } = await supabase.rpc('gate_status');
  if (!gate?.unlocked) return out(403, { error: 'parent_gate_required' });

  const key = Deno.env.get('DODO_PAYMENTS_API_KEY');
  const product = Deno.env.get('DODO_PRODUCT_FAMILY_MONTHLY');
  if (!key || !product) return out(501, { configured: false, error: 'checkout_not_configured' });
  const api = Deno.env.get('DODO_PAYMENTS_ENVIRONMENT') === 'test_mode' ? 'https://test.dodopayments.com' : 'https://live.dodopayments.com';
  const base = origin && ALLOWED.includes(origin) ? origin : ALLOWED[0];
  const auth = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

  let body: { action?: string } = {};
  try { body = await req.json(); } catch { /* empty body means checkout */ }

  if (body.action === 'portal') {
    const { data: sub } = await supabase.rpc('get_billing');
    const customer = sub?.provider_customer_id;
    if (!customer) return out(404, { error: 'no_subscription' });
    const res = await fetch(`${api}/customers/${encodeURIComponent(customer)}/customer-portal/session?return_url=${encodeURIComponent(`${base}/parent/billing`)}`, { method: 'POST', headers: auth });
    const r = await res.json().catch(() => ({}));
    if (!res.ok || !r.link) return out(502, { error: 'provider_error' });
    return out(200, { configured: true, url: r.link });
  }

  const res = await fetch(`${api}/checkouts`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      product_cart: [{ product_id: product, quantity: 1 }],
      customer: user.email ? { email: user.email } : undefined,
      return_url: `${base}/parent/billing?checkout=success`,
      cancel_url: `${base}/parent/billing?checkout=cancelled`,
      metadata: { parent_id: user.id },
    }),
  });
  const r = await res.json().catch(() => ({}));
  if (!res.ok || !r.checkout_url) return out(502, { error: 'provider_error', detail: r?.message ?? r?.code ?? res.status });
  return out(200, { configured: true, url: r.checkout_url });
});
