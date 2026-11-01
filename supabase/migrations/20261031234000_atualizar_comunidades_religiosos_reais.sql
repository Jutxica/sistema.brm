-- ==============================================================================
-- ATUALIZAÇÃO CANÔNICA DAS COMUNIDADES E CASAS REAIS DOS RELIGIOSOS BRM
-- Substitui divisões administrativas territoriais pelas Comunidades e Paróquias reais
-- ==============================================================================

BEGIN;

-- 1. Atualizar confrades de Palmas para a Paróquia Nossa Senhora Aparecida
UPDATE public.religiosos
SET comunidade_atual_nome = 'Paróquia Nossa Senhora Aparecida (Palmas)'
WHERE lower(trim(nome_civil)) IN (
  lower(trim('Artur Hang')),
  lower(trim('Henrique Carvalho da Silva')),
  lower(trim('Bala Jojappa Kakumanu')),
  lower(trim('Renato Vicente Polh'))
);

-- 2. Atualizar confrades de Mangueirinha para a Paróquia Imaculada Conceição
UPDATE public.religiosos
SET comunidade_atual_nome = 'Paróquia Imaculada Conceição (Mangueirinha)'
WHERE lower(trim(nome_civil)) IN (
  lower(trim('Itaianan Bazza Vieira')),
  lower(trim('Alexandre Barbosa')),
  lower(trim('Robson Rocha da Silva'))
);

-- 3. Atualizar confrades de Rio do Sul I e II e Vidal Ramos
UPDATE public.religiosos
SET comunidade_atual_nome = 'Paróquia Catedral São João Batista (Rio do Sul)'
WHERE lower(trim(nome_civil)) IN (
  lower(trim('Afonso Molinari')),
  lower(trim('Francisco Lawall'))
);

UPDATE public.religiosos
SET comunidade_atual_nome = 'Paróquia São Judas Tadeu (Rio do Sul)'
WHERE lower(trim(nome_civil)) IN (
  lower(trim('Ari João Erthal')),
  lower(trim('Paulo Vanderlei Riffel'))
);

UPDATE public.religiosos
SET comunidade_atual_nome = 'Paróquia São Sebastião (Vidal Ramos)'
WHERE lower(trim(nome_civil)) = lower(trim('Alceu Luiz Weber'));

-- 4. Atualizar confrades de Gravatal e Armazém
UPDATE public.religiosos
SET comunidade_atual_nome = 'Paróquia Santuário Sagrado Coração de Jesus (Gravatal)'
WHERE lower(trim(nome_civil)) IN (
  lower(trim('André Borges da Silva')),
  lower(trim('Mariano Weizenmann'))
);

UPDATE public.religiosos
SET comunidade_atual_nome = 'Paróquia São Pedro Apóstolo (Armazém)'
WHERE lower(trim(nome_civil)) IN (
  lower(trim('Anésio Dalcastagner')),
  lower(trim('Vilmar Vitorino Feuser')),
  lower(trim('Zaqueu Suczeck'))
);

-- 5. Atualizar confrades do Rio Grande do Sul
UPDATE public.religiosos
SET comunidade_atual_nome = 'Comunidade Dehoniana do Rio Grande do Sul'
WHERE lower(trim(nome_civil)) IN (
  lower(trim('Alexandre Johann')),
  lower(trim('Aldo Cícero Lisboa')),
  lower(trim('Cenário Ervino Hanauer')),
  lower(trim('Elói José Schons')),
  lower(trim('Galdino Becker')),
  lower(trim('Gilberto Luiz R. de Miranda')),
  lower(trim('Olindo Smaniotto')),
  lower(trim('Renato José Rohr')),
  lower(trim('Thomas Antônio B. Mittelstaed'))
);

-- 6. Atualizar confrades de Rondônia
UPDATE public.religiosos
SET comunidade_atual_nome = 'Comunidade Dehoniana de Rondônia'
WHERE lower(trim(nome_civil)) IN (
  lower(trim('Pedro Henrique Oliveira de Paula')),
  lower(trim('Renato Schweitzer Filho')),
  lower(trim('Diego Martins')),
  lower(trim('Fagner Ramon Pacheco Haas')),
  lower(trim('Gilberto Bonato Xavier')),
  lower(trim('Luiz Mazzochini')),
  lower(trim('Magnos José Baron Caneppele'))
);

-- 7. Confrades da Comunidade do Conventinho SCJ em Taubaté (8 religiosos)
UPDATE public.religiosos
SET comunidade_atual_nome = 'Conventinho SCJ',
    comunidade_atual_id = (SELECT id FROM public.comunidades WHERE nome ILIKE '%Conventinho%' LIMIT 1)
WHERE lower(trim(nome_civil)) IN (
  lower(trim('Tiago Junior Waier')),
  lower(trim('Djonatan Engelmann')),
  lower(trim('Erik Patrik Fantini')),
  lower(trim('Honaycon Gonçalves')),
  lower(trim('Jeferson Adriano Caldas')),
  lower(trim('Márcio Rech')),
  lower(trim('Ricardo Vinter')),
  lower(trim('Thiago Hermenegildo de Faria'))
);

-- 8. Correção canônica: P. Leonardo Jacomelli, scj no Santuário Sagrado Coração de Jesus (Joinville/SC)
UPDATE public.religiosos
SET comunidade_atual_nome = 'Santuário Sagrado Coração de Jesus (Joinville/SC)',
    comunidade_atual_id = (SELECT id FROM public.comunidades WHERE nome ILIKE '%Margarida Maria%' OR nome ILIKE '%Joinville%' LIMIT 1)
WHERE lower(trim(nome_civil)) = lower(trim('Leonardo Jacomelli'));

-- 9. Limpar qualquer prefixo "Territorial " ou "Local " remanescente
UPDATE public.religiosos
SET comunidade_atual_nome = regexp_replace(comunidade_atual_nome, '^Territorial\s+', 'Comunidade ', 'i')
WHERE comunidade_atual_nome ILIKE 'Territorial %';

UPDATE public.religiosos
SET comunidade_atual_nome = regexp_replace(comunidade_atual_nome, '^Local\s+', 'Comunidade ', 'i')
WHERE comunidade_atual_nome ILIKE 'Local %';

-- 9. Sincronizar tabela portal_perfis_religiosos se existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portal_perfis_religiosos') THEN
    UPDATE public.portal_perfis_religiosos p
    SET comunidade_atual_nome = r.comunidade_atual_nome
    FROM public.religiosos r
    WHERE (r.auth_user_id IS NOT NULL AND r.auth_user_id = p.auth_user_id)
       OR lower(trim(r.nome_civil)) = lower(trim(p.nome_civil));
  END IF;
END $$;

COMMIT;
