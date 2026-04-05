import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function campaignTemplate(title, bodyText, ctaLabel, ctaUrl) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7f2;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7f2;padding:24px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.07);">
        <tr><td style="background:#2d7d46;padding:20px 24px;text-align:center;">
          <p style="margin:0;color:#ffffff;font-size:20px;font-weight:800;">🌾 TerraPonte</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:12px;">Mercado Rural Digital</p>
        </td></tr>
        <tr><td style="padding:28px 24px 20px;">
          <h1 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#1a2e1f;line-height:1.3;">${title}</h1>
          <p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">${bodyText}</p>
        </td></tr>
        <tr><td style="padding:0 24px 28px;">
          <a href="${ctaUrl || 'https://terraponte.app'}" style="display:block;background:#2d7d46;color:#ffffff;text-align:center;padding:14px 20px;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;">${ctaLabel || 'Abrir no TerraPonte'}</a>
        </td></tr>
        <tr><td style="background:#f5f7f2;padding:16px 24px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#888;">Para cancelar o recebimento: <a href="https://terraponte.app/profile" style="color:#2d7d46;">clique aqui</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const { campaign_id } = await req.json();

  const campaigns = await base44.asServiceRole.entities.EmailCampaign.filter({ id: campaign_id });
  const campaign = campaigns[0];
  if (!campaign) {
    return Response.json({ error: 'Campanha não encontrada' }, { status: 404 });
  }

  // Fetch all email preferences (opted-in users)
  let prefs = await base44.asServiceRole.entities.EmailPreference.list();
  prefs = prefs.filter(p => !p.unsubscribed && p.receive_general !== false);

  // Apply filters
  if (campaign.filter_region) {
    prefs = prefs.filter(p => p.region === campaign.filter_region);
  }
  if (campaign.filter_city) {
    prefs = prefs.filter(p => p.city?.toLowerCase().includes(campaign.filter_city.toLowerCase()));
  }

  const html = campaignTemplate(
    campaign.body_title,
    campaign.body_text,
    campaign.cta_label,
    campaign.cta_url
  );

  let sentCount = 0;
  let errorCount = 0;

  for (const pref of prefs) {
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: pref.user_email,
        subject: campaign.subject,
        body: html,
        from_name: "TerraPonte",
      });

      await base44.asServiceRole.entities.EmailLog.create({
        recipient_email: pref.user_email,
        type: 'campaign',
        subject: campaign.subject,
        status: 'sent',
        campaign_id: campaign.id,
      });

      sentCount++;
    } catch (err) {
      errorCount++;
      await base44.asServiceRole.entities.EmailLog.create({
        recipient_email: pref.user_email,
        type: 'campaign',
        subject: campaign.subject,
        status: 'failed',
        error_message: err.message,
        campaign_id: campaign.id,
      });
    }
  }

  // Update campaign record
  await base44.asServiceRole.entities.EmailCampaign.update(campaign.id, {
    status: 'sent',
    sent_count: sentCount,
    error_count: errorCount,
    sent_at: new Date().toISOString(),
  });

  return Response.json({ success: true, sent: sentCount, errors: errorCount });
});