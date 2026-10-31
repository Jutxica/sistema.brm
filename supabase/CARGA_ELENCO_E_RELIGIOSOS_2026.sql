-- =========================================================================
-- CARGA OFICIAL DO ELENCO TERRITORIAL E RELIGIOSOS BRM 2026
-- Província Brasileira Meridional dos Sacerdotes do Sagrado Coração de Jesus
-- Arquitetura 100% Relacional: Regiões -> Comunidades -> Obras -> Confrades
-- =========================================================================

BEGIN;

-- 1. ASSEGURAR COLUNAS E RELACIONAMENTOS NO BANCO DE DADOS
ALTER TABLE public.comunidades ADD COLUMN IF NOT EXISTS regiao TEXT;
ALTER TABLE public.religiosos_obras_referencia ADD COLUMN IF NOT EXISTS comunidade_id UUID REFERENCES public.comunidades(id) ON DELETE SET NULL;
ALTER TABLE public.religiosos_obras_referencia ADD COLUMN IF NOT EXISTS pertencimento_elenco TEXT;
ALTER TABLE public.religiosos ADD COLUMN IF NOT EXISTS comunidade_atual_id UUID REFERENCES public.comunidades(id) ON DELETE SET NULL;
ALTER TABLE public.religiosos ADD COLUMN IF NOT EXISTS obra_atual_id UUID REFERENCES public.religiosos_obras_referencia(id) ON DELETE SET NULL;

-- 2. CADASTRO / ATUALIZAÇÃO DAS 16 COMUNIDADES TERRITORIAIS

-- Atualizar comunidade existente ou inserir caso não conste
UPDATE public.comunidades
SET regiao = 'Litoral Norte Catarinense', status = 'Ativo'
WHERE nome = 'Local Padre Gabriel Lux';

INSERT INTO public.comunidades (nome, regiao, status)
SELECT 'Local Padre Gabriel Lux', 'Litoral Norte Catarinense', 'Ativo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.comunidades WHERE nome = 'Local Padre Gabriel Lux'
);

-- Atualizar comunidade existente ou inserir caso não conste
UPDATE public.comunidades
SET regiao = 'Litoral Norte Catarinense', status = 'Ativo'
WHERE nome = 'Local São Sebastião';

INSERT INTO public.comunidades (nome, regiao, status)
SELECT 'Local São Sebastião', 'Litoral Norte Catarinense', 'Ativo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.comunidades WHERE nome = 'Local São Sebastião'
);

-- Atualizar comunidade existente ou inserir caso não conste
UPDATE public.comunidades
SET regiao = 'Litoral Norte Catarinense', status = 'Ativo'
WHERE nome = 'Local Nossa Senhora de Fátima';

INSERT INTO public.comunidades (nome, regiao, status)
SELECT 'Local Nossa Senhora de Fátima', 'Litoral Norte Catarinense', 'Ativo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.comunidades WHERE nome = 'Local Nossa Senhora de Fátima'
);

-- Atualizar comunidade existente ou inserir caso não conste
UPDATE public.comunidades
SET regiao = 'Litoral Norte Catarinense', status = 'Ativo'
WHERE nome = 'Local Santa Margarida Maria';

INSERT INTO public.comunidades (nome, regiao, status)
SELECT 'Local Santa Margarida Maria', 'Litoral Norte Catarinense', 'Ativo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.comunidades WHERE nome = 'Local Santa Margarida Maria'
);

-- Atualizar comunidade existente ou inserir caso não conste
UPDATE public.comunidades
SET regiao = 'Paraná e Planalto Norte Catarinense', status = 'Ativo'
WHERE nome = 'Local Santa Rita de Cássia';

INSERT INTO public.comunidades (nome, regiao, status)
SELECT 'Local Santa Rita de Cássia', 'Paraná e Planalto Norte Catarinense', 'Ativo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.comunidades WHERE nome = 'Local Santa Rita de Cássia'
);

-- Atualizar comunidade existente ou inserir caso não conste
UPDATE public.comunidades
SET regiao = 'Paraná e Planalto Norte Catarinense', status = 'Ativo'
WHERE nome = 'Local São José';

INSERT INTO public.comunidades (nome, regiao, status)
SELECT 'Local São José', 'Paraná e Planalto Norte Catarinense', 'Ativo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.comunidades WHERE nome = 'Local São José'
);

-- Atualizar comunidade existente ou inserir caso não conste
UPDATE public.comunidades
SET regiao = 'Paraná e Planalto Norte Catarinense', status = 'Ativo'
WHERE nome = 'Territorial Nossa Senhora Aparecida';

INSERT INTO public.comunidades (nome, regiao, status)
SELECT 'Territorial Nossa Senhora Aparecida', 'Paraná e Planalto Norte Catarinense', 'Ativo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.comunidades WHERE nome = 'Territorial Nossa Senhora Aparecida'
);

-- Atualizar comunidade existente ou inserir caso não conste
UPDATE public.comunidades
SET regiao = 'Paraná e Planalto Norte Catarinense', status = 'Ativo'
WHERE nome = 'Local Puríssimo Coração de Maria';

INSERT INTO public.comunidades (nome, regiao, status)
SELECT 'Local Puríssimo Coração de Maria', 'Paraná e Planalto Norte Catarinense', 'Ativo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.comunidades WHERE nome = 'Local Puríssimo Coração de Maria'
);

-- Atualizar comunidade existente ou inserir caso não conste
UPDATE public.comunidades
SET regiao = 'Vale do Itajaí', status = 'Ativo'
WHERE nome = 'Local Sagrado Coração de Jesus';

INSERT INTO public.comunidades (nome, regiao, status)
SELECT 'Local Sagrado Coração de Jesus', 'Vale do Itajaí', 'Ativo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.comunidades WHERE nome = 'Local Sagrado Coração de Jesus'
);

-- Atualizar comunidade existente ou inserir caso não conste
UPDATE public.comunidades
SET regiao = 'Vale do Itajaí', status = 'Ativo'
WHERE nome = 'Local São Luís Gonzaga';

INSERT INTO public.comunidades (nome, regiao, status)
SELECT 'Local São Luís Gonzaga', 'Vale do Itajaí', 'Ativo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.comunidades WHERE nome = 'Local São Luís Gonzaga'
);

-- Atualizar comunidade existente ou inserir caso não conste
UPDATE public.comunidades
SET regiao = 'Vale do Itajaí', status = 'Ativo'
WHERE nome = 'Local Padre Dehon';

INSERT INTO public.comunidades (nome, regiao, status)
SELECT 'Local Padre Dehon', 'Vale do Itajaí', 'Ativo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.comunidades WHERE nome = 'Local Padre Dehon'
);

-- Atualizar comunidade existente ou inserir caso não conste
UPDATE public.comunidades
SET regiao = 'Alto Vale do Itajaí e Sul de Santa Catarina', status = 'Ativo'
WHERE nome = 'Territorial São Judas Tadeu';

INSERT INTO public.comunidades (nome, regiao, status)
SELECT 'Territorial São Judas Tadeu', 'Alto Vale do Itajaí e Sul de Santa Catarina', 'Ativo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.comunidades WHERE nome = 'Territorial São Judas Tadeu'
);

-- Atualizar comunidade existente ou inserir caso não conste
UPDATE public.comunidades
SET regiao = 'Alto Vale do Itajaí e Sul de Santa Catarina', status = 'Ativo'
WHERE nome = 'Territorial Venerável Servo de Deus Padre Aloísio Boeing';

INSERT INTO public.comunidades (nome, regiao, status)
SELECT 'Territorial Venerável Servo de Deus Padre Aloísio Boeing', 'Alto Vale do Itajaí e Sul de Santa Catarina', 'Ativo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.comunidades WHERE nome = 'Territorial Venerável Servo de Deus Padre Aloísio Boeing'
);

-- Atualizar comunidade existente ou inserir caso não conste
UPDATE public.comunidades
SET regiao = 'Rio Grande do Sul', status = 'Ativo'
WHERE nome = 'Territorial São Miguel';

INSERT INTO public.comunidades (nome, regiao, status)
SELECT 'Territorial São Miguel', 'Rio Grande do Sul', 'Ativo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.comunidades WHERE nome = 'Territorial São Miguel'
);

-- Atualizar comunidade existente ou inserir caso não conste
UPDATE public.comunidades
SET regiao = 'Rondônia', status = 'Ativo'
WHERE nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré';

INSERT INTO public.comunidades (nome, regiao, status)
SELECT 'Territorial de Rondônia – Nossa Senhora de Nazaré', 'Rondônia', 'Ativo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.comunidades WHERE nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré'
);

-- Atualizar comunidade existente ou inserir caso não conste
UPDATE public.comunidades
SET regiao = 'Taubaté I', status = 'Ativo'
WHERE nome = 'Conventinho SCJ';

INSERT INTO public.comunidades (nome, regiao, status)
SELECT 'Conventinho SCJ', 'Taubaté I', 'Ativo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.comunidades WHERE nome = 'Conventinho SCJ'
);

