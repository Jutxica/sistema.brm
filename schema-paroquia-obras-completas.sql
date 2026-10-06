-- =============================================================
-- BRM - BASE COMPLETA DE PARÓQUIAS, CASAS E OBRAS
-- =============================================================
-- Arquivo preparado para uso no Supabase.
-- Mantém a tabela central de referências institucionais usada
-- pelo painel administrativo e pelo cadastro público.

create extension if not exists pgcrypto;

-- =============================================================
-- 1. TABELA CENTRAL: PARÓQUIAS / CASAS / OBRAS
-- =============================================================
create table if not exists public.religiosos_obras_referencia (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null default 'Paróquia' check (tipo in ('Paróquia', 'Casa', 'Obra')),
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  localidade text,
  estado text,
  uf text,
  pais text default 'Brasil',
  telefone text,
  email text,
  whatsapp text,
  status text not null default 'Ativa' check (status in ('Ativa', 'Inativa')),
  diocese text,
  fundacao date,
  assumida_pelos_dehonianos date,
  endereco text,
  instagram text,
  facebook text,
  youtube text,
  site text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.religiosos_obras_referencia
  add column if not exists tipo text;

alter table public.religiosos_obras_referencia
  add column if not exists cidade text;

alter table public.religiosos_obras_referencia
  add column if not exists localidade text;

alter table public.religiosos_obras_referencia
  add column if not exists uf text;

update public.religiosos_obras_referencia
set
  tipo = coalesce(tipo, 'Paróquia'),
  localidade = coalesce(localidade, cidade),
  cidade = coalesce(cidade, localidade)
where tipo is null or localidade is null or cidade is null;

alter table public.religiosos_obras_referencia
  alter column tipo set default 'Paróquia';

alter table public.religiosos_obras_referencia
  alter column tipo set not null;

alter table public.religiosos_obras_referencia
  add constraint religiosos_obras_referencia_tipo_check
  check (tipo in ('Paróquia', 'Casa', 'Obra'))
  not valid;

create unique index if not exists idx_obras_referencia_nome_local
on public.religiosos_obras_referencia (nome, localidade, uf);

-- =============================================================
-- 2. RELIGIOSOS
-- =============================================================
create table if not exists public.religiosos (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  origem_cadastro text not null default 'admin'
    check (origem_cadastro in ('admin', 'publico')),
  status_cadastro text not null default 'Em revisão'
    check (status_cadastro in ('Em revisão', 'Aprovado', 'Arquivado')),
  status text not null default 'Ativo'
    check (status in ('Ativo', 'Em missão externa', 'Em estudos', 'Emérito', 'Falecido', 'Exclaustrado')),

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
-- 3. FAMÍLIA
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
-- 4. SACRAMENTOS E INICIAÇÃO CRISTÃ
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
  observacoes text,
  created_at timestamptz not null default now()
);

-- =============================================================
-- 5. HISTÓRICO VOCACIONAL E ORIGEM
-- =============================================================
create table if not exists public.religiosos_historico_vocacional (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  data date,
  evento text,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.religiosos_origem_vocacional (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  paroquia_natal text,
  diocese_natal text,
  cidade_natal text,
  uf_natal text,
  pais_natal text,
  escola_primaria text,
  igreja_comunidade text,
  motivacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================
-- 6. FORMAÇÃO RELIGIOSA E ACADÊMICA
-- =============================================================
create table if not exists public.religiosos_formacao_religiosa (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  etapa text,
  local text,
  data_inicio date,
  data_fim date,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.religiosos_formacao_academica (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  curso text,
  instituicao text,
  nivel text,
  data_inicio date,
  data_fim date,
  concluido boolean default false,
  observacoes text,
  created_at timestamptz not null default now()
);

-- =============================================================
-- 7. PROFISSÕES, VOTOS E MINISTÉRIOS
-- =============================================================
create table if not exists public.religiosos_profissoes_votos (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  tipo text not null check (tipo in ('Profissão Simples', 'Profissão Solene', 'Voto')),
  data date,
  local text,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.religiosos_ministerios_ordens (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  tipo text not null check (tipo in ('Diaconato', 'Ordenação', 'Ministério')),
  data date,
  local text,
  observacoes text,
  created_at timestamptz not null default now()
);

-- =============================================================
-- 8. IDIOMAS E COMPETÊNCIAS
-- =============================================================
create table if not exists public.religiosos_idiomas (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  idioma text not null,
  nivel text,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.religiosos_competencias (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  tipo text not null,
  descricao text,
  created_at timestamptz not null default now()
);

-- =============================================================
-- 9. HISTÓRICO DE COMUNIDADES E MISSÕES
-- =============================================================
create table if not exists public.religiosos_historico_comunidades (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  comunidade text,
  cargo text,
  data_inicio date,
  data_fim date,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.religiosos_missoes_servicos (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  tipo text not null check (tipo in ('Missão', 'Serviço', 'Pastoral')),
  local text,
  cargo text,
  data_inicio date,
  data_fim date,
  observacoes text,
  created_at timestamptz not null default now()
);

-- =============================================================
-- 10. ENDEREÇOS, CONTATOS E SAÚDE
-- =============================================================
create table if not exists public.religiosos_enderecos_contatos (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  tipo text not null check (tipo in ('Residencial', 'Pessoal', 'Institucional')),
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  uf text,
  pais text,
  telefone text,
  email text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.religiosos_saude (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  tipo_sanguineo text,
  alergias text,
  medicamentos text,
  restricoes text,
  plano_saude text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================
-- 11. DOCUMENTOS
-- =============================================================
create table if not exists public.religiosos_documentos (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references public.religiosos(id) on delete cascade,
  tipo text not null,
  nome_arquivo text,
  url text,
  descricao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================
-- 12. CONFIGURAÇÕES DO CADASTRO PÚBLICO
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

-- =============================================================
-- 13. FUNÇÃO DE updated_at
-- =============================================================
create or replace function public.religiosos_set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================
-- 14. TRIGGERS
-- =============================================================
drop trigger if exists trg_religiosos_updated_at on public.religiosos;
create trigger trg_religiosos_updated_at
before update on public.religiosos
for each row execute function public.religiosos_set_updated_at();

drop trigger if exists trg_religiosos_origem_updated_at on public.religiosos_origem_vocacional;
create trigger trg_religiosos_origem_updated_at
before update on public.religiosos_origem_vocacional
for each row execute function public.religiosos_set_updated_at();

drop trigger if exists trg_religiosos_endereco_updated_at on public.religiosos_enderecos_contatos;
create trigger trg_religiosos_endereco_updated_at
before update on public.religiosos_enderecos_contatos
for each row execute function public.religiosos_set_updated_at();

drop trigger if exists trg_religiosos_saude_updated_at on public.religiosos_saude;
create trigger trg_religiosos_saude_updated_at
before update on public.religiosos_saude
for each row execute function public.religiosos_set_updated_at();

drop trigger if exists trg_religiosos_documentos_updated_at on public.religiosos_documentos;
create trigger trg_religiosos_documentos_updated_at
before update on public.religiosos_documentos
for each row execute function public.religiosos_set_updated_at();

drop trigger if exists trg_religiosos_config_updated_at on public.religiosos_configuracoes;
create trigger trg_religiosos_config_updated_at
before update on public.religiosos_configuracoes
for each row execute function public.religiosos_set_updated_at();

drop trigger if exists trg_religiosos_obras_updated_at on public.religiosos_obras_referencia;
create trigger trg_religiosos_obras_updated_at
before update on public.religiosos_obras_referencia
for each row execute function public.religiosos_set_updated_at();

-- =============================================================
-- 15. RLS
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
create policy religiosos_config_public_select
on public.religiosos_configuracoes
for select to anon, authenticated
using (true);

drop policy if exists religiosos_config_authenticated_all on public.religiosos_configuracoes;
create policy religiosos_config_authenticated_all
on public.religiosos_configuracoes
for all to authenticated
using (true)
with check (true);

drop policy if exists religiosos_obras_public_select on public.religiosos_obras_referencia;
create policy religiosos_obras_public_select
on public.religiosos_obras_referencia
for select to anon, authenticated
using (status = 'Ativa');

drop policy if exists religiosos_obras_authenticated_all on public.religiosos_obras_referencia;
create policy religiosos_obras_authenticated_all
on public.religiosos_obras_referencia
for all to authenticated
using (true)
with check (true);

drop policy if exists religiosos_public_insert on public.religiosos;
create policy religiosos_public_insert
on public.religiosos
for insert to anon, authenticated
with check (origem_cadastro = 'publico' and status_cadastro = 'Em revisão');

drop policy if exists religiosos_authenticated_all on public.religiosos;
create policy religiosos_authenticated_all
on public.religiosos
for all to authenticated
using (true)
with check (true);

-- =============================================================
-- 16. DADOS INICIAIS DE CONFIGURAÇÃO
-- =============================================================
insert into public.religiosos_configuracoes (
  id,
  ativo,
  titulo,
  mensagem_abertura,
  mensagem_fechamento,
  mensagem_confirmacao,
  termos,
  exigir_documentos,
  email_notificacao,
  assunto_notificacao,
  instrucoes_documentos
)
values (
  '00000000-0000-0000-0000-000000000001',
  true,
  'Atualização de Dados dos Religiosos',
  'Preencha todos os dados solicitados e anexe os documentos necessários.',
  'As inscrições estão temporariamente fechadas. Aguarde uma nova abertura.',
  'Recebemos seus dados e documentos. A secretaria fará a conferência.',
  'Autorizo o uso dos dados pela Província BRM para atualização cadastral, gestão institucional e contato pastoral/administrativo.',
  true,
  null,
  'Novo cadastro de religioso recebido',
  'Anexe documentos legíveis de identificação, sacramentos, vida religiosa, formação e documentos administrativos.'
)
on conflict (id) do nothing;

-- =============================================================
-- 17. EXEMPLOS DE IMPORTAÇÃO (opcional)
-- =============================================================
-- A importação do Excel ocorre pelo painel administrativo, não via SQL
-- manual. Porém, se você quiser inserir alguns itens iniciais de teste:
--
-- insert into public.religiosos_obras_referencia (
--   nome, tipo, localidade, uf, cidade, diocese, endereco, status
-- ) values
--   ('Paróquia São José', 'Paróquia', 'Aparecida', 'SP', 'Aparecida', 'Diocese de Aparecida', 'Rua Principal, 100', 'Ativa'),
--   ('Casa de Formação São Luiz', 'Casa', 'Belo Horizonte', 'MG', 'Belo Horizonte', 'Província', 'Av. Central, 200', 'Ativa'),
--   ('Obra Missionária de Apoio', 'Obra', 'Curitiba', 'PR', 'Curitiba', 'Província', 'Rua da Paz, 50', 'Ativa');

-- =============================================================
-- FIM
-- =============================================================
