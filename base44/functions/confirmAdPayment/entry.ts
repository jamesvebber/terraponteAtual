import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

  if (!STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: "Stripe não configurado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const body = await req.text();
  let event;

  try {
    event = JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const listingData = JSON.parse(session.metadata?.listingData || "{}");
      const adType = session.metadata?.adType;

      if (listingData && listingData.title) {
        const listing = await base44.asServiceRole.entities.Listing.create({
          ...listingData,
          status: "active",
        });

        console.log("Listing created after payment:", listing.id);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Webhook error" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
});
