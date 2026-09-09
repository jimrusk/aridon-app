import 'server-only';

import { getServerClient } from './supabase';
import { runBrowserExploration } from './browserWorker';

function objectValue(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : {};
}

function sourceUrls(result: Record<string, any>) {
  if (!Array.isArray(result.sources)) return [];
  return result.sources
    .map((source: any) => typeof source?.url === 'string' ? source.url.trim() : '')
    .filter(Boolean)
    .slice(0, 10);
}

export async function runDueBrowserWorker() {
  const db = getServerClient();
  const { data, error } = await db
    .from('customer_cloud_workers')
    .select('*')
    .in('mode', ['browser', 'mixed'])
    .in('status', ['queued', 'running', 'waiting_approval', 'completed'])
    .order('updated_at', { ascending: false })
    .limit(12);
  if (error) throw error;

  const worker = (data || []).find((row) => {
    const result = objectValue(row.result);
    return Number(result.browserCycle || -1) !== Number(row.cycle_count || 0);
  });
  if (!worker) return { processed: false, reason: 'No browser worker needs exploration.' };

  const currentResult = objectValue(worker.result);
  const currentCheckpoint = objectValue(worker.checkpoint);
  const exploration = await runBrowserExploration({
    objective: worker.objective,
    candidateUrls: sourceUrls(currentResult),
    maxSteps: 2,
  });

  if (!exploration.configured) {
    return { processed: false, workerId: worker.id, reason: 'Browserbase credentials are not configured.' };
  }

  const now = new Date().toISOString();
  const browserRecord = {
    ...exploration,
    exploredAt: now,
    workerCycle: Number(worker.cycle_count || 0),
  };
  const mergedResult = {
    ...currentResult,
    browser: browserRecord,
    browserCycle: Number(worker.cycle_count || 0),
    findings: [
      ...(Array.isArray(currentResult.findings) ? currentResult.findings : []),
      ...exploration.findings,
    ].slice(0, 40),
  };
  const mergedCheckpoint = {
    ...currentCheckpoint,
    browser: browserRecord,
  };

  const { data: updated, error: updateError } = await db
    .from('customer_cloud_workers')
    .update({
      result: mergedResult,
      checkpoint: mergedCheckpoint,
      updated_at: now,
    })
    .eq('id', worker.id)
    .eq('tenant_id', worker.tenant_id)
    .select('*')
    .single();
  if (updateError) throw updateError;

  const message = exploration.ran
    ? `Eva used the live cloud browser on ${exploration.visited.length} page${exploration.visited.length === 1 ? '' : 's'} and saved the page state to the worker checkpoint.`
    : exploration.error || 'Cloud browser exploration did not reach a page.';
  const { error: eventError } = await db.from('customer_cloud_worker_events').insert({
    tenant_id: worker.tenant_id,
    worker_id: worker.id,
    event_type: exploration.error ? 'browser_warning' : 'browser_exploration',
    message,
    payload: browserRecord,
  });
  if (eventError) console.error('Browser worker event error', eventError);

  return { processed: true, worker: updated, exploration };
}
