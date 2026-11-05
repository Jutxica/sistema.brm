-- ==============================================================================
-- MIGRAÇÃO: Adicionar Etapa Formativa Atual e Ano da Configuração (Teologia)
-- Data: 2026-11-05
-- Motivo: Identificar com precisão se os Fratres e Diáconos estão em Tirocínio
--         ou na Configuração (1º, 2º, 3º ou 4º ano de Teologia no Conventinho/exterior).
-- ==============================================================================

-- 1. ADICIONAR COLUNAS NA TABELA public.religiosos
ALTER TABLE public.religiosos
  ADD COLUMN IF NOT EXISTS etapa_formativa_atual TEXT
    CHECK (etapa_formativa_atual IN ('Configuração (Teologia)', 'Tirocínio') OR etapa_formativa_atual IS NULL),
  ADD COLUMN IF NOT EXISTS ano_configuracao INTEGER
    CHECK (ano_configuracao BETWEEN 1 AND 4 OR ano_configuracao IS NULL),
  ADD COLUMN IF NOT EXISTS ano_referencia_etapa INTEGER
    DEFAULT 2026;

-- 2. ADICIONAR COLUNAS NO PERFIL DO PORTAL (SE A TABELA EXISTIR)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portal_perfis_religiosos') THEN
    ALTER TABLE public.portal_perfis_religiosos
      ADD COLUMN IF NOT EXISTS etapa_formativa_atual TEXT,
      ADD COLUMN IF NOT EXISTS ano_configuracao INTEGER,
      ADD COLUMN IF NOT EXISTS ano_referencia_etapa INTEGER DEFAULT 2026;
  END IF;
END $$;

-- 3. PRÉ-PREENCHIMENTO INTELIGENTE PARA OS RELIGIOSOS JÁ CADASTRADOS (BASE 2026)
-- Fratres e Diáconos residentes no Conventinho SCJ (Taubaté) -> Configuração (Teologia)
UPDATE public.religiosos
SET
  etapa_formativa_atual = 'Configuração (Teologia)',
  ano_referencia_etapa = 2026,
  ano_configuracao = CASE
    -- Exemplo Fr. Djonatan Engelmann: Teologia 2025 a 2028 -> em 2026 está no 2º ano
    WHEN lower(trim(nome_civil)) ILIKE '%djonatan%engelmann%' THEN 2
    ELSE COALESCE(ano_configuracao, 2)
  END
WHERE (lower(grau) LIKE '%frater%' OR lower(grau) LIKE '%diác%' OR lower(grau) LIKE '%diac%')
  AND (
    comunidade_atual_nome ILIKE '%Conventinho%'
    OR obra_atual_nome ILIKE '%Conventinho%'
    OR comunidade_atual_nome ILIKE '%Taubaté%'
  );

-- Fratres residentes fora do Conventinho (Paróquias, Casas de Missão, etc.) -> Tirocínio
UPDATE public.religiosos
SET
  etapa_formativa_atual = 'Tirocínio',
  ano_referencia_etapa = 2026,
  ano_configuracao = NULL
WHERE lower(grau) LIKE '%frater%'
  AND NOT (
    comunidade_atual_nome ILIKE '%Conventinho%'
    OR obra_atual_nome ILIKE '%Conventinho%'
    OR comunidade_atual_nome ILIKE '%Taubaté%'
  )
  AND etapa_formativa_atual IS NULL;

-- 4. COMENTÁRIOS EXPLICATIVOS
COMMENT ON COLUMN public.religiosos.etapa_formativa_atual IS 'Etapa formativa vigente para Fratres e Diáconos: Configuração (Teologia) ou Tirocínio.';
COMMENT ON COLUMN public.religiosos.ano_configuracao IS 'Ano de Teologia cursado na Configuração: 1º, 2º, 3º ou 4º ano.';
COMMENT ON COLUMN public.religiosos.ano_referencia_etapa IS 'Ano civil letivo de referência para a etapa formativa (ex: 2026).';
