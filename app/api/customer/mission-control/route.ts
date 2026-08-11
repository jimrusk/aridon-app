import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });

    const slug = text(request.nextUrl.searchParams.get('slug'), 80);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });

    const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
      return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });
    }

    const tenantId = membership.tenant.id;
    const db = auth.db;
    const [projects, tasks, knowledge, files, messages] = await Promise.all([
      db.from('customer_projects').select('id,name,status,created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(40),
      db.from('customer_tasks').select('id,title,owner,priority,status,created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(80),
      db.from('customer_knowledge').select('id,title,category,created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(40),
      db.from('customer_files').select('id,filename,status,extraction_status,created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(40),
      db.from('customer_assistant_messages').select('id,role,content,web_research,created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(30),
    ]);

    const errors = [projects.error, tasks.error, knowledge.error, files.error, messages.error].filter(Boolean);
    if (errors.length) throw errors[0];

    const taskRows = tasks.data || [];
    const projectRows = projects.data || [];
    const messageRows = messages.data || [];
    const completedTasks = taskRows.filter((item) => String(item.status || '').toLowerCase().includes('complete') || String(item.status || '').toLowerCase() === 'done').length;
    const openTasks = Math.max(0, taskRows.length - completedTasks);
    const activeProjects = projectRows.filter((item) => !['complete', 'completed', 'done', 'archived'].includes(String(item.status || '').toLowerCase())).length;
    const webResearchRuns = messageRows.filter((item) => item.role === 'assistant' && item.web_research).length;
    const executiveRuns = messageRows.filter((item) => item.role === 'assistant').length;

    const recentActivity = messageRows
      .filter((item) => item.role === 'assistant')
      .slice(0, 8)
      .map((item) => ({
        id: item.id,
        summary: text(item.content, 220),
        webResearch: Boolean(item.web_research),
        createdAt: item.created_at,
      }));

    return NextResponse.json({
      businessName: membership.tenant.business_name,
      plan: membership.tenant.plan,
      telemetry: {
        activeProjects,
        openTasks,
        completedTasks,
        companyBrainItems: (knowledge.data || []).length,
        readyFiles: (files.data || []).filter((item) => item.status === 'ready').length,
        executiveRuns,
        webResearchRuns,
      },
      taskPressure: taskRows.slice(0, 12),
      projectPulse: projectRows.slice(0, 10),
      recentActivity,
      system: {
        companyBrain: true,
        boardroom: true,
        execution: true,
        ceoBrief: true,
        approvalPolicy: true,
        voiceRoom: true,
        liveWebResearch: true,
        growthCommand: true,
        benchmarkLab: true,
      },
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Mission Control error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Mission Control is temporarily unavailable.' }, { status: 500, headers: NO_STORE });
  }
}
