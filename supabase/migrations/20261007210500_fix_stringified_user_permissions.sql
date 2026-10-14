begin;

create or replace function public.usuario_tem_papel(papel_requerido text)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog
as $$
declare
  v_acessos jsonb;
begin
  if auth.uid() is null or papel_requerido is null then
    return false;
  end if;

  select u.usu_acessos
  into v_acessos
  from public.usuarios u
  where u.auth_user_id = auth.uid()
    and u.usu_status = 'Ativo'
  limit 1;

  if v_acessos is null then
    return false;
  end if;

  if jsonb_typeof(v_acessos) = 'string' then
    begin
      v_acessos := (v_acessos #>> '{}')::jsonb;
    exception
      when invalid_text_representation then
        return false;
    end;
  end if;

  if jsonb_typeof(v_acessos) <> 'array' then
    return false;
  end if;

  return v_acessos ? 'admin' or v_acessos ? papel_requerido;
end;
$$;

revoke all on function public.usuario_tem_papel(text) from public, anon;
grant execute on function public.usuario_tem_papel(text) to anon, authenticated, service_role;

commit;
