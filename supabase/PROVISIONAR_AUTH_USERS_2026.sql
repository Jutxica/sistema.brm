-- =========================================================================
-- PROVISIONAMENTO DE CONTAS DE LOGIN NO SUPABASE AUTH (119 RELIGIOSOS)
-- Província Brasileira Meridional dos Sacerdotes do Sagrado Coração de Jesus
-- 
-- Regra de Acesso:
-- - Login: E-mail do confrade
-- - Senha Inicial: brm@<DDMMAAAA> (ex: brm@09111995)
-- - Troca Obrigatória no primeiro acesso (precisa_trocar_senha: true)
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'tiagowaier7@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'tiagowaier7@gmail.com',
      crypt('brm@09111995', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Diácono Tiago Junior Waier', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'tiagowaier7@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@09111995', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'tiagowaier7@gmail.com'
     OR lower(email_pessoal) = 'tiagowaier7@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'dom.murilo@brm.org.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'dom.murilo@brm.org.br',
      crypt('brm@19091943', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Dom Murilo Sebastião Ramos Krieger', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'dom.murilo@brm.org.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@19091943', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'dom.murilo@brm.org.br'
     OR lower(email_pessoal) = 'dom.murilo@brm.org.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'alexandre.johann@brm.org.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'alexandre.johann@brm.org.br',
      crypt('brm@05021991', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Frater Alexandre Johann', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'alexandre.johann@brm.org.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@05021991', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'alexandre.johann@brm.org.br'
     OR lower(email_pessoal) = 'alexandre.johann@brm.org.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'ale12caetano@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'ale12caetano@gmail.com',
      crypt('brm@12111998', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Frater Alexandre Semkiv de A. Caetano', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'ale12caetano@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@12111998', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'ale12caetano@gmail.com'
     OR lower(email_pessoal) = 'ale12caetano@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'artur.hangs@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'artur.hangs@gmail.com',
      crypt('brm@14022001', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Frater Artur Hang', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'artur.hangs@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@14022001', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'artur.hangs@gmail.com'
     OR lower(email_pessoal) = 'artur.hangs@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'cleiton.froehner@icloud.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'cleiton.froehner@icloud.com',
      crypt('brm@17121991', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Frater Cleiton Froehner', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'cleiton.froehner@icloud.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@17121991', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'cleiton.froehner@icloud.com'
     OR lower(email_pessoal) = 'cleiton.froehner@icloud.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'cristianosch26@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'cristianosch26@gmail.com',
      crypt('brm@26021990', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Frater Cristiano Schneider', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'cristianosch26@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@26021990', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'cristianosch26@gmail.com'
     OR lower(email_pessoal) = 'cristianosch26@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'daugmar_kraus@brm.org.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'daugmar_kraus@brm.org.br',
      crypt('brm@07101999', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Frater Daugmar Zeitz Kraus', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'daugmar_kraus@brm.org.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@07101999', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'daugmar_kraus@brm.org.br'
     OR lower(email_pessoal) = 'daugmar_kraus@brm.org.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'djonatan.engelmann@brm.org.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'djonatan.engelmann@brm.org.br',
      crypt('brm@12051992', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Frater Djonatan Engelmann', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'djonatan.engelmann@brm.org.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@12051992', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'djonatan.engelmann@brm.org.br'
     OR lower(email_pessoal) = 'djonatan.engelmann@brm.org.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'erikpatrik02@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'erikpatrik02@gmail.com',
      crypt('brm@20031996', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Frater Erik Patrik Fantini', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'erikpatrik02@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@20031996', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'erikpatrik02@gmail.com'
     OR lower(email_pessoal) = 'erikpatrik02@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'filipe.potter1709@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'filipe.potter1709@gmail.com',
      crypt('brm@17092003', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Frater Filipe José Potter', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'filipe.potter1709@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@17092003', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'filipe.potter1709@gmail.com'
     OR lower(email_pessoal) = 'filipe.potter1709@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'geovanalbertao@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'geovanalbertao@gmail.com',
      crypt('brm@11091998', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Frater Geovan Luiz Alberton', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'geovanalbertao@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@11091998', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'geovanalbertao@gmail.com'
     OR lower(email_pessoal) = 'geovanalbertao@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'henrique_silva@brm.org.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'henrique_silva@brm.org.br',
      crypt('brm@04042003', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Frater Henrique Carvalho da Silva', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'henrique_silva@brm.org.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@04042003', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'henrique_silva@brm.org.br'
     OR lower(email_pessoal) = 'henrique_silva@brm.org.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'honaycon@brm.org.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'honaycon@brm.org.br',
      crypt('brm@30111994', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Frater Honaycon Gonçalves', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'honaycon@brm.org.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@30111994', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'honaycon@brm.org.br'
     OR lower(email_pessoal) = 'honaycon@brm.org.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'iagomafracunha@outlook.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'iagomafracunha@outlook.com',
      crypt('brm@25031998', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Frater Iago Mafra Cunha', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'iagomafracunha@outlook.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@25031998', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'iagomafracunha@outlook.com'
     OR lower(email_pessoal) = 'iagomafracunha@outlook.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'phnjefer@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'phnjefer@gmail.com',
      crypt('brm@26031987', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Frater Jeferson Adriano Caldas', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'phnjefer@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@26031987', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'phnjefer@gmail.com'
     OR lower(email_pessoal) = 'phnjefer@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'joaopedro_scj@brm.org.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'joaopedro_scj@brm.org.br',
      crypt('brm@30062002', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Frater João Pedro Dutra Walecki', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'joaopedro_scj@brm.org.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@30062002', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'joaopedro_scj@brm.org.br'
     OR lower(email_pessoal) = 'joaopedro_scj@brm.org.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'marciorech84@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'marciorech84@gmail.com',
      crypt('brm@16011984', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Frater Márcio Rech', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'marciorech84@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@16011984', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'marciorech84@gmail.com'
     OR lower(email_pessoal) = 'marciorech84@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'pedroh03@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'pedroh03@hotmail.com',
      crypt('brm@17082000', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Frater Pedro Henrique Oliveira de Paula', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'pedroh03@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@17082000', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'pedroh03@hotmail.com'
     OR lower(email_pessoal) = 'pedroh03@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'renatosf_scj@brm.org.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'renatosf_scj@brm.org.br',
      crypt('brm@21012001', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Frater Renato Schweitzer Filho', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'renatosf_scj@brm.org.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@21012001', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'renatosf_scj@brm.org.br'
     OR lower(email_pessoal) = 'renatosf_scj@brm.org.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'ricardo.vinter@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'ricardo.vinter@gmail.com',
      crypt('brm@04121992', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Frater Ricardo Vinter', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'ricardo.vinter@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@04121992', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'ricardo.vinter@gmail.com'
     OR lower(email_pessoal) = 'ricardo.vinter@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'thf.scj@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'thf.scj@gmail.com',
      crypt('brm@15091987', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Frater Thiago Hermenegildo de Faria', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'thf.scj@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@15091987', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'thf.scj@gmail.com'
     OR lower(email_pessoal) = 'thf.scj@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'ederson.krause@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'ederson.krause@hotmail.com',
      crypt('brm@19011987', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Irmão Ederson Krause', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'ederson.krause@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@19011987', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'ederson.krause@hotmail.com'
     OR lower(email_pessoal) = 'ederson.krause@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'itaianan@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'itaianan@gmail.com',
      crypt('brm@11111985', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Irmão Itaianan Bazza Vieira', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'itaianan@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@11111985', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'itaianan@gmail.com'
     OR lower(email_pessoal) = 'itaianan@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'ademir.wickert@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'ademir.wickert@gmail.com',
      crypt('brm@06011975', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Ademir Wickert', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'ademir.wickert@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@06011975', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'ademir.wickert@gmail.com'
     OR lower(email_pessoal) = 'ademir.wickert@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'colombiadilson@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'colombiadilson@gmail.com',
      crypt('brm@15071942', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Adilson José Colombi', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'colombiadilson@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@15071942', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'colombiadilson@gmail.com'
     OR lower(email_pessoal) = 'colombiadilson@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'afmolinari@yahoo.com.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'afmolinari@yahoo.com.br',
      crypt('brm@16021972', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Afonso Molinari', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'afmolinari@yahoo.com.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@16021972', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'afmolinari@yahoo.com.br'
     OR lower(email_pessoal) = 'afmolinari@yahoo.com.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'airtonscj@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'airtonscj@hotmail.com',
      crypt('brm@23041955', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Airton Franzner', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'airtonscj@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@23041955', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'airtonscj@hotmail.com'
     OR lower(email_pessoal) = 'airtonscj@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'albertoluizhuber@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'albertoluizhuber@gmail.com',
      crypt('brm@16091946', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Alberto Luiz Huber', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'albertoluizhuber@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@16091946', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'albertoluizhuber@gmail.com'
     OR lower(email_pessoal) = 'albertoluizhuber@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'alceuluizweber@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'alceuluizweber@gmail.com',
      crypt('brm@09091959', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Alceu Luiz Weber', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'alceuluizweber@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@09091959', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'alceuluizweber@gmail.com'
     OR lower(email_pessoal) = 'alceuluizweber@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'aldocicerolisboa@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'aldocicerolisboa@gmail.com',
      crypt('brm@09041984', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Aldo Cícero Lisboa', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'aldocicerolisboa@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@09041984', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'aldocicerolisboa@gmail.com'
     OR lower(email_pessoal) = 'aldocicerolisboa@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'alessiosc@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'alessiosc@gmail.com',
      crypt('brm@28031974', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Aléssio da Rosa', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'alessiosc@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@28031974', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'alessiosc@gmail.com'
     OR lower(email_pessoal) = 'alessiosc@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'ale_barbosa01@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'ale_barbosa01@hotmail.com',
      crypt('brm@15051986', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Alexandre Barbosa', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'ale_barbosa01@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@15051986', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'ale_barbosa01@hotmail.com'
     OR lower(email_pessoal) = 'ale_barbosa01@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'padrealirio@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'padrealirio@gmail.com',
      crypt('brm@24031938', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Alírio José Pedrini', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'padrealirio@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@24031938', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'padrealirio@gmail.com'
     OR lower(email_pessoal) = 'padrealirio@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'anderson_csv@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'anderson_csv@hotmail.com',
      crypt('brm@01091991', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Anderson Carlos S. Viana', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'anderson_csv@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@01091991', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'anderson_csv@hotmail.com'
     OR lower(email_pessoal) = 'anderson_csv@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'abstche@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'abstche@gmail.com',
      crypt('brm@29021980', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre André Borges da Silva', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'abstche@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@29021980', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'abstche@gmail.com'
     OR lower(email_pessoal) = 'abstche@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'dalcastagner@icloud.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'dalcastagner@icloud.com',
      crypt('brm@01051968', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Anésio Dalcastagner', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'dalcastagner@icloud.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@01051968', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'dalcastagner@icloud.com'
     OR lower(email_pessoal) = 'dalcastagner@icloud.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'anisioscj@yahoo.com.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'anisioscj@yahoo.com.br',
      crypt('brm@30091971', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Anísio José Schwirkowski', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'anisioscj@yahoo.com.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@30091971', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'anisioscj@yahoo.com.br'
     OR lower(email_pessoal) = 'anisioscj@yahoo.com.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'ari.erthal@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'ari.erthal@gmail.com',
      crypt('brm@17121971', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Ari João Erthal', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'ari.erthal@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@17121971', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'ari.erthal@gmail.com'
     OR lower(email_pessoal) = 'ari.erthal@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'padrearildo@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'padrearildo@gmail.com',
      crypt('brm@24111971', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Arildo José Ferrari', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'padrearildo@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@24111971', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'padrearildo@gmail.com'
     OR lower(email_pessoal) = 'padrearildo@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'aurelioguarani@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'aurelioguarani@gmail.com',
      crypt('brm@22011961', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Aurélio Pereira', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'aurelioguarani@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@22011961', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'aurelioguarani@gmail.com'
     OR lower(email_pessoal) = 'aurelioguarani@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'kbjojappascj@yahoo.co.in' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'kbjojappascj@yahoo.co.in',
      crypt('brm@22101983', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Bala Jojappa Kakumanu', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'kbjojappascj@yahoo.co.in'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@22101983', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'kbjojappascj@yahoo.co.in'
     OR lower(email_pessoal) = 'kbjojappascj@yahoo.co.in';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'betoscj@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'betoscj@gmail.com',
      crypt('brm@28111966', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Carlos Alberto Rodrigues', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'betoscj@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@28111966', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'betoscj@gmail.com'
     OR lower(email_pessoal) = 'betoscj@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'nicolodelli7@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'nicolodelli7@gmail.com',
      crypt('brm@12101949', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Carlos Marcos Nicolodelli', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'nicolodelli7@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@12101949', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'nicolodelli7@gmail.com'
     OR lower(email_pessoal) = 'nicolodelli7@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'carlosrobertoscj@yahoo.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'carlosrobertoscj@yahoo.com',
      crypt('brm@27111980', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Carlos Roberto de Oliveira', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'carlosrobertoscj@yahoo.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@27111980', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'carlosrobertoscj@yahoo.com'
     OR lower(email_pessoal) = 'carlosrobertoscj@yahoo.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'frcezar@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'frcezar@hotmail.com',
      crypt('brm@19061971', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Cezar Augusto Hammes', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'frcezar@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@19061971', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'frcezar@hotmail.com'
     OR lower(email_pessoal) = 'frcezar@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'cicero.murara@esic.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'cicero.murara@esic.br',
      crypt('brm@08091971', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Cícero Celeste Murara', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'cicero.murara@esic.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@08091971', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'cicero.murara@esic.br'
     OR lower(email_pessoal) = 'cicero.murara@esic.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'claudinhoscj@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'claudinhoscj@gmail.com',
      crypt('brm@01121972', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Cláudio Márcio Piontkewicz', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'claudinhoscj@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@01121972', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'claudinhoscj@gmail.com'
     OR lower(email_pessoal) = 'claudinhoscj@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'padretiagoscj@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'padretiagoscj@gmail.com',
      crypt('brm@12051986', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Cristiano Tiago Araújo', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'padretiagoscj@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@12051986', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'padretiagoscj@gmail.com'
     OR lower(email_pessoal) = 'padretiagoscj@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'd.marasca@yahoo.com.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'd.marasca@yahoo.com.br',
      crypt('brm@17011989', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Darlan Dejaime Marasca', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'd.marasca@yahoo.com.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@17011989', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'd.marasca@yahoo.com.br'
     OR lower(email_pessoal) = 'd.marasca@yahoo.com.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'diego_scj@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'diego_scj@hotmail.com',
      crypt('brm@21051988', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Diego Martins', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'diego_scj@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@21051988', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'diego_scj@hotmail.com'
     OR lower(email_pessoal) = 'diego_scj@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'diomarscj@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'diomarscj@hotmail.com',
      crypt('brm@27051983', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Diomar Romaniv', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'diomarscj@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@27051983', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'diomarscj@hotmail.com'
     OR lower(email_pessoal) = 'diomarscj@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'eloiscj@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'eloiscj@gmail.com',
      crypt('brm@04051956', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Elói Comper', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'eloiscj@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@04051956', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'eloiscj@gmail.com'
     OR lower(email_pessoal) = 'eloiscj@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'eloijschons@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'eloijschons@gmail.com',
      crypt('brm@11121953', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Elói José Schons', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'eloijschons@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@11121953', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'eloijschons@gmail.com'
     OR lower(email_pessoal) = 'eloijschons@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'emer_guima@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'emer_guima@hotmail.com',
      crypt('brm@29101972', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Emerson Guimarães', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'emer_guima@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@29101972', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'emer_guima@hotmail.com'
     OR lower(email_pessoal) = 'emer_guima@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'fabioluizscj@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'fabioluizscj@gmail.com',
      crypt('brm@26091986', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Fábio Luiz Pereira', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'fabioluizscj@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@26091986', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'fabioluizscj@gmail.com'
     OR lower(email_pessoal) = 'fabioluizscj@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'pachecoscj@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'pachecoscj@gmail.com',
      crypt('brm@25081992', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Fagner Ramon Pacheco Haas', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'pachecoscj@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@25081992', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'pachecoscj@gmail.com'
     OR lower(email_pessoal) = 'pachecoscj@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'fernandoteckler@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'fernandoteckler@gmail.com',
      crypt('brm@27061995', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Fernando Teckler', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'fernandoteckler@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@27061995', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'fernandoteckler@gmail.com'
     OR lower(email_pessoal) = 'fernandoteckler@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'franclawal@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'franclawal@gmail.com',
      crypt('brm@12011964', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Francisco Lawall', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'franclawal@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@12011964', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'franclawal@gmail.com'
     OR lower(email_pessoal) = 'franclawal@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'galdino.becker@brm.org.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'galdino.becker@brm.org.br',
      crypt('brm@24071931', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Galdino Becker', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'galdino.becker@brm.org.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@24071931', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'galdino.becker@brm.org.br'
     OR lower(email_pessoal) = 'galdino.becker@brm.org.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'pgkohler@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'pgkohler@hotmail.com',
      crypt('brm@08011952', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Geraldo Kohler', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'pgkohler@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@08011952', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'pgkohler@hotmail.com'
     OR lower(email_pessoal) = 'pgkohler@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'bonatoscj@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'bonatoscj@gmail.com',
      crypt('brm@08121961', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Gilberto Bonato Xavier', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'bonatoscj@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@08121961', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'bonatoscj@gmail.com'
     OR lower(email_pessoal) = 'bonatoscj@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'giba.luiz@yahoo.com.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'giba.luiz@yahoo.com.br',
      crypt('brm@28061968', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Gilberto Luiz R. de Miranda', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'giba.luiz@yahoo.com.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@28061968', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'giba.luiz@yahoo.com.br'
     OR lower(email_pessoal) = 'giba.luiz@yahoo.com.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'mittelstaed6@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'mittelstaed6@gmail.com',
      crypt('brm@26041978', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Gilberto Moisés Bohn Mittelstead', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'mittelstaed6@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@26041978', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'mittelstaed6@gmail.com'
     OR lower(email_pessoal) = 'mittelstaed6@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'gio_pontes@yahoo.com.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'gio_pontes@yahoo.com.br',
      crypt('brm@20121963', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Giovani Pontes', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'gio_pontes@yahoo.com.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@20121963', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'gio_pontes@yahoo.com.br'
     OR lower(email_pessoal) = 'gio_pontes@yahoo.com.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'heliofeuser@yahoo.com.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'heliofeuser@yahoo.com.br',
      crypt('brm@30111966', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Hélio Feuser', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'heliofeuser@yahoo.com.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@30111966', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'heliofeuser@yahoo.com.br'
     OR lower(email_pessoal) = 'heliofeuser@yahoo.com.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'peitajose@yahoo.com.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'peitajose@yahoo.com.br',
      crypt('brm@02091967', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Itamar José Zigowski', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'peitajose@yahoo.com.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@02091967', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'peitajose@yahoo.com.br'
     OR lower(email_pessoal) = 'peitajose@yahoo.com.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'scjjaimeludwig@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'scjjaimeludwig@gmail.com',
      crypt('brm@14121981', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Jaime Ludwig', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'scjjaimeludwig@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@14121981', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'scjjaimeludwig@gmail.com'
     OR lower(email_pessoal) = 'scjjaimeludwig@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'jair.costa@brm.org.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'jair.costa@brm.org.br',
      crypt('brm@29081953', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Jair Rodrigues Costa', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'jair.costa@brm.org.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@29081953', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'jair.costa@brm.org.br'
     OR lower(email_pessoal) = 'jair.costa@brm.org.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'joao.boeing@brm.org.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'joao.boeing@brm.org.br',
      crypt('brm@17051953', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre João Sebastião Boeing', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'joao.boeing@brm.org.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@17051953', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'joao.boeing@brm.org.br'
     OR lower(email_pessoal) = 'joao.boeing@brm.org.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'jfa.scj@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'jfa.scj@gmail.com',
      crypt('brm@25121947', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre José Francisco Alves', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'jfa.scj@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@25121947', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'jfa.scj@gmail.com'
     OR lower(email_pessoal) = 'jfa.scj@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'penapoleaoscj@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'penapoleaoscj@gmail.com',
      crypt('brm@14101952', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre José Napoleão Laureano dos Santos', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'penapoleaoscj@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@14101952', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'penapoleaoscj@gmail.com'
     OR lower(email_pessoal) = 'penapoleaoscj@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'josezscj@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'josezscj@gmail.com',
      crypt('brm@30041996', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre José Ricardo H. Zorer', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'josezscj@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@30041996', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'josezscj@gmail.com'
     OR lower(email_pessoal) = 'josezscj@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'josimarscj@yahoo.com.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'josimarscj@yahoo.com.br',
      crypt('brm@23081986', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Josimar Baggio', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'josimarscj@yahoo.com.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@23081986', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'josimarscj@yahoo.com.br'
     OR lower(email_pessoal) = 'josimarscj@yahoo.com.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'kleberscjsul@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'kleberscjsul@gmail.com',
      crypt('brm@30081963', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Kleber Ferreira de Oliveira', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'kleberscjsul@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@30081963', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'kleberscjsul@gmail.com'
     OR lower(email_pessoal) = 'kleberscjsul@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'pleoscj@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'pleoscj@hotmail.com',
      crypt('brm@26101953', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Léo Heck', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'pleoscj@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@26101953', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'pleoscj@hotmail.com'
     OR lower(email_pessoal) = 'pleoscj@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'jacomelli10@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'jacomelli10@hotmail.com',
      crypt('brm@20071995', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Leonardo Jacomelli', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'jacomelli10@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@20071995', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'jacomelli10@hotmail.com'
     OR lower(email_pessoal) = 'jacomelli10@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'lindolfoneves@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'lindolfoneves@hotmail.com',
      crypt('brm@27071964', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Lindolfo Neves Braga', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'lindolfoneves@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@27071964', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'lindolfoneves@hotmail.com'
     OR lower(email_pessoal) = 'lindolfoneves@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'pelucas.scheid@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'pelucas.scheid@hotmail.com',
      crypt('brm@14111939', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Lucas Ignacio Scheid', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'pelucas.scheid@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@14111939', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'pelucas.scheid@hotmail.com'
     OR lower(email_pessoal) = 'pelucas.scheid@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'ltollerscj@yahoo.com.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'ltollerscj@yahoo.com.br',
      crypt('brm@10091977', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Luciano José Toller', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'ltollerscj@yahoo.com.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@10091977', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'ltollerscj@yahoo.com.br'
     OR lower(email_pessoal) = 'ltollerscj@yahoo.com.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'pluizfaria@yahoo.com.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'pluizfaria@yahoo.com.br',
      crypt('brm@21031953', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Luiz Antônio de Faria', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'pluizfaria@yahoo.com.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@21031953', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'pluizfaria@yahoo.com.br'
     OR lower(email_pessoal) = 'pluizfaria@yahoo.com.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'lcberri@outlook.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'lcberri@outlook.com',
      crypt('brm@18041958', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Luiz Carlos Berri', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'lcberri@outlook.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@18041958', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'lcberri@outlook.com'
     OR lower(email_pessoal) = 'lcberri@outlook.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'luisscj@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'luisscj@gmail.com',
      crypt('brm@26121980', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Luiz Mazzochini', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'luisscj@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@26121980', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'luisscj@gmail.com'
     OR lower(email_pessoal) = 'luisscj@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'mjbcaneppele@yahoo.com.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'mjbcaneppele@yahoo.com.br',
      crypt('brm@24041980', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Magnos José Baron Caneppele', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'mjbcaneppele@yahoo.com.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@24041980', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'mjbcaneppele@yahoo.com.br'
     OR lower(email_pessoal) = 'mjbcaneppele@yahoo.com.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'marcialscj@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'marcialscj@gmail.com',
      crypt('brm@16071966', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Marcial Maçaneiro', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'marcialscj@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@16071966', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'marcialscj@gmail.com'
     OR lower(email_pessoal) = 'marcialscj@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'marcio.auth@scj.de' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'marcio.auth@scj.de',
      crypt('brm@03061976', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Márcio Antônio Auth', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'marcio.auth@scj.de'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@03061976', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'marcio.auth@scj.de'
     OR lower(email_pessoal) = 'marcio.auth@scj.de';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'marcos.pdh@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'marcos.pdh@gmail.com',
      crypt('brm@03061989', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Marcos Antônio Bernardes', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'marcos.pdh@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@03061989', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'marcos.pdh@gmail.com'
     OR lower(email_pessoal) = 'marcos.pdh@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'marianoscj@yahoo.com.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'marianoscj@yahoo.com.br',
      crypt('brm@24031956', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Mariano Weizenmann', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'marianoscj@yahoo.com.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@24031956', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'marianoscj@yahoo.com.br'
     OR lower(email_pessoal) = 'marianoscj@yahoo.com.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'mariltonn@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'mariltonn@gmail.com',
      crypt('brm@09121968', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Marilton Nuss', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'mariltonn@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@09121968', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'mariltonn@gmail.com'
     OR lower(email_pessoal) = 'mariltonn@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'pemariopeixe@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'pemariopeixe@gmail.com',
      crypt('brm@07011946', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Mário Peixe', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'pemariopeixe@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@07011946', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'pemariopeixe@gmail.com'
     OR lower(email_pessoal) = 'pemariopeixe@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'mariotitoscj@yahoo.com.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'mariotitoscj@yahoo.com.br',
      crypt('brm@13021967', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Mário Tito Angioletti', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'mariotitoscj@yahoo.com.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@13021967', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'mariotitoscj@yahoo.com.br'
     OR lower(email_pessoal) = 'mariotitoscj@yahoo.com.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'mauridio.weber@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'mauridio.weber@hotmail.com',
      crypt('brm@27021955', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Maurídio Weber', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'mauridio.weber@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@27021955', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'mauridio.weber@hotmail.com'
     OR lower(email_pessoal) = 'mauridio.weber@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'miguel.silva@unifebe.edu.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'miguel.silva@unifebe.edu.br',
      crypt('brm@13021974', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Miguel da Silva', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'miguel.silva@unifebe.edu.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@13021974', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'miguel.silva@unifebe.edu.br'
     OR lower(email_pessoal) = 'miguel.silva@unifebe.edu.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'penelsonscj@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'penelsonscj@gmail.com',
      crypt('brm@02011946', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Nelson Tachini', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'penelsonscj@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@02011946', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'penelsonscj@gmail.com'
     OR lower(email_pessoal) = 'penelsonscj@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'nilsonscj@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'nilsonscj@hotmail.com',
      crypt('brm@02031981', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Nilson Hellmann', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'nilsonscj@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@02031981', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'nilsonscj@hotmail.com'
     OR lower(email_pessoal) = 'nilsonscj@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'nivas247@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'nivas247@gmail.com',
      crypt('brm@10111946', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Nivaldo Alves de Souza', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'nivas247@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@10111946', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'nivas247@gmail.com'
     OR lower(email_pessoal) = 'nivas247@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'odilo.leviski@outlook.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'odilo.leviski@outlook.com',
      crypt('brm@07031945', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Odilo Antônio Leviski', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'odilo.leviski@outlook.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@07031945', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'odilo.leviski@outlook.com'
     OR lower(email_pessoal) = 'odilo.leviski@outlook.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'olindo59@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'olindo59@hotmail.com',
      crypt('brm@14081959', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Olindo Smaniotto', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'olindo59@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@14081959', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'olindo59@hotmail.com'
     OR lower(email_pessoal) = 'olindo59@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'osvaldorech@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'osvaldorech@gmail.com',
      crypt('brm@07121952', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Osvaldo Rech', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'osvaldorech@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@07121952', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'osvaldorech@gmail.com'
     OR lower(email_pessoal) = 'osvaldorech@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'padreeuricoscj@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'padreeuricoscj@hotmail.com',
      crypt('brm@30091949', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Paulo Eurico Krautler', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'padreeuricoscj@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@30091949', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'padreeuricoscj@hotmail.com'
     OR lower(email_pessoal) = 'padreeuricoscj@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'pepauloscj@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'pepauloscj@hotmail.com',
      crypt('brm@17011970', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Paulo Vanderlei Riffel', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'pepauloscj@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@17011970', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'pepauloscj@hotmail.com'
     OR lower(email_pessoal) = 'pepauloscj@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'pe.pedro.nelson@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'pe.pedro.nelson@gmail.com',
      crypt('brm@15071949', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Pedro Nelson Brentano', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'pe.pedro.nelson@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@15071949', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'pe.pedro.nelson@gmail.com'
     OR lower(email_pessoal) = 'pe.pedro.nelson@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'rohrrenatoj@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'rohrrenatoj@gmail.com',
      crypt('brm@11071947', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Renato José Rohr', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'rohrrenatoj@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@11071947', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'rohrrenatoj@gmail.com'
     OR lower(email_pessoal) = 'rohrrenatoj@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'renatoscj@yahoo.com.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'renatoscj@yahoo.com.br',
      crypt('brm@26101983', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Renato Vicente Polh', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'renatoscj@yahoo.com.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@26101983', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'renatoscj@yahoo.com.br'
     OR lower(email_pessoal) = 'renatoscj@yahoo.com.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'renatolimascj@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'renatolimascj@gmail.com',
      crypt('brm@17041994', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Renato Vieira Lima', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'renatolimascj@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@17041994', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'renatolimascj@gmail.com'
     OR lower(email_pessoal) = 'renatolimascj@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'robsonrochascj@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'robsonrochascj@gmail.com',
      crypt('brm@06101968', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Robson Rocha da Silva', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'robsonrochascj@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@06101968', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'robsonrochascj@gmail.com'
     OR lower(email_pessoal) = 'robsonrochascj@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'bentoscj@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'bentoscj@gmail.com',
      crypt('brm@23111987', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Rodrigo Bento', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'bentoscj@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@23111987', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'bentoscj@gmail.com'
     OR lower(email_pessoal) = 'bentoscj@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'rodrigotascheck@icloud.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'rodrigotascheck@icloud.com',
      crypt('brm@26121989', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Rodrigo Fernando Tascheck', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'rodrigotascheck@icloud.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@26121989', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'rodrigotascheck@icloud.com'
     OR lower(email_pessoal) = 'rodrigotascheck@icloud.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'rubensrieg@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'rubensrieg@gmail.com',
      crypt('brm@20021975', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Rubens Rieg', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'rubensrieg@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@20021975', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'rubensrieg@gmail.com'
     OR lower(email_pessoal) = 'rubensrieg@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'sebpitz@yahoo.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'sebpitz@yahoo.com',
      crypt('brm@05061952', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Sebastião Pitz', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'sebpitz@yahoo.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@05061952', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'sebpitz@yahoo.com'
     OR lower(email_pessoal) = 'sebpitz@yahoo.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'sergiodacosta0@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'sergiodacosta0@gmail.com',
      crypt('brm@07061969', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Sérgio Luís da Costa', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'sergiodacosta0@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@07061969', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'sergiodacosta0@gmail.com'
     OR lower(email_pessoal) = 'sergiodacosta0@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'silvano.borba@yahoo.com.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'silvano.borba@yahoo.com.br',
      crypt('brm@10031977', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Silvano Borba', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'silvano.borba@yahoo.com.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@10031977', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'silvano.borba@yahoo.com.br'
     OR lower(email_pessoal) = 'silvano.borba@yahoo.com.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'silvano.costa8@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'silvano.costa8@gmail.com',
      crypt('brm@23081975', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Silvano João da Costa', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'silvano.costa8@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@23081975', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'silvano.costa8@gmail.com'
     OR lower(email_pessoal) = 'silvano.costa8@gmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'silvino.hoepers@brm.org.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'silvino.hoepers@brm.org.br',
      crypt('brm@10011948', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Silvino Hoepers', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'silvino.hoepers@brm.org.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@10011948', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'silvino.hoepers@brm.org.br'
     OR lower(email_pessoal) = 'silvino.hoepers@brm.org.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'simao.santos@brm.org.br' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'simao.santos@brm.org.br',
      crypt('brm@28101970', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Simão Pedro C. dos Santos', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'simao.santos@brm.org.br'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@28101970', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'simao.santos@brm.org.br'
     OR lower(email_pessoal) = 'simao.santos@brm.org.br';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'tarcisio.feldhaus@scj.de' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'tarcisio.feldhaus@scj.de',
      crypt('brm@25011966', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Tarcísio Darrós Feldhaus', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'tarcisio.feldhaus@scj.de'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@25011966', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'tarcisio.feldhaus@scj.de'
     OR lower(email_pessoal) = 'tarcisio.feldhaus@scj.de';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'thomas_mdj@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'thomas_mdj@hotmail.com',
      crypt('brm@28071987', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Thomas Antônio B. Mittelstaed', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'thomas_mdj@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@28071987', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'thomas_mdj@hotmail.com'
     OR lower(email_pessoal) = 'thomas_mdj@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'vilsonjcomandolli@hotmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'vilsonjcomandolli@hotmail.com',
      crypt('brm@25031958', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Vilson José Comandolli', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'vilsonjcomandolli@hotmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@25031958', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'vilsonjcomandolli@hotmail.com'
     OR lower(email_pessoal) = 'vilsonjcomandolli@hotmail.com';

END $$;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'zaqueuscj@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'zaqueuscj@gmail.com',
      crypt('brm@23091985', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', 'Padre Zaqueu Suczeck', 'precisa_trocar_senha', true),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'zaqueuscj@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('brm@23091985', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = 'zaqueuscj@gmail.com'
     OR lower(email_pessoal) = 'zaqueuscj@gmail.com';

END $$;

COMMIT;
