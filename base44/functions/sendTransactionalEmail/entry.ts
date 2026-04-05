import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// ─── E-mail Templates ────────────────────────────────────────────────────────
function baseTemplate(title, content, ctaLabel, ctaUrl) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f5f7f2;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7f2;padding:24px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.07);">
        <!-- Header -->
        <tr><td style="background:#2d7d46;padding:20px 24px;text-align:center;">
          <p style="margin:0;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">🌾 TerraPonte</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:12px;">Mercado Rural Digital</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:28px 24px 20px;">
          <h1 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#1a2e1f;line-height:1.3;">${title}</h1>
          ${content}
        </td></tr>
        <!-- CTA -->
        ${ctaLabel && ctaUrl ? `
        <tr><td style="padding:0 24px 28px;">
          <a href="${ctaUrl}" style="display:block;background:#2d7d46;color:#ffffff;text-align:center;padding:14px 20px;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;">${ctaLabel}</a>
        </td></tr>` : ''}
        <!-- Footer -->
        <tr><td style="background:#f5f7f2;padding:16px 24px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#888;">Você está recebendo este e-mail pois tem uma conta no TerraPonte.</p>
          <p style="margin:6px 0 0;font-size:11px;color:#888;"><a href="https://terraponte.app/profile" style="color:#2d7d46;text-decoration:none;">Gerenciar preferências de e-mail</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const TEMPLATES = {
  welcome: (data) => ({
    subject: "Bem-vindo ao TerraPonte 🌾",
    html: baseTemplate(
      `Olá, ${data.name || 'produtor'}!`,
      `<p style="margin:0 0 10px;font-size:15px;color:#374151;line-height:1.6;">Sua conta no TerraPonte está pronta. Aqui você compra e vende direto de quem produz, sem intermediários.</p>
       <p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">Comece agora: anuncie seus produtos, confira as ofertas da sua região ou encontre insumos mais baratos.</p>`,
      "Explorar o app", "https://terraponte.app"
    )
  }),

  store_confirmation: (data) => ({
    subject: "Sua loja foi cadastrada no TerraPonte ✅",
    html: baseTemplate(
      `Loja cadastrada com sucesso!`,
      `<p style="margin:0 0 10px;font-size:15px;color:#374151;line-height:1.6;">A loja <strong>${data.store_name || ''}</strong> foi cadastrada no TerraPonte e está em análise pela nossa equipe.</p>
       <p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">Em breve você receberá a confirmação de aprovação. Enquanto isso, já pode adicionar seus produtos.</p>`,
      "Acessar minha loja", "https://terraponte.app/minha-loja"
    )
  }),

  new_listing: (data) => ({
    subject: `Seu anúncio "${data.title || 'produto'}" foi publicado ✅`,
    html: baseTemplate(
      "Anúncio publicado!",
      `<p style="margin:0 0 10px;font-size:15px;color:#374151;line-height:1.6;">Seu anúncio <strong>${data.title || ''}</strong> já está visível no TerraPonte para compradores da sua região.</p>
       <p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">Compartilhe o link com seus contatos para aumentar as chances de venda.</p>`,
      "Ver meu anúncio", `https://terraponte.app/marketplace/${data.listing_id || ''}`
    )
  }),

  verification_request: (data) => ({
    subject: `[Admin] Nova solicitação de verificação: ${data.store_name || ''}`,
    html: baseTemplate(
      "Nova solicitação de verificação",
      `<p style="margin:0 0 10px;font-size:15px;color:#374151;line-height:1.6;">A loja <strong>${data.store_name || ''}</strong> solicitou verificação no TerraPonte.</p>
       <p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">Acesse o painel de administração para revisar os documentos enviados.</p>`,
      "Revisar solicitação", "https://terraponte.app/admin/moderation"
    )
  }),

  support_contact: (data) => ({
    subject: `[Suporte] Nova mensagem de ${data.name || 'usuário'}`,
    html: baseTemplate(
      "Nova mensagem de suporte",
      `<p style="margin:0 0 10px;font-size:15px;color:#374151;line-height:1.6;"><strong>De:</strong> ${data.name || ''} (${data.email || ''})</p>
       <p style="margin:0 0 10px;font-size:15px;color:#374151;line-height:1.6;"><strong>Mensagem:</strong></p>
       <p style="margin:0;font-size:15px;color:#374151;line-height:1.6;background:#f5f7f2;padding:12px;border-radius:8px;">${data.message || ''}</p>`,
      null, null
    )
  }),
};

// ─── Handler ────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { type, to, data = {} } = await req.json();

  const template = TEMPLATES[type];
  if (!template) {
    return Response.json({ error: `Template "${type}" não encontrado` }, { status: 400 });
  }

  const { subject, html } = template(data);

  let status = "sent";
  let errorMessage = null;

  try {
    await base44.integrations.Core.SendEmail({
      to,
      subject,
      body: html,
      from_name: "TerraPonte",
    });
  } catch (err) {
    status = "failed";
    errorMessage = err.message;
  }

  // Log the send attempt
  await base44.asServiceRole.entities.EmailLog.create({
    recipient_email: to,
    type,
    subject,
    status,
    error_message: errorMessage,
    metadata: JSON.stringify(data),
  });

  if (status === "failed") {
    return Response.json({ success: false, error: errorMessage }, { status: 500 });
  }

  return Response.json({ success: true });
});