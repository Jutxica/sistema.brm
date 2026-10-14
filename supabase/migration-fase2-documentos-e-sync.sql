-- ==============================================================================
-- SISTEMA BRM - PROVÍNCIA BRASIL MERIDIONAL
-- FASE 2: TABELA RELACIONAL DE DOCUMENTOS, METADADOS & POLÍTICAS DE STORAGE
-- ==============================================================================

create extension if not exists pgcrypto;

-- 1. TABELA RELACIONAL DE DOCUMENTOS PATRIMONIAIS (patrimonio_documentos)
create table if not exists public.patrimonio_documentos (
  id uuid primary key default gen_random_uuid(),
  entidade_tipo text not null check (entidade_tipo in ('imovel', 'veiculo', 'bem', 'contrato', 'manutencao')),
  entidade_id text not null,
  nome text not null,
  tipo_documento text not null,
  arquivo_url text not null,
  storage_path text,
  tamanho_bytes bigint,
  formato text,
  enviado_por text,
  data_vencimento date,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices otimizados
create index if not exists idx_pat_docs_entidade on public.patrimonio_documentos(entidade_tipo, entidade_id);
create index if not exists idx_pat_docs_tipo on public.patrimonio_documentos(tipo_documento);
create index if not exists idx_pat_docs_vencimento on public.patrimonio_documentos(data_vencimento);

-- 2. RLS PARA PATRIMONIO_DOCUMENTOS
alter table public.patrimonio_documentos enable row level security;

create policy "Leitura institucional documentos" on public.patrimonio_documentos
  for select to authenticated using (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  );

create policy "Insercao documentos autorizada" on public.patrimonio_documentos
  for insert to authenticated with check (
    public.usuario_tem_papel('patrimonio') or
    public.usuario_tem_papel('economo') or
    public.usuario_tem_papel('secretaria') or
    public.usuario_tem_papel('admin')
  );

create policy "Atualizacao documentos autorizada" on public.patrimonio_documentos
  for update to authenticated using (
    public.usuario_tem_papel('patrimonio') or
    public.usuario_tem_papel('admin') or
    public.usuario_tem_papel('economo') or
    public.usuario_tem_papel('secretaria')
  ) with check (
    public.usuario_tem_papel('patrimonio') or
    public.usuario_tem_papel('admin') or
    public.usuario_tem_papel('economo') or
    public.usuario_tem_papel('secretaria')
  );

create policy "Exclusao documentos admin_economo" on public.patrimonio_documentos
  for delete to authenticated using (
    public.usuario_tem_papel('admin') or
    public.usuario_tem_papel('economo') or
    public.usuario_tem_papel('secretaria')
  );

-- 3. POLÍTICA DE STORAGE PRIVADO PARA O BUCKET DE PATRIMÔNIO
-- Criação do bucket caso não exista
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patrimonio-documentos',
  'patrimonio-documentos',
  false, -- Privado: requer signed URLs para maior segurança de escrituras e certidões
  52428800, -- 50 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 52428800;

-- Políticas de Storage para o bucket patrimonio-documentos
create policy "Acesso leitura storage patrimonio autenticado"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'patrimonio-documentos' and
    (
      public.usuario_tem_papel('patrimonio')
      or public.usuario_tem_papel('economo')
      or public.usuario_tem_papel('secretaria')
    )
  );

create policy "Upload storage patrimonio autorizado"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'patrimonio-documentos' and
    (
      public.usuario_tem_papel('patrimonio')
      or public.usuario_tem_papel('economo')
      or public.usuario_tem_papel('secretaria')
    )
  );

create policy "Atualizacao storage patrimonio autorizada"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'patrimonio-documentos' and
    (
      public.usuario_tem_papel('patrimonio')
      or public.usuario_tem_papel('economo')
      or public.usuario_tem_papel('secretaria')
    )
  )
  with check (
    bucket_id = 'patrimonio-documentos' and
    (
      public.usuario_tem_papel('patrimonio')
      or public.usuario_tem_papel('economo')
      or public.usuario_tem_papel('secretaria')
    )
  );

create policy "Exclusao storage patrimonio autorizado"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'patrimonio-documentos' and
    (
      public.usuario_tem_papel('patrimonio')
      or public.usuario_tem_papel('economo')
      or public.usuario_tem_papel('secretaria')
    )
  );
