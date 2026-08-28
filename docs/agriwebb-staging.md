# AgriWebb staging integration

Aridon Ag now includes a read-only AgriWebb OAuth 2.0 staging flow.

## Staging endpoints

- Auth: `https://auth.staging.agriwebb.com`
- API: `https://api.staging.agriwebb.com/v2`
- Install route: `/integrations/agriwebb/install`
- OAuth callback: `/api/integrations/agriwebb/oauth/callback`

## Required server environment variables

```bash
AGRIWEBB_CLIENT_ID=<staging client id>
AGRIWEBB_CLIENT_SECRET=<staging client secret>
AGRIWEBB_REDIRECT_URI=http://localhost:3000/api/integrations/agriwebb/oauth/callback
```

Do not expose `AGRIWEBB_CLIENT_SECRET` through any `NEXT_PUBLIC_` variable or commit it to Git.

## Scope policy

The staged integration requests read-only scopes only: farms, records, fields, pasture growth, rainfall, level readings, management groups, enterprise, animals, animal/paddock/inventory reports. No AgriWebb write scopes are requested.

## OAuth behavior

The install route passes the optional AgriWebb `organization` identifier through to the staging authorization server, creates a state nonce, and redirects to AgriWebb. The callback verifies state, exchanges the code using HTTP Basic client authentication, reports integration status back to the AgriWebb staging marketplace, and stores the resulting staging token bundle in an encrypted HttpOnly cookie using a key derived from the staging client secret.

This is intentionally a staging-only implementation. Production credentials and endpoints must be introduced only after AgriWebb completes staging approval and issues production credentials.
