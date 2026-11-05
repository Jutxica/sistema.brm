-- ==============================================================================
-- PADRONIZAÇÃO DO SUFIXO CONGREGACIONAL PARA MAIÚSCULO: ", SCJ"
-- Província Brasileira Meridional (SCJ)
-- ==============================================================================

BEGIN;

-- 1. Atualizar função de atribuição canônica com sufixo maiúsculo ", SCJ"
CREATE OR REPLACE FUNCTION public.atribuir_nome_religioso(p_grau text, p_nome_civil text)
RETURNS text AS $$
DECLARE
  v_clean text;
  v_grau_lower text;
  v_prefix text;
BEGIN
  v_clean := public.limpar_nome_civil_religioso(p_nome_civil);
  IF v_clean = '' THEN
    RETURN null;
  END IF;

  v_grau_lower := lower(trim(coalesce(p_grau, '')));

  IF v_grau_lower LIKE '%frater%' THEN
    v_prefix := 'Fr.';
  ELSIF v_grau_lower LIKE '%bispo%' OR v_grau_lower LIKE '%dom%' THEN
    v_prefix := 'Dom';
  ELSIF v_grau_lower LIKE '%diác%' OR v_grau_lower LIKE '%diac%' THEN
    v_prefix := 'Diác.';
  ELSIF v_grau_lower LIKE '%irmã%' OR v_grau_lower LIKE '%irma%' THEN
    v_prefix := 'Ir.';
  ELSE
    v_prefix := 'P.'; -- Padre / Presbítero
  END IF;

  RETURN v_prefix || ' ' || v_clean || ', SCJ';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Atualizar registros existentes em public.religiosos
UPDATE public.religiosos
SET nome_religioso = regexp_replace(nome_religioso, '(?i),\s*scj$', ', SCJ'),
    nome_elenco = regexp_replace(nome_elenco, '(?i),\s*scj$', ', SCJ')
WHERE nome_religioso ILIKE '%, scj' OR nome_elenco ILIKE '%, scj';

UPDATE public.religiosos
SET nome_religioso = public.atribuir_nome_religioso(grau, nome_civil),
    nome_elenco = public.atribuir_nome_religioso(grau, nome_civil)
WHERE (nome_religioso IS NULL OR nome_religioso NOT LIKE '%, SCJ')
  AND nome_civil IS NOT NULL AND trim(nome_civil) <> '';

-- 3. Atualizar registros existentes em public.portal_perfis_religiosos se existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portal_perfis_religiosos') THEN
    UPDATE public.portal_perfis_religiosos
    SET nome_religioso = regexp_replace(nome_religioso, '(?i),\s*scj$', ', SCJ')
    WHERE nome_religioso ILIKE '%, scj';

    UPDATE public.portal_perfis_religiosos
    SET nome_religioso = public.atribuir_nome_religioso(grau, nome_civil)
    WHERE (nome_religioso IS NULL OR nome_religioso NOT LIKE '%, SCJ')
      AND nome_civil IS NOT NULL AND trim(nome_civil) <> '';
  END IF;
END $$;

COMMIT;
