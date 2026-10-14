begin;

create or replace function public.patrimonio_tarefa_pode_acessar(p_tarefa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select auth.uid() is not null and (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('admin')
    or exists (
      select 1
      from public.patrimonio_tarefas t
      join public.usuarios u on u.auth_user_id = auth.uid() and u.usu_status = 'Ativo'
      where t.id = p_tarefa_id and t.responsavel_auth_user_id = auth.uid()
    )
  );
$$;

alter table public.patrimonio_tarefas
  add column if not exists data_inicio date,
  add column if not exists ordem integer not null default 0;
with ordenadas as (
  select id, row_number() over (
    partition by status order by prazo asc nulls last, criado_em, id
  ) - 1 as nova_ordem
  from public.patrimonio_tarefas
)
update public.patrimonio_tarefas t
set ordem = ordenadas.nova_ordem
from ordenadas
where t.id = ordenadas.id;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'patrimonio_tarefas_datas_validas'
      and conrelid = 'public.patrimonio_tarefas'::regclass
  ) then
    alter table public.patrimonio_tarefas
      add constraint patrimonio_tarefas_datas_validas
      check (data_inicio is null or prazo is null or data_inicio <= prazo);
  end if;
end;
$$;

create table if not exists public.patrimonio_tarefas_etiquetas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 1 and 40),
  cor text not null default '#2563eb' check (cor ~ '^#[0-9A-Fa-f]{6}$'),
  criado_por uuid default auth.uid(),
  criada_em timestamptz not null default now()
);
create unique index if not exists patrimonio_tarefas_etiquetas_nome_idx
  on public.patrimonio_tarefas_etiquetas (lower(nome));
insert into public.patrimonio_tarefas_etiquetas (nome, cor)
values
  ('Manutenção', '#d97706'),
  ('Documentação', '#2563eb'),
  ('Compras', '#059669'),
  ('Reunião', '#7c3aed'),
  ('Aguardando terceiro', '#64748b')
on conflict do nothing;

create table if not exists public.patrimonio_tarefas_etiquetas_vinculos (
  tarefa_id uuid not null references public.patrimonio_tarefas(id) on delete cascade,
  etiqueta_id uuid not null references public.patrimonio_tarefas_etiquetas(id) on delete cascade,
  primary key (tarefa_id, etiqueta_id)
);

create table if not exists public.patrimonio_tarefas_checklist (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.patrimonio_tarefas(id) on delete cascade,
  texto text not null check (char_length(btrim(texto)) between 1 and 240),
  concluido boolean not null default false,
  ordem integer not null default 0,
  criado_por uuid not null default auth.uid(),
  criado_em timestamptz not null default now()
);

create table if not exists public.patrimonio_tarefas_comentarios (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.patrimonio_tarefas(id) on delete cascade,
  autor_id uuid not null default auth.uid(),
  conteudo text not null check (char_length(btrim(conteudo)) between 1 and 4000),
  criado_em timestamptz not null default now()
);

create table if not exists public.patrimonio_tarefas_atividade (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.patrimonio_tarefas(id) on delete cascade,
  ator_id uuid default auth.uid(),
  evento text not null check (char_length(evento) <= 500),
  criada_em timestamptz not null default now()
);

create table if not exists public.patrimonio_tarefas_anexos (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.patrimonio_tarefas(id) on delete cascade,
  storage_path text not null unique,
  nome_arquivo text not null check (char_length(nome_arquivo) between 1 and 255),
  tipo_mime text not null check (char_length(tipo_mime) <= 120),
  tamanho_bytes bigint not null check (tamanho_bytes between 1 and 15728640),
  enviado_por uuid not null default auth.uid(),
  enviado_em timestamptz not null default now()
);

create index if not exists patrimonio_tarefas_checklist_ordem_idx
  on public.patrimonio_tarefas_checklist (tarefa_id, ordem, criado_em);
create index if not exists patrimonio_tarefas_comentarios_tarefa_idx
  on public.patrimonio_tarefas_comentarios (tarefa_id, criado_em desc);
