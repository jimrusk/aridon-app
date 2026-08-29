export type AgOperationSnapshotInput = {
  state: string;
  county: string;
  breedingCows: number;
  acres: number;
  ownedPercent: number;
  annualRevenueRange: string;
  topCosts: string[];
  mainConcern: string;
  contactName: string;
  email: string;
  mobile: string;
  consentEmail: boolean;
  consentSms: boolean;
};

export type AgSnapshotOpportunity = {
  title: string;
  estimateLow: number;
  estimateHigh: number;
  why: string;
  action: string;
};

export type AgOperationSnapshotReport = {
  operationLabel: string;
  annualRevenueMidpoint: number;
  opportunityLow: number;
  opportunityHigh: number;
  opportunities: AgSnapshotOpportunity[];
  priorities: string[];
  fundingPrompt: string;
  disclaimer: string;
};

const revenueMidpoints: Record<string, number> = {
  'under-250k': 175000,
  '250k-500k': 375000,
  '500k-1m': 750000,
  '1m-2m': 1500000,
  '2m-5m': 3500000,
  'over-5m': 6000000,
};

const costLabels: Record<string, string> = {
  feed: 'feed and hay',
  pasture: 'pasture and lease cost',
  labor: 'labor',
  fuel: 'fuel and hauling',
  vet: 'veterinary and herd health',
  equipment: 'equipment and repairs',
  financing: 'financing',
  water: 'water',
  other: 'other operating costs',
};

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function numberInRange(value: unknown, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function normalizeAgSnapshotInput(body: any): AgOperationSnapshotInput {
  const topCosts = Array.isArray(body?.topCosts)
    ? [...new Set(body.topCosts.map((value: unknown) => clean(value, 30)).filter(Boolean))].slice(0, 3)
    : [];

  return {
    state: clean(body?.state, 40),
    county: clean(body?.county, 80),
    breedingCows: Math.round(numberInRange(body?.breedingCows, 0, 100000)),
    acres: Math.round(numberInRange(body?.acres, 0, 10000000)),
    ownedPercent: Math.round(numberInRange(body?.ownedPercent, 0, 100)),
    annualRevenueRange: clean(body?.annualRevenueRange, 30),
    topCosts,
    mainConcern: clean(body?.mainConcern, 50),
    contactName: clean(body?.contactName, 100),
    email: clean(body?.email, 160).toLowerCase(),
    mobile: clean(body?.mobile, 30).replace(/[\s().-]/g, ''),
    consentEmail: body?.consentEmail !== false,
    consentSms: body?.consentSms === true,
  };
}

export function validateAgSnapshotInput(input: AgOperationSnapshotInput) {
  if (!input.state || !input.county) return 'State and county are required.';
  if (input.breedingCows < 1) return 'Enter the number of breeding cows in the operation.';
  if (input.acres < 1) return 'Enter the acres operated.';
  if (!revenueMidpoints[input.annualRevenueRange]) return 'Select an annual cattle revenue range.';
  if (input.topCosts.length < 1) return 'Select at least one major cost.';
  if (!input.mainConcern) return 'Select the main concern for the operation.';
  if (!/^\S+@\S+\.\S+$/.test(input.email)) return 'Enter a valid email address.';
  if (input.mobile && !/^\+[1-9]\d{7,14}$/.test(input.mobile)) return 'Mobile number must include country code, for example +15055551212.';
  if (input.consentSms && !input.mobile) return 'A mobile number is required for text updates.';
  return null;
}

function moneyRange(base: number, lowPct: number, highPct: number, floorLow = 1000, floorHigh = 2500) {
  const low = Math.max(floorLow, Math.round((base * lowPct) / 100) * 100);
  const high = Math.max(floorHigh, Math.round((base * highPct) / 100) * 100);
  return [low, Math.max(low, high)] as const;
}

export function generateAgOperationSnapshot(input: AgOperationSnapshotInput): AgOperationSnapshotReport {
  const revenue = revenueMidpoints[input.annualRevenueRange] || 375000;
  const candidates: Array<AgSnapshotOpportunity & { score: number }> = [];
  const costs = new Set(input.topCosts);
  const concern = input.mainConcern;

  const add = (title: string, lowPct: number, highPct: number, why: string, action: string, score: number) => {
    const [estimateLow, estimateHigh] = moneyRange(revenue, lowPct, highPct);
    candidates.push({ title, estimateLow, estimateHigh, why, action, score });
  };

  if (costs.has('feed') || concern === 'feed' || concern === 'drought') {
    add(
      'Feed and winter-cost exposure',
      2.5,
      6,
      `With ${input.breedingCows.toLocaleString()} breeding cows, feed and hay can move ranch margin quickly. Your answers put this near the top of the review list.`,
      'Compare your next 90–180 days of feed needs against contracted, local and alternative-feed options before the next large purchase.',
      100,
    );
  }

  if (costs.has('water') || concern === 'water' || concern === 'drought') {
    add(
      'Livestock-water and drought resilience',
      1.5,
      4,
      `Water risk can change stocking flexibility, hauling cost and pasture utilization across ${input.acres.toLocaleString()} operated acres.`,
      'Map your highest-risk water points, then screen wells, storage, pipeline, solar pumping and other water projects for grants or cost share.',
      96,
    );
  }

  if (costs.has('pasture') || concern === 'drought') {
    add(
      'Pasture and carrying-cost pressure',
      1.5,
      4.5,
      `Owned-versus-leased ground changes how quickly drought and grazing pressure show up in cash flow. You reported about ${input.ownedPercent}% owned acres.`,
      'Review pasture cost per cow and identify the least productive acres or leases before committing to the next grazing period.',
      91,
    );
  }

  if (costs.has('equipment') || costs.has('fuel')) {
    add(
      'Equipment, fuel and repair leakage',
      1,
      3,
      'Fuel, hauling, downtime and reactive repairs often hide across multiple accounts instead of appearing as one obvious problem.',
      'Pull the last 12 months of fuel and repair invoices by truck, tractor and major asset and rank the worst three by cost per month.',
      84,
    );
  }

  if (costs.has('labor') || concern === 'labor') {
    add(
      'Labor and owner-time drag',
      1,
      2.5,
      'Small ranch teams feel overtime, duplicate paperwork and owner-admin time immediately because there is rarely a dedicated operations manager.',
      'Track one week of owner and employee admin time, then remove or automate the two most repeated tasks.',
      82,
    );
  }

  if (costs.has('financing') || concern === 'debt') {
    add(
      'Financing and cash-flow cost',
      0.75,
      2.5,
      'Interest, timing of cattle sales and operating-line usage can quietly consume margin even when the ranch is profitable on paper.',
      'List every operating note, equipment note and line balance with rate and renewal date, then review the highest-cost debt first.',
      88,
    );
  }

  if (costs.has('vet') || concern === 'herd-health' || concern === 'calf-prices') {
    add(
      'Herd productivity and sale timing',
      2,
      5,
      'A small change in pregnancy rate, weaning rate, cull timing or sale weight can have an outsized effect across the whole cow herd.',
      'Separate cows into keep, watch and cull groups using pregnancy, age, calf performance and feed requirement before the next major cost period.',
      94,
    );
  }

  if (concern === 'paperwork') {
    add(
      'Paperwork and missed-program opportunity',
      0.5,
      2,
      'Receipts, invoices, conservation records and deadlines can hide both wasted owner time and funding opportunities.',
      'Create one digital inbox for invoices, receipts and program records, then have Aridon build the weekly exception list.',
      80,
    );
  }

  if (candidates.length < 3) {
    add(
      'Herd productivity review',
      1.5,
      4,
      'Cow-calf margin is highly sensitive to the number and value of calves sold relative to the cost of maintaining the breeding herd.',
      'Review pregnancy, weaning and cull records against the last production year and flag the bottom-performing group.',
      78,
    );
    add(
      'Purchasing and vendor review',
      1,
      2.5,
      `Your largest reported costs include ${input.topCosts.map((x) => costLabels[x] || x).join(', ')}.`,
      'Pull your 10 largest vendor payments from the last 12 months and identify renewals, duplicates and purchases that can be timed better.',
      72,
    );
  }

  const opportunities = candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ score: _score, ...item }) => item);

  const opportunityLow = opportunities.reduce((sum, item) => sum + item.estimateLow, 0);
  const opportunityHigh = opportunities.reduce((sum, item) => sum + item.estimateHigh, 0);

  return {
    operationLabel: `${input.county} County, ${input.state} cow-calf operation`,
    annualRevenueMidpoint: revenue,
    opportunityLow,
    opportunityHigh,
    opportunities,
    priorities: opportunities.map((item) => item.action),
    fundingPrompt: 'Aridon should screen livestock-water, drought resilience, grazing, energy, equipment and conservation programs against the projects identified above. Program eligibility and allowed cost stacking must be verified before relying on funding.',
    disclaimer: 'This snapshot is a directional business screen, not an appraisal, tax opinion, lending decision, guaranteed savings estimate or guarantee of grant eligibility. Dollar ranges are planning estimates based on the information provided and should be validated against actual ranch records, local prices and current program rules.',
  };
}
