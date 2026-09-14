-- Tenant-member policies for Scout sales records. Integration credentials stay server-only.

do $$
declare
  t text;
begin
  foreach t in array array[
    'customer_sales_profiles',
    'customer_sales_leads',
    'customer_sales_campaigns',
    'customer_sales_suppressions',
    'customer_sales_events',
    'customer_sales_watches'
  ] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);

    execute format('drop policy if exists "scout tenant select" on public.%I', t);
    execute format(
      'create policy "scout tenant select" on public.%I for select to authenticated using (exists (select 1 from public.customer_memberships m where m.tenant_id = %I.tenant_id and m.user_id = (select auth.uid())))',
      t, t
    );

    execute format('drop policy if exists "scout tenant insert" on public.%I', t);
    execute format(
      'create policy "scout tenant insert" on public.%I for insert to authenticated with check (exists (select 1 from public.customer_memberships m where m.tenant_id = %I.tenant_id and m.user_id = (select auth.uid())))',
      t, t
    );

    execute format('drop policy if exists "scout tenant update" on public.%I', t);
    execute format(
      'create policy "scout tenant update" on public.%I for update to authenticated using (exists (select 1 from public.customer_memberships m where m.tenant_id = %I.tenant_id and m.user_id = (select auth.uid()))) with check (exists (select 1 from public.customer_memberships m where m.tenant_id = %I.tenant_id and m.user_id = (select auth.uid())))',
      t, t, t
    );

    execute format('drop policy if exists "scout tenant delete" on public.%I', t);
    execute format(
      'create policy "scout tenant delete" on public.%I for delete to authenticated using (exists (select 1 from public.customer_memberships m where m.tenant_id = %I.tenant_id and m.user_id = (select auth.uid())))',
      t, t
    );
  end loop;
end $$;

-- Customer integration credentials contain encrypted secrets. Keep the table inaccessible
-- to direct authenticated browser queries. Server routes use the service role only after
-- a customer token has been validated and tenant membership has been resolved.
revoke all on public.customer_sales_integrations from anon, authenticated;
