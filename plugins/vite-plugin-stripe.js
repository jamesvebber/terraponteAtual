/**
 * Vite plugin that adds a /stripe/create-checkout-session endpoint.
 * This runs server-side inside the Vite dev server so the Stripe secret key
 * is never exposed to the browser.
 */
export default function stripePlugin() {
  return {
    name: 'vite-plugin-stripe',
    configureServer(server) {
      server.middlewares.use('/stripe/create-checkout-session', async (req, res) => {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') { res.end(); return; }
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { priceId, planId, customerEmail, successUrl, cancelUrl } = JSON.parse(body);
            if (!priceId) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'priceId is required' }));
              return;
            }

            const SK = process.env.VITE_STRIPE_SECRET_KEY || 'sk_test_51TMTVMKUpjZIh8bEgWpwWo3QQQRsYghnhyDmnSAzxKV5DF30vAqHuamEwGqYG3g9N4d5E7GLXBDOK0ppHkuSKeRG002fQC1AA0';

            // Determine mode based on plan type (one-time vs subscription)
            const isSubscription = ['essencial', 'business', 'master'].includes(planId);

            const params = new URLSearchParams();
            params.append('mode', isSubscription ? 'subscription' : 'payment');
            params.append('line_items[0][price]', priceId);
            params.append('line_items[0][quantity]', '1');
            params.append('success_url', successUrl || `${req.headers.origin || 'http://localhost:5173'}/planos?success=true&plan=${planId}`);
            params.append('cancel_url', cancelUrl || `${req.headers.origin || 'http://localhost:5173'}/planos?cancelled=true`);
            if (customerEmail) params.append('customer_email', customerEmail);
            params.append('metadata[plan_id]', planId || '');

            const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${SK}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: params.toString(),
            });

            const session = await stripeRes.json();
            if (!stripeRes.ok) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: session.error?.message || 'Stripe error' }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ url: session.url, sessionId: session.id }));
          } catch (err) {
            console.error('[Stripe Plugin] Error:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    }
  };
}
