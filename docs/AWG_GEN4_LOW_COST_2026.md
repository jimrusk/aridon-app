# AWG Gen 4 Low-Cost Redesign — September 2026

## Executive decision

Redesign the AWG program around **cost per reliable gallon**, not nameplate output. The economic target is **< $0.60 per gallon all-in**, with an internal design target of **$0.45/gal or lower** so the system retains margin for financing, downtime and site variability.

This plan assumes the requested target is **$0.60/gal**, not 0.60 cents/gal ($0.006/gal).

The prior concept of a **single 40-ft container producing 30,000 gal/day** is retired as the baseline for arid Southwest deployment. A 30,000-gpd system becomes a modular industrial plant assembled from transportable capture, regeneration, heat-pump, water-treatment and control skids. The smaller AWG-1000 class remains containerized.

## Why the architecture changes

30,000 gal/day = 113,562 L/day = about **1.31 kg/s of product water**.

Approximate psychrometric screening:

- At 30 C / 50% RH, cooling to about 5 C saturation removes about 7.9 g water/kg dry air. Producing 30,000 gpd requires roughly **167 kg/s dry air** before real-world losses.
- At 30 C / 20% RH, cooling to about 0 C removes only about 1.5 g/kg dry air, requiring roughly **893 kg/s dry air** before losses.

Conclusion: direct refrigeration is acceptable only in favorable dew-point windows. Low-humidity operation needs sorption/desiccant capture and low-cost heat regeneration rather than brute-force compressor operation.

## Gen 4 system architecture

### Mode A — Direct condensation

Use when dew point and power price make direct refrigeration economical.

Hardware:
- large-face, low-pressure-drop intake filtration;
- variable-speed EC fans;
- high-efficiency variable-speed vapor-compression refrigeration;
- large-area hydrophilic evaporator coils;
- sensible heat recovery from cold, dry exhaust to pre-cool incoming air;
- condensate recovery, polishing and storage;
- no operation below a site-specific economic dew-point threshold unless emergency mode is enabled.

Target: favorable-weather electrical SEC **0.20–0.35 kWh/L** as an R&D goal, subject to field validation.

### Mode B — Desiccant capture

Use when ambient humidity is too low for economical direct condensation.

Preferred R&D path:
- low-pressure liquid-desiccant or durable solid-desiccant contactor;
- staged contactor geometry with very low air-side static pressure;
- closed desiccant loop with demister and carryover monitoring;
- solution cooling by night radiative cooling, dry cooler and recovered chilled energy;
- duplicate capture beds/loops so one side can adsorb while the other regenerates.

Liquid-desiccant candidates should be screened for cost, corrosion, crystallization, water-quality risk and cycle life. No chemistry is approved for potable deployment until contamination barriers and independent water testing are validated.

### Mode C — Regeneration with recovered or free heat

Primary rule: **do not buy electricity to make regeneration heat if recoverable heat is available.**

Heat hierarchy:
1. heat-pump condenser waste heat;
2. data-center / industrial low-grade waste heat;
3. solar thermal;
4. engine or generator jacket/exhaust heat where appropriate;
5. low-cost thermal storage;
6. purchased electric heat only as a last resort or emergency mode.

The heat pump is configured so the cold side condenses product water while the hot side regenerates the desiccant. This uses both sides of the refrigeration cycle instead of rejecting condenser heat to atmosphere.

### Mode D — Pause and store

The cheapest gallon can be the gallon made six hours earlier.

Aridon controls should stop production when predicted marginal cost exceeds the operating threshold and storage is adequate. The system should make more water during favorable night / early-morning humidity windows and coast through poor daytime conditions.

## Thermal and airflow changes

1. **Cold-exhaust sensible recovery**
   - transfer sensible cooling from dry exhaust to inlet air using a plate exchanger or run-around coil;
   - avoid enthalpy wheels that transfer captured moisture back to the inlet/exhaust stream.

2. **Condenser-heat regeneration**
   - route compressor rejection heat to desiccant regeneration before any heat is dumped outside.

3. **Low pressure drop**
   - oversize filter, contactor and coil frontal area;
   - use low face velocities and short air paths;
   - target air-system static pressure in the low hundreds of pascals rather than high-pressure compact ducts.

