// Public: is the paid plan open? Lets the pricing page show "Choose Family" only when checkout works.
// Reveals no secrets, only whether they are set.
Deno.serve((req) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  const open = Boolean(Deno.env.get('DODO_PAYMENTS_API_KEY') && Deno.env.get('DODO_PRODUCT_FAMILY_MONTHLY') && Deno.env.get('DODO_PAYMENTS_WEBHOOK_KEY'));
  return new Response(JSON.stringify({ open, provider: 'dodo', test_mode: Deno.env.get('DODO_PAYMENTS_ENVIRONMENT') === 'test_mode' }), { headers });
});
