import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

// Plano Grátis: 2 ads / 7 dias / excedente R$ 5,99
// Plano Bronze: R$ 14,90/mês / 6 ads / 15 dias / excedente R$ 4,99
// Plano Prata:  R$ 29,90/mês / 15 ads / 30 dias / excedente R$ 3,99
// Plano Ouro:   R$ 49,90/mês / ilimitado / 60 dias / sem excedente
const MATRIX = {
  gratis: { limit: 2,      days: 7,  overagePriceId: 'price_1TP5cfKUpjZIh8bET8ovHqqZ' }, // R$ 5,99
  bronze: { limit: 6,      days: 15, overagePriceId: 'price_1TP5cgKUpjZIh8bEpVagRJ4h' }, // R$ 4,99
  prata:  { limit: 15,     days: 30, overagePriceId: 'price_1TP5cgKUpjZIh8bEwsyGg7H3' }, // R$ 3,99
  ouro:   { limit: 999999, days: 60, overagePriceId: null }
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

  const { listingId, successUrl, cancelUrl, payOverage } = body;
  if (!listingId) {
    return new Response(JSON.stringify({ error: "Missing listingId" }), {
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
            "metadata[flow]": "ad_overage_republish",
            "metadata[listingId]": listingId,
            "success_url": successUrl || "https://terraponte.app/meus-anuncios",
            "cancel_url": cancelUrl || "https://terraponte.app/meus-anuncios",
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

  // 3. Update the ad to republish it
  try {
    const listing = await base44.asServiceRole.entities.Listing.get(listingId);
    if (!listing || listing.created_by !== user.email) {
      return new Response(JSON.stringify({ error: "Listing not found or unauthorized" }), { status: 404, headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } });
    }

    const updatedListing = await base44.asServiceRole.entities.Listing.update(listingId, {
      status: 'active',
      ad_expiry: expiryDate,
      renewal_count: (listing.renewal_count || 0) + 1
    });

    return new Response(JSON.stringify({ success: true, listing: updatedListing }), {
      status: 200, headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to republish listing" }), {
      status: 500, headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }
    });
  }
});