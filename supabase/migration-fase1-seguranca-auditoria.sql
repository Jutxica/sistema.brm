-- ==============================================================================
-- SISTEMA BRM - PROVÍNCIA BRASIL MERIDIONAL
-- FASE 1: SEGURANÇA, AUDITORIA APPEND-ONLY & POLÍTICAS RLS INSTITUCIONAIS
-- ==============================================================================

create extension if not exists pgcrypto;

-- 1. TABELA DE AUDITORIA APPEND-ONLY (patrimonio_audit_logs)
create table if not exists public.patrimonio_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  user_nome text,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE', 'VIEW', 'DOWNLOAD')),
  entity text not null check (entity in ('imoveis', 'veiculos', 'bens', 'contratos', 'manutencoes', 'documentos')),
  entity_id text not null,
  entity_nome text,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

-- Índices para busca rápida na trilha de governança
create index if not exists idx_pat_audit_entity on public.patrimonio_audit_logs(entity, entity_id);
create index if not exists idx_pat_audit_action on public.patrimonio_audit_logs(action);
create index if not exists idx_pat_audit_user on public.patrimonio_audit_logs(user_email);
create index if not exists idx_pat_audit_created on public.patrimonio_audit_logs(created_at desc);

-- 2. GATILHO DE PROTEÇÃO APPEND-ONLY: IMPEDE QUALQUER UPDATE OU DELETE
create or replace function public.trg_prevent_audit_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'Violação de Governança Canônica: A tabela de logs de auditoria do Patrimônio BRM é estritamente append-only. Operações de UPDATE ou DELETE são proibidas.';
end;
$$;

drop trigger if exists trg_audit_no_update_delete on public.patrimonio_audit_logs;
create trigger trg_audit_no_update_delete
before update or delete on public.patrimonio_audit_logs
for each row execute function public.trg_prevent_audit_mutation();

