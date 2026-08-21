import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';
import { calculateVpdKpa, evaluateReading, getTargetProfile, greenhouseHealthScore } from '../../../../lib/greenhouse';

export const dynamic='force-dynamic';
export const runtime='nodejs';
const NO_STORE={'Cache-Control':'no-store'};

const text=(v:unknown,max=4000)=>typeof v==='string'?v.trim().slice(0,max):'';
const num=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)?n:null};
const dateText=(v:unknown)=>{const s=text(v,40);return /^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(0,10):null};
const isoText=(v:unknown)=>{const s=text(v,80);if(!s)return null;const d=new Date(s);return Number.isNaN(d.getTime())?null:d.toISOString()};

export async function GET(request:NextRequest){
  try{
    const db=getServerClient();
    const requestedFacility=text(request.nextUrl.searchParams.get('facility_id'),80);
    const {data:facilities,error:facilityError}=await db.from('greenhouse_facilities').select('*').eq('active',true).order('updated_at',{ascending:false}).limit(100);
    if(facilityError)throw facilityError;
    const facility=(facilities??[]).find((x:any)=>x.id===requestedFacility)??(facilities??[])[0]??null;
    if(!facility)return NextResponse.json({facilities:[],facility:null,zones:[],activities:[],harvests:[],tasks:[],alerts:[],summary:{zones:0,plants:0,health:0,activeAlerts:0,criticalAlerts:0,irrigationGallons24h:0,marketableLb30d:0,laborHours30d:0,inputCost30d:0}},{headers:NO_STORE});

    const {data:zones,error:zoneError}=await db.from('greenhouse_zones').select('*').eq('facility_id',facility.id).eq('active',true).order('name');
    if(zoneError)throw zoneError;
    const zoneIds=(zones??[]).map((z:any)=>z.id);
    let readings:any[]=[];let activities:any[]=[];let harvests:any[]=[];let tasks:any[]=[];
    if(zoneIds.length){
      const since30=new Date(Date.now()-30*24*60*60*1000).toISOString().slice(0,10);
      const [r,a,h,t]=await Promise.all([
        db.from('greenhouse_readings').select('*').in('zone_id',zoneIds).order('recorded_at',{ascending:false}).limit(1000),
        db.from('greenhouse_activities').select('*').in('zone_id',zoneIds).order('activity_date',{ascending:false}).limit(250),
        db.from('greenhouse_harvests').select('*').in('zone_id',zoneIds).gte('harvest_date',since30).order('harvest_date',{ascending:false}).limit(250),
        db.from('greenhouse_tasks').select('*').eq('facility_id',facility.id).in('status',['open','in_progress','blocked']).order('due_at',{ascending:true}).limit(200),
      ]);
      if(r.error)throw r.error;if(a.error)throw a.error;if(h.error)throw h.error;if(t.error)throw t.error;
      readings=r.data??[];activities=a.data??[];harvests=h.data??[];tasks=t.data??[];
    }

    const latest=new Map<string,any>();
    for(const row of readings)if(!latest.has(row.zone_id))latest.set(row.zone_id,row);
    const now=Date.now();
    const enriched=(zones??[]).map((zone:any)=>{
      const reading=latest.get(zone.id)??null;
      const age=reading?Math.max(0,(now-new Date(reading.recorded_at).getTime())/3600000):null;
      const target=zone.target_profile&&Object.keys(zone.target_profile).length?zone.target_profile:getTargetProfile(zone.crop);
      const readingAlerts=evaluateReading(reading,target);
      const staleAlert=age===null?{level:'warning',parameter:'reading',message:'No crop-environment reading has been recorded yet.'}:age>24?{level:'critical',parameter:'reading',message:`Last crop reading is ${Math.round(age)} hours old.`}:age>12?{level:'warning',parameter:'reading',message:`Last crop reading is ${Math.round(age)} hours old.`}:null;
      const alerts=staleAlert?[...readingAlerts,staleAlert]:readingAlerts;
      return {...zone,target_profile:target,latest_reading:reading,reading_age_hours:age,alerts,health_score:greenhouseHealthScore(alerts as any,age)};
    });
    const alerts=enriched.flatMap((zone:any)=>zone.alerts.map((alert:any)=>({...alert,zone_id:zone.id,zone_name:zone.name,crop:zone.crop})));
    const since24=now-24*60*60*1000;
    const irrigationGallons24h=readings.filter((r:any)=>new Date(r.recorded_at).getTime()>=since24).reduce((s:number,r:any)=>s+Number(r.irrigation_gallons||0),0);
    const marketableLb30d=harvests.reduce((s:number,h:any)=>s+Number(h.marketable_lb||0),0);
    const laborHours30d=activities.reduce((s:number,a:any)=>s+Number(a.labor_hours||0),0)+harvests.reduce((s:number,h:any)=>s+Number(h.labor_hours||0),0);
    const inputCost30d=activities.reduce((s:number,a:any)=>s+Number(a.cost||0),0);
    const health=enriched.length?Math.round(enriched.reduce((s:number,z:any)=>s+Number(z.health_score||0),0)/enriched.length):0;
    return NextResponse.json({facilities:facilities??[],facility,zones:enriched,activities,harvests,tasks,alerts,summary:{zones:enriched.length,plants:enriched.reduce((s:number,z:any)=>s+Number(z.plant_count||0),0),health,activeAlerts:alerts.length,criticalAlerts:alerts.filter((a:any)=>a.level==='critical').length,irrigationGallons24h,marketableLb30d,laborHours30d,inputCost30d}},{headers:NO_STORE});
  }catch(error){console.error('Greenhouse GET error',error);return NextResponse.json({error:'Unable to load greenhouse records.'},{status:500,headers:NO_STORE});}
}

