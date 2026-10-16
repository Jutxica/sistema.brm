begin;

create or replace function public.ensure_religious_portal_profile()
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_auth_user auth.users%rowtype;
  v_email text;
  v_meta jsonb;
  v_cpf text;
  v_name text;
  v_birth_date date;
  v_matches integer;
  v_religioso public.religiosos%rowtype;
begin
  if v_user_id is null then
    raise exception 'Faça login para vincular seu cadastro.';
  end if;

  select * into v_auth_user
  from auth.users
  where id = v_user_id
  for update;

  if v_auth_user.id is null or v_auth_user.email_confirmed_at is null then
    raise exception 'Confirme o e-mail da conta antes de acessar o portal.';
  end if;

  v_email := lower(trim(v_auth_user.email));
  if v_email is null or v_email = '' then
    raise exception 'A conta autenticada não possui um e-mail válido.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('email:' || v_email, 0));

  select count(*) into v_matches
  from public.religiosos
  where auth_user_id = v_user_id;

  if v_matches > 1 then
    raise exception 'Há mais de uma ficha vinculada à sua conta. Contate a Secretaria Provincial.';
  elsif v_matches = 1 then
    select * into v_religioso
    from public.religiosos
    where auth_user_id = v_user_id
    limit 1;
    if v_religioso.status_cadastro = 'Arquivado' then
      raise exception 'Esta ficha está arquivada. Contate a Secretaria Provincial.';
    end if;
    return v_religioso.id;
  end if;

  v_meta := coalesce(v_auth_user.raw_user_meta_data, '{}'::jsonb);
  v_cpf := regexp_replace(coalesce(v_meta->>'cpf', ''), '[^0-9]', '', 'g');
  v_name := nullif(trim(coalesce(v_meta->>'nome', '')), '');
  if v_name is null then
    select p.nome_civil into v_name
    from public.portal_perfis_religiosos p
    where p.auth_user_id = v_user_id
    limit 1;
  end if;

  v_birth_date := null;
  if coalesce(v_meta->>'data_nascimento', '') ~ '^\d{4}-\d{2}-\d{2}$' then
    v_birth_date := (v_meta->>'data_nascimento')::date;
  else
    select p.data_nascimento into v_birth_date
    from public.portal_perfis_religiosos p
    where p.auth_user_id = v_user_id
    limit 1;
  end if;

  if v_birth_date is null or v_birth_date >= current_date then
    raise exception 'Data de nascimento inválida. Atualize os dados da conta ou contate a Secretaria Provincial.';
  end if;
  if v_cpf = '' or v_name is null or v_meta->>'consentimento_dados' is distinct from 'true' then
    raise exception 'Os dados necessários ao vínculo não foram encontrados. Contate a Secretaria Provincial.';
  end if;
  if not public.portal_cpf_valido(v_cpf) then
    raise exception 'O CPF informado é inválido. Confira os dígitos.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('cpf:' || v_cpf, 0));

  select count(*) into v_matches
  from public.religiosos
  where regexp_replace(coalesce(cpf, ''), '[^0-9]', '', 'g') = v_cpf;

  if v_matches > 1 then
    raise exception 'Não foi possível identificar uma ficha única. Contate a Secretaria Provincial.';
  elsif v_matches = 1 then
    select * into v_religioso
    from public.religiosos
    where regexp_replace(coalesce(cpf, ''), '[^0-9]', '', 'g') = v_cpf
    limit 1
    for update;

    if lower(trim(coalesce(v_religioso.email_institucional, ''))) <> v_email
      and lower(trim(coalesce(v_religioso.email_pessoal, ''))) <> v_email then
      raise exception 'O e-mail confirmado não corresponde ao cadastro. Contate a Secretaria Provincial para validar seu acesso.';
    end if;
    if regexp_replace(lower(trim(coalesce(v_religioso.nome_civil, ''))), '[[:space:]]+', ' ', 'g')
        <> regexp_replace(lower(v_name), '[[:space:]]+', ' ', 'g')
      or v_religioso.data_nascimento is distinct from v_birth_date then
      raise exception 'Nome ou data de nascimento não correspondem à ficha. Contate a Secretaria Provincial para validar o acesso.';
    end if;
    if v_religioso.status_cadastro = 'Arquivado' then
      raise exception 'Esta ficha está arquivada. Contate a Secretaria Provincial.';
    end if;
    if v_religioso.auth_user_id is not null and v_religioso.auth_user_id <> v_user_id then
      raise exception 'Esta ficha já está vinculada a outra conta. Contate a Secretaria Provincial.';
    end if;

    update public.religiosos
    set auth_user_id = v_user_id,
        updated_at = now()
    where id = v_religioso.id;
    return v_religioso.id;
  end if;

  select count(*) into v_matches
  from public.religiosos
  where lower(trim(coalesce(email_institucional, ''))) = v_email
     or lower(trim(coalesce(email_pessoal, ''))) = v_email;

  if v_matches > 0 then
    raise exception 'Os dados informados não correspondem à ficha vinculada a este e-mail. Contate a Secretaria Provincial.';
  end if;

  insert into public.religiosos (
    auth_user_id, origem_cadastro, status_cadastro, status,
    nome_civil, data_nascimento, cpf, email_pessoal,
    consentimento_dados, consentimento_em
  ) values (
    v_user_id, 'publico', 'Em revisão', 'Ativo',
    v_name, v_birth_date, v_cpf, v_email,
    true, now()
  )
  returning * into v_religioso;

  return v_religioso.id;
end;
$$;

revoke all on function public.ensure_religious_portal_profile() from public, anon;
grant execute on function public.ensure_religious_portal_profile() to authenticated;

commit;