create index if not exists patrimonio_tarefas_atividade_tarefa_idx
  on public.patrimonio_tarefas_atividade (tarefa_id, criada_em desc);
create index if not exists patrimonio_tarefas_etiquetas_vinculos_etiqueta_idx
  on public.patrimonio_tarefas_etiquetas_vinculos (etiqueta_id);

alter table public.patrimonio_tarefas_etiquetas enable row level security;
alter table public.patrimonio_tarefas_etiquetas_vinculos enable row level security;
alter table public.patrimonio_tarefas_checklist enable row level security;
alter table public.patrimonio_tarefas_comentarios enable row level security;
alter table public.patrimonio_tarefas_atividade enable row level security;
alter table public.patrimonio_tarefas_anexos enable row level security;

revoke all on public.patrimonio_tarefas_etiquetas,
  public.patrimonio_tarefas_etiquetas_vinculos,
  public.patrimonio_tarefas_checklist,
  public.patrimonio_tarefas_comentarios,
  public.patrimonio_tarefas_atividade,
  public.patrimonio_tarefas_anexos
from public, anon, authenticated;
grant select on public.patrimonio_tarefas_etiquetas,
  public.patrimonio_tarefas_etiquetas_vinculos,
  public.patrimonio_tarefas_checklist,
  public.patrimonio_tarefas_comentarios,
  public.patrimonio_tarefas_atividade,
  public.patrimonio_tarefas_anexos to authenticated;
grant insert, update, delete on public.patrimonio_tarefas_etiquetas,
  public.patrimonio_tarefas_etiquetas_vinculos,
  public.patrimonio_tarefas_checklist to authenticated;
grant insert on public.patrimonio_tarefas_comentarios to authenticated;
grant insert, delete on public.patrimonio_tarefas_anexos to authenticated;

drop policy if exists patrimonio_tarefas_etiquetas_read on public.patrimonio_tarefas_etiquetas;
create policy patrimonio_tarefas_etiquetas_read on public.patrimonio_tarefas_etiquetas
  for select to authenticated using (
    public.usuario_tem_papel('patrimonio') or public.usuario_tem_papel('admin')
    or exists (
      select 1 from public.patrimonio_tarefas t
      where t.responsavel_auth_user_id = auth.uid()
    )
  );
drop policy if exists patrimonio_tarefas_etiquetas_manage on public.patrimonio_tarefas_etiquetas;
create policy patrimonio_tarefas_etiquetas_manage on public.patrimonio_tarefas_etiquetas
  for all to authenticated using (
    public.usuario_tem_papel('patrimonio') or public.usuario_tem_papel('admin')
  ) with check (
    public.usuario_tem_papel('patrimonio') or public.usuario_tem_papel('admin')
  );

drop policy if exists patrimonio_tarefas_etiquetas_vinculos_access on public.patrimonio_tarefas_etiquetas_vinculos;
create policy patrimonio_tarefas_etiquetas_vinculos_access on public.patrimonio_tarefas_etiquetas_vinculos
  for all to authenticated using (public.patrimonio_tarefa_pode_acessar(tarefa_id))
  with check (public.patrimonio_tarefa_pode_acessar(tarefa_id));

drop policy if exists patrimonio_tarefas_checklist_access on public.patrimonio_tarefas_checklist;
create policy patrimonio_tarefas_checklist_access on public.patrimonio_tarefas_checklist
  for all to authenticated using (public.patrimonio_tarefa_pode_acessar(tarefa_id))
  with check (public.patrimonio_tarefa_pode_acessar(tarefa_id));

drop policy if exists patrimonio_tarefas_comentarios_access on public.patrimonio_tarefas_comentarios;
create policy patrimonio_tarefas_comentarios_access on public.patrimonio_tarefas_comentarios
  for select to authenticated using (public.patrimonio_tarefa_pode_acessar(tarefa_id));
drop policy if exists patrimonio_tarefas_comentarios_insert on public.patrimonio_tarefas_comentarios;
create policy patrimonio_tarefas_comentarios_insert on public.patrimonio_tarefas_comentarios
  for insert to authenticated with check (
    autor_id = auth.uid() and public.patrimonio_tarefa_pode_acessar(tarefa_id)
  );

