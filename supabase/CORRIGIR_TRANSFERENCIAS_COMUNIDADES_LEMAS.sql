-- ==============================================================================
-- CORREÇÃO DEFINITIVA: TRANSFERÊNCIAS CANÔNICAS, COMUNIDADES & LEMAS (PROVÍNCIA BRM)
-- Execute este script no SQL Editor do Supabase para corrigir restrições e padronizar
-- ==============================================================================

BEGIN;

-- 1. REMOVER RESTRIÇÃO DE DESTINO EM TRANSFERÊNCIAS (Permite comunidade, obra, ambas ou flexível)
ALTER TABLE public.religiosos_designacoes 
  DROP CONSTRAINT IF EXISTS religiosos_designacoes_destino_check;

-- 2. PADRONIZAR NOMES EM PUBLIC.COMUNIDADES (Substituir 'Territorial' e 'Local' por 'Comunidade')
UPDATE public.comunidades 
SET nome = 'Comunidade Dehoniana de Rondônia'
WHERE nome ILIKE '%Territorial%Rondônia%' OR nome ILIKE '%Rondônia%Nossa Senhora de Nazaré%';

UPDATE public.comunidades 
SET nome = 'Comunidade Dehoniana do Rio Grande do Sul'
WHERE nome ILIKE '%Territorial%São Miguel%' OR nome ILIKE '%Territorial%Sao Miguel%';

UPDATE public.comunidades 
SET nome = regexp_replace(nome, '^Territorial\s+', 'Comunidade ', 'i')
WHERE nome ILIKE 'Territorial %';

UPDATE public.comunidades 
SET nome = regexp_replace(nome, '^Local\s+', 'Comunidade ', 'i')
WHERE nome ILIKE 'Local %';

-- 3. PADRONIZAR COMUNIDADES EM PUBLIC.RELIGIOSOS
UPDATE public.religiosos 
SET comunidade_atual_nome = 'Comunidade Dehoniana de Rondônia'
WHERE comunidade_atual_nome ILIKE '%Territorial%Rondônia%' OR comunidade_atual_nome ILIKE '%Rondônia%Nossa Senhora de Nazaré%';

UPDATE public.religiosos 
SET comunidade_atual_nome = 'Comunidade Dehoniana do Rio Grande do Sul'
WHERE comunidade_atual_nome ILIKE '%Territorial%São Miguel%' OR comunidade_atual_nome ILIKE '%Territorial%Sao Miguel%';

UPDATE public.religiosos 
SET comunidade_atual_nome = regexp_replace(comunidade_atual_nome, '^Territorial\s+', 'Comunidade ', 'i')
WHERE comunidade_atual_nome ILIKE 'Territorial %';

UPDATE public.religiosos 
SET comunidade_atual_nome = regexp_replace(comunidade_atual_nome, '^Local\s+', 'Comunidade ', 'i')
WHERE comunidade_atual_nome ILIKE 'Local %';

-- 4. ADICIONAR COLUNAS DE LEMAS VOCACIONAIS E MINISTERIAIS
ALTER TABLE public.religiosos 
  ADD COLUMN IF NOT EXISTS lemas JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS lema_destacado TEXT,
  ADD COLUMN IF NOT EXISTS lema_destacado_fase TEXT;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portal_perfis_religiosos') THEN
    ALTER TABLE public.portal_perfis_religiosos 
      ADD COLUMN IF NOT EXISTS lemas JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS lema_destacado TEXT,
      ADD COLUMN IF NOT EXISTS lema_destacado_fase TEXT,
      ADD COLUMN IF NOT EXISTS comunidade_atual_nome TEXT,
      ADD COLUMN IF NOT EXISTS obra_atual_nome TEXT;

    -- Sincronizar nomes de comunidade no portal
    UPDATE public.portal_perfis_religiosos p
    SET comunidade_atual_nome = r.comunidade_atual_nome,
        obra_atual_nome = r.obra_atual_nome
    FROM public.religiosos r
    WHERE (r.auth_user_id IS NOT NULL AND r.auth_user_id = p.auth_user_id)
       OR lower(trim(r.nome_civil)) = lower(trim(p.nome_civil));
  END IF;
END $$;

-- 5. PROCEDURE RESILIENTE PARA REGISTRO DE TRANSFERÊNCIAS CANÔNICAS
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

  -- 1. Encerrar designações vigentes anteriores se solicitado
  IF p_encerrar_anteriores THEN
    UPDATE public.religiosos_designacoes
    SET vigencia_fim = p_vigencia_inicio
    WHERE religioso_id = p_religioso_id
      AND (vigencia_fim IS NULL OR vigencia_fim > p_vigencia_inicio);

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

  -- 3. Atualizar public.religiosos (Elenco e Dossiê)
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

  -- 5. Registrar no histórico canônico de comunidades
  SELECT COALESCE(c.cidade, ro.cidade, 'Província BRM')
  INTO v_cidade_local
  FROM public.religiosos r
  LEFT JOIN public.comunidades c ON c.id = p_comunidade_id
  LEFT JOIN public.religiosos_obras_referencia ro ON ro.id = p_obra_id
  WHERE r.id = p_religioso_id
  LIMIT 1;

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
    CASE 
      WHEN p_obra_nome IS NOT NULL AND p_obra_nome <> '' AND p_obra_nome <> p_comunidade_nome 
        THEN p_comunidade_nome || ' • ' || p_obra_nome
      ELSE p_comunidade_nome
    END,
    p_funcao,
    COALESCE(v_cidade_local, 'Província BRM'),
    'Província BRM',
    CASE 
      WHEN p_numero_decreto IS NOT NULL AND trim(p_numero_decreto) <> '' 
        THEN 'Decreto ' || trim(p_numero_decreto) || COALESCE(' - ' || trim(p_observacoes), '')
      ELSE trim(p_observacoes)
    END
  );

  RETURN v_designacao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
