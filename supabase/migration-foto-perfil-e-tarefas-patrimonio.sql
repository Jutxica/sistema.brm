-- Foto privada do religioso, quadro de tarefas do Patrimônio e lembretes internos.
-- Pré-requisitos: migration-portal-religioso-seguro.sql, migration-hardening-usuarios.sql,
-- migration-patrimonio.sql e migration-hardening-patrimonio.sql.
begin;

do $$
declare
  missing_tables text[];
begin
  select array_agg(required.table_name order by required.table_name)
  into missing_tables
  from unnest(array[
    'religiosos',
    'usuarios',
    'patrimonio_imoveis',
    'patrimonio_veiculos',
    'patrimonio_bens',
    'patrimonio_contratos'
  ]) as required(table_name)
  where to_regclass(format('public.%I', required.table_name)) is null;

  if coalesce(array_length(missing_tables, 1), 0) > 0 then
    raise exception 'Migração de foto e tarefas não aplicada: faltam tabelas %. Aplique as migrações pré-requisito indicadas no cabeçalho.',
      array_to_string(missing_tables, ', ');
  end if;
  if to_regprocedure('public.usuario_tem_papel(text)') is null then
    raise exception 'Migração de foto e tarefas não aplicada: falta public.usuario_tem_papel(text). Aplique as migrações pré-requisito indicadas no cabeçalho.';
  end if;
end;
$$;

alter table public.religiosos
  add column if not exists foto_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'religiosos-perfil',
  'religiosos-perfil',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists religiosos_perfil_select_owner on storage.objects;
drop policy if exists religiosos_perfil_insert_owner on storage.objects;
drop policy if exists religiosos_perfil_delete_owner on storage.objects;

create policy religiosos_perfil_select_owner
  on storage.objects for select to authenticated
  using (
    bucket_id = 'religiosos-perfil'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and exists (
      select 1 from public.religiosos r
      where r.auth_user_id = (select auth.uid())
    )
  );

create policy religiosos_perfil_insert_owner
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'religiosos-perfil'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and exists (
      select 1 from public.religiosos r
      where r.auth_user_id = (select auth.uid())
    )
  );

create policy religiosos_perfil_delete_owner
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'religiosos-perfil'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and exists (
      select 1 from public.religiosos r
      where r.auth_user_id = (select auth.uid())
    )
  );

create table if not exists public.patrimonio_tarefas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 3 and 160),
  descricao text not null default '' check (char_length(descricao) <= 5000),
  status text not null default 'a_fazer'
    check (status in ('a_fazer', 'em_andamento', 'aguardando', 'concluido', 'cancelado')),
  prioridade text not null default 'media'
    check (prioridade in ('baixa', 'media', 'alta', 'urgente')),
  prazo date,
  responsavel_auth_user_id uuid,
  responsavel_externo text check (responsavel_externo is null or char_length(responsavel_externo) <= 160),
  nota_progresso text not null default '' check (char_length(nota_progresso) <= 2000),
  criado_por uuid not null default auth.uid(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (responsavel_auth_user_id is null or responsavel_externo is null)
);

create index if not exists patrimonio_tarefas_responsavel_prazo_idx
  on public.patrimonio_tarefas (responsavel_auth_user_id, prazo);
create index if not exists patrimonio_tarefas_status_prazo_idx
  on public.patrimonio_tarefas (status, prazo);

create table if not exists public.patrimonio_tarefas_vinculos (
  tarefa_id uuid primary key references public.patrimonio_tarefas(id) on delete cascade,
  tipo_ativo text not null check (tipo_ativo in ('imovel', 'veiculo', 'bem', 'contrato')),
  ativo_id uuid not null
);

create table if not exists public.patrimonio_tarefas_notificacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null,
  tarefa_id uuid not null references public.patrimonio_tarefas(id) on delete cascade,
  chave_lembrete text not null,
  titulo text not null,
  mensagem text not null,
  criada_em timestamptz not null default now(),
  lida_em timestamptz,
  unique (usuario_id, tarefa_id, chave_lembrete)
);

create index if not exists patrimonio_tarefas_notificacoes_usuario_idx
  on public.patrimonio_tarefas_notificacoes (usuario_id, criada_em desc);

alter table public.patrimonio_tarefas enable row level security;
alter table public.patrimonio_tarefas_vinculos enable row level security;
alter table public.patrimonio_tarefas_notificacoes enable row level security;

