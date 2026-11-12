// Supabase Edge Function: disparar-credenciais-religioso
// Dispara e-mail com as credenciais de primeiro acesso para os confrades da Província BRM via Resend.
//
// Modos suportados:
// 1. modo: "teste" -> Envia para 1 ou 2 e-mails informados para homologação da Secretaria.
// 2. modo: "individual" -> Envia para um confrade específico por `religioso_id`.
// 3. modo: "lote" -> Envia para uma lista selecionada de confrades por `religioso_ids`.
//
// Deploy:
// npx supabase functions deploy disparar-credenciais-religioso --no-verify-jwt
//
// Segredos necessários no Supabase:
// RESEND_API_KEY: Chave de API gerada no painel do Resend
// RESEND_FROM_EMAIL (opcional): E-mail remetente verificado (padrão: "Secretaria Provincial BRM <secretaria@brm.org.br>")
// PORTAL_URL (opcional): URL do portal (padrão: "https://portal.brm.org.br")

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, apikey, Content-Type, x-client-info",
};

function corsResponse(body: Record<string, unknown> | string, status = 200): Response {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Secretaria Provincial BRM <secretaria@brm.org.br>";
const PORTAL_URL = Deno.env.get("PORTAL_URL") || "https://portal.brm.org.br";
const CONTATO_SECRETARIA = "secretaria@brm.org.br";

function limparNomeCivil(nome?: string | null): string {
  if (!nome) return "";
  let clean = nome.trim();
  clean = clean.replace(/(?:,\s*|\s+)(?:scj|s\.c\.j\.|dehoniano|dehonianos)\.?$/i, "").trim();
  let prev = "";
  while (prev !== clean) {
    prev = clean;
    clean = clean.replace(/^(dom|diác\.|diac\.|diácono|diacono|fr\.|frater|ir\.|irmão|irmao|pe\.|p\.|padre|presbítero|presbitero)\s+/i, "").trim();
  }
  return clean;
}

function obterPrefixoPorGrau(grau?: string | null): string {
  const g = (grau || "").trim().toLowerCase();
  if (g.includes("frater")) return "Fr.";
  if (g.includes("bispo") || g.includes("dom")) return "Dom";
  if (g.includes("diác") || g.includes("diac")) return "Diác.";
  if (g.includes("irmã") || g.includes("irma")) return "Ir.";
  return "P.";
}

function atribuirNomeTratamento(grau?: string | null, nome?: string | null): string {
  const nomeLimpo = limparNomeCivil(nome);
  if (!nomeLimpo) return nome || "Confrade Dehoniano";
  const prefixo = obterPrefixoPorGrau(grau);
  return `${prefixo} ${nomeLimpo}, SCJ`;
}

function formatarSenhaProvisoria(dataNascimento?: string | null): string {
  if (!dataNascimento) return "brm@2026scj";
  const partes = String(dataNascimento).split("T")[0].split("-");
  if (partes.length === 3) {
    const [ano, mes, dia] = partes;
    return `brm@${dia.padStart(2, "0")}${mes.padStart(2, "0")}${ano}`;
  }
  const partesBr = String(dataNascimento).split("/");
  if (partesBr.length === 3) {
    const [dia, mes, ano] = partesBr;
    return `brm@${dia.padStart(2, "0")}${mes.padStart(2, "0")}${ano}`;
  }
  return "brm@2026scj";
}

function renderizarTemplateEmail(params: {
  nomeTratamento: string;
  emailLogin: string;
  senhaProvisoria: string;
  portalUrl: string;
  contatoSecretaria: string;
}): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acesso ao Portal do Religioso - Província BRM</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f6f8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #17333d;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    a {
      color: #226380;
      text-decoration: underline;
    }
    @media only screen and (max-width: 620px) {
      .container {
        width: 100% !important;
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
      }
      .content-padding {
        padding: 24px 18px !important;
      }
      .cred-table td {
        display: block !important;
        width: 100% !important;
        padding: 4px 0 !important;
      }
      .btn-cta {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 28px 12px; background-color: #f3f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17333d;">

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <!-- Container Principal -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 620px; background-color: #ffffff; border: 1px solid #dce5e8; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 18px rgba(17, 50, 64, 0.05);">
          
          <!-- Cabeçalho Timbrado com Identidade Visual BRM (Conforme Imagem Oficial) -->
          <tr>
            <td style="background-color: #113240; padding: 38px 28px 26px; text-align: center; border-bottom: 3px solid #226380;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <img src="https://sistema.brm.org.br/brasao-colorido-dehoniano.png" alt="Brasão Dehoniano - Província BRM" width="125" style="display: block; width: 125px; max-width: 100%; height: auto; margin: 0 auto 16px; border: 0;">
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 2.2px; text-transform: uppercase; color: #8bb6c6;">
                      Província Brasileira Meridional · SCJ
                    </div>
                    <div style="margin-top: 6px; font-size: 23px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">
                      Portal do Religioso
                    </div>
                    <div style="margin-top: 4px; font-size: 13px; color: #c0d6df;">
                      Credenciais de Primeiro Acesso
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Corpo do E-mail -->
          <tr>
            <td class="content-padding" style="padding: 36px 36px 28px;">
              
              <!-- Saudação -->
              <p style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #113240;">
                Prezado ${params.nomeTratamento},
              </p>
              
              <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.7; color: #374f59;">
                Fraternas saudações em Cristo Jesus!
              </p>
              
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.7; color: #374f59;">
                A Secretaria Provincial disponibiliza o seu acesso ao <strong>Portal do Religioso</strong> da Província Brasileira Meridional. Este ambiente digital reúne a sua Ficha Cadastral Oficial, histórico formativo, designações, agenda e comunicados da Província.
              </p>

              <!-- Card de Credenciais -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7fafb; border: 1px solid #d5e2e6; border-left: 4px solid #226380; border-radius: 6px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px 22px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #226380; margin-bottom: 12px;">
                      Credenciais de Acesso
                    </div>

                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="cred-table" style="font-size: 14px;">
                      <tr>
                        <td style="padding: 6px 0; color: #627b85; font-weight: 500; width: 36%;">
                          Endereço do Portal:
                        </td>
                        <td style="padding: 6px 0; color: #113240; font-weight: 600;">
                          <a href="${params.portalUrl}" style="color: #226380; text-decoration: none; word-break: break-all;">${params.portalUrl}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #627b85; font-weight: 500;">
                          E-mail de Login:
                        </td>
                        <td style="padding: 6px 0; color: #113240; font-weight: 600;">
                          <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; word-break: break-all;">${params.emailLogin}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0 6px; color: #627b85; font-weight: 500;">
                          Senha Provisória:
                        </td>
                        <td style="padding: 8px 0 6px;">
                          <span style="display: inline-block; background-color: #e6eef1; border: 1px solid #cad8dc; border-radius: 4px; padding: 4px 10px; font-family: 'SF Mono', Menlo, Consolas, Monaco, monospace; font-size: 14px; font-weight: 700; color: #113240; letter-spacing: 0.6px;">${params.senhaProvisoria}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Nota de Primeiro Acesso (Sóbria e sem jargões de IA) -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 13px; line-height: 1.6; color: #526b75; border-left: 3px solid #cad8dc; padding-left: 12px;">
                    <strong>Observação:</strong> no primeiro acesso com a senha provisória, o sistema solicitará o cadastro de uma nova senha pessoal definitiva. A senha provisória deixa de valer logo após essa atualização.
                  </td>
                </tr>
              </table>

              <!-- Passo a Passo -->
              <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #113240; margin-bottom: 14px;">
                Como realizar o primeiro acesso:
              </div>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td width="30" valign="top" style="padding-bottom: 10px;">
                    <div style="width: 22px; height: 22px; background-color: #113240; color: #ffffff; border-radius: 50%; font-size: 11px; font-weight: 700; text-align: center; line-height: 22px;">1</div>
                  </td>
                  <td style="padding-bottom: 10px; font-size: 14px; line-height: 1.6; color: #374f59;">
                    Acesse o endereço do Portal pelo botão abaixo.
                  </td>
                </tr>
                <tr>
                  <td width="30" valign="top" style="padding-bottom: 10px;">
                    <div style="width: 22px; height: 22px; background-color: #113240; color: #ffffff; border-radius: 50%; font-size: 11px; font-weight: 700; text-align: center; line-height: 22px;">2</div>
                  </td>
                  <td style="padding-bottom: 10px; font-size: 14px; line-height: 1.6; color: #374f59;">
                    Informe seu e-mail e a <strong>senha provisória</strong> indicada acima.
                  </td>
                </tr>
                <tr>
                  <td width="30" valign="top" style="padding-bottom: 10px;">
                    <div style="width: 22px; height: 22px; background-color: #113240; color: #ffffff; border-radius: 50%; font-size: 11px; font-weight: 700; text-align: center; line-height: 22px;">3</div>
                  </td>
                  <td style="padding-bottom: 10px; font-size: 14px; line-height: 1.6; color: #374f59;">
                    Cadastre a sua <strong>nova senha pessoal</strong> na tela de primeiro acesso.
                  </td>
                </tr>
                <tr>
                  <td width="30" valign="top">
                    <div style="width: 22px; height: 22px; background-color: #226380; color: #ffffff; border-radius: 50%; font-size: 11px; font-weight: 700; text-align: center; line-height: 22px;">4</div>
                  </td>
                  <td style="font-size: 14px; line-height: 1.6; color: #374f59;">
                    Concluída a alteração, o acesso ao Portal estará liberado para que você realize seu cadastro, anexe documentos e consulte a agenda provincial.
                  </td>
                </tr>
              </table>

              <!-- Botão CTA Centralizado -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${params.portalUrl}" class="btn-cta" style="background-color: #113240; color: #ffffff; display: inline-block; padding: 13px 30px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 6px; letter-spacing: 0.2px; text-align: center;">
                      Acessar o Portal do Religioso &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Bloco de Apoio da Secretaria -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7fafb; border: 1px solid #e1ebed; border-radius: 6px;">
                <tr>
                  <td style="padding: 14px 18px; font-size: 13px; line-height: 1.6; color: #4e656d; text-align: center;">
                    Em caso de dúvidas ou necessidade de auxílio no primeiro acesso, entre em contato com a Secretaria Provincial pelo e-mail <a href="mailto:${params.contatoSecretaria}" style="color: #226380; font-weight: 600; text-decoration: none;">${params.contatoSecretaria}</a>.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Rodapé Institucional -->
          <tr>
            <td style="background-color: #edf2f4; border-top: 1px solid #dce5e8; padding: 22px 28px; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #113240;">
                Província Brasileira Meridional · Congregação dos Sacerdotes do Sagrado Coração de Jesus
              </p>
              <p style="margin: 0 0 10px; font-size: 11px; line-height: 1.6; color: #627b85;">
                Cúria Provincial · Rua Padre Gabriel Lux, 900 – Caixa Postal 21 · Corupá - SC · CEP 89278-000<br>
                Secretaria Provincial · <a href="mailto:${params.contatoSecretaria}" style="color: #226380; text-decoration: none;">${params.contatoSecretaria}</a>
              </p>
              <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #78909c;">
                <em>Aviso: este e-mail contém credenciais temporárias de uso individual e intransferível. Por favor, não compartilhe esta mensagem.</em>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`.trim();
}

function renderizarTemplateComunicado(params: {
  nomeTratamento: string;
  tipoMensagem: string;
  tituloCabecalho?: string;
  subtituloCabecalho?: string;
  corpoTexto: string;
  blocoDestaque?: string;
  botaoTexto?: string;
  botaoUrl?: string;
  assinaturaTexto?: string;
}): string {
  const titulo = params.tituloCabecalho || (params.tipoMensagem === 'circular' ? 'Governo Provincial' : 'Secretaria Provincial');
  const subtitulo = params.subtituloCabecalho || (
    params.tipoMensagem === 'circular' ? 'Carta Circular' :
    params.tipoMensagem === 'convocacao' ? 'Convocação Oficial' : 'Comunicado Oficial'
  );

  const paragrafos = (params.corpoTexto || '')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p style="margin: 0 0 16px; font-size: 14px; line-height: 1.7; color: #374f59;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  const htmlDestaque = params.blocoDestaque ? `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7fafb; border: 1px solid #d5e2e6; border-left: 4px solid #226380; border-radius: 6px; margin: 22px 0;">
      <tr>
        <td style="padding: 18px 22px; font-size: 13.5px; line-height: 1.6; color: #17333d;">
          ${params.blocoDestaque.replace(/\n/g, '<br>')}
        </td>
      </tr>
    </table>
  ` : '';

  const htmlBotao = (params.botaoTexto && params.botaoUrl) ? `
    <div style="text-align: center; margin: 28px 0 22px;">
      <a href="${params.botaoUrl}" class="btn-cta" style="display: inline-block; background-color: #113240; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 6px; font-size: 14px; font-weight: 600; letter-spacing: 0.3px;">
        ${params.botaoTexto}
      </a>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subtitulo} - Província BRM</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f3f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17333d; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; }
    a { color: #226380; text-decoration: underline; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; border-radius: 0 !important; border-left: none !important; border-right: none !important; }
      .content-padding { padding: 24px 18px !important; }
      .btn-cta { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 28px 12px; background-color: #f3f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17333d;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 620px; background-color: #ffffff; border: 1px solid #dce5e8; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 18px rgba(17, 50, 64, 0.05);">
          <!-- Cabeçalho Oficial BRM -->
          <tr>
            <td style="background-color: #113240; padding: 38px 28px 26px; text-align: center; border-bottom: 3px solid #226380;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <img src="https://sistema.brm.org.br/brasao-colorido-dehoniano.png" alt="Brasão Dehoniano - Província BRM" width="125" style="display: block; width: 125px; max-width: 100%; height: auto; margin: 0 auto 16px; border: 0;">
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 2.2px; text-transform: uppercase; color: #8bb6c6;">
                      Província Brasileira Meridional · SCJ
                    </div>
                    <div style="margin-top: 6px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">
                      ${titulo}
                    </div>
                    <div style="margin-top: 4px; font-size: 13px; color: #c0d6df;">
                      ${subtitulo}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Corpo da Mensagem -->
          <tr>
            <td class="content-padding" style="padding: 36px 36px 28px;">
              <p style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #113240;">
                Prezado ${params.nomeTratamento},
              </p>

              ${paragrafos}

              ${htmlDestaque}

              ${htmlBotao}

              <!-- Assinatura Canônica -->
              <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e3ebed; font-size: 13px; color: #627b85; line-height: 1.6;">
                <div style="font-style: italic; margin-bottom: 4px; color: #48626e;">Em Cristo e Dehon,</div>
                <div style="font-weight: 700; color: #113240; font-size: 14px;">${params.assinaturaTexto || 'Secretaria Provincial'}</div>
                <div style="font-size: 12px; color: #78909c;">Província Brasileira Meridional · SCJ</div>
              </div>
            </td>
          </tr>

          <!-- Rodapé Institucional Canônico -->
          <tr>
            <td style="background-color: #f7fafb; padding: 22px 28px; text-align: center; border-top: 1px solid #e7eff2; font-size: 11.5px; color: #768d96; line-height: 1.6;">
              <strong style="color: #113240; font-weight: 600;">Província Brasileira Meridional</strong> · Congregação dos Sacerdotes do Sagrado Coração de Jesus<br>
              Cúria Provincial · Rua Padre Gabriel Lux, 900 – Caixa Postal 21 · Corupá - SC · CEP 89278-000<br>
              <span style="font-size: 11px; color: #94a7af;">Comunicação e Atos Oficiais aos Religiosos Dehonianos</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

async function enviarEmailResend(destinatario: string, subject: string, html: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [destinatario],
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data?.message || data?.error || JSON.stringify(data) };
    }
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  try {
    if (!RESEND_API_KEY) {
      return corsResponse({
        error: "RESEND_API_KEY não configurada nos segredos do Supabase. Configure antes de disparar.",
      }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const modo = body.modo || "teste";
    const operadorNome = body.operador_nome || "Secretaria Provincial";
    const tipoMensagem = body.tipo_mensagem || "credenciais";
    const assuntoPersonalizado = (body.assunto || "").trim();
    const tituloCabecalho = (body.titulo_cabecalho || "").trim();
    const subtituloCabecalho = (body.subtitulo_cabecalho || "").trim();
    const corpoTexto = (body.corpo_texto || "").trim();
    const blocoDestaque = (body.bloco_destaque || "").trim();
    const botaoTexto = (body.botao_texto || "").trim();
    const botaoUrl = (body.botao_url || "").trim();
    const assinaturaTexto = (body.assinatura_texto || "").trim();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const gerarHtml = (nomeTratamento: string, emailLogin: string, dataNasc?: string | null) => {
      if (tipoMensagem === "credenciais") {
        const senhaProvisoria = formatarSenhaProvisoria(dataNasc);
        return renderizarTemplateEmail({
          nomeTratamento,
          emailLogin,
          senhaProvisoria,
          portalUrl: PORTAL_URL,
          contatoSecretaria: CONTATO_SECRETARIA,
        });
      } else {
        return renderizarTemplateComunicado({
          nomeTratamento,
          tipoMensagem,
          tituloCabecalho,
          subtituloCabecalho,
          corpoTexto,
          blocoDestaque,
          botaoTexto,
          botaoUrl,
          assinaturaTexto,
        });
      }
    };

    const obterAssunto = (nomeTratamento: string) => {
      if (tipoMensagem === "credenciais") {
        return `Portal do Religioso: Suas credenciais de acesso - ${nomeTratamento}`;
      }
      return assuntoPersonalizado ? `${assuntoPersonalizado}` : `Comunicado Oficial - Província BRM`;
    };

    // =========================================================================
    // MODO 1: TESTE / HOMOLOGAÇÃO (1 ou 2 destinatários)
    // =========================================================================
    if (modo === "teste") {
      const destinatarios: string[] = Array.isArray(body.destinatarios)
        ? body.destinatarios
        : (body.destinatario ? [body.destinatario] : []);

      if (!destinatarios.length) {
        return corsResponse({ error: "Informe ao menos um e-mail de destinatário para o envio de teste." }, 400);
      }

      const resultados = [];
      for (const dest of destinatarios) {
        const emailLimpo = String(dest).trim().toLowerCase();
        if (!emailLimpo.includes("@")) {
          resultados.push({ email: dest, ok: false, error: "E-mail com formato inválido." });
          continue;
        }

        const nomeTratamento = body.nome_teste || "Pe. João da Silva, SCJ";
        const html = gerarHtml(nomeTratamento, emailLimpo, body.data_nascimento_teste || "1978-08-15");
        const subject = `[TESTE] ${obterAssunto(nomeTratamento)}`;

        const envio = await enviarEmailResend(emailLimpo, subject, html);
        resultados.push({
          email: emailLimpo,
          ok: envio.ok,
          id: envio.id,
          error: envio.error,
        });
      }

      return corsResponse({
        ok: true,
        modo: "teste",
        tipo_mensagem: tipoMensagem,
        total: resultados.length,
        resultados,
      });
    }

    // =========================================================================
    // MODO 2: INDIVIDUAL OU LOTE (Religiosos da base)
    // =========================================================================
    const ids: string[] = modo === "individual"
      ? (body.religioso_id ? [body.religioso_id] : [])
      : (Array.isArray(body.religioso_ids) ? body.religioso_ids : []);

    if (!ids.length) {
      return corsResponse({ error: "Nenhum religioso selecionado para envio." }, 400);
    }

    // Buscar os religiosos no banco
    const { data: religiosos, error: fetchErr } = await supabase
      .from("religiosos")
      .select("id, grau, nome_civil, nome_religioso, nome_elenco, email_institucional, email_pessoal, data_nascimento")
      .in("id", ids);

    if (fetchErr) {
      return corsResponse({ error: `Erro ao buscar religiosos: ${fetchErr.message}` }, 500);
    }

    if (!religiosos || !religiosos.length) {
      return corsResponse({ error: "Nenhum registro de religioso encontrado para os IDs informados." }, 404);
    }

    let enviados = 0;
    let falhas = 0;
    const relatorioEnvio = [];

    for (const rel of religiosos) {
      const email = (rel.email_institucional || rel.email_pessoal || "").trim().toLowerCase();
      const nomeBase = rel.nome_elenco || rel.nome_religioso || rel.nome_civil;
      const nomeTratamento = atribuirNomeTratamento(rel.grau, nomeBase);

      if (!email || !email.includes("@")) {
        falhas++;
        relatorioEnvio.push({
          id: rel.id,
          nome: nomeTratamento,
          status: "ignorado",
          motivo: "Sem e-mail válido cadastrado",
        });
        continue;
      }

      const html = gerarHtml(nomeTratamento, email, rel.data_nascimento);
      const subject = obterAssunto(nomeTratamento);

      const envio = await enviarEmailResend(email, subject, html);

      if (envio.ok) {
        enviados++;
        // Atualizar o carimbo de envio no banco de dados se for credencial
        if (tipoMensagem === "credenciais") {
          await supabase
            .from("religiosos")
            .update({
              credenciais_enviadas_em: new Date().toISOString(),
              credenciais_enviadas_por: operadorNome,
            })
            .eq("id", rel.id);
        }

        relatorioEnvio.push({
          id: rel.id,
          nome: nomeTratamento,
          email,
          status: "enviado",
          resendId: envio.id,
        });
      } else {
        falhas++;
        relatorioEnvio.push({
          id: rel.id,
          nome: nomeTratamento,
          email,
          status: "erro",
          motivo: envio.error,
        });
      }

      // Pequena pausa (600ms) para respeitar o rate-limiting do Resend
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    // Registrar histórico na tabela comunicados_disparos
    try {
      await supabase.from("comunicados_disparos").insert({
        operador_nome: operadorNome,
        tipo_mensagem: tipoMensagem,
        assunto: assuntoPersonalizado || (tipoMensagem === "credenciais" ? "Credenciais de Acesso ao Portal" : "Comunicado Oficial"),
        subtitulo_cabecalho: subtituloCabecalho || null,
        corpo_texto: corpoTexto || null,
        bloco_destaque: blocoDestaque || null,
        botao_texto: botaoTexto || null,
        botao_url: botaoUrl || null,
        total_destinatarios: religiosos.length,
        total_sucessos: enviados,
        total_falhas: falhas,
        relatorio_envio: relatorioEnvio,
      });
    } catch (saveErr) {
      console.warn("Aviso ao salvar histórico em comunicados_disparos:", saveErr);
    }

    return corsResponse({
      ok: true,
      modo,
      tipo_mensagem: tipoMensagem,
      total: religiosos.length,
      enviados,
      falhas,
      relatorio: relatorioEnvio,
    });
  } catch (error) {
    console.error("Erro interno ao disparar credenciais:", error);
    return corsResponse({
      error: error instanceof Error ? error.message : "Erro inesperado ao processar envio",
    }, 500);
  }
});
