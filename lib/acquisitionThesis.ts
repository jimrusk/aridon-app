import type { AcquisitionLeadInput } from './acquisitionPipeline';

export type AcquisitionThesisCriteria = {
  industries?: string;
  geographies?: string;
  min_revenue?: number;
  max_revenue?: number;
  min_ebitda?: number;
  max_price?: number;
  max_multiple?: number;
  min_recurring_revenue_pct?: number;
  max_top_customer_pct?: number;
  max_owner_dependency_pct?: number;
  max_capex_pct?: number;
  required_seller_finance_pct?: number;
  preferred_traits?: string;
  exclusion_traits?: string;
};

const clamp=(v:number)=>Math.min(100,Math.max(0,Number.isFinite(v)?v:0));
const list=(v?:string)=>String(v||'').toLowerCase().split(/[,;\n]/).map(x=>x.trim()).filter(Boolean);
const includesAny=(text:string,targets:string[])=>targets.length===0||targets.some(t=>text.toLowerCase().includes(t));

export function scoreAgainstThesis(lead:AcquisitionLeadInput, criteria:AcquisitionThesisCriteria){
  const notes:string[]=[];
  let score=100;
  const industries=list(criteria.industries);
  const geos=list(criteria.geographies);
  if(industries.length && !includesAny(lead.industry||'',industries)){score-=22;notes.push('Industry is outside the stated acquisition thesis.');}
  const location=`${lead.city||''} ${lead.state||''}`.trim();
  if(geos.length && location && !includesAny(location,geos)){score-=14;notes.push('Geography is outside the preferred acquisition footprint.');}
  const revenue=Number(lead.estimated_revenue)||0;
  const ebitda=Number(lead.estimated_ebitda)||0;
  const price=Number(lead.asking_price)||0;
  const multiple=ebitda>0&&price>0?price/ebitda:0;
  if(criteria.min_revenue&&revenue&&revenue<criteria.min_revenue){score-=14;notes.push('Revenue is below the thesis minimum.');}
  if(criteria.max_revenue&&revenue&&revenue>criteria.max_revenue){score-=8;notes.push('Revenue is above the thesis target range.');}
  if(criteria.min_ebitda&&ebitda&&ebitda<criteria.min_ebitda){score-=18;notes.push('EBITDA/SDE is below the thesis minimum.');}
  if(criteria.max_price&&price&&price>criteria.max_price){score-=18;notes.push('Asking price exceeds the thesis price ceiling.');}
  if(criteria.max_multiple&&multiple&&multiple>criteria.max_multiple){score-=18;notes.push(`Asking multiple ${multiple.toFixed(2)}x exceeds the thesis ceiling.`);}
  if(criteria.required_seller_finance_pct&&Number(lead.seller_finance_willingness||0)<criteria.required_seller_finance_pct){score-=12;notes.push('Seller-finance willingness is below the preferred thesis level.');}
  const exclusions=list(criteria.exclusion_traits);
  const haystack=`${lead.reason_for_sale||''} ${lead.notes||''}`.toLowerCase();
  if(exclusions.some(x=>x.length>3&&haystack.includes(x))){score-=35;notes.push('Lead text contains a stated thesis exclusion/red flag.');}
  if(!revenue)notes.push('Revenue is missing, so thesis fit is provisional.');
  if(!ebitda)notes.push('EBITDA/SDE is missing, so thesis fit is provisional.');
  return {score:Math.round(clamp(score)),notes};
}
