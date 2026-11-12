-- =========================================================================
-- MIGRATION: Registro de Disparo de Credenciais de Primeiro Acesso
-- Província Brasileira Meridional - Portal do Religioso
-- =========================================================================

alter table public.religiosos
  add column if not exists credenciais_enviadas_em timestamptz,
  add column if not exists credenciais_enviadas_por text;

comment on column public.religiosos.credenciais_enviadas_em is 'Data e hora do último disparo das credenciais de primeiro acesso por e-mail';
comment on column public.religiosos.credenciais_enviadas_por is 'Identificador ou nome do operador da secretaria que realizou o disparo das credenciais';
