import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";

const PAGE_SIZE = 100;
const MAX_AUTH_PAGES = 100;
const MAX_REASON_LENGTH = 1_000;
const MAX_NAME_LENGTH = 160;
const BAN_DURATION = "876000h";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_HEADERS = "Authorization, apikey, Content-Type, x-client-info";

class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

type JsonObject = Record<string, unknown>;

interface StaffAccount {
  auth_user_id: string;
  usu_nome: string | null;
  usu_status: string;
  usu_acessos: unknown;
}

interface AuthAccount {
  id: string;
  email?: string;
  created_at?: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  banned_until?: string;
}

function allowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  if (origin === "https://sistema.brm.org.br") return true;
  return /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/.test(origin);
}

function corsHeaders(origin: string | null): Headers {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Vary": "Origin",
    "Content-Type": "application/json",
  });
  if (origin && allowedOrigin(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

function jsonResponse(
  body: JsonObject,
  status: number,
  origin: string | null,
): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

function fail(status: number, message: string): never {
  throw new HttpError(status, message);
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePermissions(raw: unknown): string[] {
  let value = raw;
  for (let depth = 0; depth < 3 && typeof value === "string"; depth++) {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value.filter((permission): permission is string => typeof permission === "string");
}

function getReason(value: unknown, required: boolean): string | null {
  if (value === undefined || value === null) {
    if (required) fail(400, "Informe o motivo da operação.");
    return null;
  }
  if (typeof value !== "string") fail(400, "O motivo deve ser um texto.");
  const reason = value.trim();
  if (!reason && required) fail(400, "Informe o motivo da operação.");
  if (reason.length > MAX_REASON_LENGTH) {
    fail(400, `O motivo não pode exceder ${MAX_REASON_LENGTH} caracteres.`);
  }
  return reason || null;
}

function validateUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    fail(400, `${field} inválido.`);
  }
  return value;
}

function getErrorMessage(error: unknown): string {
  if (isObject(error) && typeof error.message === "string") return error.message;
  return error instanceof Error ? error.message : "Erro inesperado.";
}

function throwDatabaseError(operation: string, error: unknown): never {
  console.error(`${operation}:`, getErrorMessage(error));
  fail(500, `Não foi possível ${operation}.`);
}

async function recordEvent(
  service: SupabaseClient,
  target: { id: string; email: string | null },
  action: string,
  actor: { id: string; name: string },
  reason: string | null,
): Promise<void> {
  const { error } = await service.from("secretaria_contas_eventos").insert({
    id: crypto.randomUUID(),
    auth_user_id: target.id,
    email_snapshot: target.email ?? "(sem e-mail)",
    acao: action,
    ator_id: actor.id,
    ator_nome: actor.name,
    motivo: reason,
    criado_em: new Date().toISOString(),
  });
  if (error) throwDatabaseError("registrar o evento da conta", error);
}

async function getActor(
  service: SupabaseClient,
  user: User,
): Promise<{ id: string; name: string }> {
  const { data, error } = await service
    .from("usuarios")
    .select("auth_user_id, usu_nome, usu_status, usu_acessos")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) throwDatabaseError("validar as permissões do operador", error);
  const staff = data as StaffAccount | null;
  const permissions = parsePermissions(staff?.usu_acessos);
  const authorized = permissions.some((permission) =>
    ["admin", "secretaria", "religiosos"].includes(permission)
  );

  if (!staff || staff.usu_status !== "Ativo" || !authorized) {
    fail(403, "Acesso negado: são necessárias permissões ativas de administração, secretaria ou religiosos.");
  }

  const name = typeof staff.usu_nome === "string" && staff.usu_nome.trim()
    ? staff.usu_nome.trim()
    : "Usuário sem nome";
  return { id: user.id, name };
}

async function fetchAllAuthUsers(service: SupabaseClient): Promise<AuthAccount[]> {
  const users: AuthAccount[] = [];
  for (let page = 1; page <= MAX_AUTH_PAGES; page++) {
    const { data, error } = await service.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });
    if (error) throwDatabaseError("listar as contas de acesso", error);
    const currentPage = data.users as AuthAccount[];
    users.push(...currentPage);
    if (currentPage.length < PAGE_SIZE) return users;
  }
  fail(503, "O limite de páginas da listagem foi atingido; nenhuma lista parcial foi retornada.");
}

async function fetchRowsInBatches<T>(
  service: SupabaseClient,
  table: string,
  select: string,
  ids: string[],
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; offset < ids.length; offset += 250) {
    const batch = ids.slice(offset, offset + 250);
    const { data, error } = await service
      .from(table)
      .select(select)
      .in("auth_user_id", batch);
    if (error) throwDatabaseError(`consultar ${table}`, error);
    rows.push(...(data as T[]));
  }
  return rows;
}

