-- ==============================================================================
-- ATUALIZAÇÃO INTEGRAL CANÔNICA: NOMES RELIGIOSOS ATRIBUÍDOS, COMUNIDADES E OBRAS
-- Província Brasileira Meridional (Dehonianos - BRM)
-- ==============================================================================

BEGIN;

-- 1. Funções de Atribuição Automática de Nomes Religiosos (Regra Oficial Dehoniana BRM)
-- Frater  -> "Fr. [Nome Civil], scj"
-- Bispo   -> "Dom [Nome Civil], scj"
-- Diácono -> "Diác. [Nome Civil], scj"
-- Irmão   -> "Ir. [Nome Civil], scj"
-- Padre   -> "P. [Nome Civil], scj"

CREATE OR REPLACE FUNCTION public.limpar_nome_civil_religioso(p_nome text)
RETURNS text AS $$
DECLARE
  v_clean text;
  v_prev text;
BEGIN
  IF p_nome IS NULL OR trim(p_nome) = '' THEN
    RETURN '';
  END IF;

  v_clean := trim(p_nome);
  v_clean := regexp_replace(v_clean, '(?i)(?:,\s*|\s+)(?:scj|s\.c\.j\.|dehoniano|dehonianos)\.?$', '', 'g');

  v_prev := '';
  WHILE v_prev IS DISTINCT FROM v_clean LOOP
    v_prev := v_clean;
    v_clean := regexp_replace(v_clean, '(?i)^(?:dom|diác\.|diac\.|diácono|diacono|fr\.|frater|ir\.|irmão|irmao|pe\.|p\.|padre|presbítero|presbitero)\s+', '', 'g');
    v_clean := trim(v_clean);
  END LOOP;

  RETURN v_clean;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.atribuir_nome_religioso(p_grau text, p_nome_civil text)
RETURNS text AS $$
DECLARE
  v_clean text;
  v_grau_lower text;
  v_prefix text;
BEGIN
  v_clean := public.limpar_nome_civil_religioso(p_nome_civil);
  IF v_clean = '' THEN
    RETURN NULL;
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
    v_prefix := 'P.';
  END IF;

  RETURN v_prefix || ' ' || v_clean || ', scj';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Garantir colunas obra_atual_nome e obra_atual_id nas tabelas
