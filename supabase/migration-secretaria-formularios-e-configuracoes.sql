-- =============================================================
-- SISTEMA BRM - PROVÍNCIA BRASIL MERIDIONAL (SCJ)
-- MIGRAÇÃO AUTÔNOMA: SECRETARIA, FORMULÁRIOS & AGENDA PROVINCIAL
-- =============================================================
-- Este script é 100% autônomo e idempotente. Pode ser executado
-- em qualquer banco Supabase (novo ou existente) sem gerar erros 42P01.

create extension if not exists pgcrypto;

-- -------------------------------------------------------------
-- 1. TABELA DE EVENTOS PROVINCIAIS (AGENDA CANÔNICA)
-- -------------------------------------------------------------
create table if not exists public.eventos_provinciais (
  id text primary key default ('evt-' || substr(gen_random_uuid()::text, 1, 8)),
  titulo text not null,
  tipo text not null,
  data_inicio date not null,
  data_fim date,
  horario text,
  local text not null,
  cidade text,
  uf text,
  descricao text,
  publico_alvo text default 'Toda a Província',
  status text not null default 'Confirmado',
  exige_inscricao boolean not null default false,
  formulario_id text,
  limite_vagas integer,
  prazo_inscricao date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Garantir colunas caso a tabela já existisse previamente
alter table public.eventos_provinciais add column if not exists exige_inscricao boolean not null default false;
alter table public.eventos_provinciais add column if not exists formulario_id text;
alter table public.eventos_provinciais add column if not exists limite_vagas integer;
alter table public.eventos_provinciais add column if not exists prazo_inscricao date;

create index if not exists idx_eventos_prov_data on public.eventos_provinciais(data_inicio asc);
create index if not exists idx_eventos_prov_tipo on public.eventos_provinciais(tipo);
create index if not exists idx_eventos_prov_inscricao on public.eventos_provinciais(exige_inscricao);

alter table public.eventos_provinciais enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'eventos_provinciais' and policyname = 'Permitir leitura de eventos para todos') then
    create policy "Permitir leitura de eventos para todos" on public.eventos_provinciais for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'eventos_provinciais' and policyname = 'Permitir gerenciar eventos para todos') then
    create policy "Permitir gerenciar eventos para todos" on public.eventos_provinciais for all using (true) with check (true);
  end if;
end $$;

-- -------------------------------------------------------------
-- 2. TABELA DE DOCUMENTOS PROVINCIAIS OFICIAIS
-- -------------------------------------------------------------
create table if not exists public.documentos_provinciais (
  id text primary key default ('doc-' || substr(gen_random_uuid()::text, 1, 8)),
  titulo text not null,
  categoria text not null,
  subtitulo text,
  numero_referencia text,
  data_documento date not null default current_date,
  arquivo_nome text not null,
  arquivo_url text not null,
  arquivo_path text,
  arquivo_tamanho_bytes bigint,
  mime_type text default 'application/pdf',
  descricao text,
  publicado_por text default 'Secretaria Provincial',
  status text not null default 'Ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_doc_prov_categoria on public.documentos_provinciais(categoria);
create index if not exists idx_doc_prov_status on public.documentos_provinciais(status);
create index if not exists idx_doc_prov_data on public.documentos_provinciais(data_documento desc);

alter table public.documentos_provinciais enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'documentos_provinciais' and policyname = 'Permitir leitura de documentos para todos') then
    create policy "Permitir leitura de documentos para todos" on public.documentos_provinciais for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'documentos_provinciais' and policyname = 'Permitir gerenciar documentos para todos') then
    create policy "Permitir gerenciar documentos para todos" on public.documentos_provinciais for all using (true) with check (true);
  end if;
end $$;

