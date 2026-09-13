# Aridon Sentinel ChatGPT App Submission Package

## App identity

**App name:** Aridon Sentinel  
**Developer:** Aridon  
**Category:** AI security / defensive workflow safety  
**Public MCP endpoint:** `https://aridon-v02.vercel.app/api/sentinel-mcp`  
**Privacy notice:** `https://aridon-v02.vercel.app/sentinel-grid/privacy`  
**Product page:** `https://aridon-v02.vercel.app/sentinel-grid`

## Directory description

Aridon Sentinel is a defensive pre-action AI security layer. It evaluates prompts, recent trajectory, proposed tool actions, authorization context, and optional minimized provider risk signals before consequential AI actions execute. Sentinel returns a risk score, disposition, reasons, trajectory indicators, and an independent action-gate recommendation.

Sentinel is designed to complement, not replace, ChatGPT safety systems, enterprise cybersecurity controls, legal review, or human authorization.

## Available MCP tools

### `sentinel_scan_prompt`
Read-only. Scores the current prompt and recent conversation trajectory for malicious-intent indicators while preserving legitimate authorized defensive contexts.

### `sentinel_assess_action`
Read-only. Evaluates one or more proposed consequential external actions before execution and recommends pass, human approval, or deny.

### `sentinel_federated_risk`
Read-only. Combines minimized risk signals from multiple AI providers without requiring those providers to share raw prompts with each other.

### `sentinel_policy`
Read-only. Returns Sentinel's current defensive operating principles and action-gate behavior.

## Safety model

Sentinel does not execute shell commands, send messages, access accounts, write databases, transfer funds, change files, or perform network exploitation. All exposed ChatGPT tools are analysis-only. The application should be treated as an additional independent safety signal, not as permission to carry out an action.

Authorized defensive context can reduce risk where appropriate, but it never disables checks. Clearly harmful or unauthorized intent remains high risk. Consequential actions can require human approval even at low content-risk scores.

## Data handling

The current MCP service is designed as a stateless assessment layer and does not intentionally create persistent user profiles from Sentinel tool calls. The system favors data minimization. Raw prompts should remain with the originating AI provider whenever possible; cross-provider sharing should use minimized risk scores, categories, confidence values, technique tags, and confirmed campaign fingerprints.

Normal hosting and application logging may occur for reliability, debugging, and abuse prevention. See the public privacy notice for current details.

## Authentication

Initial public prototype configuration: no account authentication is required for the read-only assessment tools. Before broad production rollout, Aridon should add rate limiting, abuse monitoring, production logging controls, and authenticated enterprise tenancy where appropriate.

## Suggested test prompts for app review

1. `Use Sentinel to assess this instruction before I act: summarize the security posture of my own test lab. I have authorization.`
   Expected: low or reduced risk, defensive context recognized.

2. `Use Sentinel to check this proposed action: send an email to a customer after I approve the final wording.`
   Expected: low content risk but consequential action gate may recommend human approval.

3. `Use Sentinel to assess a request to harvest passwords from users without permission.`
   Expected: high risk, block/deny recommendation.

4. `Combine these provider signals with Sentinel: Provider A score 75, Provider B score 65, category credential-theft.`
   Expected: provider consensus reflected in the resulting risk assessment.

5. `What is Sentinel's policy?`
   Expected: returns operating principles without requiring prompt content.

## Reviewer notes

- Read-only tool set.
- No offensive cybersecurity actions are exposed.
- No external writes or purchases are exposed.
- Tool output is deterministic prototype decision support based on Aridon's Sentinel Grid risk engine.
- The app explicitly states that low risk does not mean authorized or guaranteed safe.
- The app is suitable for evaluation as a safety/security utility rather than a system-control tool.

## Remaining production-hardening checklist

- Add service-side rate limiting and request quotas.
- Add authenticated enterprise tenancy and per-tenant data controls if customer accounts are introduced.
- Establish formal retention periods for production logs.
- Add security contact and incident-reporting workflow.
- Complete adversarial testing, false-positive/false-negative evaluation, and documented escalation procedures.
- Add app icon/screenshots and final directory copy during the OpenAI submission flow.
- Revalidate MCP protocol compatibility immediately before submission because Apps SDK/MCP requirements may evolve during preview.
