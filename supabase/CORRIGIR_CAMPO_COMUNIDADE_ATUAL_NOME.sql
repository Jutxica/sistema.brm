-- ==============================================================================
-- CORREÇÃO DEFINITIVA: RECORD "NEW" HAS NO FIELD "COMUNIDADE_ATUAL_NOME"
-- Província Brasil Meridional (BRM)
--
-- Como aplicar no Supabase:
-- 1. Acesse o painel do seu projeto no Supabase (https://supabase.com/dashboard)
-- 2. No menu lateral esquerdo, clique no ícone "SQL Editor"
-- 3. Clique no botão "+ New query"
-- 4. Cole este script completo e clique em "Run" (ou pressione Ctrl+Enter)
-- ==============================================================================

begin;

-- 1. Garantir que todas as colunas necessárias existam na tabela public.religiosos
alter table public.religiosos
  add column if not exists comunidade_atual_nome text,
  add column if not exists obra_atual_id uuid,
  add column if not exists comunidade_atual_id uuid,
  add column if not exists nome_elenco text,
  add column if not exists cadastro_elenco_provisorio boolean not null default false,
  add column if not exists situacao_elenco text not null default 'Ativo',
  add column if not exists consentimento_em timestamptz;

-- Garantir constraint de situação caso não exista
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'religiosos_situacao_elenco_check'
  ) then
    begin
      alter table public.religiosos
        add constraint religiosos_situacao_elenco_check
        check (situacao_elenco in ('Ativo', 'Ausente'));
    exception
      when others then null;
    end;
  end if;
end $$;

-- 2. Função de autorização da secretaria/administração
create or replace function public.elenco_secretaria_autorizada()
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_role text;
begin
  -- Acesso direto por superusuários ou rotinas internas do Supabase
  if session_user in ('postgres', 'supabase_admin') then
    return true;
  end if;

  begin
    v_role := current_setting('role', true);
    if v_role in ('service_role', 'postgres', 'supabase_admin') then
      return true;
    end if;
  exception
    when others then null;
  end;

  -- Papéis administrativos e secretaria
  begin
    if public.usuario_tem_papel('secretaria')
       or public.usuario_tem_papel('admin')
       or public.usuario_tem_papel('religiosos') then
      return true;
    end if;
  exception
    when others then null;
  end;

  return false;
end;
$$;

revoke all on function public.elenco_secretaria_autorizada() from public;
grant execute on function public.elenco_secretaria_autorizada() to anon, authenticated, service_role;

-- 3. Atualizar função trigger de proteção dos campos de elenco
create or replace function public.proteger_campos_elenco_religioso()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  -- Se for secretaria ou administrador, permite qualquer modificação
  if public.elenco_secretaria_autorizada() then
    return new;
  end if;

  -- Novo cadastro (INSERT - formulário público ou confrade):
  if tg_op = 'INSERT' then
    new.situacao_elenco := coalesce(new.situacao_elenco, 'Ativo');
    -- Preserva os dados informados no cadastro inicial provisório
    return new;
  end if;

  -- Atualização (UPDATE - confrade editando seus próprios dados):
  -- Não dispara erro fatal; preserva silenciosamente os dados canônicos já cadastrados
  if tg_op = 'UPDATE' then
    new.situacao_elenco := coalesce(old.situacao_elenco, 'Ativo');
    if old.obra_atual_id is not null and new.obra_atual_id is distinct from old.obra_atual_id then
      new.obra_atual_id := old.obra_atual_id;
    end if;
    if old.comunidade_atual_nome is not null and new.comunidade_atual_nome is distinct from old.comunidade_atual_nome then
      new.comunidade_atual_nome := old.comunidade_atual_nome;
    end if;
  end if;

  return new;
end;
$$;

-- 4. Recriar o trigger na tabela public.religiosos
drop trigger if exists trg_proteger_campos_elenco_religioso on public.religiosos;
create trigger trg_proteger_campos_elenco_religioso
  before insert or update on public.religiosos
  for each row execute function public.proteger_campos_elenco_religioso();

commit;

-- 5. Atualizar o schema cache do PostgREST
notify pgrst, 'reload schema';
