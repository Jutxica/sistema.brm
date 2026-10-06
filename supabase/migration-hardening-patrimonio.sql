-- Protege dados e arquivos patrimoniais por papel institucional.
-- Antes desta migração, aplique migration-patrimonio.sql,
-- migration-fase1-seguranca-auditoria.sql, migration-fase2-documentos-e-sync.sql
-- e migration-hardening-usuarios.sql. Ela aborta com a lista de tabelas ausentes.
begin;

do $$
declare
  target_table text;
  policy_record record;
  missing_tables text[];
begin
  select array_agg(required.table_name order by required.table_name)
  into missing_tables
  from unnest(array[
    'patrimonio_audit_logs',
    'patrimonio_imoveis',
    'patrimonio_veiculos',
    'patrimonio_bens',
    'patrimonio_contratos',
    'patrimonio_manutencoes',
    'patrimonio_documentos'
  ]) as required(table_name)
  where to_regclass(format('public.%I', required.table_name)) is null;

  if coalesce(array_length(missing_tables, 1), 0) > 0 then
    raise exception
      'Migração patrimonial não aplicada: faltam tabelas %. Aplique migration-patrimonio.sql, migration-fase1-seguranca-auditoria.sql e migration-fase2-documentos-e-sync.sql antes desta migração.',
      array_to_string(missing_tables, ', ');
  end if;

  foreach target_table in array array[
    'patrimonio_audit_logs',
    'patrimonio_imoveis',
    'patrimonio_veiculos',
    'patrimonio_bens',
    'patrimonio_contratos',
    'patrimonio_manutencoes',
    'patrimonio_documentos'
  ]
  loop
    execute format('alter table public.%I enable row level security', target_table);
    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = target_table
    loop
      execute format('drop policy %I on public.%I', policy_record.policyname, target_table);
    end loop;
  end loop;
end;
$$;

create policy patrimonio_logs_insert_authorized
  on public.patrimonio_audit_logs for insert to authenticated
  with check (public.usuario_tem_papel('patrimonio'));
create policy patrimonio_logs_read_authorized
  on public.patrimonio_audit_logs for select to authenticated
  using (
    public.usuario_tem_papel('admin')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  );

create policy patrimonio_imoveis_read_authorized
  on public.patrimonio_imoveis for select to authenticated
  using (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  );
create policy patrimonio_imoveis_insert_authorized
  on public.patrimonio_imoveis for insert to authenticated
  with check (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  );
create policy patrimonio_imoveis_update_authorized
  on public.patrimonio_imoveis for update to authenticated
  using (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  )
  with check (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  );
create policy patrimonio_imoveis_delete_authorized
  on public.patrimonio_imoveis for delete to authenticated
  using (
    public.usuario_tem_papel('admin')
    or public.usuario_tem_papel('economo')
  );

create policy patrimonio_veiculos_read_authorized
  on public.patrimonio_veiculos for select to authenticated
  using (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  );
create policy patrimonio_veiculos_insert_authorized
  on public.patrimonio_veiculos for insert to authenticated
  with check (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  );
create policy patrimonio_veiculos_update_authorized
  on public.patrimonio_veiculos for update to authenticated
  using (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  )
  with check (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  );
create policy patrimonio_veiculos_delete_authorized
  on public.patrimonio_veiculos for delete to authenticated
  using (
    public.usuario_tem_papel('admin')
    or public.usuario_tem_papel('economo')
  );

create policy patrimonio_bens_read_authorized
  on public.patrimonio_bens for select to authenticated
  using (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  );
create policy patrimonio_bens_insert_authorized
  on public.patrimonio_bens for insert to authenticated
  with check (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  );
create policy patrimonio_bens_update_authorized
  on public.patrimonio_bens for update to authenticated
  using (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  )
  with check (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  );
create policy patrimonio_bens_delete_authorized
  on public.patrimonio_bens for delete to authenticated
  using (
    public.usuario_tem_papel('admin')
    or public.usuario_tem_papel('economo')
  );

create policy patrimonio_contratos_read_authorized
  on public.patrimonio_contratos for select to authenticated
  using (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  );
create policy patrimonio_contratos_insert_authorized
  on public.patrimonio_contratos for insert to authenticated
  with check (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  );
create policy patrimonio_contratos_update_authorized
  on public.patrimonio_contratos for update to authenticated
  using (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  )
  with check (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  );
create policy patrimonio_contratos_delete_authorized
  on public.patrimonio_contratos for delete to authenticated
  using (
    public.usuario_tem_papel('admin')
    or public.usuario_tem_papel('economo')
  );