4. **Variable-speed everything**
   - compressors, fans, pumps and solution circulation respond to dew point, tank level, thermal availability and power price.

5. **Radiative cooling assist**
   - use night-sky radiative panels or radiative surfaces to cool desiccant / thermal storage without compressor power where site conditions support it.

6. **Thermal storage**
   - hot storage captures solar / waste heat for regeneration;
   - chilled or cool storage shifts condenser load into lower-cost operating windows where useful.

## Aridon cost optimizer

Every five minutes the controller computes:

**Marginal $/gal = electricity + purchased thermal energy + variable consumables + incremental maintenance ÷ expected gallons in the current operating window.**

Inputs:
- temperature;
- RH and dew point;
- forecast dew point for next 24 h;
- electricity tariff / demand state;
- available solar and waste heat;
- desiccant state of charge;
- tank level;
- compressor COP estimate;
- filter differential pressure;
- water-demand priority.

Operating rules:
- **Green:** predicted variable cost <= $0.20/gal → run hard if storage is available.
- **Yellow:** $0.20–$0.35/gal → run only if storage or demand requires it.
- **Red:** > $0.35/gal → pause unless emergency-water priority overrides economics.

The all-in target remains <= $0.60/gal after annualized capital and fixed O&M.

## Cost target stack

Internal design budget per gallon:

| Cost bucket | Target |
|---|---:|
| Electricity + purchased thermal energy | <= $0.15 |
| Annualized equipment + installation | <= $0.15 |
| Maintenance + consumables | <= $0.08 |
| Treatment + testing | <= $0.03 |
| Labor / telemetry / service | <= $0.05 |
| Insurance / reserve / downtime allowance | <= $0.04 |
| **Total internal target** | **<= $0.50/gal** |

Commercial go/no-go ceiling: **$0.60/gal modeled and then field-verified at the target site.**

## Energy targets

Use a band rather than one universal kWh/L claim.

| Operating condition | R&D electrical target | Strategy |
|---|---:|---|
| Favorable dew point | 0.20–0.35 kWh/L | Direct condensation + heat recovery |
| Intermediate | 0.35–0.60 kWh/L | Hybrid condensation / desiccant |
| Dry Southwest | <= 0.60 kWh/L electrical plus recovered/free thermal input | Desiccant capture + heat-pump/waste-heat regeneration |
| Emergency mode | allowed above target | Water-security override, logged separately |

Do not present these as achieved specifications until field testing validates them.

At New Mexico's June-2026 YTD industrial electricity average of about **5.41 cents/kWh**, electrical energy cost is approximately:

- 0.20 kWh/L → 0.76 kWh/gal → about $0.041/gal;
- 0.50 kWh/L → 1.89 kWh/gal → about $0.102/gal;
- 0.80 kWh/L → 3.03 kWh/gal → about $0.164/gal;
- 1.00 kWh/L → 3.79 kWh/gal → about $0.205/gal.

This shows why Southwest electricity price alone is not the whole problem. The real danger is running direct condensation in low-dew-point conditions where SEC can rise several-fold.

## Product family

### AWG-1000 Gen 4 Southwest

Purpose: field-test platform and distributed deployment.

- remains containerized;
- nominal target around 1,000 L/day only under stated reference conditions;
- all performance reported as a weather-band curve, not one nameplate number;
- direct-condensation + desiccant-assist + heat-recovery test platform;
- designed to validate cost/gal, SEC, water quality, cycle life and maintenance.

### AWG-30K Gen 4 Plant

Purpose: 30,000 gal/day commercial-scale installation.

Architecture:
- outdoor or containerized low-pressure capture banks;
- separate heat-pump / regeneration skids;
- separate treatment / controls skid;
- thermal storage;
- product-water storage sized to allow economic pause windows;
- optional solar-thermal / PV / battery / waste-heat integration.

The 30K plant is transportable in modules but is not treated as one 40-ft self-contained box.

### AWG Farm / 1-MGD system

Build from repeatable 30K trains with shared:
- thermal loop;
- water treatment;
- controls;
- storage;
- power infrastructure;
- maintenance shop;
- weather and economic dispatch layer.

