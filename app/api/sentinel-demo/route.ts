import { NextResponse } from 'next/server';
import { analyzeSentinel, SentinelInput } from '@/lib/sentinel-grid';
import {
  SentinelAuditLog,
  SentinelAuditEntry,
  sentinelAuditLog,
} from '@/lib/sentinelAudit';
import {
  SENTINEL_PENTEST_SCENARIOS,
  SENTINEL_PENTEST_VERSION,
  runSentinelPentest,
} from '@/lib/sentinelPentest';

export const dynamic = 'force-dynamic';

const NO_STORE = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

// Run one input through the real decision engine and write the decision to
// the tamper-evident audit log, the same way a production deployment would.
function assessAndRecord(input: SentinelInput, label: string, hostile: boolean | null) {
  const assessment = analyzeSentinel(input);
  const entry = sentinelAuditLog.append({
    tenantId: 'sentinel-demo',
    actor: 'demo-visitor',
    eventType: 'decision',
    summary: `${label}: disposition=${assessment.disposition}, gate=${assessment.actionGate.mode}, score=${assessment.score}`,
    details: {
      label,
      hostile,
      score: assessment.score,
      disposition: assessment.disposition,
      actionGate: assessment.actionGate,
      escalationDetected: assessment.trajectory.escalationDetected,
      signalCategories: assessment.signals.map((s) => s.category),
      prompt: input.prompt.slice(0, 500),
      requestedActions: input.requestedActions ?? [],
    },
  });
  return { assessment, auditSeq: entry.seq, auditHash: entry.hash };
}

export async function GET() {
  return json({
    version: SENTINEL_PENTEST_VERSION,
    entries: sentinelAuditLog.list(),
    export: sentinelAuditLog.exportJson(),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const action = body?.action;

  if (action === 'manifest') {
    return json({
      version: SENTINEL_PENTEST_VERSION,
      scenarios: SENTINEL_PENTEST_SCENARIOS.map((s) => ({
        id: s.id,
        title: s.title,
        category: s.category,
        hostile: s.hostile,
        rationale: s.rationale,
        prompt: s.input.prompt,
        requestedActions: s.input.requestedActions ?? [],
        history: s.input.history ?? [],
      })),
    });
  }

  if (action === 'scan') {
    // Full 12-scenario sweep through the real engine. The harness writes one
    // pentest_run entry to the audit log summarizing the whole sweep.
    return json(runSentinelPentest());
  }

  if (action === 'run') {
    const scenario = SENTINEL_PENTEST_SCENARIOS.find((s) => s.id === body?.scenarioId);
    if (!scenario) return json({ error: 'Unknown scenario.' }, 400);
    const { assessment, auditSeq, auditHash } = assessAndRecord(
      scenario.input,
      `scenario:${scenario.id}`,
      scenario.hostile,
    );
    return json({
      scenario: {
        id: scenario.id,
        title: scenario.title,
        category: scenario.category,
        hostile: scenario.hostile,
        rationale: scenario.rationale,
      },
      assessment,
      auditSeq,
      auditHash,
    });
  }

  if (action === 'custom') {
    const prompt = String(body?.prompt ?? '').slice(0, 2000);
    if (!prompt.trim()) return json({ error: 'Enter a prompt to test.' }, 400);
    const requestedActions = Array.isArray(body?.requestedActions)
      ? body.requestedActions.map((a: unknown) => String(a)).filter(Boolean).slice(0, 10)
      : [];
    const authorizationContext = String(body?.authorizationContext ?? '').slice(0, 500);
    const { assessment, auditSeq, auditHash } = assessAndRecord(
      { prompt, requestedActions, authorizationContext },
      'custom-input',
      null,
    );
    return json({ assessment, auditSeq, auditHash, custom: true });
  }

  if (action === 'approve') {
    const approved = body?.approved === true;
    const label = String(body?.label ?? 'demo action').slice(0, 200);
    const entry = sentinelAuditLog.append({
      tenantId: 'sentinel-demo',
      actor: 'demo-visitor',
      eventType: 'approval',
      summary: `Human ${approved ? 'APPROVED' : 'DENIED'} the gated action: ${label}`,
      details: { approved, label },
    });
    return json({ ok: true, approved, auditSeq: entry.seq, auditHash: entry.hash });
  }

  if (action === 'verify') {
    const { entry, verification } = sentinelAuditLog.recordVerification(
      'sentinel-demo',
      'demo-visitor',
    );
    return json({ verification, auditSeq: entry.seq });
  }

  if (action === 'tamper') {
    // Contained demonstration on a throwaway log: tamper with one entry on
    // purpose and show verify() catching it. The live session log is never
    // touched.
    const demo = new SentinelAuditLog();
    demo.append({
      tenantId: 'tamper-demo',
      actor: 'demo',
      eventType: 'decision',
      summary: 'Agent action allowed: read status page',
    });
    demo.append({
      tenantId: 'tamper-demo',
      actor: 'demo',
      eventType: 'decision',
      summary: 'Agent action blocked: exfiltrate customer data',
    });
    demo.append({
      tenantId: 'tamper-demo',
      actor: 'demo',
      eventType: 'approval',
      summary: 'Human approved: restart staging service',
    });
    const entries = demo.list() as SentinelAuditEntry[];
    const originalSummary = entries[1].summary;
    entries[1].summary = 'Agent action allowed: exfiltrate customer data';
    const verification = demo.verify();
    return json({
      tamperedSeq: 2,
      originalSummary,
      alteredSummary: entries[1].summary,
      verification,
    });
  }

  return json({ error: 'Unknown action.' }, 400);
}
