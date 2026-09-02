export type PropertyType = 'home' | 'land' | 'farm-ranch' | 'commercial';

export type PropertyComp = {
  id: string;
  soldPrice: number;
  size: number;
  monthsAgo: number;
  distanceMiles: number;
  similarity?: number;
  verifiedSale?: boolean;
};

export type PropertyValuationInput = {
  propertyType: PropertyType;
  size: number;
  askingPrice?: number;
  condition: 'excellent' | 'good' | 'average' | 'repairs' | 'major-rehab' | 'unknown';
  marketTrend: 'falling' | 'soft' | 'flat' | 'rising' | 'hot';
  repairBudget?: number;
  targetMarginPct?: number;
  closingReserve?: number;
  comps: PropertyComp[];
};

export type PropertyValuationResult = {
  evidenceValue: number;
  conservativeValue: number;
  lowValue: number;
  highValue: number;
  evidenceUnitValue: number;
  adjustedUnitValue: number;
  confidence: number;
  maxBuyPrice: number;
  askingGapPct: number | null;
  askingPremiumPct: number | null;
  outlierCount: number;
  verifiedCompCount: number;
  compCount: number;
  conditionAdjustmentPct: number;
  marketAdjustmentPct: number;
  verdict: 'UNDERPRICED' | 'FAIR / VERIFY' | 'OVERPRICED' | 'INSUFFICIENT EVIDENCE';
  warnings: string[];
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function weight(subjectSize: number, comp: PropertyComp) {
  const sizeRatio = Math.min(subjectSize, comp.size) / Math.max(subjectSize, comp.size);
  const sizeWeight = Math.sqrt(clamp(sizeRatio, 0.08, 1));
  const recencyWeight = 1 / (1 + Math.max(0, comp.monthsAgo) / 12);
  const distanceWeight = 1 / (1 + Math.max(0, comp.distanceMiles) / 20);
  const similarityWeight = clamp((comp.similarity ?? 80) / 100, 0.25, 1);
  const verifiedWeight = comp.verifiedSale === false ? 0.55 : 1;
  return sizeWeight * recencyWeight * distanceWeight * similarityWeight * verifiedWeight;
}

function weightedMedian(items: Array<{ unit: number; weight: number }>) {
  const sorted = [...items].sort((a, b) => a.unit - b.unit);
  const total = sorted.reduce((sum, item) => sum + item.weight, 0) || 1;
  let running = 0;
  for (const item of sorted) {
    running += item.weight;
    if (running >= total / 2) return item.unit;
  }
  return sorted.at(-1)?.unit ?? 0;
}

function suppressOutliers(items: Array<{ unit: number; weight: number }>) {
  if (items.length < 4) return items;
  const center = median(items.map((item) => item.unit));
  const mad = median(items.map((item) => Math.abs(item.unit - center)));
  const robustSigma = mad * 1.4826;
  const threshold = Math.max(center * 0.25, robustSigma * 2.5);
  const kept = items.filter((item) => Math.abs(item.unit - center) <= threshold);
  return kept.length >= Math.max(3, Math.ceil(items.length * 0.6)) ? kept : items;
}

function conditionAdjustment(condition: PropertyValuationInput['condition']) {
  return ({ excellent: 6, good: 3, average: 0, repairs: -10, 'major-rehab': -22, unknown: -4 } as const)[condition];
}

function trendAdjustment(trend: PropertyValuationInput['marketTrend']) {
  return ({ falling: -7, soft: -3, flat: 0, rising: 2, hot: 4 } as const)[trend];
}

export function valueProperty(input: PropertyValuationInput): PropertyValuationResult | null {
  const subjectSize = Number(input.size);
  const comps = input.comps.filter((comp) => comp.soldPrice > 0 && comp.size > 0 && Number.isFinite(comp.soldPrice) && Number.isFinite(comp.size));
  if (!Number.isFinite(subjectSize) || subjectSize <= 0 || !comps.length) return null;

  const allItems = comps.map((comp) => ({ unit: comp.soldPrice / comp.size, weight: weight(subjectSize, comp) }));
  const robustItems = suppressOutliers(allItems);
  const outlierCount = allItems.length - robustItems.length;
  const totalWeight = robustItems.reduce((sum, item) => sum + item.weight, 0) || 1;
  const weightedMean = robustItems.reduce((sum, item) => sum + item.unit * item.weight, 0) / totalWeight;
  const med = weightedMedian(robustItems);

  // Median-forward blend limits the influence of unusually expensive sales.
  const evidenceUnitValue = med * 0.7 + weightedMean * 0.3;
  const conditionAdjustmentPct = conditionAdjustment(input.condition);
  const marketAdjustmentPct = trendAdjustment(input.marketTrend);
  const totalAdjustmentPct = clamp(conditionAdjustmentPct + marketAdjustmentPct, -30, 12);
  const adjustedUnitValue = evidenceUnitValue * (1 + totalAdjustmentPct / 100);
  const repairBudget = Math.max(0, Number(input.repairBudget ?? 0));
  const evidenceValue = Math.max(0, adjustedUnitValue * subjectSize - repairBudget);

  const units = allItems.map((item) => item.unit);
  const mean = units.reduce((sum, value) => sum + value, 0) / units.length;
  const variance = units.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / units.length;
  const dispersion = mean ? Math.sqrt(variance) / mean : 0;
  const recent = comps.filter((comp) => comp.monthsAgo <= 12).length;
  const close = comps.filter((comp) => comp.distanceMiles <= 10).length;
  const verifiedCompCount = comps.filter((comp) => comp.verifiedSale !== false).length;
  const unverified = comps.length - verifiedCompCount;

  const confidence = Math.round(clamp(
    24 + comps.length * 8 + recent * 4 + close * 3 + verifiedCompCount * 3 - dispersion * 52 - outlierCount * 5 - unverified * 5,
    20,
    97,
  ));

  const uncertainty = clamp(0.06 + dispersion * 0.42 + (100 - confidence) / 320, 0.08, 0.33);
  const lowValue = evidenceValue * (1 - uncertainty);
  const highValue = evidenceValue * (1 + uncertainty);
  // This is the number Aridon should use for acquisition decisions.
  const conservativeValue = evidenceValue * (1 - Math.max(0.04, uncertainty * 0.55));

  const margin = clamp(Number(input.targetMarginPct ?? 20), 5, 60);
  const reserve = Math.max(0, Number(input.closingReserve ?? 0));
  const maxBuyPrice = Math.max(0, conservativeValue * (1 - margin / 100) - reserve);
  const asking = Math.max(0, Number(input.askingPrice ?? 0));
  const askingGapPct = asking > 0 ? ((conservativeValue - asking) / conservativeValue) * 100 : null;
  const askingPremiumPct = asking > 0 ? ((asking - conservativeValue) / conservativeValue) * 100 : null;

  const warnings: string[] = [];
  if (comps.length < 3) warnings.push('Fewer than three usable sold comps. Treat the result as preliminary.');
  if (verifiedCompCount < comps.length) warnings.push('One or more comps are not marked as verified closed sales.');
  if (outlierCount > 0) warnings.push(`${outlierCount} unusually high or low comp${outlierCount === 1 ? ' was' : 's were'} suppressed so they could not distort the estimate.`);
  if (confidence < 65) warnings.push('Confidence is below 65%. More recent, nearby verified sales are needed.');
  if (input.condition === 'unknown') warnings.push('Condition is unknown, so Aridon applies a conservative deduction.');
  if (askingPremiumPct != null && askingPremiumPct > 8) warnings.push(`Asking price is ${askingPremiumPct.toFixed(1)}% above Aridon’s conservative value.`);

  let verdict: PropertyValuationResult['verdict'];
  if (confidence < 45 || comps.length < 2) verdict = 'INSUFFICIENT EVIDENCE';
  else if (askingGapPct != null && askingGapPct >= 12) verdict = 'UNDERPRICED';
  else if (askingPremiumPct != null && askingPremiumPct > 8) verdict = 'OVERPRICED';
  else verdict = 'FAIR / VERIFY';

  return {
    evidenceValue,
    conservativeValue,
    lowValue,
    highValue,
    evidenceUnitValue,
    adjustedUnitValue,
    confidence,
    maxBuyPrice,
    askingGapPct,
    askingPremiumPct,
    outlierCount,
    verifiedCompCount,
    compCount: comps.length,
    conditionAdjustmentPct,
    marketAdjustmentPct,
    verdict,
    warnings,
  };
}