-- -------------------------------------------------------------
-- 3. TABELA DE CONFIGURAÇÕES GERAIS DA SECRETARIA & ATOS
-- -------------------------------------------------------------
create table if not exists public.secretaria_configuracoes (
  id text primary key default 'default-secretaria-cfg',
  prefixo_decretos text not null default 'DEC-BRM',
  numero_atual_decretos integer not null default 14,
  prefixo_portarias text not null default 'PORT-BRM',
  numero_atual_portarias integer not null default 8,
  prefixo_circulares text not null default 'CIRC-BRM',
  numero_atual_circulares integer not null default 5,
  prefixo_formularios text not null default 'FORM-BRM',
  numero_atual_formularios integer not null default 3,
  cabecalho_institucional text not null default 'CONGREGAÇÃO DOS PADRES DO SAGRADO CORAÇÃO DE JESUS',
  subtitulo_provincia text not null default 'PROVÍNCIA BRASIL MERIDIONAL (SCJ) • CURIA PROVINCIAL',
  orgao_emissor text not null default 'SECRETARIA PROVINCIAL & ATOS CANÔNICOS',
  lema_oficial text not null default '«COR JESU, IN TE CONFIDO • SINT UNUM»',
  email_secretaria text not null default 'secretaria@brm.org.br',
  telefone_secretaria text not null default '(41) 3342-1200',
  notificar_confrade_email boolean not null default true,
  notificar_secretario_nova_resposta boolean not null default true,
  exibir_marca_dagua boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.secretaria_configuracoes enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'secretaria_configuracoes' and policyname = 'Permitir leitura de configurações para todos') then
    create policy "Permitir leitura de configurações para todos" on public.secretaria_configuracoes for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'secretaria_configuracoes' and policyname = 'Permitir gerenciar configurações para todos') then
    create policy "Permitir gerenciar configurações para todos" on public.secretaria_configuracoes for all using (true) with check (true);
  end if;
end $$;

-- Inserir registro inicial de configuração
insert into public.secretaria_configuracoes (
  id, prefixo_decretos, numero_atual_decretos, prefixo_portarias, numero_atual_portarias,
  prefixo_circulares, numero_atual_circulares, prefixo_formularios, numero_atual_formularios,
  cabecalho_institucional, subtitulo_provincia, orgao_emissor, lema_oficial,
  email_secretaria, telefone_secretaria, notificar_confrade_email,
  notificar_secretario_nova_resposta, exibir_marca_dagua
) values (
  'default-secretaria-cfg', 'DEC-BRM', 14, 'PORT-BRM', 8,
  'CIRC-BRM', 5, 'FORM-BRM', 3,
  'CONGREGAÇÃO DOS PADRES DO SAGRADO CORAÇÃO DE JESUS',
  'PROVÍNCIA BRASIL MERIDIONAL (SCJ) • CURIA PROVINCIAL',
  'SECRETARIA PROVINCIAL & ATOS CANÔNICOS',
  '«COR JESU, IN TE CONFIDO • SINT UNUM»',
  'secretaria@brm.org.br', '(41) 3342-1200', true, true, true
)
on conflict (id) do update set updated_at = now();

-- -------------------------------------------------------------
-- 4. TABELA DE FORMULÁRIOS DINÂMICOS DA SECRETARIA
-- -------------------------------------------------------------
create table if not exists public.secretaria_formularios (
  id text primary key default ('form-' || substr(gen_random_uuid()::text, 1, 8)),
  codigo text not null default 'FORM-2026/001',
  titulo text not null,
  descricao text,
  evento_id text,
  campos jsonb not null default '[]'::jsonb,
  ativo boolean not null default true,
  limite_vagas integer,
  prazo_encerramento text,
  mensagem_sucesso text,
  total_respostas integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sec_form_ativo on public.secretaria_formularios(ativo);
create index if not exists idx_sec_form_codigo on public.secretaria_formularios(codigo);

alter table public.secretaria_formularios enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'secretaria_formularios' and policyname = 'Permitir leitura de formulários para todos') then
    create policy "Permitir leitura de formulários para todos" on public.secretaria_formularios for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'secretaria_formularios' and policyname = 'Permitir gerenciar formulários para todos') then
    create policy "Permitir gerenciar formulários para todos" on public.secretaria_formularios for all using (true) with check (true);
  end if;
end $$;

-- -------------------------------------------------------------
-- 5. TABELA DE RESPOSTAS / INSCRIÇÕES DOS RELIGIOSOS
-- -------------------------------------------------------------
create table if not exists public.secretaria_respostas_formulario (
  id text primary key default ('resp-' || substr(gen_random_uuid()::text, 1, 8)),
  formulario_id text not null,
  evento_id text,
  dados jsonb not null default '{}'::jsonb,
  protocolo text not null,
  status text not null default 'Confirmada',
  created_at timestamptz not null default now()
);

create index if not exists idx_sec_resp_form on public.secretaria_respostas_formulario(formulario_id);
create index if not exists idx_sec_resp_evt on public.secretaria_respostas_formulario(evento_id);
create index if not exists idx_sec_resp_prot on public.secretaria_respostas_formulario(protocolo);

