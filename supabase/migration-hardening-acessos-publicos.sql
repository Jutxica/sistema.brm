-- Restringe as tabelas públicas de secretaria e hospedaria.
-- Aplicar depois de migration-hardening-usuarios.sql e das migrações de schema.
begin;

alter table public.hospedagens
  add column if not exists hos_casa_acolhida text,
  add column if not exists hos_recibo_token uuid;

update public.hospedagens
set hos_recibo_token = gen_random_uuid()
where hos_recibo_token is null;

alter table public.hospedagens
  alter column hos_recibo_token set default gen_random_uuid(),
  alter column hos_recibo_token set not null;

create unique index if not exists hospedagens_recibo_token_unique
  on public.hospedagens(hos_recibo_token);

do $$
declare
  v_table_name text;
  policy_record record;
  column_record record;
begin
  foreach v_table_name in array array[
    'documentos_provinciais',
    'eventos_provinciais',
    'confighospedagens',
    'mainhospedagem',
    'modulos',
    'hos_quartos',
    'statushospedagem',
    'lavanderia',
    'hospedagens'
  ]
  loop
    execute format('alter table public.%I enable row level security', v_table_name);
    for column_record in
      select c.column_name
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = v_table_name
    loop
      execute format(
        'revoke all privileges (%I) on table public.%I from public, anon, authenticated',
        column_record.column_name,
        v_table_name
      );
    end loop;
    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = v_table_name
    loop
      execute format('drop policy %I on public.%I', policy_record.policyname, v_table_name);
    end loop;
  end loop;
end;
$$;

create policy documentos_provinciais_public_read
  on public.documentos_provinciais for select to anon, authenticated
  using (status = 'Ativo' or public.usuario_tem_papel('secretaria'));
create policy documentos_provinciais_secretaria_insert
  on public.documentos_provinciais for insert to authenticated
  with check (public.usuario_tem_papel('secretaria'));
create policy documentos_provinciais_secretaria_update
  on public.documentos_provinciais for update to authenticated
  using (public.usuario_tem_papel('secretaria'))
  with check (public.usuario_tem_papel('secretaria'));
create policy documentos_provinciais_secretaria_delete
  on public.documentos_provinciais for delete to authenticated
  using (public.usuario_tem_papel('secretaria'));

create policy eventos_provinciais_public_read
  on public.eventos_provinciais for select to anon, authenticated
  using (true);
create policy eventos_provinciais_secretaria_insert
  on public.eventos_provinciais for insert to authenticated
  with check (public.usuario_tem_papel('secretaria'));
create policy eventos_provinciais_secretaria_update
  on public.eventos_provinciais for update to authenticated
  using (public.usuario_tem_papel('secretaria'))
  with check (public.usuario_tem_papel('secretaria'));
create policy eventos_provinciais_secretaria_delete
  on public.eventos_provinciais for delete to authenticated
  using (public.usuario_tem_papel('secretaria'));

create policy confighospedagens_public_read
  on public.confighospedagens for select to anon, authenticated
  using (true);
create policy confighospedagens_authorized_insert
  on public.confighospedagens for insert to authenticated
  with check (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  );
create policy confighospedagens_authorized_update
  on public.confighospedagens for update to authenticated
  using (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  )
  with check (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  );
create policy confighospedagens_authorized_delete
  on public.confighospedagens for delete to authenticated
  using (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  );

create policy mainhospedagem_public_read_active
  on public.mainhospedagem for select to anon, authenticated
  using (
    main_status = 'Ativo'
    or (
      auth.uid() is not null
      and (
        public.usuario_tem_papel('hospedagens')
        or public.usuario_tem_papel('configuracoes')
      )
    )
  );
create policy mainhospedagem_authorized_insert
  on public.mainhospedagem for insert to authenticated
  with check (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  );
create policy mainhospedagem_authorized_update
  on public.mainhospedagem for update to authenticated
  using (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  )
  with check (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  );
create policy mainhospedagem_authorized_delete
  on public.mainhospedagem for delete to authenticated
  using (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  );

create policy modulos_public_read_active
  on public.modulos for select to anon, authenticated
  using (
    mod_status = 'Ativo'
    or (
      auth.uid() is not null
      and (
        public.usuario_tem_papel('hospedagens')
        or public.usuario_tem_papel('configuracoes')
      )
    )
  );
create policy modulos_authorized_insert
  on public.modulos for insert to authenticated
  with check (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  );
