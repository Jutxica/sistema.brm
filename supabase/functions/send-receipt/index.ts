// Supabase Edge Function: send-receipt
// Dispara um e-mail de confirmação de inscrição para o hóspede.
//
// Assinatura: POST /functions/v1/send-receipt
// Body: { "id": "<idhospedagens>", "token": "<segredo privado do recibo>" }
//
// A function lê SMTP de mainhospedagem (service_role bypassa RLS).
// O template do e-mail é main_mensagememail, com placeholders:
//   [[hos_nome]]           -> nome do inscrito
//   [[hos_estadiamotivo]]   -> id do evento (substituído pelo motivo textual)
//
// Deploy: Criar no Dashboard do Supabase (Edge Functions -> New Function -> Via Editor)
// Nome da função: send-receipt
import nodemailer from "npm:nodemailer@6.9.13";

// Headers CORS para permitir chamadas do frontend
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, apikey, Content-Type, x-client-info",
};

function corsResponse(body: string, init: ResponseInit): Response {
  return new Response(body, {
    ...init,
    headers: { ...CORS_HEADERS, ...(init.headers || {}), "Content-Type": "application/json" },
  });
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Inscrito {
  idhospedagens: number;
  hos_recibo_token: string;
  hos_nome: string | null;
  hos_email: string | null;
  hos_estadiamotivo: number | null;
}

interface Estadia {
  idmainhospedagem: number;
  main_motivo: string | null;
  main_mensagememail: string | null;
  main_email: string | null;
  main_senha: string | null;
  main_host: string | null;
  main_porta: string | number | null;
  main_seguranca: string | null;
  main_remetente: string | null;
}

function sanitizeText(value: string | null | undefined): string {
  return String(value ?? "").replace(/[\r\n\t]+/g, " ").trim();
}

function replacePlaceholders(template: string, map: Record<string, string>): string {
  return template.replace(/\[\[([a-zA-Z_]+)\]\]/g, (_, key) => sanitizeText(map[key] ?? ""));
}

async function fetchInscrito(id: number, token?: string): Promise<Inscrito | null> {
  let url = `${SUPABASE_URL}/rest/v1/hospedagens?select=idhospedagens,hos_recibo_token,hos_nome,hos_email,hos_estadiamotivo&idhospedagens=eq.${id}&limit=1`;
  if (token) {
    url += `&hos_recibo_token=eq.${encodeURIComponent(token)}`;
  }
  const res = await fetch(
    url,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as Inscrito[];
  return rows[0] ?? null;
}

async function fetchEstadia(estadiaMotivoId: number | null): Promise<Estadia | null> {
  if (estadiaMotivoId == null) return null;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/mainhospedagem?select=idmainhospedagem,main_motivo,main_mensagememail,main_email,main_senha,main_host,main_porta,main_seguranca,main_remetente&idmainhospedagem=eq.${estadiaMotivoId}&limit=1`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as Estadia[];
  return rows[0] ?? null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return corsResponse(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  let body: { id?: string | number; token?: string };
  try {
    body = await req.json();
  } catch {
    return corsResponse(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  const authHeader = req.headers.get("Authorization") || "";
  const isAuthCaller = authHeader.startsWith("Bearer ") && authHeader.length > 30;

  const id = Number(body.id);
  const token = typeof body.token === "string" ? body.token.trim() : undefined;
  const hasValidToken = Boolean(token && /^[0-9a-f-]{36}$/i.test(token));

  if (!Number.isSafeInteger(id) || id <= 0 || (!hasValidToken && !isAuthCaller)) {
    return corsResponse(JSON.stringify({ error: "Missing or invalid receipt credentials" }), { status: 400 });
  }

  const inscrito = await fetchInscrito(id, hasValidToken ? token : undefined);
  if (!inscrito || !inscrito.hos_email) {
    return corsResponse(JSON.stringify({ error: "Inscrito não encontrado ou sem e-mail" }), { status: 404 });
  }

  const estadia = await fetchEstadia(inscrito.hos_estadiamotivo);
  if (!estadia) {
    return corsResponse(JSON.stringify({ error: "Configuração de estadia não encontrada" }), { status: 404 });
  }

  const template = estadia.main_mensagememail;
  if (!template || !template.trim()) {
    return corsResponse(JSON.stringify({ error: "Template de e-mail vazio (main_mensagememail)" }), { status: 422 });
  }

  const map: Record<string, string> = {
    "[[hos_nome]]": inscrito.hos_nome || "",
    "[[hos_estadiamotivo]]": estadia.main_motivo || String(inscrito.hos_estadiamotivo ?? ""),
  };
  const subject = `Confirmação de Inscrição: ${sanitizeText(estadia.main_motivo || 'Hospedaria')}`;
  const htmlBody = replacePlaceholders(template, map);

  const host = sanitizeText(estadia.main_host);
  const port = estadia.main_porta ? Number(estadia.main_porta) : 587;
  const user = sanitizeText(estadia.main_email);
  const pass = sanitizeText(estadia.main_senha);
  const fromName = sanitizeText(estadia.main_remetente || "Província BRM");
  const fromAddress = user;

  if (!host || !user || !pass) {
    return corsResponse(JSON.stringify({ error: "Configuração SMTP incompleta em mainhospedagem" }), { status: 422 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465, // SSL direto na 465, STARTTLS na 587
      auth: {
        user: user,
        pass: pass,
      },
      tls: {
        rejectUnauthorized: false, // Evita falhas com certificados autoassinados de cPanel
      },
    });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: inscrito.hos_email,
      subject: subject,
      html: htmlBody,
    });

    return corsResponse(JSON.stringify({ success: true, to: inscrito.hos_email, messageId: info.messageId }), { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Erro no envio SMTP:", msg);
    return corsResponse(JSON.stringify({ error: msg }), { status: 500 });
  }
});
