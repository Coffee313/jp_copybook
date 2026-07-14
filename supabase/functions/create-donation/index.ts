const allowedOrigins = new Set([
  'https://coffee313.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000'
]);

function corsHeaders(request: Request) {
  const origin = request.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'https://coffee313.github.io',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
}

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json; charset=utf-8' }
  });
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== 'POST') return json(request, { error: 'Method not allowed' }, 405);

  const apiKey = Deno.env.get('LAVA_API_KEY');
  const offerId = Deno.env.get('LAVA_OFFER_ID');
  if (!apiKey || !offerId) return json(request, { error: 'Donation service is not configured' }, 503);

  let payload: { email?: unknown; amount?: unknown; currency?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json(request, { error: 'Invalid JSON body' }, 400);
  }

  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const amount = Number(payload.amount);
  const currency = typeof payload.currency === 'string' ? payload.currency : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(request, { error: 'A valid email is required' }, 400);
  if (!Number.isFinite(amount) || amount < 1 || amount > 100000) return json(request, { error: 'Invalid amount' }, 400);
  if (!new Set(['EUR', 'USD', 'RUB']).has(currency)) return json(request, { error: 'Unsupported currency' }, 400);

  try {
    const lavaResponse = await fetch('https://gate.lava.top/api/v3/invoice', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify({ email, offerId, currency, amount })
    });
    const invoice = await lavaResponse.json().catch(() => ({}));
    if (!lavaResponse.ok || typeof invoice.paymentUrl !== 'string') {
      console.error('Lava invoice creation failed', lavaResponse.status);
      return json(request, { error: 'Payment provider rejected the request' }, 502);
    }
    return json(request, { paymentUrl: invoice.paymentUrl });
  } catch (error) {
    console.error('Lava request failed', error instanceof Error ? error.message : 'Unknown error');
    return json(request, { error: 'Payment provider is unavailable' }, 502);
  }
});
