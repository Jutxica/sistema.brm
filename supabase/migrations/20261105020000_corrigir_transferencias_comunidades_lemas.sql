-- Migração: Remover restrição de destino de transferências, padronizar comunidades e adicionar lemas
ALTER TABLE public.religiosos_designacoes 
  DROP CONSTRAINT IF EXISTS religiosos_designacoes_destino_check;

UPDATE public.comunidades 
SET nome = 'Comunidade Dehoniana de Rondônia'
WHERE nome ILIKE '%Territorial%Rondônia%' OR nome ILIKE '%Rondônia%Nossa Senhora de Nazaré%';

UPDATE public.comunidades 
SET nome = 'Comunidade Dehoniana do Rio Grande do Sul'
WHERE nome ILIKE '%Territorial%São Miguel%' OR nome ILIKE '%Territorial%Sao Miguel%';

UPDATE public.comunidades 
SET nome = regexp_replace(nome, '^Territorial\s+', 'Comunidade ', 'i')
WHERE nome ILIKE 'Territorial %';

UPDATE public.comunidades 
SET nome = regexp_replace(nome, '^Local\s+', 'Comunidade ', 'i')
WHERE nome ILIKE 'Local %';

UPDATE public.religiosos 
SET comunidade_atual_nome = 'Comunidade Dehoniana de Rondônia'
WHERE comunidade_atual_nome ILIKE '%Territorial%Rondônia%' OR comunidade_atual_nome ILIKE '%Rondônia%Nossa Senhora de Nazaré%';

UPDATE public.religiosos 
SET comunidade_atual_nome = 'Comunidade Dehoniana do Rio Grande do Sul'
WHERE comunidade_atual_nome ILIKE '%Territorial%São Miguel%' OR comunidade_atual_nome ILIKE '%Territorial%Sao Miguel%';

UPDATE public.religiosos 
SET comunidade_atual_nome = regexp_replace(comunidade_atual_nome, '^Territorial\s+', 'Comunidade ', 'i')
WHERE comunidade_atual_nome ILIKE 'Territorial %';

UPDATE public.religiosos 
SET comunidade_atual_nome = regexp_replace(comunidade_atual_nome, '^Local\s+', 'Comunidade ', 'i')
WHERE comunidade_atual_nome ILIKE 'Local %';

ALTER TABLE public.religiosos 
  ADD COLUMN IF NOT EXISTS lemas JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS lema_destacado TEXT,
  ADD COLUMN IF NOT EXISTS lema_destacado_fase TEXT;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portal_perfis_religiosos') THEN
    ALTER TABLE public.portal_perfis_religiosos 
      ADD COLUMN IF NOT EXISTS lemas JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS lema_destacado TEXT,
      ADD COLUMN IF NOT EXISTS lema_destacado_fase TEXT,
      ADD COLUMN IF NOT EXISTS comunidade_atual_nome TEXT,
      ADD COLUMN IF NOT EXISTS obra_atual_nome TEXT;

    UPDATE public.portal_perfis_religiosos p
    SET comunidade_atual_nome = r.comunidade_atual_nome,
        obra_atual_nome = r.obra_atual_nome
    FROM public.religiosos r
    WHERE (r.auth_user_id IS NOT NULL AND r.auth_user_id = p.auth_user_id)
       OR lower(trim(r.nome_civil)) = lower(trim(p.nome_civil));
  END IF;
END $$;