-- 3. FUNÇÃO AUXILIAR DE VERIFICAÇÃO DE PAPEL INSTITUCIONAL
create or replace function public.usuario_tem_papel(papel_requerido text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select coalesce((
    select jsonb_typeof(u.usu_acessos) = 'array'
      and (u.usu_acessos ? 'admin' or u.usu_acessos ? papel_requerido)
    from public.usuarios u
    where u.auth_user_id = auth.uid()
      and u.usu_status = 'Ativo'
    limit 1
  ), false);
$$;

-- 4. HABILITAÇÃO E REVISÃO DE RLS PARA TABELA DE AUDITORIA
alter table public.patrimonio_audit_logs enable row level security;

-- Qualquer usuário autenticado (ou serviço) pode registrar eventos de auditoria
create policy "Permitir inserção de log de auditoria"
  on public.patrimonio_audit_logs
  for insert
  with check (true);

-- Apenas Admin, Ecônomo e Secretaria podem consultar logs de auditoria
create policy "Permitir leitura de auditoria institucional"
  on public.patrimonio_audit_logs
  for select
  using (
    auth.role() = 'service_role' or
    public.usuario_tem_papel('admin') or
    public.usuario_tem_papel('economo') or
    public.usuario_tem_papel('secretaria')
  );

-- 5. REVISÃO DE POLÍTICAS DE RLS PARA AS TABELAS PATRIMONIAIS
-- Drop políticas permissivas legadas
drop policy if exists "Permitir gerenciar imoveis para todos" on public.patrimonio_imoveis;
drop policy if exists "Permitir leitura de imoveis para todos" on public.patrimonio_imoveis;

drop policy if exists "Permitir gerenciar veiculos para todos" on public.patrimonio_veiculos;
drop policy if exists "Permitir leitura de veiculos para todos" on public.patrimonio_veiculos;

drop policy if exists "Permitir gerenciar bens para todos" on public.patrimonio_bens;
drop policy if exists "Permitir leitura de bens para todos" on public.patrimonio_bens;

drop policy if exists "Permitir gerenciar contratos para todos" on public.patrimonio_contratos;
drop policy if exists "Permitir leitura de contratos para todos" on public.patrimonio_contratos;

drop policy if exists "Permitir gerenciar manutencoes para todos" on public.patrimonio_manutencoes;
drop policy if exists "Permitir leitura de manutencoes para todos" on public.patrimonio_manutencoes;

-- Políticas Granulares: Leitura Institucional (Authenticated + Service Role)
create policy "Leitura institucional imoveis" on public.patrimonio_imoveis for select using (true);
create policy "Leitura institucional veiculos" on public.patrimonio_veiculos for select using (true);
create policy "Leitura institucional bens" on public.patrimonio_bens for select using (true);
create policy "Leitura institucional contratos" on public.patrimonio_contratos for select using (true);
create policy "Leitura institucional manutencoes" on public.patrimonio_manutencoes for select using (true);

-- Escrita (Insert / Update): Admin, Ecônomo, Secretaria
create policy "Escrita imoveis autorizada" on public.patrimonio_imoveis
  for insert with check (
    auth.role() = 'service_role' or
    public.usuario_tem_papel('admin') or
    public.usuario_tem_papel('economo') or
    public.usuario_tem_papel('secretaria')
  );

create policy "Atualizacao imoveis autorizada" on public.patrimonio_imoveis
  for update using (
    auth.role() = 'service_role' or
    public.usuario_tem_papel('admin') or
    public.usuario_tem_papel('economo') or
    public.usuario_tem_papel('secretaria')
  );

create policy "Escrita veiculos autorizada" on public.patrimonio_veiculos
  for insert with check (
    auth.role() = 'service_role' or
    public.usuario_tem_papel('admin') or
    public.usuario_tem_papel('economo') or
    public.usuario_tem_papel('secretaria')
  );

create policy "Atualizacao veiculos autorizada" on public.patrimonio_veiculos
  for update using (
    auth.role() = 'service_role' or
    public.usuario_tem_papel('admin') or
    public.usuario_tem_papel('economo') or
    public.usuario_tem_papel('secretaria')
  );

create policy "Escrita bens autorizada" on public.patrimonio_bens
  for insert with check (
    auth.role() = 'service_role' or
    public.usuario_tem_papel('admin') or
    public.usuario_tem_papel('economo') or
    public.usuario_tem_papel('secretaria')
  );

create policy "Atualizacao bens autorizada" on public.patrimonio_bens
  for update using (
    auth.role() = 'service_role' or
    public.usuario_tem_papel('admin') or
    public.usuario_tem_papel('economo') or
    public.usuario_tem_papel('secretaria')
  );

create policy "Escrita contratos autorizada" on public.patrimonio_contratos
  for insert with check (
    auth.role() = 'service_role' or
    public.usuario_tem_papel('admin') or
    public.usuario_tem_papel('economo') or
    public.usuario_tem_papel('secretaria')
  );

create policy "Atualizacao contratos autorizada" on public.patrimonio_contratos
  for update using (
    auth.role() = 'service_role' or
    public.usuario_tem_papel('admin') or
    public.usuario_tem_papel('economo') or
    public.usuario_tem_papel('secretaria')
  );

-- Manutenções: Religiosos e Superiores Locais também podem solicitar chamados e vistorias!
create policy "Abertura chamados manutencoes" on public.patrimonio_manutencoes
  for insert with check (
    auth.role() = 'service_role' or
    auth.uid() is not null
  );

create policy "Atualizacao manutencoes autorizada" on public.patrimonio_manutencoes
  for update using (
    auth.role() = 'service_role' or
    public.usuario_tem_papel('admin') or
    public.usuario_tem_papel('economo') or
    public.usuario_tem_papel('secretaria') or
    public.usuario_tem_papel('superior_local')
  );

-- Exclusão Estrita: Apenas Admin e Ecônomo Provincial
create policy "Exclusao imoveis admin_economo" on public.patrimonio_imoveis
  for delete using (
    auth.role() = 'service_role' or
    public.usuario_tem_papel('admin') or
    public.usuario_tem_papel('economo')
  );

create policy "Exclusao veiculos admin_economo" on public.patrimonio_veiculos
  for delete using (
    auth.role() = 'service_role' or
    public.usuario_tem_papel('admin') or
    public.usuario_tem_papel('economo')
  );

create policy "Exclusao bens admin_economo" on public.patrimonio_bens
  for delete using (
    auth.role() = 'service_role' or
    public.usuario_tem_papel('admin') or
    public.usuario_tem_papel('economo')
  );

create policy "Exclusao contratos admin_economo" on public.patrimonio_contratos
  for delete using (
    auth.role() = 'service_role' or
    public.usuario_tem_papel('admin') or
    public.usuario_tem_papel('economo')
  );

create policy "Exclusao manutencoes admin_economo" on public.patrimonio_manutencoes
  for delete using (
    auth.role() = 'service_role' or
    public.usuario_tem_papel('admin') or
    public.usuario_tem_papel('economo')
  );