drop policy if exists patrimonio_tarefas_read_manager_or_assignee on public.patrimonio_tarefas;
create policy patrimonio_tarefas_read_manager_or_assignee
  on public.patrimonio_tarefas for select to authenticated
  using (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('admin')
    or (
      responsavel_auth_user_id = (select auth.uid())
      and exists (
        select 1 from public.usuarios u
        where u.auth_user_id = (select auth.uid())
          and u.usu_status = 'Ativo'
      )
    )
  );

drop policy if exists patrimonio_tarefas_vinculos_manager_only on public.patrimonio_tarefas_vinculos;
create policy patrimonio_tarefas_vinculos_manager_only
  on public.patrimonio_tarefas_vinculos for select to authenticated
  using (public.usuario_tem_papel('patrimonio') or public.usuario_tem_papel('admin'));

drop policy if exists patrimonio_tarefas_notificacoes_owner_read on public.patrimonio_tarefas_notificacoes;
create policy patrimonio_tarefas_notificacoes_owner_read
  on public.patrimonio_tarefas_notificacoes for select to authenticated
  using (
    usuario_id = (select auth.uid())
    and exists (
      select 1 from public.usuarios u
      where u.auth_user_id = (select auth.uid())
        and u.usu_status = 'Ativo'
    )
  );
drop policy if exists patrimonio_tarefas_notificacoes_owner_update on public.patrimonio_tarefas_notificacoes;
create policy patrimonio_tarefas_notificacoes_owner_update
  on public.patrimonio_tarefas_notificacoes for update to authenticated
  using (
    usuario_id = (select auth.uid())
    and exists (
      select 1 from public.usuarios u
      where u.auth_user_id = (select auth.uid())
        and u.usu_status = 'Ativo'
    )
  )
  with check (
    usuario_id = (select auth.uid())
    and exists (
      select 1 from public.usuarios u
      where u.auth_user_id = (select auth.uid())
        and u.usu_status = 'Ativo'
    )
  );

revoke all on public.patrimonio_tarefas,
  public.patrimonio_tarefas_vinculos,
  public.patrimonio_tarefas_notificacoes
from public, anon, authenticated;
grant select on public.patrimonio_tarefas, public.patrimonio_tarefas_vinculos to authenticated;
grant select on public.patrimonio_tarefas_notificacoes to authenticated;
grant update (lida_em) on public.patrimonio_tarefas_notificacoes to authenticated;
grant all on public.patrimonio_tarefas,
  public.patrimonio_tarefas_vinculos,
  public.patrimonio_tarefas_notificacoes
to service_role;

create or replace function public.patrimonio_tarefas_responsaveis()
returns table (auth_user_id uuid, nome text)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if not (public.usuario_tem_papel('patrimonio') or public.usuario_tem_papel('admin')) then
    raise exception 'Acesso não autorizado ao quadro de tarefas.';
  end if;

  return query
  select u.auth_user_id, coalesce(nullif(u.usu_nome, ''), 'Usuário sem nome')
  from public.usuarios u
  where u.auth_user_id is not null
    and u.usu_status = 'Ativo'
  order by coalesce(nullif(u.usu_nome, ''), 'Usuário sem nome');
end;
$$;

create or replace function public.patrimonio_tarefas_ativos()
returns table (id uuid, tipo text, nome text)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if not (public.usuario_tem_papel('patrimonio') or public.usuario_tem_papel('admin')) then
    raise exception 'Acesso não autorizado aos bens patrimoniais.';
  end if;

  return query
    select i.id, 'imovel'::text, concat_ws(' • ', i.nome, i.cidade)
    from public.patrimonio_imoveis i
    union all
    select v.id, 'veiculo'::text, concat_ws(' • ', v.marca_modelo, v.placa)
    from public.patrimonio_veiculos v
    union all
    select b.id, 'bem'::text, concat_ws(' • ', b.titulo, b.codigo_tombamento)
    from public.patrimonio_bens b
    union all
    select c.id, 'contrato'::text, c.titulo
    from public.patrimonio_contratos c
    order by 3;
end;
$$;

create or replace function public.patrimonio_tarefas_salvar(p_tarefa jsonb)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_id uuid;
  v_assignee uuid := nullif(p_tarefa->>'responsavel_auth_user_id', '')::uuid;
  v_external text := nullif(btrim(p_tarefa->>'responsavel_externo'), '');
  v_asset_type text := nullif(p_tarefa->>'tipo_ativo', '');
  v_asset_id uuid := nullif(p_tarefa->>'ativo_id', '')::uuid;
  v_status text := coalesce(nullif(p_tarefa->>'status', ''), 'a_fazer');
  v_priority text := coalesce(nullif(p_tarefa->>'prioridade', ''), 'media');
