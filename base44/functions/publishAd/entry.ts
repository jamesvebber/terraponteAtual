import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

const MATRIX = {
  gratis: { limit: 2, days: 7, overagePriceId: 'price_1TP5cfKUpjZIh8bET8ovHqqZ' },
  bronze: { limit: 6, days: 15, overagePriceId: 'price_1TP5cgKUpjZIh8bEpVagRJ4h' },
  prata: { limit: 15, days: 30, overagePriceId: 'price_1TP5cgKUpjZIh8bEwsyGg7H3' },
  ouro: { limit: 999999, days: 60, overagePriceId: null }
};

Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'OPTIONS') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const { listingData, successUrl, cancelUrl, payOverage } = body;
  if (!listingData) {
    return new Response(JSON.stringify({ error: "Missing listingData" }), {
      status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // 1. Identify active plan
  const profiles = await base44.asServiceRole.entities.SellerProfile.filter({ "owner_email": user.email });
  const profile = profiles && profiles.length > 0 ? profiles[0] : null;
  let planType = profile?.plan_type || 'gratis';

  if (['essencial', 'business', 'master'].includes(planType)) planType = 'ouro';
  if (!MATRIX[planType]) planType = 'gratis';

  const rules = MATRIX[planType];

  // 2. Count active ads
  const activeAds = await base44.asServiceRole.entities.Listing.filter({ created_by: user.email, status: 'active' });
  const numActive = activeAds.length;

  if (numActive >= rules.limit) {
    if (payOverage && rules.overagePriceId && STRIPE_SECRET_KEY) {
      try {
        const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            "mode": "payment",
            "payment_method_types": "card,pix",
            "customer_email": user.email,
            "line_items[0][price]": rules.overagePriceId,
            "line_items[0][quantity]": "1",
            "metadata[flow]": "ad_overage_create",
            "metadata[listingData]": JSON.stringify(listingData),
            "success_url": successUrl || "https://terraponte.app/marketplace",
            "cancel_url": cancelUrl || "https://terraponte.app/vender",
          }).toString(),
        });
        const sessionData = await sessionRes.json();
        if (sessionData.error) throw new Error(sessionData.error.message);

        return new Response(JSON.stringify({ requirePayment: true, checkoutUrl: sessionData.url, sessionId: sessionData.id }), {
          status: 200, headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500, headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }
        });
      }
    } else {
      return new Response(JSON.stringify({
        error: "LIMIT_REACHED",
        message: "Você atingiu o limite da sua franquia de anúncios ativos.",
        currentPlan: planType,
        activeCount: numActive,
        limit: rules.limit,
        overagePriceId: rules.overagePriceId,
      }), { status: 403, headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } });
    }
  }

  const expiryDate = new Date(Date.now() + rules.days * 24 * 60 * 60 * 1000).toISOString();

  // 3. Create ad
  const newListing = await base44.asServiceRole.entities.Listing.create({
    ...listingData,
    created_by: user.email,
    status: 'active',
    ad_expiry: expiryDate
  });

  return new Response(JSON.stringify({ success: true, listing: newListing }), {
    status: 200, headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }
  });
});