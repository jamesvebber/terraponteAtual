/**
 * One-time script to create TerraPonte products and prices in Stripe.
 * Run with: node scripts/stripe-setup.mjs
 */

const STRIPE_SECRET_KEY = 'sk_test_51TMTVMKUpjZIh8bEgWpwWo3QQQRsYghnhyDmnSAzxKV5DF30vAqHuamEwGqYG3g9N4d5E7GLXBDOK0ppHkuSKeRG002fQC1AA0';

const plans = [
  { id: 'prata',     name: 'TerraPonte Prata',     amount: 1990,  recurring: false },
  { id: 'ouro',      name: 'TerraPonte Ouro',      amount: 3990,  recurring: false },
  { id: 'essencial', name: 'TerraPonte Essencial',  amount: 14900, recurring: true },
  { id: 'business',  name: 'TerraPonte Business',   amount: 29900, recurring: true },
  { id: 'master',    name: 'TerraPonte Master',     amount: 59900, recurring: true },
];

async function stripePost(endpoint, body) {
  const res = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body).toString(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Stripe error: ${JSON.stringify(err)}`);
  }
  return res.json();
}

async function main() {
  console.log('🚀 Creating Stripe products and prices for TerraPonte...\n');
  
  const priceIds = {};

  for (const plan of plans) {
    console.log(`Creating product: ${plan.name}...`);
    
    // Create product
    const product = await stripePost('products', {
      name: plan.name,
      'metadata[plan_id]': plan.id,
    });

    // Create price
    const priceParams = {
      product: product.id,
      currency: 'brl',
      unit_amount: plan.amount.toString(),
      'metadata[plan_id]': plan.id,
    };

    if (plan.recurring) {
      priceParams['recurring[interval]'] = 'month';
    }

    const price = await stripePost('prices', priceParams);
    priceIds[plan.id] = price.id;
    
    console.log(`  ✅ ${plan.name} → Price ID: ${price.id}`);
  }

  console.log('\n🎉 Done! Here are your Price IDs:\n');
  console.log(JSON.stringify(priceIds, null, 2));
  console.log('\n📋 Copy the JSON above and paste it when prompted.');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
