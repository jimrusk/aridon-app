# Aridon High-Ticket Backend

## Purpose

Turn the public free business scan into a clean B2B offer ladder: diagnose first, sell implementation only when the evidence supports it, then retain successful customers with managed growth.

## Customer funnel

1. Free Aridon Business Scan — `/analyze-business`
2. Aridon Starter Diagnostic — $198 one time
3. Aridon Action Plan — $497 one time
4. Aridon Implementation Sprint — $2,500 one time
5. Aridon Growth Engine — $7,500 one time
6. Aridon Managed Growth — $1,500/month
7. Aridon Enterprise — custom $20K–$50K+ scope

Public package page: `/growth`

Post-purchase upsell page: `/growth/next?from=<offer>`

Sales and delivery playbook: `/sales/high-ticket`

The old `/growth-desk` route redirects to `/growth` so the public site does not present two conflicting offer ladders.

## Live Stripe checkout

| Offer | Stripe price | Payment link |
| --- | --- | --- |
| Starter Diagnostic | existing $198 price | `https://book.stripe.com/cNidR8dQ35qX6ZE7JM4AU0d` |
| Action Plan | `price_1U8tCKD4wDvqb7JrzV5G6LfD` | `https://book.stripe.com/4gM7sKeU73iPdo28NQ4AU0i` |
| Implementation Sprint | `price_1U8tCRD4wDvqb7JrTI1YZ1w8` | `https://book.stripe.com/dRmdR8aDR3iP2Jo0hk4AU0j` |
| Growth Engine | `price_1U8tCVD4wDvqb7Jr6syPT2zA` | `https://book.stripe.com/eVq7sK7rF9Hd0Bg5BE4AU0k` |
| Managed Growth | `price_1U8tCaD4wDvqb7Jrs1Uv4BDA` | `https://buy.stripe.com/fZueVc5jx9Hd83I9RU4AU0l` |

The one-time $497, $2,500, and $7,500 links create a post-purchase invoice. The $1,500 Managed Growth link creates a monthly subscription. Checkout collects the business information needed to begin intake.

## Upsell routing

- Starter Diagnostic -> Action Plan
- Action Plan -> Implementation Sprint
- Implementation Sprint -> Growth Engine
- Growth Engine -> Managed Growth
- Managed Growth -> onboarding state

Every upsell is explicitly optional. A customer receives the service already purchased whether or not they accept the next offer.

## Sales rules

- Sell the correction of a specific business problem, not generic AI access.
- Separate observed facts from assumptions and estimates.
- Do not invent ROI, traffic, revenue, or conversion numbers.
- Present high-ticket implementation only when the problem, value, access, urgency, decision authority, and delivery fit support it.
- Confirm exact scope, customer inputs, exclusions, third-party costs, timeline, and success measures before implementation.
- Keep consequential external changes behind customer or owner authorization.

## Partner network pilot

Starting commercial concept for written partner agreements:

- 20% of the first qualifying implementation project.
- 10% of qualifying Managed Growth recurring revenue for up to 12 months.
- Track referrals with a unique partner code in the CRM/deal record before checkout.
- Do not promise automated affiliate payouts until referral attribution and payout controls are implemented and tested.

## KPIs

Track scan completions, $198 conversions, $497 conversions, strategy calls, show rate, $2,500 close rate, $7,500 close rate, Managed Growth attach rate, average revenue per buyer, gross margin, delivery time, and 90-day retention.
