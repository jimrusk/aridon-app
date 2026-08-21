export type FinancingInput = {
  purchase_price: number;
  buyer_cash: number;
  seller_note: number;
  earnout: number;
  normalized_free_cash_flow: number;
  annual_debt_service: number;
  requested_sba_loan?: number;
  operating_business_eligible?: boolean;
};

export type FinancingPath = {
  name: string;
  preliminary_fit: 'strong' | 'possible' | 'weak';
  reason: string;
  lender_need: number;
  dscr: number | null;
  approval_note: string;
};

const n=(v:unknown)=>Math.max(0,Number(v)||0);

export function preliminaryFinancingPaths(input:FinancingInput):FinancingPath[] {
  const purchase=n(input.purchase_price);
  const cash=n(input.buyer_cash);
  const seller=n(input.seller_note);
  const earnout=n(input.earnout);
  const lenderNeed=Math.max(0,purchase-cash-seller-earnout);
  const debtService=n(input.annual_debt_service);
  const freeCash=n(input.normalized_free_cash_flow);
  const dscr=debtService>0?freeCash/debtService:null;
  const equityPct=purchase>0?cash/purchase*100:0;
  const sellerPct=purchase>0?seller/purchase*100:0;
  const requestedSba=n(input.requested_sba_loan)||lenderNeed;
  const sbaFit=requestedSba<=5000000&&input.operating_business_eligible!==false&&(dscr==null||dscr>=1.15);
  const conventionalFit=(dscr??0)>=1.25&&equityPct>=20;
  const sellerFit=sellerPct>=25;
  return [
    {name:'SBA 7(a) preliminary lane',preliminary_fit:sbaFit?'possible':'weak',reason:sbaFit?`Requested lender need is within the current $5M SBA 7(a) maximum and entered cash flow does not immediately disqualify the lane.`:`Entered structure needs further work for a preliminary SBA lane. Check loan size, operating-business eligibility, equity injection, collateral and lender DSCR requirements.`,lender_need:lenderNeed,dscr,approval_note:'Preliminary screening only. SBA/lender eligibility and underwriting must be confirmed by a participating lender.'},
    {name:'Conventional / bank debt lane',preliminary_fit:conventionalFit?'strong':(dscr??0)>=1.15?'possible':'weak',reason:conventionalFit?`Entered equity is ${equityPct.toFixed(1)}% and DSCR is ${dscr?.toFixed(2)}x.`:`Conventional financing usually becomes easier with stronger equity and debt-service coverage than currently entered.`,lender_need:lenderNeed,dscr,approval_note:'Actual terms depend on lender underwriting, collateral, guarantees, industry and borrower strength.'},
    {name:'Seller-financed lane',preliminary_fit:sellerFit?'strong':sellerPct>=10?'possible':'weak',reason:`Seller note represents ${sellerPct.toFixed(1)}% of purchase price.`,lender_need:lenderNeed,dscr,approval_note:'Seller notes require negotiated legal documents, priority/subordination terms, security and tax review.'},
    {name:'Hybrid / performance lane',preliminary_fit:(seller+earnout)>0?'possible':'weak',reason:`Seller note plus earnout equals ${purchase>0?((seller+earnout)/purchase*100).toFixed(1):'0.0'}% of purchase price.`,lender_need:lenderNeed,dscr,approval_note:'Earnouts must use measurable definitions, accounting rules, dispute procedures and legal review.'},
  ];
}

export type AllocationInput={
  purchase_price:number;
  cash_and_receivables?:number;
  inventory?:number;
  equipment?:number;
  real_estate?:number;
  identifiable_intangibles?:number;
  noncompete?:number;
  goodwill?:number;
  other?:number;
};

export function purchasePriceAllocationCheck(input:AllocationInput){
  const purchase=n(input.purchase_price);
  const rows=[
    ['Cash / receivables',n(input.cash_and_receivables)],['Inventory',n(input.inventory)],['Equipment / fixed assets',n(input.equipment)],['Real estate',n(input.real_estate)],['Identifiable intangibles',n(input.identifiable_intangibles)],['Non-compete / covenant',n(input.noncompete)],['Goodwill / going-concern value',n(input.goodwill)],['Other',n(input.other)],
  ] as const;
  const allocated=rows.reduce((s,[,v])=>s+v,0);
  return {purchase_price:purchase,allocated,total_gap:purchase-allocated,balanced:Math.abs(purchase-allocated)<1,rows,advisor_note:'This is an allocation consistency check, not tax advice. Buyer and seller should coordinate final allocation with qualified tax counsel/CPA and required IRS reporting.'};
}

export function acquisitionGovernancePlan(){
  return [
    {cadence:'Daily · first 30 days',owner:'Operations',focus:'Cash, service delivery, customer/vendor exceptions, staffing, safety and urgent continuity issues.'},
    {cadence:'Weekly · first 100 days',owner:'Owner + Finance + Operations',focus:'Cash conversion, working capital, debt service, customer retention, key employees, seller-transition obligations and underwriting variances.'},
    {cadence:'Monthly · first 6 months',owner:'Owner / advisor board',focus:'P&L, balance sheet, cash flow, concentration, management bench, risks, covenant compliance and value-creation decisions.'},
    {cadence:'Quarterly · ongoing',owner:'Board / advisors',focus:'Re-underwrite strategy, capital allocation, major hiring, M&A, growth investments, risk register and exit/hold thesis.'},
  ];
}

export function riskTransferChecklist(input:{escrow_holdback_pct?:number;indemnity_cap_pct?:number;survival_months?:number;rwi_readiness?:number}){
  const escrow=n(input.escrow_holdback_pct);const cap=n(input.indemnity_cap_pct);const survival=n(input.survival_months);const rwi=n(input.rwi_readiness);
  const flags:string[]=[];
  if(escrow<=0)flags.push('No escrow/holdback entered for post-close claim protection.');
  if(cap<=0)flags.push('No indemnity cap entered.');
  if(survival<=0)flags.push('No representation survival period entered.');
  if(rwi<50)flags.push('Representations-and-warranties insurance readiness is low or not evaluated.');
  return {escrow_holdback_pct:escrow,indemnity_cap_pct:cap,survival_months:survival,rwi_readiness:rwi,flags,legal_note:'Risk-transfer terms are transaction-specific and require M&A counsel and, where applicable, insurance brokerage review.'};
}
