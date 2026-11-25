begin;

-- Eventos encerrados há mais de 1 dia (fuso America/Sao_Paulo) saem do portal dos confrades
-- e permanecem visíveis apenas para a Secretaria (via política eventos_provinciais_secretaria_read).
drop policy if exists eventos_provinciais_public_read on public.eventos_provinciais;
create policy eventos_provinciais_public_read
  on public.eventos_provinciais for select to anon, authenticated
  using (
    publicado_portal
    and status <> 'Cancelado'
    and greatest(data_inicio, coalesce(data_fim, data_inicio))
      >= ((now() at time zone 'America/Sao_Paulo')::date - 1)
  );

commit;
