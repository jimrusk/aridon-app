// POST /api/safewalk/trips — create a trip and text the guardians.
import {
  ApiError,
  errJson,
  getDb,
  json,
  logEvent,
  notifyGuardians,
  randomToken,
  shareUrlFor,
  type Guardian,
} from '@/lib/safewalk';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      userName?: unknown;
      guardians?: unknown;
      durationMin?: unknown;
    } | null;

    const userName = typeof body?.userName === 'string' ? body.userName.trim() : '';
    if (!userName) throw new ApiError(400, 'userName is required');

    const rawGuardians = Array.isArray(body?.guardians) ? body!.guardians : [];
    if (rawGuardians.length < 1 || rawGuardians.length > 10) {
      throw new ApiError(400, 'guardians must contain 1-10 entries');
    }
    const guardians: Guardian[] = rawGuardians.map((g: unknown) => {
      const name = typeof (g as Guardian)?.name === 'string' ? (g as Guardian).name.trim() : '';
      const phone = typeof (g as Guardian)?.phone === 'string' ? (g as Guardian).phone.trim() : '';
      if (!name || !phone) throw new ApiError(400, 'each guardian needs a name and phone');
      return { name, phone };
    });

    const durationMin = body?.durationMin;
    if (!Number.isInteger(durationMin) || (durationMin as number) < 5 || (durationMin as number) > 720) {
      throw new ApiError(400, 'durationMin must be an integer between 5 and 720');
    }

    const db = getDb();
    const tripSecret = randomToken(32);
    const guardianToken = randomToken(16);
    const checkInAt = new Date(Date.now() + (durationMin as number) * 60_000).toISOString();

    const { data: trip, error } = await db
      .from('safewalk_trips')
      .insert({
        user_name: userName,
        guardians,
        guardian_token: guardianToken,
        trip_secret: tripSecret,
        status: 'active',
        check_in_at: checkInAt,
      })
      .select('id')
      .single();
    if (error || !trip) throw new ApiError(503, 'could not create trip');

    await logEvent(db, trip.id, 'created', { guardianCount: guardians.length, durationMin });

    const shareUrl = shareUrlFor(request, guardianToken);
    const { sent, total } = await notifyGuardians(
      { guardians },
      `SafeWalk: ${userName} started a trip: ${shareUrl}`,
    );

    return json({
      tripId: trip.id,
      tripSecret,
      guardianToken,
      shareUrl,
      checkInAt,
      smsSent: sent === total && total > 0,
    });
  } catch (e) {
    return errJson(e);
  }
}
