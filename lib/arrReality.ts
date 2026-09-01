export const ARR_BASIS_CONFIG = {
  ttm_actual: { label: 'Trailing 12 months actual revenue', factorPct: 100 },
  six_month_average: { label: 'Last 6-month average × 12', factorPct: 92.5 },
  three_month_average: { label: 'Last 3-month average × 4', factorPct: 85 },
  last_month: { label: 'Last month × 12', factorPct: 75 },
  best_month: { label: 'Best recent month × 12', factorPct: 62.5 },
  one_week: { label: 'One exceptional week × 52', factorPct: 50 },
  unknown: { label: 'Unknown / seller run-rate claim', factorPct: 75 },
} as const;

export type AnnualizedRevenueBasis = keyof typeof ARR_BASIS_CONFIG;

export type ArrRealityInput = {
  reportedArr?: number;
  basis?: AnnualizedRevenueBasis;
  factorPct?: number;
  verifiedTtmRevenue?: number;
};

export type ArrRealityResult = {
  reportedArrR: number | null;
  convertedArrC: number | null;
  factorPct: number | null;
  discountPct: number | null;
  verifiedTtmRevenue: number | null;
  verifiedToReportedPct: number | null;
  basis: AnnualizedRevenueBasis | null;
  basisLabel: string | null;
  valuationRevenue: number | null;
  valuationBasis: 'verified_ttm' | 'arr_c' | 'arr_r' | 'none';
};

const safePositive = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const clampFactor = (value: number) => Math.min(100, Math.max(25, value));

export function convertAnnualizedRevenue(input: ArrRealityInput): ArrRealityResult {
  const reported = safePositive(input.reportedArr);
  const verified = safePositive(input.verifiedTtmRevenue);
  const basis: AnnualizedRevenueBasis = input.basis && input.basis in ARR_BASIS_CONFIG ? input.basis : 'unknown';
  const defaultFactor = ARR_BASIS_CONFIG[basis].factorPct;
  const suppliedFactor = Number(input.factorPct);
  const factorPct = reported > 0
    ? clampFactor(Number.isFinite(suppliedFactor) && suppliedFactor > 0 ? suppliedFactor : defaultFactor)
    : null;
  const converted = reported > 0 && factorPct != null ? Math.round(reported * factorPct / 100) : null;
  const discountPct = factorPct == null ? null : Math.round((100 - factorPct) * 10) / 10;
  const verifiedToReportedPct = reported > 0 && verified > 0 ? Math.round((verified / reported) * 1000) / 10 : null;

  let valuationRevenue: number | null = null;
  let valuationBasis: ArrRealityResult['valuationBasis'] = 'none';
  if (verified > 0) {
    valuationRevenue = Math.round(verified);
    valuationBasis = 'verified_ttm';
  } else if (converted != null) {
    valuationRevenue = converted;
    valuationBasis = factorPct === 100 ? 'arr_r' : 'arr_c';
  }

  return {
    reportedArrR: reported > 0 ? Math.round(reported) : null,
    convertedArrC: converted,
    factorPct,
    discountPct,
    verifiedTtmRevenue: verified > 0 ? Math.round(verified) : null,
    verifiedToReportedPct,
    basis: reported > 0 ? basis : null,
    basisLabel: reported > 0 ? ARR_BASIS_CONFIG[basis].label : null,
    valuationRevenue,
    valuationBasis,
  };
}
