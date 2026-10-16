create extension if not exists pgcrypto;

create table if not exists public.comunidades (
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
  pais text default 'Brasil',
  telefone text,
  email text,
  status text not null default 'Ativa' check (status in ('Ativa', 'Inativa')),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.obras (
  id uuid primary key default gen_random_uuid(),
  comunidade_id uuid references public.comunidades(id) on delete set null,
  nome text not null,
  tipo text not null default 'Outro',
  permite_hospedagem boolean not null default false,
  cnpj text,
  responsavel_id uuid,
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
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.religiosos (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  comunidade_atual_id uuid references public.comunidades(id) on delete set null,
  obra_atual_id uuid references public.obras(id) on delete set null,
  origem_cadastro text not null default 'admin' check (origem_cadastro in ('admin', 'publico')),
  status_cadastro text not null default 'Em revisão' check (status_cadastro in ('Em revisão', 'Aprovado', 'Arquivado')),
  grau text not null default 'Padre',
  nome_religioso text,
  nome_civil text not null,
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
  email_institucional text,
  email_pessoal text,
  telefone_celular text,
  telefone text,
  whatsapp text,
  redes_sociais jsonb not null default '[]'::jsonb,
  familia jsonb not null default '{}'::jsonb,
  sacramentos jsonb not null default '{}'::jsonb,
  historico_vocacional jsonb not null default '[]'::jsonb,
  etapas_formacao jsonb not null default '{}'::jsonb,
  ministerios_ordens jsonb not null default '{}'::jsonb,
  formacao_academica jsonb not null default '[]'::jsonb,
  idiomas jsonb not null default '[]'::jsonb,
  competencias jsonb not null default '[]'::jsonb,
  historico_comunidades jsonb not null default '[]'::jsonb,
  missoes_servicos jsonb not null default '[]'::jsonb,
  saude jsonb not null default '{}'::jsonb,
  documentos jsonb not null default '[]'::jsonb,
  observacoes text,
  consentimento_dados boolean not null default false,
  status text not null default 'Ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.comunidades
  add constraint comunidades_superior_id_fkey
  foreign key (superior_id) references public.religiosos(id) on delete set null;

alter table public.obras
  add constraint obras_responsavel_id_fkey
  foreign key (responsavel_id) references public.religiosos(id) on delete set null;

create index if not exists idx_comunidades_status on public.comunidades(status);
create index if not exists idx_obras_comunidade_id on public.obras(comunidade_id);
create index if not exists idx_obras_status on public.obras(status);
create index if not exists idx_religiosos_nome_civil on public.religiosos(nome_civil);
create index if not exists idx_religiosos_comunidade_atual_id on public.religiosos(comunidade_atual_id);
create index if not exists idx_religiosos_obra_atual_id on public.religiosos(obra_atual_id);
create index if not exists idx_religiosos_status_cadastro on public.religiosos(status_cadastro);

alter table public.comunidades enable row level security;
alter table public.obras enable row level security;
alter table public.religiosos enable row level security;

drop policy if exists "Administradores autenticados gerenciam comunidades" on public.comunidades;
create policy "Administradores autenticados gerenciam comunidades"
on public.comunidades
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Visitantes visualizam obras ativas" on public.obras;
create policy "Visitantes visualizam obras ativas"
on public.obras
for select
to anon
using (status = 'Ativa');

drop policy if exists "Administradores autenticados gerenciam obras" on public.obras;
create policy "Administradores autenticados gerenciam obras"
on public.obras
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Visitantes enviam cadastro de religioso" on public.religiosos;
create policy "Visitantes enviam cadastro de religioso"
on public.religiosos
for insert
to anon
with check (origem_cadastro = 'publico' and status_cadastro = 'Em revisão');

drop policy if exists "Administradores autenticados gerenciam religiosos" on public.religiosos;
create policy "Administradores autenticados gerenciam religiosos"
on public.religiosos
for all
to authenticated
using (true)
with check (true);
