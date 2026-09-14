import { NextRequest, NextResponse } from 'next/server';
import { cronRequestAuthorized, operatorRequestAuthorized } from '../../../../lib/operatorAuth';
import { getServerClient } from '../../../../lib/supabase';
import { researchScoutProspects, websiteDomain } from '../../../../lib/scoutProspecting';

export const runtime = 'nodejs';
export const maxDuration = 300;

const NO_STORE = { 'Cache-Control': 'no-store' };

function nextRun(cadence: string) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + (cadence === 'weekly' ? 7 : 1));
  return date.toISOString();
}

export async function GET(request: NextRequest) {
  if (!cronRequestAuthorized(request) && !operatorRequestAuthorized(request)) {
    return NextResponse.json({ error: 'Scout Prospecting authorization required.' }, { status: 401, headers: NO_STORE });
  }

  const db = getServerClient();
  const now = new Date().toISOString();

  try {
    const { data: watches, error: watchError } = await db
      .from('customer_sales_watches')
      .select('*')
      .eq('active', true)
      .neq('cadence', 'manual')
      .or(`next_run_at.is.null,next_run_at.lte.${now}`)
      .order('next_run_at', { ascending: true, nullsFirst: true })
      .limit(3);

    if (watchError) throw watchError;
    const results: Array<Record<string, unknown>> = [];

    for (const watch of watches || []) {
      try {
        const [tenantResult, profileResult, existingResult] = await Promise.all([
          db.from('customer_tenants').select('id,business_name,industry').eq('id', watch.tenant_id).maybeSingle(),
          db.from('customer_sales_profiles').select('*').eq('tenant_id', watch.tenant_id).maybeSingle(),
          db.from('customer_sales_leads').select('website').eq('tenant_id', watch.tenant_id),
        ]);
        if (tenantResult.error) throw tenantResult.error;
        if (profileResult.error) throw profileResult.error;
        if (existingResult.error) throw existingResult.error;
        if (!tenantResult.data || !profileResult.data) {
          await db.from('customer_sales_watches').update({
            last_run_at: now,
            last_run_status: 'skipped_missing_profile',
            next_run_at: nextRun(watch.cadence),
            updated_at: now,
          }).eq('id', watch.id);
          results.push({ watch_id: watch.id, status: 'skipped_missing_profile' });
          continue;
        }

        const research = await researchScoutProspects({
          sellerName: tenantResult.data.business_name,
          industry: tenantResult.data.industry,
          sellerProfile: profileResult.data as Record<string, unknown>,
          count: watch.count_per_run || 10,
          focus: watch.search_focus || '',
          intent: watch.intent || 'customer',
          qualificationThreshold: watch.qualification_threshold || 75,
          requiredSignals: Array.isArray(watch.required_signals) ? watch.required_signals : [],
          exclusions: Array.isArray(watch.exclusions) ? watch.exclusions : [],
        });

        const seenDomains = new Set((existingResult.data || []).map((lead) => websiteDomain(lead.website)).filter(Boolean));
        let saved = 0;

        for (const item of research.prospects) {
          const domain = websiteDomain(item.website);
          if (domain && seenDomains.has(domain)) continue;

          const { error: insertError } = await db.from('customer_sales_leads').insert({
            tenant_id: watch.tenant_id,
            company_name: item.company_name,
            website: item.website || null,
            location: item.location || null,
            recommended_buyer_role: item.recommended_buyer_role || null,
            fit_score: item.fit_score,
            priority_tier: item.priority_tier,
            score_breakdown: item.score_breakdown,
            fit_reason: item.fit_reason || null,
            trigger_event: item.trigger_event || null,
            buying_signals: item.buying_signals,
            evidence_quality: item.score_breakdown.evidence_quality * 4,
            research_notes: item.research_notes || null,
            personalization: item.personalization || null,
            source_urls: item.source_urls,
            source_type: 'scout_recurring_watch',
            status: 'researched',
          });
          if (insertError) throw insertError;
          if (domain) seenDomains.add(domain);
          saved += 1;
        }

        await Promise.all([
          db.from('customer_sales_watches').update({
            last_run_at: now,
            last_run_status: `ok:${saved}`,
            next_run_at: nextRun(watch.cadence),
            updated_at: now,
          }).eq('id', watch.id),
          db.from('customer_sales_events').insert({
            tenant_id: watch.tenant_id,
            event_name: 'prospect_watch_ran',
            event_data: { watch_id: watch.id, saved, requested: watch.count_per_run || 10, threshold: watch.qualification_threshold || 75 },
          }),
        ]);

        results.push({ watch_id: watch.id, status: 'ok', saved });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown Scout watch error';
        await db.from('customer_sales_watches').update({
          last_run_at: now,
          last_run_status: `failed:${message.slice(0, 180)}`,
          next_run_at: nextRun(watch.cadence),
          updated_at: now,
        }).eq('id', watch.id);
        results.push({ watch_id: watch.id, status: 'failed', error: message });
      }
    }

    return NextResponse.json({ ok: true, processed: results.length, results, generated_at: now }, { headers: NO_STORE });
  } catch (error) {
    console.error('Scout recurring prospecting failed.', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Scout recurring prospecting failed.' }, { status: 500, headers: NO_STORE });
  }
}
