-- =====================================================================
-- FIX RLS E DADOS BASE: MÓDULO DE HOSPEDARIA / INSCRIÇÕES (SISTEMA BRM)
-- =====================================================================
-- Execute este script no SQL Editor do painel do Supabase
-- (Dashboard do Supabase -> SQL Editor -> New Query -> Run)
-- =====================================================================

-- 1. Habilitar RLS em todas as tabelas do subsistema de Hospedaria
alter table if exists public.confighospedagens enable row level security;
alter table if exists public.mainhospedagem enable row level security;
alter table if exists public.modulos enable row level security;
alter table if exists public.hos_quartos enable row level security;
alter table if exists public.statushospedagem enable row level security;
alter table if exists public.lavanderia enable row level security;
alter table if exists public.hospedagens enable row level security;

-- 2. Limpar políticas antigas para evitar duplicidades
drop policy if exists "confighospedagens_all_authenticated" on public.confighospedagens;
drop policy if exists "confighospedagens_select_anon" on public.confighospedagens;
drop policy if exists "confighospedagens_all_admin" on public.confighospedagens;
drop policy if exists "confighospedagens_public_read" on public.confighospedagens;
drop policy if exists "confighospedagens_select_all" on public.confighospedagens;
drop policy if exists "confighospedagens_anon_update" on public.confighospedagens;
drop policy if exists "confighospedagens_anon_insert" on public.confighospedagens;

drop policy if exists "mainhospedagem_all_authenticated" on public.mainhospedagem;
drop policy if exists "mainhospedagem_select_anon" on public.mainhospedagem;
drop policy if exists "mainhospedagem_all_admin" on public.mainhospedagem;
drop policy if exists "mainhospedagem_select_all" on public.mainhospedagem;
drop policy if exists "mainhospedagem_anon_crud" on public.mainhospedagem;

drop policy if exists "modulos_all_authenticated" on public.modulos;
drop policy if exists "modulos_select_anon" on public.modulos;
drop policy if exists "modulos_select_all" on public.modulos;
drop policy if exists "modulos_anon_crud" on public.modulos;

drop policy if exists "hos_quartos_all_authenticated" on public.hos_quartos;
drop policy if exists "hos_quartos_select_anon" on public.hos_quartos;
drop policy if exists "hos_quartos_select_all" on public.hos_quartos;
drop policy if exists "hos_quartos_anon_crud" on public.hos_quartos;

drop policy if exists "statushospedagem_all_authenticated" on public.statushospedagem;
drop policy if exists "statushospedagem_select_anon" on public.statushospedagem;
drop policy if exists "statushospedagem_select_all" on public.statushospedagem;
drop policy if exists "statushospedagem_anon_crud" on public.statushospedagem;

drop policy if exists "lavanderia_all_authenticated" on public.lavanderia;
drop policy if exists "lavanderia_select_anon" on public.lavanderia;
drop policy if exists "lavanderia_select_all" on public.lavanderia;
drop policy if exists "lavanderia_anon_crud" on public.lavanderia;

drop policy if exists "hospedagens_all_authenticated" on public.hospedagens;
drop policy if exists "hospedagens_insert_anon" on public.hospedagens;
drop policy if exists "hospedagens_select_authenticated" on public.hospedagens;
drop policy if exists "hospedagens_update_authenticated" on public.hospedagens;
drop policy if exists "hospedagens_select_anon" on public.hospedagens;
drop policy if exists "hospedagens_update_anon" on public.hospedagens;

-- =====================================================================
-- 3. POLÍTICAS: CONFIGHOSPEDAGENS
-- Leitura pública (para a página /inscricao exibir acolhida e status)
-- Escrita completa para administradores autenticados e clientes autorizados
-- =====================================================================
create policy "confighospedagens_select_all"
on public.confighospedagens for select
using (true);

create policy "confighospedagens_all_authenticated"
on public.confighospedagens for all
to authenticated
using (true)
with check (true);

create policy "confighospedagens_anon_update"
on public.confighospedagens for update
to anon
using (true)
with check (true);

create policy "confighospedagens_anon_insert"
on public.confighospedagens for insert
to anon
with check (true);