-- 3. CADASTRO / ATUALIZAÇÃO DAS OBRAS E INSTITUIÇÕES INTEGRANTES (SEPARADAS)

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Padre Gabriel Lux'
  AND (ro.nome = 'Sede Provincial – Seminário SCJ' OR ro.nome ILIKE 'Sede Provincial – Seminário SCJ');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Sede Provincial – Seminário SCJ', 'Casa', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Padre Gabriel Lux'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Sede Provincial – Seminário SCJ' OR ro.nome ILIKE 'Sede Provincial – Seminário SCJ')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Padre Gabriel Lux'
  AND (ro.nome = 'Paróquia São José' OR ro.nome ILIKE 'Paróquia São José');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia São José', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Padre Gabriel Lux'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia São José' OR ro.nome ILIKE 'Paróquia São José')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Padre Gabriel Lux'
  AND (ro.nome = 'Paróquia Nossa Senhora do Rosário' OR ro.nome ILIKE 'Paróquia Nossa Senhora do Rosário');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia Nossa Senhora do Rosário', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Padre Gabriel Lux'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia Nossa Senhora do Rosário' OR ro.nome ILIKE 'Paróquia Nossa Senhora do Rosário')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local São Sebastião'
  AND (ro.nome = 'Paróquia São Sebastião' OR ro.nome ILIKE 'Paróquia São Sebastião');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia São Sebastião', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local São Sebastião'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia São Sebastião' OR ro.nome ILIKE 'Paróquia São Sebastião')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local São Sebastião'
  AND (ro.nome = 'Paróquia Nossa Senhora das Graças' OR ro.nome ILIKE 'Paróquia Nossa Senhora das Graças');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia Nossa Senhora das Graças', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local São Sebastião'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia Nossa Senhora das Graças' OR ro.nome ILIKE 'Paróquia Nossa Senhora das Graças')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Nossa Senhora de Fátima'
  AND (ro.nome = 'Noviciado Nossa Senhora de Fátima' OR ro.nome ILIKE 'Noviciado Nossa Senhora de Fátima');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Noviciado Nossa Senhora de Fátima', 'Casa', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Nossa Senhora de Fátima'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Noviciado Nossa Senhora de Fátima' OR ro.nome ILIKE 'Noviciado Nossa Senhora de Fátima')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Nossa Senhora de Fátima'
  AND (ro.nome = 'Casa São João' OR ro.nome ILIKE 'Casa São João');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Casa São João', 'Casa', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Nossa Senhora de Fátima'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Casa São João' OR ro.nome ILIKE 'Casa São João')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Santa Margarida Maria'
  AND (ro.nome = 'Santuário Sagrado Coração de Jesus' OR ro.nome ILIKE 'Santuário Sagrado Coração de Jesus');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Santuário Sagrado Coração de Jesus', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Santa Margarida Maria'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Santuário Sagrado Coração de Jesus' OR ro.nome ILIKE 'Santuário Sagrado Coração de Jesus')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Santa Rita de Cássia'
  AND (ro.nome = 'Residência Sagrado Coração de Jesus' OR ro.nome ILIKE 'Residência Sagrado Coração de Jesus');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Residência Sagrado Coração de Jesus', 'Casa', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Santa Rita de Cássia'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Residência Sagrado Coração de Jesus' OR ro.nome ILIKE 'Residência Sagrado Coração de Jesus')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Santa Rita de Cássia'
  AND (ro.nome = 'Paróquia Santuário Santa Rita de Cássia' OR ro.nome ILIKE 'Paróquia Santuário Santa Rita de Cássia');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia Santuário Santa Rita de Cássia', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Santa Rita de Cássia'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia Santuário Santa Rita de Cássia' OR ro.nome ILIKE 'Paróquia Santuário Santa Rita de Cássia')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Santa Rita de Cássia'
  AND (ro.nome = 'Paróquia Santuário São Judas Tadeu' OR ro.nome ILIKE 'Paróquia Santuário São Judas Tadeu');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia Santuário São Judas Tadeu', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Santa Rita de Cássia'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia Santuário São Judas Tadeu' OR ro.nome ILIKE 'Paróquia Santuário São Judas Tadeu')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local São José'
  AND (ro.nome = 'Seminário São José' OR ro.nome ILIKE 'Seminário São José');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Seminário São José', 'Casa', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local São José'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Seminário São José' OR ro.nome ILIKE 'Seminário São José')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local São José'
  AND (ro.nome = 'Secretariado Vocacional – Seminário São José' OR ro.nome ILIKE 'Secretariado Vocacional – Seminário São José');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Secretariado Vocacional – Seminário São José', 'Casa', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local São José'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Secretariado Vocacional – Seminário São José' OR ro.nome ILIKE 'Secretariado Vocacional – Seminário São José')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local São José'
  AND (ro.nome = 'Paróquia Santo Antônio' OR ro.nome ILIKE 'Paróquia Santo Antônio');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia Santo Antônio', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local São José'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia Santo Antônio' OR ro.nome ILIKE 'Paróquia Santo Antônio')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial Nossa Senhora Aparecida'
  AND (ro.nome = 'Paróquia Nossa Senhora Aparecida' OR ro.nome ILIKE 'Paróquia Nossa Senhora Aparecida');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia Nossa Senhora Aparecida', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial Nossa Senhora Aparecida'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia Nossa Senhora Aparecida' OR ro.nome ILIKE 'Paróquia Nossa Senhora Aparecida')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial Nossa Senhora Aparecida'
  AND (ro.nome = 'Paróquia Imaculada Conceição' OR ro.nome ILIKE 'Paróquia Imaculada Conceição');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia Imaculada Conceição', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial Nossa Senhora Aparecida'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia Imaculada Conceição' OR ro.nome ILIKE 'Paróquia Imaculada Conceição')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Puríssimo Coração de Maria'
  AND (ro.nome = 'Paróquia Puríssimo Coração de Maria' OR ro.nome ILIKE 'Paróquia Puríssimo Coração de Maria');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia Puríssimo Coração de Maria', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Puríssimo Coração de Maria'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia Puríssimo Coração de Maria' OR ro.nome ILIKE 'Paróquia Puríssimo Coração de Maria')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Sagrado Coração de Jesus'
  AND (ro.nome = 'Convento Sagrado Coração de Jesus' OR ro.nome ILIKE 'Convento Sagrado Coração de Jesus');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Convento Sagrado Coração de Jesus', 'Casa', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Sagrado Coração de Jesus'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Convento Sagrado Coração de Jesus' OR ro.nome ILIKE 'Convento Sagrado Coração de Jesus')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Sagrado Coração de Jesus'
  AND (ro.nome = 'Faculdade São Luiz' OR ro.nome ILIKE 'Faculdade São Luiz');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Faculdade São Luiz', 'Obra', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Sagrado Coração de Jesus'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Faculdade São Luiz' OR ro.nome ILIKE 'Faculdade São Luiz')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Sagrado Coração de Jesus'
  AND (ro.nome = 'Colégio São Luiz' OR ro.nome ILIKE 'Colégio São Luiz');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Colégio São Luiz', 'Obra', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Sagrado Coração de Jesus'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Colégio São Luiz' OR ro.nome ILIKE 'Colégio São Luiz')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local São Luís Gonzaga'
  AND (ro.nome = 'Paróquia São Luís Gonzaga' OR ro.nome ILIKE 'Paróquia São Luís Gonzaga');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia São Luís Gonzaga', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local São Luís Gonzaga'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia São Luís Gonzaga' OR ro.nome ILIKE 'Paróquia São Luís Gonzaga')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local São Luís Gonzaga'
  AND (ro.nome = 'Paróquia São José' OR ro.nome ILIKE 'Paróquia São José');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia São José', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local São Luís Gonzaga'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia São José' OR ro.nome ILIKE 'Paróquia São José')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local São Luís Gonzaga'
  AND (ro.nome = 'Paróquia Nossa Senhora do Perpétuo Socorro' OR ro.nome ILIKE 'Paróquia Nossa Senhora do Perpétuo Socorro');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia Nossa Senhora do Perpétuo Socorro', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local São Luís Gonzaga'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia Nossa Senhora do Perpétuo Socorro' OR ro.nome ILIKE 'Paróquia Nossa Senhora do Perpétuo Socorro')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local São Luís Gonzaga'
  AND (ro.nome = 'Paróquia São Cristóvão' OR ro.nome ILIKE 'Paróquia São Cristóvão');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia São Cristóvão', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local São Luís Gonzaga'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia São Cristóvão' OR ro.nome ILIKE 'Paróquia São Cristóvão')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Padre Dehon'
  AND (ro.nome = 'Casa Padre Dehon' OR ro.nome ILIKE 'Casa Padre Dehon');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Casa Padre Dehon', 'Casa', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Local Padre Dehon'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Casa Padre Dehon' OR ro.nome ILIKE 'Casa Padre Dehon')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial São Judas Tadeu'
  AND (ro.nome = 'Paróquia São Judas Tadeu' OR ro.nome ILIKE 'Paróquia São Judas Tadeu');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia São Judas Tadeu', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial São Judas Tadeu'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia São Judas Tadeu' OR ro.nome ILIKE 'Paróquia São Judas Tadeu')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial São Judas Tadeu'
  AND (ro.nome = 'Paróquia Catedral São João Batista' OR ro.nome ILIKE 'Paróquia Catedral São João Batista');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia Catedral São João Batista', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial São Judas Tadeu'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia Catedral São João Batista' OR ro.nome ILIKE 'Paróquia Catedral São João Batista')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial São Judas Tadeu'
  AND (ro.nome = 'Paróquia São Sebastião' OR ro.nome ILIKE 'Paróquia São Sebastião');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia São Sebastião', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial São Judas Tadeu'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia São Sebastião' OR ro.nome ILIKE 'Paróquia São Sebastião')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial Venerável Servo de Deus Padre Aloísio Boeing'
  AND (ro.nome = 'Paróquia São Pedro Apóstolo' OR ro.nome ILIKE 'Paróquia São Pedro Apóstolo');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia São Pedro Apóstolo', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial Venerável Servo de Deus Padre Aloísio Boeing'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia São Pedro Apóstolo' OR ro.nome ILIKE 'Paróquia São Pedro Apóstolo')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial Venerável Servo de Deus Padre Aloísio Boeing'
  AND (ro.nome = 'Paróquia Santuário Sagrado Coração de Jesus' OR ro.nome ILIKE 'Paróquia Santuário Sagrado Coração de Jesus');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia Santuário Sagrado Coração de Jesus', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial Venerável Servo de Deus Padre Aloísio Boeing'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia Santuário Sagrado Coração de Jesus' OR ro.nome ILIKE 'Paróquia Santuário Sagrado Coração de Jesus')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial São Miguel'
  AND (ro.nome = 'Paróquia São José' OR ro.nome ILIKE 'Paróquia São José');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia São José', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial São Miguel'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia São José' OR ro.nome ILIKE 'Paróquia São José')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial São Miguel'
  AND (ro.nome = 'Paróquia Nossa Senhora Aparecida' OR ro.nome ILIKE 'Paróquia Nossa Senhora Aparecida');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia Nossa Senhora Aparecida', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial São Miguel'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia Nossa Senhora Aparecida' OR ro.nome ILIKE 'Paróquia Nossa Senhora Aparecida')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial São Miguel'
  AND (ro.nome = 'Paróquia Sagrado Coração de Jesus' OR ro.nome ILIKE 'Paróquia Sagrado Coração de Jesus');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia Sagrado Coração de Jesus', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial São Miguel'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia Sagrado Coração de Jesus' OR ro.nome ILIKE 'Paróquia Sagrado Coração de Jesus')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré'
  AND (ro.nome = 'Paróquia Nossa Senhora de Nazaré' OR ro.nome ILIKE 'Paróquia Nossa Senhora de Nazaré');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia Nossa Senhora de Nazaré', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia Nossa Senhora de Nazaré' OR ro.nome ILIKE 'Paróquia Nossa Senhora de Nazaré')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré'
  AND (ro.nome = 'Paróquia Rainha dos Apóstolos' OR ro.nome ILIKE 'Paróquia Rainha dos Apóstolos');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia Rainha dos Apóstolos', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia Rainha dos Apóstolos' OR ro.nome ILIKE 'Paróquia Rainha dos Apóstolos')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré'
  AND (ro.nome = 'Paróquia São Sebastião' OR ro.nome ILIKE 'Paróquia São Sebastião');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Paróquia São Sebastião', 'Paróquia', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Paróquia São Sebastião' OR ro.nome ILIKE 'Paróquia São Sebastião')
  );

-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = 'Conventinho SCJ'
  AND (ro.nome = 'Conventinho SCJ' OR ro.nome ILIKE 'Conventinho SCJ');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT 'Conventinho SCJ', 'Obra', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = 'Conventinho SCJ'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = 'Conventinho SCJ' OR ro.nome ILIKE 'Conventinho SCJ')
  );

