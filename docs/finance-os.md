# Aridon Finance OS

Aridon Finance OS provides a tenant-scoped finance ledger, manual imports, reconciliation, tax workpaper handoff, and optional live connectors for banks, QuickBooks Online, and Stripe.

## Live without external credentials

The signed-in Finance workspace at `/customer/finance` resolves the user's Aridon workspace and opens `/workspace/[slug]/finance`.

The following functions work without third-party connector credentials:

- Bank/accounting CSV transaction import
- Payroll CSV import
- Invoice/receivables CSV import
- Normalized tenant-scoped ledger
- Duplicate, uncategorized, unmatched-deposit, overdue-invoice and invoice-payment reconciliation
- Tax-year workpaper summary
- Owner approval gate for tax handoff
- Authenticated annual ledger CSV export for a CPA, EA or tax firm
- Ag-mode finance workspace for agricultural tenants

Aridon prepares records, estimates, reconciliation and workpapers. It does not represent itself as the credentialed professional who signs or electronically files a tax return.

## Bank and card feeds with Plaid

Required server environment variables:

- `PLAID_CLIENT_ID`
- `PLAID_SECRET`
- `PLAID_ENV` = `sandbox`, `development`, or `production`

Finance OS creates a Plaid Link token, exchanges the returned public token server-side, encrypts the access token, and syncs accounts, balances and transactions through Plaid Transactions Sync.

## QuickBooks Online

Required server environment variables:

- `INTUIT_CLIENT_ID`
- `INTUIT_CLIENT_SECRET`
- `INTUIT_ENV` = `sandbox` or `production`

Optional:

- `INTUIT_REDIRECT_URI`

Default redirect URI:

`https://aridon-v02.vercel.app/api/customer/finance/connect/quickbooks/callback`

The connector stores the OAuth access/refresh tokens encrypted and syncs accounts, purchases, deposits, customer payments, sales receipts and invoices into the Aridon finance ledger.

## Stripe Payments

Required server environment variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_CONNECT_CLIENT_ID`

Optional:

- `STRIPE_CONNECT_REDIRECT_URI`

Default redirect URI:

`https://aridon-v02.vercel.app/api/customer/finance/connect/stripe/callback`

The connector uses Stripe Connect OAuth and imports relevant balance-transaction economics into the ledger. Processor fees are recorded as separate outflows. Payout transfers are intentionally not imported as revenue so a connected bank feed does not double-count cash movement.

## Credential protection

Connector credentials are never stored in browser-readable tables. `customer_finance_secrets` is RLS-enabled with no grants or policies for `anon` or `authenticated` roles and is accessed only by the server service role.

Secrets are encrypted with AES-256-GCM. If `FINANCE_CONNECTOR_ENCRYPTION_KEY` is configured it is used as the root secret; otherwise the server-only Supabase service role key is used to derive a Finance OS encryption key.

OAuth state is also encrypted, signed by the authenticated flow context and expires after 20 minutes.

## Database tables

- `customer_finance_connections`
- `customer_finance_secrets`
- `customer_finance_imports`
- `customer_finance_accounts`
- `customer_finance_transactions`
- `customer_finance_invoices`
- `customer_finance_reconciliation_runs`
- `customer_finance_reconciliation_items`
- `customer_finance_tax_handoffs`

All user-facing finance tables are protected by tenant-membership RLS policies.
