begin;

alter table public.religiosos
  add column if not exists consentimento_em timestamptz;

commit;
