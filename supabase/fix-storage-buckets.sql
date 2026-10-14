-- ==============================================================================
-- CORREÇÃO DEFINITIVA DO SUPABASE STORAGE (BUCKETS E PERMISSÕES PÚBLICAS)
-- Sistema BRM - Província Brasil Meridional
--
-- Como aplicar:
-- 1. Acesse o painel do Supabase: https://app.supabase.com
-- 2. Abra o projeto "ukhxcwzifugxdkdhobsi" (ou o seu projeto ativo)
-- 3. No menu lateral, clique em "SQL Editor"
-- 4. Clique em "New Query" (+), cole todo este script e clique em "Run" (Executar)
-- ==============================================================================

-- 1. Buckets públicos para documentos publicados e fotos de obras.
-- Documentos pessoais religiosos permanecem em bucket privado.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('documentos-provincia', 'documentos-provincia', true, 52428800, array['application/pdf', 'image/jpeg', 'image/png', 'image/tiff', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('religiosos-documentos', 'religiosos-documentos', false, 52428800, array['application/pdf', 'image/jpeg', 'image/png', 'image/tiff']),
  ('obras-fotos', 'obras-fotos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ------------------------------------------------------------------------------
-- 2. POLÍTICAS DE ACESSO PARA 'documentos-provincia'
-- Permite leitura de documentos oficiais e envio pela chancelaria/secretaria
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "documentos_provincia_public_read" ON storage.objects;
CREATE POLICY "documentos_provincia_public_read" ON storage.objects 
  FOR SELECT TO public USING (bucket_id = 'documentos-provincia');

DROP POLICY IF EXISTS "documentos_provincia_anon_insert" ON storage.objects;
DROP POLICY IF EXISTS "documentos_provincia_public_insert" ON storage.objects;
DROP POLICY IF EXISTS "documentos_provincia_secretaria_insert" ON storage.objects;
CREATE POLICY "documentos_provincia_secretaria_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos-provincia' AND public.usuario_tem_papel('secretaria'));

DROP POLICY IF EXISTS "documentos_provincia_anon_update" ON storage.objects;
DROP POLICY IF EXISTS "documentos_provincia_public_update" ON storage.objects;
DROP POLICY IF EXISTS "documentos_provincia_secretaria_update" ON storage.objects;
CREATE POLICY "documentos_provincia_secretaria_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documentos-provincia' AND public.usuario_tem_papel('secretaria'))
  WITH CHECK (bucket_id = 'documentos-provincia' AND public.usuario_tem_papel('secretaria'));

DROP POLICY IF EXISTS "documentos_provincia_anon_delete" ON storage.objects;
DROP POLICY IF EXISTS "documentos_provincia_public_delete" ON storage.objects;
DROP POLICY IF EXISTS "documentos_provincia_secretaria_delete" ON storage.objects;
CREATE POLICY "documentos_provincia_secretaria_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documentos-provincia' AND public.usuario_tem_papel('secretaria'));

-- ------------------------------------------------------------------------------
-- 3. POLÍTICAS DE ACESSO PARA 'religiosos-documentos'
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "religiosos_docs_public_read" ON storage.objects;
-- Policies per record are installed by migration-portal-religioso-seguro.sql.

DROP POLICY IF EXISTS "religiosos_docs_anon_insert" ON storage.objects;

DROP POLICY IF EXISTS "religiosos_docs_anon_update" ON storage.objects;

DROP POLICY IF EXISTS "religiosos_docs_anon_delete" ON storage.objects;

-- ------------------------------------------------------------------------------
-- 4. POLÍTICAS DE ACESSO PARA 'obras-fotos'
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "obras_fotos_public_read" ON storage.objects;
CREATE POLICY "obras_fotos_public_read" ON storage.objects 
  FOR SELECT TO public USING (bucket_id = 'obras-fotos');

DROP POLICY IF EXISTS "obras_fotos_anon_insert" ON storage.objects;
CREATE POLICY "obras_fotos_anon_insert" ON storage.objects 
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'obras-fotos');

DROP POLICY IF EXISTS "obras_fotos_anon_update" ON storage.objects;
DROP POLICY IF EXISTS "obras_fotos_public_update" ON storage.objects;

DROP POLICY IF EXISTS "obras_fotos_anon_delete" ON storage.objects;
DROP POLICY IF EXISTS "obras_fotos_public_delete" ON storage.objects;
