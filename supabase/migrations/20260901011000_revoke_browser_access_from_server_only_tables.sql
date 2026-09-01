do $$
declare r record;
begin
  for r in
    select t.tablename
    from pg_tables t
    where t.schemaname = 'public'
      and t.rowsecurity = true
      and not exists (
        select 1 from pg_policies p
        where p.schemaname = 'public' and p.tablename = t.tablename
      )
  loop
    execute format('revoke all on public.%I from anon, authenticated', r.tablename);
  end loop;
end $$;
