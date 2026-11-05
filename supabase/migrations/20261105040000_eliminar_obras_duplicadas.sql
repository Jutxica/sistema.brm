-- ==============================================================================
-- MIGRAÇÃO: Eliminação Definitiva de Obras e Comunidades Duplicadas
-- Data: 2026-11-05
-- Motivo: Cargas do Elenco e sementes anteriores inseriram registros repetidos
--         (ex.: 'Conventinho SCJ') devido a checagens com campos nulos.
-- ==============================================================================

-- 1. LIMPEZA INTELIGENTE DE OBRAS DUPLICADAS (public.religiosos_obras_referencia)
DO $$
DECLARE
  rec_dup RECORD;
  v_canonico_id UUID;
  v_secundario_id UUID;
  v_obras_removidas INT := 0;
BEGIN
  RAISE NOTICE 'Iniciando verificação e unificação de obras duplicadas...';

  FOR rec_dup IN
    SELECT lower(trim(nome)) AS nome_norm, count(*) AS qtd
    FROM public.religiosos_obras_referencia
    WHERE nome IS NOT NULL AND trim(nome) <> ''
    GROUP BY lower(trim(nome))
    HAVING count(*) > 1
  LOOP
    RAISE NOTICE 'Processando obra duplicada: % (% ocorrências)', rec_dup.nome_norm, rec_dup.qtd;

    -- Seleciona o registro canônico (mais completo e com vínculos existentes)
    SELECT id INTO v_canonico_id
    FROM (
      SELECT ro.id,
        (
          (CASE WHEN EXISTS (SELECT 1 FROM public.religiosos r WHERE r.obra_atual_id = ro.id) THEN 100 ELSE 0 END) +
          (CASE WHEN EXISTS (SELECT 1 FROM public.religiosos_designacoes rd WHERE rd.obra_id = ro.id) THEN 100 ELSE 0 END) +
          (CASE WHEN ro.cidade IS NOT NULL AND trim(ro.cidade) <> '' THEN 10 ELSE 0 END) +
          (CASE WHEN ro.localidade IS NOT NULL AND trim(ro.localidade) <> '' THEN 5 ELSE 0 END) +
          (CASE WHEN ro.uf IS NOT NULL AND trim(ro.uf) <> '' THEN 10 ELSE 0 END) +
          (CASE WHEN ro.endereco IS NOT NULL AND trim(ro.endereco) <> '' THEN 15 ELSE 0 END) +
          (CASE WHEN ro.logradouro IS NOT NULL AND trim(ro.logradouro) <> '' THEN 10 ELSE 0 END) +
          (CASE WHEN ro.cep IS NOT NULL AND trim(ro.cep) <> '' THEN 5 ELSE 0 END) +
          (CASE WHEN ro.telefone IS NOT NULL AND trim(ro.telefone) <> '' THEN 5 ELSE 0 END) +
          (CASE WHEN ro.email IS NOT NULL AND trim(ro.email) <> '' THEN 5 ELSE 0 END) +
          (CASE WHEN ro.comunidade_id IS NOT NULL THEN 10 ELSE 0 END)
        ) AS score,
        ro.created_at
      FROM public.religiosos_obras_referencia ro
      WHERE lower(trim(ro.nome)) = rec_dup.nome_norm
      ORDER BY score DESC, ro.created_at ASC, ro.id ASC
      LIMIT 1
    ) can;

    -- Itera sobre os registros secundários
    FOR v_secundario_id IN
      SELECT ro.id
      FROM public.religiosos_obras_referencia ro
      WHERE lower(trim(ro.nome)) = rec_dup.nome_norm
        AND ro.id <> v_canonico_id
    LOOP
      -- Mescla dados do secundário para o canônico caso o canônico não tenha
      UPDATE public.religiosos_obras_referencia c
      SET
        tipo = COALESCE(NULLIF(trim(c.tipo), ''), s.tipo, 'Obra'),
        cidade = COALESCE(NULLIF(trim(c.cidade), ''), s.cidade),
        localidade = COALESCE(NULLIF(trim(c.localidade), ''), s.localidade, NULLIF(trim(c.cidade), ''), s.cidade),
        uf = COALESCE(NULLIF(trim(c.uf), ''), s.uf),
        estado = COALESCE(NULLIF(trim(c.estado), ''), s.estado, NULLIF(trim(c.uf), ''), s.uf),
        diocese = COALESCE(NULLIF(trim(c.diocese), ''), s.diocese),
        fundacao = COALESCE(c.fundacao, s.fundacao),
        assumida_pelos_dehonianos = COALESCE(c.assumida_pelos_dehonianos, s.assumida_pelos_dehonianos),
        cep = COALESCE(NULLIF(trim(c.cep), ''), s.cep),
        logradouro = COALESCE(NULLIF(trim(c.logradouro), ''), s.logradouro),
        numero = COALESCE(NULLIF(trim(c.numero), ''), s.numero),
        complemento = COALESCE(NULLIF(trim(c.complemento), ''), s.complemento),
        bairro = COALESCE(NULLIF(trim(c.bairro), ''), s.bairro),
        endereco = COALESCE(NULLIF(trim(c.endereco), ''), s.endereco),
        telefone = COALESCE(NULLIF(trim(c.telefone), ''), s.telefone),
        whatsapp = COALESCE(NULLIF(trim(c.whatsapp), ''), s.whatsapp),
        email = COALESCE(NULLIF(trim(c.email), ''), s.email),
        instagram = COALESCE(NULLIF(trim(c.instagram), ''), s.instagram),
        facebook = COALESCE(NULLIF(trim(c.facebook), ''), s.facebook),
        youtube = COALESCE(NULLIF(trim(c.youtube), ''), s.youtube),
        site = COALESCE(NULLIF(trim(c.site), ''), s.site),
        comunidade_id = COALESCE(c.comunidade_id, s.comunidade_id),
        pertencimento_elenco = COALESCE(c.pertencimento_elenco, s.pertencimento_elenco)
      FROM public.religiosos_obras_referencia s
      WHERE c.id = v_canonico_id AND s.id = v_secundario_id;

      -- Redireciona chaves estrangeiras para o registro canônico
      UPDATE public.religiosos
      SET obra_atual_id = v_canonico_id
      WHERE obra_atual_id = v_secundario_id;

      UPDATE public.religiosos_designacoes
      SET obra_id = v_canonico_id
      WHERE obra_id = v_secundario_id;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'religiosos_enderecos_contatos'
          AND column_name = 'obra_id'
      ) THEN
        UPDATE public.religiosos_enderecos_contatos
        SET obra_id = v_canonico_id
        WHERE obra_id = v_secundario_id;
      END IF;

      -- Deleta a linha duplicada
      DELETE FROM public.religiosos_obras_referencia
      WHERE id = v_secundario_id;

      v_obras_removidas := v_obras_removidas + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Obras duplicadas unificadas com sucesso. Total removidas: %', v_obras_removidas;
