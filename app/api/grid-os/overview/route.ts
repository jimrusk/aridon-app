import { NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    const supabase = getServerClient();
    const { data: utility, error: utilityError } = await supabase
      .from('grid_os_utilities')
      .select('id,name,utility_type,region,demo,created_at')
      .eq('demo', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (utilityError) throw utilityError;
    if (!utility) {
      return NextResponse.json({ ok: true, mode: 'demo', utility: null, metrics: [], recommendations: [], findings: [], integrations: [] }, { headers: NO_STORE });
    }

    const [metricsResult, recommendationsResult, findingsResult, integrationsResult] = await Promise.all([
      supabase.from('grid_os_metrics').select('metric_key,value,unit,source,is_demo,captured_at').eq('utility_id', utility.id).order('captured_at', { ascending: false }),
      supabase.from('grid_os_recommendations').select('id,category,title,description,expected_impact,estimated_annual_value,priority,status,requires_human_approval,created_at').eq('utility_id', utility.id).order('created_at', { ascending: true }),
      supabase.from('grid_os_security_findings').select('id,severity,title,description,status,detected_at').eq('utility_id', utility.id).order('detected_at', { ascending: false }),
      supabase.from('grid_os_integrations').select('id,integration_type,provider,status,read_only,updated_at').eq('utility_id', utility.id).order('integration_type', { ascending: true }),
    ]);

    if (metricsResult.error) throw metricsResult.error;
    if (recommendationsResult.error) throw recommendationsResult.error;
    if (findingsResult.error) throw findingsResult.error;
    if (integrationsResult.error) throw integrationsResult.error;

    const latestMetric = new Map<string, unknown>();
    for (const row of metricsResult.data ?? []) {
      if (!latestMetric.has(row.metric_key)) latestMetric.set(row.metric_key, row);
    }

    return NextResponse.json({
      ok: true,
      mode: 'database-demo',
      utility,
      metrics: Array.from(latestMetric.values()),
      recommendations: recommendationsResult.data ?? [],
      findings: findingsResult.data ?? [],
      integrations: integrationsResult.data ?? [],
    }, { headers: NO_STORE });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GridOS overview unavailable';
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: NO_STORE });
  }
}
