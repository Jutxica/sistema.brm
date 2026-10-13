-- Run this migration before deploying the six-step religious registration form.
-- Existing records remain valid; only supported catalog values and one optional
-- academic-location field are added.

alter table public.religiosos_obras_referencia
  add column if not exists cep text,
  add column if not exists logradouro text,
  add column if not exists numero text,
  add column if not exists complemento text,
  add column if not exists bairro text,
  add column if not exists cidade text,
  add column if not exists estado text,
  add column if not exists pais text default 'Brasil';

alter table public.religiosos_formacao_religiosa
  drop constraint if exists religiosos_formacao_religiosa_etapa_check;

alter table public.religiosos_formacao_religiosa
  add constraint religiosos_formacao_religiosa_etapa_check
  check (etapa in (
    'Seminário Menor',
    'Propedêutico',
    'Discipulado',
    'Postulantado',
    'Noviciado',
    'Tirocínio',
    'Configuração'
  ));

alter table public.religiosos_formacao_academica
  add column if not exists pais text;

alter table public.religiosos_formacao_academica
  drop constraint if exists religiosos_formacao_academica_categoria_check;

alter table public.religiosos_formacao_academica
  add constraint religiosos_formacao_academica_categoria_check
  check (categoria in (
    'Ensino médio',
    'Filosofia',
    'Teologia',
    'Bacharelado',
    'Graduação',
    'Pós-graduação',
    'Mestrado',
    'Doutorado',
    'Especialização',
    'Cursos livres',
    'Formação permanente'
  ));

alter table public.religiosos_idiomas
  drop constraint if exists religiosos_idiomas_nivel_check;

alter table public.religiosos_idiomas
  add constraint religiosos_idiomas_nivel_check
  check (nivel is null or nivel in (
    'Básico',
    'Intermediário',
    'Avançado',
    'Fluente',
    'A1 - Iniciante',
    'A2 - Básico',
    'B1 - Intermediário',
    'B2 - Intermediário avançado',
    'C1 - Avançado',
    'C2 - Proficiente'
  ));
