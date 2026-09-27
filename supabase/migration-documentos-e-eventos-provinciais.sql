-- =============================================================
-- SISTEMA BRM - PROVÍNCIA BRASIL MERIDIONAL
-- MIGRAÇÃO: DOCUMENTOS OFICIAIS & AGENDA PROVINCIAL
-- =============================================================

create extension if not exists pgcrypto;

-- 1. TABELA DE DOCUMENTOS PROVINCIAIS
create table if not exists public.documentos_provinciais (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text not null check (categoria in (
    'Transferências',
    'Diretórios',
    'Comunicados',
    'Protocolos',
    'Decretos',
    'Formação & Subsídios',
    'Outros'
  )),
  subtitulo text,
  numero_referencia text, -- Ex: Prot. 04/2026, Dec. 02/2026, Not. 01/2026
  data_documento date not null default current_date,
  arquivo_nome text not null,
  arquivo_url text not null,
  arquivo_path text,
  arquivo_tamanho_bytes bigint,
  mime_type text,
  descricao text,
  publicado_por text default 'Secretaria Provincial',
  status text not null default 'Ativo' check (status in ('Ativo', 'Arquivado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para busca rápida
create index if not exists idx_doc_prov_categoria on public.documentos_provinciais(categoria);
create index if not exists idx_doc_prov_status on public.documentos_provinciais(status);
create index if not exists idx_doc_prov_data on public.documentos_provinciais(data_documento desc);

-- RLS
alter table public.documentos_provinciais enable row level security;

create policy "Permitir leitura de documentos ativos para todos"
  on public.documentos_provinciais for select
  using (status = 'Ativo' or auth.role() = 'authenticated');

create policy "Permitir gerenciar documentos para autenticados e anon com chave"
  on public.documentos_provinciais for all
  using (true)
  with check (true);

-- 2. TABELA DE EVENTOS E AGENDA PROVINCIAL
create table if not exists public.eventos_provinciais (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null check (tipo in (
    'Assembleia',
    'Retiro',
    'Reunião',
    'Encontro',
    'Celebração / Solenidade',
    'Visita Canônica',
    'Formação',
    'Outro'
  )),
  data_inicio date not null,
  data_fim date,
  horario text,
  local text not null, -- Ex: Casa Padre Dehon, Brusque/SC
  cidade text,
  uf text,
  descricao text,
  publico_alvo text default 'Toda a Província',
  status text not null default 'Confirmado' check (status in ('Confirmado', 'Previsto', 'Concluído', 'Cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices
create index if not exists idx_eventos_prov_data on public.eventos_provinciais(data_inicio asc);
create index if not exists idx_eventos_prov_tipo on public.eventos_provinciais(tipo);
create index if not exists idx_eventos_prov_status on public.eventos_provinciais(status);

-- RLS
alter table public.eventos_provinciais enable row level security;

create policy "Permitir leitura de eventos para todos"
  on public.eventos_provinciais for select
  using (true);

create policy "Permitir gerenciar eventos para autenticados e anon com chave"
  on public.eventos_provinciais for all
  using (true)
  with check (true);

-- 3. CARGA INICIAL (SEED) DE EVENTOS DA AGENDA 2026 DA PROVÍNCIA BRM
insert into public.eventos_provinciais (titulo, tipo, data_inicio, data_fim, horario, local, cidade, uf, descricao, publico_alvo, status)
values
  (
    'Retiro Provincial dos Presbíteros (Turma I)',
    'Retiro',
    '2026-03-14',
    '2026-03-18',
    '08:00',
    'Casa Padre Dehon',
    'Brusque',
    'SC',
    'Retiro anual de espiritualidade dehoniana para a primeira turma de presbíteros da Província BRM.',
    'Presbíteros',
    'Confirmado'
  ),
  (
    'Reunião Ordinária do Conselho Provincial',
    'Reunião',
    '2026-04-15',
    null,
    '09:00',
    'Sede Provincial',
    'Curitiba',
    'PR',
    'Sessão com o Superior Provincial e Conselheiros para avaliação pastoral e atos canônicos.',
    'Governo Provincial',
    'Confirmado'
  ),
  (
    'Encontro dos Fratres da Etapa de Configuração (Teologia)',
    'Encontro',
    '2026-05-22',
    '2026-05-24',
    '14:00',
    'Seminário SCJ',
    'Corupá',
    'SC',
    'Convivência vocacional, partilha pastoral e aprofundamento do carisma do Pe. Dehon.',
    'Fratres',
    'Confirmado'
  ),
  (
    'Solenidade do Sagrado Coração de Jesus (Festa Patronal SCJ)',
    'Celebração / Solenidade',
    '2026-06-19',
    null,
    '19:00',
    'Todas as Comunidades da Província',
    'Curitiba',
    'PR',
    'Festa titular da Congregação dos Padres do Sagrado Coração de Jesus com renovação dos votos e adoração reparadora.',
    'Toda a Província',
    'Confirmado'
  ),
  (
    'Memória do Venerável Pe. Leão João Dehon',
    'Celebração / Solenidade',
    '2026-08-12',
    null,
    '19:30',
    'Todas as Paróquias e Casas da Província',
    'Curitiba',
    'PR',
    'Celebração eucarística em honra ao nosso fundador com súplica pela beatificação.',
    'Toda a Província',
    'Confirmado'
  ),
  (
    'Assembleia Provincial Ordinária 2026',
    'Assembleia',
    '2026-10-05',
    '2026-10-09',
    '08:30',
    'Seminário São José',
    'Rio Negrinho',
    'SC',
    'Assembleia anual com a presença de todos os confrades perpétuos e temporários para planejamento pastoral.',
    'Toda a Província',
    'Confirmado'
  )
on conflict do nothing;

-- 4. CARGA INICIAL (SEED) DE DOCUMENTOS EXEMPLO DA PROVÍNCIA BRM
insert into public.documentos_provinciais (titulo, categoria, numero_referencia, data_documento, arquivo_nome, arquivo_url, arquivo_tamanho_bytes, mime_type, descricao, publicado_por, status)
values
  (
    'Diretório Provincial da Província Brasil Meridional - Edição Atualizada',
    'Diretórios',
    'Dir. BRM 2026',
    '2026-01-15',
    'Diretorio_Provincial_BRM_2026.pdf',
    '/documentos/Diretorio_Provincial_BRM_2026.pdf',
    2450000,
    'application/pdf',
    'Texto oficial com normas de vida comunitária, administração e governo da Província BRM.',
    'Secretaria Provincial',
    'Ativo'
  ),
  (
    'Nomeações e Transferências Canônicas para o Triênio 2026-2028',
    'Transferências',
    'Prot. 03/2026',
    '2026-02-01',
    'Nomeacoes_Transferencias_BRM_2026.pdf',
    '/documentos/Nomeacoes_Transferencias_BRM_2026.pdf',
    1150000,
    'application/pdf',
    'Decreto do Superior Provincial com o remanejamento dos confrades para comunidades e paróquias.',
    'Secretaria Provincial',
    'Ativo'
  ),
  (
    'Circular nº 01/2026: Orientações para a Quaresma e Ano Jubilar',
    'Comunicados',
    'Circ. 01/2026',
    '2026-02-18',
    'Circular_01_2026_Quaresma_Jubileu.pdf',
    '/documentos/Circular_01_2026_Quaresma_Jubileu.pdf',
    890000,
    'application/pdf',
    'Mensagem do Superior Provincial a todas as comunidades sobre vivência fraterna e oração.',
    'Secretaria Provincial',
    'Ativo'
  ),
  (
    'Protocolo de Gestão Documental e Arquivística Paroquial',
    'Protocolos',
    'Prot. 07/2026',
    '2026-03-02',
    'Protocolo_Gestao_Documental_BRM.pdf',
    '/documentos/Protocolo_Gestao_Documental_BRM.pdf',
    1450000,
    'application/pdf',
    'Diretrizes canônicas para organização dos livros de tombo, batismos e arquivos patrimoniais.',
    'Secretaria Provincial',
    'Ativo'
  ),
  (
    'Subsídio de Oração e Hora Santa Dehoniana - Mês do Sagrado Coração',
    'Formação & Subsídios',
    'Subs. 02/2026',
    '2026-03-10',
    'Subsidio_Hora_Santa_Dehoniana_2026.pdf',
    '/documentos/Subsidio_Hora_Santa_Dehoniana_2026.pdf',
    1820000,
    'application/pdf',
    'Roteiro para a Hora Santa semanal nas comunidades formativas e religiosas da BRM.',
    'Secretaria Provincial',
    'Ativo'
  )
on conflict do nothing;
