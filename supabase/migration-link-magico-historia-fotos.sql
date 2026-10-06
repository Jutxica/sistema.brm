-- ====================================================================
-- MIGRAÇÃO: LINK MÁGICO PARA HISTÓRIA E 6 FOTOS DAS PARÓQUIAS E OBRAS
-- Preparação de schema. Depois, aplique migration-hardening-links-formularios.sql
-- para instalar leitura/edição por token e upload vinculado ao link.
-- ====================================================================

-- 1. Adicionar colunas de controle do Link Mágico, História e Fotos
alter table public.religiosos_obras_referencia
  add column if not exists token_edicao uuid default gen_random_uuid(),
  add column if not exists historia text,
  add column if not exists resumo_historico text,
  add column if not exists fotos jsonb default '[]'::jsonb,
  add column if not exists status_historia text default 'Pendente',
  add column if not exists data_envio_historia timestamptz;

-- 2. Garantir que todas as obras existentes tenham um token único
update public.religiosos_obras_referencia
set token_edicao = gen_random_uuid()
where token_edicao is null;

-- Criar índice único para buscas rápidas pelo token
create unique index if not exists idx_obras_referencia_token_edicao
on public.religiosos_obras_referencia(token_edicao);

-- 3. Configuração do Bucket de Fotos das Obras (Público)
insert into storage.buckets (id, name, public)
values ('obras-fotos', 'obras-fotos', true)
on conflict (id) do update set public = true;

-- Políticas de Storage para o bucket 'obras-fotos'
drop policy if exists obras_fotos_public_read on storage.objects;
create policy obras_fotos_public_read on storage.objects
for select to public
using (bucket_id = 'obras-fotos');

drop policy if exists obras_fotos_anon_insert on storage.objects;
drop policy if exists obras_fotos_anon_update on storage.objects;
drop policy if exists obras_fotos_anon_delete on storage.objects;
drop policy if exists obras_fotos_auth_delete on storage.objects;

-- 4. Remover a antiga política irrestrita. A migração de hardening instala RPCs
-- que validam o token e limitam os campos que o link pode alterar.
drop policy if exists religiosos_obras_anon_update_token on public.religiosos_obras_referencia;

-- Notificação de sucesso
select 'Migração de Link Mágico, História e Fotos concluída com sucesso!' as status;
