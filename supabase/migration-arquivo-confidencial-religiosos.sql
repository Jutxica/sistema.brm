begin;

-- Aplicar no Supabase depois de schema-completa.sql e das migrações de usuários.
-- As permissões arquivo_secretaria e arquivo_substituto são atribuídas na matriz de usuários.
create sequence if not exists public.secretaria_arquivo_protocolo_seq;

create table if not exists public.secretaria_arquivo_protocolos (
  id uuid primary key default gen_random_uuid(),
  numero_protocolo text not null unique default (
    'ARQ-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('public.secretaria_arquivo_protocolo_seq')::text, 6, '0')
  ),
  religioso_id uuid not null references public.religiosos(id) on delete restrict,
  religioso_nome text not null,
  tipo_documento text not null check (
    tipo_documento in ('testamento', 'documento_pessoal', 'documento_canonico', 'outro')
  ),
  descricao text not null default '',
  status text not null default 'rascunho' check (
    status in (
      'rascunho', 'enviado', 'em_conferencia', 'complementacao_solicitada',
      'recebido', 'classificado', 'arquivado'
    )
  ),
  versao_reenvio_minima integer not null default 0 check (versao_reenvio_minima >= 0),
  sigilo text not null default 'restrito' check (sigilo = 'restrito'),
  enviado_por uuid not null references auth.users(id),
  enviado_por_nome text not null,
  ultima_observacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.secretaria_arquivo_dados (
  protocolo_id uuid primary key references public.secretaria_arquivo_protocolos(id) on delete restrict,
  recebido_por uuid references auth.users(id),
  classificacao text,
  referencia_arquivamento text,
  localizador text,
  arquivado_em timestamptz,
  arquivado_por uuid references auth.users(id)
);

create table if not exists public.secretaria_arquivo_versoes (
  id uuid primary key default gen_random_uuid(),
  protocolo_id uuid not null references public.secretaria_arquivo_protocolos(id) on delete restrict,
  numero_versao integer not null check (numero_versao > 0),
  nome_original text not null,
  tipo_mime text not null,
  tamanho_bytes bigint not null check (tamanho_bytes > 0 and tamanho_bytes <= 52428800),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  caminho_storage text not null unique,
  enviado_por uuid not null references auth.users(id),
  criado_em timestamptz not null default now(),
  unique (protocolo_id, numero_versao)
);

create table if not exists public.secretaria_arquivo_eventos (
  id bigint generated always as identity primary key,
  protocolo_id uuid not null references public.secretaria_arquivo_protocolos(id) on delete restrict,
  evento text not null,
  status_anterior text,
  status_novo text not null,
  ator_id uuid not null references auth.users(id),
  ator_nome text not null,
  observacao text,
  criado_em timestamptz not null default now()
);

create index if not exists secretaria_arquivo_protocolos_status_atualizado_idx
  on public.secretaria_arquivo_protocolos(status, atualizado_em desc);
create index if not exists secretaria_arquivo_protocolos_enviado_por_idx
  on public.secretaria_arquivo_protocolos(enviado_por, atualizado_em desc);
create index if not exists secretaria_arquivo_versoes_protocolo_idx
  on public.secretaria_arquivo_versoes(protocolo_id, numero_versao desc);
create index if not exists secretaria_arquivo_eventos_protocolo_idx
  on public.secretaria_arquivo_eventos(protocolo_id, criado_em);

create or replace function public.arquivo_usuario_tem_papel(papel_requerido text)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_acessos jsonb;
begin
  select usu_acessos
    into v_acessos
    from public.usuarios
   where auth_user_id = auth.uid()
     and usu_status = 'Ativo'
   limit 1;

  if v_acessos is null then
    return false;
  end if;

  if jsonb_typeof(v_acessos) = 'string' then
    begin
      v_acessos := (v_acessos #>> '{}')::jsonb;
    exception
      when invalid_text_representation then return false;
    end;
  end if;

  return jsonb_typeof(v_acessos) = 'array' and v_acessos ? papel_requerido;
end;
$$;

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
    or exists (
      select 1
        from public.secretaria_arquivo_protocolos p
       where p.id = p_protocolo_id
         and p.enviado_por = auth.uid()
         and p.status in ('rascunho', 'enviado', 'em_conferencia', 'complementacao_solicitada')
    );
$$;

create or replace function public.arquivo_pode_enviar_arquivo(p_caminho text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.usuario_tem_papel('patrimonio')
    and exists (
      select 1
        from public.secretaria_arquivo_protocolos p
       where p.id::text = split_part(p_caminho, '/', 1)
         and p.enviado_por = auth.uid()
         and p.status in ('rascunho', 'complementacao_solicitada')
    );
$$;

create or replace function public.arquivo_pode_excluir_orfao(p_caminho text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.usuario_tem_papel('patrimonio')
    and exists (
      select 1
        from public.secretaria_arquivo_protocolos p
       where p.id::text = split_part(p_caminho, '/', 1)
         and p.enviado_por = auth.uid()
         and p.status in ('rascunho', 'complementacao_solicitada')
    )
    and not exists (
      select 1 from public.secretaria_arquivo_versoes v where v.caminho_storage = p_caminho
    );
$$;

create or replace function public.arquivo_pode_ler_arquivo(p_caminho text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
      from public.secretaria_arquivo_versoes v
     where v.caminho_storage = p_caminho
       and public.arquivo_pode_ler_protocolo(v.protocolo_id)
  );
$$;

alter table public.secretaria_arquivo_protocolos enable row level security;
alter table public.secretaria_arquivo_versoes enable row level security;
alter table public.secretaria_arquivo_dados enable row level security;
alter table public.secretaria_arquivo_eventos enable row level security;

drop policy if exists "arquivo protocolos leitura autorizada" on public.secretaria_arquivo_protocolos;
create policy "arquivo protocolos leitura autorizada"
  on public.secretaria_arquivo_protocolos for select to authenticated
  using (
    public.arquivo_usuario_tem_papel('arquivo_secretaria')
    or public.arquivo_usuario_tem_papel('arquivo_substituto')
    or enviado_por = auth.uid()
  );

drop policy if exists "arquivo versoes leitura autorizada" on public.secretaria_arquivo_versoes;
create policy "arquivo versoes leitura autorizada"
  on public.secretaria_arquivo_versoes for select to authenticated
  using (public.arquivo_pode_ler_protocolo(protocolo_id));

drop policy if exists "arquivo eventos leitura secretaria" on public.secretaria_arquivo_eventos;
create policy "arquivo eventos leitura secretaria"
  on public.secretaria_arquivo_eventos for select to authenticated
  using (
    public.arquivo_usuario_tem_papel('arquivo_secretaria')
    or public.arquivo_usuario_tem_papel('arquivo_substituto')
  );

drop policy if exists "arquivo dados leitura secretaria" on public.secretaria_arquivo_dados;
create policy "arquivo dados leitura secretaria"
  on public.secretaria_arquivo_dados for select to authenticated
  using (
    public.arquivo_usuario_tem_papel('arquivo_secretaria')
    or public.arquivo_usuario_tem_papel('arquivo_substituto')
  );

drop view if exists public.secretaria_arquivo_protocolos_acesso;

create or replace function public.arquivo_listar_protocolos_acesso()
returns table (
  id uuid,
  numero_protocolo text,
  religioso_nome text,
  tipo_documento text,
  descricao text,
  status text,
  enviado_por_nome text,
  ultima_observacao text,
  criado_em timestamptz,
  atualizado_em timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select
    p.id,
    p.numero_protocolo,
    case when acesso.v_secretaria then p.religioso_nome
         when acesso.v_remetente_pode_ver then p.religioso_nome
         else null end,
    case when acesso.v_secretaria or acesso.v_remetente_pode_ver then p.tipo_documento
         else null end,
    case when acesso.v_secretaria or acesso.v_remetente_pode_ver then p.descricao
         else null end,
    p.status,
    case when acesso.v_secretaria or acesso.v_remetente_pode_ver then p.enviado_por_nome
         else null end,
    p.ultima_observacao,
    p.criado_em,
    p.atualizado_em
  from public.secretaria_arquivo_protocolos p
  cross join lateral (
    select
      public.arquivo_usuario_tem_papel('arquivo_secretaria')
        or public.arquivo_usuario_tem_papel('arquivo_substituto') as v_secretaria,
      p.enviado_por = auth.uid()
        and p.status in ('rascunho', 'enviado', 'em_conferencia', 'complementacao_solicitada')
        as v_remetente_pode_ver
  ) acesso
  where acesso.v_secretaria or p.enviado_por = auth.uid()
  order by p.atualizado_em desc;
$$;

revoke all on public.secretaria_arquivo_protocolos from anon, authenticated;
revoke all on public.secretaria_arquivo_versoes from anon, authenticated;
revoke all on public.secretaria_arquivo_dados from anon, authenticated;
revoke all on public.secretaria_arquivo_eventos from anon, authenticated;
grant select on public.secretaria_arquivo_versoes to authenticated;
grant select on public.secretaria_arquivo_dados to authenticated;
grant select on public.secretaria_arquivo_eventos to authenticated;

create or replace function public.arquivo_registrar_evento(
  p_protocolo_id uuid,
  p_evento text,
  p_status_anterior text,
  p_status_novo text,
  p_observacao text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_nome text;
begin
  select usu_nome into v_nome
    from public.usuarios
   where auth_user_id = auth.uid()
   limit 1;

  insert into public.secretaria_arquivo_eventos (
    protocolo_id, evento, status_anterior, status_novo, ator_id, ator_nome, observacao
  ) values (
    p_protocolo_id, p_evento, p_status_anterior, p_status_novo, auth.uid(),
    coalesce(v_nome, auth.jwt() ->> 'email', 'Usuário'), p_observacao
  );
end;
$$;

create or replace function public.arquivo_criar_protocolo(
  p_religioso_id uuid,
  p_tipo_documento text,
  p_descricao text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_id uuid;
  v_numero text;
  v_nome_religioso text;
  v_nome_usuario text;
begin
  if not public.usuario_tem_papel('patrimonio') then
    raise exception 'Acesso não autorizado para enviar documentos.';
  end if;
  if p_tipo_documento is null or p_tipo_documento not in ('testamento', 'documento_pessoal', 'documento_canonico', 'outro') then
    raise exception 'Tipo de documento inválido.';
  end if;
  if length(coalesce(p_descricao, '')) > 1000 then
    raise exception 'A descrição excede o limite de 1000 caracteres.';
  end if;

  select coalesce(nullif(nome_religioso, ''), nome_civil)
    into v_nome_religioso
    from public.religiosos
   where id = p_religioso_id;
  if v_nome_religioso is null then
    raise exception 'Religioso não encontrado.';
  end if;

  select usu_nome into v_nome_usuario
    from public.usuarios
   where auth_user_id = auth.uid()
   limit 1;

  insert into public.secretaria_arquivo_protocolos (
    religioso_id, religioso_nome, tipo_documento, descricao, enviado_por, enviado_por_nome
  ) values (
    p_religioso_id, v_nome_religioso, p_tipo_documento, coalesce(p_descricao, ''),
    auth.uid(), coalesce(v_nome_usuario, auth.jwt() ->> 'email', 'Usuário')
  )
  returning id, numero_protocolo into v_id, v_numero;

  perform public.arquivo_registrar_evento(v_id, 'protocolo_criado', null, 'rascunho', null);
  return jsonb_build_object('id', v_id, 'numero_protocolo', v_numero);
end;
$$;

create or replace function public.arquivo_associar_versao(
  p_protocolo_id uuid,
  p_caminho_storage text,
  p_nome_original text,
  p_tipo_mime text,
  p_tamanho_bytes bigint,
  p_sha256 text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, storage
as $$
declare
  v_status text;
  v_numero_versao integer;
  v_versao_id uuid;
begin
  if not public.usuario_tem_papel('patrimonio') then
    raise exception 'Acesso não autorizado para anexar documentos.';
  end if;
  if p_tipo_mime not in ('application/pdf', 'image/jpeg', 'image/png', 'image/tiff') then
    raise exception 'Formato de arquivo não permitido.';
  end if;
  if p_tamanho_bytes <= 0 or p_tamanho_bytes > 52428800 then
    raise exception 'O arquivo deve ter até 50 MB.';
  end if;
  if p_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'Resumo SHA-256 inválido.';
  end if;
  if length(p_nome_original) < 1 or length(p_nome_original) > 255 then
    raise exception 'Nome de arquivo inválido.';
  end if;
  if split_part(p_caminho_storage, '/', 1) <> p_protocolo_id::text then
    raise exception 'Caminho do arquivo inválido.';
  end if;

  select status into v_status
    from public.secretaria_arquivo_protocolos
   where id = p_protocolo_id and enviado_por = auth.uid()
   for update;
  if v_status is null or v_status not in ('rascunho', 'complementacao_solicitada') then
    raise exception 'O protocolo não permite anexar uma versão.';
  end if;
  if not exists (
    select 1 from storage.objects
     where bucket_id = 'arquivo-religiosos-confidencial'
       and name = p_caminho_storage
  ) then
    raise exception 'O arquivo não foi encontrado no armazenamento privado.';
  end if;

  select coalesce(max(numero_versao), 0) + 1 into v_numero_versao
    from public.secretaria_arquivo_versoes
   where protocolo_id = p_protocolo_id;

  insert into public.secretaria_arquivo_versoes (
    protocolo_id, numero_versao, nome_original, tipo_mime, tamanho_bytes,
    sha256, caminho_storage, enviado_por
  ) values (
    p_protocolo_id, v_numero_versao, p_nome_original, p_tipo_mime,
    p_tamanho_bytes, p_sha256, p_caminho_storage, auth.uid()
  )
  returning id into v_versao_id;

  update public.secretaria_arquivo_protocolos
     set atualizado_em = now()
   where id = p_protocolo_id;

  perform public.arquivo_registrar_evento(
    p_protocolo_id, 'versao_adicionada', v_status, v_status, null
  );
  return jsonb_build_object('id', v_versao_id, 'numero_versao', v_numero_versao);
end;
$$;

create or replace function public.arquivo_enviar_protocolo(p_protocolo_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_status text;
  v_versao_minima integer;
begin
  if not public.usuario_tem_papel('patrimonio') then
    raise exception 'Acesso não autorizado para enviar documentos.';
  end if;

  select status, versao_reenvio_minima
    into v_status, v_versao_minima
    from public.secretaria_arquivo_protocolos
   where id = p_protocolo_id and enviado_por = auth.uid()
   for update;
  if v_status is null or v_status not in ('rascunho', 'complementacao_solicitada') then
    raise exception 'O protocolo não está pronto para envio.';
  end if;
  if not exists (
    select 1 from public.secretaria_arquivo_versoes where protocolo_id = p_protocolo_id
  ) then
    raise exception 'Anexe ao menos um arquivo antes de enviar.';
  end if;
  if v_status = 'complementacao_solicitada' and not exists (
    select 1
      from public.secretaria_arquivo_versoes
     where protocolo_id = p_protocolo_id
       and numero_versao > v_versao_minima
  ) then
    raise exception 'Anexe uma nova versão para atender à complementação solicitada.';
  end if;

  update public.secretaria_arquivo_protocolos
     set status = 'enviado', atualizado_em = now(), ultima_observacao = null
   where id = p_protocolo_id;
  perform public.arquivo_registrar_evento(p_protocolo_id, 'enviado', v_status, 'enviado', null);
end;
$$;

create or replace function public.arquivo_avancar_protocolo(
  p_protocolo_id uuid,
  p_acao text,
  p_observacao text default null,
  p_classificacao text default null,
  p_referencia text default null,
  p_localizador text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_status text;
  v_novo_status text;
begin
  if not (
    public.arquivo_usuario_tem_papel('arquivo_secretaria')
    or public.arquivo_usuario_tem_papel('arquivo_substituto')
  ) then
    raise exception 'Acesso não autorizado ao arquivo da Secretaria.';
  end if;
  if length(coalesce(p_observacao, '')) > 1000 then
    raise exception 'A observação excede o limite de 1000 caracteres.';
  end if;
  if length(coalesce(p_classificacao, '')) > 150
     or length(coalesce(p_referencia, '')) > 255
     or length(coalesce(p_localizador, '')) > 255 then
    raise exception 'Classificação, referência ou localizador excede o limite permitido.';
  end if;

  select status into v_status
    from public.secretaria_arquivo_protocolos
   where id = p_protocolo_id
   for update;
  if v_status is null then
    raise exception 'Protocolo não encontrado.';
  end if;

  case p_acao
    when 'iniciar_conferencia' then
      if v_status <> 'enviado' then raise exception 'O protocolo não está aguardando conferência.'; end if;
      v_novo_status := 'em_conferencia';
      update public.secretaria_arquivo_protocolos
         set status = v_novo_status, atualizado_em = now()
       where id = p_protocolo_id;
    when 'solicitar_complementacao' then
      if v_status <> 'em_conferencia' or length(trim(coalesce(p_observacao, ''))) = 0 then
        raise exception 'Informe a complementação necessária durante a conferência.';
      end if;
      v_novo_status := 'complementacao_solicitada';
      update public.secretaria_arquivo_protocolos
         set status = v_novo_status,
             atualizado_em = now(),
             ultima_observacao = trim(p_observacao),
             versao_reenvio_minima = coalesce((
               select max(v.numero_versao)
                 from public.secretaria_arquivo_versoes v
                where v.protocolo_id = p_protocolo_id
             ), 0)
       where id = p_protocolo_id;
    when 'confirmar_recebimento' then
      if v_status <> 'em_conferencia' then raise exception 'O protocolo não está em conferência.'; end if;
      v_novo_status := 'recebido';
      update public.secretaria_arquivo_protocolos
         set status = v_novo_status, atualizado_em = now(), ultima_observacao = null
       where id = p_protocolo_id;
      insert into public.secretaria_arquivo_dados (protocolo_id, recebido_por)
      values (p_protocolo_id, auth.uid())
      on conflict (protocolo_id) do update set recebido_por = excluded.recebido_por;
    when 'classificar' then
      if v_status <> 'recebido' or length(trim(coalesce(p_classificacao, ''))) = 0 then
        raise exception 'Informe a classificação documental.';
      end if;
      v_novo_status := 'classificado';
      update public.secretaria_arquivo_protocolos
         set status = v_novo_status, atualizado_em = now()
       where id = p_protocolo_id;
      insert into public.secretaria_arquivo_dados (
        protocolo_id, classificacao, referencia_arquivamento
      ) values (
        p_protocolo_id, trim(p_classificacao), nullif(trim(coalesce(p_referencia, '')), '')
      )
      on conflict (protocolo_id) do update
        set classificacao = excluded.classificacao,
            referencia_arquivamento = excluded.referencia_arquivamento;
    when 'arquivar' then
      if v_status <> 'classificado' or length(trim(coalesce(p_localizador, ''))) = 0 then
        raise exception 'Informe o localizador físico ou digital antes de arquivar.';
      end if;
      v_novo_status := 'arquivado';
      update public.secretaria_arquivo_protocolos
         set status = v_novo_status, atualizado_em = now()
       where id = p_protocolo_id;
      update public.secretaria_arquivo_dados
         set referencia_arquivamento = coalesce(
               nullif(trim(coalesce(p_referencia, '')), ''), referencia_arquivamento
             ),
             localizador = trim(p_localizador),
             arquivado_em = now(), arquivado_por = auth.uid()
       where protocolo_id = p_protocolo_id;
      if not found then
        raise exception 'Classifique o documento antes de arquivá-lo.';
      end if;
    else
      raise exception 'Ação de protocolo inválida.';
  end case;

  perform public.arquivo_registrar_evento(
    p_protocolo_id, p_acao, v_status, v_novo_status, nullif(trim(coalesce(p_observacao, '')), '')
  );
end;
$$;

create or replace function public.arquivo_bloquear_alteracao_eventos()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  raise exception 'A trilha de auditoria é imutável.';
end;
$$;

drop trigger if exists secretaria_arquivo_eventos_imutaveis on public.secretaria_arquivo_eventos;
create trigger secretaria_arquivo_eventos_imutaveis
  before update or delete on public.secretaria_arquivo_eventos
  for each row execute function public.arquivo_bloquear_alteracao_eventos();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'arquivo-religiosos-confidencial',
  'arquivo-religiosos-confidencial',
  false,
  52428800,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/tiff']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "arquivo confidencial upload autorizado" on storage.objects;
create policy "arquivo confidencial upload autorizado"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'arquivo-religiosos-confidencial'
    and public.arquivo_pode_enviar_arquivo(name)
  );

drop policy if exists "arquivo confidencial leitura autorizada" on storage.objects;
create policy "arquivo confidencial leitura autorizada"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'arquivo-religiosos-confidencial'
    and public.arquivo_pode_ler_arquivo(name)
  );

drop policy if exists "arquivo confidencial limpeza de upload incompleto" on storage.objects;
create policy "arquivo confidencial limpeza de upload incompleto"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'arquivo-religiosos-confidencial'
    and public.arquivo_pode_excluir_orfao(name)
  );

revoke all on function public.arquivo_usuario_tem_papel(text) from public, anon;
revoke all on function public.arquivo_listar_protocolos_acesso() from public, anon;
revoke all on function public.arquivo_pode_ler_protocolo(uuid) from public, anon;
revoke all on function public.arquivo_pode_enviar_arquivo(text) from public, anon;
revoke all on function public.arquivo_pode_excluir_orfao(text) from public, anon;
revoke all on function public.arquivo_pode_ler_arquivo(text) from public, anon;
revoke all on function public.arquivo_registrar_evento(uuid, text, text, text, text) from public, anon;
revoke all on function public.arquivo_criar_protocolo(uuid, text, text) from public, anon;
revoke all on function public.arquivo_associar_versao(uuid, text, text, text, bigint, text) from public, anon;
revoke all on function public.arquivo_enviar_protocolo(uuid) from public, anon;
revoke all on function public.arquivo_avancar_protocolo(uuid, text, text, text, text, text) from public, anon;
grant execute on function public.arquivo_usuario_tem_papel(text) to authenticated, service_role;
grant execute on function public.arquivo_listar_protocolos_acesso() to authenticated, service_role;
grant execute on function public.arquivo_pode_ler_protocolo(uuid) to authenticated, service_role;
grant execute on function public.arquivo_pode_enviar_arquivo(text) to authenticated, service_role;
grant execute on function public.arquivo_pode_excluir_orfao(text) to authenticated, service_role;
grant execute on function public.arquivo_pode_ler_arquivo(text) to authenticated, service_role;
grant execute on function public.arquivo_criar_protocolo(uuid, text, text) to authenticated, service_role;
grant execute on function public.arquivo_associar_versao(uuid, text, text, text, bigint, text) to authenticated, service_role;
grant execute on function public.arquivo_enviar_protocolo(uuid) to authenticated, service_role;
grant execute on function public.arquivo_avancar_protocolo(uuid, text, text, text, text, text) to authenticated, service_role;
grant execute on function public.arquivo_registrar_evento(uuid, text, text, text, text) to service_role;

commit;
