import { convertAnnualizedRevenue, type AnnualizedRevenueBasis } from './arrReality';

export type UnderwritingInputs = {
  thesis_fit?: number;
  annualized_revenue_rate?: number;
  annualized_revenue_basis?: AnnualizedRevenueBasis;
  arr_reality_factor_pct?: number;
  verified_ttm_revenue?: number;
  valuation_uses_arr?: boolean;
  revenue_verified_pct?: number;
  bank_reconciliation_pct?: number;
  tax_return_reconciliation_pct?: number;
  addbacks_verified_pct?: number;
  recurring_revenue_pct?: number;
  gross_margin_stability?: number;
  owner_dependency_pct?: number;
  sop_coverage_pct?: number;
  seller_transition_months?: number;
  key_relationship_transfer_pct?: number;
  top_customer_pct?: number;
  top_five_customer_pct?: number;
  contract_coverage_pct?: number;
  customer_correlation_risk?: number;
  churn_risk?: number;
  normalized_working_capital?: number;
  closing_working_capital?: number;
  ar_over_90_pct?: number;
  inventory_obsolescence_pct?: number;
  seasonality_risk?: number;
  normalized_free_cash_flow?: number;
  annual_debt_service?: number;
  down_payment_pct?: number;
  seller_note_pct?: number;
  sba_prelim_eligible?: boolean;
  asking_multiple?: number;
  market_low_multiple?: number;
  market_median_multiple?: number;
  market_high_multiple?: number;
  market_disruption_risk?: number;
  government_regulatory_risk?: number;
  cyber_risk?: number;
  tech_transferability?: number;
  critical_employees?: number;
  key_employee_retention_pct?: number;
  role_documentation_pct?: number;
  replacement_difficulty?: number;
  asset_purchase_preference?: number;
  tax_records_readiness?: number;
  purchase_price_allocation_readiness?: number;
  escrow_holdback_pct?: number;
  indemnity_cap_pct?: number;
  reps_warranty_readiness?: number;
  evidence_confidence?: number;
};

export type UnderwritingResults = {
  thesis_fit_score: number;
  qoe_score: number;
  transferability_score: number;
  customer_risk_score: number;
  working_capital_score: number;
  financing_score: number;
  comps_score: number;
  disruption_resilience_score: number;
  regulatory_resilience_score: number;
  cyber_technology_score: number;
  people_retention_score: number;
  tax_structure_readiness_score: number;
  risk_transfer_score: number;
  evidence_confidence_score: number;
  survivability_score: number;
  underwriting_score: number;
  reported_arr_r: number | null;
  arr_c: number | null;
  arr_reality_factor_pct: number | null;
  arr_discount_pct: number | null;
  arr_basis_label: string | null;
  verified_ttm_revenue: number | null;
  verified_to_arr_r_pct: number | null;
  valuation_revenue: number | null;
  valuation_revenue_basis: 'verified_ttm' | 'arr_c' | 'arr_r' | 'none';
  dscr: number | null;
  working_capital_adjustment: number;
  implied_value_low: number | null;
  implied_value_median: number | null;
  implied_value_high: number | null;
  decision: 'buy' | 'buy_conditionally' | 'needs_data' | 'pass';
  kill_triggers: string[];
  conditions: string[];
  advisor_flags: string[];
  narrative: string[];
};

export type EvidenceItem = {
  confidence?: number;
  verified?: boolean;
  source_type?: string;
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));
const n = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const pct = (value: unknown, fallback = 0) => clamp(n(value, fallback));
const inverse = (risk: unknown) => 100 - pct(risk);
const weighted = (pairs: Array<[number, number]>) => {
  const denom = pairs.reduce((sum, [, weight]) => sum + weight, 0);
  return denom ? pairs.reduce((sum, [value, weight]) => sum + clamp(value) * weight, 0) / denom : 0;
};
const usd = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function evidenceConfidence(items: EvidenceItem[]) {
  if (!items.length) return 20;
  const qualityMultiplier = (source = '') => {
    const s = source.toLowerCase();
    if (/bank|tax|audited|contract|government|lender|payroll/.test(s)) return 1;
    if (/accounting|pos|invoice|crm|vendor/.test(s)) return 0.9;
    if (/broker|cim|seller/.test(s)) return 0.68;
    return 0.75;
  };
  const weightedScore = items.reduce((sum, item) => {
    const base = pct(item.confidence, 50);
    const verifiedBoost = item.verified ? 10 : 0;
    return sum + clamp(base + verifiedBoost) * qualityMultiplier(item.source_type);
  }, 0) / items.length;
  const volumeBoost = Math.min(12, items.length * 1.5);
  return Math.round(clamp(weightedScore + volumeBoost));
}

