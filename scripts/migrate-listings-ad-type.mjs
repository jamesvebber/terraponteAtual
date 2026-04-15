/**
 * Script de migração para atualizar anúncios existentes com campos de tipo.
 * 
 * Este script:
 * 1. Busca todos os SellerProfiles com plan_type
 * 2. Para cada vendedor, busca seus anúncios ativos
 * 3. Atualiza cada anúncio com:
 *    - ad_type: baseado no plan_type do vendedor (herança automática)
 *    - ad_expiry: null para bronze, 30 dias para prata/ouo
 *    - is_upgraded: true para prata/ouo
 *    - whatsapp_dispatches_allowed: 0/1/3 baseado no tipo
 *    - whatsapp_dispatches_used: 0
 *    - views_count: 0
 *    - renewal_count: 0
 * 
 * Execute com: node scripts/migrate-listings-ad-type.mjs
 */

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

async function fetchListings(email) {
  const res = await fetch(`${API_URL}/entities/Listing/filter?created_by=${encodeURIComponent(email)}&status=active`);
  return res.json();
}

async function fetchSellerProfiles() {
  const res = await fetch(`${API_URL}/entities/SellerProfile/list`);
  return res.json();
}

async function updateListing(id, data) {
  const res = await fetch(`${API_URL}/entities/Listing/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function main() {
  console.log('🚀 Starting listing migration...\n');

  const sellerProfiles = await fetchSellerProfiles();
  console.log(`Found ${sellerProfiles.length} seller profiles`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const profile of sellerProfiles) {
    const planType = profile.plan_type || 'bronze';
    const email = profile.owner_email;

    if (!email) {
      console.log(`⚠️ Skipping profile ${profile.id} - no owner_email`);
      skippedCount++;
      continue;
    }

    console.log(`\n📋 Processing seller: ${email} (plan: ${planType})`);

    const listings = await fetchListings(email);
    
    if (listings.length === 0) {
      console.log(`  ✅ No listings found`);
      continue;
    }

    console.log(`  Found ${listings.length} active listings`);

    for (const listing of listings) {
      const currentAdType = listing.ad_type;

      if (currentAdType && currentAdType !== 'bronze') {
        console.log(`  ⏭️ Skipping listing ${listing.id} - already has ad_type: ${currentAdType}`);
        skippedCount++;
        continue;
      }

      let adType = planType;
      if (!['prata', 'ouro'].includes(adType)) {
        adType = 'bronze';
      }

      const adExpiry = adType !== 'bronze'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const whatsappDispatchesAllowed = adType === 'prata' ? 1 : adType === 'ouro' ? 3 : 0;
      const isUpgraded = adType !== 'bronze';

      try {
        await updateListing(listing.id, {
          ad_type: adType,
          ad_expiry: adExpiry,
          is_upgraded: isUpgraded,
          whatsapp_dispatches_allowed: whatsappDispatchesAllowed,
          whatsapp_dispatches_used: listing.whatsapp_dispatches_used || 0,
          views_count: listing.views_count || 0,
          renewal_count: listing.renewal_count || 0
        });
        
        console.log(`  ✅ Migrated listing "${listing.title}" → ${adType}`);
        migratedCount++;
      } catch (error) {
        console.log(`  ❌ Error migrating listing ${listing.id}:`, error.message);
      }
    }
  }

  console.log(`\n🎉 Migration complete!`);
  console.log(`   Migrated: ${migratedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
}

main().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
