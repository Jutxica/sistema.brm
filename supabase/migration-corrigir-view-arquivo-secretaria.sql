-- Substitui a view SECURITY DEFINER por uma RPC com filtragem explícita.
-- Aplicar no Supabase para corrigir uma instalação existente da migração do arquivo.
begin;

drop view if exists public.secretaria_arquivo_protocolos_acesso;

create or replace function public.arquivo_listar_protocolos_acesso()
returns table (
  id uuid,
  numero_protocolo text,
  religioso_nome text,
  tipo_documento text,
  descricao text,
  status text,
  enviado_por_nome text,
  ultima_observacao text,
  criado_em timestamptz,
  atualizado_em timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select
    p.id,
    p.numero_protocolo,
    case when acesso.v_secretaria then p.religioso_nome
         when acesso.v_remetente_pode_ver then p.religioso_nome
         else null end,
    case when acesso.v_secretaria or acesso.v_remetente_pode_ver then p.tipo_documento
         else null end,
    case when acesso.v_secretaria or acesso.v_remetente_pode_ver then p.descricao
         else null end,
    p.status,
    case when acesso.v_secretaria or acesso.v_remetente_pode_ver then p.enviado_por_nome
         else null end,
    p.ultima_observacao,
    p.criado_em,
    p.atualizado_em
  from public.secretaria_arquivo_protocolos p
  cross join lateral (
    select
      public.arquivo_usuario_tem_papel('arquivo_secretaria')
        or public.arquivo_usuario_tem_papel('arquivo_substituto') as v_secretaria,
      p.enviado_por = auth.uid()
        and p.status in ('rascunho', 'enviado', 'em_conferencia', 'complementacao_solicitada')
        as v_remetente_pode_ver
  ) acesso
  where acesso.v_secretaria or p.enviado_por = auth.uid()
  order by p.atualizado_em desc;
$$;

revoke all on function public.arquivo_listar_protocolos_acesso() from public, anon;
grant execute on function public.arquivo_listar_protocolos_acesso() to authenticated, service_role;

commit;