async function listAccounts(service: SupabaseClient): Promise<JsonObject> {
  const users = await fetchAllAuthUsers(service);
  const ids = users.map((user) => user.id);
  const [religiosos, accessRows] = await Promise.all([
    fetchRowsInBatches<{
      auth_user_id: string;
      id: string;
      nome_religioso: string | null;
      nome_civil: string | null;
    }>(service, "religiosos", "auth_user_id, id, nome_religioso, nome_civil", ids),
    fetchRowsInBatches<{
      auth_user_id: string;
      email: string | null;
      origem: string | null;
      criado_em: string | null;
      criado_por: string | null;
      criado_por_nome: string | null;
      estado: string | null;
    }>(
      service,
      "secretaria_contas_acesso",
      "auth_user_id, email, origem, criado_em, criado_por, criado_por_nome, estado",
      ids,
    ),
  ]);

  const religiosoByUser = new Map(religiosos.map((row) => [row.auth_user_id, row]));
  const ledgerByUser = new Map(accessRows.map((row) => [row.auth_user_id, row]));
  return {
    accounts: users.map((user) => {
      const religioso = religiosoByUser.get(user.id);
      const ledger = ledgerByUser.get(user.id);
      return {
        id: user.id,
        email: user.email ?? null,
        created_at: user.created_at ?? null,
        email_confirmed_at: user.email_confirmed_at ?? null,
        last_sign_in_at: user.last_sign_in_at ?? null,
        banned_until: user.banned_until ?? null,
        linked_religioso_id: religioso?.id ?? null,
        linked_religioso_nome: religioso?.nome_religioso || religioso?.nome_civil || null,
        ledger: ledger
          ? {
            origin: ledger.origem,
            created_by: ledger.criado_por,
            created_by_name: ledger.criado_por_nome,
            created_at: ledger.criado_em,
            state: ledger.estado,
          }
          : null,
      };
    }),
  };
}

async function inviteAccount(
  service: SupabaseClient,
  actor: { id: string; name: string },
  body: JsonObject,
): Promise<JsonObject> {
  if (typeof body.email !== "string") fail(400, "Informe um e-mail válido.");
  const email = body.email.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) fail(400, "E-mail inválido.");

  if (typeof body.nome !== "string") fail(400, "Informe o nome da pessoa convidada.");
  const name = body.nome.trim();
  if (!name || name.length > MAX_NAME_LENGTH) {
    fail(400, `O nome deve ter entre 1 e ${MAX_NAME_LENGTH} caracteres.`);
  }

  const { data, error } = await service.auth.admin.inviteUserByEmail(email, {
    data: { nome: name },
  });
  if (error) {
    console.error("Falha ao convidar conta:", error.message);
    fail(error.status === 422 ? 409 : 502, "Não foi possível enviar o convite para este e-mail.");
  }
  if (!data.user) fail(502, "O serviço de autenticação não retornou a conta convidada.");

  const createdAt = new Date().toISOString();
  const { error: ledgerError } = await service.from("secretaria_contas_acesso").upsert({
    auth_user_id: data.user.id,
    email,
    origem: "secretaria",
    criado_em: createdAt,
    criado_por: actor.id,
    criado_por_nome: actor.name,
    estado: "convite_enviado",
  }, { onConflict: "auth_user_id" });
  if (ledgerError) {
    console.error("Convite criado, mas o ledger falhou:", ledgerError.message);
    fail(500, `O convite foi criado, mas não foi possível registrar o ledger (conta ${data.user.id}).`);
  }

  await recordEvent(
    service,
    { id: data.user.id, email },
    "convite_enviado",
    actor,
    null,
  );
  return { success: true };
}

