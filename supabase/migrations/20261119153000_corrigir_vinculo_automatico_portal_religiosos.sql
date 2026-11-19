-- =============================================================================
-- CORREÇÃO DO VÍNCULO CONTA AUTH <-> FICHA DE RELIGIOSOS NO PORTAL
-- Resolve o erro:
--   "Os dados necessários ao vínculo não foram encontrados. Contate a Secretaria Provincial."
-- mesmo quando a ficha já existe e está aprovada em public.religiosos.
--
-- O que esta migration faz:
-- 1. Atualiza a trigger `proteger_vinculo_auth_religioso` (se existir) para
--    aceitar normalização via trim() e chamadas das RPCs oficiais / manutenção.
-- 2. Vincula automaticamente em lote todas as fichas em `public.religiosos`
--    sem `auth_user_id` (ou com `auth_user_id` órfão) às contas confirmadas
--    correspondentes em `auth.users` pelo e-mail institucional ou pessoal.
-- 3. Atualiza `ensure_religious_portal_profile()` para vincular automaticamente
--    pelo e-mail confirmado quando houver ficha única correspondente, sem exigir
--    CPF/data_nascimento no raw_user_meta_data de contas provisionadas.
-- 4. Atualiza `secretaria_revisar_ficha()` para também vincular `auth_user_id`
--    automaticamente ao aprovar a ficha caso a conta Auth já exista.
-- =============================================================================

BEGIN;

-- 1. Tornar a trigger de proteção compatível com trim() e com as RPCs autorizadas
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'religiosos'
      AND t.tgname = 'trg_proteger_vinculo_auth_religioso'
  ) THEN
    CREATE OR REPLACE FUNCTION public.proteger_vinculo_auth_religioso()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, auth
    AS $fn$
    BEGIN
      -- Permitir operações administrativas do banco (SQL Editor / migrations / service_role)
      -- ou RPCs internas autorizadas (ensure_religious_portal_profile / secretaria_revisar_ficha)
      IF auth.uid() IS NULL
        OR current_setting('app.portal_vinculo_rpc', true) = 'on'
        OR public.elenco_secretaria_autorizada()
      THEN
        RETURN NEW;
      END IF;

      IF TG_OP = 'INSERT' THEN
        IF NEW.auth_user_id IS NOT NULL AND NEW.auth_user_id IS DISTINCT FROM auth.uid() THEN
          RAISE EXCEPTION 'Uma conta só pode criar o próprio vínculo de autenticação.'
            USING ERRCODE = '42501';
        END IF;
        RETURN NEW;
      END IF;

      IF NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id THEN
        IF OLD.auth_user_id IS NULL
          AND NEW.auth_user_id = auth.uid()
          AND nullif(lower(trim(coalesce(auth.jwt() ->> 'email', ''))), '') IS NOT NULL
          AND lower(trim(auth.jwt() ->> 'email')) IN (
            nullif(lower(trim(coalesce(OLD.email_institucional, ''))), ''),
            nullif(lower(trim(coalesce(OLD.email_pessoal, ''))), '')
          ) THEN
          RETURN NEW;
        END IF;

        RAISE EXCEPTION 'Somente a Secretaria pode alterar o vínculo da conta do religioso.'
          USING ERRCODE = '42501';
      END IF;

      RETURN NEW;
    END;
    $fn$;
  END IF;
END $$;

-- 2. Vincular em lote fichas sem auth_user_id (ou com auth_user_id órfão) às contas confirmadas
DO $$
DECLARE
  rec RECORD;
