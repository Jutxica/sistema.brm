// Supabase Edge Function: send-receipt
// Dispara um e-mail de confirmação de inscrição para o hóspede.
//
// Assinatura: POST /functions/v1/send-receipt
// Body: { "id": "<idhospedagens>" }
//
// A function lê SMTP de mainhospedagem (service_role bypassa RLS).
// O template do e-mail é main_mensagememail, com placeholders:
//   [[hos_nome]]           -> nome do inscrito
//   [[hos_estadiamotivo]]   -> id do evento (substituído pelo motivo textual)
//
// Deploy: supabase functions deploy send-receipt --verify-jwt
import { SMTPClient } from "https://deno.land/x/smtp/mod.ts";


// Headers CORS — o Supabase repassa se a function não definir, mas custom functions
// devem devolvê-los para que o SPA (http://localhost:5173) consiga ler a resposta.
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
  main_porta: number | null;
  main_seguranca: string | null;
  main_remetente: string | null;
}

function replacePlaceholders(template: string, map: Record<string, string>): string {
  return template.replace(/\[\[([a-zA-Z_]+)\]\]/g, (_, key) => map[key] ?? "");
}

async function fetchInscrito(id: number): Promise<Inscrito | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/hospedagens?select=idhospedagens,hos_nome,hos_email,hos_estadiamotivo&idhospedagens=eq.${id}&limit=1`,
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
    `${SUPABASE_URL}/rest/v1/mainhospedagem?select=*&idmainhospedagem=eq.${estadiaMotivoId}&limit=1`,
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

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return corsResponse(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  const id = Number(body.id);
  if (!Number.isFinite(id) || id <= 0) {
    return corsResponse(JSON.stringify({ error: "Missing or invalid 'id'" }), { status: 400 });
  }

  const inscrito = await fetchInscrito(id);
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
  const subject = "Confirmação de Inscrição";
  const htmlBody = replacePlaceholders(template, map);

  const host = estadia.main_host;
  const port = estadia.main_porta ?? 587;
  const user = estadia.main_email;
  const pass = estadia.main_senha;
  const from = estadia.main_remetente || user;

  if (!host || !user || !pass) {
    return corsResponse(JSON.stringify({ error: "Configuração SMTP incompleta em mainhospedagem" }), { status: 422 });
  }

  try {
    const client = new SMTPClient({
      host,
      port,
      auth: {
        username: user,
        password: pass,
      },
    });
    await client.send({
      from,
      to: inscrito.hos_email,
      subject,
      content: htmlBody,
      html: htmlBody,
    });
    await client.close();

    return corsResponse(JSON.stringify({ success: true, to: inscrito.hos_email }), { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return corsResponse(JSON.stringify({ error: msg }), { status: 500 });
  }
});
