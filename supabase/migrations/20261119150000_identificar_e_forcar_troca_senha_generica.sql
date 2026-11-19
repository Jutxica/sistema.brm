-- =============================================================================
-- IDENTIFICAÇÃO E TROCA OBRIGATÓRIA DE SENHA PROVISÓRIA (brm@DDMMAAAA)
-- Província Brasileira Meridional · SCJ
--
-- O que esta migration faz:
-- 1. Identifica via pgcrypto (bcrypt) todos os usuários em auth.users que ainda
--    estão utilizando a senha genérica/provisória (brm@DDMMAAAA ou brm@2026scj)
--    e sincroniza a flag `precisa_trocar_senha` em raw_user_meta_data.
-- 2. Cria a RPC `public.verificar_precisa_trocar_senha()` para o usuário logado
--    checar em tempo real se ainda usa senha provisória (acionando o pop-up).
-- 3. Cria a RPC `public.listar_usuarios_senha_generica()` (restrita a
--    admin/secretaria/religiosos) para auditar quem ainda está com senha
--    provisória e quem já definiu senha pessoal.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Sincronização inicial das flags em auth.users com base na senha real atual
DO $$
DECLARE
  rec RECORD;
  v_senha_padrao TEXT;
  v_eh_generica BOOLEAN;
BEGIN
  SET LOCAL search_path = pg_catalog, public, auth, extensions;

  FOR rec IN
    SELECT
      u.id AS user_id,
      u.encrypted_password,
      u.raw_user_meta_data,
      r.data_nascimento
    FROM auth.users u
    INNER JOIN public.religiosos r
      ON r.auth_user_id = u.id
    WHERE u.encrypted_password IS NOT NULL
      AND u.encrypted_password <> ''
  LOOP
    v_eh_generica := false;

    IF rec.data_nascimento IS NOT NULL THEN
      v_senha_padrao := 'brm@' || to_char(rec.data_nascimento, 'DDMMYYYY');
      IF rec.encrypted_password = crypt(v_senha_padrao, rec.encrypted_password) THEN
        v_eh_generica := true;
      END IF;
    END IF;

    IF NOT v_eh_generica THEN
      IF rec.encrypted_password = crypt('brm@2026scj', rec.encrypted_password) THEN
        v_eh_generica := true;
      END IF;
    END IF;

    IF v_eh_generica THEN
      UPDATE auth.users
      SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
          || jsonb_build_object('precisa_trocar_senha', true),
          updated_at = now()
      WHERE id = rec.user_id
        AND COALESCE((raw_user_meta_data->>'precisa_trocar_senha')::boolean, false) IS DISTINCT FROM true;
    ELSE
      UPDATE auth.users
      SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
          || jsonb_build_object('precisa_trocar_senha', false),
          updated_at = now()
      WHERE id = rec.user_id
        AND COALESCE((raw_user_meta_data->>'precisa_trocar_senha')::boolean, false) = true;
    END IF;
  END LOOP;
END $$;