alter table public.secretaria_respostas_formulario enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'secretaria_respostas_formulario' and policyname = 'Permitir leitura de respostas para todos') then
    create policy "Permitir leitura de respostas para todos" on public.secretaria_respostas_formulario for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'secretaria_respostas_formulario' and policyname = 'Permitir inserir respostas para todos') then
    create policy "Permitir inserir respostas para todos" on public.secretaria_respostas_formulario for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'secretaria_respostas_formulario' and policyname = 'Permitir gerenciar respostas para todos') then
    create policy "Permitir gerenciar respostas para todos" on public.secretaria_respostas_formulario for all using (true) with check (true);
  end if;
end $$;

-- -------------------------------------------------------------
-- 6. CARGA INICIAL DE EVENTOS (COM INSCRIÇÃO HABILITADA)
-- -------------------------------------------------------------
insert into public.eventos_provinciais (
  id, titulo, tipo, data_inicio, data_fim, horario, local, cidade, uf,
  descricao, publico_alvo, status, exige_inscricao, formulario_id, limite_vagas, prazo_inscricao
) values
  (
    'evt-1',
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
    'Confirmado',
    true,
    'form-retiro-presbiteros-2026',
    60,
    '2026-03-05'
  ),
  (
    'evt-2',
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
    'Confirmado',
    false,
    null,
    null,
    null
  ),
  (
    'evt-3',
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
    'Confirmado',
    true,
    'form-encontro-fratres-2026',
    30,
    '2026-05-10'
  ),
  (
    'evt-4',
    'Solenidade do Sagrado Coração de Jesus (Festa Patronal SCJ)',
    'Celebração / Solenidade',
    '2026-06-19',
    null,
    '19:00',
    'Todas as Comunidades da Província',
    'Curitiba',
    'PR',
    'Festa titular da Congregação com renovação comunitária dos votos e adoração reparadora.',
    'Toda a Província',
    'Confirmado',
    false,
    null,
    null,
    null
  ),
  (
    'evt-5',
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
    'Confirmado',
    false,
    null,
    null,
    null
  ),
  (
    'evt-6',
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
    'Confirmado',
    true,
    'form-assembleia-provincial-2026',
    120,
    '2026-09-20'
  )
on conflict (id) do nothing;

