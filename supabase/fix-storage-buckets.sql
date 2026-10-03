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

-- 1. CRIAR OU ATUALIZAR OS BUCKETS COMO PÚBLICOS
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('documentos-provincia', 'documentos-provincia', true),
  ('religiosos-documentos', 'religiosos-documentos', true),
  ('obras-fotos', 'obras-fotos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ------------------------------------------------------------------------------
-- 2. POLÍTICAS DE ACESSO PARA 'documentos-provincia'
-- Permite leitura de documentos oficiais e envio pela chancelaria/secretaria
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "documentos_provincia_public_read" ON storage.objects;
CREATE POLICY "documentos_provincia_public_read" ON storage.objects 
  FOR SELECT TO public USING (bucket_id = 'documentos-provincia');

DROP POLICY IF EXISTS "documentos_provincia_anon_insert" ON storage.objects;
DROP POLICY IF EXISTS "documentos_provincia_public_insert" ON storage.objects;
CREATE POLICY "documentos_provincia_anon_insert" ON storage.objects 
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'documentos-provincia');

DROP POLICY IF EXISTS "documentos_provincia_anon_update" ON storage.objects;
DROP POLICY IF EXISTS "documentos_provincia_public_update" ON storage.objects;
CREATE POLICY "documentos_provincia_anon_update" ON storage.objects 
  FOR UPDATE TO anon, authenticated USING (bucket_id = 'documentos-provincia') WITH CHECK (bucket_id = 'documentos-provincia');

DROP POLICY IF EXISTS "documentos_provincia_anon_delete" ON storage.objects;
DROP POLICY IF EXISTS "documentos_provincia_public_delete" ON storage.objects;
CREATE POLICY "documentos_provincia_anon_delete" ON storage.objects 
  FOR DELETE TO anon, authenticated USING (bucket_id = 'documentos-provincia');

-- ------------------------------------------------------------------------------
-- 3. POLÍTICAS DE ACESSO PARA 'religiosos-documentos'
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "religiosos_documentos_read" ON storage.objects;
DROP POLICY IF EXISTS "religiosos_docs_public_read" ON storage.objects;
CREATE POLICY "religiosos_docs_public_read" ON storage.objects 
  FOR SELECT TO public USING (bucket_id = 'religiosos-documentos');

DROP POLICY IF EXISTS "religiosos_documentos_upload" ON storage.objects;
DROP POLICY IF EXISTS "religiosos_docs_anon_insert" ON storage.objects;
CREATE POLICY "religiosos_docs_anon_insert" ON storage.objects 
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'religiosos-documentos');

DROP POLICY IF EXISTS "religiosos_documentos_update" ON storage.objects;
DROP POLICY IF EXISTS "religiosos_docs_anon_update" ON storage.objects;
CREATE POLICY "religiosos_docs_anon_update" ON storage.objects 
  FOR UPDATE TO anon, authenticated USING (bucket_id = 'religiosos-documentos') WITH CHECK (bucket_id = 'religiosos-documentos');

DROP POLICY IF EXISTS "religiosos_documentos_delete" ON storage.objects;
DROP POLICY IF EXISTS "religiosos_docs_anon_delete" ON storage.objects;
CREATE POLICY "religiosos_docs_anon_delete" ON storage.objects 
  FOR DELETE TO anon, authenticated USING (bucket_id = 'religiosos-documentos');

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
CREATE POLICY "obras_fotos_anon_update" ON storage.objects 
  FOR UPDATE TO anon, authenticated USING (bucket_id = 'obras-fotos') WITH CHECK (bucket_id = 'obras-fotos');

DROP POLICY IF EXISTS "obras_fotos_anon_delete" ON storage.objects;
CREATE POLICY "obras_fotos_anon_delete" ON storage.objects 
  FOR DELETE TO anon, authenticated USING (bucket_id = 'obras-fotos');