-- 2. RPC para o próprio usuário autenticado verificar em tempo real se precisa trocar a senha
CREATE OR REPLACE FUNCTION public.verificar_precisa_trocar_senha()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_hash text;
  v_meta jsonb;
  v_nasc date;
  v_senha_padrao text;
  v_eh_generica boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT u.encrypted_password, COALESCE(u.raw_user_meta_data, '{}'::jsonb)
    INTO v_hash, v_meta
  FROM auth.users u
  WHERE u.id = v_uid;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT r.data_nascimento
    INTO v_nasc
  FROM public.religiosos r
  WHERE r.auth_user_id = v_uid
  LIMIT 1;

  IF v_hash IS NOT NULL AND v_hash <> '' THEN
    IF v_nasc IS NOT NULL THEN
      v_senha_padrao := 'brm@' || to_char(v_nasc, 'DDMMYYYY');
      IF v_hash = crypt(v_senha_padrao, v_hash) THEN
        v_eh_generica := true;
      END IF;
    END IF;

    IF NOT v_eh_generica AND v_hash = crypt('brm@2026scj', v_hash) THEN
      v_eh_generica := true;
    END IF;
  END IF;

  IF v_eh_generica THEN
    -- Garante que o metadado reflita o estado real
    IF COALESCE((v_meta->>'precisa_trocar_senha')::boolean, false) IS DISTINCT FROM true THEN
      UPDATE auth.users
      SET raw_user_meta_data = v_meta || jsonb_build_object('precisa_trocar_senha', true),
          updated_at = now()
      WHERE id = v_uid;
    END IF;
    RETURN true;
  END IF;

  -- Se o usuário possui vínculo com data de nascimento e a senha NÃO é mais a genérica,
  -- limpa qualquer flag residual de troca obrigatória (ex.: troca feita por "Esqueci minha senha").
  IF v_nasc IS NOT NULL THEN
    IF COALESCE((v_meta->>'precisa_trocar_senha')::boolean, false) = true THEN
      UPDATE auth.users
      SET raw_user_meta_data = v_meta || jsonb_build_object('precisa_trocar_senha', false),
          updated_at = now()
      WHERE id = v_uid;
    END IF;
    RETURN false;
  END IF;

  RETURN COALESCE((v_meta->>'precisa_trocar_senha')::boolean, false);
END;
$$;

REVOKE ALL ON FUNCTION public.verificar_precisa_trocar_senha() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verificar_precisa_trocar_senha() TO authenticated;

-- 3. RPC administrativa para identificar quem ainda está com a senha genérica
CREATE OR REPLACE FUNCTION public.listar_usuarios_senha_generica()
RETURNS TABLE (
  religioso_id uuid,
  auth_user_id uuid,
  nome text,
  grau text,
  email text,
  usando_senha_generica boolean,
  ultimo_acesso timestamptz,
  credenciais_enviadas_em timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_acessos jsonb;
  v_status text;
  v_autorizado boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  SELECT
    u.usu_status,
    CASE
      WHEN jsonb_typeof(to_jsonb(u.usu_acessos)) = 'string'
        THEN (to_jsonb(u.usu_acessos) #>> '{}')::jsonb
      ELSE to_jsonb(u.usu_acessos)
    END
  INTO v_status, v_acessos
  FROM public.usuarios u
  WHERE u.auth_user_id = v_uid
  LIMIT 1;

  IF v_status = 'Ativo' AND jsonb_typeof(v_acessos) = 'array' THEN
    SELECT EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(v_acessos) AS elem(val)
      WHERE elem.val IN ('admin', 'secretaria', 'religiosos')
    ) INTO v_autorizado;
  END IF;

  IF NOT v_autorizado THEN
    RAISE EXCEPTION 'Acesso negado: permissão de administração ou secretaria necessária.';
  END IF;

  RETURN QUERY
  SELECT
    r.id AS religioso_id,
    u.id AS auth_user_id,
    COALESCE(r.nome_elenco, r.nome_religioso, r.nome_civil) AS nome,
    r.grau,
    u.email::text AS email,
    (
      u.encrypted_password IS NOT NULL
      AND u.encrypted_password <> ''
      AND (
        (
          r.data_nascimento IS NOT NULL
          AND u.encrypted_password = crypt('brm@' || to_char(r.data_nascimento, 'DDMMYYYY'), u.encrypted_password)
        )
        OR u.encrypted_password = crypt('brm@2026scj', u.encrypted_password)
      )
    ) AS usando_senha_generica,
    u.last_sign_in_at AS ultimo_acesso,
    r.credenciais_enviadas_em
  FROM public.religiosos r
  INNER JOIN auth.users u
    ON u.id = r.auth_user_id
  ORDER BY COALESCE(r.nome_elenco, r.nome_civil);
END;
$$;

REVOKE ALL ON FUNCTION public.listar_usuarios_senha_generica() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.listar_usuarios_senha_generica() TO authenticated;
