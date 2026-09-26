// POST /api/safewalk/trips/[id]/location — record a location ping.
import {
  ApiError,
  errJson,
  getDb,
  getTripWithSecret,
  json,
  validLat,
  validLng,
} from '@/lib/safewalk';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = (await request.json().catch(() => null)) as {
      tripSecret?: unknown;
      lat?: unknown;
      lng?: unknown;
      accuracy?: unknown;
    } | null;

    if (!body) throw new ApiError(400, 'invalid request body');
    const db = getDb();
    const trip = await getTripWithSecret(db, params.id, body.tripSecret);

    const lat = body.lat;
    const lng = body.lng;
    if (!validLat(lat) || !validLng(lng)) {
      throw new ApiError(400, 'lat and lng must be valid coordinates');
    }
    const accuracy =
      typeof body.accuracy === 'number' && Number.isFinite(body.accuracy)
        ? body.accuracy
        : null;

    if (trip.status === 'arrived') {
      throw new ApiError(409, 'trip has ended');
    }

    const now = new Date().toISOString();
    const { error: updError } = await db
      .from('safewalk_trips')
      .update({ last_lat: lat, last_lng: lng, last_loc_at: now })
      .eq('id', trip.id);
    if (updError) throw new ApiError(503, 'database error');

    const { error: locError } = await db.from('safewalk_locations').insert({
      trip_id: trip.id,
      lat,
      lng,
      accuracy,
    });
    if (locError) console.error('[safewalk] location insert failed', locError.message);

    return json({ ok: true });
  } catch (e) {
    return errJson(e);
  }
}
