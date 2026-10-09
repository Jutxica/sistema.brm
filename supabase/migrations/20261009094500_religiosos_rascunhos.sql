begin;

create table if not exists public.religiosos_rascunhos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  chave text not null,
  draft_data jsonb not null check (
    jsonb_typeof(draft_data) = 'object'
    and octet_length(draft_data::text) <= 2000000
  ),
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (usuario_id, chave)
);

create index if not exists religiosos_rascunhos_updated_at_idx
  on public.religiosos_rascunhos (usuario_id, updated_at desc);

alter table public.religiosos_rascunhos enable row level security;
revoke all on public.religiosos_rascunhos from public, anon, authenticated;
grant select, insert, update, delete on public.religiosos_rascunhos to authenticated;

drop policy if exists religiosos_rascunhos_owner_select on public.religiosos_rascunhos;
create policy religiosos_rascunhos_owner_select
  on public.religiosos_rascunhos for select to authenticated
  using (usuario_id = (select auth.uid()));

drop policy if exists religiosos_rascunhos_owner_insert on public.religiosos_rascunhos;
create policy religiosos_rascunhos_owner_insert
  on public.religiosos_rascunhos for insert to authenticated
  with check (usuario_id = (select auth.uid()));

drop policy if exists religiosos_rascunhos_owner_update on public.religiosos_rascunhos;
create policy religiosos_rascunhos_owner_update
  on public.religiosos_rascunhos for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

drop policy if exists religiosos_rascunhos_owner_delete on public.religiosos_rascunhos;
create policy religiosos_rascunhos_owner_delete
  on public.religiosos_rascunhos for delete to authenticated
  using (usuario_id = (select auth.uid()));

commit;
