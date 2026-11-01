-- ==============================================================================
-- CRIAR TABELA DE GOVERNO PROVINCIAL NO SUPABASE
-- Execute este script no SQL Editor do Supabase para ativar a tabela
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.governo_provincial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  religioso_id UUID NOT NULL REFERENCES public.religiosos(id) ON DELETE RESTRICT,
  cargo TEXT NOT NULL CHECK (
    cargo IN (
      'Superior Provincial',
      'Secretário Provincial',
      'Ecônomo Provincial',
      '1º Conselheiro',
      '2º Conselheiro',
      '3º Conselheiro',
      '4º Conselheiro',
      'Vice-Provincial',
      'Vice-Ecônomo Provincial',
      'Conselheiro Provincial'
    )
  ),
  ordem_precedencia INTEGER NOT NULL DEFAULT 1,
  trienio TEXT NOT NULL DEFAULT '2024 - 2027',
  data_posse DATE,
  data_termino DATE,
  status TEXT NOT NULL DEFAULT 'Vigente' CHECK (status IN ('Vigente', 'Concluído', 'Renúncia', 'Interino')),
  tipo_ato TEXT DEFAULT 'Capítulo Provincial',
  numero_ato_decreto TEXT,
  data_ato_decreto DATE,
  areas_responsabilidade TEXT,
  email_institucional_governo TEXT,
  telefone_institucional_governo TEXT,
  documento_ato_url TEXT,
  observacoes TEXT,
  sincronizar_elenco BOOLEAN DEFAULT TRUE,
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_governo_provincial_religioso ON public.governo_provincial(religioso_id);
CREATE INDEX IF NOT EXISTS idx_governo_provincial_status ON public.governo_provincial(status);
CREATE INDEX IF NOT EXISTS idx_governo_provincial_trienio ON public.governo_provincial(trienio);
CREATE INDEX IF NOT EXISTS idx_governo_provincial_ordem ON public.governo_provincial(ordem_precedencia);

-- Habilitar RLS
ALTER TABLE public.governo_provincial ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS governo_provincial_select_policy ON public.governo_provincial;
CREATE POLICY governo_provincial_select_policy ON public.governo_provincial
  FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS governo_provincial_all_policy ON public.governo_provincial;
CREATE POLICY governo_provincial_all_policy ON public.governo_provincial
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMIT;