-- 4. CARGA E PRÉ-PREENCHIMENTO DOS 123 RELIGIOSOS DA PROVÍNCIA
-- Preenche Nome Civil, Nome Elenco, Grau, Data de Nascimento, E-mail, Comunidade e Atuação

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Conventinho SCJ' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Tiago Junior Waier'))
     OR ('tiagowaier7@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'tiagowaier7@gmail.com' OR lower(trim(email_pessoal)) = 'tiagowaier7@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Diácono Tiago Junior Waier',
        grau = 'Diácono',
        data_nascimento = COALESCE(data_nascimento, '1995-11-09'),
        email_institucional = COALESCE(email_institucional, 'tiagowaier7@gmail.com'),
        comunidade_atual_nome = 'Conventinho SCJ',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Tiago Junior Waier',
      'Diácono Tiago Junior Waier',
      'Diácono Tiago Junior Waier',
      'Diácono',
      '1995-11-09',
      'tiagowaier7@gmail.com',
      'Conventinho SCJ',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Sede Provincial – Cúria BRM' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Murilo Sebastião Ramos Krieger'))
     OR ('dom.murilo@brm.org.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'dom.murilo@brm.org.br' OR lower(trim(email_pessoal)) = 'dom.murilo@brm.org.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Dom Murilo Sebastião Ramos Krieger',
        grau = 'Bispo',
        data_nascimento = COALESCE(data_nascimento, '1943-09-19'),
        email_institucional = COALESCE(email_institucional, 'dom.murilo@brm.org.br'),
        comunidade_atual_nome = 'Sede Provincial – Cúria BRM',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Murilo Sebastião Ramos Krieger',
      'Dom Murilo Sebastião Ramos Krieger',
      'Dom Murilo Sebastião Ramos Krieger',
      'Bispo',
      '1943-09-19',
      'dom.murilo@brm.org.br',
      'Sede Provincial – Cúria BRM',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial São Miguel' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Alexandre Johann'))
     OR ('alexandre.johann@brm.org.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'alexandre.johann@brm.org.br' OR lower(trim(email_pessoal)) = 'alexandre.johann@brm.org.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Frater Alexandre Johann',
        grau = 'Frater',
        data_nascimento = COALESCE(data_nascimento, '1991-02-05'),
        email_institucional = COALESCE(email_institucional, 'alexandre.johann@brm.org.br'),
        comunidade_atual_nome = 'Territorial São Miguel',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Alexandre Johann',
      'Frater Alexandre Johann',
      'Frater Alexandre Johann',
      'Frater',
      '1991-02-05',
      'alexandre.johann@brm.org.br',
      'Territorial São Miguel',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Nossa Senhora de Fátima' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Alexandre Semkiv de A. Caetano'))
     OR ('ale12caetano@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'ale12caetano@gmail.com' OR lower(trim(email_pessoal)) = 'ale12caetano@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Frater Alexandre Semkiv de A. Caetano',
        grau = 'Frater',
        data_nascimento = COALESCE(data_nascimento, '1998-11-12'),
        email_institucional = COALESCE(email_institucional, 'ale12caetano@gmail.com'),
        comunidade_atual_nome = 'Local Nossa Senhora de Fátima',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Alexandre Semkiv de A. Caetano',
      'Frater Alexandre Semkiv de A. Caetano',
      'Frater Alexandre Semkiv de A. Caetano',
      'Frater',
      '1998-11-12',
      'ale12caetano@gmail.com',
      'Local Nossa Senhora de Fátima',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial Nossa Senhora Aparecida' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Artur Hang'))
     OR ('artur.hangs@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'artur.hangs@gmail.com' OR lower(trim(email_pessoal)) = 'artur.hangs@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Frater Artur Hang',
        grau = 'Frater',
        data_nascimento = COALESCE(data_nascimento, '2001-02-14'),
        email_institucional = COALESCE(email_institucional, 'artur.hangs@gmail.com'),
        comunidade_atual_nome = 'Territorial Nossa Senhora Aparecida',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Artur Hang',
      'Frater Artur Hang',
      'Frater Artur Hang',
      'Frater',
      '2001-02-14',
      'artur.hangs@gmail.com',
      'Territorial Nossa Senhora Aparecida',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Padre Dehon' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Cleiton Froehner'))
     OR ('cleiton.froehner@icloud.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'cleiton.froehner@icloud.com' OR lower(trim(email_pessoal)) = 'cleiton.froehner@icloud.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Frater Cleiton Froehner',
        grau = 'Frater',
        data_nascimento = COALESCE(data_nascimento, '1991-12-17'),
        email_institucional = COALESCE(email_institucional, 'cleiton.froehner@icloud.com'),
        comunidade_atual_nome = 'Local Padre Dehon',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Cleiton Froehner',
      'Frater Cleiton Froehner',
      'Frater Cleiton Froehner',
      'Frater',
      '1991-12-17',
      'cleiton.froehner@icloud.com',
      'Local Padre Dehon',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Sagrado Coração de Jesus' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Cristiano Schneider'))
     OR ('cristianosch26@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'cristianosch26@gmail.com' OR lower(trim(email_pessoal)) = 'cristianosch26@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Frater Cristiano Schneider',
        grau = 'Frater',
        data_nascimento = COALESCE(data_nascimento, '1990-02-26'),
        email_institucional = COALESCE(email_institucional, 'cristianosch26@gmail.com'),
        comunidade_atual_nome = 'Local Sagrado Coração de Jesus',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Cristiano Schneider',
      'Frater Cristiano Schneider',
      'Frater Cristiano Schneider',
      'Frater',
      '1990-02-26',
      'cristianosch26@gmail.com',
      'Local Sagrado Coração de Jesus',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Padre Dehon' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Daugmar Zeitz Kraus'))
     OR ('daugmar_kraus@brm.org.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'daugmar_kraus@brm.org.br' OR lower(trim(email_pessoal)) = 'daugmar_kraus@brm.org.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Frater Daugmar Zeitz Kraus',
        grau = 'Frater',
        data_nascimento = COALESCE(data_nascimento, '1999-10-07'),
        email_institucional = COALESCE(email_institucional, 'daugmar_kraus@brm.org.br'),
        comunidade_atual_nome = 'Local Padre Dehon',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Daugmar Zeitz Kraus',
      'Frater Daugmar Zeitz Kraus',
      'Frater Daugmar Zeitz Kraus',
      'Frater',
      '1999-10-07',
      'daugmar_kraus@brm.org.br',
      'Local Padre Dehon',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Conventinho SCJ' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Djonatan Engelmann'))
     OR ('djonatan.engelmann@brm.org.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'djonatan.engelmann@brm.org.br' OR lower(trim(email_pessoal)) = 'djonatan.engelmann@brm.org.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Frater Djonatan Engelmann',
        grau = 'Frater',
        data_nascimento = COALESCE(data_nascimento, '1992-05-12'),
        email_institucional = COALESCE(email_institucional, 'djonatan.engelmann@brm.org.br'),
        comunidade_atual_nome = 'Conventinho SCJ',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Djonatan Engelmann',
      'Frater Djonatan Engelmann',
      'Frater Djonatan Engelmann',
      'Frater',
      '1992-05-12',
      'djonatan.engelmann@brm.org.br',
      'Conventinho SCJ',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Conventinho SCJ' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Erik Patrik Fantini'))
     OR ('erikpatrik02@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'erikpatrik02@gmail.com' OR lower(trim(email_pessoal)) = 'erikpatrik02@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Frater Erik Patrik Fantini',
        grau = 'Frater',
        data_nascimento = COALESCE(data_nascimento, '1996-03-20'),
        email_institucional = COALESCE(email_institucional, 'erikpatrik02@gmail.com'),
        comunidade_atual_nome = 'Conventinho SCJ',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Erik Patrik Fantini',
      'Frater Erik Patrik Fantini',
      'Frater Erik Patrik Fantini',
      'Frater',
      '1996-03-20',
      'erikpatrik02@gmail.com',
      'Conventinho SCJ',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São José' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Filipe José Potter'))
     OR ('filipe.potter1709@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'filipe.potter1709@gmail.com' OR lower(trim(email_pessoal)) = 'filipe.potter1709@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Frater Filipe José Potter',
        grau = 'Frater',
        data_nascimento = COALESCE(data_nascimento, '2003-09-17'),
        email_institucional = COALESCE(email_institucional, 'filipe.potter1709@gmail.com'),
        comunidade_atual_nome = 'Local São José',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Filipe José Potter',
      'Frater Filipe José Potter',
      'Frater Filipe José Potter',
      'Frater',
      '2003-09-17',
      'filipe.potter1709@gmail.com',
      'Local São José',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São José' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Geovan Luiz Alberton'))
     OR ('geovanalbertao@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'geovanalbertao@gmail.com' OR lower(trim(email_pessoal)) = 'geovanalbertao@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Frater Geovan Luiz Alberton',
        grau = 'Frater',
        data_nascimento = COALESCE(data_nascimento, '1998-09-11'),
        email_institucional = COALESCE(email_institucional, 'geovanalbertao@gmail.com'),
        comunidade_atual_nome = 'Local São José',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Geovan Luiz Alberton',
      'Frater Geovan Luiz Alberton',
      'Frater Geovan Luiz Alberton',
      'Frater',
      '1998-09-11',
      'geovanalbertao@gmail.com',
      'Local São José',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial Nossa Senhora Aparecida' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Henrique Carvalho da Silva'))
     OR ('henrique_silva@brm.org.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'henrique_silva@brm.org.br' OR lower(trim(email_pessoal)) = 'henrique_silva@brm.org.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Frater Henrique Carvalho da Silva',
        grau = 'Frater',
        data_nascimento = COALESCE(data_nascimento, '2003-04-04'),
        email_institucional = COALESCE(email_institucional, 'henrique_silva@brm.org.br'),
        comunidade_atual_nome = 'Territorial Nossa Senhora Aparecida',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Henrique Carvalho da Silva',
      'Frater Henrique Carvalho da Silva',
      'Frater Henrique Carvalho da Silva',
      'Frater',
      '2003-04-04',
      'henrique_silva@brm.org.br',
      'Territorial Nossa Senhora Aparecida',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Conventinho SCJ' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Honaycon Gonçalves'))
     OR ('honaycon@brm.org.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'honaycon@brm.org.br' OR lower(trim(email_pessoal)) = 'honaycon@brm.org.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Frater Honaycon Gonçalves',
        grau = 'Frater',
        data_nascimento = COALESCE(data_nascimento, '1994-11-30'),
        email_institucional = COALESCE(email_institucional, 'honaycon@brm.org.br'),
        comunidade_atual_nome = 'Conventinho SCJ',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Honaycon Gonçalves',
      'Frater Honaycon Gonçalves',
      'Frater Honaycon Gonçalves',
      'Frater',
      '1994-11-30',
      'honaycon@brm.org.br',
      'Conventinho SCJ',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Padre Gabriel Lux' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Iago Mafra Cunha'))
     OR ('iagomafracunha@outlook.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'iagomafracunha@outlook.com' OR lower(trim(email_pessoal)) = 'iagomafracunha@outlook.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Frater Iago Mafra Cunha',
        grau = 'Frater',
        data_nascimento = COALESCE(data_nascimento, '1998-03-25'),
        email_institucional = COALESCE(email_institucional, 'iagomafracunha@outlook.com'),
        comunidade_atual_nome = 'Local Padre Gabriel Lux',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Iago Mafra Cunha',
      'Frater Iago Mafra Cunha',
      'Frater Iago Mafra Cunha',
      'Frater',
      '1998-03-25',
      'iagomafracunha@outlook.com',
      'Local Padre Gabriel Lux',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Conventinho SCJ' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Jeferson Adriano Caldas'))
     OR ('phnjefer@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'phnjefer@gmail.com' OR lower(trim(email_pessoal)) = 'phnjefer@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Frater Jeferson Adriano Caldas',
        grau = 'Frater',
        data_nascimento = COALESCE(data_nascimento, '1987-03-26'),
        email_institucional = COALESCE(email_institucional, 'phnjefer@gmail.com'),
        comunidade_atual_nome = 'Conventinho SCJ',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Jeferson Adriano Caldas',
      'Frater Jeferson Adriano Caldas',
      'Frater Jeferson Adriano Caldas',
      'Frater',
      '1987-03-26',
      'phnjefer@gmail.com',
      'Conventinho SCJ',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Nossa Senhora de Fátima' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('João Pedro Dutra Walecki'))
     OR ('joaopedro_scj@brm.org.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'joaopedro_scj@brm.org.br' OR lower(trim(email_pessoal)) = 'joaopedro_scj@brm.org.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Frater João Pedro Dutra Walecki',
        grau = 'Frater',
        data_nascimento = COALESCE(data_nascimento, '2002-06-30'),
        email_institucional = COALESCE(email_institucional, 'joaopedro_scj@brm.org.br'),
        comunidade_atual_nome = 'Local Nossa Senhora de Fátima',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'João Pedro Dutra Walecki',
      'Frater João Pedro Dutra Walecki',
      'Frater João Pedro Dutra Walecki',
      'Frater',
      '2002-06-30',
      'joaopedro_scj@brm.org.br',
      'Local Nossa Senhora de Fátima',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Conventinho SCJ' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Márcio Rech'))
     OR ('marciorech84@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'marciorech84@gmail.com' OR lower(trim(email_pessoal)) = 'marciorech84@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Frater Márcio Rech',
        grau = 'Frater',
        data_nascimento = COALESCE(data_nascimento, '1984-01-16'),
        email_institucional = COALESCE(email_institucional, 'marciorech84@gmail.com'),
        comunidade_atual_nome = 'Conventinho SCJ',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Márcio Rech',
      'Frater Márcio Rech',
      'Frater Márcio Rech',
      'Frater',
      '1984-01-16',
      'marciorech84@gmail.com',
      'Conventinho SCJ',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Pedro Henrique Oliveira de Paula'))
     OR ('pedroh03@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'pedroh03@hotmail.com' OR lower(trim(email_pessoal)) = 'pedroh03@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Frater Pedro Henrique Oliveira de Paula',
        grau = 'Frater',
        data_nascimento = COALESCE(data_nascimento, '2000-08-17'),
        email_institucional = COALESCE(email_institucional, 'pedroh03@hotmail.com'),
        comunidade_atual_nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Pedro Henrique Oliveira de Paula',
      'Frater Pedro Henrique Oliveira de Paula',
      'Frater Pedro Henrique Oliveira de Paula',
      'Frater',
      '2000-08-17',
      'pedroh03@hotmail.com',
      'Territorial de Rondônia – Nossa Senhora de Nazaré',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Renato Schweitzer Filho'))
     OR ('renatosf_scj@brm.org.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'renatosf_scj@brm.org.br' OR lower(trim(email_pessoal)) = 'renatosf_scj@brm.org.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Frater Renato Schweitzer Filho',
        grau = 'Frater',
        data_nascimento = COALESCE(data_nascimento, '2001-01-21'),
        email_institucional = COALESCE(email_institucional, 'renatosf_scj@brm.org.br'),
        comunidade_atual_nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Renato Schweitzer Filho',
      'Frater Renato Schweitzer Filho',
      'Frater Renato Schweitzer Filho',
      'Frater',
      '2001-01-21',
      'renatosf_scj@brm.org.br',
      'Territorial de Rondônia – Nossa Senhora de Nazaré',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Conventinho SCJ' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Ricardo Vinter'))
     OR ('ricardo.vinter@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'ricardo.vinter@gmail.com' OR lower(trim(email_pessoal)) = 'ricardo.vinter@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Frater Ricardo Vinter',
        grau = 'Frater',
        data_nascimento = COALESCE(data_nascimento, '1992-12-04'),
        email_institucional = COALESCE(email_institucional, 'ricardo.vinter@gmail.com'),
        comunidade_atual_nome = 'Conventinho SCJ',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Ricardo Vinter',
      'Frater Ricardo Vinter',
      'Frater Ricardo Vinter',
      'Frater',
      '1992-12-04',
      'ricardo.vinter@gmail.com',
      'Conventinho SCJ',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Conventinho SCJ' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Thiago Hermenegildo de Faria'))
     OR ('thf.scj@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'thf.scj@gmail.com' OR lower(trim(email_pessoal)) = 'thf.scj@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Frater Thiago Hermenegildo de Faria',
        grau = 'Frater',
        data_nascimento = COALESCE(data_nascimento, '1987-09-15'),
        email_institucional = COALESCE(email_institucional, 'thf.scj@gmail.com'),
        comunidade_atual_nome = 'Conventinho SCJ',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Thiago Hermenegildo de Faria',
      'Frater Thiago Hermenegildo de Faria',
      'Frater Thiago Hermenegildo de Faria',
      'Frater',
      '1987-09-15',
      'thf.scj@gmail.com',
      'Conventinho SCJ',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Nossa Senhora de Fátima' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Ederson Krause'))
     OR ('ederson.krause@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'ederson.krause@hotmail.com' OR lower(trim(email_pessoal)) = 'ederson.krause@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Irmão Ederson Krause',
        grau = 'Irmão',
        data_nascimento = COALESCE(data_nascimento, '1987-01-19'),
        email_institucional = COALESCE(email_institucional, 'ederson.krause@hotmail.com'),
        comunidade_atual_nome = 'Local Nossa Senhora de Fátima',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Ederson Krause',
      'Irmão Ederson Krause',
      'Irmão Ederson Krause',
      'Irmão',
      '1987-01-19',
      'ederson.krause@hotmail.com',
      'Local Nossa Senhora de Fátima',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial Nossa Senhora Aparecida' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Itaianan Bazza Vieira'))
     OR ('itaianan@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'itaianan@gmail.com' OR lower(trim(email_pessoal)) = 'itaianan@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Irmão Itaianan Bazza Vieira',
        grau = 'Irmão',
        data_nascimento = COALESCE(data_nascimento, '1985-11-11'),
        email_institucional = COALESCE(email_institucional, 'itaianan@gmail.com'),
        comunidade_atual_nome = 'Territorial Nossa Senhora Aparecida',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Itaianan Bazza Vieira',
      'Irmão Itaianan Bazza Vieira',
      'Irmão Itaianan Bazza Vieira',
      'Irmão',
      '1985-11-11',
      'itaianan@gmail.com',
      'Territorial Nossa Senhora Aparecida',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Santa Rita de Cássia' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Ademir Wickert'))
     OR ('ademir.wickert@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'ademir.wickert@gmail.com' OR lower(trim(email_pessoal)) = 'ademir.wickert@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Ademir Wickert',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1975-01-06'),
        email_institucional = COALESCE(email_institucional, 'ademir.wickert@gmail.com'),
        comunidade_atual_nome = 'Local Santa Rita de Cássia',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Ademir Wickert',
      'Padre Ademir Wickert',
      'Padre Ademir Wickert',
      'Padre',
      '1975-01-06',
      'ademir.wickert@gmail.com',
      'Local Santa Rita de Cássia',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São Luís Gonzaga' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Adilson José Colombi'))
     OR ('colombiadilson@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'colombiadilson@gmail.com' OR lower(trim(email_pessoal)) = 'colombiadilson@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Adilson José Colombi',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1942-07-15'),
        email_institucional = COALESCE(email_institucional, 'colombiadilson@gmail.com'),
        comunidade_atual_nome = 'Local São Luís Gonzaga',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Adilson José Colombi',
      'Padre Adilson José Colombi',
      'Padre Adilson José Colombi',
      'Padre',
      '1942-07-15',
      'colombiadilson@gmail.com',
      'Local São Luís Gonzaga',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial São Judas Tadeu' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Afonso Molinari'))
     OR ('afmolinari@yahoo.com.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'afmolinari@yahoo.com.br' OR lower(trim(email_pessoal)) = 'afmolinari@yahoo.com.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Afonso Molinari',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1972-02-16'),
        email_institucional = COALESCE(email_institucional, 'afmolinari@yahoo.com.br'),
        comunidade_atual_nome = 'Territorial São Judas Tadeu',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Afonso Molinari',
      'Padre Afonso Molinari',
      'Padre Afonso Molinari',
      'Padre',
      '1972-02-16',
      'afmolinari@yahoo.com.br',
      'Territorial São Judas Tadeu',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Padre Gabriel Lux' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Airton Franzner'))
     OR ('airtonscj@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'airtonscj@hotmail.com' OR lower(trim(email_pessoal)) = 'airtonscj@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Airton Franzner',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1955-04-23'),
        email_institucional = COALESCE(email_institucional, 'airtonscj@hotmail.com'),
        comunidade_atual_nome = 'Local Padre Gabriel Lux',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Airton Franzner',
      'Padre Airton Franzner',
      'Padre Airton Franzner',
      'Padre',
      '1955-04-23',
      'airtonscj@hotmail.com',
      'Local Padre Gabriel Lux',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Nossa Senhora de Fátima' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Alberto Luiz Huber'))
     OR ('albertoluizhuber@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'albertoluizhuber@gmail.com' OR lower(trim(email_pessoal)) = 'albertoluizhuber@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Alberto Luiz Huber',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1946-09-16'),
        email_institucional = COALESCE(email_institucional, 'albertoluizhuber@gmail.com'),
        comunidade_atual_nome = 'Local Nossa Senhora de Fátima',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Alberto Luiz Huber',
      'Padre Alberto Luiz Huber',
      'Padre Alberto Luiz Huber',
      'Padre',
      '1946-09-16',
      'albertoluizhuber@gmail.com',
      'Local Nossa Senhora de Fátima',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial São Judas Tadeu' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Alceu Luiz Weber'))
     OR ('alceuluizweber@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'alceuluizweber@gmail.com' OR lower(trim(email_pessoal)) = 'alceuluizweber@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Alceu Luiz Weber',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1959-09-09'),
        email_institucional = COALESCE(email_institucional, 'alceuluizweber@gmail.com'),
        comunidade_atual_nome = 'Territorial São Judas Tadeu',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Alceu Luiz Weber',
      'Padre Alceu Luiz Weber',
      'Padre Alceu Luiz Weber',
      'Padre',
      '1959-09-09',
      'alceuluizweber@gmail.com',
      'Territorial São Judas Tadeu',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial São Miguel' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Aldo Cícero Lisboa'))
     OR ('aldocicerolisboa@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'aldocicerolisboa@gmail.com' OR lower(trim(email_pessoal)) = 'aldocicerolisboa@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Aldo Cícero Lisboa',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1984-04-09'),
        email_institucional = COALESCE(email_institucional, 'aldocicerolisboa@gmail.com'),
        comunidade_atual_nome = 'Territorial São Miguel',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Aldo Cícero Lisboa',
      'Padre Aldo Cícero Lisboa',
      'Padre Aldo Cícero Lisboa',
      'Padre',
      '1984-04-09',
      'aldocicerolisboa@gmail.com',
      'Territorial São Miguel',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Sagrado Coração de Jesus' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Aléssio da Rosa'))
     OR ('alessiosc@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'alessiosc@gmail.com' OR lower(trim(email_pessoal)) = 'alessiosc@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Aléssio da Rosa',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1974-03-28'),
        email_institucional = COALESCE(email_institucional, 'alessiosc@gmail.com'),
        comunidade_atual_nome = 'Local Sagrado Coração de Jesus',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Aléssio da Rosa',
      'Padre Aléssio da Rosa',
      'Padre Aléssio da Rosa',
      'Padre',
      '1974-03-28',
      'alessiosc@gmail.com',
      'Local Sagrado Coração de Jesus',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial Nossa Senhora Aparecida' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Alexandre Barbosa'))
     OR ('ale_barbosa01@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'ale_barbosa01@hotmail.com' OR lower(trim(email_pessoal)) = 'ale_barbosa01@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Alexandre Barbosa',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1986-05-15'),
        email_institucional = COALESCE(email_institucional, 'ale_barbosa01@hotmail.com'),
        comunidade_atual_nome = 'Territorial Nossa Senhora Aparecida',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Alexandre Barbosa',
      'Padre Alexandre Barbosa',
      'Padre Alexandre Barbosa',
      'Padre',
      '1986-05-15',
      'ale_barbosa01@hotmail.com',
      'Territorial Nossa Senhora Aparecida',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Padre Gabriel Lux' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Alírio José Pedrini'))
     OR ('padrealirio@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'padrealirio@gmail.com' OR lower(trim(email_pessoal)) = 'padrealirio@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Alírio José Pedrini',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1938-03-24'),
        email_institucional = COALESCE(email_institucional, 'padrealirio@gmail.com'),
        comunidade_atual_nome = 'Local Padre Gabriel Lux',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Alírio José Pedrini',
      'Padre Alírio José Pedrini',
      'Padre Alírio José Pedrini',
      'Padre',
      '1938-03-24',
      'padrealirio@gmail.com',
      'Local Padre Gabriel Lux',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Puríssimo Coração de Maria' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Anderson Carlos S. Viana'))
     OR ('anderson_csv@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'anderson_csv@hotmail.com' OR lower(trim(email_pessoal)) = 'anderson_csv@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Anderson Carlos S. Viana',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1991-09-01'),
        email_institucional = COALESCE(email_institucional, 'anderson_csv@hotmail.com'),
        comunidade_atual_nome = 'Local Puríssimo Coração de Maria',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Anderson Carlos S. Viana',
      'Padre Anderson Carlos S. Viana',
      'Padre Anderson Carlos S. Viana',
      'Padre',
      '1991-09-01',
      'anderson_csv@hotmail.com',
      'Local Puríssimo Coração de Maria',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial Venerável Servo de Deus Padre Aloísio Boeing' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('André Borges da Silva'))
     OR ('abstche@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'abstche@gmail.com' OR lower(trim(email_pessoal)) = 'abstche@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre André Borges da Silva',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1980-02-29'),
        email_institucional = COALESCE(email_institucional, 'abstche@gmail.com'),
        comunidade_atual_nome = 'Territorial Venerável Servo de Deus Padre Aloísio Boeing',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'André Borges da Silva',
      'Padre André Borges da Silva',
      'Padre André Borges da Silva',
      'Padre',
      '1980-02-29',
      'abstche@gmail.com',
      'Territorial Venerável Servo de Deus Padre Aloísio Boeing',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial Venerável Servo de Deus Padre Aloísio Boeing' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Anésio Dalcastagner'))
     OR ('dalcastagner@icloud.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'dalcastagner@icloud.com' OR lower(trim(email_pessoal)) = 'dalcastagner@icloud.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Anésio Dalcastagner',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1968-05-01'),
        email_institucional = COALESCE(email_institucional, 'dalcastagner@icloud.com'),
        comunidade_atual_nome = 'Territorial Venerável Servo de Deus Padre Aloísio Boeing',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Anésio Dalcastagner',
      'Padre Anésio Dalcastagner',
      'Padre Anésio Dalcastagner',
      'Padre',
      '1968-05-01',
      'dalcastagner@icloud.com',
      'Territorial Venerável Servo de Deus Padre Aloísio Boeing',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Padre Dehon' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Anísio José Schwirkowski'))
     OR ('anisioscj@yahoo.com.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'anisioscj@yahoo.com.br' OR lower(trim(email_pessoal)) = 'anisioscj@yahoo.com.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Anísio José Schwirkowski',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1971-09-30'),
        email_institucional = COALESCE(email_institucional, 'anisioscj@yahoo.com.br'),
        comunidade_atual_nome = 'Local Padre Dehon',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Anísio José Schwirkowski',
      'Padre Anísio José Schwirkowski',
      'Padre Anísio José Schwirkowski',
      'Padre',
      '1971-09-30',
      'anisioscj@yahoo.com.br',
      'Local Padre Dehon',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial São Judas Tadeu' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Ari João Erthal'))
     OR ('ari.erthal@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'ari.erthal@gmail.com' OR lower(trim(email_pessoal)) = 'ari.erthal@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Ari João Erthal',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1971-12-17'),
        email_institucional = COALESCE(email_institucional, 'ari.erthal@gmail.com'),
        comunidade_atual_nome = 'Territorial São Judas Tadeu',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Ari João Erthal',
      'Padre Ari João Erthal',
      'Padre Ari João Erthal',
      'Padre',
      '1971-12-17',
      'ari.erthal@gmail.com',
      'Territorial São Judas Tadeu',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Ausente da Congregação' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Arildo José Ferrari'))
     OR ('padrearildo@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'padrearildo@gmail.com' OR lower(trim(email_pessoal)) = 'padrearildo@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Arildo José Ferrari',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1971-11-24'),
        email_institucional = COALESCE(email_institucional, 'padrearildo@gmail.com'),
        comunidade_atual_nome = 'Ausente da Congregação',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ausente',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Arildo José Ferrari',
      'Padre Arildo José Ferrari',
      'Padre Arildo José Ferrari',
      'Padre',
      '1971-11-24',
      'padrearildo@gmail.com',
      'Ausente da Congregação',
      v_com_id,
      'Ausente',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São Sebastião' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Aurélio Pereira'))
     OR ('aurelioguarani@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'aurelioguarani@gmail.com' OR lower(trim(email_pessoal)) = 'aurelioguarani@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Aurélio Pereira',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1961-01-22'),
        email_institucional = COALESCE(email_institucional, 'aurelioguarani@gmail.com'),
        comunidade_atual_nome = 'Local São Sebastião',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Aurélio Pereira',
      'Padre Aurélio Pereira',
      'Padre Aurélio Pereira',
      'Padre',
      '1961-01-22',
      'aurelioguarani@gmail.com',
      'Local São Sebastião',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial Nossa Senhora Aparecida' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Bala Jojappa Kakumanu'))
     OR ('kbjojappascj@yahoo.co.in' IS NOT NULL AND (lower(trim(email_institucional)) = 'kbjojappascj@yahoo.co.in' OR lower(trim(email_pessoal)) = 'kbjojappascj@yahoo.co.in'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Bala Jojappa Kakumanu',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1983-10-22'),
        email_institucional = COALESCE(email_institucional, 'kbjojappascj@yahoo.co.in'),
        comunidade_atual_nome = 'Territorial Nossa Senhora Aparecida',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Bala Jojappa Kakumanu',
      'Padre Bala Jojappa Kakumanu',
      'Padre Bala Jojappa Kakumanu',
      'Padre',
      '1983-10-22',
      'kbjojappascj@yahoo.co.in',
      'Territorial Nossa Senhora Aparecida',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São José' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Carlos Alberto Rodrigues'))
     OR ('betoscj@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'betoscj@gmail.com' OR lower(trim(email_pessoal)) = 'betoscj@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Carlos Alberto Rodrigues',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1966-11-28'),
        email_institucional = COALESCE(email_institucional, 'betoscj@gmail.com'),
        comunidade_atual_nome = 'Local São José',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Carlos Alberto Rodrigues',
      'Padre Carlos Alberto Rodrigues',
      'Padre Carlos Alberto Rodrigues',
      'Padre',
      '1966-11-28',
      'betoscj@gmail.com',
      'Local São José',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São Sebastião' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Carlos Marcos Nicolodelli'))
     OR ('nicolodelli7@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'nicolodelli7@gmail.com' OR lower(trim(email_pessoal)) = 'nicolodelli7@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Carlos Marcos Nicolodelli',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1949-10-12'),
        email_institucional = COALESCE(email_institucional, 'nicolodelli7@gmail.com'),
        comunidade_atual_nome = 'Local São Sebastião',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Carlos Marcos Nicolodelli',
      'Padre Carlos Marcos Nicolodelli',
      'Padre Carlos Marcos Nicolodelli',
      'Padre',
      '1949-10-12',
      'nicolodelli7@gmail.com',
      'Local São Sebastião',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Ausente da Congregação' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Carlos Roberto de Oliveira'))
     OR ('carlosrobertoscj@yahoo.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'carlosrobertoscj@yahoo.com' OR lower(trim(email_pessoal)) = 'carlosrobertoscj@yahoo.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Carlos Roberto de Oliveira',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1980-11-27'),
        email_institucional = COALESCE(email_institucional, 'carlosrobertoscj@yahoo.com'),
        comunidade_atual_nome = 'Ausente da Congregação',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ausente',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Carlos Roberto de Oliveira',
      'Padre Carlos Roberto de Oliveira',
      'Padre Carlos Roberto de Oliveira',
      'Padre',
      '1980-11-27',
      'carlosrobertoscj@yahoo.com',
      'Ausente da Congregação',
      v_com_id,
      'Ausente',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial São Miguel' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Cenário Ervino Hanauer'))
     OR (NULL IS NOT NULL AND (lower(trim(email_institucional)) = NULL OR lower(trim(email_pessoal)) = NULL))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Cenário Ervino Hanauer',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1950-12-16'),
        email_institucional = COALESCE(email_institucional, NULL),
        comunidade_atual_nome = 'Territorial São Miguel',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Cenário Ervino Hanauer',
      'Padre Cenário Ervino Hanauer',
      'Padre Cenário Ervino Hanauer',
      'Padre',
      '1950-12-16',
      NULL,
      'Territorial São Miguel',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Missão Paraguai' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Cezar Augusto Hammes'))
     OR ('frcezar@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'frcezar@hotmail.com' OR lower(trim(email_pessoal)) = 'frcezar@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Cezar Augusto Hammes',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1971-06-19'),
        email_institucional = COALESCE(email_institucional, 'frcezar@hotmail.com'),
        comunidade_atual_nome = 'Missão Paraguai',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Cezar Augusto Hammes',
      'Padre Cezar Augusto Hammes',
      'Padre Cezar Augusto Hammes',
      'Padre',
      '1971-06-19',
      'frcezar@hotmail.com',
      'Missão Paraguai',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Padre Gabriel Lux' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Cícero Celeste Murara'))
     OR ('cicero.murara@esic.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'cicero.murara@esic.br' OR lower(trim(email_pessoal)) = 'cicero.murara@esic.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Cícero Celeste Murara',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1971-09-08'),
        email_institucional = COALESCE(email_institucional, 'cicero.murara@esic.br'),
        comunidade_atual_nome = 'Local Padre Gabriel Lux',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Cícero Celeste Murara',
      'Padre Cícero Celeste Murara',
      'Padre Cícero Celeste Murara',
      'Padre',
      '1971-09-08',
      'cicero.murara@esic.br',
      'Local Padre Gabriel Lux',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São Luís Gonzaga' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Cláudio Márcio Piontkewicz'))
     OR ('claudinhoscj@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'claudinhoscj@gmail.com' OR lower(trim(email_pessoal)) = 'claudinhoscj@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Cláudio Márcio Piontkewicz',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1972-12-01'),
        email_institucional = COALESCE(email_institucional, 'claudinhoscj@gmail.com'),
        comunidade_atual_nome = 'Local São Luís Gonzaga',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Cláudio Márcio Piontkewicz',
      'Padre Cláudio Márcio Piontkewicz',
      'Padre Cláudio Márcio Piontkewicz',
      'Padre',
      '1972-12-01',
      'claudinhoscj@gmail.com',
      'Local São Luís Gonzaga',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Sagrado Coração de Jesus' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Cristiano Tiago Araújo'))
     OR ('padretiagoscj@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'padretiagoscj@gmail.com' OR lower(trim(email_pessoal)) = 'padretiagoscj@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Cristiano Tiago Araújo',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1986-05-12'),
        email_institucional = COALESCE(email_institucional, 'padretiagoscj@gmail.com'),
        comunidade_atual_nome = 'Local Sagrado Coração de Jesus',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Cristiano Tiago Araújo',
      'Padre Cristiano Tiago Araújo',
      'Padre Cristiano Tiago Araújo',
      'Padre',
      '1986-05-12',
      'padretiagoscj@gmail.com',
      'Local Sagrado Coração de Jesus',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Roma — Cúria Geral / Colégio Leone Dehon' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Darlan Dejaime Marasca'))
     OR ('d.marasca@yahoo.com.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'd.marasca@yahoo.com.br' OR lower(trim(email_pessoal)) = 'd.marasca@yahoo.com.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Darlan Dejaime Marasca',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1989-01-17'),
        email_institucional = COALESCE(email_institucional, 'd.marasca@yahoo.com.br'),
        comunidade_atual_nome = 'Roma — Cúria Geral / Colégio Leone Dehon',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Darlan Dejaime Marasca',
      'Padre Darlan Dejaime Marasca',
      'Padre Darlan Dejaime Marasca',
      'Padre',
      '1989-01-17',
      'd.marasca@yahoo.com.br',
      'Roma — Cúria Geral / Colégio Leone Dehon',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Diego Martins'))
     OR ('diego_scj@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'diego_scj@hotmail.com' OR lower(trim(email_pessoal)) = 'diego_scj@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Diego Martins',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1988-05-21'),
        email_institucional = COALESCE(email_institucional, 'diego_scj@hotmail.com'),
        comunidade_atual_nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Diego Martins',
      'Padre Diego Martins',
      'Padre Diego Martins',
      'Padre',
      '1988-05-21',
      'diego_scj@hotmail.com',
      'Territorial de Rondônia – Nossa Senhora de Nazaré',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São Luís Gonzaga' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Diomar Romaniv'))
     OR ('diomarscj@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'diomarscj@hotmail.com' OR lower(trim(email_pessoal)) = 'diomarscj@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Diomar Romaniv',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1983-05-27'),
        email_institucional = COALESCE(email_institucional, 'diomarscj@hotmail.com'),
        comunidade_atual_nome = 'Local São Luís Gonzaga',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Diomar Romaniv',
      'Padre Diomar Romaniv',
      'Padre Diomar Romaniv',
      'Padre',
      '1983-05-27',
      'diomarscj@hotmail.com',
      'Local São Luís Gonzaga',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Ausente da Congregação' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Elinton Costa'))
     OR (NULL IS NOT NULL AND (lower(trim(email_institucional)) = NULL OR lower(trim(email_pessoal)) = NULL))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Elinton Costa',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1984-01-05'),
        email_institucional = COALESCE(email_institucional, NULL),
        comunidade_atual_nome = 'Ausente da Congregação',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ausente',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Elinton Costa',
      'Padre Elinton Costa',
      'Padre Elinton Costa',
      'Padre',
      '1984-01-05',
      NULL,
      'Ausente da Congregação',
      v_com_id,
      'Ausente',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Padre Gabriel Lux' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Elói Comper'))
     OR ('eloiscj@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'eloiscj@gmail.com' OR lower(trim(email_pessoal)) = 'eloiscj@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Elói Comper',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1956-05-04'),
        email_institucional = COALESCE(email_institucional, 'eloiscj@gmail.com'),
        comunidade_atual_nome = 'Local Padre Gabriel Lux',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Elói Comper',
      'Padre Elói Comper',
      'Padre Elói Comper',
      'Padre',
      '1956-05-04',
      'eloiscj@gmail.com',
      'Local Padre Gabriel Lux',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial São Miguel' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Elói José Schons'))
     OR ('eloijschons@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'eloijschons@gmail.com' OR lower(trim(email_pessoal)) = 'eloijschons@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Elói José Schons',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1953-12-11'),
        email_institucional = COALESCE(email_institucional, 'eloijschons@gmail.com'),
        comunidade_atual_nome = 'Territorial São Miguel',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Elói José Schons',
      'Padre Elói José Schons',
      'Padre Elói José Schons',
      'Padre',
      '1953-12-11',
      'eloijschons@gmail.com',
      'Territorial São Miguel',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São José' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Emerson Guimarães'))
     OR ('emer_guima@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'emer_guima@hotmail.com' OR lower(trim(email_pessoal)) = 'emer_guima@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Emerson Guimarães',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1972-10-29'),
        email_institucional = COALESCE(email_institucional, 'emer_guima@hotmail.com'),
        comunidade_atual_nome = 'Local São José',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Emerson Guimarães',
      'Padre Emerson Guimarães',
      'Padre Emerson Guimarães',
      'Padre',
      '1972-10-29',
      'emer_guima@hotmail.com',
      'Local São José',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Nossa Senhora de Fátima' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Fábio Luiz Pereira'))
     OR ('fabioluizscj@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'fabioluizscj@gmail.com' OR lower(trim(email_pessoal)) = 'fabioluizscj@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Fábio Luiz Pereira',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1986-09-26'),
        email_institucional = COALESCE(email_institucional, 'fabioluizscj@gmail.com'),
        comunidade_atual_nome = 'Local Nossa Senhora de Fátima',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Fábio Luiz Pereira',
      'Padre Fábio Luiz Pereira',
      'Padre Fábio Luiz Pereira',
      'Padre',
      '1986-09-26',
      'fabioluizscj@gmail.com',
      'Local Nossa Senhora de Fátima',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Fagner Ramon Pacheco Haas'))
     OR ('pachecoscj@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'pachecoscj@gmail.com' OR lower(trim(email_pessoal)) = 'pachecoscj@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Fagner Ramon Pacheco Haas',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1992-08-25'),
        email_institucional = COALESCE(email_institucional, 'pachecoscj@gmail.com'),
        comunidade_atual_nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Fagner Ramon Pacheco Haas',
      'Padre Fagner Ramon Pacheco Haas',
      'Padre Fagner Ramon Pacheco Haas',
      'Padre',
      '1992-08-25',
      'pachecoscj@gmail.com',
      'Territorial de Rondônia – Nossa Senhora de Nazaré',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Sagrado Coração de Jesus' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Fernando Teckler'))
     OR ('fernandoteckler@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'fernandoteckler@gmail.com' OR lower(trim(email_pessoal)) = 'fernandoteckler@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Fernando Teckler',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1995-06-27'),
        email_institucional = COALESCE(email_institucional, 'fernandoteckler@gmail.com'),
        comunidade_atual_nome = 'Local Sagrado Coração de Jesus',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Fernando Teckler',
      'Padre Fernando Teckler',
      'Padre Fernando Teckler',
      'Padre',
      '1995-06-27',
      'fernandoteckler@gmail.com',
      'Local Sagrado Coração de Jesus',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial São Judas Tadeu' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Francisco Lawall'))
     OR ('franclawal@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'franclawal@gmail.com' OR lower(trim(email_pessoal)) = 'franclawal@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Francisco Lawall',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1964-01-12'),
        email_institucional = COALESCE(email_institucional, 'franclawal@gmail.com'),
        comunidade_atual_nome = 'Territorial São Judas Tadeu',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Francisco Lawall',
      'Padre Francisco Lawall',
      'Padre Francisco Lawall',
      'Padre',
      '1964-01-12',
      'franclawal@gmail.com',
      'Territorial São Judas Tadeu',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial São Miguel' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Galdino Becker'))
     OR ('galdino.becker@brm.org.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'galdino.becker@brm.org.br' OR lower(trim(email_pessoal)) = 'galdino.becker@brm.org.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Galdino Becker',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1931-07-24'),
        email_institucional = COALESCE(email_institucional, 'galdino.becker@brm.org.br'),
        comunidade_atual_nome = 'Territorial São Miguel',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Galdino Becker',
      'Padre Galdino Becker',
      'Padre Galdino Becker',
      'Padre',
      '1931-07-24',
      'galdino.becker@brm.org.br',
      'Territorial São Miguel',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Santa Margarida Maria' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Geraldo Kohler'))
     OR ('pgkohler@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'pgkohler@hotmail.com' OR lower(trim(email_pessoal)) = 'pgkohler@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Geraldo Kohler',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1952-01-08'),
        email_institucional = COALESCE(email_institucional, 'pgkohler@hotmail.com'),
        comunidade_atual_nome = 'Local Santa Margarida Maria',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Geraldo Kohler',
      'Padre Geraldo Kohler',
      'Padre Geraldo Kohler',
      'Padre',
      '1952-01-08',
      'pgkohler@hotmail.com',
      'Local Santa Margarida Maria',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Gilberto Bonato Xavier'))
     OR ('bonatoscj@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'bonatoscj@gmail.com' OR lower(trim(email_pessoal)) = 'bonatoscj@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Gilberto Bonato Xavier',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1961-12-08'),
        email_institucional = COALESCE(email_institucional, 'bonatoscj@gmail.com'),
        comunidade_atual_nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Gilberto Bonato Xavier',
      'Padre Gilberto Bonato Xavier',
      'Padre Gilberto Bonato Xavier',
      'Padre',
      '1961-12-08',
      'bonatoscj@gmail.com',
      'Territorial de Rondônia – Nossa Senhora de Nazaré',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial São Miguel' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Gilberto Luiz R. de Miranda'))
     OR ('giba.luiz@yahoo.com.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'giba.luiz@yahoo.com.br' OR lower(trim(email_pessoal)) = 'giba.luiz@yahoo.com.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Gilberto Luiz R. de Miranda',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1968-06-28'),
        email_institucional = COALESCE(email_institucional, 'giba.luiz@yahoo.com.br'),
        comunidade_atual_nome = 'Territorial São Miguel',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Gilberto Luiz R. de Miranda',
      'Padre Gilberto Luiz R. de Miranda',
      'Padre Gilberto Luiz R. de Miranda',
      'Padre',
      '1968-06-28',
      'giba.luiz@yahoo.com.br',
      'Territorial São Miguel',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São José' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Gilberto Moisés Bohn Mittelstead'))
     OR ('mittelstaed6@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'mittelstaed6@gmail.com' OR lower(trim(email_pessoal)) = 'mittelstaed6@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Gilberto Moisés Bohn Mittelstead',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1978-04-26'),
        email_institucional = COALESCE(email_institucional, 'mittelstaed6@gmail.com'),
        comunidade_atual_nome = 'Local São José',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Gilberto Moisés Bohn Mittelstead',
      'Padre Gilberto Moisés Bohn Mittelstead',
      'Padre Gilberto Moisés Bohn Mittelstead',
      'Padre',
      '1978-04-26',
      'mittelstaed6@gmail.com',
      'Local São José',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Santa Rita de Cássia' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Giovani Pontes'))
     OR ('gio_pontes@yahoo.com.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'gio_pontes@yahoo.com.br' OR lower(trim(email_pessoal)) = 'gio_pontes@yahoo.com.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Giovani Pontes',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1963-12-20'),
        email_institucional = COALESCE(email_institucional, 'gio_pontes@yahoo.com.br'),
        comunidade_atual_nome = 'Local Santa Rita de Cássia',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Giovani Pontes',
      'Padre Giovani Pontes',
      'Padre Giovani Pontes',
      'Padre',
      '1963-12-20',
      'gio_pontes@yahoo.com.br',
      'Local Santa Rita de Cássia',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São Luís Gonzaga' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Hélio Feuser'))
     OR ('heliofeuser@yahoo.com.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'heliofeuser@yahoo.com.br' OR lower(trim(email_pessoal)) = 'heliofeuser@yahoo.com.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Hélio Feuser',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1966-11-30'),
        email_institucional = COALESCE(email_institucional, 'heliofeuser@yahoo.com.br'),
        comunidade_atual_nome = 'Local São Luís Gonzaga',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Hélio Feuser',
      'Padre Hélio Feuser',
      'Padre Hélio Feuser',
      'Padre',
      '1966-11-30',
      'heliofeuser@yahoo.com.br',
      'Local São Luís Gonzaga',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Santa Rita de Cássia' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Itamar José Zigowski'))
     OR ('peitajose@yahoo.com.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'peitajose@yahoo.com.br' OR lower(trim(email_pessoal)) = 'peitajose@yahoo.com.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Itamar José Zigowski',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1967-09-02'),
        email_institucional = COALESCE(email_institucional, 'peitajose@yahoo.com.br'),
        comunidade_atual_nome = 'Local Santa Rita de Cássia',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Itamar José Zigowski',
      'Padre Itamar José Zigowski',
      'Padre Itamar José Zigowski',
      'Padre',
      '1967-09-02',
      'peitajose@yahoo.com.br',
      'Local Santa Rita de Cássia',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São Luís Gonzaga' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Jaime Ludwig'))
     OR ('scjjaimeludwig@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'scjjaimeludwig@gmail.com' OR lower(trim(email_pessoal)) = 'scjjaimeludwig@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Jaime Ludwig',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1981-12-14'),
        email_institucional = COALESCE(email_institucional, 'scjjaimeludwig@gmail.com'),
        comunidade_atual_nome = 'Local São Luís Gonzaga',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Jaime Ludwig',
      'Padre Jaime Ludwig',
      'Padre Jaime Ludwig',
      'Padre',
      '1981-12-14',
      'scjjaimeludwig@gmail.com',
      'Local São Luís Gonzaga',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Padre Gabriel Lux' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Jair Rodrigues Costa'))
     OR ('jair.costa@brm.org.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'jair.costa@brm.org.br' OR lower(trim(email_pessoal)) = 'jair.costa@brm.org.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Jair Rodrigues Costa',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1953-08-29'),
        email_institucional = COALESCE(email_institucional, 'jair.costa@brm.org.br'),
        comunidade_atual_nome = 'Local Padre Gabriel Lux',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Jair Rodrigues Costa',
      'Padre Jair Rodrigues Costa',
      'Padre Jair Rodrigues Costa',
      'Padre',
      '1953-08-29',
      'jair.costa@brm.org.br',
      'Local Padre Gabriel Lux',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Padre Gabriel Lux' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('João Sebastião Boeing'))
     OR ('joao.boeing@brm.org.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'joao.boeing@brm.org.br' OR lower(trim(email_pessoal)) = 'joao.boeing@brm.org.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre João Sebastião Boeing',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1953-05-17'),
        email_institucional = COALESCE(email_institucional, 'joao.boeing@brm.org.br'),
        comunidade_atual_nome = 'Local Padre Gabriel Lux',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'João Sebastião Boeing',
      'Padre João Sebastião Boeing',
      'Padre João Sebastião Boeing',
      'Padre',
      '1953-05-17',
      'joao.boeing@brm.org.br',
      'Local Padre Gabriel Lux',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Santa Rita de Cássia' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('José Francisco Alves'))
     OR ('jfa.scj@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'jfa.scj@gmail.com' OR lower(trim(email_pessoal)) = 'jfa.scj@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre José Francisco Alves',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1947-12-25'),
        email_institucional = COALESCE(email_institucional, 'jfa.scj@gmail.com'),
        comunidade_atual_nome = 'Local Santa Rita de Cássia',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'José Francisco Alves',
      'Padre José Francisco Alves',
      'Padre José Francisco Alves',
      'Padre',
      '1947-12-25',
      'jfa.scj@gmail.com',
      'Local Santa Rita de Cássia',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São Sebastião' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('José Napoleão Laureano dos Santos'))
     OR ('penapoleaoscj@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'penapoleaoscj@gmail.com' OR lower(trim(email_pessoal)) = 'penapoleaoscj@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre José Napoleão Laureano dos Santos',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1952-10-14'),
        email_institucional = COALESCE(email_institucional, 'penapoleaoscj@gmail.com'),
        comunidade_atual_nome = 'Local São Sebastião',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'José Napoleão Laureano dos Santos',
      'Padre José Napoleão Laureano dos Santos',
      'Padre José Napoleão Laureano dos Santos',
      'Padre',
      '1952-10-14',
      'penapoleaoscj@gmail.com',
      'Local São Sebastião',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São José' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('José Ricardo H. Zorer'))
     OR ('josezscj@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'josezscj@gmail.com' OR lower(trim(email_pessoal)) = 'josezscj@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre José Ricardo H. Zorer',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1996-04-30'),
        email_institucional = COALESCE(email_institucional, 'josezscj@gmail.com'),
        comunidade_atual_nome = 'Local São José',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'José Ricardo H. Zorer',
      'Padre José Ricardo H. Zorer',
      'Padre José Ricardo H. Zorer',
      'Padre',
      '1996-04-30',
      'josezscj@gmail.com',
      'Local São José',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Roma — Cúria Geral / Colégio Leone Dehon' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Josimar Baggio'))
     OR ('josimarscj@yahoo.com.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'josimarscj@yahoo.com.br' OR lower(trim(email_pessoal)) = 'josimarscj@yahoo.com.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Josimar Baggio',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1986-08-23'),
        email_institucional = COALESCE(email_institucional, 'josimarscj@yahoo.com.br'),
        comunidade_atual_nome = 'Roma — Cúria Geral / Colégio Leone Dehon',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Josimar Baggio',
      'Padre Josimar Baggio',
      'Padre Josimar Baggio',
      'Padre',
      '1986-08-23',
      'josimarscj@yahoo.com.br',
      'Roma — Cúria Geral / Colégio Leone Dehon',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São Sebastião' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Kleber Ferreira de Oliveira'))
     OR ('kleberscjsul@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'kleberscjsul@gmail.com' OR lower(trim(email_pessoal)) = 'kleberscjsul@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Kleber Ferreira de Oliveira',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1963-08-30'),
        email_institucional = COALESCE(email_institucional, 'kleberscjsul@gmail.com'),
        comunidade_atual_nome = 'Local São Sebastião',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Kleber Ferreira de Oliveira',
      'Padre Kleber Ferreira de Oliveira',
      'Padre Kleber Ferreira de Oliveira',
      'Padre',
      '1963-08-30',
      'kleberscjsul@gmail.com',
      'Local São Sebastião',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São Sebastião' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Léo Heck'))
     OR ('pleoscj@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'pleoscj@hotmail.com' OR lower(trim(email_pessoal)) = 'pleoscj@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Léo Heck',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1953-10-26'),
        email_institucional = COALESCE(email_institucional, 'pleoscj@hotmail.com'),
        comunidade_atual_nome = 'Local São Sebastião',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Léo Heck',
      'Padre Léo Heck',
      'Padre Léo Heck',
      'Padre',
      '1953-10-26',
      'pleoscj@hotmail.com',
      'Local São Sebastião',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Conventinho SCJ' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Leonardo Jacomelli'))
     OR ('jacomelli10@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'jacomelli10@hotmail.com' OR lower(trim(email_pessoal)) = 'jacomelli10@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Leonardo Jacomelli',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1995-07-20'),
        email_institucional = COALESCE(email_institucional, 'jacomelli10@hotmail.com'),
        comunidade_atual_nome = 'Conventinho SCJ',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Leonardo Jacomelli',
      'Padre Leonardo Jacomelli',
      'Padre Leonardo Jacomelli',
      'Padre',
      '1995-07-20',
      'jacomelli10@hotmail.com',
      'Conventinho SCJ',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São Luís Gonzaga' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Lindolfo Neves Braga'))
     OR ('lindolfoneves@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'lindolfoneves@hotmail.com' OR lower(trim(email_pessoal)) = 'lindolfoneves@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Lindolfo Neves Braga',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1964-07-27'),
        email_institucional = COALESCE(email_institucional, 'lindolfoneves@hotmail.com'),
        comunidade_atual_nome = 'Local São Luís Gonzaga',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Lindolfo Neves Braga',
      'Padre Lindolfo Neves Braga',
      'Padre Lindolfo Neves Braga',
      'Padre',
      '1964-07-27',
      'lindolfoneves@hotmail.com',
      'Local São Luís Gonzaga',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Sagrado Coração de Jesus' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Lucas Ignacio Scheid'))
     OR ('pelucas.scheid@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'pelucas.scheid@hotmail.com' OR lower(trim(email_pessoal)) = 'pelucas.scheid@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Lucas Ignacio Scheid',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1939-11-14'),
        email_institucional = COALESCE(email_institucional, 'pelucas.scheid@hotmail.com'),
        comunidade_atual_nome = 'Local Sagrado Coração de Jesus',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Lucas Ignacio Scheid',
      'Padre Lucas Ignacio Scheid',
      'Padre Lucas Ignacio Scheid',
      'Padre',
      '1939-11-14',
      'pelucas.scheid@hotmail.com',
      'Local Sagrado Coração de Jesus',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Puríssimo Coração de Maria' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Luciano José Toller'))
     OR ('ltollerscj@yahoo.com.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'ltollerscj@yahoo.com.br' OR lower(trim(email_pessoal)) = 'ltollerscj@yahoo.com.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Luciano José Toller',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1977-09-10'),
        email_institucional = COALESCE(email_institucional, 'ltollerscj@yahoo.com.br'),
        comunidade_atual_nome = 'Local Puríssimo Coração de Maria',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Luciano José Toller',
      'Padre Luciano José Toller',
      'Padre Luciano José Toller',
      'Padre',
      '1977-09-10',
      'ltollerscj@yahoo.com.br',
      'Local Puríssimo Coração de Maria',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São Luís Gonzaga' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Luiz Antônio de Faria'))
     OR ('pluizfaria@yahoo.com.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'pluizfaria@yahoo.com.br' OR lower(trim(email_pessoal)) = 'pluizfaria@yahoo.com.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Luiz Antônio de Faria',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1953-03-21'),
        email_institucional = COALESCE(email_institucional, 'pluizfaria@yahoo.com.br'),
        comunidade_atual_nome = 'Local São Luís Gonzaga',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Luiz Antônio de Faria',
      'Padre Luiz Antônio de Faria',
      'Padre Luiz Antônio de Faria',
      'Padre',
      '1953-03-21',
      'pluizfaria@yahoo.com.br',
      'Local São Luís Gonzaga',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Sagrado Coração de Jesus' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Luiz Carlos Berri'))
     OR ('lcberri@outlook.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'lcberri@outlook.com' OR lower(trim(email_pessoal)) = 'lcberri@outlook.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Luiz Carlos Berri',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1958-04-18'),
        email_institucional = COALESCE(email_institucional, 'lcberri@outlook.com'),
        comunidade_atual_nome = 'Local Sagrado Coração de Jesus',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Luiz Carlos Berri',
      'Padre Luiz Carlos Berri',
      'Padre Luiz Carlos Berri',
      'Padre',
      '1958-04-18',
      'lcberri@outlook.com',
      'Local Sagrado Coração de Jesus',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Luiz Mazzochini'))
     OR ('luisscj@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'luisscj@gmail.com' OR lower(trim(email_pessoal)) = 'luisscj@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Luiz Mazzochini',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1980-12-26'),
        email_institucional = COALESCE(email_institucional, 'luisscj@gmail.com'),
        comunidade_atual_nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Luiz Mazzochini',
      'Padre Luiz Mazzochini',
      'Padre Luiz Mazzochini',
      'Padre',
      '1980-12-26',
      'luisscj@gmail.com',
      'Territorial de Rondônia – Nossa Senhora de Nazaré',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Magnos José Baron Caneppele'))
     OR ('mjbcaneppele@yahoo.com.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'mjbcaneppele@yahoo.com.br' OR lower(trim(email_pessoal)) = 'mjbcaneppele@yahoo.com.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Magnos José Baron Caneppele',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1980-04-24'),
        email_institucional = COALESCE(email_institucional, 'mjbcaneppele@yahoo.com.br'),
        comunidade_atual_nome = 'Territorial de Rondônia – Nossa Senhora de Nazaré',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Magnos José Baron Caneppele',
      'Padre Magnos José Baron Caneppele',
      'Padre Magnos José Baron Caneppele',
      'Padre',
      '1980-04-24',
      'mjbcaneppele@yahoo.com.br',
      'Territorial de Rondônia – Nossa Senhora de Nazaré',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Santa Rita de Cássia' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Marcial Maçaneiro'))
     OR ('marcialscj@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'marcialscj@gmail.com' OR lower(trim(email_pessoal)) = 'marcialscj@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Marcial Maçaneiro',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1966-07-16'),
        email_institucional = COALESCE(email_institucional, 'marcialscj@gmail.com'),
        comunidade_atual_nome = 'Local Santa Rita de Cássia',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Marcial Maçaneiro',
      'Padre Marcial Maçaneiro',
      'Padre Marcial Maçaneiro',
      'Padre',
      '1966-07-16',
      'marcialscj@gmail.com',
      'Local Santa Rita de Cássia',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Missão Alemanha' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Márcio Antônio Auth'))
     OR ('marcio.auth@scj.de' IS NOT NULL AND (lower(trim(email_institucional)) = 'marcio.auth@scj.de' OR lower(trim(email_pessoal)) = 'marcio.auth@scj.de'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Márcio Antônio Auth',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1976-06-03'),
        email_institucional = COALESCE(email_institucional, 'marcio.auth@scj.de'),
        comunidade_atual_nome = 'Missão Alemanha',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Márcio Antônio Auth',
      'Padre Márcio Antônio Auth',
      'Padre Márcio Antônio Auth',
      'Padre',
      '1976-06-03',
      'marcio.auth@scj.de',
      'Missão Alemanha',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São Sebastião' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Marcos Antônio Bernardes'))
     OR ('marcos.pdh@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'marcos.pdh@gmail.com' OR lower(trim(email_pessoal)) = 'marcos.pdh@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Marcos Antônio Bernardes',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1989-06-03'),
        email_institucional = COALESCE(email_institucional, 'marcos.pdh@gmail.com'),
        comunidade_atual_nome = 'Local São Sebastião',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Marcos Antônio Bernardes',
      'Padre Marcos Antônio Bernardes',
      'Padre Marcos Antônio Bernardes',
      'Padre',
      '1989-06-03',
      'marcos.pdh@gmail.com',
      'Local São Sebastião',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial Venerável Servo de Deus Padre Aloísio Boeing' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Mariano Weizenmann'))
     OR ('marianoscj@yahoo.com.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'marianoscj@yahoo.com.br' OR lower(trim(email_pessoal)) = 'marianoscj@yahoo.com.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Mariano Weizenmann',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1956-03-24'),
        email_institucional = COALESCE(email_institucional, 'marianoscj@yahoo.com.br'),
        comunidade_atual_nome = 'Territorial Venerável Servo de Deus Padre Aloísio Boeing',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Mariano Weizenmann',
      'Padre Mariano Weizenmann',
      'Padre Mariano Weizenmann',
      'Padre',
      '1956-03-24',
      'marianoscj@yahoo.com.br',
      'Territorial Venerável Servo de Deus Padre Aloísio Boeing',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São Luís Gonzaga' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Marilton Nuss'))
     OR ('mariltonn@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'mariltonn@gmail.com' OR lower(trim(email_pessoal)) = 'mariltonn@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Marilton Nuss',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1968-12-09'),
        email_institucional = COALESCE(email_institucional, 'mariltonn@gmail.com'),
        comunidade_atual_nome = 'Local São Luís Gonzaga',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Marilton Nuss',
      'Padre Marilton Nuss',
      'Padre Marilton Nuss',
      'Padre',
      '1968-12-09',
      'mariltonn@gmail.com',
      'Local São Luís Gonzaga',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São Luís Gonzaga' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Mário Peixe'))
     OR ('pemariopeixe@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'pemariopeixe@gmail.com' OR lower(trim(email_pessoal)) = 'pemariopeixe@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Mário Peixe',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1946-01-07'),
        email_institucional = COALESCE(email_institucional, 'pemariopeixe@gmail.com'),
        comunidade_atual_nome = 'Local São Luís Gonzaga',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Mário Peixe',
      'Padre Mário Peixe',
      'Padre Mário Peixe',
      'Padre',
      '1946-01-07',
      'pemariopeixe@gmail.com',
      'Local São Luís Gonzaga',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Santa Margarida Maria' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Mário Tito Angioletti'))
     OR ('mariotitoscj@yahoo.com.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'mariotitoscj@yahoo.com.br' OR lower(trim(email_pessoal)) = 'mariotitoscj@yahoo.com.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Mário Tito Angioletti',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1967-02-13'),
        email_institucional = COALESCE(email_institucional, 'mariotitoscj@yahoo.com.br'),
        comunidade_atual_nome = 'Local Santa Margarida Maria',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Mário Tito Angioletti',
      'Padre Mário Tito Angioletti',
      'Padre Mário Tito Angioletti',
      'Padre',
      '1967-02-13',
      'mariotitoscj@yahoo.com.br',
      'Local Santa Margarida Maria',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Ausente da Congregação' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Maurídio Weber'))
     OR ('mauridio.weber@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'mauridio.weber@hotmail.com' OR lower(trim(email_pessoal)) = 'mauridio.weber@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Maurídio Weber',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1955-02-27'),
        email_institucional = COALESCE(email_institucional, 'mauridio.weber@hotmail.com'),
        comunidade_atual_nome = 'Ausente da Congregação',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ausente',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Maurídio Weber',
      'Padre Maurídio Weber',
      'Padre Maurídio Weber',
      'Padre',
      '1955-02-27',
      'mauridio.weber@hotmail.com',
      'Ausente da Congregação',
      v_com_id,
      'Ausente',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São José' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Miguel da Silva'))
     OR ('miguel.silva@unifebe.edu.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'miguel.silva@unifebe.edu.br' OR lower(trim(email_pessoal)) = 'miguel.silva@unifebe.edu.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Miguel da Silva',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1974-02-13'),
        email_institucional = COALESCE(email_institucional, 'miguel.silva@unifebe.edu.br'),
        comunidade_atual_nome = 'Local São José',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Miguel da Silva',
      'Padre Miguel da Silva',
      'Padre Miguel da Silva',
      'Padre',
      '1974-02-13',
      'miguel.silva@unifebe.edu.br',
      'Local São José',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Puríssimo Coração de Maria' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Nelson Tachini'))
     OR ('penelsonscj@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'penelsonscj@gmail.com' OR lower(trim(email_pessoal)) = 'penelsonscj@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Nelson Tachini',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1946-01-02'),
        email_institucional = COALESCE(email_institucional, 'penelsonscj@gmail.com'),
        comunidade_atual_nome = 'Local Puríssimo Coração de Maria',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Nelson Tachini',
      'Padre Nelson Tachini',
      'Padre Nelson Tachini',
      'Padre',
      '1946-01-02',
      'penelsonscj@gmail.com',
      'Local Puríssimo Coração de Maria',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Santa Rita de Cássia' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Nilson Hellmann'))
     OR ('nilsonscj@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'nilsonscj@hotmail.com' OR lower(trim(email_pessoal)) = 'nilsonscj@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Nilson Hellmann',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1981-03-02'),
        email_institucional = COALESCE(email_institucional, 'nilsonscj@hotmail.com'),
        comunidade_atual_nome = 'Local Santa Rita de Cássia',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Nilson Hellmann',
      'Padre Nilson Hellmann',
      'Padre Nilson Hellmann',
      'Padre',
      '1981-03-02',
      'nilsonscj@hotmail.com',
      'Local Santa Rita de Cássia',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Padre Dehon' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Nivaldo Alves de Souza'))
     OR ('nivas247@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'nivas247@gmail.com' OR lower(trim(email_pessoal)) = 'nivas247@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Nivaldo Alves de Souza',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1946-11-10'),
        email_institucional = COALESCE(email_institucional, 'nivas247@gmail.com'),
        comunidade_atual_nome = 'Local Padre Dehon',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Nivaldo Alves de Souza',
      'Padre Nivaldo Alves de Souza',
      'Padre Nivaldo Alves de Souza',
      'Padre',
      '1946-11-10',
      'nivas247@gmail.com',
      'Local Padre Dehon',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Puríssimo Coração de Maria' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Odilo Antônio Leviski'))
     OR ('odilo.leviski@outlook.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'odilo.leviski@outlook.com' OR lower(trim(email_pessoal)) = 'odilo.leviski@outlook.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Odilo Antônio Leviski',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1945-03-07'),
        email_institucional = COALESCE(email_institucional, 'odilo.leviski@outlook.com'),
        comunidade_atual_nome = 'Local Puríssimo Coração de Maria',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Odilo Antônio Leviski',
      'Padre Odilo Antônio Leviski',
      'Padre Odilo Antônio Leviski',
      'Padre',
      '1945-03-07',
      'odilo.leviski@outlook.com',
      'Local Puríssimo Coração de Maria',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial São Miguel' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Olindo Smaniotto'))
     OR ('olindo59@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'olindo59@hotmail.com' OR lower(trim(email_pessoal)) = 'olindo59@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Olindo Smaniotto',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1959-08-14'),
        email_institucional = COALESCE(email_institucional, 'olindo59@hotmail.com'),
        comunidade_atual_nome = 'Territorial São Miguel',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Olindo Smaniotto',
      'Padre Olindo Smaniotto',
      'Padre Olindo Smaniotto',
      'Padre',
      '1959-08-14',
      'olindo59@hotmail.com',
      'Territorial São Miguel',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Nossa Senhora de Fátima' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Osvaldo Rech'))
     OR ('osvaldorech@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'osvaldorech@gmail.com' OR lower(trim(email_pessoal)) = 'osvaldorech@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Osvaldo Rech',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1952-12-07'),
        email_institucional = COALESCE(email_institucional, 'osvaldorech@gmail.com'),
        comunidade_atual_nome = 'Local Nossa Senhora de Fátima',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Osvaldo Rech',
      'Padre Osvaldo Rech',
      'Padre Osvaldo Rech',
      'Padre',
      '1952-12-07',
      'osvaldorech@gmail.com',
      'Local Nossa Senhora de Fátima',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São Sebastião' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Paulo Eurico Krautler'))
     OR ('padreeuricoscj@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'padreeuricoscj@hotmail.com' OR lower(trim(email_pessoal)) = 'padreeuricoscj@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Paulo Eurico Krautler',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1949-09-30'),
        email_institucional = COALESCE(email_institucional, 'padreeuricoscj@hotmail.com'),
        comunidade_atual_nome = 'Local São Sebastião',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Paulo Eurico Krautler',
      'Padre Paulo Eurico Krautler',
      'Padre Paulo Eurico Krautler',
      'Padre',
      '1949-09-30',
      'padreeuricoscj@hotmail.com',
      'Local São Sebastião',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial São Judas Tadeu' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Paulo Vanderlei Riffel'))
     OR ('pepauloscj@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'pepauloscj@hotmail.com' OR lower(trim(email_pessoal)) = 'pepauloscj@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Paulo Vanderlei Riffel',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1970-01-17'),
        email_institucional = COALESCE(email_institucional, 'pepauloscj@hotmail.com'),
        comunidade_atual_nome = 'Territorial São Judas Tadeu',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Paulo Vanderlei Riffel',
      'Padre Paulo Vanderlei Riffel',
      'Padre Paulo Vanderlei Riffel',
      'Padre',
      '1970-01-17',
      'pepauloscj@hotmail.com',
      'Territorial São Judas Tadeu',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São José' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Pedro Nelson Brentano'))
     OR ('pe.pedro.nelson@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'pe.pedro.nelson@gmail.com' OR lower(trim(email_pessoal)) = 'pe.pedro.nelson@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Pedro Nelson Brentano',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1949-07-15'),
        email_institucional = COALESCE(email_institucional, 'pe.pedro.nelson@gmail.com'),
        comunidade_atual_nome = 'Local São José',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Pedro Nelson Brentano',
      'Padre Pedro Nelson Brentano',
      'Padre Pedro Nelson Brentano',
      'Padre',
      '1949-07-15',
      'pe.pedro.nelson@gmail.com',
      'Local São José',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial São Miguel' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Renato José Rohr'))
     OR ('rohrrenatoj@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'rohrrenatoj@gmail.com' OR lower(trim(email_pessoal)) = 'rohrrenatoj@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Renato José Rohr',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1947-07-11'),
        email_institucional = COALESCE(email_institucional, 'rohrrenatoj@gmail.com'),
        comunidade_atual_nome = 'Territorial São Miguel',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Renato José Rohr',
      'Padre Renato José Rohr',
      'Padre Renato José Rohr',
      'Padre',
      '1947-07-11',
      'rohrrenatoj@gmail.com',
      'Territorial São Miguel',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial Nossa Senhora Aparecida' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Renato Vicente Polh'))
     OR ('renatoscj@yahoo.com.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'renatoscj@yahoo.com.br' OR lower(trim(email_pessoal)) = 'renatoscj@yahoo.com.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Renato Vicente Polh',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1983-10-26'),
        email_institucional = COALESCE(email_institucional, 'renatoscj@yahoo.com.br'),
        comunidade_atual_nome = 'Territorial Nossa Senhora Aparecida',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Renato Vicente Polh',
      'Padre Renato Vicente Polh',
      'Padre Renato Vicente Polh',
      'Padre',
      '1983-10-26',
      'renatoscj@yahoo.com.br',
      'Territorial Nossa Senhora Aparecida',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Padre Gabriel Lux' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Renato Vieira Lima'))
     OR ('renatolimascj@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'renatolimascj@gmail.com' OR lower(trim(email_pessoal)) = 'renatolimascj@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Renato Vieira Lima',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1994-04-17'),
        email_institucional = COALESCE(email_institucional, 'renatolimascj@gmail.com'),
        comunidade_atual_nome = 'Local Padre Gabriel Lux',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Renato Vieira Lima',
      'Padre Renato Vieira Lima',
      'Padre Renato Vieira Lima',
      'Padre',
      '1994-04-17',
      'renatolimascj@gmail.com',
      'Local Padre Gabriel Lux',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial Nossa Senhora Aparecida' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Robson Rocha da Silva'))
     OR ('robsonrochascj@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'robsonrochascj@gmail.com' OR lower(trim(email_pessoal)) = 'robsonrochascj@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Robson Rocha da Silva',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1968-10-06'),
        email_institucional = COALESCE(email_institucional, 'robsonrochascj@gmail.com'),
        comunidade_atual_nome = 'Territorial Nossa Senhora Aparecida',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Robson Rocha da Silva',
      'Padre Robson Rocha da Silva',
      'Padre Robson Rocha da Silva',
      'Padre',
      '1968-10-06',
      'robsonrochascj@gmail.com',
      'Territorial Nossa Senhora Aparecida',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Roma — Cúria Geral / Colégio Leone Dehon' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Rodrigo Bento'))
     OR ('bentoscj@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'bentoscj@gmail.com' OR lower(trim(email_pessoal)) = 'bentoscj@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Rodrigo Bento',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1987-11-23'),
        email_institucional = COALESCE(email_institucional, 'bentoscj@gmail.com'),
        comunidade_atual_nome = 'Roma — Cúria Geral / Colégio Leone Dehon',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Rodrigo Bento',
      'Padre Rodrigo Bento',
      'Padre Rodrigo Bento',
      'Padre',
      '1987-11-23',
      'bentoscj@gmail.com',
      'Roma — Cúria Geral / Colégio Leone Dehon',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São Luís Gonzaga' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Rodrigo Fernando Tascheck'))
     OR ('rodrigotascheck@icloud.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'rodrigotascheck@icloud.com' OR lower(trim(email_pessoal)) = 'rodrigotascheck@icloud.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Rodrigo Fernando Tascheck',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1989-12-26'),
        email_institucional = COALESCE(email_institucional, 'rodrigotascheck@icloud.com'),
        comunidade_atual_nome = 'Local São Luís Gonzaga',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Rodrigo Fernando Tascheck',
      'Padre Rodrigo Fernando Tascheck',
      'Padre Rodrigo Fernando Tascheck',
      'Padre',
      '1989-12-26',
      'rodrigotascheck@icloud.com',
      'Local São Luís Gonzaga',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Nossa Senhora de Fátima' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Rubens Rieg'))
     OR ('rubensrieg@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'rubensrieg@gmail.com' OR lower(trim(email_pessoal)) = 'rubensrieg@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Rubens Rieg',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1975-02-20'),
        email_institucional = COALESCE(email_institucional, 'rubensrieg@gmail.com'),
        comunidade_atual_nome = 'Local Nossa Senhora de Fátima',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Rubens Rieg',
      'Padre Rubens Rieg',
      'Padre Rubens Rieg',
      'Padre',
      '1975-02-20',
      'rubensrieg@gmail.com',
      'Local Nossa Senhora de Fátima',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Santa Margarida Maria' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Sebastião Pitz'))
     OR ('sebpitz@yahoo.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'sebpitz@yahoo.com' OR lower(trim(email_pessoal)) = 'sebpitz@yahoo.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Sebastião Pitz',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1952-06-05'),
        email_institucional = COALESCE(email_institucional, 'sebpitz@yahoo.com'),
        comunidade_atual_nome = 'Local Santa Margarida Maria',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Sebastião Pitz',
      'Padre Sebastião Pitz',
      'Padre Sebastião Pitz',
      'Padre',
      '1952-06-05',
      'sebpitz@yahoo.com',
      'Local Santa Margarida Maria',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Nossa Senhora de Fátima' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Sérgio Luís da Costa'))
     OR ('sergiodacosta0@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'sergiodacosta0@gmail.com' OR lower(trim(email_pessoal)) = 'sergiodacosta0@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Sérgio Luís da Costa',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1969-06-07'),
        email_institucional = COALESCE(email_institucional, 'sergiodacosta0@gmail.com'),
        comunidade_atual_nome = 'Local Nossa Senhora de Fátima',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Sérgio Luís da Costa',
      'Padre Sérgio Luís da Costa',
      'Padre Sérgio Luís da Costa',
      'Padre',
      '1969-06-07',
      'sergiodacosta0@gmail.com',
      'Local Nossa Senhora de Fátima',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Padre Gabriel Lux' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Sildo César da Costa'))
     OR (NULL IS NOT NULL AND (lower(trim(email_institucional)) = NULL OR lower(trim(email_pessoal)) = NULL))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Sildo César da Costa',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1970-12-10'),
        email_institucional = COALESCE(email_institucional, NULL),
        comunidade_atual_nome = 'Local Padre Gabriel Lux',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Sildo César da Costa',
      'Padre Sildo César da Costa',
      'Padre Sildo César da Costa',
      'Padre',
      '1970-12-10',
      NULL,
      'Local Padre Gabriel Lux',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Santa Rita de Cássia' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Silvano Borba'))
     OR ('silvano.borba@yahoo.com.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'silvano.borba@yahoo.com.br' OR lower(trim(email_pessoal)) = 'silvano.borba@yahoo.com.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Silvano Borba',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1977-03-10'),
        email_institucional = COALESCE(email_institucional, 'silvano.borba@yahoo.com.br'),
        comunidade_atual_nome = 'Local Santa Rita de Cássia',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Silvano Borba',
      'Padre Silvano Borba',
      'Padre Silvano Borba',
      'Padre',
      '1977-03-10',
      'silvano.borba@yahoo.com.br',
      'Local Santa Rita de Cássia',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Sagrado Coração de Jesus' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Silvano João da Costa'))
     OR ('silvano.costa8@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'silvano.costa8@gmail.com' OR lower(trim(email_pessoal)) = 'silvano.costa8@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Silvano João da Costa',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1975-08-23'),
        email_institucional = COALESCE(email_institucional, 'silvano.costa8@gmail.com'),
        comunidade_atual_nome = 'Local Sagrado Coração de Jesus',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Silvano João da Costa',
      'Padre Silvano João da Costa',
      'Padre Silvano João da Costa',
      'Padre',
      '1975-08-23',
      'silvano.costa8@gmail.com',
      'Local Sagrado Coração de Jesus',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local São Luís Gonzaga' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Silvino Hoepers'))
     OR ('silvino.hoepers@brm.org.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'silvino.hoepers@brm.org.br' OR lower(trim(email_pessoal)) = 'silvino.hoepers@brm.org.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Silvino Hoepers',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1948-01-10'),
        email_institucional = COALESCE(email_institucional, 'silvino.hoepers@brm.org.br'),
        comunidade_atual_nome = 'Local São Luís Gonzaga',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Silvino Hoepers',
      'Padre Silvino Hoepers',
      'Padre Silvino Hoepers',
      'Padre',
      '1948-01-10',
      'silvino.hoepers@brm.org.br',
      'Local São Luís Gonzaga',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Padre Gabriel Lux' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Simão Pedro C. dos Santos'))
     OR ('simao.santos@brm.org.br' IS NOT NULL AND (lower(trim(email_institucional)) = 'simao.santos@brm.org.br' OR lower(trim(email_pessoal)) = 'simao.santos@brm.org.br'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Simão Pedro C. dos Santos',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1970-10-28'),
        email_institucional = COALESCE(email_institucional, 'simao.santos@brm.org.br'),
        comunidade_atual_nome = 'Local Padre Gabriel Lux',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Simão Pedro C. dos Santos',
      'Padre Simão Pedro C. dos Santos',
      'Padre Simão Pedro C. dos Santos',
      'Padre',
      '1970-10-28',
      'simao.santos@brm.org.br',
      'Local Padre Gabriel Lux',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Missão Alemanha' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Tarcísio Darrós Feldhaus'))
     OR ('tarcisio.feldhaus@scj.de' IS NOT NULL AND (lower(trim(email_institucional)) = 'tarcisio.feldhaus@scj.de' OR lower(trim(email_pessoal)) = 'tarcisio.feldhaus@scj.de'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Tarcísio Darrós Feldhaus',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1966-01-25'),
        email_institucional = COALESCE(email_institucional, 'tarcisio.feldhaus@scj.de'),
        comunidade_atual_nome = 'Missão Alemanha',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Tarcísio Darrós Feldhaus',
      'Padre Tarcísio Darrós Feldhaus',
      'Padre Tarcísio Darrós Feldhaus',
      'Padre',
      '1966-01-25',
      'tarcisio.feldhaus@scj.de',
      'Missão Alemanha',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial São Miguel' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Thomas Antônio B. Mittelstaed'))
     OR ('thomas_mdj@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'thomas_mdj@hotmail.com' OR lower(trim(email_pessoal)) = 'thomas_mdj@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Thomas Antônio B. Mittelstaed',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1987-07-28'),
        email_institucional = COALESCE(email_institucional, 'thomas_mdj@hotmail.com'),
        comunidade_atual_nome = 'Territorial São Miguel',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Thomas Antônio B. Mittelstaed',
      'Padre Thomas Antônio B. Mittelstaed',
      'Padre Thomas Antônio B. Mittelstaed',
      'Padre',
      '1987-07-28',
      'thomas_mdj@hotmail.com',
      'Territorial São Miguel',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial Venerável Servo de Deus Padre Aloísio Boeing' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Vilmar Vitorino Feuser'))
     OR (NULL IS NOT NULL AND (lower(trim(email_institucional)) = NULL OR lower(trim(email_pessoal)) = NULL))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Vilmar Vitorino Feuser',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1954-12-15'),
        email_institucional = COALESCE(email_institucional, NULL),
        comunidade_atual_nome = 'Territorial Venerável Servo de Deus Padre Aloísio Boeing',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Vilmar Vitorino Feuser',
      'Padre Vilmar Vitorino Feuser',
      'Padre Vilmar Vitorino Feuser',
      'Padre',
      '1954-12-15',
      NULL,
      'Territorial Venerável Servo de Deus Padre Aloísio Boeing',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Local Padre Gabriel Lux' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Vilson José Comandolli'))
     OR ('vilsonjcomandolli@hotmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'vilsonjcomandolli@hotmail.com' OR lower(trim(email_pessoal)) = 'vilsonjcomandolli@hotmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Vilson José Comandolli',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1958-03-25'),
        email_institucional = COALESCE(email_institucional, 'vilsonjcomandolli@hotmail.com'),
        comunidade_atual_nome = 'Local Padre Gabriel Lux',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Vilson José Comandolli',
      'Padre Vilson José Comandolli',
      'Padre Vilson José Comandolli',
      'Padre',
      '1958-03-25',
      'vilsonjcomandolli@hotmail.com',
      'Local Padre Gabriel Lux',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = 'Territorial Venerável Servo de Deus Padre Aloísio Boeing' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('Zaqueu Suczeck'))
     OR ('zaqueuscj@gmail.com' IS NOT NULL AND (lower(trim(email_institucional)) = 'zaqueuscj@gmail.com' OR lower(trim(email_pessoal)) = 'zaqueuscj@gmail.com'))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = 'Padre Zaqueu Suczeck',
        grau = 'Padre',
        data_nascimento = COALESCE(data_nascimento, '1985-09-23'),
        email_institucional = COALESCE(email_institucional, 'zaqueuscj@gmail.com'),
        comunidade_atual_nome = 'Territorial Venerável Servo de Deus Padre Aloísio Boeing',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = 'Ativo',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      'Zaqueu Suczeck',
      'Padre Zaqueu Suczeck',
      'Padre Zaqueu Suczeck',
      'Padre',
      '1985-09-23',
      'zaqueuscj@gmail.com',
      'Territorial Venerável Servo de Deus Padre Aloísio Boeing',
      v_com_id,
      'Ativo',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;

-- 5. RECONCILIAÇÃO FINAL RELACIONAL (GARANTIA DE INTEGRIDADE TOTAL)
UPDATE public.religiosos r
SET comunidade_atual_id = c.id
FROM public.comunidades c
WHERE (lower(trim(r.comunidade_atual_nome)) = lower(trim(c.nome))
   OR (c.nome = 'Conventinho SCJ' AND r.comunidade_atual_nome ILIKE '%Conventinho%')
   OR (c.nome = 'Local Padre Gabriel Lux' AND r.comunidade_atual_nome ILIKE '%Gabriel Lux%'))
  AND (r.comunidade_atual_id IS NULL OR r.comunidade_atual_id <> c.id);

COMMIT;
