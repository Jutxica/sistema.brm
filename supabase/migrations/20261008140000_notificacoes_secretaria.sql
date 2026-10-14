begin;

create table if not exists public.notificacoes_sistema (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  titulo text not null,
  mensagem text not null,
  rota text not null,
  referencia_id text,
  chave_unica text not null,
  criada_em timestamptz not null default now(),
  lida_em timestamptz,
  unique (usuario_id, chave_unica)
);

create index if not exists notificacoes_sistema_usuario_data_idx
  on public.notificacoes_sistema (usuario_id, criada_em desc);

alter table public.notificacoes_sistema enable row level security;
revoke all on public.notificacoes_sistema from public, anon, authenticated;
grant select on public.notificacoes_sistema to authenticated;
grant update (lida_em) on public.notificacoes_sistema to authenticated;

drop policy if exists notificacoes_sistema_owner_read on public.notificacoes_sistema;
create policy notificacoes_sistema_owner_read
  on public.notificacoes_sistema for select to authenticated
  using (usuario_id = auth.uid());

drop policy if exists notificacoes_sistema_owner_update on public.notificacoes_sistema;
create policy notificacoes_sistema_owner_update
  on public.notificacoes_sistema for update to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

create or replace function public.notificacoes_sistema_notificar_papeis(
  p_papeis text[],
  p_chave text,
  p_tipo text,
  p_titulo text,
  p_mensagem text,
  p_rota text,
  p_referencia_id text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_usuario record;
  v_acessos jsonb;
begin
  for v_usuario in
    select u.auth_user_id, u.usu_acessos
    from public.usuarios u
    where u.usu_status = 'Ativo'
      and u.auth_user_id is not null
  loop
    v_acessos := v_usuario.usu_acessos;
    if v_acessos is null then
      continue;
    end if;

    if jsonb_typeof(v_acessos) = 'string' then
      begin
        v_acessos := (v_acessos #>> '{}')::jsonb;
      exception
        when invalid_text_representation then
          continue;
      end;
    end if;

    if jsonb_typeof(v_acessos) <> 'array'
      or not (v_acessos ? 'admin' or v_acessos ?| p_papeis) then
      continue;
    end if;

    insert into public.notificacoes_sistema (
      usuario_id, tipo, titulo, mensagem, rota, referencia_id, chave_unica
    ) values (
      v_usuario.auth_user_id, p_tipo, p_titulo, p_mensagem, p_rota,
      p_referencia_id, p_chave
    )
    on conflict (usuario_id, chave_unica) do nothing;
  end loop;
end;
$$;

create or replace function public.notificacoes_sistema_nova_ficha()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_nome text;
begin
  if new.origem_cadastro is distinct from 'publico'
    or new.status_cadastro is distinct from 'Em revisão' then
    return new;
  end if;

  v_nome := coalesce(nullif(new.nome_religioso, ''), new.nome_civil, 'Religioso');
  perform public.notificacoes_sistema_notificar_papeis(
    array['secretaria', 'religiosos'],
    'nova-ficha:' || new.id::text,
    'religioso_inscricao',
    'Nova ficha aguardando revisão',
    format('A ficha de %s foi enviada e aguarda análise.', v_nome),
    '/religiosos',
    new.id::text
  );

  return new;
end;
$$;

drop trigger if exists notificacoes_sistema_nova_ficha on public.religiosos;
create trigger notificacoes_sistema_nova_ficha
after insert on public.religiosos
for each row execute function public.notificacoes_sistema_nova_ficha();

create or replace function public.notificacoes_sistema_nova_inscricao()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_titulo_formulario text;
begin
  select f.titulo
  into v_titulo_formulario
  from public.secretaria_formularios f
  where f.id = new.formulario_id;

  perform public.notificacoes_sistema_notificar_papeis(
    array['secretaria'],
    'nova-inscricao:' || new.id,
    'secretaria_inscricao',
    'Nova inscrição recebida',
    format(
      'Nova inscrição para "%s" (protocolo %s).',
      coalesce(v_titulo_formulario, 'formulário da Secretaria'),
      new.protocolo
    ),
    '/agenda',
    new.id
  );

  return new;
end;
$$;

drop trigger if exists notificacoes_sistema_nova_inscricao on public.secretaria_respostas_formulario;
create trigger notificacoes_sistema_nova_inscricao
after insert on public.secretaria_respostas_formulario
for each row execute function public.notificacoes_sistema_nova_inscricao();

revoke all on function public.notificacoes_sistema_notificar_papeis(text[], text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.notificacoes_sistema_nova_ficha() from public, anon, authenticated;
revoke all on function public.notificacoes_sistema_nova_inscricao() from public, anon, authenticated;

commit;
