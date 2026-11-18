-- ==============================================================================
-- SISTEMA BRM • ATUALIZAÇÃO CONSOLIDADA: MÓDULO DE TRANSFERÊNCIAS E DECRETOS
-- Script idempotente (pode ser executado com segurança no Supabase SQL Editor)
-- ==============================================================================

BEGIN;

-- 1. TABELA DE CATÁLOGO DE FUNÇÕES CANÔNICAS
CREATE TABLE IF NOT EXISTS public.religiosos_funcoes_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  categoria TEXT DEFAULT 'Pastoral',
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.religiosos_funcoes_catalogo ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS funcoes_catalogo_select_policy ON public.religiosos_funcoes_catalogo;
CREATE POLICY funcoes_catalogo_select_policy ON public.religiosos_funcoes_catalogo
  FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS funcoes_catalogo_all_policy ON public.religiosos_funcoes_catalogo;
CREATE POLICY funcoes_catalogo_all_policy ON public.religiosos_funcoes_catalogo
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Carga inicial das Funções Canônicas Oficiais da Província BRM
INSERT INTO public.religiosos_funcoes_catalogo (nome, categoria, ordem)
VALUES
  ('Superior Provincial', 'Governo Provincial', 1),
  ('Secretário Provincial', 'Governo Provincial', 2),
  ('Ecônomo Provincial', 'Governo Provincial', 3),
  ('Conselheiro Provincial', 'Governo Provincial', 4),
  ('Pároco', 'Pastoral', 5),
  ('Pároco-Reitor', 'Pastoral', 6),
  ('Vigário Paroquial', 'Pastoral', 7),
  ('Reitor de Santuário', 'Pastoral', 8),
  ('Reitor de Seminário', 'Formação', 9),
  ('Formador', 'Formação', 10),
  ('Promotor Vocacional', 'Formação', 11),
  ('Estudante (Teologia)', 'Formação', 12),
  ('Tirocinante', 'Formação', 13),
  ('Ecônomo Local', 'Administração', 14),
  ('Vigário da Casa', 'Administração', 15),
  ('Capelão', 'Pastoral', 16),
  ('Em Missão Ad Gentes', 'Missão', 17)
ON CONFLICT (nome) DO UPDATE 
SET ativo = TRUE, categoria = EXCLUDED.categoria, ordem = EXCLUDED.ordem;


-- 2. TABELA DE DESIGNAÇÕES CANÔNICAS (Garantir colunas de Decreto e Vigência)
CREATE TABLE IF NOT EXISTS public.religiosos_designacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  religioso_id UUID NOT NULL REFERENCES public.religiosos(id) ON DELETE CASCADE,
  comunidade_id UUID REFERENCES public.comunidades(id) ON DELETE SET NULL,
  obra_id UUID REFERENCES public.religiosos_obras_referencia(id) ON DELETE SET NULL,
  tipo_vinculo TEXT DEFAULT 'pastoral',
  funcao TEXT NOT NULL,
  vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  vigencia_fim DATE,
  ano_referencia INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  numero_decreto TEXT,
  data_decreto DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Garantir colunas caso a tabela já existisse
ALTER TABLE public.religiosos_designacoes ADD COLUMN IF NOT EXISTS numero_decreto TEXT;
ALTER TABLE public.religiosos_designacoes ADD COLUMN IF NOT EXISTS data_decreto DATE;
ALTER TABLE public.religiosos_designacoes ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Remover qualquer restrição legada XOR que impedia vincular comunidade E obra simultaneamente
ALTER TABLE public.religiosos_designacoes DROP CONSTRAINT IF EXISTS religiosos_designacoes_destino_check;
ALTER TABLE public.religiosos_designacoes ADD CONSTRAINT religiosos_designacoes_destino_check
  CHECK (comunidade_id IS NOT NULL OR obra_id IS NOT NULL);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_religiosos_designacoes_rel ON public.religiosos_designacoes(religioso_id);
CREATE INDEX IF NOT EXISTS idx_religiosos_designacoes_vig ON public.religiosos_designacoes(vigencia_inicio, vigencia_fim);


-- 3. TABELA DE HISTÓRICO CANÔNICO DE COMUNIDADES (Currículo canônico permanente)
CREATE TABLE IF NOT EXISTS public.religiosos_historico_comunidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  religioso_id UUID NOT NULL REFERENCES public.religiosos(id) ON DELETE CASCADE,
  periodo_inicio TEXT,
  periodo_fim TEXT,
  instituicao TEXT NOT NULL,
  funcao TEXT,
  cidade TEXT,
  local TEXT DEFAULT 'Província BRM',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_religiosos_hist_com_rel ON public.religiosos_historico_comunidades(religioso_id);


-- 4. GARANTIR COLUNAS EM RELIGIOSOS E PORTAL
ALTER TABLE public.religiosos ADD COLUMN IF NOT EXISTS comunidade_atual_id UUID REFERENCES public.comunidades(id) ON DELETE SET NULL;
ALTER TABLE public.religiosos ADD COLUMN IF NOT EXISTS comunidade_atual_nome TEXT;
ALTER TABLE public.religiosos ADD COLUMN IF NOT EXISTS obra_atual_id UUID;
ALTER TABLE public.religiosos ADD COLUMN IF NOT EXISTS obra_atual_nome TEXT;
ALTER TABLE public.religiosos ADD COLUMN IF NOT EXISTS etapa_formativa_atual TEXT;
ALTER TABLE public.religiosos ADD COLUMN IF NOT EXISTS ano_configuracao INTEGER;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portal_perfis_religiosos') THEN
    ALTER TABLE public.portal_perfis_religiosos 
      ADD COLUMN IF NOT EXISTS comunidade_atual_nome TEXT,
      ADD COLUMN IF NOT EXISTS obra_atual_nome TEXT;
  END IF;
