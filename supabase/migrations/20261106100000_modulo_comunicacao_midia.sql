-- ==============================================================================
-- MÓDULO DE COMUNICAÇÃO, GESTÃO DE REDES SOCIAIS E MÍDIA DA PROVÍNCIA BRM
-- ==============================================================================

BEGIN;

-- 1. Tabela de Pautas e Ideias (Banco de Pautas)
CREATE TABLE IF NOT EXISTS public.comunicacao_pautas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  area TEXT NOT NULL DEFAULT 'Institucional', -- 'Institucional', 'Vocacional', 'Paróquias', 'Formação', 'Espiritualidade', 'Obras Sociais'
  formato TEXT NOT NULL DEFAULT 'Carrossel', -- 'Carrossel', 'Reels', 'Post', 'Site', 'Vídeo Longo', 'Story'
  status TEXT NOT NULL DEFAULT 'ideia', -- 'ideia', 'em_producao', 'aprovacao', 'aprovado', 'programado', 'postado', 'arquivado'
  prioridade TEXT DEFAULT 'media', -- 'baixa', 'media', 'alta', 'urgente'
  data_prevista TIMESTAMPTZ,
  canais TEXT[] DEFAULT ARRAY['Instagram'],
  responsavel_texto_id UUID,
  responsavel_texto_nome TEXT,
  responsavel_arte_id UUID,
  responsavel_arte_nome TEXT,
  criado_por_nome TEXT,
  origem_data_comemorativa TEXT, -- ex: 'Aniversário Pe. X', 'Dia de Finados'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Posts & Conteúdos (Produção, Aprovação e Programação)
CREATE TABLE IF NOT EXISTS public.comunicacao_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pauta_id UUID REFERENCES public.comunicacao_pautas(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  legenda TEXT,
  hashtags TEXT,
  area TEXT NOT NULL DEFAULT 'Institucional',
  formato TEXT NOT NULL DEFAULT 'Carrossel',
  canais TEXT[] DEFAULT ARRAY['Instagram'],
  status TEXT NOT NULL DEFAULT 'em_producao', -- 'em_producao', 'aprovacao', 'aprovado', 'programado', 'postado'
  arquivos_arte JSONB DEFAULT '[]'::jsonb, -- array de { id, url, nome, tipo, ordem, psd_url, svg_url }
  arte_entregue BOOLEAN DEFAULT false,
  texto_entregue BOOLEAN DEFAULT false,
  data_cronograma TIMESTAMPTZ,
  horario_agendado TEXT,
  melhor_horario_sugerido TEXT,
  aprovado_por_nome TEXT,
  aprovado_em TIMESTAMPTZ,
  ordem_feed INTEGER,
  estatisticas JSONB DEFAULT '{}'::jsonb, -- { curtidas, comentarios, alcance, visualizacoes }
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Comentários de Revisão e Ajustes (Aprovação)
CREATE TABLE IF NOT EXISTS public.comunicacao_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.comunicacao_posts(id) ON DELETE CASCADE,
  autor_nome TEXT NOT NULL,
  escopo TEXT NOT NULL DEFAULT 'post_todo', -- 'post_todo' ou 'slide_1', 'slide_2', etc.
  slide_numero INTEGER,
  mensagem TEXT NOT NULL,
  resolvido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Tarefas e Anotações (Geral e Checklists Individuais)
CREATE TABLE IF NOT EXISTS public.comunicacao_tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  concluida BOOLEAN DEFAULT false,
  tipo TEXT NOT NULL DEFAULT 'fazer', -- 'fazer', 'ideia', 'anotacao'
  responsavel_nome TEXT, -- 'Talita', 'Kath', 'Pe. Diretor', 'Designer'
  data_limite DATE,
  pauta_id UUID REFERENCES public.comunicacao_pautas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabela de Captações (Gravações e Entrevistas com Religiosos)
CREATE TABLE IF NOT EXISTS public.comunicacao_captacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  entrevistado_nome TEXT NOT NULL,
  religioso_id UUID REFERENCES public.religiosos(id) ON DELETE SET NULL,
  data_gravacao TIMESTAMPTZ NOT NULL,
  duracao TEXT DEFAULT '1h',
  local TEXT DEFAULT 'Sala de Reuniões / Cúria',
  area TEXT DEFAULT 'Institucional',
  situacao TEXT DEFAULT 'agendada', -- 'agendada', 'gravada', 'cancelada'
  roteiro TEXT,
  checklist_equipamentos JSONB DEFAULT '[
    {"item": "Microfone sem fio com baterias", "checado": false},
    {"item": "Câmera principal com bateria extra", "checado": false},
    {"item": "Cartão de memória limpo", "checado": false},
    {"item": "Iluminação / Softbox posicionada", "checado": false},
    {"item": "Tripé nivelado", "checado": false},
    {"item": "Roteiro / Teleprompter revisado", "checado": false}
  ]'::jsonb,
  conteudos_previstos JSONB DEFAULT '[]'::jsonb,
  participantes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabela de Diretório de E-mails e Contatos da Equipe
CREATE TABLE IF NOT EXISTS public.comunicacao_emails_equipe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  cargo TEXT NOT NULL,
  telefone TEXT,
  papel TEXT DEFAULT 'operador', -- 'coordenador', 'operador', 'externo'
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Tabela de Estúdio de Arte & Brand Hub
CREATE TABLE IF NOT EXISTS public.comunicacao_brand_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL, -- 'cor', 'tipografia', 'logo', 'template', 'textura'
  nome TEXT NOT NULL,
  valor TEXT NOT NULL, -- Hex code, URL do arquivo, nome da fonte
  categoria TEXT,
  descricao TEXT,
  arquivo_url TEXT,
  psd_ou_vetor_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Tabela de Benchmarking e Inspirações