drop policy if exists patrimonio_tarefas_atividade_access on public.patrimonio_tarefas_atividade;
create policy patrimonio_tarefas_atividade_access on public.patrimonio_tarefas_atividade
  for select to authenticated using (public.patrimonio_tarefa_pode_acessar(tarefa_id));

drop policy if exists patrimonio_tarefas_anexos_access on public.patrimonio_tarefas_anexos;
create policy patrimonio_tarefas_anexos_access on public.patrimonio_tarefas_anexos
  for select to authenticated using (public.patrimonio_tarefa_pode_acessar(tarefa_id));
drop policy if exists patrimonio_tarefas_anexos_insert on public.patrimonio_tarefas_anexos;
create policy patrimonio_tarefas_anexos_insert on public.patrimonio_tarefas_anexos
  for insert to authenticated with check (
    enviado_por = auth.uid() and public.patrimonio_tarefa_pode_acessar(tarefa_id)
    and storage_path like (tarefa_id::text || '/%')
  );
drop policy if exists patrimonio_tarefas_anexos_delete on public.patrimonio_tarefas_anexos;
create policy patrimonio_tarefas_anexos_delete on public.patrimonio_tarefas_anexos
  for delete to authenticated using (
    public.usuario_tem_papel('patrimonio') or public.usuario_tem_papel('admin')
    or (enviado_por = auth.uid() and public.patrimonio_tarefa_pode_acessar(tarefa_id))
  );

create or replace function public.patrimonio_tarefas_registrar_comentario()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  insert into public.patrimonio_tarefas_atividade (tarefa_id, ator_id, evento)
  values (new.tarefa_id, new.autor_id, 'Comentou: ' || left(new.conteudo, 180));
  return new;
end;
$$;
drop trigger if exists patrimonio_tarefas_comentario_atividade on public.patrimonio_tarefas_comentarios;
create trigger patrimonio_tarefas_comentario_atividade
  after insert on public.patrimonio_tarefas_comentarios
  for each row execute function public.patrimonio_tarefas_registrar_comentario();

create or replace function public.patrimonio_tarefas_registrar_alteracao()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_evento text;
begin
  if tg_op = 'INSERT' then
    v_evento := 'Tarefa criada.';
    insert into public.patrimonio_tarefas_atividade (tarefa_id, ator_id, evento)
    values (new.id, auth.uid(), v_evento);
    return new;
  end if;
  if old.status is distinct from new.status then
    insert into public.patrimonio_tarefas_atividade (tarefa_id, ator_id, evento)
    values (new.id, auth.uid(), 'Etapa alterada para ' || case new.status
      when 'a_fazer' then 'A fazer' when 'em_andamento' then 'Em andamento'
      when 'aguardando' then 'Aguardando' when 'concluido' then 'Concluído'
      when 'cancelado' then 'Cancelado' else new.status end || '.');
  end if;
  if old.responsavel_auth_user_id is distinct from new.responsavel_auth_user_id
    or old.responsavel_externo is distinct from new.responsavel_externo then
    insert into public.patrimonio_tarefas_atividade (tarefa_id, ator_id, evento)
    values (new.id, auth.uid(), 'Responsável atualizado.');
  end if;
  if old.prioridade is distinct from new.prioridade then
    insert into public.patrimonio_tarefas_atividade (tarefa_id, ator_id, evento)
    values (new.id, auth.uid(), 'Prioridade alterada para ' || new.prioridade || '.');
  end if;
  if old.data_inicio is distinct from new.data_inicio or old.prazo is distinct from new.prazo then
    insert into public.patrimonio_tarefas_atividade (tarefa_id, ator_id, evento)
    values (new.id, auth.uid(), 'Datas da tarefa atualizadas.');
  end if;
  return new;
end;
$$;
drop trigger if exists patrimonio_tarefas_atividade_insert on public.patrimonio_tarefas;
create trigger patrimonio_tarefas_atividade_insert
  after insert on public.patrimonio_tarefas
  for each row execute function public.patrimonio_tarefas_registrar_alteracao();
