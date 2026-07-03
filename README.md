# Aridon v0.2

Aridon is an AI Executive Operating System starter app built for Vercel.

## What is included

- Dashboard
- Heather Chat
- Executive Team: Heather, Ethos, Atlas, Eva, Scout, Ledger, Oracle
- Builder Mode
- CRM shell
- Projects shell
- Tasks shell
- Knowledge Vault shell
- OpenAI API route
- Vercel-ready Next.js app

## How to run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## How to deploy on Vercel

1. Upload this project to GitHub.
2. Import the GitHub repo into Vercel.
3. Add this environment variable in Vercel Project Settings:

```bash
OPENAI_API_KEY=your_openai_key_here
```

4. Redeploy.

## Important

Never share your OpenAI key or account passwords in chat. Paste keys only into your own Vercel dashboard.

## Next build

Aridon v0.3 should add Supabase database tables:
- companies
- users
- leads
- projects
- tasks
- documents
- conversations
- executive_actions

Then Heather can safely create and update records.
