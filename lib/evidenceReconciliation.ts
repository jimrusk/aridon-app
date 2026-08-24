import type { ValueOpportunity } from './valueEngine';
export type ReconciliationInput={transactionAmount:number;baselineAmount?:number;evidenceIds:string[];verifiedBy:string;verifiedAt:string};
export function reconcileValue(item:ValueOpportunity,input:ReconciliationInput):ValueOpportunity { if(!input.evidenceIds.length) throw new Error('Evidence is required to verify value'); if(item.state!=='observed') throw new Error('Only observed opportunities can be verified'); const verified=Math.max(0,input.transactionAmount-(input.baselineAmount||0)); return {...item,state:'verified',verifiedValue:verified,updatedAt:input.verifiedAt}; }
export function evidenceComplete(item:ValueOpportunity){return item.evidence.length>0 && item.evidence.every(e=>Boolean(e.id&&e.source&&e.capturedAt));}
