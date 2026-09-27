-- =============================================================
-- MIGRATION: ADICIONAR COLUNA DA CASA/OBRA DE ACOLHIDA DA PROVÍNCIA BRM
-- =============================================================
-- Permite vincular a hospedagem a qualquer Casa, Seminário ou Obra da Província BRM
-- proveniente da tabela de referência 'religiosos_obras_referencia'.

alter table if exists public.hospedagens
  add column if not exists hos_casa_acolhida text;

comment on column public.hospedagens.hos_casa_acolhida is 'Nome/identificação da Casa ou Obra da Província BRM onde a pessoa solicitou estadia';
