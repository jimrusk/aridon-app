# Aridon Surplus & Waste Prevention Engine

## Purpose
Add an upstream food-loss prevention capability to Aridon Farm OS and Eva. The system should protect producer economics first by detecting likely surplus, lost buyers, harvest-cost problems, storage constraints, and processing bottlenecks early enough to redirect product before it becomes waste.

## Operating flow
Expected harvest -> contracted Buyer Match demand -> harvest economics -> surplus forecast -> alternate buyer search -> processor/freezer/storage -> institutional/community buyer -> recovery/donation -> safe lawful animal-feed stream -> fertilizer/nutrient recovery or other lawful secondary use -> compost/energy recovery for residual material.

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
9. required permissions/food-safety/feed-safety constraints
10. human approval for consequential transactions or commitments

## Buyer Match integration
Add surplus/short-window inventory as a Buyer Match state. Allow:
- alternate commercial buyers
- processors
- schools/institutions
- restaurants/foodservice
- aggregators/distributors
- community/recovery organizations
- participating livestock/poultry producers for legally suitable feed streams
to publish or match against demand, specifications, quantity, geography, delivery window and price.

Do not expose producer data publicly without authorization.

## Circular Feed & Nutrient Recovery
Add a Circular Feed pathway inspired by emerging food-system models that redirect food no longer suitable for human consumption into animal feed where lawful, nutritionally appropriate and safe.

Eva should evaluate each potential feed stream for:
- legal/regulatory eligibility
- food/feed safety and contamination risk
- species suitability and nutritional value
- required processing, drying, separation or storage
- transport distance and cost
- conventional feed replacement value
- participating producer demand
- traceability and chain of custody
- net producer savings/value

Priority hierarchy:
Human food market -> alternate human-food buyer -> processing/storage -> food recovery/donation -> safe lawful animal feed -> fertilizer/nutrient recovery -> compost/energy recovery -> disposal.

Never route material into animal feed merely because it is surplus. Safety, law, nutrition and economics are gates.

For livestock/poultry operations, allow Farm OS to compare circular-feed economics with conventional feed and track effects on feed cost, performance and producer margin.

Where appropriate and lawful, manure/litter or other nutrient-rich residuals can enter a fertilizer/soil-input pathway. Eva should evaluate nutrient value, treatment/handling requirements, transport, agronomic need, environmental constraints and economics before recommending reuse.

## Farm Passport integration
When product or feed material is redirected, retain appropriate provenance, production, handling, processing, storage and chain-of-custody evidence so recipients and alternate buyers can evaluate the lot without unsupported claims.

## STC Regional Food Recovery & Market Flexibility Hub
Design the planned STC processing/freezer/storage infrastructure to support:
- temporary surplus receiving
- cold/frozen preservation
- aggregation of smaller producer lots
- processing/value-add where appropriate
- alternate buyer fulfillment
- institutional/community distribution
- safe feed-stream sorting/processing/storage where justified
- nutrient/fertilizer recovery where justified
- residual organic-material recovery

Size infrastructure against actual regional feedstocks, buyer demand and end markets. Do not build circular infrastructure solely because a material is theoretically recyclable/compostable.

## STC Circular Feed Pilot
Create a measurable pilot before scaling infrastructure:
1. identify regional surplus/byproduct streams
2. determine which are legally and safely usable as animal feed
3. recruit participating livestock/poultry producers
4. establish baseline conventional feed costs
5. process/store/transport eligible material
6. measure replacement value, animal-production outcomes and producer economics
7. route eligible nutrient residuals into soil/fertilizer use where appropriate
8. publish evidence for scale/no-scale decision

Track tons diverted, feed cost saved, producer margin gained, processing cost, transport cost, energy used, fertilizer/nutrient value recovered and residual waste.

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
- feed material safely redirected
- conventional feed displaced where measured
- feed-cost savings
- nutrient/fertilizer value recovered
- processing/storage utilization
- transport cost
- donation/recovery volume
- residual waste
- intervention cost
- net producer benefit
- time from alert to resolution

## Climate Week implementation basis
This module incorporates the Aridon implementation lessons from Food Tank Climate Week NYC 2026 food-waste programming and follow-on food-system coverage: address losses upstream, recognize when harvest economics do not pencil out, match surplus to actual recipient/buyer needs, evaluate safe circular feed pathways, build adequate processing/recovery infrastructure, train operators, and scale approaches that demonstrate results.

Keep verified source statements separate from Aridon analysis and never imply Food Tank, speakers, farms or companies endorse Aridon unless formally confirmed.
