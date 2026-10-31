const fs = require('fs');
const path = require('path');

const religiosos = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'religiosos_elenco_2026.json'), 'utf8'));

let sql = `-- =========================================================================
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
`;

for (const r of religiosos) {
  if (!r.email) continue; // Pula os 4 sem e-mail

  const email = r.email.trim().toLowerCase().replace(/'/g, "''");
  const nomeCompleto = r.nomeCompleto.replace(/'/g, "''");
  
  if (!r.nascimento) continue;
  const [ano, mes, dia] = r.nascimento.split('-');
  const senhaPlana = `brm@${dia}${mes}${ano}`;

  sql += `
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = '${email}' LIMIT 1;

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
      '${email}',
      crypt('${senhaPlana}', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('nome', '${nomeCompleto}', 'precisa_trocar_senha', true),
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
      json_build_object('sub', v_user_id::text, 'email', '${email}'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualizar senha provisória e flag de troca caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('${senhaPlana}', gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('precisa_trocar_senha', true)::jsonb,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Vincular ID do Auth ao registro oficial de religiosos
  UPDATE public.religiosos
  SET auth_user_id = v_user_id
  WHERE lower(email_institucional) = '${email}'
     OR lower(email_pessoal) = '${email}';

END $$;
`;
}

sql += `
COMMIT;
`;

const outputPath = path.join(__dirname, '..', 'supabase', 'PROVISIONAR_AUTH_USERS_2026.sql');
fs.writeFileSync(outputPath, sql, 'utf8');
console.log(`Script SQL de provisionamento gerado em: ${outputPath}`);