CREATE TABLE IF NOT EXISTS public.comunicacao_benchmarking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_nome TEXT NOT NULL,
  perfil_handle TEXT,
  canal TEXT DEFAULT 'Instagram',
  url TEXT,
  pontos_fortes TEXT,
  ideias_inspiracao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Tabela de Métricas e Performance
CREATE TABLE IF NOT EXISTS public.comunicacao_metricas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canal TEXT NOT NULL DEFAULT 'Instagram',
  data_referencia DATE NOT NULL DEFAULT CURRENT_DATE,
  seguidores_total INTEGER DEFAULT 0,
  seguidores_novos INTEGER DEFAULT 0,
  seguidores_deixaram INTEGER DEFAULT 0,
  contas_alcancadas INTEGER DEFAULT 0,
  alcance_variacao_pct NUMERIC(5,2) DEFAULT 0,
  engajamento_pct NUMERIC(5,2) DEFAULT 0,
  interacoes_total INTEGER DEFAULT 0,
  visualizacoes_total INTEGER DEFAULT 0,
  posts_por_horario JSONB DEFAULT '{
    "06h-09h": {"media": 2051, "total": 7},
    "09h-12h": {"media": 2462, "total": 7},
    "12h-15h": {"media": 1277, "total": 28},
    "15h-18h": {"media": 2494, "total": 17},
    "18h-21h": {"media": 2150, "total": 6},
    "21h-00h": {"media": 0, "total": 0}
  }'::jsonb,
  dias_mais_ativos JSONB DEFAULT '{
    "Domingo": 0,
    "Segunda": 12,
    "Terça": 13,
    "Quarta": 15,
    "Quinta": 13,
    "Sexta": 11,
    "Sábado": 1
  }'::jsonb,
  horarios_pico_meta JSONB DEFAULT '[
    {"dia": "Domingo", "horario": "21:00", "descricao": "pico de seguidores ativos na semana"},
    {"dia": "Quarta", "horario": "17:00", "descricao": "pico de seguidores ativos na semana"},
    {"dia": "Domingo", "horario": "13:00", "descricao": "pico de seguidores ativos na semana"}
  ]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.comunicacao_pautas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicacao_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicacao_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicacao_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicacao_captacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicacao_emails_equipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicacao_brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicacao_benchmarking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicacao_metricas ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS permissivas para usuários autenticados
CREATE POLICY comunicacao_pautas_policy ON public.comunicacao_pautas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY comunicacao_posts_policy ON public.comunicacao_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY comunicacao_comentarios_policy ON public.comunicacao_comentarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY comunicacao_tarefas_policy ON public.comunicacao_tarefas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY comunicacao_captacoes_policy ON public.comunicacao_captacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY comunicacao_emails_equipe_policy ON public.comunicacao_emails_equipe FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY comunicacao_brand_assets_policy ON public.comunicacao_brand_assets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY comunicacao_benchmarking_policy ON public.comunicacao_benchmarking FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY comunicacao_metricas_policy ON public.comunicacao_metricas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Dados Iniciais: Cores e Identidade BRM no Brand Hub
INSERT INTO public.comunicacao_brand_assets (tipo, nome, valor, categoria, descricao)
VALUES
  ('cor', 'Azul Primário BRM', '#226380', 'Paleta Oficial', 'Cor principal institucional para títulos e botões'),
  ('cor', 'Azul Escuro Institucional', '#113240', 'Paleta Oficial', 'Usado para cabeçalhos solenes e tipografia de contraste'),
  ('cor', 'Dourado Dehoniano', '#d4af37', 'Paleta Secundária', 'Destaque e comemorações de jubileus'),
  ('cor', 'Branco Puro', '#ffffff', 'Neutros', 'Fundo de leitura e cartões'),
  ('cor', 'Cinza Claro Fundo', '#f4f6f5', 'Neutros', 'Fundo padrão do sistema BRM'),
  ('cor', 'Vermelho Sagrado Coração', '#9b1b1b', 'Liturgia', 'Cor litúrgica dehoniana para dias festivos')
ON CONFLICT DO NOTHING;

-- Dados Iniciais: Exemplo de E-mails da Equipe
INSERT INTO public.comunicacao_emails_equipe (nome, email, cargo, papel)
VALUES
  ('Coordenação de Comunicação', 'comunicacao@dehonianosbrm.org.br', 'Coordenador Provincial', 'coordenador'),
  ('Produção de Conteúdo e Redes', 'social@dehonianosbrm.org.br', 'Jornalista / Social Media', 'operador'),
  ('Design & Direção de Arte', 'arte@dehonianosbrm.org.br', 'Designer Gráfico', 'externo')
ON CONFLICT DO NOTHING;

-- Dados Iniciais: Métrica Inicial
INSERT INTO public.comunicacao_metricas (canal, seguidores_total, seguidores_novos, seguidores_deixaram, contas_alcancadas, alcance_variacao_pct, engajamento_pct, interacoes_total, visualizacoes_total)
VALUES ('Instagram', 12450, 142, 18, 48500, 24.5, 8.4, 3890, 84200)
ON CONFLICT DO NOTHING;

COMMIT;
