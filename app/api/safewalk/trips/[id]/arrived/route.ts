// POST /api/safewalk/trips/[id]/arrived — user checked in safe; notify guardians.
import {
  errJson,
  getDb,
  getTripWithSecret,
  json,
  logEvent,
  notifyGuardians,
} from '@/lib/safewalk';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = (await request.json().catch(() => null)) as { tripSecret?: unknown } | null;

    const db = getDb();
    const trip = await getTripWithSecret(db, params.id, body?.tripSecret);

    if (trip.status === 'arrived') return json({ ok: true });

    const now = new Date().toISOString();
    const { error } = await db
      .from('safewalk_trips')
      .update({ status: 'arrived', ended_at: now })
      .eq('id', trip.id);
    if (error) throw new Error('database error');

    await logEvent(db, trip.id, 'arrived', {});
    await notifyGuardians(trip, `${trip.user_name} arrived safely ✓`);

    return json({ ok: true });
  } catch (e) {
    return errJson(e);
  }
}
