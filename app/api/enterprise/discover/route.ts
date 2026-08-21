import { NextRequest, NextResponse } from 'next/server';
import { buildBusinessContextMap, discoverWorkflows, SystemConnection } from '@/lib/systemDiscovery';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const systems: SystemConnection[] = Array.isArray(body?.systems) ? body.systems : [];
    const workflows = discoverWorkflows(systems);
    return NextResponse.json({
      companyName: String(body?.companyName || 'Company'),
      discoveredAt: new Date().toISOString(),
      contextMap: buildBusinessContextMap(systems),
      workflows,
      summary: `${workflows.length} cross-system workflows discovered from ${systems.filter(s => s.status === 'connected').length} connected systems.`
    });
  } catch {
    return NextResponse.json({ error: 'Unable to discover workflows.' }, { status: 400 });
  }
}
