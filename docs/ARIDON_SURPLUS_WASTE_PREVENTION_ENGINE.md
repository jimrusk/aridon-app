# Aridon Surplus & Waste Prevention Engine

## Purpose
Add an upstream food-loss prevention capability to Aridon Farm OS and Eva. The system should protect producer economics first by detecting likely surplus, lost buyers, harvest-cost problems, storage constraints, and processing bottlenecks early enough to redirect product before it becomes waste.

## Operating flow
Expected harvest -> contracted Buyer Match demand -> harvest economics -> surplus forecast -> alternate buyer search -> processor/freezer/storage -> institutional/community buyer -> recovery/donation -> animal feed or other lawful secondary use -> compost/energy recovery for residual material.

## Eva behavior
Eva should continuously compare, when data is available:
- expected harvest / livestock product availability
- contracted and forecast buyer demand
- expected price and producer margin
- harvest/handling/transport costs
- storage and shelf-life window
- processor/freezer/cold-storage capacity
- institutional, restaurant, foodservice and community demand
- logistics constraints
- lawful secondary-use/recovery options

When risk is detected, Eva creates a Surplus Intervention with:
1. quantity and product at risk
2. time remaining before quality/value loss
3. expected producer financial exposure
4. primary cause
5. ranked intervention options by expected producer value and feasibility
6. buyer/processor/storage/logistics candidates
7. estimated cost and net recovery value
8. funding/support opportunity where applicable
9. required permissions/food-safety constraints
10. human approval for consequential transactions or commitments

## Buyer Match integration
Add surplus/short-window inventory as a Buyer Match state. Allow:
- alternate commercial buyers
- processors
- schools/institutions
- restaurants/foodservice
- aggregators/distributors
- community/recovery organizations
to publish or match against demand, specifications, quantity, geography, delivery window and price.

Do not expose producer data publicly without authorization.

## Farm Passport integration
When product is redirected, retain appropriate provenance, production, handling, processing, storage and chain-of-custody evidence so alternate buyers can evaluate the lot without unsupported claims.

## STC Regional Food Recovery & Market Flexibility Hub
Design the planned STC processing/freezer/storage infrastructure to support:
- temporary surplus receiving
- cold/frozen preservation
- aggregation of smaller producer lots
- processing/value-add where appropriate
- alternate buyer fulfillment
- institutional/community distribution
- residual organic-material recovery

Size infrastructure against actual regional feedstocks, buyer demand and end markets. Do not build circular infrastructure solely because a material is theoretically recyclable/compostable.

## Producer-profitability rule
Waste prevention recommendations must lead with:
- dollars/value preserved
- cost to intervene
- expected net recovery
- time to act
- market/buyer probability
- producer cash-flow effect
Environmental outcomes should be measured alongside economics, not substituted for them.

## Measurement
Track:
- pounds/tons and dollar value at risk
- product redirected before loss
- producer revenue preserved/recovered
- alternate buyers created
- processing/storage utilization
- transport cost
- donation/recovery volume
- residual waste
- intervention cost
- net producer benefit
- time from alert to resolution

## Climate Week implementation basis
This module incorporates the Aridon implementation lessons from Food Tank Climate Week NYC 2026 food-waste programming: address losses upstream, recognize when harvest economics do not pencil out, match surplus to actual recipient/buyer needs, build adequate processing/recovery infrastructure, train operators, and scale approaches that demonstrate results.

Keep verified source statements separate from Aridon analysis and never imply Food Tank or speakers endorse Aridon unless formally confirmed.
