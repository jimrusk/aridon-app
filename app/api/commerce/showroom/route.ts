import { NextRequest, NextResponse } from 'next/server';
import { getUserScopedClient } from '../../../../lib/supabase';
import { customerTenantForUser } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
export const maxDuration = 60;
const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };
const RESPONSES_URL = 'https://api.openai.com/v1/responses';

type Payload = { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }>; error?: { message?: string } };
function text(value: unknown, max = 1800) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function extractText(data: Payload) { if (data.output_text?.trim()) return data.output_text.trim(); return (data.output || []).flatMap(x => x.content || []).filter(x => x.type === 'output_text' && typeof x.text === 'string').map(x => x.text as string).join('\n\n').trim(); }
function parseJson(raw: string) { const clean = raw.replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/i,'').trim(); const first = clean.indexOf('{'); const last = clean.lastIndexOf('}'); if (first < 0 || last < first) throw new Error('Showroom generator returned no JSON.'); return JSON.parse(clean.slice(first, last + 1)); }

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization') || '';
    if (!authorization.startsWith('Bearer ')) return NextResponse.json({ error: 'Sign in to generate and save a showroom.' }, { status: 401, headers: NO_STORE });
    const token = authorization.slice(7).trim();
    const db = getUserScopedClient(token);
    const { data: userData, error: userError } = await db.auth.getUser(token);
    if (userError || !userData.user) return NextResponse.json({ error: 'Your Aridon session has expired.' }, { status: 401, headers: NO_STORE });
    const body = await request.json();
    const niche = text(body?.niche, 250) || 'high-ticket equipment';
    const slug = text(body?.slug, 80) || undefined;
    const membership = await customerTenantForUser(userData.user.id, slug, token);
    if (!membership) return NextResponse.json({ error: 'No Aridon workspace is available for this account.' }, { status: 403, headers: NO_STORE });
    const tenantId = membership.tenant.id;

    const [supplierResult, productResult] = await Promise.all([
      db.from('commerce_suppliers').select('id,name,website,status,score,why_fit').eq('tenant_id', tenantId).eq('status','Approved').order('score',{ascending:false}).limit(12),
      db.from('commerce_products').select('id,supplier_id,sku,title,product_url,supplier_cost,selling_price,map_price,availability,warranty,status').eq('tenant_id', tenantId).in('status',['Verified','Live']).limit(30),
    ]);
    if (supplierResult.error) throw supplierResult.error;
    if (productResult.error) throw productResult.error;
    const suppliers = supplierResult.data || [];
    const products = productResult.data || [];

    const fallback = {
      headline: `A clearer way to buy ${niche}`,
      subheadline: 'Compare verified options, understand delivery and warranty details, and request help before making a high-value purchase.',
      sections: [
        { type:'hero', title:`Shop ${niche} with real decision support`, body:'Start with your requirements, budget, location and timing. Aridon helps narrow the right verified options.', cta:'Request a quote' },
        { type:'buyer-guide', title:'Choose the right configuration', body:'Sizing, installation, operating requirements, freight and service can matter as much as sticker price.', cta:'Use the buyer guide' },
        { type:'trust', title:'Verified before promoted', body:'Dealer status, supplier terms, pricing, warranty and availability remain clearly marked until evidence is recorded.', cta:'See verification standards' },
      ],
    };

    let generated = fallback;
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (apiKey) {
      const model = process.env.OPENAI_COMMERCE_MODEL?.trim() || process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || 'gpt-5.6';
      const prompt = `You are Aridon's premium showroom builder. Create concise, high-trust storefront copy for ${membership.tenant.business_name} in the niche ${niche}. Use ONLY the supplier and product facts provided below. Never invent availability, discounts, authorization, certifications, performance, warranty terms, prices, financing, delivery dates, reviews or inventory. Products that are absent from the verified list must not be presented as available.\n\nAPPROVED SUPPLIERS\n${JSON.stringify(suppliers)}\n\nVERIFIED/LIVE PRODUCTS\n${JSON.stringify(products)}\n\nReturn ONLY JSON: {"headline":"...","subheadline":"...","sections":[{"type":"hero|featured|comparison|buyer-guide|trust|quote","title":"...","body":"...","cta":"..."}]}. Create 5-7 sections. Make it consultative and useful, not hype-heavy.`;
      const response = await fetch(RESPONSES_URL, { method:'POST', headers:{ Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json' }, body:JSON.stringify({ model, input:prompt, max_output_tokens:2600, store:false }), cache:'no-store' });
      const raw = (await response.json()) as Payload;
      if (response.ok) {
        try {
          const parsed = parseJson(extractText(raw));
          generated = {
            headline: text(parsed?.headline, 220) || fallback.headline,
            subheadline: text(parsed?.subheadline, 600) || fallback.subheadline,
            sections: Array.isArray(parsed?.sections) ? parsed.sections.slice(0,8).map((s:any)=>({ type:text(s?.type,40)||'section', title:text(s?.title,220), body:text(s?.body,1200), cta:text(s?.cta,120) })).filter((s:any)=>s.title && s.body) : fallback.sections,
          };
        } catch {}
      }
    }

    const record = {
      tenant_id: tenantId,
      created_by: userData.user.id,
      name: `${niche} Showroom`,
      niche,
      headline: generated.headline,
      subheadline: generated.subheadline,
      sections: generated.sections,
      featured_product_ids: products.slice(0,8).map((p:any)=>p.id),
      status: products.length ? 'Ready' : 'Draft',
    };
    const insert = await db.from('commerce_showrooms').insert(record).select('*').single();
    if (insert.error) throw insert.error;
    return NextResponse.json({ showroom: insert.data, approvedSuppliers: suppliers.length, verifiedProducts: products.length }, { headers: NO_STORE });
  } catch (error) {
    console.error('commerce showroom generation failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Showroom generation failed.' }, { status: 500, headers: NO_STORE });
  }
}