-- =====================================================================
-- 4. POLÍTICAS: MAINHOSPEDAGEM (Cursos / Retiros / Estadias)
-- =====================================================================
create policy "mainhospedagem_select_all"
on public.mainhospedagem for select
using (true);

create policy "mainhospedagem_all_authenticated"
on public.mainhospedagem for all
to authenticated
using (true)
with check (true);

create policy "mainhospedagem_anon_crud"
on public.mainhospedagem for all
to anon
using (true)
with check (true);

-- =====================================================================
-- 5. POLÍTICAS: MODULOS
-- =====================================================================
create policy "modulos_select_all"
on public.modulos for select
using (true);

create policy "modulos_all_authenticated"
on public.modulos for all
to authenticated
using (true)
with check (true);

create policy "modulos_anon_crud"
on public.modulos for all
to anon
using (true)
with check (true);

-- =====================================================================
-- 6. POLÍTICAS: HOS_QUARTOS
-- =====================================================================
create policy "hos_quartos_select_all"
on public.hos_quartos for select
using (true);

create policy "hos_quartos_all_authenticated"
on public.hos_quartos for all
to authenticated
using (true)
with check (true);

create policy "hos_quartos_anon_crud"
on public.hos_quartos for all
to anon
using (true)
with check (true);

-- =====================================================================
-- 7. POLÍTICAS: STATUSHOSPEDAGEM
-- =====================================================================
create policy "statushospedagem_select_all"
on public.statushospedagem for select
using (true);

create policy "statushospedagem_all_authenticated"
on public.statushospedagem for all
to authenticated
using (true)
with check (true);

create policy "statushospedagem_anon_crud"
on public.statushospedagem for all
to anon
using (true)
with check (true);

-- =====================================================================
-- 8. POLÍTICAS: LAVANDERIA
-- =====================================================================
create policy "lavanderia_select_all"
on public.lavanderia for select
using (true);

create policy "lavanderia_all_authenticated"
on public.lavanderia for all
to authenticated
using (true)
with check (true);

create policy "lavanderia_anon_crud"
on public.lavanderia for all
to anon
using (true)
with check (true);

-- =====================================================================
-- 9. POLÍTICAS: HOSPEDAGENS (Inscrições / Reservas)
-- =====================================================================
create policy "hospedagens_all_authenticated"
on public.hospedagens for all
to authenticated
using (true)
with check (true);

create policy "hospedagens_insert_anon"
on public.hospedagens for insert
to anon
with check (true);

create policy "hospedagens_select_anon"
on public.hospedagens for select
to anon
using (true);

create policy "hospedagens_update_anon"
on public.hospedagens for update
to anon
using (true)
with check (true);

-- =====================================================================
-- 10. DADOS INICIAIS (SEED) OBRIGATÓRIOS
-- Garante que o registro idconfighospedagens = 1 e status básicos existam
-- =====================================================================

-- Configuração Geral Base (ID 1)
insert into public.confighospedagens (
  idconfighospedagens,
  chos_acolhida,
  chos_ativar,
  chos_txtinativo,
  chos_visiveis,
  chos_invisiveis
) values (
  1,
  'Seja bem-vindo(a)! Província BRM.',
  'ativo',
  'As inscrições estão suspensas no momento. Em breve retornaremos.',
  '["categoria", "nome", "nascimento", "cpfrg", "email", "telefone", "telefoneemergencia", "endereco", "alergico", "restricao", "lavanderia", "estadiamotivo", "modulo", "previsao", "recibo", "termo"]'::jsonb,
  '[]'::jsonb
)
on conflict (idconfighospedagens) do update set
  chos_acolhida = excluded.chos_acolhida,
  chos_ativar = excluded.chos_ativar;

-- Status Padrão de Hospedagens
insert into public.statushospedagem (sta_nome, sta_status)
values
  ('Pendente', 'Ativo'),
  ('Confirmado', 'Ativo'),
  ('Check-in Realizado', 'Ativo'),
  ('Check-out Realizado', 'Ativo'),
  ('Cancelado', 'Ativo')
on conflict do nothing;

-- Serviços de Lavanderia Padrão
insert into public.lavanderia (lav_servico)
values
  ('Lavagem e Passadoria Padrão'),
  ('Apenas Roupa de Cama e Banho'),
  ('Serviço Especial')
on conflict do nothing;
