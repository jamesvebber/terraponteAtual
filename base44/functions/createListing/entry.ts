import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PLAN_LIMITS = {
  bronze:    { maxActive: 1 },
  prata:     { maxActive: 2 },
  ouro:      { maxActive: null },
  essencial: { maxActive: 10 },
  business:  { maxActive: null },
  master:    { maxActive: null },
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { listingData } = body;

  if (!listingData) return Response.json({ error: 'listingData is required' }, { status: 400 });

  // Fetch seller profile to check plan
  const profiles = await base44.asServiceRole.entities.SellerProfile.filter({ owner_email: user.email });
  const profile = profiles[0];
  const planType = profile?.plan_type || 'bronze';
  const limits = PLAN_LIMITS[planType] || PLAN_LIMITS.bronze;

  // Check active listing limit
  if (limits.maxActive !== null) {
    const activeListings = await base44.asServiceRole.entities.Listing.filter({
      status: 'active',
      created_by: user.email,
    });
    if (activeListings.length >= limits.maxActive) {
      return Response.json({
        error: 'PLAN_LIMIT_EXCEEDED',
        limit: limits.maxActive,
        plan: planType,
      }, { status: 403 });
    }
  }

  // Create the listing
  const listing = await base44.entities.Listing.create(listingData);

  return Response.json({ listing });
});