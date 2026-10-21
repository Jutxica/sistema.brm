-- =============================================================
-- CRIAÇÃO DA TABELA DE DOCUMENTOS AUTENTICADOS (FÉ PÚBLICA NOTARIAL)
-- Permite conferência descentralizada de QR Codes e Códigos de Validação
-- =============================================================

create table if not exists public.documentos_autenticados (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  tipo text not null,
  titulo text not null,
  identificador_oficial text,
  comunidade_obra text,
  religioso_id uuid references public.religiosos(id) on delete set null,
  religioso_nome text,
  data_emissao timestamptz not null default now(),
  emissor text not null default 'Secretaria Provincial BRM',
  situacao text not null default 'Ativo / Assento Canônico Válido com Fé Pública',
  hash_integridade text,
  metadados jsonb default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

create index if not exists documentos_autenticados_codigo_idx
  on public.documentos_autenticados(codigo);

alter table public.documentos_autenticados enable row level security;

-- Consulta pública para a página /validar
drop policy if exists "Qualquer pessoa pode consultar documento autenticado" on public.documentos_autenticados;
create policy "Qualquer pessoa pode consultar documento autenticado"
  on public.documentos_autenticados for select to anon, authenticated
  using (true);

-- Permissão de registro de novos documentos oficiais
drop policy if exists "Sistema pode registrar documento autenticado" on public.documentos_autenticados;
create policy "Sistema pode registrar documento autenticado"
  on public.documentos_autenticados for insert to anon, authenticated
  with check (true);

drop policy if exists "Sistema pode atualizar documento autenticado" on public.documentos_autenticados;
create policy "Sistema pode atualizar documento autenticado"
  on public.documentos_autenticados for update to authenticated
  using (true)
  with check (true);