async function changeBan(
  service: SupabaseClient,
  actor: { id: string; name: string },
  body: JsonObject,
): Promise<JsonObject> {
  const userId = validateUuid(body.user_id, "user_id");
  const action = body.action as string;
  if (action !== "block" && action !== "unblock") fail(400, "Ação de bloqueio inválida.");
  const reason = getReason(body.reason, true);
  if (userId === actor.id) fail(400, "Não é possível alterar o bloqueio da própria conta.");

  const { data, error } = await service.auth.admin.updateUserById(userId, {
    ban_duration: action === "block" ? BAN_DURATION : "none",
  });
  if (error) {
    console.error(`Falha ao ${action === "block" ? "bloquear" : "desbloquear"} conta:`, error.message);
    fail(error.status === 404 ? 404 : 502, "Não foi possível alterar o bloqueio da conta.");
  }

  const { error: ledgerError } = await service
    .from("secretaria_contas_acesso")
    .update({ estado: action === "block" ? "bloqueado" : "ativo" })
    .eq("auth_user_id", userId);
  let persistenceError: string | null = ledgerError?.message ?? null;

  const eventAction = action === "block" ? "bloqueio_ativado" : "bloqueio_removido";
  try {
    await recordEvent(
      service,
      { id: userId, email: data.user.email ?? null },
      eventAction,
      actor,
      reason,
    );
  } catch (error) {
    persistenceError = [persistenceError, getErrorMessage(error)].filter(Boolean).join("; ");
  }
  if (persistenceError) {
    console.error("Estado de autenticação atualizado, mas o registro do evento/ledger falhou:", persistenceError);
    fail(500, "O bloqueio foi alterado, mas não foi possível persistir integralmente o registro da operação.");
  }
  return { success: true };
}

function missingProfileTable(error: unknown): boolean {
  if (!isObject(error)) return false;
  return error.code === "42P01" || error.code === "PGRST205";
}

async function deleteAccount(
  service: SupabaseClient,
  actor: { id: string; name: string },
  body: JsonObject,
): Promise<JsonObject> {
  const userId = validateUuid(body.user_id, "user_id");
  const reason = getReason(body.reason, true);
  if (userId === actor.id) fail(400, "Não é possível excluir a própria conta.");

  const { data: target, error: lookupError } = await service.auth.admin.getUserById(userId);
  if (lookupError || !target.user) {
    fail(lookupError?.status === 404 ? 404 : 404, "Conta de autenticação não encontrada.");
  }

  const { error: profileError } = await service
    .from("portal_perfis_religiosos")
    .delete()
    .eq("auth_user_id", userId);
  if (profileError && !missingProfileTable(profileError)) {
    throwDatabaseError("remover o perfil de acesso ao portal", profileError);
  }

  const { error: detachError } = await service
    .from("religiosos")
    .update({ auth_user_id: null })
    .eq("auth_user_id", userId);
  if (detachError) throwDatabaseError("desvincular a ficha religiosa", detachError);

  const { error: deleteError } = await service.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error("Falha ao excluir identidade de autenticação:", deleteError.message);
    fail(502, "Não foi possível excluir a identidade de autenticação. A ficha religiosa e os documentos foram preservados.");
  }

  const { error: ledgerError } = await service
    .from("secretaria_contas_acesso")
    .update({ estado: "excluido" })
    .eq("auth_user_id", userId);
  if (ledgerError) {
    console.error("Conta removida, mas o ledger não pôde ser atualizado:", ledgerError.message);
    fail(500, "A conta foi removida e o vínculo preservado, mas não foi possível atualizar o registro de auditoria.");
  }

  await recordEvent(service, {
    id: userId,
    email: target.user.email ?? "(sem e-mail)",
  }, "conta_excluida", actor, reason);
  return { success: true };
}

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  if (!allowedOrigin(origin)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, null);
  }
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, origin);
  }

  try {
    const authorization = req.headers.get("authorization") ?? "";
    const bearer = authorization.match(/^Bearer\s+(\S+)$/i);
    if (!bearer) fail(401, "É necessário um token Bearer válido.");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("Configuração Supabase ausente na Edge Function.");
      fail(500, "A configuração do serviço está incompleta.");
    }

    const identityClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: identity, error: identityError } = await identityClient.auth.getUser(bearer[1]);
    if (identityError || !identity.user) fail(401, "Token inválido ou expirado.");

    const service = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const actor = await getActor(service, identity.user);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      fail(400, "Corpo JSON inválido.");
    }
    if (!isObject(body)) fail(400, "O corpo da requisição deve ser um objeto JSON.");
    if (typeof body.action !== "string") fail(400, "Informe uma ação válida.");

    switch (body.action) {
      case "list":
        return jsonResponse(await listAccounts(service), 200, origin);
      case "invite":
        return jsonResponse(await inviteAccount(service, actor, body), 200, origin);
      case "block":
      case "unblock":
        return jsonResponse(await changeBan(service, actor, body), 200, origin);
      case "delete":
        return jsonResponse(await deleteAccount(service, actor, body), 200, origin);
      default:
        fail(400, "Ação não reconhecida.");
    }
  } catch (error) {
    if (error instanceof HttpError) return jsonResponse({ error: error.message }, error.status, origin);
    console.error("Erro não tratado em secretaria-contas:", getErrorMessage(error));
    return jsonResponse({ error: "Erro interno ao processar a operação." }, 500, origin);
  }
});