export async function POST(request:NextRequest){
  try{
    if(!request.headers.get('content-type')?.includes('application/json'))return NextResponse.json({error:'Content-Type must be application/json.'},{status:415,headers:NO_STORE});
    const body=await request.json();const action=text(body?.action,40);const db=getServerClient();
    if(action==='facility'){
      const name=text(body?.name,160);if(!name)return NextResponse.json({error:'Greenhouse name is required.'},{status:400,headers:NO_STORE});
      const {data,error}=await db.from('greenhouse_facilities').insert({name,location:text(body?.location,240),structure_type:text(body?.structure_type,80)||'greenhouse',area_sqft:num(body?.area_sqft)??0,growing_system:text(body?.growing_system,80)||'mixed',notes:text(body?.notes)}).select('*').single();if(error)throw error;return NextResponse.json(data,{status:201,headers:NO_STORE});
    }
    if(action==='zone'){
      const facility_id=text(body?.facility_id,80),name=text(body?.name,120),crop=text(body?.crop,120);if(!facility_id||!name)return NextResponse.json({error:'Facility and zone name are required.'},{status:400,headers:NO_STORE});
      const target=body?.target_profile&&typeof body.target_profile==='object'?body.target_profile:getTargetProfile(crop);
      const {data,error}=await db.from('greenhouse_zones').insert({facility_id,name,crop,variety:text(body?.variety,120),growth_stage:text(body?.growth_stage,60)||'planning',planting_date:dateText(body?.planting_date),target_harvest_date:dateText(body?.target_harvest_date),plant_count:Math.max(0,Math.round(num(body?.plant_count)??0)),area_sqft:Math.max(0,num(body?.area_sqft)??0),growing_system:text(body?.growing_system,80)||'soil',substrate:text(body?.substrate,120),irrigation_method:text(body?.irrigation_method,120),target_profile:target,notes:text(body?.notes)}).select('*').single();if(error)throw error;return NextResponse.json(data,{status:201,headers:NO_STORE});
    }
    if(action==='reading'){
      const facility_id=text(body?.facility_id,80),zone_id=text(body?.zone_id,80);if(!facility_id||!zone_id)return NextResponse.json({error:'Facility and crop zone are required.'},{status:400,headers:NO_STORE});
      const temp=num(body?.air_temp_f),humidity=num(body?.humidity_pct);const enteredVpd=num(body?.vpd_kpa);const vpd=enteredVpd??(temp!==null&&humidity!==null?calculateVpdKpa(temp,humidity):null);
      const {data,error}=await db.from('greenhouse_readings').insert({facility_id,zone_id,recorded_at:isoText(body?.recorded_at)??new Date().toISOString(),source:text(body?.source,60)||'manual',air_temp_f:temp,humidity_pct:humidity,vpd_kpa:vpd,co2_ppm:num(body?.co2_ppm),ppfd_umol_m2_s:num(body?.ppfd_umol_m2_s),dli_mol_m2_day:num(body?.dli_mol_m2_day),root_zone_temp_f:num(body?.root_zone_temp_f),substrate_moisture_pct:num(body?.substrate_moisture_pct),ph:num(body?.ph),ec_ms_cm:num(body?.ec_ms_cm),irrigation_gallons:num(body?.irrigation_gallons),runoff_pct:num(body?.runoff_pct),dissolved_oxygen_mg_l:num(body?.dissolved_oxygen_mg_l),notes:text(body?.notes)}).select('*').single();if(error)throw error;return NextResponse.json(data,{status:201,headers:NO_STORE});
    }
    if(action==='activity'){
      const facility_id=text(body?.facility_id,80);if(!facility_id)return NextResponse.json({error:'Facility is required.'},{status:400,headers:NO_STORE});
      const {data,error}=await db.from('greenhouse_activities').insert({facility_id,zone_id:text(body?.zone_id,80)||null,activity_date:isoText(body?.activity_date)??new Date().toISOString(),activity_type:text(body?.activity_type,80)||'note',product_or_material:text(body?.product_or_material,200),quantity:num(body?.quantity),unit:text(body?.unit,40),labor_hours:num(body?.labor_hours),cost:num(body?.cost),scout_result:text(body?.scout_result,1000),notes:text(body?.notes)}).select('*').single();if(error)throw error;return NextResponse.json(data,{status:201,headers:NO_STORE});
    }
    if(action==='harvest'){
      const facility_id=text(body?.facility_id,80),zone_id=text(body?.zone_id,80);if(!facility_id||!zone_id)return NextResponse.json({error:'Facility and crop zone are required.'},{status:400,headers:NO_STORE});
      const marketable=Math.max(0,num(body?.marketable_lb)??0),units=Math.max(0,num(body?.units_harvested)??0),price=Math.max(0,num(body?.sale_price_per_unit)??0);const revenue=Math.max(0,num(body?.revenue)??((units||marketable)*price));
      const {data,error}=await db.from('greenhouse_harvests').insert({facility_id,zone_id,harvest_date:dateText(body?.harvest_date)??new Date().toISOString().slice(0,10),marketable_lb:marketable,cull_lb:Math.max(0,num(body?.cull_lb)??0),units_harvested:units,unit_name:text(body?.unit_name,40)||'lb',sale_price_per_unit:price,revenue,labor_hours:Math.max(0,num(body?.labor_hours)??0),notes:text(body?.notes)}).select('*').single();if(error)throw error;return NextResponse.json(data,{status:201,headers:NO_STORE});
    }
    if(action==='task'){
      const facility_id=text(body?.facility_id,80),title=text(body?.title,240);if(!facility_id||!title)return NextResponse.json({error:'Facility and task title are required.'},{status:400,headers:NO_STORE});
      const priority=['low','medium','high','critical'].includes(text(body?.priority,20))?text(body?.priority,20):'medium';
      const {data,error}=await db.from('greenhouse_tasks').insert({facility_id,zone_id:text(body?.zone_id,80)||null,title,task_type:text(body?.task_type,80)||'crop',priority,due_at:isoText(body?.due_at),assigned_to:text(body?.assigned_to,120),notes:text(body?.notes)}).select('*').single();if(error)throw error;return NextResponse.json(data,{status:201,headers:NO_STORE});
    }
    return NextResponse.json({error:'Unknown greenhouse action.'},{status:400,headers:NO_STORE});
  }catch(error){console.error('Greenhouse POST error',error);return NextResponse.json({error:'Unable to save greenhouse record.'},{status:500,headers:NO_STORE});}
}

