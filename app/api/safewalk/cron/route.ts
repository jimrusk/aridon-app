// /api/safewalk/cron — Vercel cron, every minute.
// Escalates active trips past their check-in time and texts the guardians.
// GET and POST both allowed. If SAFEWALK_CRON_SECRET is set, ?secret= must match.
import {
  errJson,
  getDb,
  json,
  logEvent,
  notifyGuardians,
  shareUrlFor,
  type TripRow,
} from '@/lib/safewalk';

export const dynamic = 'force-dynamic';

async function runCron(request: Request) {
  try {
    const required = process.env.SAFEWALK_CRON_SECRET?.trim();
    if (required) {
      const given = new URL(request.url).searchParams.get('secret') ?? '';
      if (given !== required) return json({ error: 'unauthorized' }, 401);
    }

    const db = getDb();
    const nowIso = new Date().toISOString();
    const { data, error } = await db
      .from('safewalk_trips')
      .select('*')
      .eq('status', 'active')
      .lt('check_in_at', nowIso);
    if (error) throw new Error('database error');

    const overdue = (data ?? []) as TripRow[];
    let escalated = 0;
    for (const trip of overdue) {
      const now = new Date().toISOString();
      const { error: updError } = await db
        .from('safewalk_trips')
        .update({ status: 'escalated', escalated_at: now })
        .eq('id', trip.id)
        .eq('status', 'active'); // only win the race if still active
      if (updError) {
        console.error('[safewalk] escalation update failed', updError.message);
        continue;
      }
      await logEvent(db, trip.id, 'escalation', { missedCheckInAt: trip.check_in_at });
      const shareUrl = shareUrlFor(request, trip.guardian_token);
      await notifyGuardians(
        trip,
        `MISSED CHECK-IN: ${trip.user_name} did not check in. Last location: ${shareUrl}`,
      );
      escalated += 1;
    }

    return json({ ok: true, checked: overdue.length, escalated });
  } catch (e) {
    return errJson(e);
  }
}

export async function GET(request: Request) {
  return runCron(request);
}

export async function POST(request: Request) {
  return runCron(request);
}
