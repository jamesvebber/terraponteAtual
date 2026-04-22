import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const now = new Date().toISOString();

  try {
    const activeAds = await base44.asServiceRole.entities.Listing.filter({ status: 'active' });

    let expiredCount = 0;
    const updatePromises = [];

    for (const ad of activeAds) {
      if (ad.ad_expiry && ad.ad_expiry < now) {
        updatePromises.push(
          base44.asServiceRole.entities.Listing.update(ad.id, {
            status: 'expirado'
          })
        );
        expiredCount++;
      }
    }

    await Promise.all(updatePromises);

    return new Response(JSON.stringify({
      success: true,
      scanned: activeAds.length,
      expiredCount
    }), {
      status: 200, headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Expired ads check failed:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});