drop trigger if exists patrimonio_tarefas_atividade_update on public.patrimonio_tarefas;
create trigger patrimonio_tarefas_atividade_update
  after update on public.patrimonio_tarefas
  for each row execute function public.patrimonio_tarefas_registrar_alteracao();

create or replace function public.patrimonio_tarefas_registrar_checklist()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_task_id uuid;
  v_text text;
begin
  if pg_trigger_depth() > 1 then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  v_task_id := coalesce(new.tarefa_id, old.tarefa_id);
  v_text := coalesce(new.texto, old.texto);
  if tg_op = 'INSERT' then
    insert into public.patrimonio_tarefas_atividade (tarefa_id, ator_id, evento)
    values (v_task_id, auth.uid(), 'Adicionou item à lista: ' || left(v_text, 120));
  elsif tg_op = 'UPDATE' and old.concluido is distinct from new.concluido then
    insert into public.patrimonio_tarefas_atividade (tarefa_id, ator_id, evento)
    values (v_task_id, auth.uid(), case when new.concluido then 'Concluiu item: ' else 'Reabriu item: ' end || left(v_text, 120));
  elsif tg_op = 'DELETE' then
    insert into public.patrimonio_tarefas_atividade (tarefa_id, ator_id, evento)
    values (v_task_id, auth.uid(), 'Removeu item da lista: ' || left(v_text, 120));
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
drop trigger if exists patrimonio_tarefas_checklist_atividade on public.patrimonio_tarefas_checklist;
create trigger patrimonio_tarefas_checklist_atividade
  after insert or update or delete on public.patrimonio_tarefas_checklist
  for each row execute function public.patrimonio_tarefas_registrar_checklist();

create or replace function public.patrimonio_tarefas_registrar_anexo()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  insert into public.patrimonio_tarefas_atividade (tarefa_id, ator_id, evento)
  values (new.tarefa_id, new.enviado_por, 'Anexou arquivo: ' || left(new.nome_arquivo, 180));
  return new;
end;
$$;
drop trigger if exists patrimonio_tarefas_anexo_atividade on public.patrimonio_tarefas_anexos;
create trigger patrimonio_tarefas_anexo_atividade
  after insert on public.patrimonio_tarefas_anexos
  for each row execute function public.patrimonio_tarefas_registrar_anexo();

create or replace function public.patrimonio_tarefas_registrar_remocao_anexo()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if pg_trigger_depth() > 1 then
    return old;
  end if;
  insert into public.patrimonio_tarefas_atividade (tarefa_id, ator_id, evento)
  values (old.tarefa_id, auth.uid(), 'Removeu arquivo: ' || left(old.nome_arquivo, 180));
  return old;
end;
$$;
drop trigger if exists patrimonio_tarefas_anexo_removido_atividade on public.patrimonio_tarefas_anexos;
create trigger patrimonio_tarefas_anexo_removido_atividade
  after delete on public.patrimonio_tarefas_anexos
  for each row execute function public.patrimonio_tarefas_registrar_remocao_anexo();

create or replace function public.patrimonio_tarefa_pode_acessar_storage(p_nome text)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  return public.patrimonio_tarefa_pode_acessar(split_part(p_nome, '/', 1)::uuid);
exception when invalid_text_representation then
  return false;
end;
$$;

create or replace function public.patrimonio_tarefas_salvar_workspace(p_tarefa jsonb)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_id uuid;
  v_status_anterior text;
begin
  if not (public.usuario_tem_papel('patrimonio') or public.usuario_tem_papel('admin')) then
    raise exception 'Acesso não autorizado ao quadro de tarefas.';
  end if;
  if nullif(p_tarefa->>'id', '') is not null then
    select status into v_status_anterior
    from public.patrimonio_tarefas
    where id = (p_tarefa->>'id')::uuid;
  end if;
  v_id := public.patrimonio_tarefas_salvar(p_tarefa);
  update public.patrimonio_tarefas
  set data_inicio = nullif(p_tarefa->>'data_inicio', '')::date
  where id = v_id;
  if v_status_anterior is null or v_status_anterior is distinct from p_tarefa->>'status' then
    update public.patrimonio_tarefas
    set ordem = (select coalesce(max(ordem), -1) + 1
                 from public.patrimonio_tarefas
                 where status = p_tarefa->>'status' and id <> v_id)
    where id = v_id;
  end if;
  return v_id;
