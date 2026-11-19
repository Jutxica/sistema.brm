-- =============================================================================
-- CORREÇÃO DE CONTAS PROVISIONADAS VIA SQL EM auth.users
-- Resolve o erro "Database error querying schema" no login (GoTrue / Supabase Auth)
--
-- Causa raiz:
-- Contas inseridas diretamente via INSERT INTO auth.users sem preencher as
-- colunas de token com string vazia ('') ficam com NULL. Ao autenticar
-- (signInWithPassword / resetPasswordForEmail / admin.listUsers), o GoTrue
-- falha ao fazer scan de NULL para string em Go e retorna HTTP 500:
-- "Database error querying schema".
--
-- Nota: a coluna `phone` possui constraint UNIQUE e DEVE permanecer NULL.
-- =============================================================================

DO $$
DECLARE
  v_col text;
  v_text_cols text[] := ARRAY[
    'confirmation_token',
    'recovery_token',
    'email_change_token_new',
    'email_change',
    'email_change_token_current',
    'phone_change',
    'phone_change_token',
    'reauthentication_token'
  ];
BEGIN
  -- 1. Normalizar colunas de token (string vazia ao invés de NULL)
  FOREACH v_col IN ARRAY v_text_cols LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'auth'
        AND table_name = 'users'
        AND column_name = v_col
    ) THEN
      EXECUTE format(
        'UPDATE auth.users SET %I = '''' WHERE %I IS NULL',
        v_col,
        v_col
      );
    END IF;
  END LOOP;

  -- 2. Garantir defaults não-nulos em flags booleanas / inteiras esperadas pelo GoTrue
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'is_sso_user'
  ) THEN
    UPDATE auth.users SET is_sso_user = false WHERE is_sso_user IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'is_anonymous'
  ) THEN
    UPDATE auth.users SET is_anonymous = false WHERE is_anonymous IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'email_change_confirm_status'
  ) THEN
    UPDATE auth.users SET email_change_confirm_status = 0 WHERE email_change_confirm_status IS NULL;
  END IF;

  -- 3. Garantir aud/role e raw_app_meta_data válidos
  UPDATE auth.users
  SET
    aud = COALESCE(NULLIF(aud, ''), 'authenticated'),
    role = COALESCE(NULLIF(role, ''), 'authenticated'),
    raw_app_meta_data = COALESCE(raw_app_meta_data, '{"provider":"email","providers":["email"]}'::jsonb),
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
  WHERE aud IS NULL OR aud = ''
     OR role IS NULL OR role = ''
     OR raw_app_meta_data IS NULL
     OR raw_user_meta_data IS NULL;

  -- 4. Garantir registro correspondente em auth.identities para provedores de e-mail
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    u.id,
    jsonb_build_object(
      'sub', u.id::text,
      'email', u.email,
      'email_verified', (u.email_confirmed_at IS NOT NULL),
      'phone_verified', false
    ),
    'email',
    u.id::text,
    COALESCE(u.last_sign_in_at, u.created_at, now()),
    COALESCE(u.created_at, now()),
    now()
  FROM auth.users u
  WHERE u.email IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM auth.identities i
      WHERE i.user_id = u.id
        AND i.provider = 'email'
    );
END $$;
