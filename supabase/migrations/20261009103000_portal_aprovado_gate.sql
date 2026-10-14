begin;

create or replace function public.elenco_usuario_pode_ler_designacoes()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select public.elenco_secretaria_autorizada()
    or exists (
      select 1
      from public.religiosos r
      where r.status_cadastro = 'Aprovado'
        and r.auth_user_id = auth.uid()
    );
$$;

revoke all on function public.elenco_usuario_pode_ler_designacoes() from public;
grant execute on function public.elenco_usuario_pode_ler_designacoes() to authenticated;

drop policy if exists religiosos_designacoes_secretaria_select
  on public.religiosos_designacoes;
create policy religiosos_designacoes_secretaria_select
  on public.religiosos_designacoes for select to authenticated
  using (public.elenco_usuario_pode_ler_designacoes());

commit;
