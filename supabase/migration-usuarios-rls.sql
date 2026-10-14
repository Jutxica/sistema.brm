begin;

create or replace function public.usuario_tem_papel(papel_requerido text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(
    (
      select case
        when jsonb_typeof(usu_acessos) <> 'array' then false
        when usu_acessos ? 'admin' then true
        else usu_acessos ? papel_requerido
      end
      from public.usuarios
      where auth_user_id = auth.uid()
        and usu_status = 'Ativo'
      limit 1
    ),
    false
  );
$$;

revoke all on function public.usuario_tem_papel(text) from public;
grant execute on function public.usuario_tem_papel(text) to authenticated, service_role;

alter table public.usuarios enable row level security;

drop policy if exists usuarios_select_own_or_manager on public.usuarios;
create policy usuarios_select_own_or_manager
  on public.usuarios
  for select
  to authenticated
  using (
    auth_user_id = (select auth.uid())
    or public.usuario_tem_papel('usuarios')
  );

drop policy if exists usuarios_insert_manager on public.usuarios;
create policy usuarios_insert_manager
  on public.usuarios
  for insert
  to authenticated
  with check (public.usuario_tem_papel('usuarios'));

drop policy if exists usuarios_update_manager on public.usuarios;
create policy usuarios_update_manager
  on public.usuarios
  for update
  to authenticated
  using (public.usuario_tem_papel('usuarios'))
  with check (public.usuario_tem_papel('usuarios'));

drop policy if exists usuarios_delete_manager on public.usuarios;
create policy usuarios_delete_manager
  on public.usuarios
  for delete
  to authenticated
  using (public.usuario_tem_papel('usuarios'));

commit;
