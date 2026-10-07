export type OutcomeMetric = 'revenue'|'qualified_lead'|'partnership'|'funding'|'pilot'|'deployment'|'hours_saved';
export type WorkstreamStatus = 'queued'|'running'|'blocked'|'verified'|'failed';
export type Workstream = { id:string; missionId:string; owner:string; objective:string; status:WorkstreamStatus; costUsd:number; startedAt?:string; completedAt?:string; evidence?:string[]; metric?:OutcomeMetric; outcomeValue?:number; blocker?:string };
export type Mission = { id:string; objective:string; workstreams:Workstream[]; budgetUsd:number; approvalRequired:boolean };

export function outcomeScore(m: Mission){
  const verified=m.workstreams.filter(w=>w.status==='verified');
  const spend=m.workstreams.reduce((n,w)=>n+(w.costUsd||0),0);
  const weighted=verified.reduce((n,w)=>n+({revenue:10,qualified_lead:2,partnership:5,funding:10,pilot:6,deployment:7,hours_saved:1}[w.metric||'hours_saved']*(w.outcomeValue||1)),0);
  return {verifiedOutcomes:verified.length, spendUsd:spend, outcomePerDollar:spend>0?weighted/spend:weighted, blocked:m.workstreams.filter(w=>w.status==='blocked'), failed:m.workstreams.filter(w=>w.status==='failed')};
}

export function nextActions(m: Mission){
  return m.workstreams.filter(w=>w.status==='queued'||w.status==='blocked'||w.status==='failed').sort((a,b)=>{
    const rank=(w:Workstream)=>w.status==='failed'?0:w.status==='blocked'?1:2;
    return rank(a)-rank(b);
  });
}

export const EVA_EXECUTION_POLICY = {
  loop:['objective','decompose','delegate','execute','verify','measure','repair-or-adjust','repeat'],
  parallel:true,
  verificationRequired:true,
  rules:[
    'Never count an external action as complete without execution evidence.',
    'Prefer parallel independent workstreams over serial waiting.',
    'A failed workstream becomes a repair/adjust workstream; do not silently stop.',
    'Optimize verified outcomes per dollar, not token volume.',
    'Escalate consequential or irreversible actions for owner approval.',
    'Preserve mission state, evidence, blockers, costs and outcomes for the next cycle.'
  ]
} as const;
