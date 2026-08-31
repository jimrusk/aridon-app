# Aridon Visual QA with OpenAI Appshots

OpenAI Appshots is part of the Aridon developer and QA workflow. It is not a customer-facing dependency and must never be required for customers to use Aridon.

## Purpose

Use Appshots to give Codex direct visual context for Aridon UI problems, including layout defects, mobile breakage, incorrect states, authentication screens, dashboards, forms, and preview regressions.

## Standard workflow

1. Reproduce the problem in the relevant Aridon window or preview deployment.
2. Capture the affected application window with Appshots and attach it to the Codex task.
3. State the route, expected behavior, actual behavior, device/window size, and reproduction steps.
4. Have Codex inspect the repository and implement the smallest safe fix on a feature branch.
5. Run the repository build verification and any route-specific checks.
6. Deploy or open the Vercel preview for the branch.
7. Re-open the same route and capture a second Appshot to verify the fix visually.
8. Do not merge until the build passes and the visual result matches the intended behavior.

## Bug report minimums

Every visual bug should include:

- Route or screen
- Environment: local, preview, or production
- Device and viewport when relevant
- Expected behavior
- Actual behavior
- Reproduction steps
- Appshot or screenshot showing the problem
- Post-fix Appshot or screenshot for visual verification

## Security and privacy

- Never capture secrets, API keys, passwords, access tokens, private bank information, or other unnecessary sensitive data.
- Use test or redacted tenant data when a visual issue can be reproduced without real customer data.
- Preserve Aridon's operator/customer separation. A UI fix must not weaken authentication, tenant isolation, RLS, or server-only secret handling.
- Appshots are supporting QA evidence. Aridon must continue to function when Appshots or Codex are unavailable.

## Priority use cases

Use the workflow first for:

- Mobile buttons or navigation covering content
- Broken or clipped layouts
- Customer login, activation, and authorization failures
- Operator command-center rendering problems
- Ag dashboards and field/farm views
- Forms, modals, tables, and responsive behavior
- Preview-versus-production visual differences
- Any fix where the code can build successfully but the screen can still be wrong

## Definition of done for visual changes

A visual change is done when:

1. The code builds successfully.
2. The affected route works at the intended viewport.
3. Authentication and tenant boundaries are unchanged or strengthened.
4. A post-fix visual check confirms the intended result.
5. No new obvious regression appears in adjacent navigation or layout.
