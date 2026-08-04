# Aridon v0.4

Aridon is an AI Executive Operating System built for Vercel.

## Included

- Dashboard
- Heather Chat
- Executive Team: Heather, Ethos, Atlas, Eva, Scout, Ledger, Oracle
- Builder Mode
- CRM
- Projects
- Tasks
- Knowledge Vault
- Email Command Center
- Executive-written follow-up drafts
- Approval-gated Gmail sending
- CRM send logging and follow-up task creation
- OpenAI API routes
- Supabase-backed records
- App-wide password protection

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The password gate is bypassed only in local development when its variables are missing. Production fails closed with a 503 response until both login variables are configured.

## Required Vercel environment variables

Copy `.env.example` as a checklist and add the real values in Vercel Project Settings. Never commit the real values.

```bash
ARIDON_APP_USERNAME=your-private-username
ARIDON_APP_PASSWORD=your-long-unique-password
NEXT_PUBLIC_APP_URL=https://your-production-domain
OPENAI_API_KEY=your-openai-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GMAIL_TOKEN_ENCRYPTION_KEY=your-long-random-encryption-secret
```

`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_SECRET`, and `GMAIL_TOKEN_ENCRYPTION_KEY` must remain server-only. Do not prefix them with `NEXT_PUBLIC_`.

## Gmail OAuth setup

1. Create or select a Google Cloud project.
2. Enable the Gmail API.
3. Configure the OAuth consent screen. During initial testing, add Jim's Gmail address as a test user.
4. Create an OAuth 2.0 Client ID for a Web application.
5. Add this authorized redirect URI exactly:

```text
https://YOUR-PRODUCTION-DOMAIN/api/gmail/callback
```

6. Add the Google client ID, client secret, production URL, and a long random token-encryption secret to Vercel for Preview and Production.
7. Redeploy.
8. Open Aridon's Email Command Center and click **Connect Gmail**.

Aridon requests Gmail send-only access plus the connected account's email address. Phase 1 does not read, search, archive, or delete inbox messages.

## Email approval workflow

1. Choose a CRM contact, executive author, project, desired next step, and follow-up interval.
2. Generate a draft.
3. Edit the subject and body.
4. Click **Approve & Send**.
5. Confirm the final browser approval dialog.
6. After Gmail sends the message, Aridon appends a CRM note and creates the next follow-up task.

Drafts and their send status are retained in that browser's local storage. Nothing sends automatically in Phase 1.

## Deploy safely

1. Add all environment variables to the Vercel project.
2. Redeploy after adding or changing environment variables.
3. Confirm the browser requests the Aridon username and password.
4. Test chat, CRM, projects, tasks, Knowledge Vault, Gmail connection, draft generation, and one approved email to a safe test address.
5. Merge only after the preview passes.

## Security behavior

- Middleware protects the command center and API routes with HTTP Basic Authentication.
- Production fails closed when the login variables are absent.
- API responses are marked `no-store`.
- CRUD routes accept only approved fields and enforce length limits.
- The chat and email-draft routes limit request sizes and hide internal errors.
- Gmail refresh tokens are encrypted with AES-256-GCM before being stored in an HTTP-only secure cookie.
- Gmail sending requires an explicit `approved: true` server request plus a final user confirmation in the browser.
- The Gmail OAuth scope is send-only; inbox reading is not enabled in Phase 1.
