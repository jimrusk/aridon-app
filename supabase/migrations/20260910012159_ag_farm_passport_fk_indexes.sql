-- Cover Farm Passport collaboration foreign keys used by tenant, owner and review lookups.
create index if not exists ag_farm_passports_owner_user_idx on public.ag_farm_passports(owner_user_id);
create index if not exists ag_farm_passport_files_tenant_idx on public.ag_farm_passport_files(tenant_id);
create index if not exists ag_farm_passport_files_customer_file_idx on public.ag_farm_passport_files(customer_file_id);
create index if not exists ag_farm_passport_shares_tenant_idx on public.ag_farm_passport_shares(tenant_id);
create index if not exists ag_farm_passport_shares_created_by_idx on public.ag_farm_passport_shares(created_by);
create index if not exists ag_farm_passport_reviews_tenant_idx on public.ag_farm_passport_reviews(tenant_id);
create index if not exists ag_farm_passport_reviews_share_idx on public.ag_farm_passport_reviews(share_id);
