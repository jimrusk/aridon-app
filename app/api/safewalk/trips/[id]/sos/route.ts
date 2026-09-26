// POST /api/safewalk/trips/[id]/sos — immediate SOS; texts ALL guardians at once.
import {
  errJson,
  getDb,
  getTripWithSecret,
  json,
  logEvent,
  notifyGuardians,
  shareUrlFor,
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
    } | null;

    const db = getDb();
    const trip = await getTripWithSecret(db, params.id, body?.tripSecret);

    const now = new Date().toISOString();
    const hasLoc = validLat(body?.lat) && validLng(body?.lng);
    const update: Record<string, unknown> = { status: 'sos', sos_at: now };
    if (hasLoc) {
      update.last_lat = body!.lat;
      update.last_lng = body!.lng;
      update.last_loc_at = now;
    }
    const { error } = await db.from('safewalk_trips').update(update).eq('id', trip.id);
    if (error) throw new Error('database error');

    await logEvent(db, trip.id, 'sos', hasLoc ? { lat: body!.lat, lng: body!.lng } : {});
    const shareUrl = shareUrlFor(request, trip.guardian_token);
    await notifyGuardians(trip, `SOS from ${trip.user_name}! Live location: ${shareUrl}`);

    return json({ ok: true });
  } catch (e) {
    return errJson(e);
  }
}
