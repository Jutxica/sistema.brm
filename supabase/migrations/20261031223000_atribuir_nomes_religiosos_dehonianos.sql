-- Migration: Atribuição automática dos Nomes Religiosos Dehonianos da Província BRM
-- Regra oficial:
-- Frater -> "Fr. [nome e sobrenome], scj"
-- Bispo -> "Dom [nome e sobrenome], scj"
-- Diácono -> "Diác. [nome e sobrenome], scj"
-- Irmão -> "Ir. [nome e sobrenome], scj"
-- Padre -> "P. [nome e sobrenome], scj"

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

-- Trigger para tabela public.religiosos (possui nome_religioso e nome_elenco)
create or replace function public.trg_atribuir_nome_religioso_religiosos()
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
execute function public.trg_atribuir_nome_religioso_religiosos();

-- Trigger para tabela public.portal_perfis_religiosos (possui apenas nome_religioso)
create or replace function public.trg_atribuir_nome_religioso_portal()
returns trigger as $$
begin
  if NEW.nome_civil is not null and trim(NEW.nome_civil) <> '' then
    NEW.nome_religioso := public.atribuir_nome_religioso(NEW.grau, NEW.nome_civil);
  end if;
  return NEW;
end;
$$ language plpgsql;

do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'portal_perfis_religiosos') then
    drop trigger if exists trg_portal_perfis_nome_religioso_auto on public.portal_perfis_religiosos;
    create trigger trg_portal_perfis_nome_religioso_auto
    before insert or update of grau, nome_civil, nome_religioso on public.portal_perfis_religiosos
    for each row
    execute function public.trg_atribuir_nome_religioso_portal();
  end if;
end $$;

-- Atualizar registros existentes na base
update public.religiosos
set nome_religioso = public.atribuir_nome_religioso(grau, nome_civil),
    nome_elenco = public.atribuir_nome_religioso(grau, nome_civil)
where nome_civil is not null and trim(nome_civil) <> '';

do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'portal_perfis_religiosos') then
    update public.portal_perfis_religiosos
    set nome_religioso = public.atribuir_nome_religioso(grau, nome_civil)
    where nome_civil is not null and trim(nome_civil) <> '';
  end if;
end $$;
