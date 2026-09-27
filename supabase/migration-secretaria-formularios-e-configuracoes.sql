-- =============================================================
-- SISTEMA BRM - PROVÍNCIA BRASIL MERIDIONAL
-- MIGRAÇÃO: SECRETARIA & ATOS - FORMULÁRIOS & CONFIGURAÇÕES
-- =============================================================

create extension if not exists pgcrypto;

-- 1. TABELA DE CONFIGURAÇÕES GERAIS DA SECRETARIA
create table if not exists public.secretaria_configuracoes (
  id uuid primary key default gen_random_uuid(),
  cabecalho_oficial jsonb not null default '{
    "congregacao": "CONGREGAÇÃO DOS PADRES DO SAGRADO CORAÇÃO DE JESUS",
    "provincia": "PROVÍNCIA BRASIL MERIDIONAL (SCJ)",
    "orgao": "SECRETARIA PROVINCIAL",
    "lema": "«COR JESU, IN TE CONFIDO • SINT UNUM»",
    "email_contato": "secretaria@brm.org.br",
    "telefone": "(41) 3244-1234",
    "endereco": "Rua Curitiba, 1000 - Batel, Curitiba - PR"
  }'::jsonb,
  prefixos_protocolo jsonb not null default '{
    "decretos": "Dec.",
    "portarias": "Prot.",
    "comunicados": "Circ.",
    "formularios": "Form.",
    "eventos": "Evt."
  }'::jsonb,
  proximo_numero_protocolo integer not null default 1,
  ano_vigente integer not null default 2026,
  notificacoes jsonb not null default '{
    "notificar_secretaria_ao_inscrever": true,
    "enviar_confirmacao_participante": true,
    "email_remetente": "secretaria@brm.org.br"
  }'::jsonb,
  updated_at timestamptz not null default now()
);

-- Inserir registro inicial se não existir
insert into public.secretaria_configuracoes (id, ano_vigente)
values ('00000000-0000-0000-0000-000000000001'::uuid, 2026)
on conflict (id) do nothing;

-- 2. TABELA DE MODELOS DE FORMULÁRIOS DINÂMICOS
create table if not exists public.secretaria_formularios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  tipo text not null default 'Inscrição em Evento' check (tipo in (
    'Inscrição em Evento',
    'Retiro / Encontro Provincial',
    'Atualização Cadastral Canônica',
    'Pesquisa Interna',
    'Solicitação / Protocolo Geral'
  )),
  campos jsonb not null default '[]'::jsonb, -- Array de variáveis selecionadas (estilo foto de referência)
  configuracoes jsonb not null default '{
    "exigir_autenticacao": false,
    "permitir_multiplas_respostas": false,
    "mensagem_sucesso": "Sua inscrição foi confirmada com sucesso pela Secretaria Provincial BRM."
  }'::jsonb,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. TABELA DE RESPOSTAS SUBMETIDAS
create table if not exists public.secretaria_respostas_formulario (
  id uuid primary key default gen_random_uuid(),
  formulario_id uuid not null references public.secretaria_formularios(id) on delete cascade,
  evento_id uuid references public.eventos_provinciais(id) on delete set null,
  religioso_id uuid references public.religiosos(id) on delete set null,
  usuario_nome text not null,
  usuario_email text not null,
  respostas jsonb not null default '{}'::jsonb,
  numero_protocolo text,
  status text not null default 'Confirmada' check (status in ('Confirmada', 'Em análise', 'Cancelada')),
  created_at timestamptz not null default now()
);

-- 4. ATUALIZAR TABELA DE EVENTOS PROVINCIAIS PARA SUPORTAR INSCRIÇÕES
alter table public.eventos_provinciais 
  add column if not exists exige_inscricao boolean not null default false,
  add column if not exists formulario_id uuid references public.secretaria_formularios(id) on delete set null,
  add column if not exists limite_vagas integer,
  add column if not exists prazo_inscricao date;

-- Índices de Performance
create index if not exists idx_sec_form_ativo on public.secretaria_formularios(ativo);
create index if not exists idx_sec_resp_form_id on public.secretaria_respostas_formulario(formulario_id);
create index if not exists idx_sec_resp_evento_id on public.secretaria_respostas_formulario(evento_id);
create index if not exists idx_evt_prov_inscricao on public.eventos_provinciais(exige_inscricao);

-- RLS
alter table public.secretaria_configuracoes enable row level security;
alter table public.secretaria_formularios enable row level security;
alter table public.secretaria_respostas_formulario enable row level security;

-- Políticas secretaria_configuracoes
create policy "Leitura pública de configurações da secretaria"
  on public.secretaria_configuracoes for select
  using (true);

create policy "Gerenciar configurações para autenticados"
  on public.secretaria_configuracoes for all
  using (true)
  with check (true);

