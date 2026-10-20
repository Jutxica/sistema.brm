-- ==============================================================================
-- CORREÇÃO COMPLETA: CAMPOS E TABELAS DO CADASTRO DE RELIGIOSOS (SUPABASE)
-- Província Brasil Meridional (BRM)
--
-- Resolve:
-- 1. "could not find the audicao column of religiosos_idiomas in the schema cache"
-- 2. "record new has no field comunidade_atual_nome"
-- 3. Adiciona todas as colunas das abas de formação, sacramentos, saúde, idiomas e documentos.
-- 4. Habilita permissões (RLS / Grants) para envio anônimo e autenticado.
-- 5. Recarrega o Schema Cache do PostgREST imediatamente.
--
-- Como aplicar:
-- 1. Acesse o painel do Supabase (https://supabase.com/dashboard)
-- 2. Vá em "SQL Editor" -> "+ New query"
-- 3. Cole este script e clique em "Run" (ou Ctrl + Enter)
-- ==============================================================================

begin;

-- ==============================================================================
-- 1. TABELA PRINCIPAL: public.religiosos
-- ==============================================================================
alter table public.religiosos
  add column if not exists comunidade_atual_nome text,
  add column if not exists obra_atual_id uuid,
  add column if not exists comunidade_atual_id uuid,
  add column if not exists nome_elenco text,
  add column if not exists cadastro_elenco_provisorio boolean not null default false,
  add column if not exists situacao_elenco text not null default 'Ativo',
  add column if not exists consentimento_em timestamptz;

-- ==============================================================================
-- 2. IDIOMAS E COMPETÊNCIAS
-- ==============================================================================
create table if not exists public.religiosos_idiomas (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  idioma text not null,
  nivel text,
  fala text,
  audicao text,
  leitura text,
  escrita text,
  competencia text,
  observacoes text,
  created_at timestamptz not null default now()
);

alter table public.religiosos_idiomas
  add column if not exists fala text,
  add column if not exists audicao text,
  add column if not exists leitura text,
  add column if not exists escrita text,
  add column if not exists competencia text,
  add column if not exists observacoes text;

create table if not exists public.religiosos_competencias (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  competencia text not null,
  observacoes text,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 3. FORMAÇÃO ACADÊMICA
-- ==============================================================================
create table if not exists public.religiosos_formacao_academica (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  categoria text not null,
  instituicao text,
  periodo text,
  pais text,
  cidade text,
  estado text,
  observacoes text,
  created_at timestamptz not null default now()
);

alter table public.religiosos_formacao_academica
  add column if not exists pais text,
  add column if not exists observacoes text;

-- ==============================================================================
-- 4. FAMILIARES E CONTATOS DE EMERGÊNCIA
-- ==============================================================================
create table if not exists public.religiosos_familiares (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  tipo text not null,
  nome text not null,
  data_nascimento date,
  local_nascimento text,
  estado_civil text,
  data_evento date,
  created_at timestamptz not null default now()
);

create table if not exists public.religiosos_contatos_familiares (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  nome text not null,
  parentesco text,
  contato_1 text,
  contato_2 text,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 5. SACRAMENTOS
-- ==============================================================================
create table if not exists public.religiosos_sacramentos (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  tipo text not null,
  data date,
  paroquia text,
  diocese text,
  cidade text,
  uf text,
  livro text,
  folha text,
  numero_registro text,
  celebrante text,
  observacoes text,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 6. ORIGEM E HISTÓRICO VOCACIONAL
-- ==============================================================================
create table if not exists public.religiosos_origem_vocacional (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  paroquia_origem text,
  diocese text,
  grupo_movimento_pastoral text,
  promotor_vocacional text,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.religiosos_historico_vocacional (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  data_evento date,
  ano integer,
  titulo text,
  descricao text,
  local text,
  responsavel text,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 7. ETAPAS DE FORMAÇÃO, PROFISSÕES/VOTOS E MINISTÉRIOS/ORDENS
-- ==============================================================================
create table if not exists public.religiosos_formacao_religiosa (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  etapa text not null,
  instituicao text,
  cidade text,
  local text,
  data_ingresso date,
  data_conclusao date,
  formador text,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.religiosos_profissoes_votos (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  tipo text not null,
  renovacao integer,
  data date,
  local text,
  celebrante text,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.religiosos_ministerios_ordens (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  tipo text not null,
  data date,
  local text,
  celebrante text,
  bispo_ordenante text,
  observacoes text,
  created_at timestamptz not null default now()
);

alter table public.religiosos_ministerios_ordens
  add column if not exists bispo_ordenante text,
  add column if not exists observacoes text;

-- ==============================================================================
-- 8. COMUNIDADES, MISSÕES E SERVIÇOS
-- ==============================================================================
create table if not exists public.religiosos_historico_comunidades (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  periodo_inicio date,
  periodo_fim date,
  instituicao text,
  funcao text,
  local text,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.religiosos_missoes_servicos (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  tipo text not null,
  instituicao text,
  funcao text,
  periodo text,
  local text,
  documento text,
  observacao text,
  created_at timestamptz not null default now()
);

alter table public.religiosos_missoes_servicos
  add column if not exists periodo text,
  add column if not exists observacao text,
  add column if not exists observacoes text;

-- ==============================================================================
-- 9. ENDEREÇOS E CONTATOS
-- ==============================================================================
create table if not exists public.religiosos_enderecos_contatos (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  obra_id uuid,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  pais text default 'Brasil',
  celular text,
  telefone text,
  email text,
  whatsapp text,
  redes_sociais text,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 10. SAÚDE
-- ==============================================================================
create table if not exists public.religiosos_saude (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  plano_saude text,
  numero_plano_saude text,
  local_plano_saude text,
  sus text,
  tipo_sanguineo text,
  fator_rh text,
  alergias text,
  medicamentos_continuos text,
  medico_responsavel text,
  contato_emergencia text,
  informacoes_clinicas text,
  cirurgias text,
  proteses text,
  observacoes text,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 11. DOCUMENTOS
-- ==============================================================================
create table if not exists public.religiosos_documentos (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  categoria text not null,
  nome_arquivo text,
  caminho_storage text,
  mime_type text,
  tamanho_bytes bigint,
  quem_cadastrou text,
  url_arquivo text,
  observacoes text,
  created_at timestamptz not null default now()
);

alter table public.religiosos_documentos
  add column if not exists caminho_storage text,
  add column if not exists mime_type text,
  add column if not exists tamanho_bytes bigint;

-- ==============================================================================
-- 12. PERMISSÕES E POLÍTICAS DE RLS
-- ==============================================================================
do $$
declare
  t text;
  tables text[] := array[
    'religiosos',
    'religiosos_idiomas',
    'religiosos_competencias',
    'religiosos_formacao_academica',
    'religiosos_familiares',
    'religiosos_contatos_familiares',
    'religiosos_sacramentos',
    'religiosos_origem_vocacional',
    'religiosos_historico_vocacional',
    'religiosos_formacao_religiosa',
    'religiosos_profissoes_votos',
    'religiosos_ministerios_ordens',
    'religiosos_historico_comunidades',
    'religiosos_missoes_servicos',
    'religiosos_enderecos_contatos',
    'religiosos_saude',
    'religiosos_documentos'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('grant select, insert, update, delete on public.%I to anon, authenticated, service_role;', t);

    -- Permissão de leitura
    execute format('drop policy if exists %I on public.%I;', t || '_public_select', t);
    execute format('create policy %I on public.%I for select using (true);', t || '_public_select', t);

    -- Permissão de inserção (formulário público e autenticado)
    execute format('drop policy if exists %I on public.%I;', t || '_public_insert', t);
    execute format('create policy %I on public.%I for insert with check (true);', t || '_public_insert', t);

    -- Permissão de atualização
    execute format('drop policy if exists %I on public.%I;', t || '_public_update', t);
    execute format('create policy %I on public.%I for update using (true) with check (true);', t || '_public_update', t);

    -- Permissão de exclusão
    execute format('drop policy if exists %I on public.%I;', t || '_public_delete', t);
    execute format('create policy %I on public.%I for delete using (true);', t || '_public_delete', t);
  end loop;
end $$;

commit;

-- 13. Notifica o PostgREST para recarregar o schema cache imediatamente
notify pgrst, 'reload schema';
