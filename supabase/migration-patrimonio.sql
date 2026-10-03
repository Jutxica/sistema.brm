-- ==============================================================================
-- SISTEMA BRM - PROVÍNCIA BRASIL MERIDIONAL
-- MIGRAÇÃO: MÓDULO DE PATRIMÔNIO PROVINCIAL
-- Gestão de Imóveis, Frota de Veículos, Bens & Arte Sacra, Contratos e Vistorias
-- ==============================================================================

create extension if not exists pgcrypto;

-- 1. TABELA DE IMÓVEIS E TERRENOS
create table if not exists public.patrimonio_imoveis (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null default 'Convento / Casa Religiosa',
  comunidade_obra text,
  cidade text not null,
  uf text not null default 'SC',
  endereco text,
  cep text,
  destinacao text,
  area_terreno_m2 numeric,
  area_construida_m2 numeric,
  inscricao_imobiliaria text,
  numero_matricula text,
  cartorio_registro text,
  tem_escritura boolean default true,
  tem_habite_se boolean default true,
  avcb_numero text,
  avcb_vencimento date,
  alvara_vencimento date,
  valor_venal numeric,
  valor_seguro numeric,
  status text not null default 'Ativo',
  observacoes text,
  foto_url text,
  documentos_anexos jsonb default '[]'::jsonb,
  anexos jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. TABELA DE VEÍCULOS E FROTA PROVINCIAL
create table if not exists public.patrimonio_veiculos (
  id uuid primary key default gen_random_uuid(),
  marca_modelo text not null,
  placa text not null,
  ano_fabricacao integer,
  ano_modelo integer,
  cor text,
  chassi text,
  renavam text,
  tipo text not null default 'Carro',
  comunidade_obra text not null,
  responsavel_nome text,
  combustivel text default 'Flex',
  quilometragem_atual integer default 0,
  proxima_revisao_km integer,
  proxima_revisao_data date,
  ipva_pago boolean default true,
  ipva_vencimento date,
  seguro_seguradora text,
  seguro_apolice text,
  seguro_vencimento date,
  seguro_franquia numeric,
  seguro_contato_emergencia text,
  crlv_url text,
  status text not null default 'Em Uso',
  observacoes text,
  foto_url text,
  anexos jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. TABELA DE INVENTÁRIO, BENS MÓVEIS E ARTE SACRA
create table if not exists public.patrimonio_bens (
  id uuid primary key default gen_random_uuid(),
  codigo_tombamento text not null,
  titulo text not null,
  categoria text not null,
  comunidade_obra text not null,
  localizacao_especifica text,
  estado_conservacao text not null default 'Bom',
  ano_aquisicao integer,
  valor_estimado numeric,
  tombamento_historico boolean default false,
  descricao_detalhada text,
  foto_url text,
  status text not null default 'Ativo',
  anexos jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. TABELA DE CONTRATOS, APÓLICES E SEGUROS
create table if not exists public.patrimonio_contratos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null,
  fornecedor_prestador text not null,
  cnpj_cpf text,
  contato_telefone text,
  contato_email text,
  imovel_vinculado text,
  data_inicio date not null,
  data_fim date not null,
  valor_mensal numeric,
  valor_anual numeric,
  arquivo_url text,
  status text not null default 'Vigente',
  alerta_renovacao_dias integer default 30,
  observacoes text,
  anexos jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. TABELA DE VISTORIAS E MANUTENÇÕES
create table if not exists public.patrimonio_manutencoes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null default 'Manutenção Preventiva',
  comunidade_obra text not null,
  imovel_nome text,
  data_solicitacao date not null default current_date,
  data_conclusao date,
  responsavel_vistoria text,
  prestador_executante text,
  custo_estimado numeric,
  custo_realizado numeric,
  prioridade text not null default 'Média',
  status text not null default 'Pendente',
  descricao text not null,
  laudo_observacoes text,
  fotos jsonb default '[]'::jsonb,
  anexos jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para performance
create index if not exists idx_pat_imoveis_cidade on public.patrimonio_imoveis(cidade);
create index if not exists idx_pat_imoveis_status on public.patrimonio_imoveis(status);
create index if not exists idx_pat_veiculos_placa on public.patrimonio_veiculos(placa);
create index if not exists idx_pat_veiculos_comunidade on public.patrimonio_veiculos(comunidade_obra);
create index if not exists idx_pat_bens_tombamento on public.patrimonio_bens(codigo_tombamento);
create index if not exists idx_pat_bens_categoria on public.patrimonio_bens(categoria);
create index if not exists idx_pat_contratos_fim on public.patrimonio_contratos(data_fim);
create index if not exists idx_pat_manut_status on public.patrimonio_manutencoes(status);

-- RLS (Row Level Security)
alter table public.patrimonio_imoveis enable row level security;
alter table public.patrimonio_veiculos enable row level security;
alter table public.patrimonio_bens enable row level security;
alter table public.patrimonio_contratos enable row level security;
alter table public.patrimonio_manutencoes enable row level security;

create policy "Permitir leitura de imoveis para todos" on public.patrimonio_imoveis for select using (true);
create policy "Permitir gerenciar imoveis para todos" on public.patrimonio_imoveis for all using (true) with check (true);

create policy "Permitir leitura de veiculos para todos" on public.patrimonio_veiculos for select using (true);
create policy "Permitir gerenciar veiculos para todos" on public.patrimonio_veiculos for all using (true) with check (true);

create policy "Permitir leitura de bens para todos" on public.patrimonio_bens for select using (true);
create policy "Permitir gerenciar bens para todos" on public.patrimonio_bens for all using (true) with check (true);

create policy "Permitir leitura de contratos para todos" on public.patrimonio_contratos for select using (true);
create policy "Permitir gerenciar contratos para todos" on public.patrimonio_contratos for all using (true) with check (true);

create policy "Permitir leitura de manutencoes para todos" on public.patrimonio_manutencoes for select using (true);
create policy "Permitir gerenciar manutencoes para todos" on public.patrimonio_manutencoes for all using (true) with check (true);
