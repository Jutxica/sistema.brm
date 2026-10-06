-- Execute no Supabase antes de publicar o frontend do Portal do Religioso.
-- A validação de CPF confere apenas os dígitos; a identidade ainda exige confirmação de e-mail e revisão da Secretaria.

alter table public.religiosos alter column grau drop not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'religiosos-documentos',
  'religiosos-documentos',
  false,
  52428800,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/tiff']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.portal_cpf_valido(p_cpf text)
returns boolean
language plpgsql
immutable
strict
set search_path = pg_catalog
as $$
declare
  v_cpf text := regexp_replace(p_cpf, '[^0-9]', '', 'g');
  v_sum integer := 0;
  v_digit integer;
  v_expected integer;
  i integer;
begin
  if length(v_cpf) <> 11 or v_cpf ~ '^([0-9])\1{10}$' then
    return false;
  end if;

  for i in 1..9 loop
    v_sum := v_sum + substring(v_cpf, i, 1)::integer * (11 - i);
  end loop;
  v_digit := (v_sum * 10) % 11;
  if v_digit = 10 then v_digit := 0; end if;
  if v_digit <> substring(v_cpf, 10, 1)::integer then return false; end if;

  v_sum := 0;
  for i in 1..10 loop
    v_sum := v_sum + substring(v_cpf, i, 1)::integer * (12 - i);
  end loop;
  v_expected := (v_sum * 10) % 11;
  if v_expected = 10 then v_expected := 0; end if;

  return v_expected = substring(v_cpf, 11, 1)::integer;
end;
$$;

revoke all on function public.portal_cpf_valido(text) from public, anon, authenticated;

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

  v_meta := coalesce(v_auth_user.raw_user_meta_data, '{}'::jsonb);
  v_cpf := regexp_replace(coalesce(v_meta->>'cpf', ''), '[^0-9]', '', 'g');
  v_name := nullif(trim(coalesce(v_meta->>'nome', '')), '');
  if coalesce(v_meta->>'data_nascimento', '') !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'Data de nascimento inválida. Atualize os dados da conta ou contate a Secretaria Provincial.';
  end if;
  v_birth_date := (v_meta->>'data_nascimento')::date;
  if v_birth_date >= current_date then
    raise exception 'Data de nascimento inválida.';
  end if;
  if v_cpf = '' or v_name is null or v_meta->>'consentimento_dados' is distinct from 'true' then
    raise exception 'Os dados necessários ao vínculo não foram encontrados. Contate a Secretaria Provincial.';
  end if;
  if not public.portal_cpf_valido(v_cpf) then
    raise exception 'O CPF informado é inválido. Confira os dígitos.';
  end if;

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

begin;

