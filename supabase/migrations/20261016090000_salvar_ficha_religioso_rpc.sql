-- Migração: Função RPC Transacional para Salvar/Atualizar Ficha Canônica do Religioso
-- Garante atomicidade (ACID): todas as tabelas filhas são atualizadas dentro de uma única transação no PostgreSQL.
begin;

create or replace function public.salvar_ficha_religioso(
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_religioso_id uuid;
  v_base jsonb;
  v_item jsonb;
  v_current_user uuid := auth.uid();
  v_is_staff boolean := false;
  v_existing_owner uuid;
begin
  if p_payload is null or jsonb_typeof(p_payload) != 'object' then
    raise exception 'Payload inválido para salvar ficha de religioso.';
  end if;

  v_base := p_payload->'base';
  if v_base is null or jsonb_typeof(v_base) != 'object' then
    raise exception 'Dados cadastrais básicos (base) não informados.';
  end if;

  -- Checagem de ID pré-existente
  if p_payload ? 'religioso_id' and p_payload->>'religioso_id' is not null and p_payload->>'religioso_id' != '' then
    v_religioso_id := (p_payload->>'religioso_id')::uuid;
  end if;

  -- Se autenticado, verificar permissões
  if v_current_user is not null then
    select exists (
      select 1 from public.usuarios u
      where u.auth_user_id = v_current_user
        and u.usu_status = 'Ativo'
        and (
          u.usu_acessos @> '["admin"]'::jsonb
          or u.usu_acessos @> '["secretaria"]'::jsonb
          or u.usu_acessos @> '["religiosos"]'::jsonb
        )
    ) into v_is_staff;
  end if;

  if v_religioso_id is not null then
    -- Modo Edição
    select auth_user_id into v_existing_owner
    from public.religiosos
    where id = v_religioso_id;

    if not found then
      raise exception 'Registro de religioso com ID % não encontrado.', v_religioso_id;
    end if;

    -- Usuário anônimo não pode sobrescrever cadastro existente
    if v_current_user is null and not v_is_staff then
      raise exception 'Operação não permitida: atualização exige autenticação.';
    end if;

    -- Usuário normal só edita a si mesmo se não for staff
    if not v_is_staff and (v_existing_owner is null or v_existing_owner != v_current_user) then
      raise exception 'Permissão negada para atualizar este cadastro canônico.';
    end if;

    -- Atualizar tabela pai
    update public.religiosos set
      nome_civil = coalesce(v_base->>'nome_civil', nome_civil),
      nome_religioso = v_base->>'nome_religioso',
      grau = coalesce(v_base->>'grau', grau),
      data_nascimento = case when v_base->>'data_nascimento' != '' then (v_base->>'data_nascimento')::date else null end,
      cpf = v_base->>'cpf',
      rg = v_base->>'rg',
      orgao_emissor_rg = v_base->>'orgao_emissor_rg',
      titulo_eleitor = v_base->>'titulo_eleitor',
      zona_eleitoral = v_base->>'zona_eleitoral',
      secao_eleitoral = v_base->>'secao_eleitoral',
      cidade_titulo = v_base->>'cidade_titulo',
      estado_titulo = v_base->>'estado_titulo',
      pis_pasep = v_base->>'pis_pasep',
      carteira_trabalho = v_base->>'carteira_trabalho',
      serie_ctps = v_base->>'serie_ctps',
      uf_ctps = v_base->>'uf_ctps',
      cnh = v_base->>'cnh',
      categoria_cnh = v_base->>'categoria_cnh',
      validade_cnh = case when v_base->>'validade_cnh' != '' then (v_base->>'validade_cnh')::date else null end,
      passaporte = v_base->>'passaporte',
      validade_passaporte = case when v_base->>'validade_passaporte' != '' then (v_base->>'validade_passaporte')::date else null end,
      pais_emissor_passaporte = v_base->>'pais_emissor_passaporte',
      nacionalidade = coalesce(v_base->>'nacionalidade', nacionalidade),
      naturalidade_municipio = v_base->>'naturalidade_municipio',
      naturalidade_uf = v_base->>'naturalidade_uf',
      pais_nascimento = coalesce(v_base->>'pais_nascimento', pais_nascimento),
      email_institucional = v_base->>'email_institucional',
      email_pessoal = v_base->>'email_pessoal',
      telefone_celular = v_base->>'telefone_celular',
      whatsapp = v_base->>'whatsapp',
      redes_sociais = v_base->>'redes_sociais',
      comunidade_atual_id = case when v_base->>'comunidade_atual_id' != '' then (v_base->>'comunidade_atual_id')::uuid else null end,
      obra_atual_id = case when v_base->>'obra_atual_id' != '' then (v_base->>'obra_atual_id')::uuid else null end,
      cargo_funcao = v_base->>'cargo_funcao',
      status_cadastro = case when v_is_staff and v_base ? 'status_cadastro' then v_base->>'status_cadastro' else status_cadastro end,
      status = case when v_is_staff and v_base ? 'status' then v_base->>'status' else status end,
      updated_at = now()
    where id = v_religioso_id;

    -- Deletar tabelas filhas antes de reinserir atomicamente
    delete from public.religiosos_familiares where religioso_id = v_religioso_id;
    delete from public.religiosos_contatos_familiares where religioso_id = v_religioso_id;
    delete from public.religiosos_sacramentos where religioso_id = v_religioso_id;
    delete from public.religiosos_historico_vocacional where religioso_id = v_religioso_id;
    delete from public.religiosos_origem_vocacional where religioso_id = v_religioso_id;
    delete from public.religiosos_formacao_religiosa where religioso_id = v_religioso_id;
    delete from public.religiosos_profissoes_votos where religioso_id = v_religioso_id;
    delete from public.religiosos_ministerios_ordens where religioso_id = v_religioso_id;
    delete from public.religiosos_formacao_academica where religioso_id = v_religioso_id;
    delete from public.religiosos_idiomas where religioso_id = v_religioso_id;
    delete from public.religiosos_competencias where religioso_id = v_religioso_id;
    delete from public.religiosos_historico_comunidades where religioso_id = v_religioso_id;
    delete from public.religiosos_missoes_servicos where religioso_id = v_religioso_id;
    delete from public.religiosos_enderecos_contatos where religioso_id = v_religioso_id;
    delete from public.religiosos_saude where religioso_id = v_religioso_id;

  else
    -- Modo Inserção (Novo Registro)
    insert into public.religiosos (
      nome_civil,
      nome_religioso,
      grau,
      data_nascimento,
      cpf,
      rg,
      orgao_emissor_rg,
      titulo_eleitor,
      zona_eleitoral,
      secao_eleitoral,
      cidade_titulo,
      estado_titulo,
      pis_pasep,
      carteira_trabalho,
      serie_ctps,
      uf_ctps,
      cnh,
      categoria_cnh,
      validade_cnh,
      passaporte,
      validade_passaporte,
      pais_emissor_passaporte,
      nacionalidade,
      naturalidade_municipio,
      naturalidade_uf,
      pais_nascimento,
      email_institucional,
      email_pessoal,
      telefone_celular,
      whatsapp,
      redes_sociais,
      comunidade_atual_id,
      obra_atual_id,
      cargo_funcao,
      origem_cadastro,
      status_cadastro,
      status,
      consentimento_dados,
      consentimento_em,
      auth_user_id
    ) values (
      coalesce(v_base->>'nome_civil', 'Nome não informado'),
      v_base->>'nome_religioso',
      coalesce(v_base->>'grau', 'Fráter'),
      case when v_base->>'data_nascimento' != '' then (v_base->>'data_nascimento')::date else null end,
      v_base->>'cpf',
      v_base->>'rg',
      v_base->>'orgao_emissor_rg',
      v_base->>'titulo_eleitor',
      v_base->>'zona_eleitoral',
      v_base->>'secao_eleitoral',
      v_base->>'cidade_titulo',
      v_base->>'estado_titulo',
      v_base->>'pis_pasep',
      v_base->>'carteira_trabalho',
      v_base->>'serie_ctps',
      v_base->>'uf_ctps',
      v_base->>'cnh',
      v_base->>'categoria_cnh',
      case when v_base->>'validade_cnh' != '' then (v_base->>'validade_cnh')::date else null end,
      v_base->>'passaporte',
      case when v_base->>'validade_passaporte' != '' then (v_base->>'validade_passaporte')::date else null end,
      v_base->>'pais_emissor_passaporte',
      coalesce(v_base->>'nacionalidade', 'Brasileira'),
      v_base->>'naturalidade_municipio',
      v_base->>'naturalidade_uf',
      coalesce(v_base->>'pais_nascimento', 'Brasil'),
      v_base->>'email_institucional',
      v_base->>'email_pessoal',
      v_base->>'telefone_celular',
      v_base->>'whatsapp',
      v_base->>'redes_sociais',
      case when v_base->>'comunidade_atual_id' != '' then (v_base->>'comunidade_atual_id')::uuid else null end,
      case when v_base->>'obra_atual_id' != '' then (v_base->>'obra_atual_id')::uuid else null end,
      v_base->>'cargo_funcao',
      case when v_is_staff then 'admin' else 'publico' end,
      case when v_is_staff then coalesce(v_base->>'status_cadastro', 'Aprovado') else 'Em revisão' end,
      case when v_is_staff then coalesce(v_base->>'status', 'Ativo') else 'Ativo' end,
      true,
      now(),
      v_current_user
    )
    returning id into v_religioso_id;
  end if;

  -- 1. Inserir Familiares
  if p_payload ? 'familiares' and jsonb_typeof(p_payload->'familiares') = 'array' then
    for v_item in select * from jsonb_array_elements(p_payload->'familiares')
    loop
      if coalesce(trim(v_item->>'nome'), '') != '' then
        insert into public.religiosos_familiares (
          religioso_id, tipo, nome, data_nascimento, local_nascimento, estado_civil, data_evento
        ) values (
          v_religioso_id,
          coalesce(v_item->>'tipo', 'Outro'),
          v_item->>'nome',
          case when v_item->>'data_nascimento' != '' then (v_item->>'data_nascimento')::date else null end,
          v_item->>'local_nascimento',
          v_item->>'estado_civil',
          case when v_item->>'data_evento' != '' then (v_item->>'data_evento')::date else null end
        );
      end if;
    end loop;
  end if;

  -- 2. Inserir Contatos Familiares
  if p_payload ? 'contatos_familiares' and jsonb_typeof(p_payload->'contatos_familiares') = 'array' then
    for v_item in select * from jsonb_array_elements(p_payload->'contatos_familiares')
    loop
      if coalesce(trim(v_item->>'nome'), '') != '' then
        insert into public.religiosos_contatos_familiares (
          religioso_id, nome, parentesco, contato_1, contato_2
        ) values (
          v_religioso_id,
          v_item->>'nome',
          v_item->>'parentesco',
          v_item->>'contato_1',
          v_item->>'contato_2'
        );
      end if;
    end loop;
  end if;

  -- 3. Inserir Sacramentos
  if p_payload ? 'sacramentos' and jsonb_typeof(p_payload->'sacramentos') = 'array' then
    for v_item in select * from jsonb_array_elements(p_payload->'sacramentos')
    loop
      if coalesce(v_item->>'tipo', '') != '' then
        insert into public.religiosos_sacramentos (
          religioso_id, tipo, data, paroquia, diocese, cidade, uf, livro, folha, numero_registro, celebrante, observacoes
        ) values (
          v_religioso_id,
          v_item->>'tipo',
          case when v_item->>'data' != '' then (v_item->>'data')::date else null end,
          v_item->>'paroquia',
          v_item->>'diocese',
          v_item->>'cidade',
          v_item->>'uf',
          v_item->>'livro',
          v_item->>'folha',
          v_item->>'numero_registro',
          v_item->>'celebrante',
          v_item->>'observacoes'
        );
      end if;
    end loop;
  end if;

  -- 4. Origem Vocacional
  if p_payload ? 'origem_vocacional' and jsonb_typeof(p_payload->'origem_vocacional') = 'object' then
    v_item := p_payload->'origem_vocacional';
    insert into public.religiosos_origem_vocacional (
      religioso_id, paroquia_origem, diocese, grupo_movimento_pastoral, promotor_vocacional
    ) values (
      v_religioso_id,
      v_item->>'paroquia_origem',
      v_item->>'diocese',
      v_item->>'grupo_movimento_pastoral',
      v_item->>'promotor_vocacional'
    );
  end if;

  -- 5. Histórico Vocacional
  if p_payload ? 'historico_vocacional' and jsonb_typeof(p_payload->'historico_vocacional') = 'array' then
    for v_item in select * from jsonb_array_elements(p_payload->'historico_vocacional')
    loop
      insert into public.religiosos_historico_vocacional (
        religioso_id, data_evento, ano, titulo, descricao, local, responsavel
      ) values (
        v_religioso_id,
        v_item->>'data_evento',
        case when v_item->>'ano' ~ '^[0-9]+$' then (v_item->>'ano')::integer else null end,
        v_item->>'titulo',
        v_item->>'descricao',
        v_item->>'local',
        v_item->>'responsavel'
      );
    end loop;
  end if;

  -- 6. Formação Religiosa
  if p_payload ? 'formacao_religiosa' and jsonb_typeof(p_payload->'formacao_religiosa') = 'array' then
    for v_item in select * from jsonb_array_elements(p_payload->'formacao_religiosa')
    loop
      insert into public.religiosos_formacao_religiosa (
        religioso_id, etapa, instituicao, cidade, local, data_ingresso, data_conclusao, formador
      ) values (
        v_religioso_id,
        v_item->>'etapa',
        v_item->>'instituicao',
        coalesce(v_item->>'cidade', v_item->>'local'),
        coalesce(v_item->>'local', v_item->>'cidade'),
        case when v_item->>'data_ingresso' != '' then (v_item->>'data_ingresso')::date else null end,
        case when v_item->>'data_conclusao' != '' then (v_item->>'data_conclusao')::date else null end,
        v_item->>'formador'
      );
    end loop;
  end if;

  -- 7. Profissões e Votos
  if p_payload ? 'profissoes_votos' and jsonb_typeof(p_payload->'profissoes_votos') = 'array' then
    for v_item in select * from jsonb_array_elements(p_payload->'profissoes_votos')
    loop
      insert into public.religiosos_profissoes_votos (
        religioso_id, tipo, renovacao, data, local, celebrante
      ) values (
        v_religioso_id,
        v_item->>'tipo',
        case when v_item->>'renovacao' ~ '^[0-9]+$' then (v_item->>'renovacao')::integer else null end,
        case when v_item->>'data' != '' then (v_item->>'data')::date else null end,
        v_item->>'local',
        v_item->>'celebrante'
      );
    end loop;
  end if;

  -- 8. Ministérios e Ordens
  if p_payload ? 'ministerios_ordens' and jsonb_typeof(p_payload->'ministerios_ordens') = 'array' then
    for v_item in select * from jsonb_array_elements(p_payload->'ministerios_ordens')
    loop
      insert into public.religiosos_ministerios_ordens (
        religioso_id, tipo, data, local, celebrante, bispo_ordenante
      ) values (
        v_religioso_id,
        v_item->>'tipo',
        case when v_item->>'data' != '' then (v_item->>'data')::date else null end,
        v_item->>'local',
        v_item->>'celebrante',
        v_item->>'bispo_ordenante'
      );
    end loop;
  end if;

  -- 9. Formação Acadêmica
  if p_payload ? 'formacao_academica' and jsonb_typeof(p_payload->'formacao_academica') = 'array' then
    for v_item in select * from jsonb_array_elements(p_payload->'formacao_academica')
    loop
      insert into public.religiosos_formacao_academica (
        religioso_id, categoria, instituicao, periodo, pais, cidade, estado, observacoes
      ) values (
        v_religioso_id,
        v_item->>'categoria',
        v_item->>'instituicao',
        v_item->>'periodo',
        v_item->>'pais',
        v_item->>'cidade',
        v_item->>'estado',
        v_item->>'observacoes'
      );
    end loop;
  end if;

  -- 10. Idiomas
  if p_payload ? 'idiomas' and jsonb_typeof(p_payload->'idiomas') = 'array' then
    for v_item in select * from jsonb_array_elements(p_payload->'idiomas')
    loop
      insert into public.religiosos_idiomas (
        religioso_id, idioma, nivel, fala, audicao, leitura, escrita, observacoes
      ) values (
        v_religioso_id,
        v_item->>'idioma',
        v_item->>'nivel',
        v_item->>'fala',
        v_item->>'audicao',
        v_item->>'leitura',
        v_item->>'escrita',
        v_item->>'observacoes'
      );
    end loop;
  end if;

  -- 11. Competências
  if p_payload ? 'competencias' and jsonb_typeof(p_payload->'competencias') = 'array' then
    for v_item in select * from jsonb_array_elements(p_payload->'competencias')
    loop
      insert into public.religiosos_competencias (
        religioso_id, competencia, observacoes
      ) values (
        v_religioso_id,
        v_item->>'competencia',
        v_item->>'observacoes'
      );
    end loop;
  end if;

  -- 12. Histórico de Comunidades
  if p_payload ? 'historico_comunidades' and jsonb_typeof(p_payload->'historico_comunidades') = 'array' then
    for v_item in select * from jsonb_array_elements(p_payload->'historico_comunidades')
    loop
      insert into public.religiosos_historico_comunidades (
        religioso_id, periodo_inicio, periodo_fim, instituicao, funcao, local, observacoes
      ) values (
        v_religioso_id,
        case when v_item->>'periodo_inicio' != '' then (v_item->>'periodo_inicio')::date else null end,
        case when v_item->>'periodo_fim' != '' then (v_item->>'periodo_fim')::date else null end,
        v_item->>'instituicao',
        v_item->>'funcao',
        v_item->>'local',
        v_item->>'observacoes'
      );
    end loop;
  end if;

  -- 13. Missões e Serviços
  if p_payload ? 'missoes_servicos' and jsonb_typeof(p_payload->'missoes_servicos') = 'array' then
    for v_item in select * from jsonb_array_elements(p_payload->'missoes_servicos')
    loop
      insert into public.religiosos_missoes_servicos (
        religioso_id, tipo, instituicao, funcao, periodo, local, documento, observacao
      ) values (
        v_religioso_id,
        v_item->>'tipo',
        v_item->>'instituicao',
        v_item->>'funcao',
        v_item->>'periodo',
        v_item->>'local',
        v_item->>'documento',
        v_item->>'observacao'
      );
    end loop;
  end if;

  -- 14. Endereço e Contatos
  if p_payload ? 'enderecos_contatos' and jsonb_typeof(p_payload->'enderecos_contatos') = 'object' then
    v_item := p_payload->'enderecos_contatos';
    insert into public.religiosos_enderecos_contatos (
      religioso_id, obra_id, cep, logradouro, numero, complemento, bairro, cidade, estado, pais, celular, telefone, email, whatsapp, redes_sociais
    ) values (
      v_religioso_id,
      case when v_item->>'obra_id' != '' then (v_item->>'obra_id')::uuid else null end,
      v_item->>'cep',
      v_item->>'logradouro',
      v_item->>'numero',
      v_item->>'complemento',
      v_item->>'bairro',
      v_item->>'cidade',
      v_item->>'estado',
      coalesce(v_item->>'pais', 'Brasil'),
      v_item->>'celular',
      v_item->>'telefone',
      v_item->>'email',
      v_item->>'whatsapp',
      v_item->>'redes_sociais'
    );
  end if;

  -- 15. Saúde
  if p_payload ? 'saude' and jsonb_typeof(p_payload->'saude') = 'object' then
    v_item := p_payload->'saude';
    insert into public.religiosos_saude (
      religioso_id, plano_saude, numero_plano_saude, local_plano_saude, sus, tipo_sanguineo, fator_rh, alergias, medicamentos_continuos, medico_responsavel, contato_emergencia, informacoes_clinicas, cirurgias, proteses, observacoes
    ) values (
      v_religioso_id,
      v_item->>'plano_saude',
      v_item->>'numero_plano_saude',
      v_item->>'local_plano_saude',
      v_item->>'sus',
      v_item->>'tipo_sanguineo',
      v_item->>'fator_rh',
      v_item->>'alergias',
      v_item->>'medicamentos_continuos',
      v_item->>'medico_responsavel',
      v_item->>'contato_emergencia',
      v_item->>'informacoes_clinicas',
      v_item->>'cirurgias',
      v_item->>'proteses',
      v_item->>'observacoes'
    );
  end if;

  return jsonb_build_object('success', true, 'id', v_religioso_id);
end;
$$;

-- Permissões de Execução
revoke all on function public.salvar_ficha_religioso(jsonb) from public, anon, authenticated;
grant execute on function public.salvar_ficha_religioso(jsonb) to anon, authenticated;

commit;
