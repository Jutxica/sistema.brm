-- Permite que a Secretaria vincule uma conta autenticada ao cadastro mínimo do Elenco.
-- Execute depois das migrações de designações/cadastro mínimo e da carga de pessoas.
-- NÃO APLICAR nesta etapa; manter o vínculo normal pelo cadastro do Portal/CPF.

begin;

do $$
begin
  if exists (
    select auth_user_id
      from public.religiosos
     where auth_user_id is not null
     group by auth_user_id
    having count(*) > 1
  ) then
    raise exception 'Há contas vinculadas a mais de um religioso. Corrija os vínculos duplicados antes desta migração.';
  end if;
end;
$$;

create unique index if not exists idx_religiosos_auth_user_id_unique
  on public.religiosos (auth_user_id)
  where auth_user_id is not null;

create or replace function public.proteger_vinculo_auth_religioso()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.elenco_secretaria_autorizada() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.auth_user_id is not null and new.auth_user_id is distinct from auth.uid() then
      raise exception 'Uma conta só pode criar o próprio vínculo de autenticação.'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if new.auth_user_id is distinct from old.auth_user_id then
    if old.auth_user_id is null
      and new.auth_user_id = auth.uid()
      and nullif(lower(coalesce(auth.jwt() ->> 'email', '')), '') is not null
      and lower(auth.jwt() ->> 'email') in (
        nullif(lower(old.email_institucional), ''),
        nullif(lower(old.email_pessoal), '')
      ) then
      return new;
    end if;

    raise exception 'Somente a Secretaria pode alterar o vínculo da conta do religioso.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_vinculo_auth_religioso on public.religiosos;
create trigger trg_proteger_vinculo_auth_religioso
  before insert or update of auth_user_id on public.religiosos
  for each row execute function public.proteger_vinculo_auth_religioso();

revoke all on function public.proteger_vinculo_auth_religioso() from public;

create or replace function public.vincular_religioso_usuario_elenco(
  p_religioso_id uuid,
  p_auth_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_auth_user_id uuid;
begin
  if not public.elenco_secretaria_autorizada() then
    raise exception 'Apenas a Secretaria pode vincular uma conta ao Elenco.'
      using errcode = '42501';
  end if;

  if p_religioso_id is null or p_auth_user_id is null then
    raise exception 'Informe o religioso e o UUID da conta autenticada.'
      using errcode = '22023';
  end if;

  if not exists (select 1 from auth.users where id = p_auth_user_id) then
    raise exception 'O UUID informado não corresponde a uma conta existente no Supabase Auth.'
      using errcode = '22023';
  end if;

  select auth_user_id
    into v_auth_user_id
    from public.religiosos
   where id = p_religioso_id
   for update;

  if not found then
    raise exception 'Religioso não encontrado.'
      using errcode = 'P0002';
  end if;

  if v_auth_user_id is not null and v_auth_user_id <> p_auth_user_id then
    raise exception 'Este religioso já está vinculado a outra conta. Solicite revisão antes de alterar.'
      using errcode = '23505';
  end if;

  if exists (
    select 1
      from public.religiosos
     where auth_user_id = p_auth_user_id
       and id <> p_religioso_id
  ) then
    raise exception 'Esta conta já está vinculada a outro religioso.'
      using errcode = '23505';
  end if;

  update public.religiosos
     set auth_user_id = p_auth_user_id
   where id = p_religioso_id;
end;
$$;

revoke all on function public.vincular_religioso_usuario_elenco(uuid, uuid) from public;
grant execute on function public.vincular_religioso_usuario_elenco(uuid, uuid) to authenticated;

commit;