export async function PATCH(request:NextRequest){
  try{
    const body=await request.json();const kind=text(body?.kind,20),id=text(body?.id,80);if(!id)return NextResponse.json({error:'Record ID is required.'},{status:400,headers:NO_STORE});const db=getServerClient();
    if(kind==='task'){
      const patch:Record<string,unknown>={updated_at:new Date().toISOString()};const status=text(body?.status,30);if(['open','in_progress','done','blocked'].includes(status))patch.status=status;const priority=text(body?.priority,20);if(['low','medium','high','critical'].includes(priority))patch.priority=priority;if(body?.due_at!==undefined)patch.due_at=isoText(body.due_at);if(body?.assigned_to!==undefined)patch.assigned_to=text(body.assigned_to,120);const {data,error}=await db.from('greenhouse_tasks').update(patch).eq('id',id).select('*').single();if(error)throw error;return NextResponse.json(data,{headers:NO_STORE});
    }
    if(kind==='zone'){
      const patch:Record<string,unknown>={updated_at:new Date().toISOString()};if(body?.growth_stage!==undefined)patch.growth_stage=text(body.growth_stage,60);if(body?.plant_count!==undefined)patch.plant_count=Math.max(0,Math.round(num(body.plant_count)??0));if(body?.target_harvest_date!==undefined)patch.target_harvest_date=dateText(body.target_harvest_date);if(body?.notes!==undefined)patch.notes=text(body.notes);const {data,error}=await db.from('greenhouse_zones').update(patch).eq('id',id).select('*').single();if(error)throw error;return NextResponse.json(data,{headers:NO_STORE});
    }
    return NextResponse.json({error:'Unknown record kind.'},{status:400,headers:NO_STORE});
  }catch(error){console.error('Greenhouse PATCH error',error);return NextResponse.json({error:'Unable to update greenhouse record.'},{status:500,headers:NO_STORE});}
}
