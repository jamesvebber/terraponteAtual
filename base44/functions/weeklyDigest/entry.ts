import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function digestTemplate(listingsCount, storesCount) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7f2;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7f2;padding:24px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#2d7d46;padding:20px 24px;text-align:center;">
          <p style="margin:0;color:#ffffff;font-size:20px;font-weight:800;">🌾 TerraPonte</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:12px;">Resumo da semana</p>
        </td></tr>
        <tr><td style="padding:28px 24px 20px;">
          <h1 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#1a2e1f;">Veja o que apareceu no app</h1>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Novos anúncios, novas lojas e novas oportunidades reunidas para você.</p>
          <div style="background:#f5f7f2;border-radius:12px;padding:16px;margin-bottom:16px;">
            <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>📦 ${listingsCount} novos anúncios</strong> esta semana</p>
            <p style="margin:0;font-size:14px;color:#374151;"><strong>🏪 ${storesCount} novas lojas</strong> entraram no app</p>
          </div>
        </td></tr>
        <tr><td style="padding:0 24px 28px;">
          <a href="https://terraponte.app/marketplace" style="display:block;background:#2d7d46;color:#ffffff;text-align:center;padding:14px 20px;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;">Abrir resumo</a>
        </td></tr>
        <tr><td style="background:#f5f7f2;padding:16px 24px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#888;">Para cancelar: <a href="https://terraponte.app/profile" style="color:#2d7d46;">clique aqui</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Count new listings and stores this week
  const allListings = await base44.asServiceRole.entities.Listing.list('-created_date', 200);
  const newListings = allListings.filter(l => l.created_date > oneWeekAgo && l.status === 'active');

  const allStores = await base44.asServiceRole.entities.SupplierProfile.list('-created_date', 50);
  const newStores = allStores.filter(s => s.created_date > oneWeekAgo);

  if (newListings.length === 0 && newStores.length === 0) {
    return Response.json({ skipped: true, reason: 'Sem novidades esta semana' });
  }

  // Get opted-in users for weekly digest
  const prefs = await base44.asServiceRole.entities.EmailPreference.list();
  const recipients = prefs.filter(p => !p.unsubscribed && p.receive_weekly_digest !== false);

  const html = digestTemplate(newListings.length, newStores.length);
  let sent = 0;
  let errors = 0;

  for (const pref of recipients) {
    // Avoid sending more than once per week per user
    if (pref.last_email_sent_at && new Date(pref.last_email_sent_at) > new Date(oneWeekAgo)) {
      continue;
    }

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: pref.user_email,
        subject: "Resumo da semana no TerraPonte",
        body: html,
        from_name: "TerraPonte",
      });

      await base44.asServiceRole.entities.EmailLog.create({
        recipient_email: pref.user_email,
        type: 'weekly_digest',
        subject: 'Resumo da semana no TerraPonte',
        status: 'sent',
      });

      await base44.asServiceRole.entities.EmailPreference.update(pref.id, {
        last_email_sent_at: new Date().toISOString(),
      });

      sent++;
    } catch (err) {
      errors++;
      await base44.asServiceRole.entities.EmailLog.create({
        recipient_email: pref.user_email,
        type: 'weekly_digest',
        subject: 'Resumo da semana no TerraPonte',
        status: 'failed',
        error_message: err.message,
      });
    }
  }

  return Response.json({ success: true, sent, errors });
});