ALTER TABLE public.religiosos ADD COLUMN IF NOT EXISTS obra_atual_nome TEXT;
ALTER TABLE public.religiosos ADD COLUMN IF NOT EXISTS obra_atual_id UUID REFERENCES public.religiosos_obras_referencia(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portal_perfis_religiosos') THEN
    ALTER TABLE public.portal_perfis_religiosos ADD COLUMN IF NOT EXISTS obra_atual_nome TEXT;
  END IF;
END $$;

-- 3. Atualizar Nomes Religiosos Atribuídos em public.religiosos
UPDATE public.religiosos
SET nome_religioso = public.atribuir_nome_religioso(grau, nome_civil),
    nome_elenco = public.atribuir_nome_religioso(grau, nome_civil)
WHERE nome_civil IS NOT NULL AND trim(nome_civil) <> '';

-- 4. Atualizar Nomes Religiosos Atribuídos em public.portal_perfis_religiosos (sem referenciar nome_elenco)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portal_perfis_religiosos') THEN
    UPDATE public.portal_perfis_religiosos
    SET nome_religioso = public.atribuir_nome_religioso(grau, nome_civil)
    WHERE nome_civil IS NOT NULL AND trim(nome_civil) <> '';
  END IF;
END $$;

-- 5. Atualização Canônica de Comunidade e Obra onde cada confrade reside/trabalha (123 membros)
UPDATE public.religiosos SET comunidade_atual_nome = 'Conventinho SCJ', obra_atual_nome = 'Conventinho SCJ' WHERE lower(trim(nome_civil)) = lower(trim('Tiago Junior Waier'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Província BRM', obra_atual_nome = 'Arcebispo Emérito / Província BRM' WHERE lower(trim(nome_civil)) = lower(trim('Murilo Sebastião Ramos Krieger'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Dehoniana do Rio Grande do Sul', obra_atual_nome = 'Paróquia Sagrado Coração de Jesus' WHERE lower(trim(nome_civil)) = lower(trim('Alexandre Johann'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Nossa Senhora de Fátima', obra_atual_nome = 'Noviciado Nossa Senhora de Fátima (Jaraguá do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Alexandre Semkiv de A. Caetano'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Nossa Senhora Aparecida', obra_atual_nome = 'Paróquia Nossa Senhora Aparecida (Palmas)' WHERE lower(trim(nome_civil)) = lower(trim('Artur Hang'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Padre Dehon', obra_atual_nome = 'Casa Padre Dehon (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Cleiton Froehner'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Sagrado Coração de Jesus', obra_atual_nome = 'Convento Sagrado Coração de Jesus (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Cristiano Schneider'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Padre Dehon', obra_atual_nome = 'Casa Padre Dehon (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Daugmar Zeitz Kraus'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Conventinho SCJ', obra_atual_nome = 'Conventinho SCJ' WHERE lower(trim(nome_civil)) = lower(trim('Djonatan Engelmann'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Conventinho SCJ', obra_atual_nome = 'Conventinho SCJ' WHERE lower(trim(nome_civil)) = lower(trim('Erik Patrik Fantini'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São José', obra_atual_nome = 'Seminário São José (Rio Negrinho)' WHERE lower(trim(nome_civil)) = lower(trim('Filipe José Potter'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São José', obra_atual_nome = 'Seminário São José (Rio Negrinho)' WHERE lower(trim(nome_civil)) = lower(trim('Geovan Luiz Alberton'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Nossa Senhora Aparecida', obra_atual_nome = 'Paróquia Nossa Senhora Aparecida (Palmas)' WHERE lower(trim(nome_civil)) = lower(trim('Henrique Carvalho da Silva'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Conventinho SCJ', obra_atual_nome = 'Conventinho SCJ' WHERE lower(trim(nome_civil)) = lower(trim('Honaycon Gonçalves'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Padre Gabriel Lux', obra_atual_nome = 'Sede Provincial – Seminário Sagrado Coração de Jesus' WHERE lower(trim(nome_civil)) = lower(trim('Iago Mafra Cunha'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Conventinho SCJ', obra_atual_nome = 'Conventinho SCJ' WHERE lower(trim(nome_civil)) = lower(trim('Jeferson Adriano Caldas'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Nossa Senhora de Fátima', obra_atual_nome = 'Noviciado Nossa Senhora de Fátima (Jaraguá do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('João Pedro Dutra Walecki'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Conventinho SCJ', obra_atual_nome = 'Conventinho SCJ' WHERE lower(trim(nome_civil)) = lower(trim('Márcio Rech'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Dehoniana de Rondônia', obra_atual_nome = 'Paróquia Nossa Senhora de Nazaré (Rondônia)' WHERE lower(trim(nome_civil)) = lower(trim('Pedro Henrique Oliveira de Paula'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Dehoniana de Rondônia', obra_atual_nome = 'Paróquia Nossa Senhora de Nazaré (Rondônia)' WHERE lower(trim(nome_civil)) = lower(trim('Renato Schweitzer Filho'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Conventinho SCJ', obra_atual_nome = 'Conventinho SCJ' WHERE lower(trim(nome_civil)) = lower(trim('Ricardo Vinter'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Conventinho SCJ', obra_atual_nome = 'Conventinho SCJ' WHERE lower(trim(nome_civil)) = lower(trim('Thiago Hermenegildo de Faria'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Nossa Senhora de Fátima', obra_atual_nome = 'Casa São João (Jaraguá do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Ederson Krause'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Nossa Senhora Aparecida', obra_atual_nome = 'Paróquia Imaculada Conceição (Mangueirinha)' WHERE lower(trim(nome_civil)) = lower(trim('Itaianan Bazza Vieira'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Santa Rita de Cássia', obra_atual_nome = 'Residência Sagrado Coração de Jesus (Curitiba)' WHERE lower(trim(nome_civil)) = lower(trim('Ademir Wickert'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Luís Gonzaga', obra_atual_nome = 'Paróquia São Luís Gonzaga (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Adilson José Colombi'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Judas Tadeu', obra_atual_nome = 'Paróquia Catedral São João Batista (Rio do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Afonso Molinari'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Padre Gabriel Lux', obra_atual_nome = 'Paróquia São José (Corupá)' WHERE lower(trim(nome_civil)) = lower(trim('Airton Franzner'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Nossa Senhora de Fátima', obra_atual_nome = 'Casa São João (Jaraguá do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Alberto Luiz Huber'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Judas Tadeu', obra_atual_nome = 'Paróquia São Sebastião (Vidal Ramos)' WHERE lower(trim(nome_civil)) = lower(trim('Alceu Luiz Weber'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Dehoniana do Rio Grande do Sul', obra_atual_nome = 'Paróquia Sagrado Coração de Jesus' WHERE lower(trim(nome_civil)) = lower(trim('Aldo Cícero Lisboa'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Sagrado Coração de Jesus', obra_atual_nome = 'Faculdade São Luiz (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Aléssio da Rosa'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Nossa Senhora Aparecida', obra_atual_nome = 'Paróquia Imaculada Conceição (Mangueirinha)' WHERE lower(trim(nome_civil)) = lower(trim('Alexandre Barbosa'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Padre Gabriel Lux', obra_atual_nome = 'Paróquia São José (Corupá)' WHERE lower(trim(nome_civil)) = lower(trim('Alírio José Pedrini'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Puríssimo Coração de Maria', obra_atual_nome = 'Paróquia Puríssimo Coração de Maria (São Bento do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Anderson Carlos S. Viana'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Pe. Aloísio Boeing', obra_atual_nome = 'Paróquia Santuário Sagrado Coração de Jesus (Gravatal)' WHERE lower(trim(nome_civil)) = lower(trim('André Borges da Silva'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Pe. Aloísio Boeing', obra_atual_nome = 'Paróquia São Pedro Apóstolo (Armazém)' WHERE lower(trim(nome_civil)) = lower(trim('Anésio Dalcastagner'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Padre Dehon', obra_atual_nome = 'Casa Padre Dehon (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Anísio José Schwirkowski'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Judas Tadeu', obra_atual_nome = 'Paróquia São Judas Tadeu (Rio do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Ari João Erthal'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Província Argentina', obra_atual_nome = 'Província Argentina' WHERE lower(trim(nome_civil)) = lower(trim('Arildo José Ferrari'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Santa Margarida Maria', obra_atual_nome = 'Santuário Sagrado Coração de Jesus (Jaraguá do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Aurélio Pereira'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Nossa Senhora Aparecida', obra_atual_nome = 'Paróquia Nossa Senhora Aparecida (Palmas)' WHERE lower(trim(nome_civil)) = lower(trim('Bala Jojappa Kakumanu'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São José', obra_atual_nome = 'Paróquia Santo Antônio (Rio Negrinho)' WHERE lower(trim(nome_civil)) = lower(trim('Carlos Alberto Rodrigues'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Sebastião', obra_atual_nome = 'Paróquia São Sebastião (Jaraguá do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Carlos Marcos Nicolodelli'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Província Argentina', obra_atual_nome = 'Província Argentina' WHERE lower(trim(nome_civil)) = lower(trim('Carlos Roberto de Oliveira'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Dehoniana do Rio Grande do Sul', obra_atual_nome = 'Paróquia Sagrado Coração de Jesus' WHERE lower(trim(nome_civil)) = lower(trim('Cenário Ervino Hanauer'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Missão Paraguai', obra_atual_nome = 'Missão Paraguai' WHERE lower(trim(nome_civil)) = lower(trim('Cezar Augusto Hammes'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Padre Gabriel Lux', obra_atual_nome = 'Sede Provincial – Seminário Sagrado Coração de Jesus' WHERE lower(trim(nome_civil)) = lower(trim('Cícero Celeste Murara'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Luís Gonzaga', obra_atual_nome = 'Paróquia São Luís Gonzaga (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Cláudio Márcio Piontkewicz'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Sagrado Coração de Jesus', obra_atual_nome = 'Convento Sagrado Coração de Jesus (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Cristiano Tiago Araújo'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Roma — Cúria Geral', obra_atual_nome = 'Colégio Internacional Leone Dehon (Roma)' WHERE lower(trim(nome_civil)) = lower(trim('Darlan Dejaime Marasca'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Dehoniana de Rondônia', obra_atual_nome = 'Paróquia Nossa Senhora de Nazaré (Rondônia)' WHERE lower(trim(nome_civil)) = lower(trim('Diego Martins'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Luís Gonzaga', obra_atual_nome = 'Paróquia São Luís Gonzaga (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Diomar Romaniv'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Bethânia', obra_atual_nome = 'Comunidade Bethânia' WHERE lower(trim(nome_civil)) = lower(trim('Elinton Costa'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Padre Gabriel Lux', obra_atual_nome = 'Sede Provincial – Seminário Sagrado Coração de Jesus' WHERE lower(trim(nome_civil)) = lower(trim('Elói Comper'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Dehoniana do Rio Grande do Sul', obra_atual_nome = 'Paróquia Sagrado Coração de Jesus' WHERE lower(trim(nome_civil)) = lower(trim('Elói José Schons'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São José', obra_atual_nome = 'Paróquia Santo Antônio (Rio Negrinho)' WHERE lower(trim(nome_civil)) = lower(trim('Emerson Guimarães'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Nossa Senhora de Fátima', obra_atual_nome = 'Noviciado Nossa Senhora de Fátima (Jaraguá do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Fábio Luiz Pereira'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Dehoniana de Rondônia', obra_atual_nome = 'Paróquia Nossa Senhora de Nazaré (Rondônia)' WHERE lower(trim(nome_civil)) = lower(trim('Fagner Ramon Pacheco Haas'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Sagrado Coração de Jesus', obra_atual_nome = 'Convento Sagrado Coração de Jesus (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Fernando Teckler'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Judas Tadeu', obra_atual_nome = 'Paróquia Catedral São João Batista (Rio do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Francisco Lawall'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Dehoniana do Rio Grande do Sul', obra_atual_nome = 'Paróquia Sagrado Coração de Jesus' WHERE lower(trim(nome_civil)) = lower(trim('Galdino Becker'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Sebastião', obra_atual_nome = 'Paróquia São Sebastião (Joinville)' WHERE lower(trim(nome_civil)) = lower(trim('Geraldo Kohler'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Dehoniana de Rondônia', obra_atual_nome = 'Paróquia Nossa Senhora de Nazaré (Rondônia)' WHERE lower(trim(nome_civil)) = lower(trim('Gilberto Bonato Xavier'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Dehoniana do Rio Grande do Sul', obra_atual_nome = 'Paróquia Sagrado Coração de Jesus' WHERE lower(trim(nome_civil)) = lower(trim('Gilberto Luiz R. de Miranda'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São José', obra_atual_nome = 'Seminário São José (Rio Negrinho)' WHERE lower(trim(nome_civil)) = lower(trim('Gilberto Moisés Bohn Mittelstead'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Santa Rita de Cássia', obra_atual_nome = 'Paróquia Santuário Santa Rita de Cássia (Curitiba)' WHERE lower(trim(nome_civil)) = lower(trim('Giovani Pontes'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Luís Gonzaga', obra_atual_nome = 'Paróquia São Luís Gonzaga (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Hélio Feuser'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Santa Rita de Cássia', obra_atual_nome = 'Paróquia Santuário Santa Rita de Cássia (Curitiba)' WHERE lower(trim(nome_civil)) = lower(trim('Itamar José Zigowski'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Luís Gonzaga', obra_atual_nome = 'Paróquia São Luís Gonzaga (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Jaime Ludwig'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Padre Gabriel Lux', obra_atual_nome = 'Paróquia São José (Corupá)' WHERE lower(trim(nome_civil)) = lower(trim('Jair Rodrigues Costa'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Padre Gabriel Lux', obra_atual_nome = 'Sede Provincial – Seminário Sagrado Coração de Jesus' WHERE lower(trim(nome_civil)) = lower(trim('João Sebastião Boeing'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Santa Rita de Cássia', obra_atual_nome = 'Residência Sagrado Coração de Jesus (Curitiba)' WHERE lower(trim(nome_civil)) = lower(trim('José Francisco Alves'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Sebastião', obra_atual_nome = 'Paróquia São Sebastião (Jaraguá do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('José Napoleão Laureano dos Santos'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São José', obra_atual_nome = 'Seminário São José (Rio Negrinho)' WHERE lower(trim(nome_civil)) = lower(trim('José Ricardo H. Zorer'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Roma — Cúria Geral', obra_atual_nome = 'Colégio Internacional Leone Dehon (Roma)' WHERE lower(trim(nome_civil)) = lower(trim('Josimar Baggio'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Sebastião', obra_atual_nome = 'Paróquia São Sebastião (Jaraguá do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Kleber Ferreira de Oliveira'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Santa Margarida Maria', obra_atual_nome = 'Santuário Sagrado Coração de Jesus (Jaraguá do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Léo Heck'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Santa Margarida Maria', obra_atual_nome = 'Santuário Sagrado Coração de Jesus (Joinville/SC)' WHERE lower(trim(nome_civil)) = lower(trim('Leonardo Jacomelli'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Luís Gonzaga', obra_atual_nome = 'Paróquia São Luís Gonzaga (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Lindolfo Neves Braga'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Sagrado Coração de Jesus', obra_atual_nome = 'Convento Sagrado Coração de Jesus (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Lucas Ignacio Scheid'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Puríssimo Coração de Maria', obra_atual_nome = 'Paróquia Puríssimo Coração de Maria (São Bento do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Luciano José Toller'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Luís Gonzaga', obra_atual_nome = 'Paróquia São Luís Gonzaga (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Luiz Antônio de Faria'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Sagrado Coração de Jesus', obra_atual_nome = 'Faculdade São Luiz (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Luiz Carlos Berri'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Dehoniana de Rondônia', obra_atual_nome = 'Paróquia Nossa Senhora de Nazaré (Rondônia)' WHERE lower(trim(nome_civil)) = lower(trim('Luiz Mazzochini'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Dehoniana de Rondônia', obra_atual_nome = 'Paróquia Nossa Senhora de Nazaré (Rondônia)' WHERE lower(trim(nome_civil)) = lower(trim('Magnos José Baron Caneppele'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Santa Rita de Cássia', obra_atual_nome = 'Residência Sagrado Coração de Jesus (Curitiba)' WHERE lower(trim(nome_civil)) = lower(trim('Marcial Maçaneiro'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Missão Alemanha', obra_atual_nome = 'Missão Alemanha' WHERE lower(trim(nome_civil)) = lower(trim('Márcio Antônio Auth'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Sebastião', obra_atual_nome = 'Paróquia São Sebastião (Jaraguá do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Marcos Antônio Bernardes'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Pe. Aloísio Boeing', obra_atual_nome = 'Paróquia Santuário Sagrado Coração de Jesus (Gravatal)' WHERE lower(trim(nome_civil)) = lower(trim('Mariano Weizenmann'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Luís Gonzaga', obra_atual_nome = 'Paróquia São Luís Gonzaga (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Marilton Nuss'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Luís Gonzaga', obra_atual_nome = 'Paróquia São Luís Gonzaga (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Mário Peixe'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Sebastião', obra_atual_nome = 'Paróquia São Sebastião (Joinville)' WHERE lower(trim(nome_civil)) = lower(trim('Mário Tito Angioletti'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Ausente da Congregação', obra_atual_nome = 'Ausente da Congregação' WHERE lower(trim(nome_civil)) = lower(trim('Maurídio Weber'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São José', obra_atual_nome = 'Seminário São José (Rio Negrinho)' WHERE lower(trim(nome_civil)) = lower(trim('Miguel da Silva'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Puríssimo Coração de Maria', obra_atual_nome = 'Paróquia Puríssimo Coração de Maria (São Bento do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Nelson Tachini'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Santa Rita de Cássia', obra_atual_nome = 'Paróquia Santuário Santa Rita de Cássia (Curitiba)' WHERE lower(trim(nome_civil)) = lower(trim('Nilson Hellmann'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Padre Dehon', obra_atual_nome = 'Casa Padre Dehon (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Nivaldo Alves de Souza'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Puríssimo Coração de Maria', obra_atual_nome = 'Paróquia Puríssimo Coração de Maria (São Bento do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Odilo Antônio Leviski'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Dehoniana do Rio Grande do Sul', obra_atual_nome = 'Paróquia Sagrado Coração de Jesus' WHERE lower(trim(nome_civil)) = lower(trim('Olindo Smaniotto'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Nossa Senhora de Fátima', obra_atual_nome = 'Casa São João (Jaraguá do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Osvaldo Rech'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Nossa Senhora de Fátima', obra_atual_nome = 'Casa São João (Jaraguá do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Paulo Eurico Krautler'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Judas Tadeu', obra_atual_nome = 'Paróquia São Judas Tadeu (Rio do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Paulo Vanderlei Riffel'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São José', obra_atual_nome = 'Seminário São José (Rio Negrinho)' WHERE lower(trim(nome_civil)) = lower(trim('Pedro Nelson Brentano'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Dehoniana do Rio Grande do Sul', obra_atual_nome = 'Paróquia Sagrado Coração de Jesus' WHERE lower(trim(nome_civil)) = lower(trim('Renato José Rohr'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Nossa Senhora Aparecida', obra_atual_nome = 'Paróquia Nossa Senhora Aparecida (Palmas)' WHERE lower(trim(nome_civil)) = lower(trim('Renato Vicente Polh'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Padre Gabriel Lux', obra_atual_nome = 'Sede Provincial – Seminário Sagrado Coração de Jesus' WHERE lower(trim(nome_civil)) = lower(trim('Renato Vieira Lima'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Nossa Senhora Aparecida', obra_atual_nome = 'Paróquia Imaculada Conceição (Mangueirinha)' WHERE lower(trim(nome_civil)) = lower(trim('Robson Rocha da Silva'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Roma — Cúria Geral', obra_atual_nome = 'Colégio Internacional Leone Dehon (Roma)' WHERE lower(trim(nome_civil)) = lower(trim('Rodrigo Bento'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Luís Gonzaga', obra_atual_nome = 'Paróquia São Luís Gonzaga (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Rodrigo Fernando Tascheck'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Nossa Senhora de Fátima', obra_atual_nome = 'Noviciado Nossa Senhora de Fátima (Jaraguá do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Rubens Rieg'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Sebastião', obra_atual_nome = 'Paróquia São Sebastião (Joinville)' WHERE lower(trim(nome_civil)) = lower(trim('Sebastião Pitz'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Nossa Senhora de Fátima', obra_atual_nome = 'Noviciado Nossa Senhora de Fátima (Jaraguá do Sul)' WHERE lower(trim(nome_civil)) = lower(trim('Sérgio Luís da Costa'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Padre Gabriel Lux', obra_atual_nome = 'Sede Provincial – Seminário Sagrado Coração de Jesus' WHERE lower(trim(nome_civil)) = lower(trim('Sildo César da Costa'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Santa Rita de Cássia', obra_atual_nome = 'Residência Sagrado Coração de Jesus (Curitiba)' WHERE lower(trim(nome_civil)) = lower(trim('Silvano Borba'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Sagrado Coração de Jesus', obra_atual_nome = 'Faculdade São Luiz (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Silvano João da Costa'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade São Luís Gonzaga', obra_atual_nome = 'Paróquia São Luís Gonzaga (Brusque)' WHERE lower(trim(nome_civil)) = lower(trim('Silvino Hoepers'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Padre Gabriel Lux', obra_atual_nome = 'Sede Provincial – Seminário Sagrado Coração de Jesus' WHERE lower(trim(nome_civil)) = lower(trim('Simão Pedro C. dos Santos'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Missão Alemanha', obra_atual_nome = 'Missão Alemanha' WHERE lower(trim(nome_civil)) = lower(trim('Tarcísio Darrós Feldhaus'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Dehoniana do Rio Grande do Sul', obra_atual_nome = 'Paróquia Sagrado Coração de Jesus' WHERE lower(trim(nome_civil)) = lower(trim('Thomas Antônio B. Mittelstaed'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Pe. Aloísio Boeing', obra_atual_nome = 'Paróquia São Pedro Apóstolo (Armazém)' WHERE lower(trim(nome_civil)) = lower(trim('Vilmar Vitorino Feuser'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Padre Gabriel Lux', obra_atual_nome = 'Paróquia São José (Corupá)' WHERE lower(trim(nome_civil)) = lower(trim('Vilson José Comandolli'));
UPDATE public.religiosos SET comunidade_atual_nome = 'Comunidade Pe. Aloísio Boeing', obra_atual_nome = 'Paróquia São Pedro Apóstolo (Armazém)' WHERE lower(trim(nome_civil)) = lower(trim('Zaqueu Suczeck'));

-- 6. Reconciliar obra_atual_id relacional
UPDATE public.religiosos r
SET obra_atual_id = ro.id
FROM public.religiosos_obras_referencia ro
WHERE r.obra_atual_nome IS NOT NULL 
  AND (lower(trim(ro.nome)) = lower(trim(r.obra_atual_nome))
   OR ro.nome ILIKE '%' || r.obra_atual_nome || '%'
   OR r.obra_atual_nome ILIKE '%' || ro.nome || '%')
  AND (r.obra_atual_id IS NULL OR r.obra_atual_id <> ro.id);

-- 7. Reconciliar com a tabela portal_perfis_religiosos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portal_perfis_religiosos') THEN
    UPDATE public.portal_perfis_religiosos p
    SET comunidade_atual_nome = r.comunidade_atual_nome,
        obra_atual_nome = r.obra_atual_nome
    FROM public.religiosos r
    WHERE (r.auth_user_id IS NOT NULL AND r.auth_user_id = p.auth_user_id)
       OR lower(trim(r.nome_civil)) = lower(trim(p.nome_civil));
  END IF;
END $$;

COMMIT;
