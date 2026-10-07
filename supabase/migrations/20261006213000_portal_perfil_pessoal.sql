begin;

create table if not exists public.portal_perfis_religiosos (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  nome_civil text not null default '' check (char_length(nome_civil) <= 160),
  nome_religioso text not null default '' check (char_length(nome_religioso) <= 160),
  grau text not null default 'Padre' check (char_length(grau) <= 80),
  foto_path text check (
    foto_path is null or foto_path like (auth_user_id::text || '/%')
  ),
  comunidade_atual_nome text not null default '' check (char_length(comunidade_atual_nome) <= 240),
  email_institucional text not null default '' check (char_length(email_institucional) <= 254),
  whatsapp text not null default '' check (char_length(whatsapp) <= 40),
  telefone_celular text not null default '' check (char_length(telefone_celular) <= 40),
  atualizado_em timestamptz not null default now()
);

alter table public.portal_perfis_religiosos enable row level security;
revoke all on public.portal_perfis_religiosos from public, anon, authenticated;
grant select, insert, update on public.portal_perfis_religiosos to authenticated;

drop policy if exists portal_perfis_religiosos_owner_access on public.portal_perfis_religiosos;
create policy portal_perfis_religiosos_owner_access
  on public.portal_perfis_religiosos
  for all to authenticated
  using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

insert into public.portal_perfis_religiosos (
  auth_user_id, nome_civil, nome_religioso, grau, foto_path,
  comunidade_atual_nome, email_institucional, whatsapp, telefone_celular, atualizado_em
)
select
  r.auth_user_id, coalesce(r.nome_civil, ''), coalesce(r.nome_religioso, ''),
  coalesce(r.grau, 'Padre'),
  case when r.foto_path like (r.auth_user_id::text || '/%') then r.foto_path else null end,
  coalesce(c.nome, ''), coalesce(r.email_institucional, ''),
  coalesce(r.whatsapp, ''), coalesce(r.telefone_celular, ''), now()
from public.religiosos r
left join public.comunidades c on c.id = r.comunidade_atual_id
where r.auth_user_id is not null
on conflict (auth_user_id) do nothing;

drop policy if exists religiosos_perfil_select_owner on storage.objects;
create policy religiosos_perfil_select_owner
  on storage.objects for select to authenticated
  using (
    bucket_id = 'religiosos-perfil'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

drop policy if exists religiosos_perfil_insert_owner on storage.objects;
create policy religiosos_perfil_insert_owner
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'religiosos-perfil'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

drop policy if exists religiosos_perfil_delete_owner on storage.objects;
create policy religiosos_perfil_delete_owner
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'religiosos-perfil'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

commit;
