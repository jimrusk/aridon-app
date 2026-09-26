// GET /api/safewalk/trips/[id]/status?token=TOKEN
// TOKEN is the guardianToken or the tripSecret (both read-only OK).
// Never exposes the tripSecret.
import {
  ApiError,
  errJson,
  getDb,
  json,
  secretsEqual,
  type TripRow,
} from '@/lib/safewalk';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const token = new URL(request.url).searchParams.get('token') ?? '';
    const db = getDb();

    const { data, error } = await db
      .from('safewalk_trips')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();
    if (error) throw new ApiError(503, 'database error');
    if (!data) return json({ error: 'trip not found' }, 404);
    const trip = data as TripRow;

    if (!secretsEqual(token, trip.guardian_token) && !secretsEqual(token, trip.trip_secret)) {
      return json({ error: 'invalid token' }, 403);
    }

    const { data: events } = await db
      .from('safewalk_events')
      .select('type, detail, created_at')
      .eq('trip_id', trip.id)
      .order('created_at', { ascending: true });

    const guardians: { name: string }[] = (
      Array.isArray(trip.guardians) ? (trip.guardians as { name: string; phone: string }[]) : []
    ).map((g) => ({ name: g.name }));

    return json({
      status: trip.status,
      userName: trip.user_name,
      checkInAt: trip.check_in_at,
      lastLat: trip.last_lat,
      lastLng: trip.last_lng,
      lastLocAt: trip.last_loc_at,
      sosAt: trip.sos_at,
      guardians,
      events: (events ?? []).map((e: { type: string; detail: unknown; created_at: string }) => ({
        type: e.type,
        detail: e.detail ?? {},
        createdAt: e.created_at,
      })),
    });
  } catch (e) {
    return errJson(e);
  }
}
