-- Auditoria somente de leitura do estado REAL do projeto Supabase.
-- Execute no SQL Editor. Nenhuma consulta abaixo altera dados ou políticas.
-- Execute antes e depois das migrações de hardening e compare os resultados.
-- Depois, teste com sessão anon e com usuário autenticado sem módulo: leitura e
-- escrita indevidas devem falhar; cadastro público só deve criar inscrição própria
-- pelo RPC, sem permitir SELECT/UPDATE em hospedagens.

-- 1. Todas as tabelas públicas e estado do RLS.
select
  n.nspname as schemaname,
  c.relname as tablename,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname;

-- 1b. Vínculos de autenticação duplicados bloqueiam a migração de usuários.
select auth_user_id, count(*) as profile_count
from public.usuarios
where auth_user_id is not null
group by auth_user_id
having count(*) > 1
order by profile_count desc;

-- 2. Privilégios de tabela concedidos aos papéis da API.
select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role')
order by table_name, grantee, privilege_type;

-- 2b. Privilégios por coluna, importantes quando SELECT é concedido só em campos específicos.
select
  table_schema,
  table_name,
  column_name,
  grantee,
  privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role')
order by table_name, column_name, grantee, privilege_type;

-- 3. Políticas realmente instaladas, incluindo comandos, papéis e expressões.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as check_expression
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;

-- 4. Tabelas/comandos com várias políticas permissivas (essas regras se combinam com OR).
with effective_policy_roles as (
  select
    p.schemaname,
    p.tablename,
    p.policyname,
    p.permissive,
    p.cmd,
    effective_role.role_name
  from pg_policies p
  cross join lateral unnest(p.roles) as policy_role(role_name)
  cross join lateral unnest(
    case
      when policy_role.role_name = 'public'::name
        then array['anon'::name, 'authenticated'::name]
      else array[policy_role.role_name]
    end
  ) as effective_role(role_name)
  where p.schemaname = 'public'
    and p.permissive = 'PERMISSIVE'
)
select
  schemaname,
  tablename,
  cmd,
  role_name,
  count(*) as permissive_policy_count,
  array_agg(policyname order by policyname) as policy_names
from effective_policy_roles
group by schemaname, tablename, cmd, role_name
having count(*) > 1
order by tablename, cmd;

-- 5. Views públicas e opções de segurança. Procure security_invoker=true.
select
  n.nspname as schema_name,
  c.relname as view_name,
  c.reloptions,
  coalesce(c.reloptions @> array['security_invoker=true'], false) as security_invoker,
  pg_get_viewdef(c.oid, true) as view_definition
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('v', 'm')
order by c.relname;

-- 6. Funções SECURITY DEFINER, search_path e papéis com EXECUTE.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  p.proconfig as function_settings,
  coalesce(
    array_agg(distinct case
      when acl.grantee = 0 then 'PUBLIC'
      else grantee.rolname
    end) filter (where acl.privilege_type = 'EXECUTE'),
    array[]::name[]
  ) as execute_grantees,
  pg_get_functiondef(p.oid) as function_definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
left join lateral aclexplode(
  coalesce(p.proacl, acldefault('f', p.proowner))
) acl on true
left join pg_roles grantee on grantee.oid = acl.grantee
where n.nspname = 'public'
  and p.prosecdef
group by n.nspname, p.proname, p.oid, p.prosecdef, p.proconfig
order by p.proname, arguments;

-- 7. Políticas e visibilidade pública dos objetos do Storage.
select
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as check_expression
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;