create policy modulos_authorized_update
  on public.modulos for update to authenticated
  using (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  )
  with check (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  );
create policy modulos_authorized_delete
  on public.modulos for delete to authenticated
  using (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  );

create policy lavanderia_public_read
  on public.lavanderia for select to anon, authenticated
  using (true);
create policy lavanderia_authorized_insert
  on public.lavanderia for insert to authenticated
  with check (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  );
create policy lavanderia_authorized_update
  on public.lavanderia for update to authenticated
  using (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  )
  with check (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  );
create policy lavanderia_authorized_delete
  on public.lavanderia for delete to authenticated
  using (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  );

create policy hos_quartos_authorized_read
  on public.hos_quartos for select to authenticated
  using (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  );
create policy hos_quartos_authorized_insert
  on public.hos_quartos for insert to authenticated
  with check (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  );
create policy hos_quartos_authorized_update
  on public.hos_quartos for update to authenticated
  using (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  )
  with check (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  );
create policy hos_quartos_authorized_delete
  on public.hos_quartos for delete to authenticated
  using (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  );

create policy statushospedagem_authorized_read
  on public.statushospedagem for select to authenticated
  using (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  );
create policy statushospedagem_authorized_insert
  on public.statushospedagem for insert to authenticated
  with check (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  );
create policy statushospedagem_authorized_update
  on public.statushospedagem for update to authenticated
  using (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  )
  with check (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  );
create policy statushospedagem_authorized_delete
  on public.statushospedagem for delete to authenticated
  using (
    public.usuario_tem_papel('hospedagens')
    or public.usuario_tem_papel('configuracoes')
  );

create policy hospedagens_authorized_read
  on public.hospedagens for select to authenticated
  using (public.usuario_tem_papel('hospedagens'));
create policy hospedagens_authorized_insert
  on public.hospedagens for insert to authenticated
  with check (public.usuario_tem_papel('hospedagens'));
create policy hospedagens_authorized_update
  on public.hospedagens for update to authenticated
  using (public.usuario_tem_papel('hospedagens'))
  with check (public.usuario_tem_papel('hospedagens'));
create policy hospedagens_authorized_delete
  on public.hospedagens for delete to authenticated
  using (public.usuario_tem_papel('hospedagens'));

revoke all on public.documentos_provinciais from public, anon, authenticated;
grant select on public.documentos_provinciais to anon;
grant select, insert, update, delete on public.documentos_provinciais to authenticated;

revoke all on public.eventos_provinciais from public, anon, authenticated;
grant select on public.eventos_provinciais to anon;
grant select, insert, update, delete on public.eventos_provinciais to authenticated;

revoke all on public.confighospedagens from public, anon, authenticated;
grant select on public.confighospedagens to anon;
grant select, insert, update, delete on public.confighospedagens to authenticated;

revoke all on public.mainhospedagem from public, anon, authenticated;
grant select (
  idmainhospedagem,
  main_motivo,
  main_termos,
  main_mensagemtela,
  main_status
) on public.mainhospedagem to anon;
grant select, insert, update, delete on public.mainhospedagem to authenticated;

revoke all on public.modulos from public, anon, authenticated;
grant select (idmodulos, mod_nome, mod_status) on public.modulos to anon;
grant select, insert, update, delete on public.modulos to authenticated;

revoke all on public.lavanderia from public, anon, authenticated;
grant select on public.lavanderia to anon;
grant select, insert, update, delete on public.lavanderia to authenticated;

revoke all on public.hos_quartos from public, anon, authenticated;
grant select, insert, update, delete on public.hos_quartos to authenticated;

revoke all on public.statushospedagem from public, anon, authenticated;
grant select, insert, update, delete on public.statushospedagem to authenticated;

revoke all on public.hospedagens from public, anon, authenticated;
grant select, insert, update, delete on public.hospedagens to authenticated;
grant all on public.hospedagens to service_role;

create or replace function public.hospedagem_inscricao_publica(p_payload jsonb)
returns table (idhospedagens bigint, recibo_token uuid)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_config_status text;
  v_motivo_id bigint;
  v_modulo_id bigint;
  v_id bigint;
  v_token uuid;
  v_payload jsonb := p_payload;
  v_email text;
  v_nome text;