end;
$$;

create or replace function public.patrimonio_tarefas_reordenar(p_tarefa_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_status text;
begin
  if not (public.usuario_tem_papel('patrimonio') or public.usuario_tem_papel('admin')) then
    raise exception 'Acesso não autorizado ao quadro de tarefas.';
  end if;
  select status into v_status
  from public.patrimonio_tarefas
  where id = p_tarefa_id
  for update;
  if not found then
    raise exception 'Tarefa não encontrada.';
  end if;
  update public.patrimonio_tarefas
  set ordem = (select coalesce(max(ordem), -1) + 1
               from public.patrimonio_tarefas
               where status = v_status and id <> p_tarefa_id),
      atualizado_em = now()
  where id = p_tarefa_id;
end;
$$;

create or replace function public.patrimonio_tarefas_atualizar_progresso_workspace(
  p_tarefa_id uuid,
  p_status text,
  p_nota text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_status_anterior text;
begin
  select status into v_status_anterior
  from public.patrimonio_tarefas
  where id = p_tarefa_id;
  perform public.patrimonio_tarefas_atualizar_progresso(p_tarefa_id, p_status, p_nota);
  if v_status_anterior is distinct from p_status then
    update public.patrimonio_tarefas
    set ordem = (select coalesce(max(ordem), -1) + 1
                 from public.patrimonio_tarefas
                 where status = p_status and id <> p_tarefa_id)
    where id = p_tarefa_id;
  end if;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('patrimonio-tarefas', 'patrimonio-tarefas', false, 15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update set public = false, file_size_limit = 15728640,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists patrimonio_tarefas_storage_read on storage.objects;
create policy patrimonio_tarefas_storage_read on storage.objects
  for select to authenticated using (
    bucket_id = 'patrimonio-tarefas'
    and public.patrimonio_tarefa_pode_acessar_storage(name)
  );
drop policy if exists patrimonio_tarefas_storage_insert on storage.objects;
create policy patrimonio_tarefas_storage_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'patrimonio-tarefas'
    and public.patrimonio_tarefa_pode_acessar_storage(name)
  );
drop policy if exists patrimonio_tarefas_storage_delete on storage.objects;
create policy patrimonio_tarefas_storage_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'patrimonio-tarefas'
    and public.patrimonio_tarefa_pode_acessar_storage(name)
  );

revoke all on function public.patrimonio_tarefa_pode_acessar(uuid) from public, anon;
grant execute on function public.patrimonio_tarefa_pode_acessar(uuid) to authenticated;
revoke all on function public.patrimonio_tarefa_pode_acessar_storage(text) from public, anon;
grant execute on function public.patrimonio_tarefa_pode_acessar_storage(text) to authenticated;
revoke all on function public.patrimonio_tarefas_registrar_comentario(),
  public.patrimonio_tarefas_registrar_alteracao(),
  public.patrimonio_tarefas_registrar_checklist(),
  public.patrimonio_tarefas_registrar_anexo(),
  public.patrimonio_tarefas_registrar_remocao_anexo() from public, anon, authenticated;
revoke all on function public.patrimonio_tarefas_salvar_workspace(jsonb) from public, anon;
grant execute on function public.patrimonio_tarefas_salvar_workspace(jsonb) to authenticated;
revoke all on function public.patrimonio_tarefas_reordenar(uuid) from public, anon;
grant execute on function public.patrimonio_tarefas_reordenar(uuid) to authenticated;
revoke all on function public.patrimonio_tarefas_atualizar_progresso_workspace(uuid, text, text) from public, anon;
grant execute on function public.patrimonio_tarefas_atualizar_progresso_workspace(uuid, text, text) to authenticated;

commit;
