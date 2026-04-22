const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_51TMTVMKUpjZIh8bEgWpwWo3QQQRsYghnhyDmnSAzxKV5DF30vAqHuamEwGqYG3g9N4d5E7GLXBDOK0ppHkuSKeRG002fQC1AA0';

const plans = [
  { id: 'avulso_gratis', name: 'Anúncio Avulso (Grátis Excedente)', amount: 599, recurring: false },
  { id: 'avulso_bronze', name: 'Anúncio Avulso (Bronze Excedente)', amount: 499, recurring: false },
  { id: 'avulso_prata',  name: 'Anúncio Avulso (Prata Excedente)', amount: 399, recurring: false },
];

async function stripePost(endpoint, body) {
  const fetch = globalThis.fetch;
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
  const priceIds = {};
  for (const plan of plans) {
    const product = await stripePost('products', {
      name: plan.name,
      'metadata[plan_id]': plan.id,
    });
    const price = await stripePost('prices', {
      product: product.id,
      currency: 'brl',
      unit_amount: plan.amount.toString(),
      'metadata[plan_id]': plan.id,
    });
    priceIds[plan.id] = price.id;
  }
  console.log(JSON.stringify(priceIds));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
