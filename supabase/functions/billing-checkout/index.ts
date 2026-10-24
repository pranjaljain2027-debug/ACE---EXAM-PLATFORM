// Parent-only hosted checkout. Requires a signed-in parent with the parent gate open.
// Returns 501 until STRIPE_SECRET_KEY and STRIPE_PRICE_FAMILY_MONTHLY are configured.
import { createClient } from 'npm:@supabase/supabase-js@2';

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
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });

  const auth = req.headers.get('Authorization') ?? '';
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return new Response(JSON.stringify({ error: 'not_authenticated' }), { status: 401, headers });

  const { data: gate } = await supabase.rpc('gate_status');
  if (!gate?.unlocked) return new Response(JSON.stringify({ error: 'parent_gate_required' }), { status: 403, headers });

  const key = Deno.env.get('STRIPE_SECRET_KEY');
  const price = Deno.env.get('STRIPE_PRICE_FAMILY_MONTHLY');
  if (!key || !price) {
    return new Response(JSON.stringify({ configured: false, error: 'checkout_not_configured' }), { status: 501, headers });
  }

  const base = origin && ALLOWED.includes(origin) ? origin : ALLOWED[0];
  const form = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': price,
    'line_items[0][quantity]': '1',
    success_url: `${base}/parent/billing?checkout=success`,
    cancel_url: `${base}/parent/billing?checkout=cancelled`,
    client_reference_id: user.id,
    'subscription_data[metadata][parent_id]': user.id,
    allow_promotion_codes: 'false',
  });
  if (user.email) form.set('customer_email', user.email);

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  const body = await res.json();
  if (!res.ok) return new Response(JSON.stringify({ error: 'provider_error', detail: body?.error?.message }), { status: 502, headers });
  return new Response(JSON.stringify({ configured: true, url: body.url }), { status: 200, headers });
});