-- -------------------------------------------------------------
-- 7. CARGA INICIAL DE FORMULÁRIOS DA SECRETARIA
-- -------------------------------------------------------------
insert into public.secretaria_formularios (
  id, codigo, titulo, descricao, evento_id, campos, ativo, limite_vagas, prazo_encerramento, mensagem_sucesso, total_respostas
) values
  (
    'form-retiro-presbiteros-2026',
    'FORM-2026/001',
    'Inscrição para o Retiro Provincial dos Presbíteros 2026 (Turma I)',
    'Formulário canônico de inscrição para hospedagem, paramentação e logística do Retiro Anual na Casa Padre Dehon (Brusque/SC).',
    'evt-1',
    '[
      {"id": "nome_completo", "label": "Nome Civil Completo", "categoria": "Identificação", "obrigatorio": true, "tipo": "text"},
      {"id": "nome_religioso", "label": "Nome Religioso / Tratamento", "categoria": "Identificação", "obrigatorio": true, "tipo": "text"},
      {"id": "grau_ordem", "label": "Grau / Vínculo Canônico", "categoria": "Identificação", "obrigatorio": false, "tipo": "select", "opcoes": ["Padre (Presbítero)", "Diácono", "Frater", "Irmão", "Bispo"]},
      {"id": "comunidade_atual", "label": "Comunidade Atual / Residência", "categoria": "Identificação", "obrigatorio": true, "tipo": "text"},
      {"id": "email", "label": "E-mail Principal", "categoria": "Contato", "obrigatorio": true, "tipo": "email"},
      {"id": "telefone_whatsapp", "label": "Telefone / WhatsApp", "categoria": "Contato", "obrigatorio": true, "tipo": "tel"},
      {"id": "necessita_hospedagem", "label": "Necessita de Hospedagem / Quarto?", "categoria": "Acolhida & Hospedagem", "obrigatorio": true, "tipo": "select", "opcoes": ["Sim", "Não"]},
      {"id": "tipo_quarto", "label": "Tipo de Acomodação Desejada", "categoria": "Acolhida & Hospedagem", "obrigatorio": false, "tipo": "select", "opcoes": ["Individual", "Duplo", "Térreo / Acessível"]},
      {"id": "data_chegada", "label": "Data e Horário Previsto de Chegada", "categoria": "Acolhida & Hospedagem", "obrigatorio": false, "tipo": "text"},
      {"id": "data_saida", "label": "Data e Horário Previsto de Saída", "categoria": "Acolhida & Hospedagem", "obrigatorio": false, "tipo": "text"},
      {"id": "meio_transporte", "label": "Meio de Transporte Utilizado", "categoria": "Acolhida & Hospedagem", "obrigatorio": false, "tipo": "select", "opcoes": ["Carro próprio", "Ônibus rodoviário", "Voo comercial", "Carona com confrade"]},
      {"id": "restricao_alimentar", "label": "Restrição Alimentar ou Alergia", "categoria": "Saúde & Alimentação", "obrigatorio": false, "tipo": "text"},
      {"id": "tamanho_paramento", "label": "Tamanho de Paramento / Túnica", "categoria": "Liturgia & Geral", "obrigatorio": false, "tipo": "select", "opcoes": ["P", "M", "G", "GG", "Sob medida"]},
      {"id": "observacoes_gerais", "label": "Observações Finais / Mensagem", "categoria": "Liturgia & Geral", "obrigatorio": false, "tipo": "textarea"}
    ]'::jsonb,
    true,
    60,
    '2026-03-05',
    'Inscrição recebida pela Secretaria Provincial. A hospedaria já foi comunicada de sua chegada.',
    2
  ),
  (
    'form-assembleia-provincial-2026',
    'FORM-2026/002',
    'Confirmação de Presença na Assembleia Provincial Ordinária 2026',
    'Confirmação obrigatória de participação com definição de transporte e alojamento no Seminário São José (Rio Negrinho/SC).',
    'evt-6',
    '[
      {"id": "nome_completo", "label": "Nome Civil Completo", "categoria": "Identificação", "obrigatorio": true, "tipo": "text"},
      {"id": "nome_religioso", "label": "Nome Religioso / Tratamento", "categoria": "Identificação", "obrigatorio": true, "tipo": "text"},
      {"id": "grau_ordem", "label": "Grau / Vínculo Canônico", "categoria": "Identificação", "obrigatorio": false, "tipo": "select", "opcoes": ["Padre (Presbítero)", "Diácono", "Frater", "Irmão", "Bispo"]},
      {"id": "comunidade_atual", "label": "Comunidade Atual / Residência", "categoria": "Identificação", "obrigatorio": true, "tipo": "text"},
      {"id": "cargo_funcao", "label": "Cargo ou Ofício Atual", "categoria": "Identificação", "obrigatorio": false, "tipo": "text"},
      {"id": "email", "label": "E-mail Principal", "categoria": "Contato", "obrigatorio": true, "tipo": "email"},
      {"id": "telefone_whatsapp", "label": "Telefone / WhatsApp", "categoria": "Contato", "obrigatorio": true, "tipo": "tel"},
      {"id": "necessita_hospedagem", "label": "Necessita de Hospedagem / Quarto?", "categoria": "Acolhida & Hospedagem", "obrigatorio": false, "tipo": "select", "opcoes": ["Sim", "Não"]},
      {"id": "tipo_quarto", "label": "Tipo de Acomodação Desejada", "categoria": "Acolhida & Hospedagem", "obrigatorio": false, "tipo": "select", "opcoes": ["Individual", "Duplo", "Térreo / Acessível"]},
      {"id": "meio_transporte", "label": "Meio de Transporte Utilizado", "categoria": "Acolhida & Hospedagem", "obrigatorio": false, "tipo": "select", "opcoes": ["Carro próprio", "Ônibus rodoviário", "Voo comercial", "Carona com confrade"]},
      {"id": "restricao_alimentar", "label": "Restrição Alimentar ou Alergia", "categoria": "Saúde & Alimentação", "obrigatorio": false, "tipo": "text"},
      {"id": "necessidade_acessibilidade", "label": "Necessidade de Acessibilidade / Apoio Locomoção", "categoria": "Saúde & Alimentação", "obrigatorio": false, "tipo": "text"},
      {"id": "disponibilidade_servico", "label": "Disponibilidade para Serviços Litúrgicos", "categoria": "Liturgia & Geral", "obrigatorio": false, "tipo": "select", "opcoes": ["Canto / Animação", "Leituras / Salmo", "Serviço do Altar", "Acolhida e Credenciamento", "O que for necessário"]},
      {"id": "observacoes_gerais", "label": "Observações Finais / Mensagem", "categoria": "Liturgia & Geral", "obrigatorio": false, "tipo": "textarea"}
    ]'::jsonb,
    true,
    120,
    '2026-09-20',
    'Sua confirmação para a Assembleia Provincial 2026 foi registrada na Secretaria dos Atos.',
    0
  ),
  (
    'form-encontro-fratres-2026',
    'FORM-2026/003',
    'Ficha de Inscrição - Encontro dos Fratres da Configuração',
    'Encontro provincial de formação e partilha fraterna no Seminário Sagrado Coração de Jesus (Corupá/SC).',
    'evt-3',
    '[
      {"id": "nome_completo", "label": "Nome Civil Completo", "categoria": "Identificação", "obrigatorio": true, "tipo": "text"},
      {"id": "nome_religioso", "label": "Nome Religioso / Tratamento", "categoria": "Identificação", "obrigatorio": true, "tipo": "text"},
      {"id": "comunidade_atual", "label": "Comunidade Atual / Residência", "categoria": "Identificação", "obrigatorio": true, "tipo": "text"},
      {"id": "email", "label": "E-mail Principal", "categoria": "Contato", "obrigatorio": true, "tipo": "email"},
      {"id": "telefone_whatsapp", "label": "Telefone / WhatsApp", "categoria": "Contato", "obrigatorio": true, "tipo": "tel"},
      {"id": "data_chegada", "label": "Data e Horário Previsto de Chegada", "categoria": "Acolhida & Hospedagem", "obrigatorio": false, "tipo": "text"},
      {"id": "meio_transporte", "label": "Meio de Transporte Utilizado", "categoria": "Acolhida & Hospedagem", "obrigatorio": false, "tipo": "select", "opcoes": ["Carro próprio", "Ônibus rodoviário", "Voo comercial", "Carona com confrade"]},
      {"id": "restricao_alimentar", "label": "Restrição Alimentar ou Alergia", "categoria": "Saúde & Alimentação", "obrigatorio": false, "tipo": "text"}
    ]'::jsonb,
    true,
    30,
    '2026-05-10',
    'Inscrição confirmada para o Encontro de Fratres da Província BRM.',
    0
  )
