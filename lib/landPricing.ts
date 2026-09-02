export type ComparableLandSale = {
  id: string;
  price: number;
  acres: number;
  monthsAgo: number;
  distanceMiles: number;
  similarity?: number;
};

export type LandRiskInputs = {
  access: 'paved' | 'unpaved' | 'easement' | 'landlocked' | 'unknown';
  water: 'public' | 'well' | 'rights' | 'haul' | 'none' | 'unknown';
  utilities: 'onsite' | 'nearby' | 'offgrid' | 'none' | 'unknown';
  zoning: 'confirmed' | 'conditional' | 'restricted' | 'unknown';
  flood: 'low' | 'moderate' | 'high' | 'unknown';
  wetlands: 'none' | 'partial' | 'major' | 'unknown';
  slope: 'flat' | 'rolling' | 'steep' | 'unknown';
};

export type LandPricingInput = {
  acres: number;
  askingPrice?: number;
  targetMarginPct?: number;
  reserve?: number;
  comps: ComparableLandSale[];
  risks: LandRiskInputs;
};

export type LandPricingResult = {
  estimatedValue: number;
  lowValue: number;
  highValue: number;
  weightedPricePerAcre: number;
  adjustedPricePerAcre: number;
  adjustmentPct: number;
  confidence: number;
  maxOffer: number;
  askingDiscountPct: number | null;
  grossSpread: number | null;
  dealScore: number;
  verdict: 'PURSUE' | 'NEGOTIATE' | 'VERIFY' | 'PASS / REPRICE';
  compCount: number;
  dispersionPct: number;
  factors: Array<{ label: string; impactPct: number; note: string }>;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function factor(label: string, impactPct: number, note: string) {
  return { label, impactPct, note };
}

export function landAdjustmentFactors(risks: LandRiskInputs) {
  const factors: LandPricingResult['factors'] = [];

  const access = {
    paved: factor('Legal road access', 5, 'Recorded paved access supports liquidity and development.'),
    unpaved: factor('Legal road access', 1, 'Recorded unpaved access is workable but can add maintenance cost.'),
    easement: factor('Access easement', -6, 'Private or easement access deserves title and maintenance review.'),
    landlocked: factor('Landlocked risk', -28, 'No confirmed legal access can sharply reduce marketability.'),
    unknown: factor('Access unverified', -4, 'Value is discounted until legal access is confirmed.'),
  }[risks.access];
  factors.push(access);

  const water = {
    public: factor('Water', 8, 'Public or community water improves usability.'),
    well: factor('Water', 7, 'Verified productive well supports land utility.'),
    rights: factor('Water rights', 11, 'Verified transferable water rights can materially improve land value.'),
    haul: factor('Water', -5, 'Hauled water adds operating cost and limits some uses.'),
    none: factor('Water', -18, 'No identified water source is a major development constraint.'),
    unknown: factor('Water unverified', -5, 'Water is treated conservatively until source and legal use are verified.'),
  }[risks.water];
  factors.push(water);

  const utilities = {
    onsite: factor('Utilities', 5, 'Utilities at the property reduce development cost.'),
    nearby: factor('Utilities', 1, 'Nearby utilities help, subject to extension cost.'),
    offgrid: factor('Off-grid fit', 0, 'Off-grid plans can work but require project-specific economics.'),
    none: factor('Utilities', -8, 'No utility path increases development cost.'),
    unknown: factor('Utilities unverified', -2, 'Utility availability and extension cost are not yet confirmed.'),
  }[risks.utilities];
  factors.push(utilities);

  const zoning = {
    confirmed: factor('Zoning / use', 5, 'Intended use is confirmed as allowed.'),
    conditional: factor('Zoning / use', -3, 'Conditional or special-use approval adds execution risk.'),
    restricted: factor('Zoning / use', -15, 'Known restrictions reduce flexibility and buyer pool.'),
    unknown: factor('Zoning unverified', -4, 'Allowed use must be confirmed before relying on development value.'),
  }[risks.zoning];
  factors.push(zoning);

  const flood = {
    low: factor('Flood exposure', 0, 'No material flood adjustment entered.'),
    moderate: factor('Flood exposure', -5, 'Moderate flood exposure can affect insurance and buildable area.'),
    high: factor('Flood exposure', -16, 'High flood exposure can materially limit development.'),
    unknown: factor('Flood unverified', -2, 'Flood status should be checked against FEMA and local data.'),
  }[risks.flood];
  factors.push(flood);

  const wetlands = {
    none: factor('Wetlands', 0, 'No material wetlands adjustment entered.'),
    partial: factor('Wetlands', -6, 'Partial wetlands may reduce usable acreage.'),
    major: factor('Wetlands', -20, 'Major wetlands constraints can sharply reduce buildable area.'),
    unknown: factor('Wetlands unverified', -2, 'Wetlands should be screened before development assumptions are used.'),
  }[risks.wetlands];
  factors.push(wetlands);

  const slope = {
    flat: factor('Topography', 3, 'Generally favorable terrain supports broader use.'),
    rolling: factor('Topography', 0, 'Rolling terrain is treated as neutral without site-specific engineering.'),
    steep: factor('Topography', -12, 'Steep terrain can reduce usable acreage and increase site costs.'),
    unknown: factor('Topography unverified', -2, 'Slope and usable acreage should be confirmed.'),
  }[risks.slope];
  factors.push(slope);

  return factors;
}

function compWeight(subjectAcres: number, comp: ComparableLandSale) {
  const acreageRatio = Math.min(subjectAcres, comp.acres) / Math.max(subjectAcres, comp.acres);
  const acreageWeight = Math.sqrt(clamp(acreageRatio, 0.05, 1));
  const recencyWeight = 1 / (1 + Math.max(0, comp.monthsAgo) / 14);
  const distanceWeight = 1 / (1 + Math.max(0, comp.distanceMiles) / 30);
  const similarityWeight = clamp((comp.similarity ?? 80) / 100, 0.25, 1);
  return acreageWeight * recencyWeight * distanceWeight * similarityWeight;
}

export function priceLand(input: LandPricingInput): LandPricingResult | null {
  const acres = Number(input.acres);
  const comps = input.comps.filter((c) => c.price > 0 && c.acres > 0 && Number.isFinite(c.price) && Number.isFinite(c.acres));
  if (!Number.isFinite(acres) || acres <= 0 || !comps.length) return null;

  const weighted = comps.map((comp) => ({
    ppa: comp.price / comp.acres,
    weight: compWeight(acres, comp),
  }));
  const weightTotal = weighted.reduce((sum, item) => sum + item.weight, 0) || 1;
  const weightedPricePerAcre = weighted.reduce((sum, item) => sum + item.ppa * item.weight, 0) / weightTotal;

  const ppas = weighted.map((item) => item.ppa);
  const mean = ppas.reduce((sum, value) => sum + value, 0) / ppas.length;
  const variance = ppas.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / ppas.length;
  const dispersionPct = mean ? Math.sqrt(variance) / mean : 0;

  const factors = landAdjustmentFactors(input.risks);
  const rawAdjustment = factors.reduce((sum, item) => sum + item.impactPct, 0);
  const adjustmentPct = clamp(rawAdjustment, -45, 30);
  const adjustedPricePerAcre = weightedPricePerAcre * (1 + adjustmentPct / 100);
  const estimatedValue = adjustedPricePerAcre * acres;

  const knownRiskCount = Object.values(input.risks).filter((value) => value !== 'unknown').length;
  const recentComps = comps.filter((comp) => comp.monthsAgo <= 18).length;
  const closeComps = comps.filter((comp) => comp.distanceMiles <= 25).length;
  const compQuality = clamp(comps.length * 8 + recentComps * 4 + closeComps * 3, 0, 52);
  const completeness = knownRiskCount * 5;
  const dispersionPenalty = clamp(dispersionPct * 45, 0, 26);
  const confidence = Math.round(clamp(28 + compQuality + completeness - dispersionPenalty, 22, 97));

  const uncertainty = clamp(0.07 + dispersionPct * 0.45 + (100 - confidence) / 330, 0.08, 0.34);
  const lowValue = estimatedValue * (1 - uncertainty);
  const highValue = estimatedValue * (1 + uncertainty);

  const targetMarginPct = clamp(input.targetMarginPct ?? 25, 5, 65);
  const reserve = Math.max(0, input.reserve ?? 0);
  const maxOffer = Math.max(0, estimatedValue * (1 - targetMarginPct / 100) - reserve);
  const asking = Number(input.askingPrice ?? 0);
  const askingDiscountPct = asking > 0 ? ((estimatedValue - asking) / estimatedValue) * 100 : null;
  const grossSpread = asking > 0 ? estimatedValue - asking : null;

  const riskQuality = clamp(72 + adjustmentPct, 20, 95);
  const priceEdge = askingDiscountPct == null ? 55 : clamp(50 + askingDiscountPct * 1.4, 10, 98);
  const marginEdge = estimatedValue > 0 ? clamp(((estimatedValue - maxOffer) / estimatedValue) * 100 + 55, 30, 95) : 50;
  const dealScore = Math.round(clamp(confidence * 0.32 + riskQuality * 0.24 + priceEdge * 0.32 + marginEdge * 0.12, 0, 100));

  const verdict: LandPricingResult['verdict'] =
    dealScore >= 82 && (askingDiscountPct == null || askingDiscountPct >= 12) ? 'PURSUE' :
    dealScore >= 70 ? 'NEGOTIATE' :
    confidence < 62 ? 'VERIFY' :
    'PASS / REPRICE';

  return {
    estimatedValue,
    lowValue,
    highValue,
    weightedPricePerAcre,
    adjustedPricePerAcre,
    adjustmentPct,
    confidence,
    maxOffer,
    askingDiscountPct,
    grossSpread,
    dealScore,
    verdict,
    compCount: comps.length,
    dispersionPct: dispersionPct * 100,
    factors,
  };
}
