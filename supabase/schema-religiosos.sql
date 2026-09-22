create extension if not exists pgcrypto;

-- Tabela base: comunidades
create table if not exists comunidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  padroeiro text,
  data_fundacao date,
  superior_id uuid,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  telefone text,
  email text,
  status text not null default 'Ativo' check (status in ('Ativo', 'Inativo')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela base: obras
create table if not exists obras (
  id uuid primary key default gen_random_uuid(),
  comunidade_id uuid references comunidades(id) on delete set null,
  nome text not null,
  tipo text not null check (tipo in ('Casa de Retiro/Hospedagem', 'Paróquia', 'Colégio', 'Seminário', 'Obra Social', 'Outro')),
  permite_hospedagem boolean not null default false,
  cnpj text,
  responsavel_id uuid,
  cep text,
  logradouro text,
  numero text,
  bairro text,
  cidade text,
  estado text,
  telefone text,
  email text,
  status text not null default 'Ativa' check (status in ('Ativa', 'Inativa')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela principal de religiosos e dados cadastrais
create table if not exists religiosos (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  origem_cadastro text default 'admin' check (origem_cadastro in ('admin', 'publico')),

  nome_civil text not null,
  nome_religioso text,
  grau text not null check (grau in ('Frater', 'Irmão', 'Diácono', 'Padre', 'Bispo')),
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

  comunidade_atual_id uuid references comunidades(id) on delete set null,
  obra_atual_id uuid references obras(id) on delete set null,
  email_institucional text,
  email_pessoal text,
  telefone_celular text,
  whatsapp text,

  pai_nome text,
  mae_nome text,
  contato_nome text,
  contato_parentesco text,
  contato_telefone text,

  batismo_data date,
  batismo_paroquia text,
  batismo_diocese text,
  batismo_cidade text,
  batismo_uf text,
  batismo_livro text,
  batismo_folha text,
  batismo_numero_registro text,
  batismo_celebrante text,
  batismo_observacoes text,

  primeira_eucaristia_data date,
  primeira_eucaristia_paroquia text,
  primeira_eucaristia_diocese text,
  primeira_eucaristia_cidade text,
  primeira_eucaristia_celebrante text,
  primeira_eucaristia_observacoes text,

  crisma_data date,
  crisma_paroquia text,
  crisma_diocese text,
  crisma_cidade text,
  crisma_celebrante text,
  crisma_livro text,
  crisma_folha text,
  crisma_numero_registro text,

  parroquia_origem text,
  diocese_origem text,
  grupo_movimento_pastoral text,
  promotor_vocacional text,
  historico_vocacional text,

  seminario_menor text,
  seminario_menor_cidade text,
  seminario_menor_ingresso date,
  seminario_menor_conclusao date,
  seminario_menor_formador text,

  propedeutico_seminario text,
  propedeutico_cidade text,
  propedeutico_ingresso date,
  propedeutico_conclusao date,
  propedeutico_formador text,

  postulantado_seminario text,
  postulantado_cidade text,
  postulantado_ingresso date,
  postulantado_conclusao date,
  mestre_postulantado text,

  noviciado_seminario text,
  noviciado_local text,
  noviciado_ingresso date,
  noviciado_termino date,
  mestre_noviciado text,

  primeira_profissao_data date,
  primeira_profissao_local text,
  primeira_profissao_celebrante text,

  votos_temporarios_1_data date,
  votos_temporarios_1_local text,
  votos_temporarios_1_celebrante text,
  votos_temporarios_2_data date,
  votos_temporarios_2_local text,
  votos_temporarios_2_celebrante text,
  votos_temporarios_3_data date,
  votos_temporarios_3_local text,
  votos_temporarios_3_celebrante text,

  votos_perpetuos_data date,
  votos_perpetuos_local text,
  votos_perpetuos_celebrante text,

  ministerio_palavra_data date,
  ministerio_palavra_local text,
  ministerio_palavra_celebrante text,
  ministerio_altar_data date,
  ministerio_altar_local text,
  ministerio_altar_celebrante text,
  acolitado_data date,
  acolitado_local text,
  acolitado_celebrante text,
  leitorado_data date,
  leitorado_local text,
  leitorado_celebrante text,
  diaconato_data date,
  diaconato_local text,
  diaconato_bispo_ordenante text,
  presbiterado_data date,
  presbiterado_local text,
  presbiterado_bispo_ordenante text,
  episcopado_data date,
  episcopado_local text,
  episcopado_bispo_ordenante text,

  ensino_medio_instituicao text,
  filosofia_instituicao text,
  teologia_instituicao text,
  graduacao_instituicao text,
  pos_graduacao_instituicao text,
  mestrado_instituicao text,
  doutorado_instituicao text,
  especializacao_instituicao text,
  cursos_livres text,
  formacao_permanente text,

  idioma_portugues text default 'Nível básico',
  idioma_espanhol text,
  idioma_italiano text,
  idioma_ingles text,
  idioma_alemao text,
  idioma_latim text,
  idioma_grego text,
  idioma_outros text,
  competencias text,

  historico_comunidades text,
  missoes text,
  servicos_congregacao text,
  servicos_igreja text,
  cargos_externos text,

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
  protese text,
  observacoes_saude text,

  status text not null default 'Ativo' check (status in ('Ativo', 'Em missão externa', 'Em estudos', 'Emérito', 'Falecido', 'Exclausurado')),
  status_cadastro text not null default 'Aprovado' check (status_cadastro in ('Em revisão', 'Aprovado', 'Arquivado')),
  consentimento_dados boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Filhos / irmãos do religioso
create table if not exists religiosos_irmaos (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references religiosos(id) on delete cascade,
  nome text not null,
  data_nascimento date,
  estado_civil text,
  observacoes text,
  created_at timestamptz default now()
);

-- Contatos familiares responsáveis
create table if not exists religiosos_contatos_familiares (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references religiosos(id) on delete cascade,
  nome text not null,
  parentesco text,
  contato_1 text,
  contato_2 text,
  created_at timestamptz default now()
);

-- Documentos anexados
create table if not exists religiosos_documentos (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references religiosos(id) on delete cascade,
  categoria text not null,
  nome_arquivo text,
  url_arquivo text,
  quem_cadastrou text,
  data_cadastro date default current_date,
  observacoes text,
  created_at timestamptz default now()
);

-- Formação acadêmica
create table if not exists religiosos_formacao_academica (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references religiosos(id) on delete cascade,
  categoria text not null,
  instituicao text,
  periodo text,
  cidade text,
  estado text,
  observacoes text,
  created_at timestamptz default now()
);

-- Idiomas e competências
create table if not exists religiosos_idiomas (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references religiosos(id) on delete cascade,
  idioma text not null,
  nivel text,
  competencia text,
  observacoes text,
  created_at timestamptz default now()
);

-- Histórico de comunidades e nomeações
create table if not exists religiosos_historico_comunidades (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references religiosos(id) on delete cascade,
  periodo_inicio date,
  periodo_fim date,
  instituicao text,
  funcao text,
  local text,
  observacoes text,
  created_at timestamptz default now()
);

-- Missões e serviços
create table if not exists religiosos_missoes_servicos (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references religiosos(id) on delete cascade,
  tipo text not null check (tipo in ('Missão', 'Serviço à Congregação', 'Serviço à Igreja', 'CNBB', 'Diocese', 'Organismo', 'Assessoria', 'Cargo externo')),
  instituicao text,
  funcao text,
  periodo text,
  local text,
  documento text,
  observacao text,
  created_at timestamptz default now()
);

-- Endereços e contatos do religioso
create table if not exists religiosos_enderecos (
  id uuid primary key default gen_random_uuid(),
  religioso_id uuid not null references religiosos(id) on delete cascade,
  obra_id uuid references obras(id) on delete set null,
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
  created_at timestamptz default now()
);

-- Índices básicos
create index if not exists idx_religiosos_nome_civil on religiosos(nome_civil);
create index if not exists idx_religiosos_grau on religiosos(grau);
create index if not exists idx_religiosos_comunidade on religiosos(comunidade_atual_id);
create index if not exists idx_religiosos_obra on religiosos(obra_atual_id);
create index if not exists idx_obras_comunidade on obras(comunidade_id);
create index if not exists idx_comunidades_status on comunidades(status);

-- Trigger para atualizar updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_comunidades_updated_at
before update on comunidades
for each row execute function set_updated_at();

create trigger trg_obras_updated_at
before update on obras
for each row execute function set_updated_at();

create trigger trg_religiosos_updated_at
before update on religiosos
for each row execute function set_updated_at();