begin
  if not (public.usuario_tem_papel('patrimonio') or public.usuario_tem_papel('admin')) then
    raise exception 'Acesso não autorizado ao quadro de tarefas.';
  end if;

  if char_length(btrim(coalesce(p_tarefa->>'titulo', ''))) not between 3 and 160 then
    raise exception 'O título deve ter entre 3 e 160 caracteres.';
  end if;
  if char_length(coalesce(p_tarefa->>'descricao', '')) > 5000 then
    raise exception 'A descrição pode ter no máximo 5000 caracteres.';
  end if;
  if char_length(coalesce(p_tarefa->>'nota_progresso', '')) > 2000 then
    raise exception 'A nota de progresso pode ter no máximo 2000 caracteres.';
  end if;
  if v_status not in ('a_fazer', 'em_andamento', 'aguardando', 'concluido', 'cancelado') then
    raise exception 'Etapa de tarefa inválida.';
  end if;
  if v_priority not in ('baixa', 'media', 'alta', 'urgente') then
    raise exception 'Prioridade de tarefa inválida.';
  end if;
  if v_assignee is not null and v_external is not null then
    raise exception 'Escolha um responsável interno ou externo, não ambos.';
  end if;
  if v_external is not null and char_length(v_external) > 160 then
    raise exception 'O nome do responsável externo pode ter no máximo 160 caracteres.';
  end if;
  if v_assignee is not null and not exists (
    select 1 from public.usuarios u
    where u.auth_user_id = v_assignee and u.usu_status = 'Ativo'
  ) then
    raise exception 'O responsável interno não é um usuário ativo.';
  end if;
  if (v_asset_type is null) <> (v_asset_id is null) then
    raise exception 'O tipo e o bem vinculado devem ser informados juntos.';
  end if;

  if v_asset_type is not null then
    if v_asset_type not in ('imovel', 'veiculo', 'bem', 'contrato') then
      raise exception 'Tipo de bem inválido.';
    end if;
    if (v_asset_type = 'imovel' and not exists (select 1 from public.patrimonio_imoveis where id = v_asset_id))
      or (v_asset_type = 'veiculo' and not exists (select 1 from public.patrimonio_veiculos where id = v_asset_id))
      or (v_asset_type = 'bem' and not exists (select 1 from public.patrimonio_bens where id = v_asset_id))
      or (v_asset_type = 'contrato' and not exists (select 1 from public.patrimonio_contratos where id = v_asset_id)) then
      raise exception 'O bem vinculado não existe.';
    end if;
  end if;

  if nullif(p_tarefa->>'id', '') is null then
    insert into public.patrimonio_tarefas (
      titulo, descricao, status, prioridade, prazo, responsavel_auth_user_id,
      responsavel_externo, nota_progresso
    ) values (
      btrim(p_tarefa->>'titulo'), coalesce(p_tarefa->>'descricao', ''), v_status, v_priority,
      nullif(p_tarefa->>'prazo', '')::date, v_assignee, v_external,
      coalesce(p_tarefa->>'nota_progresso', '')
    )
    returning id into v_id;
  else
    v_id := (p_tarefa->>'id')::uuid;
    update public.patrimonio_tarefas
    set titulo = btrim(p_tarefa->>'titulo'),
        descricao = coalesce(p_tarefa->>'descricao', ''),
        status = v_status,
        prioridade = v_priority,
        prazo = nullif(p_tarefa->>'prazo', '')::date,
        responsavel_auth_user_id = v_assignee,
        responsavel_externo = v_external,
        nota_progresso = coalesce(p_tarefa->>'nota_progresso', ''),
        atualizado_em = now()
    where id = v_id;
    if not found then
      raise exception 'Tarefa não encontrada.';
    end if;
    delete from public.patrimonio_tarefas_notificacoes where tarefa_id = v_id;
  end if;

  if v_asset_type is null then
    delete from public.patrimonio_tarefas_vinculos where tarefa_id = v_id;
  else
    insert into public.patrimonio_tarefas_vinculos (tarefa_id, tipo_ativo, ativo_id)
    values (v_id, v_asset_type, v_asset_id)
    on conflict (tarefa_id) do update
      set tipo_ativo = excluded.tipo_ativo,
          ativo_id = excluded.ativo_id;
  end if;

  return v_id;
end;
$$;