export function underwriteAcquisition(input: UnderwritingInputs, normalizedEbitda = 0, evidence: EvidenceItem[] = []): UnderwritingResults {
  const thesis = pct(input.thesis_fit, 60);
  const revenueReality = convertAnnualizedRevenue({
    reportedArr: input.annualized_revenue_rate,
    basis: input.annualized_revenue_basis,
    factorPct: input.arr_reality_factor_pct,
    verifiedTtmRevenue: input.verified_ttm_revenue,
  });

  let revenueRealityScore = 100;
  if (revenueReality.reportedArrR) {
    revenueRealityScore = revenueReality.verifiedTtmRevenue && revenueReality.verifiedToReportedPct != null
      ? clamp(revenueReality.verifiedToReportedPct, 25, 100)
      : clamp(revenueReality.factorPct ?? 75, 25, 100);
  }

  const qoe = weighted([
    [pct(input.revenue_verified_pct, 35), 0.17],
    [pct(input.bank_reconciliation_pct, 25), 0.20],
    [pct(input.tax_return_reconciliation_pct, 25), 0.17],
    [pct(input.addbacks_verified_pct, 30), 0.17],
    [pct(input.recurring_revenue_pct, 40), 0.10],
    [pct(input.gross_margin_stability, 55), 0.09],
    [revenueRealityScore, 0.10],
  ]);

  const transitionMonths = Math.min(12, Math.max(0, n(input.seller_transition_months, 0)));
  const transitionScore = clamp((transitionMonths / 6) * 100);
  const transferability = weighted([
    [inverse(input.owner_dependency_pct ?? 70), 0.34],
    [pct(input.sop_coverage_pct, 20), 0.24],
    [transitionScore, 0.16],
    [pct(input.key_relationship_transfer_pct, 20), 0.26],
  ]);

  const topCustomerSafety = clamp(100 - Math.max(0, n(input.top_customer_pct, 35)) * 1.8);
  const topFiveSafety = clamp(100 - Math.max(0, n(input.top_five_customer_pct, 70)) * 0.7);
  const customer = weighted([
    [topCustomerSafety, 0.30],
    [topFiveSafety, 0.18],
    [pct(input.contract_coverage_pct, 25), 0.20],
    [inverse(input.customer_correlation_risk ?? 55), 0.17],
    [inverse(input.churn_risk ?? 45), 0.15],
  ]);

  const normalizedWc = n(input.normalized_working_capital, 0);
  const closingWc = n(input.closing_working_capital, 0);
  const workingCapitalAdjustment = Math.round(closingWc - normalizedWc);
  const wcGapPct = normalizedWc === 0 ? 30 : Math.min(100, Math.abs(workingCapitalAdjustment) / Math.max(Math.abs(normalizedWc), 1) * 100);
  const workingCapital = weighted([
    [100 - wcGapPct, 0.36],
    [inverse(input.ar_over_90_pct ?? 25), 0.24],
    [inverse(input.inventory_obsolescence_pct ?? 20), 0.18],
    [inverse(input.seasonality_risk ?? 45), 0.22],
  ]);

  const freeCashFlow = Math.max(0, n(input.normalized_free_cash_flow, 0));
  const debtService = Math.max(0, n(input.annual_debt_service, 0));
  const dscr = debtService > 0 ? freeCashFlow / debtService : null;
  const dscrScore = dscr == null ? 45 : dscr >= 1.75 ? 100 : dscr >= 1.5 ? 88 : dscr >= 1.25 ? 72 : dscr >= 1.1 ? 52 : 18;
  const financing = weighted([
    [dscrScore, 0.52],
    [clamp(n(input.down_payment_pct, 10) * 5), 0.16],
    [clamp(n(input.seller_note_pct, 0) * 3), 0.18],
    [input.sba_prelim_eligible ? 90 : 45, 0.14],
  ]);

  const askingMultiple = Math.max(0, n(input.asking_multiple, 0));
  const low = Math.max(0, n(input.market_low_multiple, 0));
  const median = Math.max(0, n(input.market_median_multiple, 0));
  const high = Math.max(0, n(input.market_high_multiple, 0));
  let comps = 45;
  if (askingMultiple > 0 && median > 0) {
    const relative = askingMultiple / median;
    comps = relative <= 0.9 ? 95 : relative <= 1 ? 84 : relative <= 1.1 ? 68 : relative <= 1.25 ? 48 : 24;
  }

  const disruption = inverse(input.market_disruption_risk ?? 50);
  const regulatory = inverse(input.government_regulatory_risk ?? 50);
  const cyberTech = weighted([
    [inverse(input.cyber_risk ?? 55), 0.56],
    [pct(input.tech_transferability, 40), 0.44],
  ]);

  const criticalEmployees = Math.max(0, Math.round(n(input.critical_employees, 0)));
  const people = weighted([
    [pct(input.key_employee_retention_pct, criticalEmployees ? 30 : 65), 0.50],
    [pct(input.role_documentation_pct, 25), 0.27],
    [inverse(input.replacement_difficulty ?? 60), 0.23],
  ]);

  const tax = weighted([
    [pct(input.tax_records_readiness, 35), 0.40],
    [pct(input.purchase_price_allocation_readiness, 20), 0.40],
    [pct(input.asset_purchase_preference, 50), 0.20],
  ]);

  const riskTransfer = weighted([
    [clamp(n(input.escrow_holdback_pct, 0) * 7), 0.30],
    [clamp(n(input.indemnity_cap_pct, 0) * 4), 0.30],
    [pct(input.reps_warranty_readiness, 25), 0.40],
  ]);

  const evidenceScore = evidence.length ? evidenceConfidence(evidence) : pct(input.evidence_confidence, 25);

  const survivability = weighted([
    [transferability, 0.22],
    [customer, 0.18],
    [people, 0.18],
    [disruption, 0.13],
    [regulatory, 0.11],
    [cyberTech, 0.08],
    [qoe, 0.10],
  ]);

  const overall = weighted([
    [thesis, 0.08],
    [qoe, 0.16],
    [transferability, 0.12],
    [customer, 0.10],
    [workingCapital, 0.08],
    [financing, 0.10],
    [comps, 0.08],
    [disruption, 0.05],
    [regulatory, 0.05],
    [cyberTech, 0.05],
    [people, 0.05],
    [tax, 0.03],
    [riskTransfer, 0.02],
    [evidenceScore, 0.03],
  ]);

  const kill: string[] = [];
  const conditions: string[] = [];
  const advisors = ['M&A attorney review before signing or sending binding terms', 'CPA/tax advisor review before choosing asset/stock structure or purchase-price allocation'];
  const narrative: string[] = [];

  if (qoe < 45) kill.push('Earnings quality is too weak or insufficiently verified to support a firm valuation.');
  if (dscr != null && dscr < 1.1) kill.push(`Debt-service coverage is ${dscr.toFixed(2)}x, below a prudent underwriting floor.`);
  if (transferability < 35) kill.push('The business appears too dependent on the seller to transfer safely without major conditions.');
  if (customer < 35) kill.push('Customer concentration/correlation risk is severe.');

  if (revenueReality.reportedArrR && !revenueReality.verifiedTtmRevenue) {
    conditions.push(`Reported ARR-R is a run-rate claim, not earned trailing revenue. Use ARR-C of ${usd(revenueReality.convertedArrC ?? 0)} for screening until trailing-12-month revenue is verified.`);
  }
  if (input.valuation_uses_arr && revenueReality.reportedArrR && !revenueReality.verifiedTtmRevenue) {
    conditions.push('Do not price the business, calculate acquisition multiples, or size debt directly from reported ARR-R. Use ARR-C until verified TTM revenue is available.');
  }
  if ((revenueReality.factorPct ?? 100) <= 60 && revenueReality.reportedArrR) {
    conditions.push('The annualized revenue claim is based on an unusually short or promotional period. Treat it as high-risk until month-by-month revenue supports the run rate.');
  }
  if ((revenueReality.verifiedToReportedPct ?? 100) < 75 && revenueReality.verifiedTtmRevenue) {
    conditions.push(`Verified TTM revenue is only ${revenueReality.verifiedToReportedPct?.toFixed(1)}% of reported ARR-R. Rebase valuation and financing on verified revenue.`);
  }

  if (evidenceScore < 30) conditions.push('Do not rely on seller/broker claims until bank, tax, accounting, contract, and payroll evidence is reconciled.');
  if (qoe < 70) conditions.push('Complete a Quality of Earnings bridge and reject unsupported add-backs before final pricing.');
  if (transferability < 70) conditions.push('Document SOPs, transfer key relationships, and define a seller transition covenant before closing.');
  if (customer < 70) conditions.push('Obtain customer-level concentration, contract, churn, renewal, and industry-correlation evidence.');
  if (workingCapital < 70) conditions.push('Set a normalized working-capital peg and closing adjustment mechanism in the purchase agreement.');
  if (people < 70) conditions.push('Secure retention plans for critical employees and document responsibilities before seller departure.');
  if (cyberTech < 70) conditions.push('Complete cyber, domain, software-license, code/data ownership, credential, and vendor-transfer diligence.');
  if (regulatory < 70) conditions.push('Verify permits, licenses, government dependencies, reimbursement/subsidy exposure, and change-of-control requirements.');
  if (tax < 70) conditions.push('Model asset-versus-equity economics and purchase-price allocation with tax counsel/CPA.');
  if (riskTransfer < 60) conditions.push('Negotiate appropriate escrow/holdback, indemnity, survival periods, and insurance options for identified risks.');

  if (input.sba_prelim_eligible) advisors.push('Confirm actual SBA 7(a) eligibility and lender underwriting; preliminary screening is not loan approval.');
  if (n(input.government_regulatory_risk, 50) > 60) advisors.push('Regulatory specialist review recommended before final approval.');
  if (n(input.cyber_risk, 55) > 60) advisors.push('Cybersecurity/technology diligence specialist review recommended.');

  narrative.push(`Quality of Earnings: ${Math.round(qoe)}/100. Transferability: ${Math.round(transferability)}/100. Post-acquisition survivability: ${Math.round(survivability)}/100.`);
  if (revenueReality.reportedArrR) {
    narrative.push(`ARR Reality Rule: reported ARR-R ${usd(revenueReality.reportedArrR)} (${revenueReality.basisLabel}) converts to ARR-C ${usd(revenueReality.convertedArrC ?? 0)} using a ${revenueReality.factorPct}% reality factor.`);
  }
  if (revenueReality.verifiedTtmRevenue) {
    const comparison = revenueReality.verifiedToReportedPct != null ? `, equal to ${revenueReality.verifiedToReportedPct.toFixed(1)}% of ARR-R` : '';
    narrative.push(`Verified trailing-12-month revenue is ${usd(revenueReality.verifiedTtmRevenue)}${comparison}. Verified TTM revenue is the preferred valuation basis.`);
  }
  if (dscr != null) narrative.push(`Modeled DSCR is ${dscr.toFixed(2)}x based on entered normalized free cash flow and annual debt service.`);
  if (workingCapitalAdjustment !== 0) narrative.push(`Entered closing working capital implies a ${workingCapitalAdjustment >= 0 ? 'positive' : 'negative'} ${usd(Math.abs(workingCapitalAdjustment))} adjustment versus normalized working capital.`);

  const impliedLow = normalizedEbitda > 0 && low > 0 ? Math.round(normalizedEbitda * low) : null;
  const impliedMedian = normalizedEbitda > 0 && median > 0 ? Math.round(normalizedEbitda * median) : null;
  const impliedHigh = normalizedEbitda > 0 && high > 0 ? Math.round(normalizedEbitda * high) : null;
  if (impliedMedian) narrative.push(`Entered market comps imply a median enterprise value near ${usd(impliedMedian)}, subject to deal-specific adjustments.`);

  let decision: UnderwritingResults['decision'] = 'needs_data';
  if (kill.length) decision = 'pass';
  else if (evidenceScore < 45 || qoe < 55) decision = 'needs_data';
  else if (overall >= 82 && survivability >= 75 && financing >= 70) decision = 'buy';
  else if (overall >= 60 && survivability >= 55) decision = 'buy_conditionally';
  else decision = 'pass';

  return {
    thesis_fit_score: Math.round(thesis),
    qoe_score: Math.round(qoe),
    transferability_score: Math.round(transferability),
    customer_risk_score: Math.round(customer),
    working_capital_score: Math.round(workingCapital),
    financing_score: Math.round(financing),
    comps_score: Math.round(comps),
    disruption_resilience_score: Math.round(disruption),
    regulatory_resilience_score: Math.round(regulatory),
    cyber_technology_score: Math.round(cyberTech),
    people_retention_score: Math.round(people),
    tax_structure_readiness_score: Math.round(tax),
    risk_transfer_score: Math.round(riskTransfer),
    evidence_confidence_score: Math.round(evidenceScore),
    survivability_score: Math.round(survivability),
    underwriting_score: Math.round(overall),
    reported_arr_r: revenueReality.reportedArrR,
    arr_c: revenueReality.convertedArrC,
    arr_reality_factor_pct: revenueReality.factorPct,
    arr_discount_pct: revenueReality.discountPct,
    arr_basis_label: revenueReality.basisLabel,
    verified_ttm_revenue: revenueReality.verifiedTtmRevenue,
    verified_to_arr_r_pct: revenueReality.verifiedToReportedPct,
    valuation_revenue: revenueReality.valuationRevenue,
    valuation_revenue_basis: revenueReality.valuationBasis,
    dscr,
    working_capital_adjustment: workingCapitalAdjustment,
    implied_value_low: impliedLow,
    implied_value_median: impliedMedian,
    implied_value_high: impliedHigh,
    decision,
    kill_triggers: kill,
    conditions,
    advisor_flags: advisors,
    narrative,
  };
}

