-- ==============================================================================
-- Migration: Tabela de Histórico e Auditoria de Comunicados e Disparos da Cúria
-- Registra todos os envios de e-mails institucionais (credenciais, circulares, avisos)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.comunicados_disparos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  operador_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  operador_nome TEXT NOT NULL DEFAULT 'Secretaria Provincial',
  tipo_mensagem TEXT NOT NULL DEFAULT 'credenciais', -- 'credenciais' | 'comunicado' | 'circular' | 'convocacao'
  assunto TEXT NOT NULL,
  subtitulo_cabecalho TEXT,
  corpo_texto TEXT,
  bloco_destaque TEXT,
  botao_texto TEXT,
  botao_url TEXT,
  total_destinatarios INT NOT NULL DEFAULT 0,
  total_sucessos INT NOT NULL DEFAULT 0,
  total_falhas INT NOT NULL DEFAULT 0,
  relatorio_envio JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_comunicados_disparos_criado_em 
  ON public.comunicados_disparos (criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_comunicados_disparos_tipo 
  ON public.comunicados_disparos (tipo_mensagem);

-- Habilitar RLS
ALTER TABLE public.comunicados_disparos ENABLE ROW LEVEL SECURITY;

-- Política de leitura: usuários autenticados com acesso à secretaria ou sistema
DROP POLICY IF EXISTS "Leitura de comunicados para usuários autenticados" ON public.comunicados_disparos;
CREATE POLICY "Leitura de comunicados para usuários autenticados"
  ON public.comunicados_disparos
  FOR SELECT
  TO authenticated
  USING (true);

-- Política de inserção: usuários autenticados e service_role
DROP POLICY IF EXISTS "Inserção de comunicados para usuários autenticados" ON public.comunicados_disparos;
CREATE POLICY "Inserção de comunicados para usuários autenticados"
  ON public.comunicados_disparos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
