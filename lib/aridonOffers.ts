export const ARIDON_OFFERS={
 revenueRecovery:{name:'Aridon Revenue Recovery',promise:'Find money already being left behind.',lanes:['revenue','retention','time']},
 farmProfit:{name:'Aridon Farm Profit Check',promise:'Find where farm profit is leaking and what to do next.',lanes:['ag','cost','revenue','risk','time']},
 businessRescue:{name:'Aridon Business Rescue',promise:'Preserve cash, customers, inventory and enterprise value before it disappears.',lanes:['revenue','inventory','retention','cost','risk']}
} as const;
export type OfferKey=keyof typeof ARIDON_OFFERS;
export function offerFor(kind:'business'|'farm'|'distress'):OfferKey { return kind==='farm'?'farmProfit':kind==='distress'?'businessRescue':'revenueRecovery'; }