create or replace function public.patrimonio_tarefas_excluir(p_tarefa_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if not (public.usuario_tem_papel('patrimonio') or public.usuario_tem_papel('admin')) then
    raise exception 'Acesso não autorizado ao quadro de tarefas.';
  end if;

  delete from public.patrimonio_tarefas where id = p_tarefa_id;
  if not found then
    raise exception 'Tarefa não encontrada.';
  end if;
end;
$$;

create or replace function public.patrimonio_tarefas_atualizar_progresso(
  p_tarefa_id uuid,
  p_status text,
  p_nota text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.usuarios u
    where u.auth_user_id = auth.uid() and u.usu_status = 'Ativo'
  ) then
    raise exception 'Acesso não autorizado.';
  end if;
  if p_status not in ('a_fazer', 'em_andamento', 'aguardando', 'concluido') then
    raise exception 'Etapa inválida para o responsável da tarefa.';
  end if;
  if char_length(coalesce(p_nota, '')) > 2000 then
    raise exception 'A nota pode ter no máximo 2000 caracteres.';
  end if;

  update public.patrimonio_tarefas
  set status = p_status,
      nota_progresso = coalesce(p_nota, ''),
      atualizado_em = now()
  where id = p_tarefa_id
    and responsavel_auth_user_id = auth.uid();
  if not found then
    raise exception 'Tarefa não encontrada ou não atribuída a este usuário.';
  end if;
end;
$$;

create or replace function public.patrimonio_tarefas_gerar_lembretes()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_tarefa record;
  v_chave text;
  v_mensagem text;
  v_total integer := 0;
  v_dias integer;
begin
  for v_tarefa in
    select t.id, t.titulo, t.prazo, t.responsavel_auth_user_id
    from public.patrimonio_tarefas t
    join public.usuarios u
      on u.auth_user_id = t.responsavel_auth_user_id
     and u.usu_status = 'Ativo'
    where t.responsavel_auth_user_id is not null
      and t.prazo is not null
      and t.status not in ('concluido', 'cancelado')
      and t.prazo <= current_date + 7
  loop
    v_dias := v_tarefa.prazo - current_date;
    if v_dias = 7 then
      v_chave := 'prazo-7-dias';
      v_mensagem := format('A tarefa vence em 7 dias (%s).', to_char(v_tarefa.prazo, 'DD/MM/YYYY'));
    elsif v_dias = 3 then
      v_chave := 'prazo-3-dias';
      v_mensagem := format('A tarefa vence em 3 dias (%s).', to_char(v_tarefa.prazo, 'DD/MM/YYYY'));
    elsif v_dias = 0 then
      v_chave := 'prazo-hoje';
      v_mensagem := 'A tarefa vence hoje.';
    elsif v_dias < 0 then
      v_chave := 'atrasada-' || to_char(current_date, 'YYYY-MM-DD');
      v_mensagem := format('A tarefa está atrasada desde %s.', to_char(v_tarefa.prazo, 'DD/MM/YYYY'));
    else
      continue;
    end if;

    insert into public.patrimonio_tarefas_notificacoes
      (usuario_id, tarefa_id, chave_lembrete, titulo, mensagem)
    values (
      v_tarefa.responsavel_auth_user_id,
      v_tarefa.id,
      v_chave,
      v_tarefa.titulo,
      v_mensagem
    )
    on conflict (usuario_id, tarefa_id, chave_lembrete) do nothing;
    if found then
      v_total := v_total + 1;
    end if;
  end loop;

  return v_total;
end;
$$;

revoke all on function public.patrimonio_tarefas_responsaveis() from public, anon;
revoke all on function public.patrimonio_tarefas_ativos() from public, anon;
revoke all on function public.patrimonio_tarefas_salvar(jsonb) from public, anon;
revoke all on function public.patrimonio_tarefas_excluir(uuid) from public, anon;
revoke all on function public.patrimonio_tarefas_atualizar_progresso(uuid, text, text) from public, anon;
revoke all on function public.patrimonio_tarefas_gerar_lembretes() from public, anon, authenticated;
grant execute on function public.patrimonio_tarefas_responsaveis() to authenticated;
grant execute on function public.patrimonio_tarefas_ativos() to authenticated;
grant execute on function public.patrimonio_tarefas_salvar(jsonb) to authenticated;
grant execute on function public.patrimonio_tarefas_excluir(uuid) to authenticated;
grant execute on function public.patrimonio_tarefas_atualizar_progresso(uuid, text, text) to authenticated;
grant execute on function public.patrimonio_tarefas_gerar_lembretes() to service_role;

create extension if not exists pg_cron with schema pg_catalog;
do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id
  from cron.job
  where jobname = 'patrimonio-tarefas-lembretes-diarios'
  limit 1;
  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;
  perform cron.schedule(
    'patrimonio-tarefas-lembretes-diarios',
    '0 11 * * *',
    'select public.patrimonio_tarefas_gerar_lembretes();'
  );
end;
$$;

commit;
