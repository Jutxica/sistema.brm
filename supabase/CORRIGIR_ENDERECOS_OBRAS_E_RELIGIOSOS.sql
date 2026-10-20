-- ==============================================================================
-- MIGRATION: CORREÇÃO DE ENDEREÇOS (OBRAS E RELIGIOSOS), ORIGEM VOCACIONAL E CAMPOS CIDADE/LOCAL
-- Província Brasil Meridional (BRM)
-- ==============================================================================

-- 1. Adicionar campo 'cidade' nas tabelas canônicas e de trajetória
ALTER TABLE public.religiosos_origem_vocacional
  ADD COLUMN IF NOT EXISTS cidade TEXT;

ALTER TABLE public.religiosos_profissoes_votos
  ADD COLUMN IF NOT EXISTS cidade TEXT;

ALTER TABLE public.religiosos_historico_vocacional
  ADD COLUMN IF NOT EXISTS cidade TEXT;

ALTER TABLE public.religiosos_ministerios_ordens
  ADD COLUMN IF NOT EXISTS cidade TEXT;

ALTER TABLE public.religiosos_historico_comunidades
  ADD COLUMN IF NOT EXISTS cidade TEXT;

ALTER TABLE public.religiosos_missoes_servicos
  ADD COLUMN IF NOT EXISTS cidade TEXT;

-- 2. Separar e normalizar endereços nas obras de referência (religiosos_obras_referencia)
-- Onde antes tudo ficava no campo 'endereco' em formato composto:
-- Exemplo: "R. Padre Dehon, 728 - Hauer | Curitiba-PR, 81630-090"
UPDATE public.religiosos_obras_referencia
SET
  logradouro = CASE
    WHEN (logradouro IS NULL OR logradouro = '' OR logradouro LIKE '%|%') AND endereco LIKE '%,%' THEN
      trim(split_part(split_part(endereco, '|', 1), ',', 1))
    WHEN (logradouro IS NULL OR logradouro = '' OR logradouro LIKE '%|%') AND endereco IS NOT NULL THEN
      trim(split_part(endereco, '|', 1))
    ELSE logradouro
  END,
  numero = CASE
    WHEN (numero IS NULL OR numero = '') AND endereco LIKE '%,%' THEN
      trim(split_part(replace(split_part(split_part(endereco, '|', 1), ',', 2), '–', '-'), '-', 1))
    ELSE numero
  END,
  bairro = CASE
    WHEN (bairro IS NULL OR bairro = '') AND endereco LIKE '%-%' AND split_part(endereco, '|', 1) LIKE '%-%' THEN
      trim(split_part(replace(split_part(endereco, '|', 1), '–', '-'), '-', 2))
    WHEN (bairro IS NULL OR bairro = '') AND endereco LIKE '%,%,%' THEN
      trim(split_part(split_part(endereco, '|', 1), ',', 3))
    ELSE bairro
  END,
  cidade = CASE
    WHEN (cidade IS NULL OR cidade = '') AND endereco LIKE '%|%' THEN
      trim(split_part(split_part(split_part(endereco, '|', 2), '-', 1), ',', 1))
    ELSE coalesce(cidade, localidade)
  END,
  uf = CASE
    WHEN (uf IS NULL OR uf = '') AND endereco LIKE '%|%' THEN
      substring(split_part(endereco, '|', 2) from '([A-Za-z]{2})')
    ELSE coalesce(uf, estado)
  END,
  estado = CASE
    WHEN (estado IS NULL OR estado = '') AND endereco LIKE '%|%' THEN
      substring(split_part(endereco, '|', 2) from '([A-Za-z]{2})')
    ELSE coalesce(estado, uf)
  END,
  cep = CASE
    WHEN (cep IS NULL OR cep = '') AND endereco ~ '[0-9]{5}-[0-9]{3}' THEN
      substring(endereco from '([0-9]{5}-[0-9]{3})')
    ELSE cep
  END
WHERE endereco IS NOT NULL;

