import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../../lib/supabase';
import { acquisitionGovernancePlan, preliminaryFinancingPaths, purchasePriceAllocationCheck, riskTransferChecklist } from '../../../../../lib/acquisitionDecisionSupport';

export const dynamic='force-dynamic';
export const runtime='nodejs';
const NO_STORE={'Cache-Control':'no-store'};
const obj=(v:unknown)=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};

export async function POST(request:NextRequest,{params}:{params:{id:string}}){
 try{
  if(!request.headers.get('content-type')?.includes('application/json')) return NextResponse.json({error:'Content-Type must be application/json.'},{status:415,headers:NO_STORE});
  const body=await request.json();
  const db=getServerClient();
  const {data:lead,error}=await db.from('acquisition_leads').select('id,business_name,asking_price,estimated_ebitda,cash_available,lender_capacity,seller_finance_willingness').eq('id',params.id).single();
  if(error)throw error;
  const financingInput={purchase_price:Number(body?.financing?.purchase_price??lead.asking_price)||0,buyer_cash:Number(body?.financing?.buyer_cash??lead.cash_available)||0,seller_note:Number(body?.financing?.seller_note)||0,earnout:Number(body?.financing?.earnout)||0,normalized_free_cash_flow:Number(body?.financing?.normalized_free_cash_flow)||0,annual_debt_service:Number(body?.financing?.annual_debt_service)||0,requested_sba_loan:Number(body?.financing?.requested_sba_loan)||0,operating_business_eligible:body?.financing?.operating_business_eligible!==false};
  const allocationInput={purchase_price:Number(body?.allocation?.purchase_price??lead.asking_price)||0,...obj(body?.allocation)} as any;
  const riskInput=obj(body?.risk_transfer) as any;
  const result={financing:preliminaryFinancingPaths(financingInput),allocation:purchasePriceAllocationCheck(allocationInput),governance:acquisitionGovernancePlan(),risk_transfer:riskTransferChecklist(riskInput)};
  await db.from('acquisition_timeline').insert({lead_id:params.id,event_type:'decision_support',event_title:'Financing / structure support refreshed',event_detail:`${lead.business_name}: preliminary capital-stack, allocation consistency, governance and risk-transfer checks refreshed.`,created_by:'Aridon 3'});
  return NextResponse.json(result,{headers:NO_STORE});
 }catch(error){console.error('Acquisition decision support error',error);return NextResponse.json({error:'Unable to run acquisition decision support.'},{status:500,headers:NO_STORE});}
}
