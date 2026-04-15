import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

  if (!STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: "Stripe não configurado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { priceId, adType, customerEmail, listingData, successUrl, cancelUrl } = body;

  if (!priceId || !listingData || !customerEmail) {
    return new Response(JSON.stringify({ error: "Dados incompletos" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const session = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "mode": "payment",
        "payment_method_types": "card,pix",
        "customer_email": customerEmail,
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        "metadata[adType]": adType,
        "metadata[listingData]": JSON.stringify(listingData),
        "success_url": successUrl,
        "cancel_url": cancelUrl,
      }).toString(),
    });

    const sessionData = await session.json();

    if (sessionData.error) {
      return new Response(JSON.stringify({ error: sessionData.error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ url: sessionData.url, sessionId: sessionData.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Stripe error:", error);
    return new Response(JSON.stringify({ error: "Erro ao criar sessão de pagamento" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