create policy patrimonio_manutencoes_read_authorized
  on public.patrimonio_manutencoes for select to authenticated
  using (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('superior_local')
  );
create policy patrimonio_manutencoes_insert_authenticated
  on public.patrimonio_manutencoes for insert to authenticated
  with check ((select auth.uid()) is not null);
create policy patrimonio_manutencoes_update_authorized
  on public.patrimonio_manutencoes for update to authenticated
  using (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('superior_local')
  )
  with check (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
    or public.usuario_tem_papel('superior_local')
  );
create policy patrimonio_manutencoes_delete_authorized
  on public.patrimonio_manutencoes for delete to authenticated
  using (
    public.usuario_tem_papel('admin')
    or public.usuario_tem_papel('economo')
  );

create policy patrimonio_documentos_read_authorized
  on public.patrimonio_documentos for select to authenticated
  using (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  );
create policy patrimonio_documentos_insert_authorized
  on public.patrimonio_documentos for insert to authenticated
  with check (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  );
create policy patrimonio_documentos_update_authorized
  on public.patrimonio_documentos for update to authenticated
  using (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  )
  with check (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  );
create policy patrimonio_documentos_delete_authorized
  on public.patrimonio_documentos for delete to authenticated
  using (
    public.usuario_tem_papel('patrimonio')
    or public.usuario_tem_papel('economo')
    or public.usuario_tem_papel('secretaria')
  );

revoke all on public.patrimonio_audit_logs from public, anon, authenticated;
grant insert, select on public.patrimonio_audit_logs to authenticated;
grant all on public.patrimonio_audit_logs to service_role;

revoke all on public.patrimonio_imoveis from public, anon, authenticated;
revoke all on public.patrimonio_veiculos from public, anon, authenticated;
revoke all on public.patrimonio_bens from public, anon, authenticated;
revoke all on public.patrimonio_contratos from public, anon, authenticated;
revoke all on public.patrimonio_manutencoes from public, anon, authenticated;
revoke all on public.patrimonio_documentos from public, anon, authenticated;
grant select, insert, update, delete on
  public.patrimonio_imoveis,
  public.patrimonio_veiculos,
  public.patrimonio_bens,
  public.patrimonio_contratos,
  public.patrimonio_manutencoes,
  public.patrimonio_documentos
to authenticated;
grant all on
  public.patrimonio_imoveis,
  public.patrimonio_veiculos,
  public.patrimonio_bens,
  public.patrimonio_contratos,
  public.patrimonio_manutencoes,
  public.patrimonio_documentos
to service_role;

update storage.buckets
set public = false
where id = 'patrimonio-documentos';

drop policy if exists "Acesso leitura storage patrimonio autenticado" on storage.objects;
drop policy if exists "Upload storage patrimonio autorizado" on storage.objects;
drop policy if exists "Exclusao storage patrimonio autorizado" on storage.objects;
drop policy if exists patrimonio_storage_read_authorized on storage.objects;
drop policy if exists patrimonio_storage_insert_authorized on storage.objects;
drop policy if exists patrimonio_storage_update_authorized on storage.objects;
drop policy if exists patrimonio_storage_delete_authorized on storage.objects;

create policy patrimonio_storage_read_authorized
  on storage.objects for select to authenticated
  using (
    bucket_id = 'patrimonio-documentos'
    and (
      public.usuario_tem_papel('patrimonio')
      or public.usuario_tem_papel('economo')
      or public.usuario_tem_papel('secretaria')
    )
  );
create policy patrimonio_storage_insert_authorized
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'patrimonio-documentos'
    and (
      public.usuario_tem_papel('patrimonio')
      or public.usuario_tem_papel('economo')
      or public.usuario_tem_papel('secretaria')
    )
  );
create policy patrimonio_storage_update_authorized
  on storage.objects for update to authenticated
  using (
    bucket_id = 'patrimonio-documentos'
    and (
      public.usuario_tem_papel('patrimonio')
      or public.usuario_tem_papel('economo')
      or public.usuario_tem_papel('secretaria')
    )
  )
  with check (
    bucket_id = 'patrimonio-documentos'
    and (
      public.usuario_tem_papel('patrimonio')
      or public.usuario_tem_papel('economo')
      or public.usuario_tem_papel('secretaria')
    )
  );
create policy patrimonio_storage_delete_authorized
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'patrimonio-documentos'
    and (
      public.usuario_tem_papel('patrimonio')
      or public.usuario_tem_papel('economo')
      or public.usuario_tem_papel('secretaria')
    )
  );

commit;
