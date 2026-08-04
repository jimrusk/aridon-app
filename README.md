# Aridon v0.3

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
- OpenAI API route
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
OPENAI_API_KEY=your-openai-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` must remain server-only. Do not prefix it with `NEXT_PUBLIC_`.

## Deploy safely

1. Add all environment variables to the Vercel project.
2. Redeploy after adding or changing environment variables so the new values are available to the build.
3. Deploy a preview from the security branch.
4. Confirm the browser requests the Aridon username and password.
5. Test chat, CRM, projects, tasks, and Knowledge Vault.
6. Merge only after the preview passes.

## Security behavior

- Middleware protects the entire command center and API routes with HTTP Basic Authentication.
- Production fails closed when the login variables are absent.
- API responses are marked `no-store`.
- CRUD routes accept only approved fields and enforce length limits.
- The chat route limits request size, validates roles and executives, and hides internal errors from users.
