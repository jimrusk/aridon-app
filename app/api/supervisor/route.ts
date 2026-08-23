import { NextRequest, NextResponse } from 'next/server';
import {
  buildAgentPlan,
  judgeSpecialistResults,
  retrySpecialist,
  runSpecialist,
  synthesizeAgentRun,
  type SpecialistResult,
} from '../../../lib/agentSupervisor';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    const objective = text(body?.objective, 3_000);
    const context = text(body?.context, 28_000);
    if (!objective) {
      return NextResponse.json({ error: 'An objective is required.' }, { status: 400, headers: NO_STORE });
    }

    const planned = await buildAgentPlan(objective, context);
    const plan = { ...planned.plan, steps: planned.plan.steps.slice(0, 4) };
    const results: SpecialistResult[] = [];
    let previousOutputs = '';

    for (const step of plan.steps) {
      const result = await runSpecialist(step, objective, context, previousOutputs);
      results.push(result);
      previousOutputs = results
        .map((item) => `${item.step.specialist}: ${item.output}`)
        .join('\n\n')
        .slice(0, 12_000);
    }

    const judged = await judgeSpecialistResults(objective, plan.successCriteria, results);
    for (let index = 0; index < results.length; index += 1) {
      const result = results[index];
      const review = judged.reviews.get(result.step.order);
      result.qualityScore = review?.score ?? 75;
      result.qualityNotes = review?.notes ?? 'No additional quality note.';

      if ((review?.score ?? 75) < 70) {
        const retried = await retrySpecialist(result, objective, context, review?.notes || 'Make the result more complete and decision-ready.');
        retried.qualityScore = Math.max(review?.score ?? 0, 70);
        retried.qualityNotes = `Retried after quality review: ${review?.notes || 'quality threshold not met'}`;
        results[index] = retried;
      }
    }

    const final = await synthesizeAgentRun(objective, plan.successCriteria, results, context);
    const approvalQueue = plan.steps
      .filter((step) => step.approvalRequired)
      .map((step) => ({
        order: step.order,
        specialist: step.specialist,
        task: step.task,
        riskLevel: step.riskLevel,
        status: 'waiting_for_human_approval',
      }));

    return NextResponse.json(
      {
        objective,
        plan,
        results,
        final: final.text,
        approvalQueue,
        routing: {
          planner: planned.routing,
          qualityJudge: judged.routing,
          synthesizer: final.routing,
        },
        status: approvalQueue.length ? 'ready_for_approval' : 'complete',
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error('Aridon supervisor route error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'The supervisor workflow is temporarily unavailable.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