export function build100DayPlan(results: UnderwritingResults) {
  const tasks: Array<{ phase: 'pre_close' | 'day_1' | 'day_30' | 'day_60' | 'day_100' | 'year_1'; due_day: number; task: string; owner: string; rationale: string }> = [
    { phase: 'pre_close', due_day: 0, task: 'Freeze the investment thesis, approved purchase economics, and walk-away conditions.', owner: 'Owner', rationale: 'Prevents deal enthusiasm from changing underwriting after approval.' },
    { phase: 'pre_close', due_day: 0, task: 'Document bank access, payroll, insurance, licenses, domains, software, keys, passwords, and vendor/customer handoffs.', owner: 'Operations', rationale: 'Reduces Day 1 continuity failures.' },
    { phase: 'day_1', due_day: 1, task: 'Communicate ownership transition to employees and protect customer/vendor continuity.', owner: 'Owner / Operations', rationale: 'Stabilizes trust before making major changes.' },
    { phase: 'day_30', due_day: 30, task: 'Validate actual cash conversion, margins, working capital, customer churn, and debt-service performance against underwriting.', owner: 'Finance', rationale: 'Tests the purchase model against real post-close data.' },
    { phase: 'day_60', due_day: 60, task: 'Lock operating cadence, KPIs, management responsibilities, and weekly exception review.', owner: 'Operations', rationale: 'Moves the business away from seller-dependent management.' },
    { phase: 'day_100', due_day: 100, task: 'Approve the first value-creation plan only after the base business is stable and metrics are trusted.', owner: 'Board / Owner', rationale: 'Avoids breaking a working business before understanding it.' },
    { phase: 'year_1', due_day: 365, task: 'Re-underwrite the acquisition thesis, debt capacity, management bench, growth investments, and exit options.', owner: 'Board / Finance', rationale: 'Turns acquisition performance into a disciplined annual capital-allocation decision.' },
  ];
  if (results.reported_arr_r && !results.verified_ttm_revenue) tasks.push({ phase: 'pre_close', due_day: 0, task: 'Reconcile monthly revenue for the trailing 12 months and replace ARR-R with verified TTM revenue before final valuation.', owner: 'Finance', rationale: 'Reported annualized revenue is a run-rate claim and has not yet been verified.' });
  if (results.transferability_score < 70) tasks.push({ phase: 'pre_close', due_day: 0, task: 'Complete seller knowledge-transfer map, SOP capture, and key-relationship introductions.', owner: 'Operations', rationale: 'Transferability is below target.' });
  if (results.people_retention_score < 70) tasks.push({ phase: 'pre_close', due_day: 0, task: 'Create written retention plans for critical employees and backup coverage for each key role.', owner: 'People / Owner', rationale: 'Key-person risk is elevated.' });
  if (results.customer_risk_score < 70) tasks.push({ phase: 'day_30', due_day: 30, task: 'Meet top customers, verify renewal/contract status, and build a concentration-reduction plan.', owner: 'Revenue', rationale: 'Customer concentration/correlation risk is elevated.' });
  if (results.cyber_technology_score < 70) tasks.push({ phase: 'day_30', due_day: 30, task: 'Rotate privileged credentials, verify backups, inventory vendors/licenses, and close critical cyber gaps.', owner: 'Technology', rationale: 'Cyber/technology readiness is below target.' });
  if (results.working_capital_score < 70) tasks.push({ phase: 'day_30', due_day: 30, task: 'Run weekly AR/AP/inventory working-capital review against the closing peg.', owner: 'Finance', rationale: 'Working-capital quality is below target.' });
  return tasks;
}
