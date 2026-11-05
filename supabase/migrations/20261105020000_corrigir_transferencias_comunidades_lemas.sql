-- Migração: Remover restrição de destino de transferências, padronizar comunidades e adicionar lemas
ALTER TABLE public.religiosos_designacoes 
  DROP CONSTRAINT IF EXISTS religiosos_designacoes_destino_check;

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

    UPDATE public.portal_perfis_religiosos p
    SET comunidade_atual_nome = r.comunidade_atual_nome,
        obra_atual_nome = r.obra_atual_nome
    FROM public.religiosos r
    WHERE (r.auth_user_id IS NOT NULL AND r.auth_user_id = p.auth_user_id)
       OR lower(trim(r.nome_civil)) = lower(trim(p.nome_civil));
  END IF;
END $$;

-- Procedure canônica resiliente para registro de transferências
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

  -- 2. Inserir nova designação com tolerância resiliente
  BEGIN
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
  EXCEPTION WHEN check_violation THEN
    -- Fallback se porventura a restrição legada XOR ainda existir no banco
    IF p_obra_id IS NOT NULL THEN
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
        NULL,
        p_obra_id,
        COALESCE(p_tipo_vinculo, 'pastoral'),
        p_funcao,
        p_vigencia_inicio,
        v_ano,
        p_numero_decreto,
        p_data_decreto,
        p_observacoes
      ) RETURNING id INTO v_designacao_id;
    ELSIF p_comunidade_id IS NOT NULL THEN
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
        NULL,
        COALESCE(p_tipo_vinculo, 'pastoral'),
        p_funcao,
        p_vigencia_inicio,
        v_ano,
        p_numero_decreto,
        p_data_decreto,
        p_observacoes
      ) RETURNING id INTO v_designacao_id;
    ELSE
      v_designacao_id := NULL;
    END IF;
  END;

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

  -- 5. Inserir histórico canônico permanente
  SELECT cidade INTO v_cidade_local FROM public.comunidades WHERE id = p_comunidade_id;
  IF v_cidade_local IS NULL AND p_obra_id IS NOT NULL THEN
    SELECT cidade INTO v_cidade_local FROM public.religiosos_obras_referencia WHERE id = p_obra_id;
  END IF;
  IF v_cidade_local IS NULL THEN
    v_cidade_local := 'Província BRM';
  END IF;

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
      WHEN p_obra_nome IS NOT NULL AND p_obra_nome <> p_comunidade_nome THEN p_comunidade_nome || ' • ' || p_obra_nome
      ELSE p_comunidade_nome
    END,
    p_funcao,
    v_cidade_local,
    'Província BRM',
    CASE 
      WHEN p_numero_decreto IS NOT NULL AND p_observacoes IS NOT NULL THEN 'Decreto ' || p_numero_decreto || ' - ' || p_observacoes
      WHEN p_numero_decreto IS NOT NULL THEN 'Decreto ' || p_numero_decreto
      ELSE p_observacoes
    END
  );

  RETURN v_designacao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.registrar_transferencia_canonica TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_transferencia_canonica TO anon;
