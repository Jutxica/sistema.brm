-- ==============================================================================
-- CORREÇÃO DEFINITIVA: FOTO DE PERFIL 4X4 NA FICHA E DOSSIÊ DO RELIGIOSO
-- Província Brasil Meridional (BRM)
--
-- O que este script faz:
-- 1. Garante que as colunas 'foto_path' e 'foto_url' existam na tabela public.religiosos.
-- 2. Remove restrições de categorias em public.religiosos_documentos para aceitar
--    'Fotografia (Perfil Oficial 4x4)'.
-- 3. Garante que o bucket de Storage 'religiosos-documentos' esteja configurado como
--    público para visualização e impressão direta da foto 4x4.
-- 4. Cria políticas de leitura e gravação no Storage para documentos e fotos.
-- 5. Vincula automaticamente as fotos já enviadas ao cadastro do religioso.
-- 6. Recarrega o Schema Cache do PostgREST.
--
-- Como aplicar:
-- 1. Acesse o Supabase (https://supabase.com/dashboard) -> "SQL Editor"
-- 2. Cole este script e clique em "Run" (ou Ctrl + Enter)
-- ==============================================================================

begin;

-- 1. Adicionar colunas de foto na tabela de religiosos
alter table public.religiosos
  add column if not exists foto_path text,
  add column if not exists foto_url text;

-- 2. Ajustar a tabela de documentos para aceitar a categoria de fotografia oficial
alter table public.religiosos_documentos
  add column if not exists status text not null default 'Ativo',
  add column if not exists caminho_storage text,
  add column if not exists mime_type text,
  add column if not exists tamanho_bytes bigint;

-- Remove constraint restritiva de categoria caso exista
alter table public.religiosos_documentos
  drop constraint if exists religiosos_documentos_categoria_check;

-- 3. Configurar Bucket de Storage 'religiosos-documentos'
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'religiosos-documentos',
  'religiosos-documentos',
  true,
  52428800, -- 50 MB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/tiff']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 4. Políticas de acesso no Storage para 'religiosos-documentos'
drop policy if exists "religiosos_docs_public_read" on storage.objects;
create policy "religiosos_docs_public_read" on storage.objects
  for select to public
  using (bucket_id = 'religiosos-documentos');

drop policy if exists "religiosos_docs_public_insert" on storage.objects;
create policy "religiosos_docs_public_insert" on storage.objects
  for insert to public
  with check (bucket_id = 'religiosos-documentos');

drop policy if exists "religiosos_docs_public_update" on storage.objects;
create policy "religiosos_docs_public_update" on storage.objects
  for update to public
  using (bucket_id = 'religiosos-documentos')
  with check (bucket_id = 'religiosos-documentos');

-- 5. Vincular automaticamente fotografias já enviadas ao campo 'foto_path' dos religiosos
update public.religiosos r
set foto_path = d.caminho_storage
from (
  select distinct on (religioso_id) religioso_id, caminho_storage
  from public.religiosos_documentos
  where caminho_storage is not null
    and (
      categoria ilike '%foto%'
      or categoria ilike '%perfil%'
      or nome_arquivo ilike '%.jpg%'
      or nome_arquivo ilike '%.jpeg%'
      or nome_arquivo ilike '%.png%'
      or nome_arquivo ilike '%.webp%'
    )
  order by
    religioso_id,
    (categoria ilike '%perfil%') desc,
    created_at desc
) d
where r.id = d.religioso_id
  and (r.foto_path is null or r.foto_path = '');

commit;

-- 6. Recarregar o cache do PostgREST
notify pgrst, 'reload schema';
