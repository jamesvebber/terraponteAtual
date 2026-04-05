import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ADMIN_EMAIL = "contato@terraponte.app";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const payload = await req.json();
  const request = payload.data;

  if (!request?.store_id) return Response.json({ skipped: true });

  const stores = await base44.asServiceRole.entities.SupplierProfile.filter({ id: request.store_id });
  const store = stores[0];
  const storeName = store?.store_name || request.responsible_name || 'Loja';

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: ADMIN_EMAIL,
    subject: `[Admin] Nova verificação solicitada: ${storeName}`,
    from_name: "TerraPonte",
    body: `A loja <strong>${storeName}</strong> solicitou verificação. <a href="https://terraponte.app/admin/moderation">Revisar no painel</a>.`,
  });

  await base44.asServiceRole.entities.EmailLog.create({
    recipient_email: ADMIN_EMAIL,
    type: 'verification_request',
    subject: `[Admin] Nova verificação: ${storeName}`,
    status: 'sent',
  });

  return Response.json({ success: true });
});