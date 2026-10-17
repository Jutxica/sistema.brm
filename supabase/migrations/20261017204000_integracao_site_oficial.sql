-- =============================================================
-- INTEGRAÇÃO COM O SITE OFICIAL (SCJ-BRM / SISTEMA.SCJ)
-- =============================================================

alter table public.religiosos_configuracoes
  add column if not exists site_url text default 'https://scj-brm.onrender.com',
  add column if not exists site_supabase_url text,
  add column if not exists site_supabase_key text;

alter table public.religiosos
  add column if not exists publicado_site_em timestamptz,
  add column if not exists publicado_site_id text,
  add column if not exists publicado_site_status text default 'pendente';

comment on column public.religiosos_configuracoes.site_url is 'URL base do site público (Render / domínio próprio)';
comment on column public.religiosos_configuracoes.site_supabase_url is 'URL do projeto Supabase do site oficial';
comment on column public.religiosos_configuracoes.site_supabase_key is 'Chave de API do Supabase do site oficial';
comment on column public.religiosos.publicado_site_em is 'Data e hora da última sincronização com o site oficial';
comment on column public.religiosos.publicado_site_id is 'Slug/ID identificador do religioso no site oficial';