END $$;


-- 5. FUNCTION RPC: REGISTRAR TRANSFERÊNCIA CANÔNICA (Individual ou Lote)
CREATE OR REPLACE FUNCTION public.registrar_transferencia_canonica(
  p_religioso_id UUID,
  p_comunidade_id UUID,
  p_comunidade_nome TEXT,
  p_obra_id UUID,
  p_obra_nome TEXT,
  p_tipo_vinculo TEXT,
  p_funcao TEXT,
  p_vigencia_inicio DATE,
  p_numero_decreto TEXT DEFAULT NULL,
  p_data_decreto DATE DEFAULT NULL,
  p_encerrar_anteriores BOOLEAN DEFAULT TRUE,
  p_observacoes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_designacao_id UUID;
  v_ano INTEGER;
  v_cidade_local TEXT;
BEGIN
  IF p_religioso_id IS NULL THEN
    RAISE EXCEPTION 'O religioso é obrigatório para registrar a transferência.';
  END IF;

  IF p_vigencia_inicio IS NULL THEN
    p_vigencia_inicio := CURRENT_DATE;
  END IF;

  v_ano := EXTRACT(YEAR FROM p_vigencia_inicio);

  -- 1. Se solicitado, encerrar designações vigentes anteriores
  IF p_encerrar_anteriores THEN
    UPDATE public.religiosos_designacoes
    SET vigencia_fim = p_vigencia_inicio
    WHERE religioso_id = p_religioso_id
      AND (vigencia_fim IS NULL OR vigencia_fim > p_vigencia_inicio);

    -- Atualizar também histórico de comunidades anterior
    UPDATE public.religiosos_historico_comunidades
    SET periodo_fim = p_vigencia_inicio::TEXT
    WHERE religioso_id = p_religioso_id
      AND (periodo_fim IS NULL OR periodo_fim = '' OR periodo_fim = 'Atual');
  END IF;

  -- 2. Inserir nova designação canônica
  INSERT INTO public.religiosos_designacoes (
    religioso_id,
    comunidade_id,
    obra_id,
    tipo_vinculo,
    funcao,
    vigencia_inicio,
    ano_referencia,
    numero_decreto,
    data_decreto,
    observacoes
  ) VALUES (
    p_religioso_id,
    p_comunidade_id,
    p_obra_id,
    COALESCE(p_tipo_vinculo, 'pastoral'),
    p_funcao,
    p_vigencia_inicio,
    v_ano,
    p_numero_decreto,
    p_data_decreto,
    p_observacoes
  ) RETURNING id INTO v_designacao_id;

  -- 3. Atualizar diretamente a tabela mestre de religiosos (Elenco)
  UPDATE public.religiosos
  SET comunidade_atual_id = p_comunidade_id,
      comunidade_atual_nome = p_comunidade_nome,
      obra_atual_id = p_obra_id,
      obra_atual_nome = p_obra_nome
  WHERE id = p_religioso_id;

  -- Se for Frater, auto-deduzir a etapa
  UPDATE public.religiosos
  SET etapa_formativa_atual = CASE 
    WHEN lower(p_comunidade_nome) LIKE '%conventinho%' THEN 'Configuração (Teologia)'
    ELSE 'Tirocínio'
  END
  WHERE id = p_religioso_id AND grau = 'Frater';

  -- 4. Atualizar portal_perfis_religiosos se a tabela existir
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portal_perfis_religiosos') THEN
    UPDATE public.portal_perfis_religiosos p
    SET comunidade_atual_nome = p_comunidade_nome,
        obra_atual_nome = p_obra_nome
    FROM public.religiosos r
    WHERE r.id = p_religioso_id
      AND ((r.auth_user_id IS NOT NULL AND r.auth_user_id = p.auth_user_id)
        OR lower(trim(r.nome_civil)) = lower(trim(p.nome_civil)));
  END IF;

  -- 5. Registrar no histórico canônico de comunidades permanente
  SELECT COALESCE(c.cidade, o.cidade, o.localidade, 'Província BRM')
  INTO v_cidade_local
  FROM public.religiosos r
  LEFT JOIN public.comunidades c ON c.id = p_comunidade_id
  LEFT JOIN public.religiosos_obras_referencia o ON o.id = p_obra_id
  WHERE r.id = p_religioso_id;

  INSERT INTO public.religiosos_historico_comunidades (
    religioso_id,
    periodo_inicio,
    periodo_fim,
    instituicao,
    funcao,
    cidade,
    local,
    observacoes
  ) VALUES (
    p_religioso_id,
    p_vigencia_inicio::TEXT,
    NULL,
    COALESCE(p_obra_nome, p_comunidade_nome, 'Província BRM'),
    p_funcao,
    v_cidade_local,
    'Província BRM',
    CASE 
      WHEN p_numero_decreto IS NOT NULL AND p_observacoes IS NOT NULL THEN p_numero_decreto || ' - ' || p_observacoes
      WHEN p_numero_decreto IS NOT NULL THEN 'Decreto: ' || p_numero_decreto
      ELSE p_observacoes
    END
  );

  RETURN v_designacao_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;
