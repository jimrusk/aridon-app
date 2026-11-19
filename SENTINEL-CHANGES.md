# Sentinel SEO Fix Pack — Change Manifest

**Worktree:** `~/workspace/aridon-app-sentinel/` (git worktree of `~/workspace/aridon-app`, detached HEAD)
**Base:** `origin/main` @ `229f909927e71df48bad3356a104143c3576312f` ("Give Eva and all executives web-first completion behavior"), fetched fresh 2026-11-06.
**Source of copy:** `~/workspace/your_files/sentinel-sale/sentinel-seo-geo-audit-2026-11-06.md` (Nov 6 updated framing; no "no customers/no revenue" language, no em dashes).
**Status:** Implemented and build-proven locally. NOT deployed. NOT pushed. `~/workspace/aridon-app` untouched.

## Build proof

- `npm install` (425 packages, ~28s), then `npm run build` — **exit code 0**, full route table emitted (~2.5 min).
- Route evidence: `/sentinel` 8.5 kB static, `/sentinel-demo` 5.77 kB static, `/sentinel-security` 179 B (redirect page), `/sitemap.xml` dynamic route present.
- Prerendered-HTML verification (`.next/server/app/sentinel-demo.html`): "What is Sentinel?", "Pre-execution authorization, defined", "18 of 18 scenarios", FAQ heading, DOI link, GitHub links, `application/ld+json`, OG tags, and canonical all present in raw HTML. `sentinel.html` (hub) likewise contains the definition, results, and downloads section.
- `package-lock.json` churn from `npm install` was reverted: the change set is Sentinel-only, and no fix here adds a dependency.

## Files changed (6 modified, 2 created)

| File | Change |
|---|---|
| `app/sitemap.ts` (modified, +3) | **Fix 1.** Added `/sentinel-demo` (weekly, priority 1), `/sentinel-pilot` (monthly, 0.9), `/sentinel` (monthly, 0.8) to the core sitemap array, exactly as the audit specified. `/sentinel-security` deliberately left out. |
| `app/sentinel-demo/page.tsx` (modified) | **Fix 2 + JSON-LD.** Metadata replaced with the audit's complete version: new title, full description, canonical `/sentinel-demo`, Open Graph. Also renders the audit appendix's JSON-LD (SoftwareApplication + FAQPage) as a server-side `<script type="application/ld+json">` so it is in the raw HTML. |
| `app/layout.tsx` (modified, +1) | **Fix 2 (sitewide).** Added `metadataBase: new URL('https://aridon-v02.vercel.app')` to the root metadata so all canonical/OG URLs resolve absolute. |
| `app/sentinel-demo/SentinelDemoClient.tsx` (modified) | **Fix 3.** Inserted the audit's server-rendered answer block directly under the hero: "What is Sentinel?" definition, "Pre-execution authorization, defined", internal results (labeled internal/synthetic: 18/18, 13 hostile held, 0 false positives), the 4-question FAQ, and the "Read the research, get the code" links (Zenodo DOI + both GitHub repos). Static markup, present in prerendered HTML (verified). Also ported the Nov 5 hero tagline: "The action-control platform for AI agents." |
| `public/llms.txt` (created) | **Fix 4.** Fresh corrected file (origin/main had none): site structure kept from the prior draft, Sentinel bullet replaced verbatim with the audit's action-control copy, Key pages now link the hub, demo, pilot, paper DOI, and both repos. No "kill switch" headline framing. |
| `public/llms-full.txt` (created) | **Fix 4.** Fresh corrected file: Sentinel section rewritten action-control / pre-execution authorization first; kill switch and signed heartbeat demoted to "supporting mechanisms"; honest-stage line in the new framing with the internal harness numbers labeled internal; demo/paper/repo links added to Key pages; the retired `/sentinel-security` key-page entry removed (it now redirects). |
| `app/sentinel/page.tsx` (modified, rewritten) | **Fix 5.** `/sentinel` is now the product hub: new metadata (title "Sentinel: Action-Control Platform for AI Agents \| Aridon", canonical, OG), hero with the audit definition, "pre-execution authorization, defined" section, allow/hold/deny/audit cards, internal-results card (labeled internal), and link cards for demo, pilot, paper, and both repos. The device downloads did not disappear: `SentinelDownloadClient` is embedded unchanged at the bottom under a clearly separate "Sentinel for your devices" section. |
| `app/sentinel-security/page.tsx` (modified, rewritten) | **Fix 5.** The retired breach-detection page is replaced with `permanentRedirect('/sentinel')` (308). The indexed URL now resolves to the hub instead of the retired framing. |

## Deviations and judgment calls

1. **Twitter card added** to the demo metadata (mirrors the OG title/description). The audit's Fix 2 prose says the complete version "adds canonical, OG, Twitter" but its code block omitted the `twitter` key; I completed the stated intent.
2. **JSON-LD FAQ includes the 4th question** ("Does Sentinel work with MCP and agent frameworks?"). The audit appendix JSON listed only 3 of the 4 visible FAQ questions; FAQPage schema must match visible content, so the JSON-LD now matches the page's FAQ exactly.
3. **/sentinel-security: chose redirect over rewrite** (the audit allowed either). The `palo-alto` subroute (`/sentinel-security/palo-alto`) is untouched and still live.
4. **llms files are new, not edited.** origin/main contains no `public/llms.txt` at all; the stale Oct 11 versions exist only as untracked files in Jim's local tree. The corrected files were written fresh from the audit copy, preserving the non-Sentinel structure of the prior drafts. Nothing of the stale "kill switch" headline copy was carried over.
5. **Pre-existing copy left alone:** the demo client's "Technical preview" card in origin/main still contains a "no customers" phrase. That is pre-existing production copy on origin/main, not part of this fix pack; the new blocks I added follow the Nov 6 framing. Flagging it here so it can be cleaned up in a separate pass if Jim wants.
6. **Not in this change set** (audit "also prepared" items outside the five fixes): `/sentinel-pilot` metadata (page is still `'use client'` with no metadata export) and the homepage Sentinel H2 block. Both remain copy-only in the audit doc.

## Deploy notes (for whoever deploys later)

- Deploy this worktree's tree (or cherry-pick these 8 files onto a fresh origin/main checkout). Do not deploy `~/workspace/aridon-app` as-is (diverged, unrelated uncommitted work).
- Vercel auth is still the blocker identified in the feasibility report; nothing here changes that.
- After deploy, verify live: `/sitemap.xml` lists the 3 Sentinel URLs, `/llms.txt` and `/llms-full.txt` return 200 with the new copy, `/sentinel-demo` raw HTML contains the answer block, `/sentinel-security` 308s to `/sentinel`.

## Post-build fix (Nov 6, by Boone)
- app/sentinel-demo/SentinelDemoClient.tsx: the pre-existing "Technical preview" card's
  "no customers" phrase removed per Jim's Nov 6 copy rule; pen-test/SOC 2 disclosures kept.
  Text now reads: working code running synthetic scenarios, validated on our internal test
  harness; no independent penetration test, no SOC 2 or other certifications yet; demo shows
  the mechanism, not a security guarantee; now opening design-partner pilot conversations.
  Text-only change after the passing build.
