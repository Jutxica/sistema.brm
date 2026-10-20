// Supabase Edge Function: enviar-ficha-religioso
// Dispara um e-mail com a confirmação e cópia completa da ficha cadastral para o religioso via Resend.
//
// Deploy:
// npx supabase functions deploy enviar-ficha-religioso --no-verify-jwt
//
// Segredos necessários no Supabase:
// RESEND_API_KEY: Chave de API gerada no painel do Resend (ex: re_123456789)
// RESEND_FROM_EMAIL (opcional): E-mail remetente verificado (padrão: "Secretaria Provincial BRM <secretaria@brm.org.br>")

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

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const [y, m, d] = dateStr.split("T")[0].split("-");
    if (y && m && d) return `${d}/${m}/${y}`;
    return new Date(dateStr).toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const religiosoId = body.religioso_id || body.religiosoId || body.id;

    if (!religiosoId) {
      return corsResponse({ error: "Parâmetro 'religioso_id' não informado." }, 400);
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY não está configurada nos segredos do Supabase.");
      return corsResponse({
        error: "RESEND_API_KEY não configurada. Defina a variável de ambiente RESEND_API_KEY no Supabase.",
      }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Buscar os dados base do religioso
    const { data: religioso, error: relError } = await supabase
      .from("religiosos")
      .select("*")
      .eq("id", religiosoId)
      .maybeSingle();

    if (relError || !religioso) {
      return corsResponse({ error: `Religioso não encontrado: ${relError?.message || "Registro inexistente"}` }, 404);
    }

    const destinatario = (religioso.email_institucional || religioso.email_pessoal || "").trim();
    if (!destinatario || !destinatario.includes("@")) {
      return corsResponse({ error: "O religioso não possui e-mail cadastrado (institucional ou pessoal)." }, 400);
    }

    // 2. Buscar dados complementares em paralelo
    const [
      sacramentosRes,
      votosRes,
      ministeriosRes,
      formacaoRes,
      enderecosRes,
      saudeRes,
      competenciasRes,
    ] = await Promise.all([
      supabase.from("religiosos_sacramentos").select("*").eq("religioso_id", religiosoId).order("data", { ascending: true }),
      supabase.from("religiosos_profissoes_votos").select("*").eq("religioso_id", religiosoId).order("data", { ascending: true }),
      supabase.from("religiosos_ministerios_ordens").select("*").eq("religioso_id", religiosoId).order("data", { ascending: true }),
      supabase.from("religiosos_formacao_religiosa").select("*").eq("religioso_id", religiosoId).order("data_ingresso", { ascending: true }),
      supabase.from("religiosos_enderecos_contatos").select("*").eq("religioso_id", religiosoId).maybeSingle(),
      supabase.from("religiosos_saude").select("*").eq("religioso_id", religiosoId).maybeSingle(),
      supabase.from("religiosos_competencias").select("*").eq("religioso_id", religiosoId),
    ]);

    const sacramentos = sacramentosRes.data || [];
    const votos = votosRes.data || [];
    const ministerios = ministeriosRes.data || [];
    const formacao = formacaoRes.data || [];
    const enderecos = enderecosRes.data || {};
    const saude = saudeRes.data || {};
    const competencias = competenciasRes.data || [];

    const nomeExibicao = religioso.nome_religioso || religioso.nome_civil || "Confrade";
    const dataConfirmacao = new Date().toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // 3. Montar o layout HTML da Ficha Cadastral Oficial
    const htmlEmail = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cópia da Ficha Cadastral BRM</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f7; margin: 0; padding: 24px 12px; color: #1d1d1f; }
    .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e5e5ea; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.03); }
    .header { background: #113240; color: #ffffff; padding: 32px 28px; text-align: center; }
    .header h1 { font-size: 20px; font-weight: 700; margin: 0 0 6px 0; letter-spacing: -0.01em; }
    .header p { font-size: 13px; color: #a3c3c7; margin: 0; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; }
    .content { padding: 32px 28px; font-size: 14px; line-height: 1.6; }
    .greeting { font-size: 16px; font-weight: 600; color: #113240; margin-bottom: 8px; }
    .alert-box { background: #f0f7f9; border-left: 4px solid #226380; padding: 14px 18px; border-radius: 4px; margin: 20px 0; font-size: 13px; color: #203136; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #226380; border-bottom: 2px solid #eef2f3; padding-bottom: 6px; margin-top: 26px; margin-bottom: 12px; }
    .grid { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    .grid td { padding: 6px 0; vertical-align: top; font-size: 13px; }
    .grid td.label { width: 38%; color: #707070; font-weight: 500; }
    .grid td.value { width: 62%; color: #1d1d1f; font-weight: 600; }
    .badge { display: inline-block; background: #eef2f3; color: #203136; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-right: 4px; margin-bottom: 4px; }
    .footer { background: #fafafa; border-top: 1px solid #e5e5ea; padding: 24px 28px; text-align: center; font-size: 12px; color: #707070; }
    .btn { display: inline-block; background: #226380; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 13px; padding: 12px 24px; border-radius: 6px; margin-top: 20px; }
    .items-list { margin: 8px 0; padding-left: 20px; font-size: 13px; }
    .items-list li { margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p>Província Brasil Meridional • Dehonianos</p>
      <h1>Comprovante de Ficha Cadastral</h1>
    </div>

    <div class="content">
      <p class="greeting">Prezado confrade, ${nomeExibicao}</p>
      <p>
        Confirmamos o registro e atualização dos seus dados cadastrais no Sistema Oficial da Província BRM. 
        Este e-mail contém uma <strong>cópia detalhada das informações salvas</strong> para seu arquivamento pessoal.
      </p>

      <div class="alert-box">
        <strong>Data do Registro:</strong> ${dataConfirmacao}<br>
        <strong>Status no Sistema:</strong> ${religioso.status_cadastro || 'Registrado'} • ${religioso.status || 'Ativo'}
      </div>

      <!-- 1. IDENTIFICAÇÃO -->
      <div class="section-title">1. Identificação Civil e Religiosa</div>
      <table class="grid">
        <tr><td class="label">Grau Canônico:</td><td class="value">${religioso.grau || '—'}</td></tr>
        <tr><td class="label">Nome Religioso:</td><td class="value">${religioso.nome_religioso || '—'}</td></tr>
        <tr><td class="label">Nome Civil:</td><td class="value">${religioso.nome_civil || '—'}</td></tr>
        <tr><td class="label">CPF:</td><td class="value">${religioso.cpf || '—'}</td></tr>
        <tr><td class="label">RG:</td><td class="value">${religioso.rg || '—'} ${religioso.rg_orgao_expedidor ? `(${religioso.rg_orgao_expedidor})` : ''}</td></tr>
        <tr><td class="label">Data de Nascimento:</td><td class="value">${formatDate(religioso.data_nascimento)}</td></tr>
        <tr><td class="label">Naturalidade:</td><td class="value">${religioso.municipio_nascimento || religioso.local_nascimento || '—'}${religioso.estado_nascimento ? ` - ${religioso.estado_nascimento}` : ''}</td></tr>
        <tr><td class="label">Comunidade / Obra Atual:</td><td class="value">${religioso.comunidade_atual_nome || '—'}</td></tr>
      </table>

      <!-- 2. CONTATOS E RESIDÊNCIA -->
      <div class="section-title">2. Contatos e Residência</div>
      <table class="grid">
        <tr><td class="label">E-mail Institucional:</td><td class="value">${religioso.email_institucional || '—'}</td></tr>
        <tr><td class="label">E-mail Pessoal:</td><td class="value">${religioso.email_pessoal || '—'}</td></tr>
        <tr><td class="label">Telefone Celular / WhatsApp:</td><td class="value">${religioso.telefone_celular || religioso.whatsapp || '—'}</td></tr>
        <tr><td class="label">Endereço Atual:</td><td class="value">${enderecos.logradouro || religioso.logradouro || '—'}${enderecos.numero ? `, ${enderecos.numero}` : ''}${enderecos.bairro ? ` - ${enderecos.bairro}` : ''}${enderecos.cidade ? ` • ${enderecos.cidade}` : ''}${enderecos.estado ? `/${enderecos.estado}` : ''} ${enderecos.cep ? `(CEP ${enderecos.cep})` : ''}</td></tr>
      </table>

      <!-- 3. SACRAMENTOS -->
      <div class="section-title">3. Sacramentos Registrados</div>
      ${sacramentos.length > 0 ? `
        <ul class="items-list">
          ${sacramentos.map((s: Record<string, string>) => `
            <li>
              <strong>${s.tipo || 'Sacramento'}:</strong> ${formatDate(s.data)}
              ${s.paroquia ? ` • Paróquia ${s.paroquia}` : ''}
              ${s.cidade ? ` (${s.cidade}${s.uf ? `/${s.uf}` : ''})` : ''}
              ${s.livro || s.folha ? ` [Livro: ${s.livro || '—'}, Fl: ${s.folha || '—'}, Reg: ${s.numero_registro || '—'}]` : ''}
            </li>
          `).join('')}
        </ul>
      ` : '<p style="font-size: 13px; color: #707070;">Nenhum sacramento registrado na ficha.</p>'}

      <!-- 4. PROFISSÕES E VOTOS -->
      <div class="section-title">4. Profissão Religiosa e Votos</div>
      ${votos.length > 0 ? `
        <ul class="items-list">
          ${votos.map((v: Record<string, string>) => `
            <li>
              <strong>${v.tipo || 'Voto'}${v.renovacao ? ` (${v.renovacao}ª renovação)` : ''}:</strong> ${formatDate(v.data)}
              ${v.local ? ` • ${v.local}` : ''}
              ${v.cidade ? ` (${v.cidade})` : ''}
              ${v.celebrante ? ` • Celebrante: ${v.celebrante}` : ''}
            </li>
          `).join('')}
        </ul>
      ` : '<p style="font-size: 13px; color: #707070;">Nenhum voto cadastrado.</p>'}

      <!-- 5. MINISTÉRIOS E ORDENS -->
      <div class="section-title">5. Ministérios e Ordens Sacras</div>
      ${ministerios.length > 0 ? `
        <ul class="items-list">
          ${ministerios.map((m: Record<string, string>) => `
            <li>
              <strong>${m.tipo || m.ministerio || 'Ministério/Ordem'}:</strong> ${formatDate(m.data)}
              ${m.local ? ` • ${m.local}` : ''}
              ${m.cidade ? ` (${m.cidade})` : ''}
              ${m.bispo_ordenante || m.celebrante ? ` • ${m.bispo_ordenante ? `Bispo: ${m.bispo_ordenante}` : `Celebrante: ${m.celebrante}`}` : ''}
            </li>
          `).join('')}
        </ul>
      ` : '<p style="font-size: 13px; color: #707070;">Nenhum ministério/ordem registrado.</p>'}

      <!-- 6. FORMAÇÃO RELIGIOSA -->
      ${formacao.length > 0 ? `
        <div class="section-title">6. Formação Religiosa</div>
        <ul class="items-list">
          ${formacao.map((f: Record<string, string>) => `
            <li>
              <strong>${f.etapa || 'Etapa'}:</strong> ${f.instituicao || ''} ${f.local ? `(${f.local})` : ''}
              ${f.data_ingresso || f.data_conclusao ? ` • [${formatDate(f.data_ingresso)} a ${formatDate(f.data_conclusao)}]` : ''}
            </li>
          `).join('')}
        </ul>
      ` : ''}

      <!-- 7. SAÚDE E HABILIDADES -->
      ${(saude.tipo_sanguineo || saude.plano_saude || saude.contato_emergencia || competencias.length > 0) ? `
        <div class="section-title">7. Informações de Saúde e Competências</div>
        <table class="grid">
          ${saude.tipo_sanguineo ? `<tr><td class="label">Tipo Sanguíneo:</td><td class="value">${saude.tipo_sanguineo} ${saude.fator_rh ? `(${saude.fator_rh})` : ''}</td></tr>` : ''}
          ${saude.plano_saude ? `<tr><td class="label">Plano de Saúde:</td><td class="value">${saude.plano_saude}</td></tr>` : ''}
          ${saude.contato_emergencia ? `<tr><td class="label">Contato de Emergência:</td><td class="value">${saude.contato_emergencia}</td></tr>` : ''}
        </table>
        ${competencias.length > 0 ? `
          <div style="margin-top: 8px;">
            ${competencias.map((c: Record<string, string>) => `<span class="badge">${c.competencia}</span>`).join('')}
          </div>
        ` : ''}
      ` : ''}

      <div style="text-align: center; margin-top: 32px;">
        <p style="font-size: 13px; color: #707070;">
          Você pode acessar a qualquer momento o Portal do Confrade para visualizar ou imprimir sua <strong>Ficha Canônica em PDF</strong>:
        </p>
        <a href="https://sistema.brm.org.br/portal-religioso" class="btn" target="_blank">Acessar Portal do Confrade</a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;"><strong>Secretaria Provincial BRM</strong> • Província Brasil Meridional</p>
      <p style="margin: 0;">Av. Barão do Rio Branco, 400 • Jaraguá do Sul - SC • CEP 89251-400</p>
      <p style="margin: 6px 0 0 0; font-size: 11px; color: #a1a1aa;">Este e-mail é gerado automaticamente. Por favor, guarde-o para fins de arquivo pessoal.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // 4. Disparar o e-mail via Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [destinatario],
        subject: `Cópia da Ficha Cadastral BRM - ${nomeExibicao}`,
        html: htmlEmail,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Falha ao enviar e-mail via Resend:", resendData);
      return corsResponse({
        error: "Falha ao enviar e-mail pelo Resend",
        details: resendData,
      }, 500);
    }

    console.log(`E-mail com cópia da ficha enviado com sucesso para ${destinatario} (Resend ID: ${resendData.id})`);
    return corsResponse({
      ok: true,
      message: `E-mail com cópia da ficha enviado para ${destinatario}`,
      id: resendData.id,
    });
  } catch (error) {
    console.error("Erro interno na função enviar-ficha-religioso:", error);
    return corsResponse({
      error: error instanceof Error ? error.message : "Erro inesperado ao processar envio",
    }, 500);
  }
});
