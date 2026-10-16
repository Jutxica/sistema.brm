-- Vínculo confirmado a partir da aba "Fratres BRM" do Elenco 2026.
-- NÃO EXECUTAR nesta etapa: aguardar os cadastros reais e a conciliação final do Elenco.
-- Registra apenas estudos; residência e comunidade jurídica permanecem pendentes.

begin;

do $$
declare
  v_religioso_id constant uuid := 'dfb9ae84-b4a4-48ae-9740-f8555159a05c';
  v_obra_id uuid;
  v_total integer;
begin
  select count(*)
    into v_total
    from public.religiosos
   where id = v_religioso_id
     and lower(trim(nome_civil)) = lower(trim('Djonatan Engelmann'));

  if v_total <> 1 then
    raise exception 'Esperado exatamente um cadastro de Djonatan Engelmann com o UUID confirmado; encontrados: %.', v_total;
  end if;

  select count(*)
    into v_total
    from public.religiosos_obras_referencia
   where lower(trim(nome)) = lower(trim('Convento Sagrado Coração de Jesus (Conventinho)'))
     and lower(trim(coalesce(cidade, ''))) = lower(trim('Taubaté'))
     and upper(coalesce(uf, '')) = 'SP'
     and pertencimento_elenco = 'nao_brm';

  if v_total <> 1 then
    raise exception 'Esperado exatamente um cadastro do Conventinho de Taubaté marcado como não-BRM; encontrados: %.', v_total;
  end if;

  select id
    into v_obra_id
    from public.religiosos_obras_referencia
   where lower(trim(nome)) = lower(trim('Convento Sagrado Coração de Jesus (Conventinho)'))
     and lower(trim(coalesce(cidade, ''))) = lower(trim('Taubaté'))
     and upper(coalesce(uf, '')) = 'SP'
     and pertencimento_elenco = 'nao_brm';

  if not exists (
    select 1
      from public.religiosos_designacoes
     where religioso_id = v_religioso_id
       and obra_id = v_obra_id
       and comunidade_id is null
       and tipo_vinculo = 'estudos'
       and funcao = 'Frater - 2º ano'
       and vigencia_inicio is null
       and ano_referencia = 2026
  ) then
    insert into public.religiosos_designacoes (
      religioso_id,
      obra_id,
      tipo_vinculo,
      funcao,
      vigencia_inicio,
      ano_referencia,
      observacoes
    ) values (
      v_religioso_id,
      v_obra_id,
      'estudos',
      'Frater - 2º ano',
      null,
      2026,
      'Fonte: Elenco 2026, aba Fratres BRM. Data de início não informada; residência e comunidade jurídica pendentes.'
    );
  end if;
end;
$$;

commit;
