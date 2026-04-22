import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  // Can be called via cron job from Supabase (pg_net) or external cron services
  const base44 = createClientFromRequest(req);
  
  // Optional security: we could require a CRON_SECRET header to ensure only authorized callers can run it
  // const authHeader = req.headers.get('Authorization');
  // if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) ...

  const now = new Date().toISOString();

  try {
    // We list active ads
    // Note: in a very large DB, we should paginate or use a direct SQL RPC, but since base44 entities are the abstraction here,
    // we fetch active listings. If there are thousands, we should ideally filter by ad_expiry < now.
    // Assuming base44 filter allows inequalities:
    
    // We fetch all active ads that have an expiration date
    const activeAds = await base44.asServiceRole.entities.Listing.filter({ status: 'active' });
    
    let expiredCount = 0;
    const updatePromises = [];

    for (const ad of activeAds) {
      if (ad.ad_expiry && ad.ad_expiry < now) {
        // Expire it
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
