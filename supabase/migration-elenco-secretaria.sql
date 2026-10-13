-- Etapa 2 do Elenco: situacao, designacoes historicas e permissoes.
-- Execute migration-elenco-catalogos.sql primeiro.

begin;

alter table public.religiosos
  add column if not exists situacao_elenco text not null default 'Ativo'
    check (situacao_elenco in ('Ativo', 'Ausente'));

create table if not exists public.religiosos_designacoes (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete restrict,
  comunidade_id uuid references public.comunidades(id) on delete restrict,
  obra_id uuid references public.religiosos_obras_referencia(id) on delete restrict,
  tipo_vinculo text not null check (
    tipo_vinculo in ('residencia', 'juridico', 'pastoral', 'funcao', 'estudos', 'missao', 'outro')
  ),
  funcao text not null,
  vigencia_inicio date,
  vigencia_fim date,
  ano_referencia integer not null default 2026 check (ano_referencia between 1900 and 2200),
  observacoes text,
  criado_por uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint religiosos_designacoes_destino_check check (
    (comunidade_id is not null and obra_id is null)
    or (comunidade_id is null and obra_id is not null)
  ),
  constraint religiosos_designacoes_vigencia_check check (
    vigencia_fim is null or vigencia_inicio is null or vigencia_fim >= vigencia_inicio
  )
);

create index if not exists idx_religiosos_designacoes_religioso
  on public.religiosos_designacoes (religioso_id);
create index if not exists idx_religiosos_designacoes_comunidade
  on public.religiosos_designacoes (comunidade_id) where comunidade_id is not null;
create index if not exists idx_religiosos_designacoes_obra
  on public.religiosos_designacoes (obra_id) where obra_id is not null;
create index if not exists idx_religiosos_designacoes_vigencia
  on public.religiosos_designacoes (vigencia_fim, vigencia_inicio);

create or replace function public.usuario_tem_papel(papel_requerido text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios usuario
    where (usuario.auth_user_id = auth.uid() or usuario.idusuarios = auth.uid())
      and usuario.usu_status = 'Ativo'
      and jsonb_typeof(usuario.usu_acessos) = 'array'
      and (
        usuario.usu_acessos ? 'admin'
        or usuario.usu_acessos ? coalesce(papel_requerido, '')
      )
  );
$$;

create or replace function public.elenco_secretaria_autorizada()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select session_user = 'postgres'
    or public.usuario_tem_papel('secretaria');
$$;

revoke all on function public.elenco_secretaria_autorizada() from public;
grant execute on function public.elenco_secretaria_autorizada() to authenticated;

alter table public.religiosos_designacoes enable row level security;

grant select, insert, update, delete on public.religiosos_designacoes to authenticated;
revoke all on public.religiosos_designacoes from anon;

create or replace function public.elenco_usuario_pode_ler_designacoes()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.elenco_secretaria_autorizada()
    or exists (
      select 1
      from public.religiosos r
      where r.auth_user_id = auth.uid()
         or (
           nullif(auth.jwt() ->> 'email', '') is not null
           and lower(coalesce(r.email_institucional, '')) = lower(auth.jwt() ->> 'email')
         )
         or (
           nullif(auth.jwt() ->> 'email', '') is not null
           and lower(coalesce(r.email_pessoal, '')) = lower(auth.jwt() ->> 'email')
         )
    );
$$;

revoke all on function public.elenco_usuario_pode_ler_designacoes() from public;
grant execute on function public.elenco_usuario_pode_ler_designacoes() to authenticated;

drop policy if exists religiosos_designacoes_secretaria_select on public.religiosos_designacoes;
create policy religiosos_designacoes_secretaria_select
  on public.religiosos_designacoes for select to authenticated
  using (public.elenco_usuario_pode_ler_designacoes());

drop policy if exists religiosos_designacoes_secretaria_insert on public.religiosos_designacoes;
create policy religiosos_designacoes_secretaria_insert
  on public.religiosos_designacoes for insert to authenticated
  with check (public.elenco_secretaria_autorizada());

drop policy if exists religiosos_designacoes_secretaria_update on public.religiosos_designacoes;
create policy religiosos_designacoes_secretaria_update
  on public.religiosos_designacoes for update to authenticated
  using (public.elenco_secretaria_autorizada())
  with check (public.elenco_secretaria_autorizada());

drop policy if exists religiosos_designacoes_secretaria_delete on public.religiosos_designacoes;
create policy religiosos_designacoes_secretaria_delete
  on public.religiosos_designacoes for delete to authenticated
  using (public.elenco_secretaria_autorizada());