A 1-MGD site should be designed as a utility-scale plant, not hundreds of independent household-style AWGs.

## First prototype changes

1. Add a sensible exhaust-to-inlet heat-recovery exchanger.
2. Convert refrigeration to variable-speed compressor/fan/pump control.
3. Capture condenser heat for desiccant regeneration.
4. Add one desiccant capture module with bypass so direct and hybrid cycles can be A/B tested.
5. Add night-radiative or dry-cooler solution cooling test loop.
6. Add hot and cool thermal-storage tanks sized for cycle experiments.
7. Add instrumentation for inlet/outlet T/RH/dew point, air flow, pressure drop, compressor power, fan power, pump power, thermal input, liters produced and water chemistry.
8. Make controls dispatch by **predicted $/gal**, not simply tank level or humidity.

## Test matrix

Test at minimum across these weather bands:

- 15–25% RH;
- 25–40% RH;
- 40–60% RH;
- >60% RH;
- cool-night / hot-day transition;
- low electricity price vs peak price;
- waste heat available vs unavailable.

For each band record:
- L/day and gal/day;
- electrical kWh/L;
- thermal kWh/L and source;
- total $/gal;
- compressor COP;
- air-side pressure drop;
- product-water quality;
- desiccant carryover;
- maintenance interval;
- downtime.

## Kill criteria

A design branch is stopped or redesigned if any of the following remain true after optimization:

- modeled all-in cost exceeds $0.60/gal at the intended site;
- electrical SEC is > 1.0 kWh/L for routine operation without a high-value/emergency use case;
- desiccant contamination cannot be robustly isolated from product water;
- maintenance or corrosion causes unacceptable lifecycle cost;
- 30K output requires impractical air-side pressure drop or footprint for the site;
- nameplate output cannot be reproduced under the stated reference weather band.

## R&D benchmarks supporting this direction

- 2026 review of 187 AWH studies reports severe arid-climate penalties for direct condensation, with arid cases reaching roughly 3.64 kWh/L, and reports adaptive controls reducing energy use by 44% in cited work.
  - https://www.sciencedirect.com/science/article/pii/S2949821X26002218
- 2026 review reports hybrid passive-cooling / sorption systems down to about 0.2 kWh/L in reported studies, while emphasizing scale-up and arid-climate validation needs.
  - https://www.sciencedirect.com/science/article/pii/S2590174526004113
- 2026 heat-pump / liquid-desiccant study uses heat and mass recovery and reports substantial modeled power reductions from thermodynamic balancing.
  - https://www.sciencedirect.com/science/article/pii/S2451904925012569
- 2026 radiative-cooling / liquid-desiccant study reports annual water-yield improvement of roughly 79–166% without active cooling for the radiative module.
  - https://www.sciencedirect.com/science/article/abs/pii/S0360544226008339
- 2025 PV-supported hybrid study reports two-stage desiccant + heat exchanger + waste-heat configuration reducing electricity demand by up to 67% in its modeled case.
  - https://www.sciencedirect.com/science/article/pii/S2214157X25007300
- 2026 Nature Reviews Clean Technology review highlights the energy penalty of conventional thermal desorption and the opportunity for low-grade waste heat and non-thermal desorption research.
  - https://www.nature.com/articles/s44359-026-00154-5
- EIA June-2026 YTD New Mexico industrial electricity price: 5.41 cents/kWh.
  - https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_b

## Immediate execution order

1. Freeze new mechanical detailing of the old 30K single-container concept.
2. Build the Gen 4 psychrometric + cost model first.
3. Size air-side capture area and pressure drop for 1,000 L/day and 30,000 gpd reference conditions.
4. Select two desiccant paths for bench comparison: one liquid and one solid/structured option.
5. Design the coupled heat-pump hot-side/cold-side test rig.
6. Run 30-day weather-driven simulation for Farmington/Aztec, Phoenix, Corpus Christi and one humid benchmark.
7. Only after simulation passes the $0.60/gal gate, release the mechanical prototype package.
8. Validate with third-party engineering and independent water-quality testing before commercial claims.