begin
  if coalesce(jsonb_typeof(v_payload), '') <> 'object' or octet_length(v_payload::text) > 20000 then
    raise exception 'Dados de inscrição inválidos.';
  end if;

  select c.chos_ativar
    into v_config_status
    from public.confighospedagens c
   where c.idconfighospedagens = 1;
  if v_config_status is null or lower(v_config_status) not in ('sim', 'ativo') then
    raise exception 'As inscrições estão temporariamente suspensas.';
  end if;

  v_nome := nullif(btrim(v_payload->>'hos_nome'), '');
  v_email := lower(nullif(btrim(v_payload->>'hos_email'), ''));
  v_motivo_id := nullif(v_payload->>'hos_estadiamotivo', '')::bigint;
  v_modulo_id := nullif(v_payload->>'hos_modulo', '')::bigint;

  if v_nome is null or length(v_nome) > 200
    or v_email is null or length(v_email) > 320
    or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or v_payload->>'hos_termo' is distinct from 'Aceito'
    or v_motivo_id is null then
    raise exception 'Preencha os dados obrigatórios e aceite o regulamento.';
  end if;

  if not exists (
    select 1 from public.mainhospedagem m
    where m.idmainhospedagem = v_motivo_id
      and m.main_status = 'Ativo'
  ) then
    raise exception 'O motivo da estadia selecionado não está disponível.';
  end if;
  if v_modulo_id is not null and not exists (
    select 1 from public.modulos m
    where m.idmodulos = v_modulo_id
      and m.mod_status = 'Ativo'
  ) then
    raise exception 'O módulo selecionado não está disponível.';
  end if;

  insert into public.hospedagens (
    hos_categoria, hos_nome, hos_nascimento, hos_cpfrg, hos_email,
    hos_telefone, hos_telefoneemergencia, hos_logradouro, hos_numero,
    hos_cep, hos_bairro, hos_cidade, hos_estado, hos_alergico,
    hos_especifiquealergia, hos_restricaoalimentar, hos_especifiquerestricao,
    hos_lavanderia, hos_casa_acolhida, hos_estadiamotivo, hos_modulo,
    hos_previsaochegada, hos_previsaosaida, hos_recibo, hos_recnome,
    hos_reccpfcnpj, hos_reclogradouro, hos_recnumero, hos_reccep,
    hos_recbairro, hos_reccidade, hos_recestado, hos_termo, hos_recibo_token
  ) values (
    nullif(v_payload->>'hos_categoria', ''),
    v_nome,
    nullif(v_payload->>'hos_nascimento', '')::date,
    nullif(v_payload->>'hos_cpfrg', ''),
    v_email,
    nullif(v_payload->>'hos_telefone', ''),
    nullif(v_payload->>'hos_telefoneemergencia', ''),
    nullif(v_payload->>'hos_logradouro', ''),
    nullif(v_payload->>'hos_numero', ''),
    nullif(v_payload->>'hos_cep', ''),
    nullif(v_payload->>'hos_bairro', ''),
    nullif(v_payload->>'hos_cidade', ''),
    nullif(v_payload->>'hos_estado', ''),
    nullif(v_payload->>'hos_alergico', ''),
    nullif(v_payload->>'hos_especifiquealergia', ''),
    nullif(v_payload->>'hos_restricaoalimentar', ''),
    nullif(v_payload->>'hos_especifiquerestricao', ''),
    nullif(v_payload->>'hos_lavanderia', ''),
    nullif(v_payload->>'hos_casa_acolhida', ''),
    v_motivo_id,
    v_modulo_id,
    nullif(v_payload->>'hos_previsaochegada', '')::date,
    nullif(v_payload->>'hos_previsaosaida', '')::date,
    nullif(v_payload->>'hos_recibo', ''),
    nullif(v_payload->>'hos_recnome', ''),
    nullif(v_payload->>'hos_reccpfcnpj', ''),
    nullif(v_payload->>'hos_reclogradouro', ''),
    nullif(v_payload->>'hos_recnumero', ''),
    nullif(v_payload->>'hos_reccep', ''),
    nullif(v_payload->>'hos_recbairro', ''),
    nullif(v_payload->>'hos_reccidade', ''),
    nullif(v_payload->>'hos_recestado', ''),
    'Aceito',
    gen_random_uuid()
  )
  returning public.hospedagens.idhospedagens, public.hospedagens.hos_recibo_token
    into v_id, v_token;

  return query select v_id, v_token;
end;
$$;

revoke all on function public.hospedagem_inscricao_publica(jsonb) from public;
grant execute on function public.hospedagem_inscricao_publica(jsonb) to anon, authenticated;

commit;
