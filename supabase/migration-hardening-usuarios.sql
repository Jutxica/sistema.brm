-- Fecha as políticas legadas da tabela usuarios e impede autoconcessão de acessos.
-- Revisar duplicidades de auth_user_id antes da aplicação; o índice exige vínculo único.
begin;

do $$
begin
  if exists (
    select 1
    from public.usuarios
    where auth_user_id is not null
    group by auth_user_id
    having count(*) > 1
  ) then
    raise exception 'Há auth_user_id duplicado em public.usuarios. Corrija os vínculos antes de aplicar esta migração.';
  end if;
end;
$$;

create unique index if not exists usuarios_auth_user_id_unique
  on public.usuarios(auth_user_id)
  where auth_user_id is not null;

do $$
begin
  if to_regprocedure('public.set_updated_at()') is not null then
    execute 'alter function public.set_updated_at() set search_path = pg_catalog';
  end if;
  if to_regprocedure('public.religiosos_set_updated_at()') is not null then
    execute 'alter function public.religiosos_set_updated_at() set search_path = pg_catalog';
  end if;
  if to_regprocedure('public.trg_prevent_audit_mutation()') is not null then
    execute 'alter function public.trg_prevent_audit_mutation() set search_path = pg_catalog';
  end if;
end;
$$;

create or replace function public.usuario_tem_papel(papel_requerido text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select coalesce((
    select jsonb_typeof(u.usu_acessos) = 'array'
      and (u.usu_acessos ? 'admin' or u.usu_acessos ? papel_requerido)
    from public.usuarios u
    where u.auth_user_id = auth.uid()
      and u.usu_status = 'Ativo'
    limit 1
  ), false);
$$;

revoke all on function public.usuario_tem_papel(text) from public, anon;
grant execute on function public.usuario_tem_papel(text) to anon, authenticated, service_role;

create or replace function public.usuarios_impedir_autopromocao()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if auth.uid() is not null
    and old.auth_user_id = auth.uid()
    and not public.usuario_tem_papel('admin')
    and (
      new.usu_acessos is distinct from old.usu_acessos
      or new.auth_user_id is distinct from old.auth_user_id
    ) then
    raise exception 'Somente um administrador pode alterar os próprios acessos ou vínculo de autenticação.';
  end if;

  return new;
end;
$$;

revoke all on function public.usuarios_impedir_autopromocao() from public, anon, authenticated;

drop trigger if exists usuarios_impedir_autopromocao on public.usuarios;
create trigger usuarios_impedir_autopromocao
  before update on public.usuarios
  for each row execute function public.usuarios_impedir_autopromocao();

alter table public.usuarios enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'usuarios'
  loop
    execute format('drop policy %I on public.usuarios', policy_record.policyname);
  end loop;
end;
$$;

create policy usuarios_select_own_or_manager
  on public.usuarios for select to authenticated
  using (
    auth_user_id = (select auth.uid())
    or public.usuario_tem_papel('usuarios')
  );

create policy usuarios_insert_manager
  on public.usuarios for insert to authenticated
  with check (public.usuario_tem_papel('usuarios'));

create policy usuarios_update_manager
  on public.usuarios for update to authenticated
  using (public.usuario_tem_papel('usuarios'))
  with check (public.usuario_tem_papel('usuarios'));

create policy usuarios_delete_manager
  on public.usuarios for delete to authenticated
  using (public.usuario_tem_papel('usuarios'));

revoke all on public.usuarios from public, anon, authenticated;
grant select, insert, update, delete on public.usuarios to authenticated;
grant all on public.usuarios to service_role;

commit;
