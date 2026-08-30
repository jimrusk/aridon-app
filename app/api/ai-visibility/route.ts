import { NextRequest, NextResponse } from 'next/server';
import { ingestPublicWebsite } from '../../../lib/websiteIngestion';
import { buildAIVisibilityReport } from '../../../lib/aiVisibilityEngine';
import { getServerClient } from '../../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };

function cleanUrl(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, 500) : '';
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json().catch(() => ({}));
    const website = cleanUrl(body?.website);
    const competitors = Array.isArray(body?.competitors)
      ? [...new Set(body.competitors.map(cleanUrl).filter(Boolean))].slice(0, 3)
      : [];

    if (!website) {
      return NextResponse.json({ error: 'Enter a public business website to scan.' }, { status: 400, headers: NO_STORE });
    }

    const primary = await ingestPublicWebsite(website);
    const competitorSettled = await Promise.allSettled(competitors.map((url) => ingestPublicWebsite(url)));
    const competitorInputs = competitorSettled.flatMap((item) => item.status === 'fulfilled' ? [item.value] : []);
    const competitorErrors = competitorSettled.flatMap((item, index) => item.status === 'rejected'
      ? [{ website: competitors[index], error: item.reason instanceof Error ? item.reason.message : 'Competitor scan failed.' }]
      : []);

    const report = buildAIVisibilityReport(primary, competitorInputs);
    let runId: string | null = null;
    let history: Array<{ created_at: string; overall_score: number; citation_readiness: number; answer_coverage: number }> = [];

    try {
      const db = getServerClient();
      const normalizedWebsite = primary.canonicalUrl;
      const { data: prior } = await db
        .from('ai_visibility_runs')
        .select('created_at,overall_score,citation_readiness,answer_coverage')
        .eq('website', normalizedWebsite)
        .order('created_at', { ascending: false })
        .limit(5);
      history = Array.isArray(prior) ? prior : [];

      const { data, error } = await db
        .from('ai_visibility_runs')
        .insert({
          website: normalizedWebsite,
          brand_name: report.site.brandName,
          overall_score: report.site.scores.overall,
          search_readiness: report.site.scores.searchReadiness,
          ai_readiness: report.site.scores.aiReadiness,
          citation_readiness: report.site.scores.citationReadiness,
          answer_coverage: report.site.scores.answerCoverage,
          competitors: report.competitors,
          report,
        })
        .select('id')
        .single();
      if (error) throw error;
      runId = data?.id || null;
    } catch (error) {
      console.error('AI visibility persistence failed', error);
    }

    return NextResponse.json({
      ok: true,
      runId,
      history,
      competitorErrors,
      ...report,
    }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('AI visibility scan failed', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Aridon could not complete the AI visibility scan.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
