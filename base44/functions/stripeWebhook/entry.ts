import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const PLAN_MAP = {
  'price_1TMTcPKUpjZIh8bEpHw5lbfp': 'prata',
  'price_1TMTcQKUpjZIh8bEzssDEfHc': 'ouro',
  'price_1TMTcQKUpjZIh8bEz88wXa7Z': 'essencial',
  'price_1TMTcRKUpjZIh8bEmSvamEHG': 'business',
  'price_1TMTcSKUpjZIh8bEdHwvKd4X': 'master',
};

Deno.serve(async (req) => {
  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
  const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: 'Stripe não configurado' }, { status: 500 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature inválida:', err.message);
    return Response.json({ error: 'Webhook signature inválida' }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  try {
    // ── Assinatura ativa / renovada ──────────────────────────────────
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const customerEmail = invoice.customer_email;
      const priceId = invoice.lines?.data?.[0]?.price?.id;
      const planType = PLAN_MAP[priceId];

      if (!customerEmail || !planType) {
        console.log('invoice.payment_succeeded: email ou plano não mapeado', { customerEmail, priceId });
        return Response.json({ received: true });
      }

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 32); // 32 dias de margem

      const profiles = await base44.asServiceRole.entities.SellerProfile.filter({ owner_email: customerEmail });

      if (profiles[0]) {
        await base44.asServiceRole.entities.SellerProfile.update(profiles[0].id, {
          plan_type: planType,
          plan_expiry: expiry.toISOString(),
          plan_started_at: profiles[0].plan_started_at || new Date().toISOString(),
        });
        console.log(`✅ Plano ${planType} ativado/renovado para ${customerEmail}`);
      } else {
        // Perfil não existe ainda — criar com plano ativo
        await base44.asServiceRole.entities.SellerProfile.create({
          owner_email: customerEmail,
          seller_name: customerEmail,
          seller_type: 'Produtor',
          plan_type: planType,
          plan_expiry: expiry.toISOString(),
          plan_started_at: new Date().toISOString(),
        });
        console.log(`✅ SellerProfile criado com plano ${planType} para ${customerEmail}`);
      }
    }

    // ── Assinatura cancelada ─────────────────────────────────────────
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const customer = await stripe.customers.retrieve(sub.customer);
      const customerEmail = customer.email;

      if (!customerEmail) {
        console.log('customer.subscription.deleted: email não encontrado');
        return Response.json({ received: true });
      }

      const profiles = await base44.asServiceRole.entities.SellerProfile.filter({ owner_email: customerEmail });
      if (profiles[0]) {
        await base44.asServiceRole.entities.SellerProfile.update(profiles[0].id, {
          plan_type: 'bronze',
          plan_expiry: null,
        });
        console.log(`🔴 Plano cancelado para ${customerEmail}, revertido para bronze`);
      }
    }

    // ── Pagamento falhou ─────────────────────────────────────────────
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const customerEmail = invoice.customer_email;
      console.log(`⚠️ Pagamento falhou para ${customerEmail} — aguardando retry do Stripe`);
      // Não reverte imediatamente — Stripe tentará novamente antes de cancelar
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});