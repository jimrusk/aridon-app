import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function validPublicUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')) return null;
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return null;
    return url;
  } catch {
    return null;
  }
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleFromHtml(html: string) {
  return (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').trim().slice(0, 180);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawUrl = typeof body?.url === 'string' ? body.url.trim().slice(0, 1600) : '';
    const url = validPublicUrl(rawUrl);
    if (!url) return NextResponse.json({ error: 'Enter a valid public http/https business or listing URL.' }, { status: 400, headers: NO_STORE });

    const response = await fetch(url.toString(), {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AridonAcquisitionResearch/1.0)' },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return NextResponse.json({ error: `The source returned HTTP ${response.status}.` }, { status: 400, headers: NO_STORE });
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html') && !type.includes('text/plain')) return NextResponse.json({ error: 'That source is not a readable web page.' }, { status: 400, headers: NO_STORE });
    const html = (await response.text()).slice(0, 800000);
    const pageTitle = titleFromHtml(html);
    const text = stripHtml(html).slice(0, 24000);

    let extracted: any = {
      business_name: pageTitle.replace(/\s*[|–—-].*$/, '').slice(0, 180),
      website: url.origin,
      source_url: url.toString(),
      source_type: 'public_url',
      industry: '', city: '', state: '', seller_name: '', seller_email: '', seller_phone: '',
      asking_price: 0, estimated_revenue: 0, estimated_ebitda: 0, listing_age_days: 0,
      reason_for_sale: '', seller_priorities: '', notes: `Imported from ${url.hostname}. Verify all listing facts before relying on them.`,
      evidence: [],
    };

    if (process.env.OPENAI_API_KEY && text) {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.1,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Extract only facts explicitly supported by the supplied business listing/webpage text. Never guess missing numbers, owner identity, motivation, location, or contact details. Return JSON fields business_name, website, industry, city, state, seller_name, seller_email, seller_phone, asking_price, estimated_revenue, estimated_ebitda, listing_age_days, reason_for_sale, seller_priorities, notes, evidence. Use 0 or empty string when unknown. evidence must be a short array of fact summaries, not quotes.' },
          { role: 'user', content: JSON.stringify({ source_url: url.toString(), page_title: pageTitle, page_text: text }) },
        ],
      });
      try {
        const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
        extracted = { ...extracted, ...parsed, source_url: url.toString(), source_type: 'public_url' };
      } catch {
        console.error('Acquisition discover parse error; returning basic page metadata');
      }
    }

    return NextResponse.json({ extracted, source: { url: url.toString(), title: pageTitle } }, { headers: NO_STORE });
  } catch (error) {
    console.error('Acquisition discover error', error);
    return NextResponse.json({ error: 'Unable to inspect that listing right now.' }, { status: 500, headers: NO_STORE });
  }
}
