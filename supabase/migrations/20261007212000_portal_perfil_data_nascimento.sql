begin;
alter table public.portal_perfis_religiosos add column if not exists data_nascimento date;
update public.portal_perfis_religiosos p
set data_nascimento = r.data_nascimento
from public.religiosos r
where p.auth_user_id = r.auth_user_id
  and p.data_nascimento is null
  and r.data_nascimento is not null;
commit;
