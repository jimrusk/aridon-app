alter table public.customer_sales_leads
  add column if not exists contact_phone text;

comment on column public.customer_sales_leads.contact_phone is
  'Publicly verified business phone or direct business line found during Scout contact enrichment.';
