-- Fecha acessos públicos irrestritos sem remover o link paroquial nem as
-- inscrições públicas. Aplique depois de todas as migrações de schema e dos
-- hardenings de usuários, acessos públicos e patrimônio.
begin;

create extension if not exists pgcrypto;

alter table public.religiosos_obras_referencia
  add column if not exists token_edicao uuid default gen_random_uuid(),
  add column if not exists historia text,
  add column if not exists resumo_historico text,
  add column if not exists fotos jsonb default '[]'::jsonb,
  add column if not exists status_historia text default 'Pendente',
  add column if not exists data_envio_historia timestamptz;

update public.religiosos_obras_referencia
set token_edicao = gen_random_uuid()
where token_edicao is null;

alter table public.religiosos_obras_referencia
  alter column token_edicao set default gen_random_uuid(),
  alter column token_edicao set not null;

create unique index if not exists religiosos_obras_token_edicao_unique
  on public.religiosos_obras_referencia(token_edicao);

alter table public.secretaria_respostas_formulario
  add column if not exists submitted_by uuid references auth.users(id) on delete set null;

create index if not exists secretaria_respostas_submitted_by_idx
  on public.secretaria_respostas_formulario(submitted_by);

create or replace function public.obra_publica_por_token(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select jsonb_build_object(
    'id', o.id,
    'nome', o.nome,
    'tipo', o.tipo,
    'diocese', o.diocese,
    'localidade', o.localidade,
    'cidade', o.cidade,
    'uf', o.uf,
    'fundacao', o.fundacao,
    'assumida_pelos_dehonianos', o.assumida_pelos_dehonianos,
    'endereco', o.endereco,
    'telefone', o.telefone,
    'whatsapp', o.whatsapp,
    'email', o.email,
    'site', o.site,
    'instagram', o.instagram,
    'facebook', o.facebook,
    'youtube', o.youtube,
    'historia', o.historia,
    'resumo_historico', o.resumo_historico,
    'status_historia', o.status_historia,
    'fotos', o.fotos
  )
  from public.religiosos_obras_referencia o
  where o.token_edicao = p_token
    and o.status = 'Ativa';
$$;

create or replace function public.obra_atualizar_por_token(
  p_token uuid,
  p_payload jsonb,
  p_finalizar boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_updated integer;
begin
  if p_token is null
    or coalesce(jsonb_typeof(p_payload), '') <> 'object'
    or octet_length(p_payload::text) > 50000
    or p_payload - array[
      'telefone', 'whatsapp', 'email', 'site', 'instagram', 'facebook',
      'youtube', 'endereco', 'diocese', 'fundacao',
      'assumida_pelos_dehonianos', 'historia', 'resumo_historico', 'fotos'
    ] <> '{}'::jsonb then
    raise exception 'Dados ou link de edição inválidos.';
  end if;

  if p_payload ? 'fotos' then
    if jsonb_typeof(p_payload->'fotos') <> 'array' then
      raise exception 'A galeria deve conter no máximo seis fotos.';
    end if;
    if jsonb_array_length(p_payload->'fotos') > 6 then
      raise exception 'A galeria deve conter no máximo seis fotos.';
    end if;
  end if;

  if length(coalesce(p_payload->>'historia', '')) > 30000
    or length(coalesce(p_payload->>'resumo_historico', '')) > 3000
    or length(coalesce(p_payload->>'email', '')) > 320
    or length(coalesce(p_payload->>'telefone', '')) > 80
    or length(coalesce(p_payload->>'whatsapp', '')) > 80
    or length(coalesce(p_payload->>'site', '')) > 500
    or length(coalesce(p_payload->>'instagram', '')) > 500
    or length(coalesce(p_payload->>'facebook', '')) > 500
    or length(coalesce(p_payload->>'youtube', '')) > 500
    or length(coalesce(p_payload->>'endereco', '')) > 1000
    or length(coalesce(p_payload->>'diocese', '')) > 255 then
    raise exception 'Um ou mais campos excedem o limite permitido.';
  end if;

  update public.religiosos_obras_referencia o
  set telefone = case when p_payload ? 'telefone' then nullif(btrim(p_payload->>'telefone'), '') else o.telefone end,
      whatsapp = case when p_payload ? 'whatsapp' then nullif(btrim(p_payload->>'whatsapp'), '') else o.whatsapp end,
      email = case when p_payload ? 'email' then nullif(btrim(p_payload->>'email'), '') else o.email end,
      site = case when p_payload ? 'site' then nullif(btrim(p_payload->>'site'), '') else o.site end,
      instagram = case when p_payload ? 'instagram' then nullif(btrim(p_payload->>'instagram'), '') else o.instagram end,
      facebook = case when p_payload ? 'facebook' then nullif(btrim(p_payload->>'facebook'), '') else o.facebook end,
      youtube = case when p_payload ? 'youtube' then nullif(btrim(p_payload->>'youtube'), '') else o.youtube end,
      endereco = case when p_payload ? 'endereco' then nullif(btrim(p_payload->>'endereco'), '') else o.endereco end,
      diocese = case when p_payload ? 'diocese' then nullif(btrim(p_payload->>'diocese'), '') else o.diocese end,
      fundacao = case when p_payload ? 'fundacao' then nullif(p_payload->>'fundacao', '')::date else o.fundacao end,
      assumida_pelos_dehonianos = case
        when p_payload ? 'assumida_pelos_dehonianos'
          then nullif(p_payload->>'assumida_pelos_dehonianos', '')::date
        else o.assumida_pelos_dehonianos
      end,
      historia = case when p_payload ? 'historia' then nullif(btrim(p_payload->>'historia'), '') else o.historia end,
      resumo_historico = case when p_payload ? 'resumo_historico' then nullif(btrim(p_payload->>'resumo_historico'), '') else o.resumo_historico end,
      fotos = case when p_payload ? 'fotos' then p_payload->'fotos' else o.fotos end,
      status_historia = case when p_finalizar then 'Preenchido pela Paróquia' else o.status_historia end,
      data_envio_historia = case when p_finalizar then now() else o.data_envio_historia end,
      updated_at = now()
  where o.token_edicao = p_token
    and o.status = 'Ativa'
    and coalesce(o.status_historia, 'Pendente') not in ('Preenchido pela Paróquia', 'Aprovado');

  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception 'Link inválido, instituição inativa ou formulário já enviado.';
  end if;
  return true;
end;
$$;

create or replace function public.secretaria_enviar_resposta(
  p_formulario_id text,
  p_dados jsonb
)
returns table(id text, protocolo text, evento_id text, created_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_form public.secretaria_formularios%rowtype;
  v_id text;
  v_protocolo text;
  v_created_at timestamptz := now();
begin
  if p_formulario_id is null
    or coalesce(jsonb_typeof(p_dados), '') <> 'object'
    or octet_length(p_dados::text) > 50000 then
    raise exception 'Dados da inscrição inválidos.';
  end if;

  select f.* into v_form
  from public.secretaria_formularios f
  where f.id = p_formulario_id
    and f.ativo
  for share;

  if not found then
    raise exception 'Formulário inexistente ou encerrado.';
  end if;

  v_id := 'resp-' || replace(gen_random_uuid()::text, '-', '');
  v_protocolo := 'FORM-' || to_char(v_created_at, 'YYYY') || '-'
    || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.secretaria_respostas_formulario (
    id, formulario_id, evento_id, dados, protocolo, status, created_at, submitted_by
  ) values (
    v_id, v_form.id, v_form.evento_id, p_dados, v_protocolo,
    'Confirmada', v_created_at, auth.uid()
  );

  return query select v_id, v_protocolo, v_form.evento_id, v_created_at;
end;
$$;

do $$
declare
  v_crypto_schema text;
begin
  select n.nspname into v_crypto_schema
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pgcrypto';

  if v_crypto_schema is null then
    raise exception 'A extensão pgcrypto é necessária para proteger uploads do link paroquial.';
  end if;

  execute format($ddl$
    create or replace function public.obra_foto_upload_autorizado(p_nome_objeto text)
    returns boolean
    language plpgsql
    stable
    security definer
    set search_path = pg_catalog, public
    as $body$
    declare
      v_allowed boolean;
    begin
      if p_nome_objeto !~ '^obras/[0-9a-f]{64}/slot-[1-6]-[^/]+$' then
        return false;
      end if;

      select exists (
        select 1
        from public.religiosos_obras_referencia o
        where o.status = 'Ativa'
          and encode(%I.digest(convert_to(o.token_edicao::text, 'UTF8'), 'sha256'), 'hex')
              = split_part(p_nome_objeto, '/', 2)
      )
      into v_allowed;

      return coalesce(v_allowed, false);
    end;
    $body$;
  $ddl$, v_crypto_schema);
end;
$$;

revoke all on function public.obra_publica_por_token(uuid) from public;
grant execute on function public.obra_publica_por_token(uuid) to anon, authenticated;
revoke all on function public.obra_atualizar_por_token(uuid, jsonb, boolean) from public;
grant execute on function public.obra_atualizar_por_token(uuid, jsonb, boolean) to anon, authenticated;
revoke all on function public.secretaria_enviar_resposta(text, jsonb) from public;
grant execute on function public.secretaria_enviar_resposta(text, jsonb) to anon, authenticated;
revoke all on function public.obra_foto_upload_autorizado(text) from public;
grant execute on function public.obra_foto_upload_autorizado(text) to anon, authenticated;

do $$
declare
  target_table text;
  policy_record record;
begin
  foreach target_table in array array[
    'secretaria_configuracoes',
    'secretaria_formularios',
    'secretaria_respostas_formulario',
    'religiosos_obras_referencia',
    'comunidades',
    'obras'
  ]
  loop
    execute format('alter table public.%I enable row level security', target_table);
    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = target_table
    loop
      execute format('drop policy %I on public.%I', policy_record.policyname, target_table);
    end loop;
    execute format('revoke all on table public.%I from public, anon, authenticated', target_table);
  end loop;
end;
$$;

create policy secretaria_configuracoes_read_authorized
  on public.secretaria_configuracoes for select to authenticated
  using (
    public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('configuracoes')
  );
create policy secretaria_configuracoes_insert_authorized
  on public.secretaria_configuracoes for insert to authenticated
  with check (
    public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('configuracoes')
  );
create policy secretaria_configuracoes_update_authorized
  on public.secretaria_configuracoes for update to authenticated
  using (
    public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('configuracoes')
  )
  with check (
    public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('configuracoes')
  );
grant select, insert, update on public.secretaria_configuracoes to authenticated;

create policy secretaria_formularios_public_read_active
  on public.secretaria_formularios for select to anon, authenticated
  using (ativo);
create policy secretaria_formularios_read_authorized
  on public.secretaria_formularios for select to authenticated
  using (
    public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('configuracoes')
  );
create policy secretaria_formularios_insert_authorized
  on public.secretaria_formularios for insert to authenticated
  with check (
    public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('configuracoes')
  );
create policy secretaria_formularios_update_authorized
  on public.secretaria_formularios for update to authenticated
  using (
    public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('configuracoes')
  )
  with check (
    public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('configuracoes')
  );
create policy secretaria_formularios_delete_authorized
  on public.secretaria_formularios for delete to authenticated
  using (
    public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('configuracoes')
  );
grant select on public.secretaria_formularios to anon, authenticated;
grant insert, update, delete on public.secretaria_formularios to authenticated;

create policy secretaria_respostas_read_owner_or_secretaria
  on public.secretaria_respostas_formulario for select to authenticated
  using (
    submitted_by = (select auth.uid())
    or public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('configuracoes')
  );
create policy secretaria_respostas_update_secretaria
  on public.secretaria_respostas_formulario for update to authenticated
  using (
    public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('configuracoes')
  )
  with check (
    public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('configuracoes')
  );
create policy secretaria_respostas_delete_secretaria
  on public.secretaria_respostas_formulario for delete to authenticated
  using (
    public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('configuracoes')
  );
grant select, update, delete on public.secretaria_respostas_formulario to authenticated;

create policy religiosos_obras_public_read_active
  on public.religiosos_obras_referencia for select to anon, authenticated
  using (status = 'Ativa');
create policy religiosos_obras_staff_read_all
  on public.religiosos_obras_referencia for select to authenticated
  using (
    public.usuario_tem_papel('obras')
    or public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('secretaria')
  );
create policy religiosos_obras_staff_insert
  on public.religiosos_obras_referencia for insert to authenticated
  with check (
    public.usuario_tem_papel('obras')
    or public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('secretaria')
  );
create policy religiosos_obras_staff_update
  on public.religiosos_obras_referencia for update to authenticated
  using (
    public.usuario_tem_papel('obras')
    or public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('secretaria')
  )
  with check (
    public.usuario_tem_papel('obras')
    or public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('secretaria')
  );
create policy religiosos_obras_staff_delete
  on public.religiosos_obras_referencia for delete to authenticated
  using (
    public.usuario_tem_papel('obras')
    or public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('secretaria')
  );
grant select on public.religiosos_obras_referencia to anon, authenticated;
grant insert, update, delete on public.religiosos_obras_referencia to authenticated;

create policy comunidades_obras_staff_all
  on public.comunidades for all to authenticated
  using (
    public.usuario_tem_papel('obras')
    or public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('patrimonio')
  )
  with check (
    public.usuario_tem_papel('obras')
    or public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('patrimonio')
  );
grant select, insert, update, delete on public.comunidades to authenticated;

create policy obras_public_read_active
  on public.obras for select to anon, authenticated
  using (status = 'Ativa');
create policy obras_staff_read_all
  on public.obras for select to authenticated
  using (
    public.usuario_tem_papel('obras')
    or public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('patrimonio')
  );
create policy obras_staff_insert
  on public.obras for insert to authenticated
  with check (
    public.usuario_tem_papel('obras')
    or public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('patrimonio')
  );
create policy obras_staff_update
  on public.obras for update to authenticated
  using (
    public.usuario_tem_papel('obras')
    or public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('patrimonio')
  )
  with check (
    public.usuario_tem_papel('obras')
    or public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('patrimonio')
  );
create policy obras_staff_delete
  on public.obras for delete to authenticated
  using (
    public.usuario_tem_papel('obras')
    or public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('patrimonio')
  );
grant select on public.obras to anon, authenticated;
grant insert, update, delete on public.obras to authenticated;

update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'application/pdf', 'image/jpeg', 'image/png', 'image/tiff',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
where id = 'documentos-provincia';

update storage.buckets
set file_size_limit = 12582912,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'obras-fotos';

drop policy if exists documentos_provincia_anon_insert on storage.objects;
drop policy if exists documentos_provincia_anon_update on storage.objects;
drop policy if exists documentos_provincia_anon_delete on storage.objects;
drop policy if exists documentos_provincia_public_read on storage.objects;
drop policy if exists documentos_provincia_secretaria_insert on storage.objects;
drop policy if exists documentos_provincia_secretaria_update on storage.objects;
drop policy if exists documentos_provincia_secretaria_delete on storage.objects;

create policy documentos_provincia_public_read
  on storage.objects for select to public
  using (bucket_id = 'documentos-provincia');
create policy documentos_provincia_secretaria_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documentos-provincia'
    and (
      public.usuario_tem_papel('secretaria')
      or public.usuario_tem_papel('configuracoes')
    )
  );
create policy documentos_provincia_secretaria_update
  on storage.objects for update to authenticated
  using (
    bucket_id = 'documentos-provincia'
    and (
      public.usuario_tem_papel('secretaria')
      or public.usuario_tem_papel('configuracoes')
    )
  )
  with check (
    bucket_id = 'documentos-provincia'
    and (
      public.usuario_tem_papel('secretaria')
      or public.usuario_tem_papel('configuracoes')
    )
  );
create policy documentos_provincia_secretaria_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'documentos-provincia'
    and (
      public.usuario_tem_papel('secretaria')
      or public.usuario_tem_papel('configuracoes')
    )
  );

drop policy if exists obras_fotos_anon_insert on storage.objects;
drop policy if exists obras_fotos_anon_update on storage.objects;
drop policy if exists obras_fotos_anon_delete on storage.objects;
drop policy if exists obras_fotos_auth_delete on storage.objects;
drop policy if exists obras_fotos_public_read on storage.objects;
drop policy if exists obras_fotos_public_upload on storage.objects;
drop policy if exists obras_fotos_staff_update on storage.objects;
drop policy if exists obras_fotos_staff_delete on storage.objects;

create policy obras_fotos_public_read
  on storage.objects for select to public
  using (bucket_id = 'obras-fotos');
create policy obras_fotos_public_upload
  on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'obras-fotos'
    and public.obra_foto_upload_autorizado(name)
  );
create policy obras_fotos_staff_update
  on storage.objects for update to authenticated
  using (
    bucket_id = 'obras-fotos'
    and (
      public.usuario_tem_papel('obras')
      or public.usuario_tem_papel('patrimonio')
      or public.usuario_tem_papel('secretaria')
    )
  )
  with check (
    bucket_id = 'obras-fotos'
    and (
      public.usuario_tem_papel('obras')
      or public.usuario_tem_papel('patrimonio')
      or public.usuario_tem_papel('secretaria')
    )
  );
create policy obras_fotos_staff_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'obras-fotos'
    and (
      public.usuario_tem_papel('obras')
      or public.usuario_tem_papel('patrimonio')
      or public.usuario_tem_papel('secretaria')
    )
  );

commit;
