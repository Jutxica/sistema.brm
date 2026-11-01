-- ==============================================================================
-- MÓDULO DE TRANSFERÊNCIAS CANÔNICAS E CATÁLOGO DE FUNÇÕES DA PROVÍNCIA BRM
-- ==============================================================================

BEGIN;

-- 1. Tabela de Funções Canônicas Pré-cadastradas e Gerenciáveis
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

-- Inserir as 12 Funções Canônicas Oficiais da Província BRM
INSERT INTO public.religiosos_funcoes_catalogo (nome, categoria, ordem)
VALUES
  ('Superior Provincial', 'Governo Provincial', 1),
  ('Secretário Provincial', 'Governo Provincial', 2),
  ('Ecônomo Provincial', 'Governo Provincial', 3),
  ('Pároco', 'Pastoral', 4),
  ('Pároco-Reitor', 'Pastoral', 5),
  ('Reitor', 'Formação', 6),
  ('Vigário', 'Pastoral', 7),
  ('Formador', 'Formação', 8),
  ('Ecônomo', 'Administração', 9),
  ('Tirocinante', 'Formação', 10),
  ('Configuração', 'Formação', 11),
  ('Missão', 'Missão', 12)
ON CONFLICT (nome) DO UPDATE 
SET ativo = TRUE, categoria = EXCLUDED.categoria, ordem = EXCLUDED.ordem;

-- 2. Garantir colunas adicionais em religiosos_designacoes
ALTER TABLE public.religiosos_designacoes ADD COLUMN IF NOT EXISTS numero_decreto TEXT;
ALTER TABLE public.religiosos_designacoes ADD COLUMN IF NOT EXISTS data_decreto DATE;
ALTER TABLE public.religiosos_designacoes ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- 3. Procedure Canônica de Registro de Transferência
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

    -- Atualizar também histórico de comunidades
    UPDATE public.religiosos_historico_comunidades
    SET periodo_fim = p_vigencia_inicio::TEXT
    WHERE religioso_id = p_religioso_id
      AND (periodo_fim IS NULL OR periodo_fim = '' OR periodo_fim = 'Atual');
  END IF;

  -- 2. Inserir nova designação
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

  -- 3. Atualizar diretamente a tabela de religiosos (Elenco)
  UPDATE public.religiosos
  SET comunidade_atual_id = p_comunidade_id,
      comunidade_atual_nome = p_comunidade_nome,
      obra_atual_id = p_obra_id,
      obra_atual_nome = p_obra_nome
  WHERE id = p_religioso_id;

  -- 4. Atualizar portal_perfis_religiosos se existir
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
