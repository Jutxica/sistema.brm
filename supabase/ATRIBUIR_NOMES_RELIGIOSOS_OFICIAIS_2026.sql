-- SCRIPT OFICIAL BRM: Atribuição Canônica Automática de Nomes Religiosos
-- Executar no Supabase SQL Editor para atualizar 100% da base e ativar o gatilho automático

-- 1. Função de limpeza do nome civil
create or replace function public.limpar_nome_civil_religioso(p_nome text)
returns text as $$
declare
  v_clean text;
  v_prev text;
begin
  if p_nome is null or trim(p_nome) = '' then
    return '';
  end if;

  v_clean := trim(p_nome);
  -- Remove sufixos congregacionais como ", scj", ", SCJ", "scj", "dehoniano", etc.
  v_clean := regexp_replace(v_clean, '(?i)(?:,\s*|\s+)(?:scj|s\.c\.j\.|dehoniano|dehonianos)\.?$', '', 'g');

  -- Remove prefixos eclesiásticos sucessivos
  v_prev := '';
  while v_prev is distinct from v_clean loop
    v_prev := v_clean;
    v_clean := regexp_replace(v_clean, '(?i)^(?:dom|diác\.|diac\.|diácono|diacono|fr\.|frater|ir\.|irmão|irmao|pe\.|p\.|padre|presbítero|presbitero)\s+', '', 'g');
    v_clean := trim(v_clean);
  end loop;

  return v_clean;
end;
$$ language plpgsql immutable;

-- 2. Função de atribuição do Nome Religioso
create or replace function public.atribuir_nome_religioso(p_grau text, p_nome_civil text)
returns text as $$
declare
  v_clean text;
  v_grau_lower text;
  v_prefix text;
begin
  v_clean := public.limpar_nome_civil_religioso(p_nome_civil);
  if v_clean = '' then
    return null;
  end if;

  v_grau_lower := lower(trim(coalesce(p_grau, '')));

  if v_grau_lower like '%frater%' then
    v_prefix := 'Fr.';
  elsif v_grau_lower like '%bispo%' or v_grau_lower like '%dom%' then
    v_prefix := 'Dom';
  elsif v_grau_lower like '%diác%' or v_grau_lower like '%diac%' then
    v_prefix := 'Diác.';
  elsif v_grau_lower like '%irmã%' or v_grau_lower like '%irma%' then
    v_prefix := 'Ir.';
  else
    v_prefix := 'P.'; -- Padre / Presbítero
  end if;

  return v_prefix || ' ' || v_clean || ', scj';
end;
$$ language plpgsql immutable;

-- 3. Trigger para garantir que novos cadastros ou atualizações recebam o nome atribuído
create or replace function public.trg_atribuir_nome_religioso()
returns trigger as $$
begin
  if NEW.nome_civil is not null and trim(NEW.nome_civil) <> '' then
    NEW.nome_religioso := public.atribuir_nome_religioso(NEW.grau, NEW.nome_civil);
    NEW.nome_elenco := NEW.nome_religioso;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_religiosos_nome_religioso_auto on public.religiosos;
create trigger trg_religiosos_nome_religioso_auto
before insert or update of grau, nome_civil, nome_religioso on public.religiosos
for each row
execute function public.trg_atribuir_nome_religioso();

do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'portal_perfis_religiosos') then
    drop trigger if exists trg_portal_perfis_nome_religioso_auto on public.portal_perfis_religiosos;
    create trigger trg_portal_perfis_nome_religioso_auto
    before insert or update of grau, nome_civil, nome_religioso on public.portal_perfis_religiosos
    for each row
    execute function public.trg_atribuir_nome_religioso();
  end if;
end $$;

-- 4. Atualizar imediatamente todos os religiosos existentes no banco
update public.religiosos
set nome_religioso = public.atribuir_nome_religioso(grau, nome_civil),
    nome_elenco = public.atribuir_nome_religioso(grau, nome_civil)
where nome_civil is not null and trim(nome_civil) <> '';

do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'portal_perfis_religiosos') then
    update public.portal_perfis_religiosos
    set nome_religioso = public.atribuir_nome_religioso(grau, nome_civil),
        nome_elenco = public.atribuir_nome_religioso(grau, nome_civil)
    where nome_civil is not null and trim(nome_civil) <> '';
  end if;
end $$;