-- 3. Corrigir registros já cadastrados na tabela religiosos_enderecos_contatos
-- onde o endereço composto havia sido gravado inteiro na coluna 'logradouro'
UPDATE public.religiosos_enderecos_contatos
SET
  numero = CASE
    WHEN logradouro LIKE '%,%' AND (numero IS NULL OR numero = '') THEN
      trim(split_part(replace(split_part(split_part(logradouro, '|', 1), ',', 2), '–', '-'), '-', 1))
    ELSE numero
  END,
  bairro = CASE
    WHEN logradouro LIKE '%-%' AND split_part(logradouro, '|', 1) LIKE '%-%' AND (bairro IS NULL OR bairro = '') THEN
      trim(split_part(replace(split_part(logradouro, '|', 1), '–', '-'), '-', 2))
    WHEN logradouro LIKE '%,%,%' AND (bairro IS NULL OR bairro = '') THEN
      trim(split_part(split_part(logradouro, '|', 1), ',', 3))
    ELSE bairro
  END,
  cidade = CASE
    WHEN logradouro LIKE '%|%' AND (cidade IS NULL OR cidade = '') THEN
      trim(split_part(split_part(split_part(logradouro, '|', 2), '-', 1), ',', 1))
    ELSE cidade
  END,
  estado = CASE
    WHEN logradouro LIKE '%|%' AND (estado IS NULL OR estado = '') THEN
      substring(split_part(logradouro, '|', 2) from '([A-Za-z]{2})')
    ELSE estado
  END,
  cep = CASE
    WHEN logradouro ~ '[0-9]{5}-[0-9]{3}' AND (cep IS NULL OR cep = '') THEN
      substring(logradouro from '([0-9]{5}-[0-9]{3})')
    ELSE cep
  END,
  logradouro = CASE
    WHEN logradouro LIKE '%,%' THEN trim(split_part(split_part(logradouro, '|', 1), ',', 1))
    WHEN logradouro LIKE '%|%' THEN trim(split_part(logradouro, '|', 1))
    ELSE logradouro
  END
WHERE logradouro LIKE '%|%';

