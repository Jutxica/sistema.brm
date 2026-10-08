begin;

alter table public.religiosos_documentos
  add column if not exists caminho_storage text,
  add column if not exists mime_type text,
  add column if not exists tamanho_bytes bigint,
  add column if not exists status text not null default 'Ativo'
    check (status in ('Ativo', 'Substituido', 'Excluido'));

-- Ficha review statuses are separate from the religious person's operational status.
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.religiosos'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status_cadastro%'
  loop
    execute format('alter table public.religiosos drop constraint %I', constraint_name);
  end loop;
end;
$$;

alter table public.religiosos
  add constraint religiosos_status_cadastro_check
  check (status_cadastro in (
    'Em revisão',
    'Em verificação',
    'Aguardando complementação',
    'Aprovado',
    'Recusado',
    'Arquivado'
  ));

create table if not exists public.secretaria_contas_acesso (
  auth_user_id uuid primary key,
  email text not null,
  origem text not null check (origem in ('portal', 'secretaria', 'anterior')),
  criado_em timestamptz not null default now(),
  criado_por uuid,
  criado_por_nome text,
  estado text not null default 'ativo' check (estado in ('ativo', 'bloqueado', 'excluido', 'convite_enviado')),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.secretaria_contas_eventos (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  email_snapshot text not null,
  acao text not null check (acao in (
    'conta_criada',
    'convite_enviado',
    'bloqueio_ativado',
    'bloqueio_removido',
    'conta_excluida'
  )),
  ator_id uuid,
  ator_nome text not null,
  motivo text,
  criado_em timestamptz not null default now()
);

create index if not exists secretaria_contas_eventos_user_idx
  on public.secretaria_contas_eventos(auth_user_id, criado_em desc);

insert into public.secretaria_contas_acesso (
  auth_user_id, email, origem, criado_em, criado_por_nome
)
select id, email, 'anterior', created_at, 'Conta existente antes do registro de auditoria'
from auth.users
where email is not null
on conflict (auth_user_id) do nothing;

create or replace function public.secretaria_registrar_nova_conta_auth()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  insert into public.secretaria_contas_acesso (
    auth_user_id, email, origem, criado_em, criado_por, criado_por_nome
  ) values (
    new.id, coalesce(new.email, '(sem e-mail)'), 'portal', new.created_at,
    new.id, 'Autoatendimento do Portal do Religioso'
  )
  on conflict (auth_user_id) do nothing;

  if new.email is not null then
    insert into public.secretaria_contas_eventos (
      auth_user_id, email_snapshot, acao, ator_id, ator_nome
    ) values (
      new.id, new.email, 'conta_criada', new.id, 'Autoatendimento do Portal do Religioso'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists secretaria_registrar_nova_conta_auth on auth.users;
create trigger secretaria_registrar_nova_conta_auth
after insert on auth.users
for each row execute function public.secretaria_registrar_nova_conta_auth();

alter table public.secretaria_contas_acesso enable row level security;
alter table public.secretaria_contas_eventos enable row level security;
revoke all on public.secretaria_contas_acesso from anon, authenticated;
revoke all on public.secretaria_contas_eventos from anon, authenticated;

create table if not exists public.secretaria_ficha_eventos (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null,
  religioso_nome text not null,
  status_anterior text,
  status_novo text not null,
  ator_id uuid,
  ator_nome text not null,
  observacao text,
  criado_em timestamptz not null default now()
);

create index if not exists secretaria_ficha_eventos_religioso_idx
  on public.secretaria_ficha_eventos(religioso_id, criado_em desc);

alter table public.secretaria_ficha_eventos enable row level security;
revoke all on public.secretaria_ficha_eventos from anon, authenticated;
grant select on public.secretaria_ficha_eventos to authenticated;
drop policy if exists secretaria_ficha_eventos_staff_read on public.secretaria_ficha_eventos;
create policy secretaria_ficha_eventos_staff_read
  on public.secretaria_ficha_eventos for select to authenticated
  using (public.usuario_tem_papel('secretaria') or public.usuario_tem_papel('religiosos'));

create or replace function public.secretaria_ficha_status_control()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_name text;
begin
  if tg_op = 'INSERT' then
    insert into public.secretaria_ficha_eventos (
      religioso_id, religioso_nome, status_novo, ator_id, ator_nome, observacao
    ) values (
      new.id,
      coalesce(new.nome_religioso, new.nome_civil, 'Religioso'),
      new.status_cadastro,
      v_actor,
      case when v_actor is null then 'Cadastro público' else 'Cadastro administrativo' end,
      'Ficha criada'
    );
    return new;
  end if;

  if new.status_cadastro is distinct from old.status_cadastro
    and current_setting('app.secretaria_ficha_status_rpc', true) is distinct from 'on' then
    raise exception 'Altere a situação da ficha pela fila de revisão da Secretaria.';
  end if;
  return new;
end;
$$;

drop trigger if exists secretaria_ficha_status_control on public.religiosos;
create trigger secretaria_ficha_status_control
before insert or update of status_cadastro on public.religiosos
for each row execute function public.secretaria_ficha_status_control();

create or replace function public.secretaria_revisar_ficha(
  p_religioso_id uuid,
  p_status text,
  p_observacao text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_religioso public.religiosos%rowtype;
  v_actor_name text;
  v_observacao text := nullif(btrim(p_observacao), '');
begin
  if not (
    public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('religiosos')
  ) then
    raise exception 'Acesso não autorizado para revisar fichas.';
  end if;
  if p_status not in (
    'Em revisão', 'Em verificação', 'Aguardando complementação',
    'Aprovado', 'Recusado', 'Arquivado'
  ) then
    raise exception 'Situação de revisão inválida.';
  end if;
  if p_status in ('Aguardando complementação', 'Recusado') and v_observacao is null then
    raise exception 'Informe o motivo ou os dados que precisam ser complementados.';
  end if;
  if length(coalesce(v_observacao, '')) > 2000 then
    raise exception 'A observação deve ter até 2000 caracteres.';
  end if;

  select * into v_religioso
  from public.religiosos
  where id = p_religioso_id
  for update;
  if not found then
    raise exception 'Ficha não encontrada.';
  end if;

  select coalesce(usu_nome, auth.jwt() ->> 'email', 'Secretaria')
    into v_actor_name
  from public.usuarios
  where auth_user_id = auth.uid()
    and usu_status = 'Ativo'
  limit 1;

  perform set_config('app.secretaria_ficha_status_rpc', 'on', true);
  update public.religiosos
  set status_cadastro = p_status,
      updated_at = now()
  where id = p_religioso_id;

  insert into public.secretaria_ficha_eventos (
    religioso_id, religioso_nome, status_anterior, status_novo,
    ator_id, ator_nome, observacao
  ) values (
    p_religioso_id,
    coalesce(v_religioso.nome_religioso, v_religioso.nome_civil, 'Religioso'),
    v_religioso.status_cadastro,
    p_status,
    auth.uid(),
    coalesce(v_actor_name, auth.jwt() ->> 'email', 'Secretaria'),
    v_observacao
  );
end;
$$;

revoke all on function public.secretaria_revisar_ficha(uuid, text, text) from public, anon;
grant execute on function public.secretaria_revisar_ficha(uuid, text, text) to authenticated;

create table if not exists public.secretaria_dossie_documentos (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete restrict,
  categoria text not null check (categoria in (
    'Transferência', 'Advertência', 'Carta', 'Identidade',
    'Saúde', 'Canônico', 'Outro'
  )),
  titulo text not null check (length(btrim(titulo)) between 1 and 200),
  nome_arquivo text not null check (length(btrim(nome_arquivo)) between 1 and 255),
  caminho_storage text not null unique,
  mime_type text not null,
  tamanho_bytes bigint not null check (tamanho_bytes > 0 and tamanho_bytes <= 52428800),
  observacao text,
  enviado_por uuid not null,
  enviado_por_nome text not null,
  criado_em timestamptz not null default now()
);

create index if not exists secretaria_dossie_documentos_religioso_idx
  on public.secretaria_dossie_documentos(religioso_id, categoria, criado_em desc);

create table if not exists public.secretaria_dossie_eventos (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null,
  documento_id uuid,
  evento text not null,
  ator_id uuid,
  ator_nome text not null,
  detalhes text,
  criado_em timestamptz not null default now()
);

create index if not exists secretaria_dossie_eventos_religioso_idx
  on public.secretaria_dossie_eventos(religioso_id, criado_em desc);

alter table public.secretaria_dossie_documentos enable row level security;
alter table public.secretaria_dossie_eventos enable row level security;
revoke all on public.secretaria_dossie_documentos from anon, authenticated;
revoke all on public.secretaria_dossie_eventos from anon, authenticated;
grant select, insert on public.secretaria_dossie_documentos to authenticated;
grant select on public.secretaria_dossie_eventos to authenticated;

drop policy if exists secretaria_dossie_documentos_staff_read on public.secretaria_dossie_documentos;
create policy secretaria_dossie_documentos_staff_read
  on public.secretaria_dossie_documentos for select to authenticated
  using (public.usuario_tem_papel('secretaria') or public.usuario_tem_papel('religiosos'));

drop policy if exists secretaria_dossie_documentos_staff_insert on public.secretaria_dossie_documentos;
create policy secretaria_dossie_documentos_staff_insert
  on public.secretaria_dossie_documentos for insert to authenticated
  with check (
    (public.usuario_tem_papel('secretaria') or public.usuario_tem_papel('religiosos'))
    and enviado_por = auth.uid()
  );

drop policy if exists secretaria_dossie_eventos_staff_read on public.secretaria_dossie_eventos;
create policy secretaria_dossie_eventos_staff_read
  on public.secretaria_dossie_eventos for select to authenticated
  using (public.usuario_tem_papel('secretaria') or public.usuario_tem_papel('religiosos'));

create or replace function public.secretaria_registrar_dossie_documento()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_nome text;
begin
  select coalesce(usu_nome, auth.jwt() ->> 'email', 'Secretaria')
    into v_nome
  from public.usuarios
  where auth_user_id = auth.uid()
    and usu_status = 'Ativo'
  limit 1;

  insert into public.secretaria_dossie_eventos (
    religioso_id, documento_id, evento, ator_id, ator_nome, detalhes
  ) values (
    new.religioso_id, new.id, 'documento_adicionado', auth.uid(),
    coalesce(v_nome, auth.jwt() ->> 'email', 'Secretaria'),
    new.categoria || ': ' || new.titulo
  );
  return new;
end;
$$;

drop trigger if exists secretaria_registrar_dossie_documento on public.secretaria_dossie_documentos;
create trigger secretaria_registrar_dossie_documento
after insert on public.secretaria_dossie_documentos
for each row execute function public.secretaria_registrar_dossie_documento();

-- Secretariat access is added without widening the existing owner/staff policies.
drop policy if exists religiosos_secretaria_dossie_read on public.religiosos;
create policy religiosos_secretaria_dossie_read on public.religiosos
  for select to authenticated
  using (public.usuario_tem_papel('secretaria'));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'religiosos_familiares', 'religiosos_contatos_familiares',
    'religiosos_sacramentos', 'religiosos_historico_vocacional',
    'religiosos_origem_vocacional', 'religiosos_formacao_religiosa',
    'religiosos_profissoes_votos', 'religiosos_ministerios_ordens',
    'religiosos_formacao_academica', 'religiosos_idiomas',
    'religiosos_competencias', 'religiosos_historico_comunidades',
    'religiosos_missoes_servicos', 'religiosos_enderecos_contatos',
    'religiosos_saude', 'religiosos_documentos'
  ] loop
    execute format('drop policy if exists %I on public.%I', 'secretaria_dossie_read', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.usuario_tem_papel(''secretaria''))',
      'secretaria_dossie_read', table_name
    );
  end loop;
end;
$$;

drop policy if exists religiosos_documentos_secretaria_storage_read on storage.objects;
create policy religiosos_documentos_secretaria_storage_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'religiosos-documentos'
    and public.usuario_tem_papel('secretaria')
    and exists (
      select 1
      from public.religiosos_documentos d
      where d.caminho_storage = name
        and d.status = 'Ativo'
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'arquivo-religiosos-confidencial',
  'arquivo-religiosos-confidencial',
  false,
  52428800,
  array[
    'application/pdf', 'image/jpeg', 'image/png', 'image/tiff',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.secretaria_dossie_storage_acesso(p_nome_objeto text, p_acao text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select case p_acao
    when 'insert' then
      (public.usuario_tem_papel('secretaria') or public.usuario_tem_papel('religiosos'))
      and exists (
        select 1 from public.religiosos r
        where r.id::text = split_part(p_nome_objeto, '/', 1)
      )
    when 'read' then
      (public.usuario_tem_papel('secretaria') or public.usuario_tem_papel('religiosos'))
      and exists (
        select 1 from public.secretaria_dossie_documentos d
        where d.caminho_storage = p_nome_objeto
      )
    when 'delete' then
      (public.usuario_tem_papel('secretaria') or public.usuario_tem_papel('religiosos'))
      and exists (
        select 1 from public.secretaria_dossie_documentos d
        where d.caminho_storage = p_nome_objeto
      )
    else false
  end;
$$;

revoke all on function public.secretaria_dossie_storage_acesso(text, text) from public, anon;
grant execute on function public.secretaria_dossie_storage_acesso(text, text) to authenticated, service_role;

drop policy if exists secretaria_dossie_storage_upload on storage.objects;
create policy secretaria_dossie_storage_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'arquivo-religiosos-confidencial'
    and public.secretaria_dossie_storage_acesso(name, 'insert')
  );

drop policy if exists secretaria_dossie_storage_read on storage.objects;
create policy secretaria_dossie_storage_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'arquivo-religiosos-confidencial'
    and public.secretaria_dossie_storage_acesso(name, 'read')
  );

drop policy if exists secretaria_dossie_storage_delete on storage.objects;
create policy secretaria_dossie_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'arquivo-religiosos-confidencial'
    and public.secretaria_dossie_storage_acesso(name, 'delete')
  );

create or replace function public.secretaria_dossie_listar_protocolos(p_religioso_id uuid)
returns table (
  id uuid,
  numero_protocolo text,
  tipo_documento text,
  descricao text,
  status text,
  criado_em timestamptz,
  versao_id uuid,
  nome_original text,
  caminho_storage text,
  tipo_mime text,
  tamanho_bytes bigint,
  versao_criada_em timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if not (public.usuario_tem_papel('secretaria') or public.usuario_tem_papel('religiosos')) then
    raise exception 'Acesso não autorizado ao dossiê provincial.';
  end if;

  return query
  select p.id, p.numero_protocolo, p.tipo_documento, p.descricao, p.status,
         p.criado_em, v.id, v.nome_original, v.caminho_storage, v.tipo_mime,
         v.tamanho_bytes, v.criado_em
  from public.secretaria_arquivo_protocolos p
  left join public.secretaria_arquivo_versoes v on v.protocolo_id = p.id
  where p.religioso_id = p_religioso_id
  order by p.criado_em desc, v.numero_versao desc;
end;
$$;

revoke all on function public.secretaria_dossie_listar_protocolos(uuid) from public, anon;
grant execute on function public.secretaria_dossie_listar_protocolos(uuid) to authenticated;

create or replace function public.arquivo_pode_ler_protocolo(p_protocolo_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    public.arquivo_usuario_tem_papel('arquivo_secretaria')
    or public.arquivo_usuario_tem_papel('arquivo_substituto')
    or public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('religiosos')
    or exists (
      select 1
      from public.secretaria_arquivo_protocolos p
      where p.id = p_protocolo_id
        and p.enviado_por = auth.uid()
        and p.status in ('rascunho', 'enviado', 'em_conferencia', 'complementacao_solicitada')
    );
$$;

commit;
