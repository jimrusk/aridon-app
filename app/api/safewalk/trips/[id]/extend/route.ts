// POST /api/safewalk/trips/[id]/extend — push the check-in deadline out.
import {
  ApiError,
  errJson,
  getDb,
  getTripWithSecret,
  json,
  logEvent,
} from '@/lib/safewalk';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = (await request.json().catch(() => null)) as {
      tripSecret?: unknown;
      addMin?: unknown;
    } | null;

    const db = getDb();
    const trip = await getTripWithSecret(db, params.id, body?.tripSecret);

    const addMin = body?.addMin;
    if (!Number.isInteger(addMin) || (addMin as number) < 1 || (addMin as number) > 240) {
      throw new ApiError(400, 'addMin must be an integer between 1 and 240');
    }
    if (trip.status !== 'active') {
      throw new ApiError(409, 'only an active trip can be extended');
    }

    const checkInAt = new Date(new Date(trip.check_in_at).getTime() + (addMin as number) * 60_000).toISOString();
    const { error } = await db
      .from('safewalk_trips')
      .update({ check_in_at: checkInAt })
      .eq('id', trip.id);
    if (error) throw new ApiError(503, 'database error');

    await logEvent(db, trip.id, 'extended', { addMin });
    return json({ checkInAt });
  } catch (e) {
    return errJson(e);
  }
}