BEGIN
  PERFORM set_config('app.portal_vinculo_rpc', 'on', true);

  -- 2a. Limpar auth_user_id órfão (que aponta para conta inexistente em auth.users)
  UPDATE public.religiosos r
  SET auth_user_id = NULL,
      updated_at = now()
  WHERE r.auth_user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM auth.users u WHERE u.id = r.auth_user_id
    );

  -- 2b. Vincular fichas únicas às contas Auth confirmadas pelo e-mail (institucional ou pessoal)
  FOR rec IN
    WITH matches AS (
      SELECT
        r.id AS religioso_id,
        u.id AS auth_user_id,
        count(*) OVER (PARTITION BY r.id) AS contas_por_religioso,
        count(*) OVER (PARTITION BY u.id) AS religiosos_por_conta
      FROM public.religiosos r
      INNER JOIN auth.users u
        ON u.email IS NOT NULL
       AND u.email_confirmed_at IS NOT NULL
       AND (
         lower(trim(coalesce(r.email_institucional, ''))) = lower(trim(u.email))
         OR lower(trim(coalesce(r.email_pessoal, ''))) = lower(trim(u.email))
       )
      WHERE r.auth_user_id IS NULL
        AND coalesce(r.status_cadastro, '') <> 'Arquivado'
        AND NOT EXISTS (
          SELECT 1
          FROM public.religiosos r2
          WHERE r2.auth_user_id = u.id
        )
    )
    SELECT religioso_id, auth_user_id
    FROM matches
    WHERE contas_por_religioso = 1
      AND religiosos_por_conta = 1
  LOOP
    UPDATE public.religiosos
    SET auth_user_id = rec.auth_user_id,
        updated_at = now()
    WHERE id = rec.religioso_id
      AND auth_user_id IS NULL;
  END LOOP;
END $$;

