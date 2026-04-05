import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const payload = await req.json();
  const user = payload.data;

  if (!user?.email) return Response.json({ skipped: true });

  // Create default email preference
  await base44.asServiceRole.entities.EmailPreference.create({
    user_email: user.email,
    receive_general: true,
    receive_regional_offers: true,
    receive_new_stores: true,
    receive_announce_reminder: true,
    receive_weekly_digest: true,
    unsubscribed: false,
  });

  // Send welcome email
  await base44.asServiceRole.integrations.Core.SendEmail({
    to: user.email,
    subject: "Bem-vindo ao TerraPonte 🌾",
    from_name: "TerraPonte",
    body: `Olá, ${user.full_name || 'produtor'}! Sua conta no TerraPonte está pronta. Explore anúncios, ofertas e insumos da sua região em <a href="https://terraponte.app">terraponte.app</a>.`,
  });

  await base44.asServiceRole.entities.EmailLog.create({
    recipient_email: user.email,
    type: 'welcome',
    subject: 'Bem-vindo ao TerraPonte 🌾',
    status: 'sent',
  });

  return Response.json({ success: true });
});