create or replace function public.usuario_tem_papel(papel_requerido text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
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
grant execute on function public.usuario_tem_papel(text) to anon, authenticated, service_role;

create or replace function public.religiosos_proteger_campos_de_aprovacao()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if old.auth_user_id = auth.uid()
    and not public.usuario_tem_papel('religiosos')
    and (
      new.auth_user_id is distinct from old.auth_user_id
      or new.origem_cadastro is distinct from old.origem_cadastro
      or new.status_cadastro is distinct from old.status_cadastro
      or new.status is distinct from old.status
      or new.cpf is distinct from old.cpf
      or new.email_institucional is distinct from old.email_institucional
      or new.email_pessoal is distinct from old.email_pessoal
      or new.consentimento_dados is distinct from old.consentimento_dados
      or new.consentimento_em is distinct from old.consentimento_em
    ) then
    raise exception 'Somente a Secretaria pode alterar o vínculo, os dados de aprovação e os dados verificados.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_religiosos_proteger_campos_de_aprovacao on public.religiosos;
create trigger trg_religiosos_proteger_campos_de_aprovacao
before update on public.religiosos
for each row execute function public.religiosos_proteger_campos_de_aprovacao();

drop policy if exists religiosos_authenticated_all on public.religiosos;
drop policy if exists "Visitantes enviam cadastro de religioso" on public.religiosos;
drop policy if exists "Administradores autenticados gerenciam religiosos" on public.religiosos;
drop policy if exists religiosos_public_insert on public.religiosos;
create policy religiosos_public_insert on public.religiosos
for insert to anon, authenticated
with check (
  auth_user_id is null
  and origem_cadastro = 'publico'
  and status_cadastro = 'Em revisão'
);

drop policy if exists religiosos_select_owner_or_staff on public.religiosos;
drop policy if exists religiosos_insert_staff on public.religiosos;
drop policy if exists religiosos_update_owner on public.religiosos;
drop policy if exists religiosos_update_staff on public.religiosos;
drop policy if exists religiosos_delete_staff on public.religiosos;
create policy religiosos_select_owner_or_staff on public.religiosos
for select to authenticated
using (auth_user_id = (select auth.uid()) or public.usuario_tem_papel('religiosos'));

create policy religiosos_insert_staff on public.religiosos
for insert to authenticated
with check (public.usuario_tem_papel('religiosos'));

create policy religiosos_update_owner on public.religiosos
for update to authenticated
using (auth_user_id = (select auth.uid()))
with check (auth_user_id = (select auth.uid()));

create policy religiosos_update_staff on public.religiosos
for update to authenticated
using (public.usuario_tem_papel('religiosos'))
with check (public.usuario_tem_papel('religiosos'));

create policy religiosos_delete_staff on public.religiosos
for delete to authenticated
using (public.usuario_tem_papel('religiosos'));

create or replace function public.religiosos_cadastro_publico_pendente(p_religioso_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.religiosos
    where id = p_religioso_id
      and origem_cadastro = 'publico'
      and status_cadastro = 'Em revisão'
      and auth_user_id is null
  );
$$;

revoke all on function public.religiosos_cadastro_publico_pendente(uuid) from public;
grant execute on function public.religiosos_cadastro_publico_pendente(uuid) to anon, authenticated, service_role;

do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'religiosos_familiares', 'religiosos_contatos_familiares',
    'religiosos_sacramentos', 'religiosos_historico_vocacional',
    'religiosos_origem_vocacional', 'religiosos_formacao_religiosa',
    'religiosos_profissoes_votos', 'religiosos_ministerios_ordens',
    'religiosos_formacao_academica', 'religiosos_idiomas',
    'religiosos_competencias', 'religiosos_historico_comunidades',
    'religiosos_missoes_servicos', 'religiosos_enderecos_contatos',
    'religiosos_saude', 'religiosos_documentos'
  ] loop
    execute format('drop policy if exists %I_authenticated_all on public.%I', tabela, tabela);
    execute format('drop policy if exists %I_public_insert on public.%I', tabela, tabela);
    execute format('drop policy if exists %I_owner_or_staff_select on public.%I', tabela, tabela);
    execute format('drop policy if exists %I_owner_or_staff_insert on public.%I', tabela, tabela);
    execute format('drop policy if exists %I_owner_or_staff_update on public.%I', tabela, tabela);
    execute format('drop policy if exists %I_owner_or_staff_delete on public.%I', tabela, tabela);
    execute format(
      'create policy %I_owner_or_staff_select on public.%I for select to authenticated using (exists (select 1 from public.religiosos r where r.id = religioso_id and (r.auth_user_id = (select auth.uid()) or public.usuario_tem_papel(''religiosos''))))',
      tabela, tabela
    );
    execute format(
      'create policy %I_owner_or_staff_insert on public.%I for insert to authenticated with check (exists (select 1 from public.religiosos r where r.id = religioso_id and (r.auth_user_id = (select auth.uid()) or public.usuario_tem_papel(''religiosos''))))',
      tabela, tabela
    );
    execute format(
      'create policy %I_owner_or_staff_update on public.%I for update to authenticated using (exists (select 1 from public.religiosos r where r.id = religioso_id and (r.auth_user_id = (select auth.uid()) or public.usuario_tem_papel(''religiosos'')))) with check (exists (select 1 from public.religiosos r where r.id = religioso_id and (r.auth_user_id = (select auth.uid()) or public.usuario_tem_papel(''religiosos''))))',
      tabela, tabela
    );
    execute format(
      'create policy %I_owner_or_staff_delete on public.%I for delete to authenticated using (exists (select 1 from public.religiosos r where r.id = religioso_id and (r.auth_user_id = (select auth.uid()) or public.usuario_tem_papel(''religiosos''))))',
      tabela, tabela
    );
    execute format(
      'create policy %I_public_insert on public.%I for insert to anon, authenticated with check (public.religiosos_cadastro_publico_pendente(religioso_id))',
      tabela, tabela
    );
  end loop;
end;
$$;

create or replace function public.religiosos_documento_storage_acesso(p_nome_objeto text, p_acao text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1
    from public.religiosos r
    where r.id::text = split_part(p_nome_objeto, '/', 1)
      and case
        when auth.uid() is null then p_acao = 'insert' and r.status_cadastro = 'Em revisão'
        else r.auth_user_id = auth.uid() or public.usuario_tem_papel('religiosos')
      end
  );
$$;

revoke all on function public.religiosos_documento_storage_acesso(text, text) from public;
grant execute on function public.religiosos_documento_storage_acesso(text, text) to anon, authenticated, service_role;

drop policy if exists religiosos_documentos_upload on storage.objects;
drop policy if exists religiosos_documentos_read on storage.objects;
drop policy if exists religiosos_documentos_update on storage.objects;
drop policy if exists religiosos_documentos_delete on storage.objects;
drop policy if exists religiosos_docs_public_read on storage.objects;
drop policy if exists religiosos_docs_anon_insert on storage.objects;
drop policy if exists religiosos_docs_anon_update on storage.objects;
drop policy if exists religiosos_docs_anon_delete on storage.objects;

create policy religiosos_documentos_upload on storage.objects
for insert to anon, authenticated
with check (
  bucket_id = 'religiosos-documentos'
  and public.religiosos_documento_storage_acesso(name, 'insert')
);

create policy religiosos_documentos_read on storage.objects
for select to authenticated
using (
  bucket_id = 'religiosos-documentos'
  and public.religiosos_documento_storage_acesso(name, 'read')
);

create policy religiosos_documentos_update on storage.objects
for update to authenticated
using (
  bucket_id = 'religiosos-documentos'
  and public.religiosos_documento_storage_acesso(name, 'update')
)
with check (
  bucket_id = 'religiosos-documentos'
  and public.religiosos_documento_storage_acesso(name, 'update')
);

create policy religiosos_documentos_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'religiosos-documentos'
  and public.religiosos_documento_storage_acesso(name, 'delete')
);

commit;
