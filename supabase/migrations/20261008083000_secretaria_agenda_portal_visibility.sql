begin;

alter table public.eventos_provinciais
  add column if not exists publicado_portal boolean not null default true;

drop policy if exists eventos_provinciais_public_read on public.eventos_provinciais;
create policy eventos_provinciais_public_read
  on public.eventos_provinciais for select to anon, authenticated
  using (publicado_portal);

drop policy if exists eventos_provinciais_secretaria_read on public.eventos_provinciais;
create policy eventos_provinciais_secretaria_read
  on public.eventos_provinciais for select to authenticated
  using (public.usuario_tem_papel('secretaria'));

commit;
