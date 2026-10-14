-- Unifica os nomes de ministérios e ordens usados pelo cadastro religioso.
alter table public.religiosos_ministerios_ordens
  drop constraint if exists religiosos_ministerios_ordens_tipo_check;

update public.religiosos_ministerios_ordens
set tipo = case tipo
  when 'Ministério da Palavra' then 'Leitorado'
  when 'Ministério do Leitorado' then 'Leitorado'
  when 'Ministério do Altar' then 'Acolitado'
  when 'Diaconato' then 'Diaconado'
  else tipo
end;

alter table public.religiosos_ministerios_ordens
  add constraint religiosos_ministerios_ordens_tipo_check
  check (tipo in ('Leitorado', 'Acolitado', 'Diaconado', 'Presbiterado', 'Episcopado'));
