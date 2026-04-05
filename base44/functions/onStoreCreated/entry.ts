import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const payload = await req.json();
  const store = payload.data;

  if (!store?.owner_email || !store?.store_name) return Response.json({ skipped: true });

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: store.owner_email,
    subject: "Sua loja foi cadastrada no TerraPonte ✅",
    from_name: "TerraPonte",
    body: `Sua loja <strong>${store.store_name}</strong> foi cadastrada e está em análise. Em breve você receberá a confirmação. <a href="https://terraponte.app/minha-loja">Acesse sua loja</a>.`,
  });

  await base44.asServiceRole.entities.EmailLog.create({
    recipient_email: store.owner_email,
    type: 'store_confirmation',
    subject: 'Sua loja foi cadastrada no TerraPonte ✅',
    status: 'sent',
  });

  return Response.json({ success: true });
});