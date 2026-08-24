export type TwinKind = 'business' | 'farm';
export type TwinEntityType = 'customer'|'employee'|'product'|'service'|'lead'|'job'|'inventory'|'vendor'|'equipment'|'location'|'contract'|'cash'|'marketing'|'risk'|'field'|'crop'|'livestock'|'water'|'soil'|'weather'|'input'|'buyer';
export type TwinEntity = { id:string; type:TwinEntityType; name:string; attributes:Record<string,unknown>; updatedAt:string };
export type TwinRelation = { from:string; to:string; type:string; weight?:number; evidenceIds?:string[] };
export type DigitalTwin = { tenantId:string; kind:TwinKind; entities:TwinEntity[]; relations:TwinRelation[]; version:number; updatedAt:string };
export function upsertEntity(twin:DigitalTwin, entity:TwinEntity):DigitalTwin { const entities=twin.entities.filter(x=>x.id!==entity.id); entities.push(entity); return {...twin,entities,version:twin.version+1,updatedAt:new Date().toISOString()}; }
export function relate(twin:DigitalTwin, relation:TwinRelation):DigitalTwin { return {...twin,relations:[...twin.relations,relation],version:twin.version+1,updatedAt:new Date().toISOString()}; }