-- 4. Atualizar a RPC salvar_ficha_religioso para persistir 'cidade' e 'local'
CREATE OR REPLACE FUNCTION public.salvar_ficha_religioso(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_religioso_id UUID;
  v_user_id UUID;
  v_is_staff BOOLEAN := false;
  v_base JSONB;
  v_item JSONB;
BEGIN
  v_user_id := auth.uid();
  v_base := p_payload->'base';

  IF v_user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = v_user_id AND status = 'Ativo'
        AND nivel_acesso IN ('Administrador', 'Secretaria', 'Governo', 'TI')
    ) INTO v_is_staff;
  END IF;

  IF p_payload ? 'religioso_id' AND p_payload->>'religioso_id' IS NOT NULL AND p_payload->>'religioso_id' <> '' THEN
    v_religioso_id := (p_payload->>'religioso_id')::UUID;
  END IF;

  -- 1. Base do Religioso
  IF v_religioso_id IS NULL THEN
    INSERT INTO public.religiosos (
      grau, nome_civil, nome_religioso, data_nascimento,
      cpf, rg, rg_orgao_expedidor, rg_data_emissao,
      titulo_eleitor, pis, cnh, cnh_categoria, passaporte,
      pais_nascimento, nacionalidade, estado_nascimento, municipio_nascimento,
      email_institucional, email_pessoal, telefone_celular, whatsapp,
      comunidade_atual_nome, status_cadastro, status
    ) VALUES (
      COALESCE(v_base->>'grau', 'Padre'),
      v_base->>'nome_civil',
      v_base->>'nome_religioso',
      NULLIF(v_base->>'data_nascimento', '')::DATE,
      v_base->>'cpf',
      v_base->>'rg',
      v_base->>'rg_orgao_expedidor',
      NULLIF(v_base->>'rg_data_emissao', '')::DATE,
      v_base->>'titulo_eleitor',
      v_base->>'pis',
      v_base->>'cnh',
      v_base->>'cnh_categoria',
      v_base->>'passaporte',
      COALESCE(v_base->>'pais_nascimento', 'Brasil'),
      COALESCE(v_base->>'nacionalidade', 'Brasileira'),
      v_base->>'estado_nascimento',
      v_base->>'municipio_nascimento',
      v_base->>'email_institucional',
      v_base->>'email_pessoal',
      v_base->>'telefone_celular',
      v_base->>'whatsapp',
      v_base->>'comunidade_atual_nome',
      CASE WHEN v_is_staff AND v_base ? 'status_cadastro' THEN v_base->>'status_cadastro' ELSE 'Em revisão' END,
      CASE WHEN v_is_staff AND v_base ? 'status' THEN v_base->>'status' ELSE 'Ativo' END
    ) RETURNING id INTO v_religioso_id;
  ELSE
    UPDATE public.religiosos SET
      grau = COALESCE(v_base->>'grau', grau),
      nome_civil = COALESCE(v_base->>'nome_civil', nome_civil),
      nome_religioso = v_base->>'nome_religioso',
      data_nascimento = NULLIF(v_base->>'data_nascimento', '')::DATE,
      cpf = COALESCE(v_base->>'cpf', cpf),
      rg = v_base->>'rg',
      rg_orgao_expedidor = v_base->>'rg_orgao_expedidor',
      rg_data_emissao = NULLIF(v_base->>'rg_data_emissao', '')::DATE,
      titulo_eleitor = v_base->>'titulo_eleitor',
      pis = v_base->>'pis',
      cnh = v_base->>'cnh',
      cnh_categoria = v_base->>'cnh_categoria',
      passaporte = v_base->>'passaporte',
      pais_nascimento = v_base->>'pais_nascimento',
      nacionalidade = v_base->>'nacionalidade',
      estado_nascimento = v_base->>'estado_nascimento',
      municipio_nascimento = v_base->>'municipio_nascimento',
      email_institucional = v_base->>'email_institucional',
      email_pessoal = v_base->>'email_pessoal',
      telefone_celular = v_base->>'telefone_celular',
      whatsapp = v_base->>'whatsapp',
      comunidade_atual_nome = v_base->>'comunidade_atual_nome',
      status_cadastro = CASE WHEN v_is_staff AND v_base ? 'status_cadastro' THEN v_base->>'status_cadastro' ELSE status_cadastro END,
      status = CASE WHEN v_is_staff AND v_base ? 'status' THEN v_base->>'status' ELSE status END,
      updated_at = now()
    WHERE id = v_religioso_id;

    DELETE FROM public.religiosos_familiares WHERE religioso_id = v_religioso_id;
    DELETE FROM public.religiosos_contatos_familiares WHERE religioso_id = v_religioso_id;
    DELETE FROM public.religiosos_sacramentos WHERE religioso_id = v_religioso_id;
    DELETE FROM public.religiosos_historico_vocacional WHERE religioso_id = v_religioso_id;
    DELETE FROM public.religiosos_origem_vocacional WHERE religioso_id = v_religioso_id;
    DELETE FROM public.religiosos_formacao_religiosa WHERE religioso_id = v_religioso_id;
    DELETE FROM public.religiosos_profissoes_votos WHERE religioso_id = v_religioso_id;
    DELETE FROM public.religiosos_ministerios_ordens WHERE religioso_id = v_religioso_id;
    DELETE FROM public.religiosos_formacao_academica WHERE religioso_id = v_religioso_id;
    DELETE FROM public.religiosos_idiomas WHERE religioso_id = v_religioso_id;
    DELETE FROM public.religiosos_competencias WHERE religioso_id = v_religioso_id;
    DELETE FROM public.religiosos_historico_comunidades WHERE religioso_id = v_religioso_id;
    DELETE FROM public.religiosos_missoes_servicos WHERE religioso_id = v_religioso_id;
    DELETE FROM public.religiosos_enderecos_contatos WHERE religioso_id = v_religioso_id;
    DELETE FROM public.religiosos_saude WHERE religioso_id = v_religioso_id;
  END IF;

  -- 2. Origem Vocacional (incluindo cidade)
  IF p_payload ? 'origem_vocacional' AND jsonb_typeof(p_payload->'origem_vocacional') = 'object' THEN
    v_item := p_payload->'origem_vocacional';
    INSERT INTO public.religiosos_origem_vocacional (
      religioso_id, paroquia_origem, cidade, diocese, grupo_movimento_pastoral, promotor_vocacional
    ) VALUES (
      v_religioso_id,
      v_item->>'paroquia_origem',
      v_item->>'cidade',
      v_item->>'diocese',
      v_item->>'grupo_movimento_pastoral',
      v_item->>'promotor_vocacional'
    );
  END IF;

  -- 3. Histórico Vocacional (com cidade e local)
  IF p_payload ? 'historico_vocacional' AND jsonb_typeof(p_payload->'historico_vocacional') = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'historico_vocacional')
    LOOP
      INSERT INTO public.religiosos_historico_vocacional (
        religioso_id, data_evento, ano, titulo, descricao, cidade, local, responsavel
      ) VALUES (
        v_religioso_id,
        NULLIF(v_item->>'data_evento', '')::DATE,
        NULLIF(v_item->>'ano', '')::INTEGER,
        v_item->>'titulo',
        v_item->>'descricao',
        v_item->>'cidade',
        v_item->>'local',
        v_item->>'responsavel'
      );
    END LOOP;
  END IF;

  -- 4. Etapas da Formação Religiosa (com cidade e local)
  IF p_payload ? 'formacao_religiosa' AND jsonb_typeof(p_payload->'formacao_religiosa') = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'formacao_religiosa')
    LOOP
      INSERT INTO public.religiosos_formacao_religiosa (
        religioso_id, etapa, instituicao, cidade, local, data_ingresso, data_conclusao, formador
      ) VALUES (
        v_religioso_id,
        COALESCE(v_item->>'etapa', 'Postulado'),
        v_item->>'instituicao',
        v_item->>'cidade',
        v_item->>'local',
        NULLIF(v_item->>'data_ingresso', '')::DATE,
        NULLIF(v_item->>'data_conclusao', '')::DATE,
        v_item->>'formador'
      );
    END LOOP;
  END IF;

  -- 5. Profissões e Votos (com cidade e local)
  IF p_payload ? 'profissoes_votos' AND jsonb_typeof(p_payload->'profissoes_votos') = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'profissoes_votos')
    LOOP
      INSERT INTO public.religiosos_profissoes_votos (
        religioso_id, tipo, renovacao, data, cidade, local, celebrante
      ) VALUES (
        v_religioso_id,
        COALESCE(v_item->>'tipo', 'Primeira profissão'),
        NULLIF(v_item->>'renovacao', '')::INTEGER,
        NULLIF(v_item->>'data', '')::DATE,
        v_item->>'cidade',
        v_item->>'local',
        v_item->>'celebrante'
      );
    END LOOP;
  END IF;

  -- 6. Ministérios e Ordens (com cidade e local)
  IF p_payload ? 'ministerios_ordens' AND jsonb_typeof(p_payload->'ministerios_ordens') = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'ministerios_ordens')
    LOOP
      INSERT INTO public.religiosos_ministerios_ordens (
        religioso_id, tipo, data, cidade, local, celebrante, bispo_ordenante
      ) VALUES (
        v_religioso_id,
        COALESCE(v_item->>'tipo', 'Leitorado'),
        NULLIF(v_item->>'data', '')::DATE,
        v_item->>'cidade',
        v_item->>'local',
        v_item->>'celebrante',
        v_item->>'bispo_ordenante'
      );
    END LOOP;
  END IF;

  -- 7. Competências e Habilidades Técnicas
  IF p_payload ? 'competencias' AND jsonb_typeof(p_payload->'competencias') = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'competencias')
    LOOP
      IF NULLIF(trim(COALESCE(v_item->>'competencia', '')), '') IS NOT NULL THEN
        INSERT INTO public.religiosos_competencias (
          religioso_id, competencia, observacoes
        ) VALUES (
          v_religioso_id,
          v_item->>'competencia',
          v_item->>'observacoes'
        );
      END IF;
    END LOOP;
  END IF;

  -- 8. Histórico de Comunidades (com cidade e local)
  IF p_payload ? 'historico_comunidades' AND jsonb_typeof(p_payload->'historico_comunidades') = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'historico_comunidades')
    LOOP
      INSERT INTO public.religiosos_historico_comunidades (
        religioso_id, periodo_inicio, periodo_fim, instituicao, funcao, cidade, local, observacoes
      ) VALUES (
        v_religioso_id,
        NULLIF(v_item->>'periodo_inicio', '')::DATE,
        NULLIF(v_item->>'periodo_fim', '')::DATE,
        v_item->>'instituicao',
        v_item->>'funcao',
        v_item->>'cidade',
        v_item->>'local',
        v_item->>'observacoes'
      );
    END LOOP;
  END IF;

  -- 9. Missões e Serviços (com cidade e local)
  IF p_payload ? 'missoes_servicos' AND jsonb_typeof(p_payload->'missoes_servicos') = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'missoes_servicos')
    LOOP
      INSERT INTO public.religiosos_missoes_servicos (
        religioso_id, tipo, instituicao, funcao, periodo, cidade, local, documento, observacao
      ) VALUES (
        v_religioso_id,
        COALESCE(v_item->>'tipo', 'Missão'),
        v_item->>'instituicao',
        v_item->>'funcao',
        v_item->>'periodo',
        v_item->>'cidade',
        v_item->>'local',
        v_item->>'documento',
        v_item->>'observacao'
      );
    END LOOP;
  END IF;

  -- 10. Endereços e Contatos
  IF p_payload ? 'enderecos_contatos' AND jsonb_typeof(p_payload->'enderecos_contatos') = 'object' THEN
    v_item := p_payload->'enderecos_contatos';
    INSERT INTO public.religiosos_enderecos_contatos (
      religioso_id, cep, logradouro, numero, complemento, bairro, cidade, estado, pais,
      celular, telefone, email, whatsapp, redes_sociais
    ) VALUES (
      v_religioso_id,
      v_item->>'cep',
      v_item->>'logradouro',
      v_item->>'numero',
      v_item->>'complemento',
      v_item->>'bairro',
      v_item->>'cidade',
      v_item->>'estado',
      COALESCE(v_item->>'pais', 'Brasil'),
      v_item->>'celular',
      v_item->>'telefone',
      v_item->>'email',
      v_item->>'whatsapp',
      v_item->>'redes_sociais'
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'id', v_religioso_id);
END;
$$;