END $$;

-- 2. LIMPEZA INTELIGENTE DE COMUNIDADES DUPLICADAS (public.comunidades)
DO $$
DECLARE
  rec_com RECORD;
  v_com_canonico_id UUID;
  v_com_secundario_id UUID;
  v_com_removidas INT := 0;
BEGIN
  RAISE NOTICE 'Iniciando verificação e unificação de comunidades duplicadas...';

  FOR rec_com IN
    SELECT lower(trim(nome)) AS nome_norm, count(*) AS qtd
    FROM public.comunidades
    WHERE nome IS NOT NULL AND trim(nome) <> ''
    GROUP BY lower(trim(nome))
    HAVING count(*) > 1
  LOOP
    RAISE NOTICE 'Processando comunidade duplicada: % (% ocorrências)', rec_com.nome_norm, rec_com.qtd;

    SELECT id INTO v_com_canonico_id
    FROM (
      SELECT c.id,
        (
          (CASE WHEN EXISTS (SELECT 1 FROM public.religiosos r WHERE r.comunidade_atual_id = c.id) THEN 100 ELSE 0 END) +
          (CASE WHEN EXISTS (SELECT 1 FROM public.religiosos_designacoes rd WHERE rd.comunidade_id = c.id) THEN 100 ELSE 0 END) +
          (CASE WHEN c.cidade IS NOT NULL AND trim(c.cidade) <> '' THEN 10 ELSE 0 END) +
          (CASE WHEN c.estado IS NOT NULL AND trim(c.estado) <> '' THEN 10 ELSE 0 END) +
          (CASE WHEN c.logradouro IS NOT NULL AND trim(c.logradouro) <> '' THEN 10 ELSE 0 END) +
          (CASE WHEN c.telefone IS NOT NULL AND trim(c.telefone) <> '' THEN 5 ELSE 0 END) +
          (CASE WHEN c.email IS NOT NULL AND trim(c.email) <> '' THEN 5 ELSE 0 END)
        ) AS score,
        c.created_at
      FROM public.comunidades c
      WHERE lower(trim(c.nome)) = rec_com.nome_norm
      ORDER BY score DESC, c.created_at ASC, c.id ASC
      LIMIT 1
    ) can;

    FOR v_com_secundario_id IN
      SELECT c.id
      FROM public.comunidades c
      WHERE lower(trim(c.nome)) = rec_com.nome_norm
        AND c.id <> v_com_canonico_id
    LOOP
      UPDATE public.comunidades c
      SET
        padroeiro = COALESCE(NULLIF(trim(c.padroeiro), ''), s.padroeiro),
        cidade = COALESCE(NULLIF(trim(c.cidade), ''), s.cidade),
        estado = COALESCE(NULLIF(trim(c.estado), ''), s.estado),
        logradouro = COALESCE(NULLIF(trim(c.logradouro), ''), s.logradouro),
        numero = COALESCE(NULLIF(trim(c.numero), ''), s.numero),
        bairro = COALESCE(NULLIF(trim(c.bairro), ''), s.bairro),
        cep = COALESCE(NULLIF(trim(c.cep), ''), s.cep),
        telefone = COALESCE(NULLIF(trim(c.telefone), ''), s.telefone),
        email = COALESCE(NULLIF(trim(c.email), ''), s.email),
        superior_id = COALESCE(c.superior_id, s.superior_id)
      FROM public.comunidades s
      WHERE c.id = v_com_canonico_id AND s.id = v_com_secundario_id;

      UPDATE public.religiosos
      SET comunidade_atual_id = v_com_canonico_id
      WHERE comunidade_atual_id = v_com_secundario_id;

      UPDATE public.religiosos_designacoes
      SET comunidade_id = v_com_canonico_id
      WHERE comunidade_id = v_com_secundario_id;

      UPDATE public.religiosos_obras_referencia
      SET comunidade_id = v_com_canonico_id
      WHERE comunidade_id = v_com_secundario_id;

      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'obras'
      ) THEN
        UPDATE public.obras
        SET comunidade_id = v_com_canonico_id
        WHERE comunidade_id = v_com_secundario_id;
      END IF;

      DELETE FROM public.comunidades
      WHERE id = v_com_secundario_id;

      v_com_removidas := v_com_removidas + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Comunidades duplicadas unificadas com sucesso. Total removidas: %', v_com_removidas;
END $$;

-- 3. ÍNDICES ÚNICOS DEFINITIVOS PARA PREVENIR DUPLICATAS FUTURAS
-- Remove índice legado fraco caso exista
DROP INDEX IF EXISTS public.idx_obras_referencia_nome_local;

-- Garante que não é possível inserir obras com o mesmo nome na Província
CREATE UNIQUE INDEX IF NOT EXISTS uq_religiosos_obras_referencia_nome_clean
  ON public.religiosos_obras_referencia (lower(trim(nome)));

-- Garante que não é possível inserir comunidades com o mesmo nome na Província
CREATE UNIQUE INDEX IF NOT EXISTS uq_comunidades_nome_clean
  ON public.comunidades (lower(trim(nome)));

-- 4. CONFIRMAÇÃO DE INTEGRIDADE
COMMENT ON INDEX public.uq_religiosos_obras_referencia_nome_clean IS 'Garante unicidade canônica das obras e presenças da Província BRM.';
COMMENT ON INDEX public.uq_comunidades_nome_clean IS 'Garante unicidade das comunidades religiosas da Província BRM.';
