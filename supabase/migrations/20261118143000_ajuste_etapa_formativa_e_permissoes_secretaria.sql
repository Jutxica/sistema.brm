-- ==============================================================================
-- MIGRAÇÃO / SCRIPT SQL: AJUSTE DE ETAPAS FORMATIVAS & FLEXIBILIZAÇÃO DA SECRETARIA
-- Província BRM - Padres do Sagrado Coração de Jesus
-- ==============================================================================

-- 1. Assegurar colunas e constraints na tabela public.religiosos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'religiosos' AND column_name = 'etapa_formativa_atual'
  ) THEN
    ALTER TABLE public.religiosos ADD COLUMN etapa_formativa_atual TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'religiosos' AND column_name = 'ano_configuracao'
  ) THEN
    ALTER TABLE public.religiosos ADD COLUMN ano_configuracao INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'religiosos' AND column_name = 'ano_referencia_etapa'
  ) THEN
    ALTER TABLE public.religiosos ADD COLUMN ano_referencia_etapa INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);
  END IF;
END $$;

-- 2. Atualizar ou remover constraints restritivas antigas se houver
ALTER TABLE public.religiosos DROP CONSTRAINT IF EXISTS religiosos_etapa_formativa_atual_check;
ALTER TABLE public.religiosos DROP CONSTRAINT IF EXISTS religiosos_ano_configuracao_check;

ALTER TABLE public.religiosos ADD CONSTRAINT religiosos_etapa_formativa_atual_check
  CHECK (etapa_formativa_atual IN ('Configuração (Teologia)', 'Tirocínio') OR etapa_formativa_atual IS NULL);

ALTER TABLE public.religiosos ADD CONSTRAINT religiosos_ano_configuracao_check
  CHECK (ano_configuracao BETWEEN 1 AND 4 OR ano_configuracao IS NULL);

-- 3. Espelhar na tabela de perfis do portal
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portal_perfis_religiosos') THEN
    ALTER TABLE public.portal_perfis_religiosos
      ADD COLUMN IF NOT EXISTS etapa_formativa_atual TEXT,
      ADD COLUMN IF NOT EXISTS ano_configuracao INTEGER,
      ADD COLUMN IF NOT EXISTS ano_referencia_etapa INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);
  END IF;
END $$;

-- 4. CONSULTA DE AUDITORIA: Visualizar todos os Fratres e Diáconos e suas etapas atuais
-- (Execute esta consulta no SQL Editor do Supabase para conferir os dados atuais)
-- SELECT id, nome_civil, nome_religioso, grau, etapa_formativa_atual, ano_configuracao, comunidade_atual_nome
-- FROM public.religiosos
-- WHERE grau ILIKE '%frater%' OR grau ILIKE '%diác%' OR grau ILIKE '%diac%'
-- ORDER BY nome_civil;

-- 5. TEMPLATES DE AJUSTE DIRETO CASO O SECRETÁRIO PREFIRA RODAR NO SUPABASE:
--
-- Para colocar um religioso no 1º Ano de Teologia:
-- UPDATE public.religiosos
-- SET etapa_formativa_atual = 'Configuração (Teologia)', ano_configuracao = 1, ano_referencia_etapa = 2026
-- WHERE nome_civil ILIKE '%Nome do Frater%';
--
-- Para colocar um religioso no 2º Ano de Teologia:
-- UPDATE public.religiosos
-- SET etapa_formativa_atual = 'Configuração (Teologia)', ano_configuracao = 2, ano_referencia_etapa = 2026
-- WHERE nome_civil ILIKE '%Nome do Frater%';
--
-- Para colocar um religioso no 3º Ano de Teologia:
-- UPDATE public.religiosos
-- SET etapa_formativa_atual = 'Configuração (Teologia)', ano_configuracao = 3, ano_referencia_etapa = 2026
-- WHERE nome_civil ILIKE '%Nome do Frater%';
--
-- Para colocar um religioso no 4º Ano de Teologia:
-- UPDATE public.religiosos
-- SET etapa_formativa_atual = 'Configuração (Teologia)', ano_configuracao = 4, ano_referencia_etapa = 2026
-- WHERE nome_civil ILIKE '%Nome do Frater%';
--
-- Para colocar um religioso no Tirocínio pastoral:
-- UPDATE public.religiosos
-- SET etapa_formativa_atual = 'Tirocínio', ano_configuracao = NULL, ano_referencia_etapa = 2026
-- WHERE nome_civil ILIKE '%Nome do Tirocinante%';
