export type PropertyFinanceInput = {
  askingPrice: number;
  estimatedValue?: number;
  existingLoanBalance?: number;
  existingMonthlyPayment?: number;
  existingInterestRate?: number;
  estimatedRent?: number;
  sellerCashNeeded?: number;
  repairs?: number;
  closingCosts?: number;
  freeAndClear?: boolean;
  sellerMotivation?: 'low' | 'medium' | 'high';
  distressSignals?: string[];
};

export type FinanceStrategy = 'CASH' | 'SUBJECT_TO' | 'SELLER_FINANCE' | 'HYBRID';

export type FinanceScore = {
  strategy: FinanceStrategy;
  score: number;
  reasons: string[];
  missingFacts: string[];
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Shared scoring engine for Aridon property/farm discovery and Eva Deal Lab.
 * Scores are screening signals, not legal/financial advice or an offer.
 */
export function scoreCreativeFinance(input: PropertyFinanceInput): FinanceScore[] {
  const value = input.estimatedValue || input.askingPrice;
  const loan = input.existingLoanBalance || 0;
  const equity = Math.max(0, value - loan);
  const equityPct = value > 0 ? equity / value : 0;
  const rentSpread = (input.estimatedRent || 0) - (input.existingMonthlyPayment || 0);
  const motivation = input.sellerMotivation === 'high' ? 20 : input.sellerMotivation === 'medium' ? 10 : 0;
  const distress = Math.min(15, (input.distressSignals || []).length * 3);

  const missingLoan = !input.freeAndClear && (!input.existingLoanBalance || !input.existingMonthlyPayment);
  const missingRent = !input.estimatedRent;

  const cashDiscount = value > 0 ? Math.max(0, (value - input.askingPrice) / value) : 0;
  const cash: FinanceScore = {
    strategy: 'CASH',
    score: clamp(35 + cashDiscount * 100 + motivation + distress - (input.repairs || 0) / Math.max(value, 1) * 30),
    reasons: ['Useful baseline against every creative structure', ...(cashDiscount > .1 ? ['Meaningful discount to estimated value'] : [])],
    missingFacts: [],
  };

  const subto: FinanceScore = {
    strategy: 'SUBJECT_TO',
    score: clamp((input.freeAndClear ? 0 : 35) + (input.existingInterestRate && input.existingInterestRate < 5 ? 25 : 0) + (rentSpread > 0 ? 20 : 0) + (equityPct < .35 ? 10 : 0) + motivation + distress),
    reasons: [
      ...(input.existingInterestRate && input.existingInterestRate < 5 ? ['Existing rate may be valuable relative to replacement financing'] : []),
      ...(rentSpread > 0 ? ['Estimated rent exceeds reported existing payment'] : []),
      ...(equityPct < .35 ? ['Lower equity may make payment/terms more important than a large cash payout'] : []),
    ],
    missingFacts: [...(missingLoan ? ['current mortgage statement/payment'] : []), ...(missingRent ? ['market rent'] : []), 'loan documents and due-on-sale review', 'title/liens', 'insurance and servicing plan'],
  };

  const seller: FinanceScore = {
    strategy: 'SELLER_FINANCE',
    score: clamp((input.freeAndClear ? 55 : 20) + equityPct * 25 + motivation + distress),
    reasons: [
      ...(input.freeAndClear ? ['Free-and-clear property is a strong seller-finance candidate'] : []),
      ...(equityPct > .5 ? ['Seller has substantial equity that may support carried terms'] : []),
    ],
    missingFacts: ['seller desired down payment', 'acceptable monthly payment/interest', 'term and balloon preference', 'title/liens', 'state/federal compliance review'],
  };

  const hybrid: FinanceScore = {
    strategy: 'HYBRID',
    score: clamp(30 + (!input.freeAndClear && loan > 0 ? 20 : 0) + (equityPct > .15 ? 15 : 0) + motivation + distress + (rentSpread > 0 ? 10 : 0)),
    reasons: ['Can combine existing debt, seller-carried equity, and/or acquisition capital', ...(equity > 0 && loan > 0 ? ['Property has both existing debt and seller equity to structure'] : [])],
    missingFacts: [...(missingLoan ? ['mortgage details'] : []), 'seller cash requirement', 'seller willingness to carry equity', 'title/liens', 'closing/compliance review'],
  };

  return [cash, subto, seller, hybrid].sort((a, b) => b.score - a.score);
}

export function bestCreativeFinanceStrategy(input: PropertyFinanceInput) {
  const scores = scoreCreativeFinance(input);
  return { best: scores[0], scores };
}