on conflict (id) do nothing;

-- -------------------------------------------------------------
-- 8. CARGA INICIAL DE RESPOSTAS EXEMPLO
-- -------------------------------------------------------------
insert into public.secretaria_respostas_formulario (
  id, formulario_id, evento_id, dados, protocolo, status, created_at
) values
  (
    'resp-01',
    'form-retiro-presbiteros-2026',
    'evt-1',
    '{
      "nome_completo": "Pe. Carlos Eduardo da Silva, SCJ",
      "nome_religioso": "Pe. Carlos Eduardo",
      "grau_ordem": "Padre (Presbítero)",
      "comunidade_atual": "Sede Provincial BRM, Curitiba/PR",
      "email": "carlos.eduardo@dehonianos.org.br",
      "telefone_whatsapp": "(41) 99882-1144",
      "necessita_hospedagem": "Sim",
      "tipo_quarto": "Individual",
      "data_chegada": "14/03/2026 às 07:30",
      "meio_transporte": "Carro próprio",
      "tamanho_paramento": "M"
    }'::jsonb,
    'FORM-2026-8812',
    'Confirmada',
    '2026-02-10T11:20:00Z'
  ),
  (
    'resp-02',
    'form-retiro-presbiteros-2026',
    'evt-1',
    '{
      "nome_completo": "Pe. Lucas Mariano Pereira, SCJ",
      "nome_religioso": "Pe. Lucas",
      "grau_ordem": "Padre (Presbítero)",
      "comunidade_atual": "Paróquia São Sebastião, Joinville/SC",
      "email": "lucas.mariano@dehonianos.org.br",
      "telefone_whatsapp": "(47) 99123-4567",
      "necessita_hospedagem": "Sim",
      "tipo_quarto": "Individual",
      "meio_transporte": "Carona com confrade",
      "tamanho_paramento": "G"
    }'::jsonb,
    'FORM-2026-9043',
    'Confirmada',
    '2026-02-12T16:45:00Z'
  )
on conflict (id) do nothing;
