# Aridon Executive Operations Layer

## Goal

Give Aridon's executive team permissioned access to the systems where work already happens, so the team can observe, summarize, draft, coordinate and execute without turning the product into an unrestricted surveillance layer.

## Control model

Every connector action belongs to one of four classes:

1. **Observe**: read/search data the owner explicitly connected.
2. **Prepare**: summarize, classify, draft, recommend or create an internal work product.
3. **Act with approval**: send externally, create commitments, spend, sign, publish or permanently change records only after an explicit approval gate.
4. **Blocked by default**: permanent deletion, unrestricted financial movement, credential disclosure and other irreversible/high-consequence actions.

The owner should always be able to disconnect a provider, narrow permissions, inspect recent activity and override an executive recommendation.

## Phase 1: Google Workspace

### Gmail

- Search inbox and connected mail
- Open full message content
- Route a message to any Aridon executive
- Draft a response in that executive's specialty
- Owner reviews and edits the draft
- Owner approves the external send
- Future: thread summaries, priority classification, attachment handling, CRM matching, reply-needed detection and follow-up reminders

### Google Calendar

- Read upcoming commitments
- Include meetings in CEO Brief and executive prioritization
- Draft/create an event after owner approval
- Future: availability, event updates, attendee resolution, meeting-prep packets and post-meeting actions

## Phase 2: Google work context

### Contacts

- Resolve names, organizations, emails and phone numbers
- Reduce wrong-recipient risk before email or calendar writes

### Drive / Docs / Sheets / Slides

- Search authorized company material
- Ground executive answers in source documents
- Prepare drafts and analysis
- Keep external sharing and destructive changes behind approval gates

### Meet / meeting notes

- Ingest authorized transcripts and recordings
- Extract decisions, commitments, owners and dates
- Draft follow-up emails and tasks
- Add approved durable facts to Company Brain

## Phase 3: Communication and customer systems

- Slack and Microsoft Teams
- Microsoft 365 / Outlook for non-Google customers
- CRM systems
- Phone and SMS
- Customer-support systems

## Phase 4: Operating and financial systems

- Accounting and bookkeeping
- Banking/finance visibility where supported
- Inventory and purchasing
- Project-management systems
- E-signature with strict approval gates

## Executive routing

Incoming work should be routed by subject rather than forcing the owner to pick a tool:

- Heather: operations and execution
- Nova: finance and cash-flow questions
- Scout: strategy and partnerships
- Atlas: technology and engineering
- Oracle: marketing and communications
- Ethos: contracts, compliance and risk
- Ledger: revenue and sales
- Sierra Bennett: agriculture
- Maya Torres: water and energy
- Claire Morgan: research and diligence
- Eva: triage, synthesis, coordination and cross-functional work

Eva should act as the default dispatcher when an item spans more than one executive.

## Automation pattern

A useful automation is not "AI watches everything." It is a permissioned event loop:

**Connected event -> classify -> relevant executive(s) -> internal recommendation/draft -> approval gate if needed -> action -> audit record -> Company Brain/task/CRM update**

Examples:

- Important customer email -> Ledger + Heather -> reply draft -> owner approval -> send -> CRM update -> follow-up task
- Contract email -> Ethos -> risk notes + proposed response -> owner approval -> send
- Tomorrow's meeting -> Eva + relevant executives -> meeting brief -> owner reviews -> meeting -> transcript -> decisions/tasks/follow-up
- Funding notice -> Claire + Nova + Maya/Sierra as appropriate -> eligibility summary -> application checklist -> owner decides whether to pursue

## Required platform capabilities

- Per-provider OAuth and revocation
- Minimum necessary scopes
- Per-action approval policy
- Executive identity/routing
- Audit log for reads, drafts and writes
- Rate limits and duplicate-send protection
- Tenant isolation for customer workspaces
- Sensitive-data redaction controls
- Human-readable permission screen
- Emergency disconnect / kill switch

## Current implementation

The first implementation lives at `/executive-ops` and uses the existing encrypted Google OAuth token path. It supports Gmail read, executive reply drafting, owner-approved Gmail sending, Calendar read and owner-approved Calendar event creation.