-- 3. Atualizar ensure_religious_portal_profile() para vincular pelo e-mail confirmado
CREATE OR REPLACE FUNCTION public.ensure_religious_portal_profile()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_auth_user auth.users%rowtype;
  v_email text;
  v_meta jsonb;
  v_cpf text;
  v_name text;
  v_birth_date date;
  v_matches integer;
  v_religioso public.religiosos%rowtype;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Faça login para vincular seu cadastro.';
  END IF;

  SELECT * INTO v_auth_user
  FROM auth.users
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_auth_user.id IS NULL OR v_auth_user.email_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'Confirme o e-mail da conta antes de acessar o portal.';
  END IF;

  v_email := lower(trim(v_auth_user.email));
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'A conta autenticada não possui um e-mail válido.';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('email:' || v_email, 0));

  -- 1º: Já existe vínculo direto por auth_user_id
  SELECT count(*) INTO v_matches
  FROM public.religiosos
  WHERE auth_user_id = v_user_id;

  IF v_matches > 1 THEN
    RAISE EXCEPTION 'Há mais de uma ficha vinculada à sua conta. Contate a Secretaria Provincial.';
  ELSIF v_matches = 1 THEN
    SELECT * INTO v_religioso
    FROM public.religiosos
    WHERE auth_user_id = v_user_id
    LIMIT 1;
    IF v_religioso.status_cadastro = 'Arquivado' THEN
      RAISE EXCEPTION 'Esta ficha está arquivada. Contate a Secretaria Provincial.';
    END IF;
    RETURN v_religioso.id;
  END IF;

  -- 2º: Vincular automaticamente quando houver ficha oficial única com o mesmo e-mail confirmado
  -- (cobre contas provisionadas/convidadas pela Secretaria, mesmo sem CPF no raw_user_meta_data)
  SELECT count(*) INTO v_matches
  FROM public.religiosos
  WHERE (
      lower(trim(coalesce(email_institucional, ''))) = v_email
      OR lower(trim(coalesce(email_pessoal, ''))) = v_email
    )
    AND coalesce(status_cadastro, '') <> 'Arquivado';

  IF v_matches = 1 THEN
    SELECT * INTO v_religioso
    FROM public.religiosos
    WHERE (
        lower(trim(coalesce(email_institucional, ''))) = v_email
        OR lower(trim(coalesce(email_pessoal, ''))) = v_email
      )
      AND coalesce(status_cadastro, '') <> 'Arquivado'
    LIMIT 1
    FOR UPDATE;

    -- Permite vincular se ainda não há conta vinculada ou se o vínculo anterior aponta para conta excluída
    IF v_religioso.auth_user_id IS NULL
      OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v_religioso.auth_user_id)
    THEN
      PERFORM set_config('app.portal_vinculo_rpc', 'on', true);
      UPDATE public.religiosos
      SET auth_user_id = v_user_id,
          updated_at = now()
      WHERE id = v_religioso.id;
      RETURN v_religioso.id;
    ELSIF v_religioso.auth_user_id = v_user_id THEN
      RETURN v_religioso.id;
    ELSE
      RAISE EXCEPTION 'Esta ficha já está vinculada a outra conta de acesso. Contate a Secretaria Provincial.';
    END IF;
  ELSIF v_matches > 1 THEN
    RAISE EXCEPTION 'Há mais de uma ficha cadastrada com este e-mail. Contate a Secretaria Provincial para unificar o vínculo.';
  END IF;

  -- 3º: Fluxo de autoatendimento (quando o e-mail ainda não existe em public.religiosos)
  v_meta := coalesce(v_auth_user.raw_user_meta_data, '{}'::jsonb);
  v_cpf := regexp_replace(coalesce(v_meta->>'cpf', ''), '[^0-9]', '', 'g');
  v_name := nullif(trim(coalesce(v_meta->>'nome', '')), '');
  IF v_name IS NULL THEN
    SELECT p.nome_civil INTO v_name
    FROM public.portal_perfis_religiosos p
    WHERE p.auth_user_id = v_user_id
    LIMIT 1;
  END IF;

  v_birth_date := NULL;
  IF coalesce(v_meta->>'data_nascimento', '') ~ '^\d{4}-\d{2}-\d{2}$' THEN
    v_birth_date := (v_meta->>'data_nascimento')::date;
  ELSE
    SELECT p.data_nascimento INTO v_birth_date
    FROM public.portal_perfis_religiosos p
    WHERE p.auth_user_id = v_user_id
    LIMIT 1;
  END IF;

  IF v_birth_date IS NULL OR v_birth_date >= current_date THEN
    RAISE EXCEPTION 'Data de nascimento inválida. Atualize os dados da conta ou contate a Secretaria Provincial.';
  END IF;
  IF v_cpf = '' OR v_name IS NULL OR v_meta->>'consentimento_dados' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Os dados necessários ao vínculo não foram encontrados. Contate a Secretaria Provincial.';
  END IF;
  IF NOT public.portal_cpf_valido(v_cpf) THEN
    RAISE EXCEPTION 'O CPF informado é inválido. Confira os dígitos.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('cpf:' || v_cpf, 0));

  SELECT count(*) INTO v_matches
  FROM public.religiosos
  WHERE regexp_replace(coalesce(cpf, ''), '[^0-9]', '', 'g') = v_cpf;

  IF v_matches > 1 THEN
    RAISE EXCEPTION 'Não foi possível identificar uma ficha única. Contate a Secretaria Provincial.';
  ELSIF v_matches = 1 THEN
    SELECT * INTO v_religioso
    FROM public.religiosos
    WHERE regexp_replace(coalesce(cpf, ''), '[^0-9]', '', 'g') = v_cpf
    LIMIT 1
    FOR UPDATE;

    IF lower(trim(coalesce(v_religioso.email_institucional, ''))) <> v_email
      AND lower(trim(coalesce(v_religioso.email_pessoal, ''))) <> v_email THEN
      RAISE EXCEPTION 'O e-mail confirmado não corresponde ao cadastro. Contate a Secretaria Provincial para validar seu acesso.';
    END IF;
    IF regexp_replace(lower(trim(coalesce(v_religioso.nome_civil, ''))), '[[:space:]]+', ' ', 'g')
        <> regexp_replace(lower(v_name), '[[:space:]]+', ' ', 'g')
      OR v_religioso.data_nascimento IS DISTINCT FROM v_birth_date THEN
      RAISE EXCEPTION 'Nome ou data de nascimento não correspondem à ficha. Contate a Secretaria Provincial para validar o acesso.';
    END IF;
    IF v_religioso.status_cadastro = 'Arquivado' THEN
      RAISE EXCEPTION 'Esta ficha está arquivada. Contate a Secretaria Provincial.';
    END IF;
    IF v_religioso.auth_user_id IS NOT NULL AND v_religioso.auth_user_id <> v_user_id THEN
      RAISE EXCEPTION 'Esta ficha já está vinculada a outra conta. Contate a Secretaria Provincial.';
    END IF;

    PERFORM set_config('app.portal_vinculo_rpc', 'on', true);
    UPDATE public.religiosos
    SET auth_user_id = v_user_id,
        updated_at = now()
    WHERE id = v_religioso.id;
    RETURN v_religioso.id;
  END IF;

  INSERT INTO public.religiosos (
    auth_user_id, origem_cadastro, status_cadastro, status,
    nome_civil, data_nascimento, cpf, email_pessoal,
    consentimento_dados, consentimento_em
  ) VALUES (
    v_user_id, 'publico', 'Em revisão', 'Ativo',
    v_name, v_birth_date, v_cpf, v_email,
    true, now()
  )
  RETURNING * INTO v_religioso;

  RETURN v_religioso.id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_religious_portal_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_religious_portal_profile() TO authenticated;

