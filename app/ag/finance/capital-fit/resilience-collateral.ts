export type EvidenceStatus = 'measured' | 'verified' | 'modeled' | 'estimated' | 'missing';

export type ResilienceCollateralRecord = {
  farmId: string; parcelId?: string; acres: number;
  practice: string; adoptionDate: string;
  soilBaseline: number; soilCurrent: number;
  yieldHistory: number[]; waterUsePerAcre?: number; waterReliability?: number;
  inputCostBefore?: number; inputCostAfter?: number;
  insurancePremiumBefore?: number; insurancePremiumAfter?: number;
  insuranceCoverage?: number; claimsHistory?: number;
  mrvMethod?: string; mrvSource?: string; mrvDate?: string; verifier?: string;
  creditMethodology?: string; expectedCreditsPerYear?: number; verifiedCredits?: number;
  creditPrice?: number; contractedBuyer?: string; pledgedCreditPct?: number;
  collateralHaircutPct?: number; loanAmount?: number; rateBefore?: number; rateAfter?: number;
  loanTermYears?: number; dscrBefore?: number; dscrAfter?: number;
  escrowConditions?: string[]; paymentTriggers?: string[];
  lenderAcceptance?: 'accepted' | 'conditional' | 'rejected' | 'not-reviewed';
  insurerAcceptance?: 'accepted' | 'conditional' | 'rejected' | 'not-reviewed';
  evidenceStatus: EvidenceStatus;
};

export function resilienceCollateralSummary(r: ResilienceCollateralRecord) {
  const projectedCreditRevenue = (r.expectedCreditsPerYear || 0) * (r.creditPrice || 0);
  const pledgedRevenue = projectedCreditRevenue * ((r.pledgedCreditPct || 0) / 100);
  const collateralValue = pledgedRevenue * (1 - ((r.collateralHaircutPct || 0) / 100));
  const annualInterestSavings = (r.loanAmount || 0) * (((r.rateBefore || 0) - (r.rateAfter || 0)) / 100);
  const annualInsuranceSavings = Math.max(0, (r.insurancePremiumBefore || 0) - (r.insurancePremiumAfter || 0));
  const soilChange = r.soilCurrent - r.soilBaseline;
  const decisionReady = r.evidenceStatus === 'verified' && !!r.verifier && !!r.mrvMethod && r.lenderAcceptance !== 'not-reviewed';
  return { projectedCreditRevenue, pledgedRevenue, collateralValue, annualInterestSavings, annualInsuranceSavings, soilChange, decisionReady };
}

export const resilienceCollateralEvidence = [
  'Field boundary / parcel identity', '3–5 years yield history where available', 'Soil tests with source, date and methodology',
  'Practice adoption records', 'Water use and reliability records', 'Input purchase and cost records', 'Historical farm financials',
  'Crop-insurance policy, premiums and claims', 'Weather and loss history', 'MRV files and verifier identity',
  'Environmental-credit methodology and serial/registry evidence', 'Buyer/offtake or credit-buyer evidence', 'Lender/insurer term sheet or review'
];

export const resiliencePilot = {
  scope: 'One Southwest farm, one field, one measurable regenerative intervention',
  test: 'Compare baseline and post-intervention soil, water, yield, insurance and financial evidence; obtain independent MRV; then ask a lender and insurer whether verified resilience changes rate, advance amount, collateral, terms or premium.',
  success: 'A documented underwriting or insurance decision changes because of decision-grade resilience evidence.'
};