create or replace function public.proteger_campos_elenco_religioso()
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
    new.situacao_elenco := 'Ativo';
    new.comunidade_atual_nome := null;
    new.obra_atual_id := null;
    return new;
  end if;

  if new.situacao_elenco is distinct from old.situacao_elenco
    or new.comunidade_atual_nome is distinct from old.comunidade_atual_nome
    or new.obra_atual_id is distinct from old.obra_atual_id then
    raise exception 'A situação e a alocação do religioso só podem ser alteradas pela Secretaria.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_campos_elenco_religioso on public.religiosos;
create trigger trg_proteger_campos_elenco_religioso
  before insert or update on public.religiosos
  for each row execute function public.proteger_campos_elenco_religioso();

create or replace function public.validar_designacao_elenco()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_situacao text;
begin
  select situacao_elenco
    into v_situacao
    from public.religiosos
    where id = new.religioso_id;

  if tg_op = 'INSERT' and v_situacao = 'Ausente' and new.tipo_vinculo <> 'juridico' then
    raise exception 'Religiosos ausentes podem manter apenas o vínculo jurídico no Elenco.'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE'
    and (new.religioso_id is distinct from old.religioso_id
      or new.tipo_vinculo is distinct from old.tipo_vinculo)
    and v_situacao = 'Ausente'
    and new.tipo_vinculo <> 'juridico' then
    raise exception 'Religiosos ausentes podem manter apenas o vínculo jurídico no Elenco.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validar_designacao_elenco on public.religiosos_designacoes;
create trigger trg_validar_designacao_elenco
  before insert or update on public.religiosos_designacoes
  for each row execute function public.validar_designacao_elenco();

create or replace function public.registrar_transferencia_elenco(
  p_religioso_id uuid,
  p_comunidade_id uuid,
  p_obra_id uuid,
  p_tipo_vinculo text,
  p_funcao text,
  p_vigencia_inicio date,
  p_designacao_encerrar uuid default null,
  p_observacoes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_designacao_id uuid;
begin
  if not public.elenco_secretaria_autorizada() then
    raise exception 'Apenas a Secretaria pode registrar transferências e designações.'
      using errcode = '42501';
  end if;

  if p_vigencia_inicio is null or nullif(trim(p_funcao), '') is null then
    raise exception 'Informe a função e a data de início da designação.'
      using errcode = '22023';
  end if;

  if (p_comunidade_id is null) = (p_obra_id is null) then
    raise exception 'Selecione exatamente uma comunidade ou instituição.'
      using errcode = '22023';
  end if;

  if p_designacao_encerrar is not null then
    update public.religiosos_designacoes
       set vigencia_fim = p_vigencia_inicio - 1
     where id = p_designacao_encerrar
       and religioso_id = p_religioso_id
       and vigencia_fim is null;

    if not found then
      raise exception 'A designação a encerrar não está vigente para este religioso.'
        using errcode = '22023';
    end if;
  end if;

  insert into public.religiosos_designacoes (
    religioso_id, comunidade_id, obra_id, tipo_vinculo, funcao,
    vigencia_inicio, ano_referencia, observacoes
  ) values (
    p_religioso_id, p_comunidade_id, p_obra_id, p_tipo_vinculo, trim(p_funcao),
    p_vigencia_inicio, extract(year from p_vigencia_inicio)::integer, nullif(trim(p_observacoes), '')
  )
  returning id into v_designacao_id;

  return v_designacao_id;
end;
$$;

create or replace function public.atualizar_situacao_elenco(
  p_religioso_id uuid,
  p_situacao text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.elenco_secretaria_autorizada() then
    raise exception 'Apenas a Secretaria pode alterar a situação no Elenco.'
      using errcode = '42501';
  end if;

  if p_situacao is null or p_situacao not in ('Ativo', 'Ausente') then
    raise exception 'Situação inválida para o Elenco.'
      using errcode = '22023';
  end if;

  update public.religiosos
     set situacao_elenco = p_situacao
   where id = p_religioso_id;

  if not found then
    raise exception 'Religioso não encontrado.'
      using errcode = '22023';
  end if;

  if p_situacao = 'Ausente' then
    update public.religiosos_designacoes
       set vigencia_fim = greatest(
         (now() at time zone 'America/Sao_Paulo')::date,
         coalesce(vigencia_inicio, (now() at time zone 'America/Sao_Paulo')::date)
       )
     where religioso_id = p_religioso_id
       and vigencia_fim is null
       and tipo_vinculo <> 'juridico';
  end if;
end;
$$;

revoke all on function public.registrar_transferencia_elenco(uuid, uuid, uuid, text, text, date, uuid, text) from public;
revoke all on function public.atualizar_situacao_elenco(uuid, text) from public;
grant execute on function public.registrar_transferencia_elenco(uuid, uuid, uuid, text, text, date, uuid, text) to authenticated;
grant execute on function public.atualizar_situacao_elenco(uuid, text) to authenticated;

commit;
