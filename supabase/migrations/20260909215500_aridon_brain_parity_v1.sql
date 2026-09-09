alter table public.customer_assistant_messages
  add column if not exists assistant_mode text not null default 'fast',
  add column if not exists executive_name text,
  add column if not exists provider text,
  add column if not exists model text,
  add column if not exists routing jsonb not null default '{}'::jsonb,
  add column if not exists sources jsonb not null default '[]'::jsonb,
  add column if not exists action_id uuid references public.customer_action_queue(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.customer_assistant_messages'::regclass
      and conname = 'customer_assistant_messages_mode_check'
  ) then
    alter table public.customer_assistant_messages
      add constraint customer_assistant_messages_mode_check
      check (assistant_mode in ('fast','think','research','act'));
  end if;
end $$;

create index if not exists customer_assistant_messages_user_tenant_created_idx
  on public.customer_assistant_messages(user_id, tenant_id, created_at desc);
create index if not exists customer_assistant_messages_mode_created_idx
  on public.customer_assistant_messages(tenant_id, assistant_mode, created_at desc);
create index if not exists customer_executive_memories_tenant_reinforced_idx
  on public.customer_executive_memories(tenant_id, last_reinforced_at desc);

alter table public.customer_assistant_messages enable row level security;
alter table public.customer_executive_memories enable row level security;

drop policy if exists "assistant messages tenant read" on public.customer_assistant_messages;
create policy "assistant messages tenant read"
  on public.customer_assistant_messages for select to authenticated
  using (
    exists (
      select 1 from public.customer_memberships m
      where m.tenant_id = customer_assistant_messages.tenant_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "executive memories tenant read" on public.customer_executive_memories;
create policy "executive memories tenant read"
  on public.customer_executive_memories for select to authenticated
  using (
    exists (
      select 1 from public.customer_memberships m
      where m.tenant_id = customer_executive_memories.tenant_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "executive memories tenant insert" on public.customer_executive_memories;
create policy "executive memories tenant insert"
  on public.customer_executive_memories for insert to authenticated
  with check (
    exists (
      select 1 from public.customer_memberships m
      where m.tenant_id = customer_executive_memories.tenant_id
        and m.user_id = auth.uid()
    )
  );
