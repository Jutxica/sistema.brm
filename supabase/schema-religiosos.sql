-- =============================================================
-- BRM - MODULO COMPLETO DE RELIGIOSOS
-- =============================================================
-- Executar em um projeto Supabase novo ou existente.
-- Este arquivo cobre integralmente as 13 secoes do documento
-- "Sistema - Dados dos Religiosos.pdf".
--
-- Os registros sao normalizados para permitir varios irmaos,
-- sacramentos, formacoes, renovacoes, idiomas, servicos e documentos.

create extension if not exists pgcrypto;

-- =============================================================
-- 1. REFERENCIAS DE OBRAS / ENDERECO ATUAL
-- =============================================================
create table if not exists public.religiosos_obras_referencia (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  pais text default 'Brasil',
  telefone text,
  email text,
  status text not null default 'Ativa' check (status in ('Ativa', 'Inativa')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================
-- 2. IDENTIFICACAO E DADOS BASE
-- =============================================================
create table if not exists public.religiosos (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  origem_cadastro text not null default 'admin' check (origem_cadastro in ('admin', 'publico')),
  status_cadastro text not null default 'Em revisão' check (status_cadastro in ('Em revisão', 'Aprovado', 'Arquivado')),
  status text not null default 'Ativo' check (status in ('Ativo', 'Em missão externa', 'Em estudos', 'Emérito', 'Falecido', 'Exclaustrado')),

  grau text not null check (grau in ('Frater', 'Irmão', 'Diácono', 'Padre', 'Bispo')),
  nome_civil text not null,
  nome_religioso text,
  data_nascimento date,
  local_nascimento text,
  municipio_nascimento text,
  estado_nascimento text,
  pais_nascimento text,
  nacionalidade text,
  cpf text,
  rg text,
  rg_orgao_expedidor text,
  rg_data_emissao date,
  titulo_eleitor text,
  pis text,
  cnh text,
  cnh_categoria text,
  passaporte text,

  comunidade_atual_nome text,
  obra_atual_id uuid references public.religiosos_obras_referencia(id) on delete set null,
  email_institucional text,
  email_pessoal text,
  telefone_celular text,
  whatsapp text,
  redes_sociais text,

  consentimento_dados boolean not null default false,
  consentimento_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================
-- 3. DADOS FAMILIARES
-- =============================================================
create table if not exists public.religiosos_familiares (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  tipo text not null check (tipo in ('Pai', 'Mãe', 'Irmão')),
  nome text not null,
  data_nascimento date,
  local_nascimento text,
  estado_civil text check (estado_civil in ('Casado', 'Casada', 'Divorciado', 'Divorciada', 'Viúvo', 'Viúva', 'Falecido', 'Falecida', 'Solteiro', 'Solteira', 'Outro')),
  data_evento date,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.religiosos_contatos_familiares (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  nome text not null,
  parentesco text,
  contato_1 text,
  contato_2 text,
  observacoes text,
  created_at timestamptz not null default now()
);

-- =============================================================
-- 4. SACRAMENTOS E INICIACAO CRISTA
-- =============================================================
create table if not exists public.religiosos_sacramentos (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  tipo text not null check (tipo in ('Batismo', 'Primeira Eucaristia', 'Crisma')),
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

-- =============================================================
-- 5. HISTORICO VOCACIONAL
-- =============================================================
create table if not exists public.religiosos_historico_vocacional (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  data_evento date,
  ano integer,
  titulo text not null,
  descricao text,
  local text,
  responsavel text,
  created_at timestamptz not null default now()
);

create table if not exists public.religiosos_origem_vocacional (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null unique references public.religiosos(id) on delete cascade,
  paroquia_origem text,
  diocese text,
  grupo_movimento_pastoral text,
  promotor_vocacional text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================
-- 6. ETAPAS DE FORMACAO, PROFISSOES E VOTOS
-- =============================================================
create table if not exists public.religiosos_formacao_religiosa (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  etapa text not null check (etapa in ('Seminário Menor', 'Propedêutico', 'Postulantado', 'Noviciado')),
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
  tipo text not null check (tipo in ('Primeira profissão', 'Voto temporário', 'Voto perpétuo')),
  renovacao integer,
  data date,
  local text,
  celebrante text,
  observacoes text,
  created_at timestamptz not null default now(),
  check ((tipo <> 'Voto temporário') or (renovacao is not null and renovacao > 0))
);

-- =============================================================
-- 7. MINISTERIOS E ORDENS
-- =============================================================
create table if not exists public.religiosos_ministerios_ordens (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  tipo text not null check (tipo in ('Ministério da Palavra', 'Ministério do Altar', 'Acolitado', 'Leitorado', 'Diaconato', 'Presbiterado', 'Episcopado')),
  data date,
  local text,
  celebrante text,
  bispo_ordenante text,
  observacoes text,
  created_at timestamptz not null default now()
);

-- =============================================================
-- 8. FORMACAO ACADEMICA
-- =============================================================
create table if not exists public.religiosos_formacao_academica (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  categoria text not null check (categoria in ('Ensino médio', 'Filosofia', 'Teologia', 'Graduação', 'Pós-graduação', 'Mestrado', 'Doutorado', 'Especialização', 'Cursos livres', 'Formação permanente')),
  instituicao text,
  periodo text,
  cidade text,
  estado text,
  observacoes text,
  created_at timestamptz not null default now()
);

-- =============================================================
-- 9. IDIOMAS E COMPETENCIAS
-- =============================================================
create table if not exists public.religiosos_idiomas (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  idioma text not null,
  nivel text check (nivel in ('Básico', 'Intermediário', 'Avançado', 'Fluente')),
  fala text,
  audicao text,
  leitura text,
  escrita text,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.religiosos_competencias (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  competencia text not null,
  observacoes text,
  created_at timestamptz not null default now()
);

-- =============================================================
-- 10. HISTORICO DE COMUNIDADES E NOMEACOES
-- =============================================================
create table if not exists public.religiosos_historico_comunidades (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  periodo_inicio date,
  periodo_fim date,
  instituicao text not null,
  funcao text,
  local text,
  observacoes text,
  created_at timestamptz not null default now()
);

-- =============================================================
-- 11. MISSOES E SERVICOS
-- =============================================================
create table if not exists public.religiosos_missoes_servicos (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  tipo text not null check (tipo in ('Missão', 'Serviço à Congregação', 'Serviço à Igreja', 'CNBB', 'Diocese', 'Organismo', 'Assessoria', 'Cargo externo')),
  instituicao text,
  funcao text,
  periodo text,
  local text,
  documento text,
  observacao text,
  created_at timestamptz not null default now()
);

-- =============================================================
-- 12. ENDERECOS E CONTATOS
-- =============================================================
create table if not exists public.religiosos_enderecos_contatos (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  obra_id uuid references public.religiosos_obras_referencia(id) on delete set null,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  pais text,
  celular text,
  telefone text,
  email text,
  whatsapp text,
  redes_sociais text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================
-- 13. SAUDE
-- =============================================================
create table if not exists public.religiosos_saude (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null unique references public.religiosos(id) on delete cascade,
  plano_saude text,
  numero_plano_saude text,
  local_plano_saude text,
  sus text,
  tipo_sanguineo text,
  fator_rh text check (fator_rh in ('Positivo', 'Negativo', '+', '-', 'Não informado')),
  alergias text,
  medicamentos_continuos text,
  medico_responsavel text,
  contato_emergencia text,
  informacoes_clinicas text,
  cirurgias text,
  proteses text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================
-- 14. DOCUMENTOS E ANEXOS
-- =============================================================
create table if not exists public.religiosos_documentos (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  categoria text not null check (categoria in (
    'RG', 'CPF', 'CNH', 'Passaporte', 'Título de eleitor', 'Certidão de nascimento',
    'Batismo', 'Primeira Eucaristia', 'Crisma',
    'Admissão ao Postulantado', 'Admissão ao Noviciado', 'Primeira Profissão Religiosa',
    'Renovações', 'Votos perpétuos', 'Diaconato', 'Presbiterado', 'Episcopado',
    'Histórico escolar', 'Diplomas', 'Certificados', 'Decretos', 'Licenças',
    'Dispensas', 'Indultos', 'Contratos', 'Procurações', 'Outros'
  )),
  nome_arquivo text not null,
  caminho_storage text not null,
  url_arquivo text,
  mime_type text,
  tamanho_bytes bigint,
  hash_arquivo text,
  quem_cadastrou text not null,
  cadastrado_por uuid,
  data_cadastro date not null default current_date,
  observacoes text,
  status text not null default 'Ativo' check (status in ('Ativo', 'Substituido', 'Excluido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================
-- 15. CONFIGURACOES DAS INSCRICOES PUBLICAS
-- =============================================================
create table if not exists public.religiosos_configuracoes (
  id uuid primary key default gen_random_uuid(),
  ativo boolean not null default true,
  titulo text not null default 'Atualização de Dados dos Religiosos',
  mensagem_abertura text not null default 'Preencha todos os dados solicitados e anexe os documentos necessários.',
  mensagem_fechamento text not null default 'As inscrições estão temporariamente fechadas. Aguarde uma nova abertura.',
  mensagem_confirmacao text not null default 'Recebemos seus dados e documentos. A secretaria fará a conferência.',
  termos text not null default 'Autorizo o uso dos dados pela Província BRM para atualização cadastral, gestão institucional e contato pastoral/administrativo.',
  exigir_documentos boolean not null default true,
  email_notificacao text,
  assunto_notificacao text not null default 'Novo cadastro de religioso recebido',
  instrucoes_documentos text not null default 'Anexe documentos legíveis de identificação, sacramentos, vida religiosa, formação e documentos administrativos.',
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.religiosos_configuracoes (id)
values ('00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- =============================================================
-- INDICES
-- =============================================================
create index if not exists idx_religiosos_cpf on public.religiosos(cpf);
create index if not exists idx_religiosos_nome on public.religiosos(nome_civil);
create index if not exists idx_religiosos_obra on public.religiosos(obra_atual_id);
create index if not exists idx_religiosos_familiares on public.religiosos_familiares(religioso_id);
create index if not exists idx_religiosos_sacramentos on public.religiosos_sacramentos(religioso_id);
create index if not exists idx_religiosos_documentos on public.religiosos_documentos(religioso_id);
create index if not exists idx_religiosos_documentos_categoria on public.religiosos_documentos(categoria);

-- =============================================================
-- UPDATED_AT
-- =============================================================
create or replace function public.religiosos_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_religiosos_updated_at on public.religiosos;
create trigger trg_religiosos_updated_at before update on public.religiosos
for each row execute function public.religiosos_set_updated_at();

drop trigger if exists trg_religiosos_obras_updated_at on public.religiosos_obras_referencia;
create trigger trg_religiosos_obras_updated_at before update on public.religiosos_obras_referencia
for each row execute function public.religiosos_set_updated_at();

drop trigger if exists trg_religiosos_origem_updated_at on public.religiosos_origem_vocacional;
create trigger trg_religiosos_origem_updated_at before update on public.religiosos_origem_vocacional
for each row execute function public.religiosos_set_updated_at();

drop trigger if exists trg_religiosos_endereco_updated_at on public.religiosos_enderecos_contatos;
create trigger trg_religiosos_endereco_updated_at before update on public.religiosos_enderecos_contatos
for each row execute function public.religiosos_set_updated_at();

drop trigger if exists trg_religiosos_saude_updated_at on public.religiosos_saude;
create trigger trg_religiosos_saude_updated_at before update on public.religiosos_saude
for each row execute function public.religiosos_set_updated_at();

drop trigger if exists trg_religiosos_documentos_updated_at on public.religiosos_documentos;
create trigger trg_religiosos_documentos_updated_at before update on public.religiosos_documentos
for each row execute function public.religiosos_set_updated_at();

drop trigger if exists trg_religiosos_config_updated_at on public.religiosos_configuracoes;
create trigger trg_religiosos_config_updated_at before update on public.religiosos_configuracoes
for each row execute function public.religiosos_set_updated_at();

-- =============================================================
-- RLS: PUBLICO PODE ENVIAR, APENAS AUTENTICADO LE/GERENCIA
-- =============================================================
alter table public.religiosos enable row level security;
alter table public.religiosos_obras_referencia enable row level security;
alter table public.religiosos_familiares enable row level security;
alter table public.religiosos_contatos_familiares enable row level security;
alter table public.religiosos_sacramentos enable row level security;
alter table public.religiosos_historico_vocacional enable row level security;
alter table public.religiosos_origem_vocacional enable row level security;
alter table public.religiosos_formacao_religiosa enable row level security;
alter table public.religiosos_profissoes_votos enable row level security;
alter table public.religiosos_ministerios_ordens enable row level security;
alter table public.religiosos_formacao_academica enable row level security;
alter table public.religiosos_idiomas enable row level security;
alter table public.religiosos_competencias enable row level security;
alter table public.religiosos_historico_comunidades enable row level security;
alter table public.religiosos_missoes_servicos enable row level security;
alter table public.religiosos_enderecos_contatos enable row level security;
alter table public.religiosos_saude enable row level security;
alter table public.religiosos_documentos enable row level security;
alter table public.religiosos_configuracoes enable row level security;

drop policy if exists religiosos_config_public_select on public.religiosos_configuracoes;
create policy religiosos_config_public_select on public.religiosos_configuracoes
for select to anon, authenticated using (true);

drop policy if exists religiosos_config_authenticated_all on public.religiosos_configuracoes;
create policy religiosos_config_authenticated_all on public.religiosos_configuracoes
for all to authenticated using (true) with check (true);

drop policy if exists religiosos_obras_public_select on public.religiosos_obras_referencia;
create policy religiosos_obras_public_select on public.religiosos_obras_referencia
for select to anon, authenticated using (status = 'Ativa');

drop policy if exists religiosos_public_insert on public.religiosos;
create policy religiosos_public_insert on public.religiosos
  for insert to anon, authenticated with check (origem_cadastro = 'publico' and status_cadastro = 'Em revisão');

drop policy if exists religiosos_authenticated_all on public.religiosos;
create policy religiosos_authenticated_all on public.religiosos
for all to authenticated using (true) with check (true);

-- As tabelas filhas sao gerenciadas pelo painel autenticado.
do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'religiosos_familiares', 'religiosos_contatos_familiares',
    'religiosos_sacramentos', 'religiosos_historico_vocacional',
    'religiosos_origem_vocacional', 'religiosos_formacao_religiosa',
    'religiosos_profissoes_votos', 'religiosos_ministerios_ordens',
    'religiosos_formacao_academica', 'religiosos_idiomas',
    'religiosos_competencias', 'religiosos_historico_comunidades',
    'religiosos_missoes_servicos', 'religiosos_enderecos_contatos',
    'religiosos_saude', 'religiosos_documentos'
  ] loop
    execute format('drop policy if exists %I_authenticated_all on public.%I', tabela, tabela);
    execute format('create policy %I_authenticated_all on public.%I for all to authenticated using (true) with check (true)', tabela, tabela);
    execute format('drop policy if exists %I_public_insert on public.%I', tabela, tabela);
    execute format('create policy %I_public_insert on public.%I for insert to anon, authenticated with check (exists (select 1 from public.religiosos r where r.id = religioso_id and r.status_cadastro = ''Em revisão''))', tabela, tabela);
  end loop;
end;
$$;

-- =============================================================
-- STORAGE PARA ANEXOS
-- =============================================================
insert into storage.buckets (id, name, public)
values ('religiosos-documentos', 'religiosos-documentos', false)
on conflict (id) do update set public = false;

drop policy if exists religiosos_documentos_upload on storage.objects;
create policy religiosos_documentos_upload on storage.objects
for insert to anon, authenticated
with check (bucket_id = 'religiosos-documentos');

drop policy if exists religiosos_documentos_read on storage.objects;
create policy religiosos_documentos_read on storage.objects
for select to authenticated
using (bucket_id = 'religiosos-documentos');

drop policy if exists religiosos_documentos_update on storage.objects;
create policy religiosos_documentos_update on storage.objects
for update to authenticated
using (bucket_id = 'religiosos-documentos')
with check (bucket_id = 'religiosos-documentos');

drop policy if exists religiosos_documentos_delete on storage.objects;
create policy religiosos_documentos_delete on storage.objects
for delete to authenticated
using (bucket_id = 'religiosos-documentos');
