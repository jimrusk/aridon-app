export type Workload='analysis'|'extraction'|'recommendation'|'verification'|'fast';
export type ModelChoice={provider:'openai';model:string;reason:string};
const defaults:Record<Workload,string>={analysis:'gpt-5.6',extraction:'gpt-5.6',recommendation:'gpt-5.6',verification:'gpt-5.6',fast:'gpt-5.6'};
export function routeModel(workload:Workload, allowedModels?:string[]):ModelChoice { const preferred=defaults[workload]; const model=!allowedModels?.length||allowedModels.includes(preferred)?preferred:allowedModels[0]; if(!model) throw new Error('No approved model available'); return {provider:'openai',model,reason:`approved:${workload}`}; }
export function lineage(choice:ModelChoice,runId:string,promptConfigVersion:string,calculationVersion:string){return{engineVersion:'v2.1.0-enterprise' as const,modelProvider:choice.provider,model:choice.model,promptConfigVersion,calculationVersion,runId};}
