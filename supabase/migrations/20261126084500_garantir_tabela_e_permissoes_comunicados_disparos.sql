-- ==============================================================================
-- Migration: Garantir tabela, grants e políticas RLS de comunicados_disparos
-- Idempotente: segura para rodar em qualquer ambiente (produção ou staging)
-- ==============================================================================

begin;

create table if not exists public.comunicados_disparos (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  operador_id uuid references auth.users(id) on delete set null,
  operador_nome text not null default 'Secretaria Provincial',
  tipo_mensagem text not null default 'credenciais',
  assunto text not null,
  subtitulo_cabecalho text,
  corpo_texto text,
  bloco_destaque text,
  botao_texto text,
  botao_url text,
  total_destinatarios int not null default 0,
  total_sucessos int not null default 0,
  total_falhas int not null default 0,
  relatorio_envio jsonb not null default '[]'::jsonb
);

create index if not exists idx_comunicados_disparos_criado_em
  on public.comunicados_disparos (criado_em desc);

create index if not exists idx_comunicados_disparos_tipo
  on public.comunicados_disparos (tipo_mensagem);

grant usage on schema public to authenticated, service_role;
grant select, insert on public.comunicados_disparos to authenticated;
grant all on public.comunicados_disparos to service_role;

alter table public.comunicados_disparos enable row level security;

drop policy if exists "Leitura de comunicados para usuários autenticados" on public.comunicados_disparos;
create policy "Leitura de comunicados para usuários autenticados"
  on public.comunicados_disparos
  for select
  to authenticated
  using (true);

drop policy if exists "Inserção de comunicados para usuários autenticados" on public.comunicados_disparos;
create policy "Inserção de comunicados para usuários autenticados"
  on public.comunicados_disparos
  for insert
  to authenticated
  with check (true);

commit;