-- Políticas secretaria_formularios
create policy "Leitura de formulários ativos"
  on public.secretaria_formularios for select
  using (ativo = true or auth.role() = 'authenticated');

create policy "Gerenciar formulários para autenticados"
  on public.secretaria_formularios for all
  using (true)
  with check (true);

-- Políticas secretaria_respostas_formulario
create policy "Inserção de respostas de formulários"
  on public.secretaria_respostas_formulario for insert
  with check (true);

create policy "Leitura de respostas de formulários"
  on public.secretaria_respostas_formulario for select
  using (true);

create policy "Gerenciar respostas para autenticados"
  on public.secretaria_respostas_formulario for all
  using (true)
  with check (true);

-- 5. SEED DE FORMULÁRIOS EXEMPLOS PADRÃO BRM
insert into public.secretaria_formularios (id, titulo, descricao, tipo, campos, ativo)
values 
(
  '11111111-1111-1111-1111-111111111101'::uuid,
  'Inscrição Padrão para Retiros e Assembleias 2026',
  'Formulário oficial para confrades e participantes dos encontros e retiros da Província BRM com acolhida e alimentação.',
  'Retiro / Encontro Provincial',
  '[
    {"id": "nome_completo", "label": "Nome Completo", "categoria": "Identificação", "obrigatorio": true, "tipo": "text"},
    {"id": "grau", "label": "Grau Eclesiástico", "categoria": "Identificação", "obrigatorio": true, "tipo": "select", "opcoes": ["Padre", "Diácono", "Frater", "Irmão", "Bispo", "Leigo(a)"]},
    {"id": "comunidade_atual", "label": "Comunidade / Residência Atual", "categoria": "Identificação", "obrigatorio": true, "tipo": "text"},
    {"id": "email", "label": "E-mail Principal", "categoria": "Contato", "obrigatorio": true, "tipo": "email"},
    {"id": "celular_whatsapp", "label": "Celular / WhatsApp", "categoria": "Contato", "obrigatorio": true, "tipo": "tel"},
    {"id": "precisa_hospedagem", "label": "Necessita de Hospedagem / Quarto?", "categoria": "Acolhida & Logística", "obrigatorio": true, "tipo": "boolean"},
    {"id": "previsao_chegada", "label": "Previsão de Chegada (Data e Turno)", "categoria": "Acolhida & Logística", "obrigatorio": false, "tipo": "text"},
    {"id": "previsao_saida", "label": "Previsão de Saída", "categoria": "Acolhida & Logística", "obrigatorio": false, "tipo": "text"},
    {"id": "transporte", "label": "Meio de Transporte", "categoria": "Acolhida & Logística", "obrigatorio": false, "tipo": "select", "opcoes": ["Carro próprio", "Ônibus", "Voo", "Carona"]},
    {"id": "restricao_alimentar", "label": "Possui Restrição Alimentar?", "categoria": "Saúde & Alimentação", "obrigatorio": false, "tipo": "select", "opcoes": ["Nenhuma", "Vegetariano", "Sem glúten (Celíaco)", "Sem lactose", "Diabético", "Outra"]},
    {"id": "especifique_restricao", "label": "Especifique a Restrição / Alergia", "categoria": "Saúde & Alimentação", "obrigatorio": false, "tipo": "text"},
    {"id": "observacoes", "label": "Observações ou Intenções de Oração", "categoria": "Específicos", "obrigatorio": false, "tipo": "textarea"}
  ]'::jsonb,
  true
),
(
  '22222222-2222-2222-2222-222222222202'::uuid,
  'Inscrição Rápida de Participação em Evento / Solenidade',
  'Ficha simplificada para controle de presença e crachás em celebrações, encontros e jubileus.',
  'Inscrição em Evento',
  '[
    {"id": "nome_completo", "label": "Nome Completo", "categoria": "Identificação", "obrigatorio": true, "tipo": "text"},
    {"id": "grau", "label": "Grau Eclesiástico", "categoria": "Identificação", "obrigatorio": true, "tipo": "select", "opcoes": ["Padre", "Diácono", "Frater", "Irmão", "Bispo", "Leigo(a)"]},
    {"id": "email", "label": "E-mail Principal", "categoria": "Contato", "obrigatorio": true, "tipo": "email"},
    {"id": "celular_whatsapp", "label": "Celular / WhatsApp", "categoria": "Contato", "obrigatorio": true, "tipo": "tel"},
    {"id": "comunidade_atual", "label": "Comunidade / Cidade de Origem", "categoria": "Identificação", "obrigatorio": false, "tipo": "text"},
    {"id": "participacao_almoco", "label": "Participará do Almoço Festivo?", "categoria": "Acolhida & Logística", "obrigatorio": false, "tipo": "boolean"},
    {"id": "observacoes", "label": "Observações", "categoria": "Específicos", "obrigatorio": false, "tipo": "textarea"}
  ]'::jsonb,
  true
)
on conflict (id) do nothing;