-- 4. Ao aprovar uma ficha na Secretaria, vincular auth_user_id automaticamente se a conta Auth já existir
CREATE OR REPLACE FUNCTION public.secretaria_revisar_ficha(
  p_religioso_id uuid,
  p_status text,
  p_observacao text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_religioso public.religiosos%rowtype;
  v_actor_name text;
  v_observacao text := nullif(btrim(p_observacao), '');
  v_auto_auth_id uuid;
  v_auto_matches integer;
BEGIN
  IF NOT (
    public.usuario_tem_papel('secretaria')
    OR public.usuario_tem_papel('religiosos')
  ) THEN
    RAISE EXCEPTION 'Acesso não autorizado para revisar fichas.';
  END IF;
  IF p_status NOT IN (
    'Em revisão', 'Em verificação', 'Aguardando complementação',
    'Aprovado', 'Recusado', 'Arquivado'
  ) THEN
    RAISE EXCEPTION 'Situação de revisão inválida.';
  END IF;
  IF p_status IN ('Aguardando complementação', 'Recusado') AND v_observacao IS NULL THEN
    RAISE EXCEPTION 'Informe o motivo ou os dados que precisam ser complementados.';
  END IF;
  IF length(coalesce(v_observacao, '')) > 2000 THEN
    RAISE EXCEPTION 'A observação deve ter até 2000 caracteres.';
  END IF;

  SELECT * INTO v_religioso
  FROM public.religiosos
  WHERE id = p_religioso_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ficha não encontrada.';
  END IF;

  SELECT coalesce(usu_nome, auth.jwt() ->> 'email', 'Secretaria')
    INTO v_actor_name
  FROM public.usuarios
  WHERE auth_user_id = auth.uid()
    AND usu_status = 'Ativo'
  LIMIT 1;

  -- Se estiver aprovando uma ficha sem vínculo (ou com vínculo órfão), tenta vincular pela conta Auth com o mesmo e-mail
  v_auto_auth_id := v_religioso.auth_user_id;
  IF p_status = 'Aprovado' AND (
    v_auto_auth_id IS NULL
    OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v_auto_auth_id)
  ) THEN
    SELECT count(*), min(u.id::text)::uuid
      INTO v_auto_matches, v_auto_auth_id
    FROM auth.users u
    WHERE u.email IS NOT NULL
      AND u.email_confirmed_at IS NOT NULL
      AND (
        lower(trim(u.email)) = nullif(lower(trim(coalesce(v_religioso.email_institucional, ''))), '')
        OR lower(trim(u.email)) = nullif(lower(trim(coalesce(v_religioso.email_pessoal, ''))), '')
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.religiosos r2
        WHERE r2.auth_user_id = u.id
          AND r2.id <> p_religioso_id
      );

    IF v_auto_matches <> 1 THEN
      v_auto_auth_id := v_religioso.auth_user_id;
    END IF;
  END IF;

  PERFORM set_config('app.secretaria_ficha_status_rpc', 'on', true);
  PERFORM set_config('app.portal_vinculo_rpc', 'on', true);

  UPDATE public.religiosos
  SET status_cadastro = p_status,
      auth_user_id = COALESCE(v_auto_auth_id, auth_user_id),
      updated_at = now()
  WHERE id = p_religioso_id;

  INSERT INTO public.secretaria_ficha_eventos (
    religioso_id, religioso_nome, status_anterior, status_novo,
    ator_id, ator_nome, observacao
  ) VALUES (
    p_religioso_id,
    coalesce(v_religioso.nome_religioso, v_religioso.nome_civil, 'Religioso'),
    v_religioso.status_cadastro,
    p_status,
    auth.uid(),
    coalesce(v_actor_name, auth.jwt() ->> 'email', 'Secretaria'),
    v_observacao
  );
END;
$$;

REVOKE ALL ON FUNCTION public.secretaria_revisar_ficha(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.secretaria_revisar_ficha(uuid, text, text) TO authenticated;

COMMIT;
