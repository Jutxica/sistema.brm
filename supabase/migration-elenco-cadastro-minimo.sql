-- Cadastro mínimo de religiosos a partir do Elenco aprovado.
-- Não preenche dados civis, de contato ou de saúde.

begin;

alter table public.religiosos
  add column if not exists nome_elenco text,
  add column if not exists cadastro_elenco_provisorio boolean not null default false;

alter table public.religiosos
  alter column nome_civil drop not null;

create or replace function public.usuario_tem_papel(papel_requerido text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios usuario
    where (usuario.auth_user_id = auth.uid() or usuario.idusuarios = auth.uid())
      and usuario.usu_status = 'Ativo'
      and jsonb_typeof(usuario.usu_acessos) = 'array'
      and (
        usuario.usu_acessos ? 'admin'
        or usuario.usu_acessos ? coalesce(papel_requerido, '')
      )
  );
$$;

revoke all on function public.usuario_tem_papel(text) from public;
grant execute on function public.usuario_tem_papel(text) to authenticated;

create or replace function public.elenco_secretaria_autorizada()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select session_user = 'postgres'
    or public.usuario_tem_papel('secretaria');
$$;

revoke all on function public.elenco_secretaria_autorizada() from public;
grant execute on function public.elenco_secretaria_autorizada() to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'religiosos_nome_elenco_nao_vazio'
      and conrelid = 'public.religiosos'::regclass
  ) then
    alter table public.religiosos
      add constraint religiosos_nome_elenco_nao_vazio
      check (nome_elenco is null or length(trim(nome_elenco)) > 0);
  end if;
end;
$$;

create index if not exists idx_religiosos_nome_elenco
  on public.religiosos (nome_elenco)
  where nome_elenco is not null;

commit;
