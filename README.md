# Aridon v0.5

Aridon is the protected operator command center. The repository also contains a customer-facing **Private Business OS** product whose public branding, login, tenant data and billing flow are kept separate from the Aridon operator experience.

## Operator system

- Dashboard and AI executive team
- Builder, CRM, projects, tasks and Knowledge Vault
- Email Command Center with approval-gated Gmail sending
- Morning Intelligence Center
- Executive Challenge Suite
- Execution Replacement Layer
- AWG-1000 four-room challenge pack
- Protected customer provisioning, beta invites and feedback review

## Private Business OS customer product

Customer-facing routes deliberately hide Aridon operator controls and use separate metadata/branding:

- `/business-os` — public sales site
- `/business-os/signup` — no-charge preview signup
- `/workspace/preview` — personalized workspace preview
- `/business-os/checkout` — Stripe subscription checkout
- `/business-os/activate` — account creation after paid checkout
- `/business-os/beta` — one-time no-cost beta activation link
- `/customer/login` — customer-only login
- `/customer/account` — account and billing management
- `/customer/feedback` — structured product feedback
- `/workspace/[slug]` — authenticated tenant workspace

Operator-only customer routes remain behind Aridon's Basic Auth:

- `/customers/beta` — generate a one-time free tester invite
- `/customers/feedback` — review tester/customer feedback

## Customer data isolation

Run `customer-os-schema.sql` in the Supabase SQL Editor before activating real customer workspaces. It creates separate tables for:

- customer tenants
- tenant memberships linked to Supabase Auth users
- customer projects, tasks and knowledge
- customer feedback
- one-time beta invitations
- Stripe customer/subscription state

RLS is enabled on the customer tables. Customer workspace API routes validate the Supabase access token, verify tenant membership, then serve only that tenant's records. The browser does not receive the service-role key.

## No-cost beta test flow

The beta path does **not** require Stripe and does **not** ask the tester for a card.

1. Run `customer-os-schema.sql` once in Supabase.
2. Open the protected operator page `/customers/beta`.
3. Enter the test company's name, test lead, email and industry.
4. Create the invitation and copy the one-time link.
5. Send that link to the test company.
6. The tester creates a password and receives a private tenant with `subscription_status=beta`.
7. The tester uses **Send Feedback** inside the workspace.
8. Review submissions at `/customers/feedback`.

Beta invite tokens are random, single-use and stored in the database only as SHA-256 hashes.

## Paid subscription flow

Paid activation uses Stripe Checkout and Stripe's customer billing portal. No Stripe secret is exposed to the browser.

1. Create recurring Stripe Prices for Launch, Growth and Command.
2. Set the Stripe variables below in Vercel.
3. Create a Stripe webhook endpoint at:

```text
https://YOUR-PRODUCTION-DOMAIN/api/stripe/webhook
```

4. Subscribe the endpoint to at least:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Put the webhook signing secret in `STRIPE_WEBHOOK_SECRET`.
6. Redeploy.

After a completed Checkout session, the webhook automatically reserves the customer tenant. The success page then creates/links the customer's Supabase Auth account and tenant membership. Subscription updates control workspace access.

## Required Vercel environment variables

Copy `.env.example` as a checklist and add real values in Vercel Project Settings. Never commit secrets.

```bash
ARIDON_APP_USERNAME=your-private-operator-username
ARIDON_APP_PASSWORD=your-long-unique-password
ARIDON_APP_SECONDARY_USERNAME=optional-second-username
ARIDON_APP_SECONDARY_PASSWORD=optional-second-long-unique-password
NEXT_PUBLIC_APP_URL=https://your-production-domain
OPENAI_API_KEY=your-openai-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-signing-secret
STRIPE_PRICE_LAUNCH=price_...
STRIPE_PRICE_GROWTH=price_...
STRIPE_PRICE_COMMAND=price_...
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GMAIL_TOKEN_ENCRYPTION_KEY=your-long-random-encryption-secret
```

`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GOOGLE_CLIENT_SECRET`, and `GMAIL_TOKEN_ENCRYPTION_KEY` must remain server-only. Never prefix them with `NEXT_PUBLIC_`.

## Supabase Auth setup for customers

Add your production URL and these redirect destinations to the Supabase Auth URL configuration as appropriate:

```text
https://YOUR-PRODUCTION-DOMAIN/customer/login
https://YOUR-PRODUCTION-DOMAIN/customer/reset
```

Customer accounts are created only after a completed paid checkout or a valid one-time beta invitation.

## Gmail OAuth setup

1. Enable the Gmail API in Google Cloud.
2. Configure the OAuth consent screen and test users while the app is in testing mode.
3. Create an OAuth 2.0 Client ID for a Web application.
4. Add this authorized redirect URI:

```text
https://YOUR-PRODUCTION-DOMAIN/api/gmail/callback
```

5. Add the Google client ID, client secret and token-encryption secret to Vercel and redeploy.
6. Reconnect Gmail after scope changes.

The app uses Gmail send access for approval-gated outbound email and read-only access for matching Aridon briefing messages used by Morning Intelligence. It does not delete or modify inbox messages.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Security behavior

- Aridon operator routes use HTTP Basic Authentication and fail closed in production when credentials are missing.
- Customer-facing routes never inherit the operator login or operator navigation.
- Customer workspace APIs require a valid Supabase access token and tenant membership.
- Stripe webhooks require a valid Stripe signature with a five-minute timestamp tolerance.
- Beta invitations are random, one-time, expiration-limited tokens stored only as hashes.
- Customer and operator database tables are separate.
- API responses carrying private/customer state use `no-store`.
- Gmail refresh tokens are encrypted with AES-256-GCM before being stored in an HTTP-only secure cookie.
- Outgoing Gmail sending still requires explicit approval.

## Temporary Eva narration render

[Render Eva Aridon Ag narration](https://aridon-v02.vercel.app/api/eva-ag-narration?part=all&raw